"use client";

import React, { useState, useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import * as THREE from "three";
import { BackButton } from "../../components/BackButton";
import { useTheme } from "../theme-provider";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Dribbble, 
  RotateCw, 
  Sparkles, 
  Sun, 
  Sliders, 
  BookOpen, 
  Maximize2, 
  Layers, 
  Volume2,
  Tv
} from "lucide-react";

// ----------------------------------------------------------------------------
// Muscle Anatomical Data Definition
// ----------------------------------------------------------------------------
interface MuscleInfo {
  name: string;
  koreanName: string;
  latinName: string;
  description: string;
  function: string;
  workout: string;
}

const MUSCLE_GROUPS: Record<string, MuscleInfo> = {
  pectoralis: {
    name: "Pectoralis Major",
    koreanName: "대가슴근 (가슴)",
    latinName: "Musculus pectoralis major",
    description: "가슴 앞부분의 대부분을 차지하는 넓고 두꺼운 부채꼴 모양의 근육입니다. 상체의 강건한 프레임을 구축하고 미는 힘을 발산하는 가장 상징적인 근육입니다.",
    function: "팔을 몸 안쪽으로 끌어당기거나(내전), 앞으로 들어올리며(굴곡), 안쪽으로 회전시키는(내회전) 역할을 수행합니다.",
    workout: "벤치 프레스(Bench Press), 푸시업(Push-up), 덤벨 체스트 플라이(Dumbbell Fly)",
  },
  abdominals: {
    name: "Rectus Abdominis",
    koreanName: "배곧은근 (복근/식스팩)",
    latinName: "Musculus rectus abdominis",
    description: "갈비뼈 밑부분부터 골반 앞쪽까지 이어지는 일직선 근육입니다. 세로와 가로의 힘줄막에 의해 분할되어 우리가 흔히 말하는 탄탄한 '식스팩'을 형성합니다.",
    function: "몸통을 앞으로 굽히고(척추 굴곡), 골반을 후방 경사시키며, 코어를 안정적으로 잡아 몸 전체의 균형과 내부 압력을 조절합니다.",
    workout: "크런치(Crunch), 행잉 레그 레이즈(Hanging Leg Raise), 플랭크(Plank)",
  },
  deltoids: {
    name: "Deltoideus",
    koreanName: "어깨세모근 (어깨)",
    latinName: "Musculus deltoideus",
    description: "어깨 관절을 둥글게 감싸고 있는 세모 모양의 큰 근육입니다. 전면, 측면, 후면 세 파트로 세분화되어 있어 상체 어깨의 입체감과 넓이를 결정짓습니다.",
    function: "팔을 옆으로 들어 올리는 외전 운동(측면)을 비롯하여, 팔을 앞으로 들어 올리고(전면) 뒤로 당기는(후면) 3차원적 회전을 모두 주도합니다.",
    workout: "밀리터리 프레스(Military Press), 사이드 레터럴 레이즈(Lateral Raise)",
  },
  trapezius: {
    name: "Trapezius",
    koreanName: "등세모근 (승모근)",
    latinName: "Musculus trapezius",
    description: "목덜미부터 등 한가운데 어깨뼈(견갑골)에 걸쳐 넓게 자리 잡은 다이아몬드 형상의 등 상부 근육입니다. 척추의 안정감과 바른 목 자세 유행에 필수적입니다.",
    function: "어깨뼈를 위로 끌어당기거나(거상), 뒤로 모으고(후인), 아래로 내리는(하강) 견갑골 조절 및 목뼈(경추)의 안정성을 확보합니다.",
    workout: "바벨 슈러그(Shrug), 페이스 풀(Face Pull), 랙 풀(Rack Pull)",
  },
  obliques: {
    name: "External Oblique",
    koreanName: "배바깥빗근 (옆구리/외복사근)",
    latinName: "Musculus obliquus externus abdominis",
    description: "갈비뼈 옆라인에서 아랫배 치골 부위까지 대각선 방향으로 내려오는 빗살 형태의 근육입니다. 남성다운 다이내믹한 V라인 측면 허리를 구성합니다.",
    function: "척추를 반대 방향으로 회전시키거나 같은 쪽으로 몸통을 기울이는 굴곡 및 비틀기 동작을 주로 수행합니다.",
    workout: "러시안 트위스트(Russian Twist), 사이드 플랭크(Side Plank), 우드찹(Woodchop)",
  },
  lats: {
    name: "Latissimus Dorsi",
    koreanName: "넓은등근 (광배근)",
    latinName: "Musculus latissimus dorsi",
    description: "등 하부 전체를 덮으며 옆구리를 타고 올라가 위팔뼈 안쪽으로 연결되는 넓은 날개 모양 근육입니다. 넓은 등판과 상체의 입체적인 '역삼각형' 프레임을 주조합니다.",
    function: "위팔뼈를 몸쪽으로 당겨 내리거나(내전) 뒤로 신장하고(신전), 안쪽으로 회전시켜 무거운 물건을 잡아당기는 전반적인 인장 운동을 가능하게 합니다.",
    workout: "풀업/턱걸이(Pull-up), 랫 풀 다운(Lat Pull Down), 원 암 덤벨 로우(Dumbbell Row)",
  },
  lower_back: {
    name: "Erector Spinae",
    koreanName: "척추세움근 (척추기립근)",
    latinName: "Musculus erector spinae",
    description: "척추 양쪽을 따라 기둥처럼 길고 깊게 뻗어 있는 매우 강력한 심부 근육군입니다. 인체의 기둥인 척추를 똑바로 유지하게 돕는 중력 대항의 핵심입니다.",
    function: "굽어진 척추를 곧게 펴서 세우며(신전), 척추가 좌우로 쏠리지 않고 중심을 지키도록 전신 밸런스를 잡아줍니다.",
    workout: "컨벤셔널 데드리프트(Deadlift), 백 익스텐션(Back Extension), 플랭크(Plank)",
  },
  neck: {
    name: "Neck Muscles",
    koreanName: "목 근육군 (흉쇄유돌근 등)",
    latinName: "Musculi colli",
    description: "머리를 단단하게 지탱하며, 좌우로 돌리고 끄덕이는 등 목 관절의 광범위한 가동을 돕는 근육 무리입니다.",
    function: "약 5~6kg에 달하는 무거운 머리의 무게를 중력에 맞서 중심선 상에 세워두고 경추에 가해지는 부담을 흡수합니다.",
    workout: "넥 플렉션(Neck Flexion), 넥 익스텐션(Neck Extension), 경부 스트레칭",
  },
};

