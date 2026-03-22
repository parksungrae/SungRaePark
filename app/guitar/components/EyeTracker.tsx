'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

interface EyeTrackerProps {
  active: boolean;
  onNextLine: () => void;
  onPrevLine: () => void;
  onGestureChange?: (isActive: boolean, progress: number, direction: 'left' | 'right' | null) => void;
}

function getCenter(points: faceapi.Point[]) {
  const x = points.reduce((s, p) => s + p.x, 0) / points.length;
  const y = points.reduce((s, p) => s + p.y, 0) / points.length;
  return { x, y };
}

const CALIB_FRAMES = 40;
const TURN_THRESHOLD = 0.10; // 기준에서 이 이상 코가 치우치면 감지
const HOLD_MS = 200;
const COOLDOWN_MS = 1500;

export default function EyeTracker({ active, onNextLine, onPrevLine, onGestureChange }: EyeTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [calibState, setCalibState] = useState<'idle' | 'calibrating' | 'done'>('idle');
  const [calibProgress, setCalibProgress] = useState(0);
  const [debug, setDebug] = useState<{ offset: number; baseline: number; dir: string } | null>(null);

  const isMountedRef = useRef(false);
  const modelsLoadedRef = useRef(false);
  const calibSamplesRef = useRef<number[]>([]);
  const baselineRef = useRef<number | null>(null);
  const gestureSinceRef = useRef<number | null>(null);
  const currentDirRef = useRef<'left' | 'right' | null>(null);
  const cooldownUntilRef = useRef<number>(0);

  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) return;
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      ]);
      modelsLoadedRef.current = true;
    } catch (err) {
      console.error('face-api.js model load error:', err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let animRef: number;
    let videoStream: MediaStream | null = null;

    calibSamplesRef.current = [];
    baselineRef.current = null;
    gestureSinceRef.current = null;
    currentDirRef.current = null;
    cooldownUntilRef.current = 0;

    if (isMountedRef.current) {
      setCalibState('idle');
      setCalibProgress(0);
      setDebug(null);
    }

    const startTracking = async () => {
      if (!active) return;
      await loadModels();
      if (!modelsLoadedRef.current || !isMountedRef.current) return;
      if (isMountedRef.current) setIsLoaded(true);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        });
        if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        videoStream = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          video.play().catch(() => {});

          const detect = async () => {
            if (!isMountedRef.current || !videoRef.current) return;

            const result = await faceapi
              .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks();

            if (result) {
              setIsFaceDetected(true);
              const lm = result.landmarks;

              const leftEyeCenter  = getCenter(lm.getLeftEye());
              const rightEyeCenter = getCenter(lm.getRightEye());
              const noseTip = lm.getNose()[3]; // 코 끝

              const eyeMidX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
              const eyeDist = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
              // 코가 눈 중심에서 얼마나 치우쳤는지 (눈 간격 대비 비율)
              const noseOffset = eyeDist > 0 ? (noseTip.x - eyeMidX) / eyeDist : 0;

              // 캘리브레이션
              if (baselineRef.current === null) {
                if (calibSamplesRef.current.length === 0) setCalibState('calibrating');
                calibSamplesRef.current.push(noseOffset);
                setCalibProgress(Math.min(1, calibSamplesRef.current.length / CALIB_FRAMES));

                if (calibSamplesRef.current.length >= CALIB_FRAMES) {
                  baselineRef.current = calibSamplesRef.current.reduce((s, v) => s + v, 0) / CALIB_FRAMES;
                  setCalibState('done');
                }
                animRef = requestAnimationFrame(detect);
                return;
              }

              const baseline = baselineRef.current;
              const delta = noseOffset - baseline;

              // delta > 0: 코가 오른쪽으로 치우침 → 머리를 오른쪽으로 돌림
              // delta < 0: 코가 왼쪽으로 치우침  → 머리를 왼쪽으로 돌림
              // (CSS 미러 때문에 화면상 반대로 보이지만 감지는 raw 좌표 기준)
              let detectedDir: 'left' | 'right' | null = null;
              if (delta > TURN_THRESHOLD) detectedDir = 'right';
              else if (delta < -TURN_THRESHOLD) detectedDir = 'left';

              setDebug({
                offset: Math.round(noseOffset * 1000) / 1000,
                baseline: Math.round(baseline * 1000) / 1000,
                dir: detectedDir ?? '—',
              });

              const now = Date.now();
              const inCooldown = now < cooldownUntilRef.current;

              if (detectedDir && !inCooldown) {
                if (detectedDir !== currentDirRef.current) {
                  // 방향이 바뀌면 타이머 리셋
                  gestureSinceRef.current = now;
                  currentDirRef.current = detectedDir;
                }

                const elapsed = now - (gestureSinceRef.current ?? now);
                const progress = Math.min(1, elapsed / HOLD_MS);
                onGestureChange?.(true, progress, detectedDir);

                if (elapsed >= HOLD_MS) {
                  if (detectedDir === 'right') onNextLine();
                  else onPrevLine();
                  cooldownUntilRef.current = now + COOLDOWN_MS;
                  gestureSinceRef.current = null;
                  currentDirRef.current = null;
                  onGestureChange?.(false, 0, null);
                }
              } else {
                gestureSinceRef.current = null;
                currentDirRef.current = null;
                onGestureChange?.(false, 0, null);
              }
            } else {
              setIsFaceDetected(false);
              setDebug(null);
              onGestureChange?.(false, 0, null);
            }

            animRef = requestAnimationFrame(() => {
              setTimeout(detect, 80);
            });
          };

          animRef = requestAnimationFrame(detect);
        };
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    if (active) {
      startTracking();
    } else {
      Promise.resolve().then(() => {
        if (isMountedRef.current) setIsFaceDetected(false);
      });
    }

    return () => {
      isMountedRef.current = false;
      if (animRef) cancelAnimationFrame(animRef);
      if (videoStream) videoStream.getTracks().forEach(t => t.stop());
    };
  }, [active, onNextLine, onPrevLine, loadModels]);

  if (!active) return null;

  return (
    <div className="flex flex-col gap-1 items-end">
      <div className="w-[100px] h-[75px] rounded-xl overflow-hidden bg-black relative border border-white/10 shadow-2xl">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />

        {!isLoaded && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[8px] font-black uppercase text-blue-400">
            Init AI...
          </div>
        )}
        {calibState === 'calibrating' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1">
            <span className="text-[7px] font-black uppercase text-yellow-400">정면 보세요</span>
            <div className="w-14 h-[3px] bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 transition-all duration-75" style={{ width: `${calibProgress * 100}%` }} />
            </div>
          </div>
        )}
        {isLoaded && calibState !== 'calibrating' && (
          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isFaceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
        )}
        {calibState === 'done' && (
          <div className="absolute bottom-1 left-1 text-[6px] font-black text-green-400/70 uppercase">calibrated</div>
        )}
      </div>

      {debug && calibState === 'done' && (
        <div className="text-[9px] font-mono bg-black/80 border border-white/10 rounded-lg px-2 py-1 leading-tight">
          <div className={debug.dir !== '—' ? 'text-yellow-400 font-black' : 'text-white/40'}>
            {debug.dir !== '—' ? `▶ ${debug.dir}` : 'center'}
          </div>
          <div className="text-white/50">
            Δ <span className={Math.abs(debug.offset - debug.baseline) > TURN_THRESHOLD ? 'text-yellow-400' : 'text-white/50'}>
              {(debug.offset - debug.baseline).toFixed(3)}
            </span>
          </div>
          <div className="text-white/30">base {debug.baseline.toFixed(3)}</div>
        </div>
      )}
    </div>
  );
}
