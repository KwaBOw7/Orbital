/* Local, validated data import. No network access is performed here. */
const OrbitalDataUI = (() => {
  const P = OrbitalPacks, F = OrbitalFloodData;
  const STORAGE_KEY = 'orbital-horizons-pack-v1', FLOOD_KEY = 'orbital-unosat-target-v1';
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let imported = null, importError = '', floodTarget = null, floodError = '';
  try { const raw=localStorage.getItem(STORAGE_KEY); if(raw) imported=P.validate(JSON.parse(raw)); } catch(e) { imported=null; importError='The previously stored geometry pack failed validation and was ignored.'; try{localStorage.removeItem(STORAGE_KEY);}catch(_){} }
  try { const raw=localStorage.getItem(FLOOD_KEY); if(raw) floodTarget=F.validateProfile(JSON.parse(raw)); } catch(e) { floodTarget=null; floodError='The previously stored flood observation failed validation and was ignored.'; try{localStorage.removeItem(FLOOD_KEY);}catch(_){} }
  function onlinePack(){try{return typeof OrbitalOnline!=='undefined'?OrbitalOnline.geometry():null;}catch(_){return null;}}
  function active(){return imported||onlinePack();}
  function pin(){const pack=active();return pack?P.validate(JSON.parse(JSON.stringify(pack))):null;}
  function targetRegion(){return floodTarget?F.validateProfile(JSON.parse(JSON.stringify(floodTarget))):null;}
  function summary(){
    const pack=active(),mode=typeof OrbitalOnline==='undefined'?'OFFLINE PRACTICE':'NASA UPDATES OPTIONAL';
    const geometry=pack?'JPL HORIZONS · '+escape(pack.manifest.packId):'SYNTHETIC SCENARIO · NO GEOMETRY PACK';
    const flood=floodTarget?`UNOSAT PRODUCT 3705 · ${escape(floodTarget.acquisitionDate)} · IMPORTED TARGET`:'SYNTHETIC FLOODWATCH TARGET';
    return `<div class="data-summary"><span class="dot"></span>${mode}<span class="muted">${geometry}</span><span class="muted">${flood}</span><button data-action="data-settings">Data & geometry</button></div>`;
  }
  function action(name){
    if(name==='data-settings'||name==='data-setup'){
      modal('NASA data & geometry', `<p>ORBITAL is playable offline. NASA DONKI reports are optional planning context and do not change mission physics. A validated JPL Horizons geometry pack can be imported and pinned to a new Mars mission.</p><p class="tiny muted">${importError?escape(importError):imported?'A validated local geometry pack is installed.':'No local geometry pack is installed.'}</p><div class="row wrap"><button class="btn compact" data-action="data-import">Import geometry JSON</button>${btn('Export geometry','data-export','compact ghost',active()?'':'disabled')}</div><hr><h3>Historical flood-observation target</h3><p>The UNOSAT Sentinel-1 product 3705 records a preliminary water-extent interpretation acquired 23 October 2023 over Greater Accra and Volta Region. Import a GeoJSON converted from its official shapefile to centre Earth-mission access windows on the observed footprint. The 720 scored training tiles remain synthetic; this is not pixel-level flood scoring or a current emergency map.</p><p class="tiny muted">${floodError?escape(floodError):floodTarget?`Imported · ${escape(floodTarget.featureCount)} polygons · ${floodTarget.targetRadiusKm.toFixed(1)} km bounding radius · SHA-256 ${escape(floodTarget.sourceFileSha256.slice(0,16))}…`:'No UNOSAT product file installed. Download the shapefile from the source product page, convert it with the included tool, then import the GeoJSON.'}</p><div class="row wrap"><button class="btn compact" data-action="data-import-flood">Import UNOSAT GeoJSON</button>${btn('Clear flood target','data-flood-clear','compact ghost',floodTarget?'':'disabled')}<a class="btn compact ghost" href="https://unosat.org/products/3705" target="_blank" rel="noopener noreferrer">Open source product ↗</a></div>${typeof OrbitalOnline!=='undefined'&&typeof OrbitalOnline.panel==='function'?OrbitalOnline.panel():''}<p class="tiny muted">Local imports are validated and stored in this browser. No network request is made by this dialog. The UNOSAT interpretation is preliminary and not field-validated; see source and licensing caveats in docs/NASA_DATA.md.</p>`);
    } else if(name==='data-import') { document.querySelector('#geometry-import-file')?.click(); }
    else if(name==='data-import-flood') { document.querySelector('#flood-import-file')?.click(); }
    else if(name==='data-flood-clear') { try{localStorage.removeItem(FLOOD_KEY);}catch(_){} floodTarget=null;floodError='';toast('UNOSAT target cleared. New Earth missions use the synthetic training target.');render(); }
    else if(name==='data-export') { const pack=pin(); if(!pack)return; const anchor=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(pack)],{type:'application/json'}));anchor.href=url;anchor.download=pack.manifest.packId+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  }
  function importFile(file){
    if(!file)return; if(file.size>512000){importError='Geometry pack exceeds the 512 KB import limit.';toast(importError);return;}
    const reader=new FileReader();reader.onerror=()=>{importError='Could not read geometry file.';toast(importError);};
    reader.onload=()=>{try{const candidate=P.validate(JSON.parse(String(reader.result)));localStorage.setItem(STORAGE_KEY,JSON.stringify(candidate));imported=candidate;importError='';toast('Validated Horizons geometry pack installed. New Mars missions will pin this exact dataset.');render();}catch(e){importError='Import rejected: '+String(e.message||'invalid geometry pack');toast(importError);}};reader.readAsText(file);
  }
  function importFloodFile(file){
    if(!file)return;
    if(file.size>10*1024*1024){floodError='GeoJSON exceeds the 10 MB import limit.';toast(floodError);return;}
    const reader=new FileReader();reader.onerror=()=>{floodError='Could not read flood GeoJSON.';toast(floodError);};
    reader.onload=()=>{try{const raw=String(reader.result),candidate=F.profileFromGeoJSON(raw,raw);localStorage.setItem(FLOOD_KEY,JSON.stringify(candidate));floodTarget=candidate;floodError='';toast('UNOSAT observation imported. New Earth missions will derive target-access geometry from its footprint bounds.');render();}catch(e){floodError='Import rejected: '+String(e.message||'invalid flood observation');toast(floodError);}};reader.readAsText(file);
  }
  document.addEventListener('change',event=>{
    if(event.target?.id==='geometry-import-file'){importFile(event.target.files?.[0]);event.target.value='';}
    if(event.target?.id==='flood-import-file'){importFloodFile(event.target.files?.[0]);event.target.value='';}
  });
  function geometryPanel(pack,minutes,applied=false){
    if(!pack)return `<section class="panel pad"><h3>Earth–Mars geometry</h3><p>No JPL Horizons pack was pinned. Offline practice uses an explicitly uncorrected relay-delay baseline; import a validated geometry pack to calculate ideal one-way propagation delay.</p></section>`;
    const m=pack.manifest,g=P.geometry(pack,P.epoch(m.coverage.start)+minutes*60000);
    if(g.status==='outside')return '<section class="panel pad"><h3>Earth–Mars geometry</h3><p>Simulation time is outside the saved ephemeris interval. No extrapolation is performed.</p></section>';
    return `<section class="panel pad geometry-panel"><div class="spread"><h3>Earth–Mars geometry</h3><span class="tag">${applied?'PINNED · DELAY APPLIED':'PINNED REFERENCE'}</span></div><p class="tiny muted">Pinned ${escape(m.packId)} · Ephemeris UTC ${escape(g.requestedEpochUtc)}</p><div class="geometry-readings"><div><label>GEOCENTRIC RANGE</label><strong>${(g.rangeKm/1e6).toFixed(3)} million km</strong></div><div><label>IDEAL ONE-WAY DELAY</label><strong>${(g.idealDelaySeconds/60).toFixed(2)} min</strong></div></div><p class="small muted">${g.method==='sample'?'Exact Horizons sample':'Cubic Hermite estimate between adjacent Horizons samples'}. Geocentric Earth–Mars delay is a simplified educational bound; it is not a relay-access or spacecraft trajectory calculation.</p></section>`;
  }
  return {pin,targetRegion,summary,action,geometryPanel,importFile,importFloodFile};
})();
