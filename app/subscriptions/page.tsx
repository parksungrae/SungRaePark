"use client";

import { useMemo, useSyncExternalStore } from "react";
import { BackButton } from "../../components/BackButton";

/** 달러 구독 환산 기준 환율 (원/USD) */
const USD_TO_KRW = 1400;

interface Trial {
  /** 체험 시작일 (YYYY-MM-DD) */
  startedAt: string;
  /** 무료 개월 수 */
  months: number;
  /** 체험 종료 후 월 청구액 (원) */
  afterAmount: number;
}

interface Subscription {
  name: string;
  hanja: string;
  category: string;
  /** 이번 달 실제 청구액 (원). 무료 체험 중이면 0 */
  amount: number;
  /** 원화가 아닌 통화로 결제되는 경우 원 표기 */
  nativeLabel?: string;
  /** 매월 결제일 (일). 체험 구독은 생략 */
  billingDay?: number;
  trial?: Trial;
}

const SUBSCRIPTIONS: Subscription[] = [
  {
    name: "Claude",
    hanja: "智",
    category: "AI",
    amount: 22 * USD_TO_KRW,
    nativeLabel: "$22",
    billingDay: 1,
  },
  {
    name: "YouTube Premium",
    hanja: "映",
    category: "미디어",
    amount: 14000,
    billingDay: 1,
  },
  {
    name: "쿠팡 와우",
    hanja: "配",
    category: "커머스",
    amount: 5000,
    billingDay: 1,
  },
  {
    name: "배달의민족",
    hanja: "食",
    category: "커머스",
    amount: 5000,
    billingDay: 1,
  },
  {
    name: "iCloud+",
    hanja: "雲",
    category: "스토리지",
    amount: 800,
    billingDay: 1,
  },
  {
    name: "Apple Creator Studio",
    hanja: "作",
    category: "크리에이터",
    amount: 0,
    trial: {
      startedAt: "2026-07-31",
      months: 3,
      afterAmount: 19000,
    },
  },
];

const KRW = new Intl.NumberFormat("ko-KR");

const formatKRW = (value: number) => `${KRW.format(Math.round(value))}원`;

const parseDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** 월말 보정을 포함한 개월 수 더하기 (1/31 + 1개월 = 2/28) */
const addMonths = (date: Date, months: number) => {
  const result = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0
  ).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
};

