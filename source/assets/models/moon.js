/* Original deterministic cratered sphere illustration; relief is not measured lunar topography. */
function moonScene(view,renderer,canvas){
 const life=orbitalSceneRuntime(view,renderer,canvas),scene=life.track(new THREE.Scene());
 try{
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new THREE.PerspectiveCamera(40,life.width()/life.height(),.1,40);camera.position.z=4.2;
  scene.add(new THREE.AmbientLight(0x606779,.55));const sun=new THREE.DirectionalLight(0xfff0d9,2);sun.position.set(4,3,5);scene.add(sun);
  let seed=89341;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const craters=Array.from({length:110},()=>{const y=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-y*y);return {v:new THREE.Vector3(r*Math.cos(a),y,r*Math.sin(a)),radius:.012+rand()*.085,depth:.004+rand()*.025};});
  const geo=new THREE.SphereGeometry(1,96,64),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).normalize();let radius=1+.002*Math.sin(v.x*35+v.z*17)*Math.sin(v.y*29);for(const c of craters){const q=Math.acos(THREE.MathUtils.clamp(v.dot(c.v),-1,1))/c.radius;if(q<1.2){radius-=c.depth*Math.max(0,1-q*q);radius+=c.depth*.18*Math.exp(-(((q-1)*9)**2));}}p.setXYZ(i,v.x*radius,v.y*radius,v.z*radius);}
  p.needsUpdate=true;geo.computeVertexNormals();const moon=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x96999e,roughness:1}));scene.add(moon);
  let yaw=0,pitch=.1,distance=4.2,drag=null;life.on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});life.on(canvas,'pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-1.2,1.2);drag={x:e.clientX,y:e.clientY};});life.on(canvas,'pointerup',()=>drag=null);life.on(canvas,'pointercancel',()=>drag=null);life.on(canvas,'wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),2,8);},{passive:false});
  life.resize(()=>{camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();renderer.setSize(life.width(),life.height(),false);});
  function draw(){moon.rotation.set(pitch,yaw,0);camera.position.z=distance;camera.lookAt(0,0,0);renderer.render(scene,camera);renderer.render(scene,camera);life.frame(draw);}draw();return life.stop;
 }catch(error){life.stop();throw error;}
}
