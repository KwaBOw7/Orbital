# ORBITAL v0.4.2 — original supplied models

The ten attachments below are packaged unchanged and embedded as base64. SHA-256 establishes identity, not authorship or licensing. They are user-supplied assets; independent authorship and redistribution licenses are not established here. No NASA authorship is claimed. The previous substitute spacecraft and globe models have been removed from the active build and source package.

| Original file | SHA-256 |
|---|---|
| `3D Earth(2).html` | `170bef2e03bf8dd02914da37f3ec36336365ae0ac7fe61586499dba96bb58f7b` |
| `3D Moon(2).html` | `764718e135f686a7afff9810a98942c08f13c44c37980c6d42fc1286290447ae` |
| `3D Lunar Lander(2).html` | `560758b8e7e63564b4ea579461a4521731a29494ca58f90e639fcfd43ec02daf` |
| `Mars 3D Surface(2).html` | `3de7e664a511148741c848f62dea251e8b68108b554e6bd356653c805df8c3dc` |
| `Mars Mountain View(3).html` | `3a69e26872801043ef63588eaadb3d9fef6299c3373e6ae47a8c214346772635` |
| `Hubble Space Telescope 3D Model(3).html` | `9c80be1eb48c917fd0d6ddd81d79819ce6803c1e423316d529f82cb6c958c37a` |
| `Rocket 3D Model(5).html` | `9ba066fec4bebd5a0e10f86aec013694d8f14c1c2e8311bab6682748cb934693` |
| `3D Asteroid(2).html` | `38581a4920c5f5b49e29ad2ab8d78d91d704af7d06663e9663e63a864657b544` |
| `3D Night Sky(1).html` | `cd4018784c513af1aeeb8c929386b03e2ab90c0882679c15d0b472d8b90665eb` |
| `mars_rover(3).stl` | `0b11f8f64198e91efe231259bbcb8085e134a1516ee5d91b5ac49cd63649e619` |

HTML source scripts remain unchanged, including Three.js CDN and optional Google Fonts dependencies. Rocket/Hubble part legends copy the original identification strings into the surrounding interface. The STL loader preserves every supplied triangle and normal; display transforms only place it in game coordinates. The existing training terrain, scene runtime, lighting and mission UI remain application infrastructure. Three.js licensing is in assets/vendor/three-LICENSE.txt.

### Model preview controls
Compact lunar previews hide Fire descent engine; expanded views retain it. Mars Landmarks and Auto-rotate are disabled and hidden in both compact and expanded views. These are display-layer overrides; original source files and mesh geometry are unchanged. Direct Asteroid 3D and Rocket 3D buttons open the supplied models. The newly uploaded asteroid and rocket files are byte-identical to the previous uploads, now packaged under their latest filenames.

### Rocket rendering repair
The launch preview now uses the supplied `Rocket 3D Model(5).html`, also used in the expanded viewer and Mars selection. At display time, its external Three.js tag is replaced with the release's bundled Three.js r128 and the existing Canvas fallback. The nose lathe profile is traversed from base to tip to face its normals outward. The archived HTML and its SHA-256 are unchanged. Ignition, exploded view, rotation, zoom and picking remain available.
