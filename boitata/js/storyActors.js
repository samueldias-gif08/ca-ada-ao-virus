/* Independent cinematic copies of the playable procedural meshes. No save/game state writes. */
(() => {
 'use strict';const B=Boitata,T=window.THREE;if(!T)return;
 const clamp=T.MathUtils.clamp,vec=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
 B.StoryActors={
  build(id){
   const V=B.OrganicCharacters,F=B.Forest3D,temporary=new T.Scene(),surfaces=new Map(),materials=new Map(),textures=new Map();
   const prior={scene:F.scene,surfaces:V.surfaces,materials:V.materials,textures:V.textures,prefix:V.prefix};
   const path=Array.from({length:24},(_,i)=>{const a=i/23*Math.PI*4,r=.25+i/23*.95;return {x:i?r*Math.sin(a):0,y:i?-r*Math.cos(a):0,z:.47};});
   try{
    F.scene=temporary;V.surfaces=surfaces;V.materials=materials;V.textures=textures;V.prefix='';
    if(id==='boitata')V.player(id,path,0,{x:0,y:1});
    if(id==='iara')V.player(id,[{x:0,y:0,z:.45},{x:0,y:-.5,z:.45},{x:0,y:-1.0,z:.45},{x:0,y:-1.7,z:.45}],0,{x:0,y:1});
    if(id==='cuca')V.cuca(0);
    if(id==='loira')V.loira({x:-.5,y:-.5,angle:Math.PI/2,stride:0,appeared:0},0);
   }finally{Object.assign(F,{scene:prior.scene});Object.assign(V,{surfaces:prior.surfaces,materials:prior.materials,textures:prior.textures,prefix:prior.prefix});}
   const root=new T.Group(),model=new T.Group();root.name='story-'+id;root.add(model);
   const offset=id==='cuca'?vec(-17.5,0,-9.5):vec();
   // Bake translation, so all rigs and pivots have intuitive local coordinates.
   for(const [key,item]of surfaces){const m=item.mesh;m.name=key;
    if(id==='cuca'){
     const a=m.geometry.attributes.position;
     if(m.position.lengthSq()===0){for(let i=0;i<a.count;i++)a.setXYZ(i,a.getX(i)+offset.x,a.getY(i),a.getZ(i)+offset.z);a.needsUpdate=true;}
     else m.position.add(offset);
    }
    model.add(m);m.castShadow=false;if(key==='c-fire')m.visible=false;
   }
   const actor={id,root,model,surfaces,materials,textures,path,head:new T.Group(),arms:[],dynamic:[],mouth:null};
   const headY=id==='cuca'?4.6:id==='loira'?2.03:id==='boitata'?.56:1.43;
   actor.head.position.set(0,headY,0);model.add(actor.head);
   const headKey=key=>id==='boitata'?/^b-(skull|jaw|eye|iris|pupil|reflect|brow|nostril)/.test(key):id==='cuca'?/^c-(skull|jaw|eye|pupil|brow|nose|tooth|wig)/.test(key):new RegExp('^'+(id==='iara'?'i-':'l-')+'(head|nose|lip|socket|eye|iris|pupil|catch|brow|crowncap|fringe|hair)').test(key);
   for(const [key,item]of surfaces){const m=item.mesh;
    if(headKey(key)&&!(id==='iara'&&key==='i-hairback')){
     m.position.y-=headY;actor.head.add(m);
     // Local pivots keep eyebrow/lip scaling at the face instead of at the world origin.
     m.geometry.computeBoundingBox();const center=m.geometry.boundingBox.getCenter(new T.Vector3());m.geometry.translate(-center.x,-center.y,-center.z);m.position.add(center);
    }
    m.userData.restPosition=m.position.clone();m.userData.restScale=m.scale.clone();
    if(id==='iara'&&(/^i-(lock|hairback|tail|fin)/.test(key)))this.dynamic(actor,m,key);
   }
   if(id==='iara'){
    for(const side of [-1,1])this.arm(actor,side);
    actor.comb=new T.Group();const mat=new T.MeshStandardMaterial({color:'#e6bd6b',metalness:.5,roughness:.4});actor.materials.set('comb',mat);
    const spine=new T.Mesh(new T.BoxGeometry(.15,.025,.025),mat);actor.comb.add(spine);
    for(let i=0;i<8;i++){const tooth=new T.Mesh(new T.BoxGeometry(.009,.08,.018),mat);tooth.position.set(-.064+i*.018,-.04,0);actor.comb.add(tooth);}model.add(actor.comb);
   }
   // Small separately controlled lips allow surprise, breath and fear to read in close-ups.
   if(id==='iara'||id==='loira'){
    const lip=surfaces.get((id==='iara'?'i-':'l-')+'lip');actor.mouth=lip?.mesh;
    const mat=new T.MeshStandardMaterial({color:'#301d2a',roughness:.9});actor.materials.set('mouth-inner',mat);
    actor.mouthInner=new T.Mesh(new T.SphereGeometry(1,16,10),mat);actor.mouthInner.position.copy(actor.mouth.position).add(vec(0,0,.015));actor.mouthInner.scale.set(.036,.021,.009);actor.mouthInner.visible=false;actor.head.add(actor.mouthInner);
   }
   actor.baseMaterials=new Map([...actor.materials].map(([key,m])=>[key,{color:m.color.clone(),emissive:m.emissive.clone(),intensity:m.emissiveIntensity}]));
   root.visible=false;return actor;
  },
  dynamic(actor,mesh,key){
   actor.dynamic.push({mesh,key,position:mesh.geometry.attributes.position.array.slice(),normal:mesh.geometry.attributes.normal.array.slice()});
  },
  arm(actor,side){
   const mesh=actor.surfaces.get('i-arm'+side).mesh;
   const shoulder=vec(-side*.19,1.12,0),elbow=vec(-side*.32,.89,.03),wrist=vec(-side*.34,.67,.10);
   const arm={side,mesh,shoulder,elbow,wrist,upper:elbow.clone().sub(shoulder),lower:wrist.clone().sub(elbow),target:vec(),posedElbow:vec(),q1:new T.Quaternion(),q2:new T.Quaternion(),bind:mesh.geometry.attributes.position.array.slice(),norm:mesh.geometry.attributes.normal.array.slice(),attachments:[]};
   for(const [key,item]of actor.surfaces)if(key==='i-hand'+side||key.startsWith('i-finger'+side))arm.attachments.push(item.mesh);
   actor.arms.push(arm);
  },
  poseArm(arm,target){
   const {shoulder,elbow,wrist}=arm,delta=target.clone().sub(shoulder),distance=clamp(delta.length(),.035,arm.upper.length()+arm.lower.length()-.001),direction=delta.normalize();
   const a=arm.upper.length(),b=arm.lower.length(),along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along));
   const bend=vec(0,0,1).addScaledVector(direction,-direction.z).normalize();
   arm.target.copy(shoulder).addScaledVector(direction,distance);arm.posedElbow.copy(shoulder).addScaledVector(direction,along).addScaledVector(bend,height);
   arm.q1.setFromUnitVectors(arm.upper.clone().normalize(),arm.posedElbow.clone().sub(shoulder).normalize());
   arm.q2.setFromUnitVectors(arm.lower.clone().normalize(),arm.target.clone().sub(arm.posedElbow).normalize());
   const p=arm.mesh.geometry.attributes.position,n=arm.mesh.geometry.attributes.normal,v=vec(),upper=vec(),lower=vec(),nu=vec(),nl=vec();
   for(let i=0;i<p.count;i++){
    v.fromArray(arm.bind,i*3);const weight=clamp((.95-v.y)/.12,0,1);
    upper.copy(v).sub(shoulder).applyQuaternion(arm.q1).add(shoulder);lower.copy(v).sub(elbow).applyQuaternion(arm.q2).add(arm.posedElbow);upper.lerp(lower,weight);p.setXYZ(i,upper.x,upper.y,upper.z);
    nu.fromArray(arm.norm,i*3).applyQuaternion(arm.q1);nl.fromArray(arm.norm,i*3).applyQuaternion(arm.q2);nu.lerp(nl,weight).normalize();n.setXYZ(i,nu.x,nu.y,nu.z);
   }p.needsUpdate=n.needsUpdate=true;
   for(const m of arm.attachments){m.position.copy(m.userData.restPosition).sub(wrist).applyQuaternion(arm.q2).add(arm.target);m.quaternion.copy(arm.q2);}
  },
  face(actor,emotion,t=0){
   const key=actor.id==='iara'?'i-':actor.id==='loira'?'l-':actor.id==='cuca'?'c-':'b-';
   if(actor.id==='cuca'||actor.id==='loira')for(const [name,m]of actor.materials){const rest=actor.baseMaterials.get(name);if(rest){m.color.copy(rest.color);m.emissive.copy(rest.emissive);m.emissiveIntensity=rest.intensity;}}
   const sleep=emotion==='sleep',shock=['fear','surprise'].includes(emotion),weak=emotion==='weak',worried=emotion==='worried',determined=emotion==='determined',controlled=emotion==='controlled';
   for(const [name,item]of actor.surfaces){const m=item.mesh,r=m.userData.restScale;if(!r)continue;
    if(name.startsWith(key+'eye')||name.startsWith(key+'iris')||name.startsWith(key+'pupil')||name.startsWith(key+'catch')||name.startsWith('b-reflect')){
     m.scale.copy(r);m.scale.y=r.y*(sleep?.055:shock?1.4:weak?.48:determined?.75:1);
     if(name.includes('iris')||name.includes('pupil'))m.scale.x=r.x*(shock?.75:1);
    }
    if(name.startsWith(key+'brow')){m.rotation.z=determined?(name.endsWith('-1')?-.12:.12):shock?(name.endsWith('-1')?.15:-.15):worried?(name.endsWith('-1')?.09:-.09):0;m.position.y=m.userData.restPosition.y+(shock?.025:worried?.009:0);}
    if(name==='b-iris-1'||name==='b-iris1')m.material.emissiveIntensity=weak?.035:.45;
    if(controlled&&(name.includes('iris')||name.includes('pupil')||name.startsWith('c-eye'))){m.material.color.set('#0d388b');m.material.emissive.set('#006bff');m.material.emissiveIntensity=.4+t*1.8;}
   }
   if(actor.mouth){actor.mouth.scale.y=shock?2.8:weak?1.2:1;actor.mouthInner.visible=shock;}
   if(actor.id==='iara'){
    const lower=actor.surfaces.get('i-lipLower')?.mesh;
    if(lower){lower.position.copy(lower.userData.restPosition);lower.position.y-=shock?.021:0;}
   }
   actor.emotion=emotion;
  },
  iara(actor,t,{mode='idle',emotion='calm',turn=0,amount=1,swimBlend=1,swimFrom='raised'}={}){
   this.face(actor,emotion);actor.head.rotation.set(emotion==='fear'?-.055:0,turn,emotion==='surprise'?.05:0);
   const cycle=Math.sin(t*2.2),stroke=(1-Math.cos(t*2.2))*.5;
   for(const arm of actor.arms){const side=arm.side;let target;
    if(mode==='comb'&&side===-1)target=vec(.27,1.51-stroke*.44,-.17);
    else if(mode==='comb')target=vec(-.16,1.13,-.20);
    else if(mode==='freeze'&&side===-1)target=vec(.27,1.51-(1-Math.cos(18*2.2))*.5*.44,-.17);
    else if(mode==='start'&&side===-1)target=vec(.27-.09*amount,1.22+amount*.38,-.17+amount*.23);
    else if(mode==='swim'){
     const strokeTarget=vec(-side*(.28+stroke*.1),.98+cycle*.15,.12+Math.cos(t*2.2+side)*.22);
     target=swimFrom==='raised'&&side===-1?vec(.18,1.6,.06):vec(-side*.34,.68,.10);target.lerp(strokeTarget,swimBlend);
    }
    else if(mode==='gasp'&&side===-1)target=vec(.34,.68,.10).lerp(vec(.08,1.32,.22),amount);
    else target=vec(-side*.34,.68+Math.sin(t*1.2+side)*.018,.10);
    this.poseArm(arm,target);
   }
   actor.comb.visible=mode==='comb'||mode==='freeze';
   actor.comb.position.copy(actor.arms.find(a=>a.side===-1).target);actor.comb.quaternion.copy(actor.arms.find(a=>a.side===-1).q2);
   for(const item of actor.dynamic){const {mesh,key,position,normal}=item,p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal;
    for(let i=0;i<p.count;i++){
     const x=position[i*3],y=position[i*3+1],z=position[i*3+2];let dx=0,dz=0;
     if(/tail|fin/.test(key)){const weight=clamp((.75-y)/.65,0,1);dx=Math.sin(t*(mode==='swim'?5:1.8)-weight*2)*weight*(mode==='swim'?.045+.115*swimBlend:.045);dz=Math.cos(t*3-weight)*weight*.035;}
     else {const weight=clamp((1.5-y)/1.1,0,1);dx=Math.sin(t*1.8+z*1.5)*weight*(mode==='swim'?.07:.015);dz=-weight*(mode==='swim'?.20:.025)+Math.sin(t*1.4)*weight*.01;}
     p.setXYZ(i,x+dx,y,z+dz);n.setXYZ(i,normal[i*3],normal[i*3+1],normal[i*3+2]);
    }p.needsUpdate=n.needsUpdate=true;
   }
  },
  serpent(actor,t,uncoil=0){
   const V=B.OrganicCharacters,F=B.Forest3D,old={scene:F.scene,surfaces:V.surfaces,materials:V.materials,textures:V.textures,prefix:V.prefix};
   const path=actor.path;for(let i=0;i<path.length;i++){const u=i/(path.length-1),a=u*Math.PI*4,r=.25+u*.95;path[i].x=(1-uncoil)*(i?r*Math.sin(a):0)+uncoil*Math.sin(t*4-u*8)*u*.3;path[i].y=(1-uncoil)*(i?-r*Math.cos(a):0)-uncoil*u*4.5;path[i].z=.47+Math.sin(t*1.4)*.018;}
   try{F.scene=actor.model;V.surfaces=actor.surfaces;V.materials=actor.materials;V.textures=actor.textures;V.prefix='';const radii=path.map((_,i)=>i===path.length-1?.012:.245*(1-.38*i/path.length));V.sweep('b-body',path,radii,'#ef8c32','scale',{sides:16,flatten:.91});V.sweep('b-belly',path.map(q=>({...q,z:q.z-.13})),radii.map(r=>r*.77),'#ffd58a','scale',{sides:10,flatten:.40});}
   finally{F.scene=old.scene;Object.assign(V,{surfaces:old.surfaces,materials:old.materials,textures:old.textures,prefix:old.prefix});}
  },
  seated(actor){
   // Bind-pose deformation folds the lower body onto the seat, while the head has its own pivot.
   for(const [key,item]of actor.surfaces){if(item.mesh.parent===actor.head)continue;const m=item.mesh;
    if(m.position.lengthSq()>0)continue;const p=m.geometry.attributes.position;
    const threshold=actor.id==='cuca'?2.7:1.1;
    if(!/dress|tail|leg/.test(key))continue;
    for(let i=0;i<p.count;i++){const y=p.getY(i);if(y<threshold){const f=(threshold-y)/threshold;p.setXYZ(i,p.getX(i),y*.6+.25,p.getZ(i)+Math.sin(f*Math.PI*.8)*(actor.id==='cuca'?.85:.55));}}p.needsUpdate=true;m.geometry.computeVertexNormals();
   }
  },
  dispose(actor){const geometries=new Set();actor.root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});for(const g of geometries)g.dispose();for(const m of actor.materials.values())m.dispose();for(const t of actor.textures.values())t.dispose();actor.root.removeFromParent();}
 };
})();
