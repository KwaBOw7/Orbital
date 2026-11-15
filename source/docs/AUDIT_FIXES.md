# ORBITAL v0.3.4.2 audit fixes

ORBITAL v0.3.4.2, 15 November 2026. This release applies the fixes below to the v0.3.4 audit baseline. New missions record v0.3.4.2, and imported saves keep the app and model provenance recorded when they were created.

| Audit finding | Fix and evidence |
| --- | --- |
| 2.1 UNOSAT provenance | The converter records input file names, SHA-256 values, converter version and user-declared download URL/time. The browser requires an acknowledgment and always labels the data user-supplied and unauthenticated. Forged verification metadata never upgrades the profile. |
| 2.2 Horizons provenance | Imported packs receive a provider-unverified status after schema and checksum checks. Flight panels say which provider the file declares. The Python downloader records exact raw bytes, their SHA-256, retrieval timestamp and canonical request in a local acquisition directory. |
| 2.3, 3.1 and 8 DONKI cache | Nested feed, event, date and measurement validation. Invalid caches are ignored with a generic notice. Regression cases include nulls, strings, arrays, malformed measurements, Unicode/time edge cases and recovery with mocked provider data. Previous valid data survives provider or write failures. |
| 2.4 Flood scoring | Polygon rings and holes are sampled into weighted cells. Overlaps are unioned. Estimated line of sight, off-nadir angle and slew/settle control observation opportunities. Capture and downlink update separate per-cell ledgers. Delivered area can never exceed imaged area. Report and export include imported, reachable, imaged and delivered areas. |
| 2.5 OEM tooling | Comparator requires the same object, frame, starting epoch, closely matching initial state and full candidate coverage. It records file hashes and supports failing tolerances. An exporter generates the game's trajectory for the provided GMAT test case. |
| 4 Earth propagation check | An independent 1-second RK4 point-mass implementation matched the game's two-body orbit over 181 epochs. Maximum position difference about 2.5 µm, maximum velocity difference about 3.0 nm/s under identical assumptions. Results and tolerances are in TWO_BODY_CHECK.json. |
| 5.1, 5.2 Metadata and motion | Concise catalogue provenance and one reduced-motion CSS block. |

The grid resolves polygons at 128 × 128 sample centres and scores 32 × 32 weighted cells. Narrow features may be missed. The model assigns one cell per 30-second acquisition slot and assumes later observations can fill the remaining unacquired fraction. It does not form SAR images or measure current inundation. Default synthetic play and earlier bounding profiles have their original scoring.

## Evidence still required

| Audit item | Status or dependency |
| --- | --- |
| Real UNOSAT source and rights | The official report identifies the dated preliminary interpretation. The archive has no publisher-authenticated flood shapefile, confirmed redistribution permission or field-validated area score. [Reference product](https://unosat.org/products/3705) |
| Live NASA updates and Horizons validation | No personal NASA key, authorized JPL contact or independent ephemerides were supplied. Provider tests use fixtures. A dense Horizons download would be a cadence comparison against the same provider. |
| GMAT and scientific fidelity | GMAT was unavailable in the workspace. The RK4 case validates numerical agreement under a shared force model. Actual GMAT output, physical/engineering validation, sourced spacecraft hardware/ground stations and validation of Mars EDL, rover and relay behavior remain open. [NASA GMAT](https://software.nasa.gov/software/GSC-19640-1) |
| Chromium, other platforms, accessibility and learner acceptance | Headless Chromium 156.0.8078.79 aborted before opening a page with an operating-system socket restriction. Firefox, Safari, native Windows/macOS, mobile, assistive technology and learner studies remain unverified. |
| Publication and ownership | No public repository destination was supplied. Contributor licensing authority, full AI inventory, registration and chronology require the project team's evidence. |
| Submission demonstration | A separate 24-second video uses synthetic inputs and measurements from an actual engine run. It carries a visible AI disclosure. Public posting and submission are pending. |
| Competition eligibility | The organizing team requires a cited source from the selected challenge's Resources list for Global Awards. The exact match and registration, chronology and eligibility must be confirmed by the team and organizers. [Organizing team clarification](https://github.com/nasa/spaceapps/discussions/1827) |

The attached build supports standalone offline play and an optional DONKI launcher. The updated build passed 104 Node.js and 45 Python tests. Two Python shapefile integration tests were skipped because pyshp/pyproj were unavailable.
