# ORBITAL v0.3.4 — NASA data and geometry integrations

## Operating modes

ORBITAL is offline-first. Opening the standalone `index.html` or using a `Play-*` launcher makes no NASA provider requests. The Python loopback launcher is optional and binds only to `127.0.0.1`.

- If `API.txt` is absent, the launcher starts in **offline** mode.
- If a valid `API.txt` is present, the launcher can start in **online** mode and retrieve NASA DONKI reports.
- Pass `--offline` to force offline mode.
- NASA updates can be turned off from the data panel. The key stays in the Python process and never enters browser JavaScript, HTML, save files or the release archive.

The key is read from a local file containing only the key. Example keys and malformed values are rejected. The app does not require an API key to play Earth or Mars Practice. See `README.md` for platform launchers.

## DONKI reports

When online mode is enabled, the launcher retrieves bounded recent intervals from the following feeds and validates response fields before writing a snapshot atomically:

| Feed | Endpoint | Selected fields |
| --- | --- | --- |
| Geomagnetic storms | `https://api.nasa.gov/DONKI/GST` | Event identifier/start, maximum reported Kp |
| Coronal mass ejections | `https://api.nasa.gov/DONKI/CME` | Event identifier/start, selected analysis speed in km/s |
| Solar flares | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` | Event identifier, start/peak UTC, reported class |

[DONKI documentation](https://api.nasa.gov/) · [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)

The data panel identifies the mode/status, query interval and retrieval timestamp. New Earth and Mars mission records can pin the reviewed event summary and dataset identifier.

**Interpretation limit:** these feeds are reported space-weather events. ORBITAL does not derive local particle flux, radiation dose, a forecast or spacecraft hazard probability from them. DONKI does not alter simulation physics, scores or launch clearance. A missing report is not evidence of safe conditions. Do not use the panel as an operational space-weather advisory.

## Local loopback security boundary

The optional local service exposes a minimal status/context/control API, restricts requests to loopback Host/Origin values and writes local cache data atomically. The NASA key is only sent to the provider from Python. The browser cannot read `API.txt`. A standalone offline HTML session does not connect to the local service.

## JPL Horizons geometry acquisition

JPL Horizons is a separate public data source. Automated use requires a valid identifying User-Agent/contact under the [JPL API policy](https://ssd-api.jpl.nasa.gov/doc/). Supply `--contact` with an actual email address or project contact URL, or set `ORBITAL_JPL_CONTACT`. Do not invent contact details.

Acquire a one-to-seven-day interval:

```bash
python3 tools/nasa_data.py refresh \
  --start 2026-11-14 --days 1 \
  --contact "your-real-contact@example.com" \
  --output earth-mars-pack.json
```

The adapter requests Mars (499) relative to the Earth geocenter (399), with ICRF vectors, km and km/s units, UTC epochs, geometric corrections `NONE`, and an hourly sample cadence for this dataset. The pack records canonical request parameters, endpoint/documentation, provider attribution, raw-response digest, data digest, time coverage, dataset/adapter/interpolation versions and explicit quality flags. It validates the complete sample table and derived range/delay fields before installing/exporting the pack.

Import through **Data & geometry → Import geometry JSON**. Import is local; the game validates schema, supported versions, checksums, frame, origin, time scale, units, sample spacing and coverage. A new Mars run pins the exact imported pack. Existing saves keep their historical snapshot. The game does not extrapolate beyond the pack coverage.

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


## Flood-observation target import (access geometry only; scoring remains synthetic)

`tools/import_unosat_shapefile.py` converts a user-acquired UNOSAT product 3705 shapefile to WGS84 GeoJSON and emits source-component/output checksums and coordinate metadata. Install optional dependencies with `python3 -m pip install pyshp pyproj`, keep `.shp`, `.shx`, `.dbf` and `.prj` sidecars together, and run `python3 tools/import_unosat_shapefile.py /path/to/product-3705.shp --output unosat-3705.geojson`. The shapefile must include a `.prj` file; the tool refuses to guess its projection. Import the resulting GeoJSON through **Data & geometry → Import UNOSAT GeoJSON**; the browser accepts at most 10 MB. A validated profile changes the Earth mission's target centre/radius used by geometry-derived target-access calculations and is pinned to the mission record, save and replay. The engine uses a bounding-circle approximation around the imported polygons. The 720-tile coverage ledger and scoring remain synthetic; this is not polygon-level SAR coverage scoring, image classification or a measured flooded-area estimate. The product is a preliminary 23 October 2023 observation, not a current emergency map. The tool does not download the file or grant redistribution rights; confirm official UNOSAT/HDX terms and attribution before redistributing the product or derived data. See the script's `--help` output for required source metadata.

## GMAT reference workflow (optional external validation)

`tools/gmat-earth-reference.script` is a NASA GMAT input script for a deliberately simple Earth point-mass reference case. Run it in a separately installed NASA GMAT application to generate an OEM file; preserve the GMAT version, force model, initial state, epoch and generated file hash with that reference artifact. `tools/gmat_oem.py inspect FILE.oem` validates the supported Earth-centered UTC OEM subset. `tools/gmat_oem.py compare REFERENCE.oem CANDIDATE.oem` reports numerical differences over overlapping epochs. Neither file is bundled because no GMAT run/output is present in this release.

The GMAT workflow is an optional validation path, not a claim that GMAT output is already used by live mission gameplay or that it has satisfied the Space Apps challenge's qualifying NASA data-source rule. Obtain written/official confirmation from the organizers before relying on GMAT as the qualifying resource.