// ----------------------------------------------------------------------------
// 3D Muscle Mesh Configurations
// ----------------------------------------------------------------------------
interface MusclePart {
  id: string;
  group: string;
  name: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  explodeDir: [number, number, number];
  geometry: "sphere" | "cylinder" | "box";
  geomArgs?: [number, number, number, number];
}

const MUSCLE_PARTS: MusclePart[] = [
  // 1. Pectorals (Chest)
  {
    id: "pec_l",
    group: "pectoralis",
    name: "Left Pectoralis Major",
    position: [-0.25, 0.16, 0.16],
    scale: [0.22, 0.17, 0.12],
    rotation: [0.05, 0.1, -0.04],
    explodeDir: [-0.35, 0.15, 0.55],
    geometry: "sphere",
  },
  {
    id: "pec_r",
    group: "pectoralis",
    name: "Right Pectoralis Major",
    position: [0.25, 0.16, 0.16],
    scale: [0.22, 0.17, 0.12],
    rotation: [0.05, -0.1, 0.04],
    explodeDir: [0.35, 0.15, 0.55],
    geometry: "sphere",
  },
  
  // 2. Deltoids (Shoulders)
  {
    id: "delt_l",
    group: "deltoids",
    name: "Left Deltoid",
    position: [-0.55, 0.22, 0.02],
    scale: [0.14, 0.22, 0.15],
    rotation: [0.08, 0.15, 0.22],
    explodeDir: [-0.65, 0.1, 0.12],
    geometry: "sphere",
  },
  {
    id: "delt_r",
    group: "deltoids",
    name: "Right Deltoid",
    position: [0.55, 0.22, 0.02],
    scale: [0.14, 0.22, 0.15],
    rotation: [0.08, -0.15, -0.22],
    explodeDir: [0.65, 0.1, 0.12],
    geometry: "sphere",
  },

  // 3. Trapezius (Upper Back / Neck Connector)
  {
    id: "trap_l",
    group: "trapezius",
    name: "Left Trapezius",
    position: [-0.18, 0.4, -0.07],
    scale: [0.12, 0.19, 0.09],
    rotation: [0, 0.08, 0.44],
    explodeDir: [-0.22, 0.38, -0.22],
    geometry: "sphere",
  },
  {
    id: "trap_r",
    group: "trapezius",
    name: "Right Trapezius",
    position: [0.18, 0.4, -0.07],
    scale: [0.12, 0.19, 0.09],
    rotation: [0, -0.08, -0.44],
    explodeDir: [0.22, 0.38, -0.22],
    geometry: "sphere",
  },

  // 4. Abdominals (6 Pack)
  {
    id: "abs_u_l",
    group: "abdominals",
    name: "Upper Left Abdominals",
    position: [-0.1, -0.05, 0.18],
    scale: [0.08, 0.058, 0.055],
    rotation: [0.01, 0.04, -0.02],
    explodeDir: [-0.14, -0.04, 0.5],
    geometry: "sphere",
  },
  {
    id: "abs_u_r",
    group: "abdominals",
    name: "Upper Right Abdominals",
    position: [0.1, -0.05, 0.18],
    scale: [0.08, 0.058, 0.055],
    rotation: [0.01, -0.04, 0.02],
    explodeDir: [0.14, -0.04, 0.5],
    geometry: "sphere",
  },
  {
    id: "abs_m_l",
    group: "abdominals",
    name: "Middle Left Abdominals",
    position: [-0.1, -0.16, 0.17],
    scale: [0.08, 0.058, 0.055],
    rotation: [0.01, 0.04, -0.02],
    explodeDir: [-0.14, -0.12, 0.5],
    geometry: "sphere",
  },
  {
    id: "abs_m_r",
    group: "abdominals",
    name: "Middle Right Abdominals",
    position: [0.1, -0.16, 0.17],
    scale: [0.08, 0.058, 0.055],
    rotation: [0.01, -0.04, 0.02],
    explodeDir: [0.14, -0.12, 0.5],
    geometry: "sphere",
  },
  {
    id: "abs_l_l",
    group: "abdominals",
    name: "Lower Left Abdominals",
    position: [-0.09, -0.27, 0.16],
    scale: [0.085, 0.058, 0.055],
    rotation: [0.01, 0.04, -0.02],
    explodeDir: [-0.14, -0.22, 0.5],
    geometry: "sphere",
  },
  {
    id: "abs_l_r",
    group: "abdominals",
    name: "Lower Right Abdominals",
    position: [0.09, -0.27, 0.16],
    scale: [0.085, 0.058, 0.055],
    rotation: [0.01, -0.04, 0.02],
    explodeDir: [0.14, -0.22, 0.5],
    geometry: "sphere",
  },

  // 5. Obliques (Side Abs)
  {
    id: "oblique_l",
    group: "obliques",
    name: "Left Oblique",
    position: [-0.25, -0.2, 0.13],
    scale: [0.095, 0.2, 0.085],
    rotation: [0.04, 0.18, 0.08],
    explodeDir: [-0.46, -0.12, 0.34],
    geometry: "sphere",
  },
  {
    id: "oblique_r",
    group: "obliques",
    name: "Right Oblique",
    position: [0.25, -0.2, 0.13],
    scale: [0.095, 0.2, 0.085],
    rotation: [0.04, -0.18, -0.08],
    explodeDir: [0.46, -0.12, 0.34],
    geometry: "sphere",
  },

  // 6. Lats (Latissimus Dorsi)
  {
    id: "lat_l",
    group: "lats",
    name: "Left Latissimus Dorsi",
    position: [-0.34, -0.04, -0.12],
    scale: [0.11, 0.3, 0.11],
    rotation: [0.06, -0.12, 0.16],
    explodeDir: [-0.54, 0.0, -0.38],
    geometry: "sphere",
  },
  {
    id: "lat_r",
    group: "lats",
    name: "Right Latissimus Dorsi",
    position: [0.34, -0.04, -0.12],
    scale: [0.11, 0.3, 0.11],
    rotation: [0.06, 0.12, -0.16],
    explodeDir: [0.54, 0.0, -0.38],
    geometry: "sphere",
  },

  // 7. Lower Back (Erector Spinae)
  {
    id: "lback_l",
    group: "lower_back",
    name: "Left Erector Spinae",
    position: [-0.12, -0.22, -0.14],
    scale: [0.08, 0.2, 0.075],
    rotation: [0, 0.04, 0.01],
    explodeDir: [-0.2, -0.18, -0.45],
    geometry: "sphere",
  },
  {
    id: "lback_r",
    group: "lower_back",
    name: "Right Erector Spinae",
    position: [0.12, -0.22, -0.14],
    scale: [0.08, 0.2, 0.075],
    rotation: [0, -0.04, -0.01],
    explodeDir: [0.2, -0.18, -0.45],
    geometry: "sphere",
  },

  // 8. Neck
  {
    id: "neck_muscle",
    group: "neck",
    name: "Neck Support Group",
    position: [0, 0.46, -0.04],
    scale: [1, 1, 1],
    rotation: [0, 0, 0],
    explodeDir: [0, 0.5, 0],
    geometry: "cylinder",
    geomArgs: [0.1, 0.1, 0.22, 16],
  },
];

