/* A* limitado à região relevante; círculo contra células sólidas. */
Boitata.Pathfinding={
 directions:[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}],
 free(x,y,r=.22,options={}){
  const s=Boitata.S,cx=x+.5,cy=y+.5;
  if(cx-r<1||cy-r<1||cy+r>17||cx+r>Boitata.Maps.bounds.width-1)return false;
  for(let ox=Math.floor(cx-r);ox<=Math.floor(cx+r);ox++)for(let oy=Math.floor(cy-r);oy<=Math.floor(cy+r);oy++){
   const dx=cx-Math.max(ox,Math.min(cx,ox+1)),dy=cy-Math.max(oy,Math.min(cy,oy+1));
   if(dx*dx+dy*dy<r*r&&Boitata.Maps.blocked(ox,oy))return false;
  }
  if(s.snake.slice(options.ignoreHead?1:0).some(p=>Math.hypot(p.x-x,p.y-y)<r+.36))return false;
  if(!options.ignoreEnemies&&s.enemies.some(p=>Math.hypot(p.x-x,p.y-y)<r+.3))return false;
  return true;
 },
 find(start,goal,{radius=.22,ignoreHead=false,ignoreEnemies=false,minX=Math.max(1,Math.min(start.x,goal.x)-18),maxX=Math.min(Boitata.S.generated-2,Math.max(start.x,goal.x)+18)}={}){
  const key=p=>p.x+','+p.y,h=p=>Math.abs(p.x-goal.x)+Math.abs(p.y-goal.y),open=[],cost=new Map(),parent=new Map(),points=new Map(),closed=new Set();
  const push=node=>{open.push(node);let i=open.length-1;while(i){const p=(i-1)>>1;if(open[p].f<=node.f)break;open[i]=open[p];i=p;}open[i]=node;};
  const pop=()=>{const first=open[0],last=open.pop();if(open.length){let i=0;while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&open[child+1].f<open[child].f)child++;if(last.f<=open[child].f)break;open[i]=open[child];i=child;}open[i]=last;}return first;};
  const first=key(start);cost.set(first,0);points.set(first,start);push({...start,f:h(start)});let visited=0;
  while(open.length&&visited++<4096){const p=pop(),pk=key(p);if(closed.has(pk))continue;closed.add(pk);
   if(p.x===goal.x&&p.y===goal.y){const path=[];let k=pk;while(k!==first){path.unshift(points.get(k));k=parent.get(k);}return path;}
   for(const d of this.directions){const n={x:p.x+d.x,y:p.y+d.y},nk=key(n);if(n.x<minX||n.x>maxX||closed.has(nk)||!this.free(n.x,n.y,radius,{ignoreHead,ignoreEnemies}))continue;const g=cost.get(pk)+1;if(g>=(cost.get(nk)??Infinity))continue;cost.set(nk,g);parent.set(nk,pk);points.set(nk,n);push({...n,f:g+h(n)});}
  }return null;
 },
 reachable(start,{radius=.22,minX=Math.max(1,start.x-24),maxX=Math.min(Boitata.S.generated-2,start.x+36)}={}){
  const queue=[{x:start.x,y:start.y}],seen=new Set([start.x+','+start.y]);
  for(let i=0;i<queue.length&&i<4096;i++)for(const d of this.directions){const n={x:queue[i].x+d.x,y:queue[i].y+d.y},key=n.x+','+n.y;if(n.x<minX||n.x>maxX||seen.has(key)||!this.free(n.x,n.y,radius))continue;seen.add(key);queue.push(n);}
  return queue.slice(1);
 }
};
