"use client";

// 12개월 패널이 고리(ring) 또는 격자(grid)로 떠 있는 3D 장면.
// 공휴일은 패널 위에서 맥동하는 별, 연도가 바뀌면 그해 띠에 맞는 모양으로 초신성이 터진다.

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Sparkles, Stars } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { HOLIDAYS } from "./holidays";
import { MONTHS_EN, WEEK_EN, holidaysOf, keyOf, monthCells, pad } from "./calendar";
import type { BurstKind, YearTheme } from "./themes";

const STEP = (Math.PI * 2) / 12;
const RADIUS = 5;
const PANEL_W = 2.3;
const PANEL_H = 2.8;
const GAP = 0.3;
// 패널 텍스처 해상도 (패널 비율과 같게)
const TEX_W = 920;
const TEX_H = 1120;
const INK = "#f4ede1";

export type View = "ring" | "grid";

export interface SceneFonts {
  display: string;
  body: string;
  glyph: string;
  ready: boolean;
}

interface Props {
  year: number;
  theme: YearTheme;
  view: View;
  /** 고리 위치 (달 단위, 연속값). 정면 달 = round(target) mod 12 */
  target: number;
  opened: boolean;
  burstKey: number;
  fonts: SceneFonts;
  today: string;
  reduced: boolean;
  onDrag: (deltaSteps: number) => void;
  onRelease: () => void;
  onPanelClick: (month: number) => void;
}

interface Star {
  x: number;
  y: number;
  label: string;
}

/* ---------- 유틸 ---------- */

function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);

/** 화면 비율별 격자 칸 수 [열, 행] */
function gridShape(aspect: number): [number, number] {
  if (aspect >= 2.1) return [6, 2];
  if (aspect >= 1.15) return [4, 3];
  return [3, 4];
}

