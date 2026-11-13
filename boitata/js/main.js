(() => {
'use strict';
const B=Boitata,s=B.S;
Object.assign(s,{save:B.Store.load(),phase:'menu',level:null,snake:[],oldSnake:[],dir:{x:1,y:0},pending:[],camera:0,oldCamera:0,collected:0,lives:3,score:0,invuln:0,clock:0,acc:0,lastTime:0,elapsed:0,steps:0,generated:0,total:0n,issued:0n,retired:0n,obstacles:new Set(),items:[],enemies:[],hazards:[],particles:[],lastQuestions:{}});
if(B.Forest3D.init()){
 B.Renderer.draw=t=>B.Forest3D.draw(t);
}else{
 B.UI.ctx=B.UI.$('game').getContext('2d');
 document.getElementById('graphics-status').textContent='Modo Canvas · WebGL indisponível';
}
const drawGame = B.Renderer.draw;
B.Renderer.draw = function(...args) {
 if (!B.TempleMenu?.root) return drawGame.apply(this, args);
};
B.Movement.bindPointer(B.UI.$('game'));
B.UI.audioLabels();
document.addEventListener('keydown',e=>{B.Movement.keydown(e);if(e.code==='Space'&&!e.repeat&&!['BUTTON','INPUT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();B.UI.togglePause();}if(e.code==='Escape'&&!e.repeat)B.UI.togglePause();});
document.addEventListener('keyup',e=>B.Movement.keyup(e));
 document.querySelectorAll('[data-code]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);B.Movement.keydown({code:b.dataset.code,preventDefault(){}});});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>B.Movement.keyup({code:b.dataset.code,preventDefault(){}}));});
B.UI.$('pause').onclick=()=>B.UI.togglePause();B.UI.$('levels').onclick=()=>{if(['playing','paused','menu','ready','won','lost','pvp-playing','pvp-won'].includes(s.phase))B.UI.selection();};B.UI.$('help').onclick=()=>{if(['playing','menu'].includes(s.phase))B.UI.help();};B.UI.$('sound').onclick=()=>B.Audio.toggle('effects');B.UI.$('music').onclick=()=>B.Audio.toggle('music');
document.addEventListener('visibilitychange',()=>{if(document.hidden){B.Movement.held.clear();B.Movement.resetPointer();if(B.Movement.playing())B.UI.pause();}});window.addEventListener('blur',()=>{B.Movement.held.clear();B.Movement.resetPointer();if(B.Movement.playing())B.UI.pause();});B.UI.menu();requestAnimationFrame(t=>B.Game.frame(t));
})();
