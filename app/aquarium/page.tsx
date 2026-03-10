"use client";

import React, { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>;
import * as THREE from "three";
import { useTheme } from "../theme-provider";
import Link from "next/link";

const FISH_COUNT = 30;
const BOUNDS = 8;

const SPECIMENS = Array.from({ length: FISH_COUNT }).map((_, i) => ({
  id: `S-${(i + 1).toString().padStart(2, "0")}`,
  name: `Specimen ${i + 1}`,
  type: i % 3 === 0 ? "Predator" : i % 3 === 1 ? "Neutral" : "Prey",
}));

const Fish = ({
  themeColors,
  visible,
  isFollowing,
  controlsRef,
}: {
  themeColors: { fg: string };
  visible: boolean;
  isFollowing: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) => {
  const meshRef = useRef<THREE.Group>(null);

  const data = useMemo(
    () => ({
      position: new THREE.Vector3()
        .random()
        .subScalar(0.5)
        .multiplyScalar(BOUNDS * 1.5),
      velocity: new THREE.Vector3().randomDirection().multiplyScalar(0.025),
    }),
    [],
  );

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.visible = visible;
    if (!visible) return; // Stop physical simulation if hidden? Or keep it running in background?
    // Let's keep it running so they aren't in the same spot when they reappear

    const position = meshRef.current.position;

    if (position.length() > BOUNDS - 1) {
      const steerToCenter = position
        .clone()
        .negate()
        .normalize()
        .multiplyScalar(0.001);
      data.velocity.add(steerToCenter);
    }

    data.velocity.add(
      new THREE.Vector3().random().subScalar(0.5).multiplyScalar(0.0005),
    );

    if (data.velocity.length() > 0.05) data.velocity.setLength(0.05);

    position.add(data.velocity);
    const target = position.clone().add(data.velocity);
    meshRef.current.lookAt(target);

    if (isFollowing && controlsRef.current) {
      controlsRef.current.target.lerp(position, 0.15);
      controlsRef.current.update();
    }
  });

  return (
    <group ref={meshRef} position={data.position}>
      <mesh scale={[0.12, 0.18, 0.35]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={themeColors.fg} />
      </mesh>
      <mesh
        position={[0, 0, -0.35]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.05, 0.35, 0.25]}
      >
        <coneGeometry args={[1, 1, 3]} />
        <meshBasicMaterial color={themeColors.fg} transparent opacity={0.6} />
      </mesh>
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

const SimulationBox = () => {
  return null;
};

const CameraTargetReset = ({
  followingId,
  controlsRef,
}: {
  followingId: string | null;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) => {
  useFrame(() => {
    if (!followingId && controlsRef.current) {
      const orbit = controlsRef.current;
      if (orbit.target.length() > 0.05) {
        orbit.target.lerp(new THREE.Vector3(0, 0, 0), 0.05);
        orbit.update();
      }
    }
  });
  return null;
};

export default function AquariumPage() {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [followingId, setFollowingId] = useState<string | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const themeColors =
    theme === "dark"
      ? { bg: "#000000", fg: "#ffffff" }
      : { bg: "#ffffff", fg: "#000000" };

  const handleSearch = () => {
    setAppliedSearch(search);
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const filteredSpecimens = SPECIMENS.filter(
    (s) =>
      !appliedSearch ||
      s.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
      s.id.toLowerCase().includes(appliedSearch.toLowerCase()),
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* HUD Layer */}
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

      <button className="sim-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "CLOSE" : "SPECIMENS"}
      </button>

      {/* Simulation Panel (Side Drawer / Bottom Sheet) */}
      <aside className={`sim-panel ${isOpen ? "open" : ""}`}>
        <div className="sim-panel-content">
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-end",
              marginBottom: "24px",
            }}
          >
            <input
              type="text"
              className="sim-search"
              placeholder="Search specimen..."
              style={{ flex: 1, marginBottom: 0 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSearch}
              style={{
                background: "none",
                border: "1px solid var(--foreground)",
                color: "var(--foreground)",
                padding: "8px 12px",
                fontSize: "12px",
                cursor: "pointer",
                opacity: 0.8,
              }}
            >
              FIND
            </button>
          </div>
          <ul className="specimen-list">
            {filteredSpecimens.map((s) => (
              <li key={s.id} className="specimen-item">
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="specimen-name">{s.name}</span>
                  <span className="specimen-id">{s.id}</span>
                </div>
                <button
                  onClick={() => {
                    const newId = followingId === s.id ? null : s.id;
                    setFollowingId(newId);
                    if (
                      newId &&
                      typeof window !== "undefined" &&
                      window.innerWidth <= 768
                    ) {
                      setIsOpen(false);
                    }
                  }}
                  style={{
                    background:
                      followingId === s.id ? "var(--foreground)" : "none",
                    border: "1px solid var(--foreground)",
                    color:
                      followingId === s.id
                        ? "var(--background)"
                        : "var(--foreground)",
                    padding: "4px 8px",
                    fontSize: "10px",
                    cursor: "pointer",
                    opacity: 0.8,
                    borderRadius: "4px",
                    transition: "all 0.2s",
                  }}
                >
                  {followingId === s.id ? "FOLLOWING" : "FOLLOW"}
                </button>
              </li>
            ))}
            {filteredSpecimens.length === 0 && (
              <li
                style={{
                  opacity: 0.5,
                  fontSize: "14px",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                No entities found
              </li>
            )}
          </ul>
        </div>
      </aside>

      <Canvas camera={{ position: [0, 5, 20], fov: 45 }}>
        <color attach="background" args={[themeColors.bg]} />
        <ambientLight intensity={1.5} />
        <SimulationBox themeColors={themeColors} />
        <CameraTargetReset
          followingId={followingId}
          controlsRef={controlsRef}
        />
        {SPECIMENS.map((s) => {
          const isVisible =
            !appliedSearch ||
            s.name.toLowerCase().includes(appliedSearch.toLowerCase()) ||
            s.id.toLowerCase().includes(appliedSearch.toLowerCase());

          return (
            <Fish
              key={s.id}
              themeColors={themeColors}
              visible={isVisible}
              isFollowing={followingId === s.id}
              controlsRef={controlsRef}
            />
          );
        })}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          maxDistance={40}
          minDistance={10}
        />
      </Canvas>
    </div>
  );
}
