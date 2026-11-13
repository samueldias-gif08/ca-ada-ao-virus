Boitata.CharacterSelection={
 show(next){const B=Boitata,s=B.S;s.phase='characters';B.UI.panel('FOLCLORE BRASILEIRO / GUARDIÕES','ESCOLHA SEU GUARDIÃO','<p>Mesmos controles, velocidade e vidas nas nove fases e no encerramento final.</p><div class="guardian-grid"></div>',[['Voltar',()=>B.UI.menu()]]);
 document.body.classList.add('arena-active');
 const grid=B.UI.$('overlay').querySelector('.guardian-grid');
 for(const c of B.Characters.registry.values()){
 const card=document.createElement('article');card.className='guardian-card';card.dataset.character=c.id;
 const alt=c.id==='iara'?'Iara, guardiã das águas com cabelos volumosos e cauda turquesa':'Boitatá, serpente dourada de olhos esmeralda envolta em chamas';
 card.innerHTML=`<img class="guardian-portrait" src="assets/characters/${c.id}-portrait.png" alt="${alt}" width="1536" height="1024" decoding="sync"><h3>${c.name}</h3><small>${c.title}</small><p>${c.description}</p><p>${c.growth} · Recorde: ${s.save.characterBest?.[c.id]||0}</p>`;
 const button=document.createElement('button');button.textContent='Selecionar personagem';button.setAttribute('aria-pressed',String(s.save.character===c.id));
 button.onclick=()=>{if(s.phase!=='characters')return;B.Characters.select(c.id);card.classList.add('chosen');button.textContent='Guardião selecionado';s.phase='character-confirm';setTimeout(()=>{if(s.phase==='character-confirm'){if(next)next();else B.UI.menu();}},350);};card.append(button);grid.append(card);
 }
 }
};
