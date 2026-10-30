"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { LEVEL_LABEL, STOOL_LABEL, daysAgo, formatDay, logTone, type DayLog, type Pet } from "./store";
import s from "./pet.module.css";

interface HistoryTabProps {
  pet: Pet;
  logs: Record<string, DayLog>;
  onEditDay: (day: string) => void;
}

const RANGE = 14;
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

function WeightSpark({ points }: { points: { day: string; weight: number }[] }) {
  if (points.length < 2) {
    return <p className={s.muted}>몸무게를 두 번 이상 기록하면 변화가 그래프로 보여요.</p>;
  }
  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const w = 300;
  const h = 70;
  const pad = 8;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = h - pad - ((p.weight - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <>
      <svg className={s.spark} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="몸무게 변화">
        <polyline points={line} fill="none" stroke="var(--lamp)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map(([x, y], i) => (
          <circle key={points[i].day} cx={x} cy={y} r="3" fill="var(--lamp)" />
        ))}
      </svg>
      <div className={s.legend} style={{ justifyContent: "space-between" }}>
        <span>{points[0].weight}kg</span>
        <span>최근 {points[points.length - 1].weight}kg</span>
      </div>
    </>
  );
}

export function HistoryTab({ pet, logs, onEditDay }: HistoryTabProps) {
  const days = Array.from({ length: RANGE }, (_, i) => daysAgo(RANGE - 1 - i));
  const [selected, setSelected] = useState(() => [...days].reverse().find((d) => logs[d]) ?? days[RANGE - 1]);

  const recorded = days.filter((d) => logTone(logs[d]) !== "empty");
  const vomitDays = days.filter((d) => logs[d]?.vomit).length;
  const supplementRate = pet.supplements.length
    ? Math.round(
        (recorded.reduce(
          (sum, d) => sum + pet.supplements.filter((n) => logs[d].supplementsTaken.includes(n)).length,
          0,
        ) /
          Math.max(1, recorded.length * pet.supplements.length)) *
          100,
      )
    : null;

  const weightPoints = Object.values(logs)
    .filter((l): l is DayLog & { weight: number } => typeof l.weight === "number")
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-12)
    .map((l) => ({ day: l.day, weight: l.weight }));

  const sel = logs[selected];

  return (
    <div className={s.stagger}>
      <section className={s.card}>
        <div className={s.cardTitle}>
          최근 2주
          <small>점을 누르면 그날 기록이 보여요</small>
        </div>
        <div className={s.beads}>
          {days.map((d) => {
            const date = new Date(`${d}T00:00:00`);
            return (
              <button
                key={d}
                className={`${s.bead} ${selected === d ? s.beadOn : ""}`}
                onClick={() => setSelected(d)}
                aria-label={d}
              >
                {WEEKDAY[date.getDay()]}
                <span className={`${s.beadDot} ${s[`tone-${logTone(logs[d])}`]}`} />
                {date.getDate()}
              </button>
            );
          })}
        </div>
        <div className={s.legend}>
          <span><i style={{ background: "var(--good)" }} />좋음</span>
          <span><i style={{ background: "var(--watch)" }} />지켜보기</span>
          <span><i style={{ background: "var(--bad)" }} />주의</span>
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>
          {formatDay(selected)}
          <button className={s.iconBtn} onClick={() => onEditDay(selected)}>
            <Pencil size={14} /> {sel ? "고치기" : "기록하기"}
          </button>
        </div>
        {sel && logTone(sel) !== "empty" ? (
          <div className={sel.photo ? s.dayDetail : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {sel.photo && <img src={sel.photo} alt="" />}
            <div>
              <div className={s.dayFacts}>
                {sel.appetite && <span className={s.fact}>식욕 {LEVEL_LABEL[sel.appetite]}</span>}
                {sel.water && <span className={s.fact}>물 {LEVEL_LABEL[sel.water]}</span>}
                {sel.energy && <span className={s.fact}>활력 {LEVEL_LABEL[sel.energy]}</span>}
                {sel.stool && (
                  <span className={`${s.fact} ${sel.stool === "diarrhea" ? s.factWarn : ""}`}>
                    대변 {STOOL_LABEL[sel.stool]}
                  </span>
                )}
                {sel.vomit && <span className={`${s.fact} ${s.factWarn}`}>구토</span>}
                {sel.weight !== undefined && <span className={s.fact}>{sel.weight}kg</span>}
                {sel.supplementsTaken.map((n) => (
                  <span key={n} className={s.fact}>💊 {n}</span>
                ))}
              </div>
              {sel.note && <p className={s.muted}>{sel.note}</p>}
            </div>
          </div>
        ) : (
          <p className={s.muted}>이날은 기록이 없어요.</p>
        )}
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>2주 요약</div>
        <div className={s.stats}>
          <div className={s.stat}>
            <div className={s.statValue}>
              {recorded.length}
              <small style={{ fontSize: 13 }}>/{RANGE}</small>
            </div>
            <div className={s.statLabel}>기록한 날</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue}>{supplementRate === null ? "–" : `${supplementRate}%`}</div>
            <div className={s.statLabel}>영양제 챙긴 비율</div>
          </div>
          <div className={s.stat}>
            <div className={s.statValue} style={{ color: vomitDays ? "var(--bad)" : undefined }}>
              {vomitDays}
            </div>
            <div className={s.statLabel}>구토한 날</div>
          </div>
        </div>
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>몸무게</div>
        <WeightSpark points={weightPoints} />
      </section>
    </div>
  );
}
