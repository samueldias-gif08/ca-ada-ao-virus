document.querySelector('iframe').onload=async event=>{
 const frame=event.target,w=frame.contentWindow,B=w.Boitata,F=B.Forest3D,A=B.ArenaBackdrop,s=B.S,results=[],errors=[];
 const check=(test,passed)=>results.push({test,passed:!!passed});
 w.requestAnimationFrame=()=>0;w.addEventListener('error',e=>errors.push(e.message));B.Store.write=()=>true;s.save=B.Store.defaults();s.save.unlocked=10;
 const wait=()=>new Promise(resolve=>setTimeout(resolve,100));
 const camera=()=>JSON.stringify({position:F.camera.position.toArray(),quaternion:F.camera.quaternion.toArray(),projection:F.camera.projectionMatrix.toArray()});
 const state=()=>JSON.stringify({save:s.save,lives:s.lives,elapsed:s.elapsed,dir:s.dir,snake:s.snake,items:s.items,total:String(s.total),obstacles:[...s.obstacles].sort()});
 const pixels=()=>{const data=new Uint8Array(F.width*F.height*4),gl=F.renderer.getContext();gl.readPixels(0,0,F.width,F.height,gl.RGBA,gl.UNSIGNED_BYTE,data);return data;};
 try{
  check('WebGL e composição externa disponíveis',!!F.renderer&&!!F.backdrop);
  check('Imagem local carregada antes da comparação',await F.backdrop.ready);
  F.setQuality('low');
  check('Imagem tem detalhes e proporção panorâmica',A.image.naturalWidth>1500&&A.image.naturalWidth/A.image.naturalHeight>1.5);
  for(const id of [1,2,3,4,5,8,9,10]){
   B.Game.start(id);B.Game.play();F.backdrop.enabled=false;F.draw(1000);F.draw(1000);
   const projection=camera(),simulation=state(),children=F.scene.children.length,background=F.scene.background,fog=F.scene.fog,before=pixels();
   // The existing maze marker advances its angle per draw, independently of t.
   // Undo that next increment so both images represent the exact same pose.
   if(id===8&&B.GardenMaze.marker)B.GardenMaze.marker.rotation.y-=.015;
   F.backdrop.enabled=true;F.draw(1000);const after=pixels(),bounds=F.backdrop.bounds;let protectedDiff=0,outsideDiff=0,interior=0;
   for(let y=1;y<F.height-1;y++)for(let x=1;x<F.width-1;x++){
    const index=(y*F.width+x)*4,inside=(x+.5)/F.width>bounds.left+.002&&(x+.5)/F.width<bounds.right-.002&&(y+.5)/F.height>bounds.bottom+.002&&(y+.5)/F.height<bounds.top-.002;
    const delta=Math.max(Math.abs(before[index]-after[index]),Math.abs(before[index+1]-after[index+1]),Math.abs(before[index+2]-after[index+2]));
    if(inside){interior++;if(delta>1)protectedDiff++;}else if(delta>8)outsideDiff++;
   }
   check('Setor '+id+': pixels do interior preservados',interior>100&&protectedDiff===0);
   check('Setor '+id+': região externa recebe imagem tecnológica',outsideDiff>100);
   check('Setor '+id+': câmera e dimensões não mudam',camera()===projection&&s.level.width===24&&s.level.height===18);
   check('Setor '+id+': simulação, materiais de fundo e névoa preservados',state()===simulation&&F.scene.children.length===children&&F.scene.background===background&&F.scene.fog===fog&&F.renderer.autoClear===true);
   check('Setor '+id+': nenhum erro WebGL',F.renderer.getContext().getError()===0);
   if(protectedDiff)results.push({test:'Diagnóstico de pixels '+id,passed:false,protectedDiff,interior,outsideDiff,bounds:{...bounds}});
   await wait();
  }
  B.Game.start(2);B.Game.play();
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[3840,2160],[900,1200],[2400,900]]){
   frame.style.width=width+'px';frame.style.height=height+'px';await wait();F.resize();F.backdrop.enabled=false;F.draw(2000);const original=camera();F.backdrop.enabled=true;F.draw(2000);
   const cover=A.cover(F.width,F.height),sourceAspect=A.image.naturalWidth*cover.w/(A.image.naturalHeight*cover.h),view=F.canvas.getBoundingClientRect();
   check(width+' × '+height+': cover sem distorção e buffer proporcional',Math.abs(sourceAspect-F.width/F.height)<.001&&Math.abs(F.width/F.height-view.width/view.height)<.015);
   check(width+' × '+height+': enquadramento original preservado',camera()===original&&F.renderer.getContext().getError()===0);
  }
  frame.style.width='960px';frame.style.height='720px';await wait();F.resize();B.Game.start(1);B.Game.play();F.draw(3000);
  const version=F.backdrop.texture.version,texture=F.backdrop.texture,geometry=F.backdrop.geometry;for(let i=0;i<12;i++)F.draw(3000+i*16);
  check('Textura e geometria do fundo são reutilizadas por frame',F.backdrop.texture===texture&&F.backdrop.geometry===geometry&&texture.version===version);
  const marks={};for(const enabled of [false,true]){F.backdrop.enabled=enabled;F.draw(3200);const start=performance.now();for(let i=0;i<5;i++){F.draw(3200+i*16);pixels();}marks[enabled?'withBackdropMs':'withoutBackdropMs']=performance.now()-start;}
  document.body.dataset.performance=JSON.stringify({...marks,resolution:F.width+'x'+F.height,frames:5,renderer:'SwiftShader/headless; not a hardware FPS guarantee'});F.backdrop.enabled=true;
  B.UI.pause();check('Botões permanecem interativos após composição',s.phase==='paused'&&B.UI.$('overlay').querySelectorAll('button').length>0);B.UI.$('overlay').querySelector('button').click();check('Continuar mantém o jogo funcionando',s.phase==='playing');
  B.UI.menu();const frames=F.backdrop.frames;F.draw(4000);check('Menu não recebe a camada tecnológica',!A.active()&&F.backdrop.frames===frames&&!!B.TempleMenu.root);
  B.Game.start(10);B.Game.play();s.collapse.charged=true;s.collapse.recovery=1;s.phase='restoring';F.backdrop.enabled=false;F.draw(5000);const original=pixels();F.backdrop.enabled=true;F.draw(5000);const revised=pixels(),bounds=F.backdrop.bounds;let holesPreserved=true;
  for(let y=Math.ceil(Math.max(0,bounds.bottom)*F.height)+2;y<Math.min(F.height,Math.floor(bounds.top*F.height))-2;y+=5)for(let x=Math.ceil(Math.max(0,bounds.left)*F.width)+2;x<Math.min(F.width,Math.floor(bounds.right*F.width))-2;x+=5){const i=(y*F.width+x)*4;for(let c=0;c<3;c++)holesPreserved&&=Math.abs(original[i+c]-revised[i+c])<=1;}
  check('Espaços da fase final permanecem com o fundo original durante restauração',holesPreserved);
  const fallback=w.document.createElement('canvas');fallback.width=1200;fallback.height=540;const ctx=fallback.getContext('2d');ctx.fillStyle='#06111c';ctx.fillRect(0,0,1200,540);s.level=w.BOITATA_LEVELS[0];s.phase='playing';A.draw2D(ctx,new B.Mesh(ctx,{arena:true}));const center=ctx.getImageData(600,270,1,1).data;
  check('Fallback Canvas 2D protege o interior original',center[0]===6&&center[1]===17&&center[2]===28);
  check('Nenhum erro de JavaScript',errors.length===0);
 }catch(error){check(error.stack,false);}
 document.body.dataset.tests=JSON.stringify({total:results.length,failed:results.filter(r=>!r.passed)});document.body.dataset.complete='true';document.querySelector('#results').textContent=JSON.stringify(results,null,2);
};
