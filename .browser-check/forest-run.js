window.addEventListener('error',e=>document.body.dataset.error=e.message);
(() => {
 const B=Boitata,F=B.Forest3D,results=[...runBoitataTests(),...runCharacterTests(),...runForestTests()];
 const check=(test,passed)=>results.push({test,passed:!!passed});
 check('WebGL inicializado',!!F.renderer);
 if(F.renderer){
  const rect=F.canvas.getBoundingClientRect.bind(F.canvas),dpr=window.devicePixelRatio||1;
  F.canvas.getBoundingClientRect=()=>({width:3840/dpr,height:2160/dpr});
  for(const [key,p]of Object.entries(F.profiles)){F.setQuality(key);check('Resolução '+p.label,F.width===p.height*16/9&&F.height===p.height);}
  F.canvas.getBoundingClientRect=rect;F.setQuality('high');
  check('Câmera ortográfica verdadeira',F.camera.isOrthographicCamera);
 }
 B.Store.key='boitata-graphics-test';B.S.save=B.Store.defaults();B.S.save.unlocked=30;
 B.Game.start(1);B.S.phase='paused';B.UI.close();
 B.S.snake=B.S.snake.map(p=>({...p,x:p.x+20}));B.S.oldSnake=B.S.snake.map(p=>({...p}));B.S.camera=B.S.oldCamera=20;
 if(new URLSearchParams(location.search).get('character')==='iara')B.S.save.character='iara';
 for(let i=0;i<12;i++)B.Renderer.draw(1000+i*16);
 if(F.renderer){check('Instâncias de vegetação presentes',F.chunks.size>=8);check('Inclinação isométrica 35,264°',Math.abs(F.camera.position.y/Math.hypot(F.camera.position.x-F.follow-17,F.camera.position.z-8.5)-1/Math.sqrt(2))<.0001);check('Sem erro de GPU',F.renderer.getContext().getError()===0);}
 document.body.dataset.tests=JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,failed:results.filter(r=>!r.passed),calls:F.renderer?.info.render.calls,triangles:F.renderer?.info.render.triangles,programs:F.renderer?.info.programs.map(p=>p.diagnostics?.runnable)});
 const output=document.createElement('pre');output.id='test-output';output.textContent=document.body.dataset.tests;document.body.append(output);
})();
