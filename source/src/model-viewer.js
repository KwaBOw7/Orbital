/* Register only the original supplied model files. */
const OrbitalModels=(()=>{
 const models={};
 for(const [key,asset] of Object.entries(ORBITAL_ORIGINAL_ASSETS))models[key]={title:asset.title,original:key,controls:[]};
 models.sar=models.observatory;
 return {get:key=>models[key],open:(key,trigger)=>{if(models[key])OrbitalOriginal.open(models[key].original,trigger);}};
})();
globalThis.OrbitalModels=OrbitalModels;
