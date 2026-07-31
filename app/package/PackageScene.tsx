"use client";

import { OrbitControls, RoundedBox, Torus } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";

type PackageSceneProps = {
  selectedItems?: string[];
  onItemPacked?: (itemId: string, label: string) => void;
};

type ObjectProps = {
  selected: boolean;
};

type ScenePoint = readonly [number, number, number];

const palette = {
  cloth: "#526b57",
  clothDark: "#2c3f35",
  clothLine: "#d5c27b",
  table: "#6f4b32",
  leather: "#7a3e2f",
  canvas: "#a36f42",
  rope: "#c9a767",
  metal: "#7d8790",
  bottle: "#4d8d89",
  food: "#d88a43",
  accent: "#f6d35f",
};

const draggableItems = [
  { id: "mini-keyboard", label: "미니건반 (USB-B to C)", position: [-2.25, 0.32, -0.6], radius: 0.75 },
  { id: "macbook", label: "맥북 (맥북충전기, C to 8)", position: [1.95, 0.5, -0.95], radius: 0.68 },
  { id: "snorkel", label: "스노클", position: [-1.55, 0.2, 1.55], radius: 0.62 },
  { id: "long-fins", label: "롱핀", position: [1.62, 0.2, 1.52], radius: 0.58 },
  { id: "swim-cap", label: "수영모", position: [0.7, 0.3, -2.08], radius: 0.56 },
  { id: "sun-kit", label: "선꾸림", position: [-0.55, 0.22, -2.05], radius: 0.58 },
  { id: "camera", label: "카메라", position: [2.2, 0.3, 0.45], radius: 0.66 },
  { id: "aqua-shoes", label: "아쿠아슈즈", position: [-2.35, 0.22, 0.55], radius: 0.55 },
  { id: "swim-shorts", label: "수영바지", position: [-0.25, 0.18, 2.05], radius: 0.58 },
  { id: "cleansing-foam", label: "클렌징폼", position: [1.28, 0.32, -2.0], radius: 0.48 },
  { id: "lotion", label: "로션", position: [1.62, 0.32, -1.88], radius: 0.48 },
] as const;

const itemAliases: Record<string, string[]> = {
  keyboard: ["mini-keyboard"],
  laptop: ["macbook"],
  snorkel: ["snorkel"],
  fins: ["long-fins", "aqua-shoes"],
  swim: ["swim-cap", "swim-shorts"],
  sun: ["sun-kit", "cleansing-foam", "lotion"],
  camera: ["camera"],
};

const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.32);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isOnPackingSquare = ([x, , z]: ScenePoint) =>
  Math.abs(x) <= 1.22 && Math.abs(z) <= 1.22;

function useItemSelection(selectedItems: string[] | undefined) {
  return useMemo(() => {
    const normalized = new Set(
      (selectedItems ?? []).map((item) => item.trim().toLowerCase()),
    );

    return (aliases: string[]) =>
      aliases.some((alias) => normalized.has(alias.toLowerCase()));
  }, [selectedItems]);
}

function HighlightRing({ selected, scale = 1 }: ObjectProps & { scale?: number }) {
  if (!selected) {
    return null;
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} scale={scale}>
      <torusGeometry args={[0.48, 0.025, 8, 72]} />
      <meshStandardMaterial
        color={palette.accent}
        emissive={palette.accent}
        emissiveIntensity={0.35}
        roughness={0.35}
      />
    </mesh>
  );
}

function Tarp() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <boxGeometry args={[3.45, 3.45, 0.045, 8, 8, 1]} />
        <meshStandardMaterial color={palette.cloth} roughness={0.92} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
        <planeGeometry args={[2.65, 2.65]} />
        <meshStandardMaterial
          color={palette.clothDark}
          roughness={0.9}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {[-1.25, 1.25].map((z) => (
        <mesh key={`edge-x-${z}`} position={[0, 0.055, z]}>
          <boxGeometry args={[2.7, 0.028, 0.035]} />
          <meshStandardMaterial color={palette.clothLine} roughness={0.75} />
        </mesh>
      ))}
      {[-1.25, 1.25].map((x) => (
        <mesh key={`edge-z-${x}`} position={[x, 0.056, 0]}>
          <boxGeometry args={[0.035, 0.028, 2.7]} />
          <meshStandardMaterial color={palette.clothLine} roughness={0.75} />
        </mesh>
      ))}

      {[
        [-1.45, -1.45],
        [1.45, -1.45],
        [-1.45, 1.45],
        [1.45, 1.45],
      ].map(([x, z]) => (
        <Torus
          key={`${x}-${z}`}
          args={[0.12, 0.018, 10, 32]}
          position={[x, 0.075, z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <meshStandardMaterial color={palette.metal} metalness={0.45} roughness={0.25} />
        </Torus>
      ))}
    </group>
  );
}

