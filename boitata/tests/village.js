/* Isolated level-three regressions. Use a separate save key. */
(() => {
 const B=Boitata,F=B.Forest3D,V=B.Village,results=[],check=(name,ok)=>results.push({name,ok:!!ok});
 window.addEventListener('error',e=>{document.body.dataset.error=e.message;});
 try{
 B.Store.key='boitata-village-test';B.S.save=B.Store.defaults();B.S.save.unlocked=30;B.Audio.effect=()=>{};
 const prepare=id=>{B.Game.start(id);B.S.phase='paused';B.UI.close();F.draw(200);};
 const earlier=[];for(const id of [1,2]){prepare(id);earlier.push({id,map:[...B.S.obstacles].join('|'),camera:F.camera.projectionMatrix.clone(),background:F.scene.background.getHexString()});}
 prepare(3);check('level three loads',B.S.level.id===3&&F.chunks.size===3);check('six complete buildings',V.houses.length===6&&V.houses.every(h=>B.S.obstacles.has(h.x+','+h.y)&&B.Maps.blocked(h.x+h.w-1,h.y+h.h-1)));
 check('all streets reachable',B.Maps.reachable().size===22*16-V.houses.reduce((n,h)=>n+h.w*h.h,0));check('all packets reachable',B.Maps.validate());check('three named NPCs',V.npcs.map(n=>n.name).join(',')==='Naruto,Sasuke,Sakura');
 check('roofs fade near guardian',[...F.materials.keys()].some(k=>k.endsWith('villageRoof')));check('ramen sign rendered',F.materials.has('village-sign:一楽 ラーメン'));
 const savedSnake=B.S.snake,savedItems=B.S.items;B.S.snake=[{x:1,y:1}];B.S.items=[];const start=V.npcs.map(n=>({x:n.x,y:n.y}));for(let i=0;i<50;i++)V.update(.1);check('all NPCs move',V.npcs.every((n,i)=>Math.hypot(n.x-start[i].x,n.y-start[i].y)>.1));check('NPCs avoid houses',V.npcs.every(n=>!V.footprint(Math.round(n.x),Math.round(n.y))));
 const npc=V.npcs[0];B.S.snake=[{x:npc.x+.2,y:npc.y}];V.update(.1);check('NPC yields near player',npc.yielding&&!V.blocked(npc.x,npc.y));B.S.snake=savedSnake;B.S.items=savedItems;
 check('NPC collider works away from player',(()=>{npc.yielding=false;const result=V.blocked(npc.x,npc.y);npc.yielding=true;return result;})());
 check('fugitive spawns outside buildings',!V.footprint(B.S.fugitive.x,B.S.fugitive.y));check('three teleports available',B.S.fugitive.teleportsLeft===3);
 check('predator spawns',B.PredatorVirus.spawn());const pred=B.S.predator;check('large predator has navigable street',B.VirusAI.neighbors(pred,B.PredatorVirus.config.radius).length>0);
 for(let i=0;i<80;i++){B.FugitiveVirus.update(.1);B.PredatorVirus.update(.1);}check('viruses stay outside houses',![B.S.fugitive,B.S.predator].some(p=>V.footprint(Math.round(p.x),Math.round(p.y))));
 // Force an encircled escape, retaining the real validated destination selector.
 const neighbors=B.VirusAI.neighbors,head=B.S.snake;B.S.snake=[{x:B.S.fugitive.x+1,y:B.S.fugitive.y}];B.VirusAI.neighbors=()=>[];B.S.fugitive.teleportCooldown=0;B.FugitiveVirus.update(.01);check('validated teleport consumes one charge',B.S.fugitive.teleportsLeft===2&&!B.Maps.blocked(B.S.fugitive.x,B.S.fugitive.y));B.VirusAI.neighbors=neighbors;B.S.snake=head;
 const path=[{x:3,y:9},{x:4,y:9},{x:5,y:9}];check('existing capture collision works',B.CaptureSystem.touches(path,{x:3,y:9}));
 for(const id of ['boitata','iara']){B.S.save.character=id;F.draw(700);check(id+' renders without GPU errors',F.renderer.getContext().getError()===0);}
 const original=B.S.snake;for(const code of ['ArrowRight','ArrowLeft','ArrowUp','ArrowDown']){B.Movement.clear();B.S.phase='playing';let prevented=false;check(code+' accepted',B.Movement.keydown({code,preventDefault(){prevented=true;}})&&prevented);B.Movement.keyup({code,preventDefault(){}});}B.S.phase='paused';B.Movement.clear();B.S.snake=original;
 const position=F.camera.position.clone();F.draw(900);check('camera stays fixed',F.camera.position.equals(position));
 const rect=F.canvas.getBoundingClientRect.bind(F.canvas);for(const [w,h]of [[1920,1080],[3840,2160]]){F.canvas.getBoundingClientRect=()=>({width:w,height:h});F.setQuality(w===3840?'ultra':'medium');let inside=true;for(const x of [0,24])for(const z of [0,18])for(const y of [0,2.5]){const p=new THREE.Vector3(x,y,z).project(F.camera);inside&&=Math.abs(p.x)<=1&&Math.abs(p.y)<=1;}check('whole village visible '+w,inside);check('render buffer '+w,F.width===w&&F.height===h);}F.canvas.getBoundingClientRect=rect;F.setQuality('medium');
 for(const old of earlier){prepare(old.id);check('level '+old.id+' layout preserved',[...B.S.obstacles].join('|')===old.map);check('level '+old.id+' daylight restored',F.scene.background.getHexString()===old.background);check('level '+old.id+' camera restored',F.camera.projectionMatrix.equals(old.camera));}
 prepare(3);document.body.classList.add('arena-active');F.resize();F.draw(1300);
 }catch(e){results.push({name:'unexpected exception: '+e.stack,ok:false});}
 const summary={passed:results.filter(r=>r.ok).length,total:results.length,failed:results.filter(r=>!r.ok)};document.body.dataset.villageTests=JSON.stringify(summary);
 const output=document.createElement('pre');output.textContent=JSON.stringify(summary,null,2);document.body.append(output);
})();
