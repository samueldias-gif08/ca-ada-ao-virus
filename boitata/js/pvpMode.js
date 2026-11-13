/* Setor 5: duelo contra o guardião infectado. */
(() => {
 const B=Boitata,F=B.Forest3D,T=window.THREE;
 const speed=3.3,opponentSpeed=2.5,cooldown=1.5;
 const arenaScale=(4/3)*1.4;
 const patrol=[{x:19,y:5},{x:7,y:5},{x:7,y:13},{x:19,y:13}].map(p=>({x:12+(p.x-12)*arenaScale,y:9+(p.y-9)*arenaScale}));
 const angles=[0,.35,-.35,.7,-.7,Math.PI/3,-Math.PI/3];
 const palette=new Map();
 const copy=trail=>trail.map(p=>({...p}));
 const P=B.PvP={
  arena:Object.freeze({width:24*arenaScale,height:18*arenaScale}),
  bounds:Object.freeze({minX:12+(-3-12)*1.4,maxX:12+(26-12)*1.4,minY:9+(-2-9)*1.4,maxY:9+(19-9)*1.4}),
  active(){const s=B.S;return s.level?.id===5&&!!s.pvp&&s.phase!=='menu';},
  setup(){
   const s=B.S,distance=s.level.stepMs/1000*speed;
   const trail=(x,dir)=>Array.from({length:s.snake.length},(_,i)=>({x:x-dir*i*distance,y:9}));
   s.snake=trail(6,1);
   s.oldSnake=copy(s.snake);
   s.items=[];s.enemies=[];s.hazards=[];s.obstacles.clear();
   s.fugitive=s.predator=s.chaseTimer=s.capture=null;
   const snake=trail(18,-1),dir={x:-1,y:0};
   s.pvp={score:[0,0],protection:0,touching:false,waypoint:0,winner:null,
    opponent:{character:B.Characters.get().id==='iara'?'boitata':'iara',snake,oldSnake:copy(snake),dir,oldDir:{...dir}}};
  },
  ready(){
   B.S.phase='pvp-ready';
   B.UI.panel('FASE 5 / RINGUE DA INFECÇÃO','Duelo de guardiões',
    '<p>Enfrente o guardião infectado controlado pela IA. Três impactos válidos encerram o duelo.</p><p>'+B.UI.controls()+'</p>'+
    (B.S.level.lesson?'<p>'+B.S.level.lesson+'</p>':''),
    [['Iniciar combate',()=>this.start(),true],['Selecionar fase',()=>B.UI.selection()]]);
  },
  start(){
   const s=B.S;
   B.Movement.clear();
   s.oldSnake=copy(s.snake);s.oldDir={...s.dir};
   const opponent=s.pvp.opponent;
   opponent.oldSnake=copy(opponent.snake);opponent.oldDir={...opponent.dir};
   s.phase='pvp-playing';s.acc=0;
   document.body.classList.add('arena-active');
   B.UI.close();B.Audio.init();this.hud();
  },
  hud(){
   const s=B.S;
   let node=document.getElementById('pvp-hud');
   if(!node){
    node=document.createElement('div');node.id='pvp-hud';node.className='duel-hud';
    B.UI.$('game').parentElement.append(node);
   }
   const [player,opponent]=s.pvp.score;
   const hearts=damage=>'♥'.repeat(3-damage)+'♡'.repeat(damage);
   node.innerHTML='<span class="duel-health"><span>INTEGRIDADE · VOCÊ</span><b>'+hearts(player)+'</b></span>'+
    '<span class="duel-health"><span>INTEGRIDADE · ADVERSÁRIO</span><b>'+hearts(opponent)+'</b></span>';
   s.lives=3-player;
   B.UI.hud();
  },
  free(n,fighter){
   return !B.Movement.blocked(n,fighter.snake[0])&&
    !fighter.snake.slice(1,-1).some(p=>Math.hypot(p.x-n.x,p.y-n.y)<.45);
  },
  moveOpponent(player,distance){
   const match=player.pvp,fighter=match.opponent,h=fighter.snake[0],p=player.snake[0];
   fighter.oldSnake=copy(fighter.snake);fighter.oldDir={...fighter.dir};
   const separation=Math.hypot(p.x-h.x,p.y-h.y);
   const waypoint=patrol[match.waypoint];
   if(Math.hypot(waypoint.x-h.x,waypoint.y-h.y)<1.1)match.waypoint=(match.waypoint+1)%patrol.length;
   const target=match.protection<=.15&&separation<6.5?p:patrol[match.waypoint];
   const desired=Math.atan2(target.y-h.y,target.x-h.x),heading=Math.atan2(fighter.dir.y,fighter.dir.x);
   const turn=Math.atan2(Math.sin(desired-heading),Math.cos(desired-heading));
   for(const offset of angles){
    const angle=heading+Math.max(-Math.PI/3,Math.min(Math.PI/3,turn+offset));
    const dir={x:Math.cos(angle),y:Math.sin(angle)},n={x:h.x+dir.x*distance,y:h.y+dir.y*distance};
    if(!this.free(n,fighter))continue;
    fighter.dir=dir;
    fighter.snake.unshift(n);fighter.snake.pop();
    return;
   }
   const angle=heading+(turn<0?-1:1)*Math.PI/3;
   fighter.dir={x:Math.cos(angle),y:Math.sin(angle)};
  },
  hits(head,trail,character,bodyOnly=false){
   const touchesHead=Math.hypot(head.x-trail[0].x,head.y-trail[0].y)<.85;
   if(touchesHead)return !bodyOnly;
   const radius=character==='iara'?.43:.62;
   return trail.slice(1).some((p,i)=>B.CaptureSystem.distance(head,trail[i],p)<radius);
  },
  contact(){
   const s=B.S,match=s.pvp,opponent=match.opponent;
   const character=B.Characters.get().id;
   let playerHit=false,opponentHit=false;
   // Testa as duas trajetórias entre passos para capturar cruzamentos rápidos.
   for(let i=1;i<=4;i++){
    const player=B.Characters.points(s,i/4),other=B.Characters.points(opponent,i/4);
    playerHit||=this.hits(player[0],other,opponent.character);
    opponentHit||=this.hits(other[0],player,character,true);
   }
   const touching=playerHit||opponentHit,wasTouching=match.touching;
   match.touching=touching;
   if(!touching||wasTouching||match.protection>0)return;
   if(playerHit&&opponentHit){
    const [a,b]=[s.snake[0],opponent.snake[0]];
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
    const approach=fighter=>({x:fighter.snake[0].x-fighter.oldSnake[0].x,y:fighter.snake[0].y-fighter.oldSnake[0].y});
    const u=approach(s),v=approach(opponent),strength=((u.x+v.x)*dx+(u.y+v.y)*dy)/(d*speed*s.level.stepMs/1000);
    if(strength>=-.12)match.score[1]++;
    if(strength<=.12)match.score[0]++;
   }else match.score[playerHit?1:0]++;
   match.protection=cooldown;
   const h=s.snake[0];B.Game.burst(h.x,h.y,'#a9f7ff',14);B.Audio.effect('damage');this.hud();
   const [player,other]=match.score;
   if(player>=3||other>=3)this.finish(player>=3&&other>=3?null:player>=3?1:0);
  },
  update(dt){
   const s=B.S,match=s.pvp,distance=dt*speed;
   match.protection=Math.max(0,match.protection-dt);
   const n=B.Movement.next(distance);
   if(n&&this.free(n,s))B.Movement.advance(n,false);
   this.moveOpponent(s,dt*opponentSpeed);
   this.contact();
  },
  finish(winner,questionPassed=false){
   if(winner===0&&!questionPassed){
    const s=B.S;if(s.phase==='quiz')return;
    s.pvp.winner=winner;B.Movement.clear();s.phase='quiz';
    B.Education.choose(s.level.name,()=>this.finish(winner,true));
    B.UI.questionPanel('COMBATE CONCLUÍDO / VERIFIQUE O CONHECIMENTO','VOCÊ SE LIVROU DO VÍRUS DA REDE!');return;
   }
   const s=B.S;s.phase='pvp-won';s.pvp.winner=winner;B.Movement.clear();
   if(winner===0)B.Store.complete();
   const title=winner===0?'VOCÊ SE LIVROU DO VÍRUS DA REDE!':winner===1?'VOCÊ FOI INFECTADO!':'EMPATE NO RINGUE';
   const buttons=[['Jogar novamente',()=>B.Game.retry(),true],['Voltar ao menu',()=>B.UI.menu()]];
   if(winner===0)buttons.unshift(['Próxima fase',()=>B.Game.start(8),true]);
   B.UI.panel('COMBATE CONCLUÍDO',title,'<p>Infecção: '+s.pvp.score.join(' / ')+' de 3</p>',buttons);
  },
 chunk(i,l){const g=new T.Group();if(i===0){const add=(kind,color,x,y,z,sx,sy,sz)=>{const m=new T.Mesh(F.geometries[kind],F.material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;g.add(m);};add('box','#211c55',12,-.16,9,23.4,.38,17.4);add('box','#302c70',12,.025,9,22.8,.08,16.8);add('box','#e7edf3',12,.07,9,2,.025,2);add('box','#12d9ee',12,.075,9,1.65,.018,.05);add('box','#ff4bd8',12,.075,9,.05,.018,1.65);for(const side of [-1,1])for(const z of [1.5,16.5]){add('box',side<0?'#ff3864':'#16ddff',12,.34,z,22,.06,.07);add('box',side<0?'#ff3864':'#16ddff',12,.70,z,22,.06,.07);for(const x of [1.5,22.5]){add('box',side<0?'#ff3864':'#16ddff',x,.36,z,.10,.9,.10);add('sphere',x<12?'#ffdc42':'#b84bff',x,.92,z,.22,.22,.22);} }
   // Bright corner light pylons and pixel-lit fight signage.
   for(const [x,z,c]of [[1.5,1.5,'#ff3d79'],[22.5,1.5,'#23e8ff'],[1.5,16.5,'#b746ff'],[22.5,16.5,'#ffe34f']]){add('box','#202544',x,.20,z,.30,.30,.30);add('cylinder',c,x,1.16,z,.13,.95,.13);add('sphere',c,x,1.68,z,.25,.25,.25);}

   for(let x=2;x<=22;x+=2){add('box','#f8dc52',x,.10,2.2,.78,.025,.045);add('box','#ff5f89',x,.10,15.8,.78,.025,.045);}
   g.scale.set(arenaScale,1,arenaScale);g.position.set(12*(1-arenaScale),0,9*(1-arenaScale));this.root=g;}F.scene.add(g);F.chunks.set(i,g);},

  draw(m,t){
   const s=B.S,match=s.pvp,alpha=s.phase==='pvp-playing'?Math.min(1,s.acc/s.level.stepMs):1;
   const infected=(color,side)=>{
    const key=color+side;
    if(!palette.has(key)){
     const rgb=Number.parseInt(color.slice(1),16),tint=side?[244,70,156]:[83,208,244];
     const mixed=tint.map((c,i)=>Math.round(((rgb>>((2-i)*8))&255)*.68+c*.32).toString(16).padStart(2,'0'));
     palette.set(key,'#'+mixed.join(''));
    }
    return palette.get(key);
   };
   for(const [side,fighter] of [s,match.opponent].entries()){
    const path=B.Characters.points(fighter,alpha);
    const model={organic:m.organic,organicPrefix:'pvp-'+side+'-',visible:p=>m.visible(p),
     box:(x,y,z,w,h,d,c,...rest)=>m.box(x,y,z,w,h,d,infected(c,side),...rest),
     ellipsoid:(x,y,z,rx,ry,rz,c,...rest)=>m.ellipsoid(x,y,z,rx,ry,rz,infected(c,side),...rest),
     tube:(a,b,r,c)=>m.tube(a,b,r,infected(c,side))
    };
    B.Characters.get(fighter.character).model(model,path,t,B.Movement.facing(fighter,alpha));
   }
  }
 };
 const inside=B.Maps.inside;
 B.Maps.inside=function(x,y){
  if(B.S.level?.id!==5)return inside.call(this,x,y);
  const b=P.bounds;return x>=b.minX&&x<=b.maxX&&y>=b.minY&&y<=b.maxY;
 };
 const ready=B.UI.ready;
 B.UI.ready=function(){return B.S.level?.id===5?P.ready():ready.call(this);};
 const setup=B.Game.setup;
 B.Game.setup=function(){
  B.S.pvp=null;
  document.getElementById('pvp-hud')?.remove();
  setup.call(this);
  if(B.S.level?.id===5)P.setup();
 };
 const play=B.Game.play;
 B.Game.play=function(){return P.active()?P.start():play.call(this);};
 const tick=B.Game.tick;
 B.Game.tick=function(){return B.S.phase==='pvp-playing'?P.update(B.S.level.stepMs/1000):tick.call(this);};
 const reset=B.CaptureSystem.reset;
 B.CaptureSystem.reset=function(){if(B.S.level?.id!==5)return reset.call(this);};
 const capture=B.CaptureSystem.update;
 B.CaptureSystem.update=function(dt){if(!P.active())return capture.call(this,dt);};
 const chunk=F.buildChunk;
 F.buildChunk=function(i,l){return l.id===5?P.chunk(i,l):chunk.call(this,i,l);};
 const chaseHud=B.UI.chaseHud;
 B.UI.chaseHud=function(){
  if(!P.active())return chaseHud.call(this);
  const labels={'chase-character':B.Characters.get().name,'fugitive-state':'Duelo de guardiões',
   'predator-timer':'Adversário: '+B.Characters.get(B.S.pvp.opponent.character).name,
   'fugitive-location':'Três impactos válidos','chase-notice':''};
  for(const [id,label] of Object.entries(labels)){
   const node=this.$(id);
   if(node&&node.textContent!==label)node.textContent=label;
  }
  this.$('game').parentElement.classList.remove('predator-alert');
 };
 const menu=B.UI.menu;
 B.UI.menu=function(){
  B.S.pvp=null;document.getElementById('pvp-hud')?.remove();
  return menu.call(this);
 };
})();
