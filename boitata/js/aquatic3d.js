/* Exclusive level-two environment. All coordinates use the existing finite arena. */
(() => {
 const B=Boitata,F=B.Forest3D,T=window.THREE;
 const A=B.Aquatic={fish:[],active:()=>B.S.level?.id===2,
 reset(){this.fish=[];if(!this.active())return;
  for(const [i,p] of [[9,4],[16,12],[20,5]].entries()){
   if(!B.S.obstacles.has(p.join(','))&&!B.S.obstacles.has((p[0]+1)+','+p[1]))this.fish.push({x:p[0],y:p[1],a:p[0],b:p[0]+1,dir:1,id:i,solid:true});
  }
 },
 blocked(x,y){return this.active()&&this.fish.some(f=>f.solid&&Math.abs(f.x-x)<.78&&Math.abs(f.y-y)<.65);},
 update(dt){if(!this.active())return;const s=B.S;
  for(const f of this.fish){let x=f.x+f.dir*dt*.23;if(x<f.a||x>f.b){f.dir*=-1;x=Math.max(f.a,Math.min(f.b,x));}
   const actors=[...s.snake,...s.items,...s.enemies,s.fugitive,s.predator].filter(Boolean);
   if(!actors.some(p=>Math.hypot(p.x-x,p.y-f.y)<1.6)&&!s.obstacles.has(Math.round(x)+','+f.y))f.x=x;
  }
 },
 environment(){if(!T||!F.scene)return;const active=this.active();
  if(this.group){F.scene.remove(this.group);this.group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});this.group=null;}
  F.scene.background.set(active?'#438fa8':'#c4d9bc');F.scene.fog=new T.Fog(active?'#52b8ca':'#c4d9bc',active?48:65,active?110:130);
  F.sun.color.set(active?'#bcefff':'#fff0c4');const hemi=F.scene.children.find(o=>o.isHemisphereLight);if(hemi){hemi.color.set(active?'#c6fbff':'#e1f5ff');hemi.groundColor.set(active?'#427e91':'#52633a');}
  if(!active)return;const g=this.group=new T.Group();F.scene.add(g);
  // A real, closed transparent volume surrounds actors, from seabed to overhead surface.
  const mat=new T.MeshPhysicalMaterial({color:'#43cbd9',transparent:true,opacity:.075,roughness:.3,metalness:0,side:T.DoubleSide,depthWrite:false});
  const water=new T.Mesh(new T.BoxGeometry(24,4.8,18),mat);water.position.set(12,2.25,9);water.renderOrder=4;water.name='aquatic-volume';g.add(water);
  const surface=new T.Mesh(new T.PlaneGeometry(24,18,32,24),new T.MeshBasicMaterial({color:'#b7ffff',transparent:true,opacity:.045,side:T.DoubleSide,depthWrite:false,wireframe:true}));surface.rotation.x=-Math.PI/2;surface.position.set(12,4.65,9);surface.name='overhead-ripples';g.add(surface);this.surface=surface;
  for(let i=0;i<6;i++){const ray=new T.Mesh(new T.CylinderGeometry(.15,.85,4.5,5,1,true),new T.MeshBasicMaterial({color:'#d4ffff',transparent:true,opacity:.035,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}));ray.position.set(2+i*4,2.4,3+(i%3)*5);ray.rotation.z=.23;g.add(ray);}
 },
 chunk(index,l){const batches=new Map(),g=new T.Group(),hash=(x,y)=>B.Maps.hash(x,y,l);
  const add=(kind,c,x,y,z,sx,sy,sz,type='plain',rot=0)=>{const key=kind+c+type;if(!batches.has(key))batches.set(key,{kind,c,type,parts:[]});batches.get(key).parts.push([x,y,z,sx,sy,sz,rot]);};
  add('box','#719fa6',index*8+4,-.5,9,8,.9,18,'stone');add('box','#dfd9b0',index*8+4,-.04,9,8,.13,18,'stone');
  for(let x=index*8;x<index*8+8;x++)for(let y=0;y<18;y++){
   const r=hash(x,y),solid=B.S.obstacles.has(x+','+y),edge=!B.Maps.inside(x,y);
   add('box',r>.55?'#c6d7be':'#d7dec4',x+.5,.035,y+.5,.75,.035,.82,'stone',r*.5);
   if(solid){
    add('sphere',edge?'#739da1':'#88aca2',x+.5,.18,y+.5,.44,.25,.44,'stone',r*6);
    const height=edge?.5+r*.6:.65+r*1.15;
    for(let k=0;k<3+Math.floor(r*4);k++){const a=k*2.4+r*6,px=x+.5+Math.cos(a)*.24,pz=y+.5+Math.sin(a)*.24,h=height*(.7+hash(x+k,y)*.3);
     add('trunk','#277f75',px,h/2,pz,.04,h,.04,'kelp');
     for(let j=1;j<4;j++)add('leaf',k%2?'#42ae88':'#268e96',px+Math.sin(j+a)*.12,h*j/4,pz+Math.cos(j+a)*.12,.13+r*.08,.27,.065,'kelp',a+j);
    }
   }else if(r>.87){for(let k=0;k<3;k++)add('cone','#64b99a',x+.3+k*.16,.16,y+.4,.08,.3,.07,'kelp');}
   else if(r<.14){add('sphere','#87adb0',x+.7,.08,y+.3,.16,.10,.13,'stone');add('leaf','#fff0d1',x+.3,.065,y+.65,.14,.045,.12,'plain',r*30);}
   else if(r>.64&&r<.7){for(let k=0;k<3;k++){add('trunk',k%2?'#e4a894':'#bb84a3',x+.3+k*.13,.15+k*.04,y+.7,.055,.3+k*.08,.055);add('box','#f3c7a7',x+.3+k*.13,.31+k*.08,y+.7,.12,.07,.1);}}
  }
  for(const b of batches.values()){const mesh=new T.InstancedMesh(F.geometries[b.kind],F.material(b.c,b.type),b.parts.length);mesh.castShadow=true;mesh.receiveShadow=true;
   b.parts.forEach((p,i)=>{F.dummy.position.set(...p.slice(0,3));F.dummy.scale.set(...p.slice(3,6));F.dummy.rotation.set(0,p[6],0);F.dummy.updateMatrix();mesh.setMatrixAt(i,F.dummy.matrix);});mesh.computeBoundingSphere();g.add(mesh);}
  F.scene.add(g);F.chunks.set(index,g);
 },
 drawFish(m,x,y,z,scale,color,t,dir=1){const tail=Math.sin(t*.004+x)*.10,front=dir*.29*scale;
  m.ellipsoid(x,y,z,.32*scale,.13*scale,.19*scale,color);m.ellipsoid(x+front,y,z+.025*scale,.12*scale,.12*scale,.13*scale,color);
  for(const side of [-1,1]){m.tube({x:x-dir*.24*scale,y,z},{x:x-dir*.48*scale,y:y+side*.16*scale+tail,z:z+side*.12*scale},.045*scale,color);m.tube({x,y:y+side*.09*scale,z},{x:x-.10*dir*scale,y:y+side*(.23*scale+tail),z:z-.06},.025*scale,'#ffe2a4');m.ellipsoid(x+front,y+side*.106*scale,z+.065*scale,.035*scale,.025*scale,.035*scale,'#142d44');}
  m.box(x-.07*scale,y-.14*scale,z-.08*scale,.065*scale,.28*scale,.23*scale,'#fff0bc');
 },
 effects(m,t){const s=B.S;for(const f of this.fish)this.drawFish(m,f.x+.5,f.y+.5,.48,1.25,'#ecb34e',t,f.dir);
  for(let i=0;i<12;i++){const group=Math.floor(i/4),phase=t*.00016+group*2,baseX=5+group*6,baseY=3+group*4,x=baseX+Math.sin(phase)*.65+(i%4)*.24,y=baseY+Math.cos(phase)*.4+(i%3)*.18;
   if(!s.obstacles.has(Math.floor(x)+','+Math.floor(y)))this.drawFish(m,x,y,1.5+(i%3)*.2,.45,i%2?'#f49976':'#61d8e4',t,Math.cos(phase)>=0?1:-1);
  }
  const n=F.profiles[F.quality].detail*14;
  for(let i=0;i<n;i++){const z=(t*.00024+i*.43)%4.6,x=.8+(i*3.71)%22.3+Math.sin(t*.0006+i)*.08,y=.8+(i*5.17)%16.3;m.ellipsoid(x,y,z,.018,.018,.025,i%3?'#b3e9dc':'#e1ffff');}
  const points=B.Characters.points(s,Math.min(1,s.acc/s.level.stepMs));for(let i=0;i<Math.min(6,points.length);i++){const p=points[i];m.ellipsoid(p.x+.07*Math.sin(t*.003+i),p.y,(t*.0007+i*.31)%2.6+.5,.025,.025,.034,'#c9ffff');}
  for(const p of [s.fugitive,s.predator].filter(Boolean))m.ellipsoid(p.x+.5,p.y+.5,.9+(t*.0005)%1,.025,.025,.04,'#a6f1ff');
  if(this.surface)this.surface.material.opacity=.035+Math.sin(t*.0007)*.01;
 }
 };
 const blocked=B.Maps.blocked;B.Maps.blocked=function(x,y){return blocked.call(this,x,y)||A.blocked(x,y);};
 const safe=B.Maps.safe;B.Maps.safe=function(x,y){if(!A.active())return safe.call(this,x,y);return x<=7||x>=21||y>=8&&y<=10||y<=2||y>=15||x===12||y===6;};
 const setup=B.Game.setup;B.Game.setup=function(){A.fish=[];setup.call(this);A.reset();};
 const update=B.CaptureSystem.update;B.CaptureSystem.update=function(dt){if(B.S.phase==='playing')A.update(dt);return update.call(this,dt);};
 const chunk=F.buildChunk;F.buildChunk=function(i,l){return l.id===2?A.chunk(i,l):chunk.call(this,i,l);};
 const animals=F.animals;F.animals=function(m,cam,t,l){return l.id===2?A.effects(m,t):animals.call(this,m,cam,t,l);};
 const draw=F.draw;F.draw=function(t){const next=B.S.level?.id===2;if(this.aquaticActive!==next){this.aquaticActive=next;A.environment();}return draw.call(this,t);};
 const material=F.material;F.material=function(color,type){if(type!=='kelp')return material.call(this,color,type);const key=color+type;if(this.materials.has(key))return this.materials.get(key);const mat=material.call(this,color,'leaf').clone();mat.onBeforeCompile=shader=>{shader.uniforms.aquaTime=this.time;shader.vertexShader='uniform float aquaTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(aquaTime*1.2+position.y*2.0)*0.12*(position.y+0.5);');};mat.customProgramCacheKey=()=> 'aquatic-kelp';this.materials.set(key,mat);return mat;};
})();
/* The underwater escape allowance belongs to this arena only. */
(() => {
 const B=Boitata,A=B.Aquatic,F=B.Forest3D,reset=B.FugitiveVirus.reset,update=B.FugitiveVirus.update;
 B.FugitiveVirus.reset=function(){reset.call(this);if(A.active())Object.assign(B.S.fugitive,{teleportsLeft:3,teleportCooldown:5});};
 B.FugitiveVirus.update=function(dt){update.call(this,dt);if(!A.active())return;const f=B.S.fugitive;if(!f||f.state==='CAPTURADO')return;f.teleportCooldown-=dt;
  if(f.teleportsLeft>0&&f.teleportCooldown<=0&&f.state==='ENCURRALADO'&&B.VirusAI.distance(f,B.S.snake[0])<4){const p=B.VirusAI.destination(7,18);if(p&&!B.Maps.blocked(p.x,p.y)){f.teleportsLeft--;f.teleportCooldown=8;f.x=p.x;f.y=p.y;f.old={...p};B.Game.burst(p.x,p.y,'#94efff',8);}}
 };
 const environment=A.environment;A.environment=function(){environment.call(this);F.resize();};
})();
