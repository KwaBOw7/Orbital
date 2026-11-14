# Starter pack slot

`starter.json`, when supplied, is a validated version-1 Earth–Mars geometry pack from a successful documented Horizons request. The build validates and embeds it. No actual sourced starter is currently present: a real JPL User-Agent contact is required for the first live download. The game keeps its bundled authored scenario working and labels geometry as missing.

Never copy `tests/fixtures/synthetic-pack.json` here. It contains invented test vectors and is not NASA data. Runtime downloads and the SQLite repository belong outside source; see `docs/NASA_DATA.md`.
