#!/usr/bin/env python3
"""Build an offline release archive using only the Python standard library."""
import hashlib
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'release'
STAGE = OUT / 'ORBITAL-v0.1.0'
OUT.mkdir(exist_ok=True)
if STAGE.exists():
    shutil.rmtree(STAGE)
STAGE.mkdir()
shutil.copy2(ROOT / 'dist/index.html', STAGE / 'index.html')
shutil.copy2(ROOT / 'README.md', STAGE / 'README.md')
(STAGE / 'Play-Linux.sh').write_text('#!/bin/sh\nset -eu\nGAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec xdg-open "$GAME_DIR/index.html"\n')
(STAGE / 'Play-macOS.command').write_text('#!/bin/sh\nset -eu\nGAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec open "$GAME_DIR/index.html"\n')
(STAGE / 'Play-Windows.cmd').write_text('@echo off\r\nstart "" "%~dp0index.html"\r\n')
for name in ['Play-Linux.sh', 'Play-macOS.command']:
    (STAGE / name).chmod(0o755)
source = STAGE / 'source'
source.mkdir()
for name in ['src', 'data', 'tests', 'docs', 'scripts', 'dist']:
    shutil.copytree(ROOT / name, source / name)
for name in ['README.md', 'build.mjs', 'package.json']:
    shutil.copy2(ROOT / name, source / name)
shutil.copytree(ROOT / 'docs', STAGE / 'docs')
items = sorted(p for p in STAGE.rglob('*') if p.is_file())
checksums = '\n'.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.relative_to(STAGE).as_posix() for p in items) + '\n'
(STAGE / 'SHA256SUMS.txt').write_text(checksums)
archive = OUT / 'ORBITAL-v0.1.0.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in sorted(STAGE.rglob('*')):
        if p.is_file():
            z.write(p, Path(STAGE.name) / p.relative_to(STAGE))
standalone = OUT / 'ORBITAL-v0.1.0.html'
shutil.copy2(ROOT / 'dist/index.html', standalone)
print(f'{archive} ({archive.stat().st_size:,} bytes)')
print(f'{standalone} ({standalone.stat().st_size:,} bytes)')
