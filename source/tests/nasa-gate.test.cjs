const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const Mars=require('../src/mars-engine.js');
const Packs=require('../src/data-packs.js');
const fixture=require('./fixtures/synthetic-pack.json');

function browser(protocol='http:',hostname='127.0.0.1'){
  const root={innerHTML:''},callbacks=[];
  let requests=0,status={status:'offline',mode:'offline',report:null},context={schemaVersion:1,source:'NASA DONKI',status:'missing',signals:{}};
  const contextVm=vm.createContext({AbortController,location:{protocol,hostname},setTimeout,clearTimeout,setInterval:callback=>callbacks.push(callback),document:{hidden:false,querySelector:id=>id==='#nasa-reports'?root:null,addEventListener(){}},fetch:async path=>{requests++;if(path==='/api/nasa/status')return {ok:true,json:async()=>status};if(path==='/api/nasa/mission-context')return {ok:true,json:async()=>context};throw Error('unexpected route');}});
  vm.runInContext(fs.readFileSync('src/online.js','utf8'),contextVm);
  const api=vm.runInContext('OrbitalOnline',contextVm);
  api.start();
  return {api,root,callbacks,set status(next){status=next;},set context(next){context=next;},get requests(){return requests;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('NASA planning context is optional and does not gate game startup',async()=>{
  const h=browser(); await flush();
  assert.equal(h.requests,2);
  assert.match(h.root.innerHTML,/Latest available space-weather reports/);
  assert.doesNotMatch(h.root.innerHTML,/NASA verification required/);
  h.context={schemaVersion:1,source:'NASA DONKI',status:'current',retrievedAt:'2026-11-15T08:00:00Z',signals:{flareReports:1,strongestFlareClass:'M1.2',geomagneticStormReports:0,maxReportedKp:null,cmeReports:0,maxReportedCmeSpeedKmS:null},limitations:['Context only.']};
  h.callbacks[0](); await flush();
  assert.equal(h.api.missionContext().status,'current');
  assert.match(h.root.innerHTML,/Mission-planning context/);
});
test('opening the game file directly or on another origin makes no authentication or provider request',async()=>{
  for(const [protocol,host] of [['file:',''],['https:','example.org']]){
    const h=browser(protocol,host); await flush();
    assert.equal(h.requests,0);
    assert.equal(h.api.missionContext(),null);
  }
});
function relayRun(time,rangeKm){
  const pack=structuredClone(fixture),table=JSON.parse(pack.data);
  table.samples=table.samples.map(row=>({...row,positionKm:[rangeKm,0,0],velocityKmS:[0,0,0],
    rangeKm,idealDelaySeconds:rangeKm/299792.458}));
  pack.data=JSON.stringify(table);
  Object.assign(pack.manifest,{formatId:'orbital.earth-mars-v1',interpolation:'cubic-hermite-position-velocity-v1',
    dataSha256:Packs.sha256(pack.data),dataBytes:pack.data.length});
  pack.manifest.packId='mars-'+pack.manifest.dataSha256.slice(0,16);
  const run=Mars.launch(Mars.starter());
  Mars.advance(run,time);
  Object.assign(run,{modelVersion:'mars-1',dataPack:Packs.validate(pack),visited:3,rocks:2,samples:['rock-2','rock-3']});
  return run;
}
test('Mars scoring waits for Earth reception after upload and preserves pinned delay in saves',()=>{
  const run=relayRun(45,50e6);
  assert.equal(Mars.task(run,'relay'),true);
  assert.equal(run.task.sentAt,47);
  assert.ok(Math.abs(run.task.end-47-50e6/299792.458/60)<1e-10);
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
  const near=relayRun(170.5,50e6),far=relayRun(170.5,350e6);
  assert.equal(Mars.actions(near).relay,true);
  assert.equal(Mars.actions(far).relay,false);
  const offline=relayRun(170.5,50e6);delete offline.dataPack;
  assert.equal(Mars.actions(offline).relay,true);
  assert.equal(Mars.task(offline,'relay'),true);
  assert.equal(offline.task.signalDelaySource,'offline-baseline');
});
