window.runCharacterTests=function(){
 const B=Boitata,s=B.S,snapshot={...s},ui=B.UI,audio=B.Audio,key=B.Store.key,update=B.Enemies.update,spawn=B.Enemies.spawn,results=[];
 const assert=(test,condition)=>{results.push({test,passed:!!condition});if(!condition)throw Error(test);};
 B.UI={hud(){},lesson(){},ready(){},close(){},lost(){},quiz(){},wrong(){},win(){}};B.Audio={init(){},effect(){}};B.Store.key='boitata-characters-test-isolated';
 try{
 s.save=B.Store.defaults();s.save.unlocked=30;s.lastQuestions={};s.clock=0;B.Enemies.update=()=>{};B.Enemies.spawn=()=>{};
 for(const id of ['boitata','iara']){
 B.Characters.select(id);B.Game.start(6);B.Game.play();
 const size=s.snake.length,old={...s.snake[0]};s.items=[{x:old.x+1,y:old.y,type:'common'}];B.Game.tick();
 assert(id+': pacote cresce exatamente um segmento',s.snake.length===size+1&&s.collected===1&&s.score===100);
 assert(id+': histórico segue a cabeça',B.Collisions.same(s.snake[1],old));
 const points=B.Characters.points(s,.5);assert(id+': crescimento interpolado sem salto',points.length===size+1&&points.at(-1).x===s.snake.at(-1).x+.5);
 assert(id+': corpo/cabelo participa da colisão',B.Collisions.self(s.snake[2],true));
 assert(id+': cauda pode sair da célula sem crescimento',!B.Collisions.self(s.snake.at(-1),false));
 const n={x:s.snake[0].x+1,y:s.snake[0].y};s.obstacles.add(n.x+','+n.y);B.Game.tick();assert(id+': obstáculo reduz vida e recompõe trilha segura',s.lives===2&&s.snake.length===5&&s.invuln===1.5);
 assert(id+': recorde individual salvo',B.Store.load().characterBest[id]>=100);
 for(let level=1;level<=30;level++){
 B.Game.start(level);B.Game.play();assert(id+': trilha e posições seguras no setor '+level,B.Maps.validate()&&s.snake.every(p=>B.Maps.inside(p.x,p.y)));
 }
 }
 const completed=[...s.save.completed],unlocked=s.save.unlocked;B.Characters.select('boitata');B.Characters.select('iara');
 assert('Troca preserva campanha e persiste seleção',s.save.unlocked===unlocked&&JSON.stringify(completed)===JSON.stringify(s.save.completed)&&B.Store.load().character==='iara');
 assert('ID desconhecido é recusado',B.Characters.select('inexistente')===false);
 localStorage.setItem(B.Store.key,JSON.stringify({unlocked:12,best:450,completed:[1,2],character:'inválido',characterBest:{iara:-20}}));const migrated=B.Store.load();
 assert('Migração preserva progresso e valida personagem e recordes',migrated.unlocked===12&&migrated.best===450&&migrated.character==='boitata'&&migrated.characterBest.iara===0);
 // A mesma entrada física não altera as dimensões do corpo fixo de Iara.
 const draw=length=>{const calls=[],mesh={visible:()=>true,tube(){},ellipsoid(...args){calls.push(args);}};B.Characters.get('iara').model(mesh,Array.from({length},(_,i)=>({x:6-i,y:9,z:.45})),100,{x:1,y:0});return calls.slice(0,11);};
 assert('Crescer cabelo não deforma corpo ou cauda de Iara',JSON.stringify(draw(5))===JSON.stringify(draw(80)));
 }catch(e){results.push({test:e.message,passed:false});}
 finally{B.UI=ui;B.Audio=audio;B.Enemies.update=update;B.Enemies.spawn=spawn;try{localStorage.removeItem(B.Store.key);}catch{}B.Store.key=key;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,snapshot);}
 return results;
};
