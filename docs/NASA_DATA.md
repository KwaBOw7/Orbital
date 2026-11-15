# ORBITAL v0.3.3 NASA data

## Startup and identity

The launcher reads a personal key from `API.txt` and requests the newest available seven-day UTC interval from the two keyed DONKI feeds. It also queries the official flare feed. It validates the response shape, timestamps, identifiers and numeric bounds, atomically saves the snapshot, and only then binds the loopback server and opens the game. A valid empty event array represents a successful query with no reports. A missing, malformed, rejected or placeholder key, incomplete response or cache write failure aborts startup.

| Official feed | Endpoint | Selected fields |
| --- | --- | --- |
| Geomagnetic storms | `https://api.nasa.gov/DONKI/GST` | Event identifier/start, maximum reported Kp |
| Coronal mass ejections | `https://api.nasa.gov/DONKI/CME` | Event identifier/start, selected analysis speed in km/s |
| Solar flares | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` | Event identifier, start/peak UTC, reported class |

[DONKI documentation](https://api.nasa.gov/) · [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/)

The browser requires a verified status response from `127.0.0.1`. The server restricts Host and checks Origin on POST requests. The key goes to the NASA gateway only. It is absent from HTML, browser requests, save files, cache and release archives. The app checks for launcher verification every five seconds while visible. A transient upstream refresh failure marks reports stale for the current verified session. A deleted, changed or rejected key locks the game. An earlier process's cache cannot satisfy a new startup.

## From reports to a mission decision

At each new Earth or Mars launch and replay, the player sees the publication interval, retrieval time, counts and latest available reported values. The player can return to planning or acknowledge the report and launch. The saved run records the reviewed snapshot's content-based dataset identifier, adapter version, timestamps and a feed summary. A refresh during review requires acknowledgment of the newer snapshot. DONKI does not supply spacecraft trajectories, real-time telemetry or a calibrated hardware risk model.

## Horizons acquisition and Mars delivery

In **Data settings**, **Download Horizons geometry** calls the local Python adapter. Set `--jpl-contact` or `ORBITAL_JPL_CONTACT` to an actual email or project contact URL. The adapter uses the documented JPL API version, product endpoints and application user agent. It sends one bounded request at a time, with explicit backoff on transient failures. The NASA key does not go to JPL. [Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) · [JPL API policy](https://ssd-api.jpl.nasa.gov/doc/)

- The request fetches Mars (499) relative to the Earth geocenter (399) over one UTC day with hourly spacing. Vectors use ICRF, KM-S and geometric corrections set to NONE.
- The adapter checks the reported frame, target, center, time, units and format. It validates all 25 epochs and records the full canonical request, raw response digest, dataset ID, coverage and attribution.
- A new Mars mission requires the pack verified through the running launcher. The game stores that pack with the run. A refresh cannot modify it. Older saves can retain their historical pack and original timing. Checksums on imported or saved files establish internal integrity. The runtime does not use them for startup verification.
- The Mars ephemeris clock starts at the pack's first epoch. Intermediate epochs use cubic Hermite interpolation from bracketing position and velocity. Out-of-range calculations are unavailable.
- At upload completion, the simulator calculates the ideal one-way delay as the norm of the interpolated vector divided by 299,792.458 km/s. Earth receives the results only when that time elapses. An upload must fit within the simulated Mars relay window, and receipt must meet the mission deadline. This uses geocentric range and does not model relay processing, retarded time, RF margin or line of sight.

### Reproduce a geometry download

From the extracted package, choose the UTC start date and duration. Use the same parameters recorded in the pack. Example

```bash
python3 tools/nasa_data.py refresh --start 2026-11-15 --days 1 \
  --contact "your-real-contact@example.com" --output earth-mars-pack.json
```

The standalone CLI's repository supports export, import and rollback for analysis. Game launch geometry comes through the running service's fetch path. The release contains no starter pack. A dense independently acquired reference for interpolation and spacecraft validation is pending.

## Data lineage

DONKI snapshots have schema version 1 and adapter `donki-1`. Generated Horizons packs carry format `orbital.earth-mars-v1` and interpolation `cubic-hermite-position-velocity-v1`. A legacy reader recognizes v1 envelopes produced by older ORBITAL releases. The format rather than the software release governs new pack compatibility.

NASA reports are observations or analyses. JPL vectors are provider-calculated ephemerides. ORBITAL interpolation, range and delay are derived values. Review the [model provenance](DATA_PROVENANCE.md) and [fix register](AUDIT_REVIEW.md) for the educational models and open validation.
