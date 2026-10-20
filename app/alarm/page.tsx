"use client";

import { useCallback, useEffect, useState } from "react";
import { BackButton } from "../../components/BackButton";

interface Reminder {
  id: string;
  title: string;
  body: string;
  fireAt: string;
  sentAt: string | null;
}

type Status = "loading" | "unsupported" | "denied" | "ready";

// Supabase Edge Function (JWT 검증 없이 호출 가능하도록 배포되어 있어 키가 필요 없다)
const ALARM_API = `${
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qswmxdbmzlupuvdypsxj.supabase.co"
}/functions/v1/push-reminders`;

async function callApi<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(ALARM_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "요청에 실패했어요.");
  return data as T;
}

function base64UrlToBytes(base64Url: string) {
  const base64 = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameBytes(a: Uint8Array, b: Uint8Array) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Date → datetime-local input 값 (로컬 시간) */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const QUICK = [
  { label: "+1분", minutes: 1 },
  { label: "+10분", minutes: 10 },
  { label: "+1시간", minutes: 60 },
  { label: "내일 이 시간", minutes: 60 * 24, fromNow: true },
];

/** + 버튼은 입력된 시간에 계속 더한다 (비었거나 지난 시간이면 지금부터). "내일 이 시간"은 항상 지금 기준 */
function addQuick(current: string, q: (typeof QUICK)[number]): Date {
  const parsed = new Date(current).getTime();
  const base = "fromNow" in q || Number.isNaN(parsed) || parsed < Date.now() ? Date.now() : parsed;
  return new Date(base + q.minutes * 60 * 1000);
}

export default function AlarmPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [fireAt, setFireAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReminders = useCallback(async (ep: string) => {
    const { reminders } = await callApi<{ reminders: Reminder[] }>({ action: "list", endpoint: ep });
    setReminders(reminders);
  }, []);

  useEffect(() => {
    setFireAt(toLocalInput(new Date()));

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") setStatus("denied");

    // Safari는 서비스 워커가 활성화되기 전에 구독하면 실패하므로 ready(활성화 완료)를 기다린다
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(async (reg) => {
        setRegistration(reg);
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          setEndpoint(sub.endpoint);
          await loadReminders(sub.endpoint);
        }
        if (Notification.permission !== "denied") setStatus("ready");
      })
      .catch((e) => {
        console.error(e);
        setMessage("서비스 워커 등록에 실패했어요.");
        setStatus("unsupported");
      });
  }, [loadReminders]);

  // 발송 여부를 반영하려고 대기 중인 알림이 있으면 30초마다 목록을 다시 불러온다
  useEffect(() => {
    if (!endpoint || !reminders.some((r) => !r.sentAt)) return;
    const timer = setInterval(() => loadReminders(endpoint).catch(() => {}), 30_000);
    return () => clearInterval(timer);
  }, [endpoint, reminders, loadReminders]);

  // 푸시가 도착하면 기다리지 않고 바로 목록을 갱신한다
  useEffect(() => {
    if (!endpoint || !("serviceWorker" in navigator)) return;
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "alarm" && endpoint) loadReminders(endpoint).catch(() => {});
    }
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, [endpoint, loadReminders]);

  async function ensureSubscription() {
    if (!registration) throw new Error("서비스 워커가 아직 준비되지 않았어요.");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setStatus("denied");
      throw new Error("알림 권한이 필요해요.");
    }

    const { publicKey } = await callApi<{ publicKey: string }>({ action: "config" });
    const serverKey = base64UrlToBytes(publicKey);

    // 서버 키가 바뀌었으면(.data 삭제 등) 예전 구독으로는 푸시가 안 가므로 다시 구독한다
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      const key = existing.options.applicationServerKey;
      if (key && sameBytes(new Uint8Array(key), serverKey)) return existing;
      await existing.unsubscribe();
    }

    return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: serverKey });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const when = new Date(fireAt);
    if (Number.isNaN(when.getTime())) {
      setMessage("시간을 입력해 주세요.");
      return;
    }
    // 입력은 분 단위라 "지금" 분을 고르면 몇 초 지난 시간이 된다. 그 분 안이면 바로 보내도록 허용한다
    if (when.getTime() < Date.now() - 60 * 1000) {
      setMessage("지난 시간에는 알림을 걸 수 없어요.");
      return;
    }

    setBusy(true);
    try {
      const sub = await ensureSubscription();
      await callApi({
        action: "create",
        subscription: sub.toJSON(),
        title,
        body,
        fireAt: when.toISOString(),
      });
      setEndpoint(sub.endpoint);
      await loadReminders(sub.endpoint);
      setTitle("");
      setBody("");
      setMessage(`${formatTime(when.toISOString())}에 알려드릴게요.`);
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : "알림 등록에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!endpoint) return;
    setReminders((list) => list.filter((r) => r.id !== id));
    try {
      await callApi({ action: "delete", id, endpoint });
    } catch {
      await loadReminders(endpoint);
    }
  }

  const sections = [
    { heading: "예정된 알림", className: "", items: reminders.filter((r) => !r.sentAt) },
    { heading: "보낸 알림 (최근 24시간)", className: "done", items: reminders.filter((r) => r.sentAt) },
  ];

  return (
    <div className="alarm-page">
      <div className="alarm-back">
        <BackButton />
      </div>

      <div className="alarm-main">
        <div className="alarm-hero">
          <p className="alarm-label">web push</p>
          <h1 className="alarm-title">알림</h1>
          <p className="alarm-desc">
            시간을 정해 두면 그 시간에 브라우저 알림이 와요.
            <br />이 탭을 닫아도 브라우저가 켜져 있으면 받을 수 있어요.
          </p>
        </div>

        {status === "unsupported" && (
          <p className="alarm-notice">이 브라우저는 웹 푸시를 지원하지 않아요. (iOS는 홈 화면에 추가한 뒤 사용할 수 있어요)</p>
        )}
        {status === "denied" && (
          <p className="alarm-notice">
            알림 권한이 차단되어 있어요. 주소창 왼쪽의 사이트 설정에서 알림을 허용한 뒤 새로고침해 주세요.
          </p>
        )}

        <form className="alarm-form" onSubmit={handleSubmit}>
          <label className="alarm-field">
            <span>제목</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="알림" maxLength={100} />
          </label>

          <label className="alarm-field">
            <span>내용</span>
            <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="무엇을 알려드릴까요?" maxLength={300} />
          </label>

          <label className="alarm-field">
            <span>시간</span>
            <input type="datetime-local" value={fireAt} onChange={(e) => setFireAt(e.target.value)} required />
          </label>

          <div className="alarm-quick">
            {QUICK.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setFireAt((prev) => toLocalInput(addQuick(prev, q)))}
              >
                {q.label}
              </button>
            ))}
          </div>

          <button className="alarm-submit" type="submit" disabled={busy || status === "loading" || status === "unsupported"}>
            {busy ? "등록 중…" : "알림 설정"}
          </button>

          {message && <p className="alarm-message">{message}</p>}
          <p className="alarm-hint">서버가 1분마다 확인해서 보내기 때문에 최대 1분 정도 늦게 올 수 있어요.</p>
        </form>

        {sections.map(
          (section) =>
            section.items.length > 0 && (
              <section key={section.heading} className={`alarm-section ${section.className}`}>
                <h2>{section.heading}</h2>
                <ul>
                  {section.items.map((r) => (
                    <li key={r.id} className="alarm-item">
                      <div>
                        <p className="alarm-item-time">{formatTime(r.fireAt)}</p>
                        <p className="alarm-item-title">{r.title}</p>
                        {r.body && <p className="alarm-item-body">{r.body}</p>}
                      </div>
                      <button type="button" onClick={() => handleDelete(r.id)} aria-label="알림 삭제">
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ),
        )}
      </div>

      <style jsx>{`
        .alarm-page {
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          padding: 24px;
        }

        .alarm-back {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 100;
        }

        .alarm-main {
          max-width: 560px;
          margin: 0 auto;
          padding: 80px 0;
        }

        .alarm-hero {
          margin-bottom: 48px;
        }

        .alarm-label {
          font-size: 12px;
          opacity: 0.4;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .alarm-title {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 300;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .alarm-desc {
          margin-top: 24px;
          opacity: 0.5;
          line-height: 1.6;
        }

        .alarm-notice {
          margin-bottom: 24px;
          padding: 14px 16px;
          border: 1px solid rgba(128, 128, 128, 0.3);
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.6;
        }

        .alarm-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .alarm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .alarm-field span {
          font-size: 12px;
          opacity: 0.5;
        }

        .alarm-field input {
          padding: 12px 14px;
          border: 1px solid rgba(128, 128, 128, 0.25);
          border-radius: 8px;
          background: transparent;
          color: var(--foreground);
          font-size: 15px;
          color-scheme: light dark;
        }

        .alarm-field input:focus {
          outline: none;
          border-color: var(--foreground);
        }

        .alarm-quick {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .alarm-quick button,
        .alarm-item button {
          padding: 6px 12px;
          border: 1px solid rgba(128, 128, 128, 0.25);
          border-radius: 999px;
          background: transparent;
          color: var(--foreground);
          font-size: 12px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .alarm-quick button:hover,
        .alarm-item button:hover {
          opacity: 0.6;
        }

        .alarm-submit {
          margin-top: 8px;
          padding: 14px;
          border: none;
          border-radius: 8px;
          background: var(--foreground);
          color: var(--background);
          font-size: 15px;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .alarm-submit:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .alarm-message {
          font-size: 14px;
        }

        .alarm-hint {
          font-size: 12px;
          opacity: 0.4;
        }

        .alarm-section {
          margin-top: 56px;
        }

        .alarm-section h2 {
          font-size: 12px;
          font-weight: 400;
          opacity: 0.4;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .alarm-section ul {
          list-style: none;
        }

        .alarm-section.done .alarm-item > div {
          opacity: 0.45;
        }

        .alarm-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 4px;
          border-bottom: 1px solid rgba(128, 128, 128, 0.15);
        }

        .alarm-item > div {
          min-width: 0;
        }

        .alarm-item-time {
          font-size: 12px;
          opacity: 0.5;
          font-family: var(--font-geist-mono, monospace);
        }

        .alarm-item-title {
          margin-top: 4px;
          font-weight: 500;
        }

        .alarm-item-body {
          margin-top: 2px;
          font-size: 13px;
          opacity: 0.6;
          overflow-wrap: anywhere;
        }

        @media (max-width: 768px) {
          .alarm-main {
            padding-top: 64px;
          }
        }
      `}</style>
    </div>
  );
}
