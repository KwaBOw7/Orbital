#!/usr/bin/env python3
"""Bounded Horizons batch downloader and atomic local ORBITAL pack repository."""
import argparse
from contextlib import contextmanager, closing
import csv
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import hashlib
import io
import json
import math
import os
from pathlib import Path
import random
import re
import sqlite3
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ENDPOINT = 'https://ssd.jpl.nasa.gov/api/horizons.api'
DOC = 'https://ssd-api.jpl.nasa.gov/doc/horizons.html'
MAX_BYTES = 512_000
MAX_PACKS = 64
VERSION = '1.3'
APP_VERSION = '0.3.3'
PACK_SCHEMA = 'orbital.earth-mars-v1'
INTERPOLATION = 'cubic-hermite-position-velocity-v1'
C_KM_S = 299792.458
ROOT = Path(__file__).resolve().parents[1]
UTC = timezone.utc


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True, allow_nan=False).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def utc(value):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', value):
        raise ValueError('Expected whole-second UTC timestamp')
    return datetime.fromisoformat(value.replace('Z', '+00:00'))


def iso(value):
    return value.astimezone(UTC).strftime('%Y-%m-%dT%H:%M:%SZ')


def parameters(start, days):
    day = datetime.strptime(start, '%Y-%m-%d').replace(tzinfo=UTC)
    if not 1 <= days <= 7 or not 2000 <= day.year <= 2100:
        raise ValueError('Choose 1–7 days in years 2000–2100')
    return {'format': 'json', 'COMMAND': "'499'", 'CENTER': "'500@399'", 'MAKE_EPHEM': "'YES'", 'OBJ_DATA': "'NO'", 'EPHEM_TYPE': "'VECTORS'", 'START_TIME': "'" + start + "'", 'STOP_TIME': "'" + (day + timedelta(days=days)).strftime('%Y-%m-%d') + "'", 'STEP_SIZE': "'1 h'", 'VEC_TABLE': "'2'", 'VEC_CORR': "'NONE'", 'OUT_UNITS': "'KM-S'", 'REF_PLANE': "'FRAME'", 'REF_SYSTEM': "'ICRF'", 'TIME_TYPE': "'UT'", 'CSV_FORMAT': "'YES'", 'VEC_LABELS': "'YES'"}


def parse_horizons(payload, params):
    if not isinstance(payload, dict) or payload.get('signature', {}).get('version') != VERSION:
        raise ValueError('Unreviewed Horizons API version')
    text = payload.get('result', '')
    if payload.get('error') or not isinstance(text, str):
        raise ValueError('Horizons error response')
    # Check the actual scientific context, not just the parameters we sent.
    for pattern in [r'Target body name:\s*Mars\s*\(499\)', r'Center body name:\s*Earth\s*\(399\)', r'Output units\s*:\s*KM-S', r'Reference frame\s*:\s*ICRF', r'JDU?T[C]?\s*,', r'Calendar Date \(UT\s*\)']:
        if not re.search(pattern, text):
            raise ValueError('Unexpected Horizons frame, units, timescale or target')
    if text.count('$$SOE') != 1 or text.count('$$EOE') != 1:
        raise ValueError('Missing or duplicate ephemeris markers')
    rows = []
    for fields in csv.reader(io.StringIO(text.split('$$SOE')[1].split('$$EOE')[0].strip())):
        fields = [f.strip() for f in fields]
        if fields and fields[-1] == '':
            fields.pop()
        if len(fields) != 8:
            raise ValueError('Unexpected vector table columns')
        jd = float(fields[0])
        cal = datetime.strptime(fields[1], 'A.D. %Y-%b-%d %H:%M:%S.%f').replace(tzinfo=UTC)
        values = [float(f.replace('D', 'E')) for f in fields[2:]]
        if not all(math.isfinite(v) for v in [jd, *values]):
            raise ValueError('Missing or nonfinite vector')
        if abs(jd - (cal.timestamp()/86400 + 2440587.5)) > 1e-6:
            raise ValueError('Calendar and Julian time disagree')
        r = math.sqrt(sum(v*v for v in values[:3]))
        if not 1e6 < r < 1e9 or any(abs(v) > 200 for v in values[3:]):
            raise ValueError('Vector out of expected Earth–Mars bounds')
        rows.append({'epochUtc': iso(cal), 'positionKm': values[:3], 'velocityKmS': values[3:], 'rangeKm': r, 'idealDelaySeconds': r/C_KM_S})
    start = datetime.strptime(params['START_TIME'].strip("'"), '%Y-%m-%d').replace(tzinfo=UTC)
    end = datetime.strptime(params['STOP_TIME'].strip("'"), '%Y-%m-%d').replace(tzinfo=UTC)
    expected = int((end-start).total_seconds()/3600)+1
    if len(rows) != expected or not 25 <= len(rows) <= 169:
        raise ValueError('Incomplete ephemeris interval')
    for index, row in enumerate(rows):
        if utc(row['epochUtc']) != start+timedelta(hours=index):
            raise ValueError('Duplicate, missing or unordered epoch')
    return rows


