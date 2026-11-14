/* Canvas renderer for the supplied procedural models when WebGL is unavailable. */
function modelCanvasRenderer(canvas) {
  const context = canvas.getContext('2d');
  if (!context) throw Error('Canvas 2D unavailable');
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let lastFrame = -Infinity;
  const transform = new THREE.Matrix4();
  const viewProjection = new THREE.Matrix4();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const light = new THREE.Vector3(-0.4, 0.7, 0.9).normalize();
  const normalMatrix = new THREE.Matrix3();
  const texturePixels = new WeakMap();

  function setPixelRatio(value) { pixelRatio = value; }
  function setSize(w, h) {
    width = Math.max(1, w);
    height = Math.max(1, h);
    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);
  }

  function project(node, positions) {
    transform.multiplyMatrices(viewProjection, node.matrixWorld);
    const matrix = transform.elements;
    const points = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const w = x * matrix[3] + y * matrix[7] + z * matrix[11] + matrix[15];
      if (w <= 0.1) { points.push(null); continue; }
      points.push([
        (0.5 + (x * matrix[0] + y * matrix[4] + z * matrix[8] + matrix[12]) / (2 * w)) * width,
        (0.5 - (x * matrix[1] + y * matrix[5] + z * matrix[9] + matrix[13]) / (2 * w)) * height,
        w,
      ]);
    }
    return points;
  }

  function shade(material, geometry, ia, ib, ic, lighting) {
    let color = material.color.getHex();
    const vertexColors = geometry.attributes.color;
    if(material.vertexColors && vertexColors){
      const channel=k=>Math.round(255*(vertexColors.array[ia*3+k]+vertexColors.array[ib*3+k]+vertexColors.array[ic*3+k])/3);
      color=(channel(0)<<16)|(channel(1)<<8)|channel(2);
    }
    const image = material.map?.image;
    const uv = geometry.attributes.uv;
    if (image?.getContext && uv) {
      if (!texturePixels.has(image)) {
        texturePixels.set(image, image.getContext('2d').getImageData(0, 0, image.width, image.height).data);
      }
      const x = Math.min(image.width - 1, Math.floor(image.width * (uv.getX(ia) + uv.getX(ib) + uv.getX(ic)) / 3));
      const y = Math.min(image.height - 1, Math.floor(image.height * (1 - (uv.getY(ia) + uv.getY(ib) + uv.getY(ic)) / 3)));
      const pixels = texturePixels.get(image), offset = (y * image.width + x) * 4;
      color = pixels[offset] * 65536 + pixels[offset + 1] * 256 + pixels[offset + 2];
    }
    const channel = value => Math.round(Math.min(255, value * lighting));
    return `rgba(${channel(color >> 16)},${channel((color >> 8) & 255)},${channel(color & 255)},${material.opacity})`;
  }

  function drawFaces(node, points, faces) {
    const geometry = node.geometry, material = node.material;
    const indices = geometry.index, positions = geometry.attributes.position;
    const length = indices?.count ?? positions.count;
    normalMatrix.getNormalMatrix(node.matrixWorld);
    for (let i = 0; i + 2 < length; i += 3) {
      const ia = indices ? indices.getX(i) : i;
      const ib = indices ? indices.getX(i + 1) : i + 1;
      const ic = indices ? indices.getX(i + 2) : i + 2;
      const p = points[ia], q = points[ib], r = points[ic];
      if (!p || !q || !r) continue;
      const winding = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      if (Math.abs(winding) < 0.05) continue;
      if (material.side === THREE.FrontSide && winding > 0) continue;
      if (material.side === THREE.BackSide && winding < 0) continue;
      a.fromBufferAttribute(positions, ia);
      b.fromBufferAttribute(positions, ib).sub(a);
      c.fromBufferAttribute(positions, ic).sub(a);
      normal.crossVectors(b, c).applyNormalMatrix(normalMatrix);
      const amount = material.isMeshBasicMaterial ? 1 : 0.52 + 0.48 * Math.max(0, normal.dot(light));
      faces.push({p, q, r, depth: (p[2] + q[2] + r[2]) / 3, color: shade(material, geometry, ia, ib, ic, amount), opaque: material.opacity === 1});
    }
  }

  function render(scene, camera) {
    const now = performance.now();
    if (now - lastFrame < 40) return;
    lastFrame = now;
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    const faces = [];
    scene.traverseVisible(node => {
      const positions = node.geometry?.attributes.position;
      if (!positions) return;
      const points = project(node, positions);
      if (node.isMesh) drawFaces(node, points, faces);
      if (node.isPoints) {
        context.fillStyle = '#b9c8e5';
        for (const p of points) if (p) context.fillRect(p[0], p[1], 1, 1);
      }
      if (node.isLineSegments) {
        context.strokeStyle = '#90a7c345';
        context.beginPath();
        for (let i = 0; i + 1 < points.length; i += 2) {
          if (points[i] && points[i + 1]) {
            context.moveTo(...points[i].slice(0, 2));
            context.lineTo(...points[i + 1].slice(0, 2));
          }
        }
        context.stroke();
      }
    });
    faces.sort((first, second) => second.depth - first.depth);
    context.lineWidth = 0.75;
    for (const {p, q, r, color, opaque} of faces) {
      context.beginPath();
      context.moveTo(p[0], p[1]);
      context.lineTo(q[0], q[1]);
      context.lineTo(r[0], r[1]);
      context.closePath();
      context.fillStyle = color;
      context.fill();
      if (opaque) {
        context.strokeStyle = color;
        context.stroke();
      }
    }
  }

  return {setPixelRatio, setSize, render};
}
