# ORBITAL v0.3.3 data and model provenance

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
| DONKI reports | NASA feeds through optional Python service | Required startup data and recorded player go/no-go review; no calibrated physical effect |
| Imported Horizons state vectors | Direct download by the launcher for new Mars runs | Official endpoint and response validated; previously saved packs are historical |
| Intermediate geometry and range | Application Hermite interpolation, vector norm | Derived estimate; dense-reference accuracy validation pending |
| Ideal communication delay | Instantaneous geometric range / 299792.458 km/s | Used for game Earth reception time; excludes retarded light time, processing and link availability |
| Hubble, rocket and rover visuals | Supplied reference scene/model assets | Visual stand-ins; not verified engineering assemblies |

A 500/700 km label does not make the repeating orbit schedule a propagated solution. Hubble is a telescope visualization used at the user's request for the Earth mission, not a radar Earth-observation platform. Fairing checks compare a game envelope; they do not test mesh collisions. Scene altitude is compressed for visibility while the HUD displays the illustrative mission timeline.

See [NASA_DATA.md](NASA_DATA.md) for the request specification and [AUDIT_REVIEW.md](AUDIT_REVIEW.md) for model-specific acceptance tests. Synthetic flood coverage, authored orbital and relay schedules, hardware parameters, descent and terrain remain engineering work. The launch gate and Mars signal delay have fixture-based software validation.

| Derived parameter | Equation or data source | Uncertainty and evidence |
| --- | --- | --- |
| Earth–Mars range | Norm of NASA/JPL Horizons geometric position in km | Parsed exact source epochs. Independent interpolation benchmark pending. |
| Ideal signal delay | Range divided by the conventional speed of light, 299,792.458 km/s | Excludes moving receiver, propagation medium, relay and processing. Analytic conversion and reception deadline tests pass. |
| DONKI Kp summary | Maximum numeric Kp value reported for an event | Preserves unknowns. Report latency and observing coverage affect interpretation. |
| Equipment, contacts and flood targets | Authored catalogue and scenario rules | No engineering uncertainty estimates assigned. |

[Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) · [NASA DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) · [BIPM SI definitions](https://www.bipm.org/en/measurement-units/si-defining-constants)
