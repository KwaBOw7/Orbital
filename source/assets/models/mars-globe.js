/* Original synthetic Mars globe; color and relief are decorative, not MOLA or other elevation data. */
function marsGlobeScene(view,renderer,canvas){
 const life=orbitalSceneRuntime(view,renderer,canvas),scene=life.track(new THREE.Scene());
 try{
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new THREE.PerspectiveCamera(38,life.width()/life.height(),.1,80);camera.position.z=14;
  scene.add(new THREE.HemisphereLight(0xe5c4a8,0x3a211a,.6));const sun=new THREE.DirectionalLight(0xffe6cc,1.8);sun.position.set(8,5,7);scene.add(sun);
  const geo=new THREE.SphereGeometry(4.5,renderer.isCanvasFallback?56:112,renderer.isCanvasFallback?36:72),p=geo.attributes.position,base=new Float32Array(p.count*3),colors=new Float32Array(p.count*3);
  const hash=(x,y,z)=>{const q=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return q-Math.floor(q);};
  const elevation=v=>(.55*hash(Math.round(v.x*17),Math.round(v.y*17),Math.round(v.z*17))+.3*hash(Math.round(v.x*43),Math.round(v.y*43),Math.round(v.z*43))+.15*hash(Math.round(v.x*89),Math.round(v.y*89),Math.round(v.z*89))-.5)*.12;
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize(),h=elevation(v),j=3*i;base.set([v.x,v.y,v.z],j);const tint=Math.max(0,Math.min(1,.5+h*4));colors.set([.43+tint*.28,.19+tint*.17,.11+tint*.1],j);p.setXYZ(i,v.x*(4.5+h),v.y*(4.5+h),v.z*(4.5+h));}
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.userData.base=base;geo.userData.elevation=elevation;geo.computeVertexNormals();const mars=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}));scene.add(mars);
  const pins=new THREE.Group();scene.add(pins);for(const [name,lat,lon] of [['Jezero training site',18.4,77.5],['Gale reference region',-5.4,137.8],['Hellas region',-42.4,70.5]]){const a=lat*Math.PI/180,b=lon*Math.PI/180,v=new THREE.Vector3(Math.cos(a)*Math.cos(b),Math.sin(a),-Math.cos(a)*Math.sin(b)).multiplyScalar(4.62),pin=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:0xffd45c}));pin.position.copy(v);pin.userData.label=name;pins.add(pin);}
  let exaggerated=false,spin=true,yaw=.5,pitch=.2,distance=14,drag=null;const relief=view.querySelector('#bRelief'),pinButton=view.querySelector('#bPins'),spinButton=view.querySelector('#bSpin');
  if(relief)life.on(relief,'click',()=>{exaggerated=!exaggerated;relief.setAttribute('aria-pressed',String(exaggerated));for(let i=0;i<p.count;i++){const j=3*i,v=new THREE.Vector3(base[j],base[j+1],base[j+2]),r=4.5+geo.userData.elevation(v)*(exaggerated?4:1);p.setXYZ(i,v.x*r,v.y*r,v.z*r);}p.needsUpdate=true;geo.computeVertexNormals();});
  if(pinButton)life.on(pinButton,'click',()=>{const on=pinButton.getAttribute('aria-pressed')!=='true';pinButton.setAttribute('aria-pressed',String(on));pins.visible=on;});
  if(spinButton)life.on(spinButton,'click',()=>{spin=spinButton.getAttribute('aria-pressed')!=='true';spinButton.setAttribute('aria-pressed',String(spin));});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)spin=false;
  life.on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});life.on(canvas,'pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-1.2,1.2);drag={x:e.clientX,y:e.clientY};});life.on(canvas,'pointerup',e=>{if(drag&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4)view.querySelector('#info').textContent='Synthetic Mars training globe. Pins are illustrative reference labels, not a measured geographic product.';drag=null;});life.on(canvas,'pointercancel',()=>drag=null);life.on(canvas,'wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),7,24);},{passive:false});
  life.resize(()=>{camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();renderer.setSize(life.width(),life.height(),false);});
  function draw(){if(spin&&!drag&&!matchMedia('(prefers-reduced-motion: reduce)').matches)yaw+=.001;mars.rotation.set(pitch,yaw,0);pins.rotation.copy(mars.rotation);camera.position.z=distance;camera.lookAt(0,0,0);renderer.render(scene,camera);renderer.render(scene,camera);life.frame(draw);}draw();return life.stop;
 }catch(error){life.stop();throw error;}
}
