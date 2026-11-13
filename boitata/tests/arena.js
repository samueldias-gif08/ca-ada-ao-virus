/* Finite arena contract: real simulation and actual Three.js projection. */
window.runArenaTests=function(){
 const B=Boitata,s=B.S,snapshot={...s},ui=B.UI,audio=B.Audio,results=[];
 const check=(test,passed)=>results.push({test,passed:!!passed});
 B.UI={hud(){},lost(){},close(){}};B.Audio={effect(){},init(){}};
 try{
  const layouts=new Set();
  for(const l of BOITATA_LEVELS){
   s.level=l;s.save=B.Store.defaults();B.Game.setup();s.phase='playing';
   const size=s.obstacles.size,items=s.items.length;
   layouts.add([...s.obstacles].join('|'));
   check('Fase '+l.id+': arena fixa e itens acessíveis',s.generated===24&&B.Maps.validate()&&s.items.every(p=>B.Maps.inside(p.x,p.y)));
   B.Maps.extend();check('Fase '+l.id+': geração não expande',s.generated===24&&size===s.obstacles.size&&items===s.items.length);
   check('Fase '+l.id+': todas as células livres conectadas',B.Maps.reachable().size===22*16-[...s.obstacles].filter(k=>B.Maps.inside(...k.split(',').map(Number))).length);
   for(const [x,y,dx,dy]of [[1,9,-1,0],[22,9,1,0],[6,1,0,-1],[6,16,0,1]]){
    s.snake=[{x,y}];s.oldSnake=[{x,y}];s.dir={x:dx,y:dy};s.pending=[];
    check('Fase '+l.id+': borda '+x+','+y,B.Movement.next()===null&&B.Maps.blocked(x+dx,y+dy)&&!B.Pathfinding.free(x+dx,y+dy));
   }
   B.Player.reset();s.camera=s.oldCamera=0;
   s.total=1000n;B.Enemies.spawn();
   for(let i=0;i<160;i++){s.steps++;if(l.id===30&&i%20===0)B.Enemies.spawn(true);B.Enemies.update();}
   check('Fase '+l.id+': vírus comuns internos',s.enemies.length>0&&s.enemies.every(p=>B.Maps.inside(p.x,p.y)&&!B.Maps.blocked(p.x,p.y)));
   s.enemies=[];s.items=[];B.FugitiveVirus.reset();
   let continuous=true;for(let i=0;i<80;i++){const old={...s.fugitive};B.FugitiveVirus.update(.4);continuous&&=B.VirusAI.distance(old,s.fugitive)<=1&&B.Maps.inside(s.fugitive.x,s.fugitive.y)&&!B.Maps.blocked(s.fugitive.x,s.fugitive.y);}
   check('Fase '+l.id+': fuga contínua respeita o mapa',continuous&&!('used' in s.fugitive));
   B.PredatorVirus.reset();check('Fase '+l.id+': predador surge em posição segura',B.PredatorVirus.spawn()&&B.Pathfinding.free(s.predator.x,s.predator.y,.92));
   for(let i=0;i<40;i++)B.PredatorVirus.update(.2);
   check('Fase '+l.id+': perseguição respeita limites',B.Maps.inside(s.predator.x,s.predator.y));
   s.snake=[{x:22,y:9}];s.lives=3;s.invuln=0;s.phase='playing';B.Player.hurt();
   check('Fase '+l.id+': retorno seguro e câmera parada',s.snake.every(p=>B.Maps.inside(p.x,p.y)&&!B.Maps.blocked(p.x,p.y))&&s.camera===0&&s.oldCamera===0);
  }
  check('30 distribuições distintas',layouts.size===30);
  const F=B.Forest3D;
  if(F?.renderer){
   s.level=BOITATA_LEVELS[0];B.Game.setup();F.resize();F.draw(1000);
   const camera=F.camera,position=camera.position.clone(),projection=camera.projectionMatrix.clone(),rect=F.canvas.getBoundingClientRect.bind(F.canvas);
   check('WebGL: câmera ortográfica horizontal em 3D',camera.isOrthographicCamera&&Math.abs(camera.position.x-12)<1e-8&&Math.abs(camera.position.y-40)<1e-8);
   for(const [w,h]of [[1366,768],[1280,720],[1920,1080],[2560,1440],[3840,2160],[900,1200],[2400,900]]){
    F.canvas.getBoundingClientRect=()=>({width:w,height:h});F.resize();
    camera.updateMatrixWorld();let visible=true;
    // Envelope includes the tallest foliage, ground thickness and canopy overhang.
    for(const x of [-.6,24.6])for(const y of [-.6,18.6])for(const z of [-.9,4]){
     const p=new THREE.Vector3(x,z,y).project(camera);visible&&=Math.abs(p.x)<1.5&&Math.abs(p.y)<1.5&&Math.abs(p.z)<1;
    }
    check(w+' × '+h+': zoom de 50% no centro, proporção responsiva',visible&&Math.abs((camera.right-camera.left)/(camera.top-camera.bottom)-w/h)<1e-8);
   }
   F.canvas.getBoundingClientRect=rect;F.resize();
   s.snake=[{x:22,y:16}];F.draw(2000);
   check('WebGL: câmera imóvel e três trechos finitos',camera.position.equals(position)&&camera.projectionMatrix.equals(projection)&&F.chunks.size===3);
  }
 }catch(e){check('Erro: '+e.stack,false);}
 finally{B.UI=ui;B.Audio=audio;Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,snapshot);}
 return results;
};
