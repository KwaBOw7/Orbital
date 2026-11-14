# ORBITAL v0.3.1 — Space Mission Design Game

An offline educational game with configurable Earth-observation and Mars-rover missions. **This is not a validated spacecraft mission-design tool.** Hardware values, orbit windows, relay schedules, flood targets, descent checkpoints and terrain are authored game assumptions. NASA reports and optional ephemeris packs provide separately labelled context.

## Choose a launch mode

| Mode | Files to run | Requirements |
| --- | --- | --- |
| Standalone offline game | `index.html`, `Play-Linux.sh`, `Play-macOS.command` or `Play-Windows.cmd` | Desktop browser only. These scripts do not start Python or NASA services. |
| Game with optional NASA reports | `Start-NASA-Linux.sh`, `Start-NASA-macOS.command` or `Start-NASA-Windows.cmd` | Python 3 and the extracted ZIP. Save your NASA key in `API.txt` beside `launcher.py` to enable requests. |
| NASA launcher with provider access off | `python3 launcher.py --offline` (Windows: `py -3 launcher.py --offline`) | Python 3; cached reports remain usable. |

The NASA scripts run the local Python service and open the browser. Keep their terminal running; Ctrl+C stops the service. Arguments such as `--port 8766`, `--offline` and `--no-browser` are forwarded. The `Play-*` scripts only open the offline HTML. Double-clicking a shell script depends on OS/file-manager preferences; running it in a terminal is the reliable fallback.

Use a stable folder for local saves. Export saves before moving files, changing browser or clearing data. No source API key or runtime cache is included in the ZIP. This is a local browser app, not a native binary.

## Earth mission

1. Choose **Configure mission** and inspect required parts and optional upgrades. Tier choices change mass, power, storage and cost. Hubble is the requested visual stand-in; it is not the actual radar spacecraft being calculated.
2. Select a 500 km or 700 km game orbit profile and imaging/downlink plan.
3. Review the rocket, budget, fairing-envelope and crew checks. Use **Fast-forward to launch window** when weather blocks the first demonstration window.
4. Launch and operate the mission with Play/Pause, speed controls, Next event and Run to mission end. The 72-hour clock starts at deployment.
5. Return at least 80% of the synthetic target area. Only delivered, unique imagery counts. Review the report and replay or revise the design.

The baseline Balanced, Lean and Eclipse lesson designs return approximately 97.9167%, 99.8611% and 65.2778% under the unchanged default rules. These are regression examples, not real satellite performance predictions.

## Mars mission

1. **Rover:** choose Scout, Surveyor or Pathfinder. The three profiles share the supplied rover mesh with different gameplay properties.
2. **Parts:** install all eight required subsystems; choose four performance tiers. Advanced add-ons include drill, storage, mobility kit and high-gain antenna.
3. **Rocket:** choose Courier, Voyager or Atlas Heavy. These fictional services share the existing rocket model and have different payload/cost limits.
4. **Orbit:** select direct entry, elliptical or polar Mars staging. Insertion mass, price and authored relay windows differ. Choose Practice or Career and pass preflight.
5. **Control:** launch/cruise are summarized; the view starts at Mars entry. Play the illustrative descent or skip to landing. Click **Drive · WASD** to focus the canvas and start real-time control.

| Input | Action |
| --- | --- |
| W / S or up / down | Forward / reverse |
| A / D or left / right | Steer |
| Space | Brake |
| X / C / T | Analyze rock / drill core / relay science |
| Drag or Q / E | Orbit camera |
| Scroll or + / −; R | Zoom; reset camera |

Drive within 6 m of the three cyan markers, analyze both rock sites and send the results during a relay contact. A drill plus extra storage allows bonus cores. Driving uses energy and is constrained by slope and survey bounds. Pause, loss of focus, tab hiding or leaving the view stops movement. Science tasks require Play or Next event to finish. Rock collision, wheel suspension and georeferenced terrain are not implemented.

## Saves and progression

Earth and Mars designs, launched missions and pinned geometry packs are included in local saves and export/import. Mars also saves position, energy, samples and active task. Import validation runs before the existing session is replaced; the UI asks the player to confirm replacement. Earlier Earth saves remain supported. Older Mars saves without a mode load as Practice; no retroactive points are granted.

A local profile enables Career. Every successful career launch counts one attempt. Failure or abandoning a launched mission counts once. Only improvement over a scenario's best base score earns credit. Earth and Mars use distinct scenario keys. At 100 carried Success, the existing Trust rule is `10 + 5 × overflow`, then Success resets to zero. Mars base score: 20 landing + 10 per site + 15 per rock + 20 returned science, maximum 100. Returned cores grant separate science bonus points and do not expand the career base-score cap. Replay cannot farm repeated best scores. Practice never changes career totals.

Shared-screen Earth co-op supports up to four roles with approvals. Mars currently has single-player configuration/control; it does not reuse Earth crew approvals. There is no online multiplayer.

## NASA data and model fidelity

- DONKI reports use the Python service, cache locally and refresh at most every 15 minutes. They are latest-available event reports, not spacecraft telemetry, and do not modify mission physics or scoring.
- Horizons geometry packs are acquired separately with `source/tools/nasa_data.py`, then imported via Data settings. They are pinned per mission and can be exported/rolled back. API.txt is for DONKI, not Horizons.
- Exact pack epochs use supplied samples. Intermediate epochs use application-derived cubic Hermite interpolation of position/velocity; range is recomputed from the vector. No extrapolation is allowed. Dense-reference accuracy testing is pending.
- No real Volta flood imagery, sourced engineering catalogue or certified NASA model is bundled. Earth orbit/eclipses/contacts are scheduled. Mars descent is interpolated and rendered at compressed altitude. All model and data limits are in `docs/DATA_PROVENANCE.md` and `docs/AUDIT_REVIEW.md`.
- Earth and Mars are playable. Lunar rover, asteroid and telescope are the three planned missions.

## Development and verification

From `source/`, use Node 20+ and Python 3:

```
node build.mjs
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/package_release.py
```

No npm installation is required; Three.js and visual assets are bundled. `dist/index.html` disables network access. `dist/online.html` permits same-origin access to the optional local service. Each standalone HTML contains its required rendering assets. `SHA256SUMS.txt` covers the staged release files.

Current validation: **62 Node + 29 Python tests (91 total)**. Linux NASA-service startup was exercised locally in explicit offline mode; macOS script syntax was checked, but native Windows/macOS execution was not. Browser visual checks for this release, Firefox/Safari, mobile, browser import/export acceptance, target-device offline first launch, FPS and memory ceilings remain unverified. Tests establish behavior under the game model, not scientific validity.

## Release and GitHub status

The downloadable ZIP includes the app, launchers, source, tests, documentation and third-party license. The standalone HTML includes offline gameplay only. Source has not been pushed or published to GitHub. `docs/GITHUB_PROGRESS.md` is a local handoff tracker, not a live GitHub board. Review the unresolved model permissions in `docs/ASSET_PROVENANCE.md` before public redistribution. Do not label the supplied meshes as NASA-verified assets.
