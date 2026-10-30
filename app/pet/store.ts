// /pet 데모: 모든 데이터는 이 브라우저의 IndexedDB에만 저장된다 (서버 없음)

export type Species = "cat" | "dog" | "etc";
export type Level = 1 | 2 | 3;
export type Stool = "normal" | "soft" | "diarrhea" | "none";
export type Urgency = "high" | "mid" | "low";

export interface Pet {
  name: string;
  species: Species;
  breed: string;
  birthday: string;
  photo?: string;
  vetName: string;
  vetPhone: string;
  supplements: string[];
}

export interface DayLog {
  day: string;
  photo?: string;
  appetite?: Level;
  water?: Level;
  energy?: Level;
  stool?: Stool;
  vomit: boolean;
  weight?: number;
  supplementsTaken: string[];
  note: string;
}

export interface ChatMsg {
  role: "user" | "ai";
  text: string;
  urgency?: Urgency;
  at: string;
}

export interface Comment {
  id: string;
  nickname: string;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  nickname: string;
  petName: string;
  body: string;
  photo?: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  mine: boolean;
  comments: Comment[];
}

export interface PetState {
  pet: Pet | null;
  logs: Record<string, DayLog>;
  chat: ChatMsg[];
  posts: Post[];
  nickname: string;
}

export const SAMPLE_PHOTO = "/pet/sample-cat.jpg";

export const SPECIES_LABEL: Record<Species, string> = { cat: "고양이", dog: "강아지", etc: "기타" };
export const LEVEL_LABEL: Record<Level, string> = { 1: "적음", 2: "보통", 3: "많음" };
export const STOOL_LABEL: Record<Stool, string> = { normal: "정상", soft: "무름", diarrhea: "설사", none: "안 봄" };

export function emptyState(): PetState {
  return { pet: null, logs: {}, chat: [], posts: seedPosts(), nickname: "" };
}

export function emptyLog(day: string): DayLog {
  return { day, vomit: false, supplementsTaken: [], note: "" };
}

export function newId(): string {
  return crypto.randomUUID();
}

/** 로컬 날짜 기준 YYYY-MM-DD */
export function dayKey(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "10월 30일 (목)" 형태로 보여 준다 */
export function formatDay(day: string): string {
  return new Date(`${day}T00:00:00`).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayKey(d);
}

/** 기록 하나의 컨디션을 good / watch / bad 로 요약한다 (달력 점 색) */
export function logTone(log: DayLog | undefined): "empty" | "good" | "watch" | "bad" {
  if (!log) return "empty";
  const filled = log.appetite || log.water || log.energy || log.stool || log.note || log.photo;
  if (!filled && !log.vomit) return "empty";
  if (log.stool === "diarrhea" || (log.vomit && (log.appetite === 1 || log.energy === 1))) return "bad";
  if (log.vomit || log.stool === "soft" || log.appetite === 1 || log.energy === 1) return "watch";
  return "good";
}

// ---------- 저장소 (IndexedDB 한 칸에 전체 상태를 통째로 저장) ----------

const DB_NAME = "pet-demo";
const STATE_KEY = "state";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadState(): Promise<PetState | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const req = db.transaction("kv").objectStore("kv").get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as PetState | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveState(state: PetState): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(state, STATE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // 사생활 보호 모드 등 저장이 막힌 환경에서는 이번 방문 동안만 유지된다
  }
}

/** 사진을 긴 변 maxSize px의 JPEG data URL로 줄인다 (저장 용량 절약) */
export function resizeImage(file: File, maxSize = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("사진을 읽지 못했어요."));
    };
    img.src = url;
  });
}

// ---------- 예시 데이터 ----------

