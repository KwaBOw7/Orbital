#!/usr/bin/env python3
"""ORBITAL local launcher. API.txt opts in to NASA DONKI updates; --offline makes no provider requests."""
import argparse
from datetime import datetime, timedelta, timezone
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

ROOT = Path(__file__).resolve().parent
UTC = timezone.utc
INTERVAL = 900
MAX_BYTES = 1_000_000
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
    if not re.fullmatch(r'[A-Za-z0-9_\-]{10,128}', value) or value == 'PASTE_YOUR_NASA_API_KEY_HERE':
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


def download(name, key, start, end, cancelled, opener=urlopen):
    query = {'startDate': start, 'endDate': end}
    if name != 'flares': query['api_key'] = key
    params = urlencode(query)
    request = Request(PROVIDER_ENDPOINTS[name]+'?'+params, headers={'User-Agent': 'ORBITAL/0.2.0 NASA-DONKI-local-launcher', 'Accept': 'application/json'})
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
            if code in (401, 403):
                raise ValueError('NASA rejected the key. Check API.txt and your NASA API access.') from None
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
    def __init__(self, key_file, cache_dir, offline=False, fetcher=download):
        self.key_file, self.cache_dir, self.fetcher = Path(key_file), Path(cache_dir), fetcher
        self.cancelled, self.stop = threading.Event(), threading.Event()
        self.lock = threading.RLock()
        self.cached, self.error, self.busy, self.last_attempt = None, '', False, 0
        try:
            path = self.cache_dir/'reports.json'
            with path.open('rb') as stream:
                raw = stream.read(3*MAX_BYTES+1)
            if len(raw) > 3*MAX_BYTES: raise ValueError('Oversized cache')
            self.cached = validate_cache(json.loads(raw))
        except (OSError, ValueError, KeyError, TypeError):
            pass
        preference = None
        try: preference = json.loads((self.cache_dir/'mode.json').read_text()).get('mode')
        except (OSError, ValueError, AttributeError): pass
        if self.cached:
            age = max(0, (datetime.now(UTC)-epoch(self.cached['retrievedAt'])).total_seconds())
            self.last_attempt = max(0, time.monotonic()-age)
        self.mode = 'offline' if offline or preference == 'offline' or not self.key_file.is_file() else 'online'
        if self.mode == 'offline': self.cancelled.set()

    def state(self):
        with self.lock:
            age = (datetime.now(UTC)-epoch(self.cached['retrievedAt'])).total_seconds() if self.cached else None
            status = 'offline' if self.mode == 'offline' else 'stale' if self.cached and (self.error or age > INTERVAL*2) else 'current' if self.cached else 'missing'
            return {'mode': self.mode, 'status': status, 'busy': self.busy, 'error': self.error, 'keyFilePresent': self.key_file.is_file(), 'refreshSeconds': INTERVAL, 'utcNow': now_iso(), 'report': self.cached}

    def update(self):
        with self.lock:
            if self.mode != 'online' or self.busy: return
            self.busy = True
            self.cancelled.clear()
            self.last_attempt = time.monotonic()
        try:
            key = read_key(self.key_file)
            end = datetime.now(UTC).date()
            start = end-timedelta(days=7)
            feeds = {}
            for name, endpoint in FEEDS.items():
                items = self.fetcher(name, key, start.isoformat(), end.isoformat(), self.cancelled)
                feeds[name] = {'endpoint': PROVIDER_ENDPOINTS[name], 'startDate': start.isoformat(), 'endDate': end.isoformat(), 'items': items}
            snapshot = validate_cache({'schemaVersion': 1, 'retrievedAt': now_iso(), 'provider': 'NASA CCMC DONKI', 'documentation': 'https://api.nasa.gov/', 'adapterVersion': 'donki-1', 'fieldStatus': 'Official reported events; educational context only', 'feeds': feeds})
            with self.lock:
                if self.cancelled.is_set() or self.mode != 'online': return
                atomic_json(self.cache_dir/'reports.json', snapshot)
                self.cached, self.error = snapshot, ''
        except ValueError as exc:
            with self.lock: self.error = str(exc)
        except Exception:
            # Never expose raw exceptions: upstream URLs can contain the key.
            with self.lock: self.error = 'Update failed; previous reports retained.'
        finally:
            with self.lock: self.busy = False

    def control(self, mode):
        if mode not in ('offline', 'online', 'refresh'): raise ValueError('Unknown data mode')
        with self.lock:
            if mode == 'offline':
                self.mode = 'offline'
                self.cancelled.set()
            else:
                if not self.key_file.is_file(): raise ValueError('Save your NASA key in API.txt beside launcher.py, then retry.')
                if mode == 'refresh' and time.monotonic()-self.last_attempt < 60:
                    raise ValueError('Please wait one minute between manual updates; cached reports remain available.')
                self.mode = 'online'
            atomic_json(self.cache_dir/'mode.json', {'mode': self.mode})
        if mode != 'offline': threading.Thread(target=self.update, daemon=True).start()

    def schedule(self):
        while not self.stop.is_set():
            if self.mode == 'online' and (not self.last_attempt or time.monotonic()-self.last_attempt >= INTERVAL): self.update()
            self.stop.wait(1)


