#!/usr/bin/env python3
"""Build an offline release archive using only the Python standard library."""
import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'release'
STAGE = OUT / 'ORBITAL-v0.2.0-data-preview'
OUT.mkdir(exist_ok=True)
if STAGE.exists():
    shutil.rmtree(STAGE)
STAGE.mkdir()
shutil.copy2(ROOT / 'dist/index.html', STAGE / 'index.html')
shutil.copy2(ROOT / 'dist/online.html', STAGE / 'online.html')
shutil.copy2(ROOT / 'launcher.py', STAGE / 'launcher.py')
shutil.copy2(ROOT / 'README.md', STAGE / 'README.md')
(STAGE / 'Play-Linux.sh').write_text('#!/bin/sh\nset -eu\nGAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec python3 "$GAME_DIR/launcher.py" "$@"\n')
(STAGE / 'Play-macOS.command').write_text('#!/bin/sh\nset -eu\nGAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec python3 "$GAME_DIR/launcher.py" "$@"\n')
(STAGE / 'Play-Windows.cmd').write_text('@echo off\r\npy -3 "%~dp0launcher.py" %*\r\nif errorlevel 1 pause\r\n')
(STAGE / 'API.txt.example').write_text('PASTE_YOUR_NASA_API_KEY_HERE\n')
for name in ['Play-Linux.sh', 'Play-macOS.command']:
    (STAGE / name).chmod(0o755)
source = STAGE / 'source'
source.mkdir()
for name in ['assets', 'src', 'data', 'tests', 'docs', 'scripts', 'tools', 'dist']:
    shutil.copytree(ROOT / name, source / name, ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '*.sqlite', '*.sqlite-*'))
for name in ['README.md', 'build.mjs', 'package.json', '.gitignore', 'launcher.py']:
    shutil.copy2(ROOT / name, source / name)
shutil.copytree(ROOT / 'docs', STAGE / 'docs')
items = sorted(p for p in STAGE.rglob('*') if p.is_file())
checksums = '\n'.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.relative_to(STAGE).as_posix() for p in items) + '\n'
(STAGE / 'SHA256SUMS.txt').write_text(checksums)
archive = OUT / 'ORBITAL-v0.2.0-data-preview.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in sorted(STAGE.rglob('*')):
        if p.is_file():
            z.write(p, Path(STAGE.name) / p.relative_to(STAGE))
standalone = OUT / 'ORBITAL-v0.2.0-data-preview.html'
shutil.copy2(ROOT / 'dist/index.html', standalone)
print(f'{archive} ({archive.stat().st_size:,} bytes)')
print(f'{standalone} ({standalone.stat().st_size:,} bytes)')
