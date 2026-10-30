"use client";

import { Camera, Check } from "lucide-react";
import { useRef, useState } from "react";
import {
  LEVEL_LABEL,
  STOOL_LABEL,
  dayKey,
  emptyLog,
  formatDay,
  resizeImage,
  type DayLog,
  type Level,
  type Pet,
  type Stool,
} from "./store";
import s from "./pet.module.css";

interface TodayTabProps {
  pet: Pet;
  day: string;
  log: DayLog | undefined;
  onChange: (log: DayLog) => void;
  onToday: () => void;
}

const LEVELS: Level[] = [1, 2, 3];

const METRICS: { key: "appetite" | "water" | "energy"; label: string; emoji: string }[] = [
  { key: "appetite", label: "식욕", emoji: "🍚" },
  { key: "water", label: "물 마신 양", emoji: "💧" },
  { key: "energy", label: "활력", emoji: "⚡" },
];

export function TodayTab({ pet, day, log, onChange, onToday }: TodayTabProps) {
  const current = log ?? emptyLog(day);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isToday = day === dayKey();

  function patch(changes: Partial<DayLog>) {
    onChange({ ...current, ...changes });
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    try {
      patch({ photo: await resizeImage(file) });
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "사진을 읽지 못했어요.");
    }
  }

  function toggleSupplement(name: string) {
    const taken = current.supplementsTaken.includes(name)
      ? current.supplementsTaken.filter((n) => n !== name)
      : [...current.supplementsTaken, name];
    patch({ supplementsTaken: taken });
  }

  const takenCount = pet.supplements.filter((n) => current.supplementsTaken.includes(n)).length;

  return (
    <div className={s.stagger}>
      <section className={s.card}>
        <div className={s.cardTitle}>
          {isToday ? "오늘의 한 장" : formatDay(day)}
          {isToday ? (
            <small>{formatDay(day)}</small>
          ) : (
            <button className={s.iconBtn} onClick={onToday}>
              오늘로
            </button>
          )}
        </div>
        <button type="button" className={s.polaroid} onClick={() => fileRef.current?.click()}>
          {current.photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.photo} alt={`${pet.name} 사진`} />
              <span className={s.polaroidTag}>
                <Camera size={12} style={{ verticalAlign: -1 }} /> 다시 찍기
              </span>
            </>
          ) : (
            <span className={s.polaroidEmpty}>
              <span>
                <strong>📷</strong>
                {pet.name}의 {isToday ? "오늘" : "이날"} 모습을 남겨 주세요
              </span>
            </span>
          )}
        </button>
        <input
          ref={fileRef}
          className={s.hidden}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
        {photoError && <p className={s.muted}>{photoError}</p>}
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>컨디션</div>

        {METRICS.map((m) => (
          <div key={m.key} className={s.metric}>
            <div className={s.metricLabel}>
              {m.emoji} {m.label}
            </div>
            <div className={s.segment}>
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  className={`${s.chip} ${current[m.key] === lv ? s.chipOn : ""}`}
                  onClick={() => patch({ [m.key]: current[m.key] === lv ? undefined : lv })}
                >
                  {LEVEL_LABEL[lv]}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className={s.metric}>
          <div className={s.metricLabel}>💩 대변</div>
          <div className={s.segment}>
            {(Object.keys(STOOL_LABEL) as Stool[]).map((st) => (
              <button
                key={st}
                type="button"
                className={`${s.chip} ${st === "diarrhea" ? s.chipBad : ""} ${current.stool === st ? s.chipOn : ""}`}
                onClick={() => patch({ stool: current.stool === st ? undefined : st })}
              >
                {STOOL_LABEL[st]}
              </button>
            ))}
          </div>
        </div>

        <div className={s.metric}>
          <div className={s.metricLabel}>🤢 구토</div>
          <div className={s.segment}>
            <button
              type="button"
              className={`${s.chip} ${!current.vomit ? s.chipOn : ""}`}
              onClick={() => patch({ vomit: false })}
            >
              없음
            </button>
            <button
              type="button"
              className={`${s.chip} ${s.chipBad} ${current.vomit ? s.chipOn : ""}`}
              onClick={() => patch({ vomit: true })}
            >
              있음
            </button>
          </div>
        </div>

        <label className={`${s.field} ${s.metric}`}>
          <span className={s.metricLabel} style={{ marginBottom: 0, color: "var(--ink)" }}>
            ⚖️ 몸무게 (kg)
          </span>
          <input
            className={s.input}
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={current.weight ?? ""}
            onChange={(e) => patch({ weight: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="재지 않았으면 비워 두세요"
          />
        </label>
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>
          영양제
          <small>
            {pet.supplements.length ? `${takenCount} / ${pet.supplements.length}` : "프로필에서 추가해요"}
          </small>
        </div>
        {pet.supplements.length ? (
          <div className={s.pillList}>
            {pet.supplements.map((name) => {
              const on = current.supplementsTaken.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  className={`${s.pill} ${on ? s.pillOn : ""}`}
                  onClick={() => toggleSupplement(name)}
                  aria-pressed={on}
                >
                  {on && <Check size={14} />}
                  {name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className={s.muted}>오른쪽 위 프로필 사진을 눌러 먹이는 영양제를 등록하면, 매일 먹였는지 체크할 수 있어요.</p>
        )}
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>메모</div>
        <textarea
          className={s.textarea}
          value={current.note}
          onChange={(e) => patch({ note: e.target.value })}
          placeholder="평소와 달랐던 점, 귀여웠던 순간…"
        />
        <p className={s.saved}>입력하는 대로 이 브라우저에 자동 저장돼요</p>
      </section>
    </div>
  );
}
