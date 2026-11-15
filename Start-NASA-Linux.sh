#!/bin/sh
set -eu
GAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required to verify NASA data and start ORBITAL." >&2
  exit 1
fi
exec python3 "$GAME_DIR/launcher.py" "$@"
