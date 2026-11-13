document.querySelector('iframe').addEventListener('load',event=>{
 const w=event.target.contentWindow,B=w.Boitata,s=B.S,C=B.NetworkCollapse,F=B.Forest3D;
 const results=[];
 const check=(description,passed)=>results.push({description,passed:!!passed});
 const isolatedSave=B.Store.defaults();
 isolatedSave.unlocked=10;
 isolatedSave.controlMode='keyboard';
 s.save=isolatedSave;
 B.Store.write=()=>true;
 const start=()=>{B.Game.start(10);B.Game.play();};
 const advance=(seconds)=>{s.elapsed+=seconds;C.update(seconds);};
 try{
  start();
  check('Fase 10 carrega com 88 placas e três vidas',C.active()&&s.collapse.tiles.length===88&&s.lives===3);
  check('Cronômetro começa em 00:60',(()=>{B.UI.chaseHud();return B.UI.$('predator-timer').textContent.endsWith('00:60');})());
  const tile=s.collapse.tiles.find(p=>Number.isFinite(p.until));
  check('O primeiro colapso foi antecipado em 35%',Math.abs(tile.until-9*.65)<1e-8);
  check('Loira começa oculta',s.collapse.loira===null);
  advance(tile.until-2.5);
  check('Placa avisa antes de cair',tile.state==='WARNING'&&tile.solid);
  advance(1.5);
  check('Placa entra em estado crítico com colisão',tile.state==='CRITICAL'&&tile.solid);
  advance(1.05);
  check('Placa destruída perde colisão',tile.state==='DESTROYED'&&!C.supports(tile.x,tile.y));
  const initial=s.elapsed;
  B.UI.pause();
  C.update(.8);
  check('Pausa congela a tentativa',s.elapsed===initial&&tile.state==='DESTROYED');
  B.Game.play();
  s.snake=[{x:tile.x+2,y:tile.y},{x:tile.x+3,y:tile.y}];
  s.dir={x:-1,y:0};
  B.Game.tick();
  check('Movimento para no vazio e inicia queda',!!s.collapse.fall&&s.snake[0].x===tile.x+2);
  advance(.50);
  advance(.50);
  check('Uma queda custa uma vida e o retorno é seguro',
   s.lives===2&&s.invuln>0&&s.snake.every(p=>C.supports(p.x,p.y))&&!!C.route(s.snake[0],s.elapsed));
  check('Existem rotas alternativas com partida no alerta final',
   !!C.route({x:6,y:9},45)&&s.collapse.alternate.some(p=>p.y>=12));
  const hazard=s.collapse.tiles.find(p=>p.hazard);
  const hazardStart=12-(hazard.id*.7)%6;
  check('Perigos avisam antes da descarga',C.hazard(hazard,hazardStart+4)===1&&C.hazard(hazard,hazardStart+5.3)===2);
  B.Game.retry();
  check('Reinício restaura placas, tempo e vidas',s.elapsed===0&&s.lives===3&&s.collapse.tiles.every(p=>p.solid&&p.state==='SAFE'));
  advance(45);
  B.UI.chaseHud();
  check('Alerta final aos 15 segundos',B.UI.$('chase-notice').textContent==='SISTEMA CRÍTICO!');
  advance(15);
  check('Tempo esgotado inicia desligamento',s.phase==='shutdown'&&s.elapsed===60);
  C.update(.70);
  check('Desligamento termina em derrota',s.phase==='lost');
  B.Game.retry();
  const arena=s.collapse;
  s.snake=s.oldSnake=[{x:19,y:5}];
  C.update(.016);
  const ghost=arena.loira;
  check('Aproximação do núcleo faz surgir a Loira a uma distância segura',ghost&&Math.hypot(ghost.x-19,ghost.y-5)>2.6);
  if(F.renderer){
   F.draw(0);
   const smooth=B.OrganicCharacters?[...B.OrganicCharacters.surfaces.values()].filter(p=>p.mesh.visible).map(p=>({mesh:{...p.mesh,count:1}})):[...F.pools.values()].filter(pool=>pool.mesh.count>0&&pool.mesh.geometry===F.geometries.loiraSphere);
   check('Modelo arredondado tem cabelo loiro, rosto e traje tecnológico',
    smooth.some(pool=>['dab46b','d7b774'].includes(pool.mesh.material.color.getHexString()))&&
    smooth.some(pool=>['9caec5','a2afc0'].includes(pool.mesh.material.color.getHexString()))&&
    smooth.every(pool=>!pool.mesh.material.flatShading)&&smooth.reduce((n,p)=>n+p.mesh.count,0)>40);
  }
  const before=Math.hypot(ghost.x-19,ghost.y-5);
  let remainedSupported=true;
  s.invuln=2;
  for(let i=0;i<36;i++){
   advance(.05);
   remainedSupported&&=C.tile(ghost.x,ghost.y).stable&&C.supports(ghost.x,ghost.y);
  }
  check('A IA contorna a área do núcleo e persegue sobre placas estáveis',
   Math.hypot(ghost.x-19,ghost.y-5)<before&&remainedSupported);
  s.snake=s.oldSnake=[{x:ghost.x,y:ghost.y}];
  s.invuln=0;
  C.update(0);
  check('Contato da Loira aciona impacto',!!arena.fall);
  advance(.50);
  advance(.05);
  check('Um contato tira uma vida e dá invulnerabilidade',s.lives===2&&s.invuln>0);
  B.Game.retry();
  check('Reinício remove a Loira anterior e restaura o gatilho',s.collapse!==arena&&s.collapse.loira===null);
  for(const character of ['boitata','iara']){
   B.Characters.select(character);
   start();
   advance(45);
   const path=C.route(s.snake[0],s.elapsed);
   for(let i=1;i<path.length;i++){
    const direction={x:path[i].x-path[i-1].x,y:path[i].y-path[i-1].y};
    B.Movement.control(direction);
    B.Game.tick();
    s.acc=s.level.stepMs;
    advance(s.level.stepMs/1000);
   }
   check(character+' alcança o núcleo com o movimento do jogo',s.phase==='restoring'&&s.collapse.charged);
   const contactTime=s.elapsed;
   for(let i=0;i<80;i++)C.update(.05);
   check(character+' reconstrói todas as placas com o relógio parado',
    s.elapsed===contactTime&&s.collapse.tiles.every(p=>p.solid&&p.state==='SAFE')&&s.phase==='quiz');
   if(s.phase==='quiz')B.Education.answer(s.question.correta);
   check(character+' conclui a campanha',s.phase==='won'&&s.save.completed.includes(10));
  }
  if(F.renderer){
   F.draw(100);
   const matrix=F.camera.matrixWorld.elements.slice(),projection=F.camera.projectionMatrix.elements.slice();
   F.draw(900);
   check('Câmera ortográfica fixa',F.camera.isOrthographicCamera&&matrix.every((n,i)=>n===F.camera.matrixWorld.elements[i])&&projection.every((n,i)=>n===F.camera.projectionMatrix.elements[i]));
   const corners=[[.1,.95,.1],[23.9,.95,.1],[.1,-1.2,17.9],[23.9,-1.2,17.9],[21.5,2.7,4.5]];
   check('Arena e antivírus dentro do quadro',corners.every(p=>{
    const v=new w.THREE.Vector3(...p).project(F.camera);
    return Math.abs(v.x)<=1&&Math.abs(v.y)<=1;
   }));
   check('Renderização Three.js emite geometria',F.renderer.info.render.triangles>0);
  }else check('Renderização Three.js disponível',false);
  B.Game.start(1);
  check('A fase 1 volta ao fluxo de captura',!C.active()&&s.collapse===null&&!!s.fugitive);
 }catch(error){results.push({description:error.stack,passed:false});}
 document.body.dataset.tests=JSON.stringify({total:results.length,failed:results.filter(r=>!r.passed)});
 document.querySelector('#results').textContent=results.map(r=>(r.passed?'✓ ':'✗ ')+r.description).join('\n');
});
