"use client";

import { MapPin, Phone, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { consultReply } from "./consult";
import type { ChatMsg, DayLog, Pet, Urgency } from "./store";
import s from "./pet.module.css";

interface ConsultTabProps {
  pet: Pet;
  logs: Record<string, DayLog>;
  chat: ChatMsg[];
  onChat: (chat: ChatMsg[]) => void;
  onOpenProfile: () => void;
}

const URGENCY_LABEL: Record<Urgency, string> = { high: "바로 병원", mid: "지켜보기", low: "가벼움" };

const SUGGESTIONS = [
  "어제부터 두 번 토했어요",
  "밥을 하루 종일 안 먹어요",
  "화장실에 자주 가는데 소변이 안 나와요",
  "물을 갑자기 많이 마셔요",
  "귀를 자주 긁어요",
  "관절 영양제 같이 먹여도 되나요?",
];

const NEARBY_URL = `https://map.kakao.com/link/search/${encodeURIComponent("24시 동물병원")}`;

/** **굵게** 표시만 지원하는 아주 작은 렌더러 */
function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part,
  );
}

function CallButtons({ pet, onOpenProfile }: { pet: Pet; onOpenProfile: () => void }) {
  return (
    <div className={s.callBar}>
      {pet.vetPhone ? (
        <a className={`${s.btn} ${s.danger}`} href={`tel:${pet.vetPhone.replace(/[^0-9+]/g, "")}`}>
          <Phone size={16} /> {pet.vetName ? pet.vetName.replace(/\s*\(예시\)/, "") : "병원"} 전화
        </a>
      ) : (
        <button type="button" className={`${s.btn} ${s.danger}`} onClick={onOpenProfile}>
          <Phone size={16} /> 병원 번호 등록
        </button>
      )}
      <a className={s.btn} href={NEARBY_URL} target="_blank" rel="noreferrer">
        <MapPin size={16} /> 근처 24시 병원
      </a>
    </div>
  );
}

export function ConsultTab({ pet, logs, chat, onChat, onOpenProfile }: ConsultTabProps) {
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.length, thinking]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function ask(question: string) {
    const q = question.trim();
    if (!q || thinking) return;
    const withQuestion: ChatMsg[] = [...chat, { role: "user", text: q, at: new Date().toISOString() }];
    onChat(withQuestion);
    setInput("");
    setThinking(true);
    // 생각하는 것처럼 잠깐 기다렸다가 답한다
    timer.current = setTimeout(() => {
      const { text, urgency } = consultReply(q, pet, logs);
      onChat([...withQuestion, { role: "ai", text, urgency, at: new Date().toISOString() }]);
      setThinking(false);
    }, 1100);
  }

  const lastAi = [...chat].reverse().find((m) => m.role === "ai");

  return (
    <div className={s.stagger}>
      <section className={s.card}>
        <div className={s.cardTitle}>
          급할 땐 바로
          <small>{pet.vetName || "다니는 병원을 등록해 두세요"}</small>
        </div>
        <CallButtons pet={pet} onOpenProfile={onOpenProfile} />
      </section>

      <section className={s.card}>
        <div className={s.cardTitle}>
          건강 상담
          {chat.length > 0 && (
            <button className={s.iconBtn} onClick={() => onChat([])} aria-label="대화 지우기">
              <Trash2 size={14} /> 지우기
            </button>
          )}
        </div>

        <div className={s.chat}>
          <div className={`${s.bubble} ${s.theirs}`}>
            안녕하세요! {pet.name}의 최근 기록을 함께 보면서 답해 드릴게요.
            {"\n"}어디가 걱정되는지 편하게 적어 주세요.
          </div>

          {chat.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className={`${s.bubble} ${s.mine}`}>
                {m.text}
              </div>
            ) : (
              <div key={i} className={`${s.bubble} ${s.theirs} ${m.urgency === "high" ? s.urgentBubble : ""}`}>
                {m.urgency && (
                  <span className={`${s.urgency} ${s[`urgency-${m.urgency}`]}`}>{URGENCY_LABEL[m.urgency]}</span>
                )}
                <div>{renderText(m.text)}</div>
              </div>
            ),
          )}

          {thinking && (
            <div className={s.typing} aria-label="답변 작성 중">
              <i />
              <i />
              <i />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {lastAi?.urgency === "high" && !thinking && (
          <div className={s.alert}>
            <strong>🚨 병원에 바로 연락해 보세요</strong>
            <CallButtons pet={pet} onOpenProfile={onOpenProfile} />
          </div>
        )}

        <div className={s.suggestions}>
          {SUGGESTIONS.map((q) => (
            <button key={q} type="button" className={s.pill} onClick={() => ask(q)} disabled={thinking}>
              {q}
            </button>
          ))}
        </div>

        <form
          className={s.composer}
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <input
            className={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="어디가 불편해 보이나요?"
            aria-label="상담 내용"
          />
          <button type="submit" className={`${s.btn} ${s.primary}`} disabled={!input.trim() || thinking} aria-label="보내기">
            <Send size={16} />
          </button>
        </form>
        <p className={s.saved}>데모용 자동 응답이에요. 실제 서비스에서는 이 자리에 AI 상담이 연결돼요.</p>
      </section>
    </div>
  );
}
