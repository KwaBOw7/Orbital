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
    for file in ('README.md', 'build.mjs', 'package.json', 'version.json', 'launcher.py', '.gitignore', 'LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md'):
        shutil.copy2(ROOT / file, target / file)


def copy_root_metadata(stage):
    for file in ('README.md', 'version.json', 'launcher.py', '.gitignore', 'LICENSE', 'NOTICE', 'THIRD-PARTY-NOTICES.md'):
        shutil.copy2(ROOT / file, stage / file)


def write_launchers(stage):
    (stage / 'API.txt.example').write_text('PASTE_YOUR_NASA_API_KEY_HERE\n')
    unix = '''#!/bin/sh
set -eu
GAME_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required by Play. Install Python 3 or open index.html for offline play." >&2
  exit 1
fi
exec python3 "$GAME_DIR/launcher.py" --refresh-on-start "$@"
'''
    windows = '''@echo off
setlocal
where py >nul 2>nul
if errorlevel 1 goto fallback
py -3 "%~dp0launcher.py" --refresh-on-start %*
set "RESULT=%ERRORLEVEL%"
goto finished
:fallback
where python >nul 2>nul
if errorlevel 1 goto missing
python "%~dp0launcher.py" --refresh-on-start %*
set "RESULT=%ERRORLEVEL%"
:finished
if not "%RESULT%"=="0" pause
exit /b %RESULT%
:missing
echo Python 3 is required by Play. Install Python 3 or open index.html for offline play.
pause
exit /b 1
'''
    for prefix in ('Play-', 'Start-NASA-'):
        for suffix in ('Linux.sh', 'macOS.command'):
            path = stage / (prefix + suffix)
            path.write_bytes(unix.encode('ascii'))
            path.chmod(0o755)
        (stage / (prefix + 'Windows.cmd')).write_bytes(windows.replace('\n', '\r\n').encode('ascii'))


def main():
    for file in ('index.html', 'online.html'):
        if not (ROOT / 'dist' / file).is_file():
            raise SystemExit('Run node build.mjs from the source directory before packaging.')
    if STAGE.exists():
        shutil.rmtree(STAGE)
    STAGE.mkdir(parents=True)
    for file in ('index.html', 'online.html'):
        shutil.copy2(ROOT / 'dist' / file, STAGE / file)
    copy_root_metadata(STAGE)
    write_launchers(STAGE)
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
