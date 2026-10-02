"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BackButton } from "../../components/BackButton";

/* ──────────────────────────────────────────────
 * 찍고 → 보내고 → AI가 쓰고 → 한 번에 올리는
 * 중고 상품 자동 등록 시스템 기획안
 * ────────────────────────────────────────────── */

/* ---------- 간소화 아이콘 (선 하나로 그린 그림) ---------- */

const IconPhone = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <rect x="18" y="6" width="28" height="52" rx="5" />
    <circle cx="32" cy="28" r="7" />
    <circle cx="32" cy="28" r="2.5" className="acc-fill" />
    <line x1="28" y1="51" x2="36" y2="51" />
  </svg>
);

const IconSend = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M18 40a10 10 0 0 1 2-19.8A14 14 0 0 1 46 22a9 9 0 0 1 0 18" />
    <path d="M32 50V30m-7 7 7-7 7 7" className="acc-stroke" />
  </svg>
);

const IconLaptop = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <rect x="12" y="14" width="40" height="27" rx="3" />
    <path d="M6 48h52l-4-7H10z" />
    <rect x="22" y="22" width="9" height="11" rx="1.5" className="acc-stroke" />
    <line x1="35" y1="24" x2="44" y2="24" />
    <line x1="35" y1="30" x2="42" y2="30" />
  </svg>
);

const IconSparkle = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M30 10c2 11 6 15 17 17-11 2-15 6-17 17-2-11-6-15-17-17 11-2 15-6 17-17z" className="acc-stroke" />
    <path d="M48 40c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z" />
  </svg>
);

const IconEdit = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <rect x="10" y="10" width="34" height="44" rx="3" />
    <line x1="17" y1="20" x2="36" y2="20" />
    <line x1="17" y1="28" x2="32" y2="28" />
    <line x1="17" y1="36" x2="28" y2="36" />
    <path d="M52 22 34 40l-3 9 9-3 18-18z" className="acc-stroke" />
  </svg>
);

const IconRocket = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <rect x="8" y="34" width="14" height="14" rx="3" />
    <rect x="25" y="34" width="14" height="14" rx="3" />
    <rect x="42" y="34" width="14" height="14" rx="3" />
    <path d="M32 26V8m-8 8 8-8 8 8" className="acc-stroke" />
    <path d="M15 34v-4h34v4M32 26v4" />
  </svg>
);

/* ---------- 데이터 ---------- */

const FLOW = [
  { icon: <IconPhone />, who: "폰", title: "촬영", desc: "앱/웹 카메라로 상품을 여러 장 찍는다" },
  { icon: <IconSend />, who: "폰 → 클라우드", title: "전송", desc: "찍는 즉시 업로드. 와이파이가 달라도 OK" },
  { icon: <IconLaptop />, who: "맥북", title: "수신", desc: "켜져 있는 데스크톱 앱 받은함에 실시간 도착" },
  { icon: <IconSparkle />, who: "AI", title: "초안 작성", desc: "'등록 시작'을 누르면 사진 보고 제목·설명·가격 제안" },
  { icon: <IconEdit />, who: "나", title: "수정·확인", desc: "사이즈·하자 등 AI가 모르는 것만 고친다" },
  { icon: <IconRocket />, who: "맥북 로봇", title: "자동 등록", desc: "후르츠 · 번개장터 · 인스타에 동시에 올린다" },
];

const LANES = [
  {
    tag: "A",
    name: "촬영 앱",
    where: "아이폰 / 안드로이드",
    stack: "PWA (Next.js 페이지) → 필요시 Expo 앱",
    items: ["카메라 연속 촬영", "사진 압축·회전 보정", "업로드 진행 표시", "상품 묶음(1상품 = N장)"],
  },
  {
    tag: "B",
    name: "중계소",
    where: "클라우드",
    stack: "Supabase (이미 세팅됨)",
    items: ["Storage: 원본 사진", "DB: 상품·등록 기록", "Realtime: 맥에 '새 상품' 알림", "공개 URL (인스타 API용)"],
  },
  {
    tag: "C",
    name: "데스크톱 앱",
    where: "맥북",
    stack: "로컬 Next.js → Electron 으로 포장",
    items: ["받은함 / 편집 화면", "Claude API로 초안 생성", "Playwright 등록 로봇", "결과 스크린샷 로그"],
  },
  {
    tag: "D",
    name: "판매처",
    where: "외부 서비스",
    stack: "웹 자동화 + 공식 API",
    items: ["번개장터 — Playwright", "후르츠패밀리 — Playwright (확인 필요)", "인스타그램 — Graph API 권장", "결과 URL 회수"],
  },
];

const STATUSES = [
  { key: "captured", label: "촬영됨", note: "폰에서 업로드 완료" },
  { key: "drafting", label: "AI 작성중", note: "등록 시작 클릭 후" },
  { key: "review", label: "검토 대기", note: "내가 고치는 단계" },
  { key: "posting", label: "등록중", note: "로봇이 플랫폼별 진행" },
  { key: "done", label: "완료", note: "3곳 URL 저장" },
];

const PLATFORMS = [
  {
    name: "번개장터",
    how: "Playwright 웹 자동화",
    level: 2,
    points: [
      "한 번 직접 로그인 → 세션(쿠키) 저장해서 재사용",
      "사진 업로드 · 카테고리 선택 · 가격 · 설명 · 태그 입력",
      "공식 등록 API 없음 → 화면 구조가 바뀌면 셀렉터 수정 필요",
    ],
  },
  {
    name: "후르츠패밀리",
    how: "Playwright (확인 필요)",
    level: 3,
    points: [
      "패션 특화 → 브랜드 · 사이즈 · 상태 항목이 중요",
      "웹 등록이 막혀 있으면: 앱 자동화(Appium) 또는 '복사해두기 + 수동' 으로 대체",
      "0단계에서 가장 먼저 조사할 항목",
    ],
  },
  {
    name: "인스타그램",
    how: "공식 Graph API (매크로는 백업)",
    level: 1,
    points: [
      "프로페셔널(비즈니스/크리에이터) 계정 + Meta 앱 등록",
      "캐러셀(여러 장) 게시 지원, 사진은 공개 URL 필요 → Supabase URL 사용",
      "매크로 로그인은 계정 정지 위험 ↑ → API가 훨씬 안전",
    ],
  },
];

/* ---------- 알림 모아보기 ---------- */

type PlatformKey = "fruits" | "bunjang" | "insta";
type NotiType = "chat" | "offer" | "like" | "comment" | "sold";

const NOTI_PLATFORMS: { key: PlatformKey; name: string; mark: string }[] = [
  { key: "fruits", name: "후르츠", mark: "F" },
  { key: "bunjang", name: "번개장터", mark: "B" },
  { key: "insta", name: "인스타", mark: "IG" },
];

const NOTI_TYPES: { key: NotiType; label: string }[] = [
  { key: "chat", label: "채팅·DM" },
  { key: "offer", label: "가격 제안" },
  { key: "like", label: "찜·좋아요" },
  { key: "comment", label: "댓글·문의" },
  { key: "sold", label: "판매·거래" },
];

type Noti = {
  id: number;
  platform: PlatformKey;
  type: NotiType;
  who: string;
  body: string;
  item: string;
  time: string;
  reply?: string;
};

const SAMPLE_NOTIS: Noti[] = [
  {
    id: 1,
    platform: "bunjang",
    type: "offer",
    who: "빈티지러버",
    body: "55,000원에 가능할까요? 오늘 바로 입금할게요",
    item: "나이키 ACG 플리스 자켓 L",
    time: "방금",
    reply: "안녕하세요! 60,000원까지는 가능해요. 오늘 입금 주시면 내일 바로 발송해 드릴게요 🙂",
  },
  {
    id: 2,
    platform: "insta",
    type: "comment",
    who: "@ootd.min",
    body: "실측 어깨 몇이에요?",
    item: "나이키 ACG 플리스 자켓 L",
    time: "4분 전",
    reply: "어깨 54cm / 가슴 63cm / 총장 72cm 입니다! DM 주시면 추가 사진 보내드릴게요.",
  },
  {
    id: 3,
    platform: "fruits",
    type: "chat",
    who: "kim_archive",
    body: "착용감 어떤가요? 175/70인데 맞을까요",
    item: "아워레가시 셔츠 48",
    time: "12분 전",
    reply: "175/70이면 48 사이즈가 살짝 여유 있게 맞으실 거예요. 제가 비슷한 체형인데 오버핏 느낌으로 입었어요.",
  },
  { id: 4, platform: "bunjang", type: "like", who: "익명", body: "상품을 찜했어요 (찜 7)", item: "아워레가시 셔츠 48", time: "20분 전" },
  { id: 5, platform: "insta", type: "like", who: "@daily_kicks 외 11명", body: "게시물을 좋아해요", item: "뉴발란스 993 270", time: "35분 전" },
  {
    id: 6,
    platform: "insta",
    type: "chat",
    who: "@seoul.vtg",
    body: "993 아직 판매중인가요?",
    item: "뉴발란스 993 270",
    time: "1시간 전",
    reply: "네 아직 판매중이에요! 번개장터/후르츠에도 올려뒀는데 DM으로 거래하셔도 괜찮아요.",
  },
  { id: 7, platform: "fruits", type: "sold", who: "후르츠", body: "주문이 들어왔어요 · 3일 안에 발송해 주세요", item: "스투시 8볼 후디 M", time: "2시간 전" },
  { id: 8, platform: "fruits", type: "like", who: "익명 3명", body: "상품을 좋아해요", item: "나이키 ACG 플리스 자켓 L", time: "3시간 전" },
];

const NOTI_SOURCES = [
  {
    platform: "인스타그램",
    how: "공식 Webhook",
    level: 1,
    points: [
      "Graph API 웹훅으로 댓글 · 멘션 실시간 수신",
      "DM은 Instagram Messaging API (프로페셔널 계정 + Meta 앱 권한)",
      "웹훅은 공개 HTTPS 주소가 필요 → Supabase Edge Function이 받아서 DB에 저장",
    ],
  },
  {
    platform: "번개장터",
    how: "로봇 폴링 (Playwright)",
    level: 2,
    points: [
      "등록 로봇과 같은 로그인 세션으로 알림 · 채팅 목록을 5~10분마다 확인",
      "이전에 본 알림 id와 비교해서 새 것만 저장 (중복 제거)",
      "공식 API 없음 → 너무 자주 확인하지 않기 (계정 보호)",
    ],
  },
  {
    platform: "후르츠패밀리",
    how: "폰 알림 미러링 (확인 필요)",
    level: 3,
    points: [
      "앱 중심 서비스 → 웹에서 알림 확인이 안 될 가능성 높음",
      "안드로이드: 알림 리스너 앱이 푸시 알림 내용을 Supabase로 전달",
      "아이폰은 다른 앱 알림을 읽을 수 없음 → 이메일 알림 파싱 or 앱 직접 확인",
    ],
  },
];

const NOTI_PIPE = [
  { title: "모으기", items: ["인스타 웹훅", "번장 폴링 로봇", "폰 알림 리스너"] },
  { title: "정리하기", items: ["notifications 테이블에 저장", "플랫폼 + 외부 id로 중복 제거", "등록 URL로 어떤 상품인지 연결"] },
  { title: "알려주기", items: ["맥 앱 알림함 (Realtime)", "macOS 시스템 알림", "가격 제안 · 주문은 폰 푸시"] },
];

/** 펼친 알림: 답장 초안 / 판매 시 나머지 내리기 / 그 외엔 열기만 */
function NotiDetail({ noti, platformName }: { noti: Noti; platformName: string }) {
  const openButton = <button>{platformName}에서 열기</button>;

  if (noti.reply) {
    return (
      <div className="nt-detail">
        <span className="nt-ai">✦ AI 답장 초안</span>
        <p>{noti.reply}</p>
        <div className="nt-actions">
          <button className="is-primary">수정 후 보내기</button>
          {openButton}
        </div>
      </div>
    );
  }

  if (noti.type === "sold") {
    return (
      <div className="nt-detail">
        <span className="nt-ai is-warn">⚠ 다른 곳에도 올라가 있어요</span>
        <p>번개장터 · 인스타 게시물을 &lsquo;판매완료&rsquo;로 바꿀까요? (중복 판매 방지)</p>
        <div className="nt-actions">
          <button className="is-primary">나머지 2곳 내리기</button>
          {openButton}
        </div>
      </div>
    );
  }

  return (
    <div className="nt-detail">
      <div className="nt-actions">{openButton}</div>
    </div>
  );
}

