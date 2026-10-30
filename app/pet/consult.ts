// 데모용 상담 응답: 서버나 AI 모델 없이 키워드와 최근 기록으로 답을 만든다.
// 실제 서비스라면 이 자리를 AI 모델 호출로 바꾸면 된다.

import { daysAgo, type DayLog, type Pet, type Urgency } from "./store";

interface Rule {
  keywords: string[];
  urgency: Urgency | ((q: string, pet: Pet) => Urgency);
  title: string;
  advice: string[];
}

const URGENCY_RANK: Record<Urgency, number> = { low: 0, mid: 1, high: 2 };

const RULES: Rule[] = [
  {
    keywords: ["숨을", "숨쉬", "숨 쉬", "숨이", "호흡", "헐떡", "입 벌리"],
    urgency: "high",
    title: "호흡이 불편해 보이는 건 응급 신호일 수 있어요",
    advice: [
      "특히 고양이가 입을 벌리고 숨 쉬는 건 정상이 아니에요.",
      "잇몸이나 혀가 파랗거나 창백하면 바로 병원으로 가 주세요.",
      "이동할 때는 이동장에 넣고 최대한 조용하게 해 주세요.",
    ],
  },
  {
    keywords: ["경련", "발작", "쓰러", "의식"],
    urgency: "high",
    title: "경련이나 쓰러짐은 바로 진료가 필요해요",
    advice: [
      "주변의 부딪힐 만한 물건을 치우고, 입에 손을 넣지 마세요.",
      "시작 시각과 지속 시간을 기록하고, 가능하면 영상을 찍어 두세요.",
    ],
  },
  {
    keywords: ["초콜릿", "백합", "포도", "양파", "자일리톨", "삼켰", "이물", "실을 먹", "약을 먹"],
    urgency: "high",
    title: "먹으면 안 되는 걸 먹었다면 시간이 중요해요",
    advice: [
      "언제, 무엇을, 얼마나 먹었는지 확인해서 병원에 알려 주세요.",
      "억지로 토하게 하지 마세요. 물질에 따라 더 위험할 수 있어요.",
      "고양이는 백합 꽃가루만으로도 신장이 상할 수 있어요.",
    ],
  },
  {
    keywords: ["혈변", "혈뇨", "피가", "피를", "피 섞", "피섞"],
    urgency: "high",
    title: "피가 보이면 진료를 받아 보는 게 좋아요",
    advice: ["피가 나온 위치(대변·소변·구토)와 색, 양을 사진으로 남겨 병원에 보여 주세요."],
  },
  {
    keywords: ["소변", "오줌", "화장실", "방광"],
    urgency: (q, pet) =>
      /못|안 ?나|안나|자주|힘/.test(q) && pet.species === "cat" ? "high" : "mid",
    title: "소변 문제는 꼭 지켜봐야 해요",
    advice: [
      "화장실에 자주 들어가는데 소변이 거의 안 나오면, 특히 수컷 고양이는 요도가 막힌 응급일 수 있어요.",
      "소변 덩어리 크기와 횟수를 하루 동안 기록해 보세요.",
    ],
  },
  {
    keywords: ["구토", "토했", "토해", "토를", "헤어볼"],
    urgency: "mid",
    title: "구토는 횟수와 함께 나타나는 증상이 중요해요",
    advice: [
      "헤어볼을 가끔 토하는 건 흔하지만, 하루 여러 번이거나 며칠 이어지면 진료가 필요해요.",
      "토한 뒤에도 밥을 먹고 기운이 있는지 살펴보세요.",
      "토사물 사진을 찍어 두면 진료에 도움이 돼요.",
    ],
  },
  {
    keywords: ["설사", "묽", "변이"],
    urgency: "mid",
    title: "설사는 탈수를 조심해야 해요",
    advice: [
      "물을 충분히 마실 수 있게 해 주세요.",
      "하루 넘게 이어지거나, 피가 섞이거나, 기운이 없으면 병원에 가 보세요.",
      "최근에 사료나 간식을 바꿨다면 원래 먹던 것으로 돌려 보세요.",
    ],
  },
  {
    keywords: ["안 먹", "안먹", "식욕", "밥을", "사료를"],
    urgency: (q, pet) => (/이틀|하루|24/.test(q) && pet.species === "cat" ? "high" : "mid"),
    title: "밥을 안 먹는 건 원인을 찾아봐야 해요",
    advice: [
      "고양이는 하루 이상 굶으면 간에 무리가 갈 수 있어서 빨리 진료받는 게 좋아요.",
      "좋아하는 간식이나 습식은 먹는지 확인해 보세요.",
      "입 냄새나 침 흘림이 있다면 구강 문제일 수도 있어요.",
    ],
  },
  {
    keywords: ["물을 많이", "물 많이", "많이 마셔", "많이 마시", "물을 자주", "다음다갈", "다뇨"],
    urgency: "mid",
    title: "물을 갑자기 많이 마시면 검사를 받아 보세요",
    advice: [
      "신장이나 당뇨 같은 문제의 초기 신호일 수 있어요.",
      "하루 마시는 양을 대략 재서 기록해 두면 진료에 도움이 돼요.",
    ],
  },
  {
    keywords: ["기운", "무기력", "축 처", "숨어", "안 움직"],
    urgency: "mid",
    title: "평소보다 기운이 없으면 다른 증상도 함께 봐 주세요",
    advice: [
      "밥, 물, 화장실 변화가 같이 있다면 진료를 받아 보세요.",
      "숨거나 만지는 걸 싫어하면 통증이 있을 수 있어요.",
    ],
  },
  {
    keywords: ["기침", "재채기", "콧물", "코를"],
    urgency: "low",
    title: "가벼운 재채기는 지켜봐도 괜찮을 때가 많아요",
    advice: [
      "콧물이 누렇거나, 밥을 안 먹거나, 열이 있으면 진료를 받아 보세요.",
      "강아지의 거위 소리 같은 기침은 기관 문제일 수 있어요.",
    ],
  },
  {
    keywords: ["눈곱", "눈이", "눈을", "충혈", "눈물"],
    urgency: "low",
    title: "눈 증상은 빨리 볼수록 좋아요",
    advice: [
      "따뜻한 물에 적신 거즈로 부드럽게 닦아 주세요.",
      "눈을 잘 못 뜨거나 계속 비비면 각막 손상일 수 있어 진료가 필요해요.",
    ],
  },
  {
    keywords: ["귀를", "귀가", "귓", "귀 냄새", "머리를 흔", "긁"],
    urgency: "low",
    title: "귀를 자주 긁는다면 귓속을 살펴보세요",
    advice: ["검은 귀지나 냄새가 나면 귀 진드기나 외이염일 수 있어요. 면봉으로 깊이 파지는 마세요."],
  },
  {
    keywords: ["피부", "가려", "털이 빠", "탈모", "비듬"],
    urgency: "low",
    title: "피부 문제는 원인이 다양해요",
    advice: [
      "최근 바뀐 사료, 샴푸, 환경이 있는지 떠올려 보세요.",
      "한 곳만 계속 핥아서 털이 빠지면 스트레스나 통증 신호일 수도 있어요.",
    ],
  },
  {
    keywords: ["영양제", "유산균", "오메가", "관절", "비타민"],
    urgency: "low",
    title: "영양제는 아이 상태에 맞게 골라요",
    advice: [
      "유산균은 장 건강, 오메가3는 피부·관절에 많이 써요.",
      "여러 개를 함께 먹일 땐 성분이 겹치지 않는지 확인하고, 지병이 있다면 수의사와 상의해 주세요.",
      "오늘 탭에서 영양제를 체크하면 기록 탭에서 꾸준히 먹였는지 볼 수 있어요.",
    ],
  },
];

