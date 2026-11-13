/* Testes de geração; preservam o estado e o armazenamento da campanha. */
window.runForestTests=function(){
 const B=Boitata,s=B.S,snapshot={...s},results=[];
 const check=(test,passed)=>results.push({test,passed:!!passed});
 try{
  const shapes=new Set(),kinds=new Set();
  for(const l of BOITATA_LEVELS){
   Object.assign(s,{level:l,generated:0,obstacles:new Set(),items:[]});B.Maps.extend();
   check('Busca dirigida alcança todos os itens · fase '+l.id,B.Maps.validate());
   check('Corredor de crescimento preservado · fase '+l.id,[...s.obstacles].every(key=>{const [x,y]=key.split(',').map(Number);return !B.Maps.inside(x,y)||!B.Maps.safe(x,y,l);}));
   const layout=[...s.obstacles].join('|');shapes.add(layout);
   for(const key of s.obstacles){const [x,y]=key.split(',').map(Number);kinds.add(B.Maps.kind(x,y,l));}
   Object.assign(s,{generated:0,obstacles:new Set(),items:[]});B.Maps.extend();check('Semente reproduzível · fase '+l.id,[...s.obstacles].join('|')===layout);
  }
  check('Trinta distribuições distintas',shapes.size===30);check('Árvores, arbustos, rochas, troncos e água sólidos',kinds.size===5);
  Object.assign(s,{level:BOITATA_LEVELS[0],generated:0,obstacles:new Set(),items:[]});B.Maps.extend();
  check('Início seguro sem obstáculos',[...s.obstacles].every(key=>!B.Maps.inside(...key.split(',').map(Number))||Number(key.split(',')[0])>7));
  for(const key of s.obstacles){const [x,y]=key.split(',').map(Number);if(B.Maps.kind(x,y)==='water'){check('Água bloqueada pelo sistema físico compartilhado',B.Maps.blocked(x,y));break;}}
 }catch(e){check('Erro: '+e.message,false);}
 finally{Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,snapshot);}
 return results;
};
