"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, Image as ThreeImage } from "@react-three/drei";
import * as THREE from "three";
import Script from "next/script";
import { BackButton } from "../../components/BackButton";

interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

interface Handedness {
  index: number;
  score: number;
  label: "Left" | "Right";
}

interface HandsResults {
  image?: CanvasImageSource;
  multiHandLandmarks: NormalizedLandmark[][];
  multiHandedness: Handedness[];
}

declare global {
  interface Window {
    Hands?: new (config: { locateFile: (file: string) => string }) => {
      setOptions: (options: Record<string, unknown>) => void;
      onResults: (callback: (results: HandsResults) => void) => void;
      send: (inputs: { image: HTMLVideoElement }) => Promise<void>;
      close: () => Promise<void>;
    };
    drawConnectors?: (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmark[],
      connections: [number, number][],
      style: Record<string, unknown>,
    ) => void;
    drawLandmarks?: (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmark[],
      style: Record<string, unknown>,
    ) => void;
  }
}

// MediaPipe HAND_CONNECTIONS constant (fallback)
const HAND_CONNECTIONS_CONST: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
  [5, 9],
  [9, 13],
  [13, 17],
];

// --- Types ---
interface PhotoData {
  id: number;
  url: string;
  position: THREE.Vector3;
  normalizedPos: THREE.Vector3; // Pre-calculated for performance
}

// --- Components ---

function Photo({
  data,
  onClick,
  isSelected,
}: {
  data: PhotoData;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <group position={data.position}>
      <ThreeImage
        url={data.url}
        scale={isSelected ? [5.0, 5.0] : [1.8, 1.8]}
        onClick={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          onClick();
        }}
        transparent
        opacity={1}
      />
    </group>
  );
}

function Globe({
  photos,
  onPhotoClick,
  selectedId,
  globeRotation,
  freezeUntilRef,
}: {
  photos: PhotoData[];
  onPhotoClick: (id: number) => void;
  selectedId: number | null;
  globeRotation: THREE.Euler;
  freezeUntilRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const now = Date.now();
    const isFrozen = now < freezeUntilRef.current;

    if (!groupRef.current || isFrozen) return;

    // Smooth interpolation toward target rotation from dragging
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      globeRotation.x,
      0.1,
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      globeRotation.y,
      0.1,
    );

    // Billboarding: make all photos face the camera upright
    const q = new THREE.Quaternion();
    groupRef.current.getWorldQuaternion(q);
    q.invert();
    // Multiply by camera quaternion to billboard while inside the rotating group
    q.multiply(state.camera.quaternion);

    groupRef.current.children.forEach((child) => {
      child.quaternion.copy(q);
    });
  });

  return (
    <group ref={groupRef}>
      {photos.map((photo) => (
        <Photo
          key={photo.id}
          data={photo}
          onClick={() => onPhotoClick(photo.id)}
          isSelected={photo.id === selectedId}
        />
      ))}
    </group>
  );
}

