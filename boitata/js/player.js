Boitata.Player={
 reset(){const s=Boitata.S;s.snake=Array.from({length:5},(_,i)=>({x:6-i,y:9}));s.oldSnake=s.snake.map(p=>({...p}));s.dir={x:1,y:0};s.pending=[];s.lives=3;s.invuln=0;},
 collect(item){const s=Boitata.S;s.items.splice(s.items.indexOf(item),1);s.score+=item.type==='score'?250:item.type==='special'?150:100;if(item.type==='health')s.lives=Math.min(3,s.lives+1);else if(item.type!=='score')s.collected++;Boitata.Game.burst(item.x,item.y,item.type==='health'?'#ff91b7':'#b3ff63',18);Boitata.Audio.effect('collect');},
 hurt(){const s=Boitata.S;if(s.invuln>0||s.phase!=='playing')return;s.lives--;s.invuln=1.5;Boitata.Game.burst(s.snake[0].x,s.snake[0].y,'#ff657d',30);Boitata.Audio.effect('damage');if(s.lives<=0){s.phase='lost';Boitata.Audio.effect('defeat');Boitata.UI.lost();return;}
 const x=s.snake[0].x+3,y=Boitata.Maps.route(x);s.snake=Array.from({length:5},(_,i)=>({x:x-i,y}));s.snake.forEach(p=>s.obstacles.delete(p.x+','+p.y));s.hazards=s.hazards.filter(h=>Math.abs(h.x-x)>6);s.enemies=s.enemies.filter(e=>{if(Math.abs(e.x-x)<6&&Math.abs(e.y-y)<4){s.retired++;return false;}return true;});s.oldSnake=s.snake.map(p=>({...p}));s.dir={x:1,y:0};s.pending=[];s.camera=s.oldCamera=Math.max(s.camera,x-10);}
};

