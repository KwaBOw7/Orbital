/* Illustrative Mars mission rules. No values here are NASA flight specifications. */
const MarsMission = (() => {
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
    {id:'direct',name:'Direct entry',cost:0,extraMass:0,relay:[[45,60],[100,115],[160,175]],note:'Earth parking orbit → Mars transfer → direct atmospheric entry. No Mars parking orbit.'},
    {id:'elliptic',name:'Elliptical Mars parking orbit',cost:22,extraMass:65,relay:[[25,40],[65,80],[105,120],[145,160]],note:'Stage in an elliptical Mars orbit before descent. Moderate insertion cost; more relay contacts.'},
    {id:'polar',name:'Polar Mars parking orbit',cost:38,extraMass:100,relay:[[15,30],[45,60],[75,90],[105,120],[135,150],[165,179]],note:'A polar staging profile provides frequent relay opportunities at higher cost and mass.'}
  ];
  const waypoints=[{name:'Landing apron',x:15,z:700},{name:'Delta outcrop',x:38,z:684},{name:'Crater ridge',x:62,z:704}];
  const budget=390,deadline=180,landing=410/60;
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
    return {mass,cost,speed:type.speed*(1+.18*t('wheels')),capacity:160+100*t('battery')+(type.id==='heavy'?80:0),solar:35+22*t('power'),idle:15-2*t('thermal'),drive:70*(has('traction')?.8:1),slope:22+3*t('navigation')+(has('traction')?12+2*t('traction'):0),analysis:Math.max(2,8-2*t('science')),upload:Math.max(.5,2-.35*t('radio')-(has('antenna')?.7:0)),storage:2+(has('storage')?2+2*t('storage'):0),landingCapacity:650+200*t('descent'),type,rocket,orbit};
  }
  function checks(d){const s=stats(d);return [
    ...parts.filter(p=>p.required).map(p=>({name:p.name,ok:d.parts[p.id]!==undefined,detail:d.parts[p.id]===undefined?'Required part missing':'Installed'})),
    {name:'Mission budget',ok:s.cost<=budget,detail:'$'+s.cost.toFixed(1)+' / $'+budget},
    {name:'Rocket payload',ok:s.mass<=s.rocket.capacity,detail:s.mass.toFixed(1)+' / '+s.rocket.capacity+' kg'},
    {name:'Landing capacity',ok:s.mass-s.orbit.extraMass<=s.landingCapacity,detail:(s.mass-s.orbit.extraMass).toFixed(1)+' / '+s.landingCapacity+' kg'}
  ];}
  function launch(d,mode='practice',career=null){d=validate(d);if(checks(d).some(c=>!c.ok))throw Error('Mars preflight checks failed');if(!['practice','career'].includes(mode))throw Error('Invalid Mars mode');if(mode==='career'){if(!career||!Number.isInteger(career.attempts))throw Error('Missing career');career.attempts++;}const s=stats(d);return {manual:true,mode,committed:false,aborted:false,design:clone(d),t:0,visited:0,rocks:0,cores:0,relayed:false,task:null,events:['Atmospheric entry confirmed.'],position:{x:0,z:700,heading:0},energy:s.capacity,distance:0,samples:[],message:'Landing in progress.',dataPack:null};}
  function contacts(r){const s=stats(r.design);return [...s.orbit.relay,...(r.design.parts.antenna!==undefined?[[85,95]]:[])].sort((a,b)=>a[0]-b[0]);}
  const finished=r=>r.relayed||r.t>=deadline||!!r.aborted;
  function relayPlan(r, uploadMinutes=stats(r.design).upload){
    const sentAt=r.t+uploadMinutes;
    if(!contacts(r).some(([open,close])=>r.t>=open&&sentAt<=close))return null;
    if(r.modelVersion!=='mars-1'){
      return sentAt<=deadline ? {sentAt,end:sentAt,delaySeconds:0} : null;
    }
    if(!r.dataPack)return null;
    const packs=typeof module==='object'?require('./data-packs.js'):OrbitalPacks;
    const epoch=packs.epoch(r.dataPack.manifest.coverage.start)+sentAt*60000;
    const geometry=packs.geometry(r.dataPack,epoch);
    if(geometry.status!=='calculated')return null;
    const end=sentAt+geometry.idealDelaySeconds/60;
    return end<=deadline ? {sentAt,end,delaySeconds:geometry.idealDelaySeconds} : null;
  }
  function actions(r){
    const design=stats(r.design),ready=r.t>=landing&&!finished(r)&&!r.task;
    const atSite=r.visited>=2&&Math.hypot(r.position.x-waypoints[r.visited-1].x,r.position.z-waypoints[r.visited-1].z)<7;
    return {
      sample:ready&&atSite&&r.rocks<r.visited-1&&r.samples.length<design.storage&&r.energy>=12,
      core:ready&&atSite&&r.design.parts.drill!==undefined&&!r.samples.includes('core-'+r.visited)&&r.samples.length<design.storage&&r.energy>=20,
      relay:ready&&r.visited===3&&r.rocks===2&&Boolean(relayPlan(r,design.upload)),
      drive:ready&&r.energy>2
    };
  }
  function task(r,kind){
    if(!actions(r)[kind])return false;
    const design=stats(r.design);
    if(kind==='relay'){
      const plan=relayPlan(r,design.upload);
      r.task={kind,name:'Relaying results to Earth',...plan};
      if(r.modelVersion==='mars-1'){
        r.task.startedAt=r.t;
        r.message='Sending science. Estimated reception in '+(plan.end-r.t).toFixed(1)+' simulated minutes.';
      }
      return true;
    }
    const duration=kind==='sample'?design.analysis:design.analysis+2;
    if(r.t+duration>deadline)return false;
    r.task={kind,name:kind==='sample'?'Analyzing rock':'Drilling a core',end:r.t+duration};
    r.energy-=kind==='sample'?12:20;
    return true;
  }
  function advance(r,to){if(finished(r))return;const stopAt=r.task?.kind==='relay'?r.task.end:deadline;const target=Math.min(stopAt,deadline,Math.max(r.t,to));r.energy=Math.min(stats(r.design).capacity,Math.max(0,r.energy+(stats(r.design).solar-stats(r.design).idle)*(target-r.t)/60));r.t=target;if(r.task&&r.t>=r.task.end){const task=r.task;r.task=null;if(task.kind==='sample'){r.rocks++;r.samples.push('rock-'+r.visited);}if(task.kind==='core'){r.cores++;r.samples.push('core-'+r.visited);}if(task.kind==='relay'){r.relayed=true;r.t=task.end;}r.events.push({sample:'Rock analysis saved.',core:'Subsurface core saved.',relay:'Science received on Earth.'}[task.kind]);r.message=r.events.at(-1);}}
  function move(r,input,dt,height=()=>0){
    if(!r.manual||r.t<landing||finished(r)||r.task||!Number.isFinite(dt)||dt<=0)return false;
    dt=Math.min(.1,dt);const s=stats(r.design);if(input.brake||r.energy<=2){r.message=r.energy<=2?'Battery low. Wait for solar charging.':'Brakes applied.';return false;}
    r.position.heading=(r.position.heading+(input.turn||0)*1.5*dt+Math.PI*2)%(Math.PI*2);
    const step=(input.forward||0)*s.speed*dt;if(!step)return false;
    const x=r.position.x+Math.cos(r.position.heading)*step,z=r.position.z+Math.sin(r.position.heading)*step;
    if(Math.abs(x)>120||Math.abs(z-700)>120){r.message='Survey boundary reached. Turn back toward the marked sites.';return false;}
    const slope=Math.atan2(Math.abs(height(x,z)-height(r.position.x,r.position.z)),Math.abs(step))*180/Math.PI;
    if(slope>s.slope){r.message='Slope too steep. Find a gentler route or upgrade mobility.';return false;}
    r.position.x=x;r.position.z=z;r.distance+=Math.abs(step);r.energy=Math.max(0,r.energy-s.drive*dt/3600);r.message='Driving · follow the next site marker.';
    const target=waypoints[r.visited];if(target&&Math.hypot(x-target.x,z-target.z)<6&&(r.visited<2||r.rocks>=r.visited-1)){r.visited++;r.events.push(target.name+' reached.');r.message=r.visited===1?'Apron reached. Continue to the delta outcrop.':'Site reached. Press X to analyze the rock.';}
    return true;
  }
  function score(r){return {base:(r.t>=landing?20:0)+r.visited*10+r.rocks*15+(r.relayed?20:0),bonus:r.relayed?r.cores*5:0};}
  function settle(r,career,reward){
    if(!finished(r)||r.committed||r.mode!=='career')return r.earned||{credit:0,trust:0};
    if(!r.relayed||r.aborted)career.failures++;
    r.earned=reward(career,score(r).base,'mars-survey-01');r.committed=true;return r.earned;
  }
  function restore(r){
    if(!r||r.manual!==true)throw Error('Invalid Mars session');r=clone(r);r.mode??='practice';r.committed??=false;r.aborted??=false;if(!['practice','career'].includes(r.mode)||typeof r.committed!=='boolean'||typeof r.aborted!=='boolean'||(r.committed&&!finished(r))||(r.mode==='practice'&&r.committed))throw Error('Invalid Mars career state');if(r.earned&&(!r.committed||!Number.isFinite(r.earned.credit)||r.earned.credit<0||r.earned.credit>100||!Number.isFinite(r.earned.trust)||r.earned.trust<0||r.earned.trust>510))throw Error('Invalid Mars reward');const design=validate(r.design),s=stats(design);
    if(checks(design).some(c=>!c.ok))throw Error('Invalid launched Mars design');
    const bounds={t:[0,deadline],visited:[0,3],rocks:[0,2],cores:[0,2],energy:[0,s.capacity],distance:[0,1e7]};
    for(const [k,[min,max]] of Object.entries(bounds))if(!Number.isFinite(r[k])||r[k]<min||r[k]>max)throw Error('Invalid Mars '+k);
    for(const k of ['visited','rocks','cores'])if(!Number.isInteger(r[k]))throw Error('Invalid Mars count');
    if(r.rocks>Math.max(0,r.visited-1)||typeof r.relayed!=='boolean'||(r.relayed&&(r.rocks!==2||r.visited!==3))||(r.t<landing&&(r.visited||r.rocks)))throw Error('Invalid Mars objectives');
    if(!r.position||!Number.isFinite(r.position.x)||!Number.isFinite(r.position.z)||Math.abs(r.position.x)>120||Math.abs(r.position.z-700)>120||!Number.isFinite(r.position.heading))throw Error('Invalid rover position');
    if(!Array.isArray(r.samples)||r.samples.length>s.storage||r.samples.some(x=>!/^((rock|core)-[23])$/.test(x))||new Set(r.samples).size!==r.samples.length||r.samples.length!==r.rocks+r.cores)throw Error('Invalid Mars samples');
    if(!Array.isArray(r.events)||r.events.length>100||r.events.some(x=>typeof x!=='string'||x.length>300))throw Error('Invalid Mars events');
    if(r.task&&(!['sample','core','relay'].includes(r.task.kind)||!Number.isFinite(r.task.end)||r.task.end<r.t||r.task.end>deadline||typeof r.task.name!=='string'||r.task.name.length>100))throw Error('Invalid Mars task');
    if(r.modelVersion==='mars-1'&&r.task?.kind==='relay'){
      const packs=typeof module==='object'?require('./data-packs.js'):OrbitalPacks;
      r.dataPack=packs.validate(r.dataPack);
      const startedAt=r.task.startedAt;
      if(!Number.isFinite(startedAt)||startedAt<landing||startedAt>r.t||r.visited!==3||r.rocks!==2)throw Error('Invalid saved relay start');
      const plan=relayPlan({...r,t:startedAt});
      if(!plan||['sentAt','end','delaySeconds'].some(key=>!Number.isFinite(r.task[key])||Math.abs(r.task[key]-plan[key])>1e-8)){
        throw Error('Saved relay timing does not match its pinned geometry');
      }
    }
    return {...clone(r),design,message:typeof r.message==='string'?r.message.slice(0,300):'',position:{...r.position,heading:r.position.heading%(Math.PI*2)}};
  }
  return {types,parts,rockets,orbits,waypoints,budget,deadline,landing,starter,validate,stats,checks,launch,actions,task,advance,move,contacts,relayPlan,finished,score,settle,restore};
})();
if(typeof module!=='undefined')module.exports=MarsMission;
