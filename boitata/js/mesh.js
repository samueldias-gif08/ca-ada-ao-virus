/* Malhas tridimensionais locais, iluminação por face e projeção ortográfica.
   Sem dependências de rede ou texturas: funciona também via file://. */
Boitata.Mesh=class{
 constructor(ctx,{x=110,y=45,scale=25,camera=0,arena=false}={}){Object.assign(this,{ctx,x,y,scale,camera,arena,faces:[]});}
 visible(p){return p.x>=this.camera-16&&p.x<=this.camera+56;}
 project(p){if(this.arena)return [600+(p.x-p.y-3)*Math.SQRT1_2*16,270+((p.x+p.y-21)/Math.sqrt(6)-p.z*Math.sqrt(2/3))*16];const x=p.x-this.camera;return [this.x+(x-p.y*.64)*this.scale,this.y+(x*.20+p.y*.72-p.z)*this.scale];}
 face(vertices,color){const a=vertices[0],b=vertices[1],c=vertices[2],u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};const n={x:u.y*v.z-u.z*v.y,y:u.z*v.x-u.x*v.z,z:u.x*v.y-u.y*v.x},len=Math.hypot(n.x,n.y,n.z)||1,light=.60+.40*Math.abs((n.x*.3-n.y*.4+n.z*.86)/len);const rgb=color.match(/\w\w/g).map(h=>Math.min(255,Math.round(parseInt(h,16)*light)));this.faces.push({vertices,color:`rgb(${rgb})`,depth:vertices.reduce((sum,p)=>sum+p.x*.2+p.y*.72+p.z*.15,0)/vertices.length});}
 ellipsoid(x,y,z,rx,ry,rz,color){if(!this.visible({x}))return;const rings=5,sides=8;const point=(r,s)=>{const a=Math.PI*r/rings,b=Math.PI*2*s/sides;return {x:x+rx*Math.sin(a)*Math.cos(b),y:y+ry*Math.sin(a)*Math.sin(b),z:z+rz*Math.cos(a)};};for(let r=0;r<rings;r++)for(let s=0;s<sides;s++)this.face([point(r,s),point(r+1,s),point(r+1,s+1),point(r,s+1)],color);}
 tube(a,b,r,color){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;const point=(p,i)=>{const angle=i*Math.PI/4;return {x:p.x-dy/d*r*Math.cos(angle),y:p.y+dx/d*r*Math.cos(angle),z:p.z+r*Math.sin(angle)};};for(let i=0;i<8;i++)this.face([point(a,i),point(b,i),point(b,i+1),point(a,i+1)],color);}
 box(x,y,z,w,h,d,color){const p=[{x,y,z},{x:x+w,y,z},{x:x+w,y:y+h,z},{x,y:y+h,z}];const top=p.map(v=>({...v,z:z+d}));this.face(top,color);for(let i=0;i<4;i++)this.face([p[i],p[(i+1)%4],top[(i+1)%4],top[i]],color);}
 flush(){this.faces.sort((a,b)=>a.depth-b.depth);for(const f of this.faces){const p=f.vertices.map(v=>this.project(v));this.ctx.fillStyle=f.color;this.ctx.beginPath();this.ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)this.ctx.lineTo(...p[i]);this.ctx.closePath();this.ctx.fill();}this.faces.length=0;}
};
