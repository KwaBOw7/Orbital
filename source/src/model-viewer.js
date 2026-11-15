/* The reference scenes run only while their dialog is open. */
const OrbitalModels = (() => {
  const models = {
    earth: {title:'Earth · interactive globe',description:'Original procedural Earth illustration. Coastlines are decorative and do not represent mapped geography.',scene:earthScene,controls:[['bs','Spin',true],['bc','Clouds',true],['bn','Light night side',false],['bi','Zoom in',false],['bo','Zoom out',false]]},
    moon: {title:'Moon · cratered surface',description:'Original procedural cratered sphere. Relief is illustrative and is not a measured elevation map.',scene:moonScene,controls:[]},
    lander: {title:'Lunar lander · model preview',description:'Explore an original schematic lander illustration and preview its engine. The lunar mission is still planned.',scene:landerScene,controls:[['fire','Fire descent engine',false]]},
    'mars-globe': {title:'Mars · surface overview',description:'Original procedural Mars globe with decorative relief and reference labels. It is not a measured global elevation map.',scene:marsGlobeScene,controls:[['bRelief','Exaggerate relief',false],['bPins','Landmarks',true],['bSpin','Auto-rotate',true]]},
    sar: {
      title: 'Floodwatch-01 · illustrative SAR spacecraft',
      description: 'Explore an original schematic radar-spacecraft illustration. It is not a specific flight spacecraft or an engineering assembly.',
      scene: sarScene,
      controls: [['bExplode', 'Exploded view', false], ['bEarth', 'Earth backdrop', true], ['bSpin', 'Auto-rotate', true]],
    },
    observatory: {
      title: 'Space observatory · illustrative telescope',
      description: 'An original generic optical-observatory illustration. It is not Hubble, a specific flight spacecraft or an engineering assembly.',
      scene: spaceObservatoryScene,
      controls: [['bSpin', 'Auto-rotate', true]],
    },
    rocket: {
      title: 'Launch vehicle · schematic',
      description: 'Explore an original generic multistage launch-vehicle illustration. Geometry and performance are not manufacturer specifications.',
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
// Explicit global export keeps classic-script consumers and test harnesses consistent.
globalThis.OrbitalModels = OrbitalModels;
