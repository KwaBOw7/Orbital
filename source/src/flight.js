/* Shared flight clocks and the Mars practice scenario. Time is in simulated minutes. */
const flightSpeeds = [1, 10, 60, 240];
const marsPhases = [
  {second:0, name:'Atmospheric entry', altitude:125000, speed:5400, note:'The heat shield faces the atmosphere as the vehicle begins to slow.'},
  {second:80, name:'Peak heating', altitude:42000, speed:4500, note:'The heat shield protects the rover during the hottest part of entry.'},
  {second:240, name:'Parachute deployment', altitude:11000, speed:420, note:'The parachute takes over as atmospheric braking continues.'},
  {second:260, name:'Heat shield separation', altitude:9000, speed:160, note:'The radar and cameras can now look down at the surface.'},
  {second:330, name:'Terrain-relative navigation', altitude:4000, speed:89, note:'The descent system compares terrain observations with its landing map.'},
  {second:350, name:'Backshell separation', altitude:2100, speed:89, note:'The descent stage separates from the parachute and begins powered flight.'},
  {second:390, name:'Sky crane', altitude:21, speed:0.75, note:'The descent stage lowers the rover toward the surface.'},
  {second:410, name:'Touchdown', altitude:0, speed:0, note:'Landing confirmed. Visit all three waypoints, analyze both rocks, and relay the results.'}
];
const marsWaypoints = ['Landing apron', 'Delta outcrop', 'Crater rim'];
const marsLanding = marsPhases.at(-1).second / 60;
const marsDeadline = 180;
const marsRelay = [[65, 75], [120, 130], [165, 175]];
const freshMars = () => ({t:0, visited:0, rocks:0, relayed:false, task:null, events:['Atmospheric entry confirmed.'],dataPack:typeof OrbitalDataUI!=='undefined'?OrbitalDataUI.pin():null});

function nextOrbitEvent(run) {
  const {o,cycle} = E.flags(run);
  const start = cycle * o.period;
  const moments = [...o.eclipse, ...o.sunPass, ...o.nightPass, ...o.contacts.flat(), o.period];
  return Math.min(D.scenario.deadline, ...moments.map(value => value+start).filter(value => value > run.t+1e-7));
}

function flightControls(prefix, next, end, elapsed, speed = state.speed) {
  const playing = prefix === 'mars-' ? Boolean(marsTimer) : running;
  return `<div class="flight-controls">
    <div class="flight-clock"><span>MISSION ELAPSED</span><strong>${elapsed}</strong></div>
    ${btn(icon(playing?'pause':'play')+' '+(playing?'Pause':'Play'),prefix+'play','primary compact')}
    <label class="flight-rate">SPEED <select id="${prefix}speed" aria-label="Simulation speed">
      ${(prefix==='mars-'?[1/60,1/6,...flightSpeeds]:flightSpeeds).map(value => `<option value="${value}" ${speed===value?'selected':''}>${prefix==='mars-'?Math.round(value*60)+'×'+(value===1/60?' · real time':''):value+' min / sec'}</option>`).join('')}
    </select></label>
    ${prefix==='mars-'&&marsRun?.manual&&marsRun.t>=marsLanding?btn('Drive · WASD','mars-control','compact',!marsRun.task?'':'disabled'):''}
    ${btn(next,prefix+'next-event','compact')}
    ${btn(end,prefix+'complete','compact ghost')}
  </div>`;
}

let marsRun = null;
let marsTimer = null;
let marsSpeed = 1/60;
let flightReturn = 'mission';

function stopMars() {
  clearInterval(marsTimer);
  marsTimer = null;
}

function marsStatus() {
  if(marsRun.aborted)return 'Mission ended by commander';
  if (marsRun.relayed) return 'Mission accomplished';
  if (marsRun.t >= marsDeadline) return 'Mission deadline reached';
  return marsRun.task?.name || 'Surface operations';
}

function advanceMars(to) {
  if(marsRun.manual){MarsMission.advance(marsRun,to);MarsMission.settle(marsRun,state.career,E.reward);save();return;}
  if (marsRun.relayed || marsRun.t >= marsDeadline) return;
  marsRun.t = Math.min(marsDeadline, Math.max(marsRun.t, to));
  const task = marsRun.task;
  if (!task || marsRun.t < task.end) return;
  marsRun.task = null;
  if (task.kind === 'drive') marsRun.visited++;
  if (task.kind === 'sample') marsRun.rocks++;
  if (task.kind === 'relay') {
    marsRun.relayed = true;
    marsRun.t = task.end;
  }
  const event = {drive:'Waypoint reached.', sample:'Rock analysis saved.', relay:'Both rock analyses received on Earth.'};
  marsRun.events.push(event[task.kind]);
}

