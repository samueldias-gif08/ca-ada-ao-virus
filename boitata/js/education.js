Boitata.Education={
 choose(){const s=Boitata.S,all=BOITATA_QUESTIONS.filter(q=>q.theme===s.level.name),last=s.lastQuestions[s.level.id],previous=all.findIndex(q=>q.id===last);const q=all[(previous+1)%all.length];s.question=q;s.lastQuestions[s.level.id]=q.id;return q;},
 answer(value){const s=Boitata.S;if(s.phase!=='quiz')return;if(value===s.question.answer){s.score+=500;Boitata.Audio.effect('correct');Boitata.Game.win(s.question.explanation);}else{Boitata.Store.wrong();s.phase='wrong';Boitata.Audio.effect('wrong');Boitata.UI.wrong();Boitata.UI.hud();}}
};

