Boitata.Maps={
 bounds:Object.freeze({width:24,height:18}),
 inside(x,y){return x>=1&&x<=22&&y>=1&&y<=16;},
 hash(x,y,l=Boitata.S.level){let n=Math.imul(x+l.seed,374761393)^Math.imul(y+17,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;},
 route(){return 9;},
 safe(x,y){return x<=7||x>=18||y>=7&&y<=11||y<=3||y>=14;},
 blocked(x,y){const s=Boitata.S;return !this.inside(x,y)||s.obstacles.has(Math.round(x)+','+Math.round(y))||(s.hazards||[]).some(h=>h.active&&h.x===Math.round(x)&&h.y===Math.round(y));},
 borderKind(x,y,l=Boitata.S.level||BOITATA_LEVELS[0]){const r=this.hash(x+11,y,l);return r<.5?'tree':r<.7?'bush':r<.85?'rock':'water';},
 extend(){const s=Boitata.S,l=s.level;if(s.generated)return;
  for(let x=0;x<24;x++)for(let y=0;y<18;y++)if(!this.inside(x,y)||!this.safe(x,y)&&this.hash(x,y,l)<.45)s.obstacles.add(x+','+y);
  s.generated=24;
  const reachable=this.reachable();
  for(let x=1;x<=22;x++)for(let y=1;y<=16;y++)if(!reachable.has(x+','+y))s.obstacles.add(x+','+y);
  const cells=[...reachable].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};}).filter(p=>p.x>7);
  cells.sort((a,b)=>this.hash(a.x+47,a.y)-this.hash(b.x+47,b.y));
  for(const [i,p]of cells.slice(0,l.target+4).entries())s.items.push({...p,type:i>=l.target?(i%2?'health':'score'):i%5===0?'special':'common'});
 },
 reachable(){const s=Boitata.S,q=[{x:6,y:9}],seen=new Set(['6,9']);for(let i=0;i<q.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=q[i].x+dx,y=q[i].y+dy,k=x+','+y;if(this.inside(x,y)&&!s.obstacles.has(k)&&!seen.has(k)){seen.add(k);q.push({x,y});}}return seen;},
 validate(){const seen=this.reachable();return Boitata.S.items.every(p=>seen.has(p.x+','+p.y));},
 hazards(){const s=Boitata.S;if(s.level.id<16)return;s.hazards=s.hazards.filter(h=>h.until>s.elapsed);for(const h of s.hazards)h.active=s.elapsed>=h.warning;if(s.steps%18===0)this.addHazard(s.steps%22,false);},
 addHazard(ahead,boss){const s=Boitata.S,x=1+ahead%22;for(let y=4;y<14;y++)if(!this.safe(x,y)&&!Boitata.Collisions.occupied(x,y)&&this.hash(s.steps,y)>.65){s.hazards.push({x,y,dy:0,moving:false,warning:s.elapsed+1.1,until:s.elapsed+(boss?4:7),active:false});if(!boss)break;}},
 pond(x,y,l=Boitata.S.level){const dx=(x%7-3)/2.7,dy=(y%5-2)/1.9;return this.hash(Math.floor(x/7)+73,Math.floor(y/5)+91,l)>.72&&dx*dx+dy*dy<.85+this.hash(x+51,y,l)*.4;},
 kind(x,y,l=Boitata.S.level){if(!this.inside(x,y))return this.borderKind(x,y);if(this.pond(x,y,l))return 'water';const r=this.hash(x+127,y,l);return r<.48?'tree':r<.70?'bush':r<.87?'rock':'log';},
 prune(){}
};
