/* Original procedural Earth illustration; no real coastlines or geographic data are used. */
function earthScene(view,renderer,canvas){
 const life=orbitalSceneRuntime(view,renderer,canvas),scene=life.track(new THREE.Scene());
 try{
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  const camera=new THREE.PerspectiveCamera(40,life.width()/life.height(),.1,30);camera.position.z=3.7;
  scene.add(new THREE.HemisphereLight(0xa8cbff,0x17243a,.8));const sun=new THREE.DirectionalLight(0xfff4df,1.6);sun.position.set(4,3,5);scene.add(sun);
  const globe=new THREE.Group();scene.add(globe);
  const map=new THREE.CanvasTexture(OrbitalEarth.surface()),cloudMap=new THREE.CanvasTexture(OrbitalEarth.clouds());
  life.track(scene);
  const earth=new THREE.Mesh(new THREE.SphereGeometry(1,72,48),new THREE.MeshStandardMaterial({map,roughness:1}));globe.add(earth);
  const clouds=new THREE.Mesh(new THREE.SphereGeometry(1.014,64,40),new THREE.MeshStandardMaterial({map:cloudMap,transparent:true,opacity:.58,depthWrite:false}));globe.add(clouds);
  globe.add(new THREE.Mesh(new THREE.SphereGeometry(1.07,48,32),new THREE.MeshBasicMaterial({color:0x5baeff,transparent:true,opacity:.13,side:THREE.BackSide})));
  const state={spin:true,clouds:true,night:false,yaw:0,pitch:.12,zoom:3.7,drag:null};
  const bind=(id,fn)=>{const b=view.querySelector('#'+id);if(b)life.on(b,'click',()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));fn(on);});};
  bind('bs',v=>state.spin=v);bind('bc',v=>{state.clouds=v;clouds.visible=v;});bind('bn',v=>{state.night=v;sun.intensity=v?.48:1.6;});
  bind('bi',()=>state.zoom=THREE.MathUtils.clamp(state.zoom*.82,2,6));bind('bo',()=>state.zoom=THREE.MathUtils.clamp(state.zoom*1.22,2,6));
  life.on(canvas,'pointerdown',e=>{state.drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture?.(e.pointerId);});
  life.on(canvas,'pointermove',e=>{if(!state.drag)return;state.yaw+=(e.clientX-state.drag.x)*.006;state.pitch=THREE.MathUtils.clamp(state.pitch+(e.clientY-state.drag.y)*.006,-1.2,1.2);state.drag={x:e.clientX,y:e.clientY};});
  life.on(canvas,'pointerup',e=>{if(state.drag&&Math.hypot(e.clientX-state.drag.x,e.clientY-state.drag.y)<4){const r=canvas.getBoundingClientRect(),u=(e.clientX-r.left)/Math.max(1,r.width),v=(e.clientY-r.top)/Math.max(1,r.height);view.querySelector('#info').textContent=`Illustrative globe selection: ${(90-v*180).toFixed(1)}° latitude, ${(u*360-180).toFixed(1)}° longitude. Not a geographic measurement.`;}state.drag=null;});
  life.on(canvas,'pointercancel',()=>state.drag=null);life.on(canvas,'wheel',e=>{e.preventDefault();state.zoom=THREE.MathUtils.clamp(state.zoom*Math.exp(e.deltaY*.001),2,6);},{passive:false});
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)state.spin=false;
  life.resize(()=>{camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();renderer.setSize(life.width(),life.height(),false);});
  function draw(){if(state.spin&&!state.drag&&!matchMedia('(prefers-reduced-motion: reduce)').matches)state.yaw+=.001;globe.rotation.set(state.pitch,state.yaw,0);camera.position.z+=(state.zoom-camera.position.z)*.16;camera.lookAt(0,0,0);renderer.render(scene,camera);renderer.render(scene,camera);life.frame(draw);}draw();return life.stop;
 }catch(error){life.stop();throw error;}
}
