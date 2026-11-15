/* Procedural artwork adapted from supplied 3D Earth.html. */
const OrbitalEarth=(()=>{
// ---- continent outlines (lon,lat), coarse ----
const LAND=[
"-168,66 -156,71 -125,70 -95,72 -80,63 -62,58 -56,50 -66,44 -76,36 -81,30 -80,25 -90,30 -97,26 -97,20 -88,21 -88,16 -83,10 -78,8 -80,8 -86,13 -95,16 -105,22 -112,30 -115,32 -120,34 -124,40 -124,48 -135,58 -150,60 -165,60",
"-55,60 -44,60 -20,70 -20,82 -60,82 -70,76 -55,68",
"-78,8 -62,11 -52,5 -35,-6 -40,-22 -48,-26 -58,-38 -65,-42 -68,-52 -74,-52 -73,-40 -71,-20 -76,-14 -81,-5 -78,2",
"-10,36 -9,43 -2,44 -5,48 2,51 8,54 10,58 5,62 15,69 30,71 40,67 30,60 28,55 38,47 28,41 23,37 18,40 12,44 8,44 3,43 -1,37",
"-17,21 -10,35 10,37 32,31 35,28 43,12 51,12 40,-3 40,-15 33,-26 20,-35 14,-22 12,-5 9,4 -8,4 -17,14",
"28,41 36,36 35,30 43,13 52,16 58,23 57,26 67,25 73,20 77,8 80,15 90,22 98,16 100,3 104,1 109,12 106,20 122,30 122,40 135,44 141,52 160,60 180,66 180,69 140,72 110,77 80,73 60,69 40,67 30,60 28,55 38,47",
"114,-22 130,-12 142,-11 146,-19 153,-27 150,-37 140,-38 130,-32 115,-34",
"-180,-90 180,-90 180,-72 90,-67 0,-70 -90,-73 -180,-72",
"-5,50 1,51 -2,58 -6,56","130,31 140,36 142,43 140,41 133,35","95,5 105,-6 120,-9 140,-8 130,-1 110,-3","44,-25 50,-15 47,-13","-9,52 -6,55 -6,52","172,-41 178,-38 174,-35 168,-46","105,-6 114,-8 106,-7"
];
const h=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)};
const vn=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return h(i,j)*(1-u)*(1-v)+h(i+1,j)*u*(1-v)+h(i,j+1)*(1-u)*v+h(i+1,j+1)*u*v};
const fbm=(x,y)=>vn(x,y)*.55+vn(x*2.1,y*2.1)*.3+vn(x*4.3,y*4.3)*.15;

function makeEarth(){
  const W=768,H=384,mk=()=>{const k=document.createElement('canvas');k.width=W;k.height=H;return k};
  const m=mk(),mc=m.getContext('2d');mc.fillStyle='#000';mc.fillRect(0,0,W,H);mc.fillStyle='#fff';
  for(const s of LAND){const p=s.split(' ').map(q=>q.split(',').map(Number));mc.beginPath();
    p.forEach(([lo,la],i)=>{const x=(lo+180)/360*W,y=(90-la)/180*H;i?mc.lineTo(x,y):mc.moveTo(x,y)});mc.closePath();mc.fill()}
  const md=mc.getImageData(0,0,W,H).data,t=mk(),c=t.getContext('2d'),im=c.createImageData(W,H),d=im.data;
  for(let y=0;y<H;y++){const al=Math.abs(90-y/H*180);
    for(let x=0;x<W;x++){
      const xx=Math.min(W-1,Math.max(0,(x+(fbm(x/32,y/32)-.5)*14)|0)),yy=Math.min(H-1,Math.max(0,(y+(fbm(x/32+50,y/32)-.5)*14)|0));
      const n=fbm(x/48,y/48);let r,g,b;
      if(md[(yy*W+xx)*4]>127){
        const dry=Math.max(0,1-Math.abs(al-25)/14)*(.4+n),wet=Math.max(0,1-al/12);
        r=68+dry*135+n*30-wet*22;g=108+dry*68-n*10+wet*8;b=52+dry*32;
        if(al>63+n*8)r=g=b=222+n*30;
      }else{const s=n*20;r=8+s;g=46+s*1.5;b=100+s*2;if(al>77+n*5)r=g=b=205}
      const k=(y*W+x)*4;d[k]=r;d[k+1]=g;d[k+2]=b;d[k+3]=255}}
  c.putImageData(im,0,0);return t;
}
function makeClouds(){
  const W=512,H=256,k=document.createElement('canvas');k.width=W;k.height=H;const c=k.getContext('2d'),im=c.createImageData(W,H),d=im.data;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=fbm(x/55,y/38+9)*.8+fbm(x/20,y/20)*.2,a=Math.max(0,(v-.52)*3.4);const i=(y*W+x)*4;d[i]=d[i+1]=d[i+2]=255;d[i+3]=Math.min(235,a*255)}
  c.putImageData(im,0,0);return k;
}


let surface,cloud;return {surface:()=>surface??=makeEarth(),clouds:()=>cloud??=makeClouds()};
})();