// ----------------------------------------------------------------------------
// Internal Skeleton/Chassis Component
// ----------------------------------------------------------------------------
function CentralChassis({ explodeFactor, materialPreset }: { explodeFactor: number; materialPreset: string }) {
  const spineRef = useRef<THREE.Mesh>(null);
  const pelvisRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!spineRef.current || !pelvisRef.current || !coreRef.current) return;
    
    // Core remains anchored in center, spine/pelvis slide slightly away
    spineRef.current.position.z = THREE.MathUtils.lerp(spineRef.current.position.z, -0.2 - 0.15 * explodeFactor, 0.1);
    pelvisRef.current.position.y = THREE.MathUtils.lerp(pelvisRef.current.position.y, -0.5 - 0.1 * explodeFactor, 0.1);
  });

  const coreMaterial = useMemo(() => {
    if (materialPreset === "hologram") {
      return (
        <meshBasicMaterial color="#ff007f" wireframe transparent opacity={0.15} />
      );
    }
    return (
      <meshStandardMaterial
        color="#15151b"
        roughness={0.5}
        metalness={0.9}
      />
    );
  }, [materialPreset]);

  return (
    <group>
      {/* Central Spinal Column */}
      <mesh ref={spineRef} position={[0, 0, -0.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.035, 0.04, 1.0, 16]} />
        {coreMaterial}
      </mesh>

      {/* Ribcage Core Anchor */}
      <mesh ref={coreRef} position={[0, 0.08, -0.02]} castShadow receiveShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        {coreMaterial}
      </mesh>

      {/* Pelvis/Base plate */}
      <mesh ref={pelvisRef} position={[0, -0.5, 0.0]} castShadow receiveShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        {coreMaterial}
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Individual Muscle Mesh Component
// ----------------------------------------------------------------------------
function MuscleMesh({
  part,
  explodeFactor,
  hoveredGroup,
  setHoveredGroup,
  selectedGroup,
  setSelectedGroup,
  materialPreset,
}: {
  part: MusclePart;
  explodeFactor: number;
  hoveredGroup: string | null;
  selectedGroup: string | null;
  setHoveredGroup: (g: string | null) => void;
  setSelectedGroup: (g: string | null) => void;
  materialPreset: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const targetX = part.position[0] + part.explodeDir[0] * explodeFactor;
    const targetY = part.position[1] + part.explodeDir[1] * explodeFactor;
    const targetZ = part.position[2] + part.explodeDir[2] * explodeFactor;

    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.08);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.08);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 0.08);
  });

  const isGroupHovered = hoveredGroup === part.group;
  const isGroupSelected = selectedGroup === part.group;
  const isGlow = isGroupHovered || isGroupSelected;

  const materialProps = useMemo(() => {
    switch (materialPreset) {
      case "marble":
        return {
          color: isGlow ? "#ff4081" : "#f1f1eb",
          roughness: isGlow ? 0.35 : 0.8,
          metalness: 0.02,
          emissive: isGlow ? "#3a0011" : "#000000",
          clearcoat: 0.1,
          clearcoatRoughness: 0.4,
        };
      case "hologram":
        return {
          color: isGlow ? "#ff007f" : "#00f0ff",
          wireframe: true,
          transparent: true,
          opacity: isGlow ? 0.95 : 0.45,
          emissive: isGlow ? "#770033" : "#002b3d",
        };
      case "chrome":
        return {
          color: isGlow ? "#ff2a6d" : "#e5e5e5",
          roughness: isGlow ? 0.15 : 0.04,
          metalness: 0.98,
          emissive: isGlow ? "#4a0015" : "#000000",
        };
      case "obsidian":
      default:
        return {
          color: isGlow ? "#ff2a6d" : "#09090b",
          roughness: 0.18,
          metalness: 0.15,
          transmission: isGlow ? 0.35 : 0.85,
          thickness: 1.0,
          transparent: true,
          opacity: 0.92,
          emissive: isGlow ? "#5a0018" : "#000000",
        };
    }
  }, [materialPreset, isGlow]);

  return (
    <mesh
      ref={meshRef}
      position={part.position}
      scale={part.scale}
      rotation={part.rotation || [0, 0, 0]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        setHoveredGroup(part.group);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHoveredGroup(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedGroup(part.group);
      }}
    >
      {part.geometry === "sphere" ? (
        <sphereGeometry args={[1, 32, 32]} />
      ) : part.geometry === "cylinder" ? (
        <cylinderGeometry args={part.geomArgs} />
      ) : (
        <boxGeometry />
      )}
      <meshPhysicalMaterial {...materialProps} />
    </mesh>
  );
}

