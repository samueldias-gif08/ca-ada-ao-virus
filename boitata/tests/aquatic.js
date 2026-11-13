(() => {
 const B=Boitata,F=B.Forest3D,A=B.Aquatic,results=[],check=(name,ok)=>results.push({name,ok:!!ok});
 B.Store.key='boitata-aquatic-test';B.S.save=B.Store.defaults();B.S.save.unlocked=30;
 B.Game.start(1);const forest=[...B.S.obstacles].join('|');B.S.phase='paused';B.UI.close();F.draw(100);
 const forestCamera=F.camera.projectionMatrix.clone();
 B.Game.start(2);B.S.phase='paused';B.UI.close();F.draw(200);
 check('transparent volume above actors',A.group.getObjectByName('aquatic-volume').geometry.parameters.height===4.8&&A.group.getObjectByName('aquatic-volume').material.opacity<.1);
 check('all packets reachable',B.Maps.validate());check('solid fish present',A.fish.length>0);check('fish block shared collision query',A.fish.every(f=>B.Maps.blocked(f.x,f.y)));
 check('kelp instanced', [...F.chunks.values()].some(g=>g.children.some(m=>m.isInstancedMesh&&m.material.customProgramCacheKey()==='aquatic-kelp')));
 check('three escapes per attempt',B.S.fugitive.teleportsLeft===3);
 const before=A.fish.map(f=>f.x);A.update(.1);check('fish move slowly',A.fish.some((f,i)=>f.x!==before[i])&&A.fish.every((f,i)=>Math.abs(f.x-before[i])<.03));
 for(const id of ['boitata','iara']){B.S.save.character=id;F.draw(500);check(id+' renders',F.renderer.getContext().getError()===0);}
 const camera=F.camera.position.clone();B.S.camera=10;F.draw(1000);check('fixed camera',F.camera.position.equals(camera));
 for(const [w,h]of [[1920,1080],[3840,2160]]){F.fitCamera(w/h);const aquaticCamera=F.camera.projectionMatrix.clone(),level=B.S.level;try{B.S.level=BOITATA_LEVELS[0];F.fitCamera(w/h);check('same zoom as level one '+w,F.camera.projectionMatrix.equals(aquaticCamera));}finally{B.S.level=level;F.fitCamera(w/h);}}
 check('fugitive valid spawn',!B.Maps.blocked(B.S.fugitive.x,B.S.fugitive.y));check('predator valid spawn',B.PredatorVirus.spawn()&&!B.Maps.blocked(B.S.predator.x,B.S.predator.y));
 B.Game.start(1);B.S.phase='paused';B.UI.close();F.draw(1100);check('forest layout unchanged',[...B.S.obstacles].join('|')===forest);check('forest lighting restored',F.scene.background.getHexString()==='c4d9bc'&&!A.group);check('forest framing restored',F.camera.projectionMatrix.equals(forestCamera));
 B.Game.start(2);B.S.phase='paused';B.UI.close();F.draw(1200);
 document.body.dataset.aquaticTests=JSON.stringify({passed:results.filter(r=>r.ok).length,total:results.length,failed:results.filter(r=>!r.ok)});
})();
