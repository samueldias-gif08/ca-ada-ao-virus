Boitata.VirusAI={
 distance:(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),
 neighbors(p,r=.22){return Boitata.Pathfinding.directions.map(d=>({x:p.x+d.x,y:p.y+d.y})).filter(n=>Boitata.Pathfinding.free(n.x,n.y,r));},
 destination(min=9,max=17,r=.22){const B=Boitata,s=B.S,h=s.snake[0],f=s.fugitive,p=s.predator;
  const choices=B.Pathfinding.reachable(h).filter(n=>{const d=this.distance(n,h);return d>=min&&d<=max&&B.Pathfinding.free(n.x,n.y,r)&&!s.items.some(i=>i.x===n.x&&i.y===n.y)&&(!f||this.distance(n,f)>3)&&(!p||p.state==='AGUARDANDO'||this.distance(n,p)>3);});
  choices.sort((a,b)=>B.Maps.hash(b.x+s.steps,b.y)-B.Maps.hash(a.x+s.steps,a.y));return choices[0]||null;
 },
 escape(f){const s=Boitata.S,h=s.snake[0],choices=this.neighbors(f);if(!choices.length)return null;
  const danger=this.distance(f,h)<7;
  const score=n=>{const degree=this.neighbors(n).length,edge=Math.min(n.y-1,16-n.y);return (danger?this.distance(n,h)*2:Boitata.Maps.hash(n.x+s.steps,n.y)*3)+degree*.8+Math.min(2,edge)*.25-(f.old&&n.x===f.old.x&&n.y===f.old.y?.4:0);};
  choices.sort((a,b)=>score(b)-score(a));return choices[0];
 }
};
