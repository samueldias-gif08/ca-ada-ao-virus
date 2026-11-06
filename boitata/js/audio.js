Boitata.Audio={
 ctx:null,timer:null,beat:0,
 init(){try{this.ctx=this.ctx||new(window.AudioContext||window.webkitAudioContext)();this.ctx.resume();this.sync();}catch{}},
 tone(freq,duration=.1,type='square',volume=.025,delay=0){const a=this.ctx;if(!a||a.state!=='running')return;const o=a.createOscillator(),g=a.createGain(),start=a.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,start);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g);g.connect(a.destination);o.start(start);o.stop(start+duration);},
 effect(name){if(!Boitata.S.save.audio.effects)return;const seq={move:[95],collect:[660,990],damage:[180,100],correct:[520,660,880],wrong:[260,190,120],unlock:[440,660,880,1100],victory:[392,494,587,784,988],defeat:[330,220,110],boss:[70,95]}[name]||[];seq.forEach((f,i)=>this.tone(f,name==='move'?.025:.13,'square',name==='move'?.004:.025,i*.09));},
 sync(){if(this.timer){clearInterval(this.timer);this.timer=null;}if(Boitata.S.save.audio.music&&this.ctx)this.timer=setInterval(()=>{if(Boitata.S.phase!=='playing')return;const notes=[110,165,220,165,130.81,196,261.63,196];this.tone(notes[this.beat%8],.23,'triangle',.035);if(this.beat%2===0)this.tone(notes[this.beat%8]*4,.12,'sine',.012);this.beat++;},250);},
 toggle(kind){Boitata.S.save.audio[kind]=!Boitata.S.save.audio[kind];this.init();Boitata.Store.write();Boitata.UI.audioLabels();}
};

