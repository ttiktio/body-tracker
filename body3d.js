import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';

// An anatomically modeled CC0 mesh, in meters. These are landmarks on the
// reference model only; the guide never infers a user's shape from tape readings.
export const LANDMARKS = {
  neck: { center: [0, 1.392, .047], normal: [0, 1, .12], radius: .09 },
  chest: { center: [0, 1.225, .059], normal: [0, 1, 0], radius: .205 },
  waist: { center: [0, 1.035, .053], normal: [0, 1, 0], radius: .19 },
  hip: { center: [0, .895, .033], normal: [0, 1, 0], radius: .23 },
  arm: { center: [.257, 1.245, .046], normal: [.64, -.768, 0], radius: .075 },
  thigh: { center: [.114, .715, .025], normal: [0, 1, 0], radius: .10 }
};

function convexHull(points) {
  points.sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const lower = [], upper = [];
  for (const p of points) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of [...points].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Intersect the real body surface with the measurement plane. The tape follows
// the convex cross-section instead of floating as a screen-space ellipse.
export function measurementContour(geometry, part, sex = 'male') {
  const mark = LANDMARKS[part] || LANDMARKS.waist;
  const center = new THREE.Vector3(...mark.center);
  if (part === 'waist' && sex === 'female') center.y = 1.092;
  const normal = new THREE.Vector3(...mark.normal).normalize();
  const u = new THREE.Vector3(1, 0, 0).projectOnPlane(normal).normalize();
  const v = new THREE.Vector3().crossVectors(normal, u).normalize();
  const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, center);
  const pos = geometry.attributes.position, index = geometry.index;
  const points = [], a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < index.count; i += 3) {
    for (let edge = 0; edge < 3; edge++) {
      a.fromBufferAttribute(pos, index.getX(i + edge));
      b.fromBufferAttribute(pos, index.getX(i + (edge + 1) % 3));
      const da = plane.distanceToPoint(a), db = plane.distanceToPoint(b);
      if (da * db >= 0 || Math.abs(da - db) < 1e-9) continue;
      const p = a.clone().lerp(b, da / (da - db)).sub(center);
      if (p.length() > mark.radius) continue;
      points.push(new THREE.Vector2(p.dot(u), p.dot(v)));
    }
  }
  const hull = convexHull(points);
  if (hull.length < 5) throw new Error(`Missing mesh cross-section: ${part}`);
  const mid = hull.reduce((sum, p) => sum.add(p), new THREE.Vector2()).multiplyScalar(1 / hull.length);
  const ring = hull.map(p => {
    const padded = p.clone().add(p.clone().sub(mid).normalize().multiplyScalar(.009));
    return center.clone().addScaledVector(u, padded.x).addScaledVector(v, padded.y);
  });
  return { curve: new THREE.CatmullRomCurve3(ring, true, 'centripetal'), normal, center };
}

