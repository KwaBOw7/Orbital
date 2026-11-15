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
    const geometry=pack?'HORIZONS FORMAT · SOURCE UNVERIFIED · '+escape(pack.manifest.packId):'SYNTHETIC SCENARIO · NO GEOMETRY PACK';
    const flood=floodTarget?`USER-SUPPLIED FLOOD TARGET · DECLARED PRODUCT 3705`:'SYNTHETIC FLOODWATCH TARGET';
    return `<div class="data-summary"><span class="dot"></span>${mode}<span class="muted">${geometry}</span><span class="muted">${flood}</span><button data-action="data-settings">Data & geometry</button></div>`;
  }
  function action(name){
    if(name==='data-settings'||name==='data-setup'){
      const targetStatus=floodTarget?`Installed · ${escape(floodTarget.featureCount)} features ·
       ${floodTarget.cells?floodTarget.areaKm2.toFixed(2)+' km² on the sampled grid':'legacy bounds, synthetic scoring'} ·
       SHA-256 ${escape(floodTarget.sourceFileSha256.slice(0,16))}…`:'No polygon target installed.';
      modal('NASA data & geometry', `<p>NASA DONKI reports are optional planning context.
       External geometry packs are checked for format and integrity. Provider identity is declared by the file and remains unverified.</p>
       <p class="tiny muted">${importError?escape(importError):imported?'A local geometry pack is installed.':'No local geometry pack is installed.'}</p>
       <div class="row wrap"><button class="btn compact" data-action="data-import">Import geometry JSON</button>
       ${btn('Export geometry','data-export','compact ghost',active()?'':'disabled')}</div><hr>
       <h3>Historical flood polygon target</h3>
       <p>Convert the flood polygon layer from the referenced 23 October 2023 product to WGS84 GeoJSON. The import creates a sampled, area-weighted target for new Earth missions. It represents a historical preliminary interpretation and should be used for training.</p>
       <p class="tiny muted">${floodError?escape(floodError):targetStatus}</p>
       <p>User-supplied. Source not independently authenticated.</p>
       <div class="row wrap"><button class="btn compact" data-action="data-import-flood">Import flood GeoJSON</button>
       ${btn('Clear flood target','data-flood-clear','compact ghost',floodTarget?'':'disabled')}
       <a class="btn compact ghost" href="https://unosat.org/products/3705" target="_blank" rel="noopener noreferrer">Reference product ↗</a></div>
       ${typeof OrbitalOnline!=='undefined'&&typeof OrbitalOnline.panel==='function'?'<div data-nasa-panel>'+OrbitalOnline.panel()+'</div>':'<p class="small muted">To download NASA reports, place your key in API.txt and run the Play script for your operating system.</p>'}`);

    } else if(name==='data-import') { document.querySelector('#geometry-import-file')?.click(); }
    else if(name==='data-import-flood') { document.querySelector('#flood-import-file')?.click(); }
    else if(name==='data-flood-clear') { try{localStorage.removeItem(FLOOD_KEY);}catch(_){} floodTarget=null;floodError='';toast('Flood target cleared. New Earth missions use the synthetic training target.');render(); }
    else if(name==='data-export') { const pack=pin(); if(!pack)return; const anchor=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(pack)],{type:'application/json'}));anchor.href=url;anchor.download=pack.manifest.packId+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  }
  function importFile(file){
    if(!file)return; if(file.size>512000){importError='Geometry pack exceeds the 512 KB import limit.';toast(importError);return;}
    const reader=new FileReader();reader.onerror=()=>{importError='Could not read geometry file.';toast(importError);};
    reader.onload=()=>{try{const candidate=P.validate(JSON.parse(String(reader.result)));localStorage.setItem(STORAGE_KEY,JSON.stringify(candidate));imported=candidate;importError='';toast('Geometry pack installed. Format and checksum validated; provider identity remains unverified.');render();}catch(e){importError='Import rejected: '+String(e.message||'invalid geometry pack');toast(importError);}};reader.readAsText(file);
  }
  function importFloodFile(file){
    if(!file)return;
    if(file.size>10*1024*1024){floodError='GeoJSON exceeds the 10 MB import limit.';toast(floodError);return;}
    const reader=new FileReader();reader.onerror=()=>{floodError='Could not read flood GeoJSON.';toast(floodError);};
    reader.onload=()=>{
      try{
        const raw=String(reader.result),candidate=F.profileFromGeoJSON(raw,raw),manifest=candidate.acquisition;
        const lineage=manifest?`<p>Declared download: ${escape(manifest.downloadUrl||'unknown')} · ${escape(manifest.downloadedAt||'date unknown')}. Converter ${escape(manifest.converterVersion||'unknown')}.</p>`:'';
        modal('Confirm flood target source', `<p>This file declares UNOSAT Product 3705. The app checked its geometry and computed a checksum. Its source remains unauthenticated.</p>${lineage}
          <label class="toggle-label"><input id="attest-flood-source" type="checkbox"> I confirm that I obtained the flood polygon layer from the referenced product and am importing it for local training.</label>
          <div class="dialog-actions">${btn('Cancel','close','ghost')}<button class="btn primary" id="confirm-flood-import" disabled>Use target</button></div>`);
        const checkbox=document.querySelector('#attest-flood-source'),confirm=document.querySelector('#confirm-flood-import');
        checkbox.onchange=()=>{confirm.disabled=!checkbox.checked;};
        confirm.onclick=()=>{
          if(!checkbox.checked)return;
          try{
            candidate.acquisition={...manifest,userAttested:true};
            localStorage.setItem(FLOOD_KEY,JSON.stringify(candidate));
            floodTarget=candidate;floodError='';
            document.querySelector('#modal').close();
            toast('User-supplied polygon target installed. New Earth missions score its delivered area.');
            render();
          }catch(e){floodError='Could not install flood target: '+String(e.message);toast(floodError);}
        };
      }catch(e){floodError='Import rejected: '+String(e.message||'invalid flood observation');toast(floodError);}
    };
    reader.readAsText(file);
  }

  document.addEventListener('change',event=>{
    if(event.target?.id==='geometry-import-file'){importFile(event.target.files?.[0]);event.target.value='';}
    if(event.target?.id==='flood-import-file'){importFloodFile(event.target.files?.[0]);event.target.value='';}
  });
  function geometryPanel(pack,minutes,applied=false){
    if(!pack)return `<section class="panel pad"><h3>Earth–Mars geometry</h3><p>No JPL Horizons pack was pinned. Offline practice uses an explicitly uncorrected relay-delay baseline; import a validated geometry pack to calculate ideal one-way propagation delay.</p></section>`;
    const m=pack.manifest,g=P.geometry(pack,P.epoch(m.coverage.start)+minutes*60000);
    if(g.status==='outside')return '<section class="panel pad"><h3>Earth–Mars geometry</h3><p>Simulation time is outside the saved ephemeris interval. No extrapolation is performed.</p></section>';
    return `<section class="panel pad geometry-panel"><div class="spread"><h3>Earth–Mars geometry</h3><span class="tag">${applied?'PINNED · DELAY APPLIED':'PINNED REFERENCE'}</span></div><p class="tiny muted">Pinned ${escape(m.packId)} · Ephemeris UTC ${escape(g.requestedEpochUtc)}<br>Declared source: NASA/JPL Horizons. Format and checksum validated; provider provenance unverified.</p><div class="geometry-readings"><div><label>GEOCENTRIC RANGE</label><strong>${(g.rangeKm/1e6).toFixed(3)} million km</strong></div><div><label>IDEAL ONE-WAY DELAY</label><strong>${(g.idealDelaySeconds/60).toFixed(2)} min</strong></div></div><p class="small muted">${g.method==='sample'?'Exact sample from the local pack':'Cubic Hermite estimate between adjacent pack samples'}. Geocentric Earth–Mars delay is a simplified educational bound; it is not a relay-access or spacecraft trajectory calculation.</p></section>`;
  }
  return {pin,targetRegion,summary,action,geometryPanel,importFile,importFloodFile};
})();
