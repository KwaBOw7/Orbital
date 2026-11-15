# ORBITAL v0.3.4 release

15 November 2026

ORBITAL v0.3.4 is an offline-first educational mission-design game. The standalone HTML and `Play-*` launchers open the playable offline edition without Python, a NASA API key or network access. The optional Python loopback launcher can retrieve NASA DONKI reports when a user provides `API.txt`; those reports are informational planning context only and do not claim local particle flux, forecast or calibrated spacecraft hazard probability.

The Earth and Mars mission engines include the restored, versioned educational physics module. Earth uses two-body Kepler propagation, approximate Earth-fixed coordinates, geometry-derived target/station/eclipse windows, simplified SAR estimates, ideal free-space RF link budgeting, battery efficiencies and a single-node thermal model. Mars uses a bounded educational EDL profile, two-body reference-orbit relay visibility and simplified rover mobility. The exact assumptions and exclusions are in `docs/ENGINEERING_MODELS.md` and `docs/DATA_PROVENANCE.md`. These models are not flight-qualified tools.

A user-acquired UNOSAT product 3705 shapefile can be converted to WGS84 GeoJSON and imported locally; the validated product footprint changes target-access-window geometry, while the 720-tile science ledger remains synthetic. The product is historical/preliminary and rights confirmation is required before redistribution.

JPL Horizons acquisition is optional and separate from gameplay. A validated pack can be imported locally and pinned to a new Mars mission. It provides geocentric Earth–Mars state vectors and an ideal one-way delay estimate; it does not provide a real relay-orbiter trajectory or surface-to-orbiter line-of-sight proof.

The release package contains the offline game, optional loopback edition, source, tests, documentation, launchers, project `LICENSE`, `NOTICE`, third-party notices, the Three.js MIT license and checksums. It excludes local API keys, caches and environment files. The release replaces the unverified attachment-derived models and legacy image assets from earlier package iterations with project-authored procedural illustrations; only Three.js r128 is bundled as a third-party runtime dependency. See `docs/ASSET_PROVENANCE.md`.

Latest automated run: 100 Node.js tests and 42 Python tests passed. Automated tests validate software contracts and deterministic educational-model behavior. They are not independent scientific validation, live-provider tests, browser accessibility certification or proof of Space Apps eligibility. The package does not establish participant registration, event eligibility, compliant development chronology, or organizer acceptance of a challenge-resource interpretation. See `docs/VALIDATION.md`, `docs/AUDIT_REVIEW.md` and `docs/AI_USAGE_DISCLOSURE.md`.
