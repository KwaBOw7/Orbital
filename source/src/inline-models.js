/* Visible game views own their renderers; scrolling away releases GPU resources. */
const OrbitalInline=(()=>{
 let stops=[];
 function html(kind,flight=false,compact=false){
   const model=OrbitalModels.get(kind);if(!model)return '';
   const controls=model.controls.map(([id,label,pressed])=>`<button class="btn compact" id="${id}" aria-pressed="${pressed}">${label}</button>`).join('');
   return `<div class="inline-model ${flight?'in-flight':''} ${compact?'model-card':''}" data-inline-model="${kind}"><div class="inline-model-stage"><canvas tabindex="0" aria-label="Interactive ${model.title}"></canvas></div><div class="model-controls">${controls}</div><p id="info" class="model-info">Drag to rotate · scroll to zoom</p>${compact?`<button class="model-expand btn compact" data-action="model-${kind}" aria-label="Expand ${model.title}">Expand ↗</button>`:''}</div>`;
 }
 function detach(){for(const stop of stops)stop();stops=[];}
 function attach(){document.querySelectorAll('[data-inline-model]').forEach(view=>{
   let release=null,observer,active=true;
   function mount(){
     if(release||!active)return;
     let canvas=view.querySelector('canvas'),renderer,cleanup;
     const replacement=canvas.cloneNode();canvas.replaceWith(replacement);canvas=replacement;
     view.querySelectorAll('.model-controls button').forEach(button=>button.replaceWith(button.cloneNode(true)));
     const model=OrbitalModels.get(view.dataset.inlineModel);
     model.controls.forEach(([id,label,pressed])=>{const button=view.querySelector('#'+id);button.setAttribute('aria-pressed',String(pressed));button.textContent=label;});
     try{
       const options={alpha:true,antialias:true},context=canvas.getContext('webgl2',options)||canvas.getContext('webgl',options);
       if(context){try{renderer=new THREE.WebGLRenderer({canvas,context,...options});}catch{const fallback=canvas.cloneNode();canvas.replaceWith(fallback);canvas=fallback;}}
       renderer??=modelCanvasRenderer(canvas);
       cleanup=model.scene(view,renderer,canvas);
     }catch(error){view.querySelector('#info').textContent='3D rendering unavailable in this browser.';console.warn(error);}
     release=()=>{cleanup?.();renderer?.dispose?.();renderer?.forceContextLoss?.();release=null;};
   }
   if(typeof IntersectionObserver!=='undefined'){
     observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting)mount();else release?.();}},{rootMargin:'80px'});observer.observe(view);
   }else mount();
   stops.push(()=>{active=false;observer?.disconnect();release?.();});
 });}
 return {html,attach,detach};
})();
