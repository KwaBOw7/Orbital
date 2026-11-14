/* Adapted from the user-supplied Rocket 3D Model.html scene. */
function rocketScene(view, R, cv) {
R.setPixelRatio(Math.min(devicePixelRatio,1.5));
var S=new THREE.Scene();
var cam=new THREE.PerspectiveCamera(40,1,.1,200);
S.add(new THREE.HemisphereLight(0xffffff,0x5a6b85,.9));
var sun=new THREE.DirectionalLight(0xffffff,1.1);sun.position.set(6,10,8);S.add(sun);
var rim=new THREE.DirectionalLight(0xffa070,.5);rim.position.set(-8,3,-6);S.add(rim);

function mat(c,m,r){return new THREE.MeshStandardMaterial({color:c,metalness:m==null?.3:m,roughness:r==null?.45:r})}
var white=mat(0xf4f6fa,.25,.4),red=mat(0xe8512b,.3,.4),steel=mat(0x56606e,.8,.35),dark=mat(0x1b2431,.5,.5),glass=mat(0x7cc8ff,.6,.15);

var rocket=new THREE.Group();S.add(rocket);
var parts={};
var info={
nose:'Nose cone: ogive shape cuts drag and shields the payload fairing.',
upper:'Upper stage: vacuum-optimised engine and the crew or payload bay.',
lower:'First stage: tanks for fuel and oxidiser, most of the rocket’s mass.',
engine:'Engine bell: the nozzle that turns hot gas into thrust.',
fins:'Fins: the four surfaces around the base of this illustrative launcher.'
};
function part(name,y){var g=new THREE.Group();g.name=name;g.userData.rest=y;g.userData.y=y;g.position.y=y;rocket.add(g);parts[name]=g;return g}
function lathe(pts,m,seg){return new THREE.Mesh(new THREE.LatheGeometry(pts.map(function(p){return new THREE.Vector2(p[0],p[1])}),seg||48),m)}
function add(g,mesh){mesh.userData.part=g.name;g.add(mesh);return mesh}

// first stage (y 0..4.6)
var lower=part('lower',0);
add(lower,lathe([[0,0],[1,0],[1,4.6],[0,4.6]],white));
add(lower,lathe([[0,.9],[1.02,.9],[1.02,1.3],[0,1.3]],red));
add(lower,lathe([[0,3.7],[1.02,3.7],[1.02,3.85],[0,3.85]],dark));
// upper stage (4.6..7.4)
var upper=part('upper',0);
add(upper,lathe([[0,4.6],[.86,4.6],[.86,7.2],[0,7.2]],white));
add(upper,lathe([[0,4.6],[1.05,4.6],[1.05,4.85],[.86,4.95],[0,4.95]],steel));
var win=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.12,32),glass);win.rotation.x=Math.PI/2;win.position.set(0,6.1,.84);add(upper,win);
var ring=new THREE.Mesh(new THREE.TorusGeometry(.3,.06,12,32),steel);ring.position.set(0,6.1,.88);add(upper,ring);
// nose
var nose=part('nose',0);
var np=[];for(var i=0;i<=24;i++){var t=i/24;np.push([.86*Math.sqrt(1-Math.pow(t,1.6)),7.2+t*2.6])}
add(nose,lathe(np.reverse(),red));
// engine
var eng=part('engine',0);
var ep=[[.0,0],[.35,0],[.3,-.2],[.42,-.55],[.62,-1.05],[.78,-1.2],[.7,-1.2],[.55,-1.0],[.36,-.55],[.22,-.15],[0,-.1]];
add(eng,lathe(ep,steel));
[[.55,0],[-.55,0],[0,.55],[0,-.55]].forEach(function(o){var b=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.6,16),dark);b.position.set(o[0],-.1,o[1]);add(eng,b)});
// fins
var fins=part('fins',0);
var fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(1.5,-.9);fs.lineTo(1.5,-.3);fs.lineTo(0,1.9);fs.lineTo(0,0);
for(var k=0;k<4;k++){
var fm=new THREE.Mesh(new THREE.ExtrudeGeometry(fs,{depth:.1,bevelEnabled:false}),red);
var pv=new THREE.Group();pv.rotation.y=k*Math.PI/2;fm.position.set(.98,.9,-.05);pv.add(fm);fm.userData.part='fins';fins.add(pv)}
var targets={nose:2.4,upper:1.2,lower:0,engine:-1.1,fins:-.6};

