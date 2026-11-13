# Technical atlas inspection: reads alpha bounds; never modifies the generated art.
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class StoryAtlasInspector {
 public static int[][] Scan(string path,int columns,int rows,bool dominant,bool rawGrid) {
  using(var image=new Bitmap(path)) {
   var rectangle=new Rectangle(0,0,image.Width,image.Height);
   var data=image.LockBits(rectangle,ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
   try {
    var bytes=new byte[Math.Abs(data.Stride)*image.Height];Marshal.Copy(data.Scan0,bytes,0,bytes.Length);
    var result=new int[columns*rows][];
    for(int cell=0;cell<result.Length;cell++) {
     int left=cell%columns*image.Width/columns,top=cell/columns*image.Height/rows;
     int right=(cell%columns+1)*image.Width/columns,bottom=(cell/columns+1)*image.Height/rows;
     if(rawGrid){result[cell]=new int[]{left,top,right-left,bottom-top};continue;}
     int x0=right,y0=bottom,x1=left,y1=top;
     for(int y=top;y<bottom;y++)for(int x=left;x<right;x++)if(bytes[y*data.Stride+x*4+3]>48){x0=Math.Min(x0,x);y0=Math.Min(y0,y);x1=Math.Max(x1,x);y1=Math.Max(y1,y);}
     // Ignore isolated antialias specks or a neighboring part intruding across a grid gutter.
     if(dominant){
      int width=right-left,height=bottom-top,best=0;var seen=new bool[width*height];var queue=new int[seen.Length];
      for(int pixel=0;pixel<seen.Length;pixel++){
       if(seen[pixel])continue;int px=left+pixel%width,py=top+pixel/width;
       if(bytes[py*data.Stride+px*4+3]<180)continue;
       int read=0,write=1,bx0=px,bx1=px,by0=py,by1=py;queue[0]=pixel;seen[pixel]=true;
       while(read<write){int at=queue[read++],xx=at%width,yy=at/width;bx0=Math.Min(bx0,left+xx);bx1=Math.Max(bx1,left+xx);by0=Math.Min(by0,top+yy);by1=Math.Max(by1,top+yy);
        for(int dy=-1;dy<=1;dy++)for(int dx=-1;dx<=1;dx++){int nx=xx+dx,ny=yy+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;int next=ny*width+nx;if(seen[next]||bytes[(top+ny)*data.Stride+(left+nx)*4+3]<180)continue;seen[next]=true;queue[write++]=next;}
       }
       if(write>best){best=write;x0=Math.Max(left,bx0-2);x1=Math.Min(right-1,bx1+2);y0=Math.Max(top,by0-2);y1=Math.Min(bottom-1,by1+2);}
      }
     }
     if(x1<x0||y1<y0)throw new Exception("Empty sprite cell "+cell+" in "+path);
     result[cell]=new int[]{x0,y0,x1-x0+1,y1-y0+1};
    }
    return result;
   } finally {image.UnlockBits(data);}
  }
 }
}
'@
$workspace=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$artRoot=Join-Path $workspace 'boitata/assets/story2d'
$manifest=[ordered]@{}
foreach($name in @('iara','boitata','cuca','loira','virus','foliage','iara-swim')){
 $rows=if($name -in @('iara','boitata')){4}elseif($name -in @('cuca','loira','iara-swim')){3}else{2}
 $file=Join-Path $artRoot ($name+'-atlas.png')
 $cells=[StoryAtlasInspector]::Scan($file,4,$rows,($name -notin @('virus','foliage','iara-swim')),($name -eq 'iara-swim'))
 $manifest[$name+'-atlas']=@{cells=@($cells | ForEach-Object {@{x=$_[0];y=$_[1];w=$_[2];h=$_[3]}})}
}
$json=$manifest | ConvertTo-Json -Depth 7 -Compress
[IO.File]::WriteAllText((Join-Path $workspace 'boitata/js/storyAtlasBounds.js'),'/* Alpha bounds of the original painted PNG cells. */'+[Environment]::NewLine+'Boitata.StoryAtlasBounds='+$json+';'+[Environment]::NewLine,[Text.UTF8Encoding]::new($false))
$manifest.Keys | ForEach-Object { [pscustomobject]@{Atlas=$_;Sprites=$manifest[$_].cells.Count} }
