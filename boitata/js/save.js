window.Boitata = { S: {}, Store: {
 key:'boitata-save-v1',
 defaults(){return {unlocked:1,last:1,best:0,errors:{},completed:[],performance:{},audio:{music:false,effects:false}};},
 load(){let s=this.defaults();try{const old=JSON.parse(localStorage.getItem(this.key));if(old&&typeof old==='object')s={...s,...old};}catch{}s.unlocked=Math.max(1,Math.min(30,Number(s.unlocked)||1));s.last=Math.max(1,Math.min(s.unlocked,Number(s.last)||1));s.best=Math.max(0,Number(s.best)||0);s.errors=s.errors&&typeof s.errors==='object'?s.errors:{};s.completed=Array.isArray(s.completed)?s.completed.filter(n=>Number.isInteger(n)&&n>=1&&n<=30):[];s.performance=s.performance&&typeof s.performance==='object'?s.performance:{};s.audio={music:!!s.audio?.music,effects:!!s.audio?.effects};return s;},
 write(){try{localStorage.setItem(this.key,JSON.stringify(Boitata.S.save));return true;}catch{return false;}},
 errors(id){const n=Number(Boitata.S.save.errors[id]);return Number.isSafeInteger(n)&&n>=0?n:0;},
 total(l){return BigInt(l.baseViruses)*2n**BigInt(this.errors(l.id));},
 wrong(){const s=Boitata.S;s.save.errors[s.level.id]=this.errors(s.level.id)+1;s.total=s.total*2n;this.write();},
 complete(){const s=Boitata.S,id=s.level.id,old=s.save.performance[id];s.save.unlocked=Math.min(30,Math.max(s.save.unlocked,id+1));s.save.best=Math.max(s.save.best,s.score);if(!s.save.completed.includes(id))s.save.completed.push(id);if(!old||s.score>old.score||s.score===old.score&&s.elapsed<old.seconds)s.save.performance[id]={score:s.score,seconds:Math.round(s.elapsed),lives:s.lives,errors:this.errors(id)};s.save.errors[id]=0;return this.write();},
 reset(){Boitata.S.save=this.defaults();this.write();}
}};