const glowCache = new Map<string, THREE.CanvasTexture>();
function glowTexture(theme: YearTheme) {
  const hit = glowCache.get(theme.hot);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.18, alpha(theme.core, 0.85));
  grad.addColorStop(0.45, alpha(theme.hot, 0.3));
  grad.addColorStop(1, alpha(theme.hot, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  glowCache.set(theme.hot, tex);
  return tex;
}

/* ---------- 패널 그리기 ---------- */

/** 테두리 장식: 이중선 + 네 모서리 꺾쇠와 마름모 */
function drawFrame(g: CanvasRenderingContext2D, theme: YearTheme) {
  g.strokeStyle = alpha(theme.warm, 0.45);
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(4, 4, TEX_W - 8, TEX_H - 8, 34);
  g.stroke();
  g.strokeStyle = alpha(theme.warm, 0.16);
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(20, 20, TEX_W - 40, TEX_H - 40, 22);
  g.stroke();

  const arm = 46;
  const m = 20;
  const corners: [number, number, number, number][] = [
    [m, m, 1, 1],
    [TEX_W - m, m, -1, 1],
    [m, TEX_H - m, 1, -1],
    [TEX_W - m, TEX_H - m, -1, -1],
  ];
  g.strokeStyle = theme.warm;
  g.fillStyle = theme.warm;
  g.lineWidth = 4;
  for (const [x, y, sx, sy] of corners) {
    g.beginPath();
    g.moveTo(x + sx * arm, y);
    g.lineTo(x, y);
    g.lineTo(x, y + sy * arm);
    g.stroke();
    const dx = x + sx * 16;
    const dy = y + sy * 16;
    g.beginPath();
    g.moveTo(dx, dy - 7);
    g.lineTo(dx + 7, dy);
    g.lineTo(dx, dy + 7);
    g.lineTo(dx - 7, dy);
    g.closePath();
    g.fill();
  }
}

/** 한 달 패널을 캔버스에 그리고, 공휴일 칸 위치(패널 로컬 좌표)를 함께 돌려준다 */
function drawPanel(year: number, month: number, fonts: SceneFonts, today: string, theme: YearTheme) {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const g = c.getContext("2d")!;
  const holidays = HOLIDAYS[year] ?? {};
  const list = holidaysOf(year, month);

  // 판: 어두운 유리 + 그해 색의 은은한 빛
  g.save();
  g.beginPath();
  g.roundRect(4, 4, TEX_W - 8, TEX_H - 8, 34);
  g.clip();
  g.fillStyle = "rgba(12,11,16,0.95)";
  g.fillRect(0, 0, TEX_W, TEX_H);
  const tint = g.createRadialGradient(TEX_W * 0.15, 0, 0, TEX_W * 0.15, 0, TEX_H);
  tint.addColorStop(0, alpha(theme.hot, 0.22));
  tint.addColorStop(1, alpha(theme.hot, 0));
  g.fillStyle = tint;
  g.fillRect(0, 0, TEX_W, TEX_H);

  // 띠 한자 워터마크
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = alpha(theme.warm, 0.07);
  g.font = `900 700px ${fonts.glyph}`;
  g.fillText(theme.glyph, TEX_W / 2, 700);
  g.restore();

  drawFrame(g, theme);

  // 머리: 큰 월 숫자 + 영문 이름 + 연도·간지 + 공휴일 수
  g.textBaseline = "alphabetic";
  g.textAlign = "left";
  g.fillStyle = INK;
  g.font = `800 250px ${fonts.display}`;
  g.fillText(pad(month + 1), 62, 272);

  g.textAlign = "right";
  g.font = `700 54px ${fonts.display}`;
  g.fillText(MONTHS_EN[month], TEX_W - 66, 136);
  g.fillStyle = alpha(INK, 0.42);
  g.font = `600 40px ${fonts.display}`;
  const yearW = g.measureText(String(year)).width;
  g.fillText(String(year), TEX_W - 66, 188);
  g.fillStyle = alpha(theme.warm, 0.8);
  g.font = `900 36px ${fonts.glyph}`;
  g.fillText(theme.hanja, TEX_W - 80 - yearW, 188);
  g.fillStyle = list.length ? theme.hot : alpha(INK, 0.3);
  g.font = `700 34px ${fonts.body}`;
  g.fillText(list.length ? `공휴일 ${list.length}일` : "공휴일 없음", TEX_W - 66, 254);

  g.strokeStyle = alpha(INK, 0.16);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(62, 308);
  g.lineTo(TEX_W - 62, 308);
  g.stroke();

  // 요일 머리
  const x0 = 62;
  const colW = (TEX_W - 124) / 7;
  const top = 404;
  const rowH = (990 - top) / 6;
  g.textAlign = "center";
  g.font = `700 30px ${fonts.display}`;
  WEEK_EN.forEach((w, i) => {
    g.fillStyle = i === 0 ? alpha(theme.hot, 0.85) : alpha(INK, 0.45);
    g.fillText(w, x0 + colW * (i + 0.5), 362);
  });

  // 날짜
  const stars: Star[] = [];
  monthCells(year, month, 42).forEach((d, i) => {
    if (!d) return;
    const col = i % 7;
    const cx = x0 + colW * (col + 0.5);
    const cy = top + rowH * (Math.floor(i / 7) + 0.5);
    const key = keyOf(year, month, d);
    const name = holidays[key];

    if (name) {
      const disc = g.createRadialGradient(cx, cy, 0, cx, cy, 46);
      disc.addColorStop(0, theme.core);
      disc.addColorStop(0.45, theme.warm);
      disc.addColorStop(0.85, theme.hot);
      disc.addColorStop(1, alpha(theme.hot, 0));
      g.fillStyle = disc;
      g.beginPath();
      g.arc(cx, cy, 46, 0, Math.PI * 2);
      g.fill();
      stars.push({
        x: (cx / TEX_W - 0.5) * PANEL_W,
        y: (0.5 - cy / TEX_H) * PANEL_H,
        label: `${month + 1}월 ${d}일 · ${name}`,
      });
    }
    if (key === today) {
      g.strokeStyle = theme.cool;
      g.lineWidth = 4;
      g.beginPath();
      g.arc(cx, cy, 44, 0, Math.PI * 2);
      g.stroke();
    }

    const weekend = col === 0 || col === 6;
    if (name) g.fillStyle = theme.deep;
    else if (weekend) g.fillStyle = alpha(INK, 0.36);
    else g.fillStyle = INK;
    g.font = `${name ? 800 : 600} 54px ${fonts.display}`;
    g.fillText(String(d), cx, cy + 19);
  });

  // 바닥: 공휴일 이름 줄
  g.textAlign = "left";
  g.font = `600 28px ${fonts.body}`;
  g.fillStyle = alpha(theme.warm, 0.9);
  let line = list.map(([k, n]) => `${+k.slice(8)} ${n}`).join("  ·  ");
  while (line.length > 1 && g.measureText(line).width > TEX_W - 124) line = line.slice(0, -2) + "…";
  g.fillText(list.length ? line : "—", 62, 1060);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, stars };
}

