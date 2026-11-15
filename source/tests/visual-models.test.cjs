const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const THREE=require('../assets/vendor/three-r128.min.js');
function harness(fallback=false){
 let frameId=0,draws=0,scene,camera,disconnected=0;const frames=new Map(),buttons=new Map();
 function element(){const el=new EventTarget(),attrs={};el.textContent='Drag to rotate';el.setAttribute=(k,v)=>attrs[k]=String(v);el.getAttribute=k=>attrs[k];return el;}
 function canvas(){const c=element();c.width=800;c.height=500;c.getBoundingClientRect=()=>({left:240,top:120,width:800,height:500,bottom:620});c.setPointerCapture=()=>{};let pixels;
 const ctx={fillRect(){},beginPath(){},lineTo(){},moveTo(){},closePath(){},fill(){},stroke(){},clearRect(){},setTransform(){},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},getImageData(x,y,w,h){return {data:pixels||new Uint8ClampedArray(w*h*4)};},putImageData(im){pixels=im.data;}};c.getContext=()=>ctx;return c;}
 const cv=canvas(),view={querySelector:id=>{if(!buttons.has(id))buttons.set(id,element());return buttons.get(id);}},doc={hidden:false,createElement:canvas};
 const context={THREE,document:doc,window:{innerHeight:900},devicePixelRatio:1,matchMedia:()=>({matches:false}),ResizeObserver:class{observe(){}disconnect(){disconnected++;}},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),performance:{now:()=>Date.now()},console};vm.createContext(context);
 for(const file of ['src/scene-runtime.js','assets/models/earth-texture.js','assets/models/earth.js','assets/models/moon.js','assets/models/lander.js','assets/models/mars-globe.js','assets/models/sar.js','assets/models/observatory.js','assets/models/sar.js','assets/models/rocket.js','src/model-canvas.js','src/model-viewer.js','src/inline-models.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
 const base={domElement:cv,shadowMap:{},isCanvasFallback:true,setPixelRatio(){},setClearColor(){},setSize(){}};
 context.canvas=cv;context.view=view;
 const renderer=fallback?vm.runInContext('modelCanvasRenderer(canvas)',context):base;
 const draw=renderer.render;renderer.render=(s,c)=>{draws++;scene=s;camera=c;s.updateMatrixWorld(true);c.updateMatrixWorld(true);draw?.(s,c);};context.renderer=renderer;
 const start=key=>{const m=vm.runInContext(`OrbitalModels.get('${key}')`,context);m.controls.forEach(([id,,pressed])=>view.querySelector('#'+id).setAttribute('aria-pressed',pressed));context.cleanup=m.scene(view,renderer,cv);};
 const tick=()=>{const q=[...frames.values()];frames.clear();q.forEach(fn=>fn(100));};
 const click=id=>{const b=view.querySelector('#'+id);b.onclick?.();b.dispatchEvent(new Event('click'));};
 const pointer=(type,x,y)=>{const e=new Event(type);Object.assign(e,{clientX:x,clientY:y,pointerId:1});cv.dispatchEvent(e);};
 return {context,cv,doc,start,tick,click,pointer,frames,stop:()=>context.cleanup(),get scene(){return scene;},get camera(){return camera;},get draws(){return draws;},get disconnected(){return disconnected;}};
}
for(const key of ['earth','moon','lander','mars-globe'])test(`${key} procedural scene renders finite geometry and releases frames, observers, textures and listeners`,()=>{
 const h=harness();h.start(key);assert.ok(h.draws>0);let vertices=0,disposed=0;
 h.scene.traverse(o=>{const p=o.geometry?.attributes.position;if(p){vertices+=p.count;for(const value of p.array)assert.ok(Number.isFinite(value));o.geometry.addEventListener('dispose',()=>disposed++);}});assert.ok(vertices>1000);assert.equal(h.camera.aspect,1.6);
 h.doc.hidden=true;const before=h.draws;h.tick();assert.equal(h.draws,before);h.doc.hidden=false;h.tick();assert.ok(h.draws>before);
 h.stop();assert.equal(h.frames.size,0);assert.ok(h.disconnected>0);assert.ok(disposed>0);h.stop();
});
test('Earth picking uses canvas offset and zoom/cloud controls work',()=>{const h=harness();h.start('earth');const before=h.camera.position.z;h.click('bi');h.tick();assert.ok(h.camera.position.z<before);h.pointer('pointerdown',640,370);h.pointer('pointerup',640,370);assert.match(h.context.view.querySelector('#info').textContent,/°/);h.stop();});
test('Mars relief and lander engine buttons alter actual scene geometry/state',()=>{const h=harness();h.start('mars-globe');let geometry;h.scene.traverse(o=>{if(o.isMesh&&o.material.vertexColors&&!geometry)geometry=o.geometry;});const before=geometry.attributes.position.array.slice();h.click('bRelief');assert.ok(geometry.attributes.position.array.some((v,i)=>v!==before[i]));h.stop();h.start('lander');const lander=h.scene.children.find(o=>o.isGroup&&o.children.length>10);assert.ok(lander);h.click('fire');h.tick();assert.ok(lander.position.y>0);h.stop();});
test('Floodwatch viewer uses an original SAR schematic and keeps the generic observatory separate',()=>{const h=harness();assert.equal(vm.runInContext("OrbitalModels.get('sar').scene === sarScene",h.context),true);assert.match(vm.runInContext("OrbitalModels.get('sar').description",h.context),/not a specific flight spacecraft/);assert.equal(vm.runInContext("OrbitalModels.get('observatory').scene === spaceObservatoryScene",h.context),true);assert.match(vm.runInContext("OrbitalModels.get('observatory').description",h.context),/not Hubble/);});
test('Canvas fallback renders procedural Earth including shader atmosphere without errors',()=>{const h=harness(true);h.start('earth');assert.ok(h.draws>0);h.stop();});
test('launcher build embeds scene code but no static scene images or CDN scripts',()=>{const html=fs.readFileSync('dist/online.html','utf8');for(const name of ['earthScene','moonScene','landerScene','marsGlobeScene','OrbitalEarth'])assert.ok(html.includes(name));assert.ok(!html.includes('data:image/webp'));assert.ok(!html.includes('var(--earth-scene)'));assert.ok(!/<script[^>]+src=/.test(html));assert.ok(html.includes("connect-src 'self'"));});
