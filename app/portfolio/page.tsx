"use client";

import Link from "next/link";
import { type LucideIcon, Box, Hand, ScanText, ScanFace, Braces, Network } from "lucide-react";
import { BackButton } from "../../components/BackButton";

interface SkillItem {
  name: string;
  icon?: string; // simple-icons slug
  fallback?: LucideIcon; // used when no official brand icon exists
}

const SKILL_GROUPS: { title: string; items: SkillItem[] }[] = [
  {
    title: "Language & Core",
    items: [
      { name: "TypeScript", icon: "typescript" },
      { name: "JavaScript (ES2022+)", icon: "javascript" },
      { name: "HTML5", icon: "html5" },
    ],
  },
  {
    title: "Framework",
    items: [
      { name: "React 19", icon: "react" },
      { name: "Next.js (App Router)", icon: "nextdotjs" },
      { name: "Node.js", icon: "nodedotjs" },
    ],
  },
  {
    title: "3D / Graphics",
    items: [
      { name: "Three.js", icon: "threedotjs" },
      { name: "React Three Fiber", fallback: Box },
      { name: "WebGL", icon: "webgl" },
    ],
  },
  {
    title: "Vision & Media",
    items: [
      { name: "MediaPipe (Hand Tracking)", fallback: Hand },
      { name: "Tesseract.js (OCR)", fallback: ScanText },
      { name: "Face-api.js", fallback: ScanFace },
    ],
  },
  {
    title: "Styling & Motion",
    items: [
      { name: "Tailwind CSS", icon: "tailwindcss" },
      { name: "Framer Motion", icon: "framer" },
      { name: "CSS-in-JS", fallback: Braces },
    ],
  },
  {
    title: "Data Viz & Tooling",
    items: [
      { name: "Sigma.js / Graphology", fallback: Network },
      { name: "Git", icon: "git" },
      { name: "ESLint", icon: "eslint" },
      { name: "Vercel", icon: "vercel" },
    ],
  },
];

const PROJECTS = [
  {
    title: "PhotoWorld",
    hanja: "寫",
    href: "/photoworld",
    description:
      "손짓으로 회전·확대하는 3D 사진 갤러리. MediaPipe 손 추적으로 줌, 회전, 선택 제스처를 인식해 React Three Fiber 구(球) 위의 사진들을 조작합니다.",
    tags: ["React Three Fiber", "MediaPipe", "WebGL"],
  },
  {
    title: "Aquarium",
    hanja: "魚",
    href: "/aquarium",
    description:
      "포식자·피식자 관계와 먹이 활동을 가진 30마리 물고기의 실시간 3D 행동 시뮬레이션.",
    tags: ["Three.js", "Simulation"],
  },
  {
    title: "Body",
    hanja: "身",
    href: "/body",
    description:
      "3D 인체 모델 위에서 근육별 명칭·기능·운동 정보를 탐색할 수 있는 인터랙티브 해부 뷰어.",
    tags: ["React Three Fiber", "Framer Motion"],
  },
  {
    title: "Guitar Chord Reader",
    hanja: "弦",
    href: "/guitar",
    description:
      "코드 악보 사진을 OCR로 텍스트화하고, 아이트래킹으로 자동 스크롤을 제어하는 연주용 웹 앱.",
    tags: ["Tesseract.js", "OCR", "Eye Tracking"],
  },
  {
    title: "Music Graph",
    hanja: "歌",
    href: "/music",
    description:
      "아티스트와 곡의 관계를 힘-방향 그래프 레이아웃으로 탐색하는 인터랙티브 네트워크 뷰.",
    tags: ["Sigma.js", "Graphology"],
  },
];

const FOCUS_AREAS = [
  {
    title: "Interactive UI",
    description:
      "마우스, 카메라, 손짓 등 다양한 입력을 실시간으로 반영하는 반응형 인터페이스를 설계합니다.",
  },
  {
    title: "3D & WebGL",
    description:
      "React Three Fiber로 브라우저 3D 씬을 구성하고, 프레임 드랍 없이 동작하도록 렌더링 성능을 튜닝합니다.",
  },
  {
    title: "Browser Computer Vision",
    description:
      "MediaPipe, Tesseract.js 등 클라이언트 사이드 ML 모델을 통합해 카메라·이미지 기반 인터랙션을 만듭니다.",
  },
  {
    title: "Component Architecture",
    description:
      "재사용 가능한 컴포넌트 설계와 상태 관리로 유지보수 가능한 프론트엔드 구조를 만듭니다.",
  },
];

