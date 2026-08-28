"use client";

import { useEffect, useRef, useState } from "react";
import { BackButton } from "../../components/BackButton";

/** 페이지 전체에 깔리는 이미지 */
const BACKDROP_SRC = "/mouse/background.jpg";
/** 커서 대신 따라다니는 이미지 */
const CURSOR_SRC = "/mouse/cursor.png";

/** 커서 이미지 높이 (px) */
const CURSOR_HEIGHT = 120;

export default function MousePage() {
  const cursorRef = useRef<HTMLImageElement>(null);
  const [backdropMissing, setBackdropMissing] = useState(false);
  // 커서 이미지가 없는데 기본 커서까지 감추면 커서가 통째로 사라진다
  const [cursorMissing, setCursorMissing] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const handleMove = (event: PointerEvent) => {
      const { clientX, clientY } = event;
      cursor.style.opacity = "1";
      cursor.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
    };

    const handleLeave = () => {
      cursor.style.opacity = "0";
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerleave", handleLeave);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <main className={`mouse-page ${cursorMissing ? "native-cursor" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="mouse-backdrop"
        src={BACKDROP_SRC}
        alt=""
        draggable={false}
        onError={() => setBackdropMissing(true)}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="mouse-cursor"
        src={CURSOR_SRC}
        alt=""
        draggable={false}
        ref={cursorRef}
        onError={() => setCursorMissing(true)}
      />

      <div className="mouse-back">
        <BackButton />
      </div>

      {(backdropMissing || cursorMissing) && (
        <p className="mouse-missing">
          {[backdropMissing && BACKDROP_SRC, cursorMissing && CURSOR_SRC]
            .filter(Boolean)
            .join(", ")}{" "}
          파일이 없습니다. public/mouse/ 에 넣어주세요.
        </p>
      )}

      <style jsx>{`
        .mouse-page {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #000000;
        }

        /* 이 페이지 안에서만 기본 커서를 감춘다 (커서 이미지가 있을 때만) */
        .mouse-page:not(.native-cursor),
        .mouse-page:not(.native-cursor) :global(*) {
          cursor: none !important;
        }

        .mouse-backdrop {
          width: 100%;
          height: 100%;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
        }

        .mouse-cursor {
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

        .mouse-back {
          position: fixed;
          top: 32px;
          left: 32px;
          z-index: 10001;
        }

        .mouse-back :global(.unified-back-button),
        .mouse-back :global(.unified-back-button svg),
        .mouse-back :global(.unified-back-button svg path) {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        .mouse-missing {
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
