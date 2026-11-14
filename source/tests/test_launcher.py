"""Launcher mocks and local security checks, separate from live ingestion evidence."""
from datetime import datetime, timedelta, timezone
from email.message import Message
import importlib.util
import io
import json
from pathlib import Path
from types import SimpleNamespace
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

spec=importlib.util.spec_from_file_location('launcher',Path(__file__).resolve().parents[1]/'launcher.py')
l=importlib.util.module_from_spec(spec);spec.loader.exec_module(l)


def sample(name):
    return {'flares':[{'flrID':'f1','beginTime':'2026-11-14T01:00Z','classType':'M1.2','peakTime':None}], 'storms':[{'gstID':'s1','startTime':'2026-11-14T02:00Z','allKpIndex':[{'kpIndex':5}]}], 'cmes':[{'activityID':'c1','startTime':'2026-11-14T03:00Z','cmeAnalyses':[{'isMostAccurate':True,'speed':500}]}]}[name]


class LauncherTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);self.key=self.root/'API.txt';self.key.write_text('TEST_KEY_ONLY_12345');self.calls=[]
    def tearDown(self):self.temp.cleanup()
    def fetcher(self,name,key,start,end,cancelled):
        self.calls.append(name)
        self.assertEqual(key,'TEST_KEY_ONLY_12345')
        self.assertEqual((datetime.fromisoformat(end)-datetime.fromisoformat(start)).days,7)
        return l.normalize(name,sample(name))
    def reports(self,offline=False):return l.Reports(self.key,self.root/'cache',offline,self.fetcher)
    def test_normalization_preserves_unknown_and_expected_units(self):
        s=sample('cmes');s[0]['cmeAnalyses']=None
        self.assertIsNone(l.normalize('cmes',s)[0]['speedKmS'])
        self.assertEqual(l.normalize('storms',sample('storms'))[0]['maxKp'],5)
        self.assertEqual(l.normalize('flares',sample('flares'))[0]['observedAt'],'2026-11-14T01:00:00Z')
    def test_invalid_duplicate_and_out_of_range_events_rejected(self):
        for name,payload in [('flares',[*sample('flares'),*sample('flares')]),('storms',[{'gstID':'x','startTime':'bad'}]),('cmes',[{'activityID':'x','startTime':'2026-11-14','cmeAnalyses':[{'speed':float('nan')}]}])]:
            with self.assertRaises(ValueError):l.normalize(name,payload)
    def test_key_file_validation_and_bom(self):
        self.assertEqual(l.read_key(self.key),'TEST_KEY_ONLY_12345')
        self.key.write_text('\ufeffTEST_KEY_ONLY_12345\n');self.assertEqual(l.read_key(self.key),'TEST_KEY_ONLY_12345')
        self.key.write_text('api_key=SECRET')
        with self.assertRaises(ValueError):l.read_key(self.key)
    def test_offline_and_missing_key_make_zero_requests(self):
        r=self.reports(True);r.update();self.assertEqual(self.calls,[])
        self.key.unlink();r=self.reports();r.update();self.assertEqual(self.calls,[]);self.assertEqual(r.mode,'offline')
    def test_live_mode_is_sequential_cache_survives_restart_without_key(self):
        r=self.reports();r.update();self.assertEqual(self.calls,['flares','storms','cmes']);self.assertEqual(r.state()['status'],'current')
        raw=(self.root/'cache/reports.json').read_text();self.assertNotIn('TEST_KEY_ONLY_12345',raw)
        self.key.unlink();restarted=self.reports();self.assertEqual(restarted.state()['status'],'offline');self.assertIsNotNone(restarted.state()['report'])
    def test_partial_failure_retains_previous_cache_and_shows_stale(self):
        r=self.reports();r.update();before=(self.root/'cache/reports.json').read_bytes()
        def fail(name,*args):
            if name=='storms':raise ValueError('NASA unavailable')
            return l.normalize(name,sample(name))
        r.fetcher=fail;r.update();self.assertEqual((self.root/'cache/reports.json').read_bytes(),before);self.assertEqual(r.state()['status'],'stale')
    def test_atomic_write_failure_keeps_previous_cache(self):
        r=self.reports();r.update();before=(self.root/'cache/reports.json').read_bytes()
        with patch.object(l.os,'replace',side_effect=OSError('disk full')):r.update()
        self.assertEqual((self.root/'cache/reports.json').read_bytes(),before);self.assertEqual(list((self.root/'cache').glob('.staging-*')),[])
    def test_offline_preference_survives_restart_and_disables_updates(self):
        r=self.reports();r.control('offline');r.update();self.assertEqual(self.calls,[]);self.assertEqual(self.reports().mode,'offline')
    def test_manual_refresh_throttle(self):
        r=self.reports();r.update()
        with self.assertRaisesRegex(ValueError,'one minute'):r.control('refresh')
    def test_bad_key_and_errors_do_not_leak_credential_urls(self):
        def fail(*args,**kwargs):raise HTTPError('https://api.nasa.gov/?api_key=SECRET',403,'bad',{},None)
        with self.assertRaises(ValueError) as error:l.download('flares','SECRET','2026-11-13','2026-11-14',threading.Event(),opener=fail)
        self.assertNotIn('SECRET',str(error.exception));self.assertIn('key',str(error.exception))
    def test_retry_after_and_size_bounds(self):
        attempts=[]
        class Cancel:
            def is_set(self):return False
            def wait(self,delay):attempts.append(delay)
        def fail(*args,**kwargs):raise HTTPError('SECRET',429,'limited',{'Retry-After':'1'},None)
        with self.assertRaises(ValueError):l.download('flares','SECRET','2026-11-13','2026-11-14',Cancel(),opener=fail)
        self.assertEqual(attempts,[1,1])
        with self.assertRaisesRegex(ValueError,'1 MB'):l.download('flares','x','2026-11-13','2026-11-14',threading.Event(),opener=lambda *a,**k:io.BytesIO(b'x'*(l.MAX_BYTES+1)))
    def test_schedule_uses_900_real_seconds_and_reuses_fresh_cache(self):
        r=self.reports();r.update();restarted=self.reports()
        self.assertGreater(restarted.last_attempt,0)
        clock=[1000];calls=[];r.last_attempt=1000
        class Stop:
            def __init__(self):self.steps=0
            def is_set(self):return self.steps>=3
            def wait(self,_):
                clock[0]=[1899,1900,1901][self.steps];self.steps+=1
        r.stop=Stop()
        def update():calls.append(clock[0]);r.last_attempt=clock[0]
        r.update=update
        with patch.object(l.time,'monotonic',side_effect=lambda:clock[0]):r.schedule()
        self.assertEqual(calls,[1900])
    def test_local_routes_deny_key_traversal_cross_origin_and_dns_rebinding(self):
        r=self.reports(True);cls=l.handler_for(r,self.root)
        def handler(path,host='127.0.0.1:8765',origin=None):
            h=cls.__new__(cls);h.server=SimpleNamespace(server_port=8765);h.headers=Message();h.headers['Host']=host
            if origin:h.headers['Origin']=origin
            h.path=path;h.send_error=lambda code:setattr(h,'code',code);h.reply=lambda value,code=200,**kw:setattr(h,'code',code);return h
        for path in ['/API.txt','/../API.txt','/source/launcher.py','/api/arbitrary?url=https://example.com']:
            h=handler(path);h.do_GET();self.assertEqual(h.code,404)
        h=handler('/api/nasa/status',host='evil.example:8765');h.do_GET();self.assertEqual(h.code,403)
        h=handler('/api/nasa/mode',origin='https://evil.example');h.do_POST();self.assertEqual(h.code,403)
        h=handler('/api/nasa/status');h.do_GET();self.assertEqual(h.code,200)


if __name__=='__main__':unittest.main()
