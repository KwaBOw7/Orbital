# ORBITAL v0.3.1 — audit review and engineering backlog

Reviewed 14 November 2026 against the supplied **ORBITAL v0.2.3 Technical Audit Report** and the subsequent v0.3.0 implementation. v0.3.1 is a software-remediation release, not the scientific upgrade proposed by the audit. **All six critical scientific gaps remain open.** Passing game tests does not validate spacecraft engineering.

## Findings and disposition

| Audit area | Current evidence | Disposition |
| --- | --- | --- |
| Fixed Earth orbital schedules; no ground track | Authored imaging, eclipse and downlink events still drive Earth gameplay. | **Open:** propagate an orbit and derive geometry. |
| Unsourced hardware catalogue | Mass, power, cost and performance are authored game parameters. | **Open:** per-field sources and uncertainty, with illustrative values labelled separately. |
| No real flood observations | Volta Basin objectives remain synthetic; UI now states this explicitly. | **Open:** integrate a dated, licensed observation and assessment fixture. |
| Simplified SAR | Coverage/storage arithmetic exists; no physical resolution, swath, incidence or radiometric model. | **Open:** a bounded, sourced SAR model and reference cases. |
| No link budget | Fixed rates and scheduled contacts remain. | **Open:** geometry, gain/loss, noise, margin and selected data-rate model. |
| Incomplete power physics | Resource/battery rules exist; illumination, array attitude, temperature and efficiency are not independently validated. | **Open:** coupled generation/load/storage model. |
| Earth attitude, atmosphere, weather, ascent and thermal omissions | No new scientific solver was added in this patch. | **Open:** define supported fidelity and validate each added model. |
| Mars descent and navigation | Illustrative checkpoint interpolation and compressed visual altitude remain; no drag, parachute, powered landing or terrain-relative navigation solver. | **Open:** distinguish historical replay from simulated flight. |
| Mars driving absent/insufficient | v0.3.0 already added keyboard kinematics, energy, slope and boundary handling. No wheel suspension, rock collision or validated soil traction exists. | **Partly outdated:** movement exists; physical rover dynamics remain open. |
| Mars landscape and relay geometry | Supplied height field has no established geographic reference. Relay windows are authored schedules. | **Open:** sourced terrain and actual orbiter/site geometry. |
| DONKI disconnected from physics | Latest-available reports are displayed and cached, without altering outcomes. | **Open by design:** add a justified operational decision before assigning effects. Arbitrary storm penalty multipliers would not fix this. |
| Horizons nearest-sample jumps | v0.3.1 uses exact samples or time-bracketed cubic Hermite position/velocity interpolation. Range and ideal range/c are derived consistently. Wrong reference planes and vector tables are rejected; extrapolation remains prohibited. | **Fixed software behavior:** dense-reference accuracy and operational use remain unverified. |
| Horizons insufficient for Mars operations | Earth–Mars vectors do not locate the chosen rover or a relay orbiter. | **Open:** mission-specific data, not merely more frequent Earth–Mars samples. |
| NASA integration validates the catalogue | It does not. Imported context is separate from authored simulation settings. | **Open:** no NASA certification or validation claim. |
| Model provenance and mechanical fit | Supplied Hubble/rocket/rover/terrain assets are illustrative; their original rights remain unresolved. Hubble is a visual stand-in for a radar mission. | **Recorded, not resolved:** see ASSET_PROVENANCE.md for hashes and missing provenance. |
| Mars saves missing | v0.3.0 already persists designs, launched run, position, energy, samples, active task and pinned pack. | **Already corrected:** save/export validation remains covered by tests; browser file-dialog acceptance is pending. |
| Mars progression missing | v0.3.1 adds optional Career, scenario-separated best-score credit, launch attempts and once-only success/failure settlement. Legacy Mars saves migrate to Practice. | **Fixed:** Practice intentionally earns no career credit. |
| Configuration mostly predefined | Rover type, required tiers, add-ons, rocket and staging orbit are configurable; these choices still use authored tables. | **Partly corrected:** unrestricted engineering inputs and physical feasibility validation remain open. |
| Four future missions unavailable | Earth and Mars now playable; lunar rover, asteroid and telescope remain planned. | **Update count to three:** finish core fidelity before expanding. |
| Launcher instructions start wrong mode | Play scripts only open offline HTML. New Start-NASA scripts run the Python service; UI and documentation now name the right files. | **Fixed:** Linux startup verified; native Windows/macOS acceptance still pending. |
| Conflicting release documents | Current README, release, validation, progress, provenance and extension guidance rewritten for v0.3.1. | **Fixed for this release:** maintain a single current status rather than accumulating contradictory appendices. |
| Browser/platform/performance evidence missing | No new rendered-browser, Firefox/Safari, mobile, native Windows/macOS or target-device profiling results. | **Open verification gaps, not confirmed failures.** |

