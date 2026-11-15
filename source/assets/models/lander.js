/* Original schematic four-leg lunar lander; not a flown spacecraft replica. */
function landerScene(view,renderer,canvas){
 const life=orbitalSceneRuntime(view,renderer,canvas),scene=life.track(new THREE.Scene());
 try{
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const camera=new THREE.PerspectiveCamera(42,life.width()/life.height(),.1,100);camera.position.set(7,6,9);
  scene.add(new THREE.HemisphereLight(0xb9cbe0,0x3b3026,.8));const light=new THREE.DirectionalLight(0xffebcf,1.7);light.position.set(7,10,8);scene.add(light);
  const craft=new THREE.Group();scene.add(craft);const gold=new THREE.MeshStandardMaterial({color:0xc89b51,metalness:.48,roughness:.46}),white=new THREE.MeshStandardMaterial({color:0xd8dde2,metalness:.38,roughness:.5}),dark=new THREE.MeshStandardMaterial({color:0x38414d,metalness:.5,roughness:.5}),glass=new THREE.MeshStandardMaterial({color:0x4e8cb5,metalness:.6,roughness:.22});
  const add=(geo,mat,x,y,z)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);craft.add(o);return o;};
  add(new THREE.CylinderGeometry(.8,1.05,1.1,8),gold,0,2.4,0);add(new THREE.CylinderGeometry(.35,.45,.55,8),white,0,3.22,0);add(new THREE.SphereGeometry(.24,18,12),glass,0,3.65,0);add(new THREE.CylinderGeometry(.45,.62,.25,8),dark,0,1.72,0);
  for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.cos(a),z=Math.sin(a),leg=add(new THREE.CylinderGeometry(.045,.065,1.65,8),white,x*.73,1.05,z*.73);leg.rotation.z=x*.34;leg.rotation.x=-z*.34;add(new THREE.CylinderGeometry(.17,.17,.09,12),dark,x*1.04,.18,z*1.04);add(new THREE.BoxGeometry(.43,.5,.08),gold,x*.96,2.35,z*.96).rotation.y=-a;}
  const flame=add(new THREE.ConeGeometry(.24,.95,16),new THREE.MeshBasicMaterial({color:0x70caff,transparent:true,opacity:.8}),0,1,0);flame.rotation.z=Math.PI;flame.visible=false;
  const button=view.querySelector('#fire');if(button)life.on(button,'click',()=>{const on=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(on));flame.visible=on;craft.position.y=on?1.2:0;});
  let yaw=.6,pitch=.25,distance=10,drag=null;life.on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});life.on(canvas,'pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-.6,1.1);drag={x:e.clientX,y:e.clientY};});life.on(canvas,'pointerup',()=>drag=null);life.on(canvas,'pointercancel',()=>drag=null);life.on(canvas,'wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),6,18);},{passive:false});
  life.resize(()=>{camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();renderer.setSize(life.width(),life.height(),false);});
  function draw(){camera.position.set(Math.sin(yaw)*distance*Math.cos(pitch),3+Math.sin(pitch)*distance,Math.cos(yaw)*distance*Math.cos(pitch));camera.lookAt(0,1.7,0);renderer.render(scene,camera);renderer.render(scene,camera);life.frame(draw);}draw();return life.stop;
 }catch(error){life.stop();throw error;}
}
