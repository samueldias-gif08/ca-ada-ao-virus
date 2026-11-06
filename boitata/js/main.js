(() => {
'use strict';
const B=Boitata,s=B.S;
Object.assign(s,{save:B.Store.load(),phase:'menu',level:null,snake:[],oldSnake:[],dir:{x:1,y:0},pending:[],camera:0,oldCamera:0,collected:0,lives:3,score:0,invuln:0,clock:0,acc:0,lastTime:0,elapsed:0,steps:0,generated:0,total:0n,issued:0n,retired:0n,obstacles:new Set(),items:[],enemies:[],hazards:[],particles:[],lastQuestions:{}});
B.UI.ctx=B.UI.$('game').getContext('2d');B.UI.audioLabels();
document.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();B.Movement.control({ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key]);}if(e.key===' '&&!['BUTTON','INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();B.UI.togglePause();}if(e.key==='Escape')B.UI.togglePause();});
document.querySelectorAll('[data-dir]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();B.Movement.control(b.dataset.dir);}));
B.UI.$('pause').onclick=()=>B.UI.togglePause();B.UI.$('levels').onclick=()=>{if(['playing','paused','menu','ready','won','lost'].includes(s.phase))B.UI.selection();};B.UI.$('help').onclick=()=>{if(['playing','menu'].includes(s.phase))B.UI.help();};B.UI.$('sound').onclick=()=>B.Audio.toggle('effects');B.UI.$('music').onclick=()=>B.Audio.toggle('music');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.phase==='playing')B.UI.pause();});window.addEventListener('blur',()=>{if(s.phase==='playing')B.UI.pause();});B.UI.menu();requestAnimationFrame(t=>B.Game.frame(t));
})();
