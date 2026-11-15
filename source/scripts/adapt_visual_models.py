"""Adapt the four supplied scenes to local renderers and disposable game views."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'assets/models'


def script(name):
    html = (MODELS / 'references' / f'{name}.html').read_text()
    return re.findall(r'<script>([\s\S]*?)</script>', html)[0].strip()


earth = script('earth')
definitions, earth_scene = earth.split('// ---- scene ----')
# Texture canvases are shared CPU data; each scene owns and disposes its GPU texture.
definitions = definitions.replace('W=1536,H=768', 'W=768,H=384').replace('W=1024,H=512', 'W=512,H=256')
(MODELS / 'earth-texture.js').write_text('/* Procedural artwork adapted from supplied 3D Earth.html. */\nconst OrbitalEarth=(()=>{\n' + definitions + '\nlet surface,cloud;return {surface:()=>surface??=makeEarth(),clouds:()=>cloud??=makeClouds()};\n})();\n')

for name, function in [('earth','earthScene'), ('moon','moonScene'), ('lander','landerScene'), ('mars-globe','marsGlobeScene')]:
    source = earth_scene if name == 'earth' else script(name)
    if name != 'earth':
        source = re.sub(r'^\(function\s*\(\)\s*\{', '', source)
        source = re.sub(r'\}\)\(\);?\s*$', '', source)
    source = re.sub(r'new THREE.WebGLRenderer\(\{[^}]*\}\)', 'rendererInstance', source)
    source = source.replace('document.body.appendChild(renderer.domElement);', '')
    source = source.replace("document.getElementById('c')", 'canvas')
    source = source.replace("document.getElementById('ro')", "document.getElementById('info')")
    source = source.replace('document.getElementById(', 'view.querySelector("#"+').replace('makeEarth()', 'OrbitalEarth.surface()').replace('makeClouds()', 'OrbitalEarth.clouds()')
    source = re.sub(r'new THREE.Scene\(\)', 'life.track(new THREE.Scene())', source)
    source = re.sub(r'(\w+)\.addEventListener\(', r'life.on(\1,', source)
    source = source.replace("addEventListener('resize',", 'life.resize(')
    source = source.replace('requestAnimationFrame(', 'life.frame(')
    source = source.replace('devicePixelRatio,2', 'devicePixelRatio,1.5').replace('devicePixelRatio, 2', 'devicePixelRatio, 1.5')
    # Picking uses the actual canvas rectangle, not the browser window.
    source = source.replace('e.clientX/innerWidth', '(e.clientX-canvas.getBoundingClientRect().left)/innerWidth')
    source = source.replace('e.clientY/innerHeight', '(e.clientY-canvas.getBoundingClientRect().top)/innerHeight')
    source = source.replace('innerWidth', 'life.width()').replace('innerHeight', 'life.height()')
    # Preserve the source shape algorithms with bounded in-app mesh density.
    source = source.replace('SphereGeometry(1, 220, 110)', 'SphereGeometry(1, rendererInstance.isCanvasFallback?64:96, rendererInstance.isCanvasFallback?32:48)')
    source = source.replace('SphereGeometry(RAD,256,128)', 'SphereGeometry(RAD,rendererInstance.isCanvasFallback?48:128,rendererInstance.isCanvasFallback?24:64)')
    source = source.replace('PlaneGeometry(90, 90, 200, 200)', 'PlaneGeometry(90, 90, rendererInstance.isCanvasFallback?32:80, rendererInstance.isCanvasFallback?32:80)')
    source = source.replace('SphereGeometry(1,96,64)', 'SphereGeometry(1,rendererInstance.isCanvasFallback?64:72,rendererInstance.isCanvasFallback?32:48)')
    source = source.replace('SphereGeometry(1.012,64,48)', 'SphereGeometry(rendererInstance.isCanvasFallback?1.025:1.012,rendererInstance.isCanvasFallback?64:72,rendererInstance.isCanvasFallback?32:48)')
    if name == 'moon':
        source = source.replace('if (!dragging) rotY += vy;', 'if (!dragging && !reducedMotion) rotY += vy;')
    if name == 'lander':
        source = source.replace('if (!dragging) rotY += 0.0018;', 'if (!dragging && !reducedMotion) rotY += 0.0018;')
    header = f'/* Adapted from supplied {name} scene; source retained in references/. */\nfunction {function}(view, rendererInstance, canvas) {{\nconst life=orbitalSceneRuntime(view,rendererInstance,canvas);\nconst reducedMotion=matchMedia("(prefers-reduced-motion: reduce)").matches;\ntry{{\n'
    (MODELS / f'{name}.js').write_text(header + source + '\nreturn life.stop;\n}catch(error){life.stop();throw error;}\n}\n')
