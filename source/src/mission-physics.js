/*
 * ORBITAL mission physics: deterministic educational calculations.
 * The models are intentionally bounded and their assumptions are published in the UI.
 * They are not flight-dynamics, SAR processor, RF certification, or thermal-vacuum tools.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OrbitalPhysics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const C={
  earthMu:3.986004418e14, earthRadius:6378137, earthRotation:7.2921150e-5,
  marsMu:4.282837e13, marsRadius:3389500, marsGravity:3.711,
  solarFlux:1361, speedOfLight:299792458, boltzmann:1.380649e-23,
  sigma:5.670374419e-8, g0:9.80665
};
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function julianDate(iso){const ms=Date.parse(iso);if(!Number.isFinite(ms))throw Error('Invalid orbit epoch');return ms/86400000+2440587.5;}
function gmstRadians(jd){const T=(jd-2451545)/36525;const seconds=67310.54841+(876600*3600+8640184.812866)*T+0.093104*T*T-6.2e-6*T*T*T;return ((seconds*Math.PI/43200)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);}
function sunVector(iso,elapsedSeconds=0){
 const jd=julianDate(iso)+elapsedSeconds/86400,n=jd-2451545.0,g=rad((357.529+0.98560028*n)%360),q=rad((280.459+0.98564736*n)%360);
 const lambda=q+rad(1.915)*Math.sin(g)+rad(.020)*Math.sin(2*g),eps=rad(23.439-.00000036*n);
 const ra=Math.atan2(Math.cos(eps)*Math.sin(lambda),Math.cos(lambda)),dec=Math.asin(Math.sin(eps)*Math.sin(lambda));
 return [Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];
}
function orbitElements(orbit){
 const altitudeKm=Number(orbit.semiMajorAxisAltitudeKm??orbit.altitudeKm??orbit.altitude);
 if(!(altitudeKm>0&&altitudeKm<1000))throw Error('Orbit semi-major-axis altitude is outside the educational model bounds');
 const e=Number(orbit.eccentricity??0),inclinationDeg=Number(orbit.inclinationDeg??51.6),raanDeg=Number(orbit.raanDeg??0),argumentOfPerigeeDeg=Number(orbit.argumentOfPerigeeDeg??0),meanAnomalyDeg=Number(orbit.meanAnomalyDeg??0),epochUtc=orbit.epochUtc||'2026-11-14T00:00:00Z';
 if(!(Number.isFinite(e)&&e>=0&&e<=0.2))throw Error('This release supports Earth-orbit eccentricity only in the range 0 ≤ e ≤ 0.2');
 if(![inclinationDeg,raanDeg,argumentOfPerigeeDeg,meanAnomalyDeg].every(Number.isFinite)||inclinationDeg<0||inclinationDeg>180||![epochUtc].every(x=>typeof x==='string'&&Number.isFinite(Date.parse(x))))throw Error('Invalid Earth orbit elements or epoch');
 return {a:C.earthRadius+altitudeKm*1000,e,i:rad(inclinationDeg),raan:rad(raanDeg),argPerigee:rad(argumentOfPerigeeDeg),M0:rad(meanAnomalyDeg),epochUtc};
}
function solveEccentricAnomaly(meanAnomaly,e){
 let M=((meanAnomaly%(2*Math.PI))+2*Math.PI)%(2*Math.PI),E=e<.8?M:Math.PI;
 for(let i=0;i<20;i++){const f=E-e*Math.sin(E)-M,fp=1-e*Math.cos(E),step=f/fp;E-=step;if(Math.abs(step)<1e-13)break;}
 return E;
}
function orbitPeriodSeconds(orbit){const e=orbitElements(orbit);return 2*Math.PI*Math.sqrt(e.a**3/C.earthMu);}
function rotatePerifocal(x,y,z,raan,inclination,argPerigee){
 const O=raan,i=inclination,w=argPerigee,cO=Math.cos(O),sO=Math.sin(O),ci=Math.cos(i),si=Math.sin(i),cw=Math.cos(w),sw=Math.sin(w);
 return [
  (cO*cw-sO*sw*ci)*x+(-cO*sw-sO*cw*ci)*y,
  (sO*cw+cO*sw*ci)*x+(-sO*sw+cO*cw*ci)*y,
  sw*si*x+cw*si*y+z
 ];
}
function propagateOrbit(orbit,elapsedSeconds=0){
 if(!Number.isFinite(elapsedSeconds))throw Error('Elapsed time must be finite');
 const e=orbitElements(orbit),n=Math.sqrt(C.earthMu/e.a**3),M=e.M0+n*elapsedSeconds,E=solveEccentricAnomaly(M,e.e),ce=Math.cos(E),se=Math.sin(E),q=Math.sqrt(1-e.e*e.e),r=e.a*(1-e.e*ce);
 if(r<=C.earthRadius)throw Error('Propagated orbit intersects the Earth reference sphere');
 const xpf=e.a*(ce-e.e),ypf=e.a*q*se,vscale=Math.sqrt(C.earthMu*e.a)/r,vxpf=-vscale*se,vypf=vscale*q*ce;
 const [x,y,z]=rotatePerifocal(xpf,ypf,0,e.raan,e.i,e.argPerigee),[vx,vy,vz]=rotatePerifocal(vxpf,vypf,0,e.raan,e.i,e.argPerigee);
 const jd=julianDate(e.epochUtc)+elapsedSeconds/86400,theta=gmstRadians(jd),ct=Math.cos(theta),st=Math.sin(theta);
 const ex=ct*x+st*y,ey=-st*x+ct*y,ez=z,lon=Math.atan2(ey,ex),lat=Math.atan2(ez,Math.hypot(ex,ey));
 const sun=sunVector(e.epochUtc,elapsedSeconds),sunProjection=x*sun[0]+y*sun[1]+z*sun[2],sunDot=sunProjection/r,perp=Math.sqrt(Math.max(0,r*r-sunProjection**2));
 const horizon=Math.asin(Math.min(1,C.earthRadius/r));
 return {elapsedSeconds,altitudeM:r-C.earthRadius,periodSeconds:2*Math.PI/n,meanMotion:n,eccentricity:e.e,eccentricAnomalyRad:E,positionEciM:[x,y,z],velocityEciMps:[vx,vy,vz],positionEcefM:[ex,ey,ez],latitudeDeg:deg(lat),longitudeDeg:((deg(lon)+540)%360)-180,speedMps:Math.hypot(vx,vy,vz),eclipse:sunDot<0&&perp<C.earthRadius,sunlit:!(sunDot<0&&perp<C.earthRadius),earthShadowPerpendicularM:perp,horizonAngleDeg:deg(horizon)};
}
function groundTrack(orbit,{durationSeconds=86400,stepSeconds=60}={}){
 if(!(durationSeconds>0&&stepSeconds>0&&durationSeconds<=7*86400))throw Error('Invalid ground-track sampling interval');
 const out=[];for(let t=0;t<=durationSeconds;t+=stepSeconds)out.push(propagateOrbit(orbit,t));return out;
}
function haversineKm(a,b){const p1=rad(a.lat),p2=rad(b.lat),dp=p2-p1,dl=rad(b.lon-a.lon);const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 6371.0088*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));}
function lookGeometry(orbit,target,elapsedSeconds){const s=propagateOrbit(orbit,elapsedSeconds),surface={lat:target.lat,lon:target.lon};const groundKm=haversineKm({lat:s.latitudeDeg,lon:s.longitudeDeg},surface),altitudeKm=s.altitudeM/1000;const central=groundKm/6371.0088;const incidence=deg(Math.atan2(6371.0088*Math.sin(central),altitudeKm+6371.0088*(1-Math.cos(central))));return {groundDistanceKm:groundKm,offNadirDeg:incidence,latitudeDeg:s.latitudeDeg,longitudeDeg:s.longitudeDeg};}
function accessWindows(orbit,target,{durationMinutes=4320,stepSeconds=30,minOffNadirDeg=25,maxOffNadirDeg=45,swathMarginKm=0}={}){
 const step=stepSeconds,limit=durationMinutes*60;let active=false,start=0,last=0;const windows=[];
 for(let t=0;t<=limit;t+=step){const g=lookGeometry(orbit,target,t),ok=(g.offNadirDeg>=minOffNadirDeg&&g.offNadirDeg<=maxOffNadirDeg)||g.groundDistanceKm<=swathMarginKm;
   if(ok&&!active){active=true;start=t;}if(!ok&&active){windows.push({startSeconds:start,endSeconds:t,midSeconds:(start+t)/2,durationSeconds:t-start});active=false;}if(ok)last=t;
 }
 if(active&&last>start)windows.push({startSeconds:start,endSeconds:last,midSeconds:(start+last)/2,durationSeconds:last-start});
 return windows.map(w=>({...w,startMinutes:w.startSeconds/60,endMinutes:w.endSeconds/60,midMinutes:w.midSeconds/60,durationMinutes:(w.endSeconds-w.startSeconds)/60}));
}
function groundStationElevation(orbit,station,elapsedSeconds){
 if(!station||!Number.isFinite(station.lat)||!Number.isFinite(station.lon)||station.lat< -90||station.lat>90||station.lon< -180||station.lon>180||!Number.isFinite(station.altitudeM??0))throw Error('Invalid ground-station coordinates');
 const s=propagateOrbit(orbit,elapsedSeconds),lat=rad(station.lat),lon=rad(station.lon),r=C.earthRadius+(station.altitudeM||0);
 const gx=r*Math.cos(lat)*Math.cos(lon),gy=r*Math.cos(lat)*Math.sin(lon),gz=r*Math.sin(lat),[sx,sy,sz]=s.positionEcefM,dx=sx-gx,dy=sy-gy,dz=sz-gz,range=Math.hypot(dx,dy,dz);
 const up=(dx*Math.cos(lat)*Math.cos(lon)+dy*Math.cos(lat)*Math.sin(lon)+dz*Math.sin(lat))/range;
 return {elevationDeg:deg(Math.asin(clamp(up,-1,1))),rangeM:range,visible:up>0};
}
function stationWindows(orbit,station,{durationMinutes=4320,stepSeconds=30,minElevationDeg=10}={}){
 const limit=durationMinutes*60;let active=false,start=0,last=0;const windows=[];
 for(let t=0;t<=limit;t+=stepSeconds){const p=groundStationElevation(orbit,station,t),ok=p.elevationDeg>=minElevationDeg;
  if(ok&&!active){active=true;start=t;}if(!ok&&active){windows.push({startSeconds:start,endSeconds:t});active=false;}if(ok)last=t;
 }
 if(active&&last>start)windows.push({startSeconds:start,endSeconds:last});
 return windows.map(w=>({...w,startMinutes:w.startSeconds/60,endMinutes:w.endSeconds/60,durationMinutes:(w.endSeconds-w.startSeconds)/60}));
}

function eclipseWindows(orbit,{durationMinutes=4320,stepSeconds=30}={}){
 const limit=durationMinutes*60;let active=false,start=0,last=0;const windows=[];
 for(let t=0;t<=limit;t+=stepSeconds){const ok=propagateOrbit(orbit,t).eclipse;
  if(ok&&!active){active=true;start=t;}if(!ok&&active){windows.push({startSeconds:start,endSeconds:t});active=false;}if(ok)last=t;
 }
 if(active&&last>start)windows.push({startSeconds:start,endSeconds:last});
 return windows.map(w=>({...w,startMinutes:w.startSeconds/60,endMinutes:w.endSeconds/60,durationMinutes:(w.endSeconds-w.startSeconds)/60}));
}
function stationNetworkWindows(orbit,stations,{durationMinutes=4320,stepSeconds=30,minElevationDeg=10}={}){
 const all=[];for(const station of stations||[])for(const w of stationWindows(orbit,station,{durationMinutes,stepSeconds,minElevationDeg}))all.push({...w,stationId:station.id,stationName:station.name});
 all.sort((a,b)=>a.startMinutes-b.startMinutes);const merged=[];
 for(const w of all){const last=merged.at(-1);if(last&&w.startMinutes<=last.endMinutes){last.endMinutes=Math.max(last.endMinutes,w.endMinutes);last.stationIds.push(w.stationId);last.stationNames.push(w.stationName);}else merged.push({...w,stationIds:[w.stationId],stationNames:[w.stationName]});}
 return merged;
}
function accessWindowAt(windows,timeMinutes){
 const i=windows.findIndex(w=>timeMinutes>=w.startMinutes-1e-9&&timeMinutes<w.endMinutes-1e-9);
 if(i<0)return null;const w=windows[i];return {...w,index:i};
}
function eclipseDurationMinutes(orbit){return orbitPeriodSeconds(orbit)/60;}

function propagateMarsOrbit(orbit,elapsedSeconds=0){
 if(!Number.isFinite(elapsedSeconds))throw Error('Elapsed Mars-orbit time must be finite');
 const altitude=Number(orbit.semiMajorAxisAltitudeKm??orbit.altitudeKm??400)*1000,e=Number(orbit.eccentricity??0);
 if(!(altitude>0&&altitude<2000000&&Number.isFinite(e)&&e>=0&&e<=.2))throw Error('Mars relay orbit outside educational model bounds');
 const inclinationDeg=Number(orbit.inclinationDeg??25),raanDeg=Number(orbit.raanDeg??0),argumentOfPerigeeDeg=Number(orbit.argumentOfPerigeeDeg??0),meanAnomalyDeg=Number(orbit.meanAnomalyDeg??0);
 if(![inclinationDeg,raanDeg,argumentOfPerigeeDeg,meanAnomalyDeg].every(Number.isFinite)||inclinationDeg<0||inclinationDeg>180)throw Error('Invalid Mars relay orbit elements');
 const i=rad(inclinationDeg),raan=rad(raanDeg),arg=rad(argumentOfPerigeeDeg),mean=rad(meanAnomalyDeg),a=C.marsRadius+altitude,n=Math.sqrt(C.marsMu/a**3),E=solveEccentricAnomaly(mean+n*elapsedSeconds,e),ce=Math.cos(E),se=Math.sin(E),q=Math.sqrt(1-e*e),r=a*(1-e*ce);
 if(r<=C.marsRadius)throw Error('Mars relay orbit intersects the Mars reference sphere');
 const xpf=a*(ce-e),ypf=a*q*se,vscale=Math.sqrt(C.marsMu*a)/r,vxpf=-vscale*se,vypf=vscale*q*ce;
 const [x,y,z]=rotatePerifocal(xpf,ypf,0,raan,i,arg),[vx,vy,vz]=rotatePerifocal(vxpf,vypf,0,raan,i,arg);
 const theta=7.0882181e-5*elapsedSeconds,ct=Math.cos(theta),st=Math.sin(theta),ex=ct*x+st*y,ey=-st*x+ct*y,ez=z,lat=deg(Math.atan2(ez,Math.hypot(ex,ey))),lon=((deg(Math.atan2(ey,ex))+540)%360)-180;
 return {elapsedSeconds,altitudeM:r-C.marsRadius,semiMajorAxisM:a,eccentricity:e,periodSeconds:2*Math.PI/n,positionInertialM:[x,y,z],velocityInertialMps:[vx,vy,vz],positionFixedM:[ex,ey,ez],latitudeDeg:lat,longitudeDeg:lon,speedMps:Math.hypot(vx,vy,vz)};
}
function marsGroundElevation(orbit,site,elapsedSeconds){
 const s=propagateMarsOrbit(orbit,elapsedSeconds),lat=rad(site.lat),lon=rad(site.lon),r=C.marsRadius+(site.altitudeM||0),gx=r*Math.cos(lat)*Math.cos(lon),gy=r*Math.cos(lat)*Math.sin(lon),gz=r*Math.sin(lat),[sx,sy,sz]=s.positionFixedM,dx=sx-gx,dy=sy-gy,dz=sz-gz,range=Math.hypot(dx,dy,dz),up=(dx*Math.cos(lat)*Math.cos(lon)+dy*Math.cos(lat)*Math.sin(lon)+dz*Math.sin(lat))/range;
 return {elevationDeg:deg(Math.asin(clamp(up,-1,1))),rangeM:range,visible:up>0};
}
function marsRelayWindows(orbit,site,{durationMinutes=180,stepSeconds=30,minElevationDeg=10}={}){
 if(!(durationMinutes>0&&durationMinutes<=1440&&stepSeconds>0))throw Error('Invalid Mars relay-window interval');
 const limit=durationMinutes*60;let active=false,start=0;const windows=[];
 for(let t=0;t<=limit;t+=stepSeconds){const visible=marsGroundElevation(orbit,site,t).elevationDeg>=minElevationDeg;if(visible&&!active){active=true;start=t;}if(!visible&&active){windows.push({startSeconds:start,endSeconds:t});active=false;}}
 if(active&&limit>start)windows.push({startSeconds:start,endSeconds:limit});
 return windows.map(w=>({...w,startMinutes:w.startSeconds/60,endMinutes:w.endSeconds/60,durationMinutes:(w.endSeconds-w.startSeconds)/60}));
}
function marsAtmosphericDensity(altitudeM,{surfaceDensityKgM3=.0182,scaleHeightM=3216}={}){
 if(!Number.isFinite(altitudeM)||altitudeM<0||!(surfaceDensityKgM3>0&&scaleHeightM>0))throw Error('Invalid Mars atmospheric density input');
 return surfaceDensityKgM3*Math.exp(-altitudeM/scaleHeightM);
}
function sarPerformance({altitudeM=500000,bandwidthMHz=20,incidenceDeg=35,nearIncidenceDeg=25,farIncidenceDeg=45,antennaLengthM=10}={}){
 if(![altitudeM,bandwidthMHz,incidenceDeg,nearIncidenceDeg,farIncidenceDeg,antennaLengthM].every(Number.isFinite)||!(altitudeM>0&&bandwidthMHz>0&&incidenceDeg>=nearIncidenceDeg&&incidenceDeg<=farIncidenceDeg&&incidenceDeg<90&&nearIncidenceDeg>0&&farIncidenceDeg<90&&farIncidenceDeg>nearIncidenceDeg&&antennaLengthM>0))throw Error('Invalid SAR model inputs');
 const bandwidthHz=bandwidthMHz*1e6,slantRangeResolutionM=C.speedOfLight/(2*bandwidthHz),groundRangeResolutionM=slantRangeResolutionM/Math.sin(rad(incidenceDeg));
 const swathWidthM=altitudeM*(Math.tan(rad(farIncidenceDeg))-Math.tan(rad(nearIncidenceDeg)));
 // Ideal stripmap estimate; real azimuth resolution also depends on processing, PRF and geometry.
 const idealAzimuthResolutionM=antennaLengthM/2;
 return {bandwidthMHz,incidenceDeg,slantRangeResolutionM,groundRangeResolutionM,swathWidthM,nearIncidenceDeg,farIncidenceDeg,idealAzimuthResolutionM,radiometricModel:'not modelled: waveform, calibrated antenna pattern, receiver noise figure, processing gain and sigma-nought calibration are not supplied'};
}
function linkBudget({frequencyGHz=8.4,txPowerW=20,txGainDbi=25,rxGainDbi=38,lossesDb=3,noiseTemperatureK=150,bandwidthMHz=100,rangeM=600000,hardwareRateMbps=500}={}){
 for(const [k,v] of Object.entries({frequencyGHz,txPowerW,noiseTemperatureK,bandwidthMHz,rangeM}))if(!(v>0))throw Error('RF link-budget input '+k+' must be positive');if(!(hardwareRateMbps>=0))throw Error('RF hardware rate cannot be negative');
 const wavelength=C.speedOfLight/(frequencyGHz*1e9),fsplDb=20*Math.log10(4*Math.PI*rangeM/wavelength),eirpDbw=10*Math.log10(txPowerW)+txGainDbi,receivedDbw=eirpDbw+rxGainDbi-fsplDb-lossesDb,noiseDbw=10*Math.log10(C.boltzmann*noiseTemperatureK*bandwidthMHz*1e6),snrDb=receivedDbw-noiseDbw,snr=10**(snrDb/10),shannonMbps=bandwidthMHz*1e6*Math.log2(1+snr)/1e6;
 return {frequencyGHz,rangeM,freeSpacePathLossDb:fsplDb,eirpDbw,receivedPowerDbw:receivedDbw,noisePowerDbw:noiseDbw,snrDb,shannonLimitMbps:shannonMbps,usableRateMbps:Math.min(hardwareRateMbps,shannonMbps),assumptions:'Free-space line-of-sight, single-carrier Shannon limit; excludes coding, pointing, polarization, atmospheric and implementation losses beyond the explicit lumped loss.'};
}
function batteryEnergyStep({energyWh,solarW,loadW,seconds,chargeEfficiency=.95,dischargeEfficiency=.95,capacityWh=Infinity}){
 if(![energyWh,solarW,loadW,seconds,chargeEfficiency,dischargeEfficiency].every(Number.isFinite)||solarW<0||loadW<0||seconds<0||chargeEfficiency<=0||chargeEfficiency>1||dischargeEfficiency<=0||dischargeEfficiency>1||capacityWh<=0)throw Error('Invalid battery energy step');
 const netW=solarW-loadW,deltaWh=netW>=0?netW*seconds/3600*chargeEfficiency:netW*seconds/3600/dischargeEfficiency;
 return {energyWh:clamp(energyWh+deltaWh,0,capacityWh),deltaWh,chargeLossWh:netW>0?netW*seconds/3600*(1-chargeEfficiency):0,dischargeLossWh:netW<0?-netW*seconds/3600*(1/dischargeEfficiency-1):0};
}
function thermalStep({temperatureK,internalHeatW,solarAbsorbedW=0,radiatorAreaM2=.8,emissivity=.85,heatCapacityJK=80000,seconds,spaceTemperatureK=3,heaterMaxW=160,minTemperatureK=255,maxTemperatureK=310,heaterInputW=null}){
 if(!(temperatureK>0&&heatCapacityJK>0&&radiatorAreaM2>0&&emissivity>0&&emissivity<=1&&seconds>=0&&Number.isFinite(internalHeatW)&&Number.isFinite(solarAbsorbedW)))throw Error('Invalid thermal model input');
 const referenceK=minTemperatureK,referenceRadiation=emissivity*C.sigma*radiatorAreaM2*(referenceK**4-spaceTemperatureK**4),linearizedRadiationSlope=4*emissivity*C.sigma*radiatorAreaM2*referenceK**3;
 const heaterW=heaterInputW===null?(temperatureK<minTemperatureK?Math.min(heaterMaxW,Math.max(0,referenceRadiation-internalHeatW-solarAbsorbedW)):0):clamp(heaterInputW,0,heaterMaxW);
 const netAtReference=internalHeatW+solarAbsorbedW+heaterW-referenceRadiation,equilibriumK=referenceK+netAtReference/linearizedRadiationSlope,decay=Math.exp(-linearizedRadiationSlope*seconds/heatCapacityJK),next=equilibriumK+(temperatureK-equilibriumK)*decay;
 const radiated=emissivity*C.sigma*radiatorAreaM2*(next**4-spaceTemperatureK**4),netW=internalHeatW+solarAbsorbedW+heaterW-radiated;
 return {temperatureK:next,heaterW,radiatedW:radiated,netHeatW:netW,belowLimit:next<minTemperatureK,aboveLimit:next>maxTemperatureK,method:'single-node radiative balance linearized about the minimum operating temperature; analytic first-order update'};
}

function pointingAssessment(orbit,target,elapsedSeconds,{currentOffNadirDeg=0,maxOffNadirDeg=45,slewRateDegPerSec=1}={}){
 if(!(slewRateDegPerSec>0))throw Error('ADCS slew rate must be positive');
 const look=lookGeometry(orbit,target,elapsedSeconds),requiredSlewDeg=Math.abs(look.offNadirDeg-currentOffNadirDeg),slewTimeSeconds=requiredSlewDeg/slewRateDegPerSec;
 return {...look,withinEnvelope:look.offNadirDeg>=0&&look.offNadirDeg<=maxOffNadirDeg,requiredSlewDeg,slewTimeSeconds,maxOffNadirDeg,slewRateDegPerSec};
}
function thermalHoldingLoad({temperatureK=255,internalHeatW,radiatorAreaM2=.4,emissivity=.85,heaterMaxW=160,spaceTemperatureK=3}){
 const radiationW=emissivity*C.sigma*radiatorAreaM2*(temperatureK**4-spaceTemperatureK**4),requiredHeaterW=Math.max(0,radiationW-internalHeatW);
 return {radiationW,requiredHeaterW,availableHeaterW:Math.min(heaterMaxW,requiredHeaterW),heaterCapacitySufficient:requiredHeaterW<=heaterMaxW,assumption:'Single shaded radiator node at the minimum bus temperature; heater load is an equilibrium estimate.'};
}

function propulsionDeltaV({dryMassKg,propellantKg,ispSeconds=220,usedPropellantKg=0}){
 if(!(dryMassKg>0&&propellantKg>=0&&usedPropellantKg>=0&&usedPropellantKg<=propellantKg&&ispSeconds>0))throw Error('Invalid propulsion inputs');
 const initial=dryMassKg+propellantKg,final=dryMassKg+propellantKg-usedPropellantKg;
 return {ispSeconds,initialMassKg:initial,finalMassKg:final,usedPropellantKg,deltaVMps:ispSeconds*C.g0*Math.log(initial/final),remainingPropellantKg:propellantKg-usedPropellantKg};
}
function rocketEquation({wetMassKg,propellantKg,ispSeconds}){if(!(wetMassKg>propellantKg&&propellantKg>=0&&ispSeconds>0))throw Error('Invalid rocket equation inputs');return ispSeconds*C.g0*Math.log(wetMassKg/(wetMassKg-propellantKg));}
const api={constants:C,orbitElements,orbitPeriodSeconds,propagateOrbit,groundTrack,accessWindows,groundStationElevation,stationWindows,eclipseWindows,stationNetworkWindows,accessWindowAt,pointingAssessment,propagateMarsOrbit,marsGroundElevation,marsRelayWindows,marsAtmosphericDensity,sarPerformance,linkBudget,batteryEnergyStep,thermalStep,thermalHoldingLoad,propulsionDeltaV,rocketEquation,haversineKm};return api;
});
