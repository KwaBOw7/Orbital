# ORBITAL v0.3.1 release

Audit remediation release, 14 November 2026. Local package only; not published to GitHub.

## Changes

- Separate `Start-NASA-*` scripts launch the Python reports service; `Play-*` remain offline HTML launchers. In-app setup now names the correct scripts.
- Mars Practice/Career selection, launch attempt counts, once-only result settlement, distinct scenario best and legacy-practice migration.
- Continuous, application-derived Horizons interpolation between hourly state vectors; exact samples and no-extrapolation behavior retained.
- Geometry pack validation now rejects a mismatched reference plane or vector table.
- Replaced inconsistent current documentation with one release status and explicit model limitations.
- Added an asset provenance inventory and a reviewed audit/action register. Unknown asset ownership has not been resolved by documentation.

## Deliverables

`ORBITAL-v0.3.1.html` and `ORBITAL-v0.3.1.zip`. ZIP contains offline/optional-service builds, six OS launcher scripts, Python service, example key file, source, tests, documentation, third-party license and checksums.

## Evidence and open gates

91 automated tests pass (62 Node, 29 Python), including local Linux service startup. New visual/cross-browser acceptance is not established. No new live NASA acquisition is claimed. See VALIDATION.md for the exact limits and AUDIT_REVIEW.md for scientific deficiencies that remain open.

This is not the planned scientific-engine upgrade. No actual flood imagery, propagated orbit, SAR/link-budget model or validated Mars dynamics was added in this release.

## Publication checklist

1. Resolve repository destination and source/model distribution permissions.
2. Build and test from a clean checkout; inspect artifacts for keys and caches.
3. Run browser, native-platform and disconnected-first-launch checks.
4. Publish the source and tag `v0.3.1`; attach HTML, ZIP and checksums.

No repository, issue IDs, release URL or successful publication is claimed.
