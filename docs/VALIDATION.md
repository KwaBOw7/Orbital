# ORBITAL v0.3.1 validation

Status: 14 November 2026. **91 automated tests: 62 Node + 29 Python.** Test success verifies implemented game rules and contracts; it is not independent spacecraft validation.

## Completed

- Earth resource arithmetic, required capabilities, mass/budget, battery reserve/depletion, storage/unique coverage, event stepping, replay and career settlement.
- Mars configuration/preflight, upgrade effects, ordered science objectives, route traversal over the supplied height field, energy/slope/boundary checks, saves and invalid input rejection.
- Mars career attempt counts, once-only settlement, scenario separation, replay anti-farming, failure/abandonment and older save migration.
- Three.js geometry plus stub-renderer tests of actual rover keyboard handlers, pause/blur cleanup, repeated scene mounting and add-on visibility in the scene graph. These are not rendered-browser tests.
- Pack integrity, schema/units/frame checks, rejection of wrong reference planes, exact samples, no extrapolation, and Hermite interpolation against an independent analytic constant-acceleration trajectory. No certified interpolation error bound against dense Horizons ephemerides yet.
- NASA adapter normalization, mock error/cache handling and offline behavior. The prior DONKI live-ingestion evidence is described separately in NASA_DATA.md and was not repeated in this release.
- Real generated Linux NASA launcher starts the local service from a folder containing spaces using `--offline --no-browser --port 0`. HTTP status and page responses are verified. Offline Play script targets index.html; missing-Python error path and macOS shell syntax checked. Windows commands inspected, not natively executed.
- Release ZIP decompression and staged SHA-256 checksums checked after packaging.

## Not completed

| Area | Status |
| --- | --- |
| v0.3.0/v0.3.1 visual browser acceptance | Not verified; preview access was blocked. Older screenshots do not verify these screens. |
| Firefox / Safari | Not verified |
| Native Windows / macOS launcher execution | Not verified |
| Mobile acceptance / keyboard alternatives | Not verified; desktop controls are the target |
| Browser export/import file chooser round trip | Logic tested; full browser acceptance not verified |
| Network-disconnected first launch on target OS/browser | Offline structure tested; target-device acceptance not verified |
| 60 FPS / 500 MB browser process ceiling | No certification; needs hardware-specific profiling |
| Independent orbital / spacecraft telemetry comparison | Not implemented |
| Real flood detection / SAR performance validation | No actual flood dataset or physical SAR model integrated |
| Live Horizons downloader and sourced starter pack | Not established |

## Scope of physics

Earth uses authored recurring events with constant rates between boundaries. Mars uses interpolated descent and simplified rover kinematics, recharge and slope constraints. There is no thermal solver, spacecraft attitude dynamics, radiometric/SAR simulation, link budget, launch performance solver, terrain-relative navigation or physical parachute/descent model. Three.js renders illustrative models, not mechanical-fit validation. Track these as engineering-development work, not passed tests.
