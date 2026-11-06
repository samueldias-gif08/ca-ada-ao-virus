Boitata.Movement={
 control(d){const s=Boitata.S;if(s.phase!=='playing')return;const v={up:{x:0,y:-1},right:{x:1,y:0},down:{x:0,y:1}}[d];if(!v)return;const previous=s.pending.at(-1)||s.dir;if(previous.x===v.x&&previous.y===v.y||previous.y&&v.y===-previous.y||s.pending.length>=2)return;s.pending.push(v);},
 next(){const s=Boitata.S;s.oldSnake=s.snake.map(p=>({...p}));s.oldCamera=s.camera;if(s.pending.length)s.dir=s.pending.shift();const h=s.snake[0],n={x:h.x+s.dir.x,y:h.y+s.dir.y};if(n.y<1||n.y>16){s.dir={x:1,y:0};n.x=h.x+1;n.y=h.y;s.pending=[];}return n;},
 advance(n,grow){const s=Boitata.S;s.snake.unshift(n);if(!grow)s.snake.pop();s.camera=Math.max(s.camera,n.x-10,0);}
};

