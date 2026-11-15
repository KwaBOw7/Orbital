"""Generated launcher contracts and real Linux offline service startup."""
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
    def test_offline_script_opens_html_without_starting_python(self):
        bindir=self.root/'bin';bindir.mkdir();stub=bindir/'xdg-open';stub.write_text('#!/bin/sh\nprintf "%s" "$1"\n');stub.chmod(0o755)
        result=subprocess.run(['/bin/sh',str(self.root/'Play-Linux.sh')],env={**os.environ,'PATH':str(bindir)+':/usr/bin:/bin'},capture_output=True,text=True,check=True)
        self.assertEqual(result.stdout,str(self.root/'index.html'))
    def test_missing_python_has_actionable_error_and_macos_script_parses(self):
        result=subprocess.run(['/bin/sh',str(self.root/'Start-NASA-Linux.sh')],env={**os.environ,'PATH':''},capture_output=True,text=True)
        # dirname is external; use a controlled PATH containing only that utility.
        bindir=self.root/'bin';bindir.mkdir();(bindir/'dirname').symlink_to(shutil.which('dirname'))
        result=subprocess.run(['/bin/sh',str(self.root/'Start-NASA-Linux.sh')],env={**os.environ,'PATH':str(bindir)},capture_output=True,text=True)
        self.assertEqual(result.returncode,1);self.assertIn('Python 3 is required',result.stderr)
        subprocess.run(['/bin/sh','-n',str(self.root/'Start-NASA-macOS.command')],check=True)
        windows=(self.root/'Start-NASA-Windows.cmd').read_text();self.assertIn('py -3 "%~dp0launcher.py" %*',windows);self.assertIn('python "%~dp0launcher.py" %*',windows)
    def test_project_and_third_party_licenses_are_copied_to_release_root_and_source(self):
        with tempfile.TemporaryDirectory(prefix='orbital source copy ') as temp:
            target=Path(temp)
            pkg.copy_sources(target)
            for name in ('LICENSE','NOTICE','THIRD-PARTY-NOTICES.md'):
                self.assertTrue((target/name).is_file(),name)
        with tempfile.TemporaryDirectory(prefix='orbital root metadata ') as temp:
            target=Path(temp)
            pkg.copy_root_metadata(target)
            for name in ('LICENSE','NOTICE','THIRD-PARTY-NOTICES.md'):
                self.assertTrue((target/name).is_file(),name)
    def test_nasa_linux_launcher_starts_real_offline_service_in_spaced_path(self):
        shutil.copy2(ROOT/'launcher.py',self.root/'launcher.py');shutil.copy2(ROOT/'version.json',self.root/'version.json');(self.root/'online.html').write_text('<p>offline service fixture</p>')
        process=subprocess.Popen(['/bin/sh',str(self.root/'Start-NASA-Linux.sh'),'--port','0','--offline','--no-browser','--cache-dir',str(self.root/'cache')],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
        try:
            ready,_,_=select.select([process.stdout],[],[],8);self.assertTrue(ready,'launcher did not print a startup URL')
            line=process.stdout.readline();match=re.search(r'http://127\.0\.0\.1:\d+',line);self.assertIsNotNone(match,line);base=match.group(0)
            with urlopen(base+'/api/nasa/status',timeout=3) as response:status=json.load(response)
            self.assertEqual(status['mode'],'offline')
            with urlopen(base,timeout=3) as response:self.assertIn(b'offline service fixture',response.read())
        finally:
            process.send_signal(signal.SIGINT)
            try:process.communicate(timeout=3)
            except subprocess.TimeoutExpired:process.kill();process.communicate()
