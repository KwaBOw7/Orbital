/* Strict local import for the dated UNOSAT Sentinel-1 flood observation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrbitalFloodData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PRODUCT_URL='https://unosat.org/products/3705';
const PRODUCT_ID='3705';
const MAX_FEATURES=100000;
const radians=x=>x*Math.PI/180;
function haversineKm(a,b){const dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon),q=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLon/2)**2;return 6371.0088*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));}
function positions(node,out){
 if(!Array.isArray(node))throw Error('UNOSAT geometry coordinates are malformed');
 if(node.length>=2&&typeof node[0]==='number'&&typeof node[1]==='number'){
  if(!Number.isFinite(node[0])||!Number.isFinite(node[1])||node[0]<-180||node[0]>180||node[1]<-90||node[1]>90)throw Error('Flood geometry contains invalid WGS84 coordinates');
  out.push([node[0],node[1]]);return;
 }
 if(!node.length)throw Error('Flood geometry contains an empty coordinate array');
 for(const child of node)positions(child,out);
}
function profileFromGeoJSON(value,rawText=''){
 const data=typeof value==='string'?JSON.parse(value):value,m=data?.metadata;
 if(!data||data.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length<1||data.features.length>MAX_FEATURES)throw Error('Expected a bounded GeoJSON FeatureCollection');
 if(!m||m.sourceOrganization!=='United Nations Satellite Centre (UNOSAT)'||String(m.productId)!==PRODUCT_ID||m.sourceUrl!==PRODUCT_URL||m.acquisitionDate!=='2023-10-23'||m.eventCode!=='FL20231018GHA')throw Error('This file is not the documented UNOSAT product 3705');
 if(!['OGC:CRS84','EPSG:4326','urn:ogc:def:crs:OGC:1.3:CRS84'].includes(m.outputCrs))throw Error('UNOSAT GeoJSON must use WGS84 longitude/latitude coordinates');
 const all=[];
 for(const f of data.features){
  if(!f||f.type!=='Feature'||!f.geometry||!['Polygon','MultiPolygon'].includes(f.geometry.type))throw Error('Only UNOSAT flood polygon features are accepted');
  const before=all.length;positions(f.geometry.coordinates,all);
  if(all.length-before<4)throw Error('Flood polygon has too few coordinate positions');
 }
 if(all.length>2_000_000)throw Error('Flood geometry exceeds the coordinate safety limit');
 let minLon=Infinity,maxLon=-Infinity,minLat=Infinity,maxLat=-Infinity;
 for(const [lon,lat] of all){minLon=Math.min(minLon,lon);maxLon=Math.max(maxLon,lon);minLat=Math.min(minLat,lat);maxLat=Math.max(maxLat,lat);}
 // Product-specific bounding box guards catch mislabeled or projected inputs.
 if(minLon < -2.5||maxLon>2.5||minLat<4.0||maxLat>9.0)throw Error('Flood geometry is outside the expected Ghana product area; check its .prj and output CRS');
 const targetPoint={lon:(minLon+maxLon)/2,lat:(minLat+maxLat)/2};
 const corners=[{lon:minLon,lat:minLat},{lon:minLon,lat:maxLat},{lon:maxLon,lat:minLat},{lon:maxLon,lat:maxLat}];
 const targetRadiusKm=Math.max(...corners.map(c=>haversineKm(targetPoint,c)));
 if(!Number.isFinite(targetRadiusKm)||targetRadiusKm<1||targetRadiusKm>250)throw Error('Flood product bounding radius is not plausible for the documented Ghana region');
 const text=rawText||JSON.stringify(data),hash=sha256(text);
 return validateProfile({schemaVersion:1,source:'UNOSAT Sentinel-1 flood observation',productId:PRODUCT_ID,eventCode:m.eventCode,sourceUrl:PRODUCT_URL,sourceOrganization:m.sourceOrganization,sensor:m.sensor||'Sentinel-1 SAR',acquisitionDate:m.acquisitionDate,publicationDate:m.publicationDate||'2023-10-25',sourceCrs:m.sourceCrs||'unknown',outputCrs:m.outputCrs,featureCount:data.features.length,coordinateCount:all.length,bounds:{minLon,maxLon,minLat,maxLat},targetPoint,targetRadiusKm,sourceFileSha256:hash,datasetVersion:'unosat-3705-2023-10-23-v1',limitations:Array.isArray(m.limitations)?m.limitations.filter(x=>typeof x==='string').slice(0,10):['Preliminary satellite interpretation; see the original UNOSAT product page.','Historical 2023 observation, not a current flood assessment.','Bounding-circle access approximation; original flood polygons are not rasterized into scoring tiles.']});
}
function validateProfile(p){
 if(!p||typeof p!=='object'||p.schemaVersion!==1||p.productId!==PRODUCT_ID||p.sourceUrl!==PRODUCT_URL||p.sourceOrganization!=='United Nations Satellite Centre (UNOSAT)'||p.acquisitionDate!=='2023-10-23'||p.eventCode!=='FL20231018GHA')throw Error('Invalid UNOSAT target profile');
 if(typeof p.datasetVersion!=='string'||p.datasetVersion.length>100||typeof p.sourceFileSha256!=='string'||!/^([a-f0-9]{64})$/.test(p.sourceFileSha256))throw Error('Invalid UNOSAT data identity');
 if(!p.targetPoint||!Number.isFinite(p.targetPoint.lon)||!Number.isFinite(p.targetPoint.lat)||p.targetPoint.lon < -2.5||p.targetPoint.lon>2.5||p.targetPoint.lat<4||p.targetPoint.lat>9)throw Error('Invalid UNOSAT target point');
 if(!Number.isFinite(p.targetRadiusKm)||p.targetRadiusKm<1||p.targetRadiusKm>250||!Number.isInteger(p.featureCount)||p.featureCount<1||p.featureCount>MAX_FEATURES||!Number.isInteger(p.coordinateCount)||p.coordinateCount<4||p.coordinateCount>2_000_000)throw Error('Invalid UNOSAT target bounds');
 if(!Array.isArray(p.limitations)||p.limitations.length>10||p.limitations.some(x=>typeof x!=='string'||x.length>500))throw Error('Invalid UNOSAT limitations');
 return JSON.parse(JSON.stringify(p));
}
function sha256(text){
 // Pure-JS SHA-256 keeps the offline importer available on file:// as well as localhost.
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const bytes=new TextEncoder().encode(String(text)),bitLength=bytes.length*8,padded=new Uint8Array(((bytes.length+9+63)>>6)<<6);padded.set(bytes);padded[bytes.length]=128;const view=new DataView(padded.buffer);view.setUint32(padded.length-8,Math.floor(bitLength/0x100000000));view.setUint32(padded.length-4,bitLength>>>0);
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),rotr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let off=0;off<padded.length;off+=64){for(let i=0;i<16;i++)w[i]=view.getUint32(off+i*4);for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2],s0=rotr(a,7)^rotr(a,18)^(a>>>3),s1=rotr(b,17)^rotr(b,19)^(b>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])>>>0,S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}[a,b,c,d,e,f,g,h].forEach((v,i)=>H[i]=(H[i]+v)>>>0);}
 return H.map(v=>v.toString(16).padStart(8,'0')).join('');
}
return {PRODUCT_URL,PRODUCT_ID,profileFromGeoJSON,validateProfile,sha256,haversineKm};
});
