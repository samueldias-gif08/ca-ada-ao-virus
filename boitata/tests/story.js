document.querySelector('iframe').onload=async event=>{
 const w=event.target.contentWindow,B=w.Boitata,H=B.Story,F=B.Forest3D,s=B.S,results=[];
 w.requestAnimationFrame=()=>0;
 const check=(test,passed)=>{results.push({test,passed:!!passed});document.body.dataset.tests=JSON.stringify({total:results.length,failed:results.filter(r=>!r.passed)});document.getElementById('results').textContent=JSON.stringify(results,null,2);};
 const savedWrite=B.Store.write,originalWebGL=w.THREE.WebGLRenderer,errors=[];B.Store.write=()=>true;w.addEventListener('error',e=>errors.push(e.message));
 const snapshot=()=>JSON.stringify({save:s.save,snake:s.snake,lives:s.lives,dir:s.dir,elapsed:s.elapsed});
 try{
  check('Um único HISTÓRIA, depois de CRÉDITOS',[...B.TempleMenu.root.querySelectorAll('.temple-actions button')].map(b=>b.textContent.replace(/◇/g,'').trim()).slice(-2).join('|')==='CRÉDITOS|HISTÓRIA'&&w.document.querySelectorAll('.temple-story').length===1);
  const before=snapshot(),scene=F.scene,camera=F.camera,materials=B.OrganicCharacters.materials;
  w.THREE.WebGLRenderer=function(){throw Error('A história 2D não pode criar um renderer WebGL');};
  check('História carrega desenhos reais',await H.start({manual:true}));
  check('Canvas 2D real, sem cena ou atores 3D',H.renderer.ctx instanceof w.CanvasRenderingContext2D&&!H.scene&&!H.actors&&!B.StoryActors&&!B.StoryWorld);
  check('Seis fundos e onze atlas carregados',H.assets.images.size===17&&[...H.assets.images.values()].every(i=>i.naturalWidth>500));
  check('132 desenhos e recortes válidos',Object.values(B.StoryAtlasBounds).reduce((n,a)=>n+a.cells.length,0)===132&&Object.values(B.StoryAtlasBounds).every(a=>a.cells.every(c=>c.w>2&&c.h>2)));
  check('Narrativa e duração originais preservadas',H.scenes.map(s=>s.id).join(',')==='sleep,shadow,lagoon,cry,journey,flameless,virus,chase,hope,captives'&&H.duration===168);
  H.renderer.domElement.width=480;H.renderer.domElement.height=270;
  await runStoryPlayerTests(w,H,check);
  const draw=t=>H.renderAt(t);
  draw(12);check('Boitatá dormindo com fogo animado',H.state.poses.boitata.expression==='sleep'&&H.state.fire===1&&H.state.artDraws>5);
  draw(23);check('Sombra desenhada aparece',H.state.shadow>.4&&H.state.fire<1);draw(31);check('Corte para preto após a sombra',H.state.black>.9);
  draw(36);const combFrame=H.state.poses.iara.animationFrame;draw(37);
  check('Penteado usa quadros completos distintos',H.state.poses.iara.animationFrame!==combFrame&&H.state.poses.iara.atlas==='iara-comb');
  check('Iara é um desenho inteiro sem membros sobrepostos',H.state.poses.iara.wholeBody&&H.state.poses.iara.bodyDraws===1&&H.state.poses.iara.arms.length===0);
  draw(52);check('Grito interrompe o pente e muda o desenho facial',H.state.poses.iara.mode==='freeze'&&H.state.poses.iara.expression==='fear');
  draw(62);check('Braço se ergue antes da viagem',H.state.poses.iara.mode==='lift'&&H.state.poses.iara.animationFrame>=10&&H.state.poses.iara.atlas==='iara-act');
  draw(68);const flight={...H.state.poses.iara},tail=H.state.poses.iara.tailPhase;draw(72);check('Natação aérea move corpo e cauda',H.state.poses.iara.mode==='swim'&&H.state.poses.iara.x>flight.x&&H.state.poses.iara.tailPhase!==tail);
  const cycle=new Set();for(let i=0;i<12;i++){draw(70+i/12+.01);cycle.add(H.state.poses.iara.animationFrame);}check('Voo usa doze poses desenhadas distintas por ciclo',cycle.size===12&&H.state.poses.iara.drawnCycle);
  const approvedCanvas=w.document.createElement('canvas'),actualCanvas=w.document.createElement('canvas');
  approvedCanvas.width=actualCanvas.width=640;approvedCanvas.height=actualCanvas.height=640;
  const approved=approvedCanvas.getContext('2d',{alpha:false}),flightRenderer=new B.StoryRenderer2D(actualCanvas,H.assets);let flightPixels=true;
  try{for(let i=0;i<12;i++){
   const time=70+i/12+.01,frame=Math.floor(time*12)%12,p=H.assets.sprite('iara-swim','frame'+frame);
   approved.clearRect(0,0,640,640);flightRenderer.ctx.clearRect(0,0,640,640);
   flightRenderer.iara(430,350,.85,time,{mode:'swim',swim:1});
   approved.save();approved.translate(430,350);approved.scale(.85,.85);approved.translate(0,-200);
   approved.drawImage(p.image,p.x,p.y,p.w,p.h,-.74*620,-.18*620,620,620);approved.restore();
   const expected=approved.getImageData(0,0,640,640).data,actual=flightRenderer.ctx.getImageData(0,0,640,640).data;
   flightPixels&&=expected.every((value,index)=>value===actual[index]);
  }}finally{flightRenderer.dispose();}
  check('Doze quadros do voo coincidem pixel a pixel com o desenho e registro aprovados',flightPixels);
  draw(90);check('Boitatá enfraquecido sem fogo e Iara assustada',H.state.fire===0&&H.state.poses.boitata.expression==='weak'&&H.state.poses.iara.expression==='fear');
  draw(102);check('Vírus se materializa com portal desenhado',H.state.portal>0&&H.state.poses.virus.materialize>0);draw(109);const virus=H.state.poses.virus.x;draw(111);check('Fuga usa deslocamento contínuo',H.state.poses.virus.x>virus&&H.state.poses.virus.mode==='flight');
  draw(123);check('Perseguição usa floresta clara e personagens animados',H.state.day>.9&&H.state.poses.boitata.coil===false&&H.state.poses.iara.mode==='swim');
  draw(111.999);const head={...H.state.poses.boitata.head},position={...H.state.poses.iara};draw(112.001);check('Entrada na perseguição preserva posições dos protagonistas',Math.hypot(head.x-H.state.poses.boitata.head.x,head.y-H.state.poses.boitata.head.y)<.1&&Math.hypot(position.x-H.state.poses.iara.x,position.y-H.state.poses.iara.y)<.1);
  draw(134.9);check('Clareira termina em preto',H.state.black>.9);draw(140);check('Frase original com Cinzel Decorative',H.root.querySelector('.story-hope span').textContent==='Que o sistema seja salvo'&&w.getComputedStyle(H.root.querySelector('.story-hope span')).fontFamily.includes('Cinzel Decorative')&&H.state.title>.9&&H.state.black===1);
  draw(149);check('Cuca e Loira presas, ainda imóveis',H.state.poses.cuca.wake===0&&H.state.poses.loira.wake===0);draw(165);check('Cabeças despertam com desenhos de olhos azuis',H.state.poses.cuca.wake>.9&&H.state.poses.cuca.blue>.9&&H.state.poses.loira.close);
  draw(168);check('Último quadro escurece completamente',H.state.black===1);
  let finite=true;const sprites=H.renderer.parts.size;for(let t=0;t<=168;t+=.5){draw(t);finite&&=Number.isFinite(H.renderer.camera.x+H.renderer.camera.y+H.renderer.camera.zoom);}
  check('337 instantes da timeline renderizam sem erro',finite);
  const warmed=H.renderer.parts.size;for(let i=0;i<20;i++)draw(123+i*.016);check('Cache de recortes permanece estável',H.renderer.parts.size===warmed&&warmed>=sprites);
  // Exercise every take at drawing cadence, including both sides of every cut.
  H.renderer.domElement.width=160;H.renderer.domElement.height=90;
  let anatomy=true,frames=0;
  for(let tick=0;tick<=168*24;tick++){
   draw(tick/24);frames++;
   for(const name of ['iara','boitata','cuca','loira']){
    const actor=H.state.poses[name];
    if(actor)anatomy&&=actor.wholeBody&&actor.bodyDraws===1&&Number.isInteger(actor.animationFrame);
   }
   const serpent=H.state.poses.boitata;
   if(serpent)anatomy&&=Number.isFinite(serpent.head.x+serpent.head.y);
  }
  check('4033 quadros: personagens desenhados com corpo inteiro',frames===4033&&anatomy);
  document.body.dataset.animationScan=JSON.stringify({frames,timing:"virtual clock; not an FPS benchmark",resolution:'160x90',cadence:24});
  let reaction=true,previous=-1;
  for(let i=0;i<=50;i++){draw(50.301+i/60);const pose=H.state.poses.iara;reaction&&=pose.atlas==='iara-act'&&pose.animationFrame>=previous&&pose.animationFrame<=3;previous=pose.animationFrame;}
  check('Reação usa quatro desenhos inteiros em ordem',reaction&&previous===3);
  draw(131.999);const direction=H.state.poses.iara.facing;draw(132.001);
  check('Olhar final não inverte o corpo instantaneamente',direction===H.state.poses.iara.facing);
  const bodyPart=H.renderer.part,forbidden=[];
  H.renderer.part=function(character,part,...args){if(['iara','boitata','cuca','loira'].includes(character)&&!part.startsWith('flame')&&part!=='comb')forbidden.push(character+'/'+part);return bodyPart.call(this,character,part,...args);};
  try{for(const time of [12,23,36,52,62,72,90,103,123,132,154,165])draw(time);}finally{H.renderer.part=bodyPart;}
  check('Nenhum take monta cabeça, tronco ou membros separados',forbidden.length===0);
  H.renderer.domElement.width=480;H.renderer.domElement.height=270;
  draw(37);H.togglePause();const paused=H.time;H.manual=false;H.frame(performance.now()+1000);check('Pausa congela a timeline',H.time===paused&&H.paused);H.togglePause();H.manual=true;
  const esc=new w.KeyboardEvent('keydown',{code:'Escape',bubbles:true,cancelable:true});w.document.dispatchEvent(esc);check('ESC funciona sem acionar controles 3D',H.paused&&esc.defaultPrevented);H.togglePause();
  const clock=s.clock;B.Game.frame(performance.now());check('Loop da história suspende atualizações do jogo',s.clock===clock);
  const size=H.renderer.parts.size;H.resize();check('Redimensionar preserva sprites e proporções virtuais',H.renderer.parts.size>=size&&H.renderer.domElement.width>0&&H.renderer.camera.zoom>0);
  let fit=true;for(const [width,height]of [[1920,1080],[1280,800],[430,932]]){H.renderer.resize(width,height);draw(12);const q=H.renderer.viewport;fit&&=q.x>=-.01&&q.y>=-.01&&q.width/q.height===16/9&&q.scale>0;}check('Tela larga e celular mantêm quadro 16:9 sem distorção',fit);
  check('Estado, cena, câmera e materiais do gameplay preservados',snapshot()===before&&F.scene===scene&&F.camera===camera&&B.OrganicCharacters.materials===materials);
  const renderer=H.renderer,assets=H.assets;H.root.querySelector('[data-story="skip"]').click();check('Pular retorna ao menu e libera recursos 2D',!H.active&&s.phase==='menu'&&renderer.disposed&&assets.images.size===0&&!w.document.querySelector('.story-screen'));
  await H.start({manual:true});H.manual=false;H.time=167.99;H.last=performance.now();H.frame(H.last+20);check('Final mantém o último quadro e oferece repetição',H.active&&H.ended&&H.paused&&H.time===H.duration&&!H.endPanel.hidden);H.restart();check('Reiniciar após o fim retoma a história',H.active&&!H.ended&&!H.paused&&H.time===0);H.stop();
  const pending=H.start({manual:true}),session=H.assets;H.stop();check('Pular durante carregamento cancela a sessão sem reabertura',await pending===false&&!H.active&&session.images.size===0&&!w.document.querySelector('.story-screen'));
  const create=B.StoryAssets2D.create;B.StoryAssets2D.create=()=>({load:()=>Promise.reject(Error('Arte de teste indisponível')),release(){}});await H.start({manual:true});check('Arte ausente é informada sem placeholder ou fallback 3D',H.error==='Arte de teste indisponível'&&!H.renderer&&H.root.querySelector('.story-load-error'));H.stop();B.StoryAssets2D.create=create;
  w.THREE.WebGLRenderer=originalWebGL;B.Game.start(1);B.Game.play();B.Renderer.draw(3000);check('Gameplay continua em 3D após a história',s.phase==='playing'&&s.snake.length===5&&F.renderer&&F.renderer.getContext().getError()===0);
  check('Nenhum erro de JavaScript',errors.length===0);
 }catch(error){check(error.stack,false);if(H.active)H.stop();}
 finally{B.Store.write=savedWrite;w.THREE.WebGLRenderer=originalWebGL;document.body.dataset.complete='true';}
};
