# ORBITAL v0.4.2 — NASA data and geometry integrations

## Operating modes

Launch with your platform’s `Play-*` script. It starts the Python game launcher on `127.0.0.1` and checks `API.txt` beside `launcher.py`.

- With a configured key, Play requests fresh NASA DONKI reports on every start, even with a recent cache or a previous session’s Offline setting. Gameplay can start during the download.
- With a missing or malformed key file, Play opens in offline mode and shows setup instructions. A failed download keeps the last validated snapshot.
- Pass `--offline` to disable provider requests for the whole session. The data panel can also stop updates during a normal session. Direct invocations of `launcher.py` without the Play script’s startup option respect the saved offline preference and cache freshness.
- Opening `index.html` directly starts the standalone offline edition. The key stays with the Python process and the keyed NASA endpoints.

The key is read from a local file containing only the key. Example keys and malformed values are rejected. The app does not require an API key to play Earth or Mars Practice. See `README.md` for platform launchers.

## DONKI reports

When online mode is enabled, the launcher retrieves bounded recent intervals from the following feeds and validates response fields before writing a snapshot atomically:

| Feed | Endpoint | Selected fields |
| --- | --- | --- |
| Geomagnetic storms | `https://api.nasa.gov/DONKI/GST` | Event identifier/start, maximum reported Kp |
| Coronal mass ejections | `https://api.nasa.gov/DONKI/CME` | Event identifier/start, selected analysis speed in km/s |
| Solar flares | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` | Event identifier, start/peak UTC, reported class |

[DONKI documentation](https://api.nasa.gov/) · [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)

The data panel identifies the mode/status, query interval and retrieval timestamp. New Earth missions can pin the reviewed DONKI event summary in their mission records.

**Interpretation limit:** these feeds are reported space-weather events. ORBITAL does not derive local particle flux, radiation dose, a forecast or spacecraft hazard probability from them. DONKI does not alter simulation physics, scores or launch clearance. A missing report is not evidence of safe conditions. Do not use the panel as an operational space-weather advisory.

## Local loopback security boundary

The optional local service exposes a minimal status/context/control API, restricts requests to loopback Host/Origin values and writes local cache data atomically. The NASA key is only sent to the provider from Python. The browser cannot read `API.txt`. A standalone offline HTML session does not connect to the local service.

## JPL Horizons geometry acquisition

JPL Horizons is a separate public data source. Automated use requires a valid identifying User-Agent/contact under the [JPL API policy](https://ssd-api.jpl.nasa.gov/doc/). Supply `--contact` with an actual email address or project contact URL, or set `ORBITAL_JPL_CONTACT`. Do not invent contact details.

Run the tools on this page from the extracted `source/` directory. This command acquires a one-to-seven-day interval.

```bash
python3 tools/nasa_data.py refresh \
  --start 2026-11-14 --days 1 \
  --contact "your-real-contact@example.com" \
  --output earth-mars-pack.json
```

The adapter requests Mars (499) relative to the Earth geocenter (399), with ICRF vectors, km and km/s units, UTC epochs, geometric corrections `NONE`, and an hourly sample cadence for this dataset. The pack records canonical request parameters, endpoint/documentation, provider attribution, raw-response digest, data digest, time coverage, dataset/adapter/interpolation versions and explicit quality flags. It validates the complete sample table and derived range/delay fields before installing/exporting the pack.

Import through **Data & geometry → Import geometry JSON**. Import is local; the game validates schema, supported versions, checksums, frame, origin, time scale, units, sample spacing and coverage. A new Mars run pins the imported numerical data and gives it an explicit provider-unverified label. New packs identify v0.4.2 in their manifest. The game and downloader also accept v0.3.4 and v0.3.4.2 packs that pass the existing checks. A matching checksum does not authenticate file authorship. Direct Python retrieval stores the exact unparsed HTTP response bytes, SHA-256, canonical parameters and retrieval time under the local repository's acquisitions directory. The acquisition record is local evidence, not a provider signature. Existing saves keep their historical snapshot. The game does not extrapolate beyond the pack coverage.

The client uses cubic Hermite interpolation between hourly position/velocity states. Ideal one-way delay is derived from geocentric range divided by the speed of light. It is a simplified delay estimate—not a physical relay orbit, surface-to-orbiter line-of-sight solution, retarded-time solution, RF link budget or spacecraft trajectory.

## Dense-cadence comparison tool

A denser Horizons request can quantify the interpolation difference against another cadence from the same provider:

```bash
python3 tools/nasa_data.py benchmark \
  --pack earth-mars-pack.json \
  --reference-step "5 m" \
  --contact "your-real-contact@example.com"