// ----------------------------------------------------------------------------
// Lighting Presets Component
// ----------------------------------------------------------------------------
function ScenicLights({ mode }: { mode: string }) {
  if (mode === "cyberpunk") {
    return (
      <>
        <ambientLight intensity={0.25} />
        {/* Neon Pink/Red from right */}
        <directionalLight position={[4, 2, 2]} intensity={2.5} color="#ff007f" />
        {/* Neon Cyan from left */}
        <directionalLight position={[-4, 2, 2]} intensity={2.5} color="#00f3ff" />
        {/* Violet rim light from back */}
        <pointLight position={[0, 1.5, -4]} intensity={3.0} color="#8a2be2" />
        {/* Warm fill accent */}
        <pointLight position={[0, -3, 2]} intensity={1.0} color="#ff7700" />
      </>
    );
  }

  if (mode === "dramatic") {
    return (
      <>
        <ambientLight intensity={0.05} />
        {/* High-contrast key light */}
        <directionalLight
          position={[-3.5, 4.5, 2.5]}
          intensity={4.0}
          color="#fff6eb"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        {/* Blue rim light from back */}
        <pointLight position={[3, 1, -3]} intensity={3.5} color="#93c5fd" />
        {/* Soft floor fill */}
        <pointLight position={[0, -3.5, 1]} intensity={0.5} color="#444" />
      </>
    );
  }

  // default: Studio
  return (
    <>
      <ambientLight intensity={0.6} />
      {/* Three point lighting */}
      <directionalLight
        position={[3, 4, 3]}
        intensity={2.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 2, -2]} intensity={1.0} color="#f0f2ff" />
      <pointLight position={[0, 2.5, -3.5]} intensity={1.8} color="#ffffff" />
    </>
  );
}

