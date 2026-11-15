# ORBITAL v0.3.3 asset provenance

Recorded identities describe what is in this release. A SHA-256 hash verifies file identity, not authorship, licensing or engineering accuracy. No asset is newly certified as a NASA model.

| Asset | Recorded origin | Rights / fidelity status | SHA-256 |
| --- | --- | --- | --- |
| `assets/models/mars_rover.stl` | User attachment mars_rover.stl | Original author/source and redistribution permission unverified | `0b11f8f64198e91efe231259bbcb8085e134a1516ee5d91b5ac49cd63649e619` |
| `assets/models/hubble.js` | Adapted from user attachment Hubble Space Telescope 3D Model.html | Original author/source and redistribution permission unverified | `f78e54623251b8e4c39b0dee9ca8b1ae2849ddf7ad3d42b9734527559f64ba29` |
| `assets/models/rocket.js` | Adapted from user attachment Rocket 3D Model.html | Original author/source and redistribution permission unverified | `4bb478344cf954e567774bbcd687977ae0cbec006899bcdf5dcccc78b89e326e` |
| `assets/models/mars-terrain.js` | Adapted from user attachment Mars Mountain View.html | Original author/source and redistribution permission unverified | `c979d30fc454916bebbb85b2714d28c5b45e63d8052465c2b0a84b00a8561835` |
| `assets/vendor/three-r128.min.js` | Bundled Three.js r128 | MIT; local three-LICENSE.txt | `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2` |
| `assets/earth.webp` | Earlier generated illustration | Generated artwork; no scientific geographic authority | `eeecfecf3af3747cfe4158cb245cd26be6211dc79e38b793f61ffb8cb53bcdee` |
| `assets/mars.webp` | Earlier generated illustration | Legacy generated artwork; current Mars view uses terrain | `9b64f21d55cf1283d1034cebaf467a6ed5cdca67c79eef708b1bf50508cf937e` |

The original author, download URL and license for each supplied model must be obtained before claiming public redistribution clearance. Keeping these user-provided assets for this local iteration does not resolve that gate. Adaptations and add-on geometry are illustrative. The file contents do not establish attachment interfaces, manufacturing tolerances or a geographic coordinate reference.

Public-release acceptance: preserve source URL and version, explicit license/permission, attribution requirements, original checksum, transformations made, units/axes and known deviations. Replace any asset whose rights cannot be established.

## v0.3.2 supplied scene additions

All four originals are retained under `assets/models/references/`. The build embeds adapted JavaScript and bundled Three.js, not the original HTML CDN script tags. No external texture is fetched. Original authorship and redistribution permission remain unverified.

| Original attachment | Original SHA-256 | Adaptation |
| --- | --- | --- |
| 3D Earth.html | `170bef2e03bf8dd02914da37f3ec36336365ae0ac7fe61586499dba96bb58f7b` | `assets/models/earth.js` |
| 3D Moon.html | `764718e135f686a7afff9810a98942c08f13c44c37980c6d42fc1286290447ae` | `assets/models/moon.js` |
| 3D Lunar Lander.html | `560758b8e7e63564b4ea579461a4521731a29494ca58f90e639fcfd43ec02daf` | `assets/models/lander.js` |
| Mars 3D Surface.html | `3de7e664a511148741c848f62dea251e8b68108b554e6bd356653c805df8c3dc` | `assets/models/mars-globe.js` |

`python3 scripts/adapt_visual_models.py` regenerates these adaptations. Changes: scope renderer and controls to each container; resize/picking offsets; explicit event, animation, geometry, texture and observer cleanup; bounded mesh densities; reduced-motion handling; procedural Earth texture cache at reduced resolution. Procedural outlines, noise, relief and lander geometry come from the supplied files and are illustrative. The existing Hubble adaptation now uses the supplied Earth texture. Reuploaded rover/Hubble/rocket/mountain sources match their earlier counterparts byte for byte.

Current adapted hashes:

- `earth-texture.js`: `ba08e3fb0daa94f992e74447f34a207296290ec94c7b4454a083a7919cb7cc5c`
- `earth.js`: `0427c7504e931c304853f4fcfdd35aecc7fd8d9038822637ec6e5225493aa390`
- `moon.js`: `234493318229fcebe67c7cd0308744491af86f8b587b4ccde66f541d7e187d47`
- `lander.js`: `1349e5c1f3a9a248cb59f82652af7854dbaa03e9efb4fa0bef1afed293bc50be`
- `mars-globe.js`: `a771997bf3e581febc0b310cdcd4096920cdc719cf1f9aaf15d7d724cd08ccd8`
- `hubble.js`: `f78e54623251b8e4c39b0dee9ca8b1ae2849ddf7ad3d42b9734527559f64ba29`
