// 해마다 다른 테마 (간지 · 띠 동물 · 오행 색)
// 천간이 갑·을(목)이면 푸른색, 병·정(화)이면 붉은색, 무·기(토)면 노란색, 경·신(금)이면 흰색, 임·계(수)면 검은색.

/** 연도 전환 때 터지는 입자 모양 */
export type BurstKind = "coil" | "wave" | "gallop" | "fluff";

export interface YearTheme {
  hanja: string; // 간지 한자
  glyph: string; // 띠 한 글자 (배경에 크게)
  ganji: string; // 한글 간지
  title: string; // "푸른 용의 해"
  motto: string; // 짧은 문구
  bg: string; // 우주 배경색
  core: string; // 가장 밝은 빛 (공휴일 원 중심)
  warm: string; // 중간 빛
  hot: string; // 주 강조색
  deep: string; // 공휴일 원 위 숫자색
  cool: string; // 오늘 표시
  particles: string[];
  burst: BurstKind;
}

export const THEMES: Record<number, YearTheme> = {
  2024: {
    hanja: "甲辰",
    glyph: "辰",
    ganji: "갑진년",
    title: "푸른 용의 해",
    motto: "구름을 가르고 솟아오르는 해",
    bg: "#040914",
    core: "#eafcff",
    warm: "#6fe3ff",
    hot: "#2f7dff",
    deep: "#03142e",
    cool: "#ffd36b",
    particles: ["#eafcff", "#6fe3ff", "#2f7dff", "#7a6bff"],
    burst: "coil",
  },
  2025: {
    hanja: "乙巳",
    glyph: "巳",
    ganji: "을사년",
    title: "푸른 뱀의 해",
    motto: "허물을 벗고 새로 태어나는 해",
    bg: "#03100d",
    core: "#eafff4",
    warm: "#5ff2b8",
    hot: "#13b88a",
    deep: "#02261b",
    cool: "#f6e27a",
    particles: ["#eafff4", "#5ff2b8", "#13b88a", "#3ec6ff"],
    burst: "wave",
  },
  2026: {
    hanja: "丙午",
    glyph: "午",
    ganji: "병오년",
    title: "붉은 말의 해",
    motto: "멈추지 않고 내달리는 해",
    bg: "#0a0507",
    core: "#fff4dc",
    warm: "#ffb03a",
    hot: "#ff4b2b",
    deep: "#1d0904",
    cool: "#7fe7ff",
    particles: ["#fff4dc", "#ffb03a", "#ff4b2b", "#ff3d8b"],
    burst: "gallop",
  },
  2027: {
    hanja: "丁未",
    glyph: "未",
    ganji: "정미년",
    title: "붉은 양의 해",
    motto: "포근하게 쉬어 가는 해",
    bg: "#0d0709",
    core: "#fff3f0",
    warm: "#ffb4a8",
    hot: "#f0506e",
    deep: "#2a0910",
    cool: "#9fe8d8",
    particles: ["#fff3f0", "#ffd2c4", "#ffb4a8", "#f0506e"],
    burst: "fluff",
  },
};

const FALLBACK = THEMES[2026];
export const themeOf = (year: number) => THEMES[year] ?? FALLBACK;