// flame
var flame=new THREE.Group();flame.position.y=-1.2;rocket.add(flame);
var fmat=function(c,o){return new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,blending:THREE.AdditiveBlending,depthWrite:false})};
var f1=new THREE.Mesh(new THREE.ConeGeometry(.7,3.6,24,1,true),fmat(0xff7a2a,.55));f1.rotation.x=Math.PI;f1.position.y=-1.8;
var f2=new THREE.Mesh(new THREE.ConeGeometry(.38,2.4,24,1,true),fmat(0xfff2b0,.8));f2.rotation.x=Math.PI;f2.position.y=-1.2;
flame.add(f1,f2);flame.visible=false;

// pad
var pad=new THREE.Mesh(new THREE.CylinderGeometry(4.2,4.4,.3,64),mat(0x7d8898,.2,.8));pad.position.y=-2.4;S.add(pad);
var grid=new THREE.GridHelper(40,40,0x8fa0b8,0x8fa0b8);grid.position.y=-2.55;grid.material.transparent=true;grid.material.opacity=.25;S.add(grid);

// orbit
var th=.7,ph=1.35,dist=22,tgtY=3.6,auto=true,drag=false,moved=0,lx=0,ly=0;
function place(){cam.position.set(dist*Math.sin(ph)*Math.sin(th),tgtY+dist*Math.cos(ph),dist*Math.sin(ph)*Math.cos(th));cam.lookAt(0,tgtY,0)}
cv.addEventListener('pointerdown',function(e){drag=true;moved=0;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);th-=dx*.008;ph=Math.max(.3,Math.min(2.2,ph-dy*.008))});
cv.addEventListener('pointerup',function(e){drag=false;if(moved<5)pick(e)});
cv.addEventListener('pointercancel',function(){drag=false});
cv.addEventListener('wheel',function(e){e.preventDefault();dist=Math.max(9,Math.min(40,dist*(1+e.deltaY*.001)))},{passive:false});

var ray=new THREE.Raycaster(),m2=new THREE.Vector2(),infoEl=view.querySelector('#'+'info');
function pick(e){const rect=cv.getBoundingClientRect();
  m2.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(m2,cam);
var h=ray.intersectObjects(rocket.children.filter(function(c){return c!==flame}),true)[0];
infoEl.textContent=h&&h.object.userData.part?info[h.object.userData.part]:'Drag to rotate. Scroll to zoom. Select a part for details.'}

// buttons
function tog(id,fn){var b=view.querySelector('#'+id);b.addEventListener('click',function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);fn(on)})}
var lit=false,expl=false;
tog('bLaunch',function(on){lit=on;flame.visible=on});
tog('bExplode',function(on){expl=on});
tog('bSpin',function(on){auto=on});

function size(){const {width,height}=cv.getBoundingClientRect(); R.setSize(width,height,false);cam.aspect=width/Math.max(1,height);cam.updateProjectionMatrix();if(cam.aspect<1)dist=Math.max(dist,26)}
const observer=new ResizeObserver(size); observer.observe(cv); size();

var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce){auto=false;view.querySelector('#'+'bSpin').setAttribute('aria-pressed','false')}
var clock=new THREE.Clock(),lift=0;
let frame;
function loop(){
var dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
if(auto&&!drag)th+=dt*.35;
for(var n in parts){var p=parts[n];var goal=expl?targets[n]:0;p.position.y+=(goal-p.position.y)*Math.min(1,dt*6)}
// flame follows engine
flame.position.y=-1.2+parts.engine.position.y;
if(lit){var s=1+Math.sin(t*40)*.08+Math.random()*.1;f1.scale.set(s,1+Math.random()*.2,s);f2.scale.set(s*.9,1+Math.random()*.25,s*.9);
lift=Math.min(lift+dt*.4,.35);rocket.position.x=Math.sin(t*60)*.01*lift;rocket.position.z=Math.cos(t*55)*.01*lift}
else{rocket.position.x=0;rocket.position.z=0}
place();R.render(S,cam);frame=requestAnimationFrame(loop)}
loop();
return () => { cancelAnimationFrame(frame); observer.disconnect();const geometries=new Set(),materials=new Set();S.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();}); };
}
