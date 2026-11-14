# ORBITAL v0.2.0 progress

- [x] Replace waiting with simulation speed and event skipping.
- [x] Add post-launch dashboard based on the supplied visual reference.
- [x] Add Mars descent and surface practice.
- [x] Preserve Earth mission determinism and save compatibility.
- [x] Add regression checks for event stepping and Mars objectives.
- [ ] Integrate validated per-mission NASA data.
- [ ] Add configurable Mars spacecraft and persistent Mars mission saves.
- [ ] Connect a repository and publish the release on GitHub.

The checked items are local implementation status, not GitHub issue state.

## NASA integration roadmap — local tracking, 14 November 2026

These are local milestone labels, not invented GitHub issue IDs. No repository is configured.

| Milestone | Dependency | Acceptance criteria | Status / evidence |
| --- | --- | --- | --- |
| Source audit: Horizons | None | Review current API version, vectors, clocks, fair-use/contact/CORS | Implemented; official references and bounded query in `NASA_DATA.md` |
| Pack schema/storage | Source audit | Reject incompatible/corrupt/oversized imports; atomic activation; retained previous pack | Implemented; Python repository and JavaScript tests |
| First adapter: Earth–Mars | Schema, real contact | A documented live request yields a validated pack that works offline after restart | Adapter implemented; mocked tests pass; **live acceptance pending contact** |
| First attributed starter | Live request | Bundle one small authentic validated interval and attribution | Pending; no fabricated starter is shipped |
| Offline data UI | Schema | Show clocks, coverage, size, credits; review/import/export/rollback | Implemented; desktop/narrow browser checks, synthetic import |
| Mission pinning | Pack storage | Active run/replay keeps exact data; old v1 saves remain valid | Implemented; snapshot/save/replay regression tests |
| Refresh acquisition UX | First adapter | Bounded explicit acquisition, cancellation and prior-pack retention | CLI implemented; browser percentage progress and one-click retrieval deferred |
| Optional online fallback | Source-specific policy review | Opt-in cadence independent of speed; stale/cache states; zero requests offline | Deferred; selector explicitly unavailable; no online artifact claimed |
| Earth CMR/GIBS/flood pack | Geometry end-to-end verified; choose event/AOI/products | Validate sensor, classes, units, resolution, cloud/unusable pixels and dates; no browse-as-SAR assumptions | Deferred; requires event/AOI/product selection and source audit |
| Lunar/PDS | Specific site/products; mission mechanics | Audit and preprocess bounded terrain with frame/unit tests | Deferred; mission remains planned |
| Mars/PDS/media | Specific mission/products | Curated permitted assets, scientific context and terrain; no Eyes telemetry claim | Deferred; current Mars remains illustrative practice |
| Asteroid/SBDB | Sequential source audit; route solver | Preserve nulls, version/orbit epoch and physical uncertainty; validate geometry | Deferred; close approach must not be described as rendezvous |
| Telescope/TAP | Source audit; telescope mechanics | Bounded catalog with units, uncertainties/references and independent target checks | Deferred; detector performance remains separate |
| Scientific validation | Actual sourced packs | Independent reference geometry checks, coverage limits and offline restart | Synthetic mathematical references pass; live scientific check pending |
| Distribution | Tests/docs; source audit | Offline HTML/ZIP, no secrets/cache; exact implemented/deferred report | Local development preview prepared; see `VALIDATION.md` |
| GitHub publication | User-designated repo/visibility/license | Real issue IDs, reviewed source, actual release upload and fresh download check | Pending; no remote configured |

Player-contact setup is implemented: an optional email/date/platform form generates a validated downloader command and guides Python installation and pack import. Email is page-session-only and excluded from saves/packs. Offline browser checks cover Unix/Windows command generation, invalid input, reload clearing and narrow layout. Live retrieval and automatic updates remain pending.

## Latest scope: API.txt Python launcher

- Implemented: remove email-entry UI; optional same-directory NASA key file; Python-based OS launch scripts; separate same-origin online artifact and unchanged offline guarantees.
- Implemented: bounded sequential DONKI adapter, atomic persistent cache, 15-minute real-world schedule, manual throttle, remembered Offline choice and visible stale/error states. Active mission physics is unaffected.
- Live evidence: 2026-11-14T14:11:11Z yielded 7 flares / 0 storms / 20 CMEs. Canonical public FLR endpoint fixes the gateway's 404; GST/CME use the supplied gateway key.
- Local security checks cover secret exclusion, denied source/key routes, exact Host/Origin, no arbitrary relay, size/time bounds and retained cache on failure.
- Prior checklist entries marking all online modes unavailable apply to the earlier preview, not this launcher update. Horizons/other mission adapters and GitHub publication remain pending as documented in NASA_DATA.md.
