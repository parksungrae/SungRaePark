// /alarm 웹 푸시 알림 API. POST { action, ... }
// - config   : VAPID 공개키 (처음 호출 때 생성)
// - create   : 구독 저장 + 알림 예약
// - list     : 이 브라우저(endpoint)의 알림 목록
// - delete   : 알림 삭제
// - dispatch : 시간이 된 알림 발송 (pg_cron이 1분마다 호출)
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

interface ReminderRow {
  id: string;
  title: string;
  body: string;
  fire_at: string;
  sent_at: string | null;
}

const REMINDER_COLUMNS = "id, title, body, fire_at, sent_at";

function toReminder(r: ReminderRow) {
  return { id: r.id, title: r.title, body: r.body, fireAt: r.fire_at, sentAt: r.sent_at };
}

async function getVapid() {
  const { data } = await db.from("push_config").select("public_key, private_key").eq("id", 1).maybeSingle();
  if (data) return data;

  // 동시 호출로 두 번 생성되더라도 먼저 저장된 키만 남는다
  const keys = webpush.generateVAPIDKeys();
  await db
    .from("push_config")
    .upsert({ id: 1, public_key: keys.publicKey, private_key: keys.privateKey }, { onConflict: "id", ignoreDuplicates: true });

  const { data: saved, error } = await db.from("push_config").select("public_key, private_key").eq("id", 1).single();
  if (error) throw error;
  return saved;
}

async function dispatch() {
  const vapid = await getVapid();
  const now = new Date().toISOString();

  // sent_at을 먼저 찍어 다음 cron 실행과 중복 발송되지 않게 한다
  const { data: due, error } = await db
    .from("push_reminders")
    .update({ sent_at: now })
    .is("sent_at", null)
    .lte("fire_at", now)
    .select("id, title, body, push_subscriptions (endpoint, p256dh, auth)");
  if (error) throw error;

  const expired: string[] = [];
  await Promise.all(
    (due ?? []).map(async (r) => {
      const sub = r.push_subscriptions as unknown as { endpoint: string; p256dh: string; auth: string } | null;
      if (!sub) return;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ id: r.id, title: r.title, body: r.body, url: "/alarm" }),
          { vapidDetails: { subject: "mailto:noreply@example.com", publicKey: vapid.public_key, privateKey: vapid.private_key } },
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // 404/410: 구독이 만료됨 (브라우저에서 알림 해제 등)
        if (status === 404 || status === 410) expired.push(sub.endpoint);
        else console.error("push failed", status, e);
      }
    }),
  );

  // 만료된 구독은 지우면 남은 알림도 cascade로 함께 지워진다
  if (expired.length > 0) await db.from("push_subscriptions").delete().in("endpoint", expired);

  // 일주일 넘은 발송 기록 정리
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await db.from("push_reminders").delete().lt("sent_at", weekAgo);

  return { due: due?.length ?? 0, expired: expired.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const body = await req.json();

    switch (body.action) {
      case "config": {
        const vapid = await getVapid();
        return json({ publicKey: vapid.public_key });
      }

      case "create": {
        const sub = body.subscription;
        const fireAt = new Date(body.fireAt);
        if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return json({ error: "구독 정보가 없습니다" }, 400);
        if (Number.isNaN(fireAt.getTime())) return json({ error: "시간이 올바르지 않습니다" }, 400);
        const title = String(body.title ?? "").trim().slice(0, 100) || "알림";
        const text = String(body.body ?? "").trim().slice(0, 300);

        const { error: subError } = await db
          .from("push_subscriptions")
          .upsert({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth });
        if (subError) throw subError;

        const { data, error } = await db
          .from("push_reminders")
          .insert({ endpoint: sub.endpoint, title, body: text, fire_at: fireAt.toISOString() })
          .select(REMINDER_COLUMNS)
          .single();
        if (error) throw error;
        return json({ reminder: toReminder(data) });
      }

      case "list": {
        if (!body.endpoint) return json({ reminders: [] });
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data, error } = await db
          .from("push_reminders")
          .select(REMINDER_COLUMNS)
          .eq("endpoint", body.endpoint)
          .or(`sent_at.is.null,sent_at.gte.${since}`)
          .order("fire_at", { ascending: true });
        if (error) throw error;
        return json({ reminders: data.map(toReminder) });
      }

      case "delete": {
        const { error } = await db.from("push_reminders").delete().eq("id", body.id).eq("endpoint", body.endpoint);
        if (error) throw error;
        return json({ ok: true });
      }

      case "dispatch":
        return json(await dispatch());

      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
