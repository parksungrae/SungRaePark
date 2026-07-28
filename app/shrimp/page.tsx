import Link from "next/link";
import { BackButton } from "@/components/BackButton";

const sections = [
  {
    href: "/shrimp/basics",
    icon: "◎",
    title: "기본 사항",
    desc: "수질·수온·먹이 등 사육의 기초",
  },
  {
    href: "/shrimp/species",
    icon: "◉",
    title: "새우 종류",
    desc: "8가지 대표 민물 새우 품종",
  },
  {
    href: "/shrimp/tools",
    icon: "◈",
    title: "필요 도구",
    desc: "수조부터 테스트 키트까지",
  },
  {
    href: "/shrimp/dashboard",
    icon: "◐",
    title: "대시보드",
    desc: "수질 모니터링 & 사육 일지",
  },
];

export default function ShrimpPage() {
  return (
    <div className="shrimp-page">
      <div className="shrimp-back">
        <BackButton />
      </div>

      <div className="shrimp-main">
        <div className="shrimp-hero">
          <p className="shrimp-hero-label">freshwater shrimp</p>
          <h1 className="shrimp-hero-title">
            새우<br />키우기
          </h1>
          <p className="shrimp-hero-desc">
            작은 수조 안의 생태계.<br />
            민물 새우 사육을 위한 완전 가이드.
          </p>
        </div>

        <div className="shrimp-grid">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="shrimp-nav-card">
              <span className="shrimp-card-icon">{s.icon}</span>
              <div>
                <p className="shrimp-card-title">{s.title}</p>
                <p className="shrimp-card-desc">{s.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
