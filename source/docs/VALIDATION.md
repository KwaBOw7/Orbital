# ORBITAL v0.3.4 validation

15 November 2026. The current source test run reports **100 Node.js tests and 42 Python tests passing**. The offline-first playable HTML and optional same-origin loopback HTML variants build successfully. These tests exercise deterministic game behavior, input/data validation, save/replay behavior, API contracts with mocked/synthetic provider responses, and release-launcher contracts.

## Verified in this source build

| Check | Evidence | Limit |
| --- | --- | --- |
| Application version identity | Build checks `package.json`, `version.json` and `data/catalog.json` agree. | Does not validate the correctness of the model. |
| Offline HTML | Built self-contained playable offline game with CSP blocking external network access. | Static artifact and VM contract tests; broad target-browser testing remains open. |
| Optional loopback edition | Generates a same-origin edition for the local Python launcher. | Loopback behavior is tested on Linux with fixtures; Windows/macOS native acceptance remains open. |
| DONKI behavior | Tests schema validation, empty result handling, cache handling, mode controls, key redaction and loopback host/origin boundaries using synthetic/mocked responses. | No live credentials/provider exchange claimed. |
| Horizons request/pack | Tests request contract, frames, time scale, units, sample cadence, compatibility, checksums and no extrapolation. | No authentic reference pack is bundled or independently certified. |
| UNOSAT flood GeoJSON import | Tests Product 3705 metadata, geometry bounds, CRS, source identity, profile integrity, SHA-256, import/pin/save/restore/replay path. | No official shapefile/GeoJSON is bundled; the user must acquire it and confirm reuse terms. Target access uses a bounding-circle approximation; scored tiles remain synthetic. |
| GMAT OEM tooling | Tests supported CCSDS OEM parsing, frame/center/time validation and vector comparison using synthetic fixtures. | GMAT is not installed/run here; no GMAT-generated OEM reference is bundled. |
| Hermite interpolation | Analytic constant-acceleration fixture checks position and velocity interpolation. | A separate dense Horizons comparison is still required for operational accuracy limits. |
| Earth mission engine | Tests two-body propagation, ground-track/access geometry, eclipse windows, SAR/RF/power/thermal estimates, event stepping and deterministic behavior. | No independent GMAT/flight reference comparison; inputs are instructional assumptions. |
| Mars mission engine | Tests descent profile bounds, relay-window geometry, rover drive/braking/energy, save/replay and model provenance. | No flown Mars EDL or rover telemetry validation. |
| 3D lifecycle | Tests procedural scene geometry, view lifecycle, cleanup and Canvas fallback at the unit/VM layer. | Not a substitute for rendered-browser, device or accessibility acceptance. |
| Packaging | Tests offline launcher behavior, optional Python service startup and source package contracts. | Cross-platform native launcher acceptance remains incomplete. |

## Reproduce the test run

From `source/`:

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py' -v
node build.mjs
python3 scripts/package_release.py
```

## Browser and device acceptance

A headless Chromium smoke attempt was blocked by this execution environment with `ERR_BLOCKED_BY_ADMINISTRATOR` for both local-file and loopback HTTP navigation. This is an environment restriction, not a successful browser pass. No rendered-browser acceptance is claimed for this release. Run the application manually in Chromium, Firefox and Safari, then on representative Windows/macOS and Android/iOS devices.

## Outstanding external validation

- Live NASA DONKI retrieval with a real key and live JPL Horizons retrieval with a real JPL contact identifier.
- Acquire and preserve an authentic Horizons pack; run a separate dense-cadence benchmark and report RMS/maximum error. The same-provider comparison is not independent verification.
- Independent GMAT/reference-orbit comparison, with documented force model, epoch, coordinate frame and tolerances.
- Official UNOSAT product acquisition and rights confirmation. The importer/GeoJSON pipeline is implemented; when imported, the target footprint affects access geometry. Polygon-level coverage scoring and pixel/raster flood analysis are not implemented, and the 720-tile training ledger remains synthetic.
- Manufacturer/mission-specific spacecraft, instrument, RF, power, thermal, ADCS and launch reference values.
- Mars EDL and rover model validation against authoritative mission data or a reference simulator.
- Rendered-browser acceptance remains open in Firefox and Safari; native Windows/macOS launcher execution; Android/iOS touch layout; keyboard-only, screen-reader, contrast and reduced-motion checks.
- Frame-rate/memory profiling on named target hardware.
- Rights-holder verification for the actual UNOSAT/HDX product and any future external material. Current visual assets are project-authored procedural modules plus Three.js under MIT; see `ASSET_PROVENANCE.md`. Contributor authority to license project contributions still needs confirmation.
- Team registration, challenge-resource qualification, development chronology and submission confirmation by the participants/organizers.

Passing tests means that the tested software behaves consistently under the tested assumptions. It does not prove that ORBITAL is flight-grade, physically accurate or eligible for a particular award.
