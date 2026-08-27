import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import MagneticButton from "./MagneticButton";
import HackerText from "../../shared/components/HackerText";

const GLITCH_VERT = `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const GLITCH_FRAG = `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uStrength;
  varying vec2 vUv;

  float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453);
  }

  void main(){
    vec2 uv = vUv;
    float band = floor(uv.y * 80.0) / 80.0;
    float glitchNoise = rand(vec2(band, floor(uTime * 30.0)));
    float glitch = step(0.92 - uStrength * 0.35, glitchNoise);
    float shift = (rand(vec2(band, uTime)) - 0.5) * 0.08 * uStrength;
    uv.x += shift * glitch;
    float ca = 0.006 * uStrength;
    float r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
    float g = texture2D(tDiffuse, uv).g;
    float b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;
    float grain = (rand(uv + uTime) - 0.5) * 0.04 * uStrength;
    gl_FragColor = vec4(r + grain, g + grain, b + grain, 1.0);
  }
`;

function makeBody(mesh, scale) {
  return {
    mesh,
    vx: 0,
    vy: 0,
    ax: ((Math.random() - 0.5) * 3) / scale,
    rx: (Math.random() - 0.5) * 4,
    ry: (Math.random() - 0.5) * 3,
    rz: (Math.random() - 0.5) * 5,
    active: false,
    gravity: -28 / scale,
    floor: -5.5 / scale,
    bounced: false,
    _delay: 0,
    _fired: false,
  };
}

function stepBody(b, dt) {
  if (!b.active) return;
  if (!b.bounced) {
    b.vy += b.gravity * dt;
    b.vx += b.ax * dt * 0.4;
  }
  b.mesh.position.x += b.vx * dt;
  b.mesh.position.y += b.vy * dt;
  b.mesh.rotation.x += b.rx * dt;
  b.mesh.rotation.y += b.ry * dt;
  b.mesh.rotation.z += b.rz * dt;
  if (b.mesh.position.y <= b.floor) {
    b.mesh.position.y = b.floor;
    b.vy *= -0.35;
    b.vx *= 0.75;
    b.rx *= 0.6;
    b.ry *= 0.6;
    b.rz *= 0.6;
    if (Math.abs(b.vy) < 0.5) {
      b.vy = 0;
      b.bounced = true;
    }
  }
}

export default function CTASection() {
  const mountRef = useRef(null);
  const stateRef = useRef({ fire: false });
  const [show, setShow] = useState(false);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.25, triggerOnce: true });

  const setRefs = (el) => {
    mountRef.current = el;
    inViewRef(el);
  };

  useEffect(() => {
    if (!inView) return;
    setShow(true);
    const t = setTimeout(() => {
      stateRef.current.fire = true;
    }, 900);
    return () => clearTimeout(t);
  }, [inView]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Use ResizeObserver instead of reading clientWidth/Height immediately
    // This avoids forced synchronous layout (reflow) on mount.
    let W = window.innerWidth > 768 ? window.innerWidth * 0.8 : window.innerWidth;
    let H = 400; // default fallback

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // We will size it correctly inside the resize observer
    renderer.setClearColor(new THREE.Color('#e8ff00'));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 15);

    scene.add(new THREE.AmbientLight(0xfffde0, 2.5));
    const dir = new THREE.DirectionalLight(0xffffff, 3);
    dir.position.set(4, 12, 6);
    scene.add(dir);
    const pt1 = new THREE.PointLight(0xe8ff00, 2.5, 30);
    pt1.position.set(-6, 8, 4);
    scene.add(pt1);
    const pt2 = new THREE.PointLight(0xff4400, 1.5, 20);
    pt2.position.set(6, -4, 3);
    scene.add(pt2);

    const scale = W < 768 ? Math.max(0.4, W / 768) : 1;
    const mainGroup = new THREE.Group();
    mainGroup.scale.set(scale, scale, scale);
    scene.add(mainGroup);

    function makeLetterMesh(letter, x, y) {
      const cvs = document.createElement("canvas");
      cvs.width = 256;
      cvs.height = 256;
      const ctx = cvs.getContext("2d");
      ctx.clearRect(0, 0, 256, 256);
      ctx.fillStyle = "#0a0a0a";
      ctx.font = "900 200px 'Barlow Condensed', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, 128, 128);
      const tex = new THREE.CanvasTexture(cvs);
      const mat = new THREE.MeshPhysicalMaterial({
        map: tex,
        transparent: true,
        roughness: 0.05,
        metalness: 0.1,
        alphaTest: 0.05,
      });
      const geo = new THREE.PlaneGeometry(1.8, 2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      mainGroup.add(mesh);
      return mesh;
    }

    const lines = [
      { text: "READY?", y: 3.5 / scale, baseDelay: 0 },
      { text: "SET.", y: 1.0 / scale, baseDelay: 250 },
      { text: "LAUNCH.", y: -1.8 / scale, baseDelay: 500 },
    ];

    const bodies = [];
    lines.forEach((line) => {
      const chars = line.text.split("");
      const totalW = chars.length * 1.5;
      const startX = -totalW / 2 + 0.75;
      chars.forEach((ch, ci) => {
        const mesh = makeLetterMesh(ch, startX + ci * 1.5, line.y);
        const b = makeBody(mesh, scale);
        b._delay = line.baseDelay + ci * 60;
        bodies.push(b);
      });
    });

    const subCvs = document.createElement("canvas");
    subCvs.width = 1024;
    subCvs.height = 64;
    const subCtx = subCvs.getContext("2d");
    subCtx.fillStyle = "rgba(0,0,0,0.4)";
    subCtx.font = "400 28px 'Space Mono', monospace";
    subCtx.textAlign = "center";
    subCtx.textBaseline = "middle";
    subCtx.fillText("READY WHEN YOU ARE — NO CONFIG REQUIRED.", 512, 32);
    const subTex = new THREE.CanvasTexture(subCvs);
    const subMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 0.44),
      new THREE.MeshBasicMaterial({ map: subTex, transparent: true })
    );
    subMesh.position.set(0, -4.5 / scale, 0);
    mainGroup.add(subMesh);

    const rt = new THREE.WebGLRenderTarget(W, H);
    const postScene = new THREE.Scene();
    const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const glitchMat = new THREE.ShaderMaterial({
      vertexShader: GLITCH_VERT,
      fragmentShader: GLITCH_FRAG,
      uniforms: {
        tDiffuse: { value: rt.texture },
        uTime: { value: 0 },
        uStrength: { value: 0 },
      },
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glitchMat);
    postScene.add(quad);

    let raf;
    let fireStart = null;
    let globalFired = false;
    animate._last = performance.now();

    function animate() {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - animate._last) / 1000);
      animate._last = now;

      const shouldFire = stateRef.current.fire;

      if (shouldFire && !globalFired) {
        globalFired = true;
        fireStart = now;
      }

      if (globalFired && fireStart !== null) {
        const elapsed = now - fireStart;
        bodies.forEach((b) => {
          if (!b._fired && elapsed >= b._delay) {
            b.active = true;
            b._fired = true;
            b.vy = (2 + Math.random() * 3) / scale;
          }
          stepBody(b, dt);
        });

        const strength = Math.max(0, Math.min(1, (elapsed - 600) / 800));
        glitchMat.uniforms.uStrength.value = strength;
      }

      glitchMat.uniforms.uTime.value = now * 0.001;
      pt1.intensity = 2.5 + Math.sin(now * 0.003) * 0.8;

      renderer.setRenderTarget(rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCam);
    }

    animate();

    const ro = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width: nW, height: nH } = entries[0].contentRect;
      if (nW === 0 || nH === 0) return;

      renderer.setSize(nW, nH);
      rt.setSize(nW, nH);
      camera.aspect = nW / nH;
      camera.updateProjectionMatrix();

      const newScale = nW < 768 ? Math.max(0.4, nW / 768) : 1;
      mainGroup.scale.set(newScale, newScale, newScale);
      
      bodies.forEach(b => {
        b.floor = -5.5 / newScale;
      });
      subMesh.position.set(0, -4.5 / newScale, 0);

      // Lazily apply background color to avoid synchronous style recalculation reflows on mount
      const accentCSS = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e8ff00';
      renderer.setClearColor(new THREE.Color(accentCSS));
    });
    
    ro.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      rt.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const navigate = useNavigate()

  return (
    <section id="cta" ref={setRefs}>
      <div className="cta-canvas-wrap" ref={mountRef} />
      <div className="cta-ui">
        <div className="about-top" style={{ marginBottom: '2rem' }}>
          <div className="about-num-big" style={{ color: 'rgba(0, 0, 0, 0.08)' }}>05</div>
          <div>
            <div className={`cta-eyebrow ${show ? "vis" : ""}`} style={{ marginBottom: 0 }}><HackerText text="// GET STARTED" /></div>
          </div>
        </div>
        <div className={`cta-tagline ${show ? "vis" : ""}`}>
          <span>READY TO</span>
          <span>DEPLOY YOUR</span>
          <span className="cta-accent">NEXT APP.</span>
        </div>
        <p className={`cta-sub ${show ? "vis" : ""}`}>Connect your GitHub and push to production — no server config required.</p>
        <div className="cta-buttons-wrap" style={{ display: 'flex', gap: '1.5rem' }}>
          <MagneticButton onClick={() => {
            navigate('/register')
          }} className={`cta-btn ${show ? "vis" : ""}`}><HackerText text="REGISTER NOW →" /></MagneticButton>
          <MagneticButton onClick={() => {
            navigate('/login')
          }} className={`cta-btn cta-btn-outline ${show ? "vis" : ""}`}><HackerText text="LOGIN" /></MagneticButton>
        </div>
      </div>
    </section>
  );
}
