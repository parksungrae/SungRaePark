'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
// @ts-expect-error - mediapipe types are often not resolved correctly by TypeScript in some configurations
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface Category {
  categoryName: string;
  score: number;
}

interface EyeTrackerProps {
  active: boolean;
  onNextLine: () => void;
}

export default function EyeTracker({ active, onNextLine }: EyeTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [blinkStrength, setBlinkStrength] = useState(0);
  const blinkTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(false);

  const initTracker = useCallback(async () => {
    if (faceLandmarkerRef.current) return;
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      faceLandmarkerRef.current = faceLandmarker;
      if (isMountedRef.current) setIsLoaded(true);
      console.log("MediaPipe FaceLandmarker loaded successfully");
    } catch (err) {
      console.error("Failed to init FaceLandmarker:", err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    let requestRef: number;
    let videoStream: MediaStream | null = null;

    const startTracking = async () => {
      if (!active) return;

      // 1. Initialize Tracker
      if (!faceLandmarkerRef.current) {
        await initTracker();
        if (!faceLandmarkerRef.current) return;
      } 
      if (!isMountedRef.current || !videoRef.current) return;

      // 2. Setup Loop
      const predict = () => {
        if (!isMountedRef.current || !videoRef.current || !faceLandmarkerRef.current || !active) return;
        
        if (videoRef.current.readyState >= 2) {
          try {
            const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
            
            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
              setIsFaceDetected(true);
              const shapes = results.faceBlendshapes[0].categories;
              const eyeLeft = shapes.find((s: Category) => s.categoryName === 'eyeBlinkLeft')?.score || 0;
              const eyeRight = shapes.find((s: Category) => s.categoryName === 'eyeBlinkRight')?.score || 0;
              
              const maxBlink = Math.max(eyeLeft, eyeRight);
              setBlinkStrength(maxBlink);

              // Detect blink for page turning (> 0.6 score for 1s)
              if ((eyeLeft > 0.4 && eyeRight < 0.25) || (eyeRight > 0.4 && eyeLeft < 0.25)) {
                if (!blinkTimerRef.current) {
                  blinkTimerRef.current = Date.now();
                } else if (Date.now() - blinkTimerRef.current > 600) {
                  onNextLine();
                  blinkTimerRef.current = Date.now() + 1500; // Cool down
                }
              } else {
                blinkTimerRef.current = null;
              }
            } else {
              setIsFaceDetected(false);
              setBlinkStrength(0);
            }
          } catch (e) {
            // Frame skip
          }
        }
        requestRef = requestAnimationFrame(predict);
      };

      // 3. Setup Camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480, frameRate: { ideal: 30 } } 
        });
        if (!isMountedRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        videoStream = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
            requestRef = requestAnimationFrame(predict);
          }
        };
      } catch (err) {
        console.error("Camera access error:", err);
      }
    };

    if (active) {
      startTracking();
    } else {
      // Defer state updates to avoid "setState synchronously within an effect" warning
      Promise.resolve().then(() => {
        if (isMountedRef.current) {
          setIsFaceDetected(false);
          setBlinkStrength(0);
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      if (requestRef) cancelAnimationFrame(requestRef);
      if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [active, onNextLine, initTracker]);

  if (!active) return null;

  return (
    <div className="w-[100px] h-[75px] rounded-xl overflow-hidden bg-black relative border border-white/10 shadow-2xl">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
      {!isLoaded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[8px] font-black uppercase text-blue-400">
          Init AI...
        </div>
      )}

      {isLoaded && (
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-colors ${isFaceDetected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
      )}

      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5">
        <div className="h-full bg-blue-500 transition-all duration-75" style={{ width: `${blinkStrength * 100}%` }}></div>
      </div>
    </div>
  );
}
