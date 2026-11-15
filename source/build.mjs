import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const catalog = JSON.parse(read('data/catalog.json'));
const script = value => value.replace(/<\/script/gi, '<\\/script');
const app = read('src/shell.html');
const shared = {
  STYLE: read('src/style.css').replace('/*FLIGHT_IMAGES*/', '') + '\n' + read('src/data-style.css'),
  DATA: script(`const ORBITAL_DATA = ${JSON.stringify(catalog)};`),
  MARS_ENGINE: script(read('src/mars-engine.js')),
  MARS_UI: script(read('src/mars-ui.js')),
  MARS: script(`const ORBITAL_ROVER_STL = '${fs.readFileSync('assets/models/mars_rover.stl').toString('base64')}';\n` + read('assets/models/mars-terrain.js') + read('src/mars-scene.js')),
  THREE: script(read('assets/vendor/three-r128.min.js')),
  MODELS: script(['src/scene-runtime.js', 'assets/models/earth-texture.js', 'assets/models/earth.js', 'assets/models/moon.js', 'assets/models/lander.js', 'assets/models/mars-globe.js', 'assets/models/hubble.js', 'assets/models/rocket.js', 'src/model-canvas.js', 'src/model-viewer.js', 'src/inline-models.js'].map(read).join('\n')),
  PACKS: script(read('src/data-packs.js')),
  DATA_UI: script(read('src/data-ui.js')),
  ENGINE: script(read('src/engine.js')),
  RENDERER: script(read('src/renderer.js')),
  FLIGHT: script(read('src/flight.js')),
  APP: script(read('src/app.js')),
};

fs.mkdirSync('dist', {recursive: true});
const sources = {...shared, ONLINE_SCRIPT: `<script>${script(read('src/online.js'))}</script>`};
const game = app.replace(/\/\*([A-Z_]+)\*\//g, (match, key) => sources[key] ?? match)
  .replace("connect-src 'none'", "connect-src 'self'");
fs.writeFileSync('dist/online.html', game);
fs.copyFileSync('src/start-required.html', 'dist/index.html');
console.log(`Built launcher-only game (${Buffer.byteLength(game)} bytes) and setup page`);
