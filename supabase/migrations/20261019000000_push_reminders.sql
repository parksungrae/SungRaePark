-- /alarm 웹 푸시 알림
-- 모든 읽기/쓰기는 push-reminders Edge Function(service role)을 거친다.
-- RLS를 켜고 정책을 두지 않아 anon 키로는 직접 접근할 수 없다.

-- VAPID 키 한 쌍 (Edge Function이 첫 호출 때 생성해서 저장)
create table public.push_config (
  id int primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null
);

-- 브라우저별 푸시 구독 정보
create table public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- 예약된 알림
create table public.push_reminders (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null references public.push_subscriptions (endpoint) on delete cascade,
  title text not null,
  body text not null default '',
  fire_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index push_reminders_due_idx on public.push_reminders (fire_at) where sent_at is null;
create index push_reminders_endpoint_idx on public.push_reminders (endpoint);
create index push_reminders_sent_at_idx on public.push_reminders (sent_at);

alter table public.push_config enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_reminders enable row level security;

-- 1분마다 시간이 된 알림을 보낸다
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'push-reminders-dispatch',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://qswmxdbmzlupuvdypsxj.supabase.co/functions/v1/push-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"action": "dispatch"}'::jsonb
  );
  $$
);