/* ---------- 장면 요소 ---------- */

function Panel({
  index,
  tex,
  stars,
  theme,
  curRef,
  mixRef,
  dragMovedRef,
  onClick,
  reduced,
}: {
  index: number;
  tex: THREE.Texture;
  stars: Star[];
  theme: YearTheme;
  curRef: React.RefObject<number>;
  mixRef: React.RefObject<number>;
  dragMovedRef: React.RefObject<boolean>;
  onClick: (m: number) => void;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const [hover, setHover] = useState(false);
  const [hoverStar, setHoverStar] = useState<number | null>(null);

  useFrame((state, dt) => {
    const grp = group.current;
    if (!grp || !mat.current) return;
    const t = state.clock.elapsedTime;

    // 0 = 고리, 1 = 격자. 달마다 조금씩 늦게 출발해 차례로 날아간다
    const local = smooth(clamp01(mixRef.current * 1.4 - (index / 11) * 0.4));

    // 고리 위치
    let a = (index - curRef.current) * STEP;
    a = Math.atan2(Math.sin(a), Math.cos(a));
    const facing = Math.cos(a);
    const bob = reduced ? 0 : Math.sin(t * 0.6) * 0.06;
    const rx = Math.sin(a) * RADIUS;
    const rz = Math.cos(a) * RADIUS;

    // 격자 위치
    const [cols, rows] = gridShape(state.size.width / state.size.height);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const gx = (col - (cols - 1) / 2) * (PANEL_W + GAP);
    const gy = ((rows - 1) / 2 - row) * (PANEL_H + GAP);

    grp.position.set(
      THREE.MathUtils.lerp(rx, gx, local),
      THREE.MathUtils.lerp(bob, gy, local),
      THREE.MathUtils.lerp(rz, RADIUS, local),
    );
    grp.rotation.y = a * (1 - local);

    // 정면에서 벗어날수록 흐리게 (격자에선 모두 선명)
    const ringOpacity = Math.pow((facing + 1) / 2, 2.4);
    const opacity = THREE.MathUtils.lerp(ringOpacity, 1, local);
    mat.current.opacity = opacity;

    const front = local > 0.5 || Math.abs(a) < STEP / 2;
    const s = hover && front ? 1.05 : 1;
    grp.scale.setScalar(THREE.MathUtils.lerp(grp.scale.x, s, 1 - Math.exp(-dt * 10)));
  });

  return (
    <group ref={group}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          if (!dragMovedRef.current) onClick(index);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = "";
        }}
      >
        <planeGeometry args={[PANEL_W, PANEL_H]} />
        <meshBasicMaterial ref={mat} map={tex} transparent depthWrite={false} fog={false} toneMapped={false} />
      </mesh>
      {stars.map((s, i) => (
        // 공휴일 원 위의 투명한 판: 마우스를 올리면 이름표를 띄운다
        <mesh
          key={i}
          position={[s.x, s.y, 0.01]}
          onClick={(e) => {
            e.stopPropagation();
            if (!dragMovedRef.current) onClick(index);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHoverStar(i);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => setHoverStar(null)}
        >
          <circleGeometry args={[0.12, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          {hoverStar === i && (
            <Html center position={[0, 0.34, 0]} style={{ pointerEvents: "none" }}>
              <div
                style={{
                  whiteSpace: "nowrap",
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(12,10,16,0.9)",
                  border: `1px solid ${alpha(theme.warm, 0.6)}`,
                  color: theme.core,
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: `0 0 24px ${alpha(theme.hot, 0.45)}`,
                }}
              >
                {s.label}
              </div>
            </Html>
          )}
        </mesh>
      ))}
    </group>
  );
}

/** 하늘 뒤편에 크게 떠 있는 띠 한자 */
function Glyph({ theme, fonts, reduced }: { theme: YearTheme; fonts: SceneFonts; reduced: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const born = useRef(-1);

  const tex = useMemo(() => {
    if (!fonts.ready) return null;
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const g = c.getContext("2d")!;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `900 820px ${fonts.glyph}`;
    const fill = g.createLinearGradient(0, 100, 0, 924);
    fill.addColorStop(0, theme.core);
    fill.addColorStop(0.5, theme.warm);
    fill.addColorStop(1, theme.hot);
    g.shadowColor = theme.hot;
    g.shadowBlur = 70;
    g.fillStyle = fill;
    g.fillText(theme.glyph, 512, 540);
    g.shadowBlur = 0;
    g.fillText(theme.glyph, 512, 540);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [theme, fonts]);

  useEffect(() => {
    born.current = -1;
    return () => tex?.dispose();
  }, [tex]);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    if (born.current === -1) born.current = t;
    const fade = reduced ? 1 : smooth(clamp01((t - born.current) / 1.6));
    (m.material as THREE.MeshBasicMaterial).opacity = 0.2 * fade;
    m.position.y = 1.4 + (reduced ? 0 : Math.sin(t * 0.25) * 0.4);
    m.scale.setScalar(0.85 + 0.15 * fade);
  });

  if (!tex) return null;
  return (
    <mesh ref={mesh} position={[0, 1.4, -10]}>
      <planeGeometry args={[17, 17]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
    </mesh>
  );
}

const BURST: Record<BurstKind, { life: number; size: number; swirl: number; wave: number; waveFreq: number }> = {
  coil: { life: 2.8, size: 0.22, swirl: 3.2, wave: 0, waveFreq: 0 }, // 용: 휘감아 오르는 소용돌이
  wave: { life: 2.8, size: 0.22, swirl: 0.5, wave: 1.6, waveFreq: 5 }, // 뱀: 굽이치는 물결
  gallop: { life: 2.0, size: 0.18, swirl: 0, wave: 0.35, waveFreq: 9 }, // 말: 좌우로 내달리는 불티
  fluff: { life: 3.6, size: 0.55, swirl: 0.25, wave: 0.5, waveFreq: 2 }, // 양: 피어오르는 뭉게구름
};
const COUNT = 900;

/** 중심별 + 연도 전환 때 터지는 초신성 입자 */
function Supernova({ theme, burstKey, reduced }: { theme: YearTheme; burstKey: number; reduced: boolean }) {
  const core = useRef<THREE.Sprite>(null);
  const points = useRef<THREE.Points>(null);
  const start = useRef(-100);
  const vel = useRef(new Float32Array(COUNT * 3));
  const phase = useRef(new Float32Array(COUNT));
  const glow = useMemo(() => glowTexture(theme), [theme]);
  const cfg = BURST[theme.burst];

  const geo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return geo;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);

  // burstKey가 바뀔 때마다 그해 모양으로 새로 터뜨린다
  useEffect(() => {
    if (reduced || !points.current) return;
    const colors = points.current.geometry.attributes.color as THREE.BufferAttribute;
    const palette = theme.particles.map((c) => new THREE.Color(c));
    const v = vel.current;
    for (let i = 0; i < COUNT; i++) {
      const c = palette[i % palette.length];
      colors.setXYZ(i, c.r, c.g, c.b);
      const th = Math.random() * Math.PI * 2;
      phase.current[i] = th * 3;
      let x: number, y: number, z: number;
      if (theme.burst === "gallop") {
        const side = Math.random() < 0.5 ? -1 : 1;
        x = side * (5 + Math.random() ** 0.7 * 15);
        y = -0.5 + Math.random() * 2.2;
        z = (Math.random() - 0.5) * 5;
      } else if (theme.burst === "fluff") {
        const sp = 1 + Math.random() * 4;
        x = Math.cos(th) * sp;
        y = 1 + Math.random() * 3;
        z = Math.sin(th) * sp;
      } else if (theme.burst === "coil") {
        const sp = 3 + Math.random() ** 2 * 9;
        x = Math.cos(th) * sp;
        y = (Math.random() - 0.3) * 7;
        z = Math.sin(th) * sp;
      } else {
        const sp = 3 + Math.random() ** 2 * 11;
        x = Math.cos(th) * sp;
        y = (Math.random() - 0.5) * 1.2;
        z = Math.sin(th) * sp;
      }
      v[i * 3] = x;
      v[i * 3 + 1] = y;
      v[i * 3 + 2] = z;
    }
    colors.needsUpdate = true;
    start.current = -1; // 다음 프레임 시간으로 맞춘다
  }, [burstKey, reduced, theme]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (start.current === -1) start.current = t;
    const e = t - start.current;

    if (core.current) {
      const flash = e < 1.6 ? Math.exp(-e * 2.6) : 0;
      const breathe = reduced ? 1 : 1 + 0.08 * Math.sin(t * 1.3);
      core.current.scale.setScalar(5.5 * breathe + flash * 16);
      (core.current.material as THREE.SpriteMaterial).opacity = 0.5 + flash * 0.5;
    }

    const p = points.current;
    if (!p) return;
    const alive = e < cfg.life;
    p.visible = alive;
    if (!alive) return;
    const attr = p.geometry.attributes.position as THREE.BufferAttribute;
    const pos = attr.array as Float32Array;
    const v = vel.current;
    const travel = (1 - Math.exp(-e * 1.8)) / 1.8;
    const ang = cfg.swirl * travel;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    for (let i = 0; i < COUNT; i++) {
      const x = v[i * 3] * travel;
      const z = v[i * 3 + 2] * travel;
      pos[i * 3] = x * ca - z * sa;
      pos[i * 3 + 1] = v[i * 3 + 1] * travel + cfg.wave * Math.sin(phase.current[i] + travel * cfg.waveFreq) * travel;
      pos[i * 3 + 2] = x * sa + z * ca;
    }
    attr.needsUpdate = true;
    (p.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - e / cfg.life);
  });

  return (
    <group>
      <sprite ref={core}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <points ref={points} geometry={geo} visible={false}>
        <pointsMaterial
          map={glow}
          size={cfg.size}
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/** 고리/격자에 맞춰 거리를 잡고, 마우스를 따라 살짝 시차 */
function CameraRig({ opened, reduced, mixRef }: { opened: boolean; reduced: boolean; mixRef: React.RefObject<number> }) {
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const { camera, size } = state;
    const aspect = size.width / size.height;
    const tanH = Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    const mix = smooth(clamp01(mixRef.current));

    // 고리: 정면 패널 + 양옆이 보이는 거리
    const ringNeed = Math.max((PANEL_H * 1.55) / (2 * tanH), (PANEL_W * 1.5) / (2 * tanH * aspect));
    const ringZ = RADIUS + (opened ? ringNeed * 0.55 : ringNeed);

    // 격자: 12장이 머리말·바닥 막대 사이에 다 들어오는 거리
    const [cols, rows] = gridShape(aspect);
    const gw = cols * PANEL_W + (cols - 1) * GAP;
    const gh = rows * PANEL_H + (rows - 1) * GAP;
    const gridZ = RADIUS + Math.max((gh * 1.45) / (2 * tanH), (gw * 1.08) / (2 * tanH * aspect));

    const sway = reduced ? 0 : 1 - mix * 0.7;
    const px = state.pointer.x * 0.7 * sway;
    const py = state.pointer.y * 0.35 * sway;
    const k = 1 - Math.exp(-dt * 3);
    camera.position.x += (px - camera.position.x) * k;
    camera.position.y += (THREE.MathUtils.lerp(0.75, 0, mix) + py - camera.position.y) * k;
    camera.position.z += (THREE.MathUtils.lerp(ringZ, gridZ, mix) - camera.position.z) * k;
    look.set(0, THREE.MathUtils.lerp(0, gh * 0.04, mix), THREE.MathUtils.lerp(RADIUS * 0.55, RADIUS, mix));
    camera.lookAt(look);
  });
  return null;
}

function Panels({
  year,
  theme,
  view,
  target,
  fonts,
  today,
  reduced,
  dragMovedRef,
  onPanelClick,
  mixRef,
}: {
  year: number;
  theme: YearTheme;
  view: View;
  target: number;
  fonts: SceneFonts;
  today: string;
  reduced: boolean;
  dragMovedRef: React.RefObject<boolean>;
  onPanelClick: (m: number) => void;
  mixRef: React.RefObject<number>;
}) {
  const curRef = useRef(target);
  const targetRef = useRef(target);
  const viewRef = useRef(view);
  useEffect(() => {
    targetRef.current = target;
    viewRef.current = view;
  }, [target, view]);

  const panels = useMemo(
    () => (fonts.ready ? Array.from({ length: 12 }, (_, m) => drawPanel(year, m, fonts, today, theme)) : []),
    [year, fonts, today, theme],
  );
  useEffect(() => () => panels.forEach((p) => p.tex.dispose()), [panels]);

  useFrame((_, dt) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 6);
    curRef.current += (targetRef.current - curRef.current) * k;
    const goal = viewRef.current === "grid" ? 1 : 0;
    const mk = reduced ? 1 : Math.min(1, dt * 1.6);
    mixRef.current += Math.sign(goal - mixRef.current) * Math.min(Math.abs(goal - mixRef.current), mk);
  });

  return (
    <group>
      {panels.map((p, m) => (
        <Panel
          key={`${year}-${m}`}
          index={m}
          tex={p.tex}
          stars={p.stars}
          theme={theme}
          curRef={curRef}
          mixRef={mixRef}
          dragMovedRef={dragMovedRef}
          onClick={onPanelClick}
          reduced={reduced}
        />
      ))}
    </group>
  );
}

