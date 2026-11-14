# ORBITAL v0.3.1 progress

Local status, 14 November 2026. This file is a GitHub handoff checklist, not evidence of remote issues, commits or publication. No repository is configured.

## Implemented

- [x] Offline Earth mission, resource ledger, scoring, replay and saved state.
- [x] Mars type/parts/upgrades/rocket/orbit configuration and keyboard control.
- [x] Mars persistence including launched design, position, samples and pinned data.
- [x] Practice/Career distinction with once-only Mars attempts/results and scenario best.
- [x] Reuse supplied Hubble/rocket/rover models with offline fallback.
- [x] Correct NASA launcher instructions and separate Start-NASA launchers.
- [x] Geometry reference-plane validation and within-interval interpolation.
- [x] Current release documentation, asset inventory and audit review.
- [x] 91 automated tests and Linux offline service startup check.

## Scientific upgrade — open, in dependency order

- [ ] Define reference frames, clocks, units, truth fixtures and tolerances.
- [ ] Propagate Earth orbit/ground track and derive eclipse/contact/target geometry.
- [ ] Integrate a pinned, attributed historical Lower Volta flood dataset.
- [ ] Implement sourced SAR, pointing, power and communications models.
- [ ] Add a sourced engineering catalogue with configuration-specific evidence.
- [ ] Add Mars reconstructed geometry/terrain and separately validate gameplay dynamics.
- [ ] Give applicable external data a documented mission-decision role.
- [ ] Resolve visual asset rights and establish geographic/model correspondence.

## Release acceptance — open

- [ ] Browser visual and file export/import acceptance on current build.
- [ ] Firefox/Safari and native Windows/macOS launcher tests.
- [ ] Mobile acceptance and target-device disconnected first launch.
- [ ] Profile FPS/memory on the user's hardware.
- [ ] Select repository/license, publish source and attach a tagged release.
- [ ] Implement lunar, asteroid and telescope systems only after the core scientific work.

Detailed acceptance criteria and evidence are in AUDIT_REVIEW.md and VALIDATION.md.
