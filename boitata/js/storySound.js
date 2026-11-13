/* The original procedural score, rendered once on the story timeline.
   One AudioBufferSource follows seek position and playbackRate, including cue tails. */
(() => {
 'use strict';const B=Boitata;
 const cues=[[3,'wind'],[20,'shadow'],[28,'glitch'],[50.3,'cry'],[63,'lift'],[100,'portal'],[109,'flee'],[152,'lab'],[165,'corrupt']];
 B.StorySound=class{
  constructor(settings){
   this.settings={...settings};this.ctx=null;this.source=null;this.buffer=null;this.disposed=false;this.offset=0;this.rate=1;this.playing=false;
   if(!settings.music&&!settings.effects)return;
   try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.42;this.master.connect(this.ctx.destination);this.ctx.onstatechange=()=>{if(this.ctx?.state==='running')this.onResume?.();};this.ctx.resume().catch(()=>{});}catch{}
  }
  async prepare(scenes,duration){
   this.duration=duration;if(!this.ctx)return;
   const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
   if(!Offline)throw Error('Este navegador não oferece o áudio sincronizado da história');
   const sampleRate=22050,offline=new Offline(1,Math.ceil(duration*sampleRate),sampleRate),destination=offline.destination;
   const tone=(at,f,length=1,type='sine',gain=.12,to=f)=>{
    if(at>=duration)return;const end=Math.min(duration,at+length),o=offline.createOscillator(),g=offline.createGain();o.type=type;
    o.frequency.setValueAtTime(f,at);o.frequency.exponentialRampToValueAtTime(Math.max(10,to),at+length);
    g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),Math.min(at+.035,end));g.gain.exponentialRampToValueAtTime(.0001,at+length);
    o.connect(g);g.connect(destination);o.start(at);o.stop(end);
   };
   const sceneAt=t=>(scenes.find(s=>t<s.start+s.duration)||scenes.at(-1)).index;
   if(this.settings.effects){
    const noiseBuffer=offline.createBuffer(1,sampleRate*2,sampleRate),data=noiseBuffer.getChannelData(0);let seed=217;
    for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=seed/2147483648-1;}
    const noise=offline.createBufferSource(),filter=offline.createBiquadFilter(),air=offline.createGain();noise.buffer=noiseBuffer;noise.loop=true;filter.type='lowpass';filter.frequency.value=780;noise.connect(filter);filter.connect(air);air.connect(destination);
    for(let t=0;t<=duration;t+=.125){const scene=sceneAt(t),gain=scene===2?.055+Math.sin(t*1.7)*.02:scene===4||scene===7?.08:scene===8?0:.025;air.gain.linearRampToValueAtTime(gain*1.8,t);}
    noise.start();noise.stop(duration);
    const effectTone=(at,f,length,type,gain,to)=>tone(at,f,length,type,gain*1.8,to);
    for(const [at,id] of cues){
     if(id==='cry'){effectTone(at,530,2.2,'sawtooth',.10,1240);effectTone(at,541,2.6,'sine',.12,190);}
     else if(id==='glitch'||id==='corrupt'){effectTone(at,54,1.6,'sawtooth',.14,32);effectTone(at,930,.7,'triangle',.04,70);}
     else if(id==='lift'||id==='portal')effectTone(at,150,2,'sine',.12,740);
     else effectTone(at,id==='wind'?92:43,3,'sine',.15,35);
    }
   }
   if(this.settings.music){
    // Continuous low suspense bed, rendered into the same seekable timeline as
    // the scene cues so pause, scrubbing and playback rates stay synchronized.
    for(const [frequency,level,type] of [[55,.055,'sine'],[82.41,.027,'triangle'],[110,.018,'sine']]){
     const oscillator=offline.createOscillator(),gain=offline.createGain();oscillator.type=type;oscillator.frequency.value=frequency;
     gain.gain.setValueAtTime(.0001,0);gain.gain.linearRampToValueAtTime(level,.9);
     for(let at=4;at<duration;at+=4){const swell=level*(.42+.58*(.5+.5*Math.sin(at*.47)));gain.gain.linearRampToValueAtTime(swell,at);}
     gain.gain.linearRampToValueAtTime(.0001,duration);oscillator.connect(gain);gain.connect(destination);oscillator.start(0);oscillator.stop(duration);
    }
    for(let beat=0;beat*.8<duration;beat++){
     const at=beat*.8,scene=sceneAt(at),notes=scene===9?[43.65,55,65.41,58.27]:scene===7?[110,146.83,164.81,220]:scene===2?[196,246.94,293.66,246.94]:[55,82.41,73.42,65.41];
     tone(at,notes[beat%4],1.5,'triangle',.075);tone(at,notes[beat%4]*2,1.8,'sine',.025);
    }
   }
   const buffer=await offline.startRendering();if(!this.disposed)this.buffer=buffer;
  }
  sync(time,rate,playing){
   this.halt();this.offset=Math.max(0,Math.min(this.duration||0,time));this.rate=rate;this.playing=!!(playing&&this.offset<this.duration);
   if(!this.ctx||!this.buffer||!this.playing)return;
   this.ctx.resume().catch(()=>{});
   const source=this.ctx.createBufferSource();source.buffer=this.buffer;source.playbackRate.value=rate;source.connect(this.master);
   this.anchor=this.ctx.currentTime;source.start(this.anchor,this.offset);this.source=source;
   source.onended=()=>{if(this.source===source){this.offset=this.duration;this.source=null;this.playing=false;}source.disconnect();};
  }
  get currentTime(){return this.playing&&this.ctx&&this.source?Math.min(this.duration,this.offset+(this.ctx.currentTime-this.anchor)*this.rate):this.offset;}
  halt(){if(this.source){const source=this.source;this.source=null;source.onended=null;try{source.stop();}catch{}source.disconnect();}}
  stop(){this.disposed=true;this.playing=false;this.halt();this.buffer=null;this.onResume=null;if(this.ctx){this.ctx.onstatechange=null;this.ctx.close().catch(()=>{});this.ctx=null;}}
 };
})();