export default function HolidayScene(props: Props) {
  const { onDrag, onRelease, theme } = props;
  const dragMovedRef = useRef(false);
  const mixRef = useRef(props.view === "grid" ? 1 : 0);

  // 드래그: 캔버스 클릭 이벤트를 막지 않도록 포인터 캡처 대신 window에서 추적
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (props.opened || props.view === "grid") return;
    const startX = e.clientX;
    let lastX = startX;
    const pxPerStep = Math.min(320, window.innerWidth * 0.28);
    dragMovedRef.current = false;
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientX - startX) > 6) dragMovedRef.current = true;
      onDrag(-(ev.clientX - lastX) / pxPerStep);
      lastX = ev.clientX;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onRelease();
      // 클릭 이벤트가 끝난 다음에 초기화
      setTimeout(() => (dragMovedRef.current = false), 0);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div onPointerDown={onPointerDown} style={{ position: "absolute", inset: 0, touchAction: "pan-y" }}>
      <Canvas dpr={[1, 2]} camera={{ fov: 40, position: [0, 0.75, 14] }} gl={{ antialias: true }}>
        <color attach="background" args={[theme.bg]} />
        <fog attach="fog" args={[theme.bg, 10, 30]} />
        <Stars radius={60} depth={40} count={3500} factor={3.2} saturation={0} fade speed={props.reduced ? 0 : 0.6} />
        <Sparkles
          key={theme.warm}
          count={80}
          scale={[18, 8, 18]}
          size={2.6}
          speed={props.reduced ? 0 : 0.25}
          color={theme.warm}
          opacity={0.6}
        />
        <Glyph theme={theme} fonts={props.fonts} reduced={props.reduced} />
        <Supernova theme={theme} burstKey={props.burstKey} reduced={props.reduced} />
        <Panels
          year={props.year}
          theme={theme}
          view={props.view}
          target={props.target}
          fonts={props.fonts}
          today={props.today}
          reduced={props.reduced}
          dragMovedRef={dragMovedRef}
          onPanelClick={props.onPanelClick}
          mixRef={mixRef}
        />
        <CameraRig opened={props.opened} reduced={props.reduced} mixRef={mixRef} />
      </Canvas>
    </div>
  );
}
