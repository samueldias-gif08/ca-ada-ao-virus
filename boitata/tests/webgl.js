/* Testes opt-in no navegador. Não escreve no save real. */
window.addEventListener('error',e=>document.body.dataset.error=e.message);
(() => {
 const B=Boitata,F=B.Forest3D,results=[...runBoitataTests(),...runCharacterTests(),...runForestTests(),...runMovementTests(),...runChaseTests(),...runArenaTests(),...runRedesignTests()];
 const check=(test,passed)=>results.push({test,passed:!!passed});
 check('WebGL inicializado',!!F.renderer);
 if(F.renderer){
  const rect=F.canvas.getBoundingClientRect.bind(F.canvas),dpr=window.devicePixelRatio||1;
  F.canvas.getBoundingClientRect=()=>({width:3840/dpr,height:2160/dpr});
  for(const [key,p]of Object.entries(F.profiles)){F.setQuality(key);const size=F.renderer.getDrawingBufferSize(new THREE.Vector2());check('Resolução '+p.label,F.width===p.height*16/9&&F.height===p.height&&size.x===F.width&&size.y===F.height);}
  F.canvas.getBoundingClientRect=rect;F.setQuality('high');check('Câmera ortográfica verdadeira',F.camera.isOrthographicCamera);
 }
 B.Store.key='boitata-graphics-test';B.S.save=B.Store.defaults();B.S.save.unlocked=30;
 B.Game.start(1);B.S.phase='paused';B.UI.close();
 B.S.oldSnake=B.S.snake.map(p=>({...p}));B.S.camera=B.S.oldCamera=0;
 const params=new URLSearchParams(location.search);B.S.save.character=(params.get('character')||F.canvas?.dataset.testCharacter)==='iara'?'iara':'boitata';
 if(F.renderer){
  for(let i=0;i<12;i++)B.Renderer.draw(1000+i*16);
  check('Instâncias de vegetação presentes',F.chunks.size===3);
  check('Inclinação isométrica 35,264°',Math.abs(F.camera.position.y/Math.hypot(F.camera.position.x-12,F.camera.position.z-9)-1/Math.sqrt(2))<.0001);
  const orientation=F.camera.getWorldDirection(new THREE.Vector3());check('Mapa horizontal, profundidade 3D preservada',Math.abs(orientation.x)<.0001&&orientation.y<0&&orientation.z<0);
  check('Sem erro de GPU',F.renderer.getContext().getError()===0);
  check('Água animada usa material próprio',[...F.materials.keys()].some(key=>key.endsWith('water')));
  check('Material de copas com transparência',[...F.materials.values()].some(mat=>mat.transparent));
  const first=B.Characters.get().id;B.S.save.character=first==='iara'?'boitata':'iara';B.Renderer.draw(1250);check('Outro guardião renderiza sem erro WebGL',F.renderer.getContext().getError()===0);B.S.save.character=first;
  const phase=B.S.phase;B.UI.graphics();const buttons=[...B.UI.$('overlay').querySelectorAll('button')];buttons.at(-1).click();check('Preferências preservam o estado da missão',B.S.phase===phase&&B.UI.$('overlay').classList.contains('hidden'));
  const saved={...B.S};
  for(const [code,dx,dy]of [['KeyA',1,0],['KeyS',-1,0],['KeyZ',0,1],['KeyW',0,-1]]){
   const dir=dx?{x:0,y:1}:{x:1,y:0};Object.assign(B.S,{phase:'playing',dir,oldDir:{...dir},pending:[],snake:Array.from({length:5},(_,i)=>({x:12-dir.x*i,y:9-dir.y*i})),camera:0});
   const event=new KeyboardEvent('keydown',{code,key:'unrelated',bubbles:true,cancelable:true});document.dispatchEvent(event);const n=B.Movement.next();B.Movement.advance(n,false);
   check('Evento de teclado real '+code,event.defaultPrevented&&n.x===12+dx&&n.y===9+dy);
  }
  for(const phase of ['paused','quiz']){B.S.phase=phase;B.S.pending=[];const event=new KeyboardEvent('keydown',{code:'KeyZ',bubbles:true,cancelable:true});document.dispatchEvent(event);check('Teclado real bloqueado em '+phase,event.defaultPrevented&&B.S.pending.length===0);}
  check('Quatro controles de toque correspondem ao teclado',document.querySelectorAll('[data-code]').length===4);
  Object.assign(B.S,saved);const position=F.camera.position.clone();B.S.camera=B.S.oldCamera=10;B.Renderer.draw(1300);check('Câmera WebGL fixa durante retorno',F.camera.position.equals(position));Object.assign(B.S,saved);B.Renderer.draw(1);check('Câmera não salta após reinício do relógio',F.camera.position.equals(position));
  check('Predador pode surgir no cenário 3D',B.PredatorVirus.spawn());B.PredatorVirus.update(2);B.Renderer.draw(16);B.UI.chaseHud();check('Dois modelos de vírus renderizam sem erro WebGL',F.renderer.getContext().getError()===0);
  check('Sem cargas ou módulo de teletransporte',!document.getElementById('teleports-left')&&!B.Teleport);
  check('Aviso de perseguição aparece',document.getElementById('chase-notice').textContent.includes('CAÇANDO'));
  check('Alvo dentro da visão não é descartado pela janela antiga',F.adapter(B.S.camera).visible(B.FugitiveVirus.point()));
  check('Envelopes amarelos renderizados em WebGL',F.pools.get('box#ffda49plain')?.used>0);
  const longPath=Array.from({length:360},(_,i)=>({x:2+i%20,y:2+Math.floor(i/20)%14,z:.45}));
  F.begin();B.Characters.get('iara').model(F.adapter(0),longPath,100,{x:1,y:0});
  const hairPools=[F.pools.get('tube#123c59plain'),F.pools.get('tube#206980plain')];
  check('Cabelo muito longo renderiza todas as ligações sem limite de 512',hairPools.reduce((n,p)=>n+(p?.used||0),0)===3*(longPath.length-1)&&hairPools.every(p=>p.mesh.instanceMatrix.count>=p.used));
  B.Renderer.draw(50);
  check('Modelo do Fugitivo gerou instâncias',F.pools.get('box#7ee848plain')?.used>0);check('Modelo do Predador gerou instâncias',F.pools.get('box#7f243dplain')?.used>0);
 }
 const summary={passed:results.filter(r=>r.passed).length,total:results.length,failed:results.filter(r=>!r.passed),calls:F.renderer?.info.render.calls,triangles:F.renderer?.info.render.triangles};
 document.body.dataset.tests=JSON.stringify(summary);const output=document.createElement('pre');output.id='test-output';output.style='white-space:pre-wrap;margin:20px;color:#d7eccd';output.textContent=results.map(r=>(r.passed?'✓ ':'✗ ')+r.test).join('\n')+'\n'+JSON.stringify(summary);document.body.append(output);
})();
