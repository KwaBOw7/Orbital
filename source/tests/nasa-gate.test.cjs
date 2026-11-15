const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Mars=require('../src/mars-engine.js');
const Packs=require('../src/data-packs.js');
const fixture=require('./fixtures/synthetic-pack.json');

function browser(protocol='http:',hostname='127.0.0.1'){
  const root={innerHTML:''},callbacks=[];
  let unlocked=0,locked=0,requests=0;
  let status={ready:false,status:'locked'};
  const context=vm.createContext({
    AbortController,location:{protocol,hostname},setTimeout,clearTimeout,
    setInterval: callback=>callbacks.push(callback),
    document:{querySelector:id=>id==='#root'?root:null,addEventListener(){}},
    fetch:async path=>{requests++;assert.equal(path,'/api/nasa/status');return {ok:true,json:async()=>status};}
  });
  vm.runInContext(fs.readFileSync('src/online.js','utf8'),context);
  const api=vm.runInContext('OrbitalOnline',context);
  api.start(()=>unlocked++,()=>locked++);
  return {api,root,callbacks,set status(next){status=next;},get unlocked(){return unlocked;},
    get locked(){return locked;},get requests(){return requests;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('browser only unlocks after launcher verifies a structurally valid NASA snapshot',async()=>{
  const h=browser();
  await flush();
  assert.equal(h.unlocked,0);
  assert.match(h.root.innerHTML,/NASA verification required/);
  h.status={ready:true,status:'current',report:{feeds:{}}};
  h.callbacks[0]();await flush();assert.equal(h.unlocked,0);
  h.status={ready:true,status:'current',report:{
    provider:'NASA CCMC DONKI',schemaVersion:1,datasetId:'donki-'+'a'.repeat(64),
    retrievedAt:'2026-11-15T08:00:00Z',feeds:{
      flares:{items:[]},storms:{items:[]},cmes:{items:[]}
    }
  }};
  h.callbacks[0]();await flush();
  assert.equal(h.unlocked,1);
  assert.equal(h.api.ready(),true);
  h.status={ready:false};
  h.callbacks[0]();await flush();
  assert.equal(h.locked,1);
  assert.equal(h.api.ready(),false);
});
test('opening the game file directly or on another origin cannot attempt authentication',async()=>{
  for(const [protocol,host] of [['file:',''],['https:','example.org']]){
    const h=browser(protocol,host);
    await flush();
    assert.equal(h.requests,0);
    assert.equal(h.unlocked,0);
    assert.match(h.root.innerHTML,/NASA verification required/);
  }
});
function relayRun(time,rangeKm){
  const pack=structuredClone(fixture),table=JSON.parse(pack.data);
  table.samples=table.samples.map(row=>({...row,positionKm:[rangeKm,0,0],velocityKmS:[0,0,0],
    rangeKm,idealDelaySeconds:rangeKm/299792.458}));
  pack.data=JSON.stringify(table);
  Object.assign(pack.manifest,{formatId:'orbital.earth-mars-v1',interpolation:'cubic-hermite-position-velocity-v1',
    dataSha256:Packs.sha256(pack.data),dataBytes:pack.data.length});
  delete pack.manifest.compatibleGameVersions;
  pack.manifest.packId='mars-'+pack.manifest.dataSha256.slice(0,16);
  const run=Mars.launch(Mars.starter());
  Mars.advance(run,time);
  Object.assign(run,{modelVersion:'mars-1',dataPack:Packs.validate(pack),visited:3,rocks:2,samples:['rock-2','rock-3']});
  return run;
}
test('Mars scoring waits for Earth reception after upload and preserves pinned delay in saves',()=>{
  const run=relayRun(100,50e6);
  assert.equal(Mars.task(run,'relay'),true);
  assert.equal(run.task.sentAt,102);
  assert.ok(Math.abs(run.task.end-102-50e6/299792.458/60)<1e-10);
  Mars.advance(run,run.task.sentAt);
  assert.equal(run.relayed,false);
  const restored=Mars.restore(run);
  const corrupted=structuredClone(run);
  corrupted.task.end+=1;
  assert.throws(()=>Mars.restore(corrupted),/pinned geometry/);
  Mars.advance(restored,restored.task.end);
  assert.equal(restored.relayed,true);
  assert.equal(Mars.score(restored).base,100);
});
test('a longer Horizons range can turn an open relay slot into a missed Earth deadline',()=>{
  const near=relayRun(170,50e6),far=relayRun(170,350e6);
  assert.equal(Mars.actions(near).relay,true);
  assert.equal(Mars.actions(far).relay,false);
  delete near.dataPack;
  assert.equal(Mars.actions(near).relay,false);
});
