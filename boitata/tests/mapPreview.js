(() => {
 const B=Boitata,P=B.MapPreview,r=[],check=(name,ok)=>r.push({name,ok:!!ok});
 try{
 B.Store.key='boitata-map-preview-test';B.S.save=B.Store.defaults();B.Store.write();const disk=localStorage.getItem(B.Store.key),save=B.S.save;B.UI.menu();check('menu has map browser',[...B.UI.$('overlay').querySelectorAll('button')].some(b=>b.textContent==='Visualizar mapas'));
 if(B.Forest3D.renderer)B.Forest3D.setQuality('low');P.gallery();check('all thirty maps available',B.UI.$('overlay').querySelectorAll('.level-grid button').length===30&&[...B.UI.$('overlay').querySelectorAll('.level-grid button')].every(b=>!b.disabled));
 for(const id of [2,3,30]){check('locked map opens '+id,P.open(id)&&B.S.level.id===id&&B.S.phase==='map-preview');const before=B.S.steps;B.Game.tick();B.CaptureSystem.update(2);check('preview does not play '+id,B.S.steps===before&&B.S.phase==='map-preview');}
 check('progress stays locked',B.S.save.unlocked===1&&B.S.save.completed.length===0);check('save storage unchanged',localStorage.getItem(B.Store.key)===disk);
 document.querySelector('#map-preview-controls button:nth-of-type(3)').click();check('preview guardian changes locally',B.S.save.character!==save.character&&save.character==='boitata');
 P.exit();check('original save reference restored',B.S.save===save);check('menu restored',B.S.phase==='menu'&&!document.getElementById('map-preview-controls'));check('campaign still rejects locked levels',B.Game.start(2)===false);
 B.Game.start(1);B.S.phase='paused';B.UI.pause();const snake=B.S.snake,f=B.S.fugitive,obstacles=B.S.obstacles;P.open(3);P.exit();check('paused mission restored',B.S.phase==='paused'&&B.S.snake===snake&&B.S.fugitive===f&&B.S.obstacles===obstacles);check('disk still unchanged',localStorage.getItem(B.Store.key)===disk.replace('"last":1','"last":1'));
 P.gallery();document.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true,cancelable:true}));check('escape exits gallery',!P.session&&B.S.phase==='paused');
 B.UI.menu();P.gallery();P.open(3);
 }catch(e){r.push({name:e.stack,ok:false});}
 document.body.dataset.previewTests=JSON.stringify({passed:r.filter(t=>t.ok).length,total:r.length,failed:r.filter(t=>!t.ok)});
})();