def handler_for(reports, app_dir):
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
                self.reply((app_dir/'online.html').read_bytes(), kind='text/html; charset=utf-8')
            elif path == '/api/nasa/status': self.reply(reports.state())
            else: self.send_error(404)

        def do_POST(self):
            if not self.allowed(mutation=True): return
            if self.path != '/api/nasa/mode': self.send_error(404); return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 100 or self.headers.get('Content-Type') != 'application/json': raise ValueError('Invalid control request')
                body = json.loads(self.rfile.read(length))
                reports.control(body['mode'])
                self.reply(reports.state())
            except (ValueError, KeyError, TypeError):
                self.reply({'error': 'Cannot change mode. Check API.txt; wait a minute before another refresh.'}, 400)
            except OSError: self.reply({'error': 'Could not save local mode preference.'}, 500)

        def log_message(self, *_): pass
    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    parser.add_argument('--key-file', type=Path, default=ROOT/'API.txt')
    parser.add_argument('--cache-dir', type=Path, default=Path.home()/'.local/share/orbital/nasa')
    parser.add_argument('--offline', action='store_true')
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--refresh-only', action='store_true', help='Download/cache once without starting the browser/server')
    args = parser.parse_args()
    reports = Reports(args.key_file, args.cache_dir, args.offline)
    if args.refresh_only:
        reports.update()
        state = reports.state()
        print(json.dumps({'status': state['status'], 'error': state['error'], 'retrievedAt': state['report']['retrievedAt'] if state['report'] else None, 'counts': {name: len(feed['items']) for name, feed in (state['report'] or {}).get('feeds', {}).items()}}))
        return 1 if state['error'] else 0
    app_dir = ROOT if (ROOT/'online.html').is_file() else ROOT/'dist'
    if not (app_dir/'online.html').is_file(): parser.exit(1, 'Missing online.html. Extract the complete release or run node build.mjs in source/.\n')
    try: server = ThreadingHTTPServer(('127.0.0.1', args.port), handler_for(reports, app_dir))
    except OSError: parser.exit(1, 'Could not start local launcher. Try --port 8766.\n')
    worker = threading.Thread(target=reports.schedule, daemon=True)
    worker.start()
    url = f'http://127.0.0.1:{server.server_port}'
    print(f'ORBITAL: {url}\nNASA mode: {reports.mode}. API.txt stays private. Press Ctrl+C to stop.', flush=True)
    if not args.no_browser: webbrowser.open(url)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally:
        reports.stop.set(); reports.cancelled.set(); server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
