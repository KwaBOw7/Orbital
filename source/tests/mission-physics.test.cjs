const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('../src/mission-physics.js');
const D=require('../data/catalog.json');
const Mars=require('../src/mars-engine.js');

const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t,`${a} differs from ${b}`);

test('two-body Earth orbit propagation conserves the circular reference state and returns a valid ground track',()=>{
  const orbit=D.orbits.find(x=>x.id==='leo500');
  const period=P.orbitPeriodSeconds(orbit),state=P.propagateOrbit(orbit,0),next=P.propagateOrbit(orbit,period);
  near(state.altitudeM,500000,1e-5);
  near(state.speedMps,Math.sqrt(P.constants.earthMu/(P.constants.earthRadius+500000)),1e-8);
  near(state.latitudeDeg,next.latitudeDeg,1e-7);
  assert.ok(next.longitudeDeg<state.longitudeDeg-20&&next.longitudeDeg>state.longitudeDeg-30,'Earth-fixed longitude should drift west as Earth rotates beneath the inertial orbit');
  assert.ok(Number.isFinite(state.longitudeDeg)&&Math.abs(state.latitudeDeg)<=orbit.inclinationDeg+1e-9);
});

test('Earth-fixed station visibility and eclipse windows are derived from propagated geometry',()=>{
  const orbit=D.orbits.find(x=>x.id==='leo500');
  const contacts=P.stationNetworkWindows(orbit,D.groundStations,{durationMinutes:4320,stepSeconds:30,minElevationDeg:10});
  const eclipses=P.eclipseWindows(orbit,{durationMinutes:4320,stepSeconds:30});
  assert.ok(contacts.length>0);
  assert.ok(contacts.every(x=>x.stationIds.length>0&&x.durationMinutes>0));
  assert.ok(eclipses.length>0&&eclipses.every(x=>x.durationMinutes>0));
  assert.ok(eclipses.every(x=>x.startMinutes>=0&&x.endMinutes<=4320));
});

test('SAR range resolution follows bandwidth and geometry; omitted radiometry is disclosed',()=>{
  const result=P.sarPerformance({altitudeM:500000,bandwidthMHz:20,incidenceDeg:35,nearIncidenceDeg:25,farIncidenceDeg:45,antennaLengthM:10});
  near(result.slantRangeResolutionM,P.constants.speedOfLight/(2*20e6),1e-12);
  assert.ok(result.groundRangeResolutionM>result.slantRangeResolutionM);
  assert.ok(result.swathWidthM>0&&result.idealAzimuthResolutionM>0);
  assert.match(result.radiometricModel,/not modelled/);
});

test('RF link budget is finite, range-sensitive and capped by the hardware rate',()=>{
  const close=P.linkBudget({rangeM:500000,hardwareRateMbps:250});
  const far=P.linkBudget({rangeM:1000000,hardwareRateMbps:250});
  assert.ok(Number.isFinite(close.snrDb)&&Number.isFinite(close.usableRateMbps));
  assert.ok(close.freeSpacePathLossDb<far.freeSpacePathLossDb);
  assert.ok(close.usableRateMbps<=250&&far.usableRateMbps<=250);
});

test('battery charge/discharge efficiencies and capacity bounds are applied',()=>{
  const charged=P.batteryEnergyStep({energyWh:50,solarW:100,loadW:20,seconds:3600,chargeEfficiency:.9,capacityWh:200});
  near(charged.energyWh,122);
  const discharged=P.batteryEnergyStep({energyWh:50,solarW:0,loadW:20,seconds:3600,dischargeEfficiency:.8,capacityWh:200});
  near(discharged.energyWh,25);
  const full=P.batteryEnergyStep({energyWh:199,solarW:100,loadW:0,seconds:3600,capacityWh:200});
  near(full.energyWh,200);
});

test('single-node thermal solution composes across substeps for constant inputs',()=>{
  const input={temperatureK:256,internalHeatW:35,radiatorAreaM2:.4,heatCapacityJK:80000,seconds:100};
  const whole=P.thermalStep(input);
  const first=P.thermalStep({...input,seconds:40});
  const split=P.thermalStep({...input,temperatureK:first.temperatureK,seconds:60});
  near(whole.temperatureK,split.temperatureK,1e-10);
  assert.ok(Number.isFinite(whole.radiatedW)&&whole.temperatureK>0);
});

