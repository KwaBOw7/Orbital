# ORBITAL v0.4.2 release

15 November 2026

ORBITAL v0.4.2 is an offline-first educational mission-design game. The standalone HTML opens the offline edition without Python, a NASA API key or network access. The `Play-*` scripts check `API.txt` and request fresh NASA DONKI reports on startup when a key is configured. The download runs in the background and successful responses are cached locally. Use `--offline` to skip network requests for the session. Those reports provide informational planning context and do not claim local particle flux, forecast or calibrated spacecraft hazard probability.

On first launch, players choose Basic, Intermediate, or Advanced. The setting changes mission guidance and the initial visibility of Earth engineering values. It can be changed from the footer. Exploded views animate separable assemblies in the radar spacecraft, rocket, rover, lander and observatory. With reduced motion enabled, the assemblies switch positions directly.

The Earth and Mars mission engines include the restored, versioned educational physics module. Earth uses two-body Kepler propagation, approximate Earth-fixed coordinates, geometry-derived target/station/eclipse windows, simplified SAR estimates, ideal free-space RF link budgeting, battery efficiencies and a single-node thermal model. Mars uses a bounded educational EDL profile, two-body reference-orbit relay visibility and simplified rover mobility. The exact assumptions and exclusions are in `docs/ENGINEERING_MODELS.md` and `docs/DATA_PROVENANCE.md`. These models are not flight-qualified tools.

A user-acquired historical UNOSAT flood shapefile can be converted to WGS84 GeoJSON and imported locally. The game displays its declared source as unauthenticated and uses the imported polygons for area-weighted acquisition and downlink scoring. The default training target uses synthetic tiles. Confirm the original data rights before redistribution.

JPL Horizons acquisition is optional and separate from gameplay. A validated pack can be imported locally and pinned to a new Mars mission. It provides geocentric Earth–Mars state vectors and an ideal one-way delay estimate; it does not provide a real relay-orbiter trajectory or surface-to-orbiter line-of-sight proof.

The release package contains the offline game, optional loopback edition, source, tests, documentation, launchers, project `LICENSE`, `NOTICE`, third-party notices, the Three.js MIT license and checksums. It excludes local API keys, caches and environment files. The release replaces the unverified attachment-derived models and legacy image assets from earlier package iterations with project-authored procedural illustrations; only Three.js r128 is bundled as a third-party runtime dependency. See `docs/ASSET_PROVENANCE.md`.

The latest run passed 107 Node.js tests and 48 Python tests. Two Python shapefile tests were skipped because pyshp/pyproj were unavailable. Automated tests validate software contracts and deterministic educational-model behavior. They are not independent scientific validation, live-provider tests, browser accessibility certification or proof of Space Apps eligibility. The package does not establish participant registration, event eligibility, compliant development chronology, or organizer acceptance of a challenge-resource interpretation. See `docs/VALIDATION.md`, `docs/AUDIT_REVIEW.md` and `docs/AI_USAGE_DISCLOSURE.md`.

### Model preview controls
Compact lunar previews hide Fire descent engine; expanded views retain it. Mars Landmarks and Auto-rotate are disabled and hidden in both compact and expanded views. These are display-layer overrides; original source files and mesh geometry are unchanged. Direct Asteroid 3D and Rocket 3D buttons open the supplied models. The newly uploaded asteroid and rocket files are byte-identical to the previous uploads, now packaged under their latest filenames.