function MiniKeyboard({ selected }: ObjectProps) {
  return (
    <group position={[-2.25, 0.22, -0.6]} rotation={[0, 0.36, 0]}>
      <HighlightRing selected={selected} scale={1.3} />
      <RoundedBox args={[1.25, 0.16, 0.48]} radius={0.06} smoothness={6} castShadow>
        <meshStandardMaterial color="#24282a" roughness={0.55} />
      </RoundedBox>
      {Array.from({ length: 12 }, (_, index) => (
        <mesh key={index} position={[-0.52 + index * 0.095, 0.11, 0.05]} castShadow>
          <boxGeometry args={[0.07, 0.025, 0.28]} />
          <meshStandardMaterial color="#f1eee2" roughness={0.5} />
        </mesh>
      ))}
      {[1, 3, 6, 8, 10].map((index) => (
        <mesh key={`black-${index}`} position={[-0.52 + index * 0.095, 0.13, -0.08]} castShadow>
          <boxGeometry args={[0.045, 0.035, 0.16]} />
          <meshStandardMaterial color="#111111" roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function MacBook({ selected }: ObjectProps) {
  return (
    <group position={[1.95, 0.26, -0.95]} rotation={[0.05, -0.56, 0]}>
      <HighlightRing selected={selected} scale={1.2} />
      <RoundedBox args={[0.95, 0.08, 0.62]} radius={0.045} smoothness={6} castShadow>
        <meshStandardMaterial color="#9aa0a6" metalness={0.35} roughness={0.28} />
      </RoundedBox>
      <RoundedBox args={[0.86, 0.5, 0.045]} radius={0.035} smoothness={5} position={[0, 0.3, -0.29]} rotation={[-0.62, 0, 0]} castShadow>
        <meshStandardMaterial color="#bdc3c7" metalness={0.3} roughness={0.26} />
      </RoundedBox>
      <mesh position={[0, 0.32, -0.26]} rotation={[-0.62, 0, 0]}>
        <boxGeometry args={[0.66, 0.32, 0.012]} />
        <meshStandardMaterial color="#171b1d" roughness={0.5} />
      </mesh>
    </group>
  );
}

function Snorkel({ selected }: ObjectProps) {
  return (
    <group position={[-1.55, 0.18, 1.55]} rotation={[0, -0.25, 0]}>
      <HighlightRing selected={selected} scale={0.9} />
      <mesh position={[-0.18, 0.05, 0]} rotation={[0, 0, 0.7]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.95, 16]} />
        <meshStandardMaterial color="#2aa7a1" roughness={0.42} />
      </mesh>
      <mesh position={[0.18, 0.24, 0.12]} rotation={[0, 0, 0.08]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.68, 16]} />
        <meshStandardMaterial color="#2aa7a1" roughness={0.42} />
      </mesh>
      <RoundedBox args={[0.54, 0.18, 0.22]} radius={0.05} smoothness={5} position={[-0.22, 0.1, -0.18]} castShadow>
        <meshStandardMaterial color="#1d2830" roughness={0.38} />
      </RoundedBox>
      <mesh position={[0.2, 0.6, 0.12]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
        <meshStandardMaterial color="#f08f3e" roughness={0.4} />
      </mesh>
    </group>
  );
}

function LongFins({ selected }: ObjectProps) {
  return (
    <group position={[1.62, 0.17, 1.52]} rotation={[0, 0.28, 0]}>
      <HighlightRing selected={selected} scale={0.95} />
      {[-0.14, 0.14].map((x) => (
        <group key={x} position={[x, 0.05, 0]} rotation={[0, 0, -0.18]} >
          <RoundedBox args={[0.16, 0.09, 0.98]} radius={0.04} smoothness={5} castShadow>
            <meshStandardMaterial color="#2c5c68" roughness={0.55} />
          </RoundedBox>
          <RoundedBox args={[0.2, 0.12, 0.24]} radius={0.045} smoothness={5} position={[0, 0.02, 0.54]} castShadow>
            <meshStandardMaterial color="#183841" roughness={0.5} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function SwimCap({ selected }: ObjectProps) {
  return (
    <group position={[0.7, 0.28, -2.08]} rotation={[0, -0.15, 0]}>
      <HighlightRing selected={selected} scale={0.85} />
      <mesh position={[0, 0.03, 0]} scale={[1.15, 0.58, 0.78]} castShadow>
        <sphereGeometry args={[0.34, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#4d8d89" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.02, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.012, 8, 36]} />
        <meshStandardMaterial color="#b9d3cc" roughness={0.5} />
      </mesh>
    </group>
  );
}

function SunKit({ selected }: ObjectProps) {
  return (
    <group position={[-0.55, 0.2, -2.05]} rotation={[0, 0.18, 0]}>
      <HighlightRing selected={selected} scale={0.95} />
      {[
        [-0.25, 0.02, 0.04, 0.42],
        [0.12, 0.06, -0.03, 0.36],
        [0.38, 0.01, 0.14, 0.31],
      ].map(([x, y, z, size], index) => (
        <RoundedBox
          key={index}
          args={[size as number, 0.3, 0.22]}
          radius={0.06}
          smoothness={5}
          position={[x as number, y as number, z as number]}
          rotation={[0.12, 0.25 * index, -0.08]}
          castShadow
        >
          <meshStandardMaterial color={index === 1 ? "#f4d46b" : "#f0a14a"} roughness={0.78} />
        </RoundedBox>
      ))}
      <mesh position={[0.06, 0.31, 0.1]} rotation={[0, 0, 1.38]}>
        <cylinderGeometry args={[0.026, 0.026, 0.78, 10]} />
        <meshStandardMaterial color="#fff3ba" roughness={0.66} />
      </mesh>
    </group>
  );
}

function Camera({ selected }: ObjectProps) {
  return (
    <group position={[2.2, 0.28, 0.45]} rotation={[0.04, -0.25, 0.06]}>
      <HighlightRing selected={selected} scale={1.15} />
      <RoundedBox args={[0.78, 0.42, 0.34]} radius={0.08} smoothness={6} castShadow>
        <meshStandardMaterial color="#222222" roughness={0.48} />
      </RoundedBox>
      <mesh position={[0, 0.03, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.22, 28]} />
        <meshStandardMaterial color="#111111" roughness={0.32} metalness={0.18} />
      </mesh>
      <mesh position={[0, 0.03, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 24]} />
        <meshStandardMaterial color="#4c5b63" roughness={0.25} metalness={0.3} />
      </mesh>
      <mesh position={[-0.24, 0.25, 0]}>
        <boxGeometry args={[0.18, 0.08, 0.18]} />
        <meshStandardMaterial color="#151515" roughness={0.42} />
      </mesh>
    </group>
  );
}

function AquaShoes({ selected }: ObjectProps) {
  return (
    <group position={[-2.35, 0.22, 0.55]} rotation={[0, 0.42, 0]}>
      <HighlightRing selected={selected} scale={0.9} />
      {[-0.16, 0.16].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <RoundedBox args={[0.28, 0.16, 0.58]} radius={0.08} smoothness={6} castShadow>
            <meshStandardMaterial color="#2f776f" roughness={0.72} />
          </RoundedBox>
          <RoundedBox args={[0.22, 0.09, 0.18]} radius={0.045} smoothness={5} position={[0, 0.08, 0.18]} castShadow>
            <meshStandardMaterial color="#183b38" roughness={0.6} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function SwimShorts({ selected }: ObjectProps) {
  return (
    <group position={[-0.25, 0.18, 2.05]} rotation={[0, -0.28, 0]}>
      <HighlightRing selected={selected} scale={0.9} />
      <RoundedBox args={[0.74, 0.08, 0.44]} radius={0.045} smoothness={5} castShadow>
        <meshStandardMaterial color="#315a78" roughness={0.82} />
      </RoundedBox>
      {[-0.18, 0.18].map((x) => (
        <RoundedBox key={x} args={[0.27, 0.07, 0.42]} radius={0.04} smoothness={5} position={[x, -0.02, 0.28]} castShadow>
          <meshStandardMaterial color="#284963" roughness={0.82} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.07, -0.14]}>
        <boxGeometry args={[0.58, 0.025, 0.035]} />
        <meshStandardMaterial color="#e2d37b" roughness={0.58} />
      </mesh>
    </group>
  );
}

function ToiletryBottles({
  selectedFoam,
  selectedLotion,
}: {
  selectedFoam: boolean;
  selectedLotion: boolean;
}) {
  return (
    <group>
      <group position={[1.28, 0.32, -2.0]} rotation={[0, -0.12, 0]}>
        <HighlightRing selected={selectedFoam} scale={0.7} />
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.12, 0.54, 18]} />
          <meshStandardMaterial color="#eef4e4" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.065, 0.16, 16]} />
          <meshStandardMaterial color="#6bb0a6" roughness={0.42} />
        </mesh>
      </group>
      <group position={[1.62, 0.32, -1.88]} rotation={[0, 0.18, 0]}>
        <HighlightRing selected={selectedLotion} scale={0.7} />
        <mesh castShadow>
          <cylinderGeometry args={[0.105, 0.12, 0.52, 18]} />
          <meshStandardMaterial color="#e8cf76" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.31, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.065, 0.14, 16]} />
          <meshStandardMaterial color="#f6f0c8" roughness={0.42} />
        </mesh>
      </group>
    </group>
  );
}

function DragHotspot({
  item,
  onPointerDown,
}: {
  item: (typeof draggableItems)[number];
  onPointerDown: (event: ThreeEvent<PointerEvent>, item: (typeof draggableItems)[number]) => void;
}) {
  return (
    <mesh
      position={item.position}
      onPointerDown={(event) => onPointerDown(event, item)}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <sphereGeometry args={[item.radius, 16, 10]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

const packedItemPositions = [
  [-0.72, 0.13, -0.52],
  [-0.22, 0.16, -0.36],
  [0.38, 0.14, -0.48],
  [0.78, 0.18, -0.1],
  [-0.56, 0.2, 0.06],
  [0.02, 0.22, 0.08],
  [0.52, 0.24, 0.36],
  [-0.12, 0.3, 0.48],
  [-0.78, 0.28, 0.38],
  [0.28, 0.34, -0.02],
] as const;

function PackedItem({
  itemId,
  index,
  position,
}: {
  itemId: string;
  index: number;
  position?: ScenePoint;
}) {
  const [x, y, z] = position ?? packedItemPositions[index % packedItemPositions.length];
  const rotationY = (index % 5) * 0.42 - 0.6;
  const color = {
    "mini-keyboard": palette.leather,
    macbook: "#3d5f6b",
    snorkel: palette.rope,
    "aqua-shoes": "#43766c",
    "long-fins": palette.metal,
    "swim-cap": palette.bottle,
    "swim-shorts": "#34566a",
    "sun-kit": palette.food,
    "cleansing-foam": "#d8dfc4",
    lotion: "#d3bd73",
    camera: "#262626",
  }[itemId] ?? palette.accent;

  if (itemId === "mini-keyboard") {
    return (
      <group position={[x, y, z]} rotation={[0.06, rotationY, 0]}>
        <RoundedBox args={[0.48, 0.08, 0.22]} radius={0.025} smoothness={4} castShadow>
          <meshStandardMaterial color="#24282a" roughness={0.55} />
        </RoundedBox>
        {Array.from({ length: 6 }, (_, keyIndex) => (
          <mesh key={keyIndex} position={[-0.18 + keyIndex * 0.07, 0.055, 0.02]} castShadow>
            <boxGeometry args={[0.045, 0.014, 0.1]} />
            <meshStandardMaterial color="#f1eee2" roughness={0.5} />
          </mesh>
        ))}
      </group>
    );
  }

  if (itemId === "macbook") {
    return (
      <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
        <RoundedBox args={[0.48, 0.045, 0.32]} radius={0.025} smoothness={4} castShadow>
          <meshStandardMaterial color="#9aa0a6" metalness={0.25} roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.1, -0.13]} rotation={[-0.72, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.22, 0.018]} />
          <meshStandardMaterial color="#bdc3c7" metalness={0.25} roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (itemId === "snorkel") {
    return (
      <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
        <Torus args={[0.18, 0.025, 8, 36]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.9} />
        </Torus>
      </group>
    );
  }

  if (itemId === "aqua-shoes") {
    return (
      <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
        {[-0.08, 0.08].map((offset) => (
          <RoundedBox key={offset} args={[0.16, 0.09, 0.3]} radius={0.04} smoothness={4} position={[offset, 0, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.7} />
          </RoundedBox>
        ))}
      </group>
    );
  }

  if (itemId === "swim-cap") {
    return (
      <mesh position={[x, y, z]} scale={[1.1, 0.58, 0.8]} castShadow>
        <sphereGeometry args={[0.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.62} />
      </mesh>
    );
  }

  if (itemId === "swim-shorts") {
    return (
      <group position={[x, y, z]} rotation={[0, rotationY, 0]}>
        <RoundedBox args={[0.42, 0.055, 0.24]} radius={0.025} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.82} />
        </RoundedBox>
        {[-0.1, 0.1].map((offset) => (
          <RoundedBox key={offset} args={[0.14, 0.045, 0.2]} radius={0.025} smoothness={4} position={[offset, -0.015, 0.16]} castShadow>
            <meshStandardMaterial color="#284963" roughness={0.82} />
          </RoundedBox>
        ))}
      </group>
    );
  }

  if (itemId === "cleansing-foam" || itemId === "lotion") {
    return (
      <group position={[x, y + 0.1, z]} rotation={[0, rotationY, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.07, 0.34, 14]} />
          <meshStandardMaterial color={color} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.032, 0.036, 0.14, 12]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      </group>
    );
  }

  if (itemId === "long-fins" || itemId === "camera") {
    return (
      <group position={[x, y, z]} rotation={[0.05, rotationY, -0.35]}>
        <mesh castShadow>
          <boxGeometry args={[0.46, 0.08, 0.12]} />
          <meshStandardMaterial color={color} metalness={itemId === "camera" ? 0.1 : 0.35} roughness={0.38} />
        </mesh>
        <mesh position={[0.2, 0.01, 0]} castShadow>
          <boxGeometry args={[0.12, 0.11, 0.18]} />
          <meshStandardMaterial color={itemId === "camera" ? "#151515" : "#5b3928"} roughness={0.55} />
        </mesh>
      </group>
    );
  }

  if (itemId === "sun-kit") {
    return (
      <group position={[x, y, z]} rotation={[0.08, rotationY, -0.08]}>
        <RoundedBox args={[0.3, 0.18, 0.2]} radius={0.04} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.78} />
        </RoundedBox>
        <mesh position={[0.13, 0.13, 0.02]} rotation={[0, 0, 0.8]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.34, 8]} />
          <meshStandardMaterial color="#fff3ba" roughness={0.66} />
        </mesh>
      </group>
    );
  }

  return (
    <RoundedBox
      args={[0.42, itemId === "macbook" ? 0.38 : 0.24, 0.34]}
      radius={0.055}
      smoothness={5}
      position={[x, y, z]}
      rotation={[0.08, rotationY, -0.04]}
      castShadow
    >
      <meshStandardMaterial color={color} roughness={0.78} />
    </RoundedBox>
  );
}

function PackedItems({ selectedItems }: PackageSceneProps) {
  const uniqueItems = useMemo(() => Array.from(new Set(selectedItems ?? [])), [selectedItems]);

  return (
    <group>
      {uniqueItems.map((itemId, index) => (
        <PackedItem key={itemId} itemId={itemId} index={index} />
      ))}
    </group>
  );
}

function TableAndScene({ selectedItems, onItemPacked }: PackageSceneProps) {
  const isSelected = useItemSelection(selectedItems);
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    label: string;
    position: ScenePoint;
  } | null>(null);
  const [controlsEnabled, setControlsEnabled] = useState(true);

  const projectPointerToTable = (event: ThreeEvent<PointerEvent>): ScenePoint | null => {
    const point = new THREE.Vector3();
    if (!event.ray.intersectPlane(dragPlane, point)) {
      return null;
    }

    return [clamp(point.x, -2.85, 2.85), 0.38, clamp(point.z, -2.25, 2.25)];
  };

  const handleDragStart = (
    event: ThreeEvent<PointerEvent>,
    item: (typeof draggableItems)[number],
  ) => {
    event.stopPropagation();
    (event.target as Element | null)?.setPointerCapture?.(event.pointerId);
    document.body.style.cursor = "grabbing";
    setControlsEnabled(false);
    setDraggedItem({
      id: item.id,
      label: item.label,
      position: projectPointerToTable(event) ?? item.position,
    });
  };

  const handleDragMove = (event: ThreeEvent<PointerEvent>) => {
    if (!draggedItem) {
      return;
    }

    event.stopPropagation();
    const nextPosition = projectPointerToTable(event);
    if (!nextPosition) {
      return;
    }

    setDraggedItem((current) =>
      current ? { ...current, position: nextPosition } : current,
    );
  };

  const handleDragEnd = (event: ThreeEvent<PointerEvent>) => {
    if (!draggedItem) {
      return;
    }

    event.stopPropagation();
    (event.target as Element | null)?.releasePointerCapture?.(event.pointerId);
    document.body.style.cursor = "";
    setControlsEnabled(true);

    if (isOnPackingSquare(draggedItem.position)) {
      onItemPacked?.(draggedItem.id, draggedItem.label);
    }

    setDraggedItem(null);
  };

  return (
    <>
      <color attach="background" args={["#151817"]} />
      <fog attach="fog" args={["#151817", 6.5, 13]} />
      <ambientLight intensity={0.58} />
      <directionalLight
        castShadow
        position={[4.5, 6, 3.5]}
        intensity={2.6}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-3.4, 2.4, -2.8]} intensity={1.1} color="#9cc8bc" />

      <group>
        <mesh
          position={[0, 0.18, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <planeGeometry args={[6.4, 5.4]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.08, 0]} receiveShadow>
          <boxGeometry args={[6.3, 0.16, 5.3]} />
          <meshStandardMaterial color={palette.table} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[6.2, 5.2, 16, 16]} />
          <meshStandardMaterial color="#76543b" roughness={0.92} />
        </mesh>

        <Tarp />
        <PackedItems selectedItems={selectedItems} />
        {draggedItem && (
          <PackedItem
            itemId={draggedItem.id}
            index={selectedItems?.length ?? 0}
            position={draggedItem.position}
          />
        )}
        <MiniKeyboard selected={isSelected(itemAliases.keyboard)} />
        <MacBook selected={isSelected(itemAliases.laptop)} />
        <Snorkel selected={isSelected(itemAliases.snorkel)} />
        <LongFins selected={isSelected(["long-fins"])} />
        <SwimCap selected={isSelected(["swim-cap"])} />
        <SunKit selected={isSelected(itemAliases.sun)} />
        <Camera selected={isSelected(itemAliases.camera)} />
        <AquaShoes selected={isSelected(["aqua-shoes"])} />
        <SwimShorts selected={isSelected(["swim-shorts"])} />
        <ToiletryBottles
          selectedFoam={isSelected(["cleansing-foam"])}
          selectedLotion={isSelected(["lotion"])}
        />
        {draggableItems.map((item) => (
          <DragHotspot key={item.id} item={item} onPointerDown={handleDragStart} />
        ))}
      </group>
      <OrbitControls
        makeDefault
        enabled={controlsEnabled}
        enablePan={false}
        enableDamping={false}
        minDistance={5.4}
        maxDistance={8.4}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.46}
        target={[0, 0.1, 0]}
      />
    </>
  );
}

export default function PackageScene({ selectedItems, onItemPacked }: PackageSceneProps) {
  return (
    <div
      className="package-scene"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: 520,
        overflow: "hidden",
        background: "#151817",
      }}
    >
      <Canvas
        shadows
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [4.8, 4.2, 5.2], fov: 42, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: false }}
        style={{ position: "absolute", inset: 0 }}
      >
        <TableAndScene selectedItems={selectedItems} onItemPacked={onItemPacked} />
      </Canvas>
    </div>
  );
}
