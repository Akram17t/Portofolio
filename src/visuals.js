import * as THREE from 'three';

function rendererFor(canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    return renderer;
  } catch { return null; }
}

export function createIntro(canvas) {
  const renderer = rendererFor(canvas);
  if (!renderer) return null;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 1, 6000);
  camera.position.z = 1000;
  const count = innerWidth < 600 ? 2400 : 5000;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - .5) * 3000;
    positions[i * 3 + 1] = (Math.random() - .5) * 3000;
    positions[i * 3 + 2] = (Math.random() - .5) * 3000;
    velocities[i] = Math.random() * .2 + .1;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xf1f2eb, size: 1.8, sizeAttenuation: true, transparent: true, opacity: .8, depthWrite: false });
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  const streakPositions = new Float32Array(count * 6);
  const streakGeometry = new THREE.BufferGeometry();
  streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
  const streakMaterial = new THREE.LineBasicMaterial({ color: 0xf1f2eb, transparent: true, opacity: 0, depthWrite: false });
  scene.add(new THREE.LineSegments(streakGeometry, streakMaterial));
  let targetWarp = 0;
  let warp = 0;
  let frame;
  let previous = 0;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (document.hidden || time - previous < 28) return;
    const delta = Math.min((time - previous) / 16.7, 3);
    previous = time;
    warp += (targetWarp - warp) * (1 - Math.pow(.9, delta));
    const speed = 2 + warp * 8000;
    const fov = 60 + warp * warp * 100;
    if (Math.abs(camera.fov - fov) > .01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    for (let i = 0; i < count; i++) {
      const point = i * 3;
      const line = i * 6;
      positions[point + 2] += speed * velocities[i] * delta;
      if (positions[point + 2] > 1100) positions[point + 2] = -1500;
      streakPositions[line] = streakPositions[line + 3] = positions[point];
      streakPositions[line + 1] = streakPositions[line + 4] = positions[point + 1];
      streakPositions[line + 2] = positions[point + 2];
      streakPositions[line + 5] = positions[point + 2] - Math.max(.1, warp * velocities[i] * 5000 + Math.pow(warp, 4) * 30000);
    }
    geometry.attributes.position.needsUpdate = true;
    streakGeometry.attributes.position.needsUpdate = true;
    streakMaterial.opacity = Math.min(warp * 5, 1);
    material.opacity = Math.max(.8 - warp * 3, 0);
    renderer.render(scene, camera);
  }
  resize();
  window.addEventListener('resize', resize);
  frame = requestAnimationFrame(tick);
  return {
    setProgress(progress) {
      targetWarp = Math.pow(Math.max(0, Math.min(1, progress)), 4);
    },
    dispose() {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      streakGeometry.dispose();
      streakMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
