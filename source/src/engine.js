/* Deterministic event-driven simulation. Pure JS: no DOM, timers, network or RNG state. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.OrbitalEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
let D; const EPS=1e-8;
const clone=x=>JSON.parse(JSON.stringify(x));
function configure(data){if(data.schemaVersion!==1)throw Error('Unsupported catalogue');D=data;return api;}
function starter(kind='balanced'){
 const parts=Object.fromEntries(D.components.filter(p=>p.category==='required').map(p=>[p.id,0]));
 parts.computer=1;parts.comm=1;if(kind==='balanced')parts.power=1;
 return {parts,orbit:'leo500',rocket:'falcon',plan:{imaging:kind==='lean'?'sunlit':'eclipse',downlink:true},window:0,seed:D.scenario.seed,crew:[],approvals:[]};
}
function partValue(p,t,k){return Array.isArray(p[k])?p[k][t]:p[k];}
function totals(design){
 let r={mass:0,cost:0,basePower:0,capacity:0,solar:0,storage:0,downlink:0,radarPower:0,resolution:0,dataPerTile:1,lead:0,dimensions:[0,0,0],fuel:0};
 for(const p of D.components){const t=design.parts[p.id];if(t===undefined)continue;const f=1+t*.24;r.mass+=p.mass*f;r.cost+=p.cost*(1+t*.4);r.lead=Math.max(r.lead,p.lead+t*3);if(p.id!=='radar')r.basePower+=p.baseDraw?p.baseDraw[t]:p.watts;
 if(p.id==='bus')r.dimensions=p.dimensions.map(x=>x*(1+t*.12)+.4);
 if(p.capacity)r.capacity+=p.capacity[t];if(p.solar)r.solar+=p.solar[t];if(p.storage)r.storage+=p.storage[t];if(p.downlink)r.downlink+=p.downlink[t];
 if(p.id==='radar'){r.radarPower=p.draw[t];r.resolution=p.resolution[t];r.dataPerTile=p.dataPerTile[t];}if(p.id==='propulsion'){r.fuel=12;r.mass+=12;}
 } if(design.parts.compression!==undefined)r.dataPerTile*=D.components.find(p=>p.id==='compression').ratio[design.parts.compression];
 r.lead+=10;r.launchCost=D.rockets.find(x=>x.id===design.rocket).price;r.totalCost=r.cost+r.launchCost;return r;
}
function funding(career){return D.scenario.budget+Math.min(30,Math.floor(Math.sqrt((career?.trust||0)/10))*5);}
function weather(seed,window){return {wind:window===0&&seed%3===0?22:9+((seed+window*7)%8),limit:18,delay:window*6};}
function preflight(design,career){
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
 ];return {ok:checks.every(c=>c.ok),checks,totals:t,weather:w};
}
function newCareer(){return {success:0,trust:0,attempts:0,failures:0,best:{}};}
function reward(career,score,scenario=D.scenario.id){const prev=career.best[scenario]||0,credit=Math.max(0,score-prev);career.best[scenario]=Math.max(prev,score);const sum=career.success+credit;let trust=0;if(sum>=100){trust=10+5*(sum-100);career.trust+=trust;career.success=0;}else career.success=sum;return {credit,trust};}
function start(design,career,mode='practice'){
 const check=preflight(design,career);if(!check.ok)return {error:'Preflight blocked',checks:check.checks};
 if(mode==='career')career.attempts++;
 const r={version:1,t:0,design:clone(design),initialDesign:clone(design),mode,stats:totals(design),energy:totals(design).capacity,storage:0,queue:[],collected:Array(D.scenario.tiles).fill(0),delivered:Array(D.scenario.tiles).fill(0),events:[],trace:[],shed:false,safe:false,finished:false,committed:false,missedPower:0,missedStorage:0,changes:[],replayChanges:[],lastFlags:{},minEnergy:totals(design).capacity,maxStorage:0,fuel:10};
 log(r,'Launch and LEO injection confirmed.','pass');log(r,'Arrays deployed. Mission clock started.','pass');sample(r);return r;
}
function log(r,message,type='info'){r.events.push({t:r.t,message,type});}
function flags(r){const o=D.orbits.find(x=>x.id===r.design.orbit),cycle=Math.floor((r.t+EPS)/o.period),phase=r.t-cycle*o.period;const inside=a=>phase>=a[0]-EPS&&phase<a[1]-EPS;const eclipse=inside(o.eclipse),contact=o.contacts.some(inside);let pass=null;
 if(inside(o.sunPass)&&['sunlit','all'].includes(r.design.plan.imaging))pass=o.sunPass;
 if(inside(o.nightPass)&&['eclipse','all'].includes(r.design.plan.imaging))pass=o.nightPass;
 const tile=pass?cycle*15+Math.floor(phase-pass[0]+EPS):-1;
 const sensorOn=(!r.shed&&!r.safe)&&((eclipse&&['eclipse','all'].includes(r.design.plan.imaging))||(!eclipse&&!!pass));
 return {o,cycle,phase,eclipse,contact,pass,tile,sensorOn,imaging:pass&&tile<D.scenario.tiles&&!r.shed&&!r.safe,transmit:contact&&r.design.plan.downlink&&!r.safe};
}
function nextBoundary(r){const f=flags(r),o=f.o,base=f.cycle*o.period;
 let points=[o.period,...o.eclipse,...o.sunPass,...o.nightPass,...o.contacts.flat()];
 if(f.pass)points.push(Math.floor(f.phase+EPS)+1);
 let next=Math.min(...points.filter(x=>x>f.phase+EPS).map(x=>base+x),D.scenario.deadline);
 if(r.replayChanges.length)next=Math.min(next,r.replayChanges[0].t);
 return next;
}
function sample(r){const f=flags(r);const point={t:r.t,energy:r.energy,storage:r.storage,returned:coverage(r),eclipse:f.eclipse};if(r.trace.length&&Math.abs(r.trace.at(-1).t-r.t)<EPS)r.trace[r.trace.length-1]=point;else r.trace.push(point);}
function coverage(r){return r.delivered.reduce((a,b)=>a+b,0)/D.scenario.tiles*100;}
function downlink(r,volume){while(volume>EPS&&r.queue.length){const p=r.queue[0],n=Math.min(volume,p.gb);r.delivered[p.tile]+=n/r.stats.dataPerTile;p.gb-=n;r.storage-=n;volume-=n;if(p.gb<EPS)r.queue.shift();}r.storage=Math.max(0,r.storage);}
function sync(r){let f=flags(r);const st=r.stats;
 if(f.eclipse!==r.lastFlags.eclipse){if(f.eclipse){log(r,'Eclipse entry · battery '+r.energy.toFixed(1)+' Wh');}else{r.shed=false;r.safe=false;log(r,'Sunlight restored · solar '+st.solar+' W','pass');}r.lastFlags.eclipse=f.eclipse;}
 if(f.contact!==r.lastFlags.contact){log(r,f.contact?'Ground contact open.':'Ground contact closed.');r.lastFlags.contact=f.contact;}
 if(f.eclipse&&r.energy<=D.scenario.reserve+EPS&&!r.shed){r.shed=true;log(r,'Protected reserve reached · imaging shed at '+r.energy.toFixed(1)+' Wh.','warn');}
 if(f.eclipse&&r.energy<=EPS&&!r.safe){r.safe=true;log(r,'Battery depleted · safe mode until sunlight.','warn');}
}
function step(r,until){
 if(r.finished)return r;until=Math.min(D.scenario.deadline,Math.max(r.t,until));let guard=0;
 while(r.t<until-EPS){if(++guard>100000)throw Error('Simulation failed to advance');
 while(r.replayChanges.length&&r.replayChanges[0].t<=r.t+EPS){const c=r.replayChanges.shift();changePlan(r,c.plan);}
 let f=flags(r);const st=r.stats;
 sync(r);
 f=flags(r);let end=Math.min(until,nextBoundary(r));const gen=f.eclipse?0:st.solar;const demand=r.safe?0:st.basePower+(f.sensorOn?st.radarPower:0);const net=gen-demand;
 if(net<0){const threshold=!r.shed?D.scenario.reserve:0;const time=(r.energy-threshold)/(-net)*60;if(time>EPS)end=Math.min(end,r.t+time);}
 if(net>0&&r.energy<st.capacity-EPS)end=Math.min(end,r.t+(st.capacity-r.energy)/net*60);
 if(end<=r.t+EPS){r.t=Math.min(until,r.t+1e-7);continue;}
 const dt=end-r.t;
 // Contacts and target imaging windows are disjoint in the bundled scenarios.
 if(f.transmit)downlink(r,st.downlink*dt);
 if(f.pass&&f.tile<D.scenario.tiles){const possible=Math.min(dt,1-r.collected[f.tile]);if(f.imaging){const capture=Math.min(possible,Math.max(0,st.storage-r.storage)/st.dataPerTile);if(capture>EPS){r.collected[f.tile]+=capture;r.queue.push({tile:f.tile,gb:capture*st.dataPerTile});r.storage+=capture*st.dataPerTile;}r.missedStorage+=Math.max(0,possible-capture);}else if(r.shed||r.safe)r.missedPower+=possible;}
 r.energy=Math.max(0,Math.min(st.capacity,r.energy+net*dt/60));r.t=end;r.minEnergy=Math.min(r.minEnergy,r.energy);r.maxStorage=Math.max(r.maxStorage,r.storage);sample(r);
 }
 sync(r);
 if(r.t>=D.scenario.deadline-EPS){r.finished=true;log(r,'72-hour science deadline reached.','info');}
 return r;
}
function changePlan(r,plan){r.design.plan=clone(plan);r.changes.push({t:r.t,plan:clone(plan)});log(r,'Operations updated · imaging '+plan.imaging+' · downlink '+(plan.downlink?'enabled':'disabled'));}
function complete(r,career,abort=false){if(!r.finished&&!abort)step(r,D.scenario.deadline);if(abort){r.finished=true;r.aborted=true;log(r,'Mission ended early by commander.','warn');}const cov=coverage(r),ok=cov+EPS>=D.scenario.target&&!r.aborted,score=40+Math.floor(60*Math.min(1,cov/D.scenario.target)+EPS);let earned=r.earned||{credit:0,trust:0};if(r.mode==='career'&&!r.committed){if(!ok)career.failures++;earned=reward(career,score);r.earned=earned;r.committed=true;}return {ok,score,coverage:cov,earned,elapsed:r.t,minEnergy:r.minEnergy,maxStorage:r.maxStorage,undelivered:r.storage,missedPower:r.missedPower,missedStorage:r.missedStorage};}
function replay(r,career){const design=clone(r.initialDesign),n=start(design,career,r.mode);if(n.error)return n;n.replayChanges=clone(r.changes);return n;}
function eclipseCheck(energy,base,imaging,duration,reserve=20){const threshold=Math.max(0,(energy-reserve)/(base+imaging)*60),active=Math.min(duration,threshold);return {shedAt:threshold<duration?threshold:null,remaining:Math.max(0,energy-(base+imaging)*active/60-base*(duration-active)/60)};}
const api={configure,starter,totals,preflight,funding,weather,newCareer,reward,start,step,flags,nextBoundary,coverage,complete,replay,changePlan,eclipseCheck,clone};return api;
});
