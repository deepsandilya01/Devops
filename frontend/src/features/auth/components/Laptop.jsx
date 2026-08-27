import { Environment, Float, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";

function LaptopModel() {
  const { scene } = useGLTF("/laptop_model/scene.gltf");
  const laptopRef = useRef();
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);
  return (
    <>
      <primitive
        ref={laptopRef}
        object={scene}
        rotation={[0.5, -1.5, 0]}
        scale={[1.5, 1.5, 1.5]}
        position={[0, 0, 0]}
      />
      <OrbitControls enableZoom={false} />
    </>
  );
}

const Laptop = () => {
  return (
    <Canvas
      style={{
        position: "absolute",
        top: 100,
        height: "150%",
        width: "100%",
      }}
    >
      <React.Suspense fallback={null}>
        <Float rotationIntensity={2}  speed={2}>
          <LaptopModel />
        </Float>
        <ambientLight intensity={0.3} />
        <Environment preset="city" />
      </React.Suspense>
    </Canvas>
  );
};

export default Laptop;
