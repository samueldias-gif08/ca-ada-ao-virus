Boitata.Collisions={
 same(a,b){return a.x===b.x&&a.y===b.y;},
 occupied(x,y){const s=Boitata.S;return Boitata.Maps.blocked(x,y)||s.snake.some(p=>p.x===x&&p.y===y)||s.items.some(p=>p.x===x&&p.y===y)||s.enemies.some(p=>p.x===x&&p.y===y);},
 self(n,growing){const s=Boitata.S;return s.snake.slice(0,growing?s.snake.length:s.snake.length-1).some(p=>this.same(p,n));},
 enemyAt(n){return Boitata.S.enemies.some(e=>this.same(e,n));}
};

