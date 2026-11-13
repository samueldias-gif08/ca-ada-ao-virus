(() => {
 const B=Boitata;
 const level=BOITATA_LEVELS[9];
 const questionTheme=level.name;
 Object.assign(level,{name:'Colapso da Rede',place:'NÚCLEO DIGITAL',color:'#52d9ff',motif:'ANTIVÍRUS CENTRAL'});
 const start={x:6,y:9},goal={x:21,y:4},limit=60;
 const directions=[[1,0],[0,-1],[0,1],[-1,0]];
 const collapseRate=.65,appearanceRadius=3.2;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const C=B.NetworkCollapse={
  active(){return B.S.level?.id===10&&!!B.S.collapse&&B.S.phase!=='menu';},
  tile(x,y,arena=B.S.collapse){
   if(!B.Maps.inside(x,y))return null;
   return arena.tiles[Math.floor((Math.round(y)-1)/2)*11+Math.floor((Math.round(x)-1)/2)];
  },
  route(from,time,arena=B.S.collapse,deadline=limit,excluded=null){
   const step=B.S.level.stepMs/1000;
   const origin={x:Math.round(from.x),y:Math.round(from.y),time,previous:null};
   const first=this.tile(origin.x,origin.y,arena);
   if(!first||first.until<=time||first.hazard||excluded?.has(first.id))return null;
   const queue=[origin],seen=new Set([origin.x+','+origin.y]);
   for(const p of queue){
    if(p.x===goal.x&&p.y===goal.y){
     const path=[];
     for(let node=p;node;node=node.previous)path.push(node);
     return path.reverse();
    }
    const arrival=p.time+step;
    if(arrival>=deadline||this.tile(p.x,p.y,arena).until<=arrival)continue;
    for(const [dx,dy] of directions){
     const x=p.x+dx,y=p.y+dy,key=x+','+y,tile=this.tile(x,y,arena);
     if(!tile||tile.until<=arrival||tile.hazard||excluded?.has(tile.id)||seen.has(key))continue;
     seen.add(key);
     queue.push({x,y,time:arrival,previous:p});
    }
   }
   return null;
  },
  setup(){
   const s=B.S,tiles=[];
   for(let y=0;y<8;y++)for(let x=0;x<11;x++){
    const stable=(y===4&&x<=6)||(x>=5&&x<=6&&y>=1&&y<=6)||
     (y>=1&&y<=2&&x>=5)||(y===6&&x>=5&&x<=9)||(x===9&&y>=2&&y<=6)||
     (x<=3&&y===5);
    tiles.push({id:tiles.length,x:1+x*2,y:1+y*2,state:'SAFE',solid:true,until:Infinity,stable});
   }
   const backbone=tiles.filter(p=>p.stable);
   for(const p of tiles){
    if(p.stable)continue;
    const distance=Math.min(...backbone.map(q=>(Math.abs(q.x-p.x)+Math.abs(q.y-p.y))/2));
    p.until=((distance===1?42:distance===2?26:distance===3?14:9)+((p.id*7)%(distance>=3?5:8)))*collapseRate;
    p.hazard=({19:'pulse',37:'charge',41:'pulse',54:'discharge',79:'discharge'})[p.id]||null;
   }
   const arena=s.collapse={tiles,fall:null,recovery:0,stage:0,shutdown:0,charged:false,loira:null};
   // Preserve a traversable route even with a late departure and conservative turn time.
   const shortcut=new Set(tiles.filter(p=>p.x>=15&&p.x<=17&&p.y<13).map(p=>p.id));
   arena.route=this.route(start,45,arena,55);
   arena.alternate=this.route(start,45,arena,55,shortcut);
   if(!arena.route||!arena.alternate){
    for(const p of tiles){p.until+=15;p.hazard=null;}
    arena.route=this.route(start,45,arena,58);
    arena.alternate=this.route(start,45,arena,58,shortcut);
   }
   if(!arena.route||!arena.alternate)throw Error('Rotas temporais inválidas no Colapso da Rede.');
   s.items=[{x:8,y:9,type:'common'},{x:12,y:7,type:'special'},{x:17,y:4,type:'common'}];
   s.total=0n;
  },
  state(p,time){
   const remaining=p.until-time;
   return remaining<=0?'DESTROYED':remaining<=2*collapseRate?'CRITICAL':remaining<=5*collapseRate?'WARNING':'SAFE';
  },
  hazard(p,time){
   if(!p?.hazard||!p.solid||time<1||time>=p.until)return 0;
   const cycle=(time+p.id*.7)%6;
   return cycle>=4.9?2:cycle>=3.5?1:0;
  },
  supports(x,y){const p=this.tile(x,y);
   return !!p&&p.solid&&(B.S.collapse.charged||p.until>B.S.elapsed);},
  fall(n,shock=false){
   const s=B.S,a=s.collapse;
   a.fall={time:0,from:{...s.snake[0]},to:{...n},shock};
   s.acc=0;
   B.Audio.effect('damage');
  },
  respawn(){
   const s=B.S,a=s.collapse,head=s.snake[0],length=s.snake.length;
   const candidates=a.tiles.filter(p=>p.stable&&p.solid).flatMap(p=>[
    {x:p.x,y:p.y},{x:p.x+1,y:p.y},{x:p.x,y:p.y+1},{x:p.x+1,y:p.y+1}
   ]).sort((a,b)=>Math.hypot(a.x-head.x,a.y-head.y)-Math.hypot(b.x-head.x,b.y-head.y));
   for(const p of candidates){
    if(a.loira&&distance(p,a.loira)<2)continue;
    const path=this.route(p,s.elapsed);
    if(!path||path.length<2)continue;
    const dir={x:path[1].x-p.x,y:path[1].y-p.y};
    const snake=Array.from({length},(_,i)=>({x:p.x-dir.x*i,y:p.y-dir.y*i}));
    if(!snake.every(q=>{const tile=this.tile(q.x,q.y);return tile?.stable&&tile.solid;}))continue;
    Object.assign(s,{snake,oldSnake:snake.map(q=>({...q})),dir,oldDir:{...dir},pending:[],acc:0,invuln:1.5});
    B.Movement.clear();
    return true;
   }
   return false;
  },
  lose(){
   B.S.phase='lost';
   B.Audio.effect('defeat');
   B.UI.lost();
  },
  tick(){
   const s=B.S,a=s.collapse;
   if(a.fall||s.elapsed>=limit)return;
   const n=B.Movement.next();
   if(!n)return;
   const h=s.snake[0];
   const dx=n.x-h.x,dy=n.y-h.y,cuts=[0,1];
   // Include every cell crossed, even when a diagonal clips a corner.
   for(const [origin,delta] of [[h.x,dx],[h.y,dy]]){
    if(!delta)continue;
    const boundary=Math.floor(origin+.5)+(delta>0?.5:-.5);
    const fraction=(boundary-origin)/delta;
    if(fraction>0&&fraction<1)cuts.push(fraction);
   }
   cuts.sort((a,b)=>a-b);
   for(let i=1;i<=cuts.length;i++){
    const fraction=i===cuts.length?1:(cuts[i-1]+cuts[i])/2;
    const x=h.x+dx*fraction,y=h.y+dy*fraction;
    if(!this.supports(x,y)){this.fall({x,y});return;}
   }
   const item=s.items.find(p=>B.Collisions.same(p,n));
   const danger=B.Collisions.self(n,!!item)||this.hazard(this.tile(n.x,n.y),s.elapsed)===2;
   if(danger&&s.invuln<=0){
    this.fall(n,true);
    return;
   }
   B.Movement.advance(n,!!item);
   if(item)B.Player.collect(item);
   B.UI.hud();
  },
  update(dt){
   if(!this.active())return;
   const s=B.S,a=s.collapse;
   if(s.phase==='playing'){
    if(s.elapsed>=limit){
     s.elapsed=limit;
     s.phase='shutdown';
     B.Audio.effect('damage');
     return;
    }
    const stage=Math.floor(s.elapsed/(15*collapseRate));
    if(stage!==a.stage){a.stage=stage;B.Audio.effect('warning');}
    for(const p of a.tiles){
     p.state=this.state(p,s.elapsed);
     p.solid=p.state!=='DESTROYED';
    }
    if(a.fall){
     a.fall.time+=dt;
     if(a.fall.time>=.46){
      a.fall=null;
      s.lives--;
      B.UI.hud();
      if(!s.lives){this.lose();return;}
      if(s.elapsed<limit&&!this.respawn()){
       const lives=s.lives;
       B.Game.retry();
       s.lives=lives;
       s.invuln=1.5;
       B.UI.hud();
      }
     }
    }else{
     const alpha=Math.min(1,s.acc/s.level.stepMs);
     const h=B.Characters.points(s,alpha)[0];
     if(h&&Math.hypot(h.x-goal.x-.5,h.y-goal.y-.5)<.64){
      a.charged=true;
      s.phase='restoring';
      s.score+=1000;
      s.particles=[];
      B.Audio.effect('capture');
      return;
     }
     const head=s.snake[0];
     if(!this.supports(head.x,head.y))this.fall(head);
     else if(s.invuln<=0&&this.hazard(this.tile(head.x,head.y),s.elapsed)===2)this.fall(head,true);
     else this.updateLoira(dt,head);
    }
   }else if(s.phase==='shutdown'){
    a.shutdown+=dt;
    if(a.shutdown>=.65)this.lose();
   }else if(s.phase==='restoring'){
    a.recovery+=dt;
    for(const p of a.tiles){
     if(Math.hypot(p.x+.5-goal.x,p.y+.5-goal.y)>this.wave(a))continue;
     if(!p.solid)p.rebuiltAt=a.recovery;
     p.state='SAFE';
     p.solid=true;
    }
    if(a.recovery>=3.8){
     if(BOITATA_QUESTIONS.some(q=>q.theme===questionTheme)){
      B.Education.choose(questionTheme);
      s.phase='quiz';
      B.UI.quiz();
     }else B.Game.win('REDE RESTAURADA COM SUCESSO!');
    }
   }
  },
  loiraCell(p){
   const tile=this.tile(p.x,p.y);
   return !!tile?.stable&&this.supports(p.x,p.y)&&distance(p,goal)>1.25;
  },
  loiraRoute(from,target){
   const queue=[{...from,previous:null}],seen=new Set([from.x+','+from.y]);
   let closest=queue[0];
   for(const p of queue){
    if(distance(p,target)<distance(closest,target))closest=p;
    if(distance(p,target)<.35)break;
    for(const [dx,dy] of directions){
     const n={x:p.x+dx,y:p.y+dy,previous:p},key=n.x+','+n.y;
     if(seen.has(key)||!this.loiraCell(n))continue;
     seen.add(key);queue.push(n);
    }
   }
   while(closest.previous?.previous)closest=closest.previous;
   return closest.previous?{x:closest.x,y:closest.y}:null;
  },
  updateLoira(dt,head){
   const s=B.S,a=s.collapse,time=s.elapsed;
   if(!a.loira){
    if(distance(head,goal)>appearanceRadius)return;
    const candidates=[];
    for(let x=goal.x-4;x<=goal.x+4;x++)for(let y=goal.y-4;y<=goal.y+4;y++){
     const p={x,y},gap=distance(p,head);
     if(this.loiraCell(p)&&distance(p,goal)<=4&&gap>=2.7&&this.loiraRoute(p,head))candidates.push({p,gap});
    }
    candidates.sort((a,b)=>Math.abs(a.gap-3.5)-Math.abs(b.gap-3.5));
    if(!candidates.length)return;
    const {p}=candidates[0];
    a.loira={...p,cell:p,next:null,appeared:time,angle:Math.atan2(head.y-p.y,head.x-p.x),stride:0};
    B.Game.burst(p.x,p.y,'#ff4567',36);
    B.Audio.effect('predator');
   }
   const ghost=a.loira;
   if(!ghost.next)ghost.next=this.loiraRoute(ghost.cell,head);
   if(ghost.next){
    const n=ghost.next;
    if(!this.loiraCell(n)){ghost.next=null;return;}
    const dx=n.x-ghost.x,dy=n.y-ghost.y,left=Math.hypot(dx,dy);
    const step=Math.min(left,dt*.82/(s.level.stepMs/1000));
    if(left>0){
     ghost.x+=dx/left*step;ghost.y+=dy/left*step;
     const angle=Math.atan2(dy,dx)-ghost.angle;
     ghost.angle+=Math.atan2(Math.sin(angle),Math.cos(angle))*Math.min(1,dt*12);
     ghost.stride+=step*5.2;
    }
    if(step>=left){ghost.cell=n;ghost.next=null;}
   }
   if(time-ghost.appeared<.65||s.invuln>0)return;
   const path=B.Characters.points(s,Math.min(1,s.acc/s.level.stepMs));
   const position={x:ghost.x+.5,y:ghost.y+.5};
   if(B.CaptureSystem.touches(path,position,.10,B.Movement.facing(s,1)))this.fall(head,true);
  },
  wave(a){return Math.max(0,(a.recovery-.38)*10);},
  pose(path){
   const fall=B.S.collapse.fall;
   if(!fall)return path;
   const u=Math.min(1,fall.time/.46);
   if(fall.shock)return path.map((p,i)=>({...p,z:p.z+Math.sin(Math.PI*u)*.28/(i+1)}));
   return path.map((p,i)=>({...p,x:p.x+(fall.to.x-fall.from.x)*u,
    y:p.y+(fall.to.y-fall.from.y)*u,z:p.z-3.2*Math.max(0,u-i*.08)**2}));
  }
 };
 const tick=B.Game.tick;
 B.Game.tick=function(){if(C.active()&&B.S.phase==='playing')return C.tick();return tick.call(this);};
 const maps=B.Maps.extend;
 B.Maps.extend=function(){
  B.S.collapse=null;
  if(B.S.level.id===10){C.setup();B.S.generated=24;return;}
  return maps.call(this);
 };
 const blocked=B.Maps.blocked;
 B.Maps.blocked=function(x,y){return C.active()?!C.supports(x,y):blocked.call(this,x,y);};
 const reset=B.CaptureSystem.reset,update=B.CaptureSystem.update;
 B.CaptureSystem.reset=function(){
  if(!C.active())return reset.call(this);
  Object.assign(B.S,{fugitive:null,predator:null,chaseTimer:null,capture:null});
 };
 B.CaptureSystem.update=function(dt){if(C.active())return C.update(dt);return update.call(this,dt);};
})();
(() => {
 const B=Boitata,C=B.NetworkCollapse;
 const palette={SAFE:'#197999',WARNING:'#e3ad38',CRITICAL:'#ff385e'};
 C.drawLoira=function(m,forest,ghost,time){
  const age=time-ghost.appeared,flash=age<.2&&Math.floor(age*32)%2===0;
  const bob=.08+Math.sin(time*5)*.035;
  const forward={x:Math.cos(ghost.angle),y:Math.sin(ghost.angle)};
  const x=ghost.x+.5,y=ghost.y+.5;
  const point=(side,depth,z)=>({x:x+side*forward.y+depth*forward.x,
   y:y-side*forward.x+depth*forward.y,z:z+bob});
  const skin=flash?'#fff5f5':'#d4c9d4',suit='#171d31',silver='#9caec5';
  const blue='#50d9ff',red='#ff365c',gold='#dab46b',light='#ffe6a4';
  if(forest){
   forest.geometries.loiraSphere||=new forest.T.SphereGeometry(1,20,14);
   forest.geometries.loiraTube||=new forest.T.CylinderGeometry(1,1,1,16);
  }
  const oval=(p,rx,ry,rz,color,type='loira')=>{
   if(!forest){m.ellipsoid(p.x,p.y,p.z,rx,ry,rz,color);return;}
   const turn=new forest.T.Quaternion().setFromAxisAngle(new forest.T.Vector3(0,1,0),-ghost.angle);
   forest.part('loiraSphere',color,p.x,p.y,p.z,ry,rx,rz,turn,type);
  };
  const line=(a,b,r,color,type='loira')=>{
   if(!forest){m.tube(a,b,r,color);return;}
   const T=forest.T,v=new T.Vector3(b.x-a.x,b.z-a.z,b.y-a.y),len=v.length();
   if(!len)return;
   const turn=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.multiplyScalar(1/len));
   forest.part('loiraTube',color,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,r,r,len,turn,type);
  };
  const limb=(a,b,r,color,type)=>{
   line(a,b,r,color,type);oval(b,r,r,r,color,type);
  };
  // Rounded body panels and articulated limbs.
  oval(point(0,0,1.30),.22,.15,.24,suit);
  oval(point(0,0,1.58),.29,.17,.29,suit);
  oval(point(0,.12,1.63),.235,.075,.23,silver,'loira-metal');
  oval(point(0,0,1.83),.10,.09,.16,skin);
  for(const side of [-1,1]){
   const swing=Math.sin(ghost.stride)*side;
   const hip=point(side*.12,0,1.23),knee=point(side*.14,swing*.13,.76);
   const ankle=point(side*.15,swing*.23,.26),toe=point(side*.15,swing*.23+.09,.18);
   limb(hip,knee,.102,suit);limb(knee,ankle,.082,suit);
   oval(point(side*.14,swing*.14+.055,.66),.082,.052,.18,silver,'loira-metal');
   oval(toe,.091,.16,.079,suit);line(ankle,toe,.027,blue,'loira-light');
   const shoulder=point(side*.27,0,1.71),elbow=point(side*.35,-swing*.13,1.39);
   const hand=point(side*.40,.15-swing*.19,1.15+Math.max(0,-swing)*.10);
   oval(shoulder,.10,.11,.12,silver,'loira-metal');
   limb(shoulder,elbow,.068,suit);limb(elbow,hand,.058,silver,'loira-metal');
   oval(hand,.065,.052,.097,suit);
   for(let i=0;i<3;i++){
    const finger=point(side*.40+(i-1)*.031,.16-swing*.19,hand.z-bob-.083);
    line(hand,finger,.017,suit);
   }
   const bus=[point(side*.07,.195,1.77),point(side*.13,.196,1.67),
    point(side*.13,.19,1.54),point(side*.18,.139,1.44)];
   for(let i=1;i<bus.length;i++)line(bus[i-1],bus[i],.013,side>0?red:blue,'loira-light');
   line(elbow,hand,.018,blue,'loira-light');
  }
  oval(point(0,-.04,2.03),.218,.173,.275,gold);
  oval(point(0,.04,2.02),.162,.125,.215,skin);
  oval(point(0,.153,2.018),.035,.038,.063,skin);
  oval(point(0,.149,1.936),.059,.025,.031,'#532742');
  for(const side of [-1,1]){
   oval(point(side*.073,.142,2.067),.048,.021,.037,'#211831');
   oval(point(side*.073,.160,2.065),.023,.018,.021,flash?blue:red,'loira-light');
   line(point(side*.035,.154,2.103),point(side*.11,.132,2.135),.014,'#573c54');
  }
  oval(point(0,-.006,2.198),.202,.146,.10,light);
  for(let i=0;i<9;i++){
   const side=(i-4)*.043,phase=time*6+i*.68;
   const hair=[point(side,-.077,2.19),point(side*1.36,-.18,2.045),
    point(side*1.6+Math.sin(phase)*.043,-.218,1.82),
    point(side*1.68+Math.sin(phase+.7)*.077,-.23,1.56),
    point(side*1.75+Math.sin(phase+1.2)*.11,-.20,1.24+(i%3)*.06)];
   for(let j=1;j<hair.length;j++)limb(hair[j-1],hair[j],.052-j*.007,i%3?gold:light);
  }
  for(const side of [-1,1]){
   const fringe=[point(side*.088,.106,2.196),point(side*.158,.109,2.123),
    point(side*.192,.073,1.997),point(side*.212,.024,1.80)];
   for(let i=1;i<fringe.length;i++)limb(fringe[i-1],fringe[i],.042-i*.005,light);
  }
  const chips=age<.6?18:5;
  for(let i=0;i<chips;i++){
   const angle=time*5+i*2.399;
   const reach=age<.6?.34+age*.72:.41;
   const p={x:x+Math.cos(angle)*reach,y:y+Math.sin(angle)*reach,z:.26+(i*.23+time*.9)%2.11};
   m.box(p.x,p.y,p.z,age<.6?.18:.052,.039,.029,i%3?red:blue,'glow');
  }
 };
 C.draw=function(m,forest){
  const s=B.S,a=s.collapse,time=s.elapsed+(a.charged?a.recovery:0);
  const emergency=a.charged?'#55cfff':s.elapsed>=45&&Math.sin(time*12)>0?'#ff7184':'#ac254e';
  const off=s.phase==='lost'||s.phase==='shutdown'&&(a.shutdown>.32||Math.floor(a.shutdown*25)%2===1);
  const lamp=off?'#263447':emergency;
  const trace=(x,y,z,dx,dy,color)=>m.tube({x,y,z},{x:x+dx,y:y+dy,z},.026,color);
  m.box(0,0,-1.15,24,18,.12,'#080e20');
  for(let x=1;x<24;x+=2){
   m.box(x,.1,-1.01,.032,17.8,.015,'#182c52');
   m.box(x,.14,-.18,.58,.7,.95,'#253a53');
   m.box(x,17.2,-.18,.58,.65,.8,'#253a53');
   m.box(x+.10,.22,.78,.38,.16,.035,lamp,'glow');
   m.box(x+.10,17.58,.63,.38,.12,.035,lamp,'glow');
  }
  for(let y=2;y<17;y+=2){
   m.box(.15,y,-.16,.66,.55,.86,'#253a53');
   m.box(23.19,y,-.16,.66,.55,.86,'#253a53');
   m.box(.22,y+.08,.71,.31,.17,.025,lamp,'glow');
   m.box(23.30,y+.08,.71,.31,.17,.025,lamp,'glow');
   m.box(.85,y,-1.01,22.30,.026,.02,'#152644');
  }
  for(const y of [.48,17.52])m.box(.48,y,.38,23.04,.055,.065,lamp,'glow');
  for(const x of [.48,23.52])m.box(x,.48,.38,.055,17.04,.065,lamp,'glow');
  for(const p of a.tiles){
   const x=p.x,y=p.y,delta=time-p.until,restored=a.charged&&p.state==='SAFE';
   if(!p.solid&&delta>=.36*.65)continue;
   const fall=p.solid?0:Math.min(1,Math.max(0,delta/(.36*.65)));
   const warning=p.state==='WARNING'||p.state==='CRITICAL';
   const blink=warning&&Math.sin(time*(p.state==='CRITICAL'?17:8)+p.id)>0;
   const rise=p.rebuiltAt===undefined?0:Math.max(0,1-(a.recovery-p.rebuiltAt)/.35);
   const z=-fall*fall*1.1-rise*rise*.95+(warning?Math.sin(time*21+p.id)*.025:0);
   const color=off?'#25364d':restored?'#52d9ff':palette[p.state]||palette.CRITICAL;
   const signal=off?'#2f4157':blink?'#fff1b4':color;
   const deck=p.stable?'#244b62':'#25334d';
   m.box(x+.035,y+.035,z-.36,1.93,1.93,.33,'#111b30');
   m.box(x+.065,y+.065,z-.10,1.87,1.87,.12,warning?color:deck);
   m.box(x+.12,y+.12,z+.022,1.76,.045,.02,signal,'glow');
   m.box(x+.12,y+1.83,z+.022,1.76,.045,.02,color,'glow');
   m.box(x+.14,y+.36,z+.023,.73,.029,.019,signal,'glow');
   m.box(x+.84,y+.36,z+.024,.03,.87,.018,color,'glow');
   m.box(x+.85,y+1.20,z+.024,.88,.03,.018,color,'glow');
   m.box(x+1.27,y+.43,z+.027,.39,.46,.062,'#101c30');
   for(let pin=0;pin<3;pin++)m.box(x+1.18,y+.48+pin*.13,z+.039,.57,.025,.018,color);
   m.box(x+.28,y+1.46,z+.028,.13,.12,.045,signal,'glow');
   if(warning||fall){
    trace(x+.18,y+.58,z+.04,.55,.3,'#290e2c');
    trace(x+.73,y+.88,z+.04,.33,-.19,'#290e2c');
    trace(x+1.06,y+.69,z+.04,.74,.68,signal);
   }
   const hazard=!a.charged&&!off?this.hazard(p,s.elapsed):0;
   if(hazard){
    const charge=hazard===2?'#ff385e':'#ffcb62';
    for(const edge of [.17,1.79]){
     m.box(x+.16,y+edge,z+.05,1.67,.04,.03,charge,'glow');
     m.box(x+edge,y+.17,z+.05,.04,1.64,.03,charge,'glow');
    }
    if(p.hazard==='pulse'){
     const sweep=hazard===2?.23+((time+p.id*.7)%6-4.9)*1.35:.23;
     m.box(x+.17,y+sweep,z+.04,1.66,.13,.09,charge,'glow');
    }else if(p.hazard==='charge'){
     for(let i=0;i<3;i++)m.box(x+.35+i*.52,y+.36,z+.04,.13,1.28,.055,charge,'glow');
    }else if(hazard===2){
     const spark=x+.25+(time*6%1)*1.45;
     m.tube({x:spark,y:y+.2,z:.08},{x:spark-.21,y:y+.95,z:.72},.045,'#ff7184');
     m.tube({x:spark-.21,y:y+.95,z:.72},{x:spark+.13,y:y+1.77,z:.08},.035,'#fff1b4');
    }
   }
  }
  const x=21.5,y=4.5,z=1.12+Math.sin(time*4)*.10;
  const core=off?'#354660':'#61e1ff',white=off?'#647288':'#d9fbff';
  m.box(x-.92,y-.91,-.04,1.84,1.82,.17,'#17253d');
  m.box(x-.68,y-.65,.14,1.36,1.30,.21,core,'glow');
  m.box(x-.53,y-.50,.35,1.06,1,.13,'#254a70');
  const scale=a.charged?1+Math.max(0,1-a.recovery)*.32:1;
  m.ellipsoid(x,y,z,.52*scale,.52*scale,.69*scale,core,'glow');
  // Inclina o escudo para a câmera isométrica e mantém o selo à frente dos anéis.
  const symbolPoint=([u,v])=>({x:x+u,y:y+.86*scale-v*.577,z:z+.61*scale+v*.816});
  const shield=[[-.39,.26],[0,.39],[.39,.26],[.35,-.10],[.23,-.29],[0,-.43],[-.23,-.29],[-.35,-.10],[-.39,.26]];
  const check=[[-.18,-.01],[-.05,-.14],[.20,.13]];
  for(const [shape,width,color] of [[shield,.034,off?'#59616c':'#a8afb8'],[check,.046,off?'#743846':'#ff4057']]){
   for(let i=1;i<shape.length;i++){
    const from=symbolPoint(shape[i-1]),to=symbolPoint(shape[i]);
    m.tube(from,to,width+.025,'#102940');
    m.tube({...from,y:from.y+.04,z:from.z+.028},{...to,y:to.y+.04,z:to.z+.028},width,color);
   }
  }
  for(let ring=0;ring<2;ring++){
   const orbit=k=>{
    const phase=k*Math.PI/8+time*(ring?1.6:-1.15);
    return {x:x+Math.cos(phase)*(ring?1.1:.82),y:y+Math.sin(phase)*.79,z:z+Math.sin(phase)*(ring?-.62:.51)};
   };
   for(let k=0;k<16;k++)if(k%4!==3)m.tube(orbit(k),orbit(k+1),k%4===0?.044:.024,k%4===0?white:core);
  }
  if(!off&&(!a.charged||a.recovery<3.8))for(let i=0;i<26;i++){
   const px=1+(i*3.71+time*.25)%22,py=1+(i*5.17)%16,pz=.2+(i*.32+time*.42)%2.7;
   m.box(px,py,pz,.04,.04,.11,i%4===0?lamp:core,'glow');
  }
  if(a.loira&&!a.charged&&!off)C.drawLoira(m,forest,a.loira,s.elapsed);
  if(s.phase==='restoring'){
   const radius=this.wave(a);
   for(const p of a.tiles){
    const d=Math.hypot(p.x+.5-21,p.y+.5-4);
    if(Math.abs(radius-d)<1.2)m.box(p.x+.13,p.y+.13,.045,1.74,.095,.08,white,'glow');
   }
  }
 };
 const ready=B.UI.ready,lost=B.UI.lost,quiz=B.UI.quiz,wrong=B.UI.wrong;
 B.UI.ready=function(){
  if(!C.active())return ready.call(this);
  this.panel('FASE 10 / NÚCLEO DIGITAL','COLAPSO DA REDE',
   '<p>Alcance o <b>ANTIVÍRUS CENTRAL</b>, o núcleo azul do outro lado da arena. As placas amarelas vão rachar. As vermelhas estão prestes a cair. Siga os circuitos azuis, desvie das descargas e fique atento perto do núcleo.</p>',
   [['Entrar no núcleo',()=>B.Game.play(),true]]);
 };
 B.UI.lost=function(){
  if(!C.active())return lost.call(this);
  this.panel('FALHA NO NÚCLEO',B.S.elapsed>=60?'SISTEMA DESLIGADO':'CONEXÃO PERDIDA',
   '<p>A rede continua comprometida. Reinicie a travessia para tentar ativar o antivírus.</p>',
   [['Tentar novamente',()=>B.Game.retry(),true],['Selecionar fase',()=>this.selection()]]);
 };
 B.UI.quiz=function(){
  if(!C.active())return quiz.call(this);
  this.questionPanel('PARABÉNS! VOCÊ SALVOU A REDE!','REDE RESTAURADA COM SUCESSO!');
 };
 B.UI.wrong=function(){
  if(!C.active())return wrong.call(this);
  this.panel('REDE RESTAURADA / REVISÃO','Resposta incorreta',
   '',[['Reiniciar desafio',()=>B.Game.retry(),true]]);
 };
 const chase=B.UI.chaseHud,hud=B.UI.hud;
 B.UI.hud=function(){
  hud.call(this);
  if(C.active())this.$('sector').textContent='10 / COLAPSO DA REDE';
 };
 B.UI.chaseHud=function(){
  const timer=this.$('predator-timer'),notice=this.$('chase-notice');
  if(!C.active()){
   if(timer?.classList.contains('collapse-timer')){
    timer.classList.remove('collapse-timer','collapse-critical');
    timer.textContent='Predador aguardando';
    if(notice)notice.textContent='';
    const location=this.$('fugitive-location');
    if(location)location.textContent='Localizando alvo…';
   }
   return chase.call(this);
  }
  const s=B.S,a=s.collapse,remaining=Math.max(0,Math.ceil(60-s.elapsed));
  const set=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
  timer?.classList.add('collapse-timer');
  timer?.classList.toggle('collapse-critical',remaining<=15&&!a.charged);
  set(timer,'COLAPSO DA REDE: 00:'+String(remaining).padStart(2,'0'));
  set(this.$('chase-character'),B.Characters.get().name);
  set(this.$('fugitive-state'),a.charged?'Antivírus ativado':'Objetivo: ANTIVÍRUS CENTRAL');
  set(this.$('fugitive-location'),a.charged?'Rede em recuperação':'Núcleo digital');
  set(notice,a.charged?(a.recovery>=3.7?'REDE RESTAURADA COM SUCESSO!':'RESTAURANDO A REDE…'):
   remaining===0?'SISTEMA DESLIGADO':a.loira&&s.elapsed-a.loira.appeared<.85?'INTERFERÊNCIA DETECTADA!':remaining<=15?'SISTEMA CRÍTICO!':'');
  this.$('game')?.parentElement?.classList.remove('predator-alert');
 };
})();
