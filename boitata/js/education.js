Boitata.Education={
 choose(theme=Boitata.S.level.name,onCorrect=null){const s=Boitata.S,themed=BOITATA_QUESTIONS.filter(q=>q.theme===theme),all=themed.length?themed:BOITATA_QUESTIONS;s.lastQuestions=s.lastQuestions||{};const last=s.lastQuestions[s.level.id],previous=all.findIndex(q=>q.id===last),q=all[(previous+1)%all.length];s.question=q;s.lastQuestions[s.level.id]=q.id;s.questionAttempt=(s.questionAttempt||0)+1;s.questionAnswered=false;s.selectedAnswer=null;s.questionOnCorrect=onCorrect;return q;},
 answer(value,attempt=Boitata.S.questionAttempt){
  const s=Boitata.S;if(s.phase!=='quiz'||!s.question||s.questionAnswered||attempt!==s.questionAttempt||!Number.isInteger(value)||value<0||value>3)return false;
  // Lock before effects, saving or navigation; old buttons cannot answer a new attempt.
  s.questionAnswered=true;s.selectedAnswer=value;const onCorrect=s.questionOnCorrect;s.questionOnCorrect=null;Boitata.UI.lockQuestion?.(value);
  if(value===0){s.score+=500;Boitata.Audio.effect('correct');if(onCorrect)onCorrect();else Boitata.Game.win();}else{Boitata.Store.wrong();s.phase='wrong';Boitata.Audio.effect('wrong');Boitata.UI.wrong();Boitata.UI.hud();}return true;
 }
};

