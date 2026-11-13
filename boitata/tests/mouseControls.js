document.querySelector('iframe').addEventListener('load',event=>{
 const w=event.target.contentWindow,B=w.Boitata,s=B.S,M=B.Movement,F=B.Forest3D;
 const key=B.Store.key,previous=w.localStorage.getItem(key);
 const results=[];
 const check=(description,passed)=>results.push({description,passed:!!passed});
 const close=(a,b)=>Math.abs(a-b)<1e-6;
 const canvas=B.UI.$('game');
 // Input/collision assertions do not need high-resolution software shadow maps.
 if(F.renderer){F.quality='low';F.renderer.shadowMap.enabled=false;F.sun.castShadow=false;F.resize();}
 function point(x,y){
  const rect=canvas.getBoundingClientRect();
  const p=F.renderer?new w.THREE.Vector3(x,.45,y).project(F.camera):null;
  const [u,v]=p?[(p.x+1)/2,(1-p.y)/2]:new B.Mesh(null,{arena:true}).project({x,y,z:.45}).map((n,i)=>n/(i?canvas.height:canvas.width));
  canvas.dispatchEvent(new w.PointerEvent('pointermove',{pointerType:'mouse',clientX:rect.left+u*rect.width,clientY:rect.top+v*rect.height}));
 }
 try{
  s.save=B.Store.defaults();
  s.save.unlocked=10;
  check('Mouse é o padrão',M.mouseMode());
  for(const id of [1,2,3,4,8,9,10]){
   const started=B.Game.start(id);
   B.Game.play();
   B.Renderer.draw(s.clock);
   const head=s.snake[0];
   point(head.x+3.5,head.y+.5);
   const n=M.next();
   check('Mapa '+id+' aceita mouse sem clique',started&&!!n&&n.x>head.x);
  }
  B.Game.start(1);
  B.Game.play();
  B.Renderer.draw(s.clock);
  point(12.5,15.5);
  const world=M.cursorWorld(),head=s.snake[0],step=M.next();
  check('Conversão da câmera isométrica',close(world.x,12.5)&&close(world.y,15.5));
  check('Passo diagonal unitário',close(Math.hypot(step.x-head.x,step.y-head.y),1)&&step.x>head.x&&step.y>head.y);
  canvas.dispatchEvent(new w.PointerEvent('pointerleave',{pointerType:'mouse'}));
  check('Saída mantém a direção',M.next()!==null&&M.pointer===null);
  point(head.x+.5,head.y+.5);
  check('Zona morta evita tremores',M.next()===null);
  B.UI.pause();
  point(12.5,15.5);
  B.Game.play();
  check('Retomada exige novo movimento do mouse',M.next()===null);
  B.Game.retry();
  check('Reinício limpa a direção',M.next()===null);
  check('Teclas direcionais desativadas no Mouse',!M.keydown({code:'KeyE',preventDefault(){}}));
  for(const character of ['boitata','iara']){
   B.Characters.select(character);
   B.Game.retry();
   const trail=s.snake.slice();
   s.obstacles.clear();
   s.items=[{x:7,y:9,type:'common'}];
   point(12.5,9.5);
   B.Game.tick();
   check(character+' cresce e preserva a trilha',s.snake.length===trail.length+1&&s.snake.slice(1).every((p,i)=>p===trail[i]));
  }
  B.Game.retry();
  s.obstacles.add('7,9');
  point(12.5,9.5);
  B.Game.tick();
  check('Obstáculo impede avanço e causa dano',s.snake[0].x===6&&s.lives===2);
  B.UI.settings();
  const mode=B.UI.$('control-mode');
  mode.value='keyboard';
  mode.dispatchEvent(new w.Event('change'));
  check('Modo teclado salvo e barra restaurada',B.Store.load().controlMode==='keyboard'&&!w.document.querySelector('.touch').hidden);
  B.Game.play();
  point(6.5,13.5);
  check('Teclado ignora o mouse e aceita as teclas',M.pointer===null&&M.keydown({code:'KeyS',preventDefault(){}})&&M.next().y===10);
  B.UI.settings();
  mode.value='mouse';
  const current=B.UI.$('control-mode');
  current.value='mouse';
  current.dispatchEvent(new w.Event('change'));
  check('Modo mouse mostra instrução e oculta barra',B.UI.$('control-hint').textContent.includes('MOVIMENTE O MOUSE')&&w.document.querySelector('.touch').hidden);
  const duel=B.PvP;
  B.Game.start(5);
  check('Setor 5 abre o ringue',s.phase==='pvp-ready'&&duel.active());
  B.Game.play();
  B.Renderer.draw(s.clock);
  const first=s.pvp,opponent=first.opponent;
  check('Setor 5 permite circular na área ampliada',B.Maps.inside(-8,9)&&B.Maps.inside(31,9)&&B.Maps.inside(12,-6)&&B.Maps.inside(12,22)&&!B.Maps.blocked(-8,9));
  const bounds=duel.bounds;
  check('Limites do ringue ampliado ainda bloqueiam a saída',!B.Maps.inside(bounds.minX-.1,9)&&!B.Maps.inside(bounds.maxX+.1,9)&&!B.Maps.inside(12,bounds.minY-.1)&&!B.Maps.inside(12,bounds.maxY+.1));
  if(F.renderer){
   check('Piso do setor 5 cresceu mais 40% em cada eixo',close(duel.root.scale.x/(4/3),1.4)&&close(duel.root.scale.z/(4/3),1.4));
   check('Arena ampliada cabe na câmera',[-1,1].every(sx=>[-1,1].every(sz=>{const p=new w.THREE.Vector3(12+sx*(duel.arena.width/2+.2),0,9+sz*(duel.arena.height/2+.2)).project(F.camera);return Math.abs(p.x)<=1&&Math.abs(p.y)<=1;})));
  }
  const initialPlayer={...s.snake[0]},initialOpponent={...opponent.snake[0]};
  point(initialPlayer.x+4,initialPlayer.y+.5);
  B.Game.tick();
  check('Setor 5 usa o mouse e a velocidade do ringue',M.mouseMode()&&
   close(Math.hypot(s.snake[0].x-initialPlayer.x,s.snake[0].y-initialPlayer.y),3.3*s.level.stepMs/1000));
  check('IA se move automaticamente e a trilha segue a cabeça',
   !close(opponent.snake[0].x,initialOpponent.x)&&opponent.snake[1].x===initialOpponent.x);
  const calls=[];
  const models=[...B.Characters.registry.values()];
  const originals=models.map(model=>model.model);
  models.forEach((model,i)=>{model.model=(mesh,path,...args)=>{calls.push([model.id,path.length]);return originals[i](mesh,path,...args);};});
  try{B.Renderer.draw(s.clock);}finally{models.forEach((model,i)=>{model.model=originals[i];});}
  check('Renderiza exatamente dois modelos completos',calls.length===2&&new Set(calls.map(p=>p[0])).size===2&&calls.every(p=>p[1]===5));
  for(let i=0;i<120;i++)duel.moveOpponent(s,3.3*s.level.stepMs/1000);
  check('A IA mantém todos os segmentos dentro do ringue',opponent.snake.every(p=>B.Maps.inside(p.x,p.y)));
  B.UI.togglePause();
  B.UI.settings(true);
  const duelMode=B.UI.$('control-mode');
  duelMode.value='keyboard';
  duelMode.dispatchEvent(new w.Event('change'));
  B.UI.pause();
  B.UI.togglePause();
  const beforeKeyboard=s.snake[0].y;
  point(13,14);
  M.keydown({code:'KeyS',preventDefault(){}});
  B.Game.tick();
  check('Pausa e troca para teclado preservam o duelo',s.pvp===first&&s.snake[0].y>beforeKeyboard&&M.pointer===null);
  for(let i=0;i<3;i++)B.Game.retry();
  check('Reinícios recriam uma partida e um placar',s.pvp!==first&&s.pvp.score.every(n=>n===0)&&w.document.querySelectorAll('#pvp-hud').length===1);
  function hit(playerAttacks){
   const rival=s.pvp.opponent;
   s.snake=[{x:11.6,y:9}];rival.snake=[{x:12,y:9}];
   s.oldSnake=[{x:playerAttacks?10.9:11.6,y:9}];
   rival.oldSnake=[{x:playerAttacks?12:12.7,y:9}];
   duel.contact();
  }
  function separate(){
   s.snake=s.oldSnake=[{x:6,y:9}];
   s.pvp.opponent.snake=s.pvp.opponent.oldSnake=[{x:18,y:9}];
   duel.contact();
  }
  hit(true);hit(true);
  separate();hit(true);
  check('Contato contínuo e intervalo de proteção limitam o dano',s.pvp.score[1]===1&&s.pvp.protection>0);
  for(let i=0;i<2;i++){separate();s.pvp.protection=0;hit(true);}
  check('Terceiro impacto vence o duelo e abre a pergunta',s.phase==='quiz'&&s.pvp.winner===0&&B.UI.$('overlay').textContent.includes('VOCÊ SE LIVROU'));
  B.Education.answer(0);check('Acerto confirma a vitória do duelo',s.phase==='pvp-won'&&s.pvp.winner===0);
  B.Game.retry();
  const rival=s.pvp.opponent;
  s.snake=s.oldSnake=[{x:13,y:9}];
  rival.snake=rival.oldSnake=[{x:17,y:9},{x:16,y:9},{x:15,y:9},{x:14,y:9},{x:13,y:9}];
  duel.contact();
  check('Contato com segmento distante da cabeça tira uma vida do adversário',s.pvp.score[1]===1);
  B.Game.retry();
  hit(false);
  check('Choque de cabeça não tira vida do jogador',s.pvp.score[0]===0);
  for(let i=0;i<3;i++){
   separate();s.pvp.protection=0;
   s.snake=s.oldSnake=[{x:10,y:9},{x:11,y:9},{x:12,y:9}];
   s.pvp.opponent.oldSnake=[{x:12.8,y:9}];
   s.pvp.opponent.snake=[{x:12.2,y:9}];
   duel.contact();
  }
  check('Três toques do adversário no corpo causam derrota',s.phase==='pvp-won'&&s.pvp.winner===1&&B.UI.$('overlay').textContent.includes('VOCÊ FOI INFECTADO'));
  B.UI.menu();
  check('Sair remove referências do duelo e placar',s.pvp===null&&!w.document.getElementById('pvp-hud'));
  B.Game.start(5);B.Game.play();
  check('Voltar ao ringue começa uma partida limpa',s.pvp.score.every(n=>n===0)&&s.pvp.opponent.snake.length===5);
  B.Game.start(1);
  check('Outro setor retoma a campanha',!duel.active()&&!!s.fugitive);
 }catch(error){check(error.stack,false);}
 finally{if(previous===null)w.localStorage.removeItem(key);else w.localStorage.setItem(key,previous);}
 document.body.dataset.tests=JSON.stringify({total:results.length,failed:results.filter(r=>!r.passed)});
 document.querySelector('#results').textContent=results.map(r=>(r.passed?'✓ ':'✗ ')+r.description).join('\n');
});
