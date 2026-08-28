"use client";

import Link from "next/link";
import { BackButton } from "../../components/BackButton";

interface SubRoute {
  href: string;
  title: string;
  desc: string;
}

interface RouteItem {
  href: string;
  title: string;
  desc: string;
  children?: SubRoute[];
}

const ROUTES: RouteItem[] = [
  {
    href: "/make",
    title: "이야기",
    desc: "날짜순으로 쌓이는 글 목록과 상세 페이지",
  },
  {
    href: "/aquarium",
    title: "아쿠아리움",
    desc: "3D 어항 시뮬레이션. 포식자·중립·먹이 물고기가 헤엄치고, 클릭해서 먹이를 줄 수 있다",
  },
  {
    href: "/clothes",
    title: "옷장",
    desc: "검정 배경만 있는 미완성 페이지",
  },
  {
    href: "/body",
    title: "몸",
    desc: "인터랙티브 3D 고래상어 모델. 부위를 클릭하면 설명이 뜬다",
  },
  {
    href: "/photoworld",
    title: "포토월드",
    desc: "손 동작 인식(MediaPipe)으로 조작하는 3D 포토 갤러리",
  },
  {
    href: "/shrimp",
    title: "새우 키우기",
    desc: "민물 새우 사육 가이드 허브",
    children: [
      { href: "/shrimp/basics", title: "기본 사항", desc: "수질·수온·먹이·환수·번식 기초 정보" },
      { href: "/shrimp/species", title: "새우 종류", desc: "8종 대표 민물 새우 품종 카드" },
      { href: "/shrimp/tools", title: "필요 도구", desc: "사육에 필요한 장비 목록" },
      { href: "/shrimp/dashboard", title: "대시보드", desc: "수질 모니터링 & 사육 일지" },
    ],
  },
  {
    href: "/music",
    title: "뮤직",
    desc: "아티스트-곡 관계를 그래프로 탐색",
  },
  {
    href: "/guitar",
    title: "Chordial AI",
    desc: "카메라로 악보를 찍으면 코드·가사를 인식하고, 시선 추적으로 자동 스크롤",
  },
  {
    href: "/subscriptions",
    title: "구독",
    desc: "구독 서비스 지출 관리 및 환율 환산",
  },
  {
    href: "/cemeterypark",
    title: "공동묘지 공원",
    desc: "커서를 따라다니는 이미지가 멈추면 무한히 확대되는 인터랙션",
  },
  {
    href: "/mouse",
    title: "마우스",
    desc: "커스텀 커서 이미지가 배경 위를 따라다닌다",
  },
  {
    href: "/package",
    title: "짐싸기",
    desc: "3D 씬에 드래그 앤 드롭으로 짐을 싸는 패킹 시뮬레이터",
  },
  {
    href: "/portfolio",
    title: "포트폴리오",
    desc: "박성래 포트폴리오 — 스킬 · 프로젝트 · 트러블슈팅",
  },
  {
    href: "/theme",
    title: "테마",
    desc: "클릭 한 번으로 다크/라이트 테마 전환",
  },
];

const totalCount =
  ROUTES.length + ROUTES.reduce((n, r) => n + (r.children?.length ?? 0), 0);

export default function RoutePage() {
  return (
    <div className="route-page">
      <div className="route-back">
        <BackButton />
      </div>

      <div className="route-main">
        <div className="route-hero">
          <p className="route-hero-label">site map</p>
          <h1 className="route-hero-title">루트</h1>
          <p className="route-hero-desc">
            어디에도 연결되어 있지 않은 페이지들의 지도.
            <br />
            총 {totalCount}개 페이지.
          </p>
        </div>

        <ul className="route-list">
          {ROUTES.map((r, i) => (
            <li key={r.href} className="route-item">
              <Link href={r.href} className="route-link">
                <span className="route-index">{String(i + 1).padStart(2, "0")}</span>
                <span className="route-body">
                  <span className="route-title-row">
                    <span className="route-title">{r.title}</span>
                    <span className="route-path">{r.href}</span>
                  </span>
                  <span className="route-desc">{r.desc}</span>
                </span>
              </Link>

              {r.children && (
                <ul className="route-sublist">
                  {r.children.map((c) => (
                    <li key={c.href} className="route-subitem">
                      <Link href={c.href} className="route-sublink">
                        <span className="route-subtitle-row">
                          <span className="route-subtitle">{c.title}</span>
                          <span className="route-path">{c.href}</span>
                        </span>
                        <span className="route-subdesc">{c.desc}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <style jsx>{`
        .route-page {
          min-height: 100vh;
          background: var(--background);
          color: var(--foreground);
          padding: 24px;
        }

        .route-back {
          position: fixed;
          top: 24px;
          left: 24px;
          z-index: 100;
        }

        .route-main {
          max-width: 720px;
          margin: 0 auto;
          padding-top: 80px;
          padding-bottom: 80px;
        }

        .route-hero {
          margin-bottom: 64px;
        }

        .route-hero-label {
          font-size: 12px;
          opacity: 0.4;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .route-hero-title {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 300;
          line-height: 1;
          letter-spacing: -0.03em;
        }

        .route-hero-desc {
          margin-top: 24px;
          opacity: 0.5;
          font-size: 1rem;
          line-height: 1.6;
          max-width: 420px;
        }

        .route-list {
          list-style: none;
        }

        .route-item {
          border-bottom: 1px solid rgba(128, 128, 128, 0.15);
        }

        .route-link {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          padding: 24px 4px;
          text-decoration: none;
          color: var(--foreground);
          transition: opacity 0.2s ease;
        }

        .route-link:hover {
          opacity: 0.6;
        }

        .route-index {
          flex: none;
          width: 32px;
          padding-top: 3px;
          font-size: 12px;
          font-weight: 400;
          font-family: var(--font-geist-mono, monospace);
          opacity: 0.35;
          line-height: 1;
        }

        .route-body {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .route-title-row,
        .route-subtitle-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        .route-title {
          font-size: 1.1rem;
          font-weight: 500;
        }

        .route-subtitle {
          font-size: 0.95rem;
          font-weight: 500;
        }

        .route-path {
          font-size: 11px;
          opacity: 0.35;
          font-family: var(--font-geist-mono, monospace);
        }

        .route-desc,
        .route-subdesc {
          font-size: 13px;
          opacity: 0.5;
          line-height: 1.6;
        }

        .route-sublist {
          list-style: none;
          margin: 0 0 20px 60px;
          border-left: 1px solid rgba(128, 128, 128, 0.15);
        }

        .route-subitem {
          padding: 0 0 0 20px;
        }

        .route-sublink {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 4px;
          text-decoration: none;
          color: var(--foreground);
          transition: opacity 0.2s ease;
        }

        .route-sublink:hover {
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .route-main {
            padding-top: 64px;
          }
          .route-sublist {
            margin-left: 40px;
          }
        }
      `}</style>
    </div>
  );
}
