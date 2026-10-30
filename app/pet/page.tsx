"use client";

import { CalendarDays, MessagesSquare, NotebookPen, Stethoscope } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BackButton } from "../../components/BackButton";
import { CommunityTab } from "./CommunityTab";
import { ConsultTab } from "./ConsultTab";
import { HistoryTab } from "./HistoryTab";
import { ProfileSheet } from "./ProfileSheet";
import { TodayTab } from "./TodayTab";
import {
  SAMPLE_PHOTO,
  SPECIES_LABEL,
  dayKey,
  demoState,
  emptyState,
  loadState,
  saveState,
  type Pet,
  type PetState,
} from "./store";
import s from "./pet.module.css";

type Tab = "today" | "history" | "consult" | "community";

const TABS: { id: Tab; label: string; Icon: typeof NotebookPen }[] = [
  { id: "today", label: "오늘", Icon: NotebookPen },
  { id: "history", label: "기록", Icon: CalendarDays },
  { id: "consult", label: "상담", Icon: Stethoscope },
  { id: "community", label: "이야기", Icon: MessagesSquare },
];

function ageText(birthday: string): string {
  if (!birthday) return "";
  const born = new Date(birthday);
  const months = (new Date().getFullYear() - born.getFullYear()) * 12 + new Date().getMonth() - born.getMonth();
  if (Number.isNaN(months) || months < 0) return "";
  return months < 12 ? `${months}개월` : `${Math.floor(months / 12)}살`;
}

export default function PetPage() {
  const [state, setState] = useState<PetState | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [editDay, setEditDay] = useState(dayKey());
  const [sheetOpen, setSheetOpen] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadState().then((saved) => {
      setState(saved ?? emptyState());
      loaded.current = true;
    });
  }, []);

  // 바뀔 때마다 이 브라우저에 저장한다
  useEffect(() => {
    if (state && loaded.current) saveState(state);
  }, [state]);

  function update(fn: (prev: PetState) => PetState) {
    setState((prev) => (prev ? fn(prev) : prev));
  }

  function savePet(pet: Pet) {
    update((prev) => ({ ...prev, pet, nickname: prev.nickname || `${pet.name}집사` }));
    setSheetOpen(false);
  }

  function resetAll() {
    setState(emptyState());
    setTab("today");
    setEditDay(dayKey());
    setSheetOpen(false);
  }

  function openDay(day: string) {
    setEditDay(day);
    setTab("today");
  }

  if (!state) return <div className={s.root} />;

  const { pet } = state;

  return (
    <div className={s.root}>
      <div className={s.back}>
        <BackButton />
      </div>

      <main className={s.shell}>
        {!pet ? (
          <div className={s.welcome}>
            <div className={s.welcomePhoto}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SAMPLE_PHOTO} alt="스탠드 불빛 아래 앉아 있는 샴 고양이" />
              <div className={s.welcomeCopy}>
                <p className={s.eyebrow}>pet diary · demo</p>
                <h1 className={s.display}>오늘도, 잘 지냈나요?</h1>
                <p>
                  사진 한 장과 몇 번의 탭으로 하루 건강을 남겨요.
                  <br />
                  이상하면 바로 상담하고, 병원에 전화하고, 다른 집사들과 이야기 나눠요.
                </p>
              </div>
            </div>

            <div className={`${s.features} ${s.stagger}`}>
              <div className={s.feature}>
                <b>📷</b>매일 사진과 컨디션 기록
              </div>
              <div className={s.feature}>
                <b>💊</b>영양제 먹였는지 체크
              </div>
              <div className={s.feature}>
                <b>🩺</b>아프면 상담 → 병원 전화
              </div>
              <div className={s.feature}>
                <b>💬</b>집사들과 이야기 나누기
              </div>
            </div>

            <button className={`${s.btn} ${s.primary} ${s.block}`} onClick={() => setState(demoState())}>
              예시 고양이 &lsquo;살랑이&rsquo;로 둘러보기
            </button>
            <button className={`${s.btn} ${s.block}`} onClick={() => setSheetOpen(true)}>
              우리 아이 직접 등록하기
            </button>
            <p className={s.muted} style={{ textAlign: "center" }}>
              데모라서 서버에 아무것도 보내지 않아요. 기록은 이 브라우저에만 저장돼요.
            </p>
          </div>
        ) : (
          <>
            <header className={s.header}>
              <div>
                <p className={s.eyebrow}>pet diary</p>
                <h1 className={s.display}>{pet.name}의 하루</h1>
                <p className={s.sub}>
                  {[SPECIES_LABEL[pet.species], pet.breed, ageText(pet.birthday)].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button className={s.avatarBtn} onClick={() => setSheetOpen(true)} aria-label="프로필 수정">
                {pet.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pet.photo} alt={pet.name} />
                ) : (
                  <span className={s.avatarFallback}>{pet.species === "dog" ? "🐶" : "🐱"}</span>
                )}
              </button>
            </header>

            {tab === "today" && (
              <TodayTab
                key={editDay}
                pet={pet}
                day={editDay}
                log={state.logs[editDay]}
                onChange={(log) => update((prev) => ({ ...prev, logs: { ...prev.logs, [log.day]: log } }))}
                onToday={() => setEditDay(dayKey())}
              />
            )}
            {tab === "history" && <HistoryTab pet={pet} logs={state.logs} onEditDay={openDay} />}
            {tab === "consult" && (
              <ConsultTab
                pet={pet}
                logs={state.logs}
                chat={state.chat}
                onChat={(chat) => update((prev) => ({ ...prev, chat }))}
                onOpenProfile={() => setSheetOpen(true)}
              />
            )}
            {tab === "community" && (
              <CommunityTab
                pet={pet}
                posts={state.posts}
                nickname={state.nickname}
                onPosts={(posts) => update((prev) => ({ ...prev, posts }))}
                onNickname={(nickname) => update((prev) => ({ ...prev, nickname }))}
              />
            )}
          </>
        )}
      </main>

      {pet && (
        <nav className={s.tabbar} aria-label="메뉴">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${s.tab} ${tab === id ? s.tabOn : ""}`}
              onClick={() => {
                setTab(id);
                if (id === "today") setEditDay(dayKey());
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <Icon size={20} strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </nav>
      )}

      {sheetOpen && (
        <ProfileSheet pet={pet} onSave={savePet} onClose={() => setSheetOpen(false)} onReset={pet ? resetAll : undefined} />
      )}
    </div>
  );
}
