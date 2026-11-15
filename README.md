# ORBITAL v0.3.4 — Space Mission Design Game

ORBITAL is an offline-first educational space-mission design game. Players configure and operate an illustrative Earth-observation mission and a Mars rover mission while balancing mass, budget, energy, communications and science return.

> **Scientific scope:** ORBITAL contains deterministic educational engineering models, not flight-qualified mission-analysis software. Real source data, derived calculations and authored scenario assumptions are identified separately in the interface and documentation.

## Quick start

### Offline play (no Python, NASA key or internet required)

1. Extract the release ZIP, or open the standalone HTML download.
2. Open `index.html` in a modern desktop browser, or run the platform's `Play-*` launcher.
3. Choose Earth or Mars and start a Practice mission. The game runs locally and does not make network requests in offline mode.

The standalone `ORBITAL-v0.3.4.html` is the playable offline game, not a setup page. The packaged `index.html` is the same offline-first edition.

### Optional NASA DONKI updates

NASA space-weather reports are optional planning context. They do not change the mission physics, scoring, or launch clearance.

1. Install Python 3.
2. Optionally obtain a personal NASA API key from [NASA Open APIs](https://api.nasa.gov/).
3. To enable live reports, place the key on one line in `API.txt` beside `launcher.py`. Keep this file private; it is excluded from release packages.
4. Run `Start-NASA-Linux.sh`, `Start-NASA-macOS.command`, or `Start-NASA-Windows.cmd`. Keep the terminal open while using the local integration.

Without `API.txt`, the loopback launcher starts in offline mode. To force offline mode even when a key is present, pass `--offline` to `launcher.py`. To check the provider once without starting the browser/server, use `python3 launcher.py --refresh-only` (Windows: `py -3 launcher.py --refresh-only`).

| Operating system | Offline launcher | Optional NASA/loopback launcher |
| --- | --- | --- |
| Linux | `./Play-Linux.sh` | `./Start-NASA-Linux.sh` |
| macOS | `./Play-macOS.command` | `./Start-NASA-macOS.command` |
| Windows | `Play-Windows.cmd` | `Start-NASA-Windows.cmd` |

The NASA-enabled edition binds only to `127.0.0.1`. The browser never receives the NASA API key. The API key and cached reports are local user data and are not included in the ZIP.

## JPL Horizons geometry (optional)

Mars missions can use a locally imported, validated JPL Horizons Earth–Mars geometry pack. The standalone game does not download data. Acquire a pack separately using Python 3 and a real contact identifier required by JPL's API policy:

```bash
python3 tools/nasa_data.py refresh \
  --start 2026-11-14 --days 1 \
  --contact "your-real-contact@example.com" \
  --output earth-mars-pack.json
```

`--start` is a UTC date and `--days` is 1–7. The downloader validates the response and writes a portable JSON pack. In the game open **Data & geometry → Import geometry JSON** and select the file. The pack is pinned to new Mars missions; an existing saved mission retains its original dataset. No extrapolation is performed outside the pack's time coverage. Follow [JPL's API policy](https://ssd-api.jpl.nasa.gov/doc/) and [Horizons documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html).

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
5. Return at least 80% of the synthetic target area. Only delivered, unique imagery counts. Review the debrief and replay or revise the design.

The Volta Basin Floodwatch target ledger is synthetic; it is not a flood observation product, flood map, current emergency assessment or measured affected area. Baseline designs are deterministic regression examples, not real satellite performance predictions. The Floodwatch spacecraft is shown using an original procedural SAR schematic. It is not a NASA flight model or mechanically validated assembly. A separate generic optical-observatory illustration is not used as the Floodwatch spacecraft.

A local import path is provided for the dated [UNOSAT product 3705](https://unosat.org/products/3705) (Sentinel-1 observation acquired 23 October 2023). To prepare a locally downloaded shapefile, keep its `.shp`, `.shx`, `.dbf` and `.prj` components together, install the optional converter dependencies, and run:

```bash
python3 -m pip install pyshp pyproj
python3 tools/import_unosat_shapefile.py /path/to/product-3705.shp --output unosat-3705.geojson
```

The converter reads the source projection from `.prj`, reprojects to WGS84 and records source-component/output hashes and metadata. Import the resulting GeoJSON through **Data & geometry → Import UNOSAT GeoJSON** (the browser import is capped at 10 MB). The validated source identity is retained in the mission save/replay and changes the centre and bounding radius used to derive target-access windows. It does **not** rasterize the observed polygons into the mission's 720 scored tiles: science-coverage scoring remains a synthetic training ledger. The product reports a preliminary, historical satellite-detected water extent as of 23 October 2023; it is not a current emergency map or field-validated ground truth. Confirm the official reuse/attribution terms before redistribution; the converter does not grant rights. See `tools/import_unosat_shapefile.py`, the **Data & geometry** panel and `docs/NASA_DATA.md`.

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

The game embeds Three.js locally and does not load a CDN at runtime. The Earth, Moon, Mars, lunar lander, generic optical observatory, launch vehicle, SAR spacecraft, rover and local terrain illustrations are generated by project-authored procedural scene code. The previous supplied/adapted Hubble, rocket, rover and terrain source files, retained reference pages, and legacy generated Earth/Mars image files have been removed from this release. No NASA spacecraft model or measured planetary texture is claimed. These scenes are illustrative, not mechanically accurate assemblies or authoritative geographic products.

Three.js r128 is the only bundled third-party runtime library and is distributed under its MIT license in `assets/vendor/three-LICENSE.txt`; a copy is provided as `THIRD-PARTY-LICENSE.txt`. The project `LICENSE` applies only to original ORBITAL code, documentation and project-authored procedural illustrations; `NOTICE` and `THIRD-PARTY-NOTICES.md` identify the bundled dependency. It does not grant NASA marks, third-party materials or separately licensed dependencies. See [`docs/ASSET_PROVENANCE.md`](docs/ASSET_PROVENANCE.md) for the release inventory and hashes.

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
| UNOSAT flood observation | Optional historical Sentinel-1 product 3705 GeoJSON import changes the Earth target-access bounding-circle input. | External, preliminary and historical. Scored tiles remain synthetic; reuse terms must be confirmed before redistribution. UNOSAT is not a NASA source. |

The Global Organizing Team has clarified that Global Award eligibility requires meaningful use of at least one NASA data source included in the Resources section of the selected challenge, with that source cited in the submission. The challenge-resource list and the exact eligibility interpretation must be checked against the official challenge page and organizer guidance. The current project does **not** claim that GMAT, DONKI or Horizons has been accepted as the qualifying source. Obtain organizer confirmation before relying on that interpretation.

The project archive cannot establish team registration, team composition, submission completion or development chronology. Those items must be verified by the registered participants through the official portal and, where necessary, the Global Organizing Team. See [`docs/AUDIT_REVIEW.md`](docs/AUDIT_REVIEW.md) and [`docs/AI_USAGE_DISCLOSURE.md`](docs/AI_USAGE_DISCLOSURE.md).

## Build and tests

Requirements: Node.js 20+ and Python 3.

```bash
node build.mjs
npm test
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/package_release.py
```

The v0.3.4 release should be built from `source/`. Automated tests use local analytic, synthetic or mocked fixtures. They establish software-contract and deterministic regression behaviour, not independent engineering validation or live-provider success. See [`docs/VALIDATION.md`](docs/VALIDATION.md) for the current run results and open acceptance tests.
