"use client";

import React, { useRef, Suspense, useMemo } from "react";
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
// Flowing Part Component
// ----------------------------------------------------------------------------
function FlowingPart({
  width,
  height,
  depth = 0.04,
  color,
  delay,
  offsetY = 0,
}: {
  width: number;
  height: number;
  depth?: number;
  color: string;
  delay: number;
  offsetY?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lastCamPos = useRef(new THREE.Vector3());
  const intensity = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, height, depth, 4, 8, 1);
    geo.translate(0, -height / 2, 0);
    return geo;
  }, [width, height, depth]);

  const initialPositions = useMemo(() => {
    return new Float32Array(geometry.attributes.position.array);
  }, [geometry]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    
    // 카메라 이동 속도에 따라 찰랑임 세기 조절
    const camDist = state.camera.position.distanceTo(lastCamPos.current);
    intensity.current = THREE.MathUtils.lerp(intensity.current, camDist * 10, 0.05);
    lastCamPos.current.copy(state.camera.position);

    const positions = meshRef.current.geometry.attributes.position;
    // 더욱 미세한 찰랑임 (0.4 -> 0.08)
    const sway = 0.001 + intensity.current * 0.08;

    for (let i = 0; i < positions.count; i++) {
      const x = initialPositions[i * 3];
      const y = initialPositions[i * 3 + 1];
      const z = initialPositions[i * 3 + 2];

      const absoluteY = y + offsetY;
      const ny = Math.abs(absoluteY) / 1.5; 
      // 지수를 높여 하단만 살짝 흔들리게 (1.5 -> 2.5)
      const power = Math.pow(ny, 2.5);

      // 속도와 강도를 최소화
      const waveZ =
        Math.sin(t * 1.2 + absoluteY * 2 + delay) * (power * sway) +
        Math.cos(t * 1.0 + x * 3 + delay) * (power * 0.005);
      
      const waveX = Math.sin(t * 0.8 + absoluteY * 1.2 + delay) * (power * sway * 0.15);

      positions.setZ(i, z + waveZ);
      positions.setX(i, x + waveX);
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, offsetY, 0]} castShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

