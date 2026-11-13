Boitata.Characters.register({id:'iara',name:'Iara',title:'A Guardiã das Águas Digitais',color:'#65e6ed',
 description:'Sereia brasileira de águas luminosas. Seu corpo permanece igual; cada pacote alonga as mechas que seguem seu percurso.',growth:'Cabelo crescente',
 model(m,path,t,dir){
 const h=path[0];if(!h)return;
 // Tubos contínuos, amostrados apenas na janela visível. Ondulação é vertical:
 // a posição horizontal nunca sai das células da trilha de colisão.
 for(let i=path.length-1;i>0;i--){const a=path[i],b=path[i-1];if(!m.visible(a)&&!m.visible(b))continue;
 for(let strand=-1;strand<=1;strand++){const z=.60+strand*.055;m.tube({...a,z},{...b,z:i===1?1.48:z},.12,'#080808');}}
 const bob=Math.sin(t*.003)*.05,dx=dir.x,dy=dir.y;
 const p=(back,z)=>({x:h.x-dx*back,y:h.y-dy*back,z:z+bob});
 // Cauda fixa articulada, tronco, braços, rosto e coroa de cabelo.
 const swim=Math.sin(t*.006)*.045,tail=p(.27,.50+swim),fin=p(.43,.28-swim),body=p(0,.96),head=p(0,1.48);
 m.ellipsoid(tail.x,tail.y,tail.z,.25,.25,.38,'#219eaa');
 for(const side of [-1,1])m.ellipsoid(fin.x-dy*.24*side,fin.y+dx*.24*side,fin.z,.29,.29,.06,'#74e0cb');
 m.ellipsoid(body.x,body.y,body.z,.22,.20,.33,'#b97b59');
 m.ellipsoid(body.x,body.y,body.z+.03,.235,.215,.12,'#3ec5c3');
 for(const side of [-1,1])m.ellipsoid(h.x-dy*.28*side,h.y+dx*.28*side,.95+bob,.09,.09,.28,'#c68e68');
 m.ellipsoid(head.x-dx*.025,head.y-dy*.025,head.z,.215,.215,.235,'#080808');
 m.tube(p(.23,1.45),p(.23,.85),.115,'#080808');
 for(let j=-3;j<=3;j++)m.ellipsoid(head.x+dx*.17-dy*j*.035,head.y+dy*.17+dx*j*.035,1.61+bob,.03,.03,.065,'#080808');
 m.ellipsoid(head.x+dx*.10,head.y+dy*.10,head.z-.02,.21,.20,.23,'#d5a47c');
 for(const side of [-1,1])m.ellipsoid(h.x+dx*.25-dy*.085*side,h.y+dy*.25+dx*.085*side,1.51+bob,.045,.045,.045,'#b8ffff');
 for(let j=0;j<9;j++){const p=path[j%path.length];m.ellipsoid(p.x+Math.sin(j*4+t*.001)*.17,p.y,.6+(t*.0006+j*.19)%1.1,.04,.04,.055,'#9bf1ff');}
 }});
