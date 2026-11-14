import fs from 'node:fs';
import path from 'node:path';
const data=JSON.parse(fs.readFileSync('data/catalog.json','utf8'));
let html=fs.readFileSync('src/shell.html','utf8');
for(const [key,value] of Object.entries({STYLE:fs.readFileSync('src/style.css','utf8'),DATA:'const ORBITAL_DATA = '+JSON.stringify(data)+';',ENGINE:fs.readFileSync('src/engine.js','utf8'),RENDERER:fs.readFileSync('src/renderer.js','utf8'),APP:fs.readFileSync('src/app.js','utf8')}))html=html.replace('/*'+key+'*/',()=>value);
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',html);console.log('Built self-contained offline game: dist/index.html ('+Buffer.byteLength(html)+' bytes)');
