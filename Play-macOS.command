#!/bin/sh
set -eu
GAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec python3 "$GAME_DIR/launcher.py" "$@"
