Boitata.Renderer={
 item(m,p,t){if(!m.visible(p))return;const x=p.x+.5,y=p.y+.5,z=.60+Math.sin(t*.003+p.x+p.y)*.065;
  // Closed yellow envelope: gold thickness, raised paper, diagonal flap and seal.
  m.box(x-.30,y-.20,z,.60,.40,.065,'#bb861e');
  m.box(x-.29,y-.19,z+.065,.58,.38,.025,'#ffda49');
  const a={x:x-.27,y:y-.17,z:z+.097},b={x,y:y+.05,z:z+.097},c={x:x+.27,y:y-.17,z:z+.097};
  m.tube(a,b,.012,'#c39122');m.tube(b,c,.012,'#c39122');
  m.tube({x:x-.27,y:y+.17,z:z+.097},b,.008,'#e5ae2b');m.tube(b,{x:x+.27,y:y+.17,z:z+.097},.008,'#e5ae2b');
  const accent=p.type==='health'?'#ff91b7':p.type==='score'?'#d0c1ff':p.type==='special'?'#ffce69':'#ffe891';
  m.box(x-.035,y+.015,z+.10,.07,.06,.016,accent);
  m.box(x-.24+((Math.sin(t*.002+p.y)+1)/2)*.40,y-.14,z+.10,.035,.045,.008,'#fff3aa');
 },
 draw(t){
 const B=Boitata,s=B.S,ctx=B.UI.ctx,l=s.level||BOITATA_LEVELS[0];
 const alpha=s.phase==='playing'?Math.min(1,s.acc/l.stepMs):1,cam=0;
 ctx.fillStyle='#06111c';ctx.fillRect(0,0,1200,540);
 const m=new B.Mesh(ctx,{x:285,y:40,scale:22,camera:cam,arena:true});
 B.ArenaBackdrop?.draw2D(ctx,m);
 // Mesma projeção para o cenário e todas as entidades físicas.
 const collapse=B.NetworkCollapse?.active()?B.NetworkCollapse:null;
 if(collapse)collapse.draw(m);
 if(B.GardenMaze?.active())B.GardenMaze.drawTraps(m);
 ctx.lineWidth=1;ctx.strokeStyle=l.color+'28';
 const line=(a,b)=>{ctx.beginPath();ctx.moveTo(...m.project(a));ctx.lineTo(...m.project(b));ctx.stroke();};
 if(!collapse)for(let x=Math.floor(cam);x<=24;x++)line({x,y:0,z:0},{x,y:18,z:0});
 if(!collapse)for(let y=0;y<=18;y++)line({x:cam,y,z:0},{x:24,y,z:0});
 for(const key of s.obstacles){const [x,y]=key.split(',').map(Number);if(m.visible({x}))m.box(x+.08,y+.08,0,.84,.84,.65,'#285564');}
 for(const h of s.hazards){if(!m.visible(h))continue;m.box(h.x+.1,h.y+.1,0,.8,.8,h.active?.7:.08,h.active?'#ff5966':'#e9bf52');}
 for(const p of s.items)B.Renderer.item(m,p,t);
 for(const e of s.enemies){m.ellipsoid(e.x+.5,e.y+.5,.45,.35,.35,.35,['#ff6e85','#df7dff','#ffbc64','#fd4d55','#b5ee5a'][e.type]);for(let k=0;k<4;k++){const a=k*Math.PI/2+t*.001;m.ellipsoid(e.x+.5+Math.cos(a)*.37,e.y+.5+Math.sin(a)*.37,.5,.09,.09,.13,'#ff9fba');}}
 const character=B.Characters.get(),path=s.snake.length?B.Characters.points(s,alpha):Array.from({length:10},(_,i)=>({x:23-i,y:9,z:.45}));
 if(l.id===5){if(B.PvP?.active())B.PvP.draw(m,t);}
 else if(!(s.invuln>0&&Math.floor(t/80)%2))character.model(m,collapse?collapse.pose(path):B.GardenMaze?.active()?B.GardenMaze.pose(path):path,t,B.Movement.facing(s,alpha));
 if(s.boss&&!s.boss.defeated&&s.level?.id===30){const x=20,y=9;m.ellipsoid(x,y,1.5,1.4,1.4,1.7,'#982653');m.ellipsoid(x,y,2,.65,.65,.65,'#ff526c');}
 for(const p of s.particles)m.ellipsoid(p.x,p.y,.5,.045,.045,.09,p.color);
 B.VirusVisuals.draw(m,t);m.flush();ctx.fillStyle='#E5E7EB';ctx.font='18px "Poiret One", Teko, sans-serif';ctx.fillText(l.motif||'REDE DIGITAL',22,25);ctx.fillText(character.name+' · '+character.growth+' · '+Math.max(0,path.length-5)+' segmentos',22,520);
 if(s.boss&&s.level?.id===30){ctx.fillStyle='#ff718d';ctx.fillText('VÍRUS ZERO · ETAPA '+s.boss.stage+' · '+Math.ceil(s.boss.health)+' integridade',700,25);}
}};
