/* Level 3 only: finite ninja village, shared simulation coordinates (x,y), height z. */
(() => {
'use strict';
const B=Boitata,F=B.Forest3D;
const V=B.Village={
 active:()=>B.S.level?.id===3,
 houses:[{x:3,y:3,w:3,h:2,roof:'#ad4e36',wall:'#e9d2a5'}, {x:10,y:3,w:3,h:2,roof:'#c6743f',wall:'#eee4c5',ramen:true}, {x:17,y:3,w:3,h:2,roof:'#795047',wall:'#cfcfb2'}, {x:8,y:12,w:3,h:2,roof:'#b9583e',wall:'#d9c49b'}, {x:15,y:12,w:2,h:2,roof:'#d17e42',wall:'#eee0ba'}, {x:19,y:11,w:2,h:3,roof:'#895747',wall:'#dccfae'}],
 npcs:[],clock:0,
 footprint(x,y){return this.houses.some(h=>x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h);},
 reset(){this.clock=0;this.npcs=[{name:'Naruto',x:6,y:6,route:[[6,6],[14,6],[14,9],[6,9]],hair:'#f3cf48',suit:'#ed8534',eyes:'#449bde'}, {name:'Sasuke',x:16,y:8,route:[[16,8],[19,8],[19,9],[16,9]],hair:'#252b3c',suit:'#394e87',eyes:'#263446'}, {name:'Sakura',x:12,y:11,route:[[12,11],[12,15],[17,15],[17,11]],hair:'#e995af',suit:'#b94b65',eyes:'#60a77c'}].map(n=>({...n,index:1,dir:{x:1,y:0},moving:false,yielding:true}));},
 blocked(x,y){return this.active()&&this.npcs.some(n=>!n.yielding&&Math.hypot(n.x-x,n.y-y)<.52);},
 update(dt){if(!this.active())return;this.clock+=dt;const s=B.S;
  for(const n of this.npcs){const actors=[...s.snake,s.fugitive,s.predator].filter(p=>p&&p.state!=='AGUARDANDO');n.yielding=actors.some(p=>Math.hypot(p.x-n.x,p.y-n.y)<2.6);n.moving=false;
   if(n.yielding)continue;
   const target=n.route[n.index],dx=target[0]-n.x,dy=target[1]-n.y,d=Math.hypot(dx,dy),run=n.name==='Naruto'&&this.clock%12>8,pause=n.name==='Sakura'&&this.clock%9<2||n.name==='Sasuke'&&this.clock%7<2;
   if(d<.04){n.index=(n.index+1)%n.route.length;continue;}if(pause)continue;
   const step=Math.min(d,dt*(run?1.05:.46)),x=n.x+dx/d*step,y=n.y+dy/d*step;
   if(B.Maps.inside(x,y)&&!s.obstacles.has(Math.round(x)+','+Math.round(y))&&!s.items.some(p=>Math.hypot(p.x-x,p.y-y)<.8)&&!this.npcs.some(o=>o!==n&&Math.hypot(o.x-x,o.y-y)<.9)){n.x=x;n.y=y;n.dir={x:dx/d,y:dy/d};n.moving=true;n.running=run;}
  }
 },
 // Every solid footprint is shared by player, both viruses and NPC routing.
 extend(){const s=B.S,l=s.level;if(s.generated)return;this.reset();
  for(let x=0;x<24;x++)for(let y=0;y<18;y++)if(!B.Maps.inside(x,y)||this.footprint(x,y))s.obstacles.add(x+','+y);
  s.generated=24;const cells=[...B.Maps.reachable()].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};}).filter(p=>p.x>7&&!this.npcs.some(n=>Math.hypot(p.x-n.x,p.y-n.y)<2));
  cells.sort((a,b)=>B.Maps.hash(a.x+47,a.y,l)-B.Maps.hash(b.x+47,b.y,l));
  for(const [i,p]of cells.slice(0,l.target+4).entries())s.items.push({...p,type:i>=l.target?(i%2?'health':'score'):i%5===0?'special':'common'});
 },
 material(color,type){if(type==='sign'){const key='village-sign:'+color;if(F.materials.has(key))return F.materials.get(key);const c=document.createElement('canvas');c.width=256;c.height=64;const ctx=c.getContext('2d');ctx.fillStyle='#f4dfad';ctx.fillRect(0,0,256,64);ctx.fillStyle='#643a32';ctx.font='38px "Poiret One", sans-serif';ctx.textAlign='center';ctx.fillText(color,128,46,232);const texture=new F.T.CanvasTexture(c);texture.colorSpace=F.T.SRGBColorSpace;texture.magFilter=F.T.NearestFilter;const mat=new F.T.MeshStandardMaterial({map:texture,roughness:.9});F.materials.set(key,mat);return mat;}if(type!=='villageRoof'&&type!=='villageWall')return F.material(color,type);
  const key=color+type;if(F.materials.has(key))return F.materials.get(key);const T=F.T,mat=new T.MeshStandardMaterial({color,map:type==='villageRoof'?F.bark:F.stone,roughness:.92,transparent:true});
  mat.onBeforeCompile=shader=>{shader.uniforms.villageHead=F.head;shader.vertexShader='varying vec3 villageWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 vw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nvw=instanceMatrix*vw;\n#endif\nvillageWorld=(modelMatrix*vw).xyz;');shader.fragmentShader='uniform vec3 villageHead; varying vec3 villageWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nvec3 vd=villageWorld-villageHead; float cover=(1.0-smoothstep(0.65,1.25,abs(vd.x)))*step(0.0,vd.z)*step(0.3,villageWorld.y); diffuseColor.a*=1.0-cover*0.88;');};mat.customProgramCacheKey=()=> 'village-occlusion';F.materials.set(key,mat);return mat;
 },
 chunk(index,l){const T=F.T,batches=new Map(),g=new T.Group(),hash=(x,y)=>B.Maps.hash(x,y,l);
  const add=(kind,c,x,y,z,sx,sy,sz,type='plain',rot=0,tilt=0)=>{const key=kind+c+type;if(!batches.has(key))batches.set(key,{kind,c,type,parts:[]});batches.get(key).parts.push({x,y,z,sx,sy,sz,rot,tilt});};
  add('box','#987554',index*8+4,-.46,9,8,.8,18,'stone');add('box','#c8ad7b',index*8+4,-.04,9,8,.13,18,'stone');
  const tree=(x,y,r)=>{add('trunk','#78563e',x,.52,y,.14,1,.14,'bark');for(let k=0;k<3;k++)add('leaf',k%2?'#689650':'#4d834d',x+Math.sin(k*2.1)*.21,1.15+k*.19,y+Math.cos(k*2.1)*.18,.48,.37,.43,'leaf');};
  for(let x=index*8;x<index*8+8;x++)for(let y=0;y<18;y++){
   const r=hash(x,y),edge=!B.Maps.inside(x,y),street=y>=6&&y<=10||x>=12&&x<=14;
   if(edge){add('box','#a48d70',x+.5,.24,y+.5,.98,.48,.65,'stone');add('box','#705942',x+.5,.52,y+.5,1,.09,.72,'bark');if((x+y)%3===0)tree(x+.5,y+.5,r);continue;}
   if(this.footprint(x,y))continue;
   if(street&&r>.28)add('box',r>.7?'#b9b6a1':'#d2c5a7',x+.5,.045,y+.5,.83,.035,.8,'stone',r*.09);
   else if(!street&&r>.45){add('box','#8da46a',x+.5,.03,y+.5,.82,.03,.77,'grass');if(r>.88)add('leaf','#719753',x+.5,.17,y+.5,.25,.18,.22,'leaf');}
   else if(r<.2)add('sphere','#9e9479',x+.25,.04,y+.3,.07,.05,.06,'stone');
   if(x===2&&y===6||x===21&&y===8||x===7&&y===11){add('trunk','#624b39',x+.18,.55,y+.18,.055,1.1,.055,'bark');add('box','#e9ba78',x+.18,1.04,y+.18,.26,.32,.25,'glow');add('box','#655046',x+.18,1.23,y+.18,.36,.09,.34);}
  }
  for(const [i,h]of this.houses.entries()){if(Math.floor(h.x/8)!==index)continue;const cx=h.x+h.w/2,cz=h.y+h.h/2,height=1.12+(i%3)*.13;
   add('box','#9e8b70',cx,.10,cz,h.w,.2,h.h,'stone');add('box',h.wall,cx,height/2+.15,cz,h.w-.12,height,h.h-.12,'villageWall');
   for(const side of [-1,1]){add('box','#76513a',cx+side*(h.w/2-.10),height/2+.15,cz,.09,height+.1,h.h,'villageWall');
    // Each roof half is a sloped slab with individual raised tile courses.
    add('box',h.roof,cx,height+.42,cz+side*h.h*.25,h.w+.18,.11,h.h*.58,'villageRoof',0,side*.35);
    for(let k=0;k<h.w*4;k++)add('box',i%2?'#bc7957':'#d0825a',h.x+.03+k*.25,height+.48,cz+side*h.h*.25,.035,.045,h.h*.58,'villageRoof',0,side*.35);
   }
   add('box','#684738',cx,height+.61,cz,h.w+.23,.13,.17,'villageRoof');
   const front=h.y+h.h-.035;add('box','#705239',cx,.52,front,.46,.87,.08,'villageWall');add('box','#c6a369',cx+.13,.52,front+.05,.04,.05,.03);
   for(const side of [-1,1]){add('box','#624d39',cx+side*h.w*.30,.82,front,.47,.48,.07,'villageWall');add('box','#98bfc0',cx+side*h.w*.30,.82,front+.04,.36,.36,.03,'villageWall');add('box','#e8d4a6',cx+side*h.w*.30,.82,front+.065,.035,.38,.02,'villageWall');}
   // Porch and steps stay inside the exact solid house footprint.
   add('box','#9b7956',cx,.18,front-.15,h.w-.2,.16,.35,'bark');add('box','#d4b98a',cx,.09,front,.65,.15,.11,'stone');
   if(h.ramen){add('box','一楽 ラーメン',cx,1.04,front+.205,1.9,.22,.025,'sign');add('box','#bc5746',cx,1.03,front+.09,h.w-.3,.24,.18,'villageWall');for(let k=0;k<4;k++)add('box','#f2dfa6',h.x+.4+k*.62,1.04,front+.19,.38,.16,.02,'villageWall');}
  }
  // Boundary pennants and wooden fences stay on solid border cells.
  for(let x=index*8+1;x<index*8+8;x+=3){add('trunk','#71513b',x,.75,17.5,.065,1.5,.065,'bark');add('box','#b95141',x+.18,1.21,17.5,.36,.46,.04,'leaf');add('box','#ead2a0',x+.18,1.23,17.53,.15,.12,.02);add('box','#927049',x,.30,17.5,2,.065,.09,'bark');}
  // Hokage rock relief sits entirely on the non-playable back border.
  if(index===1){add('box','#bb9b76',12,1.05,.43,5.4,2.1,.66,'stone');for(let i=0;i<4;i++){const x=10+i*1.3;add('sphere','#d6b991',x,1.28,.82,.43,.62,.19,'stone');add('box','#967e64',x,1.46,1.02,.49,.10,.04);add('box','#bd9c77',x,1.27,1.05,.12,.22,.09);add('box','#90775b',x,1.04,1.02,.25,.04,.03);add('leaf','#ae8d66',x,1.85,.83,.46,.16,.23,'stone');}}
  if(index===2){for(let i=0;i<3;i++){add('trunk','#8c6846',17+i*1.5,.35,7,.12,.7,.12,'bark');add('box','#c7a47a',17+i*1.5,.65,7,.55,.3,.12);add('sphere','#9d5945',17+i*1.5,.67,7.08,.10,.10,.03);}}
  for(const b of batches.values()){const mesh=new T.InstancedMesh(F.geometries[b.kind],this.material(b.c,b.type),b.parts.length);mesh.castShadow=true;mesh.receiveShadow=true;b.parts.forEach((p,i)=>{F.dummy.position.set(p.x,p.y,p.z);F.dummy.scale.set(p.sx,p.sy,p.sz);F.dummy.rotation.set(p.tilt,p.rot,0);F.dummy.updateMatrix();mesh.setMatrixAt(i,F.dummy.matrix);});mesh.computeBoundingSphere();g.add(mesh);}F.scene.add(g);F.chunks.set(index,g);
 },
 npc(m,n,t){const x=n.x+.5,y=n.y+.5,walk=n.moving?Math.sin(this.clock*(n.running?12:7)):0,bob=Math.abs(walk)*.035,pose=!n.moving&&this.clock%7<2,skin='#f0c49b';
  const box=(dx,dy,z,w,d,h,c)=>m.box(x+dx-w/2,y+dy-d/2,z+bob,w,d,h,c);
  // Feet, articulated limbs, tunic, flak collar, belt and sandals.
  for(const side of [-1,1]){const dy=side*walk*.13;box(side*.12,dy,.08,.13,.24,.08,'#303444');m.tube({x:x+side*.12,y:y+dy,z:.17+bob},{x:x+side*.10,y,z:.48+bob},.065,n.name==='Naruto'?n.suit:'#ddd9c8');
   const hand={x:x+side*(pose?.16:.29),y:y+(pose?.22:-walk*side*.13),z:(pose?.85:.53)+bob};m.tube({x:x+side*.21,y,z:.83+bob},hand,.065,n.suit);m.ellipsoid(hand.x,hand.y,hand.z,.075,.065,.075,skin);
  }
  box(0,0,.46,.40,.25,.42,n.suit);box(0,0,.51,.42,.27,.065,'#343947');box(0,0,.83,.36,.26,.09,n.name==='Naruto'?'#2f3340':n.suit);
  box(0,0,.92,.39,.32,.35,skin);box(0,0,1.20,.44,.36,.13,n.hair);for(let i=0;i<5;i++)box(-.19+i*.09,-.02+(i%2)*.06,1.27,.10,.25,.10+(i%3)*.045,n.hair);
  if(n.name==='Sakura')for(const side of [-1,1])box(side*.22,-.02,1,.10,.34,.30,n.hair);
  box(0,.17,1.17,.40,.035,.085,'#394557');box(0,.193,1.18,.21,.018,.06,'#b6bdc0');box(0,.208,1.192,.065,.01,.018,'#52656c');
  for(const side of [-1,1]){box(side*.10,.171,1.09,.07,.018,.055,'#f9f4de');box(side*.10,.186,1.095,.035,.012,.035,n.eyes);if(n.name==='Naruto')for(let k=0;k<2;k++)box(side*.135,.172,1.01+k*.035,.065,.012,.008,'#a57c60');}
  box(0,.17,.977,.08,.012,.012,'#9f7162');
  if(n.running&&n.moving)m.ellipsoid(x-.2,y-.1,.09,.08,.08,.045,'#d9c59d');
 },
 draw(m,cam,t){for(const n of this.npcs)this.npc(m,n,t);},
 light(){F.scene.background.set('#b7d7e5');F.scene.fog=new F.T.Fog('#b7d7e5',65,130);F.sun.color.set('#fff0cc');const hemi=F.scene.children.find(o=>o.isHemisphereLight);if(hemi){hemi.color.set('#e5f5ff');hemi.groundColor.set('#82724e');}}
};
const extend=B.Maps.extend;B.Maps.extend=function(){return V.active()?V.extend():extend.call(this);};
const blocked=B.Maps.blocked;B.Maps.blocked=function(x,y){return blocked.call(this,x,y)||V.blocked(x,y);};
const update=B.CaptureSystem.update;B.CaptureSystem.update=function(dt){if(B.S.phase==='playing')V.update(dt);return update.call(this,dt);};
const chunk=F.buildChunk;F.buildChunk=function(i,l){return l.id===3?V.chunk(i,l):chunk.call(this,i,l);};
const animals=F.animals;F.animals=function(m,cam,t,l){return l.id===3?V.draw(m,cam,t):animals.call(this,m,cam,t,l);};
// Apply village daylight after the aquatic module has restored the terrestrial scene.
const environment=B.Aquatic.environment;B.Aquatic.environment=function(){environment.call(this);if(V.active())V.light();};
const draw=F.draw;F.draw=function(t){const entering=V.active()&&!this.villageActive,leaving=!V.active()&&this.villageActive;this.villageActive=V.active();if(entering||leaving){this.aquaticActive=undefined;}return draw.call(this,t);};
const reset=B.FugitiveVirus.reset,escape=B.FugitiveVirus.update;B.FugitiveVirus.reset=function(){reset.call(this);if(V.active())Object.assign(B.S.fugitive,{teleportsLeft:3,teleportCooldown:5});};
B.FugitiveVirus.update=function(dt){escape.call(this,dt);if(!V.active())return;const f=B.S.fugitive;if(!f||f.state==='CAPTURADO')return;f.teleportCooldown-=dt;if(f.teleportsLeft>0&&f.teleportCooldown<=0&&f.state==='ENCURRALADO'&&B.VirusAI.distance(f,B.S.snake[0])<4){const p=B.VirusAI.destination(7,18);if(p&&!B.Maps.blocked(p.x,p.y)){f.teleportsLeft--;f.teleportCooldown=8;f.x=p.x;f.y=p.y;f.old={...p};B.Game.burst(p.x,p.y,'#e2c7a2',8);}}};
// Arrow aliases are scoped to level three; existing controls in earlier levels stay intact.
const aliases={ArrowRight:'KeyE',ArrowLeft:'KeyW',ArrowUp:'KeyA',ArrowDown:'KeyS'},keydown=B.Movement.keydown,keyup=B.Movement.keyup;
B.Movement.keydown=function(e){if(V.active()&&aliases[e.code])return keydown.call(this,{code:aliases[e.code],target:e.target,preventDefault:()=>e.preventDefault()});return keydown.call(this,e);};
B.Movement.keyup=function(e){if(aliases[e.code]&&(V.active()||this.held.has(aliases[e.code])))return keyup.call(this,{code:aliases[e.code],preventDefault:()=>e.preventDefault()});return keyup.call(this,e);};
})();