## What v0.3.1 verifies

The suite passes **91 tests: 62 Node and 29 Python**. New coverage checks interpolation against an independently calculated constant-acceleration trajectory; invalid frame/plane requests; Mars career launch and settlement, replay anti-farming, failure, abandonment and save migration; and a real local Linux NASA-service startup from a folder with spaces. The service test uses offline mode and does not establish live NASA ingestion.

The current patch does not add a sourced starter pack or real flood dataset. Previous DONKI ingestion evidence is recorded in NASA_DATA.md and was not repeated here. Browser preview access was blocked, so visual acceptance remains unverified. Source-level scene tests use a stub renderer and must not be presented as screenshots, frame-rate measurements or browser acceptance.

## Recommended engineering order and acceptance gates

These are proposed work items and acceptance criteria, not completed results. Keep each change independently reviewable and preserve existing save behavior.

### 1. Establish a versioned scientific data contract

Record source URL, provider, product/version, acquisition time, observation epoch, units, coordinate frame, coverage interval, license, checksum, uncertainty and transformation history. Label each parameter as sourced, derived or assumed. Missing evidence must remain visible. Do not imply that a NASA data response certifies an unrelated game value.

Separate an illustrative learning model from any future sourced engineering model. Save the selected model version and pinned data pack with each mission. Online refresh downloads and validates a candidate pack atomically; it must not silently modify an active run. Offline mode uses its pinned validated pack. Show freshness and coverage independently: a recent download can contain historical observations. Label event reports as latest available, not real-time spacecraft telemetry.

**Acceptance:** reproducible offline run from exported data; invalid schema/frame/unit/hash rejected; interrupted refresh preserves the last good pack; stale and out-of-coverage data produce an explicit state; same inputs/model/pack yield the same outcome.

### 2. Orbit, ground track, eclipse and contact geometry

Begin with a documented Earth two-body model and explicit epoch, inertial frame and units. Derive Earth-fixed position using a specified time/frame transformation, then ground track, line of sight and eclipse. Add perturbations only with a defined purpose and validation. TLE-based operation requires an appropriate SGP4 implementation; arbitrary Kepler elements must not be passed off as a TLE solution.