export default function PortfolioPage() {
  return (
    <div className="portfolio-container">
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}>
        <BackButton />
      </div>

      <header className="pf-hero">
        <img src="/profile.jpg" alt="박성래" className="pf-photo" />
        <span className="pf-eyebrow">PORTFOLIO</span>
        <h1 className="pf-name">박성래</h1>
        <p className="pf-role">Frontend Developer · 4년차</p>
        <p className="pf-intro">
          화면 너머의 상호작용을 만드는 프론트엔드 개발자입니다. React와
          Three.js를 오가며 브라우저에서 가능한 표현의 경계를 실험하고,
          손짓 인식·3D 렌더링·실시간 애니메이션처럼 일반적인 웹 UI를
          넘어서는 인터페이스를 구현하는 데 관심이 있습니다.
        </p>
      </header>

      <section className="pf-section">
        <h2 className="pf-section-title">
          <span className="pf-hanja">技</span> Skills
        </h2>
        <div className="pf-skills-grid">
          {SKILL_GROUPS.map((group) => (
            <div className="pf-skill-group" key={group.title}>
              <h3 className="pf-skill-title">{group.title}</h3>
              <ul className="pf-skill-list">
                {group.items.map((item) => (
                  <li className="pf-skill-item" key={item.name}>
                    <span>{item.name}</span>
                    {item.icon ? (
                      <img
                        src={`https://cdn.simpleicons.org/${item.icon}/ffffff`}
                        alt=""
                        className="pf-skill-icon"
                      />
                    ) : item.fallback ? (
                      <item.fallback size={16} className="pf-skill-icon-fallback" />
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="pf-section">
        <h2 className="pf-section-title">
          <span className="pf-hanja">作</span> Projects
        </h2>
        <div className="pf-projects">
          {PROJECTS.map((project) => (
            <Link href={project.href} key={project.title} className="pf-project">
              <div className="pf-project-head">
                <span className="pf-project-hanja">{project.hanja}</span>
                <h3 className="pf-project-title">{project.title}</h3>
              </div>
              <p className="pf-project-desc">{project.description}</p>
              <div className="pf-project-tags">
                {project.tags.map((tag) => (
                  <span className="pf-tag" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="pf-section">
        <h2 className="pf-section-title">
          <span className="pf-hanja">心</span> Focus
        </h2>
        <div className="pf-focus-grid">
          {FOCUS_AREAS.map((area) => (
            <div className="pf-focus-item" key={area.title}>
              <h3 className="pf-focus-title">{area.title}</h3>
              <p className="pf-focus-desc">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="pf-footer">
        <h2 className="pf-section-title">
          <span className="pf-hanja">信</span> Contact
        </h2>
        <a href="mailto:qazwsxez0806@gmail.com" className="pf-email">
          qazwsxez0806@gmail.com
        </a>
      </footer>

      <style jsx global>{`
        .portfolio-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 100px 24px 80px;
        }

        .pf-photo {
          width: 128px;
          height: 128px;
          border-radius: 50%;
          object-fit: cover;
          filter: grayscale(1) contrast(1.05);
          border: 1px solid rgba(128, 128, 128, 0.3);
          margin-bottom: 28px;
        }

        .pf-eyebrow {
          display: block;
          font-size: 12px;
          letter-spacing: 0.2em;
          opacity: 0.5;
          margin-bottom: 16px;
        }

        .pf-name {
          font-size: 3rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
        }

        .pf-role {
          font-size: 1.1rem;
          opacity: 0.7;
          margin: 0 0 24px;
        }

        .pf-intro {
          max-width: 640px;
          font-size: 1rem;
          line-height: 1.8;
          opacity: 0.85;
        }

        .pf-section {
          margin-top: 96px;
        }

        .pf-section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.4rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(128, 128, 128, 0.25);
        }

        .pf-hanja {
          font-weight: 400;
          font-size: 1.1rem;
          opacity: 0.5;
        }

        .pf-skills-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px 24px;
        }

        .pf-skill-title {
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          opacity: 0.5;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .pf-skill-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.95rem;
        }

        .pf-skill-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .pf-skill-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          opacity: 0.75;
        }

        .pf-skill-icon-fallback {
          flex-shrink: 0;
          opacity: 0.6;
        }

        [data-theme="light"] .pf-skill-icon {
          filter: invert(1);
        }

        .pf-projects {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .pf-project {
          display: block;
          padding: 24px;
          border: 1px solid rgba(128, 128, 128, 0.25);
          text-decoration: none;
          color: var(--foreground);
          transition:
            border-color 0.2s ease,
            transform 0.2s ease;
        }

        .pf-project:hover {
          border-color: var(--foreground);
          transform: translateY(-2px);
        }

        .pf-project-head {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 10px;
        }

        .pf-project-hanja {
          font-size: 0.9rem;
          opacity: 0.4;
        }

        .pf-project-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .pf-project-desc {
          font-size: 0.9rem;
          line-height: 1.6;
          opacity: 0.75;
          margin: 0 0 16px;
        }

        .pf-project-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pf-tag {
          font-size: 0.75rem;
          padding: 4px 10px;
          border: 1px solid rgba(128, 128, 128, 0.3);
          opacity: 0.6;
        }

        .pf-focus-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px 24px;
        }

        .pf-focus-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .pf-focus-desc {
          font-size: 0.9rem;
          line-height: 1.7;
          opacity: 0.75;
          margin: 0;
        }

        .pf-footer {
          margin-top: 96px;
          padding-top: 32px;
        }

        .pf-email {
          display: inline-block;
          font-size: 1.05rem;
          color: var(--foreground);
          text-decoration: none;
          border-bottom: 1px solid rgba(128, 128, 128, 0.4);
          padding-bottom: 2px;
          opacity: 0.85;
          transition: opacity 0.2s ease;
        }

        .pf-email:hover {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .portfolio-container {
            padding: 90px 20px 60px;
          }

          .pf-name {
            font-size: 2.2rem;
          }

          .pf-section {
            margin-top: 64px;
          }

          .pf-skills-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pf-projects,
          .pf-focus-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .pf-skills-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
