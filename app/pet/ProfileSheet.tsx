"use client";

import { Camera, X } from "lucide-react";
import { useRef, useState } from "react";
import { SPECIES_LABEL, resizeImage, type Pet, type Species } from "./store";
import s from "./pet.module.css";

interface ProfileSheetProps {
  pet: Pet | null;
  onSave: (pet: Pet) => void;
  onClose: () => void;
  onReset?: () => void;
}

const BLANK: Pet = {
  name: "",
  species: "cat",
  breed: "",
  birthday: "",
  vetName: "",
  vetPhone: "",
  supplements: [],
};

export function ProfileSheet({ pet, onSave, onClose, onReset }: ProfileSheetProps) {
  const [draft, setDraft] = useState<Pet>(pet ?? BLANK);
  const [supplementInput, setSupplementInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Pet>(key: K, value: Pet[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    try {
      set("photo", await resizeImage(file, 480));
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진을 읽지 못했어요.");
    }
  }

  function addSupplement() {
    const name = supplementInput.trim();
    if (name && !draft.supplements.includes(name)) set("supplements", [...draft.supplements, name]);
    setSupplementInput("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    onSave({ ...draft, name: draft.name.trim() });
  }

  return (
    <div className={s.sheetBackdrop} onClick={onClose}>
      <form className={s.sheet} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className={s.cardTitle}>
          {pet ? "프로필 수정" : "우리 아이 등록"}
          <button type="button" className={s.iconBtn} onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>

        <div className={s.photoPick}>
          {draft.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.photo} alt="" />
          ) : (
            <span className={s.avatarFallback}>{draft.species === "dog" ? "🐶" : "🐱"}</span>
          )}
          <button type="button" className={s.btn} onClick={() => fileRef.current?.click()}>
            <Camera size={16} /> 사진 고르기
          </button>
          <input
            ref={fileRef}
            className={s.hidden}
            type="file"
            accept="image/*"
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />
        </div>

        <label className={s.field}>
          이름
          <input className={s.input} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="살랑이" />
        </label>

        <div className={s.field}>
          종류
          <div className={s.segment}>
            {(Object.keys(SPECIES_LABEL) as Species[]).map((sp) => (
              <button
                key={sp}
                type="button"
                className={`${s.chip} ${draft.species === sp ? s.chipOn : ""}`}
                onClick={() => set("species", sp)}
              >
                {SPECIES_LABEL[sp]}
              </button>
            ))}
          </div>
        </div>

        <div className={s.row} style={{ marginTop: 12 }}>
          <label className={s.field} style={{ flex: 1, minWidth: 140 }}>
            품종
            <input className={s.input} value={draft.breed} onChange={(e) => set("breed", e.target.value)} placeholder="코리안숏헤어" />
          </label>
          <label className={s.field} style={{ flex: 1, minWidth: 140, marginTop: 0 }}>
            생일
            <input className={s.input} type="date" value={draft.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </label>
        </div>

        <label className={s.field}>
          다니는 병원
          <input className={s.input} value={draft.vetName} onChange={(e) => set("vetName", e.target.value)} placeholder="○○ 동물병원" />
        </label>
        <label className={s.field}>
          병원 전화번호
          <input
            className={s.input}
            type="tel"
            inputMode="tel"
            value={draft.vetPhone}
            onChange={(e) => set("vetPhone", e.target.value)}
            placeholder="02-123-4567"
          />
        </label>

        <div className={s.field}>
          먹이는 영양제
          <div className={s.pillList}>
            {draft.supplements.map((name) => (
              <button
                key={name}
                type="button"
                className={`${s.pill} ${s.pillOn}`}
                onClick={() => set("supplements", draft.supplements.filter((n) => n !== name))}
                aria-label={`${name} 빼기`}
              >
                {name} <X size={12} />
              </button>
            ))}
          </div>
          <div className={s.composer} style={{ marginTop: 4 }}>
            <input
              className={s.input}
              value={supplementInput}
              onChange={(e) => setSupplementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  addSupplement();
                }
              }}
              placeholder="유산균, 오메가3…"
            />
            <button type="button" className={s.btn} onClick={addSupplement}>
              추가
            </button>
          </div>
        </div>

        {error && <p className={s.muted} style={{ color: "var(--bad)", marginTop: 12 }}>{error}</p>}

        <button type="submit" className={`${s.btn} ${s.primary} ${s.block}`} style={{ marginTop: 18 }}>
          저장
        </button>

        {onReset && (
          <button
            type="button"
            className={`${s.btn} ${s.ghost} ${s.block}`}
            style={{ marginTop: 8, color: "var(--ink-faint)" }}
            onClick={() => {
              if (window.confirm("모든 기록을 지우고 처음 화면으로 돌아갈까요?")) onReset();
            }}
          >
            데모 데이터 모두 지우기
          </button>
        )}
      </form>
    </div>
  );
}