def make_pack(payload, params):
    rows = parse_horizons(payload, params)
    data = {'samples': rows}
    manifest = {'schemaVersion': 1, 'packVersion': 1, 'formatId': PACK_SCHEMA, 'interpolation': INTERPOLATION, 'kind': 'earth-mars-geometry', 'createdAt': iso(datetime.now(UTC)), 'provider': 'NASA/JPL Horizons', 'endpoint': ENDPOINT, 'documentation': DOC, 'dataset': 'Mars (499) relative to Earth geocenter (399)', 'revision': {'apiVersion': VERSION, 'rawSha256': digest(payload)}, 'request': params, 'acquiredAt': iso(datetime.now(UTC)), 'observationTime': None, 'coverage': {'start': rows[0]['epochUtc'], 'end': rows[-1]['epochUtc'], 'stepSeconds': 3600}, 'frame': 'ICRF', 'origin': 'Earth geocenter (399)', 'timeScale': 'UTC', 'rawUnits': {'position': 'km', 'velocity': 'km/s'}, 'normalizedUnits': {'range': 'km', 'idealDelay': 's'}, 'fieldStatus': {'epochUtc': 'official calculated ephemeris', 'positionKm': 'official calculated ephemeris', 'velocityKmS': 'official calculated ephemeris', 'rangeKm': 'derived', 'idealDelaySeconds': 'derived', 'hardware': 'game-tuned', 'measurementUncertainty': 'unknown'}, 'adapterVersion': 'horizons-vector-1', 'transformVersion': 'hermite-norm-over-c-1', 'qualityFlags': ['Calculated geometry, not telemetry', 'Hourly source samples; application uses cubic Hermite interpolation inside coverage only', 'Ideal vacuum delay excludes motion during propagation, relay and processing'], 'assets': [], 'attribution': 'NASA/JPL Solar System Dynamics, Horizons', 'usageTerms': 'https://ssd.jpl.nasa.gov/horizons/manual.html#acknowledgements', 'dataBytes': len(canonical(data)), 'dataSha256': digest(data)}
    manifest['packId'] = 'mars-' + manifest['dataSha256'][:16]
    return {'manifest': manifest, 'data': canonical(data).decode('ascii')}


def validate(pack):
    if not isinstance(pack, dict) or set(pack) != {'manifest', 'data'} or len(canonical(pack)) > MAX_BYTES:
        raise ValueError('Invalid or oversized pack envelope')
    m, encoded = pack['manifest'], pack['data']
    if not isinstance(encoded, str) or not encoded.isascii():
        raise ValueError('Expected ASCII JSON payload')
    d = json.loads(encoded)
    if m.get('schemaVersion') != 1 or m.get('packVersion') != 1 or m.get('kind') != 'earth-mars-geometry':
        raise ValueError('Incompatible pack')
    if m.get('formatId') != PACK_SCHEMA or m.get('interpolation') != INTERPOLATION:
        if 'formatId' in m or 'interpolation' in m or m.get('compatibleGameVersions') != ['0.2.0']:
            raise ValueError('Unsupported pack format or interpolation')
    expected = hashlib.sha256(encoded.encode('ascii')).hexdigest()
    if m.get('dataSha256') != expected or m.get('dataBytes') != len(encoded) or m.get('packId') != 'mars-'+expected[:16]:
        raise ValueError('Pack checksum or identifier mismatch')
    if m.get('endpoint') != ENDPOINT or m.get('documentation') != DOC or m.get('frame') != 'ICRF' or m.get('origin') != 'Earth geocenter (399)' or m.get('timeScale') != 'UTC' or m.get('assets') != []:
        raise ValueError('Unsupported source, assets or geometry')
    if m.get('rawUnits') != {'position': 'km', 'velocity': 'km/s'} or m.get('normalizedUnits') != {'range': 'km', 'idealDelay': 's'}:
        raise ValueError('Wrong units')
    if not isinstance(m.get('revision'), dict) or m['revision'].get('apiVersion') != VERSION:
        raise ValueError('Unreviewed source version')
    for name in ['createdAt', 'acquiredAt']:
        utc(m[name])
    if m.get('observationTime') is not None:
        raise ValueError('Geometry is not an observation')
    params = m.get('request', {})
    try:
        start = params['START_TIME'].strip("'")
        days = (datetime.strptime(params['STOP_TIME'].strip("'"), '%Y-%m-%d')-datetime.strptime(start, '%Y-%m-%d')).days
        if params != parameters(start, days):
            raise ValueError('Unsupported request')
    except (KeyError, TypeError, AttributeError):
        raise ValueError('Invalid request provenance') from None
    if set(d) != {'samples'} or not isinstance(d['samples'], list) or not 25 <= len(d['samples']) <= 169:
        raise ValueError('Invalid sample table')
    samples = d['samples']
    for i, row in enumerate(samples):
        if set(row) != {'epochUtc', 'positionKm', 'velocityKmS', 'rangeKm', 'idealDelaySeconds'}:
            raise ValueError('Unknown sample fields')
        t = utc(row['epochUtc'])
        if i and (t-utc(samples[i-1]['epochUtc'])).total_seconds() != 3600:
            raise ValueError('Duplicate or missing epoch')
        for field in ['positionKm', 'velocityKmS']:
            v = row[field]
            if not isinstance(v, list) or len(v) != 3 or any(type(x) not in [float, int] or not math.isfinite(x) for x in v):
                raise ValueError('Invalid or missing vector')
        r = math.hypot(*row['positionKm'])
        if not 1e6 < r < 1e9 or any(abs(v) > 200 for v in row['velocityKmS']):
            raise ValueError('Out-of-range vector')
        if type(row['rangeKm']) not in [int, float] or type(row['idealDelaySeconds']) not in [int, float] or not math.isfinite(row['rangeKm']) or not math.isfinite(row['idealDelaySeconds']) or abs(row['rangeKm']-r) > 1e-5 or abs(row['idealDelaySeconds']-r/C_KM_S) > 1e-8:
            raise ValueError('Derived field conversion failed')
    if m.get('coverage') != {'start': samples[0]['epochUtc'], 'end': samples[-1]['epochUtc'], 'stepSeconds': 3600} or samples[0]['epochUtc'][:10] != start or len(samples) != days*24+1 or samples[-1]['epochUtc'][:10] != params['STOP_TIME'].strip("'"):
        raise ValueError('Coverage mismatch')
    # Checksums detect corruption, not authorship. Imported packs are never certified official.
    return pack


