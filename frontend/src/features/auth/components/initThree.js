// THREE is dynamically imported so it never blocks the initial page render.
export async function initThree(canvas) {
  const THREE = await import('three');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a0a, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 12, 0);
  camera.lookAt(0, 0, 0);
  const wl = new THREE.PointLight(0xffffff, 8, 35);
  wl.position.set(0, 12, 0);
  scene.add(wl);
  scene.add(new THREE.AmbientLight(0x111111, 1.5));
  const accent = new THREE.PointLight(0xe8ff00, 3, 20);
  scene.add(accent);
  const pillars = [];
  const geo = new THREE.BoxGeometry(1.4, 12, 1.4);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.2 });
  for (let r = 0; r < 13; r++) {
    for (let c = 0; c < 19; c++) {
      const mat = baseMat.clone();
      const mesh = new THREE.Mesh(geo, mat);
      const x = (c - 9) * 1.65;
      const z = (r - 6) * 1.65;
      mesh.position.set(x, 0, z);
      mesh.userData = { ox: x, oz: z };
      scene.add(mesh);
      pillars.push(mesh);
    }
  }
  const mouse = new THREE.Vector2(99, 99);
  const raycaster = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -5);
  const hit = new THREE.Vector3();
  const neonCol = new THREE.Color(0xe8ff00);
  const baseCol = new THREE.Color(0x2a2a2a);
  const onMouse = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };
  document.addEventListener("mousemove", onMouse);
  let scrollPct = 0;
  const onScroll = () => {
    scrollPct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
  };
  window.addEventListener("scroll", onScroll);
  let raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(floorPlane, hit);
    camera.position.x = Math.sin(scrollPct * Math.PI * 2) * 1.5;
    camera.position.z = scrollPct * 2;
    camera.lookAt(0, 0, camera.position.z);
    const t = Date.now() * 0.0005;
    accent.position.x = Math.sin(t) * 8;
    accent.position.z = Math.cos(t) * 8;
    pillars.forEach((p) => {
      const dx = hit.x - p.userData.ox;
      const dz = hit.z - p.userData.oz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      let inf = Math.max(0, 1 - dist / 6);
      inf = inf * inf * inf;
      p.position.y += (-inf * 6 - p.position.y) * 0.1;
      p.material.color.copy(baseCol.clone().lerp(neonCol, inf * 0.8));
      p.material.emissive.copy(neonCol).multiplyScalar(inf * 0.25);
    });
    renderer.render(scene, camera);
  }
  tick();
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener("resize", onResize);
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("mousemove", onMouse);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    renderer.dispose();
  };
}
