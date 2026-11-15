/* The local launcher is the sole authority for opening the game and acquiring new data. */
const OrbitalOnline = (() => {
  let current, failure = '', pending = false, ready = false, geometry;
  let onUnlock, onLock, geometryFailure = '';
  const feeds = {flares:'Solar flares', storms:'Geomagnetic storms', cmes:'Coronal mass ejections'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = value => value ? escape(new Date(value).toUTCString()) : 'Unavailable';

  function controls() {
    return `<div class="row wrap" style="margin-top:14px"><button class="btn compact" data-nasa="refresh" ${current?.busy?'disabled':''}>Refresh DONKI reports</button></div>`;
  }
  function feedList(report) {
    return `<div class="nasa-grid">${Object.entries(feeds).map(([key,label]) => {
      const feed = report.feeds[key], latest = feed.items[0];
      let detail = 'No events returned for this interval.';
      if (latest && key === 'flares') detail = 'Latest flare class: ' + (latest.classType ?? 'unknown');
      if (latest && key === 'storms') detail = 'Latest maximum Kp: ' + (latest.maxKp ?? 'unknown');
      if (latest && key === 'cmes') detail = 'Latest analysed speed: ' + (latest.speedKmS == null ? 'unknown' : latest.speedKmS + ' km/s');
      return `<div><strong>${label}</strong><p>${feed.items.length} reports · ${escape(detail)}</p>
        ${latest ? '<p class="tiny muted">Event UTC: '+date(latest.observedAt)+'</p>' : ''}</div>`;
    }).join('')}</div>`;
  }

  function panel() {
    const report = current?.report;
    if (!ready || !report) return '';
    const message = failure || current.error || (current.busy ? 'Checking NASA…' :
      'NASA may publish events after they occur. Review these reports as part of mission preflight.');
    const period = report.feeds.storms;
    return `<section class="panel pad nasa-panel"><div class="spread">
      <div><span class="eyebrow cyan">OFFICIAL NASA DATA</span><h3>DONKI space weather</h3></div>
      <span class="tag">${escape(current.status.toUpperCase())}</span></div>
      <p class="small muted" role="status">${escape(message)}</p>
      <p class="tiny muted">Retrieved ${date(report.retrievedAt)} · Query dates UTC ${escape(period.startDate)} to ${escape(period.endDate)}</p>
      ${feedList(report)}${controls()}</section>`;
  }

  function lockScreen() {
    return `<main class="app"><section class="panel pad"><h1>NASA verification required</h1>
      <p role="status">${escape(failure || current?.error || 'Verifying the local launcher and its NASA reports…')}</p>
      <p>Save your personal NASA key in API.txt beside launcher.py, then start the game with a Play launcher while connected to the internet.</p>
      <button class="btn compact" data-nasa="retry">Check connection</button></section></main>`;
  }

  function paint() {
    const node = document.querySelector('#nasa-reports');
    if (node) node.innerHTML = panel();
    const geometryNode = document.querySelector('#nasa-geometry-status');
    if (geometryNode) geometryNode.innerHTML = geometryStatus();
  }

  function validateStatus(response) {
    if (response?.ready !== true || !['current','stale'].includes(response.status)) return false;
    const report = response.report;
    return report?.provider === 'NASA CCMC DONKI' && report.schemaVersion === 1 &&
      /^donki-[a-f0-9]{64}$/.test(report.datasetId) && Number.isFinite(Date.parse(report.retrievedAt)) &&
      Object.keys(feeds).every(key => Array.isArray(report.feeds?.[key]?.items));
  }

  async function status() {
    if (pending) return;
    pending = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      if (location.protocol !== 'http:' || location.hostname !== '127.0.0.1') throw Error('Use the local ORBITAL launcher.');
      const response = await fetch('/api/nasa/status',{cache:'no-store',signal:controller.signal});
      if (!response.ok) throw Error('Local NASA verification is unavailable.');
      current = await response.json();
      failure = '';
      const next = validateStatus(current);
      if (next) {
        const pack = current.geometry?.pack;
        if (!pack) geometry = null;
        else if (!geometry || pack.manifest.packId !== geometry.manifest.packId) geometry = OrbitalPacks.validate(pack);
      }
      transition(next);
    } catch {
      failure = 'The browser could not verify NASA data through the local launcher. Run a Play launcher and keep its terminal open.';
      transition(false);
    } finally {
      clearTimeout(timer);
      pending = false;
      paint();
    }
  }

  function transition(verified) {
    if (verified && !ready) {
      ready = true;
      onUnlock();
    } else if (!verified) {
      const previouslyReady = ready;
      ready = false;
      geometry = null;
      if (previouslyReady) onLock();
      document.querySelector('#root').innerHTML = lockScreen();
    }
  }

  async function request(kind) {
    try {
      const options = {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'refresh'})};
      const response = kind === 'geometry'
        ? await fetch('/api/nasa/geometry', options)
        : await fetch('/api/nasa/mode', options);
      const outcome = await response.json();
      if (!response.ok) throw Error(outcome.error || 'NASA refresh could not start.');
      if (kind === 'geometry') geometryFailure = '';
      await status();
    } catch (error) {
      if (kind === 'geometry') geometryFailure = error.message;
      else failure = error.message;
      paint();
    }
  }

  function geometryStatus() {
    const state = current?.geometry;
    const message = state?.busy ? 'Downloading Earth–Mars geometry from JPL…' :
      geometryFailure || state?.error || (geometry ? 'Verified geometry covers '+geometry.manifest.coverage.start+' to '+geometry.manifest.coverage.end+'.' :
      state?.contactConfigured ? 'Download geometry before launching Mars.' :
      'For Mars, restart the launcher with --jpl-contact and your real email or project contact URL.');
    return `<p class="small muted" role="status">${escape(message)}</p><button class="btn compact"
      data-nasa="geometry" ${state?.busy || !state?.contactConfigured ? 'disabled' : ''}>Download Horizons geometry</button>`;
  }

  function reviewedLaunch(next, requireGeometry) {
    if (!ready) { toast('NASA data verification is required.'); return; }
    if (requireGeometry && !geometry) {
      modal('Mars needs Horizons geometry', `<div id="nasa-geometry-status">${geometryStatus()}</div>`);
      return;
    }
    const report = current.report;
    modal('Review NASA space weather', `<p>Retrieved ${date(report.retrievedAt)} · ${escape(current.status)}</p>
      <p>Review the events before deciding whether to return to planning or proceed with this simulated launch.</p>
      ${feedList(report)}<div class="dialog-actions">${btn('Return to planning','close','ghost')}
      <button id="nasa-confirm-launch" class="btn primary">Acknowledge and launch</button></div>`);
    document.querySelector('#nasa-confirm-launch').onclick = () => {
      if (!ready || (requireGeometry && !geometry)) { toast('NASA data verification is required.'); return; }
      if (current.report.datasetId !== report.datasetId) {
        reviewedLaunch(next, requireGeometry);
        return;
      }
      const evidence = {
        datasetId:report.datasetId, retrievedAt:report.retrievedAt, adapterVersion:report.adapterVersion,
        reviewedAt:new Date().toISOString(),
        feeds:Object.fromEntries(Object.entries(report.feeds).map(([key,feed]) => [key,{
          count:feed.items.length, startDate:feed.startDate, endDate:feed.endDate, latest:feed.items[0] ?? null
        }]))
      };
      document.querySelector('#modal').close();
      next(evidence, requireGeometry ? geometry : null);
    };
  }

  function start(unlock, lock) {
    onUnlock = unlock;
    onLock = lock;
    document.querySelector('#root').innerHTML = lockScreen();
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-nasa]');
      if (!button || button.disabled) return;
      if (button.dataset.nasa === 'retry') status();
      else request(button.dataset.nasa);
    });
    status();
    setInterval(() => { if (!document.hidden) status(); }, 5000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) status(); });
  }

  return {panel, controls, start, geometryStatus, reviewedLaunch, ready:()=>ready, geometry:()=>geometry};
})();