def read_pack(path):
    with open(path, 'rb') as f:
        data = f.read(MAX_BYTES+1)
    if len(data) > MAX_BYTES:
        raise ValueError('Pack exceeds 512 KB')
    return validate(json.loads(data))


def atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix='.staging-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


class Repository:
    def __init__(self, root):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.db = self.root / 'index.sqlite'
        with closing(sqlite3.connect(self.db)) as con, con:
            con.execute('CREATE TABLE IF NOT EXISTS packs (id TEXT PRIMARY KEY, sha TEXT, acquired TEXT, path TEXT, bytes INTEGER)')

    @contextmanager
    def locked(self):
        # Portable exclusive lock. A crashed process may leave a lock; inspect before manual removal.
        lock = self.root / '.writer-lock'
        try:
            fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            raise ValueError('Another updater is active (or a prior writer left a lock)') from None
        try:
            os.close(fd)
            yield
        finally:
            lock.unlink()

    def active(self):
        path = self.root/'active.json'
        return json.loads(path.read_text()) if path.exists() else {'active': None, 'previous': None}

    def install(self, pack):
        validate(pack)
        data = canonical(pack)
        m = pack['manifest']
        with self.locked():
            active = self.active()
            target = self.root/'packs'/m['packId']/'pack.json'
            if target.exists():
                existing = read_pack(target)
                if existing['manifest']['dataSha256'] != m['dataSha256']:
                    raise ValueError('Pack ID collision')
                if active['active'] == m['packId']:
                    return target
            elif len(list((self.root/'packs').glob('*/pack.json'))) >= MAX_PACKS:
                raise ValueError('64-pack repository limit; export/archive unused packs before continuing')
            if not target.exists():
                atomic(target, data)
            read_pack(target)
            with closing(sqlite3.connect(self.db)) as con, con:
                con.execute('INSERT OR REPLACE INTO packs VALUES (?, ?, ?, ?, ?)', (m['packId'], m['dataSha256'], m['acquiredAt'], str(target.relative_to(self.root)), len(data)))
            # active.json is the sole authoritative pointer. Previous files are retained for saves.
            atomic(self.root/'active.json', canonical({'active': m['packId'], 'previous': active['active']}))
        return target

    def rollback(self):
        with self.locked():
            a = self.active()
            if not a['previous']:
                raise ValueError('No previous pack')
            read_pack(self.root/'packs'/a['previous']/'pack.json')
            atomic(self.root/'active.json', canonical({'active': a['previous'], 'previous': a['active']}))


