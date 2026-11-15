/* Original generic multistage launch-vehicle illustration. No vendor design or flight specification is represented. */
function rocketScene(view,renderer,canvas){
 const life=orbitalSceneRuntime(view,renderer,canvas),scene=life.track(new THREE.Scene());
 try{
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new THREE.PerspectiveCamera(40,life.width()/life.height(),.1,100);camera.position.set(7,6,10);
  scene.add(new THREE.HemisphereLight(0xd7e5ff,0x263043,.85));const key=new THREE.DirectionalLight(0xfff0d7,1.6);key.position.set(5,10,8);scene.add(key);
  const white=new THREE.MeshStandardMaterial({color:0xe7edf4,metalness:.3,roughness:.42}),dark=new THREE.MeshStandardMaterial({color:0x333c49,metalness:.55,roughness:.48}),accent=new THREE.MeshStandardMaterial({color:0xe55e3f,metalness:.35,roughness:.5}),metal=new THREE.MeshStandardMaterial({color:0x8795a5,metalness:.75,roughness:.32}),flameMat=new THREE.MeshBasicMaterial({color:0x63c8ff,transparent:true,opacity:.8});
  const rocket=new THREE.Group();scene.add(rocket);const parts={};const part=(name)=>{const group=new THREE.Group();rocket.add(group);parts[name]=group;return group;},add=(g,geo,material,x=0,y=0,z=0)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);g.add(mesh);return mesh;};
  const lower=part('lower');add(lower,new THREE.CylinderGeometry(.82,.9,4.1,28),white,0,2.1,0);add(lower,new THREE.CylinderGeometry(.91,.91,.35,28),accent,0,.72,0);add(lower,new THREE.CylinderGeometry(.9,.9,.1,28),dark,0,4.15,0);
  const upper=part('upper');add(upper,new THREE.CylinderGeometry(.64,.82,2.2,28),white,0,5.2,0);add(upper,new THREE.CylinderGeometry(.65,.65,1.25,28),accent,0,6.88,0);
  const fairing=part('fairing');add(fairing,new THREE.ConeGeometry(.65,1.65,28),white,0,8.35,0);add(fairing,new THREE.CylinderGeometry(.25,.25,.65,18),dark,0,7.8,0);
  const engines=part('engines');for(let i=0;i<4;i++){const a=i*Math.PI/2,nozzle=add(engines,new THREE.ConeGeometry(.23,.7,14),metal,Math.cos(a)*.4,-.35,Math.sin(a)*.4);nozzle.rotation.x=Math.PI;}
  const fins=part('fins');for(let i=0;i<4;i++){const a=i*Math.PI/2,fin=add(fins,new THREE.BoxGeometry(.12,1.15,.65),accent,Math.cos(a)*.78,.55,Math.sin(a)*.78);fin.rotation.y=-a;}
  const flame=new THREE.Mesh(new THREE.ConeGeometry(.46,1.9,18),flameMat);flame.position.y=-1.2;flame.visible=false;rocket.add(flame);
  let yaw=.55,pitch=.12,distance=11,spin=true,exploded=false,drag=null;const bLaunch=view.querySelector('#bLaunch'),bExplode=view.querySelector('#bExplode'),bSpin=view.querySelector('#bSpin');
  if(bLaunch)life.on(bLaunch,'click',()=>{const on=bLaunch.getAttribute('aria-pressed')!=='true';bLaunch.setAttribute('aria-pressed',String(on));flame.visible=on;});
  if(bExplode)life.on(bExplode,'click',()=>{exploded=!exploded;bExplode.setAttribute('aria-pressed',String(exploded));const offsets={lower:[-1,0,0],upper:[1,0,0],fairing:[0,1,0],engines:[0,-1,0],fins:[0,0,1]};for(const [name,g] of Object.entries(parts)){const o=offsets[name]||[0,0,0];g.userData.target.set(...(exploded?o:[0,0,0]));}});
  if(bSpin)life.on(bSpin,'click',()=>{spin=bSpin.getAttribute('aria-pressed')!=='true';bSpin.setAttribute('aria-pressed',String(spin));});
  for(const g of Object.values(parts)){g.userData.target=new THREE.Vector3();}
  life.on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});life.on(canvas,'pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-.5,1.2);drag={x:e.clientX,y:e.clientY};});life.on(canvas,'pointerup',()=>drag=null);life.on(canvas,'pointercancel',()=>drag=null);life.on(canvas,'wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),7,24);},{passive:false});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)spin=false;
  life.resize(()=>{camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();renderer.setSize(life.width(),life.height(),false);});
  function draw(){if(spin&&!drag&&!matchMedia('(prefers-reduced-motion: reduce)').matches)yaw+=.0012;for(const g of Object.values(parts))g.position.lerp(g.userData.target,.12);camera.position.set(Math.sin(yaw)*distance,4+Math.sin(pitch)*distance,Math.cos(yaw)*distance);camera.lookAt(0,4.1,0);renderer.render(scene,camera);renderer.render(scene,camera);life.frame(draw);}draw();return life.stop;
 }catch(error){life.stop();throw error;}
}
