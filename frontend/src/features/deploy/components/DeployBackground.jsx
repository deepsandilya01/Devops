import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const ParticleNetwork = () => {
  const pointsRef = useRef();
  const { mouse, viewport } = useThree();

  const count = 2000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    const colorTheme = new THREE.Color('#e8ff00');
    const colorDim = new THREE.Color('#333333');
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
      
      const mixedColor = colorDim.clone().lerp(colorTheme, Math.random() * 0.5);
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x -= delta * 0.02;
      pointsRef.current.rotation.y -= delta * 0.03;
      
      // Parallax effect based on mouse
      const targetX = (mouse.x * viewport.width) * 0.1;
      const targetY = (mouse.y * viewport.height) * 0.1;
      
      pointsRef.current.position.x += (targetX - pointsRef.current.position.x) * 0.05;
      pointsRef.current.position.y += (targetY - pointsRef.current.position.y) * 0.05;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

const DeployBackground = React.memo(function DeployBackground() {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 0, 
      pointerEvents: 'none',
      opacity: 0.5
    }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <fog attach="fog" args={['#000000', 5, 15]} />
        <ParticleNetwork />
      </Canvas>
    </div>
  );
});

export default DeployBackground;
