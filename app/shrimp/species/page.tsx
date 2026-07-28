import { BackButton } from "@/components/BackButton";

const species = [
  {
    nameKr: "체리 새우",
    nameLatin: "Neocaridina davidi var. red",
    difficulty: "초급",
    color: "#d94040",
    desc: "초보자에게 가장 추천하는 품종. 강한 적응력과 번식력을 갖추고 있으며 수조의 이끼 제거에 탁월하다.",
    ph: "6.5 – 7.5",
    temp: "20 – 26°C",
    tds: "150 – 250",
  },
  {
    nameKr: "블루 드림",
    nameLatin: "Neocaridina davidi var. blue velvet",
    difficulty: "초급",
    color: "#3b6fd4",
    desc: "체리 새우와 동일 종의 색상 변이종. 선명한 파란색이 특징이며 체리 새우와 혼합 사육 시 잡종이 생긴다.",
    ph: "6.5 – 7.5",
    temp: "20 – 26°C",
    tds: "150 – 250",
  },
  {
    nameKr: "아마노 새우",
    nameLatin: "Caridina multidentata",
    difficulty: "초급",
    color: "#8a8a7a",
    desc: "이끼 제거 능력이 탁월한 대형 새우. 번식은 해수 유생 단계가 필요해 자연 번식이 어렵다.",
    ph: "6.5 – 7.5",
    temp: "18 – 25°C",
    tds: "100 – 200",
  },
  {
    nameKr: "크리스탈 레드",
    nameLatin: "Caridina cantonensis var. crystal red",
    difficulty: "고급",
    color: "#cc2222",
    desc: "적백 줄무늬의 화려한 고급 품종. 수질에 매우 민감하며 연수와 낮은 pH를 요구한다. 등급(S, SS, SSS)에 따라 가격 차이가 크다.",
    ph: "5.8 – 6.8",
    temp: "20 – 24°C",
    tds: "80 – 150",
  },
  {
    nameKr: "크리스탈 블랙",
    nameLatin: "Caridina cantonensis var. crystal black",
    difficulty: "고급",
    color: "#222222",
    desc: "크리스탈 레드의 흑백 변이종. 동일한 까다로운 수질 조건을 요구하며 크리스탈 레드와 교배해 모자이크 패턴 새우를 얻을 수 있다.",
    ph: "5.8 – 6.8",
    temp: "20 – 24°C",
    tds: "80 – 150",
  },
  {
    nameKr: "유령 새우",
    nameLatin: "Palaemonetes paludosus",
    difficulty: "초급",
    color: "#c8c8c8",
    desc: "완전히 투명한 몸체로 내장이 보이는 독특한 종. 매우 저렴하고 강건하지만 다른 물고기와 합사 시 먹힐 수 있다.",
    ph: "7.0 – 8.0",
    temp: "18 – 27°C",
    tds: "150 – 300",
  },
  {
    nameKr: "타이거 새우",
    nameLatin: "Caridina mariae",
    difficulty: "중급",
    color: "#8b5a2b",
    desc: "갈색 바탕의 검은 줄무늬가 호랑이를 연상시키는 품종. 크리스탈 새우보다 강건하지만 역시 연수를 선호한다.",
    ph: "6.0 – 7.0",
    temp: "20 – 25°C",
    tds: "100 – 200",
  },
  {
    nameKr: "화이트 펄",
    nameLatin: "Neocaridina zhangjiajiensis var. white",
    difficulty: "초급",
    color: "#f0f0f0",
    desc: "순백색의 깔끔한 외관이 특징인 네오카리디나 계열 품종. 체리 새우와 동일한 수질 조건을 공유하며 관리가 쉽다.",
    ph: "6.5 – 7.5",
    temp: "20 – 26°C",
    tds: "150 – 250",
  },
];

const difficultyColor: Record<string, string> = {
  초급: "rgba(74, 222, 128, 0.6)",
  중급: "rgba(251, 191, 36, 0.6)",
  고급: "rgba(248, 113, 113, 0.6)",
};

export default function SpeciesPage() {
  return (
    <div className="shrimp-page">
      <div className="shrimp-back">
        <BackButton href="/shrimp" />
      </div>

      <div className="shrimp-main">
        <div className="shrimp-page-header">
          <p className="shrimp-hero-label">species guide</p>
          <h1 className="shrimp-hero-title">새우 종류</h1>
          <p className="shrimp-hero-desc">
            민물 새우의 대표적인 8가지 품종.<br />
            난이도와 수질 조건을 확인하세요.
          </p>
        </div>

        <div className="species-grid">
          {species.map((s) => (
            <div key={s.nameKr} className="species-card">
              <div
                className="species-color-dot"
                style={{
                  background: s.color,
                  border: s.color === "#f0f0f0" || s.color === "#c8c8c8"
                    ? "1px solid rgba(128,128,128,0.3)"
                    : "none",
                }}
              />
              <p className="species-name-kr">{s.nameKr}</p>
              <p className="species-name-latin">{s.nameLatin}</p>
              <span
                className="species-badge"
                style={{ borderColor: difficultyColor[s.difficulty], color: "var(--foreground)" }}
              >
                {s.difficulty}
              </span>
              <p className="species-desc">{s.desc}</p>
              <div className="species-params">
                <div>
                  <p className="species-param-label">pH</p>
                  <p className="species-param-value">{s.ph}</p>
                </div>
                <div>
                  <p className="species-param-label">수온</p>
                  <p className="species-param-value">{s.temp}</p>
                </div>
                <div>
                  <p className="species-param-label">TDS</p>
                  <p className="species-param-value">{s.tds}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