```

The tool reports RMS and maximum position, velocity, range and ideal-delay errors over overlapping interior epochs. This is a same-provider cross-cadence comparison. It is not an independent-provider benchmark or a guarantee of truth. A separate independent ephemeris/reference case and declared tolerances are still required.

## Challenge-resource compliance

A data integration is not automatically a qualifying resource for NASA Space Apps Global Awards. The project team must compare each integrated item against the Resources list for the exact selected challenge, cite the matching resource in the submission and demonstrate meaningful use. The current presence of DONKI or Horizons must not be described as satisfying that challenge-specific requirement unless the organizers' published list/clarification confirms it.


## Historical flood polygon scoring

The converter handles user-supplied shapefile polygons and records component hashes, component names and converter version. The optional acquisition flags record a user declaration, original download URL and actual download time. The browser requires a separate confirmation before installing the GeoJSON and labels it as user-supplied. The declared reference is [UNOSAT Product 3705](https://unosat.org/products/3705). Use the flood polygon layer. Review license terms independently before redistribution.

The browser unions occupied subcells on a 128 × 128 grid using polygon rings and holes, then aggregates them to 32 × 32 scored cells weighted by spherical area. Fine features below the sampling scale may be lost. In each 30-second opportunity the simulator checks visible cell centres against the off-nadir envelope and applies a slew/settle lead at the start of the access window. Each slot budgets acquisition of one cell. The mission pins the grid and tracks fractions captured and delivered, with each cell capped at its imported weighted area. The report distinguishes the imported footprint, geometrically reachable area, simulated imaging and delivered area. The standalone training target still uses synthetic tiles. Saved legacy bounding profiles retain their synthetic scoring.

## GMAT reference workflow (optional external validation)

`tools/gmat-earth-reference.script` is a NASA GMAT input script for a deliberately simple Earth point-mass reference case. Run it in a separately installed NASA GMAT application to generate an OEM file; preserve the GMAT version, force model, initial state, epoch and generated file hash with that reference artifact. `tools/gmat_oem.py inspect FILE.oem` validates the supported Earth-centered UTC OEM subset. `tools/gmat_oem.py compare REFERENCE.oem CANDIDATE.oem` requires matching frames, object identity, initial epochs and a closely matching initial state. The candidate must cover the full reference interval. No GMAT-generated OEM is bundled.

```bash
python3 tools/gmat_oem.py inspect ORBITAL-GMAT-LEO-reference.oem
node tools/export_orbital_oem.cjs OBJECT_ID_FROM_GMAT orbital-candidate.oem
python3 tools/gmat_oem.py compare ORBITAL-GMAT-LEO-reference.oem orbital-candidate.oem \
  --max-position-km 0.001 --max-velocity-km-s 0.000001
```

The proposed tolerances target a 1 m and 1 mm/s two-body implementation comparison. The exporter uses EME2000, the OEM label for the selected GMAT EarthMJ2000Eq axes. The included independent RK4 check covers the same assumptions. Run `python3 tools/check_two_body.py` to reproduce that comparison. It does not run GMAT.

The GMAT workflow is an optional validation path, not a claim that GMAT output is already used by live mission gameplay or that it has satisfied the Space Apps challenge's qualifying NASA data-source rule. Obtain written/official confirmation from the organizers before relying on GMAT as the qualifying resource.
