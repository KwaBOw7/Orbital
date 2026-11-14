# Validation for v0.1.0

Date: 14 November 2026.

## Automated checks

24 tests passed using `node --test tests/*.test.cjs`:

- Every required component blocks launch independently when removed.
- Weather holds, missing parents, budget overflow and unapproved crew block attempts.
- Higher tiers increase mass, cost and bus dimensions.
- Launch mass includes 12 kg propellant; spending includes launch service.
- Exact 25-minute reserve threshold and 30 Wh sunlit replay cross-check.
- Eclipse-lesson failure at 65.2778% returned coverage.
- Successful balanced and lean builds with different energy margins.
- Hand-calculated first-orbit power, captured data and downlink trace.
- Storage limits, zero credit without downlink and unique coverage invariants.
- Distinct 700 km operating profile.
- 35-Trust overflow and improvement-only scoring.
- Career failure/report idempotency and practice-mode isolation.
- Frame-independent resource totals and event times across 0.7-minute versus full-run stepping.
- Exact replay of mid-flight command history.
- Immediate reserve and sunlight state changes at stop boundaries.
- Active career save reconstruction without a second attempt.
- Pending replay commands survive save/resume.
- Finished career saves do not re-award points.
- Invalid imports rejected.
- Built HTML has no remote asset references, network APIs or external scripts; CSP denies connections.

## Browser walkthrough

Exercised in the available desktop Chromium browser:

- Mission selection and the three-column spacecraft builder.
- Required SAR removal blocks launch and names the missing capability.
- Weather hold clears using the next viable launch window.
- Eclipse lesson launches, advances an orbit, survives page reload at T+01:30, and reports the expected 65.3% result and T+01:25 reserve event.
- Revised Lean design completes successfully at 99.9% returned coverage.
- Two shared-screen roles can be assigned and approve the design.
- A named local career completes a successful mission; reloading the report preserves one attempt, 100 newly credited points and 10 Trust without a second award.
- Operations schedule controls and exact-state resource diagnostics were inspected.

The browser preview was served for inspection, while the same release artifact is self-contained for `file://` play. Network-disabled first launch on the user's own OS/browser has not been directly exercised. Export/import logic is covered by reconstruction tests; browser file chooser round-trips were not exercised. Narrow viewport layout rules exist, but the release targets desktop screens and was inspected at approximately 1364 × 936.

## Performance

Measured development host: Linux x64, Node v24.22.1, AMD EPYC 9V45 96-Core Processor, 9 exposed logical CPUs, approximately 10 GiB RAM.

A full 72-hour headless simulation averaged about 6–7 milliseconds over 20 runs on this host, including report calculation. This comfortably meets the suggested 2-second headless target here. It does not establish performance on a modest laptop.

The renderer redraws on interaction and resize; it has no continuous simulation animation loop in the builder. Simulation advancement uses model time, independent of rendering. No external libraries are needed. The assembled playable HTML is about 95 KB before compression.

The proposed 60 fps at 1080p and under-500 MB total process targets have **not** been profiled or certified. Browser process overhead, hardware and graphics settings must be recorded on the target laptop before claiming those targets. Windows/macOS native launcher behavior and other browser engines remain untested.

## v0.2.0 validation

28 automated tests passed on 14 November 2026. Added full-mission event-stepping equivalence, dashboard rendering, the complete ordered Mars objective path, deadline gating and finite descent telemetry. Browser walkthrough verified the Mars mission through science delivery, Earth launch-window advancement, the post-launch dashboard and selection of 240 simulated minutes per second. Desktop visual inspection covered the Mars dashboard. Mobile layout rules exist but a mobile browser was not exercised.

The v0.2.0 standalone HTML is approximately 483 KB including generated background images. This supersedes the v0.1.0 size above. The optional NASA anchor is a user-initiated external navigation; no external scripts, runtime assets or network calls are required for gameplay. The browser reference itself did not render its WebGL scene, so visual matching uses the supplied screenshot.

## v0.3.0 validation — 2026-11-14

This section supersedes earlier feature, asset-size and renderer summaries for the current release. The game now bundles Three.js, physical model scene builders, the rover STL and offline Mars terrain in each HTML build.

56 Node tests and 26 Python tests pass. New tests cover each required Mars subsystem, upgrades and preflight failures, immutable launched configuration, movement gating / braking / slopes / survey boundary / energy, ordered science tasks, optional cores, contact schedules, save restoration and malformed state rejection. A numerical route traverses all three sites using the supplied terrain-height function. Scene tests run with Three.js geometry and a stub renderer to exercise actual keyboard handlers, pause and blur cleanup, repeated mounting, finite geometry and optional attachments. These are code-level tests, not visual or GPU-rendering tests.

Browser visual verification for v0.3.0 could not be completed: browser policy blocked access to the preview. No alternate browser surface was used. Check the setup flow, model visibility, keyboard focus, camera controls and save/reload in the user's browser. Prior release screenshots are not verification of the new screens. Mobile layout and device-specific GPU performance remain unverified.

Rover graphics reuse one supplied mesh for all three chassis variants. Add-ons are simplified geometry, and only some installed subsystems have separate visible attachments. Terrain and physics are educational approximations: no wheel suspension, individual wheel animation, rock collisions or flight-dynamics reconstruction. Configured Mars missions are separate practice runs and do not modify Earth career scores.
