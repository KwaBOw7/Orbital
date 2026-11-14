# ORBITAL v0.3.1 NASA data integration

Updated 14 November 2026. This supersedes the earlier UI email setup and CLI-only acquisition plan. The standalone game and its offline guarantees are preserved.

## Supported flow and modes

A player saves their NASA gateway key as **API.txt** beside `launcher.py`. Run `Start-NASA-Linux.sh`, `Start-NASA-macOS.command`, `Start-NASA-Windows.cmd` or `python3 launcher.py` to open the NASA reports edition. The Play scripts open the standalone game. There is no email entry form, browser key field, account, provider URL proxy or public server. API.txt presence opts a fresh installation into online report updates. Missing key or `--offline` keeps provider access off. A previously selected Offline setting is retained in the local cache directory; Enable NASA updates switches it on again.

The launcher binds only to `127.0.0.1` and serves the separate `online.html`. All upstream access is in Python. A fixed status route and bounded mode-control route are the only API endpoints. Host validation rejects DNS rebinding; mutations require the exact local Origin and JSON body. API.txt, source files and arbitrary paths are not served. HTML permits only same-origin connections. The standalone `index.html` retains `connect-src 'none'`, contains no network primitives, and needs neither Python nor connectivity.

Reports refresh at most every 15 minutes automatically, with reuse of a fresh cache after restart. Manual refresh has a one-minute minimum interval. Browser status polling is local-only and independent of simulation speed. Offline stops new provider operations; an in-flight request can take up to its timeout to finish/abort. A complete validated snapshot is staged and atomically replaces the last good cache. Partial, malformed, auth, timeout, quota, write or provider failures retain the previous snapshot. Cached data is shown as offline/stale with event and retrieval times.

## Current sources (verified 14 November 2026)

| Feed | Endpoint | Access / fields used |
| --- | --- | --- |
| Solar flares | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` | Current documented public endpoint; no key forwarded. ID, begin/peak UTC and flare class. |
| Geomagnetic storms | `https://api.nasa.gov/DONKI/GST` | NASA key from API.txt. ID, start UTC and reported maximum Kp. |
| Coronal mass ejections | `https://api.nasa.gov/DONKI/CME` | NASA key from API.txt. ID, start UTC and best-available analysed speed in km/s. |

NASA's gateway FLR route returned HTTP 404 because it forwarded to a trailing-slash upstream path. The current CCMC OpenAPI reference documents the canonical `/get/FLR` operation, which was successfully used directly. GST/CME gateway requests succeeded with the provided key. The key is sent only to the NASA gateway, not to the public flare operation.

Live verification at **2026-11-14T14:11:11Z**, for 2026-11-07 through 2026-11-14 UTC, yielded **7 flare records, 0 storm records and 20 CME records**. All three lists were normalized, validated and persisted. This establishes live DONKI ingestion, not real-time spacecraft telemetry or quantitative mission physics. Zero storm reports does not establish safe conditions. NASA describes DONKI as near-real-time research analyses, with variable reporting/publication delay and no guaranteed fixed latency.

Official references:

- Catalog/gateway endpoints: https://api.nasa.gov/
- Gateway rate limits: https://api.nasa.gov/assets/html/authentication.html
- Current API reference: https://ccmc.gsfc.nasa.gov/DONKI/api/
- Current OpenAPI schema: https://ccmc.gsfc.nasa.gov/DONKI/api/openapi/
- Scientific scope, research quality, migration and rules: https://ccmc.gsfc.nasa.gov/tools/DONKI/

Default gateway limits are 1,000 requests per hour per key; DEMO_KEY has lower limits. Each update uses three sequential operations, with at most three attempts per operation. Each response is bounded to 1 MB, 2,000 records and a 20-second socket timeout. Retry-After is honored for short waits; longer waits stop that update until a later cycle. Other transient retries use bounded exponential backoff/jitter. Auth errors do not loop. Raw exception URLs are never returned or logged.

## Cache, normalization and privacy

`~/.local/share/orbital/nasa/reports.json` stores schema-versioned normalized reports, provider, adapter version, actual endpoints, canonical start/end dates, acquisition UTC and selected official fields. Raw source units are already the display units: km/s, Kp and flare class. Missing numerical values stay null/unknown. Invalid timestamps, duplicate IDs, nonfinite values, unreasonable ranges or excessive lists reject the snapshot. No NASA imagery, logo or third-party media is downloaded or redistributed.

`mode.json` stores only the selected mode. The key is read from API.txt on each update, not stored in reports, browser storage, HTML, saves or exported geometry packs. The released ZIP contains only `API.txt.example`; the real file and any runtime cache are excluded. Never share the private file. The local user keeps control of it.

The latest-data panel shows real-world UTC, query interval, event times and successful retrieval time. It is separate from the accelerated simulation clock and any imported ephemeris clock. These reports are educational mission context only. They do not change active or future mission hardware, objective, simulated weather, relay timing, physics or score.

## Retained geometry-pack work

The offline geometry schema, import/export, IndexedDB rollback and mission snapshots remain intact. A selected pack is pinned at launch; Earth save/replay/report exports include it. Old v1 saves restore without a pack. Configured Mars missions also persist/export their pinned snapshot, configuration and surface state.

The optional `tools/nasa_data.py` Horizons adapter still supports bounded geometric Mars-relative-to-Earth vectors in ICRF, modern UTC epochs and km/km/s. It requires the separately documented JPL contact User-Agent, sequential cached requests and API-version checking. It is not invoked by the key-file launcher, and its contact form has been removed from the UI. API.txt does not authenticate Horizons. No sourced Horizons starter or successful live Horizons acquisition is claimed.

Geometry packs use an exact ASCII JSON payload plus manifest/checksum, reject executable assets and ZIP imports, and are limited to 512 KB. The local CLI repository retains SQLite indexing, staged activation and prior versions; browser storage commits active/previous packs together. Integrity hashes do not prove official authorship. Range is derived from vector norm; ideal geometric delay divides range by 299792.458 km/s. Exact sample epochs are retained. Intermediate epochs use application-derived cubic Hermite interpolation of position and velocity; range and ideal delay are recomputed. Bracketing epochs are displayed. No extrapolation occurs outside coverage, and interpolation error against dense reference data is not yet certified. Relay/processing/motion delays are excluded.

## Remaining scope

Earth CMR/GIBS quantitative flood products, lunar/Mars PDS terrain, asteroid SBDB targets, exoplanet catalogs, validated engineering values, spacecraft telemetry and independently validated mission mechanics remain deferred. Real data availability does not mark planned missions playable. The existing generated scenes and descent checkpoints remain illustrative. GitHub publication is pending; no repository or issue IDs were invented.

