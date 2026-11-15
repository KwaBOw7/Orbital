# ORBITAL v0.3.3 validation

15 November 2026. 107 automated tests passed, including 75 Node tests and 32 Python tests. Run both suites from source. Tests of provider behavior use synthetic or mocked responses. They exercise software contracts and deterministic outcomes.

| Check | Evidence |
| --- | --- |
| Missing key, placeholder and obsolete offline flag | Linux startup fails before binding a game server or displaying a URL. |
| Rejected, changed or deleted key | Launcher reports unverified status. The browser gate closes and pauses an open session. |
| Cache and provider failure | A fresh process cannot unlock from prior cache. A transient refresh failure retains a snapshot verified in the current process. |
| Successful provider exchange | Linux subprocess serves a local game only after validation of mock provider responses. |
| Browser startup | VM tests show locked and unlocked states, direct-file refusal and relocking. |
| NASA data handling | Schema, timestamps, units, key redaction, empty-result handling, Host/Origin restrictions and atomic cache replacement. |
| Horizons request and pack | Fixture parser and request contract tests check frame, timescale, format, units, checksums and no extrapolation. |
| Interpolation | Analytic constant-acceleration fixture checks cubic Hermite positions and velocities. |
| Mission data-to-outcome | A synthetic near range permits delivery and a synthetic far range causes the same late relay opportunity to miss the deadline. Save restore validates the pending reception time. |
| Regression and plotting | Earth resource arithmetic, Mars progression and supplied 3D scene lifecycle retain automated coverage. |

## Outstanding verification

- Live v0.3.3 startup with a personal NASA key and live Horizons acquisition with a real contact.
- Independent dense ephemeris benchmark and GMAT reference cases. Scientific tolerances should be set for the intended gameplay use before testing.
- Actual Earth observation datasets and spacecraft dynamics, SAR, radio, power, pointing and thermal validation.
- Rendered browser acceptance, Firefox, Safari, native Windows and macOS, mobile, complete assistive technology checks and target hardware profiling. Subprocess tests use Linux. macOS script syntax is checked.
- Project licensing and upstream redistribution permissions. See the asset inventory and compliance register.
