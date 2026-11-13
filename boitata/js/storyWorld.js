/* Local cinematic sets, shared geometry, bounded particle pools and procedural sound. */
(() => {
 'use strict';const B=Boitata,T=window.THREE;if(!T)return;
 B.StoryWorld=class{
  constructor(scene){
   this.scene=scene;this.materials=new Map();this.geometries=new Map();this.effects=[];this.dummy=new T.Object3D();
   this.forest=new T.Group();this.lab=new T.Group();scene.add(this.forest,this.lab);this.lab.visible=false;
   scene.background=new T.Color('#07131f');scene.fog=new T.FogExp2('#10252d',.015);
   this.ambient=new T.HemisphereLight('#a9d6ef','#1c291c',1.3);scene.add(this.ambient);
   this.moon=new T.DirectionalLight('#b5d8ff',2.3);this.moon.position.set(-14,22,9);scene.add(this.moon);
   this.fireLight=new T.PointLight('#ff9d34',5,12,2);this.fireLight.position.set(0,1.4,.5);scene.add(this.fireLight);
   this.labLight=new T.PointLight('#52aaff',8,20);this.labLight.position.set(100,4,3);scene.add(this.labLight);
   this.ground=this.mesh(this.forest,'box','#263c2e',[22,-.55,7],[105,.8,60]);
   this.mesh(this.forest,'box','#9b8c70',[0,-.03,0],[8,.32,8]);
   this.mesh(this.forest,'box','#6e786c',[0,.18,-.1],[3.8,.32,3.5]);
   for(const x of [-3.4,3.4])for(const z of [-3.3,0,3.3]){
    this.mesh(this.forest,'column','#6d8077',[x,2.4,z],[.4,4.6,.4]);this.mesh(this.forest,'box','#87978a',[x,4.75,z],[.9,.25,.9]);
   }
   this.mesh(this.forest,'box','#677f73',[0,4.95,-3.3],[7.6,.35,1]);
   this.mesh(this.forest,'box','#819187',[0,.02,4.5],[4,.18,1.2]);
   this.runes=[];
   for(let i=0;i<16;i++){const a=i*Math.PI/8,m=this.mesh(this.forest,'box','#78d5b1',[Math.cos(a)*2.5,.365,Math.sin(a)*2.5],[.09,.018,.22],'rune');m.rotation.y=-a;this.runes.push(m);}
   // The pond has an actual translucent water surface and animated fish beneath it.
   this.mesh(this.forest,'disc','#3b8f96',[-20,-.04,16],[7,.08,6],'water');
   this.water=this.mesh(this.forest,'disc','#73c6c5',[-20,.08,16],[6.8,.025,5.8],'water');
   this.ripples=[];for(let i=0;i<4;i++){const m=this.mesh(this.forest,'ring','#a4eeef',[-20,.115,16],[1,.03,1],'water');m.rotation.x=-Math.PI/2;this.ripples.push(m);}
   this.fish=[];for(let i=0;i<7;i++){const fish=this.mesh(this.forest,'sphere',i%2?'#adc697':'#c8a26b',[-20,-.1,16],[.18,.055,.06]);this.fish.push(fish);}
   for(let i=0;i<18;i++){const a=i*2.4,r=5.9+Math.sin(i)*.7;const leaf=this.mesh(this.forest,'sphere','#528c50',[-20+Math.cos(a)*r,.18,16+Math.sin(a)*r*.8],[.35,.035,.17]);leaf.rotation.y=a;}
   this.trees=[];this.buildTrees();
   this.shadow=this.mesh(this.forest,'sphere','#020609',[3,1.8,-3],[.45,1.8,.18]);this.shadow.material.transparent=true;this.shadow.material.opacity=0;this.shadow.material.roughness=1;
   this.portal=new T.Group();this.portal.position.set(3,1.5,-1);this.forest.add(this.portal);
   for(let i=0;i<20;i++){const a=i*Math.PI/10,m=this.mesh(this.portal,'box',i%2?'#5ad9e8':'#78ef91',[Math.cos(a)*.8,Math.sin(a)*.8,0],[.06,.15,.045],'light');m.rotation.z=a;}
   this.portal.visible=false;
   this.virus=new T.Group();this.forest.add(this.virus);
   this.mesh(this.virus,'sphere','#6aa940',[0,0,0],[.36,.29,.3]);
   this.mesh(this.virus,'box','#1b3540',[0,.02,.27],[.48,.2,.09]);
   for(const s of [-1,1])this.mesh(this.virus,'box','#baff79',[s*.12,.04,.33],[.10,.05,.035],'light');
   for(let i=0;i<8;i++){const a=i*Math.PI/4;this.mesh(this.virus,'box','#92f86b',[Math.cos(a)*.46,Math.sin(a)*.36,0],[.09,.12,.1],'light');}
   this.virus.visible=false;
   this.embers=this.particles(this.forest,36,'#ffb04a',.045);
   this.flames=this.particles(this.forest,24,'#ff8d30',.15);this.flames.material=this.flames.material.clone();this.flames.material.transparent=true;this.flames.material.opacity=.48;this.flames.material.depthWrite=false;this.flames.material.blending=T.AdditiveBlending;this.materials.set('flame-aura',this.flames.material);
   this.moonDisc=this.mesh(this.forest,'sphere','#d3e8ec',[-25,14,-15],[1.1,1.1,1.1],'light');
   this.fireflies=this.particles(this.forest,70,'#bceca1',.018);
   this.code=this.particles(this.forest,28,'#72fac3',.022);
   this.trail=this.particles(this.forest,26,'#96efe0',.025);
   this.buildLab();
  }
  geometry(kind){
   if(this.geometries.has(kind))return this.geometries.get(kind);
   const g=kind==='sphere'?new T.SphereGeometry(1,16,12):kind==='column'?new T.CylinderGeometry(.86,1,1,16):kind==='disc'?new T.CylinderGeometry(1,1,1,64):kind==='ring'?new T.TorusGeometry(1,.008,4,48):new T.BoxGeometry(1,1,1);
   this.geometries.set(kind,g);return g;
  }
  material(color,type='plain'){
   const key=color+type;if(this.materials.has(key))return this.materials.get(key);
   const m=new T.MeshStandardMaterial({color,roughness:type==='metal'?.45:type==='water'?.21:.86,metalness:type==='metal'?.55:type==='water'?.15:0});
   if(type==='light'||type==='rune'){m.emissive.set(color);m.emissiveIntensity=1.1;}
   if(type==='water'){m.transparent=true;m.opacity=.55;m.depthWrite=false;}
   this.materials.set(key,m);return m;
  }
  mesh(parent,kind,color,p,s,type){const m=new T.Mesh(this.geometry(kind),this.material(color,type));m.position.set(...p);m.scale.set(...s);parent.add(m);return m;}
  buildTrees(){
   let seed=3168;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const trees=[];
   for(let i=0;i<160;i++){
    const x=-34+random()*112,z=-21+random()*52;
    if((Math.abs(x)<6&&Math.abs(z)<7)||(Math.hypot((x+20)/1.2,z-16)<8)||(x>-4&&z>-11&&z<11)||(x<2&&x>-27&&Math.abs(z+x*.8)<4.5))continue;
    const height=3.7+random()*4;trees.push({x,z,height,a:random()*6});
   }
   for(const [kind,color,mult]of [['column','#4b5446',0],['sphere','#316748',1],['sphere','#7eaf60',2]]){
    const inst=new T.InstancedMesh(this.geometry(kind),this.material(color),trees.length);inst.frustumCulled=false;
    trees.forEach((p,i)=>{const d=this.dummy;d.position.set(p.x+(mult===2?.35:0),mult?p.height: p.height*.45,p.z);d.rotation.set(0,p.a,0);d.scale.set(mult?1.6:.18,mult?1.5:p.height*.9,mult?1.5:.22);d.updateMatrix();inst.setMatrixAt(i,d.matrix);});
    this.forest.add(inst);this.trees.push(inst);
   }
   // Ground cover stays outside the travel corridor and is batched into one draw call.
   const flowers=new T.InstancedMesh(this.geometry('sphere'),this.material('#d4daa2'),120);
   for(let i=0;i<120;i++){const d=this.dummy;d.position.set(-27+random()*93,.05,-16+random()*39);d.scale.set(.045,.07,.045);d.updateMatrix();flowers.setMatrixAt(i,d.matrix);}this.forest.add(flowers);
   const grass=new T.InstancedMesh(this.geometry('column'),this.material('#6a974a'),1000);
   for(let i=0;i<1000;i++){const x=-29+random()*100,z=-17+random()*42,d=this.dummy;d.position.set(x,.045,z);d.rotation.set(.18,random()*6,.12);d.scale.set(.015,.12+random()*.14,.015);d.updateMatrix();grass.setMatrixAt(i,d.matrix);}this.forest.add(grass);
  }
  particles(parent,count,color,size){const mesh=new T.InstancedMesh(this.geometry('sphere'),this.material(color,'light'),count);mesh.userData.size=size;mesh.frustumCulled=false;parent.add(mesh);return mesh;}
  buildLab(){
   const g=this.lab;g.position.x=100;
   this.mesh(g,'box','#131f2c',[0,-.2,0],[13,.4,14],'metal');
   this.mesh(g,'box','#152234',[0,3,-4],[13,6,.3],'metal');
   for(const s of [-1,1])this.mesh(g,'box','#101b28',[s*6.4,3,0],[.3,6,10],'metal');
   this.monitors=[];this.cuffs=[];
   for(const x of [-4.8,-3,3,4.8]){
    this.mesh(g,'box','#273b50',[x,2.8,-3.7],[1.4,1.3,.13],'metal');
    const screen=this.mesh(g,'box','#387ea1',[x,2.8,-3.61],[1.2,1.05,.015],'light');this.monitors.push(screen);
   }
   for(let i=0;i<12;i++){this.mesh(g,'box','#286788',[-5+i*.9,.02,-1],[.018,.012,8],'light');}
   for(const x of [-1.3,1.3]){
    this.mesh(g,'box','#253648',[x,.55,0],[1.2,1.1,1.3],'metal');
    this.mesh(g,'box','#14202d',[x,1.52,-.4],[1.1,2.0,.22],'metal');
    this.mesh(g,'box','#3b8da7',[x,1.65,-.25],[.78,.035,.025],'light');
    for(const side of [-1,1]){
     this.mesh(g,'box','#536174',[x+side*.56,1.03,.30],[.18,.15,.85],'metal');
     const cuff=this.mesh(g,'ring','#5ecaff',[x+side*.48,1.15,.44],[.11,.11,.11],'light');cuff.rotation.y=Math.PI/2;this.cuffs.push(cuff);
     this.mesh(g,'column','#163844',[x+side*.4,.15,-.4],[.06,.3,.06],'metal');
     const cableGeometry=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(x+side*.4,1.4,-.52),new T.Vector3(x+side*.65,.35,-1.2),new T.Vector3(x+side*.9,.08,-2.1),new T.Vector3(x+side*.85,.08,-3.7)]),24,.035,8,false);
     this.geometries.set('cable-'+x+'-'+side,cableGeometry);g.add(new T.Mesh(cableGeometry,this.material('#24536b','metal')));
    }
   }
  }
  update(t,{fire=0,day=0,shadow=0,portal=0,flight=0,iara,virus}={}){
   this.moon.color.setRGB(.66+day*.34,.82+day*.10,1-day*.35);this.moon.intensity=2.3+day*1.8;
   this.ambient.intensity=1.3+day*.7;this.scene.background.set('#07131f').lerp(new T.Color('#a6c68a'),day);this.scene.fog.color.set('#10252d').lerp(new T.Color('#a6c68a'),day);
   this.ground.material.color.set('#263c2e').lerp(new T.Color('#88a75c'),day);
   this.shadow.material.opacity=shadow*.92;this.shadow.position.set(3-shadow*1.2,1.8,-3+shadow*1.5);this.shadow.scale.set(.45+shadow*.7,1.8+shadow*.6,.25);
   for(const m of this.runes)m.material.emissiveIntensity=fire*(.7+Math.sin(t*3)*.13);
   this.fireLight.intensity=fire*(4.5+Math.sin(t*8)*.6);
   this.portal.visible=portal>0;this.portal.scale.setScalar(Math.max(.001,portal));this.portal.rotation.z=t*.7;
   for(let i=0;i<this.ripples.length;i++){const r=(t*.23+i*.6)%2.4+.3,m=this.ripples[i];m.scale.set(r,r,1);m.material.opacity=.24;}
   this.water.position.y=.08+Math.sin(t*1.7)*.006;
   this.fish.forEach((m,i)=>{const a=t*.25+i*.9;m.position.set(-20+Math.cos(a)*(1+i*.45),-.10,16+Math.sin(a)*(1+i*.28));m.rotation.y=-a;});
   const update=(pool,point)=>{for(let i=0;i<pool.count;i++){const p=point(i),d=this.dummy;d.position.set(p[0],p[1],p[2]);d.rotation.set(0,t+i,0);d.scale.setScalar(pool.userData.size*(p[3]??1));d.updateMatrix();pool.setMatrixAt(i,d.matrix);}pool.instanceMatrix.needsUpdate=true;};
   this.embers.visible=fire>.001;update(this.embers,i=>{const a=i*2.4+t*.3,r=.3+(i%7)*.15;return [Math.cos(a)*r,.5+(t*.7+i*.13)%2,Math.sin(a)*r,fire*(.5+Math.sin(i+t)*.3)];});
   this.flames.visible=fire>.001;for(let i=0;i<this.flames.count;i++){const a=i*2.4,r=.35+(i%5)*.21,phase=(t*1.1+i*.17)%1,d=this.dummy;d.position.set(Math.cos(a)*r,.65+phase*.65,Math.sin(a)*r);d.rotation.set(Math.sin(t*2+i)*.25,0,Math.cos(t*3+i)*.15);d.scale.set(.13*fire*(1-phase*.5),(.23+phase*.20)*fire,.10*fire*(1-phase*.5));d.updateMatrix();this.flames.setMatrixAt(i,d.matrix);}this.flames.instanceMatrix.needsUpdate=true;
   update(this.fireflies,i=>[-29+(i*7.371)%95, .3+(i*.43+t*.02)%4,-15+(i*3.871)%40,.5+Math.sin(t+i)*.3]);
   this.code.visible=!!virus;update(this.code,i=>{const a=i*2.4+t;return [(virus?.x||0)+Math.cos(a)*.5,(virus?.y||0)+(i%5)*.1,(virus?.z||0)+Math.sin(a)*.5,.6];});
   this.trail.visible=flight>0;update(this.trail,i=>[(iara?.x||0)-i*.12,(iara?.y||0)+.7+Math.sin(i+t)*.04,(iara?.z||0)+Math.cos(i)*.1,flight*(1-i/26)]);
   this.monitors.forEach((m,i)=>{m.material.emissiveIntensity=.5+(Math.sin(t*13+i)> .85?1.3:.1);m.scale.y=1+Math.sin(t*23+i)*.03;});
  }
  dispose(){const instances=[];this.scene.traverse(o=>{if(o.isInstancedMesh)instances.push(o);});instances.forEach(o=>o.dispose());for(const g of this.geometries.values())g.dispose();for(const m of this.materials.values())m.dispose();}
 };
 B.StorySound=class{
  constructor(settings){this.settings=settings;this.nodes=new Set();this.lastBeat=-1;this.events=new Set();this.ctx=null;
   if(!settings.music&&!settings.effects)return;
   try{
    this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.16;this.master.connect(this.ctx.destination);this.ctx.resume();
    if(settings.effects){
     const buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate),data=buffer.getChannelData(0);let seed=217;
     for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
     const noise=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter();this.air=this.ctx.createGain();noise.buffer=buffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=780;noise.connect(filter);filter.connect(this.air);this.air.connect(this.master);this.air.gain.value=.04;noise.start();this.nodes.add(noise);
    }
   }catch{}
  }
  tone(f,duration=1,type='sine',gain=.12,to=f){
   const c=this.ctx;if(!c||c.state!=='running')return;const o=c.createOscillator(),g=c.createGain(),start=c.currentTime;o.type=type;o.frequency.setValueAtTime(f,start);o.frequency.exponentialRampToValueAtTime(Math.max(10,to),start+duration);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),start+.035);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(this.master);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};o.start();o.stop(start+duration);
  }
  update(t,scene){
   if(this.air)this.air.gain.value=scene===2?.055+Math.sin(t*1.7)*.02:scene===4||scene===7?.08:scene===8?0:.025;
   const beat=Math.floor(t/.8);if(this.settings.music&&beat!==this.lastBeat){this.lastBeat=beat;const notes=scene===9?[43.65,55,65.41,58.27]:scene===7?[110,146.83,164.81,220]:scene===2?[196,246.94,293.66,246.94]:[55,82.41,73.42,65.41];this.tone(notes[beat%4],1.5,'triangle',.11);this.tone(notes[beat%4]*2,1.8,'sine',.035);}
   if(!this.settings.effects)return;
   for(const [at,id]of [[3,'wind'],[20,'shadow'],[28,'glitch'],[50.3,'cry'],[63,'lift'],[100,'portal'],[109,'flee'],[152,'lab'],[165,'corrupt']])if(t>=at&&!this.events.has(id)){this.events.add(id);
    if(id==='cry'){this.tone(530,2.2,'sawtooth',.10,1240);this.tone(541,2.6,'sine',.12,190);}
    else if(id==='glitch'||id==='corrupt'){this.tone(54,1.6,'sawtooth',.14,32);this.tone(930,.7,'triangle',.04,70);}
    else if(id==='lift'||id==='portal'){this.tone(150,2,'sine',.12,740);}
    else this.tone(id==='wind'?92:43,3,'sine',.15,35);
   }
  }
  pause(paused){if(!this.ctx)return;if(paused)this.ctx.suspend();else this.ctx.resume();}
  stop(){for(const n of this.nodes)try{n.stop();}catch{}this.nodes.clear();if(this.ctx){this.ctx.close();this.ctx=null;}}
 };
})();
