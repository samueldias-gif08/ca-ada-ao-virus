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
public sealed class EducationCdp : IDisposable {
 readonly ClientWebSocket socket=new ClientWebSocket(); int sequence;
 readonly JavaScriptSerializer json=new JavaScriptSerializer { MaxJsonLength=50000000 };
 public EducationCdp(string uri) { socket.ConnectAsync(new Uri(uri),CancellationToken.None).GetAwaiter().GetResult(); }
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
$browserArgs=@('--headless','--no-first-run','--allow-file-access-from-files','--autoplay-policy=no-user-gesture-required','--use-angle=swiftshader','--enable-unsafe-swiftshader','--remote-debugging-port=9338',('--user-data-dir='+$workspace+'/.browser-check/education-cdp-profile'),'--window-size=1440,900','about:blank')
$quotedArgs=$browserArgs | ForEach-Object { '"'+$_+'"' }
$browser=Start-Process -FilePath 'C:/Program Files/Google/Chrome/Application/chrome.exe' -ArgumentList $quotedArgs -WindowStyle Hidden -PassThru -RedirectStandardError (Join-Path $PSScriptRoot 'education-browser-error.txt')
$client=$null
try {
 $targets=$null
 for($attempt=0;$attempt -lt 80;$attempt++){try{$targets=Invoke-RestMethod 'http://127.0.0.1:9338/json';break}catch{Start-Sleep -Milliseconds 200}}
 if(!$targets){throw 'Chrome debugging endpoint unavailable'}
 $target=$targets | Where-Object type -eq 'page' | Select-Object -First 1
 $client=[EducationCdp]::new($target.webSocketDebuggerUrl)
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
 $suites=[ordered]@{}
 foreach($page in @('education','networkCollapse','mouseControls')){
  Cdp 'Page.navigate' @{url=$base+$page+'.html'} | Out-Null
  Wait-For ('location.pathname.endsWith("/'+$page+'.html")&&document.body&&document.body.dataset.tests')
  $report=Js 'JSON.parse(document.body.dataset.tests)'
  $suites[$page]=$report
  [IO.File]::WriteAllText((Join-Path $PSScriptRoot ($page+'-quiz-dom.html')),(Js 'document.documentElement.outerHTML'))
 }
 $checks=[Collections.Generic.List[object]]::new()
 function Check-Quiz($name,$passed){$checks.Add([pscustomobject]@{test=$name;passed=[bool]$passed})}
 function Navigate-Preview($query=''){
  Cdp 'Page.navigate' @{url=$base+'educationPreview.html'+$query} | Out-Null
  Wait-For 'location.pathname.endsWith("/educationPreview.html")&&document.body&&document.body.dataset.ready==="true"'
  Js 'window.quizWindow=document.querySelector("iframe").contentWindow;window.quizGame=quizWindow.Boitata;true' | Out-Null
 }
 function Click-Quiz($selector){$rect=Js ('(()=>{const r=quizGame.UI.$("overlay").querySelector('+($selector | ConvertTo-Json -Compress)+').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');Mouse 'mousePressed' $rect.x $rect.y;Mouse 'mouseReleased' $rect.x $rect.y}
 Navigate-Preview
 Screenshot 'quiz-desktop.png'
 Check-Quiz 'Desktop mostra quatro alternativas sem interface de verdadeiro ou falso' (Js 'quizGame.S.phase==="quiz"&&quizGame.UI.$("overlay").querySelectorAll("[data-alternative]").length===4&&!/Verdadeiro|Falso/.test(quizGame.UI.$("overlay").textContent)')
 Check-Quiz 'Botões usam Marcellus e alvo confortável' (Js '(()=>{const b=quizGame.UI.$("overlay").querySelector("[data-alternative]");return quizWindow.getComputedStyle(b).fontFamily.includes("Marcellus")&&b.getBoundingClientRect().height>=44})()')
 Click-Quiz '[data-alternative="0"]'
 Check-Quiz 'Clique real em A conclui com 500 pontos' (Js 'quizGame.S.phase==="won"&&quizGame.S.score===500&&quizGame.S.save.completed.includes(4)')
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=430;height=932;deviceScaleFactor=1;mobile=$true} | Out-Null
 Cdp 'Emulation.setTouchEmulationEnabled' @{enabled=$true;maxTouchPoints=1} | Out-Null
 Navigate-Preview '?theme=M%C3%A1scara%20de%20sub-rede'
 Screenshot 'quiz-mobile.png'
 Check-Quiz 'Enunciados longos e alternativas cabem na largura do celular' (Js '(()=>{const panel=quizGame.UI.$("overlay").querySelector(".quiz-panel"),r=panel.getBoundingClientRect();return r.x>=0&&r.right<=innerWidth&&panel.scrollWidth<=panel.clientWidth+1&&[...panel.querySelectorAll("button")].every(b=>b.getBoundingClientRect().height>=44)})()')
 $touch=Js '(()=>{const r=quizGame.UI.$("overlay").querySelector("[data-alternative=\"1\"]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()'
 $before=Js '({lives:quizGame.S.lives,total:String(quizGame.S.total)})'
 Cdp 'Input.dispatchTouchEvent' @{type='touchStart';touchPoints=@(@{x=$touch.x;y=$touch.y})} | Out-Null
 Cdp 'Input.dispatchTouchEvent' @{type='touchEnd';touchPoints=@()} | Out-Null
 Check-Quiz 'Toque em B erra sem descontar vidas' (Js ('quizGame.S.phase==="wrong"&&quizGame.S.lives==='+$before.lives+'&&quizGame.S.total===BigInt("'+$before.total+'")*2n'))
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=844;height=390;deviceScaleFactor=1;mobile=$true} | Out-Null
 Navigate-Preview '?theme=M%C3%A1scara%20de%20sub-rede'
 Js 'quizGame.UI.$("overlay").querySelector("[data-alternative=\"3\"]").scrollIntoView({block:"nearest"});true' | Out-Null
 Screenshot 'quiz-landscape.png'
 Check-Quiz 'Tela baixa permite alcançar D por rolagem interna' (Js '(()=>{const b=quizGame.UI.$("overlay").querySelector("[data-alternative=\"3\"]").getBoundingClientRect(),o=quizGame.UI.$("overlay").getBoundingClientRect();return b.y>=o.y&&b.bottom<=o.bottom+1&&quizWindow.scrollY===0})()')
 Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=900;deviceScaleFactor=1;mobile=$false} | Out-Null
 Cdp 'Emulation.setTouchEmulationEnabled' @{enabled=$false} | Out-Null
 Navigate-Preview '?final=1'
 Screenshot 'quiz-final.png'
 Check-Quiz 'Fase final reutiliza as quatro alternativas e preserva o título' (Js 'quizGame.S.question.theme==="DNS"&&quizGame.UI.$("overlay").querySelectorAll("[data-alternative]").length===4&&quizGame.UI.$("overlay").textContent.includes("REDE RESTAURADA COM SUCESSO!")')
 Click-Quiz '[data-alternative="3"]'
 Check-Quiz 'D na fase final exige reinício sem concluir a campanha' (Js 'quizGame.S.phase==="wrong"&&!quizGame.S.save.completed.includes(10)&&quizGame.UI.$("overlay").querySelectorAll(".panel p").length===0')
 Click-Quiz '.panel .actions button'
 Check-Quiz 'Reiniciar mantém a fase final e a infecção original' (Js 'quizGame.S.phase==="playing"&&quizGame.S.level.id===10&&!quizGame.S.collapse.charged')
 Js 'quizGame.S.snake=quizGame.S.oldSnake=[{x:21,y:4}];quizGame.NetworkCollapse.update(.016);quizGame.NetworkCollapse.update(4);true' | Out-Null
 Click-Quiz '[data-alternative="0"]'
 Check-Quiz 'A após repetir conclui a campanha pela vitória existente' (Js 'quizGame.S.phase==="won"&&quizGame.S.save.completed.includes(10)&&quizGame.Store.errors(10)===0')
 $results=[ordered]@{suites=$suites;browserTests=$checks}
 [IO.File]::WriteAllText((Join-Path $PSScriptRoot 'education-browser-results.json'),($results | ConvertTo-Json -Depth 20))
 $results | ConvertTo-Json -Depth 20
} finally {if($client){try{$client.Call('Browser.close','{}') | Out-Null}catch{};$client.Dispose()}}