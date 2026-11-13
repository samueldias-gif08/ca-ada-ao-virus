Boitata.Characters.register({id:'boitata',name:'Boitatá',title:'A Serpente Digital',color:'#ffb347',
 description:'Uma chama ancestral protege os circuitos. Cada pacote acrescenta um segmento ao corpo luminoso.',growth:'Corpo crescente',
 model(m,path,t,dir){
 for(let i=path.length-1;i>=0;i--){const p=path[i];if(!m.visible(p))continue;const r=i? .30:.40;if(i)m.tube(p,path[i-1],.24,'#f18b32');m.ellipsoid(p.x,p.y,p.z,r,r,.29,i%2?'#ed7029':'#ffb347');if(i%2===0)m.ellipsoid(p.x,p.y,p.z+.27,.10,.10,.14,'#ffe996');}
 const h=path[0];if(!h)return;const dx=dir.x,dy=dir.y;for(const side of [-1,1])m.ellipsoid(h.x+dx*.23-dy*.22*side,h.y+dy*.23+dx*.22*side,h.z+.21,.08,.08,.08,'#fffbd5');
 for(let j=0;j<12;j++){const p=path[Math.floor(j*path.length/12)];if(p)m.ellipsoid(p.x+Math.sin(t*.003+j)*.18,p.y,p.z+.4+(t*.001+j*.17)% .7,.035,.035,.06,'#ffcb63');}
 }});
