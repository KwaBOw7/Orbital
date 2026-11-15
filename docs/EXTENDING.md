# ORBITAL v0.4.2 extension guide

## Source boundaries

- `engine.js` owns Earth mission configuration, operations, resource accounting, event progression and career rules. It delegates physics calculations to `mission-physics.js`.
- `mars-engine.js` owns Mars configuration, entry/descent, relay-window generation, rover movement, tasks, persistence and settlement. It also uses `mission-physics.js` and `data-packs.js`.
- `mars-ui.js` owns Mars setup and controls; `mars-scene.js` is a visual/input layer and must not invent scientific telemetry.
- `data-packs.js` validates imported geometry packs; `data-ui.js` handles local import/export and mission pinning.
- `launcher.py` provides optional local DONKI context and a loopback-only bridge. Offline HTML does not require the launcher.
- `tools/nasa_data.py` acquires, validates, imports, exports and benchmarks JPL Horizons geometry packs.
- `build.mjs` creates the offline playable edition and optional loopback edition. The embedded runtime has no CDN dependencies.

## Scientific upgrades

Keep sourced data, derived outputs and authored assumptions visibly distinct. A new parameter needs units, allowed range, source/configuration/date, sourced/derived/assumed status and a behavior test. Do not use a planet-center vector to infer surface station, relay satellite or terrain geometry.

A change to the force model, coordinate transformation, instrument model or resource equations requires a new model-version identifier and updated provenance. Saved missions must preserve the exact model/dataset/configuration used. Do not silently reinterpret older saves. Add analytic fixtures and compare with an independent source before claiming scientific accuracy. State error metrics, units, coverage and tolerances.

## Missions and assets

Earth and Mars are playable with bounded educational models. Lunar, asteroid and telescope previews are not separate playable mission engines. Do not relabel the Earth engine as another mission. Each 3D asset must have a traceable source and redistribution permission in `ASSET_PROVENANCE.md`; if that cannot be established, remove/replace it before public redistribution. A mesh does not establish engineering dimensions, mechanical fit or collision clearance.

## Saves and career

Earth saves reconstruct a run from inputs/history; Mars saves validate and restore their snapshot. Preserve mode, attempts, distinct scenario best and committed rewards across save/replay. New Mars modes absent from older saves default to Practice. A completed career result must settle exactly once. Never award retroactive points simply because a previous release gains a new feature.

## Release process

1. Keep `package.json`, `data/catalog.json` and `version.json` on the same application version.
2. Keep model and dataset versions synchronized with the actual algorithms/data.
3. Update README and all current docs; remove contradictions rather than appending another release-specific paragraph.
4. Run `npm test` and `python3 -m unittest discover -s tests -p 'test_*.py'`.
5. Run `node build.mjs`, then `python3 scripts/package_release.py`.
6. Verify package contents, `SHA256SUMS.txt`, launcher scripts, the playable `index.html` and standalone HTML.
7. Do not claim live NASA acquisition, rights clearance, scientific validation, cross-browser acceptance or competition eligibility unless the corresponding external evidence exists.

## Procedural scene inventory

The current release contains only the procedural scene modules listed in `docs/ASSET_PROVENANCE.md`; it does not bundle the earlier reference HTML pages, imported rover STL, attachment-derived images or an adapter-generation script. Do not document those historical items as current dependencies. The local Three.js runtime is the only third-party visual library. Scene renderers must be disposed when hidden or removed. Interactive controls must have keyboard alternatives and accessible status text.
