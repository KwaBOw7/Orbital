// Terrain functions adapted from the supplied Mars Mountain View.html.
function createMarsTerrainHeight(){
function sm(a,b,x){var t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
function hs(x,y){var s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)}
function vn(x,y){var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;xf=xf*xf*(3-2*xf);yf=yf*yf*(3-2*yf);
var a=hs(xi,yi),b=hs(xi+1,yi),c=hs(xi,yi+1),d=hs(xi+1,yi+1);return a+(b-a)*xf+(c-a)*yf+(a-b-c+d)*xf*yf}
function fbm(x,y,o){var a=.5,s=0;for(var i=0;i<o;i++){s+=a*vn(x,y);x=x*2.07+17.3;y=y*2.07+9.1;a*=.5}return s/(1-Math.pow(.5,o))}
function rg(x,y,o){var a=.5,s=0;for(var i=0;i<o;i++){var n=1-Math.abs(vn(x,y)*2-1);s+=a*n*n;x=x*2.07+17.3;y=y*2.07+9.1;a*=.5}return s/(1-Math.pow(.5,o))}
var seed=11;function rnd(){seed=(seed+0x6D2B79F5)|0;var t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}
var C=[];for(var i=0;i<70;i++)C.push([(rnd()-.5)*3400,(rnd()-.5)*3400,25+Math.pow(rnd(),2.5)*230]);
function HT(x,z){
var e=sm(2000,1500,Math.hypot(x,z)),m=sm(300,-750,z),r=rg(x*.0011+3,z*.0011+9,5);
var h=m*(110+430*r*r)+(fbm(x*.0025+20,z*.0025+4,4)-.5)*60*(1-m*.4)+(fbm(x*.012,z*.03,3)-.5)*10*(1-m);
for(var i=0;i<C.length;i++){var c=C[i],dx=x-c[0],dz=z-c[1],d2=dx*dx+dz*dz,rr=c[2];if(d2>4*rr*rr)continue;
var q=Math.sqrt(d2)/rr;if(q<1)h-=.14*rr*(1-q*q);h+=.035*rr*Math.exp(-Math.pow((q-1)/.22,2))}
return h*e}


return HT;
}
