/* Procedural illustrative SAR spacecraft. This is not a flight model or a NASA asset. */
function sarScene(view, R, cv) {
  R.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 500);
  scene.add(new THREE.HemisphereLight(0xc9dcff, 0x182333, .7));
  const key = new THREE.DirectionalLight(0xfff1d7, 1.45); key.position.set(12, 16, 10); scene.add(key);
  const rim = new THREE.DirectionalLight(0x5d95e8, .65); rim.position.set(-14, 3, -12); scene.add(rim);
  const material = (color, metalness=.4, roughness=.45, side=THREE.FrontSide) => new THREE.MeshStandardMaterial({color, metalness, roughness, side});
  const busMat=material(0xd5dce5,.72,.32), gold=material(0xb88b42,.68,.4), dark=material(0x202b38,.55,.48), panelMat=material(0x16366d,.55,.3,THREE.DoubleSide), white=material(0xe4eaf1,.4,.35), radarMat=material(0x384b63,.65,.35,THREE.DoubleSide);
  const craft = new THREE.Group(); scene.add(craft);
  const parts = {};
  const info = {
    bus:'Spacecraft bus: an illustrative structure housing avionics, power distribution and payload electronics. Dimensions and hardware are not flight-qualified.',
    radar:'SAR antenna panel: a schematic planar radar aperture. It does not represent a specific flight antenna or calibrated antenna pattern.',
    array:'Solar array: photovoltaic wing supplying spacecraft electrical power; cell efficiency and pointing are not represented by this model.',
    antenna:'Communications antenna: schematic high-gain dish for the modeled RF downlink.',
    boom:'Deployment boom: visual structural support only; no deployment dynamics or structural analysis are simulated.'
  };
  function part(name, offset) { const g=new THREE.Group();g.name=name;g.userData.rest=new THREE.Vector3();g.userData.rest.copy(g.position);g.userData.explode=new THREE.Vector3(...offset);parts[name]=g;craft.add(g);return g; }
  function add(g, mesh, key=g.name) { mesh.userData.part=key;g.add(mesh);return mesh; }
  const bus=part('bus',[0,0,0]);
  add(bus,new THREE.Mesh(new THREE.BoxGeometry(3.2,2.1,2.5),busMat));
  add(bus,new THREE.Mesh(new THREE.BoxGeometry(3.28,.12,2.58),gold)).position.y=1.06;
  add(bus,new THREE.Mesh(new THREE.BoxGeometry(2.6,.16,1.9),dark)).position.y=-1.1;
  // Schematic deployable solar wings.
  for (const side of [-1,1]) {
    const wing=part('array'+side,[side*5.5,0,0]);wing.userData.key='array';
    const support=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,4.5,12),white);support.rotation.z=Math.PI/2;support.position.x=side*3.5;add(wing,support,'boom');
    const grid=new THREE.Group();grid.position.x=side*5.1;wing.add(grid);
    const plate=new THREE.Mesh(new THREE.BoxGeometry(4.8,2.0,.08),panelMat);add(grid,plate,'array');
    for(let x=-2;x<=2;x++)add(grid,new THREE.Mesh(new THREE.BoxGeometry(.035,2.02,.1),white),'array').position.x=x*.8;
    for(let y=-1;y<=1;y++)add(grid,new THREE.Mesh(new THREE.BoxGeometry(4.82,.035,.1),white),'array').position.y=y*.65;
  }
  // SAR antenna panel, offset for an exploded view.
  const radar=part('radar',[0,4.8,0]);
  const radarPlate=new THREE.Mesh(new THREE.BoxGeometry(5.8,3.2,.16),radarMat);radarPlate.rotation.x=-.12;add(radar,radarPlate,'radar');
  for(let x=-2;x<=2;x++)add(radar,new THREE.Mesh(new THREE.BoxGeometry(.035,3.25,.19),white),'radar').position.x=x*1.12;
  for(let y=-2;y<=2;y++)add(radar,new THREE.Mesh(new THREE.BoxGeometry(5.82,.035,.19),white),'radar').position.y=y*.62;
  const antenna=part('antenna',[0,-2.8,3.8]);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1.9,16),white);mast.position.y=-.9;add(antenna,mast,'antenna');
  const dish=new THREE.Mesh(new THREE.SphereGeometry(.82,32,20,0,Math.PI*2,0,Math.PI/2),white);dish.rotation.x=-Math.PI/2;dish.position.set(0,-1.85,0);add(antenna,dish,'antenna');
  // Earth backdrop and deterministic stars.
  const earth=new THREE.Group();earth.position.set(0,-75,-25);scene.add(earth);
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(58,36,24),new THREE.MeshStandardMaterial({color:0x2862a3,roughness:.95,emissive:0x07172c})));
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(60,36,24),new THREE.MeshBasicMaterial({color:0x78baff,transparent:true,opacity:.2,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})));
  const points=[];for(let i=0;i<500;i++){const a=i*2.399963229728653,z=1-2*(i+.5)/500,r=Math.sqrt(1-z*z),d=145+(i%29)*1.7;points.push(d*r*Math.cos(a),d*z,d*r*Math.sin(a));}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:1,sizeAttenuation:false})));
  let theta=.65,phi=1.12,distance=28,auto=true,drag=false,moved=0,lx=0,ly=0,exploded=false;
  const target=new THREE.Vector3(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),el=view.querySelector('#info'),defaultInfo=el.textContent;
  function place(){camera.position.set(distance*Math.sin(phi)*Math.sin(theta),distance*Math.cos(phi),distance*Math.sin(phi)*Math.cos(theta));camera.lookAt(target);}
  cv.addEventListener('pointerdown',e=>{drag=true;moved=0;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);theta-=dx*.008;phi=Math.max(.25,Math.min(2.8,phi-dy*.008));});
  cv.addEventListener('pointerup',e=>{drag=false;if(moved<5){const rect=cv.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(craft.children,true)[0];el.textContent=hit&&hit.object.userData.part?info[hit.object.userData.part]||defaultInfo:defaultInfo;}});
  cv.addEventListener('pointercancel',()=>drag=false);
  cv.addEventListener('wheel',e=>{e.preventDefault();distance=Math.max(13,Math.min(60,distance*(1+e.deltaY*.001)));},{passive:false});
  function bind(id,fn){const b=view.querySelector('#'+id);if(!b)return;b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));fn(on);});}
  bind('bExplode',on=>exploded=on);bind('bEarth',on=>earth.visible=on);bind('bSpin',on=>auto=on);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){auto=false;const b=view.querySelector('#bSpin');if(b)b.setAttribute('aria-pressed','false');}
  function size(){const {width,height}=cv.getBoundingClientRect();R.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();}
  const observer=new ResizeObserver(size);observer.observe(cv);size();
  const clock=new THREE.Clock();let frame=0;
  function loop(){const dt=Math.min(clock.getDelta(),.05);if(auto&&!drag)theta+=dt*.2;for(const [name,g] of Object.entries(parts)){const base=g.userData.rest;const dest=exploded?g.userData.explode:base;g.position.lerp(dest,Math.min(1,dt*5));}place();R.render(scene,camera);frame=requestAnimationFrame(loop);}loop();
  return ()=>{cancelAnimationFrame(frame);observer.disconnect();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});};
}