export function demoState(): PetState {
  const supplements = ["유산균", "오메가3", "관절 영양제"];
  const pet: Pet = {
    name: "살랑이",
    species: "cat",
    breed: "샴",
    birthday: "2021-04-12",
    photo: SAMPLE_PHOTO,
    vetName: "우리동네 동물병원 (예시)",
    vetPhone: "02-123-4567",
    supplements,
  };

  // 지난 13일치 예시 기록 (오늘은 비워 두어 직접 써 보게 한다)
  const pattern: Array<Partial<DayLog>> = [
    { appetite: 2, water: 2, energy: 3, stool: "normal", weight: 4.2, note: "창가에서 낮잠을 오래 잤다." },
    { appetite: 3, water: 2, energy: 3, stool: "normal", photo: SAMPLE_PHOTO, note: "새 낚싯대 장난감에 신남." },
    { appetite: 2, water: 3, energy: 2, stool: "normal" },
    { appetite: 1, water: 2, energy: 2, stool: "soft", vomit: true, note: "아침에 헤어볼 한 번 토함. 저녁엔 괜찮음." },
    { appetite: 2, water: 2, energy: 2, stool: "normal", weight: 4.1 },
    { appetite: 3, water: 2, energy: 3, stool: "normal", note: "간식 달라고 계속 울었다." },
    { appetite: 2, water: 2, energy: 3, stool: "normal" },
    { appetite: 2, water: 1, energy: 2, stool: "normal", note: "물을 잘 안 마셔서 습식 사료 섞어 줌." },
    { appetite: 2, water: 2, energy: 3, stool: "normal", weight: 4.2 },
    { appetite: 3, water: 2, energy: 3, stool: "normal", photo: SAMPLE_PHOTO },
    { appetite: 2, water: 2, energy: 2, stool: "none" },
    { appetite: 2, water: 2, energy: 3, stool: "normal" },
    { appetite: 2, water: 2, energy: 3, stool: "normal", weight: 4.2, note: "병원 정기검진. 이상 없음." },
  ];
  const logs: Record<string, DayLog> = {};
  pattern.forEach((p, i) => {
    const day = daysAgo(i + 1);
    logs[day] = {
      ...emptyLog(day),
      ...p,
      vomit: p.vomit ?? false,
      supplementsTaken: i % 3 === 2 ? ["유산균"] : supplements.slice(0, 2),
    };
  });

  return { pet, logs, chat: [], posts: seedPosts(), nickname: "살랑이집사" };
}

function seedPosts(): Post[] {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
  return [
    {
      id: "seed-1",
      nickname: "두부아빠",
      petName: "두부",
      body: "고양이 물 잘 안 마실 때 다들 어떻게 하세요? 분수형 급수기 샀는데 효과가 있는 것 같기도 하고...",
      createdAt: hoursAgo(2),
      likes: 12,
      liked: false,
      mine: false,
      comments: [
        { id: "c1", nickname: "치즈맘", body: "저희는 습식에 물 조금 섞어 줘요! 확실히 늘었어요.", createdAt: hoursAgo(1.5) },
        { id: "c2", nickname: "보리네", body: "급수기 여러 군데 두는 것도 효과 있었어요.", createdAt: hoursAgo(1) },
      ],
    },
    {
      id: "seed-2",
      nickname: "콩이누나",
      petName: "콩이",
      body: "오늘로 슬개골 수술 3주차! 산책 5분부터 다시 시작했어요. 꼬리 흔드는 거 보니까 눈물 나네요 🐶",
      createdAt: hoursAgo(9),
      likes: 31,
      liked: false,
      mine: false,
      comments: [{ id: "c3", nickname: "두부아빠", body: "콩이 화이팅!! 회복 잘 하길 바라요.", createdAt: hoursAgo(8) }],
    },
    {
      id: "seed-3",
      nickname: "살랑이집사",
      petName: "살랑이",
      body: "스탠드 불빛 아래서 찍은 사진. 이 표정 무슨 뜻일까요 ㅋㅋ",
      photo: SAMPLE_PHOTO,
      createdAt: hoursAgo(26),
      likes: 48,
      liked: false,
      mine: false,
      comments: [
        { id: "c4", nickname: "치즈맘", body: "\"불 꺼라 집사\" 같아요 ㅋㅋㅋ", createdAt: hoursAgo(25) },
        { id: "c5", nickname: "보리네", body: "샴 눈빛 너무 멋져요...", createdAt: hoursAgo(20) },
      ],
    },
    {
      id: "seed-4",
      nickname: "보리네",
      petName: "보리",
      body: "관절 영양제 추천 부탁드려요. 11살 믹스견인데 계단 오를 때 조금 머뭇거려요.",
      createdAt: hoursAgo(50),
      likes: 7,
      liked: false,
      mine: false,
      comments: [],
    },
  ];
}
