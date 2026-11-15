#!/usr/bin/env python3
"""Start ORBITAL only after retrieving validated NASA DONKI data with your API key."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
from email.utils import parsedate_to_datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import os
from pathlib import Path
import random
import re
import tempfile
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen
import webbrowser

from tools import nasa_data

ROOT = Path(__file__).resolve().parent
UTC = timezone.utc
INTERVAL = 900
MAX_BYTES = 1_000_000
APP_VERSION = '0.3.3'
FEEDS = {'flares': 'FLR', 'storms': 'GST', 'cmes': 'CME'}
ENDPOINT = 'https://api.nasa.gov/DONKI/'
PROVIDER_ENDPOINTS = {name: ENDPOINT+code for name, code in FEEDS.items()}
# NASA's gateway currently forwards FLR to a broken trailing-slash route.
# Use the canonical public operation documented in DONKI's current OpenAPI schema.
PROVIDER_ENDPOINTS['flares'] = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR'


def now_iso():
    return datetime.now(UTC).isoformat(timespec='seconds').replace('+00:00', 'Z')


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp = tempfile.mkstemp(prefix='.staging-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(value, stream, separators=(',', ':'), allow_nan=False)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def read_key(path):
    try:
        with Path(path).open('r', encoding='utf-8-sig') as stream:
            value = stream.read(257).strip()
    except OSError:
        raise ValueError('API.txt is missing. Save only your NASA API key in that file beside launcher.py.') from None
    if not re.fullmatch(r'[A-Za-z0-9_\-]{10,128}', value) or value.upper() in {'DEMO_KEY', 'PASTE_YOUR_NASA_API_KEY_HERE'}:
        raise ValueError('API.txt must contain only your NASA API key, without labels or quotes.')
    return value


def epoch(value):
    if not isinstance(value, str) or len(value) > 50:
        raise ValueError('Invalid observation time')
    try:
        t = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise ValueError('Invalid observation time') from None
    return t.replace(tzinfo=UTC) if t.tzinfo is None else t.astimezone(UTC)


def number(value, maximum):
    if value is None:
        return None
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or not 0 <= value <= maximum:
        raise ValueError('Invalid NASA numeric field')
    return value


def normalize(name, payload):
    if not isinstance(payload, list) or len(payload) > 2000:
        raise ValueError('Unexpected or oversized NASA event list')
    result, seen = [], set()
    for item in payload:
        if not isinstance(item, dict):
            raise ValueError('Invalid NASA event')
        ident = item.get({'flares': 'flrID', 'storms': 'gstID', 'cmes': 'activityID'}[name])
        timestamp = item.get('beginTime' if name == 'flares' else 'startTime')
        if not isinstance(ident, str) or not 1 <= len(ident) <= 200 or ident in seen:
            raise ValueError('Missing or duplicate NASA event identifier')
        seen.add(ident)
        row = {'id': ident, 'observedAt': epoch(timestamp).isoformat().replace('+00:00', 'Z')}
        if name == 'flares':
            value = item.get('classType')
            if value is not None and (not isinstance(value, str) or not re.fullmatch(r'[ABCMX][0-9]+(?:\.[0-9]+)?', value)):
                raise ValueError('Invalid flare class')
            row['classType'] = value
            row['peakTime'] = epoch(item['peakTime']).isoformat().replace('+00:00', 'Z') if item.get('peakTime') else None
        elif name == 'storms':
            values = item.get('allKpIndex') or []
            if not isinstance(values, list) or len(values) > 200:
                raise ValueError('Invalid Kp table')
            kp = [number(v.get('kpIndex'), 9) for v in values if isinstance(v, dict)]
            row['maxKp'] = max((v for v in kp if v is not None), default=None)
        else:
            analyses = item.get('cmeAnalyses') or []
            if not isinstance(analyses, list) or len(analyses) > 200 or any(not isinstance(v, dict) for v in analyses):
                raise ValueError('Invalid CME analysis')
            analysis = next((v for v in analyses if v.get('isMostAccurate') is True), analyses[0] if analyses else {})
            row['speedKmS'] = number(analysis.get('speed'), 10000)
        result.append(row)
    return sorted(result, key=lambda row: row['observedAt'], reverse=True)


class RejectedKey(ValueError):
    pass


def download(name, key, start, end, cancelled, opener=urlopen):
    query = {'startDate': start, 'endDate': end}
    if name != 'flares': query['api_key'] = key
    params = urlencode(query)
    request = Request(PROVIDER_ENDPOINTS[name]+'?'+params, headers={'User-Agent': f'ORBITAL/{APP_VERSION} NASA-DONKI-local-launcher', 'Accept': 'application/json'})
    for attempt in range(3):
        if cancelled.is_set():
            raise ValueError('Update cancelled; previous reports retained.')
        try:
            with opener(request, timeout=20) as response:
                data = bytearray()
                while True:
                    if cancelled.is_set():
                        raise ValueError('Update cancelled; previous reports retained.')
                    chunk = response.read(min(16384, MAX_BYTES+1-len(data)))
                    if not chunk:
                        break
                    data.extend(chunk)
                    if len(data) > MAX_BYTES:
                        raise ValueError('NASA response exceeds the 1 MB limit; previous reports retained.')
            return normalize(name, json.loads(data))
        except HTTPError as exc:
            code = exc.code
            retry = exc.headers.get('Retry-After', '')
            exc.close()
            if name != 'flares' and code in (401, 403):
                raise RejectedKey('NASA rejected the request. Check your API key and NASA API access.') from None
            if code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise ValueError(f'NASA returned HTTP {code}; previous reports retained.') from None
            try:
                delay = max(0, float(retry))
            except ValueError:
                try:
                    delay = max(0, (parsedate_to_datetime(retry)-datetime.now(UTC)).total_seconds())
                except (TypeError, ValueError):
                    delay = 2**(attempt+1)+random.random()
            if not math.isfinite(delay) or delay > 30:
                raise ValueError('NASA requested a longer wait. Automatic updates will retry later.') from None
            cancelled.wait(delay)
        except (URLError, OSError, TimeoutError):
            if attempt == 2:
                raise ValueError('NASA is unreachable; previous reports retained.') from None
            cancelled.wait(2**(attempt+1)+random.random())
        except (json.JSONDecodeError, UnicodeError):
            raise ValueError('NASA returned invalid data; previous reports retained.') from None
    raise ValueError('NASA update failed; previous reports retained.')


def validate_cache(value):
    if not isinstance(value, dict) or value.get('schemaVersion') != 1 or set(value.get('feeds', {})) != set(FEEDS):
        raise ValueError('Invalid report cache')
    epoch(value['retrievedAt'])
    for key, endpoint in FEEDS.items():
        feed = value['feeds'][key]
        if feed.get('endpoint') != PROVIDER_ENDPOINTS[key] or not isinstance(feed.get('items'), list) or len(feed['items']) > 2000:
            raise ValueError('Invalid cached feed')
        epoch(feed['startDate']+'T00:00:00Z')
        epoch(feed['endDate']+'T00:00:00Z')
        for row in feed['items']:
            epoch(row['observedAt'])
            if not isinstance(row.get('id'), str) or len(row['id']) > 200:
                raise ValueError('Invalid cached event')
            if key == 'storms': number(row.get('maxKp'), 9)
            if key == 'cmes': number(row.get('speedKmS'), 10000)
            if key == 'flares' and row.get('classType') is not None and not re.fullmatch(r'[ABCMX][0-9]+(?:\.[0-9]+)?', row['classType']):
                raise ValueError('Invalid cached flare')
    return value


class Reports:
    def __init__(self, key_file, cache_dir, fetcher=download):
        self.key_file, self.cache_dir, self.fetcher = Path(key_file), Path(cache_dir), fetcher
        self.cancelled, self.stop = threading.Event(), threading.Event()
        self.lock = threading.RLock()
        self.cached, self.error, self.busy, self.last_attempt = None, '', False, None
        self.verified_key = None
        self.mode = 'online'

    def ready(self):
        with self.lock:
            if self.verified_key is None or self.cached is None:
                return False
            try:
                return self.verified_key == self.key_fingerprint(read_key(self.key_file))
            except ValueError:
                return False

    @staticmethod
    def key_fingerprint(key):
        return hashlib.sha256(key.encode()).digest()

    def state(self):
        with self.lock:
            ready = self.ready()
            report = self.cached if ready else None
            age = (datetime.now(UTC)-epoch(report['retrievedAt'])).total_seconds() if report else None
            status = 'locked' if not ready else 'stale' if self.error or age > INTERVAL*2 else 'current'
            return {'mode': self.mode, 'status': status, 'ready': ready, 'busy': self.busy,
                    'error': self.error, 'refreshSeconds': INTERVAL, 'utcNow': now_iso(), 'report': report}

    def update(self):
        with self.lock:
            if self.busy:
                return False
            self.busy = True
            self.last_attempt = time.monotonic()
        try:
            key = read_key(self.key_file)
            end = datetime.now(UTC).date()
            start = end-timedelta(days=7)
            feeds = {}
            # Authenticate at the keyed NASA gateway before fetching the remaining feeds.
            for name in ['storms', 'cmes', 'flares']:
                items = self.fetcher(name, key, start.isoformat(), end.isoformat(), self.cancelled)
                feeds[name] = {'endpoint': PROVIDER_ENDPOINTS[name], 'startDate': start.isoformat(),
                               'endDate': end.isoformat(), 'items': items}
            snapshot = validate_cache({'schemaVersion': 1, 'retrievedAt': now_iso(), 'provider': 'NASA CCMC DONKI',
                                       'documentation': 'https://api.nasa.gov/', 'adapterVersion': 'donki-1',
                                       'fieldStatus': 'Official event reports', 'feeds': feeds})
            encoded = json.dumps(snapshot, sort_keys=True, separators=(',', ':')).encode()
            snapshot['datasetId'] = 'donki-' + hashlib.sha256(encoded).hexdigest()
            with self.lock:
                if self.cancelled.is_set() or read_key(self.key_file) != key:
                    raise ValueError('NASA key changed during verification. Retry with the current key.')
                atomic_json(self.cache_dir/'reports.json', snapshot)
                self.cached, self.error = snapshot, ''
                self.verified_key = self.key_fingerprint(key)
            return True
        except RejectedKey as exc:
            with self.lock:
                self.verified_key, self.error = None, str(exc)
        except ValueError as exc:
            with self.lock:
                self.error = str(exc)
        except Exception:
            with self.lock:
                self.error = 'Could not acquire or store NASA reports. Check the connection and cache directory.'
        finally:
            with self.lock:
                self.busy = False
        return False

    def control(self, mode):
        if mode != 'refresh':
            raise ValueError('Choose Refresh reports to retrieve NASA data.')
        with self.lock:
            read_key(self.key_file)
            if self.busy or (self.last_attempt is not None and time.monotonic()-self.last_attempt < 60):
                raise ValueError('Wait one minute between NASA refresh attempts.')
        threading.Thread(target=self.update, daemon=True).start()

    def schedule(self):
        while not self.stop.is_set():
            if self.last_attempt is None or time.monotonic()-self.last_attempt >= INTERVAL:
                self.update()
            self.stop.wait(1)


class Geometry:
    """Official-only geometry for new missions, populated directly from JPL."""
    def __init__(self, contact, reports):
        self.contact = contact
        self.reports = reports
        self.lock = threading.Lock()
        self.pack, self.error, self.last_attempt = None, '', None
        self.busy = False

    def state(self):
        with self.lock:
            return {'busy': self.busy, 'error': self.error, 'contactConfigured': bool(self.contact),
                    'pack': self.pack}

    def refresh(self):
        if not self.contact:
            raise ValueError('Restart with --jpl-contact and your real email or project contact URL.')
        with self.lock:
            if self.busy or (self.last_attempt is not None and time.monotonic()-self.last_attempt < 60):
                raise ValueError('Wait one minute between Horizons requests.')
            self.busy = True
            self.last_attempt = time.monotonic()
        threading.Thread(target=self.update, daemon=True).start()

    def update(self):
        try:
            params = nasa_data.parameters(datetime.now(UTC).date().isoformat(), 1)
            repo = nasa_data.Repository(self.reports.cache_dir/'geometry')
            with repo.locked():
                raw = nasa_data.retrieve(params, self.contact, cancel=self.reports.cancelled.is_set)
                pack = nasa_data.validate(nasa_data.make_pack(raw, params))
                nasa_data.atomic(repo.root/'verified-latest.json', nasa_data.canonical(pack))
            with self.lock:
                self.pack, self.error = pack, ''
        except Exception:
            # Do not expose the contact header or raw upstream exception.
            with self.lock:
                self.error = 'Could not acquire validated Horizons geometry. Check your contact, network and JPL availability.'
        finally:
            with self.lock:
                self.busy = False


def handler_for(reports, app_dir, geometry=None):
    class Handler(BaseHTTPRequestHandler):
        def allowed(self, mutation=False):
            expected = f'127.0.0.1:{self.server.server_port}'
            origin = self.headers.get('Origin')
            if self.headers.get('Host') != expected or (origin and origin != 'http://'+expected) or (mutation and origin != 'http://'+expected):
                self.send_error(403)
                return False
            return True

        def reply(self, value, code=200, kind='application/json'):
            content = value if isinstance(value, bytes) else json.dumps(value).encode()
            self.send_response(code)
            self.send_header('Content-Type', kind)
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(content)

        def do_GET(self):
            if not self.allowed(): return
            path = urlsplit(self.path).path
            if path in ('/', '/index.html'):
                if reports.ready():
                    self.reply((app_dir/'online.html').read_bytes(), kind='text/html; charset=utf-8')
                else:
                    self.reply((app_dir/'index.html').read_bytes(), code=503, kind='text/html; charset=utf-8')
            elif path == '/api/nasa/status':
                state = reports.state()
                if state['ready'] and geometry is not None:
                    state['geometry'] = geometry.state()
                self.reply(state)
            else: self.send_error(404)

        def do_POST(self):
            if not self.allowed(mutation=True): return
            if self.path not in ('/api/nasa/mode', '/api/nasa/geometry'):
                self.send_error(404)
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 100 or self.headers.get('Content-Type') != 'application/json': raise ValueError('Invalid control request')
                body = json.loads(self.rfile.read(length))
                if self.path == '/api/nasa/geometry':
                    if not reports.ready() or geometry is None:
                        self.reply({'error': 'Verify NASA access before retrieving Horizons geometry.'}, 503)
                        return
                    if body != {'mode': 'refresh'}:
                        raise ValueError('Invalid geometry request.')
                    geometry.refresh()
                    self.reply(geometry.state(), 202)
                else:
                    reports.control(body['mode'])
                    self.reply(reports.state())
            except ValueError as exc:
                self.reply({'error': str(exc)}, 400)
            except (KeyError, TypeError):
                self.reply({'error': 'Invalid refresh request.'}, 400)
            except OSError: self.reply({'error': 'Could not save local mode preference.'}, 500)

        def log_message(self, *_): pass
    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--key-file', type=Path, default=ROOT/'API.txt')
    parser.add_argument('--cache-dir', type=Path, default=Path.home()/'.local/share/orbital/nasa')
    parser.add_argument('--offline', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--jpl-contact', default=os.environ.get('ORBITAL_JPL_CONTACT', ''),
                        help='Real email or project contact URL for NASA/JPL Horizons requests used by Mars')
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--refresh-only', action='store_true', help='Download/cache once without starting the browser/server')
    args = parser.parse_args()
    if args.offline:
        parser.exit(1, 'NASA verification is required at startup. Remove --offline and connect to NASA.\n')
    reports = Reports(args.key_file, args.cache_dir)
    if not args.refresh_only:
        print('Verifying NASA API key and downloading official DONKI reports…', flush=True)
    if not reports.update() or not reports.ready():
        parser.exit(1, f"ORBITAL did not start. {reports.state()['error'] or 'NASA verification failed.'}\n")
    if args.refresh_only:
        state = reports.state()
        print(json.dumps({'status': state['status'], 'error': state['error'], 'retrievedAt': state['report']['retrievedAt'] if state['report'] else None, 'counts': {name: len(feed['items']) for name, feed in (state['report'] or {}).get('feeds', {}).items()}}))
        return 1 if state['error'] else 0
    app_dir = ROOT if (ROOT/'online.html').is_file() else ROOT/'dist'
    if not (app_dir/'online.html').is_file(): parser.exit(1, 'Missing online.html. Extract the complete release or run node build.mjs in source/.\n')
    geometry = Geometry(args.jpl_contact, reports)
    try: server = ThreadingHTTPServer(('127.0.0.1', args.port), handler_for(reports, app_dir, geometry))
    except OSError: parser.exit(1, 'Could not start local launcher. Try --port 8766.\n')
    worker = threading.Thread(target=reports.schedule, daemon=True)
    worker.start()
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'ORBITAL: {url}\nNASA data verified. API.txt stays private. Press Ctrl+C to stop.', flush=True)
    if not args.no_browser: webbrowser.open(url)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally:
        reports.stop.set(); reports.cancelled.set(); server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
