# ORBITAL v0.3.4 — Asset provenance and rights inventory

Recorded identities describe the files actually included in this source release. A SHA-256 hash proves file identity, not authorship or license. The original attachment-derived model scripts, source HTML references, rover STL and legacy Earth/Mars generated image files have been removed from v0.3.4. They are not included in the release ZIP or standalone HTML.

## Current bundled inventory

| File | Origin / rights status | SHA-256 |
|---|---|---|
| `assets/models/earth-texture.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `3a778eb223498501fb18e957de922a68c1c1b32121b810b18bd22f8b959bfcbc` |
| `assets/models/earth.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `acc9a828d31bd0de923c664568d7ab9ddd9d725942f23be1ae75c14ca9e45c8c` |
| `assets/models/lander.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `8d4f7c1ad8651b4e0dd9ea4154e7f5e8a0b5d565027bde947a49038082fc9c27` |
| `assets/models/mars-globe.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `e8ba1e6e922c0be7dbf556faed0aeaa397557eb35cdb298c892e25e12d3ab367` |
| `assets/models/mars-terrain.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `c8bd940af52faf0dfc8e78a3559fe5a7872f00c76976e70fe3942dbb3e4114ea` |
| `assets/models/moon.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `9418f3e7a4ebdcdedd62d148ab97f377e3394a01d4488771b17ba4c21f98243c` |
| `assets/models/observatory.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `7f509cdfcafd25421d9a3f4bf03d79bbd207148ed539427b2a9fac8890de0d64` |
| `assets/models/rocket.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `7ef9cffb3e707545c69258dbdc00f78c99f2cb2a07841195b50bdba9898c5108` |
| `assets/models/sar.js` | Original project-authored procedural illustration code; not a NASA model; no measured geometry or engineering accuracy claimed. | `b872714fa1db76e9b73b19ae5e97968ec83b88c938f8e07f346973feae119dee` |
| `assets/vendor/three-LICENSE.txt` | Third-party license notice for Three.js; MIT. | `7dddf7c5b8fd10ee654db8857d75d104b5557889aa5a91fc4ca545ea7c07062f` |
| `assets/vendor/three-r128.min.js` | Third-party Three.js r128 runtime; MIT license in adjacent three-LICENSE.txt. | `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2` |

## Procedural scene code

The scene files in `assets/models/` were newly authored for ORBITAL as procedural Three.js geometry/material construction. They do not embed the removed attachment HTML, STL mesh, image textures or remote model files. The generic optical observatory is explicitly not Hubble and is not represented as a particular flight spacecraft. The SAR scene is an illustrative radar-spacecraft schematic. The rocket, lander and rover are visual teaching aids, not vendor models, engineering assemblies or performance references.

## Third-party dependency

Three.js r128 is bundled locally to preserve offline operation. Its MIT license is supplied at `assets/vendor/three-LICENSE.txt` and copied to the package root as `THIRD-PARTY-LICENSE.txt`. The Three.js license applies to that dependency, not to the rest of the project.

## Project license scope

The root `LICENSE` applies to original ORBITAL code, documentation and project-authored procedural illustrations only. It does not grant rights to third-party dependencies, NASA insignia/names/marks, user-provided content, or data products. No NASA endorsement is implied. External datasets must retain their own attribution, terms, usage constraints and source hashes when imported.

## Release acceptance

- Do not restore removed user-supplied reference files to a public package unless the original source and redistribution permission are established.
- When new assets are added, record source URL, author, version, license, attribution, original checksum, transformations, units/axes and known fidelity limits.
- Treat procedural appearance as illustrative. A SHA-256 digest is not evidence of scientific accuracy, geographic registration or ownership.
- The current procedural Mars terrain is not a georeferenced elevation model. A real landing-site terrain product remains an external data acquisition and integration task.
