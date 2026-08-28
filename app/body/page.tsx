"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
type OrbitControlsImpl = React.ComponentRef<typeof OrbitControls>;
import * as THREE from "three";
import { BackButton } from "../../components/BackButton";
import { useTheme } from "../theme-provider";
import { AnimatePresence, motion } from "framer-motion";
import { Waves, RotateCw, Sun, Fish, Info, Maximize2 } from "lucide-react";

// ----------------------------------------------------------------------------
// Whale shark anatomy data
// ----------------------------------------------------------------------------
type PartId =
  | "head"
  | "gills"
  | "dorsal_fin"
  | "pectoral_fins"
  | "caudal_fin"
  | "skin_pattern";

interface PartInfo {
  id: PartId;
  name: string;
  koreanName: string;
  description: string;
  fact: string;
  trivia: string;
  camPos: [number, number, number];
  camTarget: [number, number, number];
}

const SHARK_PARTS: Record<PartId, PartInfo> = {
  head: {
    id: "head",
    name: "Head & Mouth",
    koreanName: "머리와 입",
    description:
      "고래상어는 날카로운 이빨 대신 입 안 가득한 여과판으로 먹이를 거르는 여과 섭식자다. 폭 1.5m에 달하는 입이 뾰족하지 않은 넓적한 머리 맨 앞에 거의 수평으로 자리 잡고 있다.",
    fact: "물과 함께 플랑크톤·크릴·작은 어류를 빨아들인 뒤 아가미 안쪽의 여과판으로 걸러내는 흡입 여과 섭식을 한다.",
    trivia: "위협을 느끼면 작은 눈을 안쪽으로 움푹 집어넣어 보호한다는 사실이 비교적 최근 밝혀졌다.",
    camPos: [3.1, 0.85, 2.1],
    camTarget: [2.7, 0.1, 0],
  },
  gills: {
    id: "gills",
    name: "Gill Slits",
    koreanName: "아가미 구멍",
    description:
      "머리 양옆, 가슴지느러미 바로 앞에 다섯 쌍의 커다란 아가미 구멍이 있다. 다른 상어보다 훨씬 커서 대량의 물을 빠르게 통과시킬 수 있다.",
    fact: "삼킨 물을 아가미 밖으로 내보내면서 그 안에 걸린 먹이 입자를 걸러내는 동시에 호흡도 함께 이뤄진다.",
    trivia: "시간당 최대 6,000리터에 이르는 물을 아가미로 통과시킬 수 있는 것으로 추정된다.",
    camPos: [1.95, 0.35, 2.3],
    camTarget: [1.55, 0, 0.5],
  },
  dorsal_fin: {
    id: "dorsal_fin",
    name: "First Dorsal Fin",
    koreanName: "제1등지느러미",
    description:
      "몸통 중간보다 다소 뒤쪽에 우뚝 솟은 크고 뾰족한 삼각형 지느러미. 이 부위의 반점 무늬는 개체마다 달라 지문처럼 개체 식별에 쓰인다.",
    fact: "헤엄칠 때 몸이 옆으로 흔들리는 것을 막아 방향을 안정적으로 유지시켜 주는 역할을 한다.",
    trivia: "연구자들은 등지느러미 반점 패턴을 사진으로 기록해 개체를 추적하는 'Wildbook' 데이터베이스를 운영한다.",
    camPos: [-0.6, 2.5, 3.0],
    camTarget: [-1.05, 1.05, 0],
  },
  pectoral_fins: {
    id: "pectoral_fins",
    name: "Pectoral Fins",
    koreanName: "가슴지느러미",
    description:
      "몸통에 비해 크고 낫 모양으로 뻗은 한 쌍의 지느러미로, 아가미 뒤쪽 좌우 옆면 아래에 붙어 있다.",
    fact: "상승·하강 각도를 조절하고 저속으로 유영하는 동안 균형을 잡아 주는 양력판 역할을 한다.",
    trivia: "고래상어는 부레가 없어 헤엄을 멈추면 서서히 가라앉는데, 가슴지느러미가 이를 상당 부분 보완한다.",
    camPos: [1.15, -0.1, 3.1],
    camTarget: [0.95, -0.35, 0.75],
  },
  caudal_fin: {
    id: "caudal_fin",
    name: "Caudal Fin",
    koreanName: "꼬리지느러미",
    description:
      "위쪽 엽이 아래쪽 엽보다 훨씬 긴 비대칭(heterocercal) 구조의 대형 꼬리지느러미.",
    fact: "좌우로 흔들며 전진 추진력을 만들어내는 주 동력원으로, 시속 5km 안팎의 느긋한 순항 속도를 낸다.",
    trivia: "몸길이의 4분의 1에 가까울 만큼 커서, 단일 지느러미 크기로는 어류 중에서도 손꼽힌다.",
    camPos: [-6.6, 1.1, 2.6],
    camTarget: [-4.6, 0.2, 0],
  },
  skin_pattern: {
    id: "skin_pattern",
    name: "Skin & Spot Pattern",
    koreanName: "피부와 반점 무늬",
    description:
      "짙은 청회색 등 쪽에 옅은 노란빛 점과 줄무늬가 바둑판처럼 배열된 독특한 피부. 배 쪽은 흰색에 가깝게 옅어진다(countershading).",
    fact: "두께가 최대 10cm에 달해 동물 중 가장 두꺼운 피부로 알려져 있으며, 물리적 손상과 기생충으로부터 몸을 보호한다.",
    trivia: "반점 패턴은 사람의 지문처럼 개체마다 고유해 사진 식별(photo-ID)로 개체 수를 조사하는 데 활용된다.",
    camPos: [0.4, 1.1, 3.3],
    camTarget: [0, 0.25, 0.5],
  },
};

