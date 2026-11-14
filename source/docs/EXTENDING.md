# Extending ORBITAL

The first mission proves the full engineering loop. Keep the event simulator independent of rendering and preserve the catalogue schema when extending it.

## New components

Add a catalogue record with an ID, category, parent mount, mass, cost, power, dimensions, lead time, visual asset ID and four-entry arrays for supported tier attributes. Higher tiers should have a meaningful performance trade-off. Add the same semantic asset ID to the renderer, define its local placement and keep the stowed envelope consistent. All existing tiers increase mass and cost; power, computer, comms, radar and upgrades have explicit performance arrays. Higher bus, attitude, thermal and propulsion tiers reduce housekeeping power in the demo.

## New orbit profile

Add its ID, altitude, period, eclipse boundaries, target windows, contact windows and supported injection. The existing Earth-observation model assumes two 15-minute day/night views of the same 15-tile strip per orbit and nonoverlapping imaging/contact windows. A new orbit must preserve these invariants or update the engine with overlap-aware simultaneous collection/transmission. Add hand-calculated battery and data tests before enabling it.

## New mission type

The menu entries for the four future missions deliberately do not launch the EO simulator under another title. Each needs a validated scenario model: route, events, capability requirements, operations, objective ledger and report explanations. Reuse preflight, resource integration, event scheduling, persistence, career accounting and UI stages; isolate mission-specific collection and route logic behind a scenario adapter before enabling the card. Landing, terrain driving, rendezvous and telescope pointing must not be reduced to unsupported EO parameters.

## Replacement 3D assets

`src/renderer.js` keeps semantic component IDs and reusable box dimensions/positions. Replace the renderer behind `OrbitalView.attach`, `detach` and `action`; the deterministic engine must remain unchanged. New artwork should be bundled and licensed for offline redistribution. Record mesh attachment points and stowed bounds. Batch repeated geometry when profiling shows a benefit.

## Persistence

Saves record inputs and command history, not trusted arbitrary simulator internals. Import reconstructs active flights with the same engine. Increment the save version and add a migration if modifying event semantics or catalogue meanings. Preserve attempt counts and the committed-report flag so resume never re-awards career points.
