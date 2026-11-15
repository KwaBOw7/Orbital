# ORBITAL v0.3.3 fix register

15 November 2026. The numbered register contains **71 entries across eight workstreams**. The NASA key and data startup defect is addressed in this release. Status refers to implementation in v0.3.3. Automated tests use fixtures for external providers, so live NASA interoperability and independent scientific validation remain separate milestones.

## Startup acceptance

| Case | Expected outcome | Evidence |
| --- | --- | --- |
| Missing, malformed, rejected or example key | Exit nonzero before starting the service or opening the browser | Linux entry-point and mocked provider tests |
| Provider unreachable, incomplete or malformed output | Exit nonzero. A previous process's cache cannot unblock startup. | Launcher fixture tests |
| Valid empty source interval | Accept a successful official response with zero events and display the count accurately | Launcher fixture test |
| Direct HTML open | Show setup. Direct-open game code cannot unlock without a verified loopback response. | Packaged HTML checks and browser-code VM tests |
| Verified session and upstream refresh failure | Retain a received snapshot for this session and label it stale | Launcher fixture test |
| Key removed, changed or rejected after startup | Pause and lock at the next browser status check | Launcher and browser-code VM tests |

## 1. Backend and application architecture

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 1.1 | Partial | Validated DONKI reports inform a mandatory launch review and are recorded with the run. A calibrated model for physical effects needs independent test cases. |
| 1.2 | Implemented | Launcher exposes bounded JPL acquisition under Data settings. New Mars flights require its verified pack. |
| 1.3 | Implemented | Date, duration, vector frame, units and time scale are reproducible from the manifest and CLI. Rerun and compare vectors at all 25 epochs. |
| 1.4 | Open | Acquire and attribute an actual reference pack with its raw-response digest and validity interval. Keep a reference fixture separate from startup authorization. |
| 1.5 | Open | Fetch independent dense epochs and compare position, velocity and delay throughout at least three representative intervals. Report RMS and maximum error. |
| 1.6 | Implemented | New runs carry distinct Earth and Mars model IDs. Readers preserve legacy rules and reject unsupported versions. |
| 1.7 | Implemented for new runs | Save, restore and replay retain model, configuration and reviewed dataset identity. Mars stores the exact pack and checks a pending relay against it. |
| 1.8 | Open | Add independently sourced spacecraft telemetry or simulation references with declared tolerances and reproducible loaders. |

## 2. Mission logic and scientific engineering

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 2.1 | Open | Compare circular and eccentric propagated spacecraft states against reference trajectories at matching epochs and force assumptions. Derive operations from geometry. |
| 2.2 | Open | Compare inertial-to-Earth-fixed coordinates and known sub-satellite points across wraparound, polar and equatorial cases. |
| 2.3 | Open | Compare SAR resolution, swath and incidence behavior with a sourced radar mode. Verify radiometry, units and invalid pointing cases. |
| 2.4 | Open | Match independent sunlit, eclipse and duty-cycle energy examples with panel attitude and battery losses. Check conservation and saturation. |
| 2.5 | Partial | Horizons delay affects Mars delivery. Validate Earth contacts against independent station elevation and an RF link budget for a specified band and antenna. |
| 2.6 | Open | Check field of view and slew limits against independent off-nadir and attitude maneuver cases. |
| 2.7 | Open | Validate a subsystem thermal model against equilibrium and transient reference curves. State boundary conditions and limits. |
| 2.8 | Open | Compare selected launcher, orbit and payload envelope against an attributed vehicle user guide and published curve. |
| 2.9 | Open | Validate descent phases against reconstructed events and reference profiles with atmosphere, drag, parachute and powered-flight terms. |
| 2.10 | Open | Compare slope, obstacle, wheel contact and traction cases against an independent model. Demonstrate no terrain penetration. |
| 2.11 | Partial | Ideal Mars–Earth delivery delay is implemented. Validate pass access and occultation from an actual orbiter and landing site before replacing authored schedules. |
| 2.12 | Partial | NASA reports, derived geometry and educational assumptions are identified in preflight, HUD and docs. Audit every displayed scientific field for consistent labels. |
| 2.13 | Implemented by labeling | Earth assembly and flight identify Hubble as the illustrative stand-in. |

## 3. NASA data integration

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 3.1 | Open | Select a dated Volta Basin flood product with documented rights, projection, resolution, coverage and no-data fields. Demonstrate a mission targeting or scoring change. |
| 3.2 | Partial | DONKI informs go/no-go review. A Horizons-based arrival time changes relay feasibility and scoring. Validate the complete data-to-result path with live acquisitions. |
| 3.3 | Implemented | New manifests identify cubic Hermite interpolation and no extrapolation. Exact sample epochs preserve source values. |
| 3.4 | Open | Run the dense independent benchmark in 1.5. Analytic constant-acceleration tests verify the implementation. |
| 3.5 | Implemented | New packs use a stable format ID. Historic v0.2.0 metadata is recognized only by the legacy reader. |
| 3.6 | Partial | Mars delivery depends on range and receipt deadline. Orbital opportunities still require spacecraft/site geometry. |
| 3.7 | Open | Trace each critical hardware value to an official specification or explicitly bounded assumption. Check units and applicability. |
| 3.8 | Partial | Mars has a defined acquisition, decision and save pipeline for one quantity. Earth flood products and mission-specific spacecraft data remain open. |

