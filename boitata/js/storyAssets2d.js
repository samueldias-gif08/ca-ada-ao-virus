/* Painted animation assets only. No 3D renderer, screenshots of models or geometric stand-ins. */
(() => {
 'use strict';const B=Boitata;
 B.StoryAssets2D={
  backgrounds:['forest-night','temple','lagoon','forest-path','forest-day','laboratory','final-folklore-cast'],
  atlases:['iara-atlas','boitata-atlas','cuca-atlas','loira-atlas','virus-atlas','foliage-atlas','iara-swim-atlas','iara-comb-atlas','iara-act-atlas','boitata-whole-atlas','captives-whole-atlas'],
  sprites:{
   iara:{torso:0,tail:1,hair:2,lock:3,upperL:4,lowerL:5,upperR:6,combHand:7,calm:8,fear:9,worried:10,determined:11,tailL:12,tailR:13,lowerR:14,comb:15},
   'iara-swim':Object.fromEntries(Array.from({length:12},(_,i)=>['frame'+i,i])),
   'iara-comb':Object.fromEntries(Array.from({length:12},(_,i)=>['frame'+i,i])),
   'iara-act':Object.fromEntries(Array.from({length:16},(_,i)=>['frame'+i,i])),
   'boitata-whole':Object.fromEntries(Array.from({length:12},(_,i)=>['frame'+i,i])),
   'captives-whole':Object.fromEntries(Array.from({length:8},(_,i)=>['frame'+i,i])),
   boitata:{sleep:0,weak:1,surprise:2,determined:3,coil:4,coilBreath:5,body:6,tip:7,segment:8,bend:9,bodyAlt:10,neck:11,flame0:12,flame1:13,flame2:14,flame3:15},
   cuca:{body:0,down:1,waking:2,blue:3,hair:4,tail:5,armL:6,armR:7,closeDown:8,closeWake:9,closeBlue:10,closeBright:11},
   loira:{body:0,down:1,waking:2,blue:3,hair:4,lock:5,armL:6,armR:7,closeDown:8,closeWake:9,closeBlue:10,closeBright:11},
   virus:{idle:0,anticipation:1,flight:2,smear:3,portal0:4,portal1:5,chips:6,shadow:7},
   foliage:{nightL:0,nightR:1,nightTop:2,nightBottom:3,dayL:4,dayR:5,dayTop:6,dayBottom:7}
  },
  create(){
   const names=[...this.backgrounds,...this.atlases],images=new Map(),pending=new Set(),wholeSprites=new Map();let cancelled=false;
   return {
    images,
    async load(progress=()=>{}){
     let done=0;
     await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
      pending.add(reject);
      const img=new Image();images.set(name,img);img.decoding='async';
      img.onload=()=>{pending.delete(reject);if(cancelled)return reject(Error('Carregamento cancelado'));done++;progress(done,names.length);resolve(img);};
      img.onerror=()=>{pending.delete(reject);reject(Error('Não foi possível carregar assets/story2d/'+name+'.png'));};
      const file=name==='iara-swim-atlas'?'iara-air-swim-atlas':name==='boitata-whole-atlas'?'boitata-whole-head-small-atlas':name;
      img.src='assets/story2d/'+file+'.png';
     })));
     // Remove the opaque white sheet background by flooding only near-white pixels
     // connected to the outer edge. White costume details remain untouched.
     const cast=images.get('final-folklore-cast');
     if(cast){const cnv=document.createElement('canvas');cnv.width=cast.naturalWidth;cnv.height=cast.naturalHeight;const cx=cnv.getContext('2d',{willReadFrequently:true});cx.drawImage(cast,0,0);const im=cx.getImageData(0,0,cnv.width,cnv.height),d=im.data,w=cnv.width,h=cnv.height,n=w*h,seen=new Uint8Array(n),q=new Int32Array(n);let head=0,tail=0;const white=i=>{const p=i*4,r=d[p],g=d[p+1],b=d[p+2];return Math.min(r,g,b)>174&&Math.max(r,g,b)-Math.min(r,g,b)<38;};const seed=i=>{if(!seen[i]&&white(i)){seen[i]=1;q[tail++]=i;}};for(let x=0;x<w;x++){seed(x);seed((h-1)*w+x);}for(let y=0;y<h;y++){seed(y*w);seed(y*w+w-1);}while(head<tail){const i=q[head++],x=i%w,y=(i/w)|0;d[i*4+3]=0;if(x)seed(i-1);if(x<w-1)seed(i+1);if(y)seed(i-w);if(y<h-1)seed(i+w);}for(let i=0;i<n;i++){const k=i*4,r=d[k],g=d[k+1],b=d[k+2];if(Math.min(r,g,b)>198&&Math.max(r,g,b)-Math.min(r,g,b)<24)d[k+3]=0;}cx.putImageData(im,0,0);images.set('final-folklore-cast',cnv);}
     // Each source region contains a COMPLETE drawing. Registration is at the
     // forehead, never independently at neck, shoulders, waist or other joints.
     const layouts={
      'iara-comb':{height:1086,rows:[0,362,724,1086],heads:[[245,52],[245,52],[245,52]]},
      'iara-act':{height:1086,rows:[0,324,590,838,1086],heads:[[245,55],[245,41],[245,47],[245,39]]},
      'boitata-whole':{height:1024,rows:[0,375,750,1024],heads:[[210,90],[210,90],[320,110]]},
      'captives-whole':{height:888,rows:[0,444,888],heads:[[222,50],[222,50]]}
     };
     for(const [character,layout] of Object.entries(layouts)){
      const atlas=character+'-atlas',image=images.get(atlas),sx=image.naturalWidth/(character==='boitata-whole'?1536:character==='captives-whole'?1776:1448),sy=image.naturalHeight/layout.height,cells=[];
      for(let row=0;row<layout.rows.length-1;row++)for(let col=0;col<4;col++){
       const x=Math.floor(col*image.naturalWidth/4),y=Math.floor(layout.rows[row]*sy),right=Math.floor((col+1)*image.naturalWidth/4),bottom=Math.floor(layout.rows[row+1]*sy);
       const bounds={x,y,w:right-x,h:bottom-y,regX:layout.heads[row][0]*sx,regY:layout.heads[row][1]*sy};cells.push(bounds);
       wholeSprites.set(character+'/frame'+(row*4+col),B.StoryAssets2D.extractWhole(image,bounds));
      }
      B.StoryAtlasBounds[atlas]={cells};
     }
     // Expanded cells retain outstretched hands; isolate the complete cel from its neighbor.
     const swimImage=images.get('iara-swim-atlas'),cw=swimImage.naturalWidth/4,ch=swimImage.naturalHeight/3;
     for(let i=0;i<12;i++){
      const x=Math.floor(i%4*cw),y=Math.floor(Math.floor(i/4)*ch),w=Math.min(Math.ceil(cw*1.11),swimImage.naturalWidth-x);
      const cel=B.StoryAssets2D.extractWhole(swimImage,{x,y,w,h:Math.floor(ch)});
      const canvas=document.createElement('canvas');canvas.width=Math.ceil(cw*1.11);canvas.height=Math.floor(ch);
      canvas.getContext('2d').drawImage(cel.image,0,0);
      wholeSprites.set('iara-swim/frame'+i,{image:canvas,x:0,y:0,w:canvas.width,h:canvas.height});
     }
     for(const name of B.StoryAssets2D.atlases){const image=images.get(name),cells=B.StoryAtlasBounds?.[name]?.cells;if(!cells?.length||!cells.every(r=>r.x>=0&&r.y>=0&&r.w>1&&r.h>1&&r.x+r.w<=image.naturalWidth&&r.y+r.h<=image.naturalHeight))throw Error('Metadados do atlas ausentes ou inválidos: '+name);}
     return this;
    },
    image(name){const image=images.get(name);if(!image||!(image.naturalWidth||image.width)||('complete'in image&&!image.complete))throw Error('Arte não carregada: '+name);return image;},
    sprite(character,part){
     const whole=wholeSprites.get(character+'/'+part);if(whole)return whole;
     const atlas=character==='foliage'?'foliage-atlas':character+'-atlas',index=B.StoryAssets2D.sprites[character][part],bounds=B.StoryAtlasBounds[atlas].cells[index];
     if(!bounds||bounds.w<2||bounds.h<2)throw Error('Sprite ausente: '+character+'/'+part);
     return {image:this.image(atlas),...bounds,name:character+'/'+part};
    },
    release(){cancelled=true;for(const reject of pending)reject(Error('Carregamento cancelado'));pending.clear();wholeSprites.clear();for(const img of images.values()){img.onload=img.onerror=null;img.src='';}images.clear();}
   };
  },
  extractWhole(image,bounds){
   // Isolate the largest connected drawing in an overlapping source region;
   // neighboring cels must never leak into it. Preserve its original pixels.
   const canvas=document.createElement('canvas');canvas.width=bounds.w;canvas.height=bounds.h;
   const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,bounds.x,bounds.y,bounds.w,bounds.h,0,0,bounds.w,bounds.h);
   const data=c.getImageData(0,0,bounds.w,bounds.h),pixels=data.data,n=bounds.w*bounds.h,seen=new Uint8Array(n),queue=new Int32Array(n);let best=[];
   for(let seed=0;seed<n;seed++){
    if(seen[seed]||pixels[seed*4+3]<64)continue;
    let read=0,end=1;queue[0]=seed;seen[seed]=1;
    while(read<end){const at=queue[read++],x=at%bounds.w,y=Math.floor(at/bounds.w);for(const next of [x>0?at-1:-1,x<bounds.w-1?at+1:-1,y>0?at-bounds.w:-1,y<bounds.h-1?at+bounds.w:-1])if(next>=0&&!seen[next]&&pixels[next*4+3]>=64){seen[next]=1;queue[end++]=next;}}
    if(end>best.length)best=queue.slice(0,end);
   }
   if(best.length<100)throw Error('Desenho de corpo inteiro ausente');
   const keep=new Uint8Array(n);for(const at of best){const x=at%bounds.w,y=Math.floor(at/bounds.w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<bounds.w&&yy>=0&&yy<bounds.h)keep[yy*bounds.w+xx]=1;}}
   for(let i=0;i<n;i++)if(!keep[i])pixels[i*4+3]=0;c.putImageData(data,0,0);
   return {...bounds,image:canvas,x:0,y:0,wholeBody:true};
  }
 };
})();
