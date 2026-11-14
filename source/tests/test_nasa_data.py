"""Mocked adapter/repository tests: these are not evidence of live ingestion."""
import copy
from contextlib import closing
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError

spec = importlib.util.spec_from_file_location('nasa_data', Path(__file__).resolve().parents[1]/'tools/nasa_data.py')
n = importlib.util.module_from_spec(spec)
spec.loader.exec_module(n)


def fixture():
    start = datetime(2026, 11, 14, tzinfo=timezone.utc)
    rows = []
    for i in range(25):
        t = start+timedelta(hours=i)
        # Synthetic 3-4-5 triangle, not NASA geometry.
        rows.append(f'{t.timestamp()/86400+2440587.5:.9f}, A.D. {t.strftime("%Y-%b-%d %H:%M:%S")}.0000, 3.0E+7, 4.0E+7, 0, 0, 0, 0,')
    text = 'SYNTHETIC TEST FIXTURE\nTarget body name: Mars (499)\nCenter body name: Earth (399)\nOutput units : KM-S\nReference frame : ICRF\nJDUT, Calendar Date (UT), X, Y, Z, VX, VY, VZ,\n$$SOE\n'+'\n'.join(rows)+'\n$$EOE'
    return {'signature': {'source': 'MOCK ONLY', 'version': '1.3'}, 'result': text}


def pack():
    return n.make_pack(fixture(), n.parameters('2026-11-14', 1))


class AdapterTests(unittest.TestCase):
    def test_parser_and_independent_range_delay_reference(self):
        result = n.validate(pack())
        sample = json.loads(result['data'])['samples'][0]
        self.assertEqual(sample['rangeKm'], 50_000_000)
        self.assertAlmostEqual(sample['idealDelaySeconds'], 166.78204759907604, places=10)
        self.assertEqual(result['manifest']['timeScale'], 'UTC')

    def test_wrong_signature_and_context_rejected(self):
        for old, new in [('1.3', '1.4'), ('ICRF', 'ECLIPJ2000'), ('Earth (399)', 'Sun (10)'), ('KM-S', 'AU-D'), ('Calendar Date (UT)', 'Calendar Date (TDB)'), ('$$EOE', '')]:
            raw = json.dumps(fixture()).replace(old, new)
            with self.subTest(new=new), self.assertRaises(ValueError):
                n.make_pack(json.loads(raw), n.parameters('2026-11-14', 1))

    def test_partial_null_duplicate_or_invalid_numeric_response(self):
        for transform in [lambda s:s.replace('3.0E+7','n.a.',1), lambda s:s.replace('3.0E+7','NaN',1), lambda s:s.replace('3.0E+7','1E+12',1), lambda s:s.replace('2026-Nov-14 01:00','2026-Nov-14 00:00',1), lambda s:'\n'.join(s.splitlines()[:-2])+ '\n$$EOE']:
            data=fixture();data['result']=transform(data['result'])
            with self.assertRaises(ValueError):
                n.make_pack(data,n.parameters('2026-11-14',1))

    def test_pack_corruption_incompatible_and_executable_assets(self):
        for mutate in [lambda p:p['manifest'].update(schemaVersion=2),lambda p:p['manifest'].update(assets=[{'file':'../../run.sh'}]),lambda p:p.update(data=p['data']+' '),lambda p:p['manifest'].update(rawUnits={'position':'au','velocity':'km/s'}),lambda p:p['manifest'].update(compatibleGameVersions=['99.0.0'])]:
            p=pack();mutate(p)
            with self.assertRaises(ValueError):n.validate(p)

    def test_bounded_query_dates(self):
        for start,days in [('2026-11-14',0),('2026-11-14',8),('1800-01-01',1),('2026-99-99',1)]:
            with self.assertRaises(ValueError):n.parameters(start,days)

    def test_sequential_retries_honor_retry_after_and_redact_urls(self):
        sleeps=[];calls=[]
        def opener(request,timeout):
            calls.append(request)
            if len(calls)<3:raise HTTPError('https://example.invalid/?api_key=SECRET',429,'limited',{'Retry-After':'2'},None)
            return io.BytesIO(json.dumps(fixture()).encode())
        result=n.retrieve(n.parameters('2026-11-14',1),'test@example.invalid',opener=opener,sleeper=sleeps.append)
        self.assertEqual(result,fixture());self.assertEqual(sleeps,[2,2]);self.assertEqual(len(calls),3)
        self.assertIn('ORBITAL/0.2.0',calls[0].get_header('User-agent'))
        self.assertNotIn('api_key',calls[0].full_url)

    def test_retries_are_bounded_on_timeout_and_server_failure(self):
        for error in [TimeoutError(),URLError('SECRET'),HTTPError('SECRET',503,'oops',{},None)]:
            calls=[]
            def fail(*a,**k):calls.append(1);raise error
            with self.assertRaises(ValueError) as caught:n.retrieve({},'test@example.invalid',opener=fail,sleeper=lambda s:None)
            self.assertEqual(len(calls),3);self.assertNotIn('SECRET',str(caught.exception))

    def test_long_retry_after_stops_instead_of_violating_delay(self):
        def fail(*a,**k):raise HTTPError('SECRET',429,'limited',{'Retry-After':'3600'},None)
        with self.assertRaisesRegex(ValueError,'retry later'):n.retrieve({},'test@example.invalid',opener=fail,sleeper=lambda _:self.fail('Should not wait'))

    def test_size_limit_cancel_malformed_and_contact_requirement(self):
        with self.assertRaisesRegex(ValueError,'512 KB'):n.retrieve({},'test@example.invalid',opener=lambda *a,**k:io.BytesIO(b'x'*(n.MAX_BYTES+1)))
        with self.assertRaisesRegex(ValueError,'cancelled'):n.retrieve({},'test@example.invalid',cancel=lambda:True)
        with self.assertRaises(ValueError):n.retrieve({},'test@example.invalid',opener=lambda *a,**k:io.BytesIO(b'{bad json'))
        with self.assertRaisesRegex(ValueError,'contact'):n.retrieve({},'',opener=lambda *a,**k:self.fail('No request without contact'))


class RepositoryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.repo=n.Repository(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def test_install_restart_export_and_rollback(self):
        first=pack();self.repo.install(first)
        second=copy.deepcopy(first);d=json.loads(second['data'])
        for s in d['samples']:
            s['positionKm'][0]+=1;s['rangeKm']=sum(x*x for x in s['positionKm'])**.5;s['idealDelaySeconds']=s['rangeKm']/n.C_KM_S
        second['data']=n.canonical(d).decode();second['manifest'].update(dataSha256=n.digest(d),dataBytes=len(second['data']),packId='mars-'+n.digest(d)[:16])
        self.repo.install(second);reopened=n.Repository(self.temp.name)
        self.assertEqual(reopened.active()['active'],second['manifest']['packId'])
        reopened.rollback();self.assertEqual(reopened.active()['active'],first['manifest']['packId'])
        self.assertEqual(n.read_pack(Path(self.temp.name)/'packs'/second['manifest']['packId']/'pack.json'),second)
        with closing(sqlite3.connect(reopened.db)) as con:self.assertEqual(con.execute('SELECT COUNT(*) FROM packs').fetchone()[0],2)
    def test_invalid_and_partial_install_preserve_active(self):
        first=pack();self.repo.install(first);before=(Path(self.temp.name)/'active.json').read_bytes()
        bad=pack();bad['manifest']['dataSha256']='bad'
        with self.assertRaises(ValueError):self.repo.install(bad)
        self.assertEqual((Path(self.temp.name)/'active.json').read_bytes(),before)
        with patch.object(n.os,'replace',side_effect=OSError('disk full')):
            with self.assertRaises(OSError):n.atomic(Path(self.temp.name)/'active.json',b'bad')
        self.assertEqual((Path(self.temp.name)/'active.json').read_bytes(),before)
        self.assertEqual(list(Path(self.temp.name).glob('.staging-*')),[])
    def test_write_lock_prevents_concurrent_provider_requests(self):
        with self.repo.locked():
            with self.assertRaisesRegex(ValueError,'updater'):self.repo.install(pack())
    def test_oversized_file_and_archive_rejected_without_extraction(self):
        path=Path(self.temp.name)/'bad.json';path.write_bytes(b'x'*(n.MAX_BYTES+1))
        with self.assertRaisesRegex(ValueError,'512 KB'):n.read_pack(path)
        path.write_bytes(b'PK\x03\x04../../executable')
        with self.assertRaises(ValueError):n.read_pack(path)


if __name__=='__main__':unittest.main()
