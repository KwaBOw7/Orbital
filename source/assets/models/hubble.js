/* Adapted from the user-supplied Hubble Space Telescope 3D Model.html scene. */
function hubbleScene(view, R, cv) {
R.setPixelRatio(Math.min(devicePixelRatio,1.5));
var S=new THREE.Scene();
var cam=new THREE.PerspectiveCamera(40,1,.1,400);
S.add(new THREE.HemisphereLight(0xbcd0ff,0x1a2030,.55));
var sun=new THREE.DirectionalLight(0xfff4e0,1.5);sun.position.set(14,12,16);S.add(sun);
var fill=new THREE.DirectionalLight(0x6f8fd0,.45);fill.position.set(-12,-4,-10);S.add(fill);

function mat(c,m,r,e){return new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r,side:e||THREE.FrontSide})}
var silver=mat(0xc3cbd6,.85,.3),gold=mat(0xd4a649,.9,.3),white=mat(0xeef1f5,.3,.5),dark=mat(0x232933,.6,.5),inside=mat(0x14171d,.4,.7,THREE.BackSide);

var scope=new THREE.Group();S.add(scope);
var parts={};
var info={
shield:'Light shield: a 4 m baffle that blocks sunlight and Earthshine from the mirror.',
door:'Aperture door: closes over the opening to protect the optics from the Sun.',
fwd:'Forward shell: holds the 2.4 m primary mirror and its secondary mirror.',
bay:'Equipment section: bays of batteries, computers and gyroscopes wrapped in gold-tone insulation.',
aft:'Aft shroud: houses the science instruments, including cameras and spectrographs.',
array:'Solar array: two 7.1 m wings turn sunlight into electricity.',
hga:'High-gain antenna: relays data to Earth through NASA’s tracking satellites.'
};
function part(n){var g=new THREE.Group();g.name=n;g.userData.t=new THREE.Vector3();parts[n]=g;scope.add(g);return g}
function tag(g,m){m.userData.part=g.userData.key||g.name;g.add(m);return m}
function cyl(r1,r2,h,y,m,open){var c=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,64,1,open),m);c.position.y=y;return c}

// light shield (y 3.4..7.4), open front with dark interior
var sh=part('shield');sh.userData.t.set(0,3.2,0);
tag(sh,cyl(1.6,1.6,4,5.4,white,true));
var shi=cyl(1.58,1.58,4,5.4,inside,true);tag(sh,shi);
tag(sh,cyl(1.7,1.7,.12,7.4,silver,true));
// aperture door, hinged at the top rim and swung open
var dr=part('door');dr.userData.t.set(0,3.8,1.2);
var hinge=new THREE.Group();hinge.position.set(0,7.42,-1.6);hinge.rotation.x=-1.9;dr.add(hinge);
var dm=new THREE.Mesh(new THREE.CylinderGeometry(1.62,1.62,.1,48),white);dm.position.set(0,0,1.6);dm.rotation.x=Math.PI/2;dm.position.set(0,.05,0);
dm.geometry.translate(0,0,0);dm.rotation.x=0;dm.position.set(0,0,1.6);dm.rotation.set(0,0,0);
hinge.add(dm);dm.userData.part='door';
// forward shell (y 1..3.4)
var fw=part('fwd');fw.userData.t.set(0,1.6,0);
tag(fw,cyl(1.75,1.62,2.4,2.2,silver));
// equipment section (y -2.2..1)
var bay=part('bay');bay.userData.t.set(0,0,0);
tag(bay,cyl(2.12,1.75,.9,.55,gold));
tag(bay,cyl(2.12,2.12,3.1,-1.2,gold));
for(var i=0;i<8;i++){var a=i*Math.PI/4,d=new THREE.Mesh(new THREE.BoxGeometry(.9,2.4,.08),silver);d.position.set(Math.sin(a)*2.14,-1.2,Math.cos(a)*2.14);d.rotation.y=a;tag(bay,d)}
// aft shroud (y -6.6..-2.7)
var af=part('aft');af.userData.t.set(0,-2,0);
tag(af,cyl(2.12,2.12,4,-4.7,silver));
tag(af,cyl(2.12,1.7,.3,-6.85,dark));
// solar arrays: textured panels on booms
var cc=document.createElement('canvas');cc.width=256;cc.height=96;var x=cc.getContext('2d');
x.fillStyle='#10285a';x.fillRect(0,0,256,96);x.strokeStyle='#5f86c9';x.lineWidth=2;
for(var gx=0;gx<=256;gx+=32){x.beginPath();x.moveTo(gx,0);x.lineTo(gx,96);x.stroke()}
for(var gy=0;gy<=96;gy+=24){x.beginPath();x.moveTo(0,gy);x.lineTo(256,gy);x.stroke()}
var tex=new THREE.CanvasTexture(cc);tex.anisotropy=4;
var pm=new THREE.MeshStandardMaterial({map:tex,metalness:.4,roughness:.35,side:THREE.DoubleSide});
[-1,1].forEach(function(s){
var ar=part('array'+s);ar.userData.key='array';ar.userData.t.set(s*2.2,0,0);
var panel=new THREE.Mesh(new THREE.BoxGeometry(7.1,2.6,.06),pm);panel.position.set(s*5.7,.2,0);tag(ar,panel);
var boom=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,7.3,12),silver);boom.rotation.z=Math.PI/2;boom.position.set(s*5.7,1.55,0);tag(ar,boom);
var arm=new THREE.Mesh(new THREE.BoxGeometry(2.4,.12,.12),silver);arm.position.set(s*3.1,.2,0);tag(ar,arm);
var h=part('hga'+s);h.userData.key='hga';h.userData.t.set(0,0,s*2.4);
var mast=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.2,12),silver);mast.rotation.x=Math.PI/2;mast.position.set(0,-1,s*3.4);tag(h,mast);
var dish=new THREE.Mesh(new THREE.SphereGeometry(.65,32,16,0,Math.PI*2,0,Math.PI/2),white);dish.rotation.x=s*Math.PI/2;dish.position.set(0,-1,s*5);tag(h,dish);
dish.material=new THREE.MeshStandardMaterial({color:0xeef1f5,metalness:.3,roughness:.5,side:THREE.DoubleSide});
});
scope.rotation.z=-1.2;scope.rotation.x=.25;

