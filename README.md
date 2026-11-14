# ORBITAL — mission-design game and NASA data launcher

ORBITAL 0.2.0 provides a playable Earth-observation mission and simplified Mars practice. The optional Python launcher now reads **API.txt** beside the app and retrieves NASA DONKI space-weather reports. The in-app contact-email form has been removed.

## Start with NASA data

1. Extract the complete ZIP. Install Python 3 if it is not already available.
2. Get your own NASA API key from https://api.nasa.gov/.
3. Create **API.txt** beside `launcher.py` and the Play scripts. Paste only the key on one line. You can rename `API.txt.example` to `API.txt` and replace its placeholder.
4. Run `Play-Linux.sh`, `Play-macOS.command` or `Play-Windows.cmd`. Alternatively run `python3 launcher.py` (Windows: `py -3 launcher.py`). Keep that process running while playing; Ctrl+C stops it.

The launcher opens the game at `http://127.0.0.1:8765`. On a fresh setup, placing API.txt beside the app opts in to NASA updates. Without a key it starts offline. A previous Offline choice is remembered; use **Enable NASA updates** to re-enable it. The reports panel also provides manual Refresh and Offline controls.

The private key stays in Python and is never sent to the browser, included in saves or shipped in the release ZIP. Do not share API.txt. There is no email field or ORBITAL account. NASA's own key-registration process is separate.

## What the data does

The launcher retrieves the latest available solar flares, geomagnetic storms and coronal mass ejections for a bounded seven-day UTC query. It validates and caches the results, checks every 15 real-world minutes, and displays event times and the last successful retrieval. A live request was successfully verified on 14 November 2026. Provider publication latency varies: these are research reports, **not real-time spacecraft telemetry** or an operational safety forecast.

Reports add mission context only. Wind, hardware tiers, engineering values, flood coverage, Mars descent/relay windows, objectives and score remain game settings. Accelerating or replaying a mission never increases provider polling or changes its physics. No reports in a date range does not establish safe conditions.

Cached reports survive a launcher restart and connection failure. Offline stops further updates; an already-running network operation may take up to its timeout to stop. Failed or partial refreshes preserve the previous complete report cache. Default storage: `~/.local/share/orbital/nasa`. Credentials are not cached there. API key errors are shown without logging credential-bearing URLs.

## Fully offline play

Open **index.html** directly to play without Python, a server, credentials or network requests. It remains self-contained with `connect-src 'none'`. The launcher uses a separate `online.html` artifact with same-origin connections only.

You can also use `python3 launcher.py --offline` to display stored reports with no NASA requests. Local saves for `file://` and the launcher address are different browser origins: use **Export save** / **Import save** when switching between them. Export saves before clearing browser storage or moving the app.

## First Earth flight

1. Choose Configure mission. Balanced is the default starter.
2. Inspect the eight required subsystems and optional upgrades. Tiers trade mass, cost, power and capacity. Orbit choices use authored schedules, not propagated ephemerides.
3. Review preflight. The initial demonstration crosswind blocks launch; **Fast-forward to launch window** advances six simulated hours instantly.
4. Launch, then use Play, 1/10/60/240 simulated minutes per second, Next event or Run to mission end.
5. Return at least 80% unique usable target coverage within 72 simulated hours. Undelivered imagery earns no science credit. Inspect the report, revise or replay.

Balanced returns approximately 97.9167%; Lean approximately 99.8611%; Eclipse lesson approximately 65.2778%, under the default 500 km setup. The last demonstrates a 70 Wh battery reaching the 20 Wh reserve after 25 minutes at 120 W. These are illustrative game values.

Shared-screen co-op supports four roles with launch approvals. Guest practice does not alter career totals. Local profiles track attempts, failure rate, improvement-only success points and Trust. Existing v1 Earth saves remain compatible. The deterministic engine remains independent of provider access.

## Mars practice and local geometry packs

Mars practice includes illustrative entry/descent, landing, three waypoints, two rock analyses and science relay. It is session-only, does not award career credit and is not a configurable spacecraft mission or validated reconstruction. Scenery is generated artwork, not NASA imagery. Lunar, asteroid and telescope missions remain planned.

Data settings still supports optional Horizons geometry-pack import/export and rollback. A mission pins the selected pack. Calculated Earth–Mars range and ideal geometric delay are educational context; they do not replace the authored relay rules. The retained Horizons batch tool uses a different service with its own contact requirements; **API.txt is used for DONKI and does not authenticate Horizons**. No sourced Horizons starter or live Horizons ingestion has been verified. There is no contact-email setup form in the app.

## Source and development

The complete project is in `source/` in the release. From that folder:

```sh
node build.mjs
node tests/engine.test.cjs
node tests/save.test.cjs
node tests/data-packs.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 scripts/package_release.py
```

Node 20+ is used for building/testing. Python 3 standard library supplies the launcher/updaters and packaging; no pip packages are required. Development launch: `python3 launcher.py --key-file ../API.txt` (or place a private key file in the source folder). Use `--port 8766` if the default port is occupied, `--no-browser` for manual opening, or `--cache-dir PATH` for isolated caches. `--refresh-only` performs one cache update and prints a safe status summary.

The build emits `dist/index.html` (fully offline) and `dist/online.html` (local launcher UI). Packaging emits `ORBITAL-v0.2.0-data-preview.zip` and its offline standalone HTML. No API.txt, runtime reports, SQLite caches or Python bytecode are included.

See `docs/NASA_DATA.md` for endpoints, source policy, limits and architecture; `docs/DATA_PROVENANCE.md` for scientific assumptions; `docs/VALIDATION.md` for tested and untested behavior. No GitHub repository is configured and nothing has been published. Native Windows/macOS execution, other browser engines, full mobile use and performance targets are not certified.
