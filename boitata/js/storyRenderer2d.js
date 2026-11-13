/* Whole-cel anime renderer: each character is a complete painted drawing.
   Canvas primitives below are restricted to lighting, water, particles and speed/glitch effects. */
(() => {
 'use strict';const B=Boitata,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,u)=>a+(b-a)*u;
 B.StoryRenderer2D=class{
  constructor(canvas,assets){
   this.domElement=canvas;this.ctx=canvas.getContext('2d',{alpha:false});if(!this.ctx)throw Error('Canvas 2D indisponível');
   this.assets=assets;this.parts=new Map();this.info={frames:0,sprites:0,warpedBands:0};this.disposed=false;
   this.camera={x:800,y:450,zoom:1};this.pose={};
   for(let i=0;i<12;i++)this.sprite('iara-swim','frame'+i);
   for(const [character,count] of [['iara-comb',12],['iara-act',16],['boitata-whole',12],['captives-whole',8]])for(let i=0;i<count;i++)this.sprite(character,'frame'+i);
  }
  resize(width,height){const ratio=Math.min(window.devicePixelRatio||1,1.5,1920/width,1080/height);this.domElement.width=Math.max(1,Math.round(width*ratio));this.domElement.height=Math.max(1,Math.round(height*ratio));}
  sprite(character,part){const key=character+'/'+part;if(!this.parts.has(key))this.parts.set(key,this.assets.sprite(character,part));return this.parts.get(key);}
  part(character,part,x,y,height,{width,ax=.5,ay=0,angle=0,alpha=1,flip=1}={}){
   if(alpha<=0)return;const p=this.sprite(character,part),w=width||height*p.w/p.h,c=this.ctx;c.save();c.translate(x,y);c.rotate(angle);c.scale(flip,1);c.globalAlpha*=clamp(alpha);c.drawImage(p.image,p.x,p.y,p.w,p.h,-ax*w,-ay*height,w,height);c.restore();this.info.sprites++;
  }
  // Independent textured bands bend the painted silhouette without inventing geometric characters.
  warp(character,part,x,y,height,{width,amp=0,phase=0,bend=0,axis='y',alpha=1,ax=.5,ay=0,bands=24}={}){
   if(alpha<=0)return;const p=this.sprite(character,part),w=width||height*p.w/p.h,c=this.ctx;c.save();c.globalAlpha*=alpha;
   for(let i=0;i<bands;i++){
    const u=i/bands,v=(i+1)/bands;
    if(axis==='y'){
     const dx=Math.sin(phase+u*3.5)*amp*u+bend*u*u,next=Math.sin(phase+v*3.5)*amp*v+bend*v*v,sh=p.h/bands,dh=height/bands;
     c.save();c.transform(1,0,(next-dx)/dh,1,x-ax*w+dx,y-ay*height+u*height);c.drawImage(p.image,p.x,p.y+u*p.h,p.w,Math.min(sh+1,p.h-u*p.h),0,0,w,dh+1);c.restore();
    }else{
     const dy=Math.sin(phase+u*7)*amp*(1-u),next=Math.sin(phase+v*7)*amp*(1-v),sw=p.w/bands,dw=w/bands;
     c.save();c.transform(1,(next-dy)/dw,0,1,x-ax*w+u*w,y-ay*height+dy);c.drawImage(p.image,p.x+u*p.w,p.y,Math.min(sw+1,p.w-u*p.w),p.h,0,0,dw+1,height);c.restore();
    }
   }c.restore();this.info.sprites++;this.info.warpedBands+=bands;
  }
  whole(character,frame,x,y,unit,{amp=0,phase=0}={}){
   const p=this.sprite(character,'frame'+frame);
   this.warp(character,'frame'+frame,x,y,p.h*unit,{ax:p.regX/p.w,ay:p.regY/p.h,amp,phase,bands:32});
  }
  portrait(character,frame,x,y,width,height,unit,flip=1){
   const c=this.ctx;c.save();c.translate(x,y);c.beginPath();c.rect(-width/2,0,width,height);c.clip();c.scale(flip,1);this.whole(character,frame,0,80,unit);c.restore();
  }
  iara(x,y,scale,t,{mode='idle',expression='calm',facing=1,tilt=0,lift=1,swim=1,release=-1,actionTime=t}={}){
   const c=this.ctx;c.save();c.translate(x,y);c.rotate(tilt);c.scale(scale*facing,scale);
   const phase=t*(mode==='swim'?mix(1.2,4.6,swim):1.2);
   if(mode==='swim'){
    const frame=Math.floor(t*12)%12;
    // The approved flight artwork, cadence, scale and registration are intact.
    this.part('iara-swim','frame'+frame,0,-200,620,{ax:.74,ay:.18});
    c.restore();this.pose.iara={x,y,mode,expression,arms:[],tailPhase:phase,facing,animationFrame:frame,drawnCycle:true,wholeBody:true,bodyDraws:1,atlas:'iara-swim'};return;
   }
   let atlas='iara-act',frame=4;
   if(mode==='comb'){atlas='iara-comb';frame=Math.floor(actionTime*6)%12;}
   if(mode==='freeze')frame=Math.min(3,Math.floor(ease((actionTime-18.3)/.18)*3.999));
   if(mode==='lift')frame=8+Math.min(3,Math.floor(lift*3.999));
   if(mode==='gasp')frame=expression==='determined'?8:4+Math.min(3,Math.floor(lift*3.999));
   if(mode==='arrive')frame=13+Math.min(2,Math.floor((1-swim)*2.999));
   c.translate(0,Math.sin(t*1.2)*1.5);c.rotate(Math.sin(t*.8)*.004);
   // ONE complete painted character, never separately drawn anatomical pieces.
   this.whole(atlas,frame,0,-215,560/362,{amp:1.6,phase:t*1.2});
   if(release>=0&&release<2.5)this.part('iara','comb',75,-255+ease(release/2)*310,32,{angle:release*2,alpha:1-ease((release-1.7)/.7)});
   c.restore();this.pose.iara={x,y,mode,expression,arms:[],tailPhase:phase,facing,animationFrame:frame,drawnCycle:true,wholeBody:true,bodyDraws:1,atlas};
  }
  boitata(x,y,scale,t,{expression='sleep',coil=true,fire=0,uncoil=coil?0:1}={}){
   const c=this.ctx;c.save();c.translate(x,y);c.scale(scale,scale);
   let frame=expression==='sleep'?[0,1,2,3,2,1][Math.floor(t*2)%6]:expression==='weak'?4:expression==='surprise'?6:7;
   if(!coil)frame=8+Math.floor(t*8)%4;
   this.whole('boitata-whole',frame,80,-210,coil?1.24:1.55,{amp:coil?.8:2.2,phase:t*(coil?1.2:3)});
   if(fire>0){c.save();c.globalCompositeOperation='lighter';for(let i=0;i<9;i++){const f=Math.floor(t*12+i*.6)%4;this.part('boitata','flame'+f,-150+i*42,-45-Math.sin(t*2+i)*12,85+(i%3)*24,{angle:Math.sin(t*3+i)*.13,alpha:fire*.7});}c.restore();}
   c.restore();this.pose.boitata={x,y,expression,coil,fire,uncoil,spinePhase:t*3,head:{x:x+80*scale,y:y-210*scale},wholeBody:true,bodyDraws:1,animationFrame:frame,atlas:'boitata-whole'};
  }
  virus(x,y,t,{mode='idle',materialize=1,portal=0}={}){
   const c=this.ctx;if(portal>0){c.save();c.globalCompositeOperation='lighter';this.part('virus',Math.floor(t*5)%2?'portal0':'portal1',x,y,240*portal,{ay:.5,alpha:portal*.85,angle:Math.sin(t*.7)*.05});c.restore();}
   // Keep the same registered silhouette throughout each action. A smear is
   // a trailing effect, not a differently proportioned replacement body.
   const part=mode==='flight'?'flight':'idle',bob=Math.sin(t*3)*8,angle=Math.sin(t*1.6)*.035;
   if(mode==='flight')this.part('virus','smear',x-24,y+bob,112*materialize,{ay:.5,alpha:materialize*.14,angle});
   this.part('virus',part,x,y+bob,125*materialize*(1+Math.sin(t*3)*.018),{ay:.5,alpha:materialize,angle});
   this.part('virus','chips',x,y,180,{ay:.5,alpha:.25*materialize,angle:t*.3});this.pose.virus={x,y,mode,part,materialize};
  }
  captive(character,x,y,scale,t,wake,blue,{close=false}={}){
   const c=this.ctx,index=blue>.45?3:Math.min(2,Math.floor(wake*2.999)),frame=(character==='loira'?4:0)+index;
   c.save();c.translate(x,y);c.scale(scale,scale);
   if(close){
    // A camera crop of the SAME full-body cel, rather than a detached head.
    this.whole('captives-whole',frame,0,-70,2.7,{amp:.8,phase:t});
   }else{
    const p=this.sprite('captives-whole','frame'+frame),height=570;
    this.warp('captives-whole','frame'+frame,0,-287+Math.sin(t*1.1)*1.4,height,{ax:.5,ay:0,amp:1.2,phase:t*1.1,bands:32});
   }
   c.restore();this.pose[character]={x,y,wake,blue,close,wholeBody:true,bodyDraws:1,animationFrame:frame,atlas:'captives-whole'};
  }
  background(name,camera,{alpha=1,tiled=false,drift=0}={}){
   if(alpha<=0)return;const c=this.ctx,img=this.assets.image(name),first=tiled?Math.floor(camera.x/1600)-1:0,last=tiled?first+2:0;
   c.save();c.globalAlpha*=alpha;c.translate(800,450);c.scale(camera.zoom,camera.zoom);c.translate(-camera.x,-camera.y);
   for(let i=first;i<=last;i++)this.cover(img,i*1600-160-drift,-90,1920,1080);c.restore();
  }
  cover(image,x,y,w,h){const ratio=Math.max(w/image.naturalWidth,h/image.naturalHeight),sw=w/ratio,sh=h/ratio;this.ctx.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,x,y,w,h);}
  foliage(t,{day=false,travel=0,strength=1}={}){
   const c=this.ctx,prefix=day?'day':'night';c.save();c.globalAlpha=strength;
   const shift=travel%700;
   this.part('foliage',prefix+'L',-80-shift*.18,160,650,{ax:0,alpha:.5});
   this.part('foliage',prefix+'R',1680-shift*.18,200,650,{ax:1,alpha:.5});
   for(let i=0;i<4;i++)this.part('foliage',prefix+'Bottom',-160+i*660-shift,925,155,{ax:0,ay:1,angle:Math.sin(t*.4+i)*.012});
   this.part('foliage',prefix+'Top',800-shift*.1,-35,165,{ax:.5,ay:0,alpha:.65});c.restore();
  }
  world(camera,draw){const c=this.ctx;c.save();c.translate(800,450);c.scale(camera.zoom,camera.zoom);c.translate(-camera.x,-camera.y);draw();c.restore();}
  fx(t,{fire=0,water=0,speed=0,glitch=0,impact=0,light=0}={}){
   const c=this.ctx;c.save();
   if(water){c.strokeStyle='rgba(166,240,234,.2)';c.lineWidth=1.5;for(let i=0;i<5;i++){const r=(t*15+i*41)%180+40;c.beginPath();c.ellipse(590,735,r,r*.13,0,0,Math.PI*2);c.stroke();}}
   c.globalCompositeOperation='lighter';for(let i=0;i<35;i++){const x=(i*137.17+t*(speed?100:3))%1650,y=(i*89.37+Math.sin(t+i)*8)%900,r=1.2+(i%3)*.6;c.fillStyle=light?'#e7f4b28c':'#a4ecc063';c.fillRect(x,y,r,r);}
   if(speed){c.strokeStyle='rgba(216,255,241,.17)';c.lineWidth=1;for(let i=0;i<22;i++){const y=(i*61.2+t*31)%900,x=(i*133.1+t*970)%1900-150;c.beginPath();c.moveTo(x,y);c.lineTo(x-120-speed*100,y+7);c.stroke();}}
   c.globalCompositeOperation='source-over';if(fire){const gradient=c.createRadialGradient(570,590,20,570,590,450);gradient.addColorStop(0,'rgba(255,159,50,'+(fire*.17)+')');gradient.addColorStop(1,'transparent');c.fillStyle=gradient;c.fillRect(0,0,1600,900);}
   if(glitch){for(let i=0;i<5;i++){const y=(i*197+Math.floor(t*9)*83)%900;c.fillStyle=i%2?'rgba(40,229,218,'+glitch*.2+')':'rgba(13,39,57,'+glitch*.35+')';c.fillRect(0,y,1600,2+i*2);}}
   if(impact){c.fillStyle='rgba(247,255,240,'+impact*.7+')';c.fillRect(0,0,1600,900);}c.restore();
  }
  render(time,scenes){
   const t=clamp(time,0,168),s=scenes.find(q=>t<q.start+q.duration)||scenes.at(-1),local=t-s.start,u=clamp(local/s.duration),c=this.ctx,canvas=this.domElement;
   this.info.frames++;this.info.sprites=this.info.warpedBands=0;this.pose={};
   c.setTransform(1,0,0,1,0,0);c.fillStyle='#000';c.fillRect(0,0,canvas.width,canvas.height);const ratio=Math.min(canvas.width/1600,canvas.height/900);this.viewport={scale:ratio,x:(canvas.width-1600*ratio)/2,y:(canvas.height-900*ratio)/2,width:1600,height:900};c.setTransform(ratio,0,0,ratio,this.viewport.x,this.viewport.y);c.save();c.beginPath();c.rect(0,0,1600,900);c.clip();
   let black=0,fire=0,glitch=0,flight=0,day=0,shadow=0,portal=0,title=0,impact=0,water=0;
   let cam={x:800,y:450,zoom:1},bg='temple';
   if(s.index===0){
    fire=1;black=1-ease(local/2);cam={x:mix(800,720,ease(u)),y:mix(450,500,ease(u)),zoom:mix(1,1.22,ease(u))};
    this.background('forest-night',cam);if(local>6)this.background('temple',cam,{alpha:ease((local-6)/3)});
    if(local>6)this.world(cam,()=>this.boitata(580,660,.95,t,{fire,expression:'sleep'}));this.foliage(t,{strength:1-ease((local-6)/4)*.75});
   }else if(s.index===1){
    shadow=ease(local/8);fire=(1-ease(local/10))*(.8+Math.sin(local*8)*.2);glitch=ease((local-6)/5)*.55;black=ease((local-11)/2);
    cam={x:mix(800,695,ease((local-5)/6)),y:mix(470,540,ease((local-5)/6)),zoom:mix(1.15,1.95,ease((local-5)/6))};
    this.background(bg,cam);this.world(cam,()=>{this.warp('virus','shadow',mix(1120,900,shadow),mix(580,300,shadow),mix(120,610,shadow),{amp:18,phase:t,bend:12,alpha:shadow*.9,ay:.2});this.boitata(580,660,.95,t,{fire,expression:local>6?'weak':'sleep',faceFrom:'sleep',faceMix:ease((local-6)/.5),turn:.05*ease((local-5)/3)});});
    c.fillStyle='rgba(0,9,20,'+shadow*.48+')';c.fillRect(0,0,1600,900);
   }else if(s.index===2||s.index===3){
    bg='lagoon';water=1;cam=s.index===2?{x:mix(800,650,ease(u)),y:mix(450,460,ease(u)),zoom:mix(1,1.18,ease(u))}:local<7?{x:mix(650,610,ease(local/3)),y:mix(460,345,ease(local/3)),zoom:mix(1.18,2.3,ease(local/3))}:{x:mix(610,1060,ease((local-7)/3)),y:mix(345,300,ease((local-7)/3)),zoom:mix(2.3,1.25,ease((local-7)/3))};
    this.background(bg,cam);black=s.index===2?1-ease(local/2):0;impact=s.index===3?Math.max(0,1-Math.abs(local-.35)/.07):0;
    this.world(cam,()=>this.iara(600,550,.85,s.index===3?18+local:local,{actionTime:s.index===3?18+Math.min(local,.3)+.18*ease((local-.3)/.36):local,mode:s.index===3&&local>.3?'freeze':'comb',expression:s.index===3&&local>.3?'fear':'calm',faceFrom:'calm',faceMix:s.index===3?ease((local-.3)/.18):1,headTurn:s.index===3?ease((local-.3)/.5)*-.08:0}));this.foliage(t,{strength:.35});
   }else if(s.index===4){
    const travel=ease((local-4)/18),x=600+400*travel,y=550-Math.sin(travel*Math.PI)*165;flight=ease((local-2)/4);
    cam={x:mix(650,1000,travel),y:mix(460,440,travel),zoom:local<4?1.15:1.13};
    this.background('lagoon',cam);if(local>3)this.background('forest-path',cam,{alpha:ease((local-3)/2),drift:travel*110});if(local>19)this.background('temple',cam,{alpha:ease((local-19)/3)});
    this.world(cam,()=>this.iara(x,y,.85,local,{mode:local<4?'lift':'swim',expression:'determined',lift:ease(local/3),swim:ease((local-4)/1.2),tilt:-Math.sin(travel*Math.PI)*.23,release:local<2.4?local:-1}));this.foliage(t,{travel:travel*1700,strength:.7});
   }else if(s.index===5){
    cam=local<6?{x:1000,y:mix(460,355,ease(local/6)),zoom:mix(1.15,2.1,ease(local/6))}:local<12?{x:mix(1000,690,ease((local-6)/6)),y:mix(355,560,ease((local-6)/6)),zoom:mix(2.1,1.85,ease((local-6)/6))}:{x:850,y:490,zoom:1.1};
    this.background(bg,cam);c.fillStyle='rgba(0,8,18,.32)';c.fillRect(0,0,1600,900);
    this.world(cam,()=>{this.boitata(580,660,.95,t,{expression:'weak'});this.iara(1000+14*Math.sin(Math.PI*ease(local/3))-ease((local-5)/2)*14,550-10*Math.sin(Math.PI*ease(local/3)),.85,t,{mode:local<3?'arrive':local>5?'gasp':'idle',swim:1-ease(local/3),expression:local>5?'fear':'worried',faceFrom:'worried',faceMix:ease((local-5)/.25),lift:ease((local-5)/.8),facing:-1});});
   }else if(s.index===6){
    const escape=ease((local-8)/5),vx=1150+escape*450;portal=ease((local-.6)/2)*(1-ease((local-5)/2));glitch=portal*.45;
    cam={x:mix(850,1100,ease(local/12)),y:460,zoom:1.1};this.background(bg,cam);
    this.world(cam,()=>{this.boitata(580,660,.95,t,{expression:local<4?'surprise':'determined',faceFrom:'surprise',faceMix:ease((local-4)/.4),turn:-.07*Math.sin(Math.PI*ease((local-.6)/1.4))});this.iara(986,550,.85,t,{mode:'gasp',expression:local<4?'fear':'determined',faceFrom:'fear',faceMix:ease((local-4)/.4),headTurn:-.06*Math.sin(Math.PI*ease((local-.6)/1.2)),lift:1-ease((local-10)/3)});if(local>.6)this.virus(vx,440,t,{mode:local>8?'flight':'idle',portal,materialize:ease((local-.6)/2)});});
   }else if(s.index===7){
    const travel=ease(local/20),bx=580+1600*travel,ix=986+1394*travel,vx=1600+2400*ease(local/23);day=ease(local/8);flight=ease(local/1.2)*(1-ease((local-19)/2));black=ease((local-21)/2);
    cam={x:mix(bx+470,2300,ease((local-18)/4)),y:460,zoom:local>19?mix(1,1.25,ease((local-19)/3)):1};
    this.background('forest-path',cam,{tiled:true});this.background('forest-day',cam,{tiled:true,alpha:day});
    this.world(cam,()=>{this.boitata(bx,mix(660,690,ease(local/3)),mix(.95,.85,ease(local/3)),t,{coil:false,uncoil:ease(local/1.5),expression:'determined'});this.iara(ix,mix(550,510,ease(local/4)),mix(.85,.78,ease(local/3)),t,{mode:'swim',expression:'determined',swim:flight,tilt:-.15*flight,facing:1,headTurn:-.12*ease((local-19)/2)});if(local<21)this.virus(vx,mix(440,400,ease(local/4)),t,{mode:'flight'});});
    this.foliage(t,{day:day>.5,travel:travel*3300,strength:.8});
    if(local>19&&local<21){const a=ease((local-19)/.5)*(1-ease((local-20.5)/.5));c.save();c.globalAlpha=a*.95;c.fillStyle='#091b22';c.fillRect(0,210,1600,230);this.portrait('boitata-whole',7,390,210,400,230,2);this.portrait('iara-act',8,1180,210,360,230,3,-1);c.restore();}
   }else if(s.index===8){black=1;title=ease((local-1)/2)*(1-ease((local-8)/2));}
   else{
    const wake=ease((local-8)/8),blue=ease((local-12)/6);cam={x:800,y:mix(450,430,ease(local/18)),zoom:mix(1,1.25,ease(local/18))};this.background('laboratory',cam);
    this.world(cam,()=>{this.captive('cuca',545,530,.88,t,wake,blue);this.captive('loira',1040,530,.86,t,wake,blue);});
    if(local>18){c.save();c.fillStyle='#040b13';c.fillRect(0,0,1600,900);for(let i=0;i<2;i++){c.save();c.beginPath();c.rect(i*800,0,800,900);c.clip();this.captive(i?'loira':'cuca',400+i*800,450,1.45,t,wake,blue,{close:true});c.restore();}c.fillStyle='#050b12';c.fillRect(799,0,2,900);c.restore();}
    black=Math.max(1-ease(local/2),ease((local-20)/2));glitch=blue*.55;
   }
   this.fx(t,{fire,water,speed:flight,glitch,impact,light:day});c.restore();
   this.camera=cam;this.state={scene:s.id,index:s.index,time:t,local,black,fire,shadow,portal,flight,day,title,glitch,impact,poses:this.pose,artDraws:this.info.sprites};return this.state;
  }
  dispose(){this.parts.clear();this.domElement.width=this.domElement.height=1;this.ctx=null;this.disposed=true;}
 };
})();
