/* Preferências gráficas isoladas do save da campanha. */
(() => {
 const B=Boitata;
 B.UI.graphics=function(){
  const prior=B.S.phase,overlay=this.$('overlay'),nodes=[...overlay.childNodes],hidden=overlay.classList.contains('hidden');B.S.phase='graphics';
  const back=()=>{if(prior==='playing')B.Game.play();else{B.S.phase=prior;overlay.replaceChildren(...nodes);overlay.classList.toggle('hidden',hidden);overlay.querySelector('button')?.focus({preventScroll:true});}};
  const show=()=>{const f=B.Forest3D;
   this.panel('VÍDEO / RENDERIZAÇÃO','Qualidade gráfica',`<p>Resolução automática conforme o tamanho da arena, a densidade da tela e o perfil escolhido. Use tela cheia para aproveitar seu monitor.</p><p>Baixo: até HD · Médio: até Full HD · Alto: até QHD · Ultra: até 4K. Sombras e vegetação acompanham o perfil.</p><p>Atual: <b>${f.renderer?f.profiles[f.quality].label:'Canvas'}</b>. O desempenho depende da GPU e da resolução.</p>`,[
    ...Object.entries(f.profiles).map(([key,p])=>[p.label,()=>{if(f.renderer)f.setQuality(key);show();},key===f.quality]),['Voltar',back]
   ]);
  };show();
 };
 const graphicsButton=document.getElementById('graphics-button');if(graphicsButton)graphicsButton.onclick=()=>B.UI.graphics();
 document.getElementById('fullscreen-button').onclick=async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.console').requestFullscreen();}
  catch(e){document.getElementById('graphics-status').textContent='Tela cheia não disponível neste navegador.';}
 };
 window.addEventListener('resize',()=>{if(B.Forest3D.renderer)B.Forest3D.resize();});
})();
