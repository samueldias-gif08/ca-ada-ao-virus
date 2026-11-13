window.runMovementTests=function(){
 const B=Boitata,s=B.S,saved={...s},ui=B.UI,audio=B.Audio,key=B.Store.key,update=B.Enemies.update,spawn=B.Enemies.spawn,results=[];
 const check=(test,passed)=>{results.push({test,passed:!!passed});if(!passed)throw Error(test);};
 const near=(a,b)=>Math.abs(a-b)<1e-8;
 B.UI={hud(){},lesson(){},ready(){},close(){},lost(){},quiz(){},wrong(){},win(){}};B.Audio={init(){},effect(){}};B.Store.key='boitata-movement-tests';B.Enemies.update=()=>{};B.Enemies.spawn=()=>{};
 const reset=(character='boitata',dir={x:1,y:0})=>{s.save=B.Store.defaults();s.save.unlocked=30;s.save.character=character;s.lastQuestions={};B.Game.start(1);B.Game.play();s.obstacles=new Set();s.items=[];s.enemies=[];s.fugitive=null;s.predator=null;s.dir={...dir};s.oldDir={...dir};s.snake=Array.from({length:5},(_,i)=>({x:12-dir.x*i,y:9-dir.y*i}));s.oldSnake=s.snake.map(p=>({...p}));};
 const press=code=>B.Movement.keydown({code,preventDefault(){}}),release=code=>B.Movement.keyup({code,preventDefault(){}});
 try{
 for(const character of ['boitata','iara']){
  for(const [code,x,y]of [['KeyE',-1,0],['KeyA',0,-1],['KeyS',0,1]]){
   reset(character,x?{x:0,y:1}:{x:1,y:0});press(code);release(code);const h={...s.snake[0]};B.Game.tick();
   check(character+' direcao fixa '+code,s.snake[0].x===h.x+x&&s.snake[0].y===h.y+y);
   check(character+' vira corpo '+code,s.dir.x===x&&s.dir.y===y&&B.Collisions.same(s.snake[1],h));
   check('Camera fixa e vida preservada',s.camera===0&&s.oldCamera===0&&s.lives===3);
   B.Game.tick();check('Movimento automatico apos soltar '+code,s.snake[0].x===h.x+2*x&&s.snake[0].y===h.y+2*y);
  }
  for(const dir of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){
   reset(character,dir);press('KeyW');release('KeyW');B.Game.tick();B.Game.tick();check('W faz retorno sem atingir corpo '+JSON.stringify(dir),s.dir.x===-dir.x&&s.dir.y===-dir.y&&s.lives===3);const h={...s.snake[0]};B.Game.tick();check('Retorno continua automatico',s.snake[0].x===h.x-dir.x&&s.snake[0].y===h.y-dir.y);
  }
  reset(character,{x:-1,y:0});s.snake=s.snake.map(p=>({...p,x:p.x-11}));press('KeyE');release('KeyE');B.Game.tick();check('E sai da borda esquerda',s.snake[0].x===1&&s.snake[0].y!==9&&s.lives===3);
  reset(character,{x:-1,y:0});s.obstacles.add('11,9');press('KeyE');release('KeyE');B.Game.tick();check('E sai de obstaculo sem atravessar parede',s.snake[0].x===12&&s.snake[0].y!==9&&s.lives===3);
  reset(character);press('KeyS');B.Game.tick();const half=B.Movement.facing(s,.5);check('Giro interpolado',near(half.x,Math.SQRT1_2)&&near(half.y,Math.SQRT1_2));B.Game.tick();check('Segurar S segue reto sem girar novamente',s.snake[0].x===12&&s.snake[0].y===11);release('KeyS');press('KeyA');B.Game.tick();check('Inversao contra pescoco bloqueada',s.dir.y===1&&s.lives===3);
  reset(character);press('KeyW');press('KeyS');const h={...s.snake[0]};B.Game.tick();check('Diagonal normalizada',near(Math.hypot(s.snake[0].x-h.x,s.snake[0].y-h.y),1));check('Corpo vira diagonal',near(s.dir.x,Math.SQRT1_2)&&near(s.dir.y,Math.SQRT1_2));
  reset(character);press('KeyS');s.items=[{x:12,y:10,type:'common'}];B.Game.tick();check('Envelope preserva crescimento',s.snake.length===6&&s.collected===1);
  reset(character);press('KeyS');s.obstacles.add('12,10');B.Game.tick();check('Obstaculo causa dano',s.lives===2);
  reset(character);press('KeyS');s.enemies=[{x:12,y:10}];B.Game.tick();check('Virus causa dano',s.lives===2);
  reset(character);press('KeyS');release('KeyS');s.phase='paused';B.Game.play();B.Game.tick();check('Pausa preserva direcao automatica',s.snake[0].y===10);
 }
 }catch(e){results.push({test:'Falha: '+e.message,passed:false});}
 finally{B.Movement.clear();B.UI=ui;B.Audio=audio;B.Enemies.update=update;B.Enemies.spawn=spawn;try{localStorage.removeItem(B.Store.key);}catch{}B.Store.key=key;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,saved);}
 return results;
};