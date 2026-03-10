"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "../theme-provider";
import Link from "next/link";

const FISH_COUNT = 30;
const BOUNDS = 8;

const Fish = ({ themeColors }: { themeColors: { fg: string } }) => {
  const meshRef = useRef<THREE.Group>(null);

  // Random starting data
  const data = useMemo(
    () => ({
      position: new THREE.Vector3()
        .random()
        .subScalar(0.5)
        .multiplyScalar(BOUNDS * 1.5),
      velocity: new THREE.Vector3().randomDirection().multiplyScalar(0.025),
      nextPos: new THREE.Vector3().randomDirection().multiplyScalar(BOUNDS / 2),
    }),
    [],
  );

  useFrame(() => {
    if (!meshRef.current) return;

    // Movement logic (Simplified simulation)
    const position = meshRef.current.position;

    // Bounds check - steer back towards center
    if (position.length() > BOUNDS - 1) {
      const steerToCenter = position
        .clone()
        .negate()
        .normalize()
        .multiplyScalar(0.001);
      data.velocity.add(steerToCenter);
    }

    // Add some random drift
    data.velocity.add(
      new THREE.Vector3().random().subScalar(0.5).multiplyScalar(0.0005),
    );

    // Max velocity
    if (data.velocity.length() > 0.05) data.velocity.setLength(0.05);

    position.add(data.velocity);

    // Look towards velocity
    const target = position.clone().add(data.velocity);
    meshRef.current.lookAt(target);
  });

  return (
    <group ref={meshRef} position={data.position}>
      {/* Fish Body (Ellipsoid) */}
      <mesh scale={[0.12, 0.18, 0.35]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={themeColors.fg} />
      </mesh>
      {/* Fish Tail */}
      <mesh
        position={[0, 0, -0.35]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.05, 0.35, 0.25]}
      >
        <coneGeometry args={[1, 1, 3]} />
        <meshBasicMaterial color={themeColors.fg} transparent opacity={0.6} />
      </mesh>
      {/* Side Fins */}
      <mesh
        position={[0.12, 0, 0]}
        rotation={[0, 0, -Math.PI / 4]}
        scale={[0.1, 0.02, 0.15]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={themeColors.fg} transparent opacity={0.4} />
      </mesh>
      <mesh
        position={[-0.12, 0, 0]}
        rotation={[0, 0, Math.PI / 4]}
        scale={[0.1, 0.02, 0.15]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={themeColors.fg} transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

const SimulationBox = ({ themeColors }: { themeColors: { fg: string } }) => {
  return (
    <group>
      {/* Floating Simulation Cube Boundary */}
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(BOUNDS * 2, BOUNDS * 2, BOUNDS * 2)]}
        />
        <lineBasicMaterial color={themeColors.fg} transparent opacity={0.1} />
      </lineSegments>

      {/* Faint Grid representing the cage */}
      <mesh>
        <boxGeometry args={[BOUNDS * 2, BOUNDS * 2, BOUNDS * 2]} />
        <meshBasicMaterial
          color={themeColors.fg}
          transparent
          opacity={0.02}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};

export default function AquariumPage() {
  const { theme } = useTheme();
  const themeColors =
    theme === "dark"
      ? { bg: "#000000", fg: "#ffffff" }
      : { bg: "#ffffff", fg: "#000000" };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Back Button */}
      <div
        style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}
      >
        <Link
          href="/"
          style={{
            color: themeColors.fg,
            textDecoration: "none",
            fontSize: "20px",
          }}
        >
          ←
        </Link>
      </div>

      {/* Aquarium Context Header */}
      <div
        style={{
          position: "fixed",
          bottom: "40px",
          width: "100%",
          textAlign: "center",
          color: themeColors.fg,
          pointerEvents: "none",
          fontFamily: "serif",
          fontStyle: "italic",
          opacity: 0.4,
        }}
      >
        Observation of the isolated ecosystem
      </div>

      <Canvas camera={{ position: [0, 5, 20], fov: 45 }}>
        <color attach="background" args={[themeColors.bg]} />
        <ambientLight intensity={1.5} />

        <SimulationBox themeColors={themeColors} />

        {Array.from({ length: FISH_COUNT }).map((_, i) => (
          <Fish key={i} themeColors={themeColors} />
        ))}

        <OrbitControls enablePan={false} maxDistance={40} minDistance={10} />
      </Canvas>
    </div>
  );
}
