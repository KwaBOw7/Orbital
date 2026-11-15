# ORBITAL v0.4.2 — Data and model provenance

ORBITAL separates **sourced context**, **application-derived quantities** and **authored educational assumptions**. A connected NASA service does not validate unrelated spacecraft parameters. All calculations are deterministic educational models and are not flight-qualified predictions.

| Item | Origin / method | Fidelity and effect |
| --- | --- | --- |
| Earth hardware, mass, cost, power, storage and tier values | Authored `data/catalog.json` | Game settings; not manufacturer specifications unless explicitly cited. |
| Earth orbit | Two-body Keplerian propagation with supported orbital elements | Derived trajectory for the assumed initial state and central-body gravity; omits perturbations and orbit determination. |
| Earth-fixed coordinates | Inertial-to-Earth-fixed transformation using a GMST approximation | Approximate ground track, not precision Earth orientation. |
| Target access and station contacts | Spherical Earth geometry and sampled visibility/elevation against virtual catalogue nodes | Derived from the game orbit and synthetic targets/virtual ground stations; not operational coverage. Window boundaries are approximate to the sampling interval. |
| Earth eclipse | Cylindrical Earth-shadow approximation | Geometry-derived educational eclipse timing; no penumbra/extended solar-disc or high-fidelity lighting effects. |
| Volta Basin Floodwatch targets | Synthetic default, or local user-supplied GeoJSON with declared Product 3705 origin. | Polygon union area approximated on a weighted sampled grid. Access and delivered coverage are simulated. Source is unauthenticated. |
| SAR | Ideal slant/ground-range resolution and simplified swath/incidence/azimuth estimates | Derived from catalogued bandwidth, antenna and geometry assumptions; not SAR image formation, radiometry or validated instrument performance. |
| RF communication | Free-space path loss, EIRP, received power, thermal noise/SNR and Shannon-capacity upper bound | Derived ideal link estimate, limited by authored hardware rate; omits practical coding, margins, antenna patterns, atmosphere and interference. |
| Power/battery | Rated array generation with authored sun-incidence/degradation factor, cylindrical eclipse, charge/discharge efficiency and capacity bounds | Deterministic energy estimate; not cell electrochemistry, power-system design or flight telemetry. |
| Thermal | Single lumped node with radiative loss and design-point heater estimate | Educational equilibrium/transient approximation; not a multi-node thermal network. |
| Attitude/pointing | Off-nadir and slew/settle constraints from authored envelopes | Planning gate only; no full attitude propagation, actuators, control loops or jitter model. |
| Propulsion and launch | Tsiolkovsky rocket equation and authored launch/payload/fairing constraints | Ideal mass-ratio estimate; no ascent simulation, staging losses or verified provider performance curve. |
| NASA DONKI | NASA/CCMC reports when online retrieval is enabled | Observed event summaries used as optional planning context. No local dose, flux, forecast or calibrated hardware risk model; no effect on physics or score. |
| Mars entry/descent/landing | Deterministic point-mass educational model with exponential atmosphere and simplified phases | Illustrative EDL profile, not validated against a flown trajectory; omits multiple flight-critical effects and certified guidance. |
| Mars relay | Two-body reference orbit and sampled visibility against an authored Jezero training-site coordinate | Geometry-derived educational windows; no operational orbiter, insertion/transfer, perturbations or validated relay network. |
| Horizons geometry | NASA/JPL Horizons state vectors (Mars relative to Earth geocenter) when a valid pack is separately acquired | Sourced geocentric vectors; client interpolation and range/delay are derived. These values estimate Earth–Mars range and signal delay. Source provenance of portable packs is unverified. |
| Ideal Earth–Mars delay | Interpolated geocentric range divided by speed of light | Simplified vacuum one-way delay; omits retarded time, relay/processing delay and link availability. |
| Mars rover dynamics | Simplified acceleration/braking, grade, rolling resistance, traction and slope envelope over procedural terrain | Not multibody dynamics, suspension simulation, wheel-soil terramechanics or validated rover telemetry. |
| Mars terrain / landing area | Procedural local terrain surface and authored local scene coordinates | Visually representative training terrain; not a georeferenced elevation product or validated landing-site map. |
| 3D spacecraft and planetary visuals | Project-authored procedural scene code and bundled Three.js; see `ASSET_PROVENANCE.md` | Illustrative only; no NASA flight model, manufacturer assembly or measured planetary surface is claimed. Removed attachment-derived assets are not part of this release. |

## Model versioning

New mission saves retain the application release, simulation-model version and applicable dataset identifiers. Earth runs pin their model/catalogue assumptions. Mars runs can retain the exact validated Horizons pack and the associated data/interpolation identifiers. Legacy saves must not silently be reinterpreted under newer model rules.

## Validation boundary

Automated tests check equation properties, bounds, deterministic step behavior, save/replay integrity, data schema and scenario invariants. The tests do not establish physical accuracy against flight data. Open validation work includes an independent ephemeris/GMAT reference, actual flood-observation data, verified ground-station coordinates, manufacturer/mission hardware specifications, SAR calibration references, real telemetry and Mars EDL/rover validation.

See [ENGINEERING_MODELS.md](ENGINEERING_MODELS.md), [NASA_DATA.md](NASA_DATA.md), [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md) and [VALIDATION.md](VALIDATION.md).
