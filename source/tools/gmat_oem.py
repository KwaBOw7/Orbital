#!/usr/bin/env python3
"""Validate and compare single-segment CCSDS OEM ephemerides for ORBITAL.

Supports Earth-centered UTC, EarthMJ2000Eq/EME2000/J2000 files with km and km/s
state vectors. It deliberately rejects unsupported frames rather than silently
applying an unverified coordinate transformation.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import re

MAX_BYTES = 10 * 1024 * 1024
MAX_ROWS = 500_000
FRAMES = {'EARTHMJ2000EQ', 'EME2000', 'J2000'}

def _utc(value: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError('OEM epoch is not text')
    text = value.strip().replace('Z', '+00:00')
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        raise ValueError(f'Invalid OEM UTC epoch: {value}') from None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    dt = dt.astimezone(timezone.utc)
    return dt

def _vector(values: list[str], epoch: str, line_no: int) -> dict:
    if len(values) != 7:
        raise ValueError(f'OEM data line {line_no}: expected epoch + 6 state values')
    t = _utc(values[0])
    nums = []
    for token in values[1:]:
        try:
            number = float(token.replace('D', 'E').replace('d', 'e'))
        except ValueError:
            raise ValueError(f'OEM data line {line_no}: invalid numeric state') from None
        if not math.isfinite(number):
            raise ValueError(f'OEM data line {line_no}: non-finite state')
        nums.append(number)
    position, velocity = nums[:3], nums[3:]
    if not (1.0e3 < math.sqrt(sum(x*x for x in position)) < 1.0e9):
        raise ValueError(f'OEM data line {line_no}: position magnitude is outside supported bounds')
    if math.sqrt(sum(x*x for x in velocity)) > 100:
        raise ValueError(f'OEM data line {line_no}: velocity magnitude is outside supported bounds')
    return {'epochUtc': t.isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
            'positionKm': position, 'velocityKmS': velocity}

def parse_oem(path: str | Path) -> dict:
    path = Path(path)
    raw = path.read_bytes()
    if not raw or len(raw) > MAX_BYTES:
        raise ValueError('OEM file is empty or exceeds the 10 MB limit')
    try:
        lines = raw.decode('ascii').splitlines()
    except UnicodeDecodeError:
        raise ValueError('OEM must be ASCII CCSDS text') from None
    header, metadata = {}, {}
    rows = []
    in_meta = False
    meta_segments = 0
    saw_data = False
    for line_no, original in enumerate(lines, 1):
        line = original.strip()
        if not line or line.startswith('COMMENT') or line.startswith('META_STOP'):
            if line.startswith('META_STOP'):
                in_meta = False
            continue
        if line == 'META_START':
            if in_meta or saw_data:
                raise ValueError('Multiple or misplaced OEM metadata segments are not supported')
            in_meta = True
            meta_segments += 1
            continue
        if line == 'COVARIANCE_START' or line == 'COVARIANCE_STOP':
            raise ValueError('OEM covariance sections are not supported by this importer')
        if '=' in line:
            key, value = (part.strip() for part in line.split('=', 1))
            (metadata if in_meta else header)[key] = value
            continue
        if line.startswith('CCSDS_'):
            continue
        if line.startswith('META_'):
            continue
        if line.startswith('DATA_START') or line.startswith('DATA_STOP'):
            continue
        if re.match(r'^\d{4}-\d\d-\d\dT', line):
            saw_data = True
            if len(rows) >= MAX_ROWS:
                raise ValueError('OEM exceeds the 500,000 state-vector limit')
            rows.append(_vector(line.split(), '', line_no))
        elif saw_data:
            raise ValueError(f'Unexpected OEM record at line {line_no}')
    if header.get('CCSDS_OEM_VERS') not in {'2.0', '3.0'}:
        raise ValueError('Only CCSDS OEM 2.0/3.0 files are supported')
    if meta_segments != 1 or not rows:
        raise ValueError('OEM must contain exactly one metadata segment and state-vector data')
    center = metadata.get('CENTER_NAME', '').upper()
    frame = metadata.get('REF_FRAME', '').upper()
    time_system = metadata.get('TIME_SYSTEM', '').upper()
    if center not in {'EARTH', 'EARTH CENTER', 'EARTH-CENTER'}:
        raise ValueError('OEM must be Earth-centered')
    if frame not in FRAMES:
        raise ValueError(f'Unsupported OEM frame {frame!r}; use EarthMJ2000Eq, EME2000 or J2000')
    if time_system != 'UTC':
        raise ValueError('OEM time system must be UTC')
    for key in ('OBJECT_NAME', 'START_TIME', 'STOP_TIME'):
        if not metadata.get(key):
            raise ValueError(f'OEM metadata missing {key}')
    for a, b in zip(rows, rows[1:]):
        if _utc(b['epochUtc']) <= _utc(a['epochUtc']):
            raise ValueError('OEM epochs must be strictly increasing')
    if _utc(rows[0]['epochUtc']) < _utc(metadata['START_TIME']) or _utc(rows[-1]['epochUtc']) > _utc(metadata['STOP_TIME']):
        raise ValueError('OEM state vectors fall outside declared metadata coverage')
    return {'header': header, 'metadata': metadata, 'samples': rows,
            'units': {'position': 'km', 'velocity': 'km/s'},
            'interpretation': 'Imported GMAT/reference ephemeris; Earth-centered UTC; no frame conversion applied.'}

def _interpolate(rows: list[dict], epoch: datetime) -> tuple[list[float], list[float]] | None:
    if epoch < _utc(rows[0]['epochUtc']) or epoch > _utc(rows[-1]['epochUtc']):
        return None
    lo, hi = 0, len(rows)-1
    while lo + 1 < hi:
        mid = (lo+hi)//2
        if _utc(rows[mid]['epochUtc']) <= epoch:
            lo = mid
        else:
            hi = mid
    a, b = rows[lo], rows[hi]
    if epoch == _utc(a['epochUtc']) or lo == hi:
        return a['positionKm'], a['velocityKmS']
    dt = (_utc(b['epochUtc'])-_utc(a['epochUtc'])).total_seconds()
    u = (epoch-_utc(a['epochUtc'])).total_seconds()/dt
    p = [x+(y-x)*u for x, y in zip(a['positionKm'], b['positionKm'])]
    v = [x+(y-x)*u for x, y in zip(a['velocityKmS'], b['velocityKmS'])]
    return p, v

def compare_oem(reference: dict, candidate: dict) -> dict:
    ref, cand = reference['samples'], candidate['samples']
    errors_p, errors_v = [], []
    for row in ref:
        t = _utc(row['epochUtc'])
        predicted = _interpolate(cand, t)
        if predicted is None:
            continue
        p, v = predicted
        errors_p.append(math.sqrt(sum((x-y)**2 for x, y in zip(row['positionKm'], p))))
        errors_v.append(math.sqrt(sum((x-y)**2 for x, y in zip(row['velocityKmS'], v))))
    if not errors_p:
        raise ValueError('The ephemerides have no overlapping epochs')
    def stats(values):
        return {'rms': math.sqrt(sum(x*x for x in values)/len(values)), 'max': max(values)}
    return {'comparedEpochs': len(errors_p), 'positionErrorKm': stats(errors_p),
            'velocityErrorKmS': stats(errors_v),
            'comparison': 'Reference samples compared against linear interpolation of candidate samples. This is a numerical comparison, not a claim that either ephemeris is truth.'}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='command', required=True)
    inspect = sub.add_parser('inspect', help='Validate and summarize a CCSDS OEM file')
    inspect.add_argument('file', type=Path)
    compare = sub.add_parser('compare', help='Compare two overlapping OEM files')
    compare.add_argument('reference', type=Path)
    compare.add_argument('candidate', type=Path)
    args = parser.parse_args()
    try:
        if args.command == 'inspect':
            data = parse_oem(args.file)
            result = {'object': data['metadata']['OBJECT_NAME'], 'center': data['metadata']['CENTER_NAME'],
                      'frame': data['metadata']['REF_FRAME'], 'start': data['samples'][0]['epochUtc'],
                      'end': data['samples'][-1]['epochUtc'], 'samples': len(data['samples']), 'units': data['units']}
        else:
            result = compare_oem(parse_oem(args.reference), parse_oem(args.candidate))
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(2, f'ERROR: {exc}\n')

if __name__ == '__main__':
    raise SystemExit(main())
