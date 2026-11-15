# ORBITAL v0.4.3 — Exploration and immersion update

## Added
- Procedural mission ambience using the Web Audio API. Sound is opt-in from the header and can be switched off at any time; no external audio files or network requests are required.
- A playable lunar field expedition with rover navigation, three scan objectives, sample collection, and basic telemetry. The original supplied Moon 3D model remains available for inspection.
- A Hubble observation-configuration screen with target selection, right ascension, declination, filter, exposure duration, and fine-guidance tracking settings. The supplied Hubble 3D model and its original inspection controls are retained.
- Additional rover assembly geometry around the unchanged original STL: six wheels and hubs, wheel tread, equipment deck, camera mast and lenses, solar array, robotic sample arm, high-gain dish, and UHF antenna.

## Engineering notes
- The rover STL triangle positions and normals remain unchanged; added parts are separate scene objects.
- Lunar field navigation and observation configuration are educational gameplay systems, not flight/mission-certified hardware models or live astronomical scheduling.
- Ambient audio is synthesized locally and starts only after the player enables it, respecting browser audio autoplay restrictions.
- Both offline and loopback builds include the additions.

## Validation
- `npm run build` succeeds.
- `npm test` passes: 116 tests, 0 failures.
- JavaScript syntax checks pass for the modified application and model files.
