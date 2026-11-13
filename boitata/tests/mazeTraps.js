document.querySelector('iframe').addEventListener('load',event=>{
 const w=event.target.contentWindow,B=w.Boitata,s=B.S,M=B.GardenMaze,F=B.Forest3D;
 const results=[];
 const check=(description,passed)=>results.push({description,passed:!!passed});
 const place=(x,y)=>{s.snake=[{x,y}];s.oldSnake=[{x,y}];s.dir={x:1,y:0};s.oldDir={...s.dir};};
 const time=(t,dt=0)=>{s.elapsed=t;M.updateTraps(dt);};
 try{
  s.save=B.Store.defaults();s.save.unlocked=10;B.Store.write=()=>true;
  B.Game.start(8);
  check('Setor 6 abre com o aviso dos obstáculos',B.UI.$('overlay').textContent.includes('CUIDADO!'));
  B.Game.play();
  check('As bases das barras ficam junto a paredes',s.mazeTraps.bars.every(b=>M.walls.has(b.x+','+Math.floor(b.y))));
  check('Ciclo da barra tem cinco estados e dura quatro segundos',
   [[0,'RETRACTED'],[1.25,'WARNING'],[1.75,'EXTENDING'],[2.5,'EXTENDED'],[3.5,'RETRACTING'],[4,'RETRACTED']].every(([t,expected])=>M.barState(t,0).state===expected));
  place(7,15);s.save.controlMode='keyboard';
  time(2.4);
  B.Game.tick();
  check('Contato com barra estendida tira uma vida',s.lives===2&&M.barBlocked(8,15));
  place(7,15);
  time(4);
  B.Game.tick();
  check('Retração libera a passagem',s.snake[0].x===8&&!M.barBlocked(8,15));
  place(8,15);
  time(5.8);
  check('A barra não empurra o jogador protegido para dentro da parede',!M.barBlocked(8,15));
  B.Game.retry();
  check('Três plataformas consecutivas antes do vírus',
   [7,8,9].every((x,i)=>M.platformAt(x,9)===i)&&M.platformAt(10,9)===-1&&M.target.x===11);
  check('Plataformas avisam, caem e retornam em três segundos',
   [[0,'SAFE',true],[1.2,'WARNING',true],[2,'FALLING',false],[2.55,'RECOVERING',false],[2.9,'RECOVERING',true],[3,'SAFE',true]].every(([t,state,solid])=>{
    const p=M.plateState(0,t);return p.state===state&&p.solid===solid;
   }));
  check('Quedas são defasadas',[0,1,2].filter(i=>!M.plateState(i,2).solid).length===1);
  place(7,9);time(1.9);
  check('Perder sustentação inicia animação',!!s.mazeTraps.fall&&M.overHole(7,9));
  B.UI.pause();
  M.updateTraps(.9);
  check('Pausa congela a queda e os ciclos',s.mazeTraps.fall.elapsed===0&&s.lives===3);
  B.Game.play();M.updateTraps(.45);M.updateTraps(.45);
  check('Queda tira uma vida e retorna ao trecho estável',s.lives===2&&s.invuln>0&&s.snake[0].x===6&&!M.overHole(6,9));
  B.Game.retry();
  check('Reinício restaura barras, placas e vidas',s.elapsed===0&&s.lives===3&&s.mazeTraps.bars.every(b=>b.length===0)&&[0,1,2].every(i=>M.plateState(i).solid));
  if(F.renderer){
   F.draw(0);const matrix=F.camera.matrixWorld.elements.slice();
   time(1.65);F.draw(10);
   check('WebGL desenha mecanismos sem mover a câmera',F.renderer.info.render.triangles>0&&matrix.every((n,i)=>n===F.camera.matrixWorld.elements[i]));
  }
  for(const character of ['boitata','iara']){
   B.Characters.select(character);B.Game.retry();
   s.save.controlMode='mouse';
   B.Renderer.draw(0);
   place(6,9);
   const canvas=B.UI.$('game'),rect=canvas.getBoundingClientRect();
   const p=F.renderer?new w.THREE.Vector3(12,.45,9.5).project(F.camera):null;
   const [u,v]=p?[(p.x+1)/2,(1-p.y)/2]:new B.Mesh(null,{arena:true}).project({x:12,y:9.5,z:.45}).map((n,i)=>n/(i?canvas.height:canvas.width));
   canvas.dispatchEvent(new w.PointerEvent('pointermove',{pointerType:'mouse',clientX:rect.left+u*rect.width,clientY:rect.top+v*rect.height}));
   const step=s.level.stepMs/1000;
   for(let i=0;i<5&&s.phase==='playing';i++){
    time(.65+i*step);
    B.Game.tick();s.acc=s.level.stepMs;
    B.CaptureSystem.check(true);
   }
   check(character+' atravessa com o mouse e captura o vírus',s.phase==='capturing'&&!s.mazeTraps.fall&&s.lives===3);
  }
  B.Game.start(1);
  check('Outros setores mantêm a campanha e limpam os obstáculos',!M.active()&&s.mazeTraps===null&&!!s.fugitive);
 }catch(error){check(error.stack,false);}
 document.body.dataset.tests=JSON.stringify({total:results.length,failed:results.filter(r=>!r.passed)});
 document.querySelector('#results').textContent=results.map(r=>(r.passed?'✓ ':'✗ ')+r.description).join('\n');
});
