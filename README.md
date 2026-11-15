# ORBITAL v0.3.3 — Space Mission Design Game

ORBITAL simulates Earth observation and Mars rover missions. Players balance hardware, budget, power, communications and science goals.

## Required startup

Earlier releases could start without official data. **v0.3.3 requires a personal NASA API key and a successful NASA DONKI download every time the launcher starts.** A missing, malformed, rejected or example key blocks startup. An unavailable or invalid provider response also blocks startup. Opening the HTML file shows these setup instructions.

1. Get a personal key at [NASA Open APIs](https://api.nasa.gov/).
2. Extract the ZIP. Create `API.txt` beside `launcher.py` and paste just the key on one line. Keep the file private.
3. Connect to the internet and run the launcher for your operating system. Keep its terminal open.

| Operating system | Launcher | Alternative |
| --- | --- | --- |
| Fedora and other Linux distributions | `./Play-Linux.sh` | `python3 launcher.py` |
| macOS | `./Play-macOS.command` | `python3 launcher.py` |
| Windows | `Play-Windows.cmd` | `py -3 launcher.py` |

Requirements are Python 3, a desktop browser and the extracted package. `Start-NASA-*` uses the same startup check. For a key and data check with no browser, use `python3 launcher.py --refresh-only`. On Windows use `py -3 launcher.py --refresh-only`. If NASA rejects the request, inspect the terminal message and check the key. If NASA is unavailable or rate limited, retry when service is available.

## Mars geometry setup

JPL Horizons uses a separate public interface. Its automated requests require an application-specific user agent with valid contact information. Start the launcher with your real email or a project contact URL, or set `ORBITAL_JPL_CONTACT`. The NASA key still goes in `API.txt`. [JPL API policy](https://ssd-api.jpl.nasa.gov/doc/)

```bash
./Play-Linux.sh --jpl-contact "your-real-contact@example.com"
```

Open **Data settings → Download Horizons geometry**. Once verified, the pack becomes available for new Mars launches. Settings also shows the source coverage and lets you export the pack. The raw NASA API key stays in the Python launcher. The JPL request carries the configured contact in its user agent.

## Earth mission

1. Choose **Configure mission** and inspect required parts and optional upgrades. Tier choices change mass, power, storage and cost. Hubble is the requested visual stand-in; it is not the actual radar spacecraft being calculated.
2. Select a 500 km or 700 km game orbit profile and imaging/downlink plan.
3. Review the rocket, budget, fairing-envelope and crew checks. Use **Fast-forward to launch window** when weather blocks the first demonstration window.
4. Review the current DONKI report, then launch and operate the mission with Play/Pause, speed controls, Next event and Run to mission end. The 72-hour clock starts at deployment.
5. Return at least 80% of the synthetic target area. Only delivered, unique imagery counts. Review the report and replay or revise the design.

The baseline Balanced, Lean and Eclipse lesson designs return approximately 97.9167%, 99.8611% and 65.2778% under the unchanged default rules. These are regression examples, not real satellite performance predictions.

## Mars mission

1. **Rover:** choose Scout, Surveyor or Pathfinder. The three profiles share the supplied rover mesh with different gameplay properties.
2. **Parts:** install all eight required subsystems; choose four performance tiers. Advanced add-ons include drill, storage, mobility kit and high-gain antenna.
3. **Rocket:** choose Courier, Voyager or Atlas Heavy. These fictional services share the existing rocket model and have different payload/cost limits.
4. **Orbit:** select direct entry, elliptical or polar Mars staging. Insertion mass, price and authored relay windows differ. Choose Practice or Career, verify Horizons geometry and review the NASA DONKI reports.
5. **Control:** launch/cruise are summarized; the view starts at Mars entry. Play the illustrative descent or skip to landing. Click **Drive · WASD** to focus the canvas and start real-time control.

| Input | Action |
| --- | --- |
| W / S or up / down | Forward / reverse |
| A / D or left / right | Steer |
| Space | Brake |
| X / C / T | Analyze rock / drill core / relay science |
| Drag or Q / E | Orbit camera |
| Scroll or + / −; R | Zoom; reset camera |

Drive within 6 m of the three cyan markers, analyze both rock sites and send the results during a simulated relay contact. Leave time for the calculated signal delay before the Earth delivery deadline. A drill plus extra storage allows bonus cores. Driving uses energy and is constrained by slope and survey bounds. Pause, loss of focus, tab hiding or leaving the view stops movement. Science tasks require Play or Next event to finish. Rock collision, wheel suspension and georeferenced terrain are not implemented.

## Supplied 3D scenes

The Earth lobby globe, Hubble Earth backdrop and mission-card illustrations now use your supplied models. Drag to rotate and scroll to zoom; **Expand** opens a larger model view with its controls.

| View | Model used |
| --- | --- |
| Earth mission hero / globe inspector | 3D Earth.html, including procedural surface and clouds |
| Earth assembly and flight / telescope card | Hubble Space Telescope; textured Earth backdrop |
| Earth and Mars rocket selection | Rocket 3D Model |
| Mars mission card / planetary inspector | Mars 3D Surface.html with relief and landmark controls |
| Mars assembly, descent and driving | mars_rover.stl plus Mars Mountain View terrain |
| Lunar mission card / engine preview | 3D Lunar Lander.html |
| Explore Moon button | 3D Moon.html |

Lunar models are viewable, but the lunar mission remains planned. No asteroid model was supplied; its card uses a text-only placeholder. Existing simulation rules are unchanged. These supplied procedural visuals are not newly validated scientific datasets.

All runtime scene code and Three.js are embedded locally; no CDN or image download is required. Offscreen inline scenes release their renderers; opening them again reconstructs the view. Lower-density meshes and a Canvas fallback limit rendering cost. The former static Earth/Mars WebP backgrounds are no longer embedded. The source archive retains their legacy files, unused by the build. Canvas fallback has simpler shading than WebGL.

## Saves and progression

Saves contain the mission design, simulation model version, DONKI dataset ID and reviewed feed summary. Mars saves include the pinned Horizons pack and pending delivery time. Mars also saves position, energy, samples and active task. Import validation runs before the existing session is replaced; the UI asks the player to confirm replacement. Earlier Earth saves remain supported. Older Mars saves without a mode load as Practice; no retroactive points are granted.

A local profile enables Career. Every successful career launch counts one attempt. Failure or abandoning a launched mission counts once. Only improvement over a scenario's best base score earns credit. Earth and Mars use distinct scenario keys. At 100 carried Success, the existing Trust rule is `10 + 5 × overflow`, then Success resets to zero. Mars base score: 20 landing + 10 per site + 15 per rock + 20 returned science, maximum 100. Returned cores grant separate science bonus points and do not expand the career base-score cap. Replay cannot farm repeated best scores. Practice never changes career totals.

Shared-screen Earth co-op supports up to four roles with approvals. Mars currently has single-player configuration/control; it does not reuse Earth crew approvals. There is no online multiplayer.

## Data and model fidelity

The launcher authenticates with NASA and checks official solar flare, geomagnetic storm and coronal mass ejection reports before opening the game. The preflight review lets you hold the launch or acknowledge the report. ORBITAL records the decision with the mission. Space weather currently informs that decision only.

Mars uses JPL state vectors with cubic Hermite interpolation. The game computes an ideal one-way delay from the distance at upload completion. An upload must fit within the simulated local relay window, and reception must meet the mission deadline to earn delivery credit. Relay pass times remain educational assumptions.

Space weather and geometry are fetched from their official providers. The release contains no runtime observations or starter ephemeris. The source archive includes synthetic fixtures for automated tests. Hardware values, Earth observation targets and scheduled passes, Mars descent checkpoints and rover parameters are educational settings. Hubble is marked as an illustrative stand-in.

Once a session is verified, a temporary upstream outage can leave the launcher using reports it acquired in that session. The UI marks them stale. If the launcher stops or the key is removed, changed or rejected, the browser locks at its next verification check and pauses the simulation. Restart requires a fresh successful NASA request.

## Space Apps challenge self-assessment

| Requirement | Evidence | Status |
| --- | --- | --- |
| Interactive design and mission operation | Earth and Mars build, launch and operations flows | Implemented |
| Engineering trade-offs | Resource and subsystem choices affect coverage, endurance and science delivery | Implemented with educational models |
| Solo or team play | Earth supports shared-screen roles up to four. Mars is single player. | Partial |
| Use a NASA resource listed for the challenge | DONKI and Horizons participate in the workflow. The flight manual maps the four segments from NASA’s [Design and Develop Science Missions](https://ntrs.nasa.gov/citations/20250002492) to player actions. Qualification against the challenge resource list is pending. | Unverified |
| Source, licensing and AI disclosure | Provider links, asset hashes and AI development disclosure are in the release. Original asset rights and project license are open. | Partial |
| Eligibility and submission | Organizers and the registered team verify eligibility and submission. | Open |

[Official Space Mission Design Game brief](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) · [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/)

## Build and test

From `source/` with Node 20+ and Python 3

```bash
node build.mjs
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/package_release.py
```

The release passed 107 automated tests (75 Node and 32 Python). The ZIP contains the launchers, game, source and release documentation. The HTML download is the setup page. See [NASA data](docs/NASA_DATA.md) for requests and units, [validation](docs/VALIDATION.md) for test limits, [asset provenance](docs/ASSET_PROVENANCE.md) for supplied model origins and the [fix register](docs/AUDIT_REVIEW.md) for open acceptance criteria.
