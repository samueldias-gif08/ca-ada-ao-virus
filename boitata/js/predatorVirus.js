Boitata.PredatorVirus={
 config:{radius:.92,speedRatio:1.3,arrival:1.1},
 touching(){const s=Boitata.S;return Math.hypot(s.predator.x-s.snake[0].x,s.predator.y-s.snake[0].y)<=this.config.radius+.32;},
 reset(){Boitata.S.predator={x:0,y:0,old:{x:0,y:0},state:'AGUARDANDO',clock:0,moveClock:0,visualClock:1,path:[]};},
 spawn(){const B=Boitata,s=B.S,n=B.VirusAI.destination(9,18,this.config.radius);if(!n)return false;Object.assign(s.predator,{...n,old:{...n},state:'SURGINDO',clock:this.config.arrival,moveClock:0,visualClock:1,path:[]});B.Game.burst(n.x,n.y,'#ff426d',35);B.Audio.effect('predator');return true;},
 update(dt){const B=Boitata,s=B.S,p=s.predator,c=this.config;if(!p||p.state==='AGUARDANDO')return;p.visualClock+=dt;
  if(p.state==='SURGINDO'||p.state==='DESAPARECENDO'){p.clock-=dt;if(p.clock<=0)p.state=p.state==='SURGINDO'?'PERSEGUINDO':'AGUARDANDO';return;}
  const h=s.snake[0];p.soundClock=(p.soundClock||0)+dt;if(p.soundClock>=3){p.soundClock=0;B.Audio.effect('chase');}
  if(p.state==='ATACANDO'){
   p.clock-=dt;if(p.clock>0)return;
   if(this.touching()&&s.invuln<=0){const lives=s.lives;B.Player.hurt();if(s.lives<lives){p.state='DESAPARECENDO';p.clock=.5;p.path=[];B.ChaseTimer.reset();return;}}
   p.state='PERSEGUINDO';
  }
  if(this.touching()&&s.invuln<=0){p.state='ATACANDO';p.clock=.16;return;}
  p.moveClock+=dt;if(p.moveClock<s.level.stepMs/1000*c.speedRatio)return;p.moveClock=0;
  // A* replaneja em cada passo com a posição atual do jogador e do cabelo/corpo.
  let goal=s.snake[0];if(!B.Pathfinding.free(goal.x,goal.y,c.radius,{ignoreHead:true})){
   const options=B.Pathfinding.reachable(p,{radius:c.radius,minX:Math.max(1,p.x-25),maxX:Math.min(s.generated-2,p.x+25)});options.sort((a,b)=>B.VirusAI.distance(a,goal)-B.VirusAI.distance(b,goal));goal=options[0];
  }
  if(!goal)return;p.path=B.Pathfinding.find(p,goal,{radius:c.radius,ignoreHead:true})||[];const n=p.path[0];if(n){p.old={x:p.x,y:p.y};p.x=n.x;p.y=n.y;p.visualClock=0;}
 },
 point(){const s=Boitata.S,p=s.predator,alpha=Math.min(1,p.visualClock/(s.level.stepMs/1000));return {x:p.old.x+(p.x-p.old.x)*alpha+.5,y:p.old.y+(p.y-p.old.y)*alpha+.5};}
};
