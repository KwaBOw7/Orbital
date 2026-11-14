/* Offline Mars terrain + the supplied rover STL. Distances are compressed for the view,
   while the mission HUD retains the practice simulation's telemetry. */
const OrbitalMars = (() => {
  let stop = null;
  let view = {yaw:0.75, pitch:0.22, distance:24};
  let roverGeometry;
  function geometry() {
    if (roverGeometry) return roverGeometry.clone();
    const bytes = Uint8Array.from(atob(ORBITAL_ROVER_STL), c => c.charCodeAt(0));
    const data = new DataView(bytes.buffer), count = data.getUint32(80, true);
    if (84 + count * 50 !== bytes.length) throw Error('Invalid rover mesh');
    const points = new Float32Array(count * 9);
    for (let i=0;i<count;i++) for(let j=0;j<9;j++) points[i*9+j]=data.getFloat32(84+i*50+12+j*4,true);
    roverGeometry = new THREE.BufferGeometry();
    roverGeometry.setAttribute('position', new THREE.BufferAttribute(points,3));
    roverGeometry.rotateX(-Math.PI/2); // STL uses Z-up; the terrain uses Y-up.
    roverGeometry.computeBoundingBox();
    const box=roverGeometry.boundingBox, center=box.getCenter(new THREE.Vector3());
    roverGeometry.translate(-center.x,-box.min.y,-center.z);
    roverGeometry.computeVertexNormals();
    return roverGeometry.clone();
  }
  function detach(){stop?.();stop=null;}
  function attach(canvas, run, landing) {
    if(!canvas)return;
    let renderer, frame, observer;
    const listeners = new AbortController();
    const on=(target,event,handler,options={})=>target.addEventListener(event,handler,{...options,signal:listeners.signal});
    const scene = new THREE.Scene();
    let software=false;
    try {
      const context=canvas.getContext('webgl2',{alpha:true,antialias:true})||canvas.getContext('webgl',{alpha:true,antialias:true});
      if(context) renderer=new THREE.WebGLRenderer({canvas,context,alpha:true,antialias:true});
      else {software=true;renderer=modelCanvasRenderer(canvas);}
      renderer.setPixelRatio(Math.min(devicePixelRatio,software?1:1.5));
      scene.fog=new THREE.FogExp2(0xc49a73,0.0011);
      scene.add(new THREE.HemisphereLight(0xffe3c0,0x70452c,1.1));
      const sun=new THREE.DirectionalLight(0xffead1,1.3);sun.position.set(-250,500,400);scene.add(sun);
      const height=createMarsTerrainHeight();
      const ground=height(0,700);
      const terrainGeometry=new THREE.PlaneGeometry(4000,4000,software?48:160,software?48:160);
      terrainGeometry.rotateX(-Math.PI/2);
      const p=terrainGeometry.attributes.position;
      const colors=new Float32Array(p.count*3);
      for(let i=0;i<p.count;i++) {
        const x=p.getX(i),z=p.getZ(i),h=height(x,z);p.setY(i,h-20*Math.max(0,1-Math.hypot(x,z-700)/200));
        const shade=0.9+Math.sin(x*.04)*Math.cos(z*.06)*.08;
        colors.set([.64*shade,.37*shade,.21*shade],i*3);
      }
      terrainGeometry.setAttribute('color',new THREE.BufferAttribute(colors,3));terrainGeometry.computeVertexNormals();
      scene.add(new THREE.Mesh(terrainGeometry,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,side:THREE.DoubleSide})));
      // Local patch gives accurate contact with the terrain beneath the wheels.
      const patch=new THREE.PlaneGeometry(500,500,software?40:80,software?40:80);patch.rotateX(-Math.PI/2);patch.translate(0,0,700);
      const pp=patch.attributes.position;
      for(let i=0;i<pp.count;i++)pp.setY(i,height(pp.getX(i),pp.getZ(i))+.03);
      patch.computeVertexNormals();scene.add(new THREE.Mesh(patch,new THREE.MeshStandardMaterial({color:0xa6683e,roughness:1,side:THREE.DoubleSide})));
      // Small boulders preserve the supplied terrain's rocky surface without external textures.
      const rockGeometry=new THREE.IcosahedronGeometry(1,0),rockMaterial=new THREE.MeshStandardMaterial({color:0x73503c,roughness:1,flatShading:true});
      for(let i=0;i<(software?55:450);i++){
        const x=Math.sin(i*127.1)*180,z=700+Math.cos(i*311.7)*160,scale=.25+(i%7)*.13;
        const rock=new THREE.Mesh(rockGeometry,rockMaterial);rock.position.set(x,height(x,z)+scale*.25,z);rock.scale.set(scale,scale*.7,scale*.9);rock.rotation.set(i,i*.7,i*.3);scene.add(rock);
      }
      const rover=new THREE.Mesh(geometry(),new THREE.MeshStandardMaterial({color:0xc3b49c,metalness:.3,roughness:.65,side:THREE.DoubleSide}));
      scene.add(rover);
      const target=new THREE.Vector3(),camera=new THREE.PerspectiveCamera(50,1,.15,6000);
      let shown=run.t,previous=performance.now(),drag=null;
      const size=()=>{const rect=canvas.getBoundingClientRect();renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();};
      observer=new ResizeObserver(size);observer.observe(canvas);size();
      const constrain=()=>{view.pitch=THREE.MathUtils.clamp(view.pitch,.03,1.3);view.distance=THREE.MathUtils.clamp(view.distance,9,100);};
      const action=key=>{if(key==='left')view.yaw-=.2;if(key==='right')view.yaw+=.2;if(key==='in')view.distance*=.82;if(key==='out')view.distance*=1.22;if(key==='reset')view={yaw:.75,pitch:.22,distance:24};constrain();};
      canvas.parentElement.querySelectorAll('[data-camera]').forEach(b=>on(b,'click',()=>action(b.dataset.camera)));
      on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
      on(canvas,'pointermove',e=>{if(!drag)return;view.yaw-=(e.clientX-drag.x)*.007;view.pitch+=(e.clientY-drag.y)*.005;drag={x:e.clientX,y:e.clientY};constrain();});
      on(canvas,'pointerup',()=>drag=null);on(canvas,'pointercancel',()=>drag=null);
      on(canvas,'wheel',e=>{e.preventDefault();view.distance*=Math.exp(e.deltaY*.001);constrain();},{passive:false});
      on(canvas,'keydown',e=>{const keys={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out',r:'reset',R:'reset'};if(keys[e.key]){e.preventDefault();action(keys[e.key]);}if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();view.pitch+=(e.key==='ArrowUp'?.08:-.08);constrain();}});
      function draw(now) {
        const dt=Math.min((now-previous)/1000,.1);previous=now;
        if(!document.hidden) {
          shown+=(run.t-shown)*Math.min(1,dt*10);
          if(run.t>=landing&&shown>landing-.005)shown=landing;
          const fraction=Math.min(1,shown/landing);
          // Deliberately compressed altitude: keeps the rover and mountain range readable.
          const altitude=120*Math.pow(1-fraction,1.4);
          rover.position.set(0,ground+altitude+.12,700);
          target.copy(rover.position).add(new THREE.Vector3(0,1.3,0));
          camera.position.set(target.x+Math.sin(view.yaw)*view.distance*Math.cos(view.pitch),target.y+Math.sin(view.pitch)*view.distance,target.z+Math.cos(view.yaw)*view.distance*Math.cos(view.pitch));
          camera.position.y=Math.max(camera.position.y,height(camera.position.x,camera.position.z)+2);
          camera.lookAt(target);renderer.render(scene,camera);
        }
        frame=requestAnimationFrame(draw);
      }
      frame=requestAnimationFrame(draw);
      canvas.dataset.renderer=software?'canvas':'webgl';
    } catch(error) {
      console.warn('Mars view could not start',error);
      canvas.insertAdjacentHTML('afterend','<p class="mars-scene-error">3D view unavailable in this browser. Mission controls still work.</p>');
    }
    stop=()=>{cancelAnimationFrame(frame);listeners.abort();observer?.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});renderer?.dispose?.();renderer?.forceContextLoss?.();};
  }
  return {attach,detach};
})();
