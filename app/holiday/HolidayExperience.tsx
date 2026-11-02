"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { BackButton } from "../../components/BackButton";
import { HOLIDAYS } from "./holidays";
import { MONTHS_EN, WEEK_KO, holidaysOf, keyOf, mod12, monthCells, nextHoliday, todayKey } from "./calendar";
import { themeOf } from "./themes";
import type { SceneFonts, View } from "./HolidayScene";

const HolidayScene = dynamic(() => import("./HolidayScene"), { ssr: false });

/** target에서 가장 가까운 쪽으로 month를 정면에 두는 값 */
function nearest(target: number, month: number) {
  const base = Math.round(target);
  let diff = mod12(month - base);
  if (diff > 6) diff -= 12;
  return base + diff;
}

const ARROW_DIR: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

/** 요일 칸 클래스: 일요일·토요일만 색을 다르게 */
function weekendClass(col: number) {
  if (col === 0) return "sun";
  if (col === 6) return "sat";
  return "";
}

const weekdayOf = (key: string) => WEEK_KO[new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8)).getDay()];

export default function HolidayExperience({
  displayFont,
  bodyFont,
  glyphFont,
}: {
  displayFont: string;
  bodyFont: string;
  glyphFont: string;
}) {
  const today = useMemo(() => todayKey(), []);
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const now = new Date();
  const thisYear = now.getFullYear();
  // 작년·올해·내년만 보여준다 (공휴일 데이터가 있는 해만)
  const [years] = useState(() => [thisYear - 1, thisYear, thisYear + 1].filter((y) => HOLIDAYS[y]));
  const [year, setYear] = useState(years.includes(thisYear) ? thisYear : years[0]);
  const [target, setTarget] = useState(year === thisYear ? now.getMonth() : 0);
  const [view, setView] = useState<View>("ring");
  const [opened, setOpened] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // 캔버스에 그릴 글꼴이 내려온 뒤에 패널을 그린다
  useEffect(() => {
    let alive = true;
    Promise.all([
      document.fonts.load(`800 100px ${displayFont}`),
      document.fonts.load(`700 30px ${bodyFont}`, "공휴일 설날"),
      document.fonts.load(`900 100px ${glyphFont}`, "甲辰乙巳丙午丁未辰巳午未"),
    ])
      .catch(() => undefined)
      .then(() => alive && setFontsReady(true));
    return () => {
      alive = false;
    };
  }, [displayFont, bodyFont, glyphFont]);

  const fonts: SceneFonts = useMemo(
    () => ({ display: displayFont, body: bodyFont, glyph: glyphFont, ready: fontsReady }),
    [displayFont, bodyFont, glyphFont, fontsReady],
  );

  const theme = themeOf(year);
  const focus = mod12(Math.round(target));
  const yearIdx = years.indexOf(year);
  const total = Object.keys(HOLIDAYS[year] ?? {}).length;
  const upcoming = useMemo(() => nextHoliday(today), [today]);

  function changeYear(y: number) {
    if (!years.includes(y) || y === year) return;
    setYear(y);
    setBurstKey((k) => k + 1);
  }

  /** 월 상세에서 앞뒤 달 이동. 12월→1월이면 연도도 넘긴다 */
  function stepMonth(diff: number) {
    const next = focus + diff;
    if (next > 11) {
      if (yearIdx >= years.length - 1) return;
      changeYear(years[yearIdx + 1]);
    } else if (next < 0) {
      if (yearIdx <= 0) return;
      changeYear(years[yearIdx - 1]);
    }
    setTarget((t) => Math.round(t) + diff);
  }

  function openMonth(m: number) {
    setTarget((t) => nearest(t, m));
    setOpened(true);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = ARROW_DIR[e.key] ?? 0;
      if (e.key === "Escape") setOpened(false);
      else if (dir && opened) stepMonth(dir);
      else if (dir && view === "ring") setTarget((t) => Math.round(t) + dir);
      else if (e.key === "g" || e.key === "G") setView((v) => (v === "ring" ? "grid" : "ring"));
      else if (e.key === "Enter" && !opened && (e.target as HTMLElement).tagName !== "BUTTON") setOpened(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function onPanelClick(m: number) {
    if (view === "grid" || m === focus) openMonth(m);
    else setTarget((t) => nearest(t, m));
  }

  const vars = {
    "--bg": theme.bg,
    "--core": theme.core,
    "--warm": theme.warm,
    "--hot": theme.hot,
    "--deep": theme.deep,
    "--cool": theme.cool,
    "--f-display": displayFont,
    "--f-glyph": glyphFont,
  } as CSSProperties;

  return (
    <div className="sn" style={vars}>
      <HolidayScene
        year={year}
        theme={theme}
        view={view}
        target={target}
        opened={opened}
        burstKey={burstKey}
        fonts={fonts}
        today={today}
        reduced={reduced}
        onDrag={(d) => setTarget((t) => t + d)}
        onRelease={() => setTarget((t) => Math.round(t))}
        onPanelClick={onPanelClick}
      />

      <div className="sn-back">
        <BackButton />
      </div>

      {/* 연도 + 띠 */}
      <header className="sn-head">
        <p className="sn-kicker">KOREA · PUBLIC HOLIDAYS</p>
        <div className="sn-year-row">
          <button className="sn-arrow" onClick={() => changeYear(years[yearIdx - 1])} disabled={yearIdx <= 0} aria-label="이전 연도">
            ‹
          </button>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h1
              key={year}
              className="sn-year"
              initial={reduced ? false : { opacity: 0, scale: 1.6, filter: "blur(12px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.6, filter: "blur(10px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              {year}
            </motion.h1>
          </AnimatePresence>
          <button
            className="sn-arrow"
            onClick={() => changeYear(years[yearIdx + 1])}
            disabled={yearIdx >= years.length - 1}
            aria-label="다음 연도"
          >
            ›
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={year}
            className="sn-zodiac"
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <span className="sn-hanja">{theme.hanja}</span>
            <span className="sn-title">
              {theme.ganji} · {theme.title}
            </span>
            <span className="sn-motto">
              {theme.motto} · 공휴일 <b>{total}</b>일
            </span>
          </motion.div>
        </AnimatePresence>
      </header>

      {/* 다음 공휴일 */}
      {upcoming && (
        <aside className="sn-next" aria-label="다음 공휴일">
          <span className="sn-next-label">NEXT HOLIDAY</span>
          <span className="sn-next-d">{upcoming.days === 0 ? "TODAY" : `D-${upcoming.days}`}</span>
          <span className="sn-next-name">{upcoming.name}</span>
          <span className="sn-next-date">
            {+upcoming.key.slice(5, 7)}.{+upcoming.key.slice(8)} ({weekdayOf(upcoming.key)})
          </span>
        </aside>
      )}

      {/* 보기 전환 + 월 선택 */}
      <nav className="sn-dock" aria-label="달력 보기">
        <div className="sn-toggle" role="group" aria-label="보기 방식">
          <button className={view === "ring" ? "on" : ""} onClick={() => setView("ring")} aria-pressed={view === "ring"}>
            ◎ 회전
          </button>
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} aria-pressed={view === "grid"}>
            ▦ 12달 한눈에
          </button>
        </div>
        <p className="sn-hint">
          {view === "ring"
            ? "드래그하거나 ← → 로 돌리고, 가운데 달력을 눌러 펼쳐요 · G 로 보기 전환"
            : "보고 싶은 달을 누르면 크게 펼쳐요 · G 로 보기 전환"}
        </p>
        {view === "ring" && (
          <div className="sn-months">
            {MONTHS_EN.map((name, m) => {
              const n = holidaysOf(year, m).length;
              return (
                <button
                  key={name}
                  className={`sn-month ${m === focus ? "on" : ""}`}
                  onClick={() => (m === focus ? setOpened(true) : setTarget((t) => nearest(t, m)))}
                  aria-label={`${m + 1}월, 공휴일 ${n}일`}
                  aria-current={m === focus}
                >
                  <span className="sn-month-num">{m + 1}</span>
                  <span className="sn-dots" aria-hidden="true">
                    {Array.from({ length: n }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* 월 상세 */}
      <AnimatePresence>
        {opened && (
          <motion.div
            className="sn-sheet-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpened(false)}
          >
            <motion.section
              key={`${year}-${focus}`}
              className="sn-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={`${year}년 ${focus + 1}월`}
              initial={reduced ? false : { opacity: 0, scale: 0.86, rotateX: 18, y: 30 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sn-sheet-glyph" aria-hidden="true">
                {theme.glyph}
              </span>
              <MonthSheet
                year={year}
                month={focus}
                today={today}
                reduced={reduced}
                hanja={theme.hanja}
                canPrev={focus > 0 || yearIdx > 0}
                canNext={focus < 11 || yearIdx < years.length - 1}
                onPrev={() => stepMonth(-1)}
                onNext={() => stepMonth(1)}
                onClose={() => setOpened(false)}
              />
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .sn {
          --ink: #f4ede1;
          --muted: rgba(244, 237, 225, 0.5);
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: var(--bg);
          color: var(--ink);
          font-family: ${bodyFont};
          transition: background 0.6s;
        }
        .sn-back {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 20;
        }
        /* 우주 배경은 항상 어두우니 라이트 테마에서도 뒤로가기는 흰색으로 */
        :global([data-theme="light"]) .sn-back {
          filter: invert(1);
        }

        .sn-head {
          position: absolute;
          top: clamp(12px, 2.5vh, 30px);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
          z-index: 5;
          width: max-content;
          max-width: calc(100% - 32px);
        }
        .sn-kicker {
          margin: 0;
          font-family: var(--f-display);
          font-weight: 600;
          font-size: 12px;
          letter-spacing: 0.45em;
          color: var(--muted);
        }
        .sn-year-row {
          display: flex;
          align-items: center;
          gap: clamp(8px, 2vw, 24px);
          pointer-events: auto;
        }
        :global(.sn-year) {
          margin: 0;
          min-width: 3.2ch;
          text-align: center;
          font-family: var(--f-display);
          font-weight: 900;
          font-size: clamp(52px, 9vh, 112px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: var(--core);
          text-shadow:
            0 0 18px color-mix(in srgb, var(--warm) 55%, transparent),
            0 0 60px color-mix(in srgb, var(--hot) 45%, transparent);
        }
        .sn-arrow {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(244, 237, 225, 0.25);
          background: rgba(10, 10, 14, 0.55);
          color: var(--ink);
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          backdrop-filter: blur(6px);
          transition: border-color 0.2s, box-shadow 0.2s, opacity 0.2s;
        }
        .sn-arrow:hover:not(:disabled) {
          border-color: var(--warm);
          box-shadow: 0 0 20px color-mix(in srgb, var(--warm) 40%, transparent);
        }
        .sn-arrow:disabled {
          opacity: 0.2;
          cursor: default;
        }
        :global(.sn-zodiac) {
          display: grid;
          grid-template-columns: auto auto;
          align-items: center;
          gap: 0 12px;
          margin-top: 8px;
        }
        .sn-hanja {
          grid-row: span 2;
          font-family: var(--f-glyph);
          font-weight: 900;
          font-size: 34px;
          line-height: 1;
          color: var(--warm);
          text-shadow: 0 0 16px color-mix(in srgb, var(--hot) 60%, transparent);
          padding-right: 12px;
          border-right: 1px solid color-mix(in srgb, var(--warm) 35%, transparent);
        }
        .sn-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }
        .sn-motto {
          font-size: 12px;
          color: var(--muted);
        }
        .sn-motto b {
          color: var(--warm);
        }

        .sn-next {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 5;
          display: grid;
          grid-template-columns: auto auto;
          align-items: baseline;
          gap: 2px 12px;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid color-mix(in srgb, var(--warm) 30%, transparent);
          background: rgba(10, 10, 14, 0.6);
          backdrop-filter: blur(8px);
        }
        .sn-next-label {
          grid-column: 1 / -1;
          font-family: var(--f-display);
          font-size: 11px;
          letter-spacing: 0.3em;
          color: var(--muted);
        }
        .sn-next-d {
          grid-row: span 2;
          font-family: var(--f-display);
          font-weight: 900;
          font-size: 40px;
          line-height: 1;
          color: var(--hot);
          text-shadow: 0 0 20px color-mix(in srgb, var(--hot) 50%, transparent);
        }
        .sn-next-name {
          font-weight: 700;
          font-size: 15px;
        }
        .sn-next-date {
          font-size: 13px;
          color: var(--muted);
        }

        .sn-dock {
          position: absolute;
          left: 50%;
          bottom: clamp(10px, 2.5vh, 24px);
          transform: translateX(-50%);
          z-index: 5;
          width: min(760px, calc(100% - 32px));
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .sn-toggle {
          display: flex;
          padding: 4px;
          border-radius: 999px;
          border: 1px solid rgba(244, 237, 225, 0.16);
          background: rgba(10, 10, 14, 0.6);
          backdrop-filter: blur(8px);
        }
        .sn-toggle button {
          padding: 7px 16px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--muted);
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.25s, color 0.25s, box-shadow 0.25s;
        }
        .sn-toggle button:hover {
          color: var(--ink);
        }
        .sn-toggle button.on {
          color: var(--deep);
          background: linear-gradient(160deg, var(--core), var(--warm) 55%, var(--hot));
          box-shadow: 0 0 18px color-mix(in srgb, var(--hot) 45%, transparent);
        }
        .sn-hint {
          margin: 0;
          font-size: 12px;
          color: var(--muted);
          text-align: center;
        }
        .sn-months {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 4px;
          padding: 6px;
          border-radius: 16px;
          border: 1px solid rgba(244, 237, 225, 0.14);
          background: rgba(10, 10, 14, 0.6);
          backdrop-filter: blur(8px);
        }
        .sn-month {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 8px 0 7px;
          border: 0;
          border-radius: 10px;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          font-family: var(--f-display);
          transition: background 0.2s, color 0.2s;
        }
        .sn-month:hover {
          color: var(--ink);
          background: rgba(244, 237, 225, 0.06);
        }
        .sn-month.on {
          color: var(--deep);
          background: linear-gradient(160deg, var(--core), var(--warm) 55%, var(--hot));
          box-shadow: 0 0 22px color-mix(in srgb, var(--hot) 50%, transparent);
        }
        .sn-month-num {
          font-weight: 800;
          font-size: 18px;
          line-height: 1;
        }
        .sn-dots {
          display: flex;
          gap: 2px;
          height: 4px;
        }
        .sn-dots i {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--hot);
          box-shadow: 0 0 6px var(--hot);
        }
        .sn-month.on .sn-dots i {
          background: var(--deep);
          box-shadow: none;
        }

        :global(.sn-sheet-wrap) {
          position: fixed;
          inset: 0;
          z-index: 30;
          display: grid;
          place-items: center;
          padding: 16px;
          background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--hot) 14%, transparent), rgba(5, 5, 8, 0.8) 60%);
          backdrop-filter: blur(6px);
          perspective: 1200px;
        }
        :global(.sn-sheet) {
          position: relative;
          overflow: hidden;
          width: min(980px, 100%);
          height: min(88dvh, 780px);
          display: flex;
          flex-direction: column;
          padding: clamp(14px, 3vw, 28px);
          border-radius: 24px;
          border: 1px solid color-mix(in srgb, var(--warm) 35%, transparent);
          background: linear-gradient(160deg, color-mix(in srgb, var(--hot) 10%, #141218), #09090d);
          box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.6),
            0 30px 120px color-mix(in srgb, var(--hot) 25%, transparent);
          color: var(--ink);
        }
        /* 테두리 안쪽 장식선 */
        :global(.sn-sheet)::before {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 18px;
          border: 1px solid color-mix(in srgb, var(--warm) 14%, transparent);
          pointer-events: none;
        }
        :global(.sn-sheet-glyph) {
          position: absolute;
          right: -4%;
          bottom: -12%;
          font-family: var(--f-glyph);
          font-weight: 900;
          font-size: min(70vh, 640px);
          line-height: 1;
          color: var(--warm);
          opacity: 0.06;
          pointer-events: none;
          user-select: none;
        }

        @media (max-width: 640px) {
          .sn-next {
            top: auto;
            right: 50%;
            transform: translateX(50%);
            bottom: calc(clamp(10px, 2.5vh, 24px) + 132px);
            grid-template-columns: auto auto auto;
            padding: 8px 14px;
          }
          .sn-next-label,
          .sn-hint,
          .sn-motto {
            display: none;
          }
          .sn-next-d {
            grid-row: auto;
            font-size: 22px;
          }
          .sn-month-num {
            font-size: 14px;
          }
          .sn-head {
            top: 64px;
          }
        }
      `}</style>
    </div>
  );
}

function MonthSheet({
  year,
  month,
  today,
  reduced,
  hanja,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onClose,
}: {
  year: number;
  month: number;
  today: string;
  reduced: boolean;
  hanja: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const holidays = HOLIDAYS[year] ?? {};
  const list = holidaysOf(year, month);

  return (
    <>
      <div className="ms-head">
        <div className="ms-title">
          <span className="ms-num">{String(month + 1).padStart(2, "0")}</span>
          <span className="ms-name">
            {MONTHS_EN[month]}
            <small>
              {year} · {hanja}
            </small>
          </span>
        </div>
        <div className="ms-actions">
          <button className="ms-btn" onClick={onPrev} disabled={!canPrev} aria-label="이전 달">
            ‹
          </button>
          <button className="ms-btn" onClick={onNext} disabled={!canNext} aria-label="다음 달">
            ›
          </button>
          <button className="ms-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
      </div>

      <div className="ms-grid">
        {WEEK_KO.map((w, i) => (
          <span key={w} className={`ms-week ${weekendClass(i)}`}>
            {w}
          </span>
        ))}
        {monthCells(year, month).map((d, i) => {
          const key = d ? keyOf(year, month, d) : "";
          const name = d ? holidays[key] : undefined;
          const cls = ["ms-cell", !d && "empty", i % 7 === 0 && "sun", i % 7 === 6 && "sat", name && "hol", key === today && "today"]
            .filter(Boolean)
            .join(" ");
          return (
            <motion.div
              key={i}
              className={cls}
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.012, duration: 0.35 }}
            >
              {d && <span className="ms-day">{d}</span>}
              {name && <span className="ms-hol">{name}</span>}
            </motion.div>
          );
        })}
      </div>

      <ul className="ms-list">
        {list.length === 0 && <li className="ms-none">이 달은 공휴일이 없어요.</li>}
        {list.map(([k, name]) => (
          <li key={k}>
            <b>
              {month + 1}.{+k.slice(8)} ({weekdayOf(k)})
            </b>
            {name}
          </li>
        ))}
      </ul>

      <style jsx>{`
        .ms-head {
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .ms-title {
          display: flex;
          align-items: flex-end;
          gap: 14px;
        }
        .ms-num {
          font-family: var(--f-display);
          font-weight: 900;
          font-size: clamp(56px, 9vw, 96px);
          line-height: 0.8;
          color: var(--core);
          text-shadow: 0 0 30px color-mix(in srgb, var(--hot) 45%, transparent);
        }
        .ms-name {
          display: flex;
          flex-direction: column;
          font-family: var(--f-display);
          font-weight: 700;
          font-size: clamp(18px, 2.4vw, 26px);
          letter-spacing: 0.2em;
        }
        .ms-name small {
          font-size: 13px;
          letter-spacing: 0.2em;
          opacity: 0.5;
        }
        .ms-actions {
          display: flex;
          gap: 8px;
        }
        .ms-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(244, 237, 225, 0.25);
          background: transparent;
          color: #f4ede1;
          font-size: 20px;
          line-height: 1;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ms-btn:hover:not(:disabled) {
          border-color: var(--warm);
          box-shadow: 0 0 18px color-mix(in srgb, var(--warm) 40%, transparent);
        }
        .ms-btn:disabled {
          opacity: 0.2;
          cursor: default;
        }

        .ms-grid {
          position: relative;
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          grid-template-rows: auto;
          grid-auto-rows: minmax(0, 1fr);
          gap: 4px;
        }
        .ms-week {
          padding: 6px 0;
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          color: rgba(244, 237, 225, 0.5);
        }
        .ms-week.sun {
          color: var(--hot);
        }
        .ms-week.sat {
          color: #8fb6ff;
        }
        .ms-grid :global(.ms-cell) {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 0;
          overflow: hidden;
          padding: 8px;
          border-radius: 12px;
          background: rgba(244, 237, 225, 0.04);
          border: 1px solid rgba(244, 237, 225, 0.06);
        }
        .ms-grid :global(.ms-cell.empty) {
          background: transparent;
          border-color: transparent;
        }
        .ms-grid :global(.ms-cell.sun .ms-day) {
          color: var(--hot);
        }
        .ms-grid :global(.ms-cell.sat .ms-day) {
          color: #8fb6ff;
        }
        .ms-grid :global(.ms-cell.hol) {
          border-color: color-mix(in srgb, var(--warm) 55%, transparent);
          background: radial-gradient(
            circle at 30% 20%,
            color-mix(in srgb, var(--warm) 35%, transparent),
            color-mix(in srgb, var(--hot) 14%, transparent) 55%,
            color-mix(in srgb, var(--hot) 5%, transparent)
          );
          box-shadow: 0 0 24px color-mix(in srgb, var(--hot) 25%, transparent) inset;
        }
        .ms-grid :global(.ms-cell.hol .ms-day) {
          color: var(--core);
          text-shadow: 0 0 12px var(--warm);
        }
        .ms-grid :global(.ms-cell.today) {
          outline: 2px solid var(--cool);
          outline-offset: -2px;
        }
        .ms-grid :global(.ms-day) {
          font-family: var(--f-display);
          font-weight: 800;
          font-size: clamp(16px, 2.2vw, 24px);
          line-height: 1;
        }
        .ms-grid :global(.ms-hol) {
          font-size: clamp(10px, 1.3vw, 13px);
          font-weight: 700;
          line-height: 1.25;
          color: color-mix(in srgb, var(--core) 70%, var(--warm));
          word-break: keep-all;
        }

        .ms-list {
          position: relative;
          flex: none;
          list-style: none;
          margin: 14px 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px 22px;
          font-size: 14px;
        }
        .ms-list b {
          margin-right: 8px;
          color: var(--warm);
        }
        .ms-none {
          opacity: 0.5;
        }

        @media (max-width: 480px) {
          .ms-grid :global(.ms-cell) {
            padding: 4px;
            border-radius: 8px;
          }
        }
      `}</style>
    </>
  );
}
