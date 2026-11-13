/* Read-only map browser. Never unlocks, completes or starts a campaign mission. */
(() => {
 const B=Boitata;
 const P=B.MapPreview={
  session:null,
  maps(){return BOITATA_LEVELS.filter(l=>l.id!==6&&l.id!==7);},
  begin(){if(this.session)return;const s=B.S,o=B.UI.$('overlay');this.session={state:{...s},nodes:[...o.childNodes],hidden:o.classList.contains('hidden'),arena:document.body.classList.contains('arena-active'),fish:B.Aquatic?.fish,npcs:B.Village?.npcs,villageClock:B.Village?.clock};B.Movement.clear();},
  gallery(){this.begin();this.removeBar();B.S.phase='map-gallery';const maps=this.maps();B.UI.panel('EXPLORAR CENÁRIOS','Visualizar mapas',`<p>Veja qualquer um dos ${maps.length} mapas disponíveis, inclusive os bloqueados. A visualização não altera seu progresso.</p><div class="level-grid"></div>`,[['Voltar',()=>this.exit()]]);
   const grid=B.UI.$('overlay').querySelector('.level-grid');for(const l of maps){const button=document.createElement('button');button.textContent=String(l.id>=8?l.id-2:l.id).padStart(2,'0')+' · '+({1:'Floresta',2:'Reino aquático',3:'Vila da Folha',8:'Labirinto de pedra'}[l.id]||l.name);button.title='Visualizar cenário';button.onclick=()=>this.open(l.id);grid.append(button);}
  },
  open(id){if(!Number.isInteger(id)||id<1||id>BOITATA_LEVELS.length||id===6||id===7)return false;this.begin();const s=B.S;s.save={...this.session.state.save};s.level=BOITATA_LEVELS[id-1];B.Game.setup();s.phase='map-preview';B.UI.close();document.body.classList.add('arena-active');this.removeBar();
   const bar=document.createElement('nav');bar.id='map-preview-controls';bar.setAttribute('aria-label','Visualização de mapas');
   const maps=this.maps(),index=maps.findIndex(l=>l.id===id),displayId=id>=8?id-2:id;const title=document.createElement('span');title.textContent='VISUALIZAÇÃO · MAPA '+displayId+' / '+maps.length;title.setAttribute('aria-live','polite');bar.append(title);
   const add=(label,fn)=>{const button=document.createElement('button');button.textContent=label;button.onclick=fn;bar.append(button);return button;};
   add('← Anterior',()=>index>0&&this.open(maps[index-1].id)).disabled=index<=0;add('Próximo →',()=>index>=0&&index<maps.length-1&&this.open(maps[index+1].id)).disabled=index<0||index===maps.length-1;
   add('Trocar guardião',()=>{s.save.character=B.Characters.get().id==='iara'?'boitata':'iara';B.UI.chaseHud?.();});
   add('Todos os mapas',()=>this.gallery());add('Sair da visualização',()=>this.exit());B.UI.$('game').parentElement.append(bar);B.Forest3D?.renderer&&B.Forest3D.resize();B.Renderer.draw(s.clock);return true;
  },
  removeBar(){document.getElementById('map-preview-controls')?.remove();},
  exit(){if(!this.session)return;this.removeBar();const prior=this.session;this.session=null;for(const key of Object.keys(B.S))if(!Object.prototype.hasOwnProperty.call(prior.state,key))delete B.S[key];Object.assign(B.S,prior.state);if(B.Aquatic)B.Aquatic.fish=prior.fish;if(B.Village){B.Village.npcs=prior.npcs;B.Village.clock=prior.villageClock;}B.Movement.clear();document.body.classList.toggle('arena-active',prior.arena);
   const o=B.UI.$('overlay');o.replaceChildren(...prior.nodes);o.classList.toggle('hidden',prior.hidden);if(B.S.phase==='playing'||B.S.phase==='capturing'){B.S.phase='paused';B.UI.pause();}if(B.S.level)B.UI.hud();if(B.Forest3D?.renderer)B.Forest3D.resize();B.Renderer.draw(B.S.clock);
  }
 };
 for(const name of ['menu','selection']){const original=B.UI[name];B.UI[name]=function(...args){original.apply(this,args);const button=document.createElement('button');button.textContent='Visualizar mapas';button.onclick=()=>P.gallery();this.$('overlay').querySelector('.actions').append(button);};}
 const frame=B.Game.frame;B.Game.frame=function(now){if(B.S.phase==='map-preview'){const dt=Math.min(.08,Math.max(0,(now-B.S.lastTime)/1000||.016));B.Village?.update(dt);B.Aquatic?.update(dt);}return frame.call(this,now);};
 document.addEventListener('keydown',e=>{if(P.session&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(B.S.phase==='map-preview')P.gallery();else P.exit();}});
})();
