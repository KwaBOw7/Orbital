# ORBITAL v0.3.4.2 — Remediation and remaining audit register

15 November 2026. This register reflects the code and docs in the v0.3.4.2 working release, not earlier v0.3.3 observations. It separates software changes completed here from external acceptance gates that cannot be settled by editing the archive.

## Fixes implemented in this release

| Area | Change | Evidence / remaining boundary |
|---|---|---|
| Offline startup | Standalone HTML and `Play-*` launchers run without Python, credentials or network; loopback NASA service is optional. | Unit/VM and launcher contract tests; still needs target OS/browser acceptance. |
| NASA credential handling | Key remains in Python/local file, is not embedded in HTML or sent to browser; loopback host/origin checks and bounded requests are tested. | Mocked-provider tests; live provider exchange not performed. |
| DONKI | Validated reports can be retained as optional, conservative mission-planning context with explicit limits. | It does not alter physics, score or launch clearance; no calibrated radiation/hazard model exists. |
| Geometry packs | JPL Horizons vectors are validated for schema, frame, origin, units, coverage and digest; exact packs can be imported/pinned; no extrapolation. | No authentic Horizons pack is bundled and no external independent ephemeris comparison is certified. |
| Model provenance | New saves pin application, model and relevant dataset versions; saved records retain these identities on restore/replay. | Legacy formats remain supported on explicit compatibility paths. |
| Earth engineering | Restored two-body Kepler propagation, approximate Earth-fixed transformation, geometry-derived target/station/eclipse windows, simplified SAR estimates, ideal RF link budget, battery and single-node thermal calculations. | Educational model only. No perturbations, flight telemetry validation, calibrated radar radiometry or certified hardware inputs. |
| Mars engineering | Bounded point-mass EDL, two-body reference relay orbit/visibility and simplified rover energy/mobility. | Not validated against flown EDL, orbiter or rover telemetry; no high-fidelity terramechanics. |
| Procedural visuals | Replaced supplied/adapted Hubble, rocket, rover, terrain, Earth and Mars visual files with freshly authored procedural scene code. | All scenes explicitly illustrative; no NASA/vendor model or geographic elevation claim. Three.js remains MIT-licensed. |
| Project licensing | Added root Apache-2.0 license scoped to original project code/docs/procedural illustrations and included Three.js MIT notice. | Owner/contributor rights and team-wide licensing scope must still be verified before publication. |
| AI disclosure | Added `AI_USAGE_DISCLOSURE.md` documenting assistance in this remediation. | Team must add all AI use by all contributors and mark any AI-generated submission media per official rules. |
| Flood-data workflow | Added a `.prj`-aware shapefile-to-WGS84 GeoJSON preparation tool plus in-app local GeoJSON import; source hash and dataset identity flow into target-access geometry and mission save/replay. | The original UNOSAT data and rights confirmation must be obtained separately. Imported polygons use sampled weighted area for access and scoring. |
| GMAT reference workflow | Added GMAT reference script and CCSDS OEM validator/comparison CLI. | GMAT is not installed/run here; no OEM output bundled, and challenge-resource qualification must be confirmed by organizers. |
| Asset rights | Removed earlier unverified attachment-derived geometry and generated static image files; current scene modules are procedural illustrations, and bundled Three.js has its MIT notice. | New external datasets/assets must be independently rights-cleared before inclusion. |

## Outstanding technical validation

1. Acquire authentic JPL Horizons packs and compare against a separate, independent high-precision ephemeris source over multiple epochs. The current same-provider dense-cadence benchmark is not independent validation.
2. Run NASA GMAT and preserve an OEM output plus its version, force model, input state and SHA-256. Compare the application's orbit state against the same model/epoch with declared tolerances. GMAT execution has not been performed in this environment.
3. Obtain the official product, confirm reuse rights and benchmark the sampled polygon-access and delivered-area estimates against that product.
4. Source and validate hardware parameters (SAR waveform/radiometry, antenna pattern, RF band/rate, panel/battery, thermal, ADCS, launch vehicle) against official manuals/datasheets; current values are educational assumptions.
5. Validate Mars EDL, relay and rover outputs against an authoritative flown mission dataset or accepted reference simulator.
6. Complete rendered-browser tests in Chromium, Firefox and Safari (headless Chromium smoke was blocked by execution-environment policy); native Windows/macOS/Android/iOS acceptance; screen-reader, keyboard-only and contrast checks; reduced-motion behavior; performance/memory profiling on named target hardware.
7. Conduct learner usability sessions and record whether users can explain design trade-offs and mission outcomes.

## Competition, legal and submission gates

1. Confirm with the 2026 Global Organizing Team whether the project's proposed use of a resource in the selected challenge's Resources list satisfies the exact qualifying NASA data-source rule. The current code does not claim to have satisfied this.
2. Confirm all participant registrations, team roster and selected-event requirements in the official portal. They cannot be verified from this ZIP.
3. Clarify development chronology with organizers if any archive timestamps or earlier work create uncertainty. Do not change or falsify timestamps; ZIP timestamps alone do not establish when development actually occurred.
4. Confirm each contributor has rights to all submitted work and complete attribution for any external dataset. The root license does not convey rights to third-party content, external data products or agency marks; contributor authority to license all original contributions still requires team confirmation.
5. Complete the team's full AI-use disclosure, including tools used by other contributors and any AI-generated media labels required by the event.
6. Submit the official project entry and required demonstration. The archive cannot establish portal submission or organizer acceptance.

## Reproduction

From the `source/` directory:

```bash
npm test
python3 -m unittest discover -s tests -p 'test_*.py' -v
node build.mjs
python3 scripts/package_release.py
```

The automated tests exercise deterministic code contracts and mocked/synthetic fixtures. They do not certify scientific accuracy, live NASA connectivity, accessibility, cross-platform acceptance or competition eligibility.
