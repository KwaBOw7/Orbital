/* Adapted from supplied earth scene; source retained in references/. */
function earthScene(view, rendererInstance, canvas) {
const life=orbitalSceneRuntime(view,rendererInstance,canvas);
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
try{

const cv=canvas,R=rendererInstance;
R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.setClearColor(0x04060d);
const S=life.track(new THREE.Scene()),cam=new THREE.PerspectiveCamera(40,1,.1,200);cam.position.z=3.6;
const sun=new THREE.DirectionalLight(0xfff4e0,1.5);sun.position.set(5,2,4);S.add(sun);
const amb=new THREE.AmbientLight(0x5577aa,.28);S.add(amb);
const pivot=new THREE.Group(),tilt=new THREE.Group();tilt.rotation.z=-23.4*Math.PI/180;pivot.add(tilt);S.add(pivot);
const tex=new THREE.CanvasTexture(OrbitalEarth.surface());tex.anisotropy=8;
const earth=new THREE.Mesh(new THREE.SphereGeometry(1,rendererInstance.isCanvasFallback?64:72,rendererInstance.isCanvasFallback?32:48),new THREE.MeshPhongMaterial({map:tex,shininess:14,specular:0x223344}));
earth.rotation.y=-Math.PI/2;tilt.add(earth);
const clouds=new THREE.Mesh(new THREE.SphereGeometry(rendererInstance.isCanvasFallback?1.025:1.012,rendererInstance.isCanvasFallback?64:72,rendererInstance.isCanvasFallback?32:48),new THREE.MeshPhongMaterial({map:new THREE.CanvasTexture(OrbitalEarth.clouds()),transparent:true,depthWrite:false,opacity:.85}));
tilt.add(clouds);
const atm=new THREE.Mesh(new THREE.SphereGeometry(1.14,64,48),new THREE.ShaderMaterial({
  vertexShader:'varying vec3 n;void main(){n=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 n;void main(){float i=pow(max(0.,.68-dot(n,vec3(0,0,1.))),3.);gl_FragColor=vec4(.3,.62,1.,1.)*i*1.6;}',
  side:THREE.BackSide,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}));
S.add(atm);
const sp=[];for(let i=0;i<1600;i++){const u=Math.random()*2-1,a=Math.random()*6.283,r=Math.sqrt(1-u*u);sp.push(60*r*Math.cos(a),60*u,60*r*Math.sin(a))}
const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
S.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xcfd8ee,size:.12,sizeAttenuation:true})));
const pin=new THREE.Mesh(new THREE.SphereGeometry(.014,12,12),new THREE.MeshBasicMaterial({color:0xffd166}));pin.visible=false;earth.add(pin);

function fit(){const w=life.width(),h=life.height();R.setSize(w,h,false);cam.aspect=w/h;cam.position.z=Math.max(cam.position.z,0);cam.updateProjectionMatrix()}
life.resize(fit);fit();

// ---- interaction ----
let spin=!matchMedia('(prefers-reduced-motion: reduce)').matches,drag=null,moved=0,zoom=3.6;
pivot.rotation.x=.25;
life.on(cv,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};moved=0;cv.setPointerCapture(e.pointerId)});
life.on(cv,'pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;moved+=Math.abs(dx)+Math.abs(dy);
  pivot.rotation.y+=dx*.006;pivot.rotation.x=Math.max(-1.4,Math.min(1.4,pivot.rotation.x+dy*.006));drag={x:e.clientX,y:e.clientY}});
life.on(cv,'pointerup',e=>{if(drag&&moved<5)pick(e);drag=null});
life.on(cv,'wheel',e=>{e.preventDefault();zoom=Math.max(1.8,Math.min(7,zoom*(1+e.deltaY*.001)))},{passive:false});
const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
function pick(e){mv.set((e.clientX-canvas.getBoundingClientRect().left)/life.width()*2-1,-((e.clientY-canvas.getBoundingClientRect().top)/life.height())*2+1);ray.setFromCamera(mv,cam);
  const hit=ray.intersectObject(earth)[0],ro=view.querySelector("#"+'info');
  if(!hit){pin.visible=false;return}
  const lon=hit.uv.x*360-180,lat=hit.uv.y*180-90;
  pin.position.copy(earth.worldToLocal(hit.point.clone()).multiplyScalar(1.004));pin.visible=true;
  ro.textContent=Math.abs(lat).toFixed(1)+'\u00b0'+(lat>=0?'N':'S')+', '+Math.abs(lon).toFixed(1)+'\u00b0'+(lon>=0?'E':'W')}
const tog=(id,fn)=>{const b=view.querySelector("#"+id);b.onclick=()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fn(on)}};
tog('bs',on=>spin=on);tog('bc',on=>clouds.visible=on);tog('bn',on=>amb.intensity=on?1.1:.28);
view.querySelector("#"+'bi').onclick=()=>zoom=Math.max(1.8,zoom*.8);
view.querySelector("#"+'bo').onclick=()=>zoom=Math.min(7,zoom*1.25);
if(!spin)view.querySelector("#"+'bs').setAttribute('aria-pressed','false');

(function loop(){life.frame(loop);
  if(spin&&!drag){earth.rotation.y+=.0015;clouds.rotation.y+=.0019}
  cam.position.z+=(zoom-cam.position.z)*.12;R.render(S,cam)})();
return life.stop;
}catch(error){life.stop();throw error;}
}
