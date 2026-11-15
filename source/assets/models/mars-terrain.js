/* Original procedural training terrain. Not a MOLA DEM, landing-site survey or georeferenced map. */
function createMarsTerrainHeight(){
 const fract=x=>x-Math.floor(x),hash=(x,z)=>fract(Math.sin(x*127.1+z*311.7)*43758.5453);
 function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;}
 function fbm(x,z){return .57*noise(x,z)+.28*noise(x*2.03+17,z*2.03-11)+.15*noise(x*4.07-5,z*4.07+23);}
 return (x,z)=>{if(!Number.isFinite(x)||!Number.isFinite(z))return 0;const broad=(fbm(x/190,z/190)-.5)*30,detail=(fbm(x/51,z/51)-.5)*6,basin=-9*Math.exp(-((x/720)**2+((z-680)/500)**2)*1.3),ripple=1.7*Math.sin(x/270+z/330)*Math.cos(z/210);return broad+detail+basin+ripple;};
}
