import { BackButton } from "@/components/BackButton";

const categories = [
  {
    label: "필수 장비",
    items: [
      {
        name: "수조",
        sub: "Aquarium Tank",
        desc: "20L 이상을 권장. 새우는 작은 수조에서도 살 수 있지만 수질 안정성을 위해 용량이 클수록 좋다. 큐브형(30×30×30cm)이 초보자에게 적합하다.",
        importance: "필수",
      },
      {
        name: "스펀지 여과기",
        sub: "Sponge Filter",
        desc: "새우에게 가장 안전한 여과 방식. 강한 흡입력이 없어 새우가 빨려 들어가지 않으며 여과재에 유익균이 풍부하게 서식한다. 에어 펌프와 함께 사용.",
        importance: "필수",
      },
      {
        name: "에어 펌프",
        sub: "Air Pump",
        desc: "스펀지 여과기 구동에 필요. 산소 공급과 수류 생성 역할도 한다. 소음이 작은 진동막 방식을 선택하는 것이 좋다.",
        importance: "필수",
      },
      {
        name: "히터 & 온도계",
        sub: "Heater & Thermometer",
        desc: "수온을 20–26°C로 유지. 새우는 급격한 수온 변화에 취약하다. 정밀 제어가 가능한 전자식 히터와 디지털 온도계를 함께 사용.",
        importance: "필수",
      },
    ],
  },
  {
    label: "수질 관리",
    items: [
      {
        name: "RO 정수기 / 순수기",
        sub: "RO Filter",
        desc: "수돗물의 염소·중금속·경도를 완전 제거. 특히 크리스탈 계열처럼 연수를 요구하는 품종에 필수적이다. 카리디나 계열 사육 시 강력 권장.",
        importance: "권장",
      },
      {
        name: "수질 테스트 키트",
        sub: "Water Test Kit",
        desc: "pH, GH, KH, NO3, NO2, NH3 측정. API 또는 JBL 제품이 신뢰도가 높다. 수조 초기 설치 및 이상 징후 발생 시 필수적으로 사용.",
        importance: "필수",
      },
      {
        name: "TDS 미터",
        sub: "TDS Meter",
        desc: "물의 총 용존 고형물 농도(ppm)를 측정. 매일 확인해 수질 변화를 빠르게 파악할 수 있다. 저렴하고 사용이 간단해 기본 장비로 추천.",
        importance: "필수",
      },
      {
        name: "염소 제거제",
        sub: "Dechlorinator",
        desc: "수돗물 환수 시 반드시 사용. 염소와 클로라민을 즉시 중화. Seachem Prime이 대표적으로 소량으로도 효과가 좋다.",
        importance: "필수",
      },
    ],
  },
  {
    label: "환경 조성",
    items: [
      {
        name: "바닥재",
        sub: "Substrate",
        desc: "네오카리디나: 일반 소일 또는 산호사 가능. 카리디나: pH를 낮추는 전용 소일(ADA 아마조니아, Mr.Aqua 등) 사용 필수. 소일은 1–2년 후 교체 필요.",
        importance: "필수",
      },
      {
        name: "LED 조명",
        sub: "LED Light",
        desc: "수초 성장과 새우의 발색에 영향. 하루 8–10시간 점등을 권장. 너무 강한 조명은 이끼 발생을 촉진하므로 조도 조절이 가능한 제품이 좋다.",
        importance: "권장",
      },
      {
        name: "수초",
        sub: "Aquatic Plants",
        desc: "자바 모스, 리카르디아, 그린 나나 등. 새우에게 은신처와 이동 경로를 제공하며 수질 정화에도 도움. 유목이나 돌에 부착해 배치.",
        importance: "권장",
      },
      {
        name: "유목 / 돌",
        sub: "Driftwood & Rocks",
        desc: "유목은 타닌을 방출해 pH를 낮추고 항균 효과가 있다. 새우의 은신처가 되며 탈피 후 먹을 수 있는 바이오필름이 형성된다.",
        importance: "권장",
      },
    ],
  },
  {
    label: "먹이 & 관리",
    items: [
      {
        name: "전용 새우 사료",
        sub: "Shrimp Food",
        desc: "Shrimp King, GlasGarten 등 전용 사료를 사용. 이끼·바이오필름으로 상당 부분 보충되므로 소량씩 격일 급여를 권장. 먹다 남은 사료는 반드시 제거.",
        importance: "필수",
      },
      {
        name: "자연식 간식",
        sub: "Natural Supplement",
        desc: "건조 뽕잎, 아몬드 잎(IAL), 시금치 데친 것 등. 새우가 자연에서 섭취하는 영양소를 보충하고 소화를 돕는다. 주 1–2회 소량 급여.",
        importance: "선택",
      },
      {
        name: "피펫 & 스포이드",
        sub: "Pipette",
        desc: "잔여 사료 제거 및 바닥 청소에 사용. 환수 시 새우를 안전하게 이동시킬 때도 활용. 큰 스포이드와 작은 피펫 각 1개씩 준비 권장.",
        importance: "권장",
      },
    ],
  },
];

const importanceStyle: Record<string, { borderColor: string }> = {
  필수: { borderColor: "rgba(248, 113, 113, 0.4)" },
  권장: { borderColor: "rgba(251, 191, 36, 0.4)" },
  선택: { borderColor: "rgba(128, 128, 128, 0.3)" },
};

export default function ToolsPage() {
  return (
    <div className="shrimp-page">
      <div className="shrimp-back">
        <BackButton href="/shrimp" />
      </div>

      <div className="shrimp-main">
        <div className="shrimp-page-header">
          <p className="shrimp-hero-label">equipment guide</p>
          <h1 className="shrimp-hero-title">필요 도구</h1>
          <p className="shrimp-hero-desc">
            새우 사육에 필요한 장비 목록.<br />
            필수 · 권장 · 선택 순으로 우선순위를 정리했습니다.
          </p>
        </div>

        {categories.map((cat) => (
          <div key={cat.label} className="tools-category">
            <p className="tools-category-title">{cat.label}</p>
            {cat.items.map((tool) => (
              <div key={tool.name} className="tool-item">
                <div>
                  <p className="tool-name">{tool.name}</p>
                  <p className="tool-name-sub">{tool.sub}</p>
                  <p className="tool-desc">{tool.desc}</p>
                </div>
                <span
                  className="tool-importance"
                  style={importanceStyle[tool.importance]}
                >
                  {tool.importance}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
