#!/usr/bin/env python3
"""Convert the official UNOSAT product 3705 shapefile to WGS84 GeoJSON.

Requires pyshp and pyproj. No network access is used. The converter is bounded,
records source-component SHA-256 hashes, and preserves source attributes. It does
not claim the preliminary satellite interpretation is field-verified.
"""
from __future__ import annotations
import argparse
from datetime import date, datetime
import hashlib
import json
import math
from pathlib import Path
import sys

PRODUCT_URL = 'https://unosat.org/products/3705'
PRODUCT_TITLE = 'Satellite detected water extent over Greater Accra & Volta Region, Ghana as of 23 October 2023'
MAX_COMPONENT_BYTES = 250 * 1024 * 1024
MAX_FEATURES = 100_000

def sha256(path: Path) -> str:
    h=hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda:stream.read(1024*1024),b''):
            h.update(chunk)
    return h.hexdigest()

def json_value(value):
    if isinstance(value,(date,datetime)):
        return value.isoformat()
    if isinstance(value,bytes):
        return value.decode('utf-8','replace')
    if isinstance(value,float) and not math.isfinite(value):
        return None
    if value is None or isinstance(value,(str,int,float,bool)):
        return value
    return str(value)

def map_coords(node, transformer):
    if not isinstance(node,(list,tuple)):
        raise ValueError('Unsupported shapefile geometry coordinate')
    if len(node)>=2 and all(isinstance(v,(int,float)) and math.isfinite(v) for v in node[:2]):
        lon,lat=transformer.transform(float(node[0]),float(node[1]))
        if not math.isfinite(lon) or not math.isfinite(lat) or not (-180<=lon<=180 and -90<=lat<=90):
            raise ValueError('Projected coordinate transformed outside WGS84 bounds')
        return [lon,lat]
    return [map_coords(child,transformer) for child in node]

def convert(shp_path: Path, output: Path, source_crs=None) -> dict:
    try:
        import shapefile
        from pyproj import CRS, Transformer
    except ImportError:
        raise RuntimeError('Install the optional converter dependencies: python -m pip install pyshp pyproj') from None
    shp_path=Path(shp_path)
    if shp_path.suffix.lower()!='.shp' or not shp_path.is_file():
        raise ValueError('Input must be an existing .shp file')
    base=shp_path.with_suffix('')
    components={ext:base.with_suffix(ext) for ext in ('.shp','.shx','.dbf','.prj')}
    for ext in ('.shp','.shx','.dbf'):
        if not components[ext].is_file():
            raise ValueError(f'Missing required shapefile component: {components[ext].name}')
    if not components['.prj'].is_file() and not source_crs:
        raise ValueError('Missing .prj projection file. Supply --source-crs only after verifying the official product CRS.')
    for path in components.values():
        if path.exists() and path.stat().st_size>MAX_COMPONENT_BYTES:
            raise ValueError(f'Shapefile component exceeds {MAX_COMPONENT_BYTES//(1024*1024)} MB limit')
    if components['.prj'].is_file():
        try:
            prj_crs=CRS.from_wkt(components['.prj'].read_text(encoding='utf-8'))
        except Exception as exc:
            raise ValueError(f'Could not parse shapefile .prj: {exc}') from None
        if source_crs:
            requested=CRS.from_user_input(source_crs)
            if not requested.equals(prj_crs):
                raise ValueError('Explicit --source-crs conflicts with the shapefile .prj; refusing a silent coordinate override')
        src=prj_crs
        crs_source='shapefile .prj'
    else:
        src=CRS.from_user_input(source_crs)
        crs_source='explicit --source-crs (no .prj supplied)'
    target=CRS.from_epsg(4326)
    if not src.is_projected:
        raise ValueError('Expected a projected source CRS; inspect the official .prj and specify --source-crs explicitly')
    transformer=Transformer.from_crs(src,target,always_xy=True)
    reader=shapefile.Reader(str(shp_path),encoding='utf-8')
    try:
        fields=[f[0] for f in reader.fields[1:]]
        features=[]
        for i,sr in enumerate(reader.iterShapeRecords(),1):
            if i>MAX_FEATURES:
                raise ValueError('Shapefile exceeds the 100,000 feature limit')
            geom=sr.shape.__geo_interface__
            if not geom or geom.get('type') not in {'Polygon','MultiPolygon','LineString','MultiLineString','Point','MultiPoint'}:
                continue
            features.append({'type':'Feature','id':i,'geometry':{'type':geom['type'],'coordinates':map_coords(geom['coordinates'],transformer)},'properties':{key:json_value(value) for key,value in zip(fields,sr.record)}})
    finally:
        reader.close()
    if not features:
        raise ValueError('No supported geometries were found')
    checks={p.suffix.lower():sha256(p) for p in components.values() if p.is_file()}
    collection={
      'type':'FeatureCollection',
      'name':'UNOSAT product 3705 — satellite-detected water extent',
      'metadata':{
        'source':PRODUCT_TITLE,'sourceOrganization':'United Nations Satellite Centre (UNOSAT)',
        'sourceUrl':PRODUCT_URL,'productId':'3705','eventCode':'FL20231018GHA',
        'acquisitionDate':'2023-10-23','publicationDate':'2023-10-25',
        'sensor':'Sentinel-1 SAR','sourceCrs':src.to_string(),'sourceCrsDeterminedBy':crs_source,'outputCrs':'OGC:CRS84',
        'componentSha256':checks,
        'limitations':['Preliminary satellite interpretation; not field-validated according to UNOSAT.','Radar flood mapping may underestimate standing water in built-up and densely vegetated areas.','Historical 2023 product; not a current flood or emergency assessment.','Population exposure and detected-water estimates are source-study outputs, not live measurements.'],
        'licence':'Not confirmed from the official UNOSAT product page. A secondary catalogue reports CC BY-SA 4.0, but verify the live HDX resource licence and UNOSAT attribution/reuse terms before redistribution; this converter does not grant rights.',
        'licenceVerificationUrl':'https://data.humdata.org/',
      },
      'features':features
    }
    output=Path(output)
    output.parent.mkdir(parents=True,exist_ok=True)
    pretty=json.dumps(collection,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if len(pretty.encode('utf-8'))>100*1024*1024:
        raise ValueError('Converted GeoJSON exceeds the 100 MB output limit')
    output.write_text(pretty,encoding='utf-8')
    output_hash=hashlib.sha256(pretty.encode('utf-8')).hexdigest()
    return {'output':str(output),'features':len(features),'sourceCrs':src.to_string(),'sourceCrsDeterminedBy':crs_source,'outputCrs':'OGC:CRS84','outputSha256':output_hash,'sourceComponents':checks}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('shapefile',type=Path)
    parser.add_argument('--output',type=Path,default=Path('unosat-3705.geojson'))
    parser.add_argument('--source-crs',default=None,help='Only use when the .prj file is missing and the official source CRS has been independently verified; if .prj exists, this value must match it.')
    args=parser.parse_args()
    try:
        result=convert(args.shapefile,args.output,args.source_crs)
        print(json.dumps(result,indent=2))
    except (OSError,ValueError,RuntimeError) as exc:
        parser.exit(2,f'ERROR: {exc}\n')

if __name__=='__main__':
    main()
