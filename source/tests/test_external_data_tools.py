"""Validation tests for optional GMAT and UNOSAT import tooling (synthetic fixtures only)."""
from __future__ import annotations
from pathlib import Path
import importlib.util
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,ROOT/path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module

gmat=load('gmat_oem',Path('tools/gmat_oem.py'))

OEM_TEMPLATE='''CCSDS_OEM_VERS = 2.0
CREATION_DATE = 2026-11-15T00:00:00
ORIGINATOR = SYNTHETIC TEST ONLY
META_START
OBJECT_NAME = ORBITAL TEST SATELLITE
OBJECT_ID = 2026-001A
CENTER_NAME = Earth
REF_FRAME = EarthMJ2000Eq
TIME_SYSTEM = UTC
START_TIME = 2026-11-14T00:00:00.000
STOP_TIME = 2026-11-14T00:02:00.000
META_STOP
2026-11-14T00:00:00.000 7078.137 0 0 0 7.5 0
2026-11-14T00:01:00.000 7078.137 0 0 0 7.5 0
2026-11-14T00:02:00.000 7078.137 0 0 0 7.5 0
'''

class GmatOemTests(unittest.TestCase):
    def write(self,root,name,text):
        path=root/name;path.write_text(text,encoding='ascii');return path
    def test_parse_earth_centered_utc_oem(self):
        with tempfile.TemporaryDirectory() as td:
            data=gmat.parse_oem(self.write(Path(td),'sample.oem',OEM_TEMPLATE))
        self.assertEqual(len(data['samples']),3)
        self.assertEqual(data['metadata']['REF_FRAME'],'EarthMJ2000Eq')
    def test_reject_non_earth_centered_non_utc_and_nonmonotonic(self):
        for bad in [OEM_TEMPLATE.replace('CENTER_NAME = Earth','CENTER_NAME = Sun'),OEM_TEMPLATE.replace('TIME_SYSTEM = UTC','TIME_SYSTEM = TDB'),OEM_TEMPLATE.replace('REF_FRAME = EarthMJ2000Eq','REF_FRAME = ITRF93'),OEM_TEMPLATE.replace('2026-11-14T00:01:00.000 7078.137','2026-11-14T00:00:00.000 7078.137')]:
            with tempfile.TemporaryDirectory() as td:
                path=self.write(Path(td),'bad.oem',bad)
                with self.assertRaises(ValueError):gmat.parse_oem(path)
    def test_compare_dense_and_coarse_ephemerides(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)
            coarse=self.write(root,'coarse.oem',OEM_TEMPLATE.replace('2026-11-14T00:01:00.000 7078.137 0 0 0 7.5 0\n',''))
            dense=self.write(root,'dense.oem',OEM_TEMPLATE)
            report=gmat.compare_oem(gmat.parse_oem(dense),gmat.parse_oem(coarse))
        self.assertEqual(report['comparedEpochs'],3)
        self.assertGreaterEqual(report['positionErrorKm']['rms'],0)

class UnosatImporterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            import shapefile, pyproj
            cls.shapefile=shapefile
        except ImportError:
            cls.shapefile=None
    @unittest.skipUnless(__import__('importlib').util.find_spec('shapefile') and __import__('importlib').util.find_spec('pyproj'),'optional GIS dependencies are unavailable')
    def test_shapefile_is_projected_to_wgs84_and_hashes_are_recorded(self):
        tool=load('import_unosat',Path('tools/import_unosat_shapefile.py'))
        import shapefile, pyproj, json
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);base=root/'sample'
            w=shapefile.Writer(str(base),shapeType=shapefile.POLYGON)
            w.field('Area_m2','N',decimal=2);w.poly([[(500000,600000),(500000,600100),(500100,600100),(500100,600000),(500000,600000)]]);w.record(10000);w.close()
            base.with_suffix('.prj').write_text(pyproj.CRS.from_epsg(32631).to_wkt())
            output=root/'out.geojson';result=tool.convert(base.with_suffix('.shp'),output)
            data=json.loads(output.read_text())
            output_hash_actual=__import__('hashlib').sha256(output.read_bytes()).hexdigest()
        self.assertEqual(result['features'],1)
        self.assertEqual(data['metadata']['productId'],'3705')
        self.assertIn('.shp',data['metadata']['componentSha256'])
        lon,lat=data['features'][0]['geometry']['coordinates'][0][0]
        self.assertAlmostEqual(lon,3.0,places=3)
        self.assertTrue(5<lat<6)
        self.assertTrue(any('not field-validated' in item for item in data['metadata']['limitations']))
        self.assertEqual(data['metadata']['sourceCrsDeterminedBy'],'shapefile .prj')
        self.assertEqual(result['outputSha256'],output_hash_actual)

    @unittest.skipUnless(__import__('importlib').util.find_spec('shapefile') and __import__('importlib').util.find_spec('pyproj'),'optional GIS dependencies are unavailable')
    def test_projection_must_come_from_prj_or_be_explicit_and_conflicts_are_rejected(self):
        import shapefile, pyproj
        tool=load('import_unosat',Path('tools/import_unosat_shapefile.py'))
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);base=root/'sample';w=shapefile.Writer(str(base),shapeType=shapefile.POLYGON);w.field('Area_m2','N');w.poly([[(500000,600000),(500100,600000),(500100,600100),(500000,600100),(500000,600000)]]);w.record(10000);w.close()
            shp=base.with_suffix('.shp');prj=base.with_suffix('.prj');prj.write_text(pyproj.CRS.from_epsg(32631).to_wkt())
            with self.assertRaisesRegex(ValueError,'conflicts'):
                tool.convert(shp,root/'bad.geojson','EPSG:32632')
            prj.unlink()
            with self.assertRaisesRegex(ValueError,'Missing .prj'):
                tool.convert(shp,root/'missing.geojson')
            explicit=tool.convert(shp,root/'explicit.geojson','EPSG:32631')
            self.assertEqual(explicit['sourceCrsDeterminedBy'],'explicit --source-crs (no .prj supplied)')

if __name__=='__main__':unittest.main()
