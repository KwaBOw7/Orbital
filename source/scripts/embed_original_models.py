#!/usr/bin/env python3
"""Embed immutable original files, checking their recorded SHA-256 identities."""
from pathlib import Path
import json,base64,hashlib,re
root=Path(__file__).resolve().parents[1]
keys=['earth','moon','lander','mars-globe','mars-terrain','observatory','rocket','asteroid','night-sky','rover']
manifest=json.loads((root/'assets/originals/SHA256SUMS.json').read_text())
assets={}
for key,(name,digest) in zip(keys,manifest.items(),strict=True):
 data=(root/'assets/originals'/name).read_bytes()
 if hashlib.sha256(data).hexdigest()!=digest:raise ValueError('Original asset changed: '+name)
 labels=[]
 if key in ('rocket','observatory'):
  info=re.search(r'var info=\{(.*?)\n\};',data.decode(),re.S).group(1)
  labels=re.findall(r"\w+:'([^']+)'",info)
 assets[key]={'title':name.rsplit('.',1)[0],'filename':name,'format':name.rsplit('.',1)[1],'base64':base64.b64encode(data).decode(),'sha256':digest,'labels':labels}
(root/'assets/models/original-data.js').write_text('const ORBITAL_ORIGINAL_ASSETS='+json.dumps(assets,separators=(',',':'))+';\n')