def retrieve(params, contact, cancel=lambda: False, opener=urlopen, sleeper=time.sleep):
    if not contact or not re.fullmatch(r'[^\s<>]{5,200}', contact) or not ('@' in contact or contact.startswith('https://')):
        raise ValueError('Set --contact to your real email or project contact URL (required by JPL)')
    request = Request(ENDPOINT+'?'+urlencode(params), headers={'User-Agent': f'ORBITAL/{APP_VERSION} (Earth-Mars educational pack downloader; contact: {contact})', 'Accept': 'application/json'})
    for attempt in range(3):
        if cancel():
            raise ValueError('Download cancelled')
        try:
            with opener(request, timeout=25) as response:
                data = bytearray()
                while True:
                    if cancel():
                        raise ValueError('Download cancelled')
                    chunk = response.read(min(16384, MAX_BYTES+1-len(data)))
                    if not chunk:
                        break
                    data.extend(chunk)
                    if len(data) > MAX_BYTES:
                        raise ValueError('Download exceeds 512 KB')
            return json.loads(data)
        except HTTPError as exc:
            if exc.code not in [429, 500, 502, 503, 504] or attempt == 2:
                raise ValueError(f'Horizons HTTP {exc.code}; previous pack retained') from None
            retry = exc.headers.get('Retry-After', '')
            exc.close()
            try:
                delay = max(0, float(retry))
            except ValueError:
                try:
                    delay = max(0, (parsedate_to_datetime(retry)-datetime.now(UTC)).total_seconds())
                except (TypeError, ValueError):
                    delay = 2**(attempt+1)+random.uniform(0, 1)
            if delay > 30:
                raise ValueError('Horizons asked for a longer wait; retry later. Previous pack retained') from None
            sleeper(delay)
        except (URLError, TimeoutError, OSError):
            if attempt == 2:
                raise ValueError('Horizons unavailable; previous pack retained') from None
            sleeper(2**(attempt+1)+random.uniform(0, 1))
    raise ValueError('Download failed')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store', type=Path, default=Path.home()/'.local/share/orbital/data')
    sub = parser.add_subparsers(dest='command', required=True)
    refresh = sub.add_parser('refresh', help='Download one 1–7 day geometry interval and export a portable JSON pack')
    refresh.add_argument('--start', default=datetime.now(UTC).date().isoformat())
    refresh.add_argument('--days', type=int, default=1)
    refresh.add_argument('--contact', default=os.environ.get('ORBITAL_JPL_CONTACT', ''))
    refresh.add_argument('--output', type=Path, required=True)
    refresh.add_argument('--force', action='store_true', help='Bypass reusable pack cache (still bounded/backed off)')
    imp = sub.add_parser('import', help='Validate and install JSON; no network')
    imp.add_argument('file', type=Path)
    exp = sub.add_parser('export', help='Export active stored pack; no network')
    exp.add_argument('file', type=Path)
    sub.add_parser('status')
    sub.add_parser('rollback')
    args = parser.parse_args()
    try:
        repo = Repository(args.store)
        if args.command == 'refresh':
            params = parameters(args.start, args.days)
            cache_key = digest(params)
            # Serialize all JPL calls across ORBITAL processes sharing this repository.
            with repo.locked():
                cache = repo.root/'requests'/f'{cache_key}.json'
                if cache.exists() and not args.force:
                    pack = read_pack(cache)
                    print('Reusing validated geometry cache; zero requests.')
                else:
                    if len(list((repo.root/'requests').glob('*.json'))) >= MAX_PACKS and not cache.exists():
                        raise ValueError('64 cached intervals reached; archive unused cache entries before downloading')
                    print('Downloading bounded Earth–Mars geometry (Ctrl+C cancels).', flush=True)
                    pack = make_pack(retrieve(params, args.contact), params)
                    validate(pack)
                    atomic(cache, canonical(pack))
            path = repo.install(pack)
            atomic(args.output, canonical(read_pack(path)))
            print(f'Validated {len(json.loads(pack["data"])["samples"])} epochs; {len(canonical(pack))} bytes. Export: {args.output}')
        elif args.command == 'import':
            print(repo.install(read_pack(args.file)))
        elif args.command == 'export':
            active = repo.active()['active']
            if not active:
                raise ValueError('No active pack')
            atomic(args.file, canonical(read_pack(repo.root/'packs'/active/'pack.json')))
        elif args.command == 'rollback':
            repo.rollback()
            print('Previous pack restored; retained packs are unchanged.')
        else:
            print(json.dumps(repo.active(), indent=2))
    except (ValueError, OSError, KeyError, TypeError, json.JSONDecodeError) as exc:
        parser.exit(1, f'{exc}\n')
    except KeyboardInterrupt:
        parser.exit(130, 'Cancelled. Previous working pack retained.\n')


if __name__ == '__main__':
    main()