## 4. 3D assets and visualization

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 4.1 | Partial | Asset inventory records supplied attachments and checksums. Confirm upstream provenance for every supplied original. |
| 4.2 | Open | Obtain author, upstream URL, version, license and attribution for each asset. Retain documented permission where required. |
| 4.3 | Open | Select official NASA models appropriate to the spacecraft and verify scale, source and rights. |
| 4.4 | Open | Resolve source/rights or replace each unresolved asset before redistribution. |
| 4.5 | Partial | Hubble and Mars terrain labels disclose the visual model. Audit labels for every assembly and mission view. |
| 4.6 | Open | Adopt verified Mars elevation data with stated resolution, bounds, coordinate system and vertical datum. |
| 4.7 | Open | Verify the selected landing site, geographic control points and rendered coordinates against a reference map. |

## 5. Documentation

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 5.1 | Partial | README has a challenge self-assessment with evidence and open status. Check it directly against the official challenge Resources tab when accessible. |
| 5.2 | Implemented | NASA_DATA.md documents actual startup, review, geometry, delay and persistence. |
| 5.3 | Partial | DATA_PROVENANCE.md records sources, units and limits for the new data path. Complete the field-level evidence for the engineering catalogue. |
| 5.4 | Open | Resolve unknown sources and permissions in ASSET_PROVENANCE.md. |
| 5.5 | Partial | VALIDATION.md includes startup and Mars delivery results. Rendered-browser and independent scientific benchmarks remain unverified. |
| 5.6 | Open | Add the verified public repository URL, commit, release tag and issue IDs once published. The current worktree has no remote. |
| 5.7 | Implemented | This register links measurable acceptance evidence or an outstanding test to each numbered item. |
| 5.8 | Implemented | DONKI and Horizons requests now identify ORBITAL/0.3.3. |

## 6. User experience and accessibility

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 6.1 | Partial | Flight manual maps the four NASA mission segments to player actions. Verify beginner comprehension of remaining mission terms. |
| 6.2 | Partial | Existing component changes update design totals. Add or validate immediate per-option deltas and opportunity costs for all subsystems. |
| 6.3 | Partial | Verified reports, derived delay and illustrative hardware have labels. Check consistency across all pages, reports and tooltips. |
| 6.4 | Partial | Earth report explains losses and Mars shows signal travel and delivery status. Verify causal debriefs in success and failure cases. |
| 6.5 | Partial | Mars terrain and Hubble are labeled illustrative. Verify scale labeling across all scenes and telemetry. |
| 6.6 | Open | Run complete launch/review/save/replay and scene checks on Firefox and Safari. |
| 6.7 | Open | Run touch, keyboard alternatives and layout checks on at least one Android and one iOS device. |
| 6.8 | Open | Run all dialogs and missions with keyboard only and a screen reader. Provide a playable equivalent to pointer/3D-only actions. |
| 6.9 | Open | Measure contrast on overlays and modal states. Verify focus order, visible focus and focus restoration. |
| 6.10 | Partial | Some model scenes respect reduced motion. Test OS behavior in all animated scenes and mission dashboards. |
| 6.11 | Partial | Canvas rendering path is tested. Profile frame time and memory on named lower-performance hardware. |
| 6.12 | Open | Observe learners completing Earth and Mars tasks and record whether they can explain the resulting trade-offs. |

## 7. Compliance, licensing and competition

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 7.1 | Partial | NASA’s Design and Develop Science Missions guide informs the player manual. DONKI and Horizons are integrated. Confirm against the official challenge list and record the matching entries. |
| 7.2 | Open | Run documented GMAT reference trajectories and verify qualification against the resource list. |
| 7.3 | Open | Project owner selects a source license after reviewing rights and scope. Existing third-party license text ships with its dependency. |
| 7.4 | Open | Identify and record the rights disposition for each original asset, generated image, source and project material. |
| 7.5 | Open | Obtain redistribution permission or replace every supplied model whose terms cannot be established. |
| 7.6 | Partial | Official API and mission-guide sources are cited. Complete hardware, geography and asset citations as sources are integrated. |
| 7.7 | Partial | Release documents AI assistance and earlier generated Earth/Mars illustrations. The team must verify its complete disclosure before submission. |
| 7.8 | Partial | Release chronology is recorded. Organizer confirmation of unresolved eligibility questions is pending. |
| 7.9 | Open | Registered team verifies participant and submission requirements in the official portal. |
| 7.10 | Implemented locally | The 24-second demo shows the startup gate and Mars delay with a labeled synthetic comparison. Submission remains a team step. |

## 8. Release and scientific acceptance

| ID | v0.3.3 status | Acceptance evidence or remaining acceptance test |
| --- | --- | --- |
| 8.1 | Partial | Each item has an acceptance test or artifact. Agree numerical error tolerances and model fidelity targets before scientific validation. |
| 8.2 | Open | Perform the orbital, ground-track and communication reference checks from 2.1, 2.2 and 2.5. |
| 8.3 | Partial | Reproducible fixtures cover authentication, dataset validation and Mars reception. Rerun with credentials and official independent cases. |
| 8.4 | Open | Complete the browser, OS, accessibility and performance matrix with reproducible evidence. |
| 8.5 | Partial | v0.3.3 source, docs, release identity, hashes and existing third-party attribution are synchronized. Project and supplied-model rights remain open. |

## Sources

[NASA Open APIs](https://api.nasa.gov/) · [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) · [NASA Design and Develop Science Missions](https://ntrs.nasa.gov/citations/20250002492) · [NASA GMAT](https://software.nasa.gov/software/GSC-19640-1) · [UNOSAT Lower Volta comparison candidate](https://unosat.org/products/3705) · [Official Space Apps challenge](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/)
