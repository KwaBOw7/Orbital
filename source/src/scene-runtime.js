/* Container-scoped lifecycle for the supplied standalone 3D scenes. */
function orbitalSceneRuntime(view, renderer, canvas) {
  let stopped=false;
  const frames=new Set(),observers=[],listeners=[],scenes=[];
  const width=()=>Math.max(1,canvas.getBoundingClientRect().width);
  const height=()=>Math.max(1,canvas.getBoundingClientRect().height);
  function frame(callback){
    if(stopped)return;
    const id=requestAnimationFrame(time=>{
      frames.delete(id);if(stopped)return;
      const rect=canvas.getBoundingClientRect();
      if(document.hidden||rect.bottom<0||rect.top>window.innerHeight){frame(callback);return;}
      callback(time);
    });frames.add(id);return id;
  }
  function on(target,type,callback,options){target.addEventListener(type,callback,options);listeners.push(()=>target.removeEventListener(type,callback,options));}
  function resize(callback){const observer=new ResizeObserver(callback);observer.observe(canvas);observers.push(observer);}
  function stop(){
    if(stopped)return;stopped=true;frames.forEach(cancelAnimationFrame);frames.clear();observers.forEach(o=>o.disconnect());listeners.forEach(off=>off());
    const geometry=new Set(),materials=new Set(),textures=new Set();
    scenes.forEach(scene=>scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}}));
    textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometry.forEach(g=>g.dispose());
  }
  return {width,height,frame,on,resize,track:scene=>(scenes.push(scene),scene),stop};
}
