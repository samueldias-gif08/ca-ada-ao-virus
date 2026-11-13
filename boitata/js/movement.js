Boitata.Movement={
 // Direções fixas na grade do mundo (x,y), projetada em (X,Z).
 keyDirections:{KeyE:{x:-1,y:0},KeyW:{x:1,y:0},KeyA:{x:0,y:-1},KeyS:{x:0,y:1}},
 held:new Set(),
 mouseMode(){return Boitata.S.save?.controlMode!=='keyboard';},
 playing(){return ['playing','pvp-playing'].includes(Boitata.S.phase);},
 resetPointer(){this.pointer=null;this.pointerDirection=null;},
 bindPointer(canvas){
  this.canvas=canvas;
  canvas.addEventListener('pointermove',event=>{
   if(event.pointerType==='mouse'&&this.mouseMode()&&this.playing()){
    this.pointer={x:event.clientX,y:event.clientY};
   }
  });
  canvas.addEventListener('pointerleave',()=>{this.pointer=null;});
 },
 cursorWorld(){
  if(!this.pointer)return null;
  const rect=this.canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return null;
  const u=(this.pointer.x-rect.left)/rect.width,v=(this.pointer.y-rect.top)/rect.height;
  const forest=Boitata.Forest3D;
  if(forest?.renderer){
   const T=forest.T;
   this.raycaster||=new T.Raycaster();
   this.movementPlane||=new T.Plane(new T.Vector3(0,1,0),-.45);
   this.raycaster.setFromCamera({x:2*u-1,y:1-2*v},forest.camera);
   const point=this.raycaster.ray.intersectPlane(this.movementPlane,new T.Vector3());
   return point&&{x:point.x,y:point.z};
  }
  // Inverte a projeção ortográfica usada pelo renderizador Canvas.
  const difference=(u*this.canvas.width-600)/(16*Math.SQRT1_2)+3;
  const sum=((v*this.canvas.height-270)/16+.45*Math.sqrt(2/3))*Math.sqrt(6)+21;
  return {x:(sum+difference)/2,y:(sum-difference)/2};
 },
 mouseNext(s,distance){
  const head=s.snake[0],target=this.cursorWorld();
  if(target){
   const x=target.x-head.x-.5,y=target.y-head.y-.5;
   if(Math.hypot(x,y)<=.55)return null;
   this.pointerDirection=Math.atan2(y,x);
  }
  if(this.pointerDirection===null||this.pointerDirection===undefined)return null;
  const heading=Math.atan2(s.dir.y,s.dir.x),delta=this.pointerDirection-heading;
  const turn=Math.atan2(Math.sin(delta),Math.cos(delta));
  const angle=heading+Math.max(-Math.PI/3,Math.min(Math.PI/3,turn));
  const dir={x:Math.cos(angle),y:Math.sin(angle)};
  const next={x:head.x+dir.x*distance,y:head.y+dir.y*distance};
  if(!Boitata.Maps.inside(next.x,next.y)){
   // Gire junto à borda, sem deslocar a trilha até o próximo passo válido.
   s.dir=dir;
   return null;
  }
  const neck=s.snake[1];
  if(neck&&Math.hypot(next.x-neck.x,next.y-neck.y)<.45)return null;
  s.dir=dir;
  return next;
 },
 clear(){this.resetPointer();this.held.clear();this.relative=false;this.lastVector=null;this.retreat=false;this.backVector=null;this.escape=false;this.turnBack=false;},
 // Nomes de eixos lógicos preservados para os percursos determinísticos.
 directions:{up:{x:0,y:-1},down:{x:0,y:1},right:{x:1,y:0},left:{x:-1,y:0}},
 keydown(e){if((this.canvas&&this.mouseMode())||!this.keyDirections[e.code]||e.target?.closest?.('input,textarea,select,[contenteditable="true"]'))return false;if(!this.playing())return false;e.preventDefault();if(this.held.has(e.code))return true;this.relative=true;if(e.code==='KeyW'){this.backVector={x:-Boitata.S.dir.x,y:-Boitata.S.dir.y};this.turnBack=true;}if(e.code==='KeyE')this.escape=true;this.held.add(e.code);this.vector();return true;},
 keyup(e){if(!this.keyDirections[e.code])return false;this.held.delete(e.code);if(this.held.size)this.vector();e.preventDefault();return true;},
 vector(){if(!this.held.size)return this.lastVector||{...Boitata.S.dir};if(this.held.size===1&&this.held.has('KeyW')&&this.backVector)return this.lastVector={...this.backVector};let x=0,y=0;for(const code of this.held){const v=this.keyDirections[code];x+=v.x;y+=v.y;}const length=Math.hypot(x,y);if(!length)return {x:0,y:0};return this.lastVector={x:x/length,y:y/length};}, control(d){
  const s=Boitata.S,v=typeof d==='string'?this.directions[d]:d;
  if(!this.playing()||!v||Math.abs(v.x)+Math.abs(v.y)!==1)return false;
  const previous=s.pending.at(-1)||s.dir;
  if(previous.x===v.x&&previous.y===v.y||s.snake.length>1&&previous.x===-v.x&&previous.y===-v.y||s.pending.length>=2)return false;
  s.pending.push({...v});return true;
 },
 next(distance=1){
  const s=Boitata.S;s.oldSnake=s.snake.map(p=>({...p}));s.oldCamera=s.camera;s.oldDir={...s.dir};
  if(this.canvas&&this.mouseMode()){
   this.retreat=false;
   return this.mouseNext(s,distance);
  }
  if(this.relative){s.pending=[];let v=this.vector();const h=s.snake[0],neck=s.snake[1];this.retreat=false;if(!v.x&&!v.y)return null;
   if(this.turnBack||this.escape){
    const free=d=>{const n={x:h.x+d.x*distance,y:h.y+d.y*distance};return Boitata.Maps.inside(n.x,n.y)&&!this.blocked(n)&&!Boitata.Collisions.self(n,false);};
    if(!free(v)){const side=[{x:-v.y,y:v.x},{x:v.y,y:-v.x}].find(free);if(!side)return null;
     if(this.turnBack){this.turnBack=false;v=side;}else{v=side;this.lastVector={...v};this.held.delete('KeyE');}
    }else this.turnBack=false;
    this.escape=false;
   }
   // Como antes, impede a inversão imediata contra o próprio pescoço.
   if(neck&&Math.hypot(h.x+v.x*distance-neck.x,h.y+v.y*distance-neck.y)<.45){v={...s.dir};this.lastVector=v;}
   s.dir={...v};const n={x:h.x+v.x*distance,y:h.y+v.y*distance};if(!Boitata.Maps.inside(n.x,n.y))return null;return n;}  this.retreat=false;
  if(s.pending.length){const v=s.pending.shift(),h=s.snake[0],neck=s.snake[1];if(!neck||h.x+v.x*distance!==neck.x||h.y+v.y*distance!==neck.y)s.dir=v;}
  const h=s.snake[0],n={x:h.x+s.dir.x*distance,y:h.y+s.dir.y*distance};
  // Na borda, espera um comando válido sem inverter ou arrastar a trilha.
  if(!Boitata.Maps.inside(n.x,n.y))return null;
  return n;
 },
 advance(n,grow){const s=Boitata.S;s.snake.unshift(n);if(!grow)s.snake.pop();s.camera=s.oldCamera=0;},
 blocked(n,h=Boitata.S.snake[0]){const d={x:n.x-h.x,y:n.y-h.y};for(let i=1;i<=8;i++)if(Boitata.Maps.blocked(h.x+d.x*i/8,h.y+d.y*i/8))return true;return false;}, facing(s,alpha){const a=s.oldDir||s.dir,b=s.dir;if(!a||!b)return {x:1,y:0};const from=Math.atan2(a.y,a.x),to=Math.atan2(b.y,b.x),delta=Math.atan2(Math.sin(to-from),Math.cos(to-from)),angle=from+delta*alpha;return {x:Math.cos(angle),y:Math.sin(angle)};}
};

