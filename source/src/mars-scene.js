/* Offline Mars terrain + an original procedural rover illustration. Distances are compressed for the view,
   while the mission HUD retains the practice simulation's telemetry. */
const OrbitalMars = (() => {
  let stop = null;
  let view = {yaw:0.75, pitch:0.22, distance:24};
  let roverGeometry;
  function geometry() {
    // Original schematic chassis geometry; no user-supplied or third-party rover mesh is bundled.
    roverGeometry ??= new THREE.BoxGeometry(2.2,.55,1.45);
    return roverGeometry.clone();
  }
  function vehicle(design) {
    const cfg=design||MarsMission.starter(),stats=MarsMission.stats(cfg),group=new THREE.Group();
    const body=new THREE.Mesh(geometry(),new THREE.MeshStandardMaterial({color:stats.type.color,metalness:.3,roughness:.65,side:THREE.DoubleSide}));body.position.y=.92;group.add(body);
    // Six original procedural wheels and simple suspension arms make the vehicle legible without an unlicensed STL.
    const wheelMat=new THREE.MeshStandardMaterial({color:0x333a42,metalness:.18,roughness:.88}),hubMat=new THREE.MeshStandardMaterial({color:0xb5a07b,metalness:.55,roughness:.5});
    for(const x of [-.82,0,.82])for(const side of [-1,1]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,20),wheelMat);wheel.rotation.x=Math.PI/2;wheel.position.set(x,.42,side*.83);group.add(wheel);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.2,12),hubMat);hub.rotation.x=Math.PI/2;hub.position.copy(wheel.position);group.add(hub);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(.12,.52,.12),hubMat);arm.position.set(x,.66,side*.7);group.add(arm);
    }
    const accessory=(id,shape,color,x,y,z)=>{if(cfg.parts[id]===undefined)return;const mesh=new THREE.Mesh(shape,new THREE.MeshStandardMaterial({color,metalness:.35,roughness:.55}));mesh.position.set(x,y,z);mesh.userData.part=id;mesh.scale.multiplyScalar(1+.1*cfg.parts[id]);group.add(mesh);};
    accessory('power',new THREE.BoxGeometry(2.5,.08,1.4),0x193d73,-.5,1.9,0);
    accessory('battery',new THREE.BoxGeometry(.65,.5,.8),0x68768a,-1,1.1,0);
    accessory('drill',new THREE.CylinderGeometry(.12,.08,1.1,12),0xc78d48,1.8,.9,.9);
    accessory('storage',new THREE.BoxGeometry(.7,.4,.7),0x5091aa,-1.2,1.8,.8);
    accessory('antenna',new THREE.SphereGeometry(.55,16,8,0,Math.PI*2,0,Math.PI/2),0xf1ddb0,-1.2,2.5,-.6);
    if(cfg.parts.traction!==undefined){accessory('traction',new THREE.BoxGeometry(3.1,.1,.15),0xb9a46c,0,.55,1.2);accessory('traction',new THREE.BoxGeometry(3.1,.1,.15),0xb9a46c,0,.55,-1.2);}
    group.scale.setScalar(stats.type.scale);return group;
  }
  function preview(canvas,design){
    if(!canvas)return;let renderer,frame,observer;const events=new AbortController(),scene=new THREE.Scene();
    try{const ctx=canvas.getContext('webgl2',{alpha:true,antialias:true})||canvas.getContext('webgl',{alpha:true,antialias:true});renderer=ctx?new THREE.WebGLRenderer({canvas,context:ctx,alpha:true,antialias:true}):modelCanvasRenderer(canvas);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
      scene.add(new THREE.HemisphereLight(0xe2edff,0x3a3444,1.3));const light=new THREE.DirectionalLight(0xffffff,1.2);light.position.set(6,8,6);scene.add(light);
      const rover=vehicle(design);scene.add(rover);const camera=new THREE.PerspectiveCamera(40,1,.1,100);let yaw=.7,pitch=.35,distance=11,drag=null;
      const size=()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height);camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();};observer=new ResizeObserver(size);observer.observe(canvas);size();
      canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},{signal:events.signal});
      canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.007;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.005,.05,1.3);drag={x:e.clientX,y:e.clientY};},{signal:events.signal});
      for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>drag=null,{signal:events.signal});
      canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),6,22);},{passive:false,signal:events.signal});
      function draw(){camera.position.set(Math.sin(yaw)*distance*Math.cos(pitch),1+Math.sin(pitch)*distance,Math.cos(yaw)*distance*Math.cos(pitch));camera.lookAt(0,1.2,0);renderer.render(scene,camera);frame=requestAnimationFrame(draw);}draw();
    }catch(e){console.warn('Rover preview unavailable',e);}
    stop=()=>{cancelAnimationFrame(frame);observer?.disconnect();events.abort();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer?.dispose?.();renderer?.forceContextLoss?.();};
  }
  function detach(){stop?.();stop=null;}
  function attach(canvas, run, landing, controls={}) {
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
      const rover=vehicle(run.design);
      scene.add(rover);
      const markers=run.manual?MarsMission.waypoints.map((point,i)=>{const group=new THREE.Group();group.position.set(point.x,height(point.x,point.z)+.4,point.z);const material=new THREE.MeshBasicMaterial({color:0x49d9ee});const ring=new THREE.Mesh(new THREE.TorusGeometry(2.5,.16,6,20),material);ring.rotation.x=Math.PI/2;group.add(ring);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,4,6),material);pole.position.y=2;group.add(pole);const flag=new THREE.Mesh(new THREE.BoxGeometry(1.3,.65,.08),material);flag.position.set(.6,3.5,0);group.add(flag);scene.add(group);return group;}):[];
      const held={};let lastHud=0,lastSave=0;
      const clearKeys=()=>{for(const k in held)delete held[k];if(run.manual)run.speedMps=0;};
      on(canvas,'blur',clearKeys);on(window,'blur',clearKeys);on(document,'visibilitychange',clearKeys);
      on(canvas,'keydown',e=>{
        if(!run.manual)return;
        if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();held[e.code]=true;}
        if(!e.repeat&&['KeyX','KeyC','KeyT'].includes(e.code)){e.preventDefault();controls.command?.({KeyX:'sample',KeyC:'core',KeyT:'relay'}[e.code]);}
      });
      on(canvas,'keyup',e=>{delete held[e.code];});
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
      on(canvas,'keydown',e=>{const keys={...(run.manual?{q:'left',Q:'left',e:'right',E:'right'}:{ArrowLeft:'left',ArrowRight:'right'}),'+':'in','=':'in','-':'out',r:'reset',R:'reset'};if(keys[e.key]){e.preventDefault();action(keys[e.key]);}if(!run.manual&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();view.pitch+=(e.key==='ArrowUp'?.08:-.08);constrain();}});
      function draw(now) {
        const dt=Math.min((now-previous)/1000,.1);previous=now;
        if(!document.hidden) {
          shown+=(run.t-shown)*Math.min(1,dt*10);
          if(run.t>=landing&&shown>landing-.005)shown=landing;
          const fraction=Math.min(1,shown/landing);
          // Deliberately compressed altitude: keeps the rover and mountain range readable.
          const altitude=120*Math.pow(1-fraction,1.4);
          if(run.manual&&controls.isDriving?.()&&document.activeElement===canvas){
            MarsMission.move(run,{forward:(held.KeyW||held.ArrowUp?1:0)-(held.KeyS||held.ArrowDown?1:0),turn:(held.KeyD||held.ArrowRight?1:0)-(held.KeyA||held.ArrowLeft?1:0),brake:held.Space},dt,height);
          }else clearKeys();
          const x=run.position?.x??0,z=run.position?.z??700;
          const contact=Math.max(height(x,z),height(x-2,z-1),height(x+2,z+1));
          rover.position.set(x,contact+altitude+.25,z);rover.rotation.y=-(run.position?.heading??0);
          markers.forEach((m,i)=>{m.children.forEach(o=>o.material.color.setHex(i<run.visited?0x83a369:i===run.visited?0x49e5ff:0xba8f5b));});
          if(run.manual&&now-lastHud>200){controls.onUpdate?.();lastHud=now;}
          if(run.manual&&now-lastSave>1000){save();lastSave=now;}
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
  return {attach,preview,detach};
})();
