# ORBITAL Engineering Models (v0.3.4)

This document describes the calculations currently used by the Earth-observation and Mars training missions. These are deterministic educational models, not flight-dynamics, spacecraft qualification, remote-sensing processing or mission-assurance tools. Parameter values in `source/data/catalog.json` are instructional assumptions unless a source is explicitly identified.

## Earth-orbit propagation

`source/src/mission-physics.js` propagates Keplerian two-body orbits from semi-major-axis altitude, eccentricity, inclination, RAAN, argument of perigee, mean anomaly and epoch. The current model bounds Earth-orbit eccentricity to `0 ≤ e ≤ 0.2` and altitude to the supported LEO range. The state is transformed to an Earth-fixed frame using a GMST approximation.

The application derives target access, station elevation/visibility and eclipse windows from propagated positions. Access, station and eclipse windows are sampled every 30 seconds; their start/end boundaries are therefore approximate to the sampling resolution. Ground nodes in the training catalogue are virtual nodes, not operational ground stations.

**Not modelled:** J2 and higher gravity harmonics, atmospheric drag, luni-solar perturbations, solar radiation pressure, orbit determination, maneuver execution, station-keeping, Earth orientation parameters or an authoritative external ephemeris validation dataset.

## Target access and attitude

Target access uses spherical Earth surface distance and a geometric off-nadir estimate. The ADCS gate estimates a slew from the nadir reference using an authored slew-rate and settle-time envelope.

**Not modelled:** full attitude quaternion propagation, reaction-wheel momentum, torque, control loops, structural flexure, jitter, precision pointing error or instrument boresight calibration.

## SAR instrument estimate

The model calculates ideal slant-range resolution as `c / (2B)`, ground-range resolution using the incidence-angle projection, an incidence-angle swath estimate, and an idealized antenna-length azimuth estimate. The bandwidth and antenna parameters are instructional catalog values.

**Not modelled:** waveform design, pulse repetition frequency, ambiguity performance, synthetic-aperture processing, antenna patterns, range/azimuth sidelobes, radiometric calibration, noise-equivalent sigma-zero, polarization, speckle, terrain layover/shadow or image-quality validation. The SAR result is not a processed radar image or a flight instrument specification.

## Communications

The RF estimate calculates free-space path loss, EIRP, received power, thermal noise, SNR and a Shannon-capacity upper bound. The mission runtime evaluates the geometry-derived range and elevation to the virtual training nodes and caps throughput at the authored hardware rate.

**Not modelled:** real network availability, antenna tracking, polarization mismatch, link coding/modulation, implementation margin, atmospheric/rain attenuation, interference, Doppler, protocol overhead, real antenna patterns or verified station coordinates. This is not a certified link budget.

## Power and battery

Solar generation is reduced by a fixed catalogued sun-incidence cosine and degradation factor, and set to zero during the cylindrical Earth-shadow eclipse. Charge and discharge efficiencies and capacity saturation are applied to battery energy. The simulator uses a fixed design-point heater estimate at the minimum operating temperature during each mode, so energy accounting remains deterministic across different time-step sizes.

**Not modelled:** time-varying panel attitude, active Sun tracking, panel temperature, cell degradation uncertainty, detailed bus load profiles, battery voltage/current dynamics, depth-of-discharge limits or cell-level electrochemistry.

## Thermal estimate

The model uses a single lumped thermal node, a shaded radiator, Stefan–Boltzmann radiative loss and a first-order analytical temperature update linearized about the minimum operating temperature. Heater power is estimated at the design point.

**Not modelled:** multi-node spacecraft thermal networks, MLI, conductive contact paths, view factors, orbital albedo/IR, component-specific temperatures, heater control dynamics, transient internal loads or thermal-vacuum correlation.

## Propulsion and launch

The spacecraft deployment estimate uses the Tsiolkovsky rocket equation with illustrative dry mass, propellant use and specific impulse. Launch service checks use catalogued capacity, fairing and injection compatibility constraints.

**Not modelled:** launch vehicle ascent, staging, aerodynamic loads, gravity/drag losses, launch windows, actual vehicle performance curves, injection dispersion, propulsion feed systems or verified vendor specifications.

## Mars entry, descent and landing

The Mars practice descent is a 2D point-mass model with an exponential atmosphere, fixed entry state, fixed drag areas, simplified parachute/separation/terrain-navigation events, bounded powered braking and a final sky-crane lowering phase. The profile is generated at 0.5-second intervals and records explicit limitations with each profile.

Limitations include no lateral crossrange, bank guidance, lift, heat-shield ablation, winds, image-based terrain-relative navigation, propellant mass accounting, qualified engines or comparison against a flown Mars landing trajectory. It is not a validated EDL design.

## Mars relay and rover

Relay contacts are derived from a Mars-fixed site and a two-body Kepler reference orbiter, sampled every 30 seconds. The relay profiles use two-body Kepler reference orbits. The elliptical relay option uses eccentricity 0.04 with a 500 km semi-major-axis altitude; the direct and polar options use circular reference orbits. None of these profiles models interplanetary transfer, orbital insertion or capture dynamics.

Rover motion applies a simplified acceleration/braking, grade, rolling-resistance, traction and slope envelope to the supplied local terrain function. It is not a multibody vehicle dynamics model.

**Not modelled:** high-fidelity Mars gravity field, perturbations, lander/orbiter navigation, relay antenna patterns, real Mars network assets, suspension, wheel-soil terramechanics, slip estimation, obstacle perception, detailed wheel contact or validated rover telemetry.

## Reproducibility and validation status

Each mission records the application, model and dataset identifiers in its provenance. The automated test suite checks equation behaviour, bounds, reproducibility under different time-step requests, save/replay provenance and scenario invariants.

Passing these tests establishes implementation consistency for the tested assumptions. It does **not** establish physical accuracy against flight data. GMAT/independent ephemeris comparison, real station validation, instrument calibration references and flown spacecraft telemetry remain separate validation work.