function nextMarsEvent() {
  if(marsRun.manual&&marsRun.t>=marsLanding){if(marsRun.task)return marsRun.task.end;return MarsMission.contacts(marsRun).flat().find(t=>t>marsRun.t+1e-7)??marsDeadline;}
  if (marsRun.task) return marsRun.task.end;
  if (marsRun.t < marsLanding) return (marsPhases.find(phase => phase.second / 60 > marsRun.t + 1e-7)?.second ?? 410) / 60;
  return marsRelay.flat().find(t => t > marsRun.t + 1e-7) ?? marsDeadline;
}

function marsTelemetry() {
  if (marsRun.t >= marsLanding) {
    return {name:marsStatus(), note:marsRun.events.at(-1)==='Atmospheric entry confirmed.' ? marsPhases.at(-1).note : marsRun.events.at(-1), altitude:0, speed:0};
  }
  const seconds = marsRun.t * 60;
  const found = marsPhases.findIndex(phase => phase.second > seconds);
  const after = found < 1 ? marsPhases.length-1 : found;
  const first = marsPhases[after-1], second = marsPhases[after];
  const fraction = (seconds-first.second)/(second.second-first.second);
  return {...first,
    altitude:first.altitude+(second.altitude-first.altitude)*fraction,
    speed:first.speed+(second.speed-first.speed)*fraction};
}

function marsActions() {
  if(marsRun.manual)return MarsMission.actions(marsRun);
  const {t, visited, rocks, task, relayed} = marsRun;
  const surface = t >= marsLanding && t < marsDeadline && !relayed;
  const awaitingScience = visited >= 2 && rocks < visited-1;
  const relay = marsRelay.some(([open,close]) => t >= open && t+2 <= close);
  return {
    drive:surface && !task && visited<3 && !awaitingScience && t+18<=marsDeadline,
    sample:surface && !task && awaitingScience && t+8<=marsDeadline,
    relay:surface && !task && visited===3 && rocks===2 && relay
  };
}

function startMarsTask(kind) {
  if(marsRun.manual){MarsMission.task(marsRun,kind);return;}
  if (!marsActions()[kind]) return;
  const tasks = {
    drive:{name:'Driving to '+marsWaypoints[marsRun.visited], duration:18},
    sample:{name:'Analyzing rock '+(marsRun.rocks+1), duration:8},
    relay:{name:'Relaying science results', duration:2}
  };
  const task = tasks[kind];
  marsRun.task = {kind,name:task.name,end:marsRun.t+task.duration};
}

