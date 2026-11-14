# ORBITAL v0.3.1 data and model provenance

The game distinguishes sourced context, application-derived quantities and authored assumptions. No NASA data source validates an unrelated hardware field merely by being connected to the app.

| Item | Current origin | Fidelity / effect |
| --- | --- | --- |
| Earth hardware, budgets, launch allocations and tier values | Authored catalogue | Game trade-offs; no verified manufacturer specifications |
| Earth orbit, target passes, eclipses and radio contacts | Fixed authored schedules | No propagated ground track or geometry-dependent availability |
| Volta Basin target ledger | Synthetic 720-tile scenario | Not a flood map, current emergency assessment or measured area |
| SAR resolution/data/power | Authored per-tier values | No incidence/swath/radiometric/pointing model |
| Link rate | Authored GB/min during fixed contact intervals | No RF link budget or atmospheric attenuation |
| Earth power | Constant W between events; Wh storage and reserve thresholds | Arithmetic tested; no angle, degradation or battery-chemistry validation |
| Weather, launch and thermal behavior | Game constraints | No probability, ascent, drag or thermal dynamics |
| Mars chassis, services, profiles and contact windows | Authored rules | Configurable game mission, not actual launch or relay availability |
| Mars descent altitude and speed | Interpolated authored checkpoints | No atmosphere/drag/parachute/engine trajectory solver |
| Rover movement | Simplified kinematics on procedural height field | Battery, slope and boundary checks; no suspension or rock collision |
| Terrain and landing coordinates | User-supplied procedural terrain | Local x/z survey coordinates, not geographic Jezero reconstruction |
| DONKI reports | NASA feeds through optional Python service | Dated context only; no mission mechanics/scoring effect |
| Imported Horizons state vectors | User-selected pack with claimed source/manifest | Integrity and schema checked; import alone does not prove authorship |
| Intermediate geometry and range | Application Hermite interpolation, vector norm | Derived estimate; dense-reference accuracy validation pending |
| Ideal communication delay | Instantaneous geometric range / 299792.458 km/s | Not retarded light time, relay/processing latency or link availability |
| Hubble, rocket and rover visuals | Supplied reference scene/model assets | Visual stand-ins; not verified engineering assemblies |

A 500/700 km label does not make the repeating orbit schedule a propagated solution. Hubble is a telescope visualization used at the user's request for the Earth mission, not a radar Earth-observation platform. Fairing checks compare a game envelope; they do not test mesh collisions. Scene altitude is compressed for visibility while the HUD displays the illustrative mission timeline.

The offline game does not request NASA data. The optional NASA launcher and Horizons batch downloader are separate acquisition routes; their limits and prior evidence are documented in NASA_DATA.md. No sourced Horizons starter pack or actual flood imagery is bundled.

See ASSET_PROVENANCE.md for asset identities and unresolved permissions. See AUDIT_REVIEW.md for sources and the proposed validation sequence. All six critical scientific requirements in the submitted audit remain open.
