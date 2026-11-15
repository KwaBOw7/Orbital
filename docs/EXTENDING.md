# ORBITAL v0.3.3 extension guide

## Source boundaries

`engine.js` owns Earth event/resource and career rules. `mars-engine.js` owns Mars configuration, movement, tasks and settlement. `mars-ui.js` owns the Mars setup flow. `data-packs.js` validates geometry and derives interpolation; `data-ui.js` imports/exports and pins it. `launcher.py` acquires and caches DONKI. Scene code is visual-only except that rover input passes into the Mars engine.

## Scientific upgrades

Follow AUDIT_REVIEW.md before extending simulation scope. Keep the existing authored model explicitly labelled for legacy saves. A propagated engine must use a new model/version identifier: record initial epoch, frame, elements/state vector, force model and data versions in each run. Do not silently reinterpret older game-schedule saves under new physics. Match independent fixtures and define error tolerances before making science-accuracy claims.

A new parameter needs units, allowed range, source/configuration/date, sourced/derived/assumed status and a behavior test. Changing display labels is not engineering validation. Do not use a planet-center vector to infer surface station, relay satellite or terrain geometry.

## Missions and assets

Earth and Mars are playable. Lunar, asteroid and telescope are separate planned systems; do not relabel the Earth engine as a new mission. Physical models must retain source and permission records in ASSET_PROVENANCE.md. Models do not substitute for mechanical envelope/collision checks.

## Saves and career

Earth saves reconstruct a run from inputs/history; Mars saves validate and restore their snapshot. Preserve mode, attempts, distinct scenario best and committed rewards across save/replay. New Mars modes absent from older saves default to Practice. A completed career result must settle exactly once. Never award retroactive points simply because a previous release gains a new feature.

## Release

Version in package.json and data/catalog.json must agree. Update current README/RELEASE/VALIDATION/GITHUB_PROGRESS/DATA_PROVENANCE documents rather than appending contradictory old summaries. Run both test suites, rebuild both HTML variants, package, verify checksums and inspect exported launchers. Both Play and Start-NASA run the mandatory startup gate. The setup page ships separately from the loopback game.

## Supplied scenes

The four new reference HTMLs live in assets/models/references/. Regenerate their scene adapters with scripts/adapt_visual_models.py. Register scenes in src/model-viewer.js and use OrbitalInline.html in game views. src/scene-runtime.js scopes lifecycle and sizing; scene renderers must be disposed when hidden or removed. Original reference HTMLs contain CDN tags for provenance only; never load them as runtime iframes.
