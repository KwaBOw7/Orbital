import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const catalog = JSON.parse(read('data/catalog.json'));
const release = JSON.parse(read('version.json'));
const pkg = JSON.parse(read('package.json'));
if (catalog.version !== pkg.version || release.appVersion !== pkg.version) {
  throw new Error(`Release version mismatch: package=${pkg.version}, catalogue=${catalog.version}, manifest=${release.appVersion}`);
}
if (catalog.physicsModelVersion !== release.physicsModelVersion || catalog.marsModelVersion !== release.marsSimulationModelVersion) {
  throw new Error('Physics model versions in catalogue and release manifest do not match.');
}
const script = value => value.replace(/<\/script/gi, '<\\/script');
const app = read('src/shell.html');
const shared = {
  STYLE: read('src/style.css').replace('/*FLIGHT_IMAGES*/', '') + '\n' + read('src/data-style.css'),
  DATA: script(`const ORBITAL_DATA = ${JSON.stringify(catalog)};`),
  THREE: script(read('assets/vendor/three-r128.min.js')),
  MODELS: script(['src/scene-runtime.js','assets/models/earth-texture.js','assets/models/earth.js','assets/models/moon.js','assets/models/lander.js','assets/models/mars-globe.js','assets/models/observatory.js','assets/models/sar.js','assets/models/rocket.js','src/model-canvas.js','src/model-viewer.js','src/inline-models.js'].map(read).join('\n')),
  PACKS: script(read('src/data-packs.js')),
  FLOOD_DATA: script(read('src/flood-data.js')),
  DATA_UI: script(read('src/data-ui.js')),
  PHYSICS: script(read('src/mission-physics.js')),
  ENGINE: script(read('src/engine.js')),
  MARS_ENGINE: script(read('src/mars-engine.js')),
  MARS: script(read('assets/models/mars-terrain.js') + read('src/mars-scene.js')),
  MARS_UI: script(read('src/mars-ui.js')),
  RENDERER: script(read('src/renderer.js')),
  FLIGHT: script(read('src/flight.js')),
  APP: script(read('src/app.js')),
};
function assemble(online) {
  const sources = {...shared, ONLINE_SCRIPT: online ? `<script>${script(read('src/online.js'))}</script>` : ''};
  let html=app.replace(/\/\*([A-Z_]+)\*\//g,(match,key)=>sources[key]??match);
  if (online) html=html.replace("connect-src 'none'", "connect-src 'self'");
  if (/\/\*[A-Z_]+\*\//.test(html)) throw new Error('Unresolved build placeholder remains in generated HTML.');
  return html;
}
fs.mkdirSync('dist',{recursive:true});
const offline=assemble(false), online=assemble(true);
fs.writeFileSync('dist/index.html',offline);
fs.writeFileSync('dist/online.html',online);
console.log(`Built offline-first game (${Buffer.byteLength(offline)} bytes) and optional loopback edition (${Buffer.byteLength(online)} bytes) for v${pkg.version}.`);
