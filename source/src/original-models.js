/* Original attachments remain archived byte-for-byte; view adapters repair rendering without changing those files. */
const OrbitalOriginal=(()=>{
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Render the supplied rocket with the release's local Three.js and Canvas fallback.
 // Keep the archived asset unchanged; repair its reversed nose winding in the view.
 function rocketSource(asset){
  const library=document.getElementById('orbital-three').textContent;
  const binary=text=>encodeURIComponent(text).replace(/%([0-9A-F]{2})/g,(_,hex)=>String.fromCharCode(parseInt(hex,16)));
  const runtime=binary(library+'\n'+modelCanvasRenderer.toString()).replace(/<\/script/gi,'<\\/script');
  let html=atob(asset.base64).replace(/<script\b[^>]+><\/script>/,
   ()=>'<script>'+runtime+'</scr'+'ipt>');
  html=html.replace('var R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});',
   'var R;try{R=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});}catch(error){var replacement=cv.cloneNode();cv.replaceWith(replacement);cv=replacement;R=modelCanvasRenderer(cv);}')
   .replace('lathe(np.reverse(),red)','lathe(np,red)')
   .replace('dist=22,tgtY=3.6','dist=28,tgtY=4.5')
   .replace("tog('bExplode',function(on){expl=on});","tog('bExplode',function(on){expl=on;if(on)dist=Math.max(dist,34)});")
   .replace('</head>','<style>header{top:12px;left:14px;right:14px}h1{font-size:22px}#info{font-size:13px;line-height:1.4}nav{max-width:calc(100% - 20px);width:max-content;gap:6px;padding:6px;bottom:12px}button{font-size:13px;white-space:nowrap;min-width:0;padding:8px 10px}@media(max-width:380px){button{font-size:11px;padding:8px}}</style></head>');
  return 'data:text/html;base64,'+btoa(html);
 }
 // View-only UI overrides; archived source files and model geometry stay unchanged.
 function source(key,compact=false){
  const a=ORBITAL_ORIGINAL_ASSETS[key];
  if(key==='rocket')return rocketSource(a);
  const hidden=[...(key==='lander'&&compact?['fire']:[]),...(key==='mars-globe'?['bPins','bSpin']:[])];
  const hideBar=['earth','mars-globe','asteroid','observatory'].includes(key);
  if(!hidden.length&&!hideBar)return 'data:text/html;base64,'+a.base64;
  const css='<style>'+(hidden.length?hidden.map(id=>'#'+id).join(',')+'{display:none!important}':'')+(hideBar?'nav{display:none!important}':'')+'</style>';
  const disable=key==='mars-globe'?'<script>window.addEventListener("load",function(){["bPins","bSpin"].forEach(function(id){var b=document.getElementById(id);if(b&&b.getAttribute("aria-pressed")==="true")b.click();});});</scr'+'ipt>':'';
  return 'data:text/html;base64,'+btoa(atob(a.base64)+css+disable);
 }
 function html(key,compact=false){const a=ORBITAL_ORIGINAL_ASSETS[key];return `<section class="original-model ${compact?'original-compact':''}"><iframe loading="lazy" sandbox="allow-scripts" title="${escape(a.title)}" src="${source(key,compact)}"></iframe>${compact?`<button class="btn compact" data-action="model-${key}">Expand ${escape(a.title)}</button>`:''}${a.labels.length?`<aside class="original-labels" aria-label="Model part labels"><strong>Exploded-view parts</strong><ul>${a.labels.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p>Use Exploded view inside the model. Tap a part for its identification.</p></aside>`:''}<p class="tiny muted">${key==='rocket'?'Supplied rocket model · available offline':'Original supplied view · internet required for Three.js'}</p></section>`;}
 function rover(){
  const raw=atob(ORBITAL_ORIGINAL_ASSETS.rover.base64),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),data=new DataView(bytes.buffer),count=data.getUint32(80,true),positions=new Float32Array(count*9),normals=new Float32Array(count*9);
  if(bytes.length!==84+count*50)throw Error('Invalid supplied STL length');
  for(let i=0;i<count;i++){const offset=84+i*50;for(let j=0;j<9;j++){positions[i*9+j]=data.getFloat32(offset+12+j*4,true);normals[i*9+j]=data.getFloat32(offset+(j%3)*4,true);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.computeBoundingBox();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xb5b5b5,roughness:.65,side:THREE.DoubleSide}));mesh.name='Original supplied rover STL';
  const group=new THREE.Group();group.name='Mars rover';group.add(mesh);
  // A uniform display transform fits the original coordinate units to the game; no vertices change.
  mesh.rotation.x=-Math.PI/2;const bounds=new THREE.Box3().setFromObject(mesh),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=3/Math.max(size.x,size.y,size.z);mesh.scale.setScalar(scale);mesh.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  // Complete the supplied body with a clearly articulated educational rover assembly.
  const metal=new THREE.MeshStandardMaterial({color:0xc6ccd2,metalness:.62,roughness:.38}),dark=new THREE.MeshStandardMaterial({color:0x252d36,metalness:.25,roughness:.72}),gold=new THREE.MeshStandardMaterial({color:0xb58a43,metalness:.55,roughness:.42}),panel=new THREE.MeshStandardMaterial({color:0x174c79,metalness:.35,roughness:.32,emissive:0x071b30});
  const part=(name,geo,mat,pos,rot)=>{const o=new THREE.Mesh(geo,mat);o.name=name;o.position.set(...pos);if(rot)o.rotation.set(...rot);group.add(o);return o;};
  part('Rover equipment deck',new THREE.BoxGeometry(1.55,.16,1.12),metal,[0,.72,0]);
  // Six independently visible rocker-bogie wheels, axles and tread ribs.
  for(const side of [-1,1])for(const z of [-.72,0,.72]){const x=side*.91;part(`Wheel ${side<0?'port':'starboard'} ${z}`,new THREE.CylinderGeometry(.25,.25,.17,24),dark,[x,.28,z],[0,0,Math.PI/2]);part('Wheel hub',new THREE.CylinderGeometry(.105,.105,.19,16),gold,[x,.28,z],[0,0,Math.PI/2]);for(let k=0;k<10;k++){const a=k*Math.PI/5;part('Wheel tread',new THREE.BoxGeometry(.055,.08,.2),metal,[x,.28+Math.sin(a)*.245,z+Math.cos(a)*.245],[a,0,0]);}}
  part('Camera mast',new THREE.CylinderGeometry(.045,.06,.82,12),metal,[0,1.2,-.12]);part('Panoramic camera head',new THREE.BoxGeometry(.42,.2,.24),gold,[0,1.66,-.12]);
  for(const x of [-.12,.12])part('Navigation camera lens',new THREE.CylinderGeometry(.055,.055,.035,16),dark,[x,1.67,-.25],[Math.PI/2,0,0]);
  part('Solar array frame',new THREE.BoxGeometry(1.85,.055,.78),gold,[0,1.02,.95],[.12,0,0]);for(let x=-.8;x<=.81;x+=.2)part('Solar cell',new THREE.BoxGeometry(.17,.018,.7),panel,[x,1.055,.95],[.12,0,0]);
  part('Robotic arm shoulder',new THREE.SphereGeometry(.13,16,12),gold,[-.82,.92,-.25]);part('Robotic arm boom',new THREE.CylinderGeometry(.055,.07,.72,12),metal,[-1.08,.72,-.25],[0,0,-.72]);part('Sample acquisition turret',new THREE.BoxGeometry(.2,.16,.22),dark,[-1.32,.48,-.25]);
  part('High gain antenna mast',new THREE.CylinderGeometry(.025,.035,.5,10),metal,[.55,1.05,-.55]);part('High gain dish',new THREE.SphereGeometry(.25,20,12,0,Math.PI*2,0,Math.PI/2),metal,[.55,1.32,-.55],[Math.PI/2,0,0]);
  part('UHF antenna',new THREE.CylinderGeometry(.018,.018,.48,8),gold,[.72,1.12,.3],[0,0,-.25]);
  group.name='Mars rover';group.userData.description='Six-wheel mobility, solar array, mast cameras, robotic arm and communications';return group;
 }
 function open(key,trigger){const a=ORBITAL_ORIGINAL_ASSETS[key],dialog=document.querySelector('#model-dialog');if(dialog.open)return;
 dialog.innerHTML=`<header class="dialog-head"><h2 id="model-title">${escape(a.title)}</h2><form method="dialog"><button aria-label="Close 3D model" autofocus>×</button></form></header><div class="model-body">${key==='rover'?'<div class="model-stage"><canvas aria-label="Original rover STL"></canvas></div><p>Original STL · drag to rotate. No named components are present in this file.</p>':html(key)}</div>`;dialog.showModal();let stop,renderer;
 if(key==='rover'){const canvas=dialog.querySelector('canvas');try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});}catch{renderer=modelCanvasRenderer(canvas);}const life=orbitalSceneRuntime(dialog,renderer,canvas),scene=life.track(new THREE.Scene()),camera=new THREE.PerspectiveCamera(40,1,.01,100);scene.add(rover());scene.add(new THREE.HemisphereLight(0xffffff,0x444444,2));let yaw=.6,drag=null;life.on(canvas,'pointerdown',e=>{drag=e.clientX;canvas.setPointerCapture?.(e.pointerId);});life.on(canvas,'pointermove',e=>{if(drag!==null){yaw+=(e.clientX-drag)*.01;drag=e.clientX;}});for(const t of ['pointerup','pointercancel'])life.on(canvas,t,()=>drag=null);const resize=()=>{renderer.setSize(life.width(),life.height(),false);camera.aspect=life.width()/life.height();camera.updateProjectionMatrix();};life.resize(resize);resize();function draw(){camera.position.set(Math.sin(yaw)*7,3,Math.cos(yaw)*7);camera.lookAt(0,1,0);renderer.render(scene,camera);life.frame(draw);}draw();stop=life.stop;}
 dialog.addEventListener('close',()=>{stop?.();renderer?.dispose?.();renderer?.forceContextLoss?.();dialog.replaceChildren();const target=trigger?.closest('dialog')?document.querySelector('[data-action="asset-gallery"]'):trigger;target?.focus();},{once:true});
 }
 return {html,open,rover,source};
})();
