window.runChaseTests=function(){
 const B=Boitata,s=B.S,saved={...s},ui=B.UI,audio=B.Audio,key=B.Store.key,update=B.Enemies.update,spawn=B.Enemies.spawn,results=[];
 const check=(test,passed)=>{results.push({test,passed:!!passed});if(!passed)throw Error(test);};
 B.UI={hud(){},lesson(){},ready(){},close(){},lost(){},quiz(){},wrong(){},win(){}};B.Audio={init(){},effect(){}};B.Store.key='boitata-chase-tests';B.Enemies.update=()=>{};B.Enemies.spawn=()=>{};
 const reset=(level=1,character='boitata')=>{s.save=B.Store.defaults();s.save.unlocked=30;s.save.character=character;s.lastQuestions={};B.Game.start(level);B.Game.play();};
 const time=dt=>{s.elapsed+=dt;B.CaptureSystem.update(dt);};
 try{
  for(const character of ['boitata','iara'])for(let level=1;level<=30;level++){
   reset(level,character);const f=s.fugitive;check(character+': alvo acessível no setor '+level,B.Pathfinding.free(f.x,f.y)&&B.Pathfinding.find(s.snake[0],f)!==null);
  }
  reset();check('Fugitivo tem intervalo maior que o do jogador',B.FugitiveVirus.config.speedRatio>1);const start={x:s.fugitive.x,y:s.fugitive.y};time(s.level.stepMs/1000);check('Fugitivo não acompanha a velocidade do jogador',B.Collisions.same(start,s.fugitive));
  s.obstacles=new Set();s.items=[];s.snake=[{x:12,y:9},{x:11,y:9},{x:10,y:9}];Object.assign(s.fugitive,{x:15,y:9,old:{x:15,y:9},moveClock:0});const before=B.VirusAI.distance(s.fugitive,s.snake[0]);time(s.level.stepMs/1000*2.5);check('Fugitivo escolhe fuga afastando-se da cabeça',B.VirusAI.distance(s.fugitive,s.snake[0])>before);
  check('Teletransporte removido',!B.Teleport&&!('used' in s.fugitive));
  reset();s.obstacles=new Set(['11,8','11,9','11,10']);s.snake=[{x:5,y:5}];const path=B.Pathfinding.find({x:9,y:9},{x:14,y:9});check('A* contorna parede',path&&path.length>5&&path.every(p=>!B.Maps.blocked(p.x,p.y)));s.obstacles=new Set();for(const x of [10,12])for(let y=1;y<=16;y++)s.obstacles.add(x+','+y);check('Fugitivo cabe em corredor estreito',B.Pathfinding.free(11,9,.22));check('Predador não cabe no mesmo corredor',!B.Pathfinding.free(11,9,B.PredatorVirus.config.radius));
  for(const [level,seconds]of [[1,45],[5,45],[6,35],[15,35],[16,25],[25,25],[26,20],[30,20]]){reset(level);check('Temporizador do setor '+level,s.chaseTimer.remaining===seconds);}
  reset();const remaining=s.chaseTimer.remaining;s.phase='paused';time(10);check('Pausa congela a perseguição',s.chaseTimer.remaining===remaining);s.phase='playing';B.ChaseTimer.update(remaining-1);check('Predador aguarda o prazo',s.predator.state==='AGUARDANDO');B.ChaseTimer.update(1);check('Predador surge no prazo e em posição válida',s.predator.state==='SURGINDO'&&B.Pathfinding.free(s.predator.x,s.predator.y,B.PredatorVirus.config.radius));
  B.PredatorVirus.update(2);check('Entrada antecede perseguição',s.predator.state==='PERSEGUINDO');
  s.obstacles=new Set(['16,7','16,8','16,9','16,10']);s.snake=[{x:12,y:9},{x:11,y:9},{x:10,y:9}];Object.assign(s.predator,{x:20,y:9,old:{x:20,y:9},state:'PERSEGUINDO',moveClock:0});for(let i=0;i<8;i++){B.PredatorVirus.update(.4);check('Predador respeita geometria no passo '+i,B.Pathfinding.free(s.predator.x,s.predator.y,B.PredatorVirus.config.radius,{ignoreHead:true}));}check('Predador se aproxima por caminho válido',s.predator.x<20);
  for(const character of ['boitata','iara']){
   reset(6,character);const total=s.total;for(let attack=0;attack<3;attack++){
    s.invuln=0;Object.assign(s.predator,{x:s.snake[0].x,y:s.snake[0].y,old:{...s.snake[0]},state:'PERSEGUINDO'});B.PredatorVirus.update(.01);check(character+': ataque tem animação '+attack,s.predator.state==='ATACANDO');B.PredatorVirus.update(.2);check(character+': exatamente uma vida por ataque '+attack,s.lives===2-attack);check(character+': dano não duplica vírus '+attack,s.total===total);
    if(attack<2){check(character+': predador desaparece após dano '+attack,s.predator.state==='DESAPARECENDO');check(character+': proteção e timer reiniciados '+attack,s.invuln===1.5&&s.chaseTimer.remaining===35&&s.fugitive.state!=='CAPTURADO');B.PredatorVirus.update(.6);check(character+': novo ciclo aguarda '+attack,s.predator.state==='AGUARDANDO');}
   }
   check(character+': terceira vida termina a tentativa',s.phase==='lost');B.Game.retry();check(character+': repetir preserva setor e total',s.level.id===6&&s.lives===3&&s.total===total&&!('used' in s.fugitive));
   reset(1,character);s.collected=s.level.target;B.Game.tick();check(character+': só pacotes não concluem',s.phase==='playing');Object.assign(s.fugitive,s.snake[0]);check(character+': captura detectada',B.CaptureSystem.check());const score=s.score;B.CaptureSystem.check();check(character+': captura pontua uma única vez',s.score===score&&score>=750&&s.phase==='capturing');const position=JSON.stringify(s.predator);time(.2);check(character+': captura congela inimigos',JSON.stringify(s.predator)===position);time(1);check(character+': captura inicial salva e desbloqueia',s.phase==='won'&&s.save.completed.includes(1));
   reset(6,character);Object.assign(s.fugitive,s.snake[0]);B.CaptureSystem.check();time(1);check(character+': captura abre pergunta sem concluir',s.phase==='quiz'&&!s.save.completed.includes(6));const original=s.total;B.Education.answer(1);check(character+': resposta errada duplica',s.phase==='wrong'&&s.total===original*2n);B.Game.retry();check(character+': erro reinicia captura sem cargas',!('used' in s.fugitive)&&s.total===original*2n);Object.assign(s.fugitive,s.snake[0]);B.CaptureSystem.check();time(1);B.Education.answer(s.question.correta);check(character+': resposta certa conclui após captura',s.phase==='won'&&s.save.completed.includes(6));
  }
  reset(30);Object.assign(s.fugitive,s.snake[0]);B.CaptureSystem.check();time(1);check('Captura final neutraliza núcleo e exige pergunta',s.boss.defeated&&s.phase==='quiz');
  const bossUpdate=B.Boss.update;B.Boss.update=()=>{};
  try{for(const character of ['boitata','iara'])for(const level of [1,6,16,26,30]){
   reset(level,character);let ticks=0;
   while(s.phase==='playing'&&ticks++<900){const h=s.snake[0],path=B.Pathfinding.find(h,s.fugitive);if(path?.length)B.Movement.control({x:path[0].x-h.x,y:path[0].y-h.y});B.Game.tick();const dt=s.level.stepMs/1000;s.invuln=Math.max(0,s.invuln-dt);time(dt);}
   check(character+': perseguição real captura alvo móvel no setor '+level,s.fugitive.state==='CAPTURADO'&&s.lives>0);
  }}finally{B.Boss.update=bossUpdate;}
 }catch(e){results.push({test:'Falha: '+e.message,passed:false});}
 finally{B.UI=ui;B.Audio=audio;B.Enemies.update=update;B.Enemies.spawn=spawn;try{localStorage.removeItem(B.Store.key);}catch{}B.Store.key=key;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,saved);}
 return results;
};
