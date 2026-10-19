import { NextResponse } from "next/server";
import type { PushSubscription } from "web-push";
import { createReminder, deleteReminder, getPublicKey, listReminders, startAlarmScheduler } from "../../../lib/alarm";

export const dynamic = "force-dynamic";

/**
 * /alarm 페이지 API. POST { action, ... }
 * - config : VAPID 공개키 (처음 호출 때 생성)
 * - create : 구독 저장 + 알림 예약
 * - list   : 이 브라우저(endpoint)의 알림 목록
 * - delete : 알림 삭제
 */
export async function POST(req: Request) {
  // instrumentation이 안 돌았을 때를 대비해 여기서도 스케줄러를 켠다 (이미 켜져 있으면 무시)
  startAlarmScheduler();

  try {
    const body = await req.json();

    switch (body.action) {
      case "config":
        return NextResponse.json({ publicKey: await getPublicKey() });

      case "create": {
        const sub = body.subscription as PushSubscription | undefined;
        const fireAt = new Date(body.fireAt);
        if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
          return NextResponse.json({ error: "구독 정보가 없습니다" }, { status: 400 });
        }
        if (Number.isNaN(fireAt.getTime())) {
          return NextResponse.json({ error: "시간이 올바르지 않습니다" }, { status: 400 });
        }
        const title = String(body.title ?? "").trim().slice(0, 100) || "알림";
        const text = String(body.body ?? "").trim().slice(0, 300);
        const reminder = await createReminder(
          { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
          title,
          text,
          fireAt,
        );
        return NextResponse.json({ reminder });
      }

      case "list":
        return NextResponse.json({ reminders: body.endpoint ? await listReminders(String(body.endpoint)) : [] });

      case "delete":
        await deleteReminder(String(body.endpoint), String(body.id));
        return NextResponse.json({ ok: true });

      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("[alarm]", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
