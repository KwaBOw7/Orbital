# ORBITAL v0.3.4 — v0.3.3 Audit Remediation Report

**Baseline:** `ORBITAL-v0.3.3.zip`  
**Remediation release:** `ORBITAL v0.3.4`  
**Date:** 15 November 2026  
**Purpose:** Record what was corrected from the v0.3.3 audit and identify what remains dependent on external data, physical devices, rights holders, or competition organizers.

## 1. Corrections implemented

| Audit finding | v0.3.4 remediation | Status / limit |
|---|---|---|
| Offline play was blocked by NASA service/key failures. | Standalone `index.html` and `Play-*` launchers now provide offline-first gameplay; Python loopback/NASA mode is optional. | Implemented and launcher-contract tested. Browser/OS acceptance is still open. |
| NASA key handling and cached context were too tightly coupled to startup. | DONKI is optional; offline mode starts without a key; cached reports can be loaded; local key remains in Python and receives restrictive POSIX permissions. | Implemented with mocked-provider and launcher tests. A live NASA request was not performed. |
| DONKI events were presented as a mission gate without validated physical effects. | Reports are explicitly planning context only and do not change mission physics, score or launch clearance. | Implemented. A calibrated space-weather/radiation model remains out of scope. |
| Horizons packs lacked a strong local data contract and version identity. | Added strict pack validation, compatibility paths, model/dataset/interpolation identities, no-extrapolation handling, local import/pinning and dense same-provider comparison tooling. | Implemented and fixture-tested. No authentic pack or independent ephemeris benchmark is bundled. |
| The engineering physics layer from the earlier checkpoint was absent. | Restored `src/mission-physics.js`; Earth/Mars engines use bounded educational calculations for orbital state, ground-track/access, eclipse, SAR geometry, ideal RF, power/thermal, Mars descent, relay and rover mobility. | Implemented and covered by deterministic tests. Not flight-qualified or independently validated. |
| Earth/Mars missions did not preserve sufficient model/data provenance. | Mission records and save/replay paths retain app/model/dataset identifiers; Mars may pin an imported Horizons pack; UNOSAT source hash/profile is retained in Earth mission records. | Implemented and tested. Older save formats use explicit compatibility handling. |
| Floodwatch depended only on a synthetic target ledger. | Added `.prj`-aware UNOSAT shapefile-to-WGS84 GeoJSON converter and local browser importer. A validated product-3705 footprint changes target-access geometry and is pinned into mission saves/replays. | Implemented. The data file is not bundled; access uses a bounding-circle approximation and the 720-tile scoring ledger remains synthetic. |
| A GMAT reference/validation workflow was absent. | Added a GMAT point-mass reference script and CCSDS OEM parser/comparator with frame, epoch, centre and units validation. | Tooling implemented and synthetic-fixture tested. GMAT was not installed/run; no OEM output is included. This does not by itself establish qualifying challenge-resource use. |
| Unverified Hubble/rocket/rover/terrain attachment-derived assets had unclear rights. | Replaced those assets with project procedural illustrations; the optical observatory is generic, and the SAR vehicle is represented by an original schematic. | Implemented in the packaged assets. The visuals are not NASA flight models, CAD assemblies or measured terrain. Contributor rights still require team confirmation. |
| The project lacked an overall license and adequate third-party notices. | Added root Apache-2.0 license with scope notice, `NOTICE`, `THIRD-PARTY-NOTICES.md`, and packaged Three.js MIT license. | Files included in the release. Each contributor must confirm authority to license their contributions; this package cannot make that legal determination. |
| README and technical docs contained stale references/contradictions. | Updated README, release, validation, NASA data, data provenance, asset provenance, extending guide, audit register, progress and AI-use disclosure. Removed references to non-existent reference assets/adapters. | Implemented; docs are included at package root and under `source/docs/`. |
| Asset provenance was stale or unclear. | Recorded current procedural model files, their SHA-256 hashes and the bundled Three.js dependency/license; clarified removed historical assets. | Implemented for the current archive. Hashes prove file identity, not authorship or rights. |
| Release packaging did not carry complete license notices. | Packaging now includes `LICENSE`, `NOTICE`, `THIRD-PARTY-NOTICES.md`, Three.js license text, source, docs, tests, offline HTML, optional online HTML, launchers and SHA-256 manifest. | Implemented; archive contents and all listed checksums verified. |
| UI did not implement application-wide reduced-motion behavior. | Added application-wide `prefers-reduced-motion` CSS handling and corrected the related rendering/test regressions. | Code change and unit/VM test coverage; real assistive-technology acceptance remains open. |

## 2. Verification completed