// ----------------------------------------------------------------------------
// Detailed Clothing Item
// ----------------------------------------------------------------------------
function Cloth({
  position,
  color,
  delay,
  rotation = [0, 0, 0],
  type = "shirt",
  sizeVariation = 1,
}: {
  position: [number, number, number];
  color: string;
  delay: number;
  rotation?: [number, number, number];
  type?: "shirt" | "coat" | "pants";
  sizeVariation?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const rotationZ = useRef(0);
  const velocity = useRef(0);
  const lastCamPos = useRef(new THREE.Vector3());
  const camVelocity = useRef(0);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    const camDist = state.camera.position.distanceTo(lastCamPos.current);
    camVelocity.current = THREE.MathUtils.lerp(camVelocity.current, camDist, 0.1);
    lastCamPos.current.copy(state.camera.position);

    // 카메라 움직임이 있을 때 전체 그룹이 눈에 거의 안 띄게 흔들림 (0.5 -> 0.05)
    const target = Math.sin(t * 1.0 + delay) * (0.0005 + camVelocity.current * 0.05);
    const stiffness = 0.02;
    const damping = 0.95;

    velocity.current += (target - rotationZ.current) * stiffness;
    velocity.current *= damping;
    rotationZ.current += velocity.current;

    group.current.rotation.z = rotationZ.current;
  });

  const isCoat = type === "coat";
  const isPants = type === "pants";
  
  const bodyLength = (isCoat ? 1.4 : isPants ? 0.3 : 0.85) * sizeVariation;
  const bodyWidth = (isPants ? 0.42 : 0.48) * sizeVariation;

  return (
    <group position={position} ref={group} rotation={rotation}>
      {/* Hanger Group */}
      <group>
        <mesh position={[0, 0.025, 0]}>
          <torusGeometry args={[0.025, 0.004, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#888" metalness={0.8} roughness={0.3} />
        </mesh>
        <Cylinder args={[0.004, 0.004, 0.075]} position={[0, -0.0125, 0]}>
          <meshStandardMaterial color="#888" metalness={0.8} />
        </Cylinder>
        <Cylinder
          args={[0.004, 0.004, bodyWidth]}
          position={[0, -0.05, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <meshStandardMaterial color="#888" metalness={0.8} />
        </Cylinder>
      </group>

      {/* Shirt / Coat Components */}
      {!isPants && (
        <group position={[0, -0.05, 0]}>
          {/* Shoulders */}
          <Box args={[bodyWidth, 0.08, 0.12]} position={[0, -0.04, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.8} />
          </Box>
          
          {/* Detail Parts */}
          {isCoat ? (
            <>
              {/* Lapels */}
              <Box args={[0.1, 0.5, 0.14]} position={[-0.1, -0.25, 0.02]} rotation={[0, 0, 0.05]}>
                <meshStandardMaterial color={color} roughness={0.7} />
              </Box>
              <Box args={[0.1, 0.5, 0.14]} position={[0.1, -0.25, 0.02]} rotation={[0, 0, -0.05]}>
                <meshStandardMaterial color={color} roughness={0.7} />
              </Box>
            </>
          ) : (
            /* Shirt Crew-neck & Pocket */
            <>
              <Cylinder args={[0.09, 0.1, 0.05]} position={[0, 0, 0]}>
                <meshStandardMaterial color={color} roughness={0.8} />
              </Cylinder>
              <Box args={[0.1, 0.12, 0.01]} position={[0.1, -0.2, 0.05]}>
                <meshStandardMaterial color={color} roughness={0.9} />
              </Box>
            </>
          )}

          {/* Main Body */}
          <FlowingPart width={bodyWidth} height={bodyLength} color={color} delay={delay} offsetY={-0.08} />
          
          {/* Sleeves */}
          <group position={[-bodyWidth / 2, -0.04, 0]} rotation={[0, 0, 0.1]}>
            <FlowingPart width={0.14} height={isCoat ? 1.2 : 0.4} color={color} delay={delay + 0.1} offsetY={0} />
          </group>
          <group position={[bodyWidth / 2, -0.04, 0]} rotation={[0, 0, -0.1]}>
            <FlowingPart width={0.14} height={isCoat ? 1.2 : 0.4} color={color} delay={delay + 0.2} offsetY={0} />
          </group>
        </group>
      )}

      {/* Pants Component */}
      {isPants && (
        <group position={[0, -0.05, 0]}>
          {/* Waist */}
          <Box args={[bodyWidth, 0.2, 0.15]} position={[0, -0.1, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.8} />
          </Box>
          {/* Belt line detail */}
          <Box args={[bodyWidth + 0.02, 0.04, 0.16]} position={[0, -0.06, 0]}>
            <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
          </Box>
          {/* Legs */}
          <group position={[-0.1, -0.2, 0]}>
            <FlowingPart width={0.2} height={0.9} color={color} delay={delay} offsetY={0} />
          </group>
          <group position={[0.1, -0.2, 0]}>
            <FlowingPart width={0.2} height={0.9} color={color} delay={delay + 0.1} offsetY={0} />
          </group>
        </group>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------------
// Room Environment
// ----------------------------------------------------------------------------
function RoomEnvironment() {
  return (
    <>
      <Plane args={[10, 10]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#f0f0f0" roughness={1} metalness={0.0} />
      </Plane>
      <Plane args={[10, 8]} position={[0, 4, -3]} receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Plane>
      <Plane args={[10, 8]} rotation={[0, Math.PI / 2, 0]} position={[-3, 4, 0]} receiveShadow>
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Plane>
      <Box args={[10, 0.2, 0.1]} position={[0, 0.1, -2.95]} receiveShadow>
        <meshStandardMaterial color="#333" roughness={0.8} />
      </Box>
    </>
  );
}

// ----------------------------------------------------------------------------
// Large Mirror
// ----------------------------------------------------------------------------
function Mirror() {
  return (
    <group position={[1.4, 0, -2.2]} rotation={[-0.05, -0.4, 0]}>
      {/* Mirror Frame */}
      <Box args={[1.4, 2.8, 0.05]} position={[0, 1.4, 0]} castShadow>
        <meshStandardMaterial color="#d1d5db" roughness={0.5} />
      </Box>
      {/* Mirror Surface */}
      <Plane args={[1.3, 2.7]} position={[0, 1.4, 0.03]}>
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#101010"
          metalness={0.5}
          mirror={1}
        />
      </Plane>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Clothing Rack
// ----------------------------------------------------------------------------
function ClothingRack() {
  const rackLength = 2.6;
  
  // Stable random variations to avoid lint errors
  const clothingData = useMemo(() => {
    return Array.from({ length: 17 }).map((_, i) => {
      let color = "#111";
      let type: "shirt" | "coat" | "pants" = "coat";

      if (i > 5 && i <= 9) {
        color = i % 2 === 0 ? "#f4f4f4" : "#e0e0e0";
        type = "shirt";
      } else if (i === 10) {
        color = "#777";
        type = "shirt";
      } else if (i > 10) {
        color = "#1a1a1a";
        type = i === 12 || i === 14 ? "pants" : "coat";
      }

      // Pseudo-random size variation
      const sizeVar = 0.9 + ((i * 13 + 7) % 10) * 0.02;

      return { color, type, sizeVar };
    });
  }, []);

  return (
    <group position={[-1.2, 0, -1.2]}>
      <Cylinder args={[0.2, 0.2, 0.05, 32]} position={[-1.1, 0.025, 0]} castShadow>
        <meshStandardMaterial color="#444" />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 0.05, 32]} position={[1.1, 0.025, 0]} castShadow>
        <meshStandardMaterial color="#444" />
      </Cylinder>
      <Cylinder args={[0.02, 0.02, 1.8]} position={[-1.1, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#999" metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.02, 0.02, 1.8]} position={[1.1, 0.9, 0]} castShadow>
        <meshStandardMaterial color="#999" metalness={0.8} />
      </Cylinder>
      <Cylinder args={[0.02, 0.02, rackLength]} position={[0, 1.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#999" metalness={0.8} />
      </Cylinder>

      {clothingData.map((data, i) => (
        <Cloth
          key={i}
          position={[-1.0 + i * 0.13, 1.8, 0]}
          color={data.color}
          delay={i * 0.1}
          rotation={[0, Math.PI / 2, 0]}
          type={data.type}
          sizeVariation={data.sizeVar}
        />
      ))}
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[-2, 4, 1]} intensity={1} color="#fff" />
      
      <RoomEnvironment />
      <ClothingRack />
      <Mirror />
      
      <Environment preset="city" />
    </>
  );
}

export default function ClothesPage() {
  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", backgroundColor: "#fff" }}>
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}>
        <Link href="/" style={{ color: "#000", textDecoration: "none", fontSize: "24px" }}>←</Link>
      </div>

      <Canvas shadows camera={{ position: [0, 1.6, 4], fov: 45 }}>
        <Suspense fallback={<Html center>LOADING...</Html>}>
          <Scene />
          <OrbitControls 
            target={[0, 1.1, -1.2]} 
            minPolarAngle={Math.PI / 3} 
            maxPolarAngle={Math.PI / 2}
            enablePan={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