// ----------------------------------------------------------------------------
// Scene Assembly Component
// ----------------------------------------------------------------------------
function TorsoScene({
  explodeFactor,
  hoveredGroup,
  selectedGroup,
  setHoveredGroup,
  setSelectedGroup,
  materialPreset,
  lightingMode,
  autoRotateSpeed,
}: {
  explodeFactor: number;
  hoveredGroup: string | null;
  selectedGroup: string | null;
  setHoveredGroup: (g: string | null) => void;
  setSelectedGroup: (g: string | null) => void;
  materialPreset: string;
  lightingMode: string;
  autoRotateSpeed: number;
}) {
  const modelGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!modelGroup.current) return;
    if (autoRotateSpeed > 0) {
      modelGroup.current.rotation.y = state.clock.elapsedTime * 0.15 * autoRotateSpeed;
    }
  });

  return (
    <>
      <ScenicLights mode={lightingMode} />
      <Environment preset="city" />

      <group ref={modelGroup} position={[0, 0.05, 0]}>
        {/* Static structural base mannequin */}
        <CentralChassis explodeFactor={explodeFactor} materialPreset={materialPreset} />

        {/* Anatomical Muscle Layer */}
        {MUSCLE_PARTS.map((part) => (
          <MuscleMesh
            key={part.id}
            part={part}
            explodeFactor={explodeFactor}
            hoveredGroup={hoveredGroup}
            selectedGroup={selectedGroup}
            setHoveredGroup={setHoveredGroup}
            setSelectedGroup={setSelectedGroup}
            materialPreset={materialPreset}
          />
        ))}
      </group>

      {/* Grid Floor */}
      <gridHelper 
        args={[12, 24, lightingMode === "cyberpunk" ? "#ff007f" : "#444446", "#1e1e24"]} 
        position={[0, -0.85, 0]} 
      />
    </>
  );
}

