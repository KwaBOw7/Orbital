/* Original generic optical observatory illustration; not Hubble or any flown spacecraft. */
function spaceObservatoryScene(view,renderer,canvas){
 const life=orbitalSceneRuntime(view,renderer,canvas),scene=life.track(new THREE.Scene());
 try{
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new THREE.PerspectiveCamera(40,life.width()/life.height(),.1,300);camera.position.set(10,7,14);
  scene.add(new THREE.HemisphereLight(0xcbdcff,0x192333,.85));const key=new THREE.DirectionalLight(0xffefcf,1.45);key.position.set(10,12,14);scene.add(key);
  const mat=(color,metalness=.45,roughness=.4)=>new THREE.MeshStandardMaterial({color,metalness,roughness}),white=mat(0xd9e0e8,.62,.32),gold=mat(0xb78a48,.65,.36),dark=mat(0x273648,.55,.46),panel=mat(0x17366d,.55,.32),glass=new THREE.MeshStandardMaterial({color:0x4a82bd,metalness:.65,roughness:.18,side:THREE.DoubleSide});
  const group=new THREE.Group();scene.add(group);const add=(geo,material,x,y,z)=>{const mesh=new THREE.Mesh(geo,material);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
  const tube=add(new THREE.CylinderGeometry(1.05,1.2,5,32,1,true),white,0,0,0);tube.rotation.z=Math.PI/2;
  const front=add(new THREE.CylinderGeometry(1.25,1.25,.18,32),gold,2.5,0,0);front.rotation.z=Math.PI/2;
  const aperture=add(new THREE.CircleGeometry(1.05,36),glass,2.62,0,0);aperture.rotation.y=Math.PI/2;
  const rear=add(new THREE.CylinderGeometry(1,1,.2,32),dark,-2.55,0,0);rear.rotation.z=Math.PI/2;
  add(new THREE.BoxGeometry(1.4,1.9,1.6),dark,-.2,-1.2,0);
  for(const side of [-1,1]){const boom=add(new THREE.CylinderGeometry(.05,.05,3.4,8),gold,-.1,side*1.7,0);boom.rotation.x=Math.PI/2;add(new THREE.BoxGeometry(2.4,.08,2.9),panel,-.1,side*3.3,0);for(let j=-1;j<=1;j++)add(new THREE.BoxGeometry(2.4,.09,.035),white,-.1,side*3.3,j*.72);}
  const antenna=add(new THREE.SphereGeometry(.45,20,12,0,Math.PI*2,0,Math.PI/2),white,-1.1,-1.3,1.25);antenna.rotation.x=Math.PI;
  let yaw=.65,pitch=1.2,distance=15,auto=true,drag=null;const spin=view.querySelector('#bSpin');if(spin)life.on(spin,'click',()=>{auto=spin.getAttribute('aria-pressed')==='true';});
  life.on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});life.on(canvas,'pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.008;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.008,.2,2.8);drag={x:e.clientX,y:e.clientY};});life.on(canvas,'pointerup',()=>drag=null);life.on(canvas,'pointercancel',()=>drag=null);life.on(canvas,'wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),8,34);},{passive:false});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)auto=false;
  life.resize(()=>{camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();renderer.setSize(life.width(),life.height(),false);});
  function draw(){if(auto&&!drag&&!matchMedia('(prefers-reduced-motion: reduce)').matches)yaw+=.001;camera.position.set(distance*Math.sin(pitch)*Math.sin(yaw),distance*Math.cos(pitch),distance*Math.sin(pitch)*Math.cos(yaw));camera.lookAt(0,0,0);renderer.render(scene,camera);renderer.render(scene,camera);life.frame(draw);}draw();return life.stop;
 }catch(error){life.stop();throw error;}
}
