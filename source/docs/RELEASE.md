# v0.2.2

- Added the supplied Hubble reference to Earth Observation Satellite assembly and the supplied rocket to preflight. Both viewers bundle Three.js and run offline.
- Rebuild the standalone and local NASA launcher editions from the same source. Existing geometry packs keep their original compatibility identifier.

# v0.2.0 update

- Instant launch-window advancement and 1/10/60/240 min-per-second playback.
- Next orbital event and run-to-end preserve Earth simulation results.
- Illustrated post-launch dashboard with live phase, telemetry, trace and log.
- Mars descent and rover practice with three waypoints, two analyses and science relay.
- Existing v1 Earth saves remain compatible. Mars practice is session-only.
- Bundled assets, source, tests and standalone HTML; no external runtime dependency.

GitHub status: release package prepared locally. No authenticated repository is available in this workspace; nothing has been pushed or published.

## Previous release notes

# Release candidate 0.1.0

Status: local release candidate built and tested; no GitHub repository or Release has been published.

## Release contents

- `ORBITAL-v0.1.0.zip`: playable HTML, optional OS launcher scripts, README, complete source, versioned catalogue, tests and documentation.
- `ORBITAL-v0.1.0.html`: the same game as one standalone file.
- Release zip includes `SHA256SUMS.txt` covering every other file.

## Suggested release description

ORBITAL 0.1.0 is an offline Space Mission Design Game MVP. Design, launch and operate a radar Earth-observation satellite, manage power and data, diagnose eclipse shortfalls and replay the same conditions. Includes two successful starter strategies, an eclipse lesson, two operating orbits, four illustrative carrier options, local profiles, career progression, shared-screen crew approvals and portable saves.

Download and extract the zip, then open `index.html` in a modern desktop browser. No internet, account, server or package install is required. Source editing/tests require Node 20+; release packaging uses Python 3. All numerical specifications are labelled educational game settings.

This is a local browser application. Native desktop binaries, real NASA/JPL/operator datasets and four additional playable mission types are future work. See the bundled validation report for test evidence and platform/performance limits.

## Publishing handoff

1. Establish the team's GitHub account/repository destination and visibility.
2. Select the source distribution license with the team.
3. Publish the contents of `source/` as the repository, including its README and source files.
4. Run the build and tests, then package the release.
5. Create version `v0.1.0` and attach the playable zip and standalone HTML.
6. Verify a fresh download with networking disabled and record browser/OS results before marking it a validated release.

No secrets, user saves, local test profiles, helper tools, credentials or source document attachments are included in the release archive.
