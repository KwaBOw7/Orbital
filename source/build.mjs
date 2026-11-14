import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
const catalog = JSON.parse(read('data/catalog.json'));
const starterPath = 'data/packs/earth-mars-pack.json';
const starter = fs.existsSync(starterPath) ? JSON.parse(read(starterPath)) : null;
const script = value => value.replace(/<\/script/gi, '<\\/script');
const app = read('src/shell.html');
const scenicCSS = ':root{' + ['earth', 'mars'].map(name =>
  `--${name}-scene:url(data:image/webp;base64,${fs.readFileSync('assets/' + name + '.webp').toString('base64')});`
).join('') + '}';
const shared = {
  STYLE: read('src/style.css').replace('/*FLIGHT_IMAGES*/', () => scenicCSS) + '\n' + read('src/data-style.css'),
  DATA: script(`const ORBITAL_DATA = ${JSON.stringify(catalog)};\nconst ORBITAL_STARTER = ${JSON.stringify(starter)};`),
  MARS: script(`const ORBITAL_ROVER_STL = '${fs.readFileSync('assets/models/mars_rover.stl').toString('base64')}';\n` + read('assets/models/mars-terrain.js') + read('src/mars-scene.js')),
  THREE: script(read('assets/vendor/three-r128.min.js')),
  MODELS: script(['assets/models/hubble.js', 'assets/models/rocket.js', 'src/model-canvas.js', 'src/model-viewer.js'].map(read).join('\n')),
  PACKS: script(read('src/data-packs.js')),
  DATA_UI: script(read('src/data-ui.js')),
  ENGINE: script(read('src/engine.js')),
  RENDERER: script(read('src/renderer.js')),
  FLIGHT: script(read('src/flight.js')),
  APP: script(read('src/app.js')),
};

fs.mkdirSync('dist', {recursive: true});
for (const [filename, online] of [['index.html', false], ['online.html', true]]) {
  const sources = {...shared, ONLINE_SCRIPT: online ? `<script>${script(read('src/online.js'))}</script>` : ''};
  let html = app.replace(/\/\*([A-Z_]+)\*\//g, (match, key) => sources[key] ?? match);
  if (online) html = html.replace("connect-src 'none'", "connect-src 'self'");
  fs.writeFileSync('dist/' + filename, html);
  console.log(`Built ${filename} (${Buffer.byteLength(html)} bytes)`);
}
