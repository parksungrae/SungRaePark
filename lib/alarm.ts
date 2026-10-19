import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import webpush, { type PushSubscription } from "web-push";

/**
 * /alarm 웹 푸시 알림 저장소 + 스케줄러.
 * 모든 데이터는 .data/alarm.json 한 파일에 저장하고,
 * Next 서버가 떠 있는 동안 10초마다 시간이 된 알림을 보낸다.
 */

export interface Reminder {
  id: string;
  endpoint: string;
  title: string;
  body: string;
  fireAt: string;
  sentAt: string | null;
}

interface Store {
  vapid: { publicKey: string; privateKey: string };
  subscriptions: Record<string, PushSubscription>;
  reminders: Reminder[];
}

const FILE = path.join(process.cwd(), ".data", "alarm.json");
const TICK_MS = 10_000;

// 개발 서버에서는 instrumentation과 API 라우트가 모듈을 따로 로드할 수 있어서 상태를 globalThis에 둔다
const g = globalThis as typeof globalThis & {
  __alarmQueue?: Promise<unknown>;
  __alarmTimer?: ReturnType<typeof setInterval>;
};

async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Store;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    return { vapid: webpush.generateVAPIDKeys(), subscriptions: {}, reminders: [] };
  }
}

async function writeStore(store: Store) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2));
  await fs.rename(tmp, FILE);
}

/** 파일을 읽고 → fn 실행 → 다시 저장. 동시에 여러 요청이 와도 한 번에 하나씩 처리한다. */
function withStore<T>(fn: (store: Store) => T): Promise<T> {
  const run = (g.__alarmQueue ?? Promise.resolve()).then(async () => {
    const store = await readStore();
    const result = fn(store);
    await writeStore(store);
    return result;
  });
  g.__alarmQueue = run.catch(() => {});
  return run;
}

export function getPublicKey() {
  return withStore((s) => s.vapid.publicKey);
}

export function createReminder(sub: PushSubscription, title: string, body: string, fireAt: Date) {
  return withStore((s) => {
    s.subscriptions[sub.endpoint] = sub;
    const reminder: Reminder = {
      id: randomUUID(),
      endpoint: sub.endpoint,
      title,
      body,
      fireAt: fireAt.toISOString(),
      sentAt: null,
    };
    s.reminders.push(reminder);
    return reminder;
  });
}

/** 이 브라우저의 예정된 알림 + 최근 24시간 안에 보낸 알림 */
export function listReminders(endpoint: string) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return withStore((s) =>
    s.reminders
      .filter((r) => r.endpoint === endpoint && (!r.sentAt || Date.parse(r.sentAt) >= since))
      .sort((a, b) => a.fireAt.localeCompare(b.fireAt)),
  );
}

export function deleteReminder(endpoint: string, id: string) {
  return withStore((s) => {
    s.reminders = s.reminders.filter((r) => !(r.id === id && r.endpoint === endpoint));
  });
}

async function dispatchDue() {
  const now = Date.now();
  // 보낼 알림을 먼저 sentAt으로 표시해 두고 저장한 뒤 발송한다 (중복 발송 방지)
  const { due, vapid } = await withStore((s) => {
    const due = s.reminders
      .filter((r) => !r.sentAt && Date.parse(r.fireAt) <= now)
      .map((r) => {
        r.sentAt = new Date(now).toISOString();
        return { reminder: r, sub: s.subscriptions[r.endpoint] };
      });
    // 일주일 넘은 발송 기록은 정리
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    s.reminders = s.reminders.filter((r) => !r.sentAt || Date.parse(r.sentAt) >= weekAgo);
    return { due, vapid: s.vapid };
  });
  if (due.length === 0) return;

  const expired: string[] = [];
  await Promise.all(
    due.map(async ({ reminder, sub }) => {
      if (!sub) return;
      try {
        await webpush.sendNotification(
          sub,
          JSON.stringify({ id: reminder.id, title: reminder.title, body: reminder.body, url: "/alarm" }),
          { vapidDetails: { subject: "mailto:noreply@example.com", ...vapid } },
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404/410: 구독이 만료됨 (브라우저에서 알림 해제 등)
        if (status === 404 || status === 410) expired.push(sub.endpoint);
        else console.error("[alarm] push failed", status, e);
      }
    }),
  );

  if (expired.length > 0) {
    await withStore((s) => {
      for (const ep of expired) delete s.subscriptions[ep];
      s.reminders = s.reminders.filter((r) => !expired.includes(r.endpoint));
    });
  }
}

/** 서버 프로세스당 한 번만 시작된다 */
export function startAlarmScheduler() {
  if (g.__alarmTimer) return;
  g.__alarmTimer = setInterval(() => {
    dispatchDue().catch((e) => console.error("[alarm] dispatch failed", e));
  }, TICK_MS);
  console.log("[alarm] scheduler started");
}
