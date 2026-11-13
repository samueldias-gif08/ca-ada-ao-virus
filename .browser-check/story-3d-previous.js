/* Original, deterministic 168-second cinematic. Absolute poses, independent scene/cameras/audio. */
(() => {
 'use strict';const B=Boitata,T=window.THREE;if(!T)return;
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,u)=>a+(b-a)*u,v=(x,y,z)=>new T.Vector3(x,y,z);
 const definitions=[
  ['sleep',18,['boitata'],'forest-dolly / temple-orbit',['breathing','closed-eyes','mystic-fire'],[3]],
  ['shadow',14,['boitata'],'column-reveal / eye-push',['shadow-approach','rune-failure','blackout'],[2,10,12]],
  ['lagoon',18,['iara'],'lagoon-wide / comb-medium',['two-bone-combing','fish','ripples'],[0]],
  ['cry',10,['iara'],'reaction-close / temple-sightline',['scream','freeze-hand','fear','head-turn'],[.3,1.5,7]],
  ['journey',22,['iara'],'side-track / rear-follow / face',['raised-hand','lift','mermaid-strokes','hair-lag'],[1,4]],
  ['flameless',17,['iara','boitata'],'entrance / reaction / serpent-reveal',['recoil','gasp','weak-eyes','no-fire'],[2,7]],
  ['virus',13,['iara','boitata','virus'],'portal / reaction / escape-track',['materialize','head-lift','continuous-escape'],[1,4,9]],
  ['chase',23,['iara','boitata','virus'],'lateral / rear-track / two-shot',['serpentine-spine','aerial-swimming','daybreak','mutual-look','fade'],[0,8,18,21]],
  ['hope',11,[],'black-title',['emerald-dust','silver-sheen','title-fade'],[1,3,8]],
  ['captives',22,['cuca','loira'],'lab-dolly / faces / split-eyes',['seated-bind-pose','restraints','head-awaken','blue-eyes','blackout'],[1,9,16,20]]
 ];let cursor=0;
 const H=B.Story={active:false,paused:false,time:0,duration:168,
  scenes:definitions.map(([id,duration,characters,cameras,animations,events],index)=>{const s={id,index,start:cursor,duration,characters,cameras,animations,events,transition:['shadow','chase','hope','captives'].includes(id)?'fade-black':'matched-cut'};cursor+=duration;return s;}),
  start({manual=false}={}){
   if(this.active)return;
   if(!B.Forest3D.renderer||!B.OrganicCharacters){B.UI.panel('HISTÓRIA','Renderização 3D indisponível','<p>Ative a aceleração gráfica do navegador para assistir à história.</p>',[['Voltar ao menu',()=>B.UI.menu(),true]]);return false;}
   this.root=document.createElement('section');this.root.className='story-screen';this.root.setAttribute('aria-label','História do BOITATÁ');
   this.root.innerHTML='<canvas class="story-canvas" aria-label="Cinemática 3D da história do BOITATÁ"></canvas><div class="story-letterbox story-letterbox-top"></div><div class="story-letterbox story-letterbox-bottom"></div><div class="story-speed" aria-hidden="true"></div><div class="story-glitch" aria-hidden="true"></div><div class="story-curtain" aria-hidden="true"></div><div class="story-hope" aria-hidden="true"><div class="story-dust"></div><span>Que o sistema seja salvo</span></div><div class="story-divider" aria-hidden="true"></div><nav class="story-controls" aria-label="Controles da história"><button data-story="pause">PAUSAR</button><button data-story="skip">PULAR</button><button data-story="menu">VOLTAR AO MENU</button></nav>';
   document.body.append(this.root);
   try{
    this.renderer=new T.WebGLRenderer({canvas:this.root.querySelector('canvas'),antialias:true,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    this.scene=new T.Scene();this.world=new B.StoryWorld(this.scene);this.camera=new T.PerspectiveCamera(45,16/9,.08,180);
    this.flightRoute=new T.CatmullRomCurve3([v(-20,.11,16),v(-20,2.3,16),v(-15,4,12),v(-7,3.2,7),v(-2,1,2)],false,'centripetal');this.flightPosition=v();this.flightDirection=v();
    this.closeCameras=[new T.PerspectiveCamera(28,1,.05,100),new T.PerspectiveCamera(28,1,.05,100)];
    this.actors={};for(const id of ['boitata','iara','cuca','loira']){const actor=B.StoryActors.build(id);this.actors[id]=actor;this.scene.add(actor.root);}
    B.StoryActors.seated(this.actors.cuca);B.StoryActors.seated(this.actors.loira);
    this.actors.cuca.root.scale.setScalar(.48);this.actors.loira.root.scale.setScalar(.85);
    this.sound=new B.StorySound(B.S.save.audio);
   }catch(error){this.cleanup();B.UI.panel('HISTÓRIA','Não foi possível abrir a cena 3D','<p>O navegador não conseguiu criar os recursos da cinemática.</p>',[['Voltar ao menu',()=>B.UI.menu(),true]]);console.error('História:',error);return false;}
   B.TempleMenu.stop();document.body.classList.add('story-active');B.S.phase='story';B.Movement.clear();
   this.active=true;this.manual=manual;this.paused=false;this.time=0;this.last=performance.now();
   this.curtain=this.root.querySelector('.story-curtain');this.hope=this.root.querySelector('.story-hope');this.glitch=this.root.querySelector('.story-glitch');this.speed=this.root.querySelector('.story-speed');
   this.root.querySelector('[data-story="pause"]').onclick=()=>this.togglePause();
   this.root.querySelector('[data-story="skip"]').onclick=()=>this.stop();
   this.root.querySelector('[data-story="menu"]').onclick=()=>this.stop();
   this.keyHandler=e=>{if(!this.active)return;if(e.code==='Escape'||e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();this.togglePause();}};
   this.visibilityHandler=()=>{if(document.hidden&&!this.paused)this.togglePause();};
   this.resizeHandler=()=>this.resize();
   document.addEventListener('keydown',this.keyHandler,true);document.addEventListener('visibilitychange',this.visibilityHandler);window.addEventListener('resize',this.resizeHandler);
   this.resize();this.renderAt(0);this.last=performance.now();this.root.querySelector('button').focus({preventScroll:true});return true;
  },
  resize(){if(!this.renderer||!this.root)return;const width=this.root.clientWidth||innerWidth,height=this.root.clientHeight||innerHeight,limit=B.Forest3D.quality==='low'?720:1080;
   const scale=Math.min(window.devicePixelRatio||1,limit/height,1920/width);this.renderer.setPixelRatio(1);this.renderer.setSize(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)),false);
   this.camera.aspect=width/height;this.camera.updateProjectionMatrix();for(const c of this.closeCameras){c.aspect=width/height/2;c.updateProjectionMatrix();}if(this.active&&(this.paused||this.manual))this.renderAt(this.time);
  },
  togglePause(){if(!this.active)return;this.paused=!this.paused;this.last=performance.now();this.sound.pause(this.paused);this.root.classList.toggle('story-paused',this.paused);this.root.querySelector('[data-story="pause"]').textContent=this.paused?'CONTINUAR':'PAUSAR';},
  frame(now){if(!this.active)return;if(this.manual||this.paused){this.last=now;return;}this.time+=(now-this.last)/1000;this.last=now;this.renderAt(this.time);this.sound.update(this.time,this.current.index);if(this.time>=this.duration)this.stop();},
  shot(a,b,lookA,lookB,u,fov=45){const k=ease(u);this.camera.position.set(mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k));this.lookTarget=v(mix(lookA[0],lookB[0],k),mix(lookA[1],lookB[1],k),mix(lookA[2],lookB[2],k));this.camera.lookAt(this.lookTarget);this.camera.fov=fov;this.camera.updateProjectionMatrix();},
  place(actor,x,y,z,yaw=0,pitch=0){actor.root.position.set(x,y,z);actor.root.quaternion.setFromEuler(new T.Euler(pitch,yaw,0,'YXZ'));},
  renderAt(time){
   if(!this.scene)return;const t=clamp(time,0,this.duration),s=this.scenes.find(q=>t<q.start+q.duration)||this.scenes.at(-1),local=t-s.start,u=clamp(local/s.duration),A=B.StoryActors,{boitata:boi,iara,cuca,loira}=this.actors;
   this.current=s;this.time=t;for(const actor of Object.values(this.actors))actor.root.visible=false;
   boi.root.scale.set(1,1,1);boi.head.rotation.set(0,0,0);
   const lab=s.index===9;this.world.forest.visible=!lab;this.world.lab.visible=lab;
   let fire=0,day=0,shadow=0,portal=0,flight=0,black=0,glitch=0;
   this.world.virus.visible=false;this.hope.style.opacity='0';this.root.querySelector('.story-divider').style.opacity='0';
   const show=(actor)=>actor.root.visible=true;
   const sleep=()=>{show(boi);this.place(boi,0,.36,0);A.serpent(boi,t,0);A.face(boi,'sleep');boi.head.rotation.set(.04+Math.sin(t*1.3)*.008,0,-.03);boi.root.scale.set(1,1+Math.sin(t*1.3)*.014,1);};
   const lake=()=>{show(iara);this.place(iara,-20,.11,16,1.3);};
   if(s.index===0){
    sleep();fire=1;black=1-ease(local/2);
    if(local<7)this.shot([-14,5,12],[-5,3.3,7],[0,2,0],[0,1,0],local/7,48);
    else {const a=mix(.8,2.0,ease((local-7)/11));this.shot([Math.sin(a)*4,2.2,Math.cos(a)*4],[Math.sin(a)*4,2.2,Math.cos(a)*4],[0,.75,0],[0,.75,0],0,42);}
   }else if(s.index===1){
    sleep();shadow=ease(local/9);fire=(1-ease(local/11))*(.8+Math.sin(local*9)*.2);glitch=ease((local-6)/5)*(.25+Math.max(0,Math.sin(local*11))*.4);black=ease((local-11)/2);
    if(local<6)this.shot([4,2.3,5],[3,2,4],[1,1,-1],[1.2,1.3,-1],local/6,47);
    else this.shot([3,2,4],[.1,.97,1.05],[0,.8,0],[0,.68,.16],(local-6)/5,36);
    this.camera.position.x+=Math.sin(local*15)*.012*shadow;this.camera.lookAt(this.lookTarget);
   }else if(s.index===2){
    lake();A.iara(iara,local,{mode:'comb'});black=1-ease(local/2);
    this.shot([-27,4.5,24],[-18.4,1.9,19],[-20,.9,16],[-20,1.25,16],local/18,43);
   }else if(s.index===3){
    lake();const react=ease((local-.3)/.45);A.iara(iara,18,{mode:local<.3?'comb':'freeze',emotion:react>.2?'fear':'calm',turn:react*.9});
    if(local<7)this.shot([-18.4,1.9,19],[-19.1,1.63,15.4],[-20,1.35,16],[-20,1.52,16],local/4,34);
    else this.shot([-19,2.3,16],[-17,3.4,13],[0,3,0],[0,3,0],(local-7)/3,49);
   }else if(s.index===4){
    show(iara);const travel=ease((local-4)/18),route=this.flightRoute;
    const position=route.getPoint(travel,this.flightPosition),direction=route.getTangent(travel,this.flightDirection),heading=Math.hypot(direction.x,direction.z)<.01?2.2:Math.atan2(direction.x,direction.z),yaw=local<4?mix(1.3,2.2,ease(local/2)):mix(2.2,heading,ease((local-4)/3));this.place(iara,position.x,position.y,position.z,yaw,-.22*Math.sin(travel*Math.PI));
    A.iara(iara,local,{mode:local<4?'start':'swim',emotion:'determined',turn:.9*(1-ease(local/2)),amount:ease(local/3),swimBlend:ease((local-4)/1.2)});flight=ease(local/4);
    if(local<2.4){iara.comb.visible=true;iara.comb.position.set(.27,1.22-ease(local/2)*1.4,-.17+local*.06);iara.comb.rotation.set(local*1.7,local,.2);}
    if(local<4)this.shot([-17,3.4,13],[-18,2.2,19],[-20,1,16],[-20,1.5,16],local/4,46);
    else if(local<9)this.shot([position.x+3,position.y+1.5,position.z+3],[position.x+3,position.y+1.5,position.z+3],[position.x,position.y+1,position.z],[position.x,position.y+1,position.z],0,45);
    else if(local<12)this.shot([position.x+direction.x*1.25,position.y+1.5,position.z+direction.z*1.25],[position.x+direction.x*1.25,position.y+1.5,position.z+direction.z*1.25],[position.x,position.y+1.45,position.z],[position.x,position.y+1.45,position.z],0,36);
    else this.shot([position.x-direction.x*3,position.y+1.6,position.z-direction.z*3],[position.x-direction.x*3,position.y+1.6,position.z-direction.z*3],[position.x+direction.x*2,position.y+1,position.z+direction.z*2],[position.x+direction.x*2,position.y+1,position.z+direction.z*2],0,48);
   }else if(s.index===5){
    show(iara);show(boi);this.place(iara,-2-ease((local-5)/2)*.15,1,2,2.9);this.place(boi,0,.36,0);
    A.iara(iara,local,{mode:local>5?'gasp':'idle',emotion:local>5?'surprise':'worried',turn:-.2,amount:ease((local-5)/.8)});A.serpent(boi,t,0);A.face(boi,'weak');boi.head.rotation.x=.10*(1-ease(local/12));
    if(local<6)this.shot([-4,3,5],[-2.7,2.6,3],[-2,2.1,2],[-2,2.4,2],local/6,38);
    else if(local<12)this.shot([2,1.6,3],[.6,1.15,1.7],[0,.8,0],[0,.8,0],(local-6)/6,36);
    else this.shot([-3,2,4],[-3.3,2.3,4.5],[-.6,1.2,1],[-.6,1.2,1],(local-12)/5,46);
   }else if(s.index===6){
    show(iara);show(boi);this.place(iara,-2.15,1,2,mix(2.9,Math.PI/2,ease((local-10)/3)));this.place(boi,0,.36,0,ease((local-9)/4)*Math.PI/2);boi.root.scale.set(1,1,1);
    A.iara(iara,local,{mode:'gasp',emotion:local<4?'surprise':'determined',turn:-.25,amount:1-ease((local-10)/3)});A.serpent(boi,t,ease((local-9)/4));A.face(boi,local<4?'surprise':'determined');boi.head.rotation.x=-ease(local/4)*.10;
    portal=ease((local-.6)/2)*(1-ease((local-5)/2));glitch=portal*.18;
    const virus=this.world.virus;virus.visible=local>.8;const escape=ease((local-8)/5);virus.position.set(mix(3,12,escape),1.5+Math.sin(t*2)*.10,-1);virus.scale.setScalar(Math.max(.001,ease((local-.8)/2)));virus.rotation.y=escape*Math.PI/2;
    if(local<8)this.shot([-3.3,2.3,4.5],[4.2,2,2.5],[-.6,1.2,1],[3,1.5,-1],local/8,46);
    else this.shot([virus.position.x-3,2.3,virus.position.z+3],[virus.position.x-3,2.3,virus.position.z+3],[virus.position.x,1.5,-1],[virus.position.x,1.5,-1],0,49);
   }else if(s.index===7){
    const travel=ease(local/20),vx=mix(12,66,ease(local/23)),bx=mix(0,52,travel),ix=mix(-2.15,53.5,travel),z=-Math.sin(travel*Math.PI)*1.0-6*travel;
    show(boi);show(iara);this.place(boi,bx,.36,z,mix(Math.PI/2,Math.PI*.75,ease((local-19)/3)));this.place(iara,ix,1+Math.sin(travel*Math.PI)*.7,mix(2,-7.5,travel),mix(Math.PI/2,-Math.PI/4,ease((local-19)/3)),-.13*Math.sin(travel*Math.PI));
    A.serpent(boi,t,1);A.face(boi,'determined');A.iara(iara,local,{mode:'swim',emotion:'determined',turn:local>19?-.12:0,swimBlend:ease(local/1.2)*(1-ease((local-19)/2)),swimFrom:'idle'});
    const virus=this.world.virus;virus.visible=local<21;virus.position.set(vx,1.5+Math.sin(t*2)*.10,-1-5*ease(local/23)+Math.sin(local*.7)*.5);virus.rotation.y=Math.PI/2;virus.scale.setScalar(1);
    flight=1-ease((local-19)/2);day=ease(local/10);black=ease((local-21)/2);
    if(local<9)this.shot([bx+3,3,z+7],[bx+3,3,z+7],[bx+3,1.2,z],[bx+3,1.2,z],0,53);
    else if(local<18)this.shot([bx-5,3,z+5],[bx-5,3,z+5],[bx+3,1.4,z-.7],[bx+3,1.4,z-.7],0,58);
    else this.shot([54,2.9,1],[53,2.5,-1],[53,1.15,-6],[53,1.15,-6],(local-18)/5,46);
   }else if(s.index===8){
    black=1;this.shot([53,2.5,-1],[53,2.5,-1],[53,1,-6],[53,1,-6],0);this.hope.style.opacity=String(ease((local-1)/2)*(1-ease((local-8)/2)));this.hope.style.setProperty('--story-sheen',`${mix(-60,160,clamp((local-2)/5))}%`);
   }else {
    show(cuca);show(loira);this.place(cuca,98.7,.18,0,Math.PI/2);this.place(loira,101.3,.40,0);
    const wake=ease((local-8)/8),blue=ease((local-12)/6);cuca.head.rotation.set(0,0,.38*(1-wake));loira.head.rotation.x=.42*(1-wake);
    A.face(cuca,blue>0?'controlled':'sleep',blue);A.face(loira,blue>0?'controlled':'sleep',blue);
    this.world.labLight.intensity=5+blue*11;black=Math.max(1-ease(local/2),ease((local-20)/2));glitch=blue*(.13+Math.max(0,Math.sin(local*9))*.3);
    this.shot([100,3,12],[100,2.35,4],[100,1.5,0],[100,2.4,0],local/18,44);
    if(local>18){this.root.querySelector('.story-divider').style.opacity='1';this.split=true;}
   }
   // Film-specific effects are isolated from gameplay materials and light rigs.
   this.world.update(t,{fire,day,shadow,portal,flight,iara:iara.root.position,virus:this.world.virus.visible?this.world.virus.position:null});
   if(s.index===1){this.world.moon.intensity*=1-shadow*.65;this.world.ambient.intensity*=1-shadow*.55;}
   if(lab){this.scene.background.set('#030812');this.scene.fog.color.set('#071727');this.world.moon.intensity=.4;this.world.ambient.intensity=.6;}
   for(const [key,mat]of boi.materials){if(key.includes('scale'))mat.roughness=s.index>=5?.92:.62;}
   this.curtain.style.opacity=String(clamp(black));this.glitch.style.opacity=String(clamp(glitch));this.speed.style.opacity=String(flight*.25);this.speed.style.transform=`translateX(${Math.sin(t*6)*5}px)`;
   this.root.dataset.scene=s.id;this.state={scene:s.id,time:t,local,fire,black,shadow,portal,flight,day,expression:iara.emotion,split:lab&&local>18};
   if(lab&&local>18)this.renderSplit();else {this.renderer.setScissorTest(false);const size=this.renderer.getDrawingBufferSize(new T.Vector2());this.renderer.setViewport(0,0,size.x,size.y);this.renderer.render(this.scene,this.camera);}
  },
  renderSplit(){
   const size=this.renderer.getDrawingBufferSize(new T.Vector2()),half=Math.floor(size.x/2);this.renderer.setScissorTest(true);
   for(let i=0;i<2;i++){const a=this.actors[i?'loira':'cuca'],cam=this.closeCameras[i],head=a.head.getWorldPosition(new T.Vector3());head.y+=i?.06:.22;
    cam.fov=i?28:32;cam.updateProjectionMatrix();cam.position.copy(head).add(v(i?.05:.12,.035,i?1.13:1.95));cam.lookAt(head);cam.updateMatrixWorld();this.renderer.setViewport(i*half,0,i?size.x-half:half,size.y);this.renderer.setScissor(i*half,0,i?size.x-half:half,size.y);this.renderer.render(this.scene,cam);
   }this.renderer.setScissorTest(false);
  },
  cleanup(){
   this.sound?.stop();if(this.actors)for(const a of Object.values(this.actors))B.StoryActors.dispose(a);this.world?.dispose();
   this.renderer?.dispose();this.renderer?.forceContextLoss();this.root?.remove();
   document.removeEventListener('keydown',this.keyHandler,true);document.removeEventListener('visibilitychange',this.visibilityHandler);window.removeEventListener('resize',this.resizeHandler);
   this.renderer=this.scene=this.world=this.actors=this.root=this.sound=this.flightRoute=this.flightPosition=this.flightDirection=null;
  },
  stop(){if(!this.active)return;this.active=false;this.paused=false;this.cleanup();document.body.classList.remove('story-active');B.UI.menu();}
 };
})();
