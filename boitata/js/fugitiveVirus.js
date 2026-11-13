Boitata.FugitiveVirus={
 config:{speedRatio:1.8},
 reset(){const s=Boitata.S;s.fugitive=null;const n=Boitata.VirusAI.destination(10,16)||Boitata.VirusAI.destination(3,24);if(!n)throw Error('Não foi possível posicionar o Vírus Fugitivo em uma rota acessível.');s.fugitive={...n,old:{...n},state:'PATRULHANDO',moveClock:0,visualClock:1};},
 update(dt){const B=Boitata,s=B.S,f=s.fugitive;if(!f||f.state==='CAPTURADO')return;
  f.visualClock+=dt;
  const distance=B.VirusAI.distance(f,s.snake[0]),ways=B.VirusAI.neighbors(f);f.state=ways.length<=1?'ENCURRALADO':distance<7?'FUGINDO':'PATRULHANDO';
  f.moveClock+=dt;const interval=s.level.stepMs/1000*(s.level.id===8?this.config.speedRatio:1.8);if(f.moveClock<interval)return;f.moveClock%=interval;
  const n=B.VirusAI.escape(f);if(n){f.old={x:f.x,y:f.y};f.x=n.x;f.y=n.y;f.visualClock=0;}
 },
 point(){const s=Boitata.S,f=s.fugitive;if(!f)return null;const alpha=Math.min(1,f.visualClock/(s.level.stepMs/1000));return {x:f.old.x+(f.x-f.old.x)*alpha+.5,y:f.old.y+(f.y-f.old.y)*alpha+.5};}
};
