/* Digital malware: original palettes and shared geometric meshes. */
Boitata.VirusVisuals={
 draw(m,t){const B=Boitata,s=B.S;
  const model=(pos,size,predator)=>{if(!pos||!m.visible(pos))return;
   const body=predator?'#7f243d':'#7ee848',glow=predator?'#ff426d':'#b8ff67';
   const pulse=1+Math.sin(t*.006)*.035,z=.45*size+Math.sin(t*.005)*.035;
   const box=(x,y,h,w,d,height,color,type='plain')=>m.box(pos.x+x*size,pos.y+y*size,z+h*size,w*size,d*size,height*size,color,type);
   box(-.23*pulse,-.19,-.21,.46*pulse,.38,.42,body);
   box(-.19,.194,-.13,.38,.025,.25,'#14252d');
   box(-.20,-.16,.213,.40,.32,.025,body);
   box(-.16,-.12,.241,.22,.025,.014,glow,'glow');
   box(.035,-.12,.241,.025,.22,.014,glow,'glow');
   box(-.13,.055,.241,.19,.025,.014,glow,'glow');
   for(const side of [-1,1]){
    box(side*.10-.055,.223,.025,.11,.018,.055,glow,'glow');
    if(predator)box(side*.10-.065,.222,.09,.13,.018,.025,body);
    for(let k=0;k<3;k++)box(side<0?-.31:.23,-.14+k*.115,-.10,.08,.045,.075,body);
   }
   box(-.07,.223,-.075,.14,.018,.025,glow,'glow');
   const count=predator?8:4;
   for(let k=0;k<count;k++){
    const a=k*Math.PI*2/count+t*.0008,r=.32+Math.sin(t*.004+k)*.025;
    box(Math.cos(a)*r-.025,Math.sin(a)*r-.025,.04+Math.sin(t*.003+k)*.17,.05,.05,.065,k%2?body:glow,k%2?'plain':'glow');
   }
   if(predator){
    for(const side of [-1,1]){
     box(side<0?-.30:.21,-.21,-.25,.09,.42,.50,body);
     box(side<0?-.307:.297,-.16,-.12,.012,.28,.035,glow,'glow');
    }
    for(let k=0;k<3;k++)box(-.14+k*.11,-.13,.28,.065,.25,.045,body);
   }
  };
  const f=s.fugitive,p=s.predator;
  if(f&&f.state!=='CAPTURADO')model(B.FugitiveVirus.point(),1,false);
  if(p&&p.state!=='AGUARDANDO'){
   const fade=p.state==='SURGINDO'?Math.max(.1,1-p.clock/B.PredatorVirus.config.arrival):p.state==='DESAPARECENDO'?Math.max(.1,p.clock/.5):1;
   model(B.PredatorVirus.point(),2.65*fade,true);
  }
 }
};