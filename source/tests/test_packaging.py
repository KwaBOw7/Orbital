"""Generated launcher contracts and Linux service startup with mocked provider data."""
import importlib.util
import json
import os
from pathlib import Path
import re
import select
import shutil
import signal
import subprocess
import tempfile
import unittest
from urllib.request import urlopen

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('packaging_release',ROOT/'scripts/package_release.py')
pkg=importlib.util.module_from_spec(spec);spec.loader.exec_module(pkg)

class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='orbital launcher ')
        self.root=Path(self.temp.name);pkg.write_launchers(self.root)
    def tearDown(self):self.temp.cleanup()
    def test_play_launchers_use_same_nasa_gate_and_missing_key_never_prints_url(self):
        for extension in ('Linux.sh','macOS.command','Windows.cmd'):
            self.assertEqual((self.root/('Play-'+extension)).read_bytes(),(self.root/('Start-NASA-'+extension)).read_bytes())
        shutil.copy2(ROOT/'launcher.py',self.root/'launcher.py')
        (self.root/'tools').mkdir()
        shutil.copy2(ROOT/'tools/nasa_data.py',self.root/'tools/nasa_data.py')
        result=subprocess.run(['/bin/sh',str(self.root/'Play-Linux.sh'),'--port','0','--no-browser'],
                              capture_output=True,text=True,timeout=6)
        self.assertEqual(result.returncode,1)
        self.assertIn('API.txt is missing',result.stderr)
        self.assertNotIn('127.0.0.1:',result.stdout)
        result=subprocess.run(['/bin/sh',str(self.root/'Play-Linux.sh'),'--offline'],
                              capture_output=True,text=True,timeout=6)
        self.assertEqual(result.returncode,1)
        self.assertIn('verification is required',result.stderr)
    def test_missing_python_has_actionable_error_and_macos_script_parses(self):
        result=subprocess.run(['/bin/sh',str(self.root/'Start-NASA-Linux.sh')],env={**os.environ,'PATH':''},capture_output=True,text=True)
        # dirname is external; use a controlled PATH containing only that utility.
        bindir=self.root/'bin';bindir.mkdir();(bindir/'dirname').symlink_to(shutil.which('dirname'))
        result=subprocess.run(['/bin/sh',str(self.root/'Start-NASA-Linux.sh')],env={**os.environ,'PATH':str(bindir)},capture_output=True,text=True)
        self.assertEqual(result.returncode,1);self.assertIn('Python 3 is required',result.stderr)
        subprocess.run(['/bin/sh','-n',str(self.root/'Start-NASA-macOS.command')],check=True)
        windows=(self.root/'Start-NASA-Windows.cmd').read_text();self.assertIn('py -3 "%~dp0launcher.py" %*',windows);self.assertIn('python "%~dp0launcher.py" %*',windows)
    def test_nasa_linux_launcher_serves_game_only_after_verified_provider_responses(self):
        (self.root/'tools').mkdir()
        shutil.copy2(ROOT/'tools/nasa_data.py',self.root/'tools/nasa_data.py')
        shutil.copy2(ROOT/'launcher.py',self.root/'original.py')
        (self.root/'launcher.py').write_text(
            "import original as app\n"
            "ReportSource = app.Reports\n"
            "app.Reports = lambda key, cache: ReportSource(key, cache, lambda *args: [])\n"
            "raise SystemExit(app.main())\n")
        (self.root/'API.txt').write_text('TEST_KEY_ONLY_12345')
        (self.root/'online.html').write_text('<p>gated service fixture</p>')
        process=subprocess.Popen(['/bin/sh',str(self.root/'Play-Linux.sh'),'--port','0','--no-browser','--cache-dir',str(self.root/'cache')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        try:
            ready,_,_=select.select([process.stdout],[],[],8);self.assertTrue(ready,'launcher did not print a startup URL')
            line=process.stdout.readline()+process.stdout.readline();match=re.search(r'http://127\.0\.0\.1:\d+',line);self.assertIsNotNone(match,line);base=match.group(0)
            with urlopen(base+'/api/nasa/status',timeout=3) as response:status=json.load(response)
            self.assertTrue(status['ready'])
            self.assertNotIn('TEST_KEY_ONLY',json.dumps(status))
            with urlopen(base,timeout=3) as response:self.assertIn(b'gated service fixture',response.read())
        finally:
            process.send_signal(signal.SIGINT)
            try:process.communicate(timeout=3)
            except subprocess.TimeoutExpired:process.kill();process.communicate()
