/* Testes determinísticos: não alteram o progresso real. Também executáveis sem DOM. */
window.runBoitataTests=function(){
 const B=Boitata,s=B.S,results=[],originalUI=B.UI,originalAudio=B.Audio,originalState={...s},originalKey=B.Store.key,originalEnemies=B.Enemies.update,originalSpawn=B.Enemies.spawn;
 const assert=(name,condition)=>{results.push({test:name,passed:!!condition});if(!condition)throw Error(name);};
 B.UI={hud(){},lesson(){},ready(){},close(){},lost(){},quiz(){},wrong(){},win(){}};B.Audio={init(){},effect(){}};B.Store.key='boitata-test-isolated';
 const reset=()=>{Object.assign(s,{save:B.Store.defaults(),phase:'menu',lastQuestions:{},clock:0,lastTime:0});s.save.unlocked=30;};
 try{
 reset();assert('Exatamente 30 fases e 30 cores',BOITATA_LEVELS.length===30&&new Set(BOITATA_LEVELS.map(l=>l.color)).size===30);
 assert('Banco com pelo menos 50 perguntas e IDs únicos',BOITATA_QUESTIONS.length>=50&&new Set(BOITATA_QUESTIONS.map(q=>q.id)).size===BOITATA_QUESTIONS.length);
 assert('Cada tema avaliado tem pelo menos duas perguntas',BOITATA_LEVELS.slice(5).every(l=>BOITATA_QUESTIONS.filter(q=>q.theme===l.name).length>=2));
 assert('Cinco resumos com 100–150 palavras',BOITATA_LEVELS.slice(0,5).every(l=>{const n=l.lesson.replace(/<[^>]*>/g,'').trim().split(/\s+/).length;return n>=100&&n<=150;}));
 s.save.unlocked=1;assert('Fase bloqueada recusada pela lógica',B.Game.start(2)===false);s.save.unlocked=30;
 B.Game.start(1);B.Game.play();const startX=s.snake[0].x;B.Movement.control('left');B.Game.tick();assert('Avanço automático e reversão para o corpo bloqueada',s.snake[0].x===startX+1);
 B.Movement.control('up');B.Game.tick();const y=s.snake[0].y;B.Movement.control('down');B.Game.tick();assert('Inversão vertical imediata bloqueada',s.snake[0].y===y-1);
 assert('Corpo acompanha o caminho',s.snake[1].x===s.oldSnake[0].x&&s.snake[1].y===s.oldSnake[0].y);
 B.Game.start(6);B.Game.play();const n={x:s.snake[0].x+1,y:s.snake[0].y};s.items.push({...n,type:'common'});const len=s.snake.length;B.Game.tick();assert('Coleta aumenta corpo, objetivo e pontos',s.collected===1&&s.snake.length===len+1&&s.score===100);
 s.enemies=[{x:s.snake[0].x+1,y:s.snake[0].y,type:3,age:0,id:0n}];B.Game.tick();assert('Colisão com vírus reduz vida e protege temporariamente',s.lives===2&&s.invuln===1.5);
 s.invuln=0;const before=s.total;B.Player.hurt();s.invuln=0;B.Player.hurt();assert('Derrota não duplica vírus',s.phase==='lost'&&s.total===before);B.Game.retry();assert('Repetir após derrota mantém total',s.total===before&&s.lives===3);
 const sequence=[];for(let i=0;i<4;i++){s.phase='quiz';const q=B.Education.choose();sequence.push(q.id);B.Education.answer(1);assert('Duplicação acumulada '+(i+1),s.total===before*2n**BigInt(i+1));B.Game.retry();}
 assert('Perguntas não se repetem imediatamente',sequence.every((id,i)=>i===0||id!==sequence[i-1]));assert('Erros e áudio persistem',B.Store.load().errors[6]===4&&B.Store.load().audio.effects===false);
 const next=s.save.unlocked=6;s.phase='quiz';B.Education.choose();B.Education.answer(s.question.correta);assert('Acerto desbloqueia próxima, salva conclusão e zera erros',s.save.unlocked===next+1&&s.save.completed.includes(6)&&B.Store.errors(6)===0&&s.save.performance[6].score===s.score);
 s.save.unlocked=30;B.Game.start(26);B.Game.play();s.total=1000000000000000000000n;B.Enemies.spawn();assert('Ondas respeitam limite sem truncar total',s.enemies.length<=18&&s.total-s.issued>0n&&s.issued===BigInt(s.enemies.length));assert('Spawn não ocorre sobre corpo, item ou obstáculo',s.enemies.every(e=>!s.snake.some(p=>B.Collisions.same(p,e))&&!s.items.some(p=>B.Collisions.same(p,e))&&!B.Maps.blocked(e.x,e.y)));
 const layouts=new Set();for(const l of BOITATA_LEVELS){B.Game.start(l.id);layouts.add([...s.obstacles].sort().join('|'));}assert('30 layouts com geometria distinta',layouts.size===30);
 // Percorre os mapas com o controlador real; encontros aleatórios são testados acima.
 B.Enemies.update=()=>{};B.Enemies.spawn=()=>{};
 for(let id=1;id<=30;id++){B.Game.start(id);B.Game.play();assert('Arena finita e itens acessíveis '+id,B.Maps.validate()&&s.items.length>=s.level.target&&s.generated===24);
 Boitata.FugitiveVirus.reset();Object.assign(s.fugitive,s.snake[0]);Boitata.CaptureSystem.check();Boitata.CaptureSystem.update(1);
 if(id<4)assert('Sem pergunta obrigatória '+id,s.phase==='won');else{assert('Pergunta só após objetivo '+id,s.phase==='quiz');B.Education.answer(s.question.correta);assert('Conclusão por resposta correta '+id,s.phase==='won');}}
 B.Enemies.spawn=originalSpawn;B.Game.start(30);B.Game.play();const stages=[];for(const fraction of [0,.4,.75]){s.collected=Math.floor(s.level.target*fraction);s.elapsed+=10;B.Boss.update();stages.push(s.boss.stage);}assert('Chefe possui três etapas e cria minions',stages.join(',')==='1,2,3'&&s.enemies.length>0&&s.boss.attacks===3);assert('Ataques avisados preservam corredor de escape',s.hazards.length>0&&s.hazards.every(h=>!B.Maps.safe(h.x,h.y)));
 s.collected=s.level.target;B.Boss.update();assert('Chefe derrotado após coleta final',s.boss.defeated&&s.boss.health===0);s.phase='quiz';B.Education.choose();B.Education.answer(1);assert('Erro final reinicia infecção sem concluir',s.phase==='wrong'&&B.Store.errors(30)===1);B.Game.retry();assert('Chefe reinicia na etapa um',s.boss.stage===1&&!s.boss.defeated);
 B.Store.reset();assert('Apagar progresso restaura bloqueios e recordes',s.save.unlocked===1&&s.save.completed.length===0&&s.save.best===0);
 }catch(e){results.push({test:'Falha: '+e.message,passed:false});}
 finally{B.UI=originalUI;B.Audio=originalAudio;B.Enemies.update=originalEnemies;B.Enemies.spawn=originalSpawn;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,originalState);try{localStorage.removeItem(B.Store.key);}catch{}B.Store.key=originalKey;}
 return results;
};
