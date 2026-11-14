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

## NASA data-pack preview validation — 14 November 2026

50 individual automated checks passed: all original 28 JavaScript regressions (19 engine + 9 save/flight), 9 new JavaScript pack checks, and 13 Python adapter/repository checks. Original offline assertions were retained unchanged. Tests were run directly per JavaScript file in this sandbox to observe the individual assertions; the isolated `node --test` runner here reported file processes only, so it was not used as evidence for individual check counts.

New checks cover SHA-256 against Node's independent implementation, Python/browser pack agreement, a synthetic 3–4–5 vector range and independent ideal-delay reference, nearest-sample clock offsets, no extrapolation, null/NaN/range/unit/frame/version rejection, incomplete/duplicate tables, bounded 429/5xx/timeouts and Retry-After behavior, cancellation/size bounds, atomic manifest retention on write failure, SQLite persistence, rollback, exclusive writer locking, forbidden assets/archives and exact save/replay snapshots. CLI import/export/status were also exercised with the synthetic fixture and an exact JSON round trip.

An isolated Brave/Chromium headless profile loaded `source/dist/index.html` via `file://` with browser networking explicitly disabled. Desktop 1364×936 checks completed the Earth mission at 97.9166666667% coverage / score 100 and Mars practice at 3 waypoints / 2 analyses / successful science relay. The data dialog imported the explicitly synthetic test JSON, displayed its calculated range and delay, and retained it in IndexedDB across page reload. Zero HTTP(S) requests and zero runtime exceptions were recorded in the successful final walkthrough. Screenshots inspected Data settings at desktop and 390×844, plus the narrow Mars dashboard. The narrow page had no horizontal overflow (390px viewport, 375px document content width; 341px dialog). Evidence/logs/screenshots are working artifacts in `~/Folder in Codex/orbital-integration/`, outside the shipped game.

**No live Horizons request was performed.** The required real User-Agent contact is unresolved. No actual sourced geometry starter is bundled; the authored scenario remains playable and missing geometry is explicit. Synthetic fixtures establish workflow and mathematical checks, not physical ephemeris correctness or live ingestion. The live-request → offline restart acceptance check and independent scientific comparison using actual NASA values remain pending. Optional online mode, its fallback behavior, in-game network refresh, a sourced starter, per-mission science adapters and GitHub publication are not accepted as implemented. No online artifact was built; the only browser artifact preserves `connect-src 'none'` and has no fetch/WebSocket/XMLHttpRequest/provider calls.

Native Windows/macOS launchers, Firefox/Safari, full mobile touch use, browser quota exhaustion and percentage-based download/cancel UI were not comprehensively exercised. The preview does not certify 60fps, browser memory usage, radio link physics, terrain or spacecraft telemetry accuracy. See `NASA_DATA.md` for all implemented/deferred details and source references.

### Guided setup verification

The optional contact-email guide was checked in an isolated Brave/Chromium profile with networking disabled at 1364×936 and 390×844. Empty and unsafe inputs were rejected; a valid test address generated the expected Unix and Windows commands. Changing inputs hid the old command. The address was absent from serialized saves and localStorage, and reloading cleared it. The Refresh-on-demand selection opened the guide. No horizontal overflow, external HTTP(S) requests or runtime exceptions were observed. No actual contact address was submitted to JPL and no live download is claimed. The 18 relevant save/pack regressions were rerun after the UI change.

## Key-file Python launcher — current acceptance evidence

The earlier email setup has been removed. **65 automated checks passed** after the launcher change: 19 original engine, 9 original save/flight, 11 pack/build checks and 26 Python adapter/repository/launcher tests. The standalone offline assertion was retained unchanged; a separate test checks `connect-src 'self'` and fixed local endpoints in the online artifact. Other tests cover key/BOM validation, unknown values, sequential fetches, credential error redaction, rate limits, atomic failure retention, offline restart, remembered mode, blocked key/source/traversal routes, Host/Origin enforcement and no provider calls with missing key or forced Offline.

A real three-feed NASA request succeeded at **2026-11-14T14:11:11Z**, querying 2026-11-07 through 2026-11-14 UTC. Normalized/validated counts were 7 solar flares, 0 geomagnetic storms and 20 CMEs. This is live ingestion evidence, unlike the retained synthetic Horizons fixtures. The gateway solar-flare route returned 404; the current official OpenAPI schema documented the canonical public `/DONKI-API/get/FLR` operation, which then succeeded. GST/CME succeeded using the private key. No successful Horizons download is claimed.

An isolated Brave/Chromium browser loaded the separate online artifact from the local launcher running in `--offline` mode with a copied real report cache. It displayed the actual 7-flare/20-CME cache, retained it across reload and completed Earth at 97.9166666667% coverage. The email field was absent. UI Offline control worked. Requests for API.txt, source and traversal paths were rejected; a cross-origin mode mutation was rejected. The key was absent from HTML, JSON status and serialized saves. Fast-forward left acquisition time unchanged. Desktop 1364×936 and 390×844 layouts were visually inspected without horizontal overflow. The browser made no provider/external requests and recorded no runtime exceptions. Screenshots and test logs are in `~/Folder in Codex/orbital-integration/` outside the package.

The launcher was tested in offline-cache mode after live acquisition; a prolonged 15-minute wall-clock soak and native Windows/macOS launcher execution have not been performed. The scheduler and its interval are covered by code/tests, independently of simulation speed. Upstream outages retain data; this does not validate real-time latency, operational space-weather safety, emergency flood assessment or spacecraft telemetry accuracy. Public GitHub release and other mission adapters remain pending.
