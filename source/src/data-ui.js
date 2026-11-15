/* Live geometry is acquired by the launcher. Historical mission packs stay pinned to saves. */
const OrbitalDataUI = (() => {
  const P = OrbitalPacks;
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function pin() {
    const pack = OrbitalOnline.geometry();
    return pack ? JSON.parse(JSON.stringify(pack)) : null;
  }
  function summary() {
    const pack = OrbitalOnline.geometry();
    return `<div class="data-summary"><span class="dot"></span>NASA VERIFIED
      <span class="muted">${pack ? 'Horizons '+escape(pack.manifest.packId) : 'DONKI space weather'}</span>
      <button data-action="data-settings">Data settings</button></div>`;
  }
  function action(name) {
    if (name === 'data-settings' || name === 'data-setup') {
      modal('NASA data', `<p>DONKI supplies official space-weather reports. The launch review records the snapshot you acknowledged.
        Horizons supplies calculated Earth–Mars geometry for new Mars missions.</p>
        ${OrbitalOnline.controls()}<div id="nasa-geometry-status" style="margin-top:14px">${OrbitalOnline.geometryStatus()}</div>
        ${btn('Export geometry','data-export','compact ghost',OrbitalOnline.geometry()?'':'disabled')}`);
    } else if (name === 'data-export') {
      const pack = pin();
      if (!pack) return;
      const anchor = document.createElement('a');
      const url = URL.createObjectURL(new Blob([JSON.stringify(pack)],{type:'application/json'}));
      anchor.href = url;
      anchor.download = pack.manifest.packId+'.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  function geometryPanel(pack, minutes, applied = false) {
    if (!pack) return '<section class="panel pad"><h3>Earth–Mars geometry</h3><p>Legacy mission. No Horizons snapshot was pinned at launch.</p></section>';
    const m = pack.manifest;
    const g = P.geometry(pack, P.epoch(m.coverage.start)+minutes*60000);
    if (g.status === 'outside') return '<section class="panel pad"><h3>Earth–Mars geometry</h3><p>Simulation time is outside the saved ephemeris interval.</p></section>';
    return `<section class="panel pad geometry-panel"><div class="spread"><h3>Earth–Mars geometry</h3>
      <span class="tag">${applied ? 'JPL HORIZONS + DERIVED DELAY' : 'HISTORICAL PACK'}</span></div>
      <p class="tiny muted">Pinned ${escape(m.packId)} · Ephemeris UTC ${escape(g.requestedEpochUtc)}</p>
      <div class="geometry-readings"><div><label>GEOCENTRIC RANGE</label><strong>${(g.rangeKm/1e6).toFixed(3)} million km</strong></div>
      <div><label>IDEAL ONE-WAY DELAY</label><strong>${(g.idealDelaySeconds/60).toFixed(2)} min</strong></div></div>
      <p class="small muted">${g.method==='sample'?'Exact Horizons sample':'Cubic Hermite estimate using adjacent positions and velocities'}.
      ${applied?'An upload must finish within a simulated Mars relay window. Its Earth arrival includes the ideal propagation delay calculated at upload completion.':'The saved mission uses its original relay timing.'}</p></section>`;
  }
  return {pin, summary, action, geometryPanel};
})();