// ----------------------------------------------------------------------------
// Main Page Export Component
// ----------------------------------------------------------------------------
export default function BodyPage() {
  const { theme } = useTheme();

  // Control states
  const [explodeFactor, setExplodeFactor] = useState(0.0);
  const [materialPreset, setMaterialPreset] = useState("obsidian"); // default dark theme glass
  const [lightingMode, setLightingMode] = useState("cyberpunk"); // default cool neon vibe
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.0);

  // Interaction states
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Active muscle group info helper
  const activeGroup = hoveredGroup || selectedGroup;
  const activeInfo = activeGroup ? MUSCLE_GROUPS[activeGroup] : null;

  // Handle panel click-away to clear selection
  const handleClearSelection = () => {
    setSelectedGroup(null);
  };

  return (
    <div 
      className={`relative w-full min-h-screen overflow-hidden transition-colors duration-500`}
      style={{
        backgroundColor: theme === "light" ? "#f4f4f7" : "#020204",
        color: theme === "light" ? "#0f0f15" : "#f4f4f9",
      }}
    >
      {/* Back Button Container */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <BackButton />
        <span className="text-xs uppercase tracking-widest opacity-40 font-mono hidden md:inline">
          Anatomy Torso / Model 09
        </span>
      </div>

      {/* Grid Canvas */}
      <div className="w-full h-screen absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
        <Canvas shadows camera={{ position: [0, 0.2, 2.2], fov: 45 }}>
          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3 font-mono text-xs tracking-widest text-pink-500 animate-pulse">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                LOADING SYSTEM...
              </div>
            </Html>
          }>
            <TorsoScene
              explodeFactor={explodeFactor}
              hoveredGroup={hoveredGroup}
              selectedGroup={selectedGroup}
              setHoveredGroup={setHoveredGroup}
              setSelectedGroup={setSelectedGroup}
              materialPreset={materialPreset}
              lightingMode={lightingMode}
              autoRotateSpeed={autoRotateSpeed}
            />
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              minDistance={1.2}
              maxDistance={4.0}
              target={[0, 0, 0]}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.8}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* ----------------------------------------------------------------------
          Left Panel: Muscle Information Detail 
         ---------------------------------------------------------------------- */}
      <div className="absolute left-6 top-24 bottom-6 w-full max-w-[360px] pointer-events-none z-20 flex flex-col justify-end md:justify-start">
        <AnimatePresence mode="wait">
          {activeInfo ? (
            <motion.div
              key={activeGroup}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full pointer-events-auto p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-4 shadow-2xl`}
              style={{
                backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(8, 8, 12, 0.85)",
                borderColor: theme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)" }}>
                <div>
                  <h2 className="text-xl font-bold font-sans tracking-tight text-pink-500">
                    {activeInfo.koreanName}
                  </h2>
                  <p className="text-xs font-mono opacity-50 mt-0.5">{activeInfo.name}</p>
                </div>
                <span className="text-[10px] font-mono border px-2 py-0.5 rounded-full opacity-60 text-pink-400 border-pink-500/30 uppercase">
                  Active
                </span>
              </div>

              <div className="flex flex-col gap-3 text-sm leading-relaxed overflow-y-auto max-h-[40vh] scrollbar-hide">
                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1">학명 (Latin)</span>
                  <p className="font-mono text-xs italic">{activeInfo.latinName}</p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1">구조 설명</span>
                  <p className="opacity-80 text-xs md:text-sm">{activeInfo.description}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1">주요 작용 (Function)</span>
                  <p className="opacity-80 text-xs md:text-sm">{activeInfo.function}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1.5">추천 운동 (Target Exercises)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeInfo.workout.split(", ").map((work, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[10px] md:text-xs px-2.5 py-1 rounded-lg border font-medium`}
                        style={{
                          backgroundColor: theme === "light" ? "#f1f3f9" : "#12121a",
                          borderColor: theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                        }}
                      >
                        {work}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {selectedGroup && (
                <button
                  onClick={handleClearSelection}
                  className="mt-2 text-xs font-mono border border-dashed rounded-lg py-2 hover:bg-pink-500/10 text-pink-400 border-pink-500/30 transition-all pointer-events-auto"
                >
                  선택 해제 (Clear Details)
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`w-full pointer-events-auto p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-4 shadow-xl`}
              style={{
                backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(8, 8, 12, 0.85)",
                borderColor: theme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="flex items-center gap-2 text-pink-500">
                <BookOpen size={18} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">ANATOMY GUIDE</span>
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">3D 남성 상체 데모</h2>
                <p className="text-xs opacity-50 mt-1 leading-relaxed">
                  3D 공간에서 마우스나 손가락 드래그를 통해 몸을 회전 및 확대할 수 있습니다.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t pt-4 text-xs leading-relaxed opacity-75" style={{ borderColor: theme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-mono font-bold mt-0.5">1</div>
                  <p>몸 근육 파트에 마우스를 올리거나 터치하면 해당 근육 부위의 위치가 붉게 빛나며 활성화됩니다.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-mono font-bold mt-0.5">2</div>
                  <p>클릭 또는 탭하여 근육을 고정하면 라틴어 학명, 구조 분석, 관련 트레이닝 루틴 정보를 상세히 볼 수 있습니다.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 font-mono font-bold mt-0.5">3</div>
                  <p>우측 패널의 **분해 뷰 (Explode View)** 조절 장치를 사용해 사이버네틱 쉘 형태로 해체해 보십시오.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ----------------------------------------------------------------------
          Right Panel: System Controller Settings
         ---------------------------------------------------------------------- */}
      <div className="absolute right-6 top-24 bottom-6 w-full max-w-[320px] pointer-events-none z-20 flex flex-col justify-end md:justify-start">
        <div 
          className="w-full pointer-events-auto p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-6 shadow-2xl"
          style={{
            backgroundColor: theme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(8, 8, 12, 0.85)",
            borderColor: theme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex items-center gap-2" style={{ color: theme === "light" ? "#333" : "#fff" }}>
            <Sliders size={16} />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Controls Panel</h3>
          </div>

          {/* Preset 1: Explode View Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="opacity-60 flex items-center gap-1">
                <Maximize2 size={12} />
                분해 뷰 (Explode)
              </span>
              <span className="text-pink-500 font-bold">{(explodeFactor * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={explodeFactor}
              onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
              className="w-full h-1 bg-pink-500/10 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
            />
          </div>

          {/* Preset 2: Auto Rotate Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="opacity-60 flex items-center gap-1">
                <RotateCw size={12} />
                자동 회전 속도
              </span>
              <span className="text-pink-500 font-bold">{autoRotateSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.1"
              value={autoRotateSpeed}
              onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-pink-500/10 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none"
            />
          </div>

          {/* Preset 3: Material Selectors */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono opacity-60 flex items-center gap-1">
              <Layers size={12} />
              근육 쉘 텍스처 (Materials)
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "obsidian", label: "Obsidian", glow: "흑요석 유리" },
                { id: "marble", label: "Marble", glow: "석조 조각상" },
                { id: "chrome", label: "Chrome", glow: "액체 크롬" },
                { id: "hologram", label: "Hologram", glow: "홀로그램" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setMaterialPreset(preset.id)}
                  className={`text-xs p-2 rounded-lg border font-mono transition-all text-left flex flex-col ${
                    materialPreset === preset.id
                      ? "border-pink-500 text-pink-500 bg-pink-500/5 font-semibold"
                      : theme === "light" 
                        ? "border-black/5 hover:border-black/15 bg-black/5 text-gray-700" 
                        : "border-white/5 hover:border-white/10 bg-white/5 text-gray-300"
                  }`}
                >
                  <span className="text-xs leading-none">{preset.label}</span>
                  <span className="text-[9px] opacity-40 mt-1 leading-none font-sans">{preset.glow}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preset 4: Lighting Modes */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono opacity-60 flex items-center gap-1">
              <Sun size={12} />
              스튜디오 라이팅 (Lights)
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                { id: "cyberpunk", label: "Cyberpunk Dual Neon", desc: "사이버 테일 & 핑크 네온 림라이트" },
                { id: "studio", label: "Studio Soft Key", desc: "기본 주광 3점식 화이트 조명" },
                { id: "dramatic", label: "Dramatic Rim Noir", desc: "어두운 명암 대비 림 실루엣" },
              ].map((light) => (
                <button
                  key={light.id}
                  onClick={() => setLightingMode(light.id)}
                  className={`text-xs p-2.5 rounded-lg border font-sans text-left transition-all flex flex-col ${
                    lightingMode === light.id
                      ? "border-pink-500 text-pink-500 bg-pink-500/5 font-semibold"
                      : theme === "light"
                        ? "border-black/5 hover:border-black/15 bg-black/5 text-gray-700"
                        : "border-white/5 hover:border-white/10 bg-white/5 text-gray-300"
                  }`}
                >
                  <span className="text-xs">{light.label}</span>
                  <span className="text-[9px] opacity-50 mt-0.5">{light.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
