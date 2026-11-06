Boitata.Maps={
 hash(x,y,l=Boitata.S.level){let n=Math.imul(x+l.seed,374761393)^Math.imul(y+17,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;},
 route(x,l=Boitata.S.level){return 5+Math.floor((Math.sin(Math.floor((x-14)/12)*(.30+l.id*.009)+l.id)*.5+.5)*7);},
 safe(x,y,l=Boitata.S.level){if(x<19)return true;const a=this.route(x,l),b=this.route(x+1,l),c=this.route(x-1,l);return y>=Math.min(a,b,c)-1&&y<=Math.max(a,b,c)+1||x%12===1;},
 blocked(x,y){const s=Boitata.S;return s.obstacles.has(x+','+y)||s.hazards.some(h=>h.active&&h.x===x&&h.y===y);},
 extend(){const s=Boitata.S,l=s.level,from=s.generated||19,end=s.generated+l.width;for(let x=from;x<end;x++){for(let y=2;y<16;y++){const f=l.pattern;let wall=f===0?x%12>=7&&y%5<2:f===1?x%14<5&&y%6<2:f===2?(x+y)%13===0:f===3?x%9===6&&y%4!==0:f===4?(x%15-7)**2+(y-9)**2<12:f===5?y%4===0&&x%11<5:f===6?(x+y*2)%17<2:f===7?x%13<3&&y%7<4:f===8?(x-y*2)%19===0:x%8===5&&y%3===0;
 // Per-sector geometry, not just a palette swap.
 wall=wall||l.variant===1&&(x+l.id*y)%23===0||l.variant===2&&(x*2+y+l.id)%29===0;
 if(wall&&!this.safe(x,y)&&this.hash(x,y)>.2)s.obstacles.add(x+','+y);}
 if(x%6===2){const r=this.hash(x,l.id);s.items.push({x,y:this.route(x),type:r<.08?'health':r<.16?'score':r<.30?'special':'common'});}}
 s.generated=end;},
 hazards(){const s=Boitata.S;if(s.level.id<16)return;s.hazards=s.hazards.filter(h=>h.x>=s.camera-2&&h.until>s.elapsed);for(const h of s.hazards){if(h.moving&&s.steps%5===0){let ny=h.y+h.dy;if(ny<2||ny>15||this.safe(h.x,ny)||this.blocked(h.x,ny)||Boitata.Collisions.occupied(h.x,ny)){h.dy*=-1;}else{h.y=ny;}}h.active=s.elapsed>=h.warning;}
 if(s.steps%18===0)this.addHazard(22+(s.steps%7),false);},
 addHazard(ahead,boss){const s=Boitata.S,x=Math.floor(s.camera)+ahead;for(let y=2;y<16;y++){if(!this.safe(x,y)&&!Boitata.Collisions.occupied(x,y)&&this.hash(s.steps,y)>.65){s.hazards.push({x,y,dy:y<9?1:-1,moving:!boss,warning:s.elapsed+1.1,until:s.elapsed+(boss?4:7),active:false});if(!boss)break;}}},
 prune(){const s=Boitata.S;s.items=s.items.filter(p=>p.x>=s.camera-2);for(const k of s.obstacles)if(Number(k.split(',')[0])<s.camera-3)s.obstacles.delete(k);}
};

