/* The existing ten-scene story, now rendered exclusively with painted Canvas 2D sprites. */
(() => {
 'use strict';const B=Boitata;
 const definitions=[
  ['sleep',18,['boitata'],'forest-dolly / temple-reveal',['breathing','closed-eyes','drawn-fire'],[3]],
  ['shadow',14,['boitata'],'shadow-reveal / eye-push',['shadow','fire-loss','blackout'],[2,10,12]],
  ['lagoon',18,['iara'],'lagoon-wide / comb-medium',['articulated-combing','hair','water'],[0]],
  ['cry',10,['iara'],'reaction-close / temple-sightline',['scream','frozen-hand','fear','impact'],[.3,1.5,7]],
  ['journey',22,['iara'],'side-track / forest-travel',['raise-hand','comb-release','aerial-swimming','hair-lag'],[1,4]],
  ['flameless',17,['iara','boitata'],'reaction / serpent-reveal',['worry','gasp','weakness','no-fire'],[2,7]],
  ['virus',13,['iara','boitata','virus'],'portal / escape-track',['materialize','reaction','continuous-flight'],[1,4,9]],
  ['chase',23,['iara','boitata','virus'],'travelling / eyes / clearing',['serpentine-body','swimming','parallax','mutual-look','fade'],[0,8,18,21]],
  ['hope',11,[],'black-title',['emerald-dust','silver-sheen','title-fade'],[1,3,8]],
  ['captives',22,['cuca','loira'],'laboratory / portraits',['breathing','head-raise','blue-eyes','glitch','blackout'],[1,9,16,20]]
 ];let cursor=0;
 const scenes=definitions.map(([id,duration,characters,cameras,animations,events],index)=>{const scene={id,index,start:cursor,duration,characters,cameras,animations,events};cursor+=duration;return scene;});
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const icon=path=>'<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="'+path+'"/></svg>';
 const icons={play:icon('M8 5v14l11-7z'),pause:icon('M6 5h4v14H6zm8 0h4v14h-4z'),replay:icon('M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z'),fullscreen:icon('M3 3h7v2H5v5H3zm11 0h7v7h-2V5h-5zM3 14h2v5h5v2H3zm16 0h2v7h-7v-2h5z'),exitFullscreen:icon('M8 3h2v7H3V8h5zm6 0h2v5h5v2h-7zM3 14h7v7H8v-5H3zm11 0h7v2h-5v5h-2z')};
 const H=B.Story={active:false,loading:false,paused:false,ended:false,scrubbing:false,time:0,playbackRate:1,duration:cursor,scenes,
  get currentTime(){return this.time;},
  get isPlaying(){return !!(this.active&&!this.loading&&this.renderer&&!this.paused&&!this.ended&&!this.scrubbing);},
  formatTime(seconds,forceHours=this.duration>=3600){const value=Math.max(0,Math.floor(Number(seconds)||0)),h=Math.floor(value/3600),m=Math.floor(value/60)%60,s=value%60;return (h||forceHours?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');},
 async start({manual=false,final=false}={}){
   if(this.active)return false;
   if(final){this.duration=10;this.scenes=[{id:'final',index:0,start:0,duration:10}];}
   Object.assign(this,{active:true,loading:true,paused:false,ended:false,scrubbing:false,manual,final,time:0,playbackRate:1,speedOpen:false,controlsHovered:false,keyboardInteraction:false,scrubPointer:null,error:null});
   this.root=document.createElement('section');this.root.className='story-screen';this.root.tabIndex=-1;this.root.setAttribute('aria-label','História do BOITATÁ — anime 2D');
   this.root.innerHTML=`<canvas class="story-canvas" aria-label="Animação 2D da história do BOITATÁ"></canvas><div class="story-letterbox story-letterbox-top"></div><div class="story-letterbox story-letterbox-bottom"></div><div class="story-curtain" aria-hidden="true"></div><div class="story-hope" aria-hidden="true"><div class="story-dust"></div><span>Que o sistema seja salvo</span></div><div class="story-loading" role="status">Carregando a animação 2D…</div><div class="story-ended" hidden><button data-story="restart">${icons.replay}<span>REPRODUZIR NOVAMENTE</span></button></div><nav class="story-controls" aria-label="Controles da história"><div class="story-progress"><input class="story-seek" type="range" min="0" max="${this.duration}" step="0.01" value="0" aria-label="Posição da história" disabled><output class="story-time-preview" aria-hidden="true" hidden>00:00</output></div><div class="story-control-row"><button class="story-icon-button" data-story="pause" aria-label="Pausar" title="Pausar (Espaço ou K)" disabled>${icons.pause}</button><output class="story-time" aria-label="Tempo da história">00:00 / ${this.formatTime(this.duration)}</output><span class="story-control-spacer"></span><button class="story-text-button" data-story="skip">PULAR</button><button class="story-text-button" data-story="menu">VOLTAR AO MENU</button><div class="story-speed-control"><button data-story="speed" aria-label="Velocidade de reprodução: 1x" aria-haspopup="menu" aria-expanded="false" aria-controls="story-speed-options" disabled>1x <span aria-hidden="true">⌃</span></button><div class="story-speed-menu" id="story-speed-options" role="menu" aria-label="Velocidade de reprodução" hidden><span class="story-speed-heading">VELOCIDADE</span><button role="menuitemradio" data-rate="1" aria-checked="true"><span>1x</span> Normal</button><button role="menuitemradio" data-rate="1.4" aria-checked="false"><span>1.4x</span> Rápido</button><button role="menuitemradio" data-rate="2" aria-checked="false"><span>2x</span> Muito rápido</button></div></div><button class="story-icon-button" data-story="fullscreen" aria-label="Entrar em tela cheia" title="Tela cheia" disabled>${icons.fullscreen}</button></div><span class="story-player-status" role="status" aria-live="polite"></span></nav>`;
   B.TempleMenu.stop();B.S.phase='story';B.Movement.clear();document.body.append(this.root);document.body.classList.add('story-active');
   const find=selector=>this.root.querySelector(selector);
   this.curtain=find('.story-curtain');this.hope=find('.story-hope');this.controls=find('.story-controls');this.seekInput=find('.story-seek');this.timeOutput=find('.story-time');this.tooltip=find('.story-time-preview');this.playButton=find('[data-story="pause"]');this.speedButton=find('[data-story="speed"]');this.speedMenu=find('.story-speed-menu');this.fullscreenButton=find('[data-story="fullscreen"]');this.endPanel=find('.story-ended');this.status=find('.story-player-status');
   this.playButton.onclick=()=>this.togglePause();find('[data-story="restart"]').onclick=()=>this.restart();
   find('[data-story="skip"]').onclick=()=>this.stop();find('[data-story="menu"]').onclick=()=>this.stop();
   this.speedButton.onclick=()=>this.setSpeedMenu(!this.speedOpen);
   for(const button of this.speedMenu.querySelectorAll('[data-rate]'))button.onclick=()=>{this.setPlaybackRate(Number(button.dataset.rate));this.setSpeedMenu(false,true);};
   this.speedMenu.onkeydown=e=>{const options=[...this.speedMenu.querySelectorAll('button')],index=options.indexOf(document.activeElement);let next;if(e.code==='ArrowDown')next=(index+1)%options.length;if(e.code==='ArrowUp')next=(index+options.length-1)%options.length;if(e.code==='Home')next=0;if(e.code==='End')next=options.length-1;if(next!==undefined){e.preventDefault();e.stopPropagation();options[next].focus();}};
   this.fullscreenButton.hidden=!(this.root.requestFullscreen&&document.fullscreenEnabled);this.fullscreenButton.onclick=()=>this.toggleFullscreen();
   this.fullscreenHandler=()=>{if(!this.active)return;const full=document.fullscreenElement===this.root;this.fullscreenButton.innerHTML=full?icons.exitFullscreen:icons.fullscreen;this.fullscreenButton.setAttribute('aria-label',full?'Sair da tela cheia':'Entrar em tela cheia');this.showControls();this.resize();};
   document.addEventListener('fullscreenchange',this.fullscreenHandler);
   this.root.onpointermove=()=>this.showControls();this.root.onpointerdown=e=>{this.keyboardInteraction=false;this.showControls();if(!e.target.closest('.story-controls')){this.setSpeedMenu(false);this.root.focus({preventScroll:true});}else if(!e.target.closest('.story-speed-control'))this.setSpeedMenu(false);};
   this.controls.onpointerenter=e=>{if(e.pointerType!=='touch')this.controlsHovered=true;this.showControls();};this.controls.onpointerleave=()=>{this.controlsHovered=false;this.showControls();};this.controls.onfocusin=()=>this.showControls();
   this.seekInput.onpointerdown=e=>{if(this.loading||!this.renderer||e.button>0)return;e.preventDefault();this.seekInput.focus({preventScroll:true});this.beginScrub();this.scrubPointer=e.pointerId;this.seekInput.setPointerCapture(e.pointerId);this.seekTo(this.previewAt(e.clientX).time);};
   this.seekInput.onpointermove=e=>{this.previewAt(e.clientX,true);if(this.scrubbing&&e.pointerId===this.scrubPointer)this.seekTo(this.previewAt(e.clientX).time);};
   this.seekInput.onpointerup=e=>{if(e.pointerId!==this.scrubPointer)return;this.seekTo(this.previewAt(e.clientX).time);this.endScrub();};
   this.seekInput.onpointercancel=()=>this.endScrub();this.seekInput.onlostpointercapture=()=>this.endScrub();this.seekInput.onpointerleave=()=>{if(!this.scrubbing)this.tooltip.hidden=true;};
   this.seekInput.oninput=()=>{this.seekTo(Number(this.seekInput.value));this.showControls();};
   this.keyHandler=e=>this.handleKey(e);this.visibilityHandler=()=>{if(document.hidden&&this.isPlaying)this.pause();};this.resizeHandler=()=>this.resize();
   document.addEventListener('keydown',this.keyHandler,true);document.addEventListener('visibilitychange',this.visibilityHandler);window.addEventListener('resize',this.resizeHandler);
   this.assets=B.StoryAssets2D.create();this.sound=new B.StorySound({music:true,effects:true});const session=this.assets,sound=this.sound;sound.onResume=()=>{if(this.active&&!this.loading&&this.sound===sound)this.syncAudio();};
   this.showControls();
   try{
    await session.load((done,total)=>{if(this.active&&this.assets===session)this.root.querySelector('.story-loading').textContent=done===total?'Preparando reprodução…':'Carregando a animação 2D… '+done+'/'+total;});
    if(!this.active||this.assets!==session)return false;
    this.renderer=new B.StoryRenderer2D(this.root.querySelector('canvas'),session);
    this.renderer.finalEnding=!!final;
    this.loading=false;find('.story-loading').remove();for(const element of [this.playButton,this.seekInput,this.speedButton,this.fullscreenButton])element.disabled=false;
    this.resize();this.renderAt(0);this.last=performance.now();this.syncAudio();this.showControls();this.root.focus({preventScroll:true});sound.prepare(this.scenes,this.duration).then(()=>{if(this.active&&this.sound===sound)this.syncAudio();}).catch(error=>{if(this.active&&this.sound===sound){this.error=error.message;this.status.textContent='Áudio indisponível neste navegador.';}});return true;
   }catch(error){
    if(!this.active||this.assets!==session)return false;
    this.loading=false;this.error=error.message;let message=find('.story-loading');if(!message){message=document.createElement('div');message.className='story-loading';message.setAttribute('role','alert');this.root.append(message);}message.textContent='A animação 2D não pôde carregar: '+error.message+'. Volte ao menu e tente novamente.';message.classList.add('story-load-error');this.renderer?.dispose();this.renderer=null;sound.stop();return false;
   }
  },
  resize(){if(!this.renderer||!this.root)return;this.renderer.resize(this.root.clientWidth||innerWidth,this.root.clientHeight||innerHeight);if(!this.loading)this.renderAt(this.time);},
  showControls(){if(!this.root)return;this.lastInteraction=performance.now();this.root.classList.remove('story-controls-hidden');},
  updateVisibility(now){if(!this.root)return;const keep=this.loading||this.paused||this.ended||this.scrubbing||this.speedOpen||this.controlsHovered||(this.keyboardInteraction&&this.controls.contains(document.activeElement));this.root.classList.toggle('story-controls-hidden',!keep&&now-this.lastInteraction>2800);},
  setSpeedMenu(open,restoreFocus=false){this.speedOpen=!!open;this.speedMenu.hidden=!open;this.speedButton.setAttribute('aria-expanded',String(!!open));this.showControls();if(open)this.speedMenu.querySelector('[aria-checked="true"]').focus();else if(restoreFocus)this.speedButton.focus();},
  previewAt(clientX,show=false){const rect=this.seekInput.getBoundingClientRect(),ratio=clamp((clientX-rect.left)/Math.max(1,rect.width),0,1),time=ratio*this.duration;if(show){this.tooltip.textContent=this.formatTime(time);this.tooltip.hidden=false;const half=this.tooltip.offsetWidth/2+4;this.tooltip.style.left=clamp(clientX-rect.left,half,Math.max(half,rect.width-half))+'px';}return {time,ratio};},
  beginScrub(){if(this.scrubbing)return;this.advance(performance.now());this.resumeAfterScrub=!this.paused&&!this.ended;this.scrubbing=true;this.syncAudio();this.syncControls();this.showControls();},
  endScrub(){if(!this.scrubbing)return;const pointer=this.scrubPointer;this.scrubPointer=null;this.scrubbing=false;if(this.resumeAfterScrub&&!this.ended)this.paused=false;this.resumeAfterScrub=false;this.last=performance.now();if(pointer!==null&&this.seekInput.hasPointerCapture(pointer))this.seekInput.releasePointerCapture(pointer);this.tooltip.hidden=true;this.syncAudio();this.syncControls();this.showControls();},
  seekTo(seconds){if(!this.active||this.loading||!this.renderer||!Number.isFinite(Number(seconds)))return this.time;const target=clamp(Number(seconds),0,this.duration);this.ended=target>=this.duration;if(this.ended)this.paused=true;this.renderAt(target);this.last=performance.now();this.syncAudio();this.showControls();return this.time;},
  play(){if(!this.active||this.loading||!this.renderer)return;if(this.ended){this.ended=false;this.renderAt(0);}this.paused=false;this.last=performance.now();this.syncAudio();this.syncControls();this.showControls();},
  pause(){if(!this.active||this.loading||!this.renderer)return;this.advance(performance.now());this.paused=true;this.last=performance.now();this.syncAudio();this.syncControls();this.showControls();},
  togglePause(){if(this.paused||this.ended)this.play();else this.pause();},
  restart(){if(!this.renderer)return;this.ended=false;this.seekTo(0);this.play();},
  setPlaybackRate(rate){rate=Number(rate);if(![1,1.4,2].includes(rate)||!this.renderer)return false;this.advance(performance.now());this.playbackRate=rate;this.last=performance.now();this.syncAudio();this.syncControls();this.showControls();return true;},
  syncAudio(){this.sound?.sync(this.time,this.playbackRate,this.isPlaying&&!this.manual);},
  advance(now){if(!this.active||this.loading||!this.renderer)return;if(this.manual||!this.isPlaying){this.last=now;return;}const delta=Math.max(0,(now-this.last)/1000);this.last=now;const audio=this.sound,clock=audio?.playing&&audio.source&&audio.ctx?.state==="running"?audio.currentTime:this.time+delta*this.playbackRate;this.renderAt(clock);if(this.time>=this.duration){this.ended=true;this.paused=true;this.syncAudio();this.syncControls();this.showControls();}},
  frame(now){if(!this.active||this.loading||!this.renderer)return;this.advance(now);this.updateVisibility(now);},
  renderAt(time){if(!this.renderer)return;this.time=clamp(time,0,this.duration);this.state=this.renderer.render(this.time,this.scenes);this.current=this.scenes[this.state.index];this.root.dataset.scene=this.state.scene;this.curtain.style.opacity=String(this.state.black);this.hope.style.opacity=String(this.state.title);this.hope.style.setProperty('--story-sheen',((this.state.local-2)/5*220-60)+'%');this.hope.querySelector('.story-dust').style.animationDelay=-this.time+'s';this.syncControls();return this.state;},
  syncControls(){
   if(!this.controls)return;const progress=this.duration?this.time/this.duration:0;
   this.seekInput.value=String(this.time);this.seekInput.style.setProperty('--story-progress',(progress*100)+'%');
   const current=this.formatTime(this.time),duration=this.formatTime(this.duration),text=current+' / '+duration;
   if(this.timeOutput.textContent!==text){this.timeOutput.textContent=text;this.seekInput.setAttribute('aria-valuetext',current+' de '+duration);}
   const paused=this.paused||this.ended||this.scrubbing,label=this.ended?'Reproduzir novamente':paused?'Reproduzir':'Pausar';
   if(this.playButton.getAttribute('aria-label')!==label){this.playButton.innerHTML=this.ended?icons.replay:paused?icons.play:icons.pause;this.playButton.setAttribute('aria-label',label);this.playButton.title=label+' (Espaço ou K)';}
   this.root.classList.toggle('story-paused',paused);this.endPanel.hidden=!this.ended;
   const rateLabel='Velocidade de reprodução: '+this.playbackRate+'x';
   if(this.speedButton.getAttribute('aria-label')!==rateLabel){this.speedButton.innerHTML=this.playbackRate+'x <span aria-hidden="true">⌃</span>';this.speedButton.setAttribute('aria-label',rateLabel);for(const option of this.speedMenu.querySelectorAll('[data-rate]'))option.setAttribute('aria-checked',String(Number(option.dataset.rate)===this.playbackRate));}
  },  handleKey(e){this.keyboardInteraction=true;if(!this.active||e.altKey||e.ctrlKey||e.metaKey||e.target.closest?.('textarea,select,input:not([type="range"]),[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))return;if(e.code==='Escape'&&this.speedOpen){e.preventDefault();e.stopImmediatePropagation();this.setSpeedMenu(false,true);return;}if(e.code==='Escape'&&document.fullscreenElement===this.root){e.stopImmediatePropagation();return;}if(this.loading||!this.renderer)return;const jumps={KeyJ:-10,KeyL:10,ArrowLeft:-5,ArrowRight:5},toggle=['Space','KeyK','Escape'].includes(e.code);if(!toggle&&jumps[e.code]===undefined)return;if(e.code==='Space'&&e.target.closest?.('button')&&e.target!==this.playButton)return;e.preventDefault();e.stopImmediatePropagation();if(toggle){if(!e.repeat)this.togglePause();}else this.seekTo(this.time+jumps[e.code]);this.showControls();},
  async toggleFullscreen(){if(!this.root)return;this.fullscreenError=null;this.status.textContent='';try{if(document.fullscreenElement===this.root)await document.exitFullscreen();else await this.root.requestFullscreen();}catch(error){this.fullscreenError=String(error?.message||error);if(this.status)this.status.textContent='Tela cheia indisponível neste navegador.';}},
  cleanup(){
   if(this.root&&document.fullscreenElement===this.root)document.exitFullscreen().catch(()=>{});
   this.sound?.stop();this.renderer?.dispose();this.assets?.release();this.root?.remove();
   document.removeEventListener('keydown',this.keyHandler,true);document.removeEventListener('visibilitychange',this.visibilityHandler);document.removeEventListener('fullscreenchange',this.fullscreenHandler);window.removeEventListener('resize',this.resizeHandler);
   for(const name of ['sound','renderer','assets','root','controls','seekInput','timeOutput','tooltip','playButton','speedButton','speedMenu','fullscreenButton','endPanel','status','hope','curtain'])this[name]=null;this.error=null;
  },
  stop(){if(!this.active)return;const final=this.final;this.active=false;this.loading=false;this.paused=false;this.ended=false;this.scrubbing=false;this.cleanup();document.body.classList.remove('story-active');this.final=false;this.duration=168;this.scenes=scenes;B.UI.menu();}
 };
})();
