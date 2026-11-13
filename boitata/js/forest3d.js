/* Arena WebGL local. Coordenadas da simulação (x,y,z) -> Three (x,z,y).
   Malhas/materiais compartilhados, vegetação instanciada por trechos descartáveis. */
Boitata.Forest3D={
 profiles:{low:{label:'Baixo',height:720,shadow:0,detail:1},medium:{label:'Médio',height:1080,shadow:1024,detail:2},high:{label:'Alto',height:1440,shadow:2048,detail:3},ultra:{label:'Ultra',height:2160,shadow:4096,detail:4}},
 init(){
  if(!window.THREE)return false;
  const T=THREE;this.T=T;this.canvas=document.getElementById('game');
  try{this.renderer=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){console.warn('WebGL indisponível',e);return false;}
  this.scene=new T.Scene();this.scene.background=new T.Color('#c4d9bc');this.scene.fog=new T.Fog('#c4d9bc',65,130);
  this.camera=new T.OrthographicCamera(-28,28,15.75,-15.75,.1,200);
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;
  this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene.add(new T.HemisphereLight('#e1f5ff','#52633a',2.1));
  this.sun=new T.DirectionalLight('#fff0c4',3.2);this.sun.position.set(-12,30,-14);this.scene.add(this.sun);this.scene.add(this.sun.target);
  Object.assign(this.sun.shadow.camera,{left:-32,right:32,top:25,bottom:-25,near:.5,far:100});this.sun.shadow.bias=-.0005;this.sun.shadow.normalBias=.04;
  this.geometries={box:new T.BoxGeometry(1,1,1),sphere:new T.IcosahedronGeometry(1,1),leaf:new T.IcosahedronGeometry(1,1),trunk:new T.CylinderGeometry(.72,1,1,7),tube:new T.CylinderGeometry(1,1,1,8),cone:new T.ConeGeometry(1,1,6)};
  this.materials=new Map();this.chunks=new Map();this.pools=new Map();this.dummy=new T.Object3D();this.color=new T.Color();this.time={value:0};this.head={value:new T.Vector3(-100,0,-100)};
  this.grass=this.texture('grass');this.bark=this.texture('bark');this.stone=this.texture('stone');
  this.quality=(navigator.deviceMemory&&navigator.deviceMemory<=4||navigator.hardwareConcurrency<=4)?'medium':'high';try{const p=localStorage.getItem('boitata-graphics-v1');if(this.profiles[p])this.quality=p;}catch(e){}
  this.setQuality(this.quality);this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.canvas.parentElement);
  this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();Boitata.UI.pause();this.contextLost=true;document.getElementById('graphics-status').textContent='GPU interrompida. Aguarde a recuperação.';});
  this.canvas.addEventListener('webglcontextrestored',()=>{this.contextLost=false;this.clearChunks();});
  this.backdrop=Boitata.ArenaBackdrop?.create(this);this.lastTime=0;this.fps=60;return true;
 },
 renderScene(){if(!this.backdrop?.render())this.renderer.render(this.scene,this.camera);},
 texture(kind){const T=this.T,c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle=kind==='grass'?'#a3b584':kind==='bark'?'#b5a18a':'#b7bfbc';ctx.fillRect(0,0,256,256);
  let seed=kind==='grass'?931:kind==='bark'?175:819;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<6000;i++){const v=Math.floor(90+rand()*155);ctx.fillStyle=`rgba(${v},${v},${v},${.08+rand()*.22})`;const x=Math.floor(rand()*64)*4,y=Math.floor(rand()*64)*4;ctx.fillRect(x,y,kind==='bark'?2:4,kind==='bark'?8+rand()*24:4);}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestMipmapLinearFilter;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());return texture;
 },
 material(color,type='plain'){const key=color+type;if(this.materials.has(key))return this.materials.get(key);const T=this.T;
  const mat=new T.MeshStandardMaterial({color,roughness:type==='loira-metal'?.38:type==='water'?.24:.93,metalness:type==='loira-metal'?.48:type==='water'?.12:0,map:type==='grass'?this.grass:type==='bark'?this.bark:type==='stone'?this.stone:null,flatShading:type!=='loira'&&type!=='loira-light'&&type!=='loira-metal'});
  if(type==='glow'||type==='loira-light'){mat.emissive=new T.Color(color);mat.emissiveIntensity=.65;}
  if(type==='leaf'||type==='water'||type==='bark'){
   mat.transparent=type!=='water';mat.opacity=1;
   mat.onBeforeCompile=shader=>{shader.uniforms.forestTime=this.time;shader.uniforms.forestHead=this.head;
    shader.vertexShader='uniform float forestTime; varying vec3 forestWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(forestTime*1.4+position.y*3.0)*'+(type==='leaf'?'0.035':'0.0')+';');
    shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 fw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nfw=instanceMatrix*fw;\n#endif\nforestWorld=(modelMatrix*fw).xyz;');
    shader.fragmentShader='uniform float forestTime; uniform vec3 forestHead; varying vec3 forestWorld;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+(type!=='water'?'vec3 delta=forestWorld-forestHead; float mask=(1.0-smoothstep(0.8,1.7,abs(delta.x-delta.z)))*step(0.0,delta.x+delta.z)*step(0.7,forestWorld.y); diffuseColor.a *= 1.0-mask*0.82;':'float ripple=sin(forestWorld.x*10.0+forestTime*1.8+sin(forestWorld.z*7.0))*0.5+0.5; diffuseColor.rgb+=vec3(0.08,0.16,0.14)*pow(ripple,18.0);'));
   };
  }this.materials.set(key,mat);return mat;
 },
 setQuality(name){this.quality=this.profiles[name]?name:'high';const p=this.profiles[this.quality];this.renderer.shadowMap.enabled=!!p.shadow;this.sun.castShadow=!!p.shadow;this.sun.shadow.mapSize.set(p.shadow||512,p.shadow||512);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.clearChunks();this.resize();try{localStorage.setItem('boitata-graphics-v1',this.quality);}catch(e){}},
 resize(){const rect=this.canvas.getBoundingClientRect(),p=this.profiles[this.quality],dpr=window.devicePixelRatio||1;
  if(rect.width<=0||rect.height<=0)return;
  // One uniform resolution scale: quality limits pixels, never the camera aspect.
  const scale=Math.min(dpr,3840/rect.width,p.height/rect.height,Math.sqrt((p.height*p.height*16/9)/(rect.width*rect.height)));
  const width=Math.max(1,Math.round(rect.width*scale)),height=Math.max(1,Math.round(rect.height*scale));
  if(this.width!==width||this.height!==height){this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false);this.width=width;this.height=height;}
  this.fitCamera(rect.width/rect.height);
 },
 fitCamera(aspect){
  const T=this.T,c=this.camera,target=new T.Vector3(12,0,9);
  c.position.copy(target).add(new T.Vector3(0,40,Math.hypot(40,40)));c.lookAt(target);c.updateMatrixWorld(true);
  // Fixed finite arena envelope: soil, canopy overhang and tallest actors.
  // Measure in camera space so the 3D elevation stays unchanged with horizontal map edges.
  let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
  const collapse=Boitata.NetworkCollapse?.active();
  const cuca=Boitata.CucaArena?.active();
  const duel=Boitata.S.level?.id===5;
  const finalArena=collapse||cuca;
  const corners=[];
  const include=(xs,ys,zs)=>{for(const x of xs)for(const y of ys)for(const z of zs)corners.push(new T.Vector3(x,z,y));};
  if(finalArena){
   include([0,24],[0,18],[collapse?-1.15:-.04,collapse?.95:.45]);
   if(collapse)include([20.2,22.8],[3.2,5.8],[0,2.55]);
   else include([16,22.5],[8,11],[0,3.6]);
  }else if(duel){
   const arena=Boitata.PvP.arena;
   include([12-arena.width/2-.2,12+arena.width/2+.2],[9-arena.height/2-.2,9+arena.height/2+.2],[-.5,3]);
  }
  else include([-.6,24.6],[-.6,18.6],[-.9,4]);
  for(const point of corners){
   const v=point.applyMatrix4(c.matrixWorldInverse);
   left=Math.min(left,v.x);right=Math.max(right,v.x);bottom=Math.min(bottom,v.y);top=Math.max(top,v.y);
  }
  const cx=(left+right)/2,cy=(bottom+top)/2;
  // Reduce the previous 1.5x zoom by 20%: 1.5 * 0.8 = 1.2x.
  const halfHeight=Math.max((top-bottom)/2,(right-left)/(2*aspect))*(finalArena||duel?1.025:1.01/1.2),halfWidth=halfHeight*aspect;
  // Lift the map by 6% of the viewport without changing world coordinates or zoom.
  const framingY=finalArena||duel?cy:cy-halfHeight*.12;
  c.left=cx-halfWidth;c.right=cx+halfWidth;c.bottom=framingY-halfHeight;c.top=framingY+halfHeight;c.updateProjectionMatrix();
 },
 clearChunks(){if(!this.chunks)return;for(const group of this.chunks.values()){this.scene.remove(group);group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}this.chunks.clear();this.levelId=null;},
 biome(l){return [{grass:'#608b3f',leaf:'#3c783e',water:'#268c8c',soil:'#796044'},{grass:'#80914c',leaf:'#5a823f',water:'#459ba1',soil:'#9a754b'},{grass:'#637f72',leaf:'#396f60',water:'#308d9c',soil:'#6a6d66'},{grass:'#737494',leaf:'#5e708b',water:'#718fd0',soil:'#646277'},{grass:'#81967a',leaf:'#637f68',water:'#5eaaa1',soil:'#807e77'},{grass:'#53645d',leaf:'#46596b',water:'#536c97',soil:'#4b464f'}][Math.floor((l.id-1)/5)];},
 buildChunk(index,l){const T=this.T,b=this.biome(l),batches=new Map(),B=Boitata,s=B.S,hash=(x,y)=>B.Maps.hash(x,y,l),start=index*8;
  const add=(kind,color,x,y,z,sx,sy,sz,type='plain',rotation=0,tilt=0)=>{const key=kind+color+type;if(!batches.has(key))batches.set(key,{kind,color,type,parts:[]});batches.get(key).parts.push({x,y,z,sx,sy,sz,rotation,tilt});};
  add('box',b.soil,start+4,-.48,9,8,.8,18,'stone');
  add('box',b.grass,start+4,-.055,9,8,.12,18,'grass');
  for(let x=start;x<start+8;x++)for(let y=0;y<18;y++){
   const r=hash(x,y),key=x+','+y,solid=s.obstacles.has(key),edge=x===0||x===23||y===0||y===17,kind=edge?B.Maps.borderKind(x,y):solid?B.Maps.kind(x,y,l):null;
   if(r>.67)add('box',r>.85?'#778953':b.grass,x+.5,.012,y+.5,.65,.025,.8,'grass');
   if(kind==='water'){
    add('box','#697d5a',x+.5,.005,y+.5,.99,.05,.99,'stone');add('box',b.water,x+.5,.032,y+.5,1.002,.025,1.002,'water');
    if(!s.obstacles.has(x+','+(y-1))||!B.Maps.pond(x,y-1,l)){
     for(let k=0;k<3;k++)add('sphere','#809a7b',x+.08+k*.37,.12,y+.08,.11,.10,.09,'stone');
     for(let k=0;k<3;k++){add('trunk','#698b45',x+.2+k*.08,.24,y+.12,.018,.48,.018);add('trunk','#91713f',x+.2+k*.08,.45,y+.12,.035,.14,.035);}
    }
    if(r>.55)add('sphere','#4b8958',x+.2,.10,y+.7,.18,.025,.15);continue;
   }
   if(kind==='tree'||edge&&r>.72){
    const tree=(kind,color,px,py,pz,sx,sy,sz,type='plain',rotation=0,tilt=0)=>add(kind,color,x+.5+(px-x-.5)*.72,py*.58,y+.5+(pz-y-.5)*.72,sx*.72,sy*.58,sz*.72,type,rotation,tilt);
    const species=Math.floor(hash(x+34,y)*3),tall=(species===1?1.5:2)+r*(species===2?2:1.3),angle=r*6.28,spread=species===1?.9:.58+r*.32;
    tree('trunk','#78583c',x+.5,tall*.43,y+.5,.29,tall*.86,.29,'bark',angle);
    for(let k=0;k<4;k++){const a=k*1.57+angle;tree('box','#705338',x+.5+Math.cos(a)*.22,.09,y+.5+Math.sin(a)*.22,.42,.15,.12,'bark',-a);}
    for(let k=0;k<3;k++){const a=k*2.1+angle;tree('trunk','#78583c',x+.5+Math.cos(a)*.17,tall*.78,y+.5+Math.sin(a)*.17,.11,.75,.11,'bark',a,.6);}
    for(let k=0;k<5;k++){const a=k*2.4+angle;tree('leaf',k%2?b.leaf:'#548847',x+.5+Math.cos(a)*.35,tall+(k%3)*.27,y+.5+Math.sin(a)*.35,spread,(species===1?.38:.55)+hash(x+k,y)*.4,spread,'leaf',a);}
   }else if(kind==='bush'){
    for(let k=0;k<4;k++)add('leaf',k%2?'#4a7739':'#658c42',x+.3+(k%2)*.37,.35+(k%3)*.1,y+.3+Math.floor(k/2)*.35,.32,.38,.33,'leaf');
    add('trunk','#775537',x+.5,.18,y+.5,.18,.35,.18,'bark');
    add('sphere','#f1c572',x+.27,.76,y+.35,.075,.07,.075);
   }else if(kind==='rock'){
    add('sphere','#809082',x+.48,.35,y+.52,.43,.45,.4,'stone',r*6);add('sphere','#9ba495',x+.25,.18,y+.25,.22,.24,.25,'stone');add('sphere',b.leaf,x+.4,.61,y+.55,.27,.06,.25);
   }else if(kind==='log'){
    add('box','#6f4e35',x+.5,.26,y+.5,.83,.47,.49,'bark',r*.4);add('box','#c2a16a',x+.91,.26,y+.5,.018,.33,.36,'bark',r*.4);add('leaf','#658a42',x+.35,.52,y+.5,.3,.09,.26,'leaf');
   }else{
    const detail=this.profiles[this.quality].detail;
    if(r>.3)for(let k=0;k<detail;k++){const px=x+hash(x+k*3,y+8),py=y+hash(x+12,y+k);add('cone',k%2?'#769f4e':'#53823e',px,.10,py,.045,.20,.045);}
    if(r>.92){add('trunk','#5d893b',x+.23,.12,y+.7,.018,.22,.018);for(let k=0;k<4;k++)add('sphere',r>.96?'#edd18b':'#c59abc',x+.23+Math.cos(k*1.57)*.055,.24,y+.7+Math.sin(k*1.57)*.055,.05,.025,.05);}
    if(r<.07)add('sphere','#989c7b',x+.7,.045,y+.2,.12,.06,.09,'stone');
    if(r>.26&&r<.28){for(let k=0;k<3;k++)add('leaf','#749151',x+.25+k*.12,.12,y+.2,.16,.13,.14,'leaf');}
    if(r>.18&&r<.22)add('box','#b2a16a',x+.4,.026,y+.6,.14,.018,.06,'plain',r*20);
   }
  }
  const group=new T.Group();for(const b of batches.values()){
   const mesh=new T.InstancedMesh(this.geometries[b.kind],this.material(b.color,b.type),b.parts.length);mesh.castShadow=b.type!=='grass'&&b.type!=='water';mesh.receiveShadow=true;
   b.parts.forEach((p,i)=>{this.dummy.position.set(p.x,p.y,p.z);this.dummy.rotation.set(0,p.rotation,p.tilt);this.dummy.scale.set(p.sx,p.sy,p.sz);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);});mesh.computeBoundingSphere();group.add(mesh);
  }this.scene.add(group);this.chunks.set(index,group);
 },
 // Instâncias dinâmicas reutilizadas: os guardiões mantêm seus modelos e animações.
 begin(){for(const pool of this.pools.values())pool.used=0;},
 part(kind,color,x,y,z,sx,sy,sz,rotation=null,type='plain'){
  const key=kind+color+type;let pool=this.pools.get(key);const T=this.T;
  if(!pool){const mesh=new T.InstancedMesh(this.geometries[kind],this.material(color,type),512);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;this.scene.add(mesh);pool={mesh,used:0};this.pools.set(key,pool);}
  if(pool.used>=pool.mesh.instanceMatrix.count){const old=pool.mesh,mesh=new T.InstancedMesh(old.geometry,old.material,old.instanceMatrix.count*2);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.instanceMatrix.array.set(old.instanceMatrix.array);mesh.frustumCulled=false;mesh.castShadow=old.castShadow;mesh.receiveShadow=old.receiveShadow;this.scene.remove(old);old.dispose();this.scene.add(mesh);pool.mesh=mesh;}
  this.dummy.position.set(x,z,y);this.dummy.rotation.set(0,0,0);if(rotation)this.dummy.quaternion.copy(rotation);this.dummy.scale.set(sx,sz,sy);this.dummy.updateMatrix();pool.mesh.setMatrixAt(pool.used++,this.dummy.matrix);
 },
 adapter(cam){const F=this,T=this.T;return {visible:p=>p.x>=cam-16&&p.x<=cam+56,
  ellipsoid(x,y,z,rx,ry,rz,color,type='plain'){if(x<cam-17||x>cam+57)return;F.part('sphere',color,x,y,z,rx,ry,rz,null,type);},
  box(x,y,z,w,h,d,color,type='plain'){F.part('box',color,x+w/2,y+h/2,z+d/2,w,h,d,null,type);},
  tube(a,b,r,color){const v=new T.Vector3(b.x-a.x,b.z-a.z,b.y-a.y),len=v.length();if(!len)return;const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());F.part('tube',color,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r,r,len,q);}
 };},
 animals(m,cam,t,l){const hash=(x,y)=>Boitata.Maps.hash(x,y,l),h=Boitata.S.snake[0]||{x:0,y:9};
  for(let i=0;i<4;i++){
   const type=((i%6)+6)%6,base=i*6+2,y=i%2?15:2,x=base+Math.sin(t*.0005+i)*.32,near=Math.hypot(h.x-x,h.y-y)<3,escape=near?Math.min(1,3-Math.hypot(h.x-x,h.y-y))*.5:0,py=y+(y>9?-escape:escape),hop=Math.max(0,Math.sin(t*.003+i));
   if(type===0||type===2||type===5){const c=type===0?'#9c8058':type===2?'#9c9682':'#6f984c',scale=type===0?1:type===2?.7:.4;
    m.ellipsoid(x,py,.29,.43*scale,.23*scale,.28*scale,c);m.ellipsoid(x+.33*scale,py,.38,.22*scale,.19*scale,.22*scale,c);
    for(const a of [-1,1])for(const b of [-1,1])m.ellipsoid(x+a*.22*scale,py+b*.14*scale,.10+Math.sin(t*.004+a)*.02,.075*scale,.065*scale,.13,c);
    m.ellipsoid(x+.42*scale,py-.13*scale,.47,.025,.025,.025,'#282e25');m.ellipsoid(x+.28*scale,py-.12*scale,.59*scale,.07,.06,.09,c);
    if(type===2)for(let k=0;k<5;k++)m.ellipsoid(x-.23+k*.1,py,.5,.045,.23,.045,'#c2b89a');
    if(type===5)m.tube({x:x-.2,y:py,z:.2},{x:x-.7,y:py+.12,z:.08},.045,c);
   }else if(type===1){const z=.16+hop*.22;m.ellipsoid(x,py,z,.17,.2,.12,'#64a64e');for(const side of [-1,1]){m.ellipsoid(x-.12,py+side*.18,z-.04,.14,.10,.08,'#477538');m.ellipsoid(x+.1,py+side*.1,z+.11,.055,.055,.06,'#cddd7d');m.ellipsoid(x+.14,py+side*.1,z+.12,.025,.025,.025,'#253b28');}}
   else{const z=type===3?2.4+Math.sin(t*.002+i)*.2:1+Math.sin(t*.002+i)*.5,flap=Math.sin(t*.012)*.18;
    m.ellipsoid(x,py,z,.12,.07,.09,type===3?'#688da7':'#e7b658');for(const side of [-1,1])m.ellipsoid(x,py+side*.17,z+flap,.15,.22,.025,type===3?'#395b78':'#e9a96f');
    if(type===3)m.ellipsoid(x+.15,py,z,.07,.05,.04,'#e5ba67');
   }
  }
 },
 draw(t){if(this.contextLost)return;const B=Boitata,s=B.S,l=s.level||BOITATA_LEVELS[0],alpha=s.phase==='playing'?Math.min(1,s.acc/l.stepMs):1,cam=0;
  if(this.levelId!==l.id||this.obstacleSet!==s.obstacles){this.clearChunks();this.levelId=l.id;this.obstacleSet=s.obstacles;this.follow=cam;}
  this.lastTime=t;this.time.value=t*.001;
  // Complete finite terrain is built before the first render, including every edge.
  const collapse=B.NetworkCollapse?.active()?B.NetworkCollapse:null;
  if(Boolean(collapse)!==this.collapseFraming){
   this.collapseFraming=Boolean(collapse);
   const rect=this.canvas.parentElement.getBoundingClientRect();
   if(rect.width&&rect.height)this.fitCamera(rect.width/rect.height);
  }
  if(!collapse)for(let i=0;i<3;i++)if(!this.chunks.has(i))this.buildChunk(i,l);
  const target=new this.T.Vector3(12,0,9);
  this.camera.position.copy(target).add(new this.T.Vector3(0,40,Math.hypot(40,40)));this.camera.lookAt(target);
  this.sun.position.set(2,30,-7);this.sun.target.position.set(12,0,9);this.sun.target.updateMatrixWorld();
  this.begin();const m=this.adapter(cam),path=s.snake.length?B.Characters.points(s,alpha):Array.from({length:10},(_,i)=>({x:12-i,y:9,z:.45}));const head=path[0];this.head.value.set(head.x,head.z,head.y);
  if(l.id===5){if(B.PvP?.active())B.PvP.draw(m,t);}
  else if(!(s.invuln>0&&Math.floor(t/80)%2))B.Characters.get().model(m,collapse?collapse.pose(path):B.GardenMaze?.active()?B.GardenMaze.pose(path):path,t,B.Movement.facing(s,alpha));
  for(const p of s.items)B.Renderer.item(m,p,t);
  for(const e of s.enemies){if(!m.visible(e))continue;const c=['#d45379','#a159b2','#dd9545','#dc4747','#8ead4c'][e.type];m.ellipsoid(e.x+.5,e.y+.5,.55,.30,.30,.34,c);for(let k=0;k<6;k++){const a=k*1.047+t*.001;m.tube({x:e.x+.5,y:e.y+.5,z:.55},{x:e.x+.5+Math.cos(a)*.48,y:e.y+.5+Math.sin(a)*.48,z:.55},.05,c);}for(const v of [-1,1])m.ellipsoid(e.x+.69,e.y+.5+v*.12,.66,.06,.055,.06,'#fff1c5');}
  for(const h of s.hazards){if(m.visible(h)){m.box(h.x+.05,h.y+.05,.04,.9,.9,h.active?.65:.04,h.active?'#f0584c':'#f3ce61');if(!h.active)m.ellipsoid(h.x+.5,h.y+.5,.25+Math.sin(t*.008)*.1,.1,.1,.14,'#ffe28b');}}
  if(s.boss&&!s.boss.defeated&&l.id===30){m.ellipsoid(20,9,1.9,1.5,1.5,1.8,'#632c4e');for(let k=0;k<8;k++){const a=k*.785+t*.001;m.ellipsoid(20+Math.cos(a)*1.5,9+Math.sin(a)*1.5,2,.25,.25,.6,'#c65b77');}m.ellipsoid(19.8,8.5,2.8,.6,.6,.6,'#ff526c');}
  if(collapse)collapse.draw(m,this);else if(l.id!==5){B.VirusVisuals.draw(m,t);this.animals(m,cam,t,l);}
  const max=this.profiles[this.quality].detail*20;for(const p of s.particles.slice(-max))if(m.visible(p))m.ellipsoid(p.x,p.y,.55,.045,.045,.08,p.color);
  for(let k=0;k<(collapse||l.id===2?0:max/2);k++){const leaf=k%4===0,x=1+(k*3.71)%22,y=1+(k*5.17)%16,z=leaf?3.5-(t*.00018+k*.31)%3.3:.5+(t*.00013+k*.31)%2.5;m.ellipsoid(x+Math.sin(t*.001+k)*.12,y,z,leaf?.055:.018,leaf?.025:.018,leaf?.008:.025,leaf?'#a8b867':'#e1d79e');}
  for(const pool of this.pools.values()){pool.mesh.count=pool.used;pool.mesh.instanceMatrix.needsUpdate=true;}
  if(collapse){
   this.collapseBackground||=new this.T.Color('#080e20');
   const background=this.scene.background,fog=this.scene.fog;
   this.scene.background=this.collapseBackground;
   this.scene.fog=null;
   try{this.renderScene();}
   finally{this.scene.background=background;this.scene.fog=fog;}
  }else this.renderScene();
  const wallNow=performance.now();if(this.lastWallTime){const seconds=(wallNow-this.lastWallTime)/1000;if(seconds>0)this.fps=this.fps*.92+Math.min(240,1/seconds)*.08;}this.lastWallTime=wallNow;
  const status=document.getElementById('graphics-status');if(status&&Math.floor(t/500)!==this.statusTick){this.statusTick=Math.floor(t/500);status.textContent=`${this.profiles[this.quality].label} · ${this.width} × ${this.height} · ${Math.round(this.fps)} FPS`;}
 }
};
