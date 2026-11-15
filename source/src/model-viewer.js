/* The reference scenes run only while their dialog is open. */
const OrbitalModels = (() => {
  const models = {
    earth: {title:'Earth · interactive globe',description:'Your supplied procedural Earth artwork. Geography is illustrative.',scene:earthScene,controls:[['bs','Spin',true],['bc','Clouds',true],['bn','Light night side',false],['bi','Zoom in',false],['bo','Zoom out',false]]},
    moon: {title:'Moon · cratered surface',description:'Your supplied procedural Moon. Drag to inspect the relief; this is not a measured elevation map.',scene:moonScene,controls:[]},
    lander: {title:'Lunar lander · model preview',description:'Explore the supplied lander and preview its descent engine. The lunar mission is still planned.',scene:landerScene,controls:[['fire','Fire descent engine',false]]},
    'mars-globe': {title:'Mars · surface overview',description:'Your supplied Mars globe with illustrative relief and landmark pins. Surface driving uses the mountain terrain.',scene:marsGlobeScene,controls:[['bRelief','Exaggerate relief',false],['bPins','Landmarks',true],['bSpin','Auto-rotate',true]]},
    hubble: {
      title: 'Hubble · Earth observation reference',
      description: 'Explore Hubble’s hardware. Your Earth observation satellite uses the parts selected in the builder.',
      scene: hubbleScene,
      controls: [['bExplode', 'Exploded view', false], ['bEarth', 'Earth backdrop', true], ['bSpin', 'Auto-rotate', true]],
    },
    rocket: {
      title: 'Rocket · launch vehicle reference',
      description: 'Explore a generic launcher and preview its engine. Use the preflight screen to launch the mission.',
      scene: rocketScene,
      controls: [['bLaunch', 'Engine preview', false], ['bExplode', 'Exploded view', false], ['bSpin', 'Auto-rotate', true]],
    },
  };

  function open(key, trigger) {
    const model = models[key];
    const dialog = document.querySelector('#model-dialog');
    if (!model || dialog.open) return;
    const controls = model.controls.map(([id, label, pressed]) =>
      `<button type="button" id="${id}" class="btn compact" aria-pressed="${pressed}">${label}</button>`
    ).join('');
    dialog.innerHTML = `
      <header class="dialog-head"><h2 id="model-title">${model.title}</h2>
        <form method="dialog"><button aria-label="Close 3D model" autofocus>×</button></form>
      </header>
      <div class="model-body">
        <p class="model-description">${model.description}</p>
        <div class="model-stage"><canvas id="model-canvas" aria-label="Interactive 3D reference"></canvas></div>
        <p id="info" class="model-info" aria-live="polite">Drag to rotate. Scroll to zoom. Select a part for details.</p>
        <div class="model-controls">${controls}</div>
      </div>`;
    let canvas = dialog.querySelector('canvas');
    dialog.showModal();

    let renderer;
    let stop;
    dialog.addEventListener('close', () => {
      stop?.();
      if (renderer) {
        renderer.dispose?.();
        renderer.forceContextLoss?.();
      }
      dialog.replaceChildren();
      trigger?.focus();
    }, {once: true});

    try {
      const options = {antialias: true, alpha: true};
      const context = canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
      if (context) {
        try {
          renderer = new THREE.WebGLRenderer({canvas, context, ...options});
        } catch {
          const replacement = canvas.cloneNode();
          canvas.replaceWith(replacement);
          canvas = replacement;
        }
      }
      renderer ??= modelCanvasRenderer(canvas);
      stop = model.scene(dialog, renderer, canvas);
    } catch (error) {
      console.warn('3D preview could not open.', error);
      dialog.querySelector('.model-stage').hidden = true;
      dialog.querySelector('.model-controls').hidden = true;
      dialog.querySelector('#info').textContent = 'This browser could not start the 3D preview. Close this view to return to the mission.';
    }
  }

  return {open,get:key=>models[key]};
})();