const PART_ORDER: PartId[] = [
  "head",
  "gills",
  "dorsal_fin",
  "pectoral_fins",
  "caudal_fin",
  "skin_pattern",
];

const DEFAULT_CAM_POS: [number, number, number] = [7.2, 3.2, 9.2];
const DEFAULT_CAM_TARGET: [number, number, number] = [0, 0, 0];

// ----------------------------------------------------------------------------
// Body silhouette: [radius, xPosition] from tail tip to snout tip
// ----------------------------------------------------------------------------
const BODY_PROFILE: [number, number][] = [
  [0.015, -4.55],
  [0.09, -4.32],
  [0.2, -4.0],
  [0.33, -3.5],
  [0.43, -2.85],
  [0.485, -2.05],
  [0.5, -1.15],
  [0.495, -0.25],
  [0.48, 0.65],
  [0.455, 1.4],
  [0.43, 1.9],
  [0.4, 2.3],
  [0.36, 2.75],
  [0.28, 3.1],
  [0.18, 3.32],
  [0.1, 3.44],
];

const X_MIN = BODY_PROFILE[0][1];
const X_MAX = BODY_PROFILE[BODY_PROFILE.length - 1][1];

// vertical (dorso-ventral) and lateral scale curves, keyed by normalized length t (0=tail, 1=head)
const VERT_SCALE_KEYS: [number, number][] = [
  [0, 1.15],
  [0.14, 0.78],
  [0.5, 1.0],
  [0.78, 0.95],
  [0.9, 0.72],
  [1, 0.62],
];
const LAT_SCALE_KEYS: [number, number][] = [
  [0, 0.5],
  [0.14, 0.68],
  [0.5, 1.0],
  [0.78, 1.05],
  [0.9, 1.2],
  [1, 1.1],
];

function sampleCurve(t: number, keys: [number, number][]): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const f = (t - t0) / (t1 - t0 || 1);
      return THREE.MathUtils.lerp(v0, v1, f);
    }
  }
  return keys[keys.length - 1][1];
}

function sampleBodyRadius(x: number): number {
  if (x <= BODY_PROFILE[0][1]) return BODY_PROFILE[0][0];
  for (let i = 0; i < BODY_PROFILE.length - 1; i++) {
    const [r0, x0] = BODY_PROFILE[i];
    const [r1, x1] = BODY_PROFILE[i + 1];
    if (x <= x1) {
      const f = (x - x0) / (x1 - x0 || 1);
      return THREE.MathUtils.lerp(r0, r1, f);
    }
  }
  return BODY_PROFILE[BODY_PROFILE.length - 1][0];
}

function bodyHalfHeightAt(x: number): number {
  const t = THREE.MathUtils.clamp((x - X_MIN) / (X_MAX - X_MIN), 0, 1);
  return sampleBodyRadius(x) * sampleCurve(t, VERT_SCALE_KEYS);
}

function bodyHalfWidthAt(x: number): number {
  const t = THREE.MathUtils.clamp((x - X_MIN) / (X_MAX - X_MIN), 0, 1);
  return sampleBodyRadius(x) * sampleCurve(t, LAT_SCALE_KEYS);
}

