/* Original deterministic procedural illustration. This is not geographic imagery. */
const OrbitalEarth = (() => {
  const fract = x => x - Math.floor(x);
  const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
  function noise(x, y) {
    const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy;
    const u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
    const a=hash(ix,iy), b=hash(ix+1,iy), c=hash(ix,iy+1), d=hash(ix+1,iy+1);
    return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
  }
  function field(x,y) { return .58*noise(x,y)+.27*noise(x*2.11+17,y*2.11-9)+.15*noise(x*4.03-31,y*4.03+23); }
  function texture(width,height,fn) {
    const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d'), pixels=ctx.createImageData(width,height);
    for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
      const [r,g,b,a=255]=fn(x,y,width,height), i=(y*width+x)*4;
      pixels.data[i]=r; pixels.data[i+1]=g; pixels.data[i+2]=b; pixels.data[i+3]=a;
    }
    ctx.putImageData(pixels,0,0); return canvas;
  }
  function surface() {
    return texture(512,256,(x,y,w,h)=>{
      const lon=x/w*Math.PI*2, lat=(.5-y/h)*Math.PI;
      const n=field(x/33,y/24), broad=field(x/77+4,y/58-8);
      const land=.62*n+.38*broad+.08*Math.sin(lon*2+Math.cos(lat*3))+.05*Math.cos(lon*5-lat*2)>.52;
      if(Math.abs(lat)>1.34)return [218,222,221];
      if(land){const dry=Math.max(0,Math.sin(lat*4+lon*1.4)*.32+n*.42);return [Math.round(47+dry*84),Math.round(96+dry*54),Math.round(49+dry*18)];}
      const depth=field(x/49+90,y/42+20); return [Math.round(7+depth*15),Math.round(39+depth*40),Math.round(94+depth*78)];
    });
  }
  function clouds() {
    return texture(384,192,(x,y)=>{const n=.7*field(x/21+45,y/13+77)+.3*field(x/8,y/7),a=Math.max(0,Math.min(190,(n-.59)*620));return [245,248,255,a];});
  }
  let map=null, cloud=null;
  return {surface:()=>map??=(surface()),clouds:()=>cloud??=(clouds())};
})();
