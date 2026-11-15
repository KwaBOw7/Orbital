/* Pack validation and local geometry. No provider requests or simulation dependencies. */
(function(root, factory) {
 const isNode = typeof module === 'object';
 const release = isNode ? require('../version.json') : ORBITAL_RELEASE;
 const api = factory(release);
 if (isNode) module.exports = api;
 else root.OrbitalPacks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(release) {
'use strict';
const MAX=512000,C=299792.458,clone=v=>JSON.parse(JSON.stringify(v));
const versionedPackApps = new Set([release.appVersion, ...release.earlierHorizonsPackAppVersions]);
function sha256(text){
 const bytes=new TextEncoder().encode(text),size=Math.ceil((bytes.length+9)/64)*64,buffer=new Uint8Array(size);buffer.set(bytes);buffer[bytes.length]=128;
 const view=new DataView(buffer.buffer);view.setUint32(size-4,bytes.length*8);
 const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
 const k=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
 const r=(x,n)=>(x>>>n)|(x<<(32-n)),w=new Uint32Array(64);
 for(let offset=0;offset<size;offset+=64){for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2];w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(b,17)^r(b,19)^(b>>>10)))>>>0;}let[a,b,c,d,e,f,g,j]=h;for(let i=0;i<64;i++){const t=(j+(r(e,6)^r(e,11)^r(e,25))+((e&f)^(~e&g))+k[i]+w[i])>>>0,u=((r(a,2)^r(a,13)^r(a,22))+((a&b)^(a&c)^(b&c)))>>>0;j=g;g=f;f=e;e=(d+t)>>>0;d=c;c=b;b=a;a=(t+u)>>>0;}[a,b,c,d,e,f,g,j].forEach((v,i)=>h[i]=(h[i]+v)>>>0);}
 return [...h].map(n=>n.toString(16).padStart(8,'0')).join('');
}
const fail=message=>{throw Error(message);};
const epoch=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,19)+'Z'!==s)fail('Invalid UTC epoch');return Date.parse(s);};
function validate(pack){
 if(!pack||Object.keys(pack).sort().join(',')!=='data,manifest'||JSON.stringify(pack).length>MAX)fail('Invalid or oversized data pack');
 const m=pack.manifest;if(!m||m.schemaVersion!==1||m.packVersion!==1||m.kind!=='earth-mars-geometry')fail('Incompatible data pack');
 const versions=JSON.stringify(m.compatibleGameVersions);
 const legacy=m.formatId===undefined&&m.interpolation===undefined&&versions==='["0.2.0"]';
 const previousCompat=m.formatId===undefined&&m.interpolation===undefined&&versions==='["0.3.1","0.3.2"]';
 // v0.3.3 predates explicit application/dataset/interpolation compatibility fields.
 // Admit only its exact format, interpolation and adapter fingerprint; versioned packs remain strict.
 const legacyV033=m.formatId==='orbital.earth-mars-v1'&&m.interpolation==='cubic-hermite-position-velocity-v1'&&m.applicationVersion===undefined&&m.compatibleGameVersions===undefined&&m.datasetVersion===undefined&&m.interpolationVersion===undefined&&m.adapterVersion==='horizons-vector-1';
 const versioned = versionedPackApps.has(m.applicationVersion)
  && versions === JSON.stringify([m.applicationVersion])
  && m.formatId === 'orbital.earth-mars-v1'
  && m.interpolation === 'cubic-hermite-position-velocity-v1'
  && m.datasetVersion === release.horizonsDatasetVersion
  && m.interpolationVersion === release.interpolationVersion;
 if(!legacy&&!previousCompat&&!legacyV033&&!versioned)fail('Unsupported pack format, application or interpolation version');
 if(typeof pack.data!=='string'||/[^\x00-\x7f]/.test(pack.data)||m.dataBytes!==pack.data.length||m.dataSha256!==sha256(pack.data)||m.packId!=='mars-'+m.dataSha256.slice(0,16))fail('Data checksum mismatch');
 if(m.endpoint!=='https://ssd.jpl.nasa.gov/api/horizons.api'||m.documentation!=='https://ssd-api.jpl.nasa.gov/doc/horizons.html'||m.frame!=='ICRF'||m.origin!=='Earth geocenter (399)'||m.timeScale!=='UTC'||!Array.isArray(m.assets)||m.assets.length||m.revision?.apiVersion!=='1.3')fail('Unsupported source or geometry');
 if(m.rawUnits?.position!=='km'||m.rawUnits?.velocity!=='km/s'||m.normalizedUnits?.range!=='km'||m.normalizedUnits?.idealDelay!=='s')fail('Unsupported units');
 epoch(m.createdAt);epoch(m.acquiredAt);if(m.observationTime!==null)fail('Geometry is calculated, not observed');
 const d=JSON.parse(pack.data);if(Object.keys(d).join(',')!=='samples'||!Array.isArray(d.samples)||d.samples.length<25||d.samples.length>169)fail('Invalid sample table');
 let previous;for(const s of d.samples){if(Object.keys(s).sort().join(',')!=='epochUtc,idealDelaySeconds,positionKm,rangeKm,velocityKmS')fail('Unknown sample fields');const t=epoch(s.epochUtc);if(previous!==undefined&&t-previous!==3600000)fail('Duplicate or missing epoch');previous=t;for(const field of ['positionKm','velocityKmS'])if(!Array.isArray(s[field])||s[field].length!==3||!s[field].every(Number.isFinite))fail('Invalid or missing vector');const range=Math.hypot(...s.positionKm);if(!(range>1e6&&range<1e9)||s.velocityKmS.some(v=>Math.abs(v)>200)||!Number.isFinite(s.rangeKm)||!Number.isFinite(s.idealDelaySeconds)||Math.abs(s.rangeKm-range)>1e-5||Math.abs(s.idealDelaySeconds-range/C)>1e-8)fail('Invalid range or light-time conversion');}
 const first=d.samples[0].epochUtc,last=d.samples.at(-1).epochUtc;
 if(m.coverage?.start!==first||m.coverage?.end!==last||m.coverage?.stepSeconds!==3600)fail('Coverage mismatch');
 const q=m.request;if(!q||q.COMMAND!=="'499'"||q.CENTER!=="'500@399'"||q.EPHEM_TYPE!=="'VECTORS'"||q.VEC_CORR!=="'NONE'"||q.TIME_TYPE!=="'UT'"||q.OUT_UNITS!=="'KM-S'"||q.REF_SYSTEM!=="'ICRF'"||q.REF_PLANE!=="'FRAME'"||q.VEC_TABLE!=="'2'"||q.STEP_SIZE!=="'1 h'"||q.START_TIME!=="'"+first.slice(0,10)+"'"||q.STOP_TIME!=="'"+last.slice(0,10)+"'")fail('Request provenance mismatch');
 const clean=clone(pack);
 clean.manifest.provenanceStatus='provider-unverified';
 return clean;
}
function geometry(pack,at){
 if(!pack)return {status:'missing'};const t=typeof at==='number'?at:epoch(at),m=pack.manifest;
 if(!Number.isFinite(t)||t<epoch(m.coverage.start)||t>epoch(m.coverage.end))return {status:'outside'};
 const samples=JSON.parse(pack.data).samples,offset=(t-epoch(m.coverage.start))/3600000,lo=Math.floor(offset),hi=Math.min(samples.length-1,lo+1),a=samples[lo],b=samples[hi];
 const requestedEpochUtc=new Date(t).toISOString();
 if(t===epoch(a.epochUtc)||lo===hi)return {status:'calculated',...clone(a),requestedEpochUtc,sampleOffsetSeconds:0,method:'sample',bracketEpochs:[a.epochUtc,a.epochUtc]};
 // Application-derived cubic Hermite interpolation using endpoint positions (km)
 // and velocities (km/s). It is not a new Horizons observation or accuracy guarantee.
 const h=(epoch(b.epochUtc)-epoch(a.epochUtc))/1000,u=(t-epoch(a.epochUtc))/1000/h,u2=u*u,u3=u2*u;
 const positionKm=a.positionKm.map((p,i)=>(2*u3-3*u2+1)*p+(u3-2*u2+u)*h*a.velocityKmS[i]+(-2*u3+3*u2)*b.positionKm[i]+(u3-u2)*h*b.velocityKmS[i]);
 const velocityKmS=a.positionKm.map((p,i)=>((6*u2-6*u)*p+(-6*u2+6*u)*b.positionKm[i])/h+(3*u2-4*u+1)*a.velocityKmS[i]+(3*u2-2*u)*b.velocityKmS[i]);
 const rangeKm=Math.hypot(...positionKm);
 return {status:'calculated',epochUtc:requestedEpochUtc,requestedEpochUtc,positionKm,velocityKmS,rangeKm,idealDelaySeconds:rangeKm/C,sampleOffsetSeconds:0,method:'cubic-hermite',bracketEpochs:[a.epochUtc,b.epochUtc]};
}
return {validate,geometry,sha256,epoch,MAX};
});