// ----------------------------------------------------------------------------
// Body geometry: a lathe silhouette, flattened dorso-ventrally near the head
// and laterally compressed near the tail peduncle
// ----------------------------------------------------------------------------
function buildSharkBodyGeometry(): THREE.BufferGeometry {
  const points = BODY_PROFILE.map(([r, x]) => new THREE.Vector2(Math.max(r, 0.001), x));
  const geometry = new THREE.LatheGeometry(points, 40);

  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const px = position.getX(i);
    const py = position.getY(i);
    const pz = position.getZ(i);
    const t = THREE.MathUtils.clamp((py - X_MIN) / (X_MAX - X_MIN), 0, 1);
    const vs = sampleCurve(t, VERT_SCALE_KEYS);
    const ls = sampleCurve(t, LAT_SCALE_KEYS);
    position.setXYZ(i, px * vs, py, pz * ls);
  }
  geometry.rotateZ(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

// ----------------------------------------------------------------------------
// Procedural skin texture: dark spotted back fading to a pale belly
// (built as a raw DataTexture so it's safe to generate outside the DOM)
// ----------------------------------------------------------------------------
function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function createSharkSkinTexture(): THREE.DataTexture {
  const width = 512;
  const height = 256;
  const data = new Uint8Array(width * height * 4);

  const backColor = [30, 47, 58];
  const bellyColor = [214, 217, 205];
  const spotColor = [223, 208, 150];

  const cellsU = 46;
  const cellsV = 64;

  for (let py = 0; py < height; py++) {
    const v = py / height;
    for (let px = 0; px < width; px++) {
      const u = px / width;
      const phi = u * Math.PI * 2;
      const vert = (1 - Math.sin(phi)) / 2; // 0 = belly, 1 = dorsal ridge
      const backMix = THREE.MathUtils.smoothstep(vert, 0.28, 0.72);

      let r = THREE.MathUtils.lerp(bellyColor[0], backColor[0], backMix);
      let g = THREE.MathUtils.lerp(bellyColor[1], backColor[1], backMix);
      let b = THREE.MathUtils.lerp(bellyColor[2], backColor[2], backMix);

      if (backMix > 0.04) {
        const cu = u * cellsU;
        const cv = v * cellsV;
        const cellU = Math.floor(cu);
        const cellV = Math.floor(cv);
        const fu = cu - cellU;
        const fv = cv - cellV;
        const cx = 0.28 + hash2(cellU, cellV) * 0.44;
        const cy = 0.28 + hash2(cellU + 13.7, cellV + 4.3) * 0.44;
        const rad = 0.14 + hash2(cellU + 5.1, cellV + 9.3) * 0.13;
        const dx = fu - cx;
        const dy = (fv - cy) * 1.3;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < rad) {
          const strength = backMix * (1 - dist / rad) * 0.9 + backMix * 0.1;
          r = THREE.MathUtils.lerp(r, spotColor[0], strength);
          g = THREE.MathUtils.lerp(g, spotColor[1], strength);
          b = THREE.MathUtils.lerp(b, spotColor[2], strength);
        }
      }

      const idx = (py * width + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// ----------------------------------------------------------------------------
// Fin geometry helpers
// ----------------------------------------------------------------------------
/** Runs a Catmull-Rom spline through a polyline so fin edges read as smooth
 * curves instead of hard polygon corners. */
function smoothPoints(points: THREE.Vector2[], segmentsPerSpan = 10): THREE.Vector2[] {
  const curve = new THREE.SplineCurve(points);
  const total = Math.max(8, (points.length - 1) * segmentsPerSpan);
  return curve.getPoints(total);
}

function makeFinGeometry(
  outline: [number, number][],
  depth: number,
  orientation: "vertical" | "horizontal",
): THREE.BufferGeometry {
  // the first two points are the flat root edge where the fin meets the
  // body — keep that straight, and spline-smooth the rest of the outer
  // silhouette so the tip and trailing edge read as a naturally curved fin
  // rather than a faceted polygon
  const rootStart = new THREE.Vector2(...outline[0]);
  const rest = outline.slice(1).map(([x, y]) => new THREE.Vector2(x, y));
  const curved = smoothPoints(rest);
  const shape = new THREE.Shape([rootStart, ...curved]);

  const bevel = Math.min(depth * 0.4, 0.022);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  geometry.translate(0, 0, -depth / 2);
  if (orientation === "horizontal") {
    geometry.rotateX(-Math.PI / 2);
  }
  geometry.computeVertexNormals();
  return geometry;
}

const DORSAL_FIN_OUTLINE: [number, number][] = [
  [-0.32, 0],
  [0.08, 0],
  [0.3, 0.08],
  [0.34, 0.5],
  [0.2, 0.92],
  [-0.02, 0.72],
  [-0.26, 0.3],
];

const PECTORAL_FIN_OUTLINE: [number, number][] = [
  [0, 0],
  [-0.4, -0.08],
  [-0.85, -0.38],
  [-1.15, -0.85],
  [-0.95, -1.18],
  [-0.35, -0.88],
  [0.02, -0.35],
];

const PELVIC_FIN_OUTLINE: [number, number][] = [
  [0, 0],
  [-0.18, -0.04],
  [-0.34, -0.22],
  [-0.24, -0.4],
  [0, -0.28],
];

const ANAL_FIN_OUTLINE: [number, number][] = [
  [0.1, 0],
  [-0.06, 0],
  [-0.22, -0.18],
  [-0.06, -0.38],
  [0.12, -0.24],
];

const CAUDAL_FIN_OUTLINE: [number, number][] = [
  [0.16, 0.12],
  [0.02, 0.38],
  [-0.2, 0.68],
  [-0.58, 0.95],
  [-0.98, 1.08],
  [-0.74, 0.62],
  [-0.5, 0.26],
  [-0.8, 0.0],
  [-0.64, -0.3],
  [-0.3, -0.34],
  [-0.04, -0.16],
  [0.14, -0.08],
];

// ----------------------------------------------------------------------------
// Mouth geometry: a wide, gently curved slit instead of a plain box, built
// as a 2D lens shape (width x, opening height y) then rotated so its thin
// extrude axis becomes the fore-aft direction
// ----------------------------------------------------------------------------
function buildMouthGeometry(halfWidth: number): THREE.BufferGeometry {
  const h = 0.065;
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, 0);
  shape.quadraticCurveTo(-halfWidth * 0.55, h * 1.15, 0, h * 0.85);
  shape.quadraticCurveTo(halfWidth * 0.55, h * 1.15, halfWidth, 0);
  shape.quadraticCurveTo(halfWidth * 0.55, -h, 0, -h * 0.75);
  shape.quadraticCurveTo(-halfWidth * 0.55, -h, -halfWidth, 0);

  const depth = 0.09;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.rotateY(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

// ----------------------------------------------------------------------------
// Camera rig: gently glides the camera to a focus point, then hands control
// back to OrbitControls so the user can freely look around from there
// ----------------------------------------------------------------------------
function CameraRig({
  focusId,
  focusNonce,
  controlsRef,
}: {
  focusId: PartId | null;
  focusNonce: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const prevFocus = useRef<string>("__init__");
  const startTime = useRef(0);

  useFrame((state) => {
    const key = `${focusId ?? "__default__"}::${focusNonce}`;
    if (prevFocus.current !== key) {
      prevFocus.current = key;
      startTime.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTime.current;
    if (elapsed > 1.6) return;

    const def = focusId
      ? { position: SHARK_PARTS[focusId].camPos, target: SHARK_PARTS[focusId].camTarget }
      : { position: DEFAULT_CAM_POS, target: DEFAULT_CAM_TARGET };

    camera.position.lerp(new THREE.Vector3(...def.position), 0.07);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(...def.target), 0.07);
      controlsRef.current.update();
    }
  });

  return null;
}

// ----------------------------------------------------------------------------
// Ocean-themed lighting presets
// ----------------------------------------------------------------------------
function OceanLights({ mode }: { mode: string }) {
  if (mode === "deep") {
    return (
      <>
        <ambientLight intensity={0.35} color="#123047" />
        <directionalLight position={[2, 6, 3]} intensity={0.8} color="#3a6b8a" />
        <pointLight position={[-3, -1, 3]} intensity={1.4} color="#1f6f8b" />
      </>
    );
  }
  if (mode === "twilight") {
    return (
      <>
        <ambientLight intensity={0.5} color="#2c3d55" />
        <directionalLight position={[-4, 5, 2]} intensity={1.6} color="#ffb37a" castShadow />
        <pointLight position={[4, -1, -3]} intensity={1.4} color="#3d6fa8" />
      </>
    );
  }
  // surface (default)
  return (
    <>
      <ambientLight intensity={0.75} color="#bfe6ff" />
      <directionalLight
        position={[3, 8, 4]}
        intensity={2.2}
        color="#eaf8ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} color="#7fd0ff" />
    </>
  );
}

// ----------------------------------------------------------------------------
// Interaction handler factory
// ----------------------------------------------------------------------------
function partHandlers(
  id: PartId,
  setHovered: (v: PartId | null) => void,
  onSelect: (v: PartId) => void,
) {
  return {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "pointer";
      setHovered(id);
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      document.body.style.cursor = "auto";
      setHovered(null);
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onSelect(id);
    },
  };
}

// ----------------------------------------------------------------------------
// The whale shark model itself
// ----------------------------------------------------------------------------
function WhaleShark({
  activePart,
  setHovered,
  onSelect,
  autoRotate,
  autoRotateSpeed,
}: {
  activePart: PartId | null;
  setHovered: (v: PartId | null) => void;
  onSelect: (v: PartId) => void;
  autoRotate: boolean;
  autoRotateSpeed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    if (autoRotate) {
      angleRef.current += delta * 0.12 * autoRotateSpeed;
    } else {
      // wrap to the shortest path home, then ease back to the reference pose
      // so focused camera presets (computed for rotation.y === 0) stay aligned
      const twoPi = Math.PI * 2;
      let wrapped = angleRef.current % twoPi;
      if (wrapped > Math.PI) wrapped -= twoPi;
      if (wrapped < -Math.PI) wrapped += twoPi;
      angleRef.current = THREE.MathUtils.lerp(wrapped, 0, 0.06);
    }
    groupRef.current.rotation.y = angleRef.current;
  });

  const bodyGeometry = useMemo(() => buildSharkBodyGeometry(), []);
  const skinTexture = useMemo(() => createSharkSkinTexture(), []);

  const dorsalGeo = useMemo(() => makeFinGeometry(DORSAL_FIN_OUTLINE, 0.05, "vertical"), []);
  const pectoralGeo = useMemo(() => makeFinGeometry(PECTORAL_FIN_OUTLINE, 0.045, "horizontal"), []);
  const pelvicGeo = useMemo(() => makeFinGeometry(PELVIC_FIN_OUTLINE, 0.03, "horizontal"), []);
  const analGeo = useMemo(() => makeFinGeometry(ANAL_FIN_OUTLINE, 0.03, "vertical"), []);
  const caudalGeo = useMemo(() => makeFinGeometry(CAUDAL_FIN_OUTLINE, 0.06, "vertical"), []);

  const isActive = (id: PartId) => activePart === id;
  const glowFor = (id: PartId) => (isActive(id) ? "#38bdf8" : "#000000");
  const glowIntensity = (id: PartId) => (isActive(id) ? 0.4 : 0);

  const finColor = "#22333f";

  // surface anchor points
  const eyeX = 2.85;
  const eyeZ = bodyHalfWidthAt(eyeX) * 0.82;

  const mouthX = X_MAX - 0.42;
  const mouthY = -bodyHalfHeightAt(mouthX) * 0.62;
  const mouthHalfWidth = bodyHalfWidthAt(mouthX) * 1.05;
  const mouthGeo = useMemo(() => buildMouthGeometry(mouthHalfWidth), [mouthHalfWidth]);

  const gillStartX = 1.85;
  const gillCount = 5;

  const pectoralX = gillStartX - 0.85;
  const pectoralY = -bodyHalfHeightAt(pectoralX) * 0.35;
  const pectoralZ = bodyHalfWidthAt(pectoralX) * 0.92;

  const dorsalX = -1.05;
  const dorsalY = bodyHalfHeightAt(dorsalX) * 0.96;

  const secondDorsalX = -3.25;
  const secondDorsalY = bodyHalfHeightAt(secondDorsalX) * 0.96;

  const pelvicX = -1.95;
  const pelvicY = -bodyHalfHeightAt(pelvicX) * 0.9;
  const pelvicZ = bodyHalfWidthAt(pelvicX) * 0.85;

  const analX = -2.85;
  const analY = -bodyHalfHeightAt(analX) * 0.96;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh geometry={bodyGeometry} {...partHandlers("skin_pattern", setHovered, onSelect)} castShadow receiveShadow>
        <meshPhysicalMaterial
          map={skinTexture}
          roughness={0.55}
          metalness={0.03}
          clearcoat={0.25}
          clearcoatRoughness={0.4}
          emissive={glowFor("skin_pattern")}
          emissiveIntensity={glowIntensity("skin_pattern")}
        />
      </mesh>

      {/* Eyes */}
      {[1, -1].map((side) => (
        <group key={side} position={[eyeX, 0.03, eyeZ * side]}>
          <mesh scale={0.065} {...partHandlers("head", setHovered, onSelect)}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshPhysicalMaterial color="#050505" roughness={0.15} clearcoat={0.8} clearcoatRoughness={0.1} />
          </mesh>
          {/* raised socket rim so the eye reads as set into the head, not floating on it */}
          <mesh rotation={[0, Math.PI / 2, 0]} scale={0.9}>
            <torusGeometry args={[0.078, 0.014, 8, 20]} />
            <meshPhysicalMaterial color="#16232c" roughness={0.75} metalness={0.02} />
          </mesh>
        </group>
      ))}

      {/* Mouth */}
      <mesh
        geometry={mouthGeo}
        position={[mouthX, mouthY, 0]}
        {...partHandlers("head", setHovered, onSelect)}
      >
        <meshStandardMaterial
          color="#0a0a0a"
          roughness={0.85}
          emissive={glowFor("head")}
          emissiveIntensity={glowIntensity("head")}
        />
      </mesh>

      {/* Nostrils: small nasal grooves just above the mouth corners */}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          position={[mouthX + 0.1, mouthY + 0.09, mouthHalfWidth * 0.72 * side]}
          rotation={[0, 0, 0.3]}
          scale={[0.028, 0.014, 0.05]}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="#0d1319" roughness={0.85} />
        </mesh>
      ))}

      {/* invisible larger proxy so the broad flat head is easy to click */}
      <mesh
        position={[eyeX - 0.1, 0, 0]}
        scale={[0.9, 0.7, 0.9]}
        visible={false}
        {...partHandlers("head", setHovered, onSelect)}
      >
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Gill slits */}
      <group {...partHandlers("gills", setHovered, onSelect)}>
        {Array.from({ length: gillCount }).map((_, i) => {
          const gx = gillStartX - i * 0.13;
          const gh = bodyHalfHeightAt(gx) * 0.62;
          const gz = bodyHalfWidthAt(gx) * 0.99;
          return [1, -1].map((side) => (
            <mesh key={`${i}-${side}`} position={[gx, 0.02, gz * side]} rotation={[0, 0, side * 0.12]} scale={[0.045, gh, 0.02]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial
                color="#0d1319"
                roughness={0.85}
                emissive={glowFor("gills")}
                emissiveIntensity={glowIntensity("gills")}
              />
            </mesh>
          ));
        })}
      </group>

      {/* First dorsal fin */}
      <mesh
        geometry={dorsalGeo}
        position={[dorsalX, dorsalY, 0]}
        rotation={[0, 0, -0.1]}
        castShadow
        {...partHandlers("dorsal_fin", setHovered, onSelect)}
      >
        <meshPhysicalMaterial
          color={finColor}
          roughness={0.6}
          metalness={0.02}
          clearcoat={0.2}
          emissive={glowFor("dorsal_fin")}
          emissiveIntensity={glowIntensity("dorsal_fin")}
        />
      </mesh>

      {/* Second (smaller) dorsal fin */}
      <mesh
        geometry={dorsalGeo}
        position={[secondDorsalX, secondDorsalY, 0]}
        rotation={[0, 0, -0.05]}
        scale={0.32}
        {...partHandlers("dorsal_fin", setHovered, onSelect)}
      >
        <meshPhysicalMaterial
          color={finColor}
          roughness={0.6}
          metalness={0.02}
          emissive={glowFor("dorsal_fin")}
          emissiveIntensity={glowIntensity("dorsal_fin")}
        />
      </mesh>

      {/* Pectoral fins */}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          geometry={pectoralGeo}
          position={[pectoralX, pectoralY, pectoralZ * side]}
          rotation={[0, 0, side > 0 ? -0.22 : 0.22]}
          scale={[1, 1, side]}
          castShadow
          {...partHandlers("pectoral_fins", setHovered, onSelect)}
        >
          <meshPhysicalMaterial
            color={finColor}
            roughness={0.6}
            metalness={0.02}
            clearcoat={0.2}
            emissive={glowFor("pectoral_fins")}
            emissiveIntensity={glowIntensity("pectoral_fins")}
          />
        </mesh>
      ))}

      {/* Pelvic fins */}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          geometry={pelvicGeo}
          position={[pelvicX, pelvicY, pelvicZ * side]}
          scale={[1, 1, side]}
          {...partHandlers("pectoral_fins", setHovered, onSelect)}
        >
          <meshPhysicalMaterial color={finColor} roughness={0.65} metalness={0.02} />
        </mesh>
      ))}

      {/* Anal fin */}
      <mesh geometry={analGeo} position={[analX, analY, 0]}>
        <meshPhysicalMaterial color={finColor} roughness={0.65} metalness={0.02} />
      </mesh>

      {/* Caudal (tail) fin */}
      <mesh
        geometry={caudalGeo}
        position={[X_MIN, 0.02, 0]}
        castShadow
        {...partHandlers("caudal_fin", setHovered, onSelect)}
      >
        <meshPhysicalMaterial
          color={finColor}
          roughness={0.6}
          metalness={0.02}
          clearcoat={0.2}
          emissive={glowFor("caudal_fin")}
          emissiveIntensity={glowIntensity("caudal_fin")}
        />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------------------
