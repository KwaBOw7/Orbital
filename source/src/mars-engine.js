/* Illustrative Mars mission rules. No values here are NASA flight specifications. */
(function(root,factory){const physics=typeof module==='object'&&module.exports?require('./mission-physics.js'):root.OrbitalPhysics;const packs=typeof module==='object'&&module.exports?require('./data-packs.js'):root.OrbitalPacks;const api=factory(physics,packs);if(typeof module==='object'&&module.exports)module.exports=api;else root.MarsMission=api;})(typeof globalThis!=='undefined'?globalThis:this,function(P,Packs){
'use strict';
  const types=[
    {id:'scout',name:'Scout',note:'Light, quick and affordable. Limited science payload.',mass:130,cost:35,speed:2.2,scale:.82,color:0xb6cbd4},
    {id:'survey',name:'Surveyor',note:'Balanced mobility, battery endurance and science.',mass:230,cost:55,speed:1.7,scale:1,color:0xc3b49c},
    {id:'heavy',name:'Pathfinder',note:'Heavy chassis with extra endurance for advanced instruments.',mass:340,cost:75,speed:1.3,scale:1.13,color:0xc9a46f}
  ];
  const parts=[
    {id:'wheels',name:'Wheel & drive system',required:true,mass:30,cost:14,note:'Higher tiers improve ground speed and slope capability.'},
    {id:'battery',name:'Battery pack',required:true,mass:24,cost:16,note:'Stores energy for driving and science. Higher tiers extend range.'},
    {id:'power',name:'Solar power',required:true,mass:18,cost:14,note:'Recharges the battery while you wait or advance time.'},
    {id:'navigation',name:'Navigation cameras',required:true,mass:8,cost:10,note:'Identifies waypoint targets; higher tiers support steeper routes.'},
    {id:'radio',name:'Communications',required:true,mass:8,cost:10,note:'Returns science during relay contacts. Higher tiers shorten uploads.'},
    {id:'science',name:'Rock spectrometer',required:true,mass:18,cost:18,note:'Analyzes rocks at marked sites. Higher tiers reduce analysis time.'},
    {id:'thermal',name:'Thermal system',required:true,mass:12,cost:10,note:'Protects essential electronics. Better insulation reduces idle draw.'},
    {id:'descent',name:'Landing system',required:true,mass:85,cost:28,note:'Parachute and powered-descent package; tiers increase landing mass capacity.'},
    {id:'drill',name:'Core drill',required:false,mass:30,cost:24,note:'Collects subsurface cores at science sites and improves the science score.'},
    {id:'storage',name:'Extra science storage',required:false,mass:6,cost:10,note:'Adds capacity for core samples and repeat measurements.'},
    {id:'traction',name:'Terrain mobility kit',required:false,mass:20,cost:16,note:'Increases safe slope angle and improves driving efficiency.'},
    {id:'antenna',name:'High-gain antenna',required:false,mass:10,cost:16,note:'Shortens relay uploads and opens an additional relay opportunity.'}
  ];
  const rockets=[
    {id:'courier',name:'Courier',capacity:600,cost:55,note:'Light Mars transfer service. Lowest price; limited payload.'},
    {id:'voyager',name:'Voyager',capacity:1000,cost:80,note:'Medium lift with room for a science rover and upgrades.'},
    {id:'atlas',name:'Atlas Heavy',capacity:1600,cost:115,note:'Heavy transfer service for the largest rover configurations.'}
  ];
  const orbits=[
    {id:'direct',name:'Direct entry',cost:0,extraMass:0,relayAltitudeKm:400,relayEccentricity:0,relayInclinationDeg:25,relayRaanDeg:74,relayMeanAnomalyDeg:230,note:'Direct atmospheric entry; relay uses a separate assumed circular training orbiter.'},
    {id:'elliptic',name:'Elliptical Mars relay orbit',cost:22,extraMass:65,relayAltitudeKm:500,relayEccentricity:.04,relayInclinationDeg:40,relayRaanDeg:50,relayMeanAnomalyDeg:5,note:'Training elliptical relay orbit with eccentricity 0.04; visibility uses a two-body Kepler reference trajectory. Transfer and capture dynamics are not simulated.'},
    {id:'polar',name:'Polar Mars parking orbit',cost:38,extraMass:100,relayAltitudeKm:400,relayEccentricity:0,relayInclinationDeg:90,relayRaanDeg:75,relayMeanAnomalyDeg:350,note:'Polar staging concept; relay visibility is approximated with a circular reference orbiter.'}
  ];
  const waypoints=[{name:'Landing apron',x:15,z:700},{name:'Delta outcrop',x:38,z:684},{name:'Crater ridge',x:42,z:699}];
  const budget=390,deadline=180;let landing=0;
  const relaySite={name:'Jezero training site',lat:18.4,lon:77.5,altitudeM:-2500};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const starter=()=>({type:'survey',parts:Object.fromEntries(parts.filter(p=>p.required).map(p=>[p.id,0])),rocket:'voyager',orbit:'direct'});
  function validate(d){
    if(!d||!types.some(t=>t.id===d.type)||!rockets.some(r=>r.id===d.rocket)||!orbits.some(o=>o.id===d.orbit)||!d.parts||typeof d.parts!=='object'||Array.isArray(d.parts))throw Error('Invalid Mars design');
    for(const [id,tier] of Object.entries(d.parts))if(!parts.some(p=>p.id===id)||!Number.isInteger(tier)||tier<0||tier>3)throw Error('Invalid Mars part');
    return {type:d.type,parts:{...d.parts},rocket:d.rocket,orbit:d.orbit};
  }
  function stats(d){
    const type=types.find(t=>t.id===d.type),rocket=rockets.find(r=>r.id===d.rocket),orbit=orbits.find(o=>o.id===d.orbit);
    let mass=type.mass+orbit.extraMass,cost=type.cost+rocket.cost+orbit.cost;
    for(const p of parts)if(d.parts[p.id]!==undefined){mass+=p.mass*(1+.22*d.parts[p.id]);cost+=p.cost*(1+.4*d.parts[p.id]);}
    const t=id=>d.parts[id]??0,has=id=>d.parts[id]!==undefined;
    return {mass,cost,speed:type.speed*(1+.18*t('wheels')),maxSpeedMps:type.speed*(1+.18*t('wheels')),driveAccelerationMps2:.45+.12*t('wheels')+.18*t('traction'),brakeDecelerationMps2:1.2+.25*t('traction'),rollingResistanceMps2:.06,tractionCoefficient:.55+.12*t('traction'),capacity:160+100*t('battery')+(type.id==='heavy'?80:0),solar:35+22*t('power'),idle:15-2*t('thermal'),drive:70*(has('traction')?.8:1),driveEfficiency:.8,slope:22+3*t('navigation')+(has('traction')?12+2*t('traction'):0),analysis:Math.max(2,8-2*t('science')),upload:Math.max(.5,2-.35*t('radio')-(has('antenna')?.7:0)),storage:2+(has('storage')?2+2*t('storage'):0),landingCapacity:650+200*t('descent'),type,rocket,orbit};
  }
  function buildDescentProfile(d){
    const s=stats(d),entryVehicleMassKg=s.mass+1450,dt=.5,heatShieldCdAreaM2=40,parachuteCdAreaM2=400,atmosphere={surfaceDensityKgM3:.0182,scaleHeightM:3216},maxThrustN=30000;
    let altitudeM=125000,horizontalSpeedMps=5300,verticalSpeedMps=1100,seconds=0,phase='entry';
    const samples=[{seconds,altitudeM,speedMps:Math.hypot(horizontalSpeedMps,verticalSpeedMps),horizontalSpeedMps,verticalSpeedMps,phase,densityKgM3:P.marsAtmosphericDensity(altitudeM,atmosphere),dynamicPressurePa:0}],events=[{seconds:0,name:'Atmospheric entry',note:'Point-mass entry begins with a 5.3 km/s horizontal and 1.1 km/s downward velocity assumption.'}];
    let parachute=false,shieldSeparated=false,terrainNav=false,powered=false,skyCrane=false;
    for(let guard=0;altitudeM>0&&seconds<1200;guard++){
      if(guard>5000)throw Error('Mars descent integration did not converge');
      if(!parachute&&altitudeM<=11000){parachute=true;phase='parachute';events.push({seconds,name:'Parachute deployment',note:'A simplified drag-area increase represents parachute deployment.'});}
      if(parachute&&!shieldSeparated&&altitudeM<=9000){shieldSeparated=true;events.push({seconds,name:'Heat-shield separation',note:'A scripted stage event; separation dynamics and heat-shield ablation are not modelled.'});}
      if(parachute&&!terrainNav&&altitudeM<=4000){terrainNav=true;events.push({seconds,name:'Terrain-relative navigation',note:'Navigation phase marker; no image-based terrain matching is simulated.'});}
      if(!powered&&altitudeM<=2100){powered=true;phase='powered';events.push({seconds,name:'Powered descent',note:'A bounded thrust-control model begins braking toward a guided vertical descent speed.'});}
      if(powered&&altitudeM<=21&&!skyCrane){skyCrane=true;phase='sky-crane';events.push({seconds,name:'Sky-crane lowering',note:'Final lowering is represented by a controlled 0.75 m/s vertical rate.'});}
      const density=P.marsAtmosphericDensity(altitudeM,atmosphere),speed=Math.hypot(horizontalSpeedMps,verticalSpeedMps);let ax=0,az=0;
      if(!powered){const cdArea=parachute?parachuteCdAreaM2:heatShieldCdAreaM2,dragAcceleration=.5*density*speed*speed*cdArea/entryVehicleMassKg;ax=-dragAcceleration*horizontalSpeedMps/Math.max(speed,1);az=P.constants.marsGravity-dragAcceleration*verticalSpeedMps/Math.max(speed,1);}
      else{const maxAccel=maxThrustN/entryVehicleMassKg,targetDown=altitudeM>21?15:.75;ax=-Math.min(maxAccel,Math.max(0,horizontalSpeedMps)*1.5);az=Math.max(-maxAccel,Math.min(maxAccel,(targetDown-verticalSpeedMps)*1.2));}
      horizontalSpeedMps=Math.max(0,horizontalSpeedMps+ax*dt);verticalSpeedMps=Math.max(0,verticalSpeedMps+az*dt);altitudeM=Math.max(0,altitudeM-verticalSpeedMps*dt);seconds+=dt;
      const nextSpeed=Math.hypot(horizontalSpeedMps,verticalSpeedMps),nextDensity=P.marsAtmosphericDensity(altitudeM,atmosphere);
      samples.push({seconds,altitudeM,speedMps:nextSpeed,horizontalSpeedMps,verticalSpeedMps,phase,densityKgM3:nextDensity,dynamicPressurePa:.5*nextDensity*nextSpeed*nextSpeed});
    }
    if(altitudeM>0)throw Error('Mars descent profile failed to reach the surface');
    events.push({seconds,name:'Touchdown',note:'Point-mass powered descent reaches the surface at a controlled low vertical speed.'});
    return {modelVersion:'mars-edl-point-mass-0.3.4',stepSeconds:dt,touchdownSeconds:seconds,entryVehicleMassKg,atmosphere,heatShieldCdAreaM2,parachuteCdAreaM2,maxThrustN,assumptions:'Educational 2D point-mass model. Exponential density, constant drag areas, fixed entry state, no lift, bank guidance, ablation, winds, terrain-relative navigation, propellant accounting or flight-certified thrust/landing validation.',limitations:['2D point-mass trajectory; no lateral crossrange or bank control','Exponential atmosphere and fixed drag-area coefficients','Fixed initial entry state and simplified event triggers','No heat-shield ablation, winds, or terrain-relative navigation','Powered descent has no propellant mass accounting or throttle/engine qualification','Not validated against a flown Mars landing trajectory'],events,samples};
  }
  function descentAt(profile,seconds){
    if(!profile||!Array.isArray(profile.samples)||!Number.isFinite(seconds))throw Error('Invalid Mars descent profile/time');
    const rows=profile.samples;if(seconds<=0)return {...rows[0]};if(seconds>=profile.touchdownSeconds)return {...rows.at(-1),altitudeM:0,phase:'touchdown'};
    let lo=0,hi=rows.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(rows[mid].seconds<=seconds)lo=mid;else hi=mid;}
    const a=rows[lo],b=rows[hi],f=(seconds-a.seconds)/(b.seconds-a.seconds),mix=k=>a[k]+(b[k]-a[k])*f;
    return {seconds,altitudeM:mix('altitudeM'),speedMps:mix('speedMps'),horizontalSpeedMps:mix('horizontalSpeedMps'),verticalSpeedMps:mix('verticalSpeedMps'),phase:a.phase,densityKgM3:mix('densityKgM3'),dynamicPressurePa:mix('dynamicPressurePa')};
  }
  function landingTime(r){return (r?.descentProfile?.touchdownSeconds??defaultDescentProfile.touchdownSeconds)/60;}
  const defaultDescentProfile=buildDescentProfile({type:'survey',parts:Object.fromEntries(parts.filter(p=>p.required).map(p=>[p.id,0])),rocket:'voyager',orbit:'direct'});
  landing=defaultDescentProfile.touchdownSeconds/60;
  function checks(d){const s=stats(d);return [
    ...parts.filter(p=>p.required).map(p=>({name:p.name,ok:d.parts[p.id]!==undefined,detail:d.parts[p.id]===undefined?'Required part missing':'Installed'})),
    {name:'Mission budget',ok:s.cost<=budget,detail:'$'+s.cost.toFixed(1)+' / $'+budget},
    {name:'Rocket payload',ok:s.mass<=s.rocket.capacity,detail:s.mass.toFixed(1)+' / '+s.rocket.capacity+' kg'},
    {name:'Landing capacity',ok:s.mass-s.orbit.extraMass<=s.landingCapacity,detail:(s.mass-s.orbit.extraMass).toFixed(1)+' / '+s.landingCapacity+' kg'}
  ];}
  function launch(d,mode='practice',career=null){d=validate(d);if(checks(d).some(c=>!c.ok))throw Error('Mars preflight checks failed');if(!['practice','career'].includes(mode))throw Error('Invalid Mars mode');if(mode==='career'){if(!career||!Number.isInteger(career.attempts))throw Error('Missing career');career.attempts++;}const s=stats(d),descentProfile=buildDescentProfile(d);return {manual:true,mode,committed:false,aborted:false,design:clone(d),t:0,visited:0,rocks:0,cores:0,relayed:false,task:null,events:['Atmospheric entry confirmed.'],position:{x:0,z:700,heading:0},speedMps:0,energy:s.capacity,distance:0,samples:[],message:'Landing in progress.',dataPack:null,provenance:null,descentProfile,modelProvenance:{surface:'traction-limited rover kinematics',descent:descentProfile.modelVersion,relay:'Mars-fixed two-body Kepler reference orbiter visibility; orbit-specific circular/eccentricity assumption recorded in design catalog',assumptions:'educational-not-flight-validated'}};}
  function pinProvenance(r,dataPack=null,provenance=null){
    if(!r||r.manual!==true)throw Error('Invalid Mars mission provenance target');
    if(dataPack){if(!Packs)throw Error('Geometry-pack validator is unavailable');dataPack=Packs.validate(dataPack);}
    if(!provenance||typeof provenance!=='object')throw Error('Mars mission provenance is required');
    const geometryPackId=dataPack?.manifest?.packId||null;
    if(provenance.geometryPackId!==geometryPackId)throw Error('Saved Mars provenance does not match its pinned geometry pack');
    for(const k of ['applicationVersion','simulationModelVersion','scenarioId','scenarioDatasetVersion','geometryDatasetVersion'])if(typeof provenance[k]!=='string'||!provenance[k].length||provenance[k].length>100)throw Error('Invalid saved Mars provenance');
    if(provenance.physicsModelVersion!==undefined&&(typeof provenance.physicsModelVersion!=='string'||!provenance.physicsModelVersion.length||provenance.physicsModelVersion.length>100))throw Error('Invalid saved Mars physics-model provenance');
    const expectedGeometryVersion=dataPack?(dataPack.manifest.datasetVersion||'legacy-horizons-pack'):'none';
    if(provenance.geometryDatasetVersion!==expectedGeometryVersion)throw Error('Mars provenance geometry dataset version does not match its pinned pack');
    if(provenance.legacy!==undefined&&typeof provenance.legacy!=='boolean')throw Error('Invalid Mars legacy provenance flag');
    r.provenance=clone(provenance);r.dataPack=dataPack?clone(dataPack):null;return r;
  }
  function contacts(r){const o=r?.design?stats(r.design).orbit:orbits[0],orbit={altitudeKm:o.relayAltitudeKm,eccentricity:o.relayEccentricity??0,inclinationDeg:o.relayInclinationDeg,raanDeg:o.relayRaanDeg,meanAnomalyDeg:o.relayMeanAnomalyDeg},site=relaySite,windows=P.marsRelayWindows(orbit,site,{durationMinutes:deadline,stepSeconds:30,minElevationDeg:10});return windows.map(w=>[w.startMinutes,w.endMinutes]);}
  function propagationAt(r,minutes){
    // Optional Horizons geocentric range. Without a pack, offline practice explicitly uses an uncorrected educational baseline.
    if(!r.dataPack)return {delayMinutes:0,rangeKm:null,source:'offline-baseline',packId:null};
    const start=Date.parse(r.dataPack.manifest.coverage.start),g=Packs.geometry(r.dataPack,start+minutes*60000);
    if(g.status!=='calculated')return null;
    return {delayMinutes:g.idealDelaySeconds/60,rangeKm:g.rangeKm,source:'JPL-Horizons-derived-ideal-delay',packId:r.dataPack.manifest.packId,geometryEpochUtc:g.requestedEpochUtc};
  }
  const finished=r=>r.relayed||r.t>=deadline||!!r.aborted;
  function relayPlan(r,at=r.t){
    const s=stats(r.design),sendAt=at+s.upload,geometry=propagationAt(r,sendAt);
    if(!geometry)return null;
    const window=contacts(r).find(([a,b])=>at>=a-1e-9&&sendAt<=b+1e-9);
    if(!window||sendAt+geometry.delayMinutes>deadline+1e-9)return null;
    return {startAt:at,sentAt:sendAt,earthReceiveAt:sendAt+geometry.delayMinutes,uploadMinutes:s.upload,...geometry};
  }
  function actions(r){const s=stats(r.design),ready=r.t>=landingTime(r)&&!finished(r)&&!r.task;const atSite=r.visited>=2&&Math.hypot(r.position.x-waypoints[r.visited-1].x,r.position.z-waypoints[r.visited-1].z)<7;return {sample:ready&&atSite&&r.rocks<r.visited-1&&r.samples.length<s.storage&&r.energy>=12,core:ready&&atSite&&r.design.parts.drill!==undefined&&!r.samples.includes('core-'+r.visited)&&r.samples.length<s.storage&&r.energy>=20,relay:ready&&r.visited===3&&r.rocks===2&&!!relayPlan(r),drive:ready&&r.energy>2};}
  function task(r,kind){if(!actions(r)[kind])return false;const s=stats(r.design),duration=kind==='sample'?s.analysis:kind==='core'?s.analysis+2:s.upload;if(r.t+duration>deadline)return false;if(kind==='relay'){const plan=relayPlan(r);if(!plan)return false;r.task={kind,name:'Relaying results',startAt:r.t,sentAt:plan.sentAt,earthReceiveAt:plan.earthReceiveAt,delayMinutes:plan.delayMinutes,rangeKm:plan.rangeKm,signalDelaySource:plan.source,geometryPackId:plan.packId,geometryEpochUtc:plan.geometryEpochUtc||null,transmissionComplete:false,end:plan.earthReceiveAt};}else r.task={kind,name:{sample:'Analyzing rock',core:'Drilling a core'}[kind],startAt:r.t,end:r.t+duration};if(kind==='sample')r.energy-=12;if(kind==='core')r.energy-=20;return true;}
  function advance(r,to){if(finished(r))return;const previous=r.t,requested=Math.min(deadline,Math.max(r.t,to)),target=Math.min(requested,r.task?.end??deadline);r.energy=Math.min(stats(r.design).capacity,Math.max(0,r.energy+(stats(r.design).solar-stats(r.design).idle)*(target-r.t)/60));r.t=target;if(r.task?.kind==='relay'&&!r.task.transmissionComplete&&previous<r.task.sentAt&&target>=r.task.sentAt){r.task.transmissionComplete=true;r.events.push('Upload complete; waiting for the signal to reach Earth.');}if(r.task&&r.t>=r.task.end){const task=r.task;r.task=null;if(task.kind==='sample'){r.rocks++;r.samples.push('rock-'+r.visited);}if(task.kind==='core'){r.cores++;r.samples.push('core-'+r.visited);}if(task.kind==='relay'){r.relayed=true;r.events.push(`Science received on Earth after ${task.delayMinutes.toFixed(2)} min ideal one-way propagation.`);}else r.events.push(task.kind==='sample'?'Rock analysis saved.':'Subsurface core saved.');r.message=r.events.at(-1);}}
  function move(r,input,dt,height=()=>0){
    if(!r.manual||r.t<landingTime(r)||finished(r)||r.task||!Number.isFinite(dt)||dt<=0)return false;
    dt=Math.min(.1,dt);const s=stats(r.design);
    if(r.energy<=2){r.speedMps=0;r.message='Battery low. Wait for solar charging.';return false;}
    r.position.heading=(r.position.heading+(input.turn||0)*1.5*dt+Math.PI*2)%(Math.PI*2);
    const oldSpeed=r.speedMps||0;
    if(input.brake){
      const newSpeed=Math.sign(oldSpeed)*Math.max(0,Math.abs(oldSpeed)-s.brakeDecelerationMps2*dt),step=(oldSpeed+newSpeed)*.5*dt;
      const x=r.position.x+Math.cos(r.position.heading)*step,z=r.position.z+Math.sin(r.position.heading)*step;
      if(Math.abs(x)<=120&&Math.abs(z-700)<=120){r.position.x=x;r.position.z=z;r.distance+=Math.abs(step);}else r.speedMps=0;
      r.speedMps=newSpeed;r.message='Braking · deceleration is limited by the rover brake model.';return Math.abs(step)>0;
    }
    const command=Math.max(-1,Math.min(1,input.forward||0));
    if(command===0&&Math.abs(oldSpeed)<1e-8)return false;
    const currentX=r.position.x,currentZ=r.position.z,probeX=currentX+Math.cos(r.position.heading),probeZ=currentZ+Math.sin(r.position.heading),slopeRad=Math.atan2(height(probeX,probeZ)-height(currentX,currentZ),1),slopeDeg=Math.abs(slopeRad*180/Math.PI);
    if(slopeDeg>s.slope){r.speedMps=Math.sign(oldSpeed)*Math.max(0,Math.abs(oldSpeed)-s.brakeDecelerationMps2*dt);r.message='Slope exceeds the mobility envelope. Reduce speed or find a gentler route.';return false;}
    const gradeAcceleration=P.constants.marsGravity*Math.sin(slopeRad),tractionLimit=s.tractionCoefficient*P.constants.marsGravity*Math.cos(slopeRad),drive=command*s.driveAccelerationMps2,rolling=Math.sign(oldSpeed||command)*s.rollingResistanceMps2,acceleration=Math.max(-tractionLimit,Math.min(tractionLimit,drive-gradeAcceleration-rolling));
    const newSpeed=Math.max(-s.maxSpeedMps,Math.min(s.maxSpeedMps,oldSpeed+acceleration*dt)),step=(oldSpeed+newSpeed)*.5*dt,x=currentX+Math.cos(r.position.heading)*step,z=currentZ+Math.sin(r.position.heading)*step;
    if(Math.abs(x)>120||Math.abs(z-700)>120){r.speedMps=0;r.message='Survey boundary reached. Turn back toward the marked sites.';return false;}
    r.position.x=x;r.position.z=z;r.speedMps=newSpeed;r.distance+=Math.abs(step);
    const motorLoadW=s.drive*Math.abs(command)/s.driveEfficiency;r.energy=Math.max(0,r.energy-motorLoadW*dt/3600);r.message=command<0?'Reversing · acceleration, grade and traction limits applied.':command>0?'Driving · acceleration, grade and traction limits applied.':'Coasting · grade and rolling resistance applied.';
    const target=waypoints[r.visited];if(target&&Math.hypot(x-target.x,z-target.z)<6&&(r.visited<2||r.rocks>=r.visited-1)){r.visited++;r.events.push(target.name+' reached.');r.message=r.visited===1?'Apron reached. Continue to the delta outcrop.':'Site reached. Press X to analyze the rock.';}
    return Math.abs(step)>0;
  }
  function score(r){return {base:(r.t>=landingTime(r)?20:0)+r.visited*10+r.rocks*15+(r.relayed?20:0),bonus:r.relayed?r.cores*5:0};}
  function settle(r,career,reward){
    if(!finished(r)||r.committed||r.mode!=='career')return r.earned||{credit:0,trust:0};
    if(!r.relayed||r.aborted)career.failures++;
    r.earned=reward(career,score(r).base,'mars-survey-01');r.committed=true;return r.earned;
  }
  function restore(r){
    if(!r||r.manual!==true)throw Error('Invalid Mars session');r=clone(r);r.mode??='practice';r.committed??=false;r.aborted??=false;if(!['practice','career'].includes(r.mode)||typeof r.committed!=='boolean'||typeof r.aborted!=='boolean'||(r.committed&&!finished(r))||(r.mode==='practice'&&r.committed))throw Error('Invalid Mars career state');if(r.earned&&(!r.committed||!Number.isFinite(r.earned.credit)||r.earned.credit<0||r.earned.credit>100||!Number.isFinite(r.earned.trust)||r.earned.trust<0||r.earned.trust>510))throw Error('Invalid Mars reward');const design=validate(r.design),s=stats(design);r.descentProfile??=buildDescentProfile(design);r.speedMps??=0;
    if(checks(design).some(c=>!c.ok))throw Error('Invalid launched Mars design');
    const bounds={t:[0,deadline],visited:[0,3],rocks:[0,2],cores:[0,2],energy:[0,s.capacity],distance:[0,1e7]};
    for(const [k,[min,max]] of Object.entries(bounds))if(!Number.isFinite(r[k])||r[k]<min||r[k]>max)throw Error('Invalid Mars '+k);
    for(const k of ['visited','rocks','cores'])if(!Number.isInteger(r[k]))throw Error('Invalid Mars count');
    if(r.rocks>Math.max(0,r.visited-1)||typeof r.relayed!=='boolean'||(r.relayed&&(r.rocks!==2||r.visited!==3))||(r.t<landingTime(r)&&(r.visited||r.rocks)))throw Error('Invalid Mars objectives');
    if(!r.position||!Number.isFinite(r.position.x)||!Number.isFinite(r.position.z)||Math.abs(r.position.x)>120||Math.abs(r.position.z-700)>120||!Number.isFinite(r.position.heading)||!Number.isFinite(r.speedMps)||Math.abs(r.speedMps)>10)throw Error('Invalid rover position');
    if(!Array.isArray(r.samples)||r.samples.length>s.storage||r.samples.some(x=>!/^((rock|core)-[23])$/.test(x))||new Set(r.samples).size!==r.samples.length||r.samples.length!==r.rocks+r.cores)throw Error('Invalid Mars samples');
    if(!Array.isArray(r.events)||r.events.length>100||r.events.some(x=>typeof x!=='string'||x.length>300))throw Error('Invalid Mars events');
    if(r.dataPack)r.dataPack=Packs.validate(r.dataPack);
    if(r.task){
      if(!['sample','core','relay'].includes(r.task.kind)||!Number.isFinite(r.task.end)||r.task.end<r.t||r.task.end>deadline||typeof r.task.name!=='string'||r.task.name.length>100)throw Error('Invalid Mars task');
      if(r.task.kind==='relay'){
        const p=relayPlan({...r,t:r.task.startAt??r.t,task:null});
        if(!p||!Number.isFinite(r.task.sentAt)||!Number.isFinite(r.task.earthReceiveAt)||!Number.isFinite(r.task.delayMinutes)||Math.abs(r.task.sentAt-p.sentAt)>1e-8||Math.abs(r.task.earthReceiveAt-p.earthReceiveAt)>1e-8||Math.abs(r.task.delayMinutes-p.delayMinutes)>1e-8||Math.abs(r.task.end-p.earthReceiveAt)>1e-8||r.task.signalDelaySource!==p.source||r.task.geometryPackId!==p.packId||r.task.rangeKm!==p.rangeKm)throw Error('Mars relay task does not match pinned geometry');
      }
    }
    if(!r.descentProfile||r.descentProfile.modelVersion!=='mars-edl-point-mass-0.3.4'||!Array.isArray(r.descentProfile.samples)||r.descentProfile.samples.length<2||r.descentProfile.samples.length>5000||!Number.isFinite(r.descentProfile.touchdownSeconds))throw Error('Invalid saved Mars descent model');return {...clone(r),design,message:typeof r.message==='string'?r.message.slice(0,300):'',position:{...r.position,heading:r.position.heading%(Math.PI*2)},provenance:r.provenance||null};
  }
  return {types,parts,rockets,orbits,waypoints,budget,deadline,landing,landingTime,starter,validate,stats,checks,launch,pinProvenance,actions,task,advance,move,contacts,finished,score,settle,restore,buildDescentProfile,descentAt,defaultDescentProfile,relaySite,propagationAt,relayPlan};
});