Use independent reference cases from [NASA GMAT](https://software.nasa.gov/software/GSC-19640-1); its [verification and validation report](https://ntrs.nasa.gov/citations/20140017798) illustrates why an independent comparison matters. Choose error tolerances before running comparisons and publish their rationale, force-model assumptions, epoch and duration. Numerical conservation checks alone are insufficient.

**Acceptance:** circular and eccentric orbit fixtures; meaningful ground-track, eclipse-boundary and station-contact cases; documented maximum position/time errors over the intended mission duration against the reference; outcomes change when orbital geometry changes. No precision claim until measured.

### 3. Real Lower Volta observation fixture

A relevant candidate is [UNITAR/UNOSAT product 3705](https://unosat.org/products/3705), which analyzes Sentinel-1 imagery acquired on 23 October 2023 over the Lower Volta area. This is an ESA Sentinel-1-derived UNOSAT analysis, not a NASA observation. UNOSAT labels the assessment preliminary and not field validated; treat it as a comparison product, not unquestioned ground truth. Confirm licensing and retain attribution before bundling it.

[NASA HydroSAR classifications](https://science.data.nasa.gov/disasters/data-gallery/hydrosar-s1-classifications) are another relevant reference for flood mapping. That overview alone does not establish historical coverage for the chosen Ghana date. Check actual product availability before selecting it.

**Acceptance:** one downloadable, reproducible region/time fixture with CRS, resolution and no-data handling; visible observation date and uncertainty; a real change to mission targeting or evaluation; tests for partial coverage, clouds if optical data are used, and unavailable observations. Preserve synthetic scenarios as explicitly labelled lessons.

### 4. Sourced hardware and coupled SAR, power and radio models

Use mission-appropriate primary specifications and publications for every validated parameter. [NASA's Small Spacecraft Technology State of the Art](https://www.nasa.gov/smallsat-institute/sst-soa/) is a starting reference for subsystem choices, not a substitute for the selected hardware's specifications. Hubble imagery must not supply SAR engineering values.

For SAR, define supported radar mode, frequency, geometry and assumptions before deriving resolution, swath and incidence limits. Link acquisition to pointing, imaging duration, storage and electrical loads. For radio, calculate slant range, visibility, antenna gain/pointing, path and equipment losses, noise and link margin; state the modulation/coding assumptions behind the chosen data rate. For power, connect eclipse/illumination and panel orientation to generation, subsystem duty cycles, charge/discharge efficiency, capacity and reserve constraints. Treat temperature and degradation explicitly or list their omission.

**Acceptance:** unit-consistent equations with source citations; independently calculated golden examples; energy/data conservation; limit and failure tests; a player-visible tradeoff that changes delivered observations for a defensible reason. Environmental/DONKI effects require an evidenced model and applicability range before changing success probabilities.

### 5. Mars replay, terrain and rover operations

Keep historical reconstruction distinct from free-play flight simulation. [NASA NAIF's Mars 2020 SPICE archive documentation](https://naif.jpl.nasa.gov/pub/naif/pds/pds4/mars2020/mars2020_spice/document/spiceds_v001.html) describes reconstructed mission geometry. Select and record the relevant kernels, frames, time system and coverage; account for gaps. Do not transplant historical geometry into arbitrary user-designed vehicles and call the result a physical simulation.

For simulated descent, specify atmosphere, drag, gravity, mass evolution, parachute and thruster models, integrator and transition conditions. For surface operations, choose georeferenced terrain with a known vertical datum/resolution and verified rover scale; implement collision and a bounded mobility model. Compute relay contacts from the landing site and an actual relay trajectory, including occultation and range.

**Acceptance:** historical reference checks for replay; convergence and known-case tests for dynamics; no penetration/teleportation at terrain boundaries; reproducible energy/traction limits; contact windows compared with an independent geometry calculation. The current compressed display must retain an explicit visual-scale label until replaced.

### 6. Platform, performance and release evidence

Run a recorded OS/browser matrix for network-disconnected first launch, local saves and file export/import, missing/corrupt data, offline-to-online recovery, keyboard focus and scene switching. Native Windows and macOS launcher execution cannot be substituted by inspecting their text. Test Firefox and Safari separately. Decide whether mobile is supported before promising its controls.

Measure frame times and memory on named hardware with a reproducible workload and defined memory metric. The audit's 60 FPS and 500 MB targets are currently unverified goals, not achieved constraints. Resolve model redistribution rights before public distribution; hashes establish identity, not permission.

## Progress tracking

The local checklist in GITHUB_PROGRESS.md can become repository issues in the same order. No GitHub issue, commit, pull request or remote update was created in this review; no linked repository was available in the working copy. Keep scientific acceptance evidence with each future implementation and update this audit status when the evidence exists.

**Verdict:** the audit correctly identifies the project's main scientific weaknesses, but it mixes major new engineering work with several defects already corrected since v0.2.3. v0.3.1 resolves the confirmed release/functionality issues above. The next substantial milestone should be versioned data, orbital geometry and a real flood-observation fixture before more UI or mission expansion.