test('rocket equation and propulsion depletion return finite delta-v with remaining propellant',()=>{
  const ideal=P.rocketEquation({wetMassKg:1000,propellantKg:100,ispSeconds:220});
  const actual=P.propulsionDeltaV({dryMassKg:900,propellantKg:100,usedPropellantKg:20,ispSeconds:220});
  assert.ok(ideal>0&&actual.deltaVMps>0);
  near(actual.remainingPropellantKg,80);
  assert.ok(actual.finalMassKg<actual.initialMassKg);
});


test('elliptical Earth propagation changes radius and speed between perigee and apogee',()=>{
  const orbit={...D.orbits.find(x=>x.id==='leo500'),eccentricity:.05,meanAnomalyDeg:0};
  const a=P.propagateOrbit(orbit,0),halfPeriod=P.propagateOrbit(orbit,P.orbitPeriodSeconds(orbit)/2);
  assert.ok(a.altitudeM<halfPeriod.altitudeM);
  assert.ok(a.speedMps>halfPeriod.speedMps);
  near(a.altitudeM,(P.constants.earthRadius+500000)*.95-P.constants.earthRadius,1e-4);
  near(halfPeriod.altitudeM,(P.constants.earthRadius+500000)*1.05-P.constants.earthRadius,1e-3);
});

test('elliptical Mars relay option propagates varying radius and changes relay windows',()=>{
  const orbit=Mars.orbits.find(x=>x.id==='elliptic');
  assert.equal(orbit.relayEccentricity,.04);
  const p=P.propagateMarsOrbit({altitudeKm:orbit.relayAltitudeKm,eccentricity:orbit.relayEccentricity,inclinationDeg:orbit.relayInclinationDeg,raanDeg:orbit.relayRaanDeg,meanAnomalyDeg:0},0);
  const q=P.propagateMarsOrbit({altitudeKm:orbit.relayAltitudeKm,eccentricity:orbit.relayEccentricity,inclinationDeg:orbit.relayInclinationDeg,raanDeg:orbit.relayRaanDeg,meanAnomalyDeg:0},p.periodSeconds/2);
  assert.ok(p.altitudeM<q.altitudeM&&p.speedMps>q.speedMps);
});

test('Mars atmosphere density decays with altitude and remains positive',()=>{
  const sea=P.marsAtmosphericDensity(0),high=P.marsAtmosphericDensity(10000);
  near(sea,.0182);
  assert.ok(high>0&&high<sea);
});

test('Mars touchdown telemetry preserves the simulated terminal velocity',()=>{
  const profile=Mars.buildDescentProfile(Mars.starter()),state=Mars.descentAt(profile,profile.touchdownSeconds);
  near(state.altitudeM,0,1e-9);
  near(state.speedMps,profile.samples.at(-1).speedMps,1e-9);
  near(state.verticalSpeedMps,profile.samples.at(-1).verticalSpeedMps,1e-9);
  assert.ok(state.speedMps>0&&state.speedMps<2,'the training model should disclose its non-zero touchdown speed');
});

test('all Mars reference-orbit profiles produce geometry-derived relay visibility windows',()=>{
  for(const orbit of Mars.orbits){
    const design=Mars.starter();design.orbit=orbit.id;const windows=Mars.contacts({design});
    assert.ok(windows.length>0,`${orbit.id} must provide at least one relay opportunity`);
    assert.ok(windows.every(([start,end])=>end>start&&start>=0&&end<=Mars.deadline));
  }
});

test('Mars descent profile reaches the surface with finite state and explicit model bounds',()=>{
  const profile=Mars.buildDescentProfile(Mars.starter());
  assert.ok(profile.samples.length>2&&profile.touchdownSeconds>0);
  assert.ok(profile.samples.every(s=>[s.seconds,s.altitudeM,s.speedMps,s.verticalSpeedMps,s.dynamicPressurePa].every(Number.isFinite)));
  near(profile.samples.at(-1).altitudeM,0,1e-9);
  assert.match(profile.modelVersion,/mars-edl-point-mass/);
  assert.ok(profile.limitations.length>0&&profile.assumptions.length>0);
});
