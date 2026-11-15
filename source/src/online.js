/* Optional loopback connection for NASA DONKI planning context. Gameplay never depends on this service. */
const OrbitalOnline=(()=>{
 let current=null,failure='',pending=false,timer=null;
 const loopback=()=>location.protocol==='http:'&&location.hostname==='127.0.0.1';
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const displayDate=s=>s?escape(new Date(s).toUTCString()):'Unknown';
 function controls(){
   const blocked=current?.offlineOnly||current?.busy?'disabled':'';
   return `<div class="row wrap" style="margin-top:14px"><button class="btn compact" data-nasa="online" ${blocked}>Enable NASA updates</button><button class="btn compact" data-nasa="refresh" ${blocked}>Refresh reports</button><button class="btn compact ghost" data-nasa="offline" ${current?.mode==='offline'?'disabled':''}>Offline / stop updates</button></div>`;
 }
 function statusText(){
   if(failure)return failure;
   if(current?.busy)return 'Downloading NASA DONKI reports…';
   if(current?.error)return current.error;
   if(current?.offlineOnly)return 'This session uses --offline. Run the Play script without it to download reports.';
   if(current?.mode==='offline')return 'Updates stopped. Stored reports remain available.';
   if(current?.report)return 'NASA updates are enabled. The last successful download is shown below.';
   return 'Checking NASA report availability…';
 }
 function missionContext(){const c=current?.missionContext;if(!c||!['current','stale','cached','missing','no-reports','offline'].includes(c.status))return null;return JSON.parse(JSON.stringify(c));}
 function geometry(){return current?.geometry?.pack||null;}
 function geometryStatus(){return '<p class="tiny muted">Import a Horizons-format geometry JSON pack. The app checks format and checksum. Network retrieval is performed by the separate, bounded Python downloader.</p>';}
 function contextPanel(){const c=missionContext();if(!c||c.status==='missing')return '<p class="tiny muted">No validated DONKI planning-context snapshot is available. Missions remain playable offline.</p>';const s=c.signals||{};return `<div class="notice"><strong>Mission-planning context · ${escape(c.status.toUpperCase())}</strong><p>${s.flareReports??0} flare reports · strongest ${escape(s.strongestFlareClass||'unknown')} · ${s.geomagneticStormReports??0} geomagnetic storm reports · max Kp ${s.maxReportedKp??'unknown'} · ${s.cmeReports??0} CME reports · max analysed speed ${s.maxReportedCmeSpeedKmS??'unknown'} km/s</p><p class="tiny muted">Snapshot retrieved ${displayDate(c.retrievedAt)}. ${escape((c.limitations||[])[0]||'Context only; not a validated hazard assessment.')}</p></div>`;}
 function panel(){if(typeof learningLevel!=='undefined'&&learningLevel!=='advanced')return '';const report=current?.report,feeds=report?.feeds||{};return `<section class="panel pad nasa-panel"><div class="spread"><div><span class="eyebrow cyan">NASA / DONKI</span><h3 style="margin-top:8px">Latest available space-weather reports</h3></div><span class="tag">${escape(current?.status?.toUpperCase()||'OPTIONAL')}</span></div><p class="small muted" role="status">${escape(statusText())}</p><p class="tiny muted">Real-world UTC: ${displayDate(current?.utcNow)} · Last successful retrieval: ${displayDate(report?.retrievedAt)}</p><div class="nasa-grid">${[['flares','Solar flares'],['storms','Geomagnetic storms'],['cmes','Coronal mass ejections']].map(([id,label])=>{const f=feeds[id],items=f?.items||[],latest=items[0];let text='No reports in this interval.';if(latest){if(id==='flares')text='Latest class: '+(latest.classType??'unknown');if(id==='storms')text='Latest storm maximum Kp: '+(latest.maxKp??'unknown');if(id==='cmes')text='Latest analysed speed: '+(latest.speedKmS===null?'unknown':latest.speedKmS+' km/s');}return `<div><strong>${label}</strong><p>${f?items.length+' reports':'Data unavailable'}</p><p>${escape(f?text:'To download reports, put your NASA key in API.txt and run the Play script.')}</p>${latest?'<p class="tiny muted">Event time UTC: '+displayDate(latest.observedAt)+'</p>':''}${f?'<p class="tiny muted">Query interval UTC: '+escape(f.startDate)+' → '+escape(f.endDate)+'</p>':''}</div>`;}).join('')}</div><h4>Snapshot attached to new Earth missions</h4>${contextPanel()}${controls()}<p class="tiny muted" style="margin-top:14px">DONKI reports are planning context only. They do not alter physics, scoring or launch clearance. They are not spacecraft telemetry, local radiation dose, a forecast or a validated hazard model. <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noopener noreferrer">Source and data notes</a></p></section>`;}
 function paint(){
   const html=panel();
   for(const selector of ['#nasa-reports','#modal [data-nasa-panel]']){
     const node=document.querySelector(selector);
     if(node)node.innerHTML=html;
   }
 }
 async function status(){if(!loopback()||pending)return;pending=true;const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);try{const r=await fetch('/api/nasa/status',{cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('status request failed');current=await r.json();const c=await fetch('/api/nasa/mission-context',{cache:'no-store',signal:controller.signal});if(c.ok)current.missionContext=await c.json();failure='';}catch(e){failure='Local launcher unavailable. Gameplay remains available; check the launcher to retrieve optional reports.';if(current)current.status='stale';}finally{clearTimeout(timeout);pending=false;paint();}}
 async function control(mode){if(!loopback()){failure='NASA report controls are available only through the local launcher.';paint();return;}try{const r=await fetch('/api/nasa/mode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode})});const response=await r.json();if(!r.ok){failure=response.error||'Could not change NASA mode.';paint();return;}current=response;failure='';paint();await status();}catch(e){failure='Local launcher unavailable. Restart it to change NASA settings.';paint();}}
 function start(){if(!loopback()){failure='Standalone offline mode. Run the Play script with API.txt for NASA updates.';paint();return;}status();timer=setInterval(()=>{if(!document.hidden)status();},15000);document.addEventListener('click',event=>{const button=event.target.closest('[data-nasa]');if(button&&!button.disabled)control(button.dataset.nasa);});}
 return {panel,controls,start,control,missionContext,geometry,geometryStatus};
})();
