Boitata.CaptureSystem={
 reset(){Boitata.S.capture={state:'BUSCANDO',remaining:0};Boitata.PredatorVirus.reset();Boitata.ChaseTimer.reset();Boitata.FugitiveVirus.reset();},
 // Distance to each real strand/body link; empty spaces inside curves stay empty.
 distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const u=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
  return Math.hypot(p.x-a.x-dx*u,p.y-a.y-dy*u);
 },
 touches(path,p,padding=0,dir=Boitata.S.dir){if(!path.length)return false;const hair=Boitata.Characters.get().id==='iara',virus=.25;
  if(this.distance(p,path[0],path[0])<=virus+(hair?.37:.40)+padding)return true;
  if(hair&&dir){const h=path[0],tail={x:h.x-dir.x*.27,y:h.y-dir.y*.27};
   if(this.distance(p,tail,tail)<=virus+.25+padding)return true;
   for(const side of [-1,1]){const fin={x:h.x-dir.x*.43-dir.y*.14*side,y:h.y-dir.y*.43+dir.x*.14*side};if(this.distance(p,fin,fin)<=virus+.17+padding)return true;}
  }
  for(let i=1;i<path.length;i++){
   if(this.distance(p,path[i],path[i])<=virus+(hair?.095:.30)+padding)return true;
   if(this.distance(p,path[i-1],path[i])<=virus+(hair?.095:.24)+padding)return true;
  }return false;
 },
 contact(visual=false){const B=Boitata,s=B.S,alpha=visual?Math.min(1,s.acc/s.level.stepMs):1;
  const path=B.Characters.points(s,alpha),p=visual?B.FugitiveVirus.point():{x:s.fugitive.x+.5,y:s.fugitive.y+.5};
  const dir=B.Movement.facing(s,alpha);let hit=this.touches(path,p,0,dir);
  if(visual){const previous=s.capture.previous;
   if(!hit&&previous&&previous.path.length===path.length){
    const from=Math.atan2((previous.dir||dir).y,(previous.dir||dir).x),to=Math.atan2(dir.y,dir.x),turn=Math.atan2(Math.sin(to-from),Math.cos(to-from));
    let travel=Math.hypot(p.x-previous.p.x,p.y-previous.p.y);
    for(let i=0;i<path.length;i++)travel=Math.max(travel,Math.hypot(path[i].x-previous.path[i].x,path[i].y-previous.path[i].y)+Math.hypot(p.x-previous.p.x,p.y-previous.p.y));
    // Sweep both moving shapes with <= .02 world units of relative travel.
    // Half-step tolerance closes the gaps between samples (at most .01 units).
    if(B.Characters.get().id==='iara')travel+=Math.abs(turn)*.6;
    const steps=Math.max(1,Math.ceil(travel/.02)),padding=travel/(2*steps);
    for(let k=0;!hit&&k<=steps;k++){const t=k/steps,lerp=(a,b)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}),angle=from+turn*t;hit=this.touches(path.map((v,i)=>lerp(previous.path[i],v)),lerp(previous.p,p),padding,{x:Math.cos(angle),y:Math.sin(angle)});}
   }
   s.capture.previous={path,p,dir};
  }return hit;
 },
 check(visual=false){const B=Boitata,s=B.S,f=s.fugitive;if(s.phase!=='playing'||!f||f.state==='CAPTURADO'||!this.contact(visual))return false;
  f.state='CAPTURADO';s.capture={state:'CAPTURADO',remaining:.9};s.phase='capturing';s.score+=750;B.Characters.record();B.Game.burst(f.x,f.y,'#c9ff67',70);B.Audio.effect('capture');if(s.level.id===30){s.boss.defeated=true;s.boss.health=0;}B.UI.hud();return true;
 },
 update(dt){const B=Boitata,s=B.S;if(s.phase==='capturing'){s.capture.remaining-=dt;if(s.capture.remaining<=0){if(s.level.id<4)B.Game.win('VÍRUS CAPTURADO! Você protegeu este setor.');else{s.phase='quiz';B.Education.choose();B.UI.quiz();}}return;}
  if(s.phase!=='playing'||!s.fugitive)return;if(this.check(true))return;
  B.FugitiveVirus.update(dt);B.ChaseTimer.update(dt);B.PredatorVirus.update(dt);this.check(true);
 }
};
