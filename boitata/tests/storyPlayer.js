/* Controller integration tests: the production renderer and audio buffer are used. */
window.runStoryPlayerTests=async(w,H,check)=>{
 const B=w.Boitata,originalSound=H.sound,errors=[],close=(a,b)=>Math.abs(a-b)<.001;
 const key=(code,target=H.root)=>{const event=new w.KeyboardEvent('keydown',{code,bubbles:true,cancelable:true});target.dispatchEvent(event);return event;};
 const snapshot=()=>JSON.stringify({scene:H.state.scene,poses:H.state.poses,camera:H.renderer.camera,black:H.state.black,title:H.state.title,portal:H.state.portal});
 const audio=new B.StorySound({music:true,effects:true});
 H.sound={sync(){}}; // Clock tests below explicitly exercise the silent RAF path.
 try{
  check('Duração do player é a soma real dos takes: 02:48',H.duration===H.scenes.reduce((n,s)=>n+s.duration,0)&&H.formatTime(H.duration)==='02:48');
  check('Tempo também suporta horas',H.formatTime(3661)==='01:01:01');
  check('Barra semântica, intervalo real e controles identificados',H.seekInput.type==='range'&&Number(H.seekInput.max)===H.duration&&H.playButton.getAttribute('aria-label')&&H.speedButton.getAttribute('aria-haspopup')==='menu');
  check('Velocidade inicial normal',H.playbackRate===1);
  H.pause();H.seekTo(72);const approved=snapshot();
  check('Seek mostra imediatamente o voo, o tempo e a barra corretos',H.state.scene==='journey'&&H.state.poses.iara.wholeBody&&H.timeOutput.textContent==='01:12 / 02:48'&&close(Number(H.seekInput.value),72));
  H.seekTo(165);check('Busca direta reconstrói as prisioneiras e olhos azuis',H.state.scene==='captives'&&H.state.poses.cuca.blue>.9&&H.state.poses.loira.close);
  H.seekTo(12);H.seekTo(72);check('Retroceder e avançar reconstrói exatamente o mesmo estado visual',snapshot()===approved);
  H.seekInput.value='123';H.seekInput.dispatchEvent(new w.Event('input',{bubbles:true}));check('Evento da barra controla o tempo real e o take',H.time===123&&H.state.scene==='chase');
  H.seekTo(-100);check('Seek limita o início',H.time===0);H.seekTo(Infinity);check('Seek ignora valores inválidos',H.time===0);
  H.seekTo(72);H.manual=false;
  for(const rate of [1,1.4,2]){
   H.setPlaybackRate(rate);H.play();const before=H.time;H.last=1000;H.frame(2000);
   check('Relógio avança uma única vez na velocidade '+rate+'x',close(H.time-before,rate));
   H.manual=true;H.pause();const frozen=H.time;H.setPlaybackRate(rate);H.frame(5000);
   check('Velocidade '+rate+'x pode mudar com quadro pausado',H.time===frozen&&H.paused&&H.state.poses.iara.wholeBody);
   H.manual=false;
  }
  H.manual=true;H.pause();H.seekTo(80);H.setPlaybackRate(1);
  for(const [code,delta] of [['KeyJ',-10],['KeyL',10],['ArrowLeft',-5],['ArrowRight',5]]){const before=H.time,event=key(code);check(code+' navega sem rolagem da página',H.time===before+delta&&event.defaultPrevented);}
  key('KeyK');check('K reproduz',!H.paused);key('Space');check('Espaço pausa no mesmo ponto',H.paused&&H.time===80);
  const field=w.document.createElement('input');field.type='text';H.root.append(field);field.focus();const untouched=H.time,event=key('KeyL',field);check('Atalhos respeitam campos de texto',H.time===untouched&&!event.defaultPrevented);field.remove();
  H.setSpeedMenu(true);check('Menu marca velocidade selecionada e recebe foco',H.speedOpen&&H.speedMenu.querySelector('[aria-checked="true"]').contains(w.document.activeElement));
  key('ArrowDown',w.document.activeElement);w.document.activeElement.click();check('Seleção acessível de 1.4x fecha o menu',H.playbackRate===1.4&&!H.speedOpen&&H.speedButton.getAttribute('aria-expanded')==='false');
  H.root.focus();H.play();H.controlsHovered=false;H.showControls();H.updateVisibility(performance.now()+3000);check('Controles se ocultam após inatividade',H.root.classList.contains('story-controls-hidden'));
  H.root.dispatchEvent(new w.PointerEvent('pointermove',{bubbles:true}));check('Mover o mouse revela os controles',!H.root.classList.contains('story-controls-hidden'));
  H.pause();H.updateVisibility(performance.now()+5000);check('Pausa mantém os controles visíveis',!H.root.classList.contains('story-controls-hidden'));
  const rect=H.seekInput.getBoundingClientRect(),preview=H.previewAt(rect.left+rect.width*.75,true);check('Tooltip informa posição real e permanece na barra',close(preview.time,H.duration*.75)&&H.tooltip.textContent==='02:06'&&parseFloat(H.tooltip.style.left)<=rect.width);
  H.tooltip.hidden=true;
  H.pause();H.beginScrub();H.seekTo(32);H.seekTo(130);H.endScrub();check('Arrastar pausado preserva pausa e muda entre takes',H.time===130&&H.paused&&H.state.scene==='chase');
  H.play();H.beginScrub();H.seekTo(65);H.endScrub();check('Arrastar reproduzindo retoma no ponto escolhido',H.time===65&&!H.paused&&!H.scrubbing);
  H.pause();H.seekTo(140);const dust=H.hope.querySelector('.story-dust');check('Partículas CSS seguem o tempo da timeline e ficam congeladas',dust.style.animationDelay==='-140s'&&w.getComputedStyle(dust).animationPlayState==='paused');
  await audio.prepare(H.scenes,H.duration);
  check('Áudio procedural completo é navegável por amostra',audio.buffer&&audio.buffer.duration===H.duration&&audio.buffer.getChannelData(0).some(value=>Math.abs(value)>.001));
  H.sound=audio;H.manual=false;H.seekTo(72);H.setPlaybackRate(2);H.play();const first=audio.source;
  check('Áudio usa a mesma posição e velocidade da timeline',first&&audio.offset===72&&first.playbackRate.value===2&&first.buffer===audio.buffer);
  H.seekTo(165);check('Seek substitui a fonte sem sons históricos acumulados',audio.source!==first&&first.onended===null&&audio.offset===165);
  H.pause();H.setPlaybackRate(1.4);check('Pausa silencia a fonte e mantém offset e velocidade',audio.source===null&&!audio.playing&&audio.rate===1.4&&close(audio.offset,H.time));
  H.play();H.beginScrub();const frozenOffset=H.time;
  for(let i=0;i<100;i++)H.seekTo(i*1.5);
  check('Cem buscas durante arrasto não disparam áudio',audio.source===null&&!audio.playing&&H.time!==frozenOffset);
  H.endScrub();check('Soltar o arrasto retoma um único buffer na posição escolhida',audio.source&&audio.offset===H.time&&close(audio.source.playbackRate.value,1.4));
  H.manual=true;H.seekTo(999);check('Fim mantém quadro preto, barra cheia e opção de repetir',H.active&&H.ended&&H.paused&&H.state.black===1&&H.time===H.duration&&Number(H.seekInput.value)===H.duration&&!H.endPanel.hidden&&audio.source===null);
  H.seekTo(72);check('É possível voltar depois do fim',!H.ended&&H.paused&&H.state.scene==='journey');H.play();check('Play após voltar retoma sem reiniciar',H.time===72&&!H.paused);
  H.seekTo(H.duration);H.restart();check('Repetir reabre a timeline do zero',H.time===0&&!H.ended&&!H.paused&&H.active);
  check('Botão de tela cheia corresponde ao suporte do navegador',H.fullscreenButton.hidden===!(H.root.requestFullscreen&&w.document.fullscreenEnabled));
 }catch(error){errors.push(error.stack);check('Controles: '+error.stack,false);}
 finally{audio.stop();H.sound=originalSound;H.manual=true;H.ended=false;H.paused=false;H.scrubbing=false;H.setPlaybackRate(1);H.seekTo(0);H.setSpeedMenu(false);H.root.focus();}
 check('Áudio libera fonte, contexto e buffer ao encerrar',audio.source===null&&audio.ctx===null&&audio.buffer===null);
};