- **Node.js:** 100 tests passed, 0 failed.
- **Python:** 42 tests passed, 0 failed.
- **Build:** `node build.mjs` generated the offline playable edition and optional loopback edition.
- **Package:** `python3 scripts/package_release.py` generated the ZIP and standalone HTML.
- **Archive:** 101 files in the ZIP; all 100 entries listed in `SHA256SUMS.txt` were independently re-hashed and matched.
- **Security/package inspection:** No personal `API.txt`, `.env` file or local Horizons pack was included. `index.html` contains the game, flood-data and physics modules and uses `connect-src 'none'` in its offline CSP.

### Browser verification limitation

A headless Chromium launch was attempted against both `file://` and loopback HTTP. The browser returned `ERR_BLOCKED_BY_ADMINISTRATOR`; the environment has a managed URL blocklist that prevents navigation. This is not a successful UI test. The report therefore does not claim rendered-browser, Firefox, Safari, mobile, screen-reader or cross-platform acceptance.

## 3. Outstanding issues that cannot be truthfully marked fixed

### A. Real data and scientific validation

1. **No authentic Horizons pack is bundled.** A real JPL contact identifier and a live provider fetch are needed; a separate independent reference is needed to validate interpolation errors.
2. **No GMAT run or generated OEM file is bundled.** The reference script and parser/comparator exist, but GMAT must be run with recorded version, force model, initial state, frame, epoch and output hash. The output must then be compared against the ORBITAL engine under declared tolerances.
3. **No official UNOSAT shapefile/GeoJSON is bundled.** The user/team must acquire product 3705 and confirm the product's reuse/attribution terms. The official page describes its interpretation as preliminary and not field-validated; radar can under-detect water in built-up or densely vegetated areas. The app's import path changes the target access centre/radius, not polygon-level scoring or pixel/raster analysis. Source: <https://unosat.org/products/3705>.
4. **The hardware catalogue remains educational.** Mission-specific references are still needed for radar waveform/radiometry, antenna pattern, RF bands/coding, power hardware, thermal properties, ADCS limits and launch-vehicle performance.
5. **Mars remains an educational model.** There is no comparison against flown Mars EDL, orbiter or rover telemetry; rover wheel-soil terramechanics and multibody suspension are not implemented.
6. **DONKI remains informational.** No calibrated local radiation dose, flux, forecast or spacecraft-risk effect model is implemented, intentionally avoiding invented physical causality.

### B. UI, accessibility and platform acceptance

1. Re-run the full flow in a normal Chromium browser, then Firefox and Safari.
2. Test native Windows and macOS launchers; test Android/iOS touch layouts.
3. Verify keyboard-only operation, screen-reader names/status announcements, focus order, contrast and reduced-motion behavior with real assistive technologies.
4. Profile frame rate and memory on named representative hardware.
5. Conduct learner usability sessions to establish whether first-time players understand engineering trade-offs and mission debriefs.

### C. Legal and Space Apps gates

1. **Challenge-specific NASA data qualification is not confirmed.** The Global Organizing Team states that Global Award eligibility requires meaningful use of at least one NASA data source listed in the selected challenge's Resources section, and the source must be cited. GMAT is listed as a NASA mission-analysis tool in challenge materials, but it is software; do not assume that a GMAT-generated reference trajectory automatically satisfies the wording. Obtain confirmation from the GO Team before claiming Global Award eligibility. Rule clarification: <https://github.com/nasa/spaceapps/discussions/1827>. GMAT NASA Software Catalog: <https://software.nasa.gov/software/GSC-19640-1>.
2. The ZIP cannot establish team registration, selected local/Universal Event, roster, participant status, or project submission. Check the official event portal: <https://www.spaceappschallenge.org/2026/>.
3. The earlier v0.3.3 archive has entries timestamped before the stated 9:00 AM local development start. ZIP timestamps can change during copying/extraction and do not prove the actual time work began. Keep contemporaneous evidence and ask the organizers to resolve any uncertainty. Do not modify timestamps to conceal or manufacture chronology.
4. Each contributor must confirm that they have the rights to license their work under the project license. The Apache-2.0 file does not grant rights to third-party data, agency marks or contributions whose owners have not authorized release.
5. The team must complete AI-use disclosure for every contributor and identify any AI-generated media according to the event's rules. The included disclosure covers this remediation only.
6. The release does not include a recorded 30-second video or a seven-slide submission presentation. These are submission deliverables, not application source-code defects.

## 4. Release conclusion

ORBITAL v0.3.4 addresses the software regressions and fixable packaging, provenance, offline operation, external-data preparation and documentation defects identified in the v0.3.3 audit. It does **not** turn the game into a flight-qualified simulator, does **not** establish all third-party data rights, and does **not** certify competition eligibility or Global Award qualification.

The next work should prioritize actual GMAT/Horizons reference execution, licensed UNOSAT product integration and polygon-aware scoring, independently sourced engineering parameters, rendered-browser/accessibility acceptance, and organizer confirmation of the qualifying NASA resource.
