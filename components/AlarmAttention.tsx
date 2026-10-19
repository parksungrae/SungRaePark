"use client";

import { useEffect } from "react";

/**
 * /alarm 푸시가 도착했을 때 열려 있는 탭에서 눈에 띄게 만든다.
 * - 탭 제목이 "🔔 (n) 제목"과 원래 제목으로 번갈아 바뀐다
 * - 파비콘에 빨간 원과 숫자를 그린다
 * 탭을 다시 보면(포커스) 원래대로 돌리고, 앱 배지(작업표시줄 숫자)도 지운다.
 */

const FLASH_MS = 1000;

function drawBadgeFavicon(count: number): Promise<string> {
  return new Promise((resolve) => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    function drawBadge() {
      const r = 22;
      ctx.fillStyle = "#ff3b30";
      ctx.beginPath();
      ctx.arc(size - r, r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(count > 9 ? "9+" : String(count), size - r, r + 2);
      resolve(canvas.toDataURL("image/png"));
    }

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      drawBadge();
    };
    img.onerror = drawBadge;
    img.src = "/favicon.ico";
  });
}

function iconLinks() {
  return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
}

export function AlarmAttention() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let count = 0;
    let originalTitle = "";
    let flashTitle = "";
    let timer: ReturnType<typeof setInterval> | null = null;
    const originalIcons = new Map<HTMLLinkElement, string>();

    function isWatching() {
      return document.visibilityState === "visible" && document.hasFocus();
    }

    async function start(title: string) {
      count++;
      if (!timer) originalTitle = document.title;
      flashTitle = `🔔 (${count}) ${title}`;

      const badge = await drawBadgeFavicon(count);
      for (const link of iconLinks()) {
        if (!originalIcons.has(link)) originalIcons.set(link, link.href);
        link.href = badge;
      }

      if (timer) return;
      let on = false;
      timer = setInterval(() => {
        on = !on;
        document.title = on ? flashTitle : originalTitle;
      }, FLASH_MS);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        // 깜빡이는 동안 다른 페이지로 이동했다면 새 제목을 덮어쓰지 않는다
        if (document.title === flashTitle || document.title === originalTitle) document.title = originalTitle;
      }
      for (const [link, href] of originalIcons) link.href = href;
      originalIcons.clear();
      count = 0;
    }

    function clearAll() {
      stop();
      navigator.clearAppBadge?.().catch(() => {});
      navigator.serviceWorker.ready.then((reg) => reg.active?.postMessage({ type: "clear-badge" }));
    }

    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== "alarm") return;
      // 지금 보고 있는 탭이면 OS 알림만으로 충분하다
      if (isWatching()) {
        clearAll();
        return;
      }
      start(event.data.title ?? "알림");
    }

    function handleFocus() {
      if (isWatching()) clearAll();
    }

    // 앱(또는 사이트)을 열면 배지를 지운다
    if (isWatching()) clearAll();

    navigator.serviceWorker.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      stop();
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  return null;
}