/** 최근 3일 기록에서 눈여겨볼 점을 찾는다 */
function recentSignals(logs: Record<string, DayLog>): { lines: string[]; escalate: boolean } {
  const recent = [0, 1, 2].map((n) => logs[daysAgo(n)]).filter(Boolean) as DayLog[];
  const vomits = recent.filter((l) => l.vomit).length;
  const diarrhea = recent.filter((l) => l.stool === "diarrhea").length;
  const lowAppetite = recent.filter((l) => l.appetite === 1).length;
  const lowEnergy = recent.filter((l) => l.energy === 1).length;

  const lines: string[] = [];
  if (vomits) lines.push(`최근 3일 중 ${vomits}일 구토 기록이 있어요.`);
  if (diarrhea) lines.push(`최근 3일 중 ${diarrhea}일 설사 기록이 있어요.`);
  if (lowAppetite) lines.push(`최근 3일 중 ${lowAppetite}일 식욕이 적었어요.`);
  if (lowEnergy) lines.push(`최근 3일 중 ${lowEnergy}일 기운이 없었어요.`);

  const escalate = vomits >= 2 || diarrhea >= 2 || (vomits >= 1 && lowAppetite >= 1 && lowEnergy >= 1);
  return { lines, escalate };
}

export function consultReply(question: string, pet: Pet, logs: Record<string, DayLog>): { text: string; urgency: Urgency } {
  const q = question.replace(/\s+/g, " ");
  const matched = RULES.filter((r) => r.keywords.some((k) => q.includes(k)));

  let urgency: Urgency = "low";
  for (const rule of matched) {
    const u = typeof rule.urgency === "function" ? rule.urgency(q, pet) : rule.urgency;
    if (URGENCY_RANK[u] > URGENCY_RANK[urgency]) urgency = u;
  }

  const signals = recentSignals(logs);
  if (signals.escalate && urgency === "mid") urgency = "high";

  const parts: string[] = [];
  if (matched.length === 0) {
    parts.push(
      `${pet.name}의 상태를 조금 더 알려 주시면 더 정확하게 도와드릴 수 있어요.`,
      "• 언제부터 그랬는지\n• 밥·물·화장실에 변화가 있는지\n• 기운은 평소와 같은지",
    );
  } else {
    for (const rule of matched.slice(0, 2)) {
      parts.push(`**${rule.title}**\n${rule.advice.map((a) => `• ${a}`).join("\n")}`);
    }
  }

  if (signals.lines.length) {
    parts.push(`📋 ${pet.name}의 기록을 보니\n${signals.lines.map((l) => `• ${l}`).join("\n")}`);
  }

  if (urgency === "high") {
    parts.push("🚨 지금은 집에서 지켜보기보다 병원에 바로 연락해 보시는 걸 권해요.");
  } else if (urgency === "mid") {
    parts.push("오늘 하루 지켜보시고, 나아지지 않거나 증상이 늘면 병원에 문의해 주세요.");
  }

  parts.push("※ 데모용 자동 응답이에요. 진단이 아니니 걱정되면 꼭 수의사와 상담해 주세요.");
  return { text: parts.join("\n\n"), urgency };
}
