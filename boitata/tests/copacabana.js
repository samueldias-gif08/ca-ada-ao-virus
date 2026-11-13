(() => {
 const B=Boitata,F=B.Forest3D,C=B.Copacabana,r=[],check=(name,ok)=>r.push({name,ok:!!ok});
 try{
 const click=Math.random().toString(16).slice(2);B.Store.key='boitata-copacabana-test-'+click;B.S.save=B.Store.defaults();B.S.save.unlocked=30;B.Game.start(4);B.S.phase='paused';B.UI.close();F.setQuality('low');F.draw(200);
 check('level four active',C.active()&&F.chunks.size===3);
 check('full promenade texture',C.root.getObjectByName('copacabana-waves')?.material.map===C.texture());
 check('repeatable high detail wave mosaic',C.texture().image.width===1024&&C.texture().repeat.x===2&&C.texture().magFilter===THREE.NearestFilter);
 check('four animated pedestrian obstacles',C.people.length===4&&C.personMeshes.length===4);
 check('cars have four correctly oriented wheels each',C.carMeshes.every(car=>car.children.filter(m=>m.geometry===F.geometries.cylinder).length===8&&car.children.filter(m=>m.geometry===F.geometries.cylinder).every(m=>Math.abs(m.rotation.x-Math.PI/2)<.001)));
 check('cars have separate side and front glass',C.carMeshes.every(car=>car.children.filter(m=>m.material.color?.getHexString()==='70b9c9').length>=4));
 check('moving car collision',B.Maps.blocked(C.people[0].x-.5,C.people[0].y-.5));
 check('no static internal monument',!C.blocked(12,8)&&C.people.length===4);
 check('only four cars are solid hazards',(()=>{for(let x=1;x<=22;x++)for(let y=1;y<=16;y++)if(B.S.obstacles.has(x+','+y)!==C.blocked(x,y))return false;return true;})());
 check('clear route around the monument',B.Maps.reachable().size===22*16-8);
 check('all packets reachable',B.Maps.validate());
 for(const id of ['boitata','iara']){B.S.save.character=id;F.draw(500);check(id+' visible, no WebGL error',F.renderer.getContext().getError()===0);}
 check('fugitive spawn avoids statue',!C.blocked(B.S.fugitive.x,B.S.fugitive.y));
 check('predator spawns in open area',B.PredatorVirus.spawn()&&!C.blocked(B.S.predator.x,B.S.predator.y));
 const start=B.S.predator;for(let i=0;i<70;i++)B.PredatorVirus.update(.15);check('predator routes around statue',!C.blocked(B.S.predator.x,B.S.predator.y));
 const camera=F.camera.position.clone();F.draw(1200);check('fixed camera',camera.equals(F.camera.position));
 const canvas=F.canvas,rect=canvas.getBoundingClientRect.bind(canvas);for(const [w,h,q]of [[1920,1080,'medium'],[3840,2160,'ultra']]){canvas.getBoundingClientRect=()=>({width:w,height:h});F.setQuality(q);F.fitCamera(w/h);F.draw(1500);let full=true;for(const x of [0,24])for(const y of [0,18]){const p=new THREE.Vector3(x,0,y).project(F.camera);full&&=Math.abs(p.x)<=1&&Math.abs(p.y)<=1;}check(w+' full map visible',full);check(w+' drawing buffer',F.width===w&&F.height===h);}canvas.getBoundingClientRect=rect;F.setQuality('low');
 // Returning to earlier sectors leaves their collision sets and scene colors unchanged.
 for(const id of [1,2,3]){B.Game.start(id);B.S.phase='paused';B.UI.close();F.draw(2200+id);check('previous level '+id+' retained',B.S.level.id===id&&F.chunks.size===3&&F.scene.background.getHexString()!=='9fd4f2');}
 B.UI.menu();
 }catch(e){r.push({name:e.stack,ok:false});}
 document.body.dataset.copacabanaTests=JSON.stringify({passed:r.filter(v=>v.ok).length,total:r.length,failed:r.filter(v=>!v.ok)});
})();