// Scene
// ----------------------------------------------------------------------------
function OceanFloor({ tint }: { tint: string }) {
  return (
    <gridHelper args={[24, 24, tint, "#0a1622"]} position={[0, -1.6, 0]} />
  );
}

function OceanScene({
  activePart,
  focusNonce,
  setHovered,
  onSelect,
  autoRotate,
  autoRotateSpeed,
  lightingMode,
  controlsRef,
}: {
  activePart: PartId | null;
  focusNonce: number;
  setHovered: (v: PartId | null) => void;
  onSelect: (v: PartId) => void;
  autoRotate: boolean;
  autoRotateSpeed: number;
  lightingMode: string;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  return (
    <>
      <OceanLights mode={lightingMode} />
      <Environment preset="sunset" />
      <CameraRig focusId={activePart} focusNonce={focusNonce} controlsRef={controlsRef} />

      <WhaleShark
        activePart={activePart}
        setHovered={setHovered}
        onSelect={onSelect}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
      />

      <OceanFloor tint={lightingMode === "deep" ? "#123047" : "#2c5f7a"} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enablePan
        enableZoom
        minDistance={1.6}
        maxDistance={22}
      />
    </>
  );
}

// ----------------------------------------------------------------------------
// Page
// ----------------------------------------------------------------------------
export default function WhaleSharkPage() {
  const { theme } = useTheme();

  const [activePart, setActivePart] = useState<PartId | null>(null);
  const [hoveredPart, setHoveredPart] = useState<PartId | null>(null);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(0.6);
  const [lightingMode, setLightingMode] = useState("surface");
  const [focusNonce, setFocusNonce] = useState(0);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  // stable reference: an inline object literal here would make r3f re-apply
  // (and reset) the camera on every re-render of this component
  const cameraConfig = useMemo(() => ({ position: DEFAULT_CAM_POS, fov: 42 }), []);

  const handleSelect = (id: PartId) => {
    setActivePart((prev) => (prev === id ? null : id));
    setFocusNonce((n) => n + 1);
  };

  const resetView = () => {
    setActivePart(null);
    setFocusNonce((n) => n + 1);
  };

  const displayPart = hoveredPart ?? activePart;
  const info = displayPart ? SHARK_PARTS[displayPart] : null;

  const panelBg = theme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(6, 14, 20, 0.82)";
  const panelBorder = theme === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)";
  const textColor = theme === "light" ? "#0f172a" : "#eaf6ff";

  const canvasBg =
    lightingMode === "deep" ? "#020a12" : lightingMode === "twilight" ? "#0a1826" : theme === "light" ? "#bfe3f2" : "#03121d";

  return (
    <div
      className="relative w-full min-h-screen overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: canvasBg, color: textColor }}
    >
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <BackButton />
        <span className="text-xs uppercase tracking-widest opacity-40 font-mono hidden md:inline">
          Whale Shark / Rhincodon typus
        </span>
      </div>

      {/* Canvas */}
      <div className="w-full h-screen absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
        <Canvas shadows camera={cameraConfig}>
          <color attach="background" args={[canvasBg]} />
          <fog attach="fog" args={[canvasBg, 10, 34]} />
          <Suspense
            fallback={
              <Html center>
                <div className="flex flex-col items-center gap-3 font-mono text-xs tracking-widest text-sky-400 animate-pulse">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  DIVING IN...
                </div>
              </Html>
            }
          >
            <OceanScene
              activePart={activePart}
              focusNonce={focusNonce}
              setHovered={setHoveredPart}
              onSelect={handleSelect}
              autoRotate={autoRotateSpeed > 0 && !activePart}
              autoRotateSpeed={autoRotateSpeed}
              lightingMode={lightingMode}
              controlsRef={controlsRef}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Left panel: info card */}
      <div className="absolute left-6 top-24 bottom-6 w-full max-w-[360px] pointer-events-none z-20 flex flex-col justify-end md:justify-start">
        <AnimatePresence mode="wait">
          {info ? (
            <motion.div
              key={info.id}
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-full pointer-events-auto p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-4 shadow-2xl"
              style={{ backgroundColor: panelBg, borderColor: panelBorder }}
            >
              <div className="flex items-start justify-between border-b pb-3" style={{ borderColor: panelBorder }}>
                <div>
                  <h2 className="text-xl font-bold font-sans tracking-tight text-sky-400">{info.koreanName}</h2>
                  <p className="text-xs font-mono opacity-50 mt-0.5">{info.name}</p>
                </div>
                <span className="text-[10px] font-mono border px-2 py-0.5 rounded-full opacity-60 text-sky-400 border-sky-400/30 uppercase">
                  {activePart === info.id ? "Focused" : "Preview"}
                </span>
              </div>

              <div className="flex flex-col gap-3 text-sm leading-relaxed overflow-y-auto max-h-[40vh]">
                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1">구조 설명</span>
                  <p className="opacity-80 text-xs md:text-sm">{info.description}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1">주요 기능</span>
                  <p className="opacity-80 text-xs md:text-sm">{info.fact}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold opacity-40 block mb-1">알아두면 좋은 사실</span>
                  <p className="opacity-80 text-xs md:text-sm">{info.trivia}</p>
                </div>
              </div>

              {activePart === info.id && (
                <button
                  onClick={resetView}
                  className="mt-2 text-xs font-mono border border-dashed rounded-lg py-2 hover:bg-sky-400/10 text-sky-400 border-sky-400/30 transition-all pointer-events-auto"
                >
                  전체보기로 돌아가기
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full pointer-events-auto p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-4 shadow-xl"
              style={{ backgroundColor: panelBg, borderColor: panelBorder }}
            >
              <div className="flex items-center gap-2 text-sky-400">
                <Fish size={18} />
                <span className="text-xs font-mono font-bold uppercase tracking-wider">Whale Shark Guide</span>
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">고래상어 3D 탐험</h2>
                <p className="text-xs opacity-50 mt-1 leading-relaxed">
                  드래그로 회전하고 스크롤로 확대·축소하며 몸 구석구석을 살펴보세요. 몸의 각 부위를 클릭하면 그 부분으로
                  카메라가 다가가며 설명이 나타납니다.
                </p>
              </div>
              <div
                className="flex flex-col gap-3 border-t pt-4 text-xs leading-relaxed opacity-75"
                style={{ borderColor: panelBorder }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 font-mono font-bold mt-0.5">
                    1
                  </div>
                  <p>머리, 아가미, 지느러미, 피부 무늬 위에 마우스를 올리면 이름이 미리 보입니다.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 font-mono font-bold mt-0.5">
                    2
                  </div>
                  <p>클릭하면 그 부위로 카메라가 이동하며 자세한 설명이 열립니다.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-sky-400/10 flex items-center justify-center text-sky-400 font-mono font-bold mt-0.5">
                    3
                  </div>
                  <p>오른쪽 패널의 부위 목록 버튼으로도 곧장 이동할 수 있습니다.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right panel: controls */}
      <div className="absolute right-6 top-24 bottom-6 w-full max-w-[300px] pointer-events-none z-20 flex flex-col justify-end md:justify-start">
        <div
          className="w-full pointer-events-auto p-6 rounded-2xl border backdrop-blur-xl flex flex-col gap-6 shadow-2xl"
          style={{ backgroundColor: panelBg, borderColor: panelBorder }}
        >
          <div className="flex items-center gap-2" style={{ color: textColor }}>
            <Waves size={16} />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Dive Controls</h3>
          </div>

          {/* Part quick-jump list */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono opacity-60 flex items-center gap-1">
              <Info size={12} />
              부위 둘러보기
            </span>
            <div className="flex flex-col gap-1.5">
              {PART_ORDER.map((id) => (
                <button
                  key={id}
                  onClick={() => handleSelect(id)}
                  className={`text-xs p-2.5 rounded-lg border font-sans text-left transition-all flex flex-col ${
                    activePart === id
                      ? "border-sky-400 text-sky-400 bg-sky-400/5 font-semibold"
                      : theme === "light"
                        ? "border-black/5 hover:border-black/15 bg-black/5 text-gray-700"
                        : "border-white/5 hover:border-white/10 bg-white/5 text-gray-300"
                  }`}
                >
                  <span className="text-xs">{SHARK_PARTS[id].koreanName}</span>
                  <span className="text-[9px] opacity-50 mt-0.5">{SHARK_PARTS[id].name}</span>
                </button>
              ))}
              <button
                onClick={resetView}
                className="text-xs p-2 rounded-lg border border-dashed font-mono flex items-center gap-1.5 justify-center opacity-70 hover:opacity-100 transition-all"
                style={{ borderColor: panelBorder }}
              >
                <Maximize2 size={12} />
                전체보기
              </button>
            </div>
          </div>

          {/* Auto rotate */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="opacity-60 flex items-center gap-1">
                <RotateCw size={12} />
                자동 회전 속도
              </span>
              <span className="text-sky-400 font-bold">{autoRotateSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={autoRotateSpeed}
              onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-sky-400/10 rounded-lg appearance-none cursor-pointer accent-sky-400 focus:outline-none"
            />
          </div>

          {/* Lighting modes */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono opacity-60 flex items-center gap-1">
              <Sun size={12} />
              수중 조명
            </span>
            <div className="flex flex-col gap-1.5">
              {[
                { id: "surface", label: "표층 (Sunlit Surface)", desc: "밝은 청록빛 표층 채광" },
                { id: "twilight", label: "황혼대 (Twilight Zone)", desc: "노을빛과 청색광의 대비" },
                { id: "deep", label: "심해 (Deep Blue)", desc: "어둡고 차분한 심해 채광" },
              ].map((light) => (
                <button
                  key={light.id}
                  onClick={() => setLightingMode(light.id)}
                  className={`text-xs p-2.5 rounded-lg border font-sans text-left transition-all flex flex-col ${
                    lightingMode === light.id
                      ? "border-sky-400 text-sky-400 bg-sky-400/5 font-semibold"
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
