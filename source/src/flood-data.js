/* Strict local import for the dated UNOSAT Sentinel-1 flood observation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrbitalFloodData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PRODUCT_URL='https://unosat.org/products/3705';
const PRODUCT_ID='3705';
const MAX_FEATURES=100000;
const radians=x=>x*Math.PI/180;
function haversineKm(a,b){const dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon),q=Math.sin(dLat/2)**2+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLon/2)**2;return 6371.0088*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));}
const GRID_SIDE=32, SUBSAMPLES=4, RADIUS_KM=6371.0088;
const UNAUTHENTICATED='User-supplied; source not independently authenticated';
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function parsePolygons(features){
 const polygons=[],bounds={minLon:Infinity,maxLon:-Infinity,minLat:Infinity,maxLat:-Infinity};
 let coordinateCount=0;
 for(const feature of features){
  const geometry=feature?.geometry;
  if(feature?.type!=='Feature'||!['Polygon','MultiPolygon'].includes(geometry?.type))throw Error('Import Polygon or MultiPolygon features only');
  const parts=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  if(!Array.isArray(parts)||!parts.length)throw Error('Empty flood geometry');
  for(const polygon of parts){
   if(!Array.isArray(polygon)||!polygon.length)throw Error('A polygon needs an exterior ring');
   for(const ring of polygon){
    if(!Array.isArray(ring)||ring.length<4)throw Error('A polygon ring needs at least four positions');
    for(const point of ring){
     if(!Array.isArray(point)||point.length<2||point.length>3||
        !point.every(Number.isFinite)||point[0]<-2.5||point[0]>2.5||point[1]<4||point[1]>9)throw Error('Expected WGS84 longitude and latitude in the Ghana product area');
     if(++coordinateCount>300000)throw Error('Flood geometry exceeds 300,000 positions');
     bounds.minLon=Math.min(bounds.minLon,point[0]);bounds.maxLon=Math.max(bounds.maxLon,point[0]);
     bounds.minLat=Math.min(bounds.minLat,point[1]);bounds.maxLat=Math.max(bounds.maxLat,point[1]);
    }
    if(ring[0][0]!==ring.at(-1)[0]||ring[0][1]!==ring.at(-1)[1])throw Error('Polygon rings must be closed');
   }
   polygons.push(polygon);
  }
 }
 return {polygons,bounds,coordinateCount};
}
function rasterize(polygons,bounds){
 const {minLon,maxLon,minLat,maxLat}=bounds, sampleSide=GRID_SIDE*SUBSAMPLES;
 const dx=(maxLon-minLon)/sampleSide,dy=(maxLat-minLat)/sampleSide;
 if(!(dx>0&&dy>0))throw Error('The flood footprint has no area');
 const mask=Array.from({length:sampleSide},()=>new Uint8Array(sampleSide));
 for(const polygon of polygons){
  const crossings=Array.from({length:sampleSide},()=>[]);
  for(const ring of polygon){
   for(let i=1;i<ring.length;i++){
    const [x1,y1]=ring[i-1],[x2,y2]=ring[i];
    if(y1===y2)continue;
    const first=Math.max(0,Math.ceil((Math.min(y1,y2)-minLat)/dy-0.5));
    const stop=Math.min(sampleSide,Math.ceil((Math.max(y1,y2)-minLat)/dy-0.5));
    for(let j=first;j<stop;j++){
     const lat=minLat+(j+0.5)*dy;
     crossings[j].push(x1+(lat-y1)*(x2-x1)/(y2-y1));
    }
   }
  }
  for(let j=0;j<sampleSide;j++){
   const row=crossings[j].sort((a,b)=>a-b);
   for(let i=0;i+1<row.length;i+=2){
    const first=Math.max(0,Math.ceil((row[i]-minLon)/dx-0.5));
    const stop=Math.min(sampleSide,Math.ceil((row[i+1]-minLon)/dx-0.5));
    mask[j].fill(1,first,stop);
   }
  }
 }
 const cells=[];
 for(let y=0;y<GRID_SIDE;y++)for(let x=0;x<GRID_SIDE;x++){
  let areaKm2=0, weightedLon=0, weightedLat=0;
  for(let sy=y*SUBSAMPLES;sy<(y+1)*SUBSAMPLES;sy++)for(let sx=x*SUBSAMPLES;sx<(x+1)*SUBSAMPLES;sx++){
   if(!mask[sy][sx])continue;
   const bottom=minLat+sy*dy;
   const area=RADIUS_KM**2*radians(dx)*(Math.sin(radians(bottom+dy))-Math.sin(radians(bottom)));
   areaKm2+=area;
   weightedLat+=(bottom+dy/2)*area;
   weightedLon+=(minLon+(sx+0.5)*dx)*area;
  }
  if(areaKm2>0)cells.push({x,y,lon:weightedLon/areaKm2,lat:weightedLat/areaKm2,areaKm2});
 }
 if(!cells.length)throw Error('No polygon area resolved on the 128 × 128 sampling grid');
 return cells;
}
function acquisitionFrom(value){
 if(!isObject(value))return null;
 const safeText=(part,len)=>typeof part==='string'&&part.length<=len?part:null;
 const url=safeText(value.downloadUrl,600);
 const components=Array.isArray(value.components)?value.components.slice(0,4).flatMap(component=>
  isObject(component)&&safeText(component.name,240)&&typeof component.sha256==='string'&&/^[a-f0-9]{64}$/.test(component.sha256)?
   [{name:component.name,sha256:component.sha256}]:[]):[];
 return {downloadUrl:url&&/^https:\/\//i.test(url)?url:null,downloadedAt:safeText(value.downloadedAt,60),
  converterVersion:safeText(value.converterVersion,60),convertedAt:safeText(value.convertedAt,60),
  components,userAttested:value.userAttested===true};
}
function profileFromGeoJSON(value,rawText=''){
 const data=typeof value==='string'?JSON.parse(value):value,m=data?.metadata;
 if(!data||data.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length<1||data.features.length>MAX_FEATURES)throw Error('Expected a bounded GeoJSON FeatureCollection');
 if(!m||m.sourceOrganization!=='United Nations Satellite Centre (UNOSAT)'||String(m.productId)!==PRODUCT_ID||m.sourceUrl!==PRODUCT_URL||m.acquisitionDate!=='2023-10-23'||m.eventCode!=='FL20231018GHA')throw Error('The import must declare the documented Product 3705 reference metadata');
 if(!['OGC:CRS84','EPSG:4326','urn:ogc:def:crs:OGC:1.3:CRS84'].includes(m.outputCrs))throw Error('Use WGS84 longitude and latitude coordinates');
 const {polygons,bounds,coordinateCount}=parsePolygons(data.features);
 const {minLon,maxLon,minLat,maxLat}=bounds;
 const targetPoint={lon:(minLon+maxLon)/2,lat:(minLat+maxLat)/2};
 const corners=[{lon:minLon,lat:minLat},{lon:minLon,lat:maxLat},{lon:maxLon,lat:minLat},{lon:maxLon,lat:maxLat}];
 const targetRadiusKm=Math.max(...corners.map(c=>haversineKm(targetPoint,c)));
 if(!(targetRadiusKm>0&&targetRadiusKm<=250))throw Error('Flood product bounding radius is outside the supported area');
 const cells=rasterize(polygons,bounds);
 return validateProfile({schemaVersion:1,source:UNAUTHENTICATED,productId:PRODUCT_ID,eventCode:m.eventCode,sourceUrl:PRODUCT_URL,sourceOrganization:m.sourceOrganization,sensor:'Declared Sentinel-1 SAR',acquisitionDate:m.acquisitionDate,publicationDate:'2023-10-25',sourceCrs:typeof m.sourceCrs==='string'?m.sourceCrs.slice(0,100):'unknown',outputCrs:m.outputCrs,featureCount:data.features.length,coordinateCount,bounds,targetPoint,targetRadiusKm,sourceFileSha256:sha256(rawText||JSON.stringify(data)),datasetVersion:'user-polygon-grid-1',acquisition:acquisitionFrom(m.acquisition),cells,limitations:['Preliminary historical interpretation as declared by the user.','Area and access use a sampled grid and idealized geometry.']});
}
function validateProfile(p){
 if(!p||typeof p!=='object'||p.schemaVersion!==1||p.productId!==PRODUCT_ID||p.sourceUrl!==PRODUCT_URL||p.sourceOrganization!=='United Nations Satellite Centre (UNOSAT)'||p.acquisitionDate!=='2023-10-23'||p.eventCode!=='FL20231018GHA')throw Error('Invalid flood target profile');
 if(typeof p.datasetVersion!=='string'||p.datasetVersion.length>100||typeof p.sourceFileSha256!=='string'||!/^([a-f0-9]{64})$/.test(p.sourceFileSha256))throw Error('Invalid flood data identity');
 if(!p.targetPoint||!Number.isFinite(p.targetPoint.lon)||!Number.isFinite(p.targetPoint.lat)||p.targetPoint.lon<-2.5||p.targetPoint.lon>2.5||p.targetPoint.lat<4||p.targetPoint.lat>9)throw Error('Invalid flood target point');
 if(!Number.isFinite(p.targetRadiusKm)||p.targetRadiusKm<=0||p.targetRadiusKm>250||!Number.isInteger(p.featureCount)||p.featureCount<1||p.featureCount>MAX_FEATURES||!Number.isInteger(p.coordinateCount)||p.coordinateCount<4||p.coordinateCount>2000000)throw Error('Invalid flood target bounds');
 if(!Array.isArray(p.limitations)||p.limitations.length>10||p.limitations.some(x=>typeof x!=='string'||x.length>500))throw Error('Invalid flood limitations');
 let cells=null;
 if(p.cells!=null){
  if(p.datasetVersion!=='user-polygon-grid-1'||!Array.isArray(p.cells)||!p.cells.length||p.cells.length>GRID_SIDE**2)throw Error('Invalid polygon scoring grid');
  const seen=new Set();
  cells=p.cells.map(c=>{
   if(!isObject(c)||!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.x<0||c.y<0||c.x>=GRID_SIDE||c.y>=GRID_SIDE||
      !Number.isFinite(c.lon)||c.lon< -2.5||c.lon>2.5||!Number.isFinite(c.lat)||c.lat<4||c.lat>9||
      !Number.isFinite(c.areaKm2)||c.areaKm2<=0||c.areaKm2>300)throw Error('Invalid flood area cell');
   const key=c.y*GRID_SIDE+c.x;
   if(seen.has(key))throw Error('Duplicate flood cell');
   seen.add(key);
   return {x:c.x,y:c.y,lon:c.lon,lat:c.lat,areaKm2:c.areaKm2};
  });
 }else if(p.datasetVersion==='user-polygon-grid-1')throw Error('Polygon target is missing its scoring grid');
 const bounds=isObject(p.bounds)?Object.fromEntries(['minLon','maxLon','minLat','maxLat'].map(key=>[key,Number.isFinite(p.bounds[key])?p.bounds[key]:null])):null;
 return {schemaVersion:1,source:UNAUTHENTICATED,sourceStatus:'user-supplied',productId:PRODUCT_ID,sourceUrl:PRODUCT_URL,
  sourceOrganization:p.sourceOrganization,acquisitionDate:p.acquisitionDate,eventCode:p.eventCode,featureCount:p.featureCount,
  coordinateCount:p.coordinateCount,bounds,targetPoint:{lon:p.targetPoint.lon,lat:p.targetPoint.lat},targetRadiusKm:p.targetRadiusKm,
  sourceFileSha256:p.sourceFileSha256,datasetVersion:p.datasetVersion,acquisition:acquisitionFrom(p.acquisition),
  cells,areaKm2:cells?.reduce((sum,c)=>sum+c.areaKm2,0)??null,limitations:p.limitations.slice()};
}
function sha256(text){
 // Pure-JS SHA-256 keeps the offline importer available on file:// as well as localhost.
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const bytes=new TextEncoder().encode(String(text)),bitLength=bytes.length*8,padded=new Uint8Array(((bytes.length+9+63)>>6)<<6);padded.set(bytes);padded[bytes.length]=128;const view=new DataView(padded.buffer);view.setUint32(padded.length-8,Math.floor(bitLength/0x100000000));view.setUint32(padded.length-4,bitLength>>>0);
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),rotr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let off=0;off<padded.length;off+=64){for(let i=0;i<16;i++)w[i]=view.getUint32(off+i*4);for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2],s0=rotr(a,7)^rotr(a,18)^(a>>>3),s1=rotr(b,17)^rotr(b,19)^(b>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+w[i])>>>0,S0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}[a,b,c,d,e,f,g,h].forEach((v,i)=>H[i]=(H[i]+v)>>>0);}
 return H.map(v=>v.toString(16).padStart(8,'0')).join('');
}
return {PRODUCT_URL,PRODUCT_ID,UNAUTHENTICATED,profileFromGeoJSON,validateProfile,sha256,haversineKm};
});
