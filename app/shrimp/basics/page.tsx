import { BackButton } from "@/components/BackButton";

export default function BasicsPage() {
  return (
    <div className="shrimp-page">
      <div className="shrimp-back">
        <BackButton href="/shrimp" />
      </div>

      <div className="shrimp-main">
        <div className="shrimp-page-header">
          <p className="shrimp-hero-label">beginner guide</p>
          <h1 className="shrimp-hero-title">기본 사항</h1>
          <p className="shrimp-hero-desc">
            새우 사육을 시작하기 전 반드시 알아야 할<br />
            수질, 먹이, 환수, 번식의 기초.
          </p>
        </div>

        {/* 01 수질 관리 */}
        <div className="basics-chapter">
          <p className="basics-chapter-num">01</p>
          <h2 className="basics-chapter-title">수질 관리</h2>
          <p className="basics-text">
            새우는 물고기보다 수질 변화에 훨씬 민감합니다. 안정된 수질을 유지하는 것이
            건강한 사육의 핵심입니다. 크게 네오카리디나 계열과 카리디나 계열로 나뉘며
            요구하는 수질 조건이 다릅니다.
          </p>

          <p style={{ fontSize: "12px", opacity: 0.38, letterSpacing: "0.05em", marginBottom: "8px", textTransform: "uppercase" }}>
            네오카리디나 (체리·블루드림·화이트펄 등)
          </p>
          <div className="basics-params-grid">
            {[
              { name: "pH", value: "6.5 – 7.5", unit: "산성 ~ 약알칼리" },
              { name: "GH", value: "6 – 10", unit: "dGH · 총 경도" },
              { name: "KH", value: "2 – 6", unit: "dKH · 탄산 경도" },
              { name: "TDS", value: "150 – 250", unit: "ppm" },
              { name: "NO₂", value: "0", unit: "아질산염 (zero)" },
              { name: "NH₃", value: "0", unit: "암모니아 (zero)" },
            ].map((p) => (
              <div key={p.name} className="basics-param-card">
                <p className="basics-param-name">{p.name}</p>
                <p className="basics-param-value">{p.value}</p>
                <p className="basics-param-unit">{p.unit}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "12px", opacity: 0.38, letterSpacing: "0.05em", marginBottom: "8px", marginTop: "20px", textTransform: "uppercase" }}>
            카리디나 (크리스탈·타이거 등)
          </p>
          <div className="basics-params-grid">
            {[
              { name: "pH", value: "5.8 – 6.8", unit: "약산성" },
              { name: "GH", value: "3 – 6", unit: "dGH · 연수" },
              { name: "KH", value: "0 – 2", unit: "dKH · 낮을수록 좋음" },
              { name: "TDS", value: "80 – 150", unit: "ppm" },
              { name: "NO₂", value: "0", unit: "아질산염 (zero)" },
              { name: "NH₃", value: "0", unit: "암모니아 (zero)" },
            ].map((p) => (
              <div key={p.name} className="basics-param-card">
                <p className="basics-param-name">{p.name}</p>
                <p className="basics-param-value">{p.value}</p>
                <p className="basics-param-unit">{p.unit}</p>
              </div>
            ))}
          </div>

          <div className="basics-tips" style={{ marginTop: "20px" }}>
            {[
              "수조를 처음 설치하면 질소 사이클 완성까지 4–6주가 걸린다. 그 전에 새우를 입수하지 말 것.",
              "수질 변화는 급격히 하지 않는다. 환수 시 한 번에 전체 수량의 10–20%를 넘지 않는다.",
              "수돗물은 반드시 염소 제거제(예: Seachem Prime)로 처리 후 사용한다.",
            ].map((tip, i) => (
              <p key={i} className="basics-tip-item">— {tip}</p>
            ))}
          </div>
        </div>

        {/* 02 수온 */}
        <div className="basics-chapter">
          <p className="basics-chapter-num">02</p>
          <h2 className="basics-chapter-title">수온</h2>
          <p className="basics-text">
            대부분의 민물 새우는 20–26°C에서 건강하게 생활합니다. 고수온은 산소 부족과
            박테리아 증식을 일으키며, 저수온은 새우의 활동성과 번식력을 떨어뜨립니다.
            여름철 고수온이 가장 큰 폐사 원인 중 하나입니다.
          </p>
          <div className="basics-params-grid">
            {[
              { name: "적정 수온", value: "22 – 24", unit: "°C · 대부분 품종" },
              { name: "최저 한계", value: "16", unit: "°C · 이하 활동 저하" },
              { name: "최고 한계", value: "28", unit: "°C · 이상 위험" },
              { name: "일교차 허용", value: "± 1", unit: "°C · 이내 권장" },
            ].map((p) => (
              <div key={p.name} className="basics-param-card">
                <p className="basics-param-name">{p.name}</p>
                <p className="basics-param-value">{p.value}</p>
                <p className="basics-param-unit">{p.unit}</p>
              </div>
            ))}
          </div>
          <div className="basics-tips" style={{ marginTop: "20px" }}>
            {[
              "여름에는 소형 쿨러 팬이나 에어컨을 활용해 수온을 유지한다.",
              "히터는 수조 용량에 맞는 와트를 선택한다 (1L당 약 1W 기준).",
              "갑작스러운 수온 변화는 탈피 실패(탈피불능)를 유발할 수 있다.",
            ].map((tip, i) => (
              <p key={i} className="basics-tip-item">— {tip}</p>
            ))}
          </div>
        </div>

        {/* 03 먹이 주기 */}
        <div className="basics-chapter">
          <p className="basics-chapter-num">03</p>
          <h2 className="basics-chapter-title">먹이 주기</h2>
          <p className="basics-text">
            새우는 수조 내 이끼, 바이오필름, 유기물을 끊임없이 먹습니다.
            별도의 사료는 보충 개념으로 소량씩 주는 것이 맞습니다.
            과다 급여는 수질 악화의 가장 흔한 원인입니다.
          </p>
          <div className="basics-tips">
            {[
              "사료는 새우가 1–2시간 내 다 먹을 수 있는 양만 준다.",
              "먹다 남은 사료는 반드시 스포이드로 제거해 수질 오염을 막는다.",
              "주 2–3회 급여가 적당하다. 매일 줄 필요는 없다.",
              "단백질 과다 사료는 번식 활성화에 도움되지만 수질 부하를 높인다.",
              "탈피 전후 새우는 사료를 잘 먹지 않는다. 이는 정상이다.",
            ].map((tip, i) => (
              <p key={i} className="basics-tip-item">— {tip}</p>
            ))}
          </div>
        </div>

        {/* 04 환수 */}
        <div className="basics-chapter">
          <p className="basics-chapter-num">04</p>
          <h2 className="basics-chapter-title">환수 방법</h2>
          <p className="basics-text">
            정기 환수는 질산염(NO₃)을 제거하고 미네랄을 보충하는 핵심 관리입니다.
            단, 과한 환수나 급격한 수질 변화는 오히려 새우에게 스트레스가 됩니다.
          </p>
          <div className="basics-params-grid">
            {[
              { name: "환수 주기", value: "주 1회", unit: "또는 2주 1회" },
              { name: "환수 비율", value: "10 – 20", unit: "% / 1회" },
              { name: "새 물 온도차", value: "± 1", unit: "°C 이내" },
            ].map((p) => (
              <div key={p.name} className="basics-param-card">
                <p className="basics-param-name">{p.name}</p>
                <p className="basics-param-value">{p.value}</p>
                <p className="basics-param-unit">{p.unit}</p>
              </div>
            ))}
          </div>
          <div className="basics-tips" style={{ marginTop: "20px" }}>
            {[
              "환수 전 새 물을 미리 준비해 수온과 수질을 맞춰둔다.",
              "소일 위 퇴적물은 스포이드로 흡출해 질산염 축적을 막는다.",
              "RO 수를 사용한다면 미네랄 보충제(리미네랄라이저)로 GH/KH를 조정한다.",
            ].map((tip, i) => (
              <p key={i} className="basics-tip-item">— {tip}</p>
            ))}
          </div>
        </div>

        {/* 05 번식 */}
        <div className="basics-chapter">
          <p className="basics-chapter-num">05</p>
          <h2 className="basics-chapter-title">번식</h2>
          <p className="basics-text">
            수질과 영양 조건만 잘 갖추면 새우는 자연스럽게 번식합니다.
            암컷이 배 아래 알을 품은 상태를 &apos;포란&apos;이라 하며,
            약 3–4주 후 완전한 형태의 새끼가 태어납니다.
          </p>
          <div className="basics-params-grid">
            {[
              { name: "포란 기간", value: "3 – 4", unit: "주 (수온 의존)" },
              { name: "한 번에", value: "20 – 40", unit: "마리 (품종별 상이)" },
              { name: "성숙 시기", value: "3 – 4", unit: "개월령" },
            ].map((p) => (
              <div key={p.name} className="basics-param-card">
                <p className="basics-param-name">{p.name}</p>
                <p className="basics-param-value">{p.value}</p>
                <p className="basics-param-unit">{p.unit}</p>
              </div>
            ))}
          </div>
          <div className="basics-tips" style={{ marginTop: "20px" }}>
            {[
              "포란 중 암컷은 알에 지속적으로 물을 순환시킨다. 이 행동이 보이면 정상이다.",
              "새끼 새우는 부화 후 바로 수조 내 이끼와 바이오필름을 먹기 시작한다.",
              "스펀지 여과기를 사용해야 새끼가 흡입되지 않는다.",
              "다른 색상 변이종을 같은 수조에 넣으면 잡종이 생겨 발색이 흐려진다.",
            ].map((tip, i) => (
              <p key={i} className="basics-tip-item">— {tip}</p>
            ))}
          </div>
        </div>

        {/* 06 주의사항 */}
        <div className="basics-chapter">
          <p className="basics-chapter-num">06</p>
          <h2 className="basics-chapter-title">주의사항</h2>
          <div className="basics-tips">
            {[
              "구리(Cu)는 새우에게 치명적이다. 구리 성분이 포함된 어병 약품 사용 금지.",
              "새우 전용이 아닌 물고기 약품 대부분이 새우에게 유해하다.",
              "탈피 직후 새우는 몸이 매우 연약하다. 이 시기에 물고기와 합사하면 잡아먹힌다.",
              "소금(NaCl) 첨가는 대부분의 민물 새우에게 해롭다.",
              "새우는 갑작스러운 수질 변화에 '충격(shock)'을 받아 폐사할 수 있다. 입수 시 물 맞춤(점적법)을 권장.",
              "수조 뚜껑을 사용하자. 새우는 수조 밖으로 탈출하는 경우가 잦다.",
            ].map((tip, i) => (
              <p key={i} className="basics-tip-item">— {tip}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