const formatDate = (date: Date) =>
  `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;

const daysBetween = (from: Date, to: Date) =>
  Math.ceil((to.getTime() - from.getTime()) / 86400000);

/** 매월 billingDay에 결제되는 구독의 다음 결제일 (today는 자정으로 정규화된 값) */
const nextMonthlyDate = (today: Date, billingDay: number) => {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), billingDay);
  return thisMonth.getTime() >= today.getTime()
    ? thisMonth
    : new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
};

const trialEndDate = (trial: Trial) =>
  addMonths(parseDate(trial.startedAt), trial.months);

const subscribeNoop = () => () => {};

/** 오늘 날짜 (YYYY-MM-DD). 서버 렌더에서는 null — 타임존 차이로 인한 하이드레이션 불일치 방지 */
const getTodayKey = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const useToday = () => {
  const key = useSyncExternalStore(subscribeNoop, getTodayKey, () => null);
  return useMemo(() => (key ? parseDate(key) : null), [key]);
};

export default function SubscriptionsPage() {
  const today = useToday();

  const totals = useMemo(() => {
    const monthly = SUBSCRIPTIONS.reduce((sum, s) => sum + s.amount, 0);
    const afterTrials = SUBSCRIPTIONS.reduce(
      (sum, s) => sum + (s.trial ? s.trial.afterAmount : s.amount),
      0
    );
    const max = Math.max(...SUBSCRIPTIONS.map((s) => s.trial?.afterAmount ?? s.amount));
    return { monthly, afterTrials, max, yearly: monthly * 12 };
  }, []);

  return (
    <div className="sub-container">
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}>
        <BackButton />
      </div>

      <header className="sub-hero">
        <span className="sub-eyebrow">SUBSCRIPTIONS</span>
        <h1 className="sub-title">구독</h1>
        <p className="sub-lead">
          매달 자동으로 빠져나가는 것들. 대부분 매월 1일에 정기 결제되고,
          체험 중인 항목은 종료일에 첫 청구가 시작됩니다.
        </p>
      </header>

      <section className="sub-stats">
        <div className="sub-stat">
          <span className="sub-stat-label">이번 달 청구</span>
          <strong className="sub-stat-value">{formatKRW(totals.monthly)}</strong>
          <span className="sub-stat-sub">
            체험 종료 후 {formatKRW(totals.afterTrials)}
          </span>
        </div>
        <div className="sub-stat">
          <span className="sub-stat-label">연 환산</span>
          <strong className="sub-stat-value">{formatKRW(totals.yearly)}</strong>
          <span className="sub-stat-sub">현재 청구액 × 12</span>
        </div>
        <div className="sub-stat">
          <span className="sub-stat-label">구독 수</span>
          <strong className="sub-stat-value">{SUBSCRIPTIONS.length}개</strong>
          <span className="sub-stat-sub">
            청구중 {SUBSCRIPTIONS.filter((s) => !s.trial).length} · 체험{" "}
            {SUBSCRIPTIONS.filter((s) => s.trial).length}
          </span>
        </div>
      </section>

      <section className="sub-section">
        <h2 className="sub-section-title">
          <span className="sub-hanja">目</span> 목록
        </h2>

        <ul className="sub-list">
          {SUBSCRIPTIONS.map((item) => {
            const monthlyAmount = item.trial ? item.trial.afterAmount : item.amount;
            const share = totals.max > 0 ? monthlyAmount / totals.max : 0;
            const endsAt = item.trial ? trialEndDate(item.trial) : null;
            const nextDate =
              today && item.billingDay
                ? nextMonthlyDate(today, item.billingDay)
                : endsAt;
            const dday = today && nextDate ? daysBetween(today, nextDate) : null;

            return (
              <li className="sub-item" key={item.name}>
                <div className="sub-item-main">
                  <span className="sub-item-hanja">{item.hanja}</span>
                  <div className="sub-item-name-wrap">
                    <h3 className="sub-item-name">{item.name}</h3>
                    <span className="sub-item-category">{item.category}</span>
                  </div>
                  <span
                    className={`sub-badge ${item.trial ? "trial" : "active"}`}
                  >
                    {item.trial ? `무료 체험 ${item.trial.months}개월` : "청구중"}
                  </span>
                </div>

                <div className="sub-item-meta">
                  <div className="sub-amount">
                    <strong className="sub-amount-value">
                      {item.trial ? "0원" : formatKRW(item.amount)}
                    </strong>
                    {item.nativeLabel && (
                      <span className="sub-amount-native">
                        {item.nativeLabel} · 환율 {KRW.format(USD_TO_KRW)}원 기준
                      </span>
                    )}
                    {item.trial && (
                      <span className="sub-amount-native">
                        체험 종료 후 {formatKRW(item.trial.afterAmount)} / 월
                      </span>
                    )}
                  </div>

                  <div className="sub-schedule">
                    {item.billingDay ? (
                      <span className="sub-cycle">매월 {item.billingDay}일</span>
                    ) : (
                      <span className="sub-cycle">
                        {formatDate(parseDate(item.trial!.startedAt))} 시작
                      </span>
                    )}
                    <span className="sub-next">
                      {nextDate ? (
                        <>
                          {item.trial ? "첫 청구" : "다음 결제"}{" "}
                          {formatDate(nextDate)}
                          {dday !== null && (
                            <span className="sub-dday">
                              {dday === 0 ? "D-DAY" : `D-${dday}`}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="sub-placeholder">—</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="sub-bar" aria-hidden="true">
                  <div
                    className={`sub-bar-fill ${item.trial ? "muted" : ""}`}
                    style={{ width: `${Math.max(share * 100, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="sub-footer">
        <p className="sub-note">
          막대 길이는 월 정액 기준 비중입니다. 체험 중인 항목은 종료 후 금액으로
          그려집니다.
        </p>
      </footer>

      <style jsx global>{`
        .sub-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 100px 24px 80px;
        }

        .sub-eyebrow {
          display: block;
          font-size: 12px;
          letter-spacing: 0.2em;
          opacity: 0.5;
          margin-bottom: 16px;
        }

        .sub-title {
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 20px;
        }

        .sub-lead {
          max-width: 620px;
          font-size: 1rem;
          line-height: 1.8;
          opacity: 0.75;
          margin: 0;
        }

        .sub-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 56px;
        }

        .sub-stat {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 24px;
          border: 1px solid rgba(128, 128, 128, 0.25);
        }

        .sub-stat-label {
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          opacity: 0.5;
        }

        .sub-stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }

        .sub-stat-sub {
          font-size: 0.8rem;
          opacity: 0.55;
        }

        .sub-section {
          margin-top: 96px;
        }

        .sub-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(128, 128, 128, 0.25);
        }

        .sub-hanja {
          font-weight: 400;
          font-size: 1.1rem;
          opacity: 0.5;
        }

        .sub-list {
          list-style: none;
          display: flex;
          flex-direction: column;
        }

        .sub-item {
          padding: 24px 0 20px;
          border-bottom: 1px solid rgba(128, 128, 128, 0.18);
        }

        .sub-item-main {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sub-item-hanja {
          font-size: 1rem;
          opacity: 0.4;
          width: 20px;
          flex-shrink: 0;
        }

        .sub-item-name-wrap {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .sub-item-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .sub-item-category {
          font-size: 0.75rem;
          opacity: 0.45;
        }

        .sub-badge {
          font-size: 0.7rem;
          letter-spacing: 0.02em;
          padding: 4px 10px;
          border: 1px solid rgba(128, 128, 128, 0.35);
          white-space: nowrap;
        }

        .sub-badge.active {
          opacity: 0.6;
        }

        .sub-badge.trial {
          border-color: var(--foreground);
          opacity: 0.9;
        }

        .sub-item-meta {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-top: 12px;
          padding-left: 32px;
        }

        .sub-amount {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sub-amount-value {
          font-size: 1.3rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.01em;
        }

        .sub-amount-native {
          font-size: 0.78rem;
          opacity: 0.5;
        }

        .sub-schedule {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          text-align: right;
          font-size: 0.82rem;
        }

        .sub-cycle {
          opacity: 0.75;
        }

        .sub-next {
          opacity: 0.5;
          font-variant-numeric: tabular-nums;
        }

        .sub-dday {
          margin-left: 8px;
          padding: 2px 6px;
          border: 1px solid rgba(128, 128, 128, 0.35);
          font-size: 0.72rem;
        }

        .sub-placeholder {
          opacity: 0.3;
        }

        .sub-bar {
          height: 4px;
          margin: 16px 0 0 32px;
          background: rgba(128, 128, 128, 0.15);
        }

        .sub-bar-fill {
          height: 100%;
          background: var(--foreground);
          border-radius: 0 2px 2px 0;
          opacity: 0.7;
          transition: width 0.4s ease;
        }

        .sub-bar-fill.muted {
          opacity: 0.25;
        }

        .sub-footer {
          margin-top: 48px;
        }

        .sub-note {
          font-size: 0.8rem;
          line-height: 1.7;
          opacity: 0.45;
          margin: 0;
        }

        @media (max-width: 768px) {
          .sub-container {
            padding: 90px 20px 60px;
          }

          .sub-title {
            font-size: 2.2rem;
          }

          .sub-stats {
            grid-template-columns: 1fr;
            margin-top: 40px;
          }

          .sub-section {
            margin-top: 64px;
          }

          .sub-item-meta {
            flex-direction: column;
            align-items: flex-start;
            padding-left: 32px;
          }

          .sub-schedule {
            align-items: flex-start;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
