/* Real collection/capture paths; isolated state and storage. */
window.runRedesignTests=function(){
 const B=Boitata,s=B.S,saved={...s},ui=B.UI,audio=B.Audio,key=B.Store.key,enemies=B.Enemies.update,results=[];
 const check=(test,passed)=>{results.push({test,passed:!!passed});if(!passed)throw Error(test);};
 B.UI={hud(){},lesson(){},ready(){},close(){},lost(){},quiz(){},win(){}};B.Audio={init(){},effect(){}};B.Enemies.update=()=>{};B.Store.key='boitata-redesign-tests';
 const reset=(id,character)=>{s.save=B.Store.defaults();s.save.unlocked=30;s.save.character=character;s.lastQuestions={};B.Game.start(id);B.Game.play();s.acc=0;};
 try{
  for(const character of ['boitata','iara'])for(let level=1;level<=30;level++){
   reset(level,character);
   // Each generated item is collected through the actual tick, with its type intact.
   const items=[...s.items];let correct=true;
   for(const item of items){
    const d=B.Pathfinding.directions.find(d=>!B.Maps.blocked(item.x-d.x,item.y-d.y));
    if(!d){correct=false;break;}
    const h={x:item.x-d.x,y:item.y-d.y};s.snake=[h];s.oldSnake=[{...h}];s.dir={...d};s.oldDir={...d};s.pending=[];s.invuln=1;s.phase='playing';s.fugitive.state='CAPTURADO';
    const count=s.collected,step=s.level.stepMs,score=s.score,lives=s.lives;
    B.Game.tick();const growing=!['health','score'].includes(item.type);
    correct&&=!s.items.includes(item)&&s.snake.length===(growing?2:1)&&s.collected===count+(growing?1:0)&&s.level.stepMs===step&&s.score>score&&s.lives===(item.type==='health'?Math.min(3,lives+1):lives);
   }
   check(character+' setor '+level+': todos os envelopes coletáveis, crescimento e efeitos preservados',correct&&s.items.length===0);
   // A long serpentine trail remains inside the original map, with real turns.
   for(const location of ['head','body','tip']){
    reset(level,character);s.obstacles=new Set();s.items=[];
    s.snake=[];for(let y=3;y<=13;y+=2){const row=Array.from({length:18},(_,i)=>({x:((y-3)/2)%2?20-i:3+i,y}));if(s.snake.length){const tail=s.snake.at(-1);s.snake.push({x:tail.x,y:y-1});}s.snake.push(...row);}
    s.save.unlocked=level;s.oldSnake=s.snake.map(p=>({...p}));const index=location==='head'?0:location==='body'?Math.floor(s.snake.length/2):s.snake.length-1,p=s.snake[index];
    Object.assign(s.fugitive,{x:p.x,y:p.y,old:{...p},visualClock:1});
    check(character+' setor '+level+': captura por '+location+' em trilha longa',B.CaptureSystem.check(true));
    const score=s.score;check(character+' setor '+level+': captura única',!B.CaptureSystem.check(true)&&s.score===score);
    B.CaptureSystem.update(1);
    if(level>=4){check(character+' setor '+level+': pergunta após captura',s.phase==='quiz');B.Education.answer(s.question.correta);}
    check(character+' setor '+level+': vitória e progressão por '+location,s.phase==='won'&&s.save.completed.includes(level)&&s.save.unlocked>=Math.min(30,level+1));
   }
  }
  reset(1,'iara');s.snake=[{x:5,y:5},{x:5,y:9},{x:9,y:9}];s.oldSnake=s.snake.map(p=>({...p}));
  check('Espaço vazio dentro de uma curva não captura',!B.CaptureSystem.touches(B.Characters.points(s,1),{x:8,y:6}));
  check('Contato entre dois segmentos de cabelo captura',B.CaptureSystem.touches(B.Characters.points(s,1),{x:5.5,y:7.5}));
  // The virus crosses a thin hair link entirely between consecutive samples.
  const path=B.Characters.points(s,1);s.capture.previous={path,p:{x:4.5,y:7.5}};
  Object.assign(s.fugitive,{x:5.5,y:7,old:{x:5.5,y:7},visualClock:1});
  check('Varredura detecta cruzamento do cabelo entre frames',B.CaptureSystem.check(true));
  reset(1,'boitata');s.phase='paused';Object.assign(s.fugitive,s.snake[0]);check('Pausa não captura',!B.CaptureSystem.check(true));
  check('Não existe módulo de teletransporte',!B.Teleport&&!('used' in s.fugitive)&&!('nextTeleport' in s.fugitive));
  if(B.Renderer?.item){const calls=[],m={visible:()=>true,box(...args){calls.push(args);},tube(...args){calls.push(args);}};
   B.Renderer.item(m,{x:5,y:6,type:'common'},100);check('Envelope amarelo tem espessura dourada e dobras diagonais',calls.some(c=>c.includes('#ffda49'))&&calls.some(c=>c.includes('#bb861e'))&&calls.filter(c=>typeof c[0]==='object').length===4);
  }
 }catch(e){results.push({test:'Falha no redesign: '+e.stack,passed:false});}
 finally{B.UI=ui;B.Audio=audio;B.Enemies.update=enemies;try{localStorage.removeItem(B.Store.key);}catch{}B.Store.key=key;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,saved);}
 return results;
};
