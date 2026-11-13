Boitata.UI.chaseHud=function(){const B=Boitata,s=B.S,f=s.fugitive,p=s.predator,t=s.chaseTimer;
 const text=(id,value)=>{const node=this.$(id);if(node&&node.textContent!==value)node.textContent=value;};
 if(!f||!p||!t){text('fugitive-state','Inicie uma missão para perseguir o alvo.');return;}
 text('fugitive-state','Fugitivo: '+f.state);
 text('predator-timer',p.state==='AGUARDANDO'?'Predador em '+Math.ceil(t.remaining)+'s':'Predador: '+p.state);
 text('chase-character',B.Characters.get().name);
 const h=s.snake[0],distance=h?B.VirusAI.distance(f,h):0,F=B.Forest3D;let location='Alvo a '+distance+' passos';
 if(f.state==='CAPTURADO')location='Alvo capturado';
 else if(F?.renderer){const v=new THREE.Vector3(f.x+.5,.6,f.y+.5).project(F.camera);if(Math.abs(v.x)>1||Math.abs(v.y)>1)location=(v.x<0?'←':'→')+(v.y>1?' ↑':v.y<-1?' ↓':'')+' Fugitivo fora da câmera · '+distance+' passos';}
 text('fugitive-location',location);
 const message=f.state==='CAPTURADO'?'VÍRUS CAPTURADO!':p.state==='SURGINDO'||p.state==='PERSEGUINDO'||p.state==='ATACANDO'?'O PREDADOR ESTÁ CAÇANDO VOCÊ!':t.remaining<=5?'PERIGO! VÍRUS PREDADOR SE APROXIMANDO!':'';
 text('chase-notice',message);const viewport=this.$('game')?.parentElement;viewport?.classList.toggle('predator-alert',p.state==='SURGINDO'||p.state==='ATACANDO');
};
