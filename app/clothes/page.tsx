"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  MeshReflectorMaterial,
  Box,
  Cylinder,
  Plane,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

// ----------------------------------------------------------------------------
// Swayer Clothing Item
// ----------------------------------------------------------------------------
function Cloth({
  position,
  color,
  delay,
  rotation = [0, 0, 0],
  type = "shirt",
}: {
  position: [number, number, number];
  color: string;
  delay: number;
  rotation?: [number, number, number];
  type?: "shirt" | "coat" | "pants";
}) {
  const group = useRef<THREE.Group>(null);
  const rotationZ = useRef(0);
  const velocity = useRef(0);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const target = state.pointer.x * 0.3 + Math.sin(t * 1.5 + delay) * 0.02;
    const stiffness = 0.06;
    const damping = 0.92;

    velocity.current += (target - rotationZ.current) * stiffness;
    velocity.current *= damping;
    rotationZ.current += velocity.current;

    group.current.rotation.z = rotationZ.current;
  });

  const isCoat = type === "coat";
  const length = isCoat ? 1.4 : type === "pants" ? 1.0 : 0.85;
  const width = type === "pants" ? 0.35 : 0.45;

  return (
    <group position={position} ref={group} rotation={rotation}>
      {/* Hanger Hook */}
      <mesh position={[0, 0.025, 0]}>
        <torusGeometry args={[0.025, 0.004, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#a3a3a3" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Hanger Neck */}
      <Cylinder args={[0.004, 0.004, 0.075]} position={[0, -0.0125, 0]}>
        <meshStandardMaterial color="#a3a3a3" metalness={0.8} />
      </Cylinder>
      {/* Hanger Body */}
      <Cylinder
        args={[0.004, 0.004, width - 0.05]}
        position={[0, -0.05, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshStandardMaterial color="#a3a3a3" metalness={0.8} />
      </Cylinder>

      {/* Shoulders */}
      {type !== "pants" && (
        <Box args={[width, 0.04, 0.08]} position={[0, -0.07, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.9} />
        </Box>
      )}

      {/* Main Body */}
      <Box
        args={[width * 0.95, length, 0.06]}
        position={[0, -0.07 - length / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color={color} roughness={0.9} />
      </Box>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Room Shell (Smaller, Cozier Layout)
// ----------------------------------------------------------------------------
function RoomEnvironment() {
  return (
    <>
      {/* Concrete-ish Floor */}
      <Plane
        args={[10, 10]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#e0dfdb" roughness={1} metalness={0.0} />
      </Plane>

      {/* Back Wall */}
      <Plane args={[10, 8]} position={[0, 4, -3]} receiveShadow>
        <meshStandardMaterial color="#fcfcfc" roughness={0.9} />
      </Plane>
      {/* Baseboard Back */}
      <Box args={[10, 0.2, 0.1]} position={[0, 0.1, -2.95]} receiveShadow>
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </Box>

      {/* Left Wall */}
      <Plane
        args={[10, 8]}
        rotation={[0, Math.PI / 2, 0]}
        position={[-3, 4, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#fcfcfc" roughness={0.9} />
      </Plane>
      {/* Baseboard Left */}
      <Box args={[0.1, 0.2, 10]} position={[-2.95, 0.1, 0]} receiveShadow>
        <meshStandardMaterial color="#111111" roughness={0.8} />
      </Box>

      {/* Ceiling details (optional minimal light tube) */}
      <Cylinder
        args={[0.05, 0.05, 4]}
        position={[0, 4.9, -1.5]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <meshBasicMaterial color="#ffffff" />
      </Cylinder>
    </>
  );
}

// ----------------------------------------------------------------------------
// Metal Clothing Rack
// ----------------------------------------------------------------------------
function ClothingRack() {
  const rackLength = 2.6;
  return (
    <group position={[-1.2, 0, -1.2]}>
      {/* Heavy Round Bases */}
      <Cylinder
        args={[0.25, 0.25, 0.04, 32]}
        position={[-1.1, 0.02, 0]}
        castShadow
      >
        <meshStandardMaterial color="#444" metalness={0.2} roughness={0.8} />
      </Cylinder>
      <Cylinder
        args={[0.25, 0.25, 0.04, 32]}
        position={[1.1, 0.02, 0]}
        castShadow
      >
        <meshStandardMaterial color="#444" metalness={0.2} roughness={0.8} />
      </Cylinder>

      {/* Base Inner Joints */}
      <Cylinder
        args={[0.12, 0.12, 0.06, 32]}
        position={[-1.1, 0.03, 0]}
        castShadow
      >
        <meshStandardMaterial color="#9ca3af" metalness={0.8} />
      </Cylinder>
      <Cylinder
        args={[0.12, 0.12, 0.06, 32]}
        position={[1.1, 0.03, 0]}
        castShadow
      >
        <meshStandardMaterial color="#9ca3af" metalness={0.8} />
      </Cylinder>

      {/* Upright Posts */}
      <Cylinder args={[0.025, 0.025, 1.8]} position={[-1.1, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#9ca3af" metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.025, 0.025, 1.8]} position={[1.1, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#9ca3af" metalness={0.8} />
      </Cylinder>

      {/* Top Rod */}
      <Cylinder
        args={[0.025, 0.025, rackLength]}
        position={[0, 1.8, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color="#9ca3af" metalness={0.8} />
      </Cylinder>

      {/* Corner Joints */}
      <Box args={[0.06, 0.06, 0.06]} position={[-1.1, 1.8, 0]} castShadow>
        <meshStandardMaterial color="#6b7280" />
      </Box>
      <Box args={[0.06, 0.06, 0.06]} position={[1.1, 1.8, 0]} castShadow>
        <meshStandardMaterial color="#6b7280" />
      </Box>

      {/* Clothes */}
      {Array.from({ length: 17 }).map((_, i) => {
        let color = "#111"; // Default black
        let type: "shirt" | "coat" | "pants" = "coat";

        // Mimic image: Black coats left, white/gray middle, black/dark right
        if (i > 5 && i <= 9) {
          color = i % 2 === 0 ? "#f4f4f4" : "#e5e5e5"; // White/light gray shirts
          type = "shirt";
        } else if (i === 10) {
          color = "#888"; // Mid gray
          type = "shirt";
        } else if (i > 10) {
          color = "#151515"; // Dark gray/black
          type = i === 12 || i === 14 ? "pants" : "coat";
        }

        return (
          <Cloth
            key={i}
            position={[-1.0 + i * 0.12, 1.8, 0]}
            color={color}
            delay={i * 0.15}
            rotation={[0, Math.PI / 6, 0]}
            type={type}
          />
        );
      })}
    </group>
  );
}

// ----------------------------------------------------------------------------
// Large Mirror leaning against the wall
// ----------------------------------------------------------------------------
function Mirror() {
  return (
    <group position={[1.5, 0, -2.4]} rotation={[-0.08, -0.3, 0]}>
      {/* Mirror Frame */}
      <Box args={[1.6, 3.2, 0.05]} position={[0, 1.6, 0]} castShadow>
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
      </Box>
      {/* Mirror Surface using Drei's MeshReflectorMaterial */}
      <Plane args={[1.5, 3.1]} position={[0, 1.6, 0.03]}>
        <MeshReflectorMaterial
          blur={[0, 0]}
          resolution={1024}
          mirror={1}
          color="#a0a0a0"
          roughness={0.05}
          metalness={0.8}
          depthScale={1}
        />
      </Plane>
    </group>
  );
}

// ----------------------------------------------------------------------------
// The Main Scene Assembly
// ----------------------------------------------------------------------------
function Scene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[0, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      {/* A light positioned where the fluorescent tube is in the mirror reflection */}
      <pointLight position={[0, 4, 0]} intensity={1.5} color="#f0fdf4" />

      <RoomEnvironment />
      <ClothingRack />
      <Mirror />

      <Environment preset="studio" />
    </>
  );
}

export default function ClothesPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {/* HUD Layer (Matching Aquarium Page style) */}
      <div
        style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}
      >
        <Link
          href="/"
          style={{
            color: "#000000",
            textDecoration: "none",
            fontSize: "20px",
          }}
        >
          ←
        </Link>
      </div>

      <Canvas shadows camera={{ position: [0, 1.6, 4.5], fov: 45 }}>
        <Suspense
          fallback={
            <Html center>
              <div style={{ color: "black", fontFamily: "sans-serif" }}>
                ENTERING ROOM...
              </div>
            </Html>
          }
        >
          <Scene />
          <OrbitControls
            target={[0, 1.2, -1.5]}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
            enablePan={false}
            minDistance={2}
            maxDistance={7}
          />
        </Suspense>
      </Canvas>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
