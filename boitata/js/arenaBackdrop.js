/* Independent exterior composition. No terrain, camera or simulation changes. */
(() => {
 'use strict';const B=Boitata,image=new Image(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const A=B.ArenaBackdrop={image,error:null,ready:null,
  active(){return !!B.S.level&&document.body.classList.contains('arena-active')&&B.S.phase!=='menu'&&!B.Story?.active;},
  envelope(){
   const level=B.S.level?.id,duel=level===5&&B.PvP?.arena,width=duel?duel.width*23.4/24:24,depth=duel?duel.height*17.4/18:18;
   // Protect the existing floor, not empty sky above actors. Foreground trees,
   // buildings and characters are subsequently drawn in front without clipping.
   // The aquatic level additionally protects its complete translucent volume.
   return {left:12-width/2,right:12+width/2,back:9-depth/2,front:9+depth/2,
    bottom:level===10?-1.16:level===8?-.13:level===4||level===9?-.05:duel?-.35:-.9,top:level===2?4.8:duel?.065:.03};
  },
  points(){const e=this.envelope(),points=[];for(const x of [e.left,e.right])for(const y of [e.back,e.front])for(const z of [e.bottom,e.top])points.push({x,y,z});return points;},
  cover(width,height){const screen=width/height,aspect=image.naturalWidth/image.naturalHeight;return screen>aspect?{x:0,y:(1-aspect/screen)/2,w:1,h:aspect/screen}:{x:(1-screen/aspect)/2,y:0,w:screen/aspect,h:1};},
  create(forest){return new ExteriorPass(forest);},
  draw2D(ctx,mesh){
   if(!this.active()||!image.naturalWidth)return;
   const width=ctx.canvas.width,height=ctx.canvas.height,points=this.points().map(p=>mesh.project(p)),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),cover=this.cover(width,height);
   ctx.save();ctx.beginPath();ctx.rect(0,0,width,height);ctx.rect(left,top,right-left,bottom-top);ctx.clip('evenodd');
   ctx.globalAlpha=1;ctx.drawImage(image,cover.x*image.naturalWidth,cover.y*image.naturalHeight,cover.w*image.naturalWidth,cover.h*image.naturalHeight,0,0,width,height);
   ctx.strokeStyle='#c0c0c033';ctx.lineWidth=1;ctx.shadowColor='#00a878';ctx.shadowBlur=14;ctx.strokeRect(left-.5,top-.5,right-left+1,bottom-top+1);ctx.restore();
  }
 };
 A.ready=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>{A.error='Fundo tecnológico indisponível';resolve(false);};});
 image.src=new URL('assets/backgrounds/circuit-board.png',document.baseURI).href;
 class ExteriorPass{
  constructor(forest){
   this.forest=forest;this.enabled=true;this.loaded=false;this.disposed=false;this.frames=0;
   this.ready=A.ready.then(ok=>{if(!ok||this.disposed)return false;this.initialize();this.loaded=true;return true;});
  }
  initialize(){
   const F=this.forest,T=F.T;
   this.texture=new T.Texture(image);this.texture.colorSpace=T.SRGBColorSpace;this.texture.needsUpdate=true;
   this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,.1,10);this.camera.position.z=1;
   this.uniforms={exteriorBounds:{value:new T.Vector4()},exteriorResolution:{value:new T.Vector2()},exteriorTime:{value:0},exteriorSilver:{value:new T.Color('#c0c0c0')},exteriorGreen:{value:new T.Color('#00a878')}};
   this.material=new T.MeshBasicMaterial({map:this.texture,depthTest:false,depthWrite:false,toneMapped:false});
   this.material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,this.uniforms);
    shader.fragmentShader='uniform vec4 exteriorBounds;\nuniform vec2 exteriorResolution;\nuniform float exteriorTime;\nuniform vec3 exteriorSilver;\nuniform vec3 exteriorGreen;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
     vec2 exteriorPoint=gl_FragCoord.xy/exteriorResolution;
     if(all(greaterThanEqual(exteriorPoint,exteriorBounds.xy))&&all(lessThanEqual(exteriorPoint,exteriorBounds.zw))) discard;
     vec2 exteriorDelta=max(max(exteriorBounds.xy-exteriorPoint,exteriorPoint-exteriorBounds.zw),vec2(0.0))*exteriorResolution;
     float exteriorDistance=length(exteriorDelta);
     float exteriorRim=1.0-smoothstep(0.0,1.5,exteriorDistance);
     float exteriorHalo=1.0-smoothstep(0.0,18.0,exteriorDistance);
     diffuseColor.rgb*=0.94+0.025*sin(exteriorTime*0.65+vMapUv.x*6.283+vMapUv.y*8.0);
     diffuseColor.rgb*=1.0-0.18*(1.0-smoothstep(0.0,28.0,exteriorDistance));
     diffuseColor.rgb+=exteriorGreen*exteriorHalo*0.07;
     diffuseColor.rgb=mix(diffuseColor.rgb,exteriorSilver,exteriorRim*0.18);
    `);
   };
   this.geometry=new T.PlaneGeometry(2,2);this.scene.add(new T.Mesh(this.geometry,this.material));this.clearColor=new T.Color();this.point=new T.Vector3();this.bounds={left:0,right:1,bottom:0,top:1};
  }
  update(){
   const F=this.forest,camera=F.camera,width=F.width,height=F.height;
   camera.updateMatrixWorld(true);let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
   for(const p of A.points()){const v=this.point.set(p.x,p.z,p.y).project(camera);left=Math.min(left,(v.x+1)/2);right=Math.max(right,(v.x+1)/2);bottom=Math.min(bottom,(v.y+1)/2);top=Math.max(top,(v.y+1)/2);}
   Object.assign(this.bounds,{left,right,bottom,top});this.uniforms.exteriorBounds.value.set(left,bottom,right,top);this.uniforms.exteriorResolution.value.set(width,height);this.uniforms.exteriorTime.value=reducedMotion.matches?0:B.S.elapsed||0;
   const cover=A.cover(width,height);this.texture.repeat.set(cover.w,cover.h);this.texture.offset.set(cover.x,cover.y);
  }
  render(){
   if(!this.enabled||!this.loaded||this.disposed||!A.active())return false;
   const F=this.forest,renderer=F.renderer,scene=F.scene,background=scene.background,autoClear=renderer.autoClear,alpha=renderer.getClearAlpha();renderer.getClearColor(this.clearColor);
   this.update();
   try{
    // The original clear color remains inside the projected floor / water volume,
    // including transparent water and missing platforms. Artwork is drawn only
    // outside it, then ALL original geometry is drawn in front with normal depth.
    renderer.autoClear=false;renderer.setClearColor(background?.isColor?background:this.clearColor,1);renderer.clear(true,true,true);
    renderer.render(this.scene,this.camera);scene.background=null;renderer.render(scene,F.camera);this.frames++;
   }finally{scene.background=background;renderer.autoClear=autoClear;renderer.setClearColor(this.clearColor,alpha);}
   return true;
  }
  dispose(){this.disposed=true;this.texture?.dispose();this.material?.dispose();this.geometry?.dispose();}
 }
})();