// stars and Earth
var sp=[];for(var n=0;n<700;n++){var u=Math.random()*2-1,t=Math.random()*6.283,r=Math.sqrt(1-u*u),R2=160+Math.random()*60;sp.push(R2*r*Math.cos(t),R2*u,R2*r*Math.sin(t))}
var sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
S.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.9,sizeAttenuation:false})));
var earth=new THREE.Group();earth.position.set(0,-78,-20);S.add(earth);
earth.add(new THREE.Mesh(new THREE.SphereGeometry(60,48,32),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(OrbitalEarth.surface()),roughness:.9,metalness:0,emissive:0x07162e})));
earth.add(new THREE.Mesh(new THREE.SphereGeometry(62.5,28,18),new THREE.MeshBasicMaterial({color:0x6fb2ff,transparent:true,opacity:.22,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false})));

// orbit controls
var th=.6,ph=1.25,dist=30,tgt=new THREE.Vector3(0,0,0),auto=true,drag=false,moved=0,lx=0,ly=0;
function place(){cam.position.set(tgt.x+dist*Math.sin(ph)*Math.sin(th),tgt.y+dist*Math.cos(ph),tgt.z+dist*Math.sin(ph)*Math.cos(th));cam.lookAt(tgt)}
cv.addEventListener('pointerdown',function(e){drag=true;moved=0;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);th-=dx*.008;ph=Math.max(.3,Math.min(2.8,ph-dy*.008))});
cv.addEventListener('pointerup',function(e){drag=false;if(moved<5)pick(e)});
cv.addEventListener('pointercancel',function(){drag=false});
cv.addEventListener('wheel',function(e){e.preventDefault();dist=Math.max(12,Math.min(60,dist*(1+e.deltaY*.001)))},{passive:false});
var ray=new THREE.Raycaster(),m2=new THREE.Vector2(),el=view.querySelector('#'+'info'),dflt=el.textContent;
function pick(e){const rect=cv.getBoundingClientRect();
  m2.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(m2,cam);
var h=ray.intersectObjects(scope.children,true)[0];
el.textContent=h&&h.object.userData.part?info[h.object.userData.part]:dflt}

function tog(id,fn){var b=view.querySelector('#'+id);b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fn(on)})}
var expl=false;
tog('bExplode',function(on){expl=on});
tog('bEarth',function(on){earth.visible=on});
tog('bSpin',function(on){auto=on});

function size(){const {width,height}=cv.getBoundingClientRect(); R.setSize(width,height,false);cam.aspect=width/Math.max(1,height);cam.updateProjectionMatrix();if(cam.aspect<1)dist=Math.max(dist,38)}
const observer=new ResizeObserver(size); observer.observe(cv); size();
if(matchMedia('(prefers-reduced-motion: reduce)').matches){auto=false;view.querySelector('#'+'bSpin').setAttribute('aria-pressed','false')}

var clock=new THREE.Clock(),zero=new THREE.Vector3();
let frame;
function loop(){
var dt=Math.min(clock.getDelta(),.05);
if(auto&&!drag)th+=dt*.25;
for(var n in parts){var p=parts[n],g=expl?p.userData.t:zero;p.position.lerp(g,Math.min(1,dt*5))}
place();R.render(S,cam);frame=requestAnimationFrame(loop)}
loop();
return () => { cancelAnimationFrame(frame); observer.disconnect();const geometries=new Set(),materials=new Set();S.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();}); };
}
