/* Adapted from supplied moon scene; source retained in references/. */
function moonScene(view, rendererInstance, canvas) {
const life=orbitalSceneRuntime(view,rendererInstance,canvas);
const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;
try{

  var scene = life.track(new THREE.Scene());
  var camera = new THREE.PerspectiveCamera(40, life.width() / life.height(), 0.1, 100);
  camera.position.set(0, 0, 4);
  var renderer = rendererInstance;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(life.width(), life.height());
  

  // --- deterministic noise ---
  function hash(x, y, z) {
    var h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
    return h - Math.floor(h);
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = smooth(x - xi), yf = smooth(y - yi), zf = smooth(z - zi);
    function l(a, b, t) { return a + (b - a) * t; }
    return l(
      l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), xf), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), xf), yf),
      l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), xf), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), xf), yf),
      zf);
  }
  function fbm(x, y, z) {
    var s = 0, a = 0.5, f = 1;
    for (var i = 0; i < 5; i++) { s += a * vnoise(x * f, y * f, z * f); f *= 2.1; a *= 0.5; }
    return s;
  }

  // --- craters (seeded) ---
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  var craters = [];
  for (var i = 0; i < 70; i++) {
    var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    craters.push({ x: s * Math.cos(th), y: u, z: s * Math.sin(th), r: 0.04 + Math.pow(rnd(), 2.2) * 0.22 });
  }

  // radius for a unit direction
  function radius(x, y, z) {
    var r = 1 + (fbm(x * 3, y * 3, z * 3) - 0.5) * 0.05 + (fbm(x * 14, y * 14, z * 14) - 0.5) * 0.012;
    for (var i = 0; i < craters.length; i++) {
      var c = craters[i];
      var d = Math.acos(Math.max(-1, Math.min(1, x * c.x + y * c.y + z * c.z)));
      var t = d / c.r;
      if (t < 1.35) {
        var depth = c.r * 0.28;
        if (t < 1) r -= depth * (1 - t * t);
        r += depth * 0.35 * Math.exp(-Math.pow((t - 1.05) * 5, 2)); // raised rim
      }
    }
    return r;
  }
  function pos(x, y, z, out) {
    var l = Math.sqrt(x * x + y * y + z * z); x /= l; y /= l; z /= l;
    var r = radius(x, y, z);
    out.set(x * r, y * r, z * r);
    return out;
  }

  // --- geometry ---
  var geo = new THREE.SphereGeometry(1, rendererInstance.isCanvasFallback?64:96, rendererInstance.isCanvasFallback?32:48);
  var p = geo.attributes.position, n = geo.attributes.normal;
  var a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(),
      t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), nn = new THREE.Vector3(), up = new THREE.Vector3();
  var eps = 0.004;
  for (var i = 0; i < p.count; i++) {
    nn.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    up.set(Math.abs(nn.y) > 0.99 ? 1 : 0, Math.abs(nn.y) > 0.99 ? 0 : 1, 0);
    t1.crossVectors(nn, up).normalize();
    t2.crossVectors(nn, t1).normalize();
    pos(nn.x, nn.y, nn.z, a);
    pos(nn.x + t1.x * eps, nn.y + t1.y * eps, nn.z + t1.z * eps, b);
    pos(nn.x + t2.x * eps, nn.y + t2.y * eps, nn.z + t2.z * eps, c);
    p.setXYZ(i, a.x, a.y, a.z);
    b.sub(a); c.sub(a);
    var norm = b.cross(c).normalize();
    if (norm.dot(nn) < 0) norm.negate();
    n.setXYZ(i, norm.x, norm.y, norm.z);
  }
  p.needsUpdate = true; n.needsUpdate = true;

  var moon = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8d8d8d, roughness: 1, metalness: 0 }));
  scene.add(moon);

  scene.add(new THREE.AmbientLight(0x30343c, 0.6));
  var sun = new THREE.DirectionalLight(0xfff6ea, 2.4);
  sun.position.set(5, 2, 4);
  scene.add(sun);

  // stars
  var sp = [];
  for (var i = 0; i < 900; i++) {
    var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 40;
    sp.push(R * s * Math.cos(th), R * u, R * s * Math.sin(th));
  }
  var sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08, sizeAttenuation: true })));

  // --- controls ---
  var dragging = false, lx = 0, ly = 0, vy = 0.0015, rotY = 0, rotX = 0.15, dist = 4;
  var el = renderer.domElement, pointers = {}, pinch = 0;
  life.on(el,'pointerdown', function (e) {
    pointers[e.pointerId] = e; dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId);
  });
  life.on(el,'pointermove', function (e) {
    if (!pointers[e.pointerId]) return;
    pointers[e.pointerId] = e;
    var ids = Object.keys(pointers);
    if (ids.length === 2) {
      var d = Math.hypot(pointers[ids[0]].clientX - pointers[ids[1]].clientX, pointers[ids[0]].clientY - pointers[ids[1]].clientY);
      if (pinch) dist = Math.min(8, Math.max(1.8, dist * pinch / d));
      pinch = d; return;
    }
    rotY += (e.clientX - lx) * 0.006; rotX += (e.clientY - ly) * 0.006;
    rotX = Math.max(-1.4, Math.min(1.4, rotX));
    lx = e.clientX; ly = e.clientY;
  });
  function up_(e) { delete pointers[e.pointerId]; pinch = 0; dragging = Object.keys(pointers).length > 0; }
  life.on(el,'pointerup', up_); life.on(el,'pointercancel', up_);
  life.on(el,'wheel', function (e) {
    e.preventDefault(); dist = Math.min(8, Math.max(1.8, dist * (1 + e.deltaY * 0.001)));
  }, { passive: false });
  life.resize( function () {
    camera.aspect = life.width() / life.height(); camera.updateProjectionMatrix(); renderer.setSize(life.width(), life.height());
  });

  (function loop() {
    life.frame(loop);
    if (!dragging && !reducedMotion) rotY += vy;
    moon.rotation.y = rotY; moon.rotation.x = rotX;
    camera.position.z = dist;
    renderer.render(scene, camera);
  })();

return life.stop;
}catch(error){life.stop();throw error;}
}
