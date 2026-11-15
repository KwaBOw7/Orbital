# ORBITAL v0.4.2 validation

15 November 2026. The current source test run reports **107 Node.js tests and 48 Python tests passing**, with two Python shapefile tests skipped because pyshp/pyproj were unavailable. The offline-first playable HTML and optional same-origin loopback HTML variants build successfully. These tests exercise deterministic game behavior, input/data validation, save/replay behavior, API contracts with mocked/synthetic provider responses, and release-launcher contracts.

## Verified in this source build

| Check | Evidence | Limit |
| --- | --- | --- |
| Application version identity | Build checks `package.json`, `version.json` and `data/catalog.json` agree. | Does not validate the correctness of the model. |
| Offline HTML | Built self-contained playable offline game with CSP blocking external network access. | Static artifact and VM contract tests; broad target-browser testing remains open. |
| Optional loopback edition | Generates a same-origin edition for the local Python launcher. | Loopback behavior is tested on Linux with fixtures; Windows/macOS native acceptance remains open. |
| DONKI behavior | Tests schema validation, empty result handling, cache handling, mode controls, key redaction and loopback host/origin boundaries using synthetic/mocked responses. | No live credentials/provider exchange claimed. |
| Horizons request/pack | Tests request contract, frames, time scale, units, sample cadence, compatibility, checksums and no extrapolation. | No authentic reference pack is bundled or independently certified. |
| Flood GeoJSON | Geometry, CRS, declared metadata, holes, overlap deduplication, weighted area, access, replay and downlink verified with synthetic GeoJSON. | Authentic shapefile, GIS dependencies, field accuracy and reuse rights remain unverified. |
| OEM tools | Synthetic reference checks, strict case compatibility, and a 181-epoch independent RK4 comparison. | GMAT was not installed or executed. |
| Hermite interpolation | Analytic constant-acceleration fixture checks position and velocity interpolation. | A separate dense Horizons comparison is still required for operational accuracy limits. |
| Earth mission engine | Tests two-body propagation, ground-track/access geometry, eclipse windows, SAR/RF/power/thermal estimates, event stepping and deterministic behavior. | No independent GMAT/flight reference comparison; inputs are instructional assumptions. |
| Mars mission engine | Tests descent profile bounds, relay-window geometry, rover drive/braking/energy, save/replay and model provenance. | No flown Mars EDL or rover telemetry validation. |
| Learning levels | First launch offers all three levels. The choice persists after reload, stage guidance changes, and Advanced opens Earth engineering values by default. | Tested in the JavaScript application harness. |
| Exploded views | Rocket, radar spacecraft, rover, lander and observatory tests exercise actual group displacement and recovery, including reduced motion. | Geometry and controls tested in scene harnesses. |
| 3D lifecycle | Tests procedural scene geometry, view lifecycle, cleanup and Canvas fallback at the unit/VM layer. | Not a substitute for rendered-browser, device or accessibility acceptance. |
| Packaging | Tests executable Play scripts, Linux service startup and fresh DONKI retrieval with a mocked provider during startup, even with cached data and a prior offline preference. | Cross-platform native launcher acceptance remains incomplete. |

## Reproduce the test run

From `source/`:

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py' -v
node build.mjs
python3 scripts/package_release.py
```

## Browser and device acceptance

The Chromium smoke test for this package was blocked at startup by an operating-system socket restriction before a page opened. Rendered-browser acceptance remains open. Run the application manually in Chromium, Firefox and Safari, then on representative Windows/macOS and Android/iOS devices.

## Outstanding external validation

- Live NASA DONKI retrieval with a real key and live JPL Horizons retrieval with a real JPL contact identifier.
- Acquire and preserve an authentic Horizons pack; run a separate dense-cadence benchmark and report RMS/maximum error. The same-provider comparison is not independent verification.
- Independent GMAT/reference-orbit comparison, with documented force model, epoch, coordinate frame and tolerances.
- Official UNOSAT product acquisition, authentic-layer import and rights confirmation. Polygon-aware scoring uses sampled cells and has not been benchmarked against the authentic coverage product.
- Manufacturer/mission-specific spacecraft, instrument, RF, power, thermal, ADCS and launch reference values.
- Mars EDL and rover model validation against authoritative mission data or a reference simulator.
- Rendered-browser acceptance remains open in Firefox and Safari; native Windows/macOS launcher execution; Android/iOS touch layout; keyboard-only, screen-reader, contrast and reduced-motion checks.
- Frame-rate/memory profiling on named target hardware.
- Rights-holder verification for the actual UNOSAT/HDX product and any future external material. Current visual assets are project-authored procedural modules plus Three.js under MIT; see `ASSET_PROVENANCE.md`. Contributor authority to license project contributions still needs confirmation.
- Team registration, challenge-resource qualification, development chronology and submission confirmation by the participants/organizers.

Passing tests means that the tested software behaves consistently under the tested assumptions. It does not prove that ORBITAL is flight-grade, physically accurate or eligible for a particular award.

## Audit fix acceptance

See [AUDIT_FIXES.md](AUDIT_FIXES.md) for dated evidence and exact numerical bounds. Chromium 156.0.8078.79 aborted before page navigation because its process socket was denied.



## Original attachment integration
111 JavaScript checks passed, including byte identity for all ten embedded assets, every rover STL vertex and normal, visible exploded legends, and rover keyboard movement/remount/cleanup. Original HTML browser rendering remains unverified in this environment (Chromium socket creation is denied). The external Three.js dependency must be reachable for the original HTML views.