export async function create(canvas, { onSelect, onStatus, sex = 'male' } = {}) {
  let disposed = false, visible = false, activePart = 'waist', frame = 0;
  let autoRotate = false, dragStart = null, lastFrame = 0, elapsed = 0;
  let cameraTween = null, modelGeometry = null, tape = null, tapeTicks = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const resources = new Set();
  const own = resource => (resources.add(resource), resource);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .05, 30);
  camera.position.set(.35, .99, 3.35);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, .86, .035);
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion.matches;
  controls.dampingFactor = .085;
  controls.minDistance = 1.35;
  controls.maxDistance = 4.3;
  controls.minPolarAngle = Math.PI * .31;
  controls.maxPolarAngle = Math.PI * .62;
  // One-finger horizontal drag rotates; vertical drag remains page scrolling.
  canvas.style.touchAction = 'pan-y';
  controls.rotateSpeed = .55;
  controls.autoRotateSpeed = .65;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xf4f9e8, 0x4c604d, 2.2));
  const key = new THREE.DirectionalLight(0xfff0da, 3.5);
  key.position.set(-2.5, 4.5, 4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -1.3, right: 1.3, top: 2.2, bottom: -1.2, near: .1, far: 12 });
  key.shadow.normalBias = .012; key.shadow.bias = -.0001;
  key.target.position.set(0, .85, 0); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xd3f6b4, 3.2);
  rim.position.set(2.5, 2, -2); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xd6e1ff, 1.1);
  fill.position.set(2, 1.6, 3); scene.add(fill);
  const floor = new THREE.Mesh(own(new THREE.PlaneGeometry(15, 15)), own(new THREE.ShadowMaterial({ color: 0x020803, opacity: .28 })));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.012; floor.receiveShadow = true; scene.add(floor);
  const platform = new THREE.Mesh(own(new THREE.CylinderGeometry(.42, .44, .016, 80)), own(new THREE.MeshStandardMaterial({ color: 0x2d3b2e, roughness: .8, metalness: .12 })));
  platform.position.set(0, -.018, .05); platform.receiveShadow = true; scene.add(platform);
  const platformEdge = new THREE.Mesh(own(new THREE.TorusGeometry(.425, .0015, 6, 96)), own(new THREE.MeshBasicMaterial({ color: 0x748567 })));
  platformEdge.rotation.x = Math.PI / 2; platformEdge.position.set(0, -.009, .05); scene.add(platformEdge);

  const bodyGroup = new THREE.Group(); scene.add(bodyGroup);
  const breathing = { value: 0 };
  const bodyMaterial = own(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .55, metalness: .035, clearcoat: .09, clearcoatRoughness: .65 }));
  bodyMaterial.onBeforeCompile = shader => {
    shader.uniforms.breath = breathing;
    shader.vertexShader = 'uniform float breath;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float chestWeight = smoothstep(0.99, 1.20, position.y) * (1.0 - smoothstep(1.28, 1.43, position.y)) * (1.0 - smoothstep(0.13, 0.23, abs(position.x)));
      transformed.z += breath * chestWeight * 0.002;
      transformed.x += breath * chestWeight * position.x * 0.005;`);
  };
  const raycaster = new THREE.Raycaster();
  const meshes = [];

  function replaceTape() {
    if (!modelGeometry) return;
    if (tape) { scene.remove(tape); tape.geometry.dispose(); resources.delete(tape.geometry); }
    if (tapeTicks) { scene.remove(tapeTicks); tapeTicks.geometry.dispose(); resources.delete(tapeTicks.geometry); }
    const { curve, normal } = measurementContour(modelGeometry, activePart, sex);
    const positions = [], uvs = [], indices = [], ticks = [];
    const steps = 160, halfWidth = .006;
    for (let i = 0; i <= steps; i++) {
      const p = curve.getPointAt(i / steps);
      positions.push(...p.clone().addScaledVector(normal, halfWidth).toArray(), ...p.clone().addScaledVector(normal, -halfWidth).toArray());
      uvs.push(i / steps, 0, i / steps, 1);
      if (i < steps) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); }
      if (i % 4 === 0) {
        const mid = p.clone();
        ticks.push(...mid.clone().addScaledVector(normal, halfWidth * .88).toArray(), ...mid.clone().addScaledVector(normal, i % 16 === 0 ? -halfWidth * .8 : 0).toArray());
      }
    }
    const geometry = own(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    tape = new THREE.Mesh(geometry, tapeMaterial); tape.renderOrder = 1; scene.add(tape);
    const tickGeometry = own(new THREE.BufferGeometry()); tickGeometry.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
    tapeTicks = new THREE.LineSegments(tickGeometry, tickMaterial); tapeTicks.renderOrder = 2; scene.add(tapeTicks);
  }
  const tapeMaterial = own(new THREE.MeshStandardMaterial({ color: 0xd4ff9a, emissive: 0x8ec43e, emissiveIntensity: .18, roughness: .65, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
  const tickMaterial = own(new THREE.LineBasicMaterial({ color: 0x2a411c }));

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    if (visible) start();
  }
  function render(time) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = Math.min((time - lastFrame) / 1000 || 0, .05); lastFrame = time; elapsed += delta;
    breathing.value = reducedMotion.matches ? 0 : Math.sin(elapsed * 1.55);
    if (cameraTween) {
      const t = Math.min((time - cameraTween.start) / cameraTween.duration, 1), ease = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(cameraTween.from, cameraTween.to, ease);
      if (t === 1) cameraTween = null;
    }
    controls.autoRotate = autoRotate && !reducedMotion.matches && !cameraTween;
    controls.update(delta); renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }
  function start() { if (!frame && visible && !document.hidden && !disposed) { lastFrame = performance.now(); frame = requestAnimationFrame(render); } }
  function stop() { cancelAnimationFrame(frame); frame = 0; }
  const visibility = () => document.hidden ? stop() : start();
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; visible ? (resize(), start()) : stop(); }); intersection.observe(canvas);
  document.addEventListener('visibilitychange', visibility);
  const cancelTween = () => { cameraTween = null; };
  controls.addEventListener('start', cancelTween);
  const pointerDown = event => { dragStart = { x: event.clientX, y: event.clientY }; };
  const pointerUp = event => {
    if (!dragStart || Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 7) { dragStart = null; return; }
    dragStart = null;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hit = raycaster.intersectObjects(meshes)[0]; if (!hit) return;
    const p = hit.point;
    const part = p.y > 1.35 ? 'neck' : Math.abs(p.x) > .22 && p.y > .97 ? 'arm' : p.y > 1.16 ? 'chest' : p.y > .97 ? 'waist' : p.y > .81 ? 'hip' : 'thigh';
    onSelect?.(part);
  };
  const pointerCancel = () => { dragStart = null; };
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerCancel);
  const keyDown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') { api.setView('front'); return; }
    const offset = camera.position.clone().sub(controls.target);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), event.key === 'ArrowLeft' ? -.16 : .16);
    else offset.multiplyScalar(event.key === 'ArrowUp' ? .92 : 1.08).clampLength(controls.minDistance, controls.maxDistance);
    camera.position.copy(controls.target).add(offset); cameraTween = null; controls.update();
  };
  canvas.addEventListener('keydown', keyDown);
  const contextLost = event => { event.preventDefault(); stop(); onStatus?.('error'); };
  canvas.addEventListener('webglcontextlost', contextLost);

  const api = {
    setPart(part) { activePart = LANDMARKS[part] ? part : 'waist'; replaceTape(); },
    setSex(value) { if (sex === value) return; sex = value; replaceTape(); },
    setAutoRotate(value) { autoRotate = !!value; },
    setView(view) {
      const theta = view === 'side' ? Math.PI / 2 : view === 'back' ? Math.PI : 0;
      const distance = Math.max(3.05, Math.min(3.55, 1.25 / camera.aspect));
      const to = new THREE.Vector3(Math.sin(theta) * distance, 1, Math.cos(theta) * distance + .035);
      if (reducedMotion.matches) { camera.position.copy(to); controls.update(); }
      else cameraTween = { from: camera.position.clone(), to, start: performance.now(), duration: 650 };
    },
    reset() { api.setView('front'); },
    destroy() {
      disposed = true; stop(); observer.disconnect(); intersection.disconnect(); controls.dispose();
      document.removeEventListener('visibilitychange', visibility);
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerCancel);
      canvas.removeEventListener('keydown', keyDown); canvas.removeEventListener('webglcontextlost', contextLost);
      resources.forEach(resource => resource.dispose()); renderer.dispose();
    }
  };
  try {
    const response = await fetch(new URL('./assets/human.json', import.meta.url));
    if (!response.ok) throw new Error('Model download failed');
    const data = await response.json();
    for (const source of data.meshes) {
      const geometry = own(new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(source.positions, 3));
      geometry.setIndex(source.indices); geometry.computeVertexNormals();
      const colors = [], color = new THREE.Color();
      for (let i = 0; i < source.positions.length; i += 3) {
        const y = source.positions[i + 1];
        // Modest fitted shorts are colored on the mesh; no helper cages remain.
        color.set(source.name !== 'body' ? '#b2bbaa' : y > .685 && y < .947 ? '#34473a' : '#c3c9b9');
        colors.push(color.r, color.g, color.b);
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const mesh = new THREE.Mesh(geometry, bodyMaterial); mesh.castShadow = true; mesh.receiveShadow = true; bodyGroup.add(mesh);
      if (source.name === 'body') { modelGeometry = geometry; meshes.push(mesh); }
    }
    replaceTape(); resize(); onStatus?.('ready'); return api;
  } catch (error) { api.destroy(); throw error; }
}
