/* Copacabana pavement and four horizontal traffic hazards; level 4 only. */
(() => {
 const B=Boitata,F=B.Forest3D,T=window.THREE;
 const C=B.Copacabana={active:()=>B.S.level?.id===4,people:[],personMeshes:[],clock:0,
 texture(){if(this.tex)return this.tex;const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#e9e5d8';x.fillRect(0,0,1024,512);const step=8;
  for(let px=0;px<1024;px+=step)for(let py=0;py<512;py+=step){const wave=(py+Math.sin(px/67)*61+Math.sin(px/137)*22)/92,band=Math.floor(wave),dark=((band%2)+2)%2===0,v=(px*17+py*31)%8;x.fillStyle=dark?`rgb(${28+v},${30+v},${32+v})`:`rgb(${226+v*2},${222+v*2},${207+v*2})`;x.fillRect(px,py,step,step);x.fillStyle='rgba(255,255,255,.18)';x.fillRect(px+1,py+1,step-2,1);x.fillStyle='rgba(0,0,0,.2)';x.fillRect(px,py+step-1,step,1);}
  let seed=31;for(let i=0;i<11000;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const px=(seed/4294967296)*1024;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const py=(seed/4294967296)*512;x.fillStyle=i%2?'#ffffff33':'#29272428';x.fillRect(px,py,1.5,1.5);}this.tex=new T.CanvasTexture(c);this.tex.colorSpace=T.SRGBColorSpace;this.tex.wrapS=this.tex.wrapT=T.RepeatWrapping;this.tex.repeat.set(2,2);this.tex.magFilter=T.NearestFilter;this.tex.minFilter=T.LinearMipmapLinearFilter;this.tex.anisotropy=Math.min(8,F.renderer.capabilities.getMaxAnisotropy());return this.tex;},
 blocked(x,y){return this.active()&&this.people.some(c=>Math.hypot(x+.5-c.x,y+.5-c.y)<.40);},
 reset(){this.clock=0;this.people=[0,1,2,3].map(i=>({x:i%2===0?-1:25,y:[3,7,11,15][i],dir:i%2===0?1:-1,speed:.48+(i%2)*.12,phase:i*1.7,style:i}));},
 update(dt){if(!this.active())return;this.clock+=dt;for(const c of this.people){c.x+=c.dir*c.speed*dt;if(c.dir>0&&c.x>25.5)c.x=-1.5;if(c.dir<0&&c.x< -1.5)c.x=25.5;c.phase+=dt*7;}this.sync();},
 sync(){for(let i=0;i<this.personMeshes.length;i++){const c=this.people[i],g=this.personMeshes[i];if(!c||!g)continue;g.position.set(c.x,.02,c.y);g.rotation.y=c.dir>0?0:Math.PI;for(const limb of g.userData.limbs||[])limb.rotation.x=Math.sin(c.phase+(limb.userData.offset||0))*.62;g.userData.body.position.y=.03+Math.abs(Math.sin(c.phase*2))*.035;g.userData.head.rotation.z=Math.sin(c.phase)*.035;}},
 extend(){const s=B.S;s.generated=24;s.obstacles.clear();this.reset();for(let x=0;x<24;x++)for(let y=0;y<18;y++)if(!B.Maps.inside(x,y))s.obstacles.add(x+','+y);
  const cells=[];for(let x=8;x<=22;x++)for(let y=1;y<=16;y++)if(B.Maps.inside(x,y))cells.push({x,y});cells.sort((a,b)=>B.Maps.hash(a.x+47,a.y,s.level)-B.Maps.hash(b.x+47,b.y,s.level));for(const [i,p]of cells.slice(0,s.level.target+4).entries())s.items.push({...p,type:i>=s.level.target?(i%2?'health':'score'):i%5===0?'special':'common'});
 },
 person(i){const g=new T.Group(),M=c=>F.material(c),limbs=[],box=(parent,color,pos,scale,kind='box')=>{const mesh=new T.Mesh(F.geometries[kind],M(color));mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  const shirt=['#e84f47','#277fbd','#42a77a','#e0a638'][i],pants=['#35445e','#dfdfd3','#493c63','#3d5265'][i],skin='#d89c72',hair=['#442d24','#302a25','#382522','#352b27'][i];
  const body=new T.Group();g.add(body);body.userData.body=box(body,shirt,[0,.68,0],[.32,.39,.23]);
  box(body,'#f0ddba',[0,.77,.125],[.12,.18,.025]);const head=new T.Group();body.add(head);head.position.set(0,1.02,0);head.userData.head=head;box(head,skin,[0,.17,.015],[.25,.29,.22],'sphere');box(head,hair,[0,.31,-.015],[.27,.14,.23]);box(head,hair,[-.105,.22,.075],[.065,.17,.11]);box(head,hair,[.105,.23,-.015],[.065,.14,.20]);
  box(head,'#f7f4e7',[-.065,.18,.125],[.045,.035,.018]);box(head,'#f7f4e7',[.065,.18,.125],[.045,.035,.018]);box(head,'#34485a',[-.065,.18,.14],[.022,.025,.012]);box(head,'#34485a',[.065,.18,.14],[.022,.025,.012]);box(head,'#9f6753',[0,.105,.13],[.065,.018,.015]);
  for(const side of [-1,1]){const arm=new T.Group();arm.position.set(side*.205,.82,0);body.add(arm);box(arm,shirt,[0,-.15,0],[.12,.33,.14]);box(arm,skin,[0,-.34,.015],[.095,.10,.11],'sphere');arm.userData.offset=side>0?0:Math.PI;limbs.push(arm);
   const leg=new T.Group();leg.position.set(side*.09,.50,0);body.add(leg);box(leg,pants,[0,-.15,0],[.125,.32,.16]);box(leg,'#594438',[0,-.32,.035],[.14,.09,.22]);leg.userData.offset=side>0?Math.PI:0;limbs.push(leg);}
  g.userData.limbs=limbs;g.userData.body=body;g.userData.head=head;return g;
 }, chunk(i,l){const g=new T.Group();if(i===0){const floor=new T.Mesh(new T.PlaneGeometry(24,18),new T.MeshStandardMaterial({map:this.texture(),roughness:.87}));floor.rotation.x=-Math.PI/2;floor.position.set(12,-.035,9);floor.receiveShadow=true;floor.name='copacabana-waves';g.add(floor);
   // Painted, non-solid subtle wave-friendly paving accents.
   const stripeMat=F.material('#e7d8ac','stone');for(const y of [5,9,13])for(let x=0;x<24;x+=2){const m=new T.Mesh(F.geometries.box,stripeMat);m.position.set(x+1,-.018,y);m.scale.set(1,.012,.035);g.add(m);}
   // Sandy beach strips and small wooden huts sit on the non-playable boundary.
   const sand=F.material('#d7c49b','stone'),wood=F.material('#79583e','bark'),plank=F.material('#b68a5d','bark'),roof=F.material('#704c3d','bark');
   for(let x=0;x<24;x++)for(const z of [.48,17.52]){const strip=new T.Mesh(F.geometries.box,sand);strip.position.set(x+.5,-.008,z);strip.scale.set(1,.018,.92);strip.receiveShadow=true;g.add(strip);}
   const block=(x,y,z,sx,sy,sz,mat)=>{const m=new T.Mesh(F.geometries.box,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);};
   const hut=(x,z,side=false)=>{const w=side ? 0.72 : 1.55,d=side ? 1.35 : 0.72;block(x,.43,z,w,.82,d,wood);block(x,.66,z+(side ? 0 : 0.015),w-.14,.39,d+.025,plank);block(x,1.00,z,w+.24,.18,d+.20,roof);block(x,.27,z+(side?d*.28:.38),side ? 0.04 : 0.34,.47,.04,F.material('#3b332e'));for(const face of [-1,1]){const wx=x+(side?face*.20:face*.49),wz=z+(side ? 0.12 : 0.38);block(wx,.69,wz,side ? 0.035 : 0.30,.24,.035,F.material('#8fc1c3'));}for(let k=0;k<4;k++)block(x+(side ? -.27+k*.18 : -.66+k*.44),.65,z+(side?-.48:-.38),side ? 0.025 : 0.035,.42,.025,plank);};
   for(let x=2;x<=22;x+=2.5){hut(x,.25);hut(x,17.75);}
   for(const z of [2.5,5.5,8.5,11.5,14.5]){hut(.25,z,true);hut(23.75,z,true);}
   this.personMeshes.length=0;for(let i=0;i<4;i++){const person=this.person(i);g.add(person);this.personMeshes[i]=person;}this.root=g;
  }F.scene.add(g);F.chunks.set(i,g);this.sync();},
 environment(active){F.scene.background.set(active?'#9fd4f2':'#c4d9bc');F.scene.fog=new T.Fog(active?'#9fd4f2':'#c4d9bc',65,130);F.sun.color.set(active?'#fff0d0':'#fff0c4');const h=F.scene.children.find(o=>o.isHemisphereLight);if(h&&active){h.color.set('#d9f2ff');h.groundColor.set('#77766f');}}
 };
 const blocked=B.Maps.blocked;B.Maps.blocked=function(x,y){return blocked.call(this,x,y)||C.blocked(x,y);};const extend=B.Maps.extend;B.Maps.extend=function(){return C.active()?C.extend():extend.call(this);};
 const capture=B.CaptureSystem.update;B.CaptureSystem.update=function(dt){if(B.S.phase==='playing')C.update(dt);return capture.call(this,dt);};
 const chunk=F.buildChunk;F.buildChunk=function(i,l){return l.id===4?C.chunk(i,l):chunk.call(this,i,l);};
 const draw=F.draw;F.draw=function(t){const active=C.active();if(active!==this.copacabanaActive){this.copacabanaActive=active;this.aquaticActive=undefined;this.villageActive=false;C.environment(active);}const result=draw.call(this,t);if(active)C.sync();return result;};
})();
