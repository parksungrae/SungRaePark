"use client";

import { useEffect, useRef, useState } from "react";
import { BackButton } from "../../components/BackButton";

/** 페이지 전체에 깔리는 이미지 */
const BACKDROP_SRC = "/cemeterypark/background.jpg";
/** 커서 대신 따라다니는 이미지 */
const CURSOR_SRC = "/cemeterypark/cursor.png";
/** 상단 타이틀 이미지 */
const TITLE_SRC = "/cemeterypark/title.png";

/** 마우스가 멈춘 뒤 확대가 시작되기까지의 시간 (ms) */
const IDLE_DELAY = 700;
/** 초당 확대 배율 */
const ZOOM_PER_SECOND = 1.7;
/** 이미지가 완전히 뭉개지기 전까지의 상한 배율 */
const MAX_SCALE = 300;
/** 트랙패드 미세 떨림을 움직임으로 치지 않기 위한 여유 (px) */
const MOVE_THRESHOLD = 2;
/** 커서 이미지 높이 (px) */
const CURSOR_HEIGHT = 72;

export default function CemeteryParkPage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLImageElement>(null);
  const [backdropMissing, setBackdropMissing] = useState(false);
  // 커서 이미지가 없는데 기본 커서까지 감추면 커서가 통째로 사라진다
  const [cursorMissing, setCursorMissing] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const cursor = cursorRef.current;
    if (!stage || !cursor) return;

    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    let rafId: number | undefined;
    let scale = 1;
    let lastFrame = 0;
    let lastX = Number.NaN;
    let lastY = Number.NaN;

    /** 확대를 멈추고 전체 화면 상태로 되돌린다 */
    const resetZoom = () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId);
        rafId = undefined;
      }
      scale = 1;
      stage.style.transform = "scale(1)";
    };

    const step = (now: number) => {
      // 탭 전환 등으로 프레임이 길게 끊겼을 때 한 번에 튀는 것을 막는다
      const delta = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      scale = Math.min(scale * ZOOM_PER_SECOND ** delta, MAX_SCALE);
      stage.style.transform = `scale(${scale})`;
      rafId = requestAnimationFrame(step);
    };

    const scheduleZoom = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        lastFrame = performance.now();
        rafId = requestAnimationFrame(step);
      }, IDLE_DELAY);
    };

    /** 타이틀 영역 위에서는 확대가 걸리지 않는다 */
    const isOverTitle = (x: number, y: number) => {
      const title = titleRef.current;
      if (!title) return false;
      const rect = title.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const handleMove = (event: PointerEvent) => {
      const { clientX, clientY } = event;

      cursor.style.opacity = "1";
      cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;

      if (isOverTitle(clientX, clientY)) {
        // 멈춰 있어도 확대가 시작되지 않도록 예약까지 취소한다
        clearTimeout(idleTimer);
        resetZoom();
        lastX = clientX;
        lastY = clientY;
        return;
      }

      if (
        Math.abs(clientX - lastX) < MOVE_THRESHOLD &&
        Math.abs(clientY - lastY) < MOVE_THRESHOLD
      ) {
        return;
      }
      lastX = clientX;
      lastY = clientY;

      resetZoom();
      // stage 는 뷰포트와 정확히 같은 크기라 커서 좌표를 그대로 비율로 쓸 수 있다
      stage.style.transformOrigin = `${(clientX / window.innerWidth) * 100}% ${
        (clientY / window.innerHeight) * 100
      }%`;
      scheduleZoom();
    };

    const handleLeave = () => {
      cursor.style.opacity = "0";
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerleave", handleLeave);

    // 아직 마우스를 움직이지 않았어도 화면 중앙 기준으로 확대가 시작된다
    scheduleZoom();

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
      clearTimeout(idleTimer);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className={`cemetery-page ${cursorMissing ? "native-cursor" : ""}`}>
      <div className="cemetery-stage" ref={stageRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="cemetery-backdrop"
          src={BACKDROP_SRC}
          alt=""
          draggable={false}
          onError={() => setBackdropMissing(true)}
        />
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="cemetery-title"
        src={TITLE_SRC}
        alt="Cemetery Park"
        draggable={false}
        ref={titleRef}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="cemetery-cursor"
        src={CURSOR_SRC}
        alt=""
        draggable={false}
        ref={cursorRef}
        onError={() => setCursorMissing(true)}
      />

      <div className="cemetery-back">
        <BackButton />
      </div>

      {(backdropMissing || cursorMissing) && (
        <p className="cemetery-missing">
          {[backdropMissing && BACKDROP_SRC, cursorMissing && CURSOR_SRC]
            .filter(Boolean)
            .join(", ")}{" "}
          파일이 없습니다. public/cemeterypark/ 에 넣어주세요.
        </p>
      )}

      <style jsx>{`
        .cemetery-page {
          position: fixed;
          inset: 0;
          overflow: hidden;
          /* 이미지 여백이 순백이라 배경도 맞춰야 경계가 안 보인다 */
          background: #ffffff;
        }

        /* 이 페이지 안에서만 기본 커서를 감춘다 (커서 이미지가 있을 때만) */
        .cemetery-page:not(.native-cursor),
        .cemetery-page:not(.native-cursor) :global(*) {
          cursor: none !important;
        }

        .cemetery-stage {
          position: fixed;
          inset: 0;
          transform: scale(1);
          transform-origin: 50% 50%;
          will-change: transform;
        }

        .cemetery-backdrop {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .cemetery-title {
          position: fixed;
          top: 48px;
          left: 50%;
          transform: translateX(-50%);
          /* 원본 여백을 잘라낸 만큼(2492 -> 1354) 줄여서 글자 크기는 그대로 유지한다 */
          width: min(337px, 38vw);
          height: auto;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          z-index: 9999;
        }

        .cemetery-cursor {
          position: fixed;
          top: 0;
          left: 0;
          height: ${CURSOR_HEIGHT}px;
          width: auto;
          opacity: 0;
          pointer-events: none;
          user-select: none;
          -webkit-user-drag: none;
          z-index: 10000;
        }

        .cemetery-back {
          position: fixed;
          top: 32px;
          left: 32px;
          z-index: 10001;
        }

        /* 이 페이지는 테마와 무관하게 밝은 바탕이라 뒤로가기를 항상 어둡게 고정한다 */
        .cemetery-back :global(.unified-back-button),
        .cemetery-back :global(.unified-back-button svg),
        .cemetery-back :global(.unified-back-button svg path) {
          color: #111111 !important;
          stroke: #111111 !important;
        }

        .cemetery-missing {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          margin: 0;
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.75);
          color: #ffffff;
          font-size: 13px;
          letter-spacing: -0.02em;
          z-index: 10001;
        }
      `}</style>
    </main>
  );
}
