document.querySelector('iframe').onload=event=>{
 const w=event.target.contentWindow,B=w.Boitata,s=B.S,bank=w.BOITATA_QUESTIONS,results=[],errors=[],effects=[];
 w.requestAnimationFrame=()=>0;w.addEventListener('error',e=>errors.push(e.message));
 const write=B.Store.write,effect=B.Audio.effect;B.Store.write=()=>true;B.Audio.effect=name=>effects.push(name);
 const check=(test,passed)=>results.push({test,passed:!!passed});
 const reset=()=>{s.save=B.Store.defaults();s.save.unlocked=10;s.lastQuestions={};B.Game.start(3);B.Game.play();};
 const quiz=(theme='Switch')=>{s.phase='quiz';B.Education.choose(theme);B.UI.quiz();return [...B.UI.$('overlay').querySelectorAll('[data-alternative]')];};
 const restore=()=>{B.Game.start(10);B.Game.play();s.snake=s.oldSnake=[{x:21,y:4}];B.NetworkCollapse.update(.016);};
 try{
  check('Banco tem 60 perguntas únicas',bank.length===60&&new Set(bank.map(q=>q.id)).size===60&&new Set(bank.map(q=>q.pergunta)).size===60);
  check('Todas têm quatro alternativas distintas e somente A como correta',bank.every(q=>q.correta===0&&q.alternativas.length===4&&new Set(q.alternativas).size===4&&q.alternativas.every(a=>typeof a==='string'&&a.length>0)));
  check('Enunciados interrogativos sem campos antigos nem explicações',bank.every(q=>q.pergunta.endsWith('?')&&!('answer' in q)&&!('statement' in q)&&!('explanation' in q)));
  check('Ordem das alternativas é fixa e protegida',Object.isFrozen(bank)&&bank.every(q=>Object.isFrozen(q)&&Object.isFrozen(q.alternativas)));
  reset();let themed=true;
  for(const theme of new Set(bank.map(q=>q.theme))){const a=B.Education.choose(theme),b=B.Education.choose(theme);themed&&=a.theme===theme&&b.theme===theme&&a.id!==b.id;}
  check('Trinta temas alternam questões sem repetir a tentativa anterior',themed&&new Set(bank.map(q=>q.theme)).size===30);
  check('Tema não reconhecido utiliza o banco sem quebrar a pergunta',!!B.Education.choose('Tema sem cadastro'));
  let buttons=quiz(),panel=B.UI.$('overlay').querySelector('.quiz-panel');
  check('Painel apresenta enunciado e A/B/C/D na ordem correta',buttons.length===4&&buttons.every((b,i)=>b.dataset.alternative===String(i)&&b.querySelector('.quiz-letter').textContent==='ABCD'[i])&&panel.querySelector('.quiz-question').textContent===s.question.pergunta);
  check('Alternativas acessíveis sem botões de verdadeiro ou falso',panel.getAttribute('role')==='dialog'&&buttons.every(b=>b.getAttribute('aria-label').startsWith('Alternativa '))&&!/Verdadeiro|Falso/.test(panel.textContent));
  const question=s.question,attempt=s.questionAttempt,lives=s.lives,total=s.total;const stale=buttons[0].onclick;
  buttons[1].click();B.Education.answer(2);buttons[3].click();
  check('B registra a escolha e executa erro uma única vez',s.selectedAnswer===1&&s.questionAnswered&&s.phase==='wrong'&&s.total===total*2n&&B.Store.errors(3)===1&&s.lives===lives);
  check('Todos os botões são bloqueados antes da transição',buttons.every(b=>b.disabled)&&panel.getAttribute('aria-busy')==='true');
  check('Erro não exibe o enunciado nem uma explicação',!B.UI.$('overlay').textContent.includes(question.pergunta)&&!B.UI.$('overlay').textContent.includes('undefined'));
  B.UI.$('overlay').querySelector('button').click();check('Botão de reinício mantém o mecanismo original',s.phase==='playing'&&s.total===total*2n&&s.lives===3);
  buttons=quiz();const before=s.score;stale();check('Botão antigo não responde à nova tentativa',s.phase==='quiz'&&!s.questionAnswered&&s.score===before&&s.questionAttempt!==attempt);
  const untouched=s.total;for(const invalid of [true,false,-1,4,'A',null])B.Education.answer(invalid);check('Valores inválidos não acionam acerto ou erro',s.phase==='quiz'&&!s.questionAnswered&&s.total===untouched);
  let allCorrect=true,allWrong=true,noExplanations=true;
  for(const q of bank)for(let index=0;index<4;index++){
   s.save=B.Store.defaults();s.save.unlocked=3;s.phase='quiz';s.question=q;s.questionAttempt++;s.questionAnswered=false;s.selectedAnswer=null;s.score=0;s.total=2n;s.lives=2;effects.length=0;
   B.Education.answer(index);const after={score:s.score,total:s.total,errors:B.Store.errors(3)};B.Education.answer(index);
   if(index===0)allCorrect&&=s.phase==='won'&&s.score===500&&s.save.unlocked===4&&s.save.completed.includes(3)&&B.Store.errors(3)===0&&s.lives===2&&effects.filter(e=>e==='correct').length===1;
   else allWrong&&=s.phase==='wrong'&&s.total===4n&&B.Store.errors(3)===1&&s.score===0&&s.save.unlocked===3&&!s.save.completed.includes(3)&&s.lives===2&&effects.filter(e=>e==='wrong').length===1;
   allCorrect&&=s.score===after.score&&s.total===after.total&&B.Store.errors(3)===after.errors;
   noExplanations&&=!B.UI.$('overlay').textContent.includes(q.pergunta)&&!B.UI.$('overlay').textContent.includes('undefined');
  }
  check('A acerta nas 60 questões: +500 pontos e progressão original',allCorrect);
  check('B/C/D erram nas 180 combinações sem alterar vidas ou progressão',allWrong);
  check('Nenhuma das 240 respostas exibe explicação educativa',noExplanations);
  s.save=B.Store.defaults();s.save.unlocked=10;
  for(const character of ['boitata','iara'])for(let id=1;id<=3;id++){
   s.save.character=character;B.Game.start(id);B.Game.play();const beforeAttempt=s.questionAttempt;Object.assign(s.fugitive,s.snake[0]);B.CaptureSystem.check();B.CaptureSystem.update(1);
   check(character+': fase '+id+' continua terminando na captura, sem nova pergunta',s.phase==='won'&&s.questionAttempt===beforeAttempt);
  }
  for(const character of ['boitata','iara']){
   s.save.character=character;s.save.completed=s.save.completed.filter(id=>id!==4);s.save.unlocked=4;B.Game.start(4);B.Game.play();Object.assign(s.fugitive,s.snake[0]);B.CaptureSystem.check();B.CaptureSystem.update(1);
   check(character+': setor 4 abre a pergunta de switch antes de desbloquear o próximo',s.phase==='quiz'&&s.question.theme==='Switch'&&!s.save.completed.includes(4)&&s.save.unlocked===4);
   B.Education.answer(0);check(character+': A conclui o setor 4 e libera o setor 5',s.phase==='won'&&s.save.completed.includes(4)&&s.save.unlocked===5);
   s.save.completed=s.save.completed.filter(id=>id!==5);B.Game.start(5);B.Game.play();B.PvP.finish(0);
   check(character+': vencer o duelo abre a pergunta de roteador sem salvar conclusão antes da resposta',s.phase==='quiz'&&s.pvp.winner===0&&s.question.theme==='Roteador'&&!s.save.completed.includes(5)&&s.save.unlocked===5);
   B.Education.answer(0);check(character+': A preserva a tela de vitória do duelo e libera o setor seguinte',s.phase==='pvp-won'&&s.save.completed.includes(5)&&s.save.unlocked===8&&B.UI.$('overlay').textContent.includes('VOCÊ SE LIVROU'));
  }
  s.save.completed=s.save.completed.filter(id=>id!==5);s.save.unlocked=5;B.Game.start(5);B.Game.play();const beforeAttempt=s.questionAttempt;B.PvP.finish(1);
  check('Derrota no duelo não abre pergunta nem libera progresso',s.phase==='pvp-won'&&s.pvp.winner===1&&s.questionAttempt===beforeAttempt&&!s.save.completed.includes(5));
  B.Game.retry();B.PvP.finish(null);check('Empate no duelo não abre pergunta',s.phase==='pvp-won'&&s.pvp.winner===null&&s.questionAttempt===beforeAttempt);
  B.Game.retry();B.PvP.finish(0);const duelQuestion=s.question.id,duelLives=s.lives,duelTotal=s.total;B.Education.answer(2);
  check('Erro após o duelo mantém a consequência da pergunta e bloqueia a progressão',s.phase==='wrong'&&s.total===duelTotal*2n&&s.lives===duelLives&&s.save.unlocked===5&&!s.save.completed.includes(5)&&s.questionOnCorrect===null);
  B.UI.$('overlay').querySelector('button').click();check('Repetir após erro reinicia o duelo',s.phase==='pvp-playing'&&s.pvp.winner===null&&s.pvp.score.every(n=>n===0));B.PvP.finish(0);
  check('Nova vitória no duelo alterna a pergunta',s.phase==='quiz'&&s.question.id!==duelQuestion);B.Education.answer(0);
  for(const character of ['boitata','iara'])for(const id of [8,9]){
   s.save.character=character;B.Game.start(id);B.Game.play();const target=id===8?B.GardenMaze.target:B.CucaArena.folder;s.snake=s.oldSnake=[{x:target.x,y:target.y}];s.acc=s.level.stepMs;B.CaptureSystem.check(true);B.CaptureSystem.update(.4);
   check(character+': objetivo '+id+' mantém a animação de captura antes da pergunta',s.phase==='capturing');B.CaptureSystem.update(.6);
   check(character+': objetivo '+id+' abre a questão do tema original',s.phase==='quiz'&&s.question.theme===(id===8?'Máscara de sub-rede':'Gateway padrão')&&B.UI.$('overlay').querySelectorAll('[data-alternative]').length===4);
   B.Education.answer(0);check(character+': A conclui o objetivo '+id+' pela vitória original',s.phase==='won'&&s.save.completed.includes(id));
  }
  s.save=B.Store.defaults();s.save.unlocked=10;s.save.character='boitata';restore();
  check('Fase final ainda exige ativar o núcleo antes da pergunta',s.phase==='restoring'&&s.collapse.charged);
  B.NetworkCollapse.update(3.79);check('Pergunta não aparece antes do fim da restauração',s.phase==='restoring');B.NetworkCollapse.update(.02);
  check('Restauração concluída abre quatro alternativas com o tema existente',s.phase==='quiz'&&s.question.theme==='DNS'&&B.UI.$('overlay').querySelectorAll('[data-alternative]').length===4);
  check('Mensagens específicas da fase final são preservadas',B.UI.$('overlay').textContent.includes('REDE RESTAURADA COM SUCESSO!'));
  const finalId=s.question.id,finalTotal=s.total,finalLives=s.lives;B.UI.$('overlay').querySelector('[data-alternative="3"]').click();
  check('D na fase final mantém erro, repetição e vidas originais',s.phase==='wrong'&&s.total===finalTotal*2n&&s.lives===finalLives&&!s.save.completed.includes(10));
  check('Revisão final não exibe explicação após o erro',B.UI.$('overlay').querySelectorAll('.panel p').length===0);
  B.UI.$('overlay').querySelector('button').click();check('Repetição final reinicia a restauração e mantém o erro registrado',s.phase==='playing'&&!s.collapse.charged&&s.total===finalTotal*2n&&B.Store.errors(10)===1);
  s.snake=s.oldSnake=[{x:21,y:4}];B.NetworkCollapse.update(.016);B.NetworkCollapse.update(4);check('Nova tentativa final alterna a questão',s.phase==='quiz'&&s.question.id!==finalId);
  const finalScore=s.score;B.UI.$('overlay').querySelector('[data-alternative="0"]').click();
  check('A conclui a campanha pelo fluxo original',s.phase==='won'&&s.score===finalScore+500&&s.save.completed.includes(10)&&B.Store.errors(10)===0&&s.save.unlocked===10);
  check('Lições e controles da História continuam disponíveis',typeof B.UI.lesson==='function'&&typeof B.Story.seekTo==='function'&&typeof B.StoryRenderer2D==='function');
  check('Nenhum erro de JavaScript',errors.length===0);
 }catch(error){check(error.stack,false);}
 finally{B.Store.write=write;B.Audio.effect=effect;}
 document.body.dataset.tests=JSON.stringify({total:results.length,failed:results.filter(r=>!r.passed)});document.body.dataset.complete='true';document.querySelector('#results').textContent=JSON.stringify(results,null,2);
};
