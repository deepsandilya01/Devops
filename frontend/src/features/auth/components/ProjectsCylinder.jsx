import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import HackerText from '../../shared/components/HackerText';

const DEPLOY_STEPS = [
  { num: "01", title: "Push", desc: "Connect your repo. Every git push triggers an automatic build pipeline.", tag: "GIT · CI/CD" },
  { num: "02", title: "Build", desc: "Optimized builds with smart caching — zero-config for all frameworks.", tag: "WEBPACK · VITE" },
  { num: "03", title: "Deploy", desc: "Instant global deployment to edge nodes. Preview every branch.", tag: "EDGE · CDN" },
  { num: "04", title: "Monitor", desc: "Real-time analytics, error tracking, and performance scoring.", tag: "LOGS · METRICS" },
  { num: "05", title: "Scale", desc: "Auto-scaling infrastructure that grows with your traffic demands.", tag: "SERVERLESS" },
  { num: "06", title: "Ship", desc: "Production-ready with rollbacks, custom domains, and SSL.", tag: "DNS · HTTPS" },
];

function FloatingParticles({ count = 100, radius = 7 }) {
  const points = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius * (0.4 + Math.random() * 0.8);
      const y = (Math.random() - 0.5) * 10;
      pos[i * 3] = Math.sin(angle) * r;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.cos(angle) * r;
    }
    return pos;
  }, [count, radius]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y -= 0.00005;
    const arr = points.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 0.4 + i * 0.5) * 0.001;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#e8ff00"
        size={0.05}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

function CylinderGroup() {
  const groupRef = useRef();
  const radius = 7.5;
  const height = 5.5;
  const stepCount = DEPLOY_STEPS.length;

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= 0.001;
    }
  });

  const cardData = useMemo(() => {
    return DEPLOY_STEPS.map((_, i) => {
      const angle = (i / stepCount) * Math.PI * 2;
      const yOffset = i % 2 === 0 ? 0.6 : -0.6;
      return { angle, y: yOffset };
    });
  }, [stepCount]);

  const verticalLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.sin(a) * radius;
      const z = Math.cos(a) * radius;
      const pts = [
        new THREE.Vector3(x, -height / 2, z),
        new THREE.Vector3(x, height / 2, z),
      ];
      lines.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return lines;
  }, [radius, height]);

  return (
    <group ref={groupRef}>
      {/* Main wireframe cylinder - outer */}
      <mesh>
        <cylinderGeometry scale={[10,10,10]} args={[radius, radius, height, 64, 4, true]} />
        <meshStandardMaterial
          color="#e8ff00"
          wireframe
          transparent
          opacity={0.18}
          emissive="#e8ff00"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Solid inner glow cylinder */}
      <mesh>
        <cylinderGeometry args={[radius - 0.02, radius - 0.02, height, 64, 1, true]} />
        <meshStandardMaterial
          color="#e8ff00"
          transparent
          opacity={0.02}
          emissive="#e8ff00"
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner wireframe for depth */}
      <mesh>
        <cylinderGeometry args={[radius * 0.7, radius * 0.7, height * 0.8, 32, 3, true]} />
        <meshStandardMaterial
          color="#ff2d00"
          wireframe
          transparent
          opacity={0.06}
          emissive="#ff2d00"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Top ring - bright */}
      <mesh position={[0, height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.06, radius + 0.06, 64]} />
        <meshStandardMaterial
          color="#e8ff00"
          emissive="#e8ff00"
          emissiveIntensity={3}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bottom ring - bright */}
      <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.06, radius + 0.06, 64]} />
        <meshStandardMaterial
          color="#e8ff00"
          emissive="#e8ff00"
          emissiveIntensity={3}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Middle ring */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.03, radius + 0.03, 64]} />
        <meshStandardMaterial
          color="#e8ff00"
          emissive="#e8ff00"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Vertical accent lines */}
      {verticalLines.map((geo, i) => (
        <line key={`vline-${i}`} geometry={geo}>
          <lineBasicMaterial color="#e8ff00" transparent opacity={0.12} />
        </line>
      ))}

      {/* Deploy step cards on the cylinder surface */}
      {cardData.map((cd, i) => (
        <group key={i} rotation={[0, cd.angle, 0]}>
          <Html
            position={[0, cd.y, radius + 0.2]}
            transform
            distanceFactor={7}
            style={{ pointerEvents: 'none' }}
          >
            <div className="cyl-card">
              <div className="cyl-card-header">
                <div className="cyl-card-num">{DEPLOY_STEPS[i].num}</div>
                <div className="cyl-card-tag"><HackerText text={DEPLOY_STEPS[i].tag} /></div>
              </div>
              <div className="cyl-card-title"><HackerText text={DEPLOY_STEPS[i].title} /></div>
              <div className="cyl-card-line" />
              <div className="cyl-card-desc">{DEPLOY_STEPS[i].desc}</div>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

export default function ProjectsCylinder() {
  return (
    <section id="sprojects" className="projects-cylinder-sec">
      <div className="projects-cylinder-top">
        <div className="projects-cylinder-header about-top">
          <div className="about-num-big">04</div>
          <div>
            <div className="sec-num"><HackerText text="// PIPELINE" /></div>
            <div className="sec-title glitch-text" data-text="The Process">
              The<br />Process
            </div>
          </div>
        </div>
        <div className="projects-cylinder-tagline">
          <p>From <span className="accent-text">git push</span> to production in seconds.</p>
          <p className="projects-sub">Explore each step of the deployment pipeline.</p>
        </div>
      </div>
      <div className="projects-canvas-wrap">
        <Canvas
          style={{
            position:'absolute',
            left:'-2.5vw',
            height:'100vh',
            width:'100vw'
          }}
          camera={{ position: [0, 1.5, 14], fov: 50 }}
          gl={{ antialias: true, alpha: false }}
        >
          <color attach="background" args={['#0a0a0a']} />
          <fog attach="fog" args={['#0a0a0a', 14, 26]} />

          <ambientLight intensity={0.4} />
          <pointLight position={[6, 6, 6]} intensity={2} color="#e8ff00" />
          <pointLight position={[-6, -4, 4]} intensity={1} color="#ff2d00" />
          <pointLight position={[0, 8, 0]} intensity={0.8} color="#ffffff" />
          <pointLight position={[0, -6, 6]} intensity={0.5} color="#e8ff00" />

          <CylinderGroup />
          <FloatingParticles />

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3.5}
            maxPolarAngle={Math.PI / 1.6}
            dampingFactor={0.05}
            enableDamping
          />

          <EffectComposer>
            <Bloom
              intensity={2.2}
              luminanceThreshold={0.1}
              luminanceSmoothing={0.85}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
        <div className="projects-cylinder-hint">
          <span className="projects-hint-icon">↻</span>
          <span>Drag to explore · Auto-rotating</span>
        </div>
      </div>
    </section>
  );
}
