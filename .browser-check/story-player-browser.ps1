$ErrorActionPreference='Stop'
$workspace=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Add-Type -ReferencedAssemblies System.Web.Extensions -TypeDefinition @'
using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Collections.Generic;
public sealed class StoryPlayerCdp : IDisposable {
 readonly ClientWebSocket socket=new ClientWebSocket(); int sequence;
 readonly JavaScriptSerializer json=new JavaScriptSerializer { MaxJsonLength=50000000 };
 public StoryPlayerCdp(string uri) { socket.ConnectAsync(new Uri(uri),CancellationToken.None).GetAwaiter().GetResult(); }
 public string Call(string method,string parameters) {
  int id=++sequence; var payload=Encoding.UTF8.GetBytes("{\"id\":"+id+",\"method\":\""+method+"\",\"params\":"+parameters+"}");
  using(var timeout=new CancellationTokenSource(45000)) {
   socket.SendAsync(new ArraySegment<byte>(payload),WebSocketMessageType.Text,true,timeout.Token).GetAwaiter().GetResult();
   var bytes=new byte[65536];
   while(true)using(var stream=new MemoryStream()) {
    WebSocketReceiveResult part;
    do { part=socket.ReceiveAsync(new ArraySegment<byte>(bytes),timeout.Token).GetAwaiter().GetResult();if(part.MessageType==WebSocketMessageType.Close)throw new Exception("Browser closed");stream.Write(bytes,0,part.Count); }while(!part.EndOfMessage);
    string response=Encoding.UTF8.GetString(stream.ToArray());var parsed=json.Deserialize<Dictionary<string,object>>(response);
    if(parsed.ContainsKey("id")&&Convert.ToInt32(parsed["id"])==id)return response;
   }
  }
 }
 public void Dispose(){socket.Dispose();}
}
'@
$browserArgs=@('--headless','--no-first-run','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=9337',('--user-data-dir='+$workspace+'/.browser-check/story-player-cdp-profile'),'--window-size=1440,900','about:blank')
$quotedArgs=$browserArgs | ForEach-Object { '"'+$_+'"' }
$browser=Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $quotedArgs -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $PSScriptRoot 'story-player-browser-error.txt')
$client=$null
try {
 $targets=$null
 for($attempt=0;$attempt -lt 80;$attempt++){try{$targets=Invoke-RestMethod 'http://127.0.0.1:9337/json';break}catch{Start-Sleep -Milliseconds 200}}
 if(!$targets){throw 'Chrome debugging endpoint unavailable'}
 $target=$targets | Where-Object type -eq 'page' | Select-Object -First 1
 $client=[StoryPlayerCdp]::new($target.webSocketDebuggerUrl)
 function Cdp($method,$parameters=@{}) {
  $response=$client.Call($method,($parameters | ConvertTo-Json -Depth 20 -Compress)) | ConvertFrom-Json
  if($response.error){throw ($response.error | ConvertTo-Json -Compress)}
  return $response.result
 }
 function Js($expression){$response=Cdp 'Runtime.evaluate' @{expression=$expression;returnByValue=$true;awaitPromise=$true;userGesture=$true};if($response.exceptionDetails){throw ($response.exceptionDetails | ConvertTo-Json -Depth 8 -Compress)};return $response.result.value}
 function Wait-For($expression){for($attempt=0;$attempt -lt 150;$attempt++){if(Js $expression){return};Start-Sleep -Milliseconds 200};throw ('Timed out: '+$expression)}
 function Mouse($type,$x,$y){$params=@{type=$type;x=$x;y=$y};if($type -ne 'mouseMoved'){$params.button='left';$params.clickCount=1};Cdp 'Input.dispatchMouseEvent' $params | Out-Null}
 function Click-Element($selector){$rect=Js ('(()=>{const r=document.querySelector("iframe").contentWindow.Boitata.Story.root.querySelector('+($selector | ConvertTo-Json -Compress)+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');Mouse 'mousePressed' $rect.x $rect.y;Mouse 'mouseReleased' $rect.x $rect.y}
 function Screenshot($name){$capture=Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false};[IO.File]::WriteAllBytes((Join-Path $PSScriptRoot $name),[Convert]::FromBase64String($capture.data))}
 $base='file:///'+$workspace.Replace('\','/')+'/boitata/tests/'
 Cdp 'Page.enable' | Out-Null
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=900;deviceScaleFactor=1;mobile=$false} | Out-Null
 Cdp 'Page.navigate' @{url=$base+'story.html'} | Out-Null
 Wait-For 'document.body&&document.body.dataset.complete==="true"'
 $suite=Js 'JSON.parse(document.body.dataset.tests)'
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'story-player-suite.json'),($suite | ConvertTo-Json -Depth 20))
 $dom=Js 'document.documentElement.outerHTML'
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'story-test-dom.html'),$dom)
 Cdp 'Page.navigate' @{url=$base+'storyPlayerPreview.html?audio=1'} | Out-Null
 Wait-For 'document.body&&document.body.dataset.ready==="true"'
 $get='document.querySelector("iframe").contentWindow.Boitata.Story'
 Js ('window.storyPlayer='+$get+';storyPlayer.setPlaybackRate(1.4);storyPlayer.setSpeedMenu(true);true') | Out-Null
 Screenshot 'story-player-desktop.png'
 $results=[Collections.Generic.List[object]]::new()
 function Check-Browser($name,$passed){$results.Add([pscustomobject]@{test=$name;passed=[bool]$passed})}
 Check-Browser 'Suite completa sem falhas' ($suite.failed.Count -eq 0 -and $suite.total -gt 70)
 Js 'storyPlayer.setSpeedMenu(false);storyPlayer.pause();true' | Out-Null
 $bar=Js '(()=>{const r=storyPlayer.seekInput.getBoundingClientRect();return {x:r.x,y:r.y+r.height/2,width:r.width}})()'
 Mouse 'mousePressed' ($bar.x+$bar.width*.5) $bar.y;Mouse 'mouseReleased' ($bar.x+$bar.width*.5) $bar.y
 Check-Browser 'Clique real na barra busca 50% da timeline' (Js 'Math.abs(storyPlayer.time-storyPlayer.duration*.5)<.05&&storyPlayer.paused')
 Mouse 'mousePressed' ($bar.x+$bar.width*.8) $bar.y;Mouse 'mouseMoved' ($bar.x+$bar.width*.4) $bar.y;Mouse 'mouseReleased' ($bar.x+$bar.width*.4) $bar.y
 Check-Browser 'Arrasto real com captura do ponteiro preserva pausa' (Js 'Math.abs(storyPlayer.time-storyPlayer.duration*.4)<.05&&storyPlayer.paused&&!storyPlayer.scrubbing')
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=430;height=932;deviceScaleFactor=1;mobile=$true} | Out-Null
 Cdp 'Emulation.setTouchEmulationEnabled' @{enabled=$true;maxTouchPoints=1} | Out-Null
 Js 'storyPlayer.resize();storyPlayer.seekTo(72);storyPlayer.setSpeedMenu(true);true' | Out-Null
 Screenshot 'story-player-mobile.png'
 Check-Browser 'Controles cabem no celular sem esticar o quadro' (Js '(()=>{const w=innerWidth,h=innerHeight;return [...storyPlayer.controls.querySelectorAll(".story-control-row>button,.story-speed-control>button")].filter(b=>!b.hidden).every(b=>{const r=b.getBoundingClientRect();return r.x>=0&&r.right<=w&&r.y>=0&&r.bottom<=h})&&storyPlayer.renderer.viewport.width/storyPlayer.renderer.viewport.height===16/9})()')
 Js 'storyPlayer.setSpeedMenu(false);true' | Out-Null
 $bar=Js '(()=>{const r=storyPlayer.seekInput.getBoundingClientRect();return {x:r.x,y:r.y+r.height/2,width:r.width}})()'
 Cdp 'Input.dispatchTouchEvent' @{type='touchStart';touchPoints=@(@{x=$bar.x+$bar.width*.6;y=$bar.y})} | Out-Null
 Cdp 'Input.dispatchTouchEvent' @{type='touchMove';touchPoints=@(@{x=$bar.x+$bar.width*.3;y=$bar.y})} | Out-Null
 Cdp 'Input.dispatchTouchEvent' @{type='touchEnd';touchPoints=@()} | Out-Null
 Check-Browser 'Arrasto por toque busca o ponto correto e preserva pausa' (Js 'Math.abs(storyPlayer.time-storyPlayer.duration*.3)<.1&&storyPlayer.paused&&!storyPlayer.scrubbing')
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=900;deviceScaleFactor=1;mobile=$false} | Out-Null
 Cdp 'Emulation.setTouchEmulationEnabled' @{enabled=$false} | Out-Null
 Js 'storyPlayer.resize();storyPlayer.seekTo(72);storyPlayer.setPlaybackRate(1.4);storyPlayer.manual=false;window.pump=true;function tick(){if(!window.pump)return;storyPlayer.frame(document.querySelector("iframe").contentWindow.performance.now());requestAnimationFrame(tick)}requestAnimationFrame(tick);true' | Out-Null
 Click-Element '[data-story="pause"]'
 $sync=Js '(async()=>{const clock=()=>storyPlayer.frame(document.querySelector("iframe").contentWindow.performance.now());clock();const start=performance.now(),time=storyPlayer.time;await new Promise(r=>setTimeout(r,1200));clock();return {delta:storyPlayer.time-time,elapsed:(performance.now()-start)/1000,drift:Math.abs(storyPlayer.time-storyPlayer.sound.currentTime),rate:storyPlayer.sound.source?.playbackRate.value,running:storyPlayer.sound.ctx.state}})()'
 Check-Browser 'Reprodução real em 1.4x mantém áudio sincronizado' ($sync.running -eq 'running' -and [Math]::Abs($sync.rate-1.4) -lt .001 -and [Math]::Abs($sync.delta-$sync.elapsed*1.4) -lt .12 -and $sync.drift -lt .12)
 Click-Element '[data-story="speed"]';Click-Element '[data-rate="2"]'
 $sync2=Js '(async()=>{const clock=()=>storyPlayer.frame(document.querySelector("iframe").contentWindow.performance.now());clock();const start=performance.now(),time=storyPlayer.time;await new Promise(r=>setTimeout(r,700));clock();return {delta:storyPlayer.time-time,elapsed:(performance.now()-start)/1000,drift:Math.abs(storyPlayer.time-storyPlayer.sound.currentTime),rate:storyPlayer.sound.source?.playbackRate.value}})()'
 Check-Browser 'Mudança real para 2x aplica velocidade uma única vez' ($sync2.rate -eq 2 -and [Math]::Abs($sync2.delta-$sync2.elapsed*2) -lt .15 -and $sync2.drift -lt .12)
 Click-Element '[data-story="pause"]'
 Check-Browser 'Pausa real congela áudio e imagem' (Js '(async()=>{const time=storyPlayer.time,frame=storyPlayer.state.poses.iara.animationFrame;await new Promise(r=>setTimeout(r,250));return storyPlayer.time===time&&storyPlayer.state.poses.iara.animationFrame===frame&&storyPlayer.sound.source===null})()')
 $fullSupport=Js '!storyPlayer.fullscreenButton.hidden'
 if($fullSupport){
  Click-Element '[data-story="fullscreen"]'
  $fullscreen=Js '(async()=>{await new Promise(r=>setTimeout(r,400));return {active:document.querySelector("iframe").contentDocument.fullscreenElement===storyPlayer.root,error:storyPlayer.fullscreenError,status:storyPlayer.status.textContent,enabled:document.querySelector("iframe").contentDocument.fullscreenEnabled,focus:document.querySelector("iframe").contentDocument.hasFocus(),outer:document.fullscreenElement?.tagName}})()'
  if($fullscreen.active){Check-Browser 'Fullscreen API entra em tela cheia' $true}else{$results.Add([pscustomobject]@{test='Entrada nativa de tela cheia';passed=$null;status='manual';reason=$fullscreen.error});Check-Browser 'Recusa de tela cheia não interrompe o player' (Js 'storyPlayer.active&&storyPlayer.renderer&&!storyPlayer.loading&&storyPlayer.status.textContent.length>0')}
  Screenshot 'story-player-fullscreen.png'
  if(!$fullscreen.active){$fullscreenDiagnostic=Js '(async()=>{await storyPlayer.toggleFullscreen();return {active:document.querySelector("iframe").contentDocument.fullscreenElement===storyPlayer.root,error:storyPlayer.fullscreenError}})()'}
  $entered=Js 'document.querySelector("iframe").contentDocument.fullscreenElement===storyPlayer.root';if($entered){Click-Element '[data-story="fullscreen"]'}
  if($entered){Check-Browser 'Sair de tela cheia preserva os controles' (Js '(async()=>{await new Promise(r=>setTimeout(r,200));return !document.querySelector("iframe").contentDocument.fullscreenElement&&storyPlayer.seekInput.max===String(storyPlayer.duration)})()')}else{$results.Add([pscustomobject]@{test='Saída nativa de tela cheia';passed=$null;status='manual';reason='Entrada recusada pelo navegador headless'})}
 }
 Js 'storyPlayer.seekTo(storyPlayer.duration);true' | Out-Null
 Check-Browser 'Fim oferece repetição sem voltar automaticamente ao menu' (Js 'storyPlayer.ended&&!storyPlayer.endPanel.hidden&&storyPlayer.time===168')
 Click-Element '[data-story="restart"]'
 Check-Browser 'Botão real de repetição reinicia' (Js 'storyPlayer.time<1&&!storyPlayer.ended&&!storyPlayer.paused')
 Click-Element '[data-story="menu"]'
 Check-Browser 'Nenhum erro JavaScript durante interações reais' (Js '!document.body.dataset.error')
 Check-Browser 'Voltar ao menu encerra a sessão' (Js '!storyPlayer.active&&document.querySelector("iframe").contentWindow.Boitata.S.phase==="menu"')
 $report=[ordered]@{suite=$suite;browserTests=$results;audio1_4x=$sync;audio2x=$sync2;fullscreen=$fullscreen;fullscreenDiagnostic=$fullscreenDiagnostic}
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'story-player-browser-results.json'),($report | ConvertTo-Json -Depth 20))
 $report | ConvertTo-Json -Depth 20
} finally {if($client){try{$client.Call('Browser.close','{}') | Out-Null}catch{};$client.Dispose()}}
