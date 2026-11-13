Boitata.Collisions={
 same(a,b){return Math.round(a.x)===Math.round(b.x)&&Math.round(a.y)===Math.round(b.y);},
 occupied(x,y){const s=Boitata.S;return Boitata.Maps.blocked(x,y)||s.snake.some(p=>p.x===x&&p.y===y)||s.items.some(p=>p.x===x&&p.y===y)||s.enemies.some(p=>p.x===x&&p.y===y)||s.fugitive&&s.fugitive.state!=='CAPTURADO'&&s.fugitive.x===x&&s.fugitive.y===y||s.predator&&!['AGUARDANDO','DESAPARECENDO'].includes(s.predator.state)&&s.predator.x===x&&s.predator.y===y;},
 self(n,growing){const s=Boitata.S;return s.snake.slice(0,growing?s.snake.length:s.snake.length-1).some(p=>Math.hypot(p.x-n.x,p.y-n.y)<.45);},
 enemyAt(n){return Boitata.S.enemies.some(e=>this.same(e,n));}
};

