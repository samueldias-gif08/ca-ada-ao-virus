document.querySelector('iframe').addEventListener('load',async event=>{
 const w=event.target.contentWindow,B=w.Boitata,F=B.Forest3D,V=B.OrganicCharacters,s=B.S,results=[];
 const check=(test,passed)=>results.push({test,passed:!!passed});
 B.Store.write=()=>true;s.save=B.Store.defaults();s.save.unlocked=10;s.save.controlMode='keyboard';
 const snapshot=()=>JSON.stringify({snake:s.snake,old:s.oldSnake,lives:s.lives,dir:s.dir,elapsed:s.elapsed,shots:B.CucaArena.shots,ghost:s.collapse?.loira});
 const render=t=>{s.phase='paused';B.UI.close();F.draw(t);};
 try{
  check('WebGL e modelos disponíveis',!!F.renderer&&!!V);
  for(const id of ['boitata','iara']){
   s.save.character=id;B.Game.start(1);B.Game.play();
   const before=snapshot();render(1000);check(id+': render não altera simulação',snapshot()===before);
   check(id+': malha principal presente',V.surfaces.get(id==='boitata'?'b-body':'i-lock0').mesh.visible);
   const start=s.snake.length,h=s.snake[0];s.items=[{x:h.x+s.dir.x,y:h.y+s.dir.y,type:'common'}];s.phase='playing';B.Game.tick();
   check(id+': coleta preserva crescimento',s.snake.length===start+1);
   check(id+': trilha ainda colide consigo',B.Collisions.self(s.snake[2],true));render(1050);
   const path=Array.from({length:80},(_,i)=>({x:2+i%20,y:2+Math.floor(i/20),z:.45}));
   F.begin();V.player(id,path,1200,{x:1,y:0});
   const mesh=V.surfaces.get(id==='boitata'?'b-body':'i-lock0').mesh,position=mesh.geometry.attributes.position;
   check(id+': crescimento usa buffer finito',position.array.every(Number.isFinite)&&mesh.geometry.drawRange.count>1000);
   const geometry=mesh.geometry;F.begin();V.player(id,path,1216,{x:1,y:0});check(id+': movimento reutiliza geometria',mesh.geometry===geometry);
   B.Game.retry();check(id+': reinício restaura trilha',s.snake.length===5);
  }
  B.Game.start(9);B.Game.play();const before=snapshot();render(1600);check('Cuca: aparência não altera ataque',snapshot()===before);
  check('Cuca: vestido com superfície e cauda',V.surfaces.get('c-dress').mesh.visible&&V.surfaces.get('c-tail').mesh.visible);
  s.phase='playing';B.CucaArena.update(1.01);check('Cuca: disparo original continua ativo',B.CucaArena.shots.length>0);render(1620);
  B.Game.start(10);B.Game.play();s.snake=s.oldSnake=[{x:19,y:5}];B.NetworkCollapse.updateLoira(.016,s.snake[0]);
  check('Loira: condição original de aparição',!!s.collapse.loira);
  if(s.collapse.loira){const ghost=snapshot();render(2000);check('Loira: desenho preserva IA',snapshot()===ghost);check('Loira: cabelo e traje presentes',V.surfaces.get('l-hair0').mesh.visible&&V.surfaces.get('l-torso').mesh.visible);}
  B.Game.start(1);render(2100);check('Trocar de setor oculta Cuca e Loira',!V.surfaces.get('c-dress').mesh.visible&&!V.surfaces.get('l-torso')?.mesh.visible);
  const resources=F.renderer.info.memory.geometries;for(let i=0;i<30;i++)render(2200+i*16);
  check('Geometrias estáveis após aquecimento',F.renderer.info.memory.geometries===resources);
  check('GPU sem erro',F.renderer.getContext().getError()===0);
  check('Posições e normais finitas em todos os modelos',[...V.surfaces.values()].every(q=>q.mesh.geometry.attributes.position.array.every(Number.isFinite)&&q.mesh.geometry.attributes.normal.array.every(Number.isFinite)));
  B.Game.start(5);render(2800);
  check('Duelo usa novos modelos para os dois participantes',[0,1].every(side=>[...V.surfaces].some(([key,q])=>key.startsWith('pvp-'+side+'-')&&q.mesh.visible)));
  B.UI.menu();check('Retorno ao menu',s.phase==='menu');
  const scene=F.scene,surfaces=V.surfaces;
  B.CharacterSelection.show();
  const portraits=[...w.document.querySelectorAll('.guardian-card .guardian-portrait')];
  await Promise.all(portraits.map(img=>img.decode()));
  check('Seleção exibe os dois guardiões',portraits.length===2);
  check('Seleção preserva cena e recursos da campanha',F.scene===scene&&V.surfaces===surfaces);
  check('Ilustrações carregam no cartão correspondente',portraits.every(img=>img.naturalWidth>0&&img.src.endsWith(img.closest('.guardian-card').dataset.character+'-portrait.png')));
  B.UI.menu();
 }catch(error){check(error.stack,false);}
 document.body.dataset.tests=JSON.stringify({total:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed),calls:F.renderer?.info.render.calls,triangles:F.renderer?.info.render.triangles});
 document.getElementById('results').textContent=JSON.stringify(results,null,2);
});
