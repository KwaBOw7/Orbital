# ORBITAL — Space Mission Design Game

Version 0.1.0 is a playable offline Earth-observation MVP based on the supplied Space Mission Design Game report. Assemble a satellite, select a carrier, clear preflight, operate a 72-hour radar mapping mission and revise the design from the results.

## Play

Open `index.html` from the release folder in your desktop browser. You can also use `Play-Linux.sh`, `Play-Windows.cmd` or `Play-macOS.command`. No server, internet connection, account, package installation or Python is needed. Keep the file in a stable folder so the browser can retain its local save. Use **Export save** before moving files, switching browsers or clearing browser data.

This release runs as a local browser application, not a native desktop executable. An existing modern desktop browser is the only player runtime dependency. Chrome/Chromium was exercised during development. Firefox, Safari, Windows and macOS launchers have not been exercised on their native platforms. Local-file browser storage behavior can differ; save export/import is the portable fallback.

## First flight

1. Choose **Configure mission**. Start with **Balanced** (default).
2. Inspect components. **Required** contains eight subsystems; **Upgrades** adds a battery, antenna or compression processor. Select a part, choose its tier and inspect cost, mass and other values. Drag the model to rotate; use the view controls to explode, change zoom or toggle wireframe.
3. Choose a 500 km or 700 km operating orbit. Select the planned imaging schedule. Day and night opportunities cover the same area: repeat imaging never creates extra unique coverage.
4. Review preflight. The fixed demonstration seed starts with a 22 m/s crosswind, above the 18 m/s game limit. Choose **Next window** for a six-hour delay. The science clock starts after deployment, so that delay does not shorten the 72-hour science period.
5. Launch. Time begins paused. Use **Resume**, **+ 1 orbit**, or **Complete mission**. Change imaging and downlink policy during flight if needed. Spacebar toggles pause when keyboard focus is outside a control.
6. Review the report. Blue coverage means unique usable imagery delivered to Earth. Data still onboard earns no science credit. Choose **Revise design** or **Replay same conditions**.

## Three starter designs

| Starter | Plan | Battery | Expected returned coverage | Result |
| --- | --- | --- | --- | --- |
| Balanced | Eclipse scan | 120 Wh | 97.9167% | Pass |
| Lean | Sunlit target passes | 70 Wh | 99.8611% | Pass |
| Eclipse lesson | Eclipse scan | 70 Wh | 65.2778% | Objective missed |

These results use the default 500 km profile, continuous scheduled downlink, Basic radar, Average computer and Average communications. All include successful launch and deployment. The last pass may leave unsent data at the deadline.

The lesson starts each eclipse with 70 Wh, draws 120 W while scanning and hits the 20 Wh reserve after 25 minutes. Imaging is shed at that instant; the 80 W essential load continues, so energy exits the 30-minute eclipse at 13.3333 Wh. With sunlit imaging, the eclipse only draws 80 W and exits at 30 Wh.

## Local profiles and co-op

Guest mode plays practice missions. A local commander name enables career mode. One career is stored per browser/file location; renaming preserves it. Export separate saves to manage multiple careers. Shared-screen co-op assigns up to four named roles. Each assigned role must approve the launch; design, plan, orbit, rocket and window changes clear approvals. This is local shared-screen cooperation, not online multiplayer.

Autosave preserves the design, profile, paused mission and command history. Reopening the page reconstructs the active mission deterministically, without counting another launch. An interrupted replay retains its pending commands. Imported saves are validated before use and replace the session only after the player confirms.

Career awards 20 launch points, 20 deployment points, and up to 60 points proportional to the 80% coverage objective. Only improvement over the scenario's previous best is credited. At 100 carried Success, Trust increases by `10 + 5 × overflow`, then Success resets to zero. `80 + 25` gives `35 Trust`. Every career launch is an attempt; an objective miss or early termination is one failure. Blocked checks and weather holds count zero attempts. Practice never changes career counters.

## Engineering model and limits

All numeric catalogue values, carrier allocations, prices, weather, orbital schedules and science parameters are explicitly **game settings**. These are not validated SpaceX, Arianespace, JAXA, ISRO or NASA performance data. No real flood observations are included. See `docs/DATA_PROVENANCE.md`.

The simulator uses constant rates between event boundaries. It handles sunlight/eclipse transitions, target passes, one-minute target tiles, contacts, battery capacity/reserve/depletion boundaries and player commands. Energy is W × elapsed hours, storage is GB, and communication rate is GB/min. Essential loads continue after imaging is shed. It caps energy, storage, collected area and delivered area. It does not propagate orbital mechanics, simulate ascent fuel, thermal dynamics, attitude dynamics, radio link budgets, weather probabilities or propulsion trajectories.

The spacecraft is a draggable box model drawn with a small Canvas painter renderer. Earth, orbital tracks, target ledger and rockets are schematic. Standard system fonts are used; Inter is preferred if installed. This edition contains no remote fonts, textures, scripts, API calls or dependencies. Content Security Policy disables network connections.

Lunar rover, Mars rover, asteroid and telescope missions are shown as explicitly unavailable planned scenarios. The native desktop distribution and validated NASA/JPL/operator data integrations remain future work.

## Source and development

The release includes the complete editable project in `source/`.

```
node build.mjs
node --test tests/*.test.cjs
python3 scripts/package_release.py
```

Run these from the source directory. Node 20 or later is needed for development and tests; Python 3 is only used to assemble release archives. There are no package dependencies and no install step. `dist/index.html` is a self-contained game. Double-click it to play after building.

- `data/catalog.json`: versioned component catalogue, scenario, orbit windows and carrier service profiles.
- `src/engine.js`: deterministic DOM-free simulation, resource accounting, preflight and career rules.
- `src/renderer.js`: Canvas box renderer, independent of simulation time.
- `src/app.js`: stage navigation, local saves, crew, operations and report interface.
- `src/style.css` / `src/shell.html`: interface styling and offline document shell.
- `tests/`: 24 automated tests covering engineering calculations, scoring, replay and persistence.
- `docs/`: model assumptions, acceptance evidence, extension guide and release status.

See `docs/VALIDATION.md` for measured and unmeasured performance targets. The suggested 60 fps / 500 MB browser targets still need profiling on the intended modest laptop. The measured headless replay benchmark is from the development host, not the user's laptop.

## GitHub release status

Source and downloadable release files are prepared. They have **not** been pushed to GitHub, and no public repository or Release has been created. Publishing needs an authorized GitHub connection and a repository destination. See `docs/RELEASE.md` for the intended release contents. Choose the repository visibility and licensing before a public release; this package does not choose a distribution license on the team's behalf.
