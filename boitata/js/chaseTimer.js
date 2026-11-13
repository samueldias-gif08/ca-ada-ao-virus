Boitata.ChaseTimer={
 config:{initial:45,standard:35,advanced:25,expert:20},
 limit(){const l=Boitata.S.level,c=this.config;return Number.isFinite(l.chaseSeconds)&&l.chaseSeconds>0?l.chaseSeconds:l.id<=5?c.initial:l.id<=15?c.standard:l.id<=25?c.advanced:c.expert;},
 reset(){Boitata.S.chaseTimer={remaining:this.limit(),warned:false,retry:0};},
 update(dt){const B=Boitata,s=B.S,c=s.chaseTimer,p=s.predator;if(!c||!p||!['AGUARDANDO','DESAPARECENDO'].includes(p.state))return;
  c.remaining=Math.max(0,c.remaining-dt);c.retry=Math.max(0,c.retry-dt);
  if(c.remaining<=5&&!c.warned){c.warned=true;B.Audio.effect('warning');}
  if(c.remaining===0&&p.state==='AGUARDANDO'&&c.retry===0){B.PredatorVirus.spawn();c.retry=.5;}
 }
};
