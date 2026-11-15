/* Deterministic event-driven simulation. Pure JS: no DOM, timers, network or RNG state. */
(function(root,factory){const physics=typeof module==='object'&&module.exports?require('./mission-physics.js'):root.OrbitalPhysics;const flood=typeof module==='object'&&module.exports?require('./flood-data.js'):root.OrbitalFloodData;const api=factory(physics,flood);if(typeof module==='object')module.exports=api;else root.OrbitalEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P,Flood){
'use strict';
let D; const EPS=1e-8; const scheduleCache=new Map();
const clone=x=>JSON.parse(JSON.stringify(x));
function configure(data){if(!P)throw Error('Mission physics module is unavailable');if(data.schemaVersion!==1)throw Error('Unsupported catalogue');if(typeof data.version!=='string'||typeof data.modelVersion!=='string')throw Error('Catalogue is missing release/model provenance');D=data;scheduleCache.clear();return api;}
function normalizeMissionContext(context){
 if(context==null)return null;
 if(!context||typeof context!=='object'||context.schemaVersion!==1||context.source!=='NASA DONKI'||!['current','stale','cached','missing','no-reports'].includes(context.status))throw Error('Invalid NASA mission-context snapshot');
 if(context.retrievedAt!==null&&(typeof context.retrievedAt!=='string'||!Number.isFinite(Date.parse(context.retrievedAt))))throw Error('Invalid NASA context retrieval time');
 const s=context.signals;if(!s||['flareReports','geomagneticStormReports','cmeReports'].some(k=>!Number.isInteger(s[k])||s[k]<0||s[k]>2000))throw Error('Invalid NASA context counts');
 for(const k of ['maxReportedKp','maxReportedCmeSpeedKmS'])if(s[k]!==null&&(!Number.isFinite(s[k])||s[k]<0))throw Error('Invalid NASA context measurement');
 if(s.maxReportedKp!==null&&s.maxReportedKp>9||s.maxReportedCmeSpeedKmS!==null&&s.maxReportedCmeSpeedKmS>10000)throw Error('NASA context measurement out of range');
 if(s.strongestFlareClass!==null&&(typeof s.strongestFlareClass!=='string'||! /^[ABCMX]\d+(?:\.\d+)?$/.test(s.strongestFlareClass)))throw Error('Invalid reported flare class');
 if(!Array.isArray(context.advisories)||context.advisories.length>10||context.advisories.some(x=>typeof x!=='string'||x.length>500))throw Error('Invalid NASA advisories');
 return {schemaVersion:1,source:'NASA DONKI',adapterVersion:typeof context.adapterVersion==='string'?context.adapterVersion:'unknown',status:context.status,retrievedAt:context.retrievedAt,signals:{flareReports:s.flareReports,strongestFlareClass:s.strongestFlareClass??null,geomagneticStormReports:s.geomagneticStormReports,maxReportedKp:s.maxReportedKp??null,cmeReports:s.cmeReports,maxReportedCmeSpeedKmS:s.maxReportedCmeSpeedKmS??null},advisories:context.advisories.slice(),limitations:Array.isArray(context.limitations)?context.limitations.filter(x=>typeof x==='string').slice(0,10):[]};
}
function pinContext(run,{dataPack=null,missionContext=null,provenance=null,targetRegion=null}={},emitEvent=true){
 if(!run||typeof run!=='object')throw Error('Cannot attach provenance to an invalid mission');
 if(dataPack&&(!dataPack.manifest||typeof dataPack.manifest.packId!=='string'||typeof dataPack.manifest.dataSha256!=='string'))throw Error('Invalid geometry data-pack reference');
 const context=normalizeMissionContext(missionContext),flood=targetRegion?(Flood||{}).validateProfile(targetRegion):null;
 const derived={applicationVersion:D.version,simulationModelVersion:D.modelVersion,scenarioId:D.scenario.id,scenarioDatasetVersion:D.scenario.datasetVersion||'authored-scenario-unversioned',physicsModelVersion:D.physicsModelVersion||'orbital-physics-0.3.4',geometryPackId:dataPack?.manifest?.packId||null,geometryDatasetVersion:dataPack?(dataPack.manifest.datasetVersion||'legacy-horizons-pack'):'none',targetDatasetId:flood?.productId||null,targetDatasetVersion:flood?.datasetVersion||'none',targetDataSha256:flood?.sourceFileSha256||null,donkiAdapterVersion:context?.adapterVersion||null,donkiRetrievedAt:context?.retrievedAt||null,legacy:false};
 if(provenance!==null){
   if(!provenance||typeof provenance!=='object'||provenance.geometryPackId!==derived.geometryPackId)throw Error('Saved mission provenance does not match its pinned geometry pack');
   for(const k of ['applicationVersion','simulationModelVersion','scenarioId','scenarioDatasetVersion','geometryDatasetVersion'])if(typeof provenance[k]!=='string'||provenance[k].length>100)throw Error('Invalid saved mission provenance');
   if(provenance.legacy!==true&&(provenance.simulationModelVersion!==derived.simulationModelVersion||provenance.scenarioDatasetVersion!==derived.scenarioDatasetVersion))throw Error('Saved mission model or scenario dataset version is incompatible with this release');
   if(provenance.physicsModelVersion!==undefined&&(typeof provenance.physicsModelVersion!=='string'||provenance.physicsModelVersion.length>100))throw Error('Invalid saved physics model provenance');
   if(provenance.donkiRetrievedAt!==null&&provenance.donkiRetrievedAt!==undefined&&(typeof provenance.donkiRetrievedAt!=='string'||!Number.isFinite(Date.parse(provenance.donkiRetrievedAt))))throw Error('Invalid saved DONKI provenance');
   run.provenance={...derived,...provenance,physicsModelVersion:provenance.physicsModelVersion||derived.physicsModelVersion};
 }else run.provenance=derived;
 run.dataPack=dataPack?clone(dataPack):null;run.missionContext=context;run.targetRegion=flood?clone(flood):null;
 if(emitEvent&&context){const q=context.signals;log(run,`NASA DONKI planning-context snapshot attached · ${q.flareReports} flare(s), ${q.geomagneticStormReports} storm(s), ${q.cmeReports} CME(s). Context only; no physics, launch clearance or score changes.`,'info');}
 return run;
}
function starter(kind='balanced'){
 const parts=Object.fromEntries(D.components.filter(p=>p.category==='required').map(p=>[p.id,0]));
 parts.computer=kind==='balanced'?2:1;parts.comm=kind==='balanced'?2:1;parts.adcs=kind==='balanced'?1:0;if(kind==='balanced')parts.power=1;
 return {parts,orbit:'leo500',rocket:'falcon',plan:{imaging:kind==='lean'?'sunlit':'all',downlink:true},window:0,seed:D.scenario.seed,crew:[],approvals:[]};
}
function partValue(p,t,k){return Array.isArray(p[k])?p[k][t]:p[k];}
function totals(design){
 let r={mass:0,cost:0,basePower:0,thermalControllerPower:0,thermalPower:0,thermalHeaterW:0,capacity:0,solar:0,storage:0,downlink:0,radarPower:0,resolution:0,dataPerTile:1,lead:0,dimensions:[0,0,0],fuel:0};
 for(const p of D.components){const t=design.parts[p.id];if(t===undefined)continue;const f=1+t*.24;r.mass+=p.mass*f;r.cost+=p.cost*(1+t*.4);r.lead=Math.max(r.lead,p.lead+t*3);const draw=p.baseDraw?p.baseDraw[t]:p.watts;if(p.id==='thermal')r.thermalControllerPower+=draw;else if(p.id!=='radar')r.basePower+=draw;
 if(p.id==='bus')r.dimensions=p.dimensions.map(x=>x*(1+t*.12)+.4);
 if(p.capacity)r.capacity+=p.capacity[t];if(p.solar)r.solar+=p.solar[t];if(p.storage)r.storage+=p.storage[t];if(p.downlink)r.downlink+=p.downlink[t];
 if(p.id==='radar'){r.radarPower=p.draw[t];r.resolution=p.resolution[t];r.dataPerTile=p.dataPerTile[t];}
 if(p.id==='propulsion'){r.fuel=12;r.mass+=12;}
 }
 if(design.parts.compression!==undefined)r.dataPerTile*=D.components.find(p=>p.id==='compression').ratio[design.parts.compression];
 const thermal=D.thermalModel||{},internalHeat=(r.basePower+r.thermalControllerPower)*(thermal.internalHeatFraction??.7);
 const thermalEstimate=P.thermalHoldingLoad({temperatureK:thermal.minimumTemperatureK??255,internalHeatW:internalHeat,radiatorAreaM2:thermal.radiatorAreaM2??.4,emissivity:thermal.emissivity??.85,heaterMaxW:thermal.heaterMaxW??160});
 r.thermalHeaterW=thermalEstimate.availableHeaterW;r.thermalPower=r.thermalControllerPower+r.thermalHeaterW;r.thermalEstimate=thermalEstimate;
 const orbit=D.orbits.find(x=>x.id===design.orbit),instrument=D.instrumentModel||{},radarTier=design.parts.radar??0;
 const eclipseOneOrbit=P.eclipseWindows(orbit,{durationMinutes:P.orbitPeriodSeconds(orbit)/60,stepSeconds:30}).reduce((a,w)=>a+w.durationMinutes,0);r.orbitalModel={periodMinutes:P.orbitPeriodSeconds(orbit)/60,altitudeKm:orbit.altitude,speedMps:Math.sqrt(P.constants.earthMu/(P.constants.earthRadius+orbit.altitude*1000)),eclipseDurationMinutes:eclipseOneOrbit,sunlitDurationMinutes:P.orbitPeriodSeconds(orbit)/60-eclipseOneOrbit,eccentricity:orbit.eccentricity??0,inclinationDeg:orbit.inclinationDeg??51.6,model:'two-body Kepler propagation with optional eccentricity; GMST Earth-fixed coordinates; no J2, drag, luni-solar perturbations or orbit determination'};
 r.sar=P.sarPerformance({altitudeM:orbit.altitude*1000,bandwidthMHz:instrument.bandwidthMHz?.[radarTier]??20,incidenceDeg:instrument.incidenceDeg??35,nearIncidenceDeg:instrument.nearIncidenceDeg??25,farIncidenceDeg:instrument.farIncidenceDeg??45,antennaLengthM:instrument.antennaLengthM??10});
 r.sar.bandwidthMHz=instrument.bandwidthMHz?.[radarTier]??20;
 r.solarCosineFactor=Math.cos((D.powerModel?.arraySunIncidenceDeg??0)*Math.PI/180);r.solarEffective=r.solar*(D.powerModel?.arrayDegradationFactor??.95)*r.solarCosineFactor;
 r.rf=P.linkBudget({...D.rfModel,rangeM:600000,hardwareRateMbps:r.downlink*8000/60});
 r.fuel=12;r.propulsion=P.propulsionDeltaV({dryMassKg:Math.max(1,r.mass-r.fuel),propellantKg:r.fuel,usedPropellantKg:D.propulsionModel?.deploymentPropellantKg??2,ispSeconds:D.propulsionModel?.ispSeconds??220});
 r.lead+=10;r.launchCost=D.rockets.find(x=>x.id===design.rocket).price;r.totalCost=r.cost+r.launchCost;return r;
}
const POLYGON_SLOT_SECONDS=30;
const scheduleIdentities=new WeakMap();
function scheduleIdentity(target){
 let key=scheduleIdentities.get(target);
 if(!key){
  key=Flood.sha256(JSON.stringify([target.targetPoint,target.targetRadiusKm,target.cells]));
  scheduleIdentities.set(target,key);
 }
 return key;
}
function polygonAccess(orbit, target, minOff, maxOff, slew, settle){
 const earthKm=P.constants.earthRadius/1000;
 const direction=({lat,lon})=>{
  const a=lat*Math.PI/180,b=lon*Math.PI/180;
  return [Math.cos(a)*Math.cos(b),Math.cos(a)*Math.sin(b),Math.sin(a)];
 };
 const center=direction(target.targetPoint),cells=target.cells.map(direction);
 const slots=new Map(),access=[],count=new Uint16Array(cells.length),reachable=new Set();
 let rawAccessCount=0,previousIndex=-2,leadEnd=0,window=null;
 for(let sec=0,index=0;sec<D.scenario.deadline*60;sec+=POLYGON_SLOT_SECONDS,index++){
  const state=P.propagateOrbit(orbit,sec);
  const sat=state.positionEcefM.map(x=>x/1000),radius=Math.hypot(...sat),unit=sat.map(x=>x/radius);
  const dot=vec=>unit[0]*vec[0]+unit[1]*vec[1]+unit[2]*vec[2];
  const horizon=Math.acos(earthKm/radius);
  if(dot(center)<Math.cos(horizon+target.targetRadiusKm/earthKm))continue;
  let pick=-1,pickAngle=Infinity;
  const candidates=[];
  cells.forEach((cell,i)=>{
   const cos=Math.max(-1,Math.min(1,dot(cell)));
   if(cos<earthKm/radius)return; // below the local horizon
   const angle=Math.atan2(earthKm*Math.sqrt(Math.max(0,1-cos*cos)),radius-earthKm*cos)*180/Math.PI;
   if(angle<minOff||angle>maxOff)return;
   candidates.push(i);
   if(pick<0||count[i]<count[pick]||(count[i]===count[pick]&&angle<pickAngle)){pick=i;pickAngle=angle;}
  });
  if(pick<0)continue;
  if(index!==previousIndex+1){
   rawAccessCount++;
   leadEnd=sec+pickAngle/slew+settle;
   window=null;
  }
  previousIndex=index;
  const endSeconds=Math.min(sec+POLYGON_SLOT_SECONDS,D.scenario.deadline*60),startSeconds=Math.max(sec,leadEnd);
  if(endSeconds<=startSeconds)continue;
  count[pick]++;
  for(const i of candidates)reachable.add(i);
  slots.set(index,{tile:pick,tileDuration:(endSeconds-startSeconds)/60,tileEnd:endSeconds/60});
  if(!window){
   window={startSeconds,endSeconds,startMinutes:startSeconds/60,endMinutes:endSeconds/60,settleTimeSeconds:settle};
   access.push(window);
  }else{
   window.endSeconds=endSeconds;
   window.endMinutes=endSeconds/60;
  }
  window.durationSeconds=window.endSeconds-window.startSeconds;
  window.durationMinutes=window.durationSeconds/60;
  window.midSeconds=(window.startSeconds+window.endSeconds)/2;
 }
 const reachableAreaKm2=[...reachable].reduce((sum,i)=>sum+target.cells[i].areaKm2,0);
 return {access,slots,rawAccessCount,reachableAreaKm2};
}
function scheduleFor(design,targetRegion=null){
 const orbit=D.orbits.find(x=>x.id===design.orbit),tier=design.parts.adcs??0;
 const target=targetRegion?.targetPoint||D.scenario.targetPoint,margin=targetRegion?.targetRadiusKm||0;
 // Imported checksums are self-asserted on saved profiles. Key the schedule by actual grid contents too.
 const identity=targetRegion?scheduleIdentity(targetRegion):'synthetic-scenario';
 const key=design.orbit+':'+tier+':'+identity;
 if(!scheduleCache.has(key)){
  const a=D.adcsModel||{},maxOff=a.maximumOffNadirDeg?.[tier]??45,minOff=a.minimumOffNadirDeg??25,slewRate=a.slewRateDegPerSec?.[tier]??.5,settle=a.settleTimeSeconds??8;
  let coverageSchedule;
  if(targetRegion?.cells){
   coverageSchedule=polygonAccess(orbit,targetRegion,minOff,maxOff,slewRate,settle);
  }else{
   const raw=P.accessWindows(orbit,target,{durationMinutes:D.scenario.deadline,stepSeconds:30,minOffNadirDeg:minOff,maxOffNadirDeg:maxOff,swathMarginKm:margin});
   const access=[];
   for(const w of raw){
    const mid=(w.startSeconds+w.endSeconds)/2;
    const pointing=P.pointingAssessment(orbit,target,mid,{currentOffNadirDeg:0,maxOffNadirDeg:maxOff,slewRateDegPerSec:slewRate});
    const lead=pointing.slewTimeSeconds+settle;
    if(lead<w.durationSeconds){
     const startSeconds=w.startSeconds+lead;
     access.push({...w,startSeconds,startMinutes:startSeconds/60,durationSeconds:w.endSeconds-startSeconds,durationMinutes:(w.endSeconds-startSeconds)/60,pointingSlewSeconds:pointing.slewTimeSeconds,settleTimeSeconds:settle});
    }
   }
   coverageSchedule={access,rawAccessCount:raw.length,slots:null,reachableAreaKm2:null};
  }
  const schedule={...coverageSchedule,periodMinutes:P.orbitPeriodSeconds(orbit)/60,targetPoint:clone(target),targetRadiusKm:margin,
   targetSource:targetRegion?.cells?'user-supplied polygon scoring grid':targetRegion?'historic saved bounds, synthetic ledger':'synthetic training target',
   contacts:P.stationNetworkWindows(orbit,D.groundStations,{durationMinutes:D.scenario.deadline,stepSeconds:30,minElevationDeg:D.rfModel?.minimumElevationDeg??10}),
   eclipses:P.eclipseWindows(orbit,{durationMinutes:D.scenario.deadline,stepSeconds:30}),maxOffNadirDeg:maxOff,minOffNadirDeg:minOff,slewRateDegPerSec:slewRate};
  if(scheduleCache.size>=12)scheduleCache.delete(scheduleCache.keys().next().value);
  scheduleCache.set(key,schedule);
 }
 return scheduleCache.get(key);
}
function windowAt(windows,t){return P.accessWindowAt(windows,t);}
function tileInPass(pass,t,count){
 if(!pass||pass.endMinutes<=pass.startMinutes)return null;
 const total=pass.endMinutes-pass.startMinutes,first=Math.floor(pass.index*count/(pass.total??1)),last=Math.floor((pass.index+1)*count/(pass.total??1)),n=last-first;
 if(n<=0)return null;const within=clamp((t-pass.startMinutes)/total,0,1-Number.EPSILON),j=Math.min(n-1,Math.floor(within*n+1e-9)),duration=total/n;
 return {tile:first+j,tileDuration:duration,tileEnd:pass.startMinutes+(j+1)*duration};
}
function activeLink(orbit,elapsedMinutes,hardwareRateGbPerMinute){
 const rf=D.rfModel||{},minimum=rf.minimumElevationDeg??10,candidates=[],sampleSeconds=30,evaluationSeconds=Math.floor((elapsedMinutes*60+1e-7)/sampleSeconds)*sampleSeconds;
 for(const station of D.groundStations||[]){const g=P.groundStationElevation(orbit,station,evaluationSeconds);if(g.elevationDeg<minimum)continue;const q=P.linkBudget({...rf,rangeM:g.rangeM,hardwareRateMbps:hardwareRateGbPerMinute*8000/60});candidates.push({stationId:station.id,stationName:station.name,elevationDeg:g.elevationDeg,rangeM:g.rangeM,...q});}
 candidates.sort((a,b)=>b.usableRateMbps-a.usableRateMbps);const best=candidates[0];return best?{...best,rateGbPerMinute:best.usableRateMbps*60/8000}:null;
}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function funding(career){return D.scenario.budget+Math.min(30,Math.floor(Math.sqrt((career?.trust||0)/10))*5);}
function weather(seed,window){return {wind:window===0&&seed%3===0?22:9+((seed+window*7)%8),limit:18,delay:window*6};}
function preflight(design,career,targetRegion=null){
 const t=totals(design),v=D.rockets.find(x=>x.id===design.rocket),o=D.orbits.find(x=>x.id===design.orbit),w=weather(design.seed,design.window);
 const missing=D.components.filter(p=>p.category==='required'&&design.parts[p.id]===undefined);
 const badParents=D.components.filter(p=>design.parts[p.id]!==undefined&&p.parent&&design.parts[p.parent]===undefined);
 const checks=[
 {name:'Required capabilities',ok:!missing.length,detail:missing.length?'Install '+missing.map(p=>p.name).join(', '):'All 8 subsystems installed'},
 {name:'Compatible attachments',ok:!badParents.length,detail:badParents.length?badParents.map(p=>p.name+' needs '+p.parent).join('; '):'7 bus mounts · 1 mount per upgrade parent'},
 {name:'Mission budget',ok:t.totalCost<=funding(career),detail:`$${t.totalCost.toFixed(1)} / $${funding(career)}`},
 {name:'Launch mass',ok:t.mass<=v.capacity,detail:`${t.mass.toFixed(1)} / ${v.capacity} kg`},
 {name:'Stowed fairing fit',ok:t.dimensions.every((x,i)=>x<=v.fairing[i]),detail:t.dimensions.map(x=>x.toFixed(2)).join(' × ')+' m in '+v.fairing.join(' × ')+' m'},
 {name:'Supported injection',ok:v.injections.includes(o.injection),detail:o.injection+' injection · deployment uses 2 kg spacecraft propellant'},
 {name:'Development schedule',ok:t.lead<=D.scenario.developmentLimit,detail:t.lead+' / '+D.scenario.developmentLimit+' days'},
 {name:'Launch weather',ok:w.wind<=w.limit,detail:`Crosswind ${w.wind} m/s · limit ${w.limit} m/s · delay ${w.delay} h`},
 {name:'Crew approval',ok:!design.crew.length||design.crew.every((_,i)=>design.approvals.includes(i)),detail:design.crew.length?design.approvals.length+' / '+design.crew.length+' roles approved':'Solo command'}
 ];
 const flood=targetRegion?(Flood||{}).validateProfile(targetRegion):null,geo=scheduleFor(design,flood),adcsTier=design.parts.adcs??0,slew=(D.adcsModel?.slewRateDegPerSec?.[adcsTier]??.5);
 checks.push({name:'Propagated SAR target access',ok:geo.access.length>0,detail:geo.access.length+' usable windows after '+(geo.rawAccessCount-geo.access.length)+' ADCS slew/settle exclusions · '+geo.minOffNadirDeg+'°–'+geo.maxOffNadirDeg+'° off-nadir envelope · '+geo.targetSource+(flood?.cells?' · '+flood.cells.length+' weighted cells':'' )});
 checks.push({name:'Ground-station visibility',ok:geo.contacts.length>0,detail:geo.contacts.length+' visibility windows across '+(D.groundStations||[]).length+' virtual training nodes · elevation threshold '+(D.rfModel?.minimumElevationDeg??10)+'°'});
 checks.push({name:'ADCS slew capability',ok:slew>0&&geo.access.length>0,detail:'Illustrative slew rate '+slew+'°/s plus '+(D.adcsModel?.settleTimeSeconds??8)+' s settle; wheel momentum, jitter and control-loop dynamics not modelled'});
 checks.push({name:'Thermal heater capacity',ok:t.thermalEstimate.heaterCapacitySufficient,detail:'Estimated '+t.thermalHeaterW.toFixed(1)+' W heater demand / '+(D.thermalModel?.heaterMaxW??160)+' W available'});
 return {ok:checks.every(c=>c.ok),checks,totals:t,weather:w,geometry:geo};
}
function newCareer(){return {success:0,trust:0,attempts:0,failures:0,best:{}};}
function reward(career,score,scenario=D.scenario.id){const prev=career.best[scenario]||0,credit=Math.max(0,score-prev);career.best[scenario]=Math.max(prev,score);const sum=career.success+credit;let trust=0;if(sum>=100){trust=10+5*(sum-100);career.trust+=trust;career.success=0;}else career.success=sum;return {credit,trust};}
function start(design,career,mode='practice',targetRegion=null){
 const flood=targetRegion?(Flood||{}).validateProfile(targetRegion):null;
 const check=preflight(design,career,flood);if(!check.ok)return {error:'Preflight blocked',checks:check.checks};
 if(mode==='career')career.attempts++;
 const r={version:1,t:0,design:clone(design),initialDesign:clone(design),mode,targetRegion:flood?clone(flood):null,stats:totals(design),energy:totals(design).capacity,storage:0,queue:[],collected:Array(flood?.cells?.length??D.scenario.tiles).fill(0),delivered:Array(flood?.cells?.length??D.scenario.tiles).fill(0),events:[],trace:[],shed:false,safe:false,finished:false,committed:false,missedPower:0,missedStorage:0,changes:[],replayChanges:[],lastFlags:{},minEnergy:totals(design).capacity,maxStorage:0,fuel:10,temperatureK:D.thermalModel?.minimumTemperatureK??255,modelProvenance:{missionModelVersion:D.modelVersion,physicsModelVersion:D.physicsModelVersion||'orbital-physics-0.3.4',orbit:'two-body Kepler propagation',earthRotation:'GMST approximation',shadow:'cylindrical Earth shadow',sar:'range geometry only',rf:'free-space Shannon bound',power:'rated array with charge/discharge efficiencies',thermal:'single-node shaded radiator estimate',assumptionsVersion:D.physicsModelVersion||'orbital-physics-0.3.4'}};
 const initial=flags(r);r.lastFlags={eclipse:initial.eclipse,contact:initial.contact};
 log(r,'Launch and LEO injection confirmed.','pass');log(r,'Arrays deployed. Mission clock started.','pass');sample(r);return r;
}
function log(r,message,type='info'){r.events.push({t:r.t,message,type});}
function flags(r){
 const o=D.orbits.find(x=>x.id===r.design.orbit),geo=scheduleFor(r.design,r.targetRegion||null),cycle=Math.floor((r.t+EPS)/geo.periodMinutes),phase=r.t-cycle*geo.periodMinutes;
 const orbital=P.propagateOrbit(o,r.t*60),passWindow=windowAt(geo.access,r.t),contactWindow=windowAt(geo.contacts,r.t),eclipseWindow=windowAt(geo.eclipses,r.t),eclipse=!!eclipseWindow;
 const pass=passWindow?{...passWindow,total:geo.access.length}:null;
 const tileInfo=!pass?null:geo.slots?geo.slots.get(Math.floor((r.t*60+1e-7)/POLYGON_SLOT_SECONDS)):tileInPass(pass,r.t,D.scenario.tiles);
 const tile=tileInfo?.tile??-1;
 const modeAllowed=!!pass&&(r.design.plan.imaging==='all'||(r.design.plan.imaging==='eclipse'&&eclipse)||(r.design.plan.imaging==='sunlit'&&!eclipse));
 const canImage=modeAllowed&&tile>=0&&!r.shed&&!r.safe,link=contactWindow&&r.design.plan.downlink&&!r.safe?activeLink(o,r.t,r.stats.downlink):null;
 const sensorOn=canImage,imaging=canImage,transmit=!!link;
 return {o,geo,cycle,phase,eclipse,contact:!!contactWindow,contactWindow,pass:!!passWindow,passWindow,tile,tileDuration:tileInfo?.tileDuration??0,tileEnd:tileInfo?.tileEnd??Infinity,canImage:modeAllowed, sensorOn,imaging,transmit,link,orbital};
}
function nextBoundaryFromFlags(r,f){
 const moments=[D.scenario.deadline,f.tileEnd];
 for(const list of [f.geo.access,f.geo.contacts,f.geo.eclipses])for(const w of list){if(w.startMinutes>r.t+EPS)moments.push(w.startMinutes);if(w.endMinutes>r.t+EPS)moments.push(w.endMinutes);}
 if(f.contact){const linkTick=(Math.floor((r.t*60+1e-7)/30)+1)*0.5;if(linkTick>r.t+EPS)moments.push(linkTick);}
 if(r.replayChanges.length)moments.push(r.replayChanges[0].t);
 return Math.min(...moments.filter(x=>x>r.t+EPS));
}
function nextBoundary(r){return nextBoundaryFromFlags(r,flags(r));}
function sample(r){const f=flags(r);const point={t:r.t,energy:r.energy,storage:r.storage,returned:coverage(r),eclipse:f.eclipse,altitudeKm:f.orbital.altitudeM/1000,latitudeDeg:f.orbital.latitudeDeg,longitudeDeg:f.orbital.longitudeDeg,linkRateMbps:f.link?.usableRateMbps??0,groundElevationDeg:f.link?.elevationDeg??null,temperatureK:r.temperatureK??null};if(r.trace.length&&Math.abs(r.trace.at(-1).t-r.t)<EPS)r.trace[r.trace.length-1]=point;else r.trace.push(point);}
function areaCoverage(r){
 const target=r.targetRegion, cells=target?.cells;
 if(!cells)return null;
 const measure=ledger=>cells.reduce((sum,cell,i)=>sum+cell.areaKm2*clamp(ledger[i],0,1),0);
 return {targetKm2:target.areaKm2,reachableKm2:scheduleFor(r.design,target).reachableAreaKm2,
  imagedKm2:measure(r.collected),deliveredKm2:measure(r.delivered)};
}
function coverage(r){
 const area=areaCoverage(r);
 return area ? area.deliveredKm2/area.targetKm2*100 : r.delivered.reduce((a,b)=>a+b,0)/D.scenario.tiles*100;
}
function downlink(r,volume){while(volume>EPS&&r.queue.length){const p=r.queue[0],n=Math.min(volume,p.gb);r.delivered[p.tile]+=n/r.stats.dataPerTile;p.gb-=n;r.storage-=n;volume-=n;if(p.gb<EPS)r.queue.shift();}r.storage=Math.max(0,r.storage);}
function sync(r){const f=flags(r),st=r.stats,reserve=D.scenario.reserve??20;
 if(f.eclipse!==r.lastFlags.eclipse){log(r,f.eclipse?'Earth-shadow entry · solar generation unavailable.':'Sunlight restored · solar arrays available at '+st.solarEffective.toFixed(1)+' W','pass');r.lastFlags.eclipse=f.eclipse;}
 if(f.contact!==r.lastFlags.contact){log(r,f.contact?'Ground-station line of sight open · '+(f.link?.stationName||'virtual network')+'.':'Ground-station line of sight closed.');r.lastFlags.contact=f.contact;}
 if(!r.shed&&r.energy<=reserve+EPS){r.shed=true;log(r,'Protected reserve reached · imaging shed at '+r.energy.toFixed(1)+' Wh.','warn');}
 if(!r.safe&&r.energy<=EPS){r.safe=true;log(r,'Battery depleted · non-essential loads disabled.','warn');}
 if((r.shed||r.safe)&&!f.eclipse&&r.energy>=reserve+5-EPS){r.shed=false;r.safe=false;log(r,'Energy reserves recovered · imaging may resume.','pass');}
}
function step(r,until){
 if(r.finished)return r;until=Math.min(D.scenario.deadline,Math.max(r.t,until));let guard=0;
 while(r.t<until-EPS){if(++guard>200000)throw Error('Simulation failed to advance');
  while(r.replayChanges.length&&r.replayChanges[0].t<=r.t+EPS){const c=r.replayChanges.shift();changePlan(r,c.plan);}
  let f=flags(r);const st=r.stats;sync(r);f=flags(r);let end=Math.min(until,nextBoundaryFromFlags(r,f));
  const generation=f.eclipse?0:st.solarEffective,pm=D.powerModel||{},chargeEff=pm.chargeEfficiency??.95,dischargeEff=pm.dischargeEfficiency??.95,thermal=D.thermalModel||{},internalHeat=(st.basePower+st.thermalControllerPower+(f.sensorOn?st.radarPower:0))*(thermal.internalHeatFraction??.7),heater=P.thermalHoldingLoad({temperatureK:thermal.minimumTemperatureK??255,internalHeatW:internalHeat,radiatorAreaM2:thermal.radiatorAreaM2??.4,emissivity:thermal.emissivity??.85,heaterMaxW:thermal.heaterMaxW??160}).availableHeaterW,load=r.safe?0:st.basePower+st.thermalControllerPower+heater+(f.sensorOn?st.radarPower:0),net=generation-load;
  const batteryRate=net>=0?net*chargeEff:net/dischargeEff;
  if(batteryRate<0){const threshold=!r.shed?D.scenario.reserve:0,time=(r.energy-threshold)/(-batteryRate)*60;if(time>EPS)end=Math.min(end,r.t+time);}
  if(batteryRate>0&&r.energy<st.capacity-EPS){const recoveryTarget=(r.shed||r.safe)?Math.min(st.capacity,(D.scenario.reserve??20)+5):st.capacity;const time=(recoveryTarget-r.energy)/batteryRate*60;if(time>EPS)end=Math.min(end,r.t+time);}
  if(end<=r.t+EPS){r.t=Math.min(until,r.t+1e-7);continue;}
  const dt=end-r.t;
  const downlinkCapacity=f.transmit?Math.min(st.downlink,f.link.rateGbPerMinute)*dt:0;
  if(f.pass&&f.tile>=0){const weight=r.targetRegion?.cells?r.targetRegion.cells[f.tile].areaKm2/r.targetRegion.areaKm2*D.scenario.tiles:1;const possible=Math.min(dt/Math.max(f.tileDuration,EPS),1-r.collected[f.tile]);if(f.imaging){const room=Math.max(0,st.storage-r.storage+downlinkCapacity)/st.dataPerTile,capture=Math.min(possible,room);if(capture>EPS){r.collected[f.tile]+=capture;r.queue.push({tile:f.tile,gb:capture*st.dataPerTile});r.storage+=capture*st.dataPerTile;}r.missedStorage+=weight*Math.max(0,possible-capture);}else if(f.canImage||r.shed||r.safe)r.missedPower+=weight*possible;}
  if(downlinkCapacity>0)downlink(r,downlinkCapacity);
  const thermalResult=P.thermalStep({temperatureK:r.temperatureK??(thermal.minimumTemperatureK??255),internalHeatW:internalHeat,radiatorAreaM2:thermal.radiatorAreaM2??.4,emissivity:thermal.emissivity??.85,heatCapacityJK:thermal.heatCapacityJK??80000,seconds:dt*60,minTemperatureK:thermal.minimumTemperatureK??255,maxTemperatureK:thermal.maximumTemperatureK??310,heaterMaxW:thermal.heaterMaxW??160,heaterInputW:heater});
  const battery=P.batteryEnergyStep({energyWh:r.energy,solarW:generation,loadW:load,seconds:dt*60,chargeEfficiency:chargeEff,dischargeEfficiency:dischargeEff,capacityWh:st.capacity});
  r.temperatureK=thermalResult.temperatureK;r.energy=battery.energyWh;r.t=end;r.minEnergy=Math.min(r.minEnergy,r.energy);r.maxStorage=Math.max(r.maxStorage,r.storage);sample(r);
 }
 sync(r);if(r.t>=D.scenario.deadline-EPS){r.finished=true;log(r,'72-hour science deadline reached.','info');}return r;
}
function changePlan(r,plan){r.design.plan=clone(plan);r.changes.push({t:r.t,plan:clone(plan)});log(r,'Operations updated · imaging '+plan.imaging+' · downlink '+(plan.downlink?'enabled':'disabled'));}
function complete(r,career,abort=false){if(!r.finished&&!abort)step(r,D.scenario.deadline);if(abort){r.finished=true;r.aborted=true;log(r,'Mission ended early by commander.','warn');}const cov=coverage(r),ok=cov+EPS>=D.scenario.target&&!r.aborted,score=40+Math.floor(60*Math.min(1,cov/D.scenario.target)+EPS);let earned=r.earned||{credit:0,trust:0};if(r.mode==='career'&&!r.committed){if(!ok)career.failures++;earned=reward(career,score,r.targetRegion?.cells?D.scenario.id+':polygon':D.scenario.id);r.earned=earned;r.committed=true;}return {ok,score,coverage:cov,area:areaCoverage(r),earned,elapsed:r.t,minEnergy:r.minEnergy,maxStorage:r.maxStorage,undelivered:r.storage,missedPower:r.missedPower,missedStorage:r.missedStorage};}
function replay(r,career){const design=clone(r.initialDesign),n=start(design,career,r.mode,r.targetRegion||null);if(n.error)return n;n.replayChanges=clone(r.changes);pinContext(n,{dataPack:r.dataPack||null,missionContext:r.missionContext||null,targetRegion:r.targetRegion||null,provenance:r.provenance||null},false);return n;}
function eclipseCheck(energy,base,imaging,duration,reserve=20){const threshold=Math.max(0,(energy-reserve)/(base+imaging)*60),active=Math.min(duration,threshold);return {shedAt:threshold<duration?threshold:null,remaining:Math.max(0,energy-(base+imaging)*active/60-base*(duration-active)/60)};}
const api={configure,starter,totals,preflight,funding,weather,newCareer,reward,start,step,flags,nextBoundary,nextBoundaryFromFlags,coverage,areaCoverage,complete,replay,changePlan,eclipseCheck,normalizeMissionContext,pinContext,clone};return api;
});
