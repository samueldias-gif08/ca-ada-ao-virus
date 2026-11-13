/* Visual-only character atelier. Simulation coordinates and collision trails are never written.
   Swept elliptical surfaces have persistent buffers; only growth can increase capacity. */
(() => {
 'use strict';
 const B=Boitata,F=B.Forest3D,T=window.THREE;if(!T)return;
 const V=B.OrganicCharacters={surfaces:new Map(),materials:new Map(),textures:new Map(),used:new Set()};
 const vec=p=>new T.Vector3(p.x,p.z,p.y);
 V.texture=function(kind){
  if(this.textures.has(kind))return this.textures.get(kind);
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  g.fillStyle='#aaa';g.fillRect(0,0,256,256);g.lineWidth=2;
  if(kind==='scale')for(let y=-16;y<272;y+=16)for(let x=-16;x<272;x+=24){g.fillStyle=`rgb(${130+(x+y+512)%55},${130+(x+y+512)%55},${130+(x+y+512)%55})`;g.beginPath();g.ellipse(x+(y%32?12:0),y,11,14,0,0,Math.PI*2);g.fill();g.strokeStyle='#696969';g.stroke();}
  else for(let i=0;i<256;i++){g.strokeStyle=i%3?'#b4b4b4':'#777';g.beginPath();g.moveTo(i,0);g.bezierCurveTo(i+3,80,i-3,180,i,256);g.stroke();}
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;this.textures.set(kind,tex);return tex;
 };
 V.mat=function(color,kind='skin'){
  const key=color+kind;if(this.materials.has(key))return this.materials.get(key);
  const textured=['scale','hair','cloth'].includes(kind),tex=textured?this.texture(kind==='scale'?'scale':'strand'):null;
  const m=new T.MeshStandardMaterial({color,roughness:kind==='hair'?.50:kind==='scale'?.62:kind==='metal'?.3:kind==='cloth'?.88:.66,metalness:kind==='metal'?.65:0,bumpMap:tex,bumpScale:kind==='scale'?.055:.008,roughnessMap:tex,map:kind==='scale'?tex:null});
  // Iara's warm skin keeps a soft highlight without changing other guardians.
  if(kind==='skin'&&(color==='#c88f6b'||color==='#d7a47f')){m.roughness=.56;m.side=T.DoubleSide;}
  if(kind==='eye'||kind==='glow'){m.emissive.set(color);m.emissiveIntensity=kind==='eye'?.45:.28;m.roughness=.22;}
  if(kind==='ghost'){m.transparent=true;m.opacity=.9;m.depthWrite=true;}
  this.materials.set(key,m);return m;
 };
 // A transported frame avoids joints, open cylinder ends and sudden twists on vertical locks.
 V.sweep=function(key,points,radii,color,kind='skin',options={}){
  key=(this.prefix||'')+key;
  this.used.add(key);let item=this.surfaces.get(key);const steps=options.steps||Math.max(12,(points.length-1)*6),sides=options.sides||12,required=(steps+1)*(sides+1);
  if(!item||item.capacity<required){
   const capacity=Math.max(required,item?item.capacity*2:0),geo=new T.BufferGeometry();
   geo.setAttribute('position',new T.BufferAttribute(new Float32Array(capacity*3),3).setUsage(T.DynamicDrawUsage));
   geo.setAttribute('normal',new T.BufferAttribute(new Float32Array(capacity*3),3).setUsage(T.DynamicDrawUsage));
   geo.setAttribute('uv',new T.BufferAttribute(new Float32Array(capacity*2),2));
   const indices=new Uint32Array(Math.ceil(capacity/(sides+1))*sides*6);geo.setIndex(new T.BufferAttribute(indices,1));
   const mesh=new T.Mesh(geo,this.mat(color,kind));mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
   if(item){F.scene.remove(item.mesh);item.mesh.geometry.dispose();}F.scene.add(mesh);item={mesh,capacity};this.surfaces.set(key,item);
  }
  const geo=item.mesh.geometry,pos=geo.attributes.position,norm=geo.attributes.normal,uv=geo.attributes.uv,idx=geo.index;
  item.curve??=new T.CatmullRomCurve3([],false,'centripetal');
  const curve=item.curve;while(curve.points.length<points.length)curve.points.push(new T.Vector3());curve.points.length=points.length;
  points.forEach((q,i)=>curve.points[i].set(q.x,q.z,q.y));
  item.frame??=Array.from({length:5},()=>new T.Vector3());
  const [p,tangent,normal,binormal,up]=item.frame;up.set(0,1,0);
  for(let i=0;i<=steps;i++){
   const u=i/steps;curve.getPoint(u,p);curve.getTangent(u,tangent);
   normal.crossVectors(up,tangent);if(normal.lengthSq()<.001)normal.set(1,0,0);normal.normalize();binormal.crossVectors(tangent,normal).normalize();
   const rr=u*(radii.length-1),ri=Math.min(radii.length-2,Math.floor(rr)),f=rr-ri;
   let radius=radii[ri]*(1-f)+radii[ri+1]*f;
   for(let j=0;j<=sides;j++){
    const a=j/sides*Math.PI*2,fold=options.folds?1+Math.sin(a*options.folds+u*.5)*.065:1;
    const nx=normal.x*Math.cos(a)+binormal.x*Math.sin(a),ny=normal.y*Math.cos(a)+binormal.y*Math.sin(a),nz=normal.z*Math.cos(a)+binormal.z*Math.sin(a);
    const k=i*(sides+1)+j;pos.setXYZ(k,p.x+nx*radius*fold,p.y+ny*radius*fold*(options.flatten||1),p.z+nz*radius*fold);
    norm.setXYZ(k,nx,ny/(options.flatten||1),nz);uv.setXY(k,j/sides*(kind==='scale'?4:1),u*(options.repeat||points.length));
    if(i<steps&&j<sides){const at=(i*sides+j)*6;idx.setX(at,k);idx.setX(at+1,k+1);idx.setX(at+2,k+sides+1);idx.setX(at+3,k+1);idx.setX(at+4,k+sides+2);idx.setX(at+5,k+sides+1);}
   }
  }
  geo.setDrawRange(0,steps*sides*6);pos.needsUpdate=norm.needsUpdate=uv.needsUpdate=idx.needsUpdate=true;
  item.mesh.material=this.mat(color,kind);item.mesh.visible=true;return item.mesh;
 };
 V.oval=function(key,p,size,color,kind='skin'){
  key=(this.prefix||'')+key;
  this.used.add(key);let item=this.surfaces.get(key);
  if(!item){const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),this.mat(color,kind));mesh.castShadow=mesh.receiveShadow=true;F.scene.add(mesh);item={mesh,capacity:Infinity};this.surfaces.set(key,item);}
  item.mesh.position.set(p.x,p.z,p.y);item.mesh.scale.set(size[0],size[2],size[1]);item.mesh.material=this.mat(color,kind);item.mesh.visible=true;return item.mesh;
 };
 V.face=function(key,p,skin,eye,t){
  if(key==='i-'){
   this.sweep(key+'head',[p(0,.005,1.215),p(0,.008,1.25),p(0,0,1.31),p(0,-.008,1.40),p(0,-.012,1.49),p(0,-.015,1.57),p(0,-.018,1.625),p(0,-.018,1.64)],[.018,.050,.088,.125,.129,.108,.056,.002],skin,'skin',{steps:32,sides:28});
   this.sweep(key+'nose',[p(0,.132,1.475),p(0,.160,1.415),p(0,.176,1.386),p(0,.151,1.372)],[.012,.016,.022,.009],skin,'skin',{steps:16,sides:12});
   this.sweep(key+'lip',[p(-.048,.121,1.326),p(-.019,.147,1.335),p(0,.151,1.329),p(.019,.147,1.335),p(.048,.121,1.326)],[.002,.007,.006,.007,.002],'#a45e67','skin',{steps:20,sides:10});
   this.sweep(key+'lipLower',[p(-.044,.125,1.323),p(0,.150,1.316),p(.044,.125,1.323)],[.002,.009,.002],'#bc7880','skin',{steps:12,sides:10});
   for(const s of [-1,1]){
    this.oval(key+'socket'+s,p(s*.061,.112,1.465),[.043,.017,.028],'#72514e');
    this.oval(key+'eye'+s,p(s*.061,.127,1.465),[.038,.014,.024],'#f3eee1');
    this.oval(key+'iris'+s,p(s*.060,.140,1.466),[.018,.007,.021],eye,'eye');
    this.oval(key+'pupil'+s,p(s*.060,.146,1.466),[.008,.004,.016],'#102c31');
    this.oval(key+'catch'+s,p(s*.055,.150,1.475),[.005,.002,.006],'#ffffff','eye');
    this.sweep(key+'brow'+s,[p(s*.025,.123,1.514),p(s*.059,.127,1.529),p(s*.099,.096,1.519)],[.003,.006,.002],'#352b29','skin',{steps:12,sides:8});
    this.sweep(key+'eyeLid'+s,[p(s*.026,.130,1.469),p(s*.059,.141,1.491),p(s*.096,.111,1.473)],[.002,.004,.001],'#634a40','skin',{steps:12,sides:6});
   }
   return;
  }
  // One sculpted cranial surface, tapered chin, cheek volume and brow, rather than a sphere face.
  const levels=[[1.21,.035],[1.24,.095],[1.30,.145],[1.40,.18],[1.52,.17],[1.61,.13],[1.64,.015]];
  this.sweep(key+'head',levels.map(([z])=>p(0,0,z)),levels.map(q=>q[1]),skin,'skin',{flatten:1,steps:28,sides:24});
  this.sweep(key+'nose',[p(0,.127,1.47),p(0,.19,1.40),p(0,.184,1.37)],[.023,.029,.012],skin);
  this.sweep(key+'lip',[p(-.06,.127,1.32),p(0,.157,1.325),p(.06,.127,1.32)],[.006,.014,.006],'#9b5860');
  for(const s of [-1,1]){
   this.oval(key+'socket'+s,p(s*.074,.131,1.465),[.052,.025,.034],'#493e43');
   this.oval(key+'eye'+s,p(s*.074,.151,1.465),[.035,.014,.023],'#f1e6d7');
   this.oval(key+'iris'+s,p(s*.074,.164,1.465),[.016,.009,.020],eye,'eye');
   this.oval(key+'pupil'+s,p(s*.074,.172,1.465),[.007,.004,.015],'#10232a');
   this.oval(key+'catch'+s,p(s*.069,.177,1.474),[.005,.003,.005],'#ffffff','eye');
   this.sweep(key+'brow'+s,[p(s*.03,.143,1.52),p(s*.075,.147,1.535),p(s*.122,.109,1.52)],[.008,.014,.005],'#544436');
  }
 };
 V.hair=function(key,p,t,color,length=1,volume=1,straight=false){
  this.sweep(key+'cap',[p(0,-.045,1.55),p(0,-.03,1.61),p(0,-.025,1.66),p(0,-.025,1.70+.055*(volume-1))],[.17*volume,.18*volume,.13*volume,.003],color,'hair',{steps:16,sides:24});
  for(let i=0;i<14;i++){
   const a=.10+i/13*(Math.PI-.20),side=Math.cos(a),back=-Math.sin(a),wave=straight?0:Math.sin(t*.0018+i)*.035;
   const lowerSide=straight?side*.21*volume:side*.24*volume+wave,tipSide=straight?lowerSide:side*.28*volume+wave*1.5;
   const lowerBack=straight?back*.17*volume-.04:back*.12*volume-.10,tipBack=straight?lowerBack:back*.10*volume-.12;
   this.sweep(key+i,[p(side*.03*volume,back*.025,1.66),p(side*.175*volume,back*.13*volume,1.56),p(side*.21*volume,back*.17*volume-.04,1.32),p(lowerSide,lowerBack,1.6-length*.65),p(tipSide,tipBack,1.55-length)], [.025,.065*volume,.058*volume,.038*volume,.002],straight||i%3?color:color==='#163f59'?'#276378':'#f5d891','hair',{steps:24,sides:8});
  }
 };
 V.humanoid=function(key,p,t,skin,suit,ghost=false){
  if(key==='i-'){
   // Keep the cinematic shoulder/elbow/wrist anchors; sculpt only the silhouette.
   this.sweep(key+'torso',[p(0,0,.58),p(0,0,.73),p(0,0,.86),p(0,-.006,.98),p(0,-.008,1.10),p(0,0,1.16),p(0,0,1.23),p(0,0,1.28)],[.065,.125,.105,.137,.175,.157,.064,.059],skin,'skin',{steps:32,sides:24});
   for(const s of [-1,1]){
    const sway=Math.sin(t*.002+s)*.012;
    this.oval(key+'shoulder'+s,p(s*.18,0,1.115),[.074,.078,.078],skin);
    this.sweep(key+'arm'+s,[p(s*.19,0,1.12),p(s*.25,.008,1.06),p(s*.32,.03,.89),p(s*.33,.08+sway,.73),p(s*.34,.10+sway,.67)],[.061,.056,.043,.030,.026],skin,'skin',{steps:24,sides:12});
    this.oval(key+'hand'+s,p(s*.34,.10+sway,.64),[.034,.023,.053],skin);
    for(let j=0;j<4;j++){
     const spread=(j-1.5)*.016,tip=.548+Math.abs(j-1.3)*.012;
     this.sweep(key+'finger'+s+j,[p(s*.34+spread,.10+sway,.615),p(s*.34+spread*1.08,.115+sway,.58),p(s*.34+spread*1.12,.129+sway,tip)],[.0085,.007,.0025],skin,'skin',{steps:8,sides:6});
    }
    this.sweep(key+'finger'+s+'thumb',[p(s*.318,.107+sway,.654),p(s*.298,.13+sway,.625),p(s*.300,.145+sway,.605)],[.012,.009,.003],skin,'skin',{steps:8,sides:8});
    this.sweep(key+'clavicle'+s,[p(s*.023,.055,1.19),p(s*.08,.108,1.17),p(s*.145,.079,1.15)],[.002,.004,.001], '#d5a180','skin',{steps:10,sides:6});
   }
   return;
  }
  this.sweep(key+'torso',[p(0,0,.58),p(0,0,.73),p(0,0,.91),p(0,0,1.08),p(0,0,1.15),p(0,0,1.24)],[.12,.205,.14,.22,.23,.075],suit||skin,suit?'cloth':'skin',{flatten:1,steps:26,sides:20});
  for(const s of [-1,1]){
   const sway=Math.sin(t*.002+s)*.025;
   this.sweep(key+'arm'+s,[p(s*.19,0,1.12),p(s*.27,.01,1.07),p(s*.32,.03,.89),p(s*.33,.08+sway,.73),p(s*.34,.10+sway,.67)],[.085,.08,.057,.041,.035],suit||skin,suit?'cloth':'skin');
   this.oval(key+'hand'+s,p(s*.34,.10+sway,.64),[.047,.032,.069],skin);
   for(let j=0;j<4;j++)this.sweep(key+'finger'+s+j,[p(s*.34+(j-1.5)*.021,.10+sway,.62),p(s*.34+(j-1.5)*.024,.12+sway,.56),p(s*.34+(j-1.5)*.025,.14+sway,.55)],[.012,.010,.003],skin, 'skin',{steps:8,sides:6});
  }
 };
 V.player=function(id,path,t,dir){
  const h=path[0];if(!h)return;
  const p=(side,depth,z)=>({x:h.x-dir.y*side+dir.x*depth,y:h.y+dir.x*side+dir.y*depth,z:z+(h.z-.45)});
  if(id==='boitata'){
   const body=path.map((q,i)=>({x:q.x,y:q.y,z:q.z+Math.sin(t*.003-i*.5)*.018}));
   if(body.length===1)body.push(p(0,-.2,.45));
   const r=body.map((_,i)=>i===body.length-1?.018:.255*(1-.38*i/body.length));
   this.sweep('b-body',body,r,'#ef8c32','scale',{sides:16,flatten:.91,repeat:path.length*2});
   this.sweep('b-belly',body.map(q=>({...q,z:q.z-.13})),r.map(q=>q*.77),'#ffd58a','scale',{sides:10,flatten:.40});
   this.sweep('b-skull',[p(0,-.32,.48),p(0,-.15,.53),p(0,.12,.57),p(0,.37,.51),p(0,.53,.48)],[.18,.30,.32,.23,.04],'#f6a044','scale',{steps:28,sides:24,flatten:.76});
   this.sweep('b-jaw',[p(0,-.07,.39),p(0,.24,.38),p(0,.49,.40)],[.19,.22,.035],'#c5662b','scale',{flatten:.46});
   for(const s of [-1,1]){
    this.oval('b-eye'+s,p(s*.245,.12,.66),[.084,.09,.075],'#153f2d');
    this.oval('b-iris'+s,p(s*.27,.155,.688),[.058,.062,.045],'#42e79a','eye');
    this.oval('b-pupil'+s,p(s*.277,.17,.711),[.014,.032,.025],'#092b24');
    this.oval('b-reflect'+s,p(s*.26,.19,.721),[.015,.014,.009],'#e2ffe8','eye');
    this.sweep('b-brow'+s,[p(s*.13,-.06,.73),p(s*.25,.07,.75),p(s*.28,.22,.69)],[.025,.055,.013],'#c37332','scale');
    this.oval('b-nostril'+s,p(s*.108,.42,.57),[.028,.04,.014],'#633c22');
   }
  }else{
   const bob=Math.sin(t*.003)*.025,q=(s,d,z)=>p(s,d,z+bob);
   this.humanoid('i-',q,t,'#c88f6b',null);this.face('i-',q,'#d7a47f','#47c8be',t);
   // Close-fitting scalp: no raised crown or loose locks beside the face.
   this.sweep('i-crowncap',[q(0,-.035,1.44),q(0,-.025,1.53),q(0,-.02,1.60),q(0,-.02,1.645),q(0,-.02,1.655)],[.168,.174,.14,.075,.002],'#080808','hair',{steps:20,sides:24});
   for(let j=0;j<9;j++){
    const side=(j-4)*.032,edge=Math.abs(j-4)/4;
    this.sweep('i-fringe'+j,[q(side*.65,.07,1.63),q(side*.95,.132,1.59),q(side*1.08,.135,1.55-edge*.025)],[.020,.026,.002],j%3===0?'#172326':'#0d1214','hair',{steps:16,sides:8});
   }
   this.sweep('i-bodice',[q(0,0,.91),q(0,-.006,1.01),q(0,-.008,1.08),q(0,-.008,1.105)],[.140,.174,.191,.185],'#319c9c','scale',{steps:18,sides:24});
   this.sweep('i-tail',[q(0,0,.86),q(0,-.015,.70),q(0,-.055,.53),q(.025,-.20,.34),q(Math.sin(t*.005)*.06,-.42,.20)],[.132,.180,.171,.112,.030],'#219eaa','scale',{steps:28,sides:20});
   for(const s of [-1,1])this.sweep('i-fin'+s,[q(0,-.4,.21),q(s*.20,-.59,.17),q(s*.40,-.78,.23),q(s*.49,-.94,.32)],[.026,.135,.116,.001],'#74dfce','scale',{flatten:.16,steps:20,sides:12});
   // A continuous underlayer closes the scalp/back seam and the gaps between locks.
   const backing=[q(0,-.145,1.57),q(0,-.25,1.28),q(0,-.25,.87),...path.slice(1).map(v=>({x:v.x,y:v.y,z:v.z+.19}))];
   if(backing.length<4)backing.push(q(0,-.30,.64));
   this.sweep('i-hairback',backing,[.075,.13,.12,.095,.001],'#080808','hair',{sides:12});
   // The entire original physical trail still determines the growing hair length.
   for(let j=0;j<7;j++){
    const side=(j-3)*.032;
    const strand=[q(side,-.145,1.57),q(side,-.25,1.28),q(side,-.25,.87),...path.slice(1).map((v,i)=>{
     const before=path[i],after=path[Math.min(i+2,path.length-1)],dx=after.x-before.x,dy=after.y-before.y,n=Math.hypot(dx,dy)||1;
     const fan=side*Math.min(1,(path.length-1-i)/2);
     return {x:v.x-dy/n*fan,y:v.y+dx/n*fan,z:v.z+.19};
    })];
    if(strand.length<4)strand.push(q(side,-.30,.64));
    this.sweep('i-lock'+j,strand,[.028,.043,.042,.030,.001],j%3===0?'#172326':'#0d1214','hair',{sides:10});
   }
  }
 };
 V.cuca=function(t){
  const C=B.CucaArena,breath=Math.sin(t*.002)*.024,open=C.warning?.13:.025;
  // Visual-only swivel: a 180-degree arc around the same planted world-space pivot.
  const angle=Math.sin(t*.0007)*Math.PI/2,cos=Math.cos(angle),sin=Math.sin(angle);
  const p=(s,d,z)=>{const x=-d*2,y=s*2;return {x:17.5+x*cos-y*sin,y:9.5+x*sin+y*cos,z:z*2+breath};};
  this.sweep('c-dress',[p(0,-.10,.13),p(0,-.10,.20),p(0,-.10,.52),p(0,-.10,.91),p(0,-.10,1.25),p(0,-.10,1.54),p(0,-.10,1.66)],[.70,.75,.66,.49,.36,.53,.33],'#bd2639','cloth',{folds:10,steps:36,sides:32});
  this.sweep('c-neck',[p(0,0,1.53),p(0,0,1.85),p(0,.06,2.23)],[.26,.23,.29],'#5c9a43','scale');
  this.sweep('c-skull',[p(0,-.21,2.45),p(0,0,2.48),p(0,.27,2.39),p(0,.56,2.34),p(0,.83,2.31)],[.08,.63,.48,.38,.05],'#71a84d','scale',{flatten:.67,steps:32,sides:24});
  this.sweep('c-jaw',[p(0,.04,2.19-open),p(0,.46,2.17-open),p(0,.79,2.20-open)],[.36,.38,.05],'#46733a','scale',{flatten:.32});
  for(const s of [-1,1]){
   this.sweep('c-arm'+s,[p(s*.28,-.08,1.60),p(s*.42,-.03,1.42),p(s*.47,.02,1.12),p(s*.51,.08,.97)],[.19,.16,.12,.09],'#5c9a43','scale');
   this.oval('c-hand'+s,p(s*.52,.10,.94),[.16,.16,.21],'#619c47','scale');
   for(let j=0;j<4;j++)this.sweep('c-claw'+s+j,[p(s*.52+(j-1.5)*.035,.12,.91),p(s*.52+(j-1.5)*.04,.17,.82),p(s*.52+(j-1.5)*.043,.23,.80)],[.033,.024,.001],'#e1d4a3');
   this.oval('c-eye'+s,p(s*.25,.14,2.58),[.16,.17,.22],'#dfc277');
   this.oval('c-pupil'+s,p(s*.29,.18,2.61),[.038,.08,.12],'#3c2425');
   this.sweep('c-brow'+s,[p(s*.15,-.01,2.72),p(s*.28,.13,2.73),p(s*.29,.28,2.66)],[.04,.09,.02],'#3f6f35','scale');
   this.oval('c-nose'+s,p(s*.105,.70,2.43),[.048,.07,.035],'#253a26');
   for(let k=0;k<7;k++)this.sweep('c-tooth'+s+k,[p(s*.19,.18+k*.075,2.29),p(s*.18,.19+k*.075,2.20)],[.042,.001],'#f8e6bf', 'skin',{steps:6,sides:8});
  }
  this.sweep('c-tail',[p(0,-.3,.90),p(.08,-.7,.73),p(.13+Math.sin(t*.002)*.08,-1.13,.55),p(.22,-1.55,.44)],[.32,.26,.14,.001],'#5c9a43','scale',{steps:28,sides:16});
  // Continuous blonde foundation fills the crown and nape beneath the outer locks.
  this.sweep('c-wig-fill',[p(0,-.12,2.66),p(0,-.12,2.77),p(0,-.12,2.87),p(0,-.12,2.95),p(0,-.12,2.98)],[.43,.59,.53,.30,.002],'#e9bf55','hair',{steps:24,sides:24});
  this.sweep('c-wig-back',[p(0,-.30,2.78),p(0,-.36,2.35),p(0,-.40,1.85),p(0,-.40,1.35),p(0,-.36,.90)],[.37,.45,.40,.32,.035],'#dfb34c','hair',{steps:36,sides:20});
  const wig=(s,d,z)=>p(s,d-.08,z+1.22);this.hair('c-wig',wig,t,'#e9bf55',1.90,1.65);
  if(C.warning){this.oval('c-fire',p(0,.87,2.23),[.16,.18,.15],'#ffb834','glow');}
 };
 V.loira=function(ghost,time){
  const dir={x:Math.cos(ghost.angle),y:Math.sin(ghost.angle)},bob=.08+Math.sin(time*3)*.035;
  const p=(s,d,z)=>({x:ghost.x+.5+s*dir.y+d*dir.x,y:ghost.y+.5-s*dir.x+d*dir.y,z:z*1.38+bob});
  this.humanoid('l-',p,time*1000,'#d8ced8','#202538',true);this.face('l-',p,'#ded4de','#85dfe5',time*1000);this.hair('l-hair',p,time*1000,'#d7b774',1.25);
  for(const s of [-1,1]){
   const swing=Math.sin(ghost.stride)*s*.05;
   this.sweep('l-leg'+s,[p(s*.11,0,.70),p(s*.12,swing,.43),p(s*.13,swing*2,.12),p(s*.13,swing*2+.10,.07)],[.11,.085,.047,.025],'#202538','cloth');
   this.sweep('l-circuit'+s,[p(s*.075,.205,1.12),p(s*.13,.185,1.04),p(s*.10,.15,.91),p(s*.15,.16,.78)],[.007,.009,.008,.004],s>0?'#71cce1':'#d85e7b','glow',{sides:6});
   this.sweep('l-trim'+s,[p(s*.20,.01,1.16),p(s*.26,.02,1.12),p(s*.28,.03,1.05)],[.025,.035,.01],'#a2afc0','metal');
  }
  for(let i=0;i<7;i++){const a=time*.6+i*2.4;this.oval('l-mote'+i,p(Math.cos(a)*.36,Math.sin(a)*.24,.2+(i*.177+time*.08)%1.2),[.017,.017,.025],'#99cfdd','ghost');}
 };
 const begin=F.begin;F.begin=function(){begin.call(this);V.used.clear();for(const item of V.surfaces.values())item.mesh.visible=false;};
 const adapter=F.adapter;F.adapter=function(cam){const m=adapter.call(this,cam);m.organic=true;return m;};
 for(const id of ['boitata','iara']){const c=B.Characters.get(id),old=c.model;c.model=function(m,path,t,dir){if(!m.organic)return old.call(this,m,path,t,dir);const prefix=V.prefix;V.prefix=m.organicPrefix||'';try{V.player(id,path,t,dir);}finally{V.prefix=prefix;}};}
 if(B.CucaArena){const old=B.CucaArena.cuca;B.CucaArena.cuca=function(m,t){if(!m.organic)return old.call(this,m,t);V.cuca(t);};}
 if(B.NetworkCollapse){const old=B.NetworkCollapse.drawLoira;B.NetworkCollapse.drawLoira=function(m,f,g,t){if(!m.organic)return old.call(this,m,f,g,t);V.loira(g,t);};}
 V.dispose=function(){for(const q of this.surfaces.values()){F.scene.remove(q.mesh);q.mesh.geometry.dispose();}for(const q of this.materials.values())q.dispose();for(const q of this.textures.values())q.dispose();this.surfaces.clear();this.materials.clear();this.textures.clear();};
 // Selection cards render the actual game meshes with the existing GPU context.
 // Their geometry belongs to the card and is released when the card closes.
 V.preview=function(canvas,id){
  if(!F.renderer)return false;
  const scene=new T.Scene(),surfaces=new Map(),camera=new T.OrthographicCamera(-2.7,2.7,1.35,-1.35,.1,30),ctx=canvas.getContext('2d');
  scene.background=new T.Color('#071722');scene.add(new T.HemisphereLight('#dcf1ff','#4e4334',2));
  const light=new T.DirectionalLight('#ffdfb0',3);light.position.set(-3,6,4);scene.add(light);
  camera.position.set(2.5,2.5,4);camera.lookAt(-.6,.85,0);
  let last=-Infinity;
  const animate=t=>{
   if(!canvas.isConnected){for(const q of surfaces.values())q.mesh.geometry.dispose();surfaces.clear();return;}
   if(t-last>=100){
    last=t;const priorScene=F.scene,priorSurfaces=V.surfaces,priorPrefix=V.prefix;
    try{
     F.scene=scene;V.surfaces=surfaces;V.prefix='';
     const path=Array.from({length:6},(_,i)=>({x:-i*.45,y:Math.sin(i*.6+t*.001)*.2,z:.45}));
     V.player(id,path,t,{x:1,y:0});
     const aspect=F.canvas.width/F.canvas.height;camera.left=-1.35*aspect;camera.right=1.35*aspect;camera.updateProjectionMatrix();
     F.renderer.render(scene,camera);
     const width=Math.min(F.canvas.width,F.canvas.height*2),left=(F.canvas.width-width)/2;
     ctx.drawImage(F.canvas,left,0,width,F.canvas.height,0,0,canvas.width,canvas.height);
    }finally{F.scene=priorScene;V.surfaces=priorSurfaces;V.prefix=priorPrefix;}
   }
   requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);return true;
 };
})();
