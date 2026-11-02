import { HOLIDAYS } from "./holidays";

export const MONTHS_EN = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
export const WEEK_EN = ["S", "M", "T", "W", "T", "F", "S"];
export const WEEK_KO = ["일", "월", "화", "수", "목", "금", "토"];

export const pad = (n: number) => String(n).padStart(2, "0");
export const keyOf = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export function todayKey() {
  const d = new Date();
  return keyOf(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 해당 달을 7칸씩 채운 배열 (앞뒤 빈칸은 null). minCells까지 빈칸을 더 채운다 */
export function monthCells(year: number, month: number, minCells = 0) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 || cells.length < minCells) cells.push(null);
  return cells;
}

/** [YYYY-MM-DD, 이름] 목록 */
export function holidaysOf(year: number, month: number) {
  const prefix = `${year}-${pad(month + 1)}-`;
  return Object.entries(HOLIDAYS[year] ?? {}).filter(([k]) => k.startsWith(prefix));
}

/** 오늘 이후(오늘 포함) 가장 가까운 공휴일 */
export function nextHoliday(fromKey: string) {
  const all = Object.values(HOLIDAYS)
    .flatMap((y) => Object.entries(y))
    .sort(([a], [b]) => a.localeCompare(b));
  const hit = all.find(([k]) => k >= fromKey);
  if (!hit) return null;
  const toUtc = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
  return { key: hit[0], name: hit[1], days: Math.round((toUtc(hit[0]) - toUtc(fromKey)) / 86400000) };
}
