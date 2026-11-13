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
public sealed class ArenaBackdropCdp : IDisposable {
 readonly ClientWebSocket socket=new ClientWebSocket(); int sequence;
 readonly JavaScriptSerializer json=new JavaScriptSerializer { MaxJsonLength=50000000 };
 public ArenaBackdropCdp(string uri) { socket.ConnectAsync(new Uri(uri),CancellationToken.None).GetAwaiter().GetResult(); }
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
$browserArgs=@('--headless','--no-first-run','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=9339',('--user-data-dir='+$workspace+'/.browser-check/arena-backdrop-cdp-profile'),'--window-size=1440,900','about:blank')
$quotedArgs=$browserArgs | ForEach-Object { '"'+$_+'"' }
$browser=Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $quotedArgs -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $PSScriptRoot 'arena-backdrop-browser-error.txt')
$client=$null
try {
 $targets=$null
 for($attempt=0;$attempt -lt 80;$attempt++){try{$targets=Invoke-RestMethod 'http://127.0.0.1:9339/json';break}catch{Start-Sleep -Milliseconds 200}}
 if(!$targets){throw 'Chrome debugging endpoint unavailable'}
 $target=$targets | Where-Object type -eq 'page' | Select-Object -First 1
 $client=[ArenaBackdropCdp]::new($target.webSocketDebuggerUrl)
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
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=1600;height=1000;deviceScaleFactor=1;mobile=$false} | Out-Null
 $suites=[ordered]@{}
 foreach($page in @('arenaBackdrop','education','networkCollapse','mouseControls')){
  Cdp 'Page.navigate' @{url=$base+$page+'.html'} | Out-Null
  Wait-For ('location.pathname.endsWith("/'+$page+'.html")&&document.body&&document.body.dataset.tests')
  $suites[$page]=Js 'JSON.parse(document.body.dataset.tests)'
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot ($page+'-backdrop-dom.html')),(Js 'document.documentElement.outerHTML'))
  if($page -eq 'arenaBackdrop'){$performance=Js 'JSON.parse(document.body.dataset.performance||"{}")'}
 }
 foreach($level in @(1,2,3,4,5,8,9,10)){
  Cdp 'Page.navigate' @{url=$base+'arenaBackdropPreview.html?level='+$level} | Out-Null
  Wait-For 'location.pathname.endsWith("/arenaBackdropPreview.html")&&document.body&&document.body.dataset.ready==="true"'
  Screenshot ('arena-backdrop-'+$level+'.png')
  if($level -eq 1){
   Js 'document.querySelector("iframe").contentWindow.Boitata.Forest3D.backdrop.enabled=false;document.querySelector("iframe").contentWindow.Boitata.Forest3D.draw(1500);true' | Out-Null
   Screenshot 'arena-backdrop-before.png'
  }
 }
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=2400;height=900;deviceScaleFactor=1;mobile=$false} | Out-Null
 Cdp 'Page.navigate' @{url=$base+'arenaBackdropPreview.html?level=1'} | Out-Null
 Wait-For 'document.body&&document.body.dataset.ready==="true"'
 Screenshot 'arena-backdrop-ultrawide.png'
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=430;height=932;deviceScaleFactor=1;mobile=$true} | Out-Null
 Cdp 'Page.navigate' @{url=$base+'arenaBackdropPreview.html?level=2'} | Out-Null
 Wait-For 'document.body&&document.body.dataset.ready==="true"'
 Screenshot 'arena-backdrop-mobile.png'
 $results=[ordered]@{suites=$suites;performance=$performance}
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'arena-backdrop-results.json'),($results | ConvertTo-Json -Depth 20))
 $results | ConvertTo-Json -Depth 20
} finally {if($client){try{$client.Call('Browser.close','{}') | Out-Null}catch{};$client.Dispose()}}