# ORBITAL v0.4.4 — Space Mission Design Game

Last updated: 2026-11-15 22:12:30 UTC

ORBITAL is an offline-first educational space-mission design game. Players configure and operate an illustrative Earth-observation mission and a Mars rover mission while balancing mass, budget, energy, communications and science return.

> **Scientific scope:** ORBITAL contains deterministic educational engineering models, not flight-qualified mission-analysis software. Real source data, derived calculations and authored scenario assumptions are identified separately in the interface and documentation.

## Quick start

### Launch with the Play script

1. Extract the release ZIP and install Python 3.
2. For live data, put your personal [NASA API key](https://api.nasa.gov/) on one line in `API.txt` beside `launcher.py`.
3. Run the script for your system from the extracted directory. Keep its terminal open while playing.
4. Choose Basic, Intermediate, or Advanced, then start an Earth or Mars mission.

| System | Start ORBITAL |
| --- | --- |
| Linux | `./Play-Linux.sh` |
| macOS | `./Play-macOS.command` |
| Windows | `.\Play-Windows.cmd` in PowerShell |

The script starts the game and checks `API.txt`. If the file contains a key, ORBITAL requests fresh NASA DONKI data in the background, even if reports are already cached. A successful refresh replaces the local snapshot. If a refresh fails, the game shows its status and keeps the last valid reports. If the key is missing or the file is malformed, the launcher opens in offline mode and displays setup instructions. The browser never receives the key.

Use `./Play-Linux.sh --offline` (or pass `--offline` to your platform’s script) to skip NASA requests for the session. The **Offline / stop updates** button pauses updates for the current run. A new Play launch with a configured key starts a new refresh. To refresh and cache reports without opening the browser, pass `--refresh-only` to the script.

### Standalone offline play

Open `index.html` directly to play without Python. The simulation, supplied rover STL and rocket model work offline. Other supplied HTML model views still require internet for their original Three.js CDN dependency. Existing exported saves and compatible geometry packs can be imported from the game menu; v0.4.3 Horizons packs remain compatible.

### Learning levels and exploded views

Basic offers step-by-step prompts. Intermediate highlights engineering trade-offs. Advanced shows technical checks and initially opens the Earth builder’s engineering values. The learning level is saved in this browser and can be changed from the footer. All three levels use the same simulation, objectives and scoring.

The launch page uses the supplied 3D rocket, with **Ignite**, **Exploded view** and **Auto-rotate** controls. Drag to rotate, scroll to zoom, or tap a part for its description. The expanded rocket view retains these controls. The camera fits the complete exploded assembly on desktop and narrow screens. Earth, Mars globe, asteroid and telescope control bars have been removed from both compact and expanded views. Compact lunar previews hide **Fire descent engine**; expanded lander views retain it.

### NASA reports

DONKI reports provide space-weather context. Mission physics, scoring and launch clearance use the simulation’s models. The launcher runs only on `127.0.0.1` and chooses a free local port if its default is busy. Keep `API.txt` private. The key and local report cache are excluded from the release.

## JPL Horizons geometry (optional)

Mars missions can use a locally imported Earth–Mars geometry pack in Horizons format. The standalone game does not download data. From the extracted `source/` directory, acquire a pack using Python 3 and a real contact identifier required by JPL's API policy.

```bash
python3 tools/nasa_data.py refresh \
  --start 2026-11-14 --days 1 \
  --contact "your-real-contact@example.com" \
  --output earth-mars-pack.json
```

`--start` is a UTC date and `--days` is 1–7. The downloader validates the response, writes a portable JSON pack and stores the exact response bytes and acquisition manifest under the local data repository. The browser reports pack integrity and treats provider identity as unverified. In the game open **Data & geometry → Import geometry JSON** and select the file. The pack is pinned to new Mars missions; an existing saved mission retains its original dataset. No extrapolation is performed outside the pack's time coverage. Follow [JPL's API policy](https://ssd-api.jpl.nasa.gov/doc/) and [Horizons documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html).

To run a denser same-provider comparison against an hourly pack, use:

```bash
python3 tools/nasa_data.py benchmark \
  --pack earth-mars-pack.json \
  --reference-step "5 m" \
  --contact "your-real-contact@example.com"
```

This benchmark quantifies interpolation differences against a separately sampled Horizons series from the same provider. It is not an independent-provider validation or a proof of physical accuracy. No official starter ephemeris is bundled; a downloaded pack is required for Horizons-derived delay in a new Mars mission.

## Earth-observation mission

1. Choose **Configure mission** and inspect mandatory parts and optional upgrades. Component tiers affect mass, power, storage, budget and other game parameters.
2. Select the orbit profile and imaging/downlink plan. ORBITAL propagates its supported two-body Keplerian orbit and derives target access, virtual-station visibility and eclipse windows from geometry.
3. Review the rocket, budget, fairing-envelope and crew checks. Launch constraints and catalogue values are educational assumptions, not vendor performance specifications.
4. Operate the 72-hour mission with Play/Pause, speed controls, Next event and Run to mission end.
5. Return at least 80% of the selected target area. Only delivered, unique imagery counts. Review the debrief and replay or revise the design.

The Volta Basin Floodwatch target ledger is synthetic; it is not a flood observation product, flood map, current emergency assessment or measured affected area. Baseline designs are deterministic regression examples, not real satellite performance predictions. The Floodwatch spacecraft is shown using an original procedural SAR schematic. It is not a NASA flight model or mechanically validated assembly. A separate generic optical-observatory illustration is not used as the Floodwatch spacecraft.

For a local historical target, select the flood polygon layer from the referenced [UNOSAT Product 3705](https://unosat.org/products/3705). It describes a preliminary Sentinel-1 interpretation acquired 23 October 2023. Keep the shapefile sidecars together. The optional converter uses the projection from `.prj` and logs component names and hashes. Run it from the extracted `source/` directory.

```bash
python3 -m pip install pyshp pyproj
python3 tools/import_unosat_shapefile.py /path/to/flood-layer.shp --output flood.geojson \
  --attest-source --source-download-url 'https://actual-download-url' \
  --downloaded-at 'ACTUAL_ISO_DOWNLOAD_TIMESTAMP'
```

Replace the placeholders with the exact source URL and actual timestamp. Under **Data & geometry → Import flood GeoJSON**, review the declared origin and confirm the local import. User-supplied data remains marked as unauthenticated. The Earth mission pins a 32 × 32 weighted grid. At each scheduled observation slot, the engine evaluates the cell's estimated visibility and off-nadir angle, then tracks the unique imaged and delivered area. The debrief shows imported footprint, geometrically reachable, imaged and delivered area separately. This is historical training with sampled geometry. Check the product's reuse and attribution terms before redistributing external data.


## Mars rover mission

1. Choose Scout, Surveyor or Pathfinder. The profiles are illustrative and share the same original procedural rover illustration.
2. Install the required subsystems and select performance tiers and optional equipment.
3. Choose Courier, Voyager or Atlas Heavy. These are fictional game launch services with authored capacity and cost limits.
4. Select a direct, elliptical or polar reference-orbit profile. The game derives relay visibility against its Jezero training-site coordinates and supported two-body orbiter model. These are not operational flight ephemerides.
5. Run the educational entry, descent and landing profile, or skip to the surface. Use **Drive · WASD** to focus the rover controls.

| Input | Action |
| --- | --- |
| W / S or up / down | Forward / reverse |
| A / D or left / right | Steer |
| Space | Brake |
| X / C / T | Analyze rock / drill core / relay science |
| Drag or Q / E | Orbit camera |
| Scroll or + / −; R | Zoom; reset camera |

Drive to the cyan markers, complete the science tasks and transmit results during an available simulated relay window. Delivery credit depends on the pinned geometry pack, ideal one-way Earth–Mars delay and mission deadline. Without a pack, Practice uses a clearly identified baseline and does not claim a Horizons-derived delay.

The Mars descent is a deterministic point-mass educational model. Rover motion is simplified and does not implement multibody suspension or wheel-soil terramechanics. The visual terrain is procedural and not a georeferenced elevation product. See `docs/ENGINEERING_MODELS.md` for force-model and subsystem limitations.

## 3D scenes and asset rights

The ten user-supplied attachments are preserved byte-for-byte under `source/assets/originals/` and embedded in the playable HTML. Earth, Moon, rocket, lander, Mars surface, Hubble, asteroid, night sky and Mars mountain views run in isolated frames. The original rover STL supplies the body; the display adds wheels, cameras, a solar array, an arm and communications components. These are educational illustrations, not mechanically accurate assemblies or authoritative geographic products. No NASA authorship or measured planetary texture is claimed.

The rocket uses bundled Three.js r128 and the existing Canvas fallback, so it renders without internet or WebGL. Display-time adjustments correct its nose orientation, camera framing and compact controls. Original asset files and hashes remain unchanged. Other HTML model views retain their external dependency requests; `--offline` controls NASA retrieval rather than those model dependencies.

Three.js is distributed under its MIT license in `source/assets/vendor/three-LICENSE.txt`, also copied to `THIRD-PARTY-LICENSE.txt`. The project license applies to original ORBITAL work and does not establish ownership or redistribution rights for user-supplied assets, NASA marks or other third-party materials. See [`docs/ASSET_PROVENANCE.md`](docs/ASSET_PROVENANCE.md) for the asset inventory and hashes.

## Saves, data and model provenance

New Earth and Mars missions record application/model identifiers and the scenario or geometry dataset used. Mars saves pin their exact Horizons pack when one is imported. DONKI snapshots, when available, are attached as observational planning context only. Imported files are validated before replacing an existing session.

The app distinguishes:
- **Sourced context:** NASA DONKI event reports and NASA/JPL Horizons state vectors when acquired from those providers.
- **Derived quantities:** orbital states and access windows, SAR geometry estimates, ideal link-budget limits, battery/thermal estimates, relay geometry and ideal propagation delay.
- **Authored assumptions:** synthetic Floodwatch target cells, virtual ground nodes, equipment specifications, launch-service values, local Mars terrain and the educational Mars scenario.

Detailed limits are in [`docs/DATA_PROVENANCE.md`](docs/DATA_PROVENANCE.md) and [`docs/ENGINEERING_MODELS.md`](docs/ENGINEERING_MODELS.md).

## Space Apps challenge self-assessment

The game addresses the Space Mission Design Game brief through mission configuration, resource trade-offs, and mission operation. This mapping is a project self-assessment, not a judge's decision or proof of Global Award eligibility.

| Challenge/resource connection | Current implementation | Status / limit |
| --- | --- | --- |
| Mission design and systems engineering | Flight manual maps user, space, launch and ground segments to game actions; configuration and preflight checks model trade-offs. | Implemented as an educational interpretation; not a NASA-certified design process. |
| NASA GMAT | A reproducible GMAT point-mass reference script and CCSDS OEM validation/comparison tool are included. | Optional external validation workflow; no GMAT run or OEM output is bundled, and the game does not use a GMAT-generated trajectory at runtime. |
| NASA/JPL Horizons | Validated geocentric Earth–Mars vectors can be imported and pinned to new Mars missions; ideal one-way delay affects data receipt. | Meaningful imported data use, but its presence alone does not establish that it matches a listed qualifying NASA data source. |
| NASA DONKI | Optional reported space-weather events are preserved as planning context. | Not a local radiation/forecast model and does not alter mission physics or scores. |
| UNOSAT flood observation | Optional import of user-supplied GeoJSON uses weighted polygon cells for simulated access and delivered-area scoring. | Product 3705 is the external historical reference. Imports carry unauthenticated source claims. The original UNOSAT dataset is supplied separately, subject to reuse terms. |

The Global Organizing Team has clarified that Global Award eligibility requires meaningful use of at least one NASA data source included in the Resources section of the selected challenge, with that source cited in the submission. The challenge-resource list and the exact eligibility interpretation must be checked against the official challenge page and organizer guidance. The current project does **not** claim that GMAT, DONKI or Horizons has been accepted as the qualifying source. Obtain organizer confirmation before relying on that interpretation.

The project archive cannot establish team registration, team composition, submission completion or development chronology. Those items must be verified by the registered participants through the official portal and, where necessary, the Global Organizing Team. See [`docs/AUDIT_REVIEW.md`](docs/AUDIT_REVIEW.md) and [`docs/AI_USAGE_DISCLOSURE.md`](docs/AI_USAGE_DISCLOSURE.md).

## Build and tests

See [audit fixes](docs/AUDIT_FIXES.md) for what changed and remaining verification.

Requirements: Node.js 20+ and Python 3.

```bash
node build.mjs
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/package_release.py
```

Run these commands from `source/` to build v0.4.4. Automated tests use local analytic, synthetic or mocked fixtures. They establish software-contract and deterministic regression behaviour, not independent engineering validation or live-provider success. See [`docs/VALIDATION.md`](docs/VALIDATION.md) for the current run results and open acceptance tests.



## Changes in v0.4.4

- Replaced the launch-page schematic with the supplied interactive rocket model.
- Bundled the rocket renderer, added a Canvas fallback, corrected nose orientation and fitted the exploded view to desktop and narrow displays.
- Removed the Earth, Mars globe, asteroid and telescope control bars.
- Retained the automatic free-port fallback for Linux, macOS and Windows launchers.
- Preserved v0.4.3 Horizons pack compatibility.

All nine JavaScript test files passed for this release. Rocket rendering was also checked in an isolated browser with network access disabled, using both WebGL and Canvas fallback. These checks do not establish live NASA provider availability or independent scientific validation.

To regenerate the embedded original attachments, run `python3 scripts/embed_original_models.py` before `node build.mjs` from `source/`. See [`docs/RELEASE_v0.4.4.md`](docs/RELEASE_v0.4.4.md) for the release notes.
