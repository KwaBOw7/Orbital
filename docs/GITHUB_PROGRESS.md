# ORBITAL v0.2.0 progress

- [x] Replace waiting with simulation speed and event skipping.
- [x] Add post-launch dashboard based on the supplied visual reference.
- [x] Add Mars descent and surface practice.
- [x] Preserve Earth mission determinism and save compatibility.
- [x] Add regression checks for event stepping and Mars objectives.
- [x] Add interactive Hubble and rocket models with offline support.
- [ ] Integrate validated per-mission NASA data.
- [ ] Add configurable Mars spacecraft and persistent Mars mission saves.
- [ ] Connect a repository and publish the release on GitHub.

The checked items are local implementation status, not GitHub issue state.

## v0.2.3 — currency, navigation and Mars scene (2026-11-14)

- [x] Replace currency labels with dollar prefixes in budgets, component prices, launch costs, funding and preflight checks. Values remain illustrative game prices.
- [x] Upper-left Back button across mission screens. Returning from operations pauses the active flight and retains progress; active designs remain locked.
- [x] Adapt the supplied Mars Mountain View terrain and embed the supplied rover STL in both offline and optional-online builds.
- [x] Slow real-time Mars playback, accelerated rates, pause and skip-to-landing; draggable/keyboard camera with zoom and reset.
- [x] Dispose render loops, event listeners and graphics resources when leaving the scene. Reduced-detail Canvas renderer for browsers without WebGL.
- [x] Validation: 41 Node tests and 26 Python tests; browser checks of currency, Back, playback/pause, camera controls and touchdown.
- [ ] Publish this release to the project's GitHub repository (no repository connection configured here).

## v0.3.0 — configure and drive Mars missions (2026-11-14)

- [x] Rover type → required / advanced parts → rocket → arrival orbit → mission control.
- [x] Three chassis profiles, four component tiers and four optional advanced attachments.
- [x] Budget, payload and landing-mass checks; configuration changes affect mission performance.
- [x] Keyboard surface driving with focus/pause handling, battery use, slope and boundary checks, ordered sites, science tasks and relay contacts.
- [x] Persist draft configuration and launched state with validation and pinned NASA data context.
- [x] Reuse rover, Hubble and rocket models in the main game views, with Canvas fallback and resource cleanup.
- [x] 56 Node tests and 26 Python tests pass, including the actual terrain traversal and scene event-handler lifecycle.
- [ ] Visual browser QA for v0.3.0: preview access was blocked by browser policy; earlier v0.2.3 visual checks do not validate this release.
- [ ] Push / tag / release on the project's GitHub repository. No repository connection is configured in this workspace.