let launchMoment = false;
function earthFlight() {
  const r=state.run, f=E.flags(r);
  const name=launchMoment&&r.t===0?'Spacecraft deployed':r.safe?'Safe mode':f.imaging?'Mapping the flood zone':f.transmit?'Ground station contact':f.eclipse?'Eclipse passage':'Sunlit coast';
  return {name,note:r.safe?'Essential systems are protected. Review the energy trace and operations schedule.':f.imaging?'Radar observations are being collected over the target area.':f.transmit?'The spacecraft can return stored observations to Earth.':f.eclipse?'Solar generation is unavailable. Battery reserves support the spacecraft.':'Solar arrays replenish the battery while the spacecraft follows its orbit.',
    metrics:[['BATTERY',fmt(r.energy)+' Wh'],['RETURNED COVERAGE',fmt(E.coverage(r))+'%'],['ORBIT',String(f.cycle+1)]],
    progress:r.t/D.scenario.deadline,elapsed:time(r.t),next:'Next orbital event · T+'+time(nextOrbitEvent(r)),marker:42+22*Math.sin(f.phase/f.o.period*Math.PI*2),altitude:40};
}
function marsFlightData() {
  const m=marsTelemetry(),surface=marsRun.t>=marsLanding;
  return {name:m.name,note:m.note,metrics:surface?[['WAYPOINTS',marsRun.visited+' / 3'],['ROCK ANALYSES',marsRun.rocks+' / 2'],['SCIENCE RELAY',marsRun.relayed?'Complete':(marsRun.manual?MarsMission.contacts(marsRun):marsRelay).some(([a,b])=>marsRun.t>=a&&marsRun.t<b)?'Available':'No contact']]:[['ALTITUDE',fmt(m.altitude/1000,2)+' km'],['VELOCITY',fmt(m.speed,1)+' m/s'],['PHASE',String(Math.min(8,marsPhases.filter(p=>p.second<=marsRun.t*60).length))+' / 8']],progress:surface?marsRun.t/marsDeadline:marsRun.t/marsLanding,elapsed:time(marsRun.t)+':'+String(Math.round(marsRun.t*60)%60).padStart(2,'0'),next:marsRun.relayed?'All mission objectives achieved':marsRun.t>=marsDeadline?'Mission ended':surface?(marsRun.task?'Next event · '+marsRun.task.name:'Choose a command or advance to the next relay event'):'Next phase · '+(marsPhases.find(p=>p.second/60>marsRun.t+1e-7)?.name||'Touchdown'),marker:surface?64+marsRun.visited*4:65,altitude:surface?65:35+30*marsRun.t/marsLanding};
}
function flightInfo(data) {
  return `<span class="eyebrow">MISSION PHASE</span><h1>${esc(data.name)}</h1><div class="flight-readings">${data.metrics.map(([k,v])=>`<div><span>${k}</span><strong>${esc(v)}</strong></div>`).join('')}</div><p>${esc(data.note)}</p><div class="flight-next">${esc(data.next)}</div>`;
}
function flightScene(kind,data,controls) {
  return `<section class="flight-view ${kind}">${kind==='earth'?OrbitalInline.html('hubble',true):''}${kind==='mars'?'<canvas id="mars-canvas" tabindex="0" aria-label="Mars rover. WASD or arrow keys drive after landing. Space brakes. X analyzes, C drills, T relays. Drag or Q and E orbit the camera. Scroll to zoom."></canvas><div class="mars-camera-tools"><button class="btn compact" data-camera="left" aria-label="Rotate view left">↶</button><button class="btn compact" data-camera="right" aria-label="Rotate view right">↷</button><button class="btn compact" data-camera="in" aria-label="Zoom in">+</button><button class="btn compact" data-camera="out" aria-label="Zoom out">−</button><button class="btn compact" data-camera="reset">Reset view</button><span>Drag to orbit · scroll to zoom</span></div>':''}<div class="flight-top"><span><i class="dot"></i> ${kind==='mars'?'MARS / JEZERO PRACTICE':'EARTH / FLOODWATCH-01'}</span><span>ILLUSTRATIVE FLIGHT VIEW</span></div><div class="flight-copy" id="flight-info">${flightInfo(data)}</div><div id="flight-marker" hidden class="flight-marker ${kind==='mars'?'lander':'satellite'}" style="left:${data.marker}%;top:${data.altitude}%">${kind==='mars'?'<div class="lander-body"></div><i></i><i></i>':'<div class="solar-panel"></div><div class="satellite-body"></div><div class="solar-panel"></div>'}</div><div class="flight-bottom"><div class="flight-progress"><i id="flight-progress" style="width:${data.progress*100}%"></i></div>${controls}<p class="flight-hint">TIME IS YOURS TO CONTROL · PAUSE, ACCELERATE OR ADVANCE TO AN EVENT</p></div></section>`;
}
function refreshFlight(data) {
  if(!$('#flight-info'))return;
  $('#flight-info').innerHTML=flightInfo(data);
  $('#flight-progress').style.width=data.progress*100+'%';
  $('#flight-marker').style.left=data.marker+'%';$('#flight-marker').style.top=data.altitude+'%';
  $('.flight-clock strong').textContent=data.elapsed;
  if(state.page==='mars'&&typeof OrbitalDataUI!=='undefined'&&$('#mars-geometry'))$('#mars-geometry').innerHTML=OrbitalDataUI.geometryPanel(marsRun.dataPack,marsRun.t);
  if(state.page==='operations'){$('#flight-trace').innerHTML=chart(state.run);$('#flight-events').innerHTML=eventList(state.run);}
}
function operations() {
  if(!state.run)return '';
  const data=earthFlight();
  return `<div class="flight-title"><div><span class="eyebrow">ORBITAL / MISSION CONTROL</span><h2>Earth operations</h2></div><span class="tag">${running?'SIMULATION RUNNING':'PAUSED · READY FOR YOUR COMMAND'}</span></div>${flightScene('earth',data,flightControls('','Next event','Run to mission end',data.elapsed))}<div class="flight-panels"><section class="panel pad"><h3>Operations plan</h3>${planEditor(state.run.design.plan)}${btn('End flight early','abort','ghost compact')}</section><section class="panel pad"><h3>Resource trace</h3><div id="flight-trace">${chart(state.run)}</div><p class="tiny muted">Blue: battery / ${state.run.stats.capacity} Wh · Green: storage / ${state.run.stats.storage} GB</p></section><section class="panel pad"><h3>Flight log</h3><div id="flight-events">${eventList(state.run)}</div></section></div>`;
}
function marsFlight() {
  const data=marsFlightData(),actions=marsActions(),done=marsRun.manual?MarsMission.finished(marsRun):marsRun.relayed||marsRun.t>=marsDeadline;
  return `<div class="flight-title"><div><span class="eyebrow">ORBITAL / MISSION CONTROL</span><h2>Mars descent & exploration</h2></div><span class="tag">INTERACTIVE 3D · ILLUSTRATIVE TERRAIN</span></div>${flightScene('mars',data,done?`<div class="flight-controls"><strong>${marsRun.relayed?'Science delivered. Mission complete.':'Mission ended before science delivery.'}</strong>${btn('Replay mission','mars-restart','primary compact')}</div>`:flightControls('mars-','Next event',marsRun.t<marsLanding?'Skip to landing':'End mission',data.elapsed,marsSpeed))}<div id="mars-geometry">${typeof OrbitalDataUI!=='undefined'?OrbitalDataUI.geometryPanel(marsRun.dataPack,marsRun.t):''}</div>${marsRun.manual?marsManualPanels():`<div class="flight-panels mars-panels"><section class="panel pad"><h3>Surface commands</h3><p class="description">Land, visit three waypoints, analyze two rocks and relay the results before T+03:00. Advance to the next event to finish a command immediately.</p><div class="row wrap">${btn('Drive to next waypoint','mars-drive','compact',actions.drive?'':'disabled')}${btn('Analyze rock','mars-sample','compact',actions.sample?'':'disabled')}${btn('Relay results','mars-relay','compact',actions.relay?'':'disabled')}</div></section><section class="panel pad"><h3>Mission objectives</h3><p class="description">${marsRun.t>=marsLanding?'✓':'○'} Safe landing &nbsp; · &nbsp; ${marsRun.visited}/3 waypoints &nbsp; · &nbsp; ${marsRun.rocks}/2 rock analyses &nbsp; · &nbsp; ${marsRun.relayed?'✓':'○'} Science returned</p><p class="tiny muted">Practice scenario · progress lasts for this session · simplified timing and telemetry; not a flight reconstruction.</p><a class="reference-link" href="https://eyes.nasa.gov/apps/mars2020/" target="_blank" rel="noopener noreferrer">Explore NASA’s Mars 2020 experience ↗</a></section></div>`}`;
}
function handleMars(action) {
  if(action==='open'){if(state.run&&!state.run.finished){toast('Finish the active Earth mission first.');return;}pause();marsRun??=freshMars();state.page='mars';render();window.scrollTo(0,0);return;}
  if(!marsRun)return;
  if(action==='back'){stopMars();goto('mission');return;}
  if(action==='restart'){stopMars();const design=marsRun.design;const pack=marsRun.dataPack,mode=marsRun.mode||'practice';marsRun=design?MarsMission.launch(design,mode,state.career):freshMars();marsRun.dataPack=pack;render();return;}
  if(action==='control'){if(!marsRun.manual||marsRun.t<marsLanding||MarsMission.finished(marsRun)||marsRun.task)return;stopMars();marsSpeed=1/60;handleMars('play');$('#mars-canvas')?.focus();return;}
  if(action==='play'){
    if(marsTimer){stopMars();render();return;}
    if(marsRun.relayed||marsRun.t>=marsDeadline)return;
    marsTimer=setInterval(()=>{
      const before=marsRun.t,task=marsRun.task;
      const boundary=before<marsLanding?marsLanding:task?.end??nextMarsEvent();
      advanceMars(Math.min(before+marsSpeed/4,boundary));
      if(marsRun.t>=boundary){stopMars();render();}else {refreshFlight(marsFlightData());if(marsRun.manual)updateRoverHud();}
    },250);render();return;
  }
  stopMars();
  if(action==='next-event')advanceMars(nextMarsEvent());
  if(action==='complete'){if(marsRun.t<marsLanding)advanceMars(marsLanding);else{marsRun.task=null;advanceMars(marsDeadline);}}
  if(['drive','sample','core','relay'].includes(action))startMarsTask(action);
  render();
}
