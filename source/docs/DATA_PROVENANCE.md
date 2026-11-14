# Data provenance and modelling assumptions

Catalogue schema 1 / game version 0.1.0 / 14 November 2026.

The source design brief is the user-supplied `Space_Mission_Design_Game_Report(1).docx`, including its four interface images. Its named dashboard reference was inspected for colours, compact navigation, panels and telemetry layout. No external code, image or font assets are copied into the playable build.

| Data | Status | Units / applicability |
| --- | --- | --- |
| 80% imagery target, 72-hour deadline | Design brief / game rules | Fraction of unique usable target area returned after deployment |
| 70 Wh, 20 Wh reserve, 120 W / 80 W example | Design brief / illustrative | Used directly by the Basic-power eclipse lesson |
| Career scoring and 35-Trust example | Design brief / game rules | Improvement-only credit, attempts at launch |
| Hardware tiers, masses, costs and dimensions | Authored game tuning | kg; credits; m; tiers Basic/Average/Best/Excellent |
| Electrical values | Authored game tuning | Continuous W; battery Wh; solar W only during daylight |
| Imaging / storage / downlink | Authored game tuning | GB; GB/min; 720 equal area tiles; 15 unique target tiles per orbit |
| Carrier allocations and fairings | Authored game tuning | LEO rideshare allocation kg; stowed m; credits |
| Falcon 9 / Ariane 6 / H3 / LVM3 names | Design brief roster | Names only; demo configurations are not operator offerings |
| 500 / 700 km orbit windows | Authored game tuning | Minutes; fixed repeating schedules, not real ephemerides |
| Volta Basin flood scenario | Fictional educational scenario | No live emergency or remote-sensing data |
| Six-hour weather hold | Authored deterministic rule | Seed 774; 22 m/s first window, 14 m/s next window |
| Development time | Authored game tuning | Max hardware lead time + 10-day integration; 50-day limit |

A fairing comparison uses the stowed bus envelope with integrated equipment allowance, not the deployed solar-panel span. Seven required subsystems occupy dedicated bus mounts. Each optional upgrade occupies one dedicated mount on its compatible parent. The renderer uses reusable semantic box IDs and local positions; it is not a full mechanical fit or collision solver.

The SAR operates throughout eclipse in Eclipse scan mode, but the target is visible only during the final 15 minutes. With 70 Wh and 120 W, imaging sheds at eclipse minute 25, so five minutes of the target opportunity are lost. Sunlit target mode only operates the radar during its sunlit pass. Image data from repeat day/night views contributes only to not-yet-collected fractions of a tile. SAR quality is assumed usable independent of clouds; displayed resolution is an illustrative tier attribute, not a propagated optics/pointing model.

Launcher fuel capacity is intentionally not modelled because the carrier is an injection service. Spacecraft propellant is tracked separately: 12 kg launch mass, 2 kg for deployment, 10 kg remaining. Only the LEO route is supported. More ambitious routes need validated performance and a suitable mission model before being marked playable.

NASA/JPL Horizons, Small-Body Database, NASA technical reports and launcher operator documents are proposed sources in the design brief; they have not been imported or validated in this release. Future imports should record source URL/document revision, units, applicable configuration, date, and sourced/derived/tuned status for each field. Do not relabel these game settings as sourced hardware data.
