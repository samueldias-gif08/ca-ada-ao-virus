/* Stone maze and stationary center virus, isolated to level 8. */
(() => {
 const B=Boitata,F=B.Forest3D,T=window.THREE;
 const checkpoint={x:6,y:9};
 const plateColumns=[7,8,9];
 const plateDelays=[0,.42,.84];
 const barLayout=[{x:8,y:13.5,delay:0},{x:11,y:1.5,delay:1.65}];
 const clamp=value=>Math.max(0,Math.min(1,value));
 const ease=value=>{const u=clamp(value);return u*u*(3-2*u);};
 const cycle=(time,delay,period)=>time<delay?0:(time-delay)%period;
 const M=B.GardenMaze={active:()=>B.S.level?.id===8&&B.S.phase!=='menu',center:{x:11,y:9},walls:new Set(),target:null,
 validateMaze(open,start,goal){const key=p=>p.x+','+p.y,queue=[start],parent=new Map(),ways=new Map([[key(start),1]]),seen=new Set([key(start)]);let turns=0;
  for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:queue[i].x+dx,y:queue[i].y+dy},k=key(n);if(!open.has(k))continue;if(!seen.has(k)){seen.add(k);parent.set(k,key(queue[i]));queue.push(n);ways.set(k,Math.min(2,ways.get(key(queue[i]))));}else if(parent.get(key(queue[i]))!==k)ways.set(k,Math.min(2,(ways.get(k)||0)+1));}
  const route=[];let k=key(goal);if(!seen.has(k))return {valid:false,route,reachable:seen.size,unique:false,turns:0};while(k!==key(start)){route.push(k);k=parent.get(k);if(!k)return {valid:false,route:[],reachable:seen.size,unique:false,turns:0};}route.push(key(start));route.reverse();for(let i=2;i<route.length;i++){const [ax,ay]=route[i-2].split(',').map(Number),[bx,by]=route[i-1].split(',').map(Number),[cx,cy]=route[i].split(',').map(Number);if(bx-ax!==cx-bx||by-ay!==cy-by)turns++;}let edges=0;for(const k of seen){const [x,y]=k.split(',').map(Number);if(seen.has((x+1)+','+y))edges++;if(seen.has(x+','+(y+1)))edges++;}const unique=seen.size===open.size&&edges===seen.size-1;return {valid:seen.has(key(goal))&&seen.size===open.size,route,reachable:seen.size,unique,edges,turns};
 },
 respawn(){
  const s=B.S;
  const origin=s.mazeTraps?.fall?checkpoint:this.start;
  s.snake=[{...origin}];s.oldSnake=[{...origin}];
  s.dir={x:1,y:0};s.oldDir={...s.dir};s.pending=[];
  if(s.mazeTraps)s.mazeTraps.glide=null;
  B.Movement.clear();
 },
 generate(){
  const s=B.S,open=new Set(),goal={...this.center};
  const corridors=[
   [1,20,14,16],[18,20,2,13],[3,17,2,4],[3,5,5,10],[6,12,8,10],
   [11,13,11,12],[14,17,6,8],[2,5,12,13],[8,10,5,6]
  ];
  for(const [left,right,top,bottom] of corridors){
   for(let x=left;x<=right;x++)for(let y=top;y<=bottom;y++)open.add(x+','+y);
  }
  this.start={x:2,y:15};this.target=goal;
  this.validation=this.validateMaze(open,this.start,goal);
  if(!this.validation.valid)throw Error('O labirinto contém uma área desconectada.');
  this.open=open;
  this.walls=new Set();
  s.obstacles.clear();
  for(let x=0;x<24;x++)for(let y=0;y<18;y++){
   const key=x+','+y;
   if(open.has(key))continue;
   this.walls.add(key);s.obstacles.add(key);
  }
  s.generated=24;
  s.mazeTraps={bars:barLayout.map(bar=>({...bar,length:0,state:'RETRACTED'})),fall:null};
  this.respawn();
  s.items=[
   {x:3,y:12,type:'common'},{x:9,y:6,type:'special'},
   {x:14,y:7,type:'common'},{x:12,y:12,type:'special'}
  ];
  s.fugitive={x:goal.x,y:goal.y,old:{...goal},state:'HIDING',moveClock:0,visualClock:1};
 },
 plateState(index,time=B.S.elapsed){
  const phase=cycle(time,plateDelays[index],3);
  if(phase<1)return {state:'SAFE',drop:0,solid:true};
  if(phase<1.7)return {state:'WARNING',drop:0,solid:true};
  if(phase<2.3)return {state:'FALLING',drop:2.4*ease((phase-1.84)/.46),solid:phase<1.84};
  return {state:'RECOVERING',drop:2.4*(1-ease((phase-2.3)/.55)),solid:phase>=2.85};
 },
 platformAt(x,y){
  return y>=7.5&&y<10.5?plateColumns.indexOf(Math.round(x)):-1;
 },
 overHole(x,y){
  const i=this.platformAt(x,y);
  return i>=0&&!this.plateState(i).solid;
 },
 barState(time,delay){
  const phase=cycle(time,delay,4);
  if(phase<1)return {state:'RETRACTED',length:0};
  if(phase<1.5)return {state:'WARNING',length:0};
  if(phase<2)return {state:'EXTENDING',length:3*ease((phase-1.5)/.5)};
  if(phase<3)return {state:'EXTENDED',length:3};
  return {state:'RETRACTING',length:3*(1-ease(phase-3))};
 },
 barBlocked(x,y){
  return B.S.mazeTraps?.bars.some(bar=>bar.length>0&&Math.abs(x-bar.x)<.36&&
   y>=bar.y-.08&&y<bar.y+bar.length+.24);
 },
 slide(next){
  const s=B.S,a=s.mazeTraps,h=s.snake[0];
  if(!a||h.x<17.5||h.x>20.5||h.y<5||h.y>12.5){
   if(a)a.glide=null;
   return next;
  }
  const input=next?{x:next.x-h.x,y:next.y-h.y}:{x:0,y:0};
  const old=a.glide||input;
  const drift=next?.17:0;
  const vx=old.x*.63+input.x*.37+drift,vy=old.y*.63+input.y*.37;
  const speed=Math.hypot(vx,vy);
  if(speed<.12){a.glide=null;return null;}
  const scale=Math.max(1,speed);
  a.glide={x:vx/scale,y:vy/scale};
  s.dir={x:vx/speed,y:vy/speed};
  return {x:h.x+a.glide.x,y:h.y+a.glide.y};
 },
 baseContact(x,y){
  return B.S.mazeTraps?.bars.some(bar=>Math.abs(x-bar.x)<.55&&Math.abs(y-bar.y)<.56);
 },
 handleStep(next){
  const s=B.S,h=s.snake[0];
  const dx=next.x-h.x,dy=next.y-h.y;
  for(let i=1;i<=8;i++){
   const x=h.x+dx*i/8,y=h.y+dy*i/8;
   // A parede continua sendo resolvida pela colisão original.
   if(this.walls.has(Math.round(x)+','+Math.round(y)))return false;
   if(this.baseContact(x,y)||this.barBlocked(x,y)){
    B.Player.hurt();B.UI.hud();return true;
   }
   if(this.overHole(x,y)){this.startFall({x,y});return true;}
  }
  return false;
 },
 startFall(to){
  const s=B.S;
  s.mazeTraps.fall={elapsed:0,to,head:{...s.snake[0]}};
  s.oldSnake=s.snake.map(p=>({...p}));s.acc=0;
 },
 updateTraps(dt){
  const s=B.S,a=s.mazeTraps;
  if(s.phase!=='playing'||!a)return;
  if(a.fall){
   a.fall.elapsed+=dt;
   if(a.fall.elapsed>=.42){
    s.invuln=0;
    B.Player.hurt();
    a.fall=null;
    B.UI.hud();
   }
   return;
  }
  const alpha=Math.min(1,s.acc/s.level.stepMs),head=s.snake[0],old=s.oldSnake[0]||head;
  const visible={x:old.x+(head.x-old.x)*alpha,y:old.y+(head.y-old.y)*alpha};
  for(const bar of a.bars){
   const {state,length}=this.barState(s.elapsed,bar.delay);
   bar.state=state;
   // A barra para antes de alcançar o guardião; a retração continua livre.
   const clearance=p=>Math.abs(p.x-bar.x)<.40&&p.y>=bar.y-.24&&p.y<=bar.y+3.27
    ?Math.max(0,p.y-bar.y-.27):3;
   const limit=Math.min(clearance(head),clearance(visible));
   const reachesPlayer=length>bar.length&&length>limit&&s.invuln<=0;
   bar.length=length>bar.length?Math.min(length,limit):length;
   if(reachesPlayer){B.Player.hurt();B.UI.hud();return;}
  }
  if(this.overHole(visible.x,visible.y)||this.overHole(head.x,head.y))this.startFall(visible);
 },
 pose(path){
  const fall=B.S.mazeTraps?.fall;
  if(!fall)return path;
  const u=clamp(fall.elapsed/.42);
  return path.map((p,i)=>({...p,x:p.x+(fall.to.x-fall.head.x)*u,
   y:p.y+(fall.to.y-fall.head.y)*u,z:p.z-2.35*Math.max(0,u-i*.1)**2}));
 },
 drawTraps(m){
  const s=B.S;
  if(!s.mazeTraps)return;
  for(let y=5;y<=12;y++){
   m.box(18.03,y+.03,-.019,2.94,.94,.039,y%2?'#68bbd6':'#8fd8eb');
   m.tube({x:18.18,y:y+.16,z:.025},{x:20.36,y:y+.80,z:.025},.018,'#d8f7ff');
   m.box(20.70,y+.14,.023,.055,.67,.014,'#36a1c1','glow');
  }
  for(const bar of s.mazeTraps.bars){
   const x=bar.x+.5,y=bar.y+.5,lit=bar.state!=='RETRACTED';
   const red=lit?'#ff4257':'#673341';
   m.box(x-.31,y-.28,.12,.62,.34,.58,'#465163');
   m.box(x-.26,y-.07,.63,.52,.12,.06,red,'glow');
   if(bar.length<=0)continue;
   const end=y+bar.length;
   m.tube({x,y,z:.38},{x,y:end,z:.38},.18,'#8190a5');
   m.tube({x,y,z:.49},{x,y:end,z:.49},.038,red);
   m.ellipsoid(x,end,.38,.18,.13,.18,'#aab6c4');
   if(lit&&Math.sin(s.elapsed*27)>0)m.tube({x:x-.15,y:end-.18,z:.45},{x:x+.13,y:end,z:.61},.027,'#ff9fa9');
  }
  for(const [i,x] of plateColumns.entries()){
   const p=this.plateState(i),y=8;
   const amber=p.state==='WARNING',red=p.state==='FALLING'||p.state==='RECOVERING';
   const z=-p.drop+(amber?Math.sin(s.elapsed*43+i)*.018:0);
   const color=amber?(Math.sin(s.elapsed*20)>0?'#ffce56':'#b98a37'):red?'#ff4861':'#55c7ea';
   m.box(x,y,-2.52,1,3,.11,'#111727');
   m.box(x+.025,y+.025,z-.19,.95,2.95,.23,'#455567');
   m.box(x+.11,y+.09,z+.045,.07,2.82,.025,color,'glow');
   m.box(x+.82,y+.09,z+.045,.07,2.82,.025,color,'glow');
   if(amber||red){
    const middle={x:x+.48,y:y+1.52,z:z+.065};
    m.tube({x:x+.19,y:y+.66,z:z+.065},middle,.022,color);
    m.tube(middle,{x:x+.73,y:y+2.34,z:z+.065},.022,color);
   }
  }
 },
 chunk(i,l){const g=new T.Group();if(i===0){for(const [x,y,w,h] of [[0,0,24,8],[0,11,24,7],[0,8,7,3],[10,8,14,3]]){
   const ground=new T.Mesh(F.geometries.box,F.material('#c2b6a1'));
   ground.position.set(x+w/2,-.08,y+h/2);ground.scale.set(w,.08,h);ground.receiveShadow=true;g.add(ground);
  }
   const batches=new Map(),add=(kind,color,x,y,z,sx,sy,sz)=>{const k=kind+color;if(!batches.has(k))batches.set(k,{kind,color,items:[]});batches.get(k).items.push({x,y,z,sx,sy,sz});};
   for(let x=0;x<24;x++)for(let y=0;y<18;y++){if(!this.walls.has(x+','+y)){
    continue;}
    const edge=!B.Maps.inside(x,y);
    const stone=B.Maps.hash(x+71,y+9,l)>.5?'#697685':'#75818d';
    add('box',edge?'#414d5c':'#525e6c',x+.5,.51,y+.5,1,1.02,1);
    add('box',stone,x+.5,1.06,y+.5,.985,.13,.985);
    for(const z of [.32,.68])for(const side of [-1,1]){
     if(this.open.has(x+','+(y+side)))add('box','#8894a1',x+.5,z,y+.5+side*.49,.95,.29,.025);
     if(this.open.has((x+side)+','+y))add('box','#818d9a',x+.5+side*.49,z,y+.5,.025,.29,.95);
    }
   }
   for(const b of batches.values()){
    const mesh=new T.InstancedMesh(F.geometries[b.kind],F.material(b.color),b.items.length);
    mesh.castShadow=true;mesh.receiveShadow=true;
    b.items.forEach((p,n)=>{F.dummy.position.set(p.x,p.y,p.z);F.dummy.scale.set(p.sx,p.sy,p.sz);F.dummy.updateMatrix();mesh.setMatrixAt(n,F.dummy.matrix);});
    mesh.computeBoundingSphere();g.add(mesh);
   }
   const plaza=new T.Mesh(F.geometries.box,F.material('#a7a093'));plaza.position.set(11.5,.015,9.5);plaza.scale.set(2.9,.035,2.9);plaza.receiveShadow=true;g.add(plaza);this.marker=new T.Mesh(F.geometries.sphere,F.material('#83e7ff','glow'));this.marker.position.set(11.5,.40,9.5);this.marker.scale.set(.22,.22,.22);g.add(this.marker);
   this.root=g;
  }F.scene.add(g);F.chunks.set(i,g);},
 proximity(){const h=B.S.snake[0],p=this.target,d=h?Math.hypot(h.x-p.x,h.y-p.y):99;return d<2?'MUITO PRÓXIMO':d<4?'PRÓXIMO':d<8?'LONGE':'MUITO LONGE';},
 update(){if(this.marker){this.marker.rotation.y+=.015;this.marker.scale.setScalar(.19+.035*(.5+.5*Math.sin(B.S.clock*.004)));}const hud=document.getElementById('maze-hud');if(hud)hud.textContent='FASE 6 · ENCONTRE O CAMINHO AO CENTRO · '+this.proximity();},
 environment(on){F.scene.background.set(on?'#9abdcb':'#c4d9bc');F.scene.fog=on?new T.Fog('#9abdcb',31,76):new T.Fog('#c4d9bc',65,130);const h=F.scene.children.find(o=>o.isHemisphereLight);if(h&&on){h.color.set('#e5f2e5');h.groundColor.set('#555e6d');}},
 draw(m,t){if(!this.active())return;this.drawTraps(m);this.update();const hud=document.getElementById('maze-hud');if(!hud){const n=document.createElement('div');n.id='maze-hud';F.canvas.parentElement.append(n);n.textContent='FASE 6 · ENCONTRE O CAMINHO AO CENTRO · '+this.proximity();}}
 };
 const blocked=B.Maps.blocked;B.Maps.blocked=function(x,y){return blocked.call(this,x,y)||M.active()&&M.barBlocked(x,y);};
 const extend=B.Maps.extend;B.Maps.extend=function(){if(M.active())return M.generate();B.S.mazeTraps=null;return extend.call(this);};

 const resetFugitive=B.FugitiveVirus.reset;
 B.FugitiveVirus.reset=function(){if(!M.active())return resetFugitive.call(this);};
 const fugitive=B.FugitiveVirus.update;B.FugitiveVirus.update=function(dt){if(M.active())return;return fugitive.call(this,dt);};
 const enemies=B.Enemies.update;B.Enemies.update=function(){if(M.active())return;return enemies.call(this);};
 const trapUpdate=B.CaptureSystem.update;
 B.CaptureSystem.update=function(dt){if(M.active()){
  M.updateTraps(dt);
  if(B.S.mazeTraps?.fall)return;
 }return trapUpdate.call(this,dt);};
 const check=B.CaptureSystem.check;B.CaptureSystem.check=function(visual){if(!M.active())return check.call(this,visual);const s=B.S,h=B.Characters.points(s,visual&&s.phase==='playing'?Math.min(1,s.acc/s.level.stepMs):1),p=M.target;if(s.phase!=='playing'||!p||!B.CaptureSystem.touches(h,{x:p.x+.5,y:p.y+.5},0,B.Movement.facing(s,1)))return false;s.fugitive.state='CAPTURADO';s.phase='capturing';s.capture={state:'CAPTURADO',remaining:.9};s.score+=750;B.Game.burst(p.x,p.y,'#c9ff67',55);B.Audio.effect('capture');B.UI.hud();return true;};
 const chunk=F.buildChunk;F.buildChunk=function(i,l){return l.id===8?M.chunk(i,l):chunk.call(this,i,l);};const animals=F.animals;F.animals=function(m,c,t,l){if(l.id===8)return M.draw(m,t);return animals.call(this,m,c,t,l);};
 const draw=F.draw;F.draw=function(t){const on=M.active();if(on!==this.mazeActive){this.mazeActive=on;if(!on)document.getElementById('maze-hud')?.remove();M.environment(on);this.aquaticActive=undefined;this.villageActive=false;this.copacabanaActive=false;this.hideSeekActive=false;}return draw.call(this,t);};
 const menu=B.UI.menu;
 B.UI.menu=function(){
  if(M.active()){B.S.mazeTraps=null;document.getElementById('maze-hud')?.remove();}
  return menu.call(this);
 };
 const ready=B.UI.ready;B.UI.ready=function(){if(B.S.level?.id===8){this.panel('FASE 6 — LABIRINTO DE PEDRA','ENCONTRE O CAMINHO ATÉ O CENTRO!', '<p><strong>CUIDADO! AS BARRAS SE MOVEM E AS PLATAFORMAS SÃO INSTÁVEIS!</strong></p><p>As barras e as bases metálicas causam dano. No gelo, vire com antecedência para evitar as paredes. O vírus está esperando por você! Siga pelos corredores entre as paredes de pedra e toque nele.</p>',[['Entrar no labirinto',()=>B.Game.play(),true]]);return;}return ready.call(this);};
})();
