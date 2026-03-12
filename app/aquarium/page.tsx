"use client";

import React, { useRef, useMemo, useState, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>;
import * as THREE from "three";
import { useTheme } from "../theme-provider";
import { BackButton } from "../../components/BackButton";

const FISH_COUNT = 30;
const BOUNDS = 8;

const SPECIMENS = Array.from({ length: FISH_COUNT }).map((_, i) => ({
  id: `S-${(i + 1).toString().padStart(2, "0")}`,
  name: `Specimen ${i + 1}`,
  type: i % 3 === 0 ? "Predator" : i % 3 === 1 ? "Neutral" : "Prey",
}));

interface FoodItem {
  id: number;
  position: THREE.Vector3;
}

const Fish = memo(({
  themeColors,
  visible,
  isFollowing,
  controlsRef,
  foods,
  onEat,
}: {
  themeColors: { fg: string };
  visible: boolean;
  isFollowing: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  foods: FoodItem[];
  onEat: (id: number) => void;
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
    if (!visible) return;

    const position = meshRef.current.position;

    // Food attraction
    let isAttracted = false;
    if (foods.length > 0) {
      let closestFood: FoodItem | null = null;
      let minDistance = 6;
      
      for (const f of foods) {
        const d = position.distanceTo(f.position);
        if (d < minDistance) {
          minDistance = d;
          closestFood = f;
        }
      }

      if (closestFood) {
        const steer = closestFood.position.clone().sub(position).normalize().multiplyScalar(0.012);
        data.velocity.add(steer);
        isAttracted = true;

        if (minDistance < 0.4) {
          onEat(closestFood.id);
        }
      }
    }

    if (!isAttracted) {
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
    }

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
});
Fish.displayName = "Fish";

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

  // Interaction States
  const [mode, setMode] = useState<"view" | "feed">("view");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const mouseRef = useRef(new THREE.Vector3());

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

  const handleCanvasClick = () => {
    if (mode === "feed") {
      const food: FoodItem = {
        id: Date.now(),
        position: mouseRef.current.clone(),
      };
      setFoods((prev) => [...prev, food]);
      
      setTimeout(() => {
        setFoods((prev) => prev.filter(f => f.id !== food.id));
      }, 8000);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    const pos = new THREE.Vector3(x * 12, y * 8, 0);
    mouseRef.current.copy(pos);
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
      <div
        style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100, display: "flex", gap: "10px", alignItems: "center" }}
      >
        <BackButton />
        <div style={{ 
          display: "flex", 
          background: "rgba(255, 255, 255, 0.05)", 
          backdropFilter: "blur(12px)",
          borderRadius: "24px", 
          padding: "4px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
        }}>
            {["view", "feed"].map((m) => (
                <button
                    key={m}
                    onClick={() => {
                        setMode(m as "view" | "feed");
                    }}
                    style={{
                        padding: "8px 20px",
                        borderRadius: "20px",
                        border: "none",
                        background: mode === m ? "white" : "transparent",
                        color: mode === m ? "black" : themeColors.fg,
                        cursor: "pointer",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        fontWeight: "800",
                        letterSpacing: "0.05em",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                >
                    {m}
                </button>
            ))}
        </div>
      </div>

      <button className="sim-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "CLOSE" : "SPECIMENS"}
      </button>

      <div
        className={`sim-backdrop ${isOpen ? "show" : ""}`}
        onClick={() => setIsOpen(false)}
      />

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
          </ul>
        </div>
      </aside>

      <Canvas 
        camera={{ position: [0, 5, 20], fov: 45 }}
        onClick={handleCanvasClick}
        onPointerMove={handlePointerMove}
      >
        <color attach="background" args={[themeColors.bg]} />
        <ambientLight intensity={1.5} />
        <CameraTargetReset
          followingId={followingId}
          controlsRef={controlsRef}
        />

        {/* Food Particles */}
        {foods.map((f) => (
          <mesh key={f.id} position={f.position}>
             <boxGeometry args={[0.08, 0.08, 0.08]} />
             <meshStandardMaterial color="#d97706" roughness={1} />
          </mesh>
        ))}

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
              foods={foods}
              onEat={(foodId) => setFoods(prev => prev.filter(f => f.id !== foodId))}
            />
          );
        })}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enablePan={false}
          maxDistance={40}
          minDistance={10}
          enabled={mode === "view"}
        />
      </Canvas>
    </div>
  );
}
