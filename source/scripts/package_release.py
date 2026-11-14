#!/usr/bin/env python3
"""Package the built standalone game, local NASA launcher and source."""
import hashlib
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'release'
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
NAME = f'ORBITAL-v{VERSION}'
STAGE = OUT / NAME


def copy_sources(target):
    ignored = shutil.ignore_patterns('__pycache__', '*.pyc', '*.sqlite*', 'API.txt', 'api.txt', '.env*', '.local-data', 'earth-mars-pack.json')
    for folder in ('assets', 'src', 'data', 'tests', 'docs', 'scripts', 'dist', 'tools'):
        shutil.copytree(ROOT / folder, target / folder, ignore=ignored)
    for file in ('README.md', 'build.mjs', 'package.json', 'launcher.py', '.gitignore'):
        shutil.copy2(ROOT / file, target / file)


def main():
    for file in ('index.html', 'online.html'):
        if not (ROOT / 'dist' / file).is_file():
            raise SystemExit('Run node build.mjs from the source directory before packaging.')
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir(parents=True)
    for file in ('index.html', 'online.html'):
        shutil.copy2(ROOT / 'dist' / file, STAGE / file)
    for file in ('README.md', 'launcher.py', '.gitignore'):
        shutil.copy2(ROOT / file, STAGE / file)
    (STAGE / 'API.txt.example').write_text('PASTE_YOUR_NASA_API_KEY_HERE\n')
    (STAGE / 'Play-Linux.sh').write_text('#!/bin/sh\nset -eu\nGAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec xdg-open "$GAME_DIR/index.html"\n')
    (STAGE / 'Play-macOS.command').write_text('#!/bin/sh\nset -eu\nGAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)\nexec open "$GAME_DIR/index.html"\n')
    (STAGE / 'Play-Windows.cmd').write_text('@echo off\r\nstart "" "%~dp0index.html"\r\n')
    for file in ('Play-Linux.sh', 'Play-macOS.command'):
        (STAGE / file).chmod(0o755)
    copy_sources(STAGE / 'source')
    shutil.copytree(ROOT / 'docs', STAGE / 'docs')
    shutil.copy2(ROOT / 'assets/vendor/three-LICENSE.txt', STAGE / 'THIRD-PARTY-LICENSE.txt')
    items = sorted(p for p in STAGE.rglob('*') if p.is_file())
    checksums = '\n'.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(STAGE).as_posix()}' for p in items)
    (STAGE / 'SHA256SUMS.txt').write_text(checksums + '\n')
    archive = OUT / f'{NAME}.zip'
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
        for item in sorted(p for p in STAGE.rglob('*') if p.is_file()):
            zipped.write(item, Path(NAME) / item.relative_to(STAGE))
    standalone = OUT / f'{NAME}.html'
    shutil.copy2(ROOT / 'dist/index.html', standalone)
    print(f'{archive} ({archive.stat().st_size:,} bytes)')
    print(f'{standalone} ({standalone.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
