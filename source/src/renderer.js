/* Small shared box renderer. Painter-sorted faces, one canvas; simulation never depends on frames. */
window.OrbitalView=(function(){
 let canvas,ctx,raf,angle=-.55,tilt=-.28,zoom=1,explode=false,wire=false,selected='radar',parts={},drag=false,lastX=0,lastY=0;
 const objects=[
 ['bus',[0,0,0],[1.4,1.3,1.2],'#9cabbc'],['power',[-2.15,0,0],[2.3,.07,1.15],'#1a5e9b'],['power',[2.15,0,0],[2.3,.07,1.15],'#1a5e9b'],
 ['adcs',[0,.85,0],[.65,.4,.6],'#6e8ba2'],['computer',[.78,.1,0],[.18,.6,.55],'#36536a'],['comm',[0,1.22,0],[.09,.6,.09],'#a9bfd0'],['comm',[0,1.55,0],[.55,.1,.5],'#e3eaf0'],
 ['thermal',[0,0,.62],[1.05,.9,.08],'#a89462'],['propulsion',[0,-.85,0],[.5,.4,.5],'#4f6479'],['radar',[0,-1.05,.5],[1.65,.14,.75],'#526f8f'],
 ['battery',[-.8,.35,.1],[.3,.5,.5],'#597b8e'],['antenna',[.6,1.1,0],[.75,.08,.75],'#c4d9e8'],['compression',[.1,.2,-.7],[.4,.3,.2],'#4c7484']];
 const faceIndices=[[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[1,5,6,2],[0,3,7,4]];
 function attach(c,p,s){if(raf)cancelAnimationFrame(raf);canvas=c;ctx=c.getContext('2d');parts=p;selected=s;const ro=new ResizeObserver(()=>draw());ro.observe(c);c._observer=ro;
 c.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;c.setPointerCapture(e.pointerId);};c.onpointerup=()=>drag=false;c.onpointercancel=()=>drag=false;c.onpointermove=e=>{if(!drag)return;angle+=(e.clientX-lastX)*.009;tilt=Math.max(-.9,Math.min(.8,tilt+(e.clientY-lastY)*.006));lastX=e.clientX;lastY=e.clientY;draw();};draw();}
 function detach(){if(canvas?._observer)canvas._observer.disconnect();if(raf)cancelAnimationFrame(raf);canvas=null;}
 function rotate(v){let [x,y,z]=v;const a=x*Math.cos(angle)-z*Math.sin(angle),b=x*Math.sin(angle)+z*Math.cos(angle);return [a,y*Math.cos(tilt)-b*Math.sin(tilt),y*Math.sin(tilt)+b*Math.cos(tilt)];}
 function shade(hex,f){return '#'+hex.slice(1).match(/../g).map(x=>Math.min(255,Math.round(parseInt(x,16)*f)).toString(16).padStart(2,'0')).join('');}
 function draw(){if(!canvas||!canvas.isConnected)return;const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=rect.width*dpr;canvas.height=rect.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);let w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);
 for(let i=0;i<125;i++){const x=((i*127.41+17)%997)/997*w,y=((i*91.73+27)%643)/643*h;ctx.fillStyle=i%9===0?'#88aac0aa':'#6991ac55';ctx.fillRect(x,y,i%9===0?1.5:1,1);}
 ctx.save();ctx.translate(w/2,h*.77);ctx.scale(1,.24);ctx.strokeStyle='#24587a55';for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(0,0,40*i,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(-w,0);ctx.lineTo(w,0);ctx.moveTo(0,-w);ctx.lineTo(0,w);ctx.stroke();ctx.restore();
 const scale=Math.min(w/8.8,h/5.6)*zoom,project=v=>[w/2+v[0]*scale*(1+v[2]*.035),h*.48-v[1]*scale*(1+v[2]*.035)];let faces=[];
 for(const [id,base,size,color] of objects){if(parts[id]===undefined)continue;let c=[...base];if(explode&&id!=='bus')c=c.map(v=>v*1.55);const tier=1+parts[id]*.08;const [a,b,d]=size.map(v=>v*tier/2);const points=[[-a,-b,-d],[a,-b,-d],[a,b,-d],[-a,b,-d],[-a,-b,d],[a,-b,d],[a,b,d],[-a,b,d]].map(v=>rotate(v.map((q,i)=>q+c[i])));
 faceIndices.forEach((fi,i)=>{const verts=fi.map(n=>points[n]);faces.push({id,verts,z:verts.reduce((s,v)=>s+v[2],0)/4,color:shade(color,[.65,.9,.72,1.12,.86,.55][i]),solar:id==='power'&&(i===2||i===3)});});}
 faces.sort((a,b)=>a.z-b.z);for(const f of faces){let pts=f.verts.map(project);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=wire?'#06152544':f.color;ctx.fill();ctx.strokeStyle=f.id===selected?'#6edbff':'#9dbdd555';ctx.lineWidth=f.id===selected?1.4:.7;ctx.stroke();if(f.solar){ctx.save();ctx.clip();ctx.strokeStyle='#72afe277';ctx.lineWidth=.5;for(let t=1;t<10;t++){let u=t/10;ctx.beginPath();ctx.moveTo(pts[0][0]+(pts[1][0]-pts[0][0])*u,pts[0][1]+(pts[1][1]-pts[0][1])*u);ctx.lineTo(pts[3][0]+(pts[2][0]-pts[3][0])*u,pts[3][1]+(pts[2][1]-pts[3][1])*u);ctx.stroke();}for(let t=1;t<5;t++){let u=t/5;ctx.beginPath();ctx.moveTo(pts[0][0]+(pts[3][0]-pts[0][0])*u,pts[0][1]+(pts[3][1]-pts[0][1])*u);ctx.lineTo(pts[1][0]+(pts[2][0]-pts[1][0])*u,pts[1][1]+(pts[2][1]-pts[1][1])*u);ctx.stroke();}ctx.restore();}}
 }
 function action(a){if(a==='explode')explode=!explode;if(a==='wire')wire=!wire;if(a==='reset'){angle=-.55;tilt=-.28;zoom=1;explode=false;wire=false;}if(a==='zoom')zoom=zoom>=1.4?.8:zoom+.2;draw();return {explode,wire};}
 return {attach,detach,action};
})();