export default function PhotoworldPage() {
  const [photos] = useState<PhotoData[]>(() => {
    const filenames = [
      "0190EF63-316D-45A9-91CD-ABCEC29B3BB1.JPG",
      "43C67D61-DC82-440F-848C-342EAC3991EF.jpg",
      "73155A02-84E3-4939-88DE-982AC759E7ED.JPG",
      "DSC03152.JPG",
      "DSC03209.JPG",
      "DSC03471.JPG",
      "DSC03476.JPG",
      "DSC03511.JPG",
      "DSC03542.JPG",
      "DSC03709.JPG",
      "DSCF0996.JPG",
      "DSCF1142.JPG",
      "DSCF1298.JPG",
      "DSCF1301.JPG",
      "DSCF1322.JPG",
      "DSCF1329.JPG",
      "DSCF1339.JPG",
      "ECD726F0-6BCF-4EAB-AD14-90A58A4404CC.JPG",
      "IMG_1074.jpeg",
      "IMG_3696.jpeg",
      "IMG_5202.jpeg",
      "IMG_7958.jpeg",
      "IMG_8797.JPG",
      "IMG_8798.JPG",
      "IMG_8803.JPG",
      "IMG_8807.JPG",
      "IMG_9103.jpeg",
      "IMG_9111.jpeg",
      "IMG_9214.jpeg",
    ];

    const newPhotos: PhotoData[] = [];
    const totalFilenames = Array(30).fill(filenames).flat();
    const totalPhotos = 300; // Drastically reduced for maximum smoothness
    const radius = 28;

    // Fibonacci Sphere algorithm for perfectly uniform distribution
    for (let i = 0; i < totalPhotos; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / totalPhotos);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      // Add random depth variation for a volumetric 3D look
      const randomRadius = radius + (Math.random() - 0.5) * 12;

      const x = randomRadius * Math.sin(phi) * Math.cos(theta);
      const y = randomRadius * Math.cos(phi);
      const z = randomRadius * Math.sin(phi) * Math.sin(theta);

      const pos = new THREE.Vector3(x, y, z);
      newPhotos.push({
        id: i,
        url: `/images/${totalFilenames[i % totalFilenames.length]}`,
        position: pos,
        normalizedPos: pos.clone().normalize(),
      });
    }
    return newPhotos;
  });

  // Navigation & Control state
  const [globeRotation, setGlobeRotation] = useState(new THREE.Euler(0, 0, 0));
  const globeRotationRef = useRef(new THREE.Euler(0, 0, 0));

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(0);
  const [debugInfo, setDebugInfo] = useState({
    handsLib: "no",
    cameraStatus: "Initializing",
    frames: 0,
    gesture: "None",
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Controls state
  const [zoom, setZoom] = useState(60);

  // No longer snapping solely to focused photo for rotation

  // Refs for Three.js objects
  const sceneRef = useRef<THREE.Scene>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const selectedIdRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef(0);
  const freezeUntilRef = useRef(0);

  const handleDoubleClick = (id: number) => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      // Double click detected - toggle
      if (selectedIdRef.current === id) {
        setSelectedId(null);
        selectedIdRef.current = null;
      } else {
        setSelectedId(id);
        selectedIdRef.current = id;
      }
    }
    lastClickTimeRef.current = now;
  };

  // MediaPipe Setup
  useEffect(() => {
    const videoElem = videoRef.current;

    // Use requestAnimationFrame to avoid synchronous setState warning
    requestAnimationFrame(() => {
      setDebugInfo((prev) => ({
        ...prev,
        handsLib: window.Hands ? "yes" : "no",
        drawLib: window.drawConnectors ? "yes" : "no",
      }));
    });

    if (
      !videoElem ||
      !canvasRef.current ||
      !window.Hands ||
      !window.drawConnectors
    ) {
      return;
    }

    const hands = new window.Hands!({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
      selfieMode: true,
    });

    let lastY_L = 0;
    let lastX_R = 0;
    let lastY_R = 0;
    let tapCooldown = false;
    let active = true;

    // MediaPipe Hand Detection Loop

    hands.onResults((results: HandsResults) => {
      if (!active || !canvasRef.current) return;

      setDebugInfo((prev) => ({ ...prev, frames: prev.frames + 1 }));

      const canvasCtx = canvasRef.current.getContext("2d")!;
      const { width, height } = canvasRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);

      if (results.image) {
        canvasCtx.drawImage(results.image, 0, 0, width, height);
      } else if (videoRef.current && videoRef.current.readyState >= 2) {
        canvasCtx.drawImage(videoRef.current, 0, 0, width, height);
      }
      canvasCtx.restore();

      let zoomHand: NormalizedLandmark[] | null = null;
      let rotateHand: NormalizedLandmark[] | null = null;

      if (results.multiHandLandmarks && results.multiHandedness) {
        for (let idx = 0; idx < results.multiHandLandmarks.length; idx++) {
          const landmarks = results.multiHandLandmarks[idx];
          const handedness = results.multiHandedness[idx];
          if (!handedness) continue;

          const label = handedness.label;
          // SWAP: Left = Zoom/Details, Right = Rotate/Freeze
          if (label === "Left") zoomHand = landmarks;
          else if (label === "Right") rotateHand = landmarks;

          canvasCtx.save();
          window.drawConnectors!(canvasCtx, landmarks, HAND_CONNECTIONS_CONST, {
            color: label === "Left" ? "#ff0066" : "#00ff66", // Left(Zoom/Detail) = Pink, Right(Rotate/Freeze) = Green
            lineWidth: 4,
          });
          window.drawLandmarks!(canvasCtx, landmarks, {
            color: "#ffffff",
            lineWidth: 1,
            radius: 3,
          });
          canvasCtx.restore();
        }
      }

      // === ZOOM HAND (LEFT): ZOOM & DETAILS ===
      if (zoomHand && zoomHand.length >= 21) {
        const thumbTip = zoomHand[4];
        const indexTip = zoomHand[8];
        const dist = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2),
        );
        const isPinching = dist < 0.05;

        const isIndex = zoomHand.length > 8 && zoomHand[8].y < zoomHand[6].y;
        const isMiddle =
          zoomHand.length > 12 && zoomHand[12].y < zoomHand[10].y;
        const isRing = zoomHand.length > 16 && zoomHand[16].y < zoomHand[14].y;
        const isPinky = zoomHand.length > 20 && zoomHand[20].y < zoomHand[18].y;
        const extendedCount = [isIndex, isMiddle, isRing, isPinky].filter(
          Boolean,
        ).length;

        const isVSign = isIndex && isMiddle && !isRing && !isPinky;

        if (isVSign) {
          if (!tapCooldown && selectedIdRef.current === null) {
            setSelectedId(-2);
            selectedIdRef.current = -2;
            tapCooldown = true;
            setTimeout(() => (tapCooldown = false), 300);
          }
        } else if (isPinching) {
          const dy = indexTip.y - lastY_L;
          if (Math.abs(dy) > 0.002 && Math.abs(dy) < 0.1) {
            setZoom((prev) => Math.max(20, Math.min(120, prev + dy * 45)));
          }
        } else if (extendedCount <= 1 && !isVSign) {
          // Fist (Close): Only close if NOT pinching
          if (!tapCooldown && selectedIdRef.current !== null) {
            setSelectedId(null);
            selectedIdRef.current = null;
            tapCooldown = true;
            setTimeout(() => (tapCooldown = false), 300);
          }
        } else if (extendedCount === 4) {
          if (!tapCooldown && selectedIdRef.current === null) {
            const quat = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(
                globeRotationRef.current.x,
                globeRotationRef.current.y,
                0,
                "XYZ",
              ),
            );
            let bestId = 0;
            let minCenterDistSq = Infinity;
            for (let i = 0; i < photos.length; i++) {
              const worldPos = photos[i].position.clone().applyQuaternion(quat);
              if (worldPos.z > 0) {
                const centerDistSq =
                  worldPos.x * worldPos.x + worldPos.y * worldPos.y;
                if (centerDistSq < minCenterDistSq) {
                  minCenterDistSq = centerDistSq;
                  bestId = photos[i].id;
                }
              }
            }
            setSelectedId(bestId);
            selectedIdRef.current = bestId;
            tapCooldown = true;
            setTimeout(() => (tapCooldown = false), 300);
          }
        }
        lastY_L = indexTip.y;
      }

      // === ROTATE HAND (RIGHT): ROTATE & FREEZE ===
      if (rotateHand && rotateHand.length >= 21) {
        const thumbTip = rotateHand[4];
        const indexTip = rotateHand[8];
        const dist = Math.sqrt(
          Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2),
        );
        const isPinching = dist < 0.05;

        const isIndex =
          rotateHand.length > 8 && rotateHand[8].y < rotateHand[6].y;
        const isMiddle =
          rotateHand.length > 12 && rotateHand[12].y < rotateHand[10].y;
        const isRing =
          rotateHand.length > 16 && rotateHand[16].y < rotateHand[14].y;
        const isPinky =
          rotateHand.length > 20 && rotateHand[20].y < rotateHand[18].y;
        const extendedCount = [isIndex, isMiddle, isRing, isPinky].filter(
          Boolean,
        ).length;

        const isVSign = isIndex && isMiddle && !isRing && !isPinky;

        if (isVSign) {
          if (!tapCooldown && selectedIdRef.current === null) {
            setSelectedId(-2);
            selectedIdRef.current = -2;
            tapCooldown = true;
            setTimeout(() => (tapCooldown = false), 300);
          }
        } else if (isPinching) {
          const dx = indexTip.x - lastX_R;
          const dy = indexTip.y - lastY_R;
          if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
            const speed = 4;
            globeRotationRef.current.y += dx * speed;
            globeRotationRef.current.x += dy * speed;
            setGlobeRotation(
              new THREE.Euler(
                globeRotationRef.current.x,
                globeRotationRef.current.y,
                0,
              ),
            );
          }
        } else if (extendedCount === 4) {
          if (!tapCooldown) {
            freezeUntilRef.current = Date.now() + 1000;
            tapCooldown = true;
            setTimeout(() => (tapCooldown = false), 300);
            setDebugInfo((prev) => ({ ...prev, gesture: "Frozen!" }));
          }
        }
        lastX_R = indexTip.x;
        lastY_R = indexTip.y;
      }
    });

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
          },
        });

        if (videoElem) {
          videoElem.srcObject = stream;
          try {
            await videoElem.play();
            setDebugInfo((p) => ({ ...p, cameraStatus: "Active" }));
          } catch (e) {
            console.error("Video play failed:", e);
            setDebugInfo((p) => ({ ...p, cameraStatus: "Play Error" }));
          }

          if (canvasRef.current) {
            canvasRef.current.width = 640;
            canvasRef.current.height = 480;
          }

          let isProcessing = false;
          const process = async () => {
            if (!active) return;
            if (videoElem.readyState >= 2 && !isProcessing) {
              isProcessing = true;
              try {
                await hands.send({ image: videoElem });
              } catch (e) {
                console.error("Hands detection error:", e);
              }
              isProcessing = false;
            }
            requestAnimationFrame(process);
          };
          process();
        }
      } catch (err) {
        console.error("Camera access denied", err);
        setDebugInfo((p) => ({ ...p, cameraStatus: "Denied/Error" }));
      }
    };

    startCamera();

    return () => {
      active = false;
      hands.close();
      if (videoElem?.srcObject) {
        const tracks = (videoElem.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [photos, scriptsLoaded]); // Only restart if scripts reload; use Refs for state-dependent logic

  return (
    <div className="photoworld-container">
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded((prev) => prev + 1)}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded((prev) => prev + 1)}
      />

      <div className="debug-overlay">
        Lib: {debugInfo.handsLib} | Cam: {debugInfo.cameraStatus} | Frames:{" "}
        {debugInfo.frames} | Mode: {debugInfo.gesture}
      </div>

      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 10001 }}>
        <BackButton />
      </div>

      <div className="canvas-wrapper">
        <Canvas shadows flat>
          <PerspectiveCamera
            ref={cameraRef}
            makeDefault
            position={[0, 0, zoom]}
          />
          <scene ref={sceneRef}>
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Suspense fallback={null}>
              <Globe
                photos={photos}
                onPhotoClick={(id) => handleDoubleClick(id)}
                selectedId={selectedId}
                globeRotation={globeRotation}
                freezeUntilRef={freezeUntilRef}
              />
            </Suspense>
          </scene>
        </Canvas>
      </div>

      <div className="crosshair" />

      <div className="camera-overlay">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="hidden-video"
        />
        <canvas ref={canvasRef} className="gesture-canvas" />
      </div>

      {(debugInfo.cameraStatus === "Denied/Error" || debugInfo.cameraStatus === "Play Error") && (
        <div className="camera-error-screen">
          <div className="error-content">
            <span className="error-title">Error</span>
          </div>
        </div>
      )}

      {selectedId !== null && (
        <div
          className="modal-overlay"
          onDoubleClick={() => {
            setSelectedId(null);
            selectedIdRef.current = null;
          }}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={
                selectedId === -2
                  ? "/radiohead.jpg"
                  : photos.find((p) => p.id === selectedId)?.url
              }
              alt="Selection"
            />
            <div className="modal-info">
              {selectedId === -2
                ? "RadioHello"
                : `Photo #${selectedId + 1}`}
            </div>
            <button
              className="close-modal"
              onClick={() => {
                setSelectedId(null);
                selectedIdRef.current = null;
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .photoworld-container {
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at center, #111, #000);
          overflow: hidden;
          position: relative;
        }
        .debug-overlay {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: #0f0;
          padding: 5px 10px;
          font-family: monospace;
          font-size: 10px;
          border-radius: 4px;
          z-index: 1000;
          pointer-events: none;
        }
        .canvas-wrapper {
          width: 100%;
          height: 100%;
        }
        .crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 10;
        }
        .crosshair:after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .camera-overlay {
          position: absolute;
          bottom: 20px;
          left: 20px;
          width: 240px;
          height: 180px;
          background: #000;
          border-radius: 12px;
          overflow: hidden;
          border: 3px solid #00ff66;
          box-shadow: 0 0 20px rgba(0, 255, 102, 0.3);
          z-index: 1000;
        }
        .gesture-canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .hidden-video {
          position: absolute;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
        }
        .gesture-hint {
          position: absolute;
          bottom: -30px;
          left: 0;
          color: white;
          font-size: 10px;
          opacity: 0.4;
          width: 220px;
          text-align: left;
          font-family: var(--font-inter, sans-serif);
          letter-spacing: 0.05em;
        }
        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 200;
          backdrop-filter: blur(20px);
          animation: fadeIn 0.4s ease;
        }
        .modal-content {
          position: relative;
          max-width: 85%;
          max-height: 85%;
          background: #000;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 0 100px rgba(0, 0, 0, 1);
          animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-content img {
          display: block;
          max-width: 100%;
          max-height: 75vh;
          object-fit: contain;
        }
        .modal-info {
          padding: 20px 10px;
          color: white;
          font-size: 14px;
          opacity: 0.6;
          text-align: center;
        }
        .close-modal {
          position: absolute;
          top: -40px;
          right: -40px;
          background: none;
          border: none;
          color: white;
          font-size: 32px;
          cursor: pointer;
          opacity: 0.5;
        }
        .close-modal:hover {
          opacity: 1;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .camera-error-screen {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .error-title {
          color: #ff3333;
          font-size: 5rem;
          font-weight: bold;
          font-family: sans-serif;
          letter-spacing: 0.1em;
        }
        @keyframes zoomIn {
          from {
            transform: scale(0.9) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