function NotifyDemo() {
  const [platform, setPlatform] = useState<PlatformKey | "all">("all");
  const [type, setType] = useState<NotiType | "all">("all");
  const [read, setRead] = useState<Set<number>>(() => new Set([5, 8]));
  const [openId, setOpenId] = useState<number | null>(1);

  const unreadBy = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    for (const n of SAMPLE_NOTIS) {
      if (read.has(n.id)) continue;
      counts.all += 1;
      counts[n.platform] = (counts[n.platform] ?? 0) + 1;
    }
    return counts;
  }, [read]);

  const list = SAMPLE_NOTIS.filter(
    (n) => (platform === "all" || n.platform === platform) && (type === "all" || n.type === type),
  );

  const byItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of SAMPLE_NOTIS) {
      if (!read.has(n.id)) map.set(n.item, (map.get(n.item) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [read]);

  const open = (id: number) => {
    setOpenId((cur) => (cur === id ? null : id));
    setRead((prev) => new Set(prev).add(id));
  };

  return (
    <div className="nt-demo">
      <div className="nt-bar">
        <div className="nt-tabs" role="tablist" aria-label="플랫폼">
          <button role="tab" aria-selected={platform === "all"} className={platform === "all" ? "on" : ""} onClick={() => setPlatform("all")}>
            전체 {unreadBy.all > 0 && <span className="nt-count">{unreadBy.all}</span>}
          </button>
          {NOTI_PLATFORMS.map((p) => (
            <button
              key={p.key}
              role="tab"
              aria-selected={platform === p.key}
              className={platform === p.key ? "on" : ""}
              onClick={() => setPlatform(p.key)}
            >
              <span className={`nt-mark is-${p.key}`}>{p.mark}</span>
              {p.name}
              {(unreadBy[p.key] ?? 0) > 0 && <span className="nt-count">{unreadBy[p.key]}</span>}
            </button>
          ))}
        </div>
        <button className="nt-readAll" onClick={() => setRead(new Set(SAMPLE_NOTIS.map((n) => n.id)))} disabled={unreadBy.all === 0}>
          모두 읽음
        </button>
      </div>

      <div className="nt-types">
        {[{ key: "all" as const, label: "모든 종류" }, ...NOTI_TYPES].map((t) => (
          <button key={t.key} className={type === t.key ? "on" : ""} onClick={() => setType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="nt-body">
        <ul className="nt-list">
          {list.length === 0 && <li className="nt-empty">이 조건의 알림이 없어요</li>}
          {list.map((n) => {
            const p = NOTI_PLATFORMS.find((x) => x.key === n.platform)!;
            const t = NOTI_TYPES.find((x) => x.key === n.type)!;
            const isOpen = openId === n.id;
            return (
              <li key={n.id} className={`nt-item ${read.has(n.id) ? "" : "is-unread"} ${isOpen ? "is-open" : ""} is-${n.type}`}>
                <button className="nt-row" onClick={() => open(n.id)} aria-expanded={isOpen}>
                  <span className={`nt-mark is-${n.platform}`} aria-label={p.name}>{p.mark}</span>
                  <span className="nt-main">
                    <span className="nt-meta">
                      <span className="nt-type">{t.label}</span>
                      <b>{n.who}</b>
                      <span className="nt-time">{n.time}</span>
                    </span>
                    <span className="nt-text">{n.body}</span>
                    <span className="nt-item-name">↳ {n.item}</span>
                  </span>
                  <span className="nt-dot" aria-hidden />
                </button>
                {isOpen && <NotiDetail noti={n} platformName={p.name} />}
              </li>
            );
          })}
        </ul>

        <aside className="nt-side">
          <b>상품별 안 읽은 알림</b>
          {byItem.length === 0 ? (
            <p className="nt-sideEmpty">다 확인했어요 👍</p>
          ) : (
            <ul>
              {byItem.map(([item, c]) => (
                <li key={item}>
                  <span>{item}</span>
                  <em>{c}</em>
                </li>
              ))}
            </ul>
          )}
          <p className="nt-sideNote">같은 상품에 온 알림은 플랫폼이 달라도 한 곳에 묶인다.</p>
        </aside>
      </div>
      <p className="nt-caption">※ 예시 데이터로 움직이는 데모. 알림을 누르면 읽음 처리 + AI 답장 초안이 열린다.</p>
    </div>
  );
}

/* ---------- 한 번에 관리 (삭제 · 상태 · 가격) ---------- */

type SaleStatus = "selling" | "reserved" | "sold";
type SyncState = "ok" | "pending" | "fail";

const SALE_STATUSES: { key: SaleStatus; label: string }[] = [
  { key: "selling", label: "판매중" },
  { key: "reserved", label: "예약중" },
  { key: "sold", label: "판매완료" },
];

type ManagedItem = {
  id: number;
  title: string;
  price: number;
  status: SaleStatus;
  sync: Partial<Record<PlatformKey, SyncState>>; // 키가 없으면 그 플랫폼엔 안 올린 상품
  deleting?: boolean;
};

const SAMPLE_ITEMS: ManagedItem[] = [
  { id: 1, title: "나이키 ACG 플리스 자켓 L", price: 68000, status: "selling", sync: { fruits: "ok", bunjang: "ok", insta: "ok" } },
  { id: 2, title: "아워레가시 셔츠 48", price: 129000, status: "selling", sync: { fruits: "ok", bunjang: "ok", insta: "ok" } },
  { id: 3, title: "뉴발란스 993 270", price: 189000, status: "reserved", sync: { fruits: "ok", bunjang: "ok", insta: "ok" } },
  { id: 4, title: "스투시 8볼 후디 M", price: 95000, status: "sold", sync: { fruits: "ok", bunjang: "ok" } },
  { id: 5, title: "포터 탱커 숄더백", price: 74000, status: "selling", sync: { bunjang: "ok", insta: "ok" } },
];

const MANAGE_ACTIONS = [
  {
    title: "가격 변경",
    short: "한 칸 고치면 3곳 가격이 같이 바뀐다",
    desc: "한 칸만 고치면 올라가 있는 모든 곳 가격이 바뀐다. 여러 개 골라 10% 내리기 같은 일괄 변경도.",
    how: "번장 · 후르츠: 수정 화면 자동 입력 / 인스타: 캡션의 가격 줄 수정",
  },
  {
    title: "상태 변경",
    short: "한 곳에서 팔리면 나머지도 판매완료",
    desc: "판매중 → 예약중 → 판매완료. 한 곳에서 팔리면 나머지도 자동으로 판매완료 처리.",
    how: "각 플랫폼의 상태 버튼을 로봇이 대신 누름 / 인스타: 캡션 맨 앞에 [판매완료]",
  },
  {
    title: "삭제",
    short: "3곳 게시물을 한 번에 내린다",
    desc: "판매를 접을 때 3곳 게시물을 한 번에 내린다. 내 DB 기록은 남겨서 나중에 다시 올리기 가능.",
    how: "등록 때 저장한 postings.url로 게시물을 찾아가서 삭제",
  },
];

const MANAGE_PLATFORMS = [
  { name: "번개장터", price: "로봇", status: "로봇 (예약중 · 판매완료)", del: "로봇", note: "등록 로봇과 같은 세션 · 셀렉터 재사용" },
  { name: "후르츠패밀리", price: "로봇 (확인 필요)", status: "로봇 (확인 필요)", del: "로봇 (확인 필요)", note: "웹 수정이 안 되면 '할 일 목록'으로 알려주고 수동 처리" },
  { name: "인스타그램", price: "캡션 수정 (확인 필요)", status: "캡션 앞에 [판매완료]", del: "API 제한 → 보관 or 수동", note: "공식 API로 되는 범위부터 0단계에서 확인" },
];

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

function ManageDemo() {
  const [items, setItems] = useState<ManagedItem[]>(SAMPLE_ITEMS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [log, setLog] = useState<string[]>(["스투시 8볼 후디 M · 후르츠에서 판매 → 번개장터도 판매완료 처리"]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const failedOnce = useRef(false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };

  /* 변경을 반영하고, 올라가 있는 플랫폼마다 순서대로 동기화되는 모습을 흉내 낸다 */
  type Patch = Partial<Pick<ManagedItem, "price" | "status">>;
  const apply = (ids: number[], patch: Patch | ((it: ManagedItem) => Patch), label: string) => {
    if (ids.length === 0) return;
    setItems((prev) =>
      prev.map((it) =>
        ids.includes(it.id)
          ? { ...it, ...(typeof patch === "function" ? patch(it) : patch), sync: Object.fromEntries(Object.keys(it.sync).map((k) => [k, "pending"])) }
          : it,
      ),
    );
    setLog((prev) => [label, ...prev].slice(0, 4));
    ids.forEach((id) => {
      NOTI_PLATFORMS.forEach((p, i) => {
        later(500 + i * 450 + Math.random() * 200, () => {
          // 데모: 번개장터 한 번은 일부러 실패시켜 재시도 흐름을 보여준다
          const fail = p.key === "bunjang" && !failedOnce.current;
          if (fail) failedOnce.current = true;
          setItems((prev) =>
            prev.map((it) =>
              it.id === id && it.sync[p.key] ? { ...it, sync: { ...it.sync, [p.key]: fail ? "fail" : "ok" } } : it,
            ),
          );
        });
      });
    });
  };

  const retry = (id: number, key: PlatformKey) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, sync: { ...it.sync, [key]: "pending" } } : it)));
    later(700, () =>
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, sync: { ...it.sync, [key]: "ok" } } : it))),
    );
  };

  const remove = (ids: number[]) => {
    const names = items.filter((it) => ids.includes(it.id)).map((it) => it.title);
    setItems((prev) =>
      prev.map((it) =>
        ids.includes(it.id)
          ? { ...it, deleting: true, sync: Object.fromEntries(Object.keys(it.sync).map((k) => [k, "pending"])) }
          : it,
      ),
    );
    later(1500, () => setItems((prev) => prev.filter((it) => !ids.includes(it.id))));
    setLog((prev) => [`${names.join(", ")} · 올라간 곳 전부에서 삭제`, ...prev].slice(0, 4));
    setSelected(new Set());
    setConfirmDelete(false);
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sel = items.filter((it) => selected.has(it.id) && !it.deleting);
  const selIds = sel.map((it) => it.id);
  const allChecked = items.length > 0 && sel.length === items.filter((it) => !it.deleting).length;

  return (
    <div className="mg-demo">
      <div className={`mg-bulk ${sel.length ? "is-on" : ""}`}>
        <label className="mg-checkAll">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={() => setSelected(allChecked ? new Set() : new Set(items.filter((it) => !it.deleting).map((it) => it.id)))}
          />
          {sel.length ? `${sel.length}개 선택` : "전체 선택"}
        </label>
        <div className="mg-bulkActions">
          <button
            disabled={!sel.length}
            onClick={() =>
              apply(selIds, (it) => ({ price: Math.round((it.price * 0.9) / 1000) * 1000 }), `${sel.length}개 상품 · 가격 10% 인하 (천 원 단위 반올림)`)
            }
          >
            가격 −10%
          </button>
          <button disabled={!sel.length} onClick={() => apply(selIds, { status: "reserved" }, `${sel.length}개 상품 · 예약중으로 변경`)}>
            예약중
          </button>
          <button disabled={!sel.length} onClick={() => apply(selIds, { status: "sold" }, `${sel.length}개 상품 · 판매완료로 변경`)}>
            판매완료
          </button>
          {confirmDelete ? (
            <>
              <button className="is-danger" onClick={() => remove(selIds)}>
                정말 삭제
              </button>
              <button onClick={() => setConfirmDelete(false)}>취소</button>
            </>
          ) : (
            <button className="is-dangerLine" disabled={!sel.length} onClick={() => setConfirmDelete(true)}>
              선택 삭제
            </button>
          )}
        </div>
      </div>

      <ul className="mg-list">
        {items.length === 0 && <li className="nt-empty">관리할 상품이 없어요</li>}
        {items.map((it) => (
          <li key={it.id} className={`mg-row ${it.deleting ? "is-deleting" : ""} ${it.status === "sold" ? "is-sold" : ""}`}>
            <input type="checkbox" aria-label={`${it.title} 선택`} checked={selected.has(it.id)} disabled={it.deleting} onChange={() => toggle(it.id)} />
            <span className="mg-thumb" aria-hidden />
            <span className="mg-title">{it.title}</span>
            <PriceInput
              value={it.price}
              disabled={it.deleting}
              onCommit={(v) => apply([it.id], { price: v }, `${it.title} · 가격 ${won(it.price)} → ${won(v)}`)}
            />
            <select
              className={`mg-status is-${it.status}`}
              value={it.status}
              disabled={it.deleting}
              aria-label="판매 상태"
              onChange={(e) => {
                const s = e.target.value as SaleStatus;
                apply([it.id], { status: s }, `${it.title} · ${SALE_STATUSES.find((x) => x.key === s)!.label}로 변경`);
              }}
            >
              {SALE_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="mg-sync">
              {NOTI_PLATFORMS.map((p) => {
                const st = it.sync[p.key];
                if (!st) return <span key={p.key} className="mg-pf is-none" title={`${p.name}: 안 올림`}>{p.mark}</span>;
                return st === "fail" ? (
                  <button key={p.key} className={`mg-pf is-fail`} title={`${p.name}: 실패 — 눌러서 재시도`} onClick={() => retry(it.id, p.key)}>
                    {p.mark} ↻
                  </button>
                ) : (
                  <span key={p.key} className={`mg-pf is-${p.key} is-${st}`} title={`${p.name}: ${st === "ok" ? "반영됨" : "반영중"}`}>
                    {p.mark}
                  </span>
                );
              })}
            </span>
            {it.deleting && <span className="mg-deleting">삭제 중…</span>}
          </li>
        ))}
      </ul>

      <div className="mg-foot">
        <span className="mg-legend">
          <span className="mg-pf is-bunjang is-ok">B</span> 반영됨
          <span className="mg-pf is-bunjang is-pending">B</span> 반영중
          <span className="mg-pf is-fail">B ↻</span> 실패 · 재시도
          <span className="mg-pf is-none">B</span> 안 올림
        </span>
        <div className="mg-log">
          <b>최근 작업</b>
          <ul>
            {log.map((l, i) => (
              <li key={`${l}-${i}`}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="nt-caption">※ 예시 데이터로 움직이는 데모. 가격 칸을 고치고 Enter, 상태를 바꾸거나 여러 개 골라 일괄 처리해 보세요.</p>
    </div>
  );
}

function PriceInput({ value, disabled, onCommit }: { value: number; disabled?: boolean; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setDraft(String(value));
  }
  const commit = () => {
    const v = Number(draft.replace(/[^0-9]/g, ""));
    if (v > 0 && v !== value) onCommit(v);
    else setDraft(String(value));
  };
  return (
    <span className="mg-price">
      <input
        inputMode="numeric"
        aria-label="가격"
        value={Number(draft || 0).toLocaleString("ko-KR")}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      원
    </span>
  );
}

const ROADMAP = [
  { step: "0", days: 3, title: "조사", time: "2~3일", goal: "후르츠 웹 등록 가능 여부, 번장 등록 화면 구조, 인스타 API 승인 조건 확인" },
  { step: "1", days: 5, title: "찍으면 맥에 뜬다", time: "1주", goal: "폰 촬영 페이지 → Supabase 업로드 → 맥 받은함에 실시간 표시" },
  { step: "2", days: 5, title: "AI 초안 + 편집", time: "1주", goal: "등록 시작 → Claude가 사진 보고 JSON 초안 → 편집 폼에서 수정·저장" },
  { step: "3", days: 5, title: "번개장터 자동 등록", time: "1주", goal: "Playwright 로그인 세션 저장, 등록 스크립트, 실패 시 스크린샷" },
  { step: "4", days: 4, title: "인스타 게시", time: "3~4일", goal: "Graph API 캐러셀 게시, 해시태그 자동 생성" },
  { step: "5", days: 5, title: "후르츠 등록", time: "1주", goal: "0단계 결과에 따라 웹 자동화 또는 대체 경로" },
  { step: "6", days: 5, title: "알림 모아보기", time: "1주", goal: "인스타 웹훅 → 번장 폴링 → 후르츠 알림 미러링 순서로 붙이고, 알림함 + AI 답장 초안" },
  { step: "7", days: 5, title: "한 번에 관리", time: "1주", goal: "가격 · 상태 · 삭제를 플랫폼별 수정 로봇으로 반영, 판매 알림 → 나머지 자동 판매완료" },
  { step: "8", days: 0, title: "다듬기", time: "계속", goal: "재시도 큐, 템플릿, 오래된 상품 가격 인하 제안, Electron 앱 포장" },
];

const RISKS = [
  { risk: "플랫폼 이용약관 위반 / 계정 제재", fix: "사람 속도 흉내(딜레이), 하루 등록 수 제한, 인스타는 공식 API 사용" },
  { risk: "사이트 화면이 바뀌어 로봇이 고장", fix: "플랫폼별 스크립트 분리, 실패 시 스크린샷 + 알림, 셀렉터 한 파일에 모으기" },
  { risk: "캡차 / 2단계 인증", fix: "브라우저 창을 띄운 채(headful) 실행, 막히면 사람이 이어서 처리" },
  { risk: "AI가 사이즈·하자를 잘못 씀", fix: "AI가 모르는 칸은 비워두고 '확인 필요' 표시, 사람 검토 없이는 등록 불가" },
  { risk: "맥이 꺼져 있을 때 촬영", fix: "클라우드에 쌓아뒀다가 맥이 켜지면 받은함에 한꺼번에 표시" },
  { risk: "알림 폴링이 너무 잦아 계정이 의심받음", fix: "5~10분 간격 + 랜덤 지연, 맥이 잠자기면 멈춤, 가능한 곳은 웹훅·푸시 미러링 우선" },
  { risk: "한 곳에서 팔렸는데 다른 곳에서 또 팔림", fix: "판매 알림이 오면 나머지 플랫폼 '판매완료' 처리를 바로 제안" },
  { risk: "앱에서 직접 고친 내용과 내 DB가 어긋남", fix: "하루 한 번 각 플랫폼 게시물을 읽어와 가격 · 상태 비교, 다르면 '어느 쪽이 맞나요?' 표시" },
  { risk: "삭제는 되돌릴 수 없음", fix: "선택 삭제는 한 번 더 확인, DB 기록은 지우지 않고 보관 → 다시 올리기 가능" },
];

const QUESTIONS = [
  "촬영 쪽은 PWA(설치 없이 웹)로 시작해도 될까? 네이티브 앱이 꼭 필요한가?",
  "데스크톱은 '맥에서 localhost 웹'으로 시작 → 나중에 Electron, 이 순서 괜찮은가?",
  "인스타 계정을 프로페셔널 계정으로 바꿀 수 있는가? (API 사용 조건)",
  "가격은 AI가 제안만? 아니면 시세 검색(번장 검색)까지 붙일까?",
  "등록 직전 '최종 확인' 단계를 플랫폼마다 둘까, 한 번에 둘까?",
  "알림 미러링용으로 안드로이드 공기계를 쓸 수 있는가? (아이폰만 있으면 후르츠 알림은 수동)",
  "가격을 바꿀 때 플랫폼마다 다르게 둘까? (수수료 차이만큼 후르츠는 +α 등)",
  "AI 답장은 초안만? 아니면 '판매중인가요?' 같은 단순 문의는 자동 답장까지?",
];

const AI_OUTPUT = `{
  "title": "나이키 ACG 플리스 자켓 L 블랙",
  "brand": "Nike",
  "category": "남성의류 > 아우터",
  "size": null,            // 확인 필요
  "condition": "상태 좋음",
  "defects": null,         // 확인 필요
  "price_suggest": 68000,
  "description": "…플랫폼 톤에 맞춘 본문…",
  "hashtags": ["#나이키", "#ACG", "#플리스"]
}`;

/* ---------- 화면 기획 그림 ---------- */

function PhoneMock() {
  return (
    <svg viewBox="0 0 260 500" className="rs-mock" role="img" aria-label="폰 촬영 화면 스케치">
      <rect x="10" y="10" width="240" height="480" rx="32" className="m-line" />
      <rect x="100" y="22" width="60" height="8" rx="4" className="m-soft" />
      {/* 상단 연결 상태 */}
      <circle cx="40" cy="56" r="5" className="acc-fill" />
      <text x="52" y="60" className="m-text">MacBook 연결됨</text>
      <text x="220" y="60" className="m-text" textAnchor="end">상품 #12</text>
      {/* 뷰파인더 */}
      <rect x="28" y="76" width="204" height="250" rx="12" className="m-soft" />
      <path d="M100 130 l-30 22 12 18 14-8 v92 h68 v-92 l14 8 12-18 -30-22 q-15 12-30 0z" className="m-line" />
      <path d="M40 92h18M40 92v18M220 92h-18M220 92v18M40 310h18M40 310v-18M220 310h-18M220 310v-18" className="m-line" />
      {/* 찍은 사진 썸네일 */}
      <rect x="28" y="340" width="40" height="40" rx="6" className="m-soft" />
      <rect x="74" y="340" width="40" height="40" rx="6" className="m-soft" />
      <rect x="120" y="340" width="40" height="40" rx="6" className="m-soft" />
      <rect x="166" y="340" width="40" height="40" rx="6" className="m-dash" />
      <text x="186" y="365" className="m-text" textAnchor="middle">+</text>
      {/* 셔터 */}
      <circle cx="130" cy="420" r="28" className="m-line" />
      <circle cx="130" cy="420" r="21" className="acc-fill" />
      <text x="60" y="425" className="m-text" textAnchor="middle">3장</text>
      {/* 전송 버튼 */}
      <rect x="168" y="404" width="64" height="32" rx="16" className="m-line" />
      <text x="200" y="424" className="m-text" textAnchor="middle">보내기</text>
      <text x="130" y="472" className="m-text m-dim" textAnchor="middle">찍을 때마다 자동 업로드</text>
      {/* 번호 */}
      <Marker x={26} y={44} n={1} />
      <Marker x={40} y={334} n={2} />
      <Marker x={232} y={398} n={3} />
    </svg>
  );
}

function DesktopMock() {
  return (
    <svg viewBox="0 0 820 500" className="rs-mock" role="img" aria-label="맥 데스크톱 편집 화면 스케치">
      <rect x="10" y="10" width="800" height="480" rx="14" className="m-line" />
      <line x1="10" y1="44" x2="810" y2="44" className="m-line" />
      <circle cx="32" cy="27" r="5" className="m-soft" />
      <circle cx="50" cy="27" r="5" className="m-soft" />
      <circle cx="68" cy="27" r="5" className="m-soft" />
      <text x="410" y="31" className="m-text" textAnchor="middle">상품 등록 · 데스크톱</text>

      {/* 받은함 */}
      <line x1="200" y1="44" x2="200" y2="490" className="m-line" />
      <text x="26" y="72" className="m-text m-bold">받은함</text>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(22 ${88 + i * 64})`}>
          <rect width="164" height="54" rx="8" className={i === 0 ? "acc-stroke m-noFill" : "m-soft"} />
          <rect x="8" y="8" width="38" height="38" rx="5" className={i === 0 ? "m-soft" : "m-line"} />
          <rect x="54" y="14" width="70" height="7" rx="3" className="m-bar" />
          <rect x="54" y="30" width={i === 0 ? 46 : 36} height="12" rx="6" className={i === 0 ? "acc-fill" : "m-bar"} />
        </g>
      ))}
      <text x="78" y="128" className="m-tiny m-onAcc">새로 옴</text>

      {/* 사진 영역 */}
      <rect x="222" y="66" width="240" height="240" rx="10" className="m-soft" />
      <path d="M312 120 l-30 22 12 18 14-8 v92 h68 v-92 l14 8 12-18 -30-22 q-15 12-30 0z" className="m-line" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={222 + i * 62} y="318" width="54" height="54" rx="6" className="m-soft" />
      ))}
      <rect x="222" y="392" width="240" height="40" rx="20" className="acc-fill" />
      <text x="342" y="417" className="m-text m-onAcc" textAnchor="middle">✦ 상품 등록 시작 (AI 작성)</text>

      {/* 편집 폼 */}
      <text x="486" y="80" className="m-tiny m-dim">제목</text>
      <rect x="486" y="88" width="300" height="30" rx="6" className="m-line m-noFill" />
      <rect x="496" y="99" width="180" height="8" rx="3" className="m-bar" />
      <text x="486" y="140" className="m-tiny m-dim">가격 · 카테고리 · 사이즈</text>
      <rect x="486" y="148" width="92" height="30" rx="6" className="m-line m-noFill" />
      <rect x="590" y="148" width="92" height="30" rx="6" className="m-line m-noFill" />
      <rect x="694" y="148" width="92" height="30" rx="6" className="acc-stroke m-noFill m-dashA" />
      <text x="740" y="168" className="m-tiny acc-text" textAnchor="middle">확인 필요</text>
      <text x="486" y="200" className="m-tiny m-dim">설명 (AI 초안)</text>
      <rect x="486" y="208" width="300" height="120" rx="6" className="m-line m-noFill" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="498" y={222 + i * 17} width={[260, 240, 270, 200, 250, 150][i]} height="7" rx="3" className="m-bar" />
      ))}

      {/* 플랫폼 선택 */}
      <text x="486" y="352" className="m-tiny m-dim">올릴 곳</text>
      {["후르츠", "번개장터", "인스타"].map((p, i) => (
        <g key={p} transform={`translate(${486 + i * 102} 360)`}>
          <rect width="94" height="32" rx="16" className="m-line m-noFill" />
          <rect x="10" y="9" width="14" height="14" rx="3" className="acc-fill" />
          <path d="M13 16l3 3 6-6" className="m-check" />
          <text x="32" y="21" className="m-tiny">{p}</text>
        </g>
      ))}
      <rect x="486" y="412" width="300" height="44" rx="10" className="m-solid" />
      <text x="636" y="439" className="m-text m-onSolid" textAnchor="middle">상품등록 완료 → 자동 업로드</text>

      <Marker x={30} y={58} n={1} />
      <Marker x={232} y={384} n={2} />
      <Marker x={476} y={74} n={3} />
      <Marker x={476} y={346} n={4} />
      <Marker x={476} y={406} n={5} />
    </svg>
  );
}

function Marker({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="10" className="m-marker" />
      <text y="4" className="m-markerText" textAnchor="middle">{n}</text>
    </g>
  );
}

/* ---------- 페이지 ---------- */

/* ---------- 강조 · 접기 · 작은 부품 ---------- */

const TOC = [
  { id: "s-01", label: "흐름" },
  { id: "s-02", label: "구조" },
  { id: "s-03", label: "화면" },
  { id: "s-04", label: "AI" },
  { id: "s-05", label: "상태" },
  { id: "s-06", label: "등록" },
  { id: "s-07", label: "알림" },
  { id: "s-08", label: "관리" },
  { id: "s-09", label: "순서" },
  { id: "s-10", label: "위험" },
  { id: "s-11", label: "질문" },
];

const PF_KEY: Record<string, PlatformKey> = { 후르츠패밀리: "fruits", 번개장터: "bunjang", 인스타그램: "insta" };
const PF_MARK: Record<PlatformKey, string> = { fruits: "F", bunjang: "B", insta: "IG" };

/** 형광펜 강조 */
function Hl({ children }: { children: ReactNode }) {
  return <mark className="rs-hl">{children}</mark>;
}

function Chevron() {
  return (
    <svg viewBox="0 0 16 16" className="rs-chev" aria-hidden>
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

/** 눌러서 펼치는 상세 */
function More({ label = "자세히", boxed, children }: { label?: string; boxed?: boolean; children: ReactNode }) {
  return (
    <details className={`rs-more ${boxed ? "is-boxed" : ""}`}>
      <summary>
        <span>{label}</span>
        <Chevron />
      </summary>
      <div className="rs-moreBody">{children}</div>
    </details>
  );
}

function Callout({ q, a, children }: { q: string; a: string; children: ReactNode }) {
  return (
    <div className="rs-callout">
      <span className="rs-calloutQ">{q}</span>
      <b>{a}</b>
      <More label="이유">
        <p className="rs-moreText">{children}</p>
      </More>
    </div>
  );
}

function Pill({ icon, title, acc, children }: { icon: string; title: string; acc?: boolean; children: ReactNode }) {
  return (
    <div className={`rs-pill ${acc ? "is-acc" : ""}`}>
      <span className="rs-pillIcon" aria-hidden>{icon}</span>
      <b>{title}</b>
      <span className="rs-pillText">{children}</span>
    </div>
  );
}

function PlatformCard({ name, how, level, points }: { name: string; how: string; level: number; points: string[] }) {
  const key = PF_KEY[name];
  const check = how.includes("확인 필요");
  return (
    <div className="rs-platform">
      <div className="rs-platformTop">
        <span className={`nt-mark is-${key} rs-pfMark`}>{PF_MARK[key]}</span>
        <h3>{name}</h3>
        <span className="rs-level" aria-label={`난이도 ${level}/3`}>
          {[1, 2, 3].map((n) => (
            <i key={n} className={n <= level ? "on" : ""} />
          ))}
        </span>
      </div>
      <p className="rs-platformHow">
        {how.replace(/\s*\(확인 필요\)/, "")}
        {check && <span className="rs-warnTag">확인 필요</span>}
      </p>
      <More>
        <ul className="rs-dots">
          {points.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>
      </More>
    </div>
  );
}

/** "로봇 (확인 필요)" → 로봇 + 경고 태그 */
function Tag({ text }: { text: string }) {
  const check = text.includes("확인 필요");
  const main = text.replace(/\s*\(확인 필요\)/, "");
  return (
    <span className="rs-cell">
      {main}
      {check && <span className="rs-warnTag">확인 필요</span>}
    </span>
  );
}

/* ---------- 추가 아이콘 ---------- */

const IconCloud = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M18 46a11 11 0 0 1 1-22 15 15 0 0 1 28 2 10 10 0 0 1 0 20z" />
    <path d="M26 36h12M26 30h8" className="acc-stroke" />
  </svg>
);

const IconStore = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M10 24l4-12h36l4 12" />
    <path d="M10 24a7 7 0 0 0 14 0 7 7 0 0 0 16 0 7 7 0 0 0 14 0" />
    <path d="M14 30v22h36V30" />
    <rect x="27" y="38" width="10" height="14" className="acc-stroke" />
  </svg>
);

const IconBell = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M18 44V30a14 14 0 0 1 28 0v14l4 4H14z" />
    <path d="M27 52a5 5 0 0 0 10 0" />
    <circle cx="46" cy="18" r="6" className="acc-fill" />
  </svg>
);

const IconSliders = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M12 18h40M12 32h40M12 46h40" />
    <circle cx="24" cy="18" r="5" className="acc-stroke" />
    <circle cx="42" cy="32" r="5" className="acc-stroke" />
    <circle cx="30" cy="46" r="5" className="acc-stroke" />
  </svg>
);

const IconInbox = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M10 36l8-22h28l8 22v14H10z" />
    <path d="M10 36h14l3 6h10l3-6h14" className="acc-stroke" />
  </svg>
);

const IconFilter = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M10 14h44L38 34v14l-12 6V34z" />
    <path d="M30 22h4" className="acc-stroke" />
  </svg>
);

const IconPrice = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M34 8h20v20L28 54 8 34z" />
    <circle cx="44" cy="18" r="4" className="acc-stroke" />
  </svg>
);

const IconSwap = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M12 22h36l-8-8M52 42H16l8 8" />
    <circle cx="32" cy="32" r="4" className="acc-fill" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 64 64" className="rs-icon" aria-hidden>
    <path d="M12 18h40M26 18v-6h12v6M16 18l3 36h26l3-36" />
    <path d="M28 28v16M36 28v16" className="acc-stroke" />
  </svg>
);

const LANE_ICONS = [<IconPhone key="a" />, <IconCloud key="b" />, <IconLaptop key="c" />, <IconStore key="d" />];
const PIPE_ICONS = [<IconInbox key="a" />, <IconFilter key="b" />, <IconBell key="c" />];
const MANAGE_ICONS = [<IconPrice key="a" />, <IconSwap key="b" />, <IconTrash key="c" />];

/* ---------- 그림 ---------- */

/** 히어로: 폰 → 맥 → 3곳 */
function HeroArt() {
  const tiles: { key: PlatformKey; y: number }[] = [
    { key: "fruits", y: 34 },
    { key: "bunjang", y: 104 },
    { key: "insta", y: 174 },
  ];
  return (
    <svg viewBox="0 0 400 250" className="rs-heroArt" role="img" aria-label="폰에서 찍은 사진이 맥을 거쳐 세 플랫폼에 올라가는 그림">
      {/* 폰 */}
      <rect x="14" y="62" width="62" height="118" rx="12" className="h-line" />
      <rect x="22" y="78" width="46" height="62" rx="6" className="h-soft" />
      <path d="M38 94 l-8 6 3 5 4-2 v20 h14 v-20 l4 2 3-5 -8-6 q-6 4-12 0z" className="h-line h-thin" />
      <circle cx="45" cy="160" r="8" className="h-acc" />
      {/* 흐름선 1 */}
      <path d="M86 121 C 110 121, 112 121, 134 121" className="h-flow" />
      {/* 맥 */}
      <rect x="140" y="78" width="110" height="74" rx="8" className="h-line" />
      <path d="M128 162h134l-8-10H136z" className="h-line" />
      <rect x="150" y="88" width="34" height="34" rx="4" className="h-soft" />
      <rect x="190" y="90" width="50" height="6" rx="3" className="h-bar" />
      <rect x="190" y="102" width="38" height="6" rx="3" className="h-bar" />
      <rect x="150" y="130" width="90" height="14" rx="7" className="h-acc" />
      <text x="195" y="140" className="h-onAcc" textAnchor="middle">✦ AI 작성</text>
      {/* 흐름선 3갈래 */}
      {tiles.map((t) => (
        <path key={t.key} d={`M262 121 C 300 121, 296 ${t.y + 21}, 322 ${t.y + 21}`} className="h-flow" />
      ))}
      {/* 플랫폼 타일 */}
      {tiles.map((t) => (
        <g key={t.key} transform={`translate(326 ${t.y})`}>
          <rect width="58" height="42" rx="10" className={`h-pf is-${t.key}`} />
          <text x="29" y="27" className="h-pfText" textAnchor="middle">{PF_MARK[t.key]}</text>
          <circle cx="54" cy="4" r="9" className="h-check" />
          <path d="M50 4l3 3 5-5" className="h-checkMark" />
        </g>
      ))}
    </svg>
  );
}

/** 관리: 한 번 고치면 3곳 반영 */
function FanOutArt() {
  const rows: { key: PlatformKey; name: string; y: number }[] = [
    { key: "fruits", name: "후르츠", y: 14 },
    { key: "bunjang", name: "번개장터", y: 68 },
    { key: "insta", name: "인스타", y: 122 },
  ];
  return (
    <svg viewBox="0 0 640 170" className="rs-fanArt" role="img" aria-label="가격을 한 번 고치면 세 플랫폼 가격이 함께 바뀌는 그림">
      <rect x="10" y="44" width="220" height="82" rx="14" className="h-line" />
      <text x="28" y="72" className="h-small h-dim">가격</text>
      <text x="28" y="104" className="h-big h-strike">68,000</text>
      <text x="104" y="104" className="h-big h-accText">→ 61,000</text>
      <path d="M240 85 h40" className="h-flow" />
      <circle cx="300" cy="85" r="18" className="h-acc" />
      <text x="300" y="91" className="h-onAcc h-mid" textAnchor="middle">1번</text>
      {rows.map((r) => (
        <g key={r.key}>
          <path d={`M318 85 C 360 85, 350 ${r.y + 17}, 392 ${r.y + 17}`} className="h-flow" />
          <g transform={`translate(396 ${r.y})`}>
            <rect width="230" height="34" rx="10" className="h-soft" />
            <rect x="8" y="7" width="20" height="20" rx="6" className={`h-pf is-${r.key}`} />
            <text x="18" y="21" className="h-pfText h-tiny" textAnchor="middle">{PF_MARK[r.key]}</text>
            <text x="38" y="22" className="h-small">{r.name}</text>
            <text x="186" y="22" className="h-small h-mono" textAnchor="end">61,000</text>
            <circle cx="210" cy="17" r="8" className="h-check" />
            <path d="M206 17l3 3 5-5" className="h-checkMark" />
          </g>
        </g>
      ))}
    </svg>
  );
}

/** 만드는 순서 막대 그래프 (작업일 기준) */
/* 막대 시작 위치 = 앞 단계 기간의 합 (기간 미정인 '계속'은 4일로 그림) */
const GANTT = ROADMAP.map((r, i) => ({
  ...r,
  w: r.days || 4,
  left: ROADMAP.slice(0, i).reduce((sum, x) => sum + (x.days || 4), 0),
}));
const GANTT_TOTAL = GANTT.reduce((sum, r) => sum + r.w, 0);

function Gantt() {
  return (
    <div className="rs-gantt" role="img" aria-label="단계별 예상 기간 막대 그래프">
      {GANTT.map((r) => {
        const barClass = [
          "rs-ganttBar",
          r.step === "0" && "is-first",
          !r.days && "is-open",
          ["6", "7"].includes(r.step) && "is-new",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div key={r.step} className="rs-ganttRow">
            <span className="rs-ganttLabel">
              <em>{r.step}</em> {r.title}
            </span>
            <span className="rs-ganttTrack">
              <span
                className={barClass}
                style={{ left: `${(r.left / GANTT_TOTAL) * 100}%`, width: `${(r.w / GANTT_TOTAL) * 100}%` }}
              />
            </span>
          </div>
        );
      })}
      <div className="rs-ganttAxis">
        <span>시작</span>
        <span>약 7주</span>
        <span>계속</span>
      </div>
    </div>
  );
}

export default function ResellPlanPage() {
  return (
    <div className="rs-page">
      <div className="rs-back">
        <BackButton />
      </div>

      <main className="rs-main">
        {/* HERO */}
        <header className="rs-hero">
          <div className="rs-heroText">
            <p className="rs-label">plan · 중고 상품 자동 등록</p>
            <h1 className="rs-title">
              찍으면,
              <br />
              <span className="acc-text">세 군데</span>에 올라간다.
            </h1>
            <p className="rs-lead">
              폰으로 찍고, AI가 쓰고, 버튼 하나로 <Hl>후르츠 · 번개장터 · 인스타</Hl>에 동시 등록.
              <br />
              올린 뒤의 <b>알림 · 가격 · 상태 · 삭제</b>도 한 화면에서.
            </p>
          </div>
          <HeroArt />
        </header>

        <div className="rs-kpis">
          <div><strong>1번</strong><span>촬영</span></div>
          <div><strong>1번</strong><span>검토</span></div>
          <div className="is-acc"><strong>3곳</strong><span>자동 등록</span></div>
          <div><strong>1곳</strong><span>알림 모아보기</span></div>
          <div><strong>1번</strong><span>수정 · 삭제</span></div>
        </div>

        <nav className="rs-toc" aria-label="목차">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`}>
              <em>{t.id.slice(2)}</em>
              {t.label}
            </a>
          ))}
        </nav>

        {/* 1. FLOW */}
        <section className="rs-section" id="s-01">
          <SectionHead n="01" title="한눈에 보는 흐름" sub={<>사람이 하는 일은 <Hl>① 찍기 ⑤ 고치기</Hl> 두 가지뿐</>} />
          <ol className="rs-flow">
            {FLOW.map((f, i) => (
              <li key={f.title} className={`rs-step ${i === 0 || i === 4 ? "is-human" : ""}`}>
                <div className="rs-stepIcon">{f.icon}</div>
                <span className="rs-stepWho">{f.who}</span>
                <span className="rs-stepTitle">
                  <em>{i + 1}</em> {f.title}
                </span>
                <span className="rs-stepDesc">{f.desc}</span>
              </li>
            ))}
          </ol>
          <p className="rs-legend">
            <span className="rs-dot is-human" /> 사람이 하는 단계 <span className="rs-dot" /> 자동
          </p>
        </section>

        {/* 2. ARCHITECTURE */}
        <section className="rs-section" id="s-02">
          <SectionHead n="02" title="시스템 구조" sub={<>폰과 맥은 직접 연결하지 않고 <Hl>클라우드를 우체통처럼</Hl> 쓴다</>} />
          <div className="rs-lanes">
            {LANES.map((l, i) => (
              <div key={l.tag} className="rs-laneWrap">
                <div className={`rs-lane ${l.tag === "C" ? "is-core" : ""}`}>
                  <div className="rs-laneTop">
                    <span className="rs-laneTag">{l.tag}</span>
                    <span className="rs-laneWhere">{l.where}</span>
                  </div>
                  <div className="rs-laneIcon">{LANE_ICONS[i]}</div>
                  <h3 className="rs-laneName">{l.name}</h3>
                  <p className="rs-laneStack">{l.stack}</p>
                  <More label="하는 일">
                    <ul className="rs-dots">
                      {l.items.map((it) => (
                        <li key={it}>{it}</li>
                      ))}
                    </ul>
                  </More>
                </div>
                {i < LANES.length - 1 && <span className="rs-laneArrow" aria-hidden>→</span>}
              </div>
            ))}
          </div>
          <div className="rs-callouts">
            <Callout q="왜 클라우드를 거치나?" a="와이파이가 달라도 OK, 맥이 꺼져 있어도 사진이 쌓여 있다.">
              레포에 Supabase 클라이언트가 이미 있어서 Storage · DB · Realtime을 바로 쓸 수 있다.
            </Callout>
            <Callout q="왜 맥에서 로봇을 돌리나?" a="평소 로그인된 내 브라우저 = 계정 차단 위험 ↓">
              Playwright는 진짜 브라우저를 띄워야 해서 서버리스(Vercel)에선 로그인 유지가 어렵다.
            </Callout>
          </div>
        </section>

        {/* 3. SCREENS */}
        <section className="rs-section" id="s-03">
          <SectionHead n="03" title="화면 기획" sub={<>화면은 딱 <Hl>두 개</Hl> — 폰 촬영 + 맥 편집</>} />
          <div className="rs-screens">
            <figure className="rs-screen is-phone">
              <PhoneMock />
              <figcaption>
                <b>폰 · 촬영</b>
                <More label="번호별 설명">
                  <ol>
                    <li>맥 연결 상태와 지금 찍는 상품 번호</li>
                    <li>찍은 사진이 바로 썸네일로 쌓임 (= 한 상품)</li>
                    <li>보내기 → 다음 상품으로 넘어감</li>
                  </ol>
                </More>
              </figcaption>
            </figure>
            <figure className="rs-screen is-desktop">
              <DesktopMock />
              <figcaption>
                <b>맥 · 받은함 & 편집</b>
                <More label="번호별 설명">
                  <ol>
                    <li>폰에서 온 상품이 실시간으로 도착</li>
                    <li>상품 등록 시작 → AI가 사진 보고 초안 작성</li>
                    <li>모든 칸 수정 가능, AI가 모르는 칸은 &lsquo;확인 필요&rsquo;</li>
                    <li>올릴 플랫폼 체크</li>
                    <li>상품등록 완료 → 로봇이 순서대로 업로드</li>
                  </ol>
                </More>
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 4. AI */}
        <section className="rs-section" id="s-04">
          <SectionHead n="04" title="AI가 써주는 것" sub={<>사진 → Claude → <Hl>편집 폼에 그대로 채워지는 JSON</Hl></>} />
          <div className="rs-ai">
            <div className="rs-aiIn">
              <div className="rs-aiPhotos">
                {[0, 1, 2].map((i) => (
                  <svg key={i} viewBox="0 0 60 60" className="rs-aiPhoto" aria-hidden>
                    <rect x="1" y="1" width="58" height="58" rx="8" />
                    <path d="M24 16 l-10 8 4 6 5-3 v20 h14 v-20 l5 3 4-6 -10-8 q-6 5-12 0z" />
                  </svg>
                ))}
              </div>
              <span className="rs-aiPlus">+</span>
              <div className="rs-aiHint">
                <b>규칙</b>
                <span>플랫폼별 말투 · 금지어 · 카테고리 · 내 템플릿</span>
              </div>
            </div>
            <span className="rs-aiArrow" aria-hidden>
              <IconSparkle />
            </span>
            <pre className="rs-code">{AI_OUTPUT}</pre>
          </div>
          <div className="rs-pills">
            <Pill icon="✎" title="같은 상품, 다른 글">후르츠는 브랜드 · 핏, 번장은 상태 · 거래방법, 인스타는 짧게 + 해시태그.</Pill>
            <Pill icon="?" title="모르면 비운다" acc>사이즈 · 실측 · 하자는 지어내지 않고 &lsquo;확인 필요&rsquo;로 둔다.</Pill>
            <Pill icon="₩" title="1개당 몇십 원">Claude Sonnet 5.5 · 이미지 입력 + JSON 출력.</Pill>
          </div>
        </section>

        {/* 5. STATUS */}
        <section className="rs-section" id="s-05">
          <SectionHead n="05" title="상품 하나의 일생" sub={<>DB의 <Hl>status 칸 하나</Hl>로 모든 화면이 움직인다</>} />
          <div className="rs-status">
            {STATUSES.map((s, i) => (
              <div key={s.key} className="rs-statusItem">
                <span className={`rs-chip ${i === 2 ? "is-human" : ""} ${i === STATUSES.length - 1 ? "is-done" : ""}`}>{s.label}</span>
                <code>{s.key}</code>
                <span className="rs-statusNote">{s.note}</span>
              </div>
            ))}
          </div>
          <p className="rs-fail">
            <span className="rs-chip is-fail">실패</span> 한 곳이 실패해도 나머지는 계속 → 실패한 곳만 <b>재시도</b>
          </p>
          <More label="DB 테이블 보기">
            <div className="rs-tables">
              <div>
                <b>items</b>
                <code>id · status · photos[] · title · brand · category · size · condition · price · description · hashtags · created_at</code>
              </div>
              <div>
                <b>postings</b>
                <code>id · item_id · platform · status · url · error · screenshot · posted_at</code>
              </div>
            </div>
          </More>
        </section>

        {/* 6. PLATFORMS */}
        <section className="rs-section" id="s-06">
          <SectionHead n="06" title="플랫폼별 등록 방법" sub={<><Hl>쉬운 것부터</Hl> · 난이도 ●가 많을수록 어려움</>} />
          <div className="rs-platforms">
            {PLATFORMS.map((p) => (
              <PlatformCard key={p.name} name={p.name} how={p.how} level={p.level} points={p.points} />
            ))}
          </div>
          <More label="Playwright 로봇 공통 규칙 4가지" boxed>
            <ol className="rs-numList">
              <li><b>로봇 전용 크롬 프로필</b> — 처음 한 번만 직접 로그인, 이후 세션 재사용</li>
              <li><b>사람처럼 천천히</b> — 입력 · 클릭 사이 랜덤 딜레이, 몰아서 올리지 않기</li>
              <li><b>창을 띄운 채 실행</b> — 캡차가 나오면 사람이 이어서 처리</li>
              <li><b>단계마다 스크린샷</b> — 실패 원인 바로 확인</li>
            </ol>
          </More>
        </section>

        {/* 7. NOTIFICATIONS */}
        <section className="rs-section" id="s-07">
          <SectionHead
            n="07"
            title="알림 모아보기"
            icon={<IconBell />}
            sub={<>세 앱을 번갈아 열지 않고 <Hl>맥 앱 한 곳에서</Hl> 채팅 · 제안 · 댓글 · 주문 확인</>}
          />
          <NotifyDemo />

          <div className="nt-pipe">
            {NOTI_PIPE.map((s, i) => (
              <div key={s.title} className="nt-pipeWrap">
                <div className={`nt-pipeBox ${i === 1 ? "is-core" : ""}`}>
                  <div className="nt-pipeIcon">{PIPE_ICONS[i]}</div>
                  <b>
                    <span className="nt-pipeN">{i + 1}</span>
                    {s.title}
                  </b>
                  <ul>
                    {s.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
                {i < NOTI_PIPE.length - 1 && <span className="rs-laneArrow" aria-hidden>→</span>}
              </div>
            ))}
          </div>

          <h3 className="rs-subhead">플랫폼별로 알림을 가져오는 방법</h3>
          <div className="rs-platforms">
            {NOTI_SOURCES.map((s) => (
              <PlatformCard key={s.platform} name={s.platform} how={s.how} level={s.level} points={s.points} />
            ))}
          </div>

          <More label="운영 규칙 · DB 테이블" boxed>
            <ul className="rs-bullets">
              <li><b>중요도 분리:</b> 가격 제안 · 주문 · 문의는 바로 알림, 찜 · 좋아요는 하루 요약으로.</li>
              <li><b>상품과 연결:</b> 등록 때 저장한 postings.url로 어떤 상품의 알림인지 찾는다.</li>
              <li><b>중복 판매 방지:</b> 한 곳에서 팔리면 나머지 게시물 내리기를 바로 제안.</li>
              <li><b>답장은 사람이:</b> AI는 상품 정보를 보고 초안만, 보내기는 내가 누른다.</li>
            </ul>
            <div className="rs-tables nt-table">
              <div>
                <b>notifications</b>
                <code>id · platform · type · external_id · item_id · posting_id · sender · body · url · read_at · received_at</code>
              </div>
            </div>
          </More>
        </section>

        {/* 8. MANAGE */}
        <section className="rs-section" id="s-08">
          <SectionHead
            n="08"
            title="한 번에 관리"
            icon={<IconSliders />}
            sub={<>가격 · 예약중 · 판매완료 · 삭제 — <Hl>한 번 고치면 3곳에 반영</Hl></>}
          />
          <FanOutArt />
          <ManageDemo />

          <div className="mg-actions">
            {MANAGE_ACTIONS.map((a, i) => (
              <div key={a.title} className="mg-action">
                <div className="mg-actionIcon">{MANAGE_ICONS[i]}</div>
                <b>{a.title}</b>
                <p>{a.short}</p>
                <More label="어떻게?">
                  <p className="rs-moreText">{a.desc}</p>
                  <p className="rs-moreText acc-text">{a.how}</p>
                </More>
              </div>
            ))}
          </div>

          <More label="플랫폼별 가능 여부 표 · 동작 원칙" boxed>
            <div className="mg-tableWrap">
              <table className="mg-table">
                <thead>
                  <tr>
                    <th>플랫폼</th>
                    <th>가격 수정</th>
                    <th>상태 변경</th>
                    <th>삭제</th>
                    <th>메모</th>
                  </tr>
                </thead>
                <tbody>
                  {MANAGE_PLATFORMS.map((m) => (
                    <tr key={m.name}>
                      <td><b>{m.name}</b></td>
                      <td><Tag text={m.price} /></td>
                      <td><Tag text={m.status} /></td>
                      <td><Tag text={m.del} /></td>
                      <td className="mg-note">{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="rs-bullets">
              <li><b>내 DB가 기준:</b> items가 먼저 바뀌고, 로봇이 postings에 적힌 곳마다 따라 바꾼다.</li>
              <li><b>작업 큐:</b> 할 일을 jobs에 쌓고 순서대로 → 맥이 꺼져 있었으면 켜질 때 이어서.</li>
              <li><b>부분 실패 OK:</b> 실패한 곳만 ↻ 재시도, &lsquo;3곳 중 2곳 반영됨&rsquo;이 보인다.</li>
              <li><b>알림과 연결:</b> 07의 판매 알림 → 이 화면의 &lsquo;판매완료&rsquo;가 자동으로 (확인 한 번).</li>
            </ul>
            <div className="rs-tables nt-table">
              <div>
                <b>jobs</b>
                <code>id · item_id · platform · action(price | status | delete) · payload · status · error · screenshot · created_at · done_at</code>
              </div>
            </div>
          </More>
        </section>

        {/* 9. ROADMAP */}
        <section className="rs-section" id="s-09">
          <SectionHead n="09" title="만드는 순서" sub={<>약 <Hl>7~8주</Hl> · 매 단계가 끝나면 그 자체로 쓸 수 있게</>} />
          <Gantt />
          <div className="rs-road">
            {ROADMAP.map((r) => (
              <details key={r.step} className={`rs-roadItem ${r.step === "0" ? "is-first" : ""}`}>
                <summary>
                  <span className="rs-roadStep">{r.step}</span>
                  <b>{r.title}</b>
                  <span className="rs-roadTime">{r.time}</span>
                  <Chevron />
                </summary>
                <p>{r.goal}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 10. RISKS */}
        <section className="rs-section" id="s-10">
          <SectionHead n="10" title="조심할 것" sub={<>진짜 적은 코드가 아니라 <Hl>플랫폼 정책</Hl> · 눌러서 대응책 보기</>} />
          <div className="rs-risks">
            {RISKS.map((r, i) => (
              <details key={r.risk} className={`rs-risk ${i === 0 ? "is-top" : ""}`}>
                <summary>
                  <span className="rs-riskIcon" aria-hidden>!</span>
                  <span className="rs-riskQ">{r.risk}</span>
                  <Chevron />
                </summary>
                <p className="rs-riskA">→ {r.fix}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 11. QUESTIONS */}
        <section className="rs-section" id="s-11">
          <SectionHead n="11" title="정해야 할 것" sub="만들기 전에 답이 필요한 질문" />
          <ul className="rs-questions">
            {QUESTIONS.map((q) => (
              <li key={q}>
                <span className="rs-check" aria-hidden />
                {q}
              </li>
            ))}
          </ul>
        </section>

        <footer className="rs-foot">
          다음 할 일 → <b>0단계 조사</b>부터. 특히 후르츠패밀리 웹 등록 가능 여부.
        </footer>
      </main>

      <style jsx global>{`
        .rs-page {
          --accent: #ff6a3d;
          --line: rgba(var(--foreground-rgb), 0.16);
          --soft: rgba(var(--foreground-rgb), 0.06);
          --dim: rgba(var(--foreground-rgb), 0.55);
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          font-family: var(--font-geist-sans), "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
          letter-spacing: -0.01em;
          word-break: keep-all;
        }
        .rs-back {
          position: fixed;
          top: 28px;
          left: 28px;
          z-index: 100;
        }
        .rs-main {
          max-width: 1040px;
          margin: 0 auto;
          padding: 120px 24px 120px;
        }
        .acc-text { color: var(--accent); }

        /* hero */
        .rs-label {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: var(--dim);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .rs-title {
          font-size: clamp(2.4rem, 5.6vw, 4.2rem);
          line-height: 1.08;
          font-weight: 600;
          margin: 16px 0 24px;
          letter-spacing: -0.04em;
        }
        .rs-lead {
          max-width: 620px;
          font-size: 1.05rem;
          line-height: 1.75;
          color: var(--dim);
        }
        .rs-lead b { color: var(--foreground); font-weight: 600; }
        .rs-kpis {
          display: flex;
          gap: 10px;
          margin-top: 40px;
          flex-wrap: wrap;
        }
        .rs-kpis div {
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px 20px;
          display: flex;
          flex-direction: column;
          min-width: 110px;
        }
        .rs-kpis strong { font-size: 1.6rem; font-weight: 600; }
        .rs-kpis div { flex: 1; }
        .rs-kpis div.is-acc { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, transparent); }
        .rs-kpis div.is-acc strong { color: var(--accent); }
        .rs-kpis span { font-size: 13px; color: var(--dim); }

        /* section */
        .rs-section { margin-top: 110px; }
        .rs-sh { margin-bottom: 32px; }
        .rs-shN {
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: var(--accent);
        }
        .rs-shT {
          font-size: clamp(1.5rem, 3.6vw, 2rem);
          font-weight: 600;
          margin: 6px 0 8px;
          letter-spacing: -0.03em;
        }
        .rs-shS { color: var(--dim); font-size: 15px; line-height: 1.6; }

        /* icons */
        .rs-icon {
          width: 44px;
          height: 44px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .rs-page .acc-stroke { stroke: var(--accent); }
        .rs-page .acc-fill { fill: var(--accent); stroke: none; }

        /* flow */
        .rs-flow {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          counter-reset: step;
        }
        .rs-step {
          position: relative;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px 14px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rs-step:not(:last-child)::after {
          content: "›";
          position: absolute;
          right: -10px;
          top: 34px;
          width: 10px;
          text-align: center;
          color: var(--dim);
          font-size: 18px;
        }
        .rs-step.is-human {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 7%, transparent);
        }
        .rs-stepIcon { margin-bottom: 6px; }
        .rs-stepWho {
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          color: var(--dim);
        }
        .rs-stepTitle { font-weight: 600; font-size: 1.05rem; }
        .rs-stepTitle em {
          font-style: normal;
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: var(--accent);
          margin-right: 2px;
        }
        .rs-stepDesc { font-size: 13px; line-height: 1.55; color: var(--dim); }
        .rs-legend {
          margin-top: 14px;
          font-size: 12px;
          color: var(--dim);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rs-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          border: 1px solid var(--line);
          display: inline-block;
          margin-left: 10px;
        }
        .rs-dot.is-human { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 25%, transparent); margin-left: 0; }

        /* lanes */
        .rs-lanes {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
        }
        .rs-laneWrap { position: relative; display: flex; }
        .rs-lane {
          flex: 1;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 18px;
          background: var(--soft);
        }
        .rs-lane.is-core { border-color: var(--accent); }
        .rs-laneArrow {
          position: absolute;
          right: -18px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--accent);
          font-size: 16px;
        }
        .rs-laneTop { display: flex; justify-content: space-between; align-items: center; }
        .rs-laneTag {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          font-family: var(--font-geist-mono), monospace;
          font-size: 13px;
          background: var(--foreground);
          color: var(--background);
        }
        .rs-lane.is-core .rs-laneTag { background: var(--accent); color: #fff; }
        .rs-laneWhere { font-size: 11px; color: var(--dim); }
        .rs-laneName { font-size: 1.15rem; font-weight: 600; margin: 14px 0 4px; }
        .rs-laneStack { font-size: 12px; color: var(--accent); margin-bottom: 12px; line-height: 1.5; }
        .rs-lane ul, .rs-platform ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
        .rs-lane li, .rs-platform li {
          font-size: 13px;
          line-height: 1.5;
          color: var(--dim);
          padding-left: 12px;
          position: relative;
        }
        .rs-lane li::before, .rs-platform li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 8px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--dim);
        }

        /* screens */
        .rs-screens {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 28px;
          align-items: start;
        }
        .rs-screen { margin: 0; }
        .rs-screen figcaption { margin-top: 16px; }
        .rs-screen figcaption b { font-size: 15px; }
        .rs-screen ol {
          margin: 10px 0 0;
          padding-left: 20px;
          font-size: 13px;
          color: var(--dim);
          line-height: 1.8;
        }
        .rs-mock { width: 100%; height: auto; display: block; }
        .is-phone .rs-mock { max-width: 260px; margin: 0 auto; }
        .rs-mock .m-line { fill: none; stroke: var(--line); stroke-width: 2; stroke: rgba(var(--foreground-rgb), 0.4); }
        .rs-mock .m-soft { fill: var(--soft); stroke: rgba(var(--foreground-rgb), 0.18); stroke-width: 1.5; }
        .rs-mock .m-dash { fill: none; stroke: rgba(var(--foreground-rgb), 0.35); stroke-width: 1.5; stroke-dasharray: 4 4; }
        .rs-mock .m-dashA { stroke-dasharray: 5 4; stroke-width: 2; }
        .rs-mock .m-noFill { fill: none; }
        .rs-mock .acc-stroke.m-noFill { stroke-width: 2; }
        .rs-mock .m-bar { fill: rgba(var(--foreground-rgb), 0.18); }
        .rs-mock .m-solid { fill: var(--foreground); }
        .rs-mock .m-check { fill: none; stroke: #fff; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .rs-mock text { fill: var(--foreground); font-family: inherit; }
        .rs-mock .m-text { font-size: 14px; }
        .rs-mock .m-tiny { font-size: 12px; }
        .rs-mock .m-bold { font-weight: 700; }
        .rs-mock .m-dim { fill: rgba(var(--foreground-rgb), 0.5); }
        .rs-mock .acc-text { fill: var(--accent); }
        .rs-mock .m-onAcc { fill: #fff; font-weight: 600; }
        .rs-mock .m-onSolid { fill: var(--background); font-weight: 600; }
        .rs-mock .m-marker { fill: var(--accent); }
        .rs-mock .m-markerText { fill: #fff; font-size: 12px; font-weight: 700; font-family: var(--font-geist-mono), monospace; }

        /* ai */
        .rs-ai {
          display: grid;
          grid-template-columns: 1fr auto 1.2fr;
          gap: 20px;
          align-items: center;
        }
        .rs-aiIn {
          border: 1px dashed var(--line);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rs-aiPhotos { display: flex; gap: 8px; }
        .rs-aiPhoto { width: 60px; height: 60px; fill: var(--soft); stroke: rgba(var(--foreground-rgb), 0.4); stroke-width: 1.5; }
        .rs-aiPlus { color: var(--dim); }
        .rs-aiHint { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
        .rs-aiHint span { color: var(--dim); line-height: 1.5; }
        .rs-aiArrow .rs-icon { width: 52px; height: 52px; }
        .rs-code {
          margin: 0;
          padding: 18px 20px;
          border-radius: 14px;
          background: var(--soft);
          border: 1px solid var(--line);
          font-family: var(--font-geist-mono), monospace;
          font-size: 12.5px;
          line-height: 1.7;
          overflow-x: auto;
          white-space: pre;
        }
        .rs-bullets {
          margin-top: 24px;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 14px;
          line-height: 1.65;
          color: var(--dim);
        }
        .rs-bullets b { color: var(--foreground); }

        /* status */
        .rs-status {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          position: relative;
        }
        .rs-statusItem {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }
        .rs-statusItem:not(:last-child)::after {
          content: "";
          position: absolute;
          top: 17px;
          left: calc(100% - 6px);
          width: 16px;
          height: 1px;
          background: var(--dim);
        }
        .rs-chip {
          align-self: flex-start;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--line);
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
        }
        .rs-chip.is-human { border-color: var(--accent); color: var(--accent); }
        .rs-chip.is-done { background: var(--foreground); color: var(--background); border-color: var(--foreground); }
        .rs-chip.is-fail { border-color: #e5484d; color: #e5484d; padding: 4px 10px; font-size: 12px; margin-right: 8px; }
        .rs-statusItem code { font-family: var(--font-geist-mono), monospace; font-size: 11px; color: var(--dim); }
        .rs-statusNote { font-size: 12px; color: var(--dim); }
        .rs-fail { margin-top: 22px; font-size: 13px; color: var(--dim); line-height: 1.8; }
        .rs-fail b { color: var(--foreground); }
        .rs-tables {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 22px;
        }
        .rs-tables div {
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rs-tables b { font-family: var(--font-geist-mono), monospace; font-size: 13px; color: var(--accent); }
        .rs-tables code { font-family: var(--font-geist-mono), monospace; font-size: 12px; color: var(--dim); line-height: 1.7; }

        /* platforms */
        .rs-platforms { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .rs-platform { border: 1px solid var(--line); border-radius: 16px; padding: 20px; }
        .rs-platformTop { display: flex; justify-content: space-between; align-items: center; }
        .rs-platformTop h3 { font-size: 1.15rem; font-weight: 600; }
        .rs-level { display: flex; gap: 4px; }
        .rs-level i { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
        .rs-level i.on { background: var(--accent); }
        .rs-platformHow { font-size: 13px; color: var(--accent); margin: 6px 0 14px; }
        .rs-robot {
          margin-top: 16px;
          border-radius: 16px;
          padding: 20px 22px;
          background: var(--soft);
        }
        .rs-robot b { font-size: 14px; }
        .rs-robot ol { margin: 10px 0 0; padding-left: 20px; font-size: 13px; color: var(--dim); line-height: 1.85; }

        /* notifications */
        .rs-page { --fruits: #7a5cff; --bunjang: #e8412c; --insta: #d62e7c; }
        .nt-demo {
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 16px;
          background: var(--soft);
        }
        .nt-demo button { font: inherit; color: inherit; cursor: pointer; }
        .nt-bar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .nt-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .nt-tabs button {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--background);
          font-size: 13px;
          font-weight: 600;
        }
        .nt-tabs button.on { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
        .nt-count {
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: var(--accent);
          color: #fff;
          font-size: 11px;
          display: inline-grid;
          place-items: center;
          font-family: var(--font-geist-mono), monospace;
        }
        .nt-readAll {
          border: none;
          background: none;
          font-size: 12px;
          color: var(--dim) !important;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .nt-readAll:disabled { opacity: 0.4; cursor: default; }
        .nt-types { display: flex; gap: 4px; margin: 12px 0 14px; flex-wrap: wrap; }
        .nt-types button {
          border: none;
          background: none;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          color: var(--dim) !important;
        }
        .nt-types button.on { background: var(--background); color: var(--foreground) !important; font-weight: 600; box-shadow: 0 0 0 1px var(--line); }
        .nt-mark {
          flex: none;
          width: 22px;
          height: 22px;
          border-radius: 7px;
          display: inline-grid;
          place-items: center;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-geist-mono), monospace;
          letter-spacing: -0.04em;
        }
        .nt-mark.is-fruits { background: var(--fruits); }
        .nt-mark.is-bunjang { background: var(--bunjang); }
        .nt-mark.is-insta { background: var(--insta); }
        .nt-row .nt-mark { width: 34px; height: 34px; border-radius: 10px; font-size: 12px; }
        .nt-body { display: grid; grid-template-columns: 1fr 240px; gap: 14px; align-items: start; }
        .nt-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .nt-empty { padding: 30px; text-align: center; font-size: 13px; color: var(--dim); }
        .nt-item {
          border-radius: 12px;
          background: var(--background);
          border: 1px solid transparent;
          transition: border-color 0.15s;
        }
        .nt-item.is-open { border-color: var(--line); }
        .nt-row {
          width: 100%;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px 14px;
          border: none;
          background: none;
          text-align: left;
        }
        .nt-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .nt-meta { display: flex; gap: 8px; align-items: baseline; font-size: 12px; flex-wrap: wrap; }
        .nt-type { color: var(--dim); font-family: var(--font-geist-mono), monospace; font-size: 11px; }
        .nt-item.is-offer .nt-type, .nt-item.is-sold .nt-type { color: var(--accent); font-weight: 600; }
        .nt-time { margin-left: auto; color: var(--dim); font-size: 11px; }
        .nt-text { font-size: 14px; line-height: 1.5; color: var(--dim); }
        .nt-item.is-unread .nt-text { color: var(--foreground); font-weight: 500; }
        .nt-item-name { font-size: 12px; color: var(--dim); }
        .nt-dot { flex: none; width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; }
        .nt-item.is-unread .nt-dot { background: var(--accent); }
        .nt-detail { padding: 0 14px 14px 60px; }
        .nt-detail p {
          font-size: 13px;
          line-height: 1.65;
          margin: 6px 0 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: var(--soft);
        }
        .nt-ai { font-size: 11px; font-weight: 600; color: var(--accent); }
        .nt-ai.is-warn { color: #e5484d; }
        .nt-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        .nt-actions button {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: none;
          font-size: 12px;
        }
        .nt-actions button.is-primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 600; }
        .nt-side {
          border-radius: 12px;
          background: var(--background);
          padding: 14px;
          font-size: 13px;
        }
        .nt-side > b { font-size: 12px; }
        .nt-side ul { list-style: none; padding: 0; margin: 10px 0 0; display: flex; flex-direction: column; gap: 8px; }
        .nt-side li { display: flex; justify-content: space-between; gap: 8px; line-height: 1.4; }
        .nt-side li span { color: var(--dim); }
        .nt-side em {
          font-style: normal;
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
          color: var(--accent);
          font-weight: 600;
        }
        .nt-sideEmpty { margin-top: 10px; color: var(--dim); }
        .nt-sideNote { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 11px; color: var(--dim); line-height: 1.55; }
        .nt-caption { margin-top: 12px; font-size: 11px; color: var(--dim); }
        .nt-pipe { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin: 28px 0 16px; }
        .nt-pipeWrap { position: relative; display: flex; }
        .nt-pipeBox { flex: 1; border: 1px solid var(--line); border-radius: 16px; padding: 18px; }
        .nt-pipeBox.is-core { border-color: var(--accent); }
        .nt-pipeN {
          display: inline-grid;
          place-items: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--accent);
          color: #fff;
          font-size: 11px;
          font-family: var(--font-geist-mono), monospace;
          margin-right: 8px;
        }
        .nt-pipeBox b { font-size: 15px; }
        .nt-pipeBox ul { margin: 12px 0 0; padding-left: 18px; font-size: 13px; color: var(--dim); line-height: 1.8; }
        .nt-table { grid-template-columns: 1fr; }

        /* manage */
        .mg-demo {
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 16px;
          background: var(--soft);
        }
        .mg-demo button, .mg-demo select, .mg-demo input { font: inherit; color: inherit; }
        .mg-demo button { cursor: pointer; }
        .mg-demo input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--accent); flex: none; cursor: pointer; }
        .mg-bulk {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 8px 10px 8px 14px;
          border-radius: 12px;
          margin-bottom: 10px;
          transition: background 0.15s;
        }
        .mg-bulk.is-on { background: color-mix(in srgb, var(--accent) 10%, transparent); }
        .mg-checkAll { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .mg-bulkActions { display: flex; gap: 6px; flex-wrap: wrap; }
        .mg-bulkActions button {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--background);
          font-size: 12px;
          font-weight: 600;
        }
        .mg-bulkActions button:disabled { opacity: 0.4; cursor: default; }
        .mg-bulkActions .is-dangerLine { color: #e5484d; }
        .mg-bulkActions .is-danger { background: #e5484d; border-color: #e5484d; color: #fff; }
        .mg-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .mg-row {
          display: grid;
          grid-template-columns: auto 38px 1fr 128px 100px 104px;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--background);
          position: relative;
          transition: opacity 0.3s;
        }
        .mg-row.is-deleting { opacity: 0.45; }
        .mg-row.is-sold .mg-title { color: var(--dim); text-decoration: line-through; text-decoration-color: var(--line); }
        .mg-thumb {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: var(--soft);
          border: 1px solid var(--line);
        }
        .mg-title { font-size: 14px; font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .mg-price {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--dim);
        }
        .mg-price input {
          width: 100%;
          min-width: 0;
          text-align: right;
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: transparent;
          font-family: var(--font-geist-mono), monospace !important;
          font-size: 13px;
          color: var(--foreground) !important;
        }
        .mg-price input:focus { outline: none; border-color: var(--accent); }
        .mg-status {
          padding: 6px 8px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--background);
          font-size: 12px !important;
          font-weight: 600;
          cursor: pointer;
        }
        .mg-status.is-reserved { color: var(--accent) !important; border-color: var(--accent); }
        .mg-status.is-sold { color: var(--dim) !important; }
        .mg-sync { display: flex; gap: 4px; }
        .mg-pf {
          min-width: 26px;
          height: 22px;
          padding: 0 5px;
          border-radius: 6px;
          display: inline-grid;
          place-items: center;
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-geist-mono), monospace;
          color: #fff;
          border: none;
        }
        .mg-pf.is-fruits { background: var(--fruits); }
        .mg-pf.is-bunjang { background: var(--bunjang); }
        .mg-pf.is-insta { background: var(--insta); }
        .mg-pf.is-pending { animation: mg-pulse 0.8s ease-in-out infinite alternate; }
        .mg-pf.is-none { background: none; color: var(--dim); box-shadow: inset 0 0 0 1px var(--line); opacity: 0.6; }
        .mg-pf.is-fail { background: none; color: #e5484d !important; box-shadow: inset 0 0 0 1.5px #e5484d; }
        @keyframes mg-pulse { from { opacity: 1; } to { opacity: 0.25; } }
        .mg-deleting {
          position: absolute;
          right: 14px;
          top: -8px;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 999px;
          background: #e5484d;
          color: #fff;
        }
        .mg-foot { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; flex-wrap: wrap; align-items: flex-start; }
        .mg-legend { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--dim); flex-wrap: wrap; }
        .mg-legend .mg-pf { margin-left: 6px; }
        .mg-legend .mg-pf:first-child { margin-left: 0; }
        .mg-log { flex: 1; min-width: 240px; max-width: 440px; font-size: 12px; }
        .mg-log b { font-size: 11px; color: var(--dim); font-weight: 600; }
        .mg-log ul { list-style: none; padding: 0; margin: 6px 0 0; display: flex; flex-direction: column; gap: 4px; }
        .mg-log li { color: var(--dim); line-height: 1.5; }
        .mg-log li:first-child { color: var(--foreground); }
        .mg-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 28px 0 16px; }
        .mg-action { border-left: 2px solid var(--accent); padding: 4px 0 4px 16px; }
        .mg-action b { font-size: 15px; }
        .mg-action p { font-size: 13px; color: var(--dim); line-height: 1.65; margin: 6px 0 8px; }
        .mg-action span { font-size: 12px; color: var(--accent); line-height: 1.55; display: block; }
        .mg-tableWrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 14px; }
        .mg-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 620px; }
        .mg-table th, .mg-table td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--line); line-height: 1.5; }
        .mg-table th { font-size: 11px; font-weight: 600; color: var(--dim); font-family: var(--font-geist-mono), monospace; background: var(--soft); }
        .mg-table tr:last-child td { border-bottom: none; }
        .mg-table td { color: var(--dim); }
        .mg-table td b { color: var(--foreground); }
        .mg-table .mg-note { font-size: 12px; }

        /* emphasis · details */
        .rs-hero { display: grid; grid-template-columns: 1.15fr 1fr; gap: 32px; align-items: center; }
        .rs-heroArt { width: 100%; height: auto; display: block; }
        .rs-hl {
          background: linear-gradient(transparent 58%, color-mix(in srgb, var(--accent) 32%, transparent) 58%);
          color: var(--foreground);
          font-weight: 600;
          padding: 0 2px;
        }
        .rs-toc {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 28px;
          padding: 6px;
          border-radius: 14px;
          border: 1px solid var(--line);
          background: color-mix(in srgb, var(--background) 86%, transparent);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        @media (min-width: 1140px) {
          .rs-toc { position: sticky; top: 12px; z-index: 50; }
        }
        .rs-toc a {
          padding: 6px 10px;
          border-radius: 9px;
          font-size: 13px;
          color: var(--dim);
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .rs-toc a:hover { background: var(--soft); color: var(--foreground); }
        .rs-toc em {
          font-style: normal;
          font-family: var(--font-geist-mono), monospace;
          font-size: 10px;
          color: var(--accent);
          margin-right: 4px;
        }
        .rs-section { scroll-margin-top: 80px; }
        .rs-shT { display: flex; align-items: center; gap: 10px; }
        .rs-shIcon .rs-icon { width: 34px; height: 34px; display: block; }
        .rs-shS { font-size: 16px; }

        .rs-chev { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.2s; flex: none; }
        details[open] > summary .rs-chev { transform: rotate(180deg); }
        .rs-page details > summary { list-style: none; cursor: pointer; }
        .rs-page details > summary::-webkit-details-marker { display: none; }
        .rs-more { margin-top: 12px; }
        .rs-more > summary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: var(--dim);
          padding: 4px 10px 4px 12px;
          border-radius: 999px;
          border: 1px solid var(--line);
          transition: color 0.15s, border-color 0.15s;
          user-select: none;
        }
        .rs-more > summary:hover, .rs-more[open] > summary { color: var(--accent); border-color: var(--accent); }
        .rs-moreBody { margin-top: 12px; animation: rs-fade 0.2s ease; }
        .rs-more.is-boxed { margin-top: 18px; }
        .rs-more.is-boxed > summary { font-size: 13px; padding: 8px 14px 8px 16px; }
        .rs-more.is-boxed > .rs-moreBody { padding: 18px 20px; border-radius: 16px; background: var(--soft); }
        .rs-more.is-boxed .rs-bullets { margin-top: 0; }
        .rs-more.is-boxed .rs-bullets + .rs-tables { margin-top: 16px; }
        .rs-more.is-boxed .mg-tableWrap + .rs-bullets { margin-top: 18px; }
        .rs-moreBody .rs-tables { margin-top: 0; }
        .rs-moreText { font-size: 13px; color: var(--dim); line-height: 1.65; }
        .rs-moreText + .rs-moreText { margin-top: 6px; }
        @keyframes rs-fade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .rs-dots { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
        .rs-numList { margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.9; color: var(--dim); }
        .rs-numList b { color: var(--foreground); }

        .rs-laneIcon { margin: 14px 0 0; }
        .rs-laneIcon .rs-icon { width: 40px; height: 40px; }
        .rs-lane .rs-laneName { margin-top: 8px; }
        .rs-callouts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
        .rs-callout { border-left: 3px solid var(--accent); padding: 4px 0 4px 16px; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
        .rs-calloutQ { font-size: 12px; color: var(--dim); }
        .rs-callout b { font-size: 15px; line-height: 1.5; }
        .rs-callout .rs-more { margin-top: 6px; }

        .rs-pills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; }
        .rs-pill {
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .rs-pill.is-acc { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 7%, transparent); }
        .rs-pillIcon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: grid;
          place-items: center;
          background: var(--foreground);
          color: var(--background);
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
        }
        .rs-pill.is-acc .rs-pillIcon { background: var(--accent); color: #fff; }
        .rs-pill b { font-size: 15px; }
        .rs-pillText { font-size: 13px; color: var(--dim); line-height: 1.55; }

        .rs-platform .rs-platformTop { gap: 10px; justify-content: flex-start; }
        .rs-platformTop .rs-level { margin-left: auto; }
        .rs-pfMark { width: 28px; height: 28px; font-size: 11px; }
        .rs-platform .rs-platformHow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-weight: 600; margin: 10px 0 0; }
        .rs-warnTag {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 6px;
          color: #c26a00;
          background: color-mix(in srgb, #ffb224 22%, transparent);
          white-space: nowrap;
          margin-left: 6px;
        }
        .rs-platformHow .rs-warnTag { margin-left: 0; }
        .rs-cell { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 2px; }
        .rs-subhead { font-size: 15px; font-weight: 600; margin: 28px 0 12px; }

        .nt-pipeIcon { margin-bottom: 10px; }
        .nt-pipeIcon .rs-icon { width: 36px; height: 36px; }
        .nt-pipeBox b { display: flex; align-items: center; }

        .rs-fanArt { width: 100%; max-width: 640px; height: auto; display: block; margin: 0 auto 22px; }
        .mg-actionIcon { margin-bottom: 8px; }
        .mg-actionIcon .rs-icon { width: 36px; height: 36px; }
        .mg-actions .mg-action { border: 1px solid var(--line); border-radius: 16px; padding: 18px; }
        .mg-actions .mg-action p { margin-bottom: 0; }
        .mg-action .rs-more { margin-top: 10px; }
        .mg-action .rs-moreBody p { margin: 0; }
        .mg-action .rs-moreBody p + p { margin-top: 6px; }

        /* svg art */
        .rs-page svg text { font-family: inherit; }
        .h-line { fill: none; stroke: rgba(var(--foreground-rgb), 0.45); stroke-width: 2; }
        .h-thin { stroke-width: 1.5; }
        .h-soft { fill: var(--soft); stroke: rgba(var(--foreground-rgb), 0.18); stroke-width: 1.5; }
        .h-bar { fill: rgba(var(--foreground-rgb), 0.2); }
        .h-acc { fill: var(--accent); }
        .h-onAcc { fill: #fff; font-size: 9px; font-weight: 700; }
        .h-mid { font-size: 12px; }
        .h-flow { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 5 5; animation: h-dash 1.2s linear infinite; }
        @keyframes h-dash { to { stroke-dashoffset: -20; } }
        .h-pf.is-fruits { fill: var(--fruits); }
        .h-pf.is-bunjang { fill: var(--bunjang); }
        .h-pf.is-insta { fill: var(--insta); }
        .rs-page .h-pfText { fill: #fff; font-size: 15px; font-weight: 700; font-family: var(--font-geist-mono), monospace; }
        .rs-page .h-tiny { font-size: 9px; }
        .h-check { fill: var(--foreground); }
        .h-checkMark { fill: none; stroke: var(--background); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .h-small { fill: var(--foreground); font-size: 13px; }
        .h-dim { fill: rgba(var(--foreground-rgb), 0.5); }
        .rs-page .h-mono { font-family: var(--font-geist-mono), monospace; }
        .rs-page .h-big { fill: var(--foreground); font-size: 20px; font-weight: 700; font-family: var(--font-geist-mono), monospace; }
        .rs-page .h-strike { fill: rgba(var(--foreground-rgb), 0.35); text-decoration: line-through; font-size: 16px; }
        .h-accText { fill: var(--accent); }
        @media (prefers-reduced-motion: reduce) { .h-flow, .mg-pf.is-pending { animation: none; } }

        /* gantt */
        .rs-gantt { border: 1px solid var(--line); border-radius: 16px; padding: 18px 20px 12px; margin-bottom: 14px; }
        .rs-ganttRow { display: grid; grid-template-columns: 150px 1fr; align-items: center; gap: 12px; height: 28px; }
        .rs-ganttLabel { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rs-ganttLabel em { font-style: normal; font-family: var(--font-geist-mono), monospace; color: var(--accent); font-size: 11px; margin-right: 4px; }
        .rs-ganttTrack { position: relative; height: 12px; border-radius: 6px; background: var(--soft); }
        .rs-ganttBar { position: absolute; top: 0; bottom: 0; border-radius: 6px; background: rgba(var(--foreground-rgb), 0.55); }
        .rs-ganttBar.is-first, .rs-ganttBar.is-new { background: var(--accent); }
        .rs-ganttBar.is-open { background: repeating-linear-gradient(90deg, rgba(var(--foreground-rgb), 0.35) 0 6px, transparent 6px 10px); }
        .rs-ganttAxis { display: flex; justify-content: space-between; margin: 8px 0 0 162px; font-size: 10px; color: var(--dim); font-family: var(--font-geist-mono), monospace; }

        /* roadmap */
        .rs-road { display: flex; flex-direction: column; gap: 6px; }
        .rs-roadItem { border: 1px solid var(--line); border-radius: 12px; }
        .rs-roadItem > summary { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
        .rs-roadItem > summary b { font-size: 14px; }
        .rs-roadItem[open] { border-color: rgba(var(--foreground-rgb), 0.35); }
        .rs-roadStep {
          flex: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          border: 1px solid var(--line);
          font-family: var(--font-geist-mono), monospace;
          font-size: 12px;
        }
        .rs-roadItem.is-first .rs-roadStep { background: var(--accent); border-color: var(--accent); color: #fff; }
        .rs-roadTime { margin-left: auto; font-size: 12px; font-family: var(--font-geist-mono), monospace; color: var(--accent); }
        .rs-roadItem .rs-chev { color: var(--dim); }
        .rs-roadItem p { padding: 0 14px 14px 54px; font-size: 13px; color: var(--dim); line-height: 1.65; animation: rs-fade 0.2s ease; }

        /* risks */
        .rs-risks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; align-items: start; }
        .rs-risk { border: 1px solid var(--line); border-radius: 12px; }
        .rs-risk > summary { display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
        .rs-risk[open] { border-color: #e5484d; }
        .rs-riskIcon {
          flex: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, #e5484d 15%, transparent);
          color: #e5484d;
          font-size: 13px;
          font-weight: 800;
        }
        .rs-riskQ { flex: 1; font-size: 14px; font-weight: 600; line-height: 1.45; }
        .rs-risk .rs-chev { color: var(--dim); }
        .rs-riskA { padding: 0 16px 16px 50px; font-size: 13px; color: var(--dim); line-height: 1.65; animation: rs-fade 0.2s ease; }

        /* questions */
        .rs-questions { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .rs-questions li { display: flex; gap: 12px; font-size: 14px; line-height: 1.6; }
        .rs-check {
          flex: none;
          width: 18px;
          height: 18px;
          margin-top: 2px;
          border-radius: 5px;
          border: 1.5px solid var(--accent);
        }

        .rs-foot {
          margin-top: 110px;
          padding-top: 28px;
          border-top: 1px solid var(--line);
          font-size: 14px;
          color: var(--dim);
        }
        .rs-foot b { color: var(--accent); }

        /* responsive */
        @media (max-width: 960px) {
          .rs-flow { grid-template-columns: repeat(3, 1fr); }
          .rs-step:nth-child(3)::after { display: none; }
          .rs-lanes { grid-template-columns: repeat(2, 1fr); }
          .rs-laneWrap:nth-child(2) .rs-laneArrow { display: none; }
          .rs-screens { grid-template-columns: 1fr; }
          .rs-ai { grid-template-columns: 1fr; }
          .rs-aiArrow { justify-self: center; transform: rotate(90deg); }
          .rs-platforms { grid-template-columns: 1fr; }
          .rs-hero { grid-template-columns: 1fr; }
          .rs-heroArt { max-width: 420px; }
          .rs-pills { grid-template-columns: 1fr; }
          .nt-body { grid-template-columns: 1fr; }
          .nt-side { order: -1; }
          .mg-actions { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .rs-back { top: 20px; left: 16px; }
          .rs-main { padding: 84px 16px 80px; }
          .rs-section { margin-top: 80px; }
          .rs-flow { grid-template-columns: 1fr; }
          .rs-step { flex-direction: row; flex-wrap: wrap; align-items: center; column-gap: 12px; }
          .rs-stepIcon { margin: 0; }
          .rs-step:not(:last-child)::after { display: none; }
          .rs-stepDesc { flex-basis: 100%; }
          .rs-lanes { grid-template-columns: 1fr; gap: 26px; }
          .rs-laneArrow { display: block !important; right: auto; left: 50%; top: auto; bottom: -22px; transform: translateX(-50%) rotate(90deg); }
          .rs-tables { grid-template-columns: 1fr; }
          .rs-status { grid-template-columns: 1fr; gap: 14px; }
          .rs-statusItem { flex-direction: row; align-items: center; flex-wrap: wrap; }
          .rs-statusItem:not(:last-child)::after { display: none; }
          .rs-risks, .rs-callouts, .rs-pills { grid-template-columns: 1fr; }
          .rs-ganttRow { grid-template-columns: 96px 1fr; }
          .rs-ganttAxis { margin-left: 108px; }
          .rs-toc { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
          .rs-roadItem p { padding-left: 14px; }
          .nt-demo { padding: 10px; }
          .nt-detail { padding-left: 14px; }
          .nt-pipe { grid-template-columns: 1fr; gap: 26px; }
          .mg-demo { padding: 10px; }
          .mg-row { grid-template-columns: auto 1fr auto; row-gap: 8px; column-gap: 10px; }
          .mg-thumb { display: none; }
          .mg-title { grid-column: 2 / 4; }
          .mg-price { grid-column: 2; }
          .mg-sync { grid-column: 2 / 4; }
          .nt-pipe .rs-laneArrow { right: auto; left: 50%; top: auto; bottom: -22px; transform: translateX(-50%) rotate(90deg); }
        }
      `}</style>
    </div>
  );
}

function SectionHead({ n, title, sub, icon }: { n: string; title: string; sub: ReactNode; icon?: ReactNode }) {
  return (
    <div className="rs-sh">
      <span className="rs-shN">{n}</span>
      <h2 className="rs-shT">
        {icon && <span className="rs-shIcon">{icon}</span>}
        {title}
      </h2>
      <p className="rs-shS">{sub}</p>
    </div>
  );
}
