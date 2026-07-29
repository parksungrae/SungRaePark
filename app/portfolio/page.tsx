"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  type LucideIcon,
  BarChart3,
  Box,
  Braces,
  ChevronDown,
  Hand,
  Layers,
  Network,
  PenLine,
  ScanFace,
  ScanText,
} from "lucide-react";
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

interface Project {
  title: string;
  summary: string;
  tools: SkillItem[];
  overview: string;
  highlights: { title: string; points: string[] }[];
  troubles?: { title: string; problem: string; solution: string }[];
}

const PROJECTS: Project[] = [
  {
    title: "EM-Graph",
    summary:
      "지식 그래프·일정·문서·AI 챗을 하나로 묶은 통합 지식 관리 플랫폼의 프론트엔드를 개발했습니다.",
    tools: [
      { name: "Next.js", icon: "nextdotjs" },
      { name: "React", icon: "react" },
      { name: "TypeScript", icon: "typescript" },
      { name: "TanStack Query", icon: "reactquery" },
      { name: "Tailwind CSS", icon: "tailwindcss" },
      { name: "Tiptap", fallback: PenLine },
    ],
    overview:
      "복잡한 비즈니스 데이터와 사용자 노드를 지식 그래프로 시각화하고, 협업 일정과 리치 텍스트 문서, AI 챗봇을 결합한 통합 지식 관리(KMS) 서비스입니다. FSD(Feature-Sliced Design) 구조 위에서 프론트엔드 전반을 설계하고 구현했습니다.",
    highlights: [
      {
        title: "지식 정원 & 온톨로지",
        points: [
          "문서의 부모-자식 관계를 실시간 폴더 트리로 렌더링하고, 대량 트리 연산을 최적화해 렌더링 병목을 해소",
          "문서 노드의 상속·연관 관계를 시간 순으로 추적하는 온톨로지 타임라인 구현",
          "편집 중 작성한 메타데이터를 Zod 검증을 거쳐 API에 바인딩하는 양방향 동기화 설계",
        ],
      },
      {
        title: "캘린더 & 일정 관리 엔진",
        points: [
          "일·주·월 동적 뷰 전환과 15분 단위 커스텀 시간 선택 컴포넌트 구현",
          "드래그 앤 드롭 이동·리사이즈에 낙관적 업데이트를 적용해 끊김 없는 인터랙션 설계",
          "같은 시간대 일정이 겹칠 때 위치와 너비를 계산해 분리 배치하는 오버랩 알고리즘 구현",
          "담당자·연결 노트를 가진 태스크와 일반 스케줄 모델을 통일하고 통합 상세 팝업 제공",
        ],
      },
      {
        title: "Tiptap 협업 에디터",
        points: [
          "비대해진 에디터에서 툴바·컨텍스트 메뉴·버블 메뉴를 분리해 FSD 규칙에 맞게 모듈화",
          "커스텀 태스크 마크다운 파서와 Node Extension(knowledgeTask)을 제작해 문서 안에서 일정 동기화",
        ],
      },
      {
        title: "AI Chat & 아키텍처",
        points: [
          "PDF·CSV·PPT·Excel 다중 파일 첨부와 파싱 연동, 언급 문서의 맥락을 세션 간 보존",
          "shared / entities / features / widgets 레이어 분리로 배포·리팩토링 복잡도 축소",
          "하드코딩된 한국어를 번역 Key 기반 i18n으로 이관하고 KO/EN 전환 시 레이아웃 붕괴 대응",
        ],
      },
    ],
    troubles: [
      {
        title: "Tiptap 버블 메뉴의 무한 렌더링 루프",
        problem:
          "여러 버블 메뉴가 같은 에디터 인스턴스 이벤트를 함께 수신하면서 상태 감지와 리렌더가 간섭해, 무한 루프로 브라우저 메모리가 고갈됐습니다.",
        solution:
          "각 메뉴에 고유 pluginKey를 부여해 인스턴스 레벨에서 플러그인 충돌을 차단하고, z-index 계층을 분리해 레이아웃 충돌까지 해결했습니다.",
      },
      {
        title: "캘린더의 불필요한 API 재호출",
        problem:
          "일자를 연속 클릭해 탐색할 때마다 전체 아이템 목록을 중복 호출해 대역폭이 낭비되고 화면이 버벅였습니다.",
        solution:
          "날짜 선택은 클라이언트 포커스 상태로만 다루고, 조회 범위가 실제로 바뀔 때만 호출되도록 캐싱 구조를 재설계했습니다.",
      },
      {
        title: "드래그 오버 성능과 드롭 실패",
        problem:
          "트리 뷰 드래그 앤 드롭 시 다량의 DOM 이벤트로 랙이 생기고 드롭이 불규칙하게 실패했습니다.",
        solution:
          "dragOver 핸들러에 스로틀링을 적용하고, 드래그 중 메타데이터를 임시 메모리에 캐싱하는 메모리 폴백을 구현했습니다.",
      },
    ],
  },
  {
    title: "LORE",
    summary:
      "빈티지·셀렉트샵을 큐레이션하는 플랫폼을 웹과 iOS·Android 앱으로 함께 개발했습니다.",
    tools: [
      { name: "Next.js", icon: "nextdotjs" },
      { name: "React", icon: "react" },
      { name: "TypeScript", icon: "typescript" },
      { name: "Supabase", icon: "supabase" },
      { name: "TanStack Query", icon: "reactquery" },
      { name: "Capacitor", icon: "capacitor" },
    ],
    overview:
      "빈티지 숍과 셀렉트샵, 브랜드, 팝업 이벤트를 지도와 피드로 탐색하고 사용자가 스타일 포스트와 워드로브를 기록하는 큐레이션 플랫폼입니다. Next.js App Router와 Supabase로 서비스를 구축하고, 같은 코드베이스를 Capacitor로 감싸 iOS·Android 앱까지 함께 배포했습니다.",
    highlights: [
      {
        title: "지도 기반 탐색",
        points: [
          "줌 레벨에 따라 국가 마커와 지역 마커로 전환하는 단계별 클러스터링 구성",
          "모바일 바텀시트와 데스크톱 사이드바로 같은 데이터를 화면 크기에 맞게 분기",
          "검색 오버레이·필터 태그·퀵 내비게이션으로 지도 위에서 완결되는 탐색 동선 설계",
        ],
      },
      {
        title: "통합 상세 & 컬렉션",
        points: [
          "샵·브랜드·이벤트를 entityType으로 분기하는 단일 상세 라우트로 중복 화면 제거",
          "타입별 스켈레톤을 따로 두어 로딩 중 레이아웃 이동이 없도록 처리",
          "사용자가 만드는 컬렉션과 운영자가 큐레이션하는 featured 컬렉션을 함께 관리",
        ],
      },
      {
        title: "커뮤니티 & 워드로브",
        points: [
          "Tiptap 기반 스타일 포스트 작성과 댓글·좋아요·조회수·검색 히스토리 구현",
          "워드로브 아이템 등록, 구매 이력, 분석 모달로 옷장 기록 흐름 구성",
          "닉네임 중복 검사와 프로필 라우트로 유저 간 탐색 연결",
        ],
      },
      {
        title: "앱 배포 & 운영",
        points: [
          "Capacitor로 iOS·Android 빌드, 노치·다이나믹 아일랜드 대응 Safe Area 처리",
          "Supabase OAuth 기반 온보딩 퍼널(캐러셀 → 소셜 로그인 → 약관 동의 → 프로필 설정) 구성",
          "next-intl로 한국어·영어·일본어 3개 로케일 지원",
          "입점 신청 페이지와 샵·브랜드·이벤트·카테고리·유저를 다루는 슈퍼 어드민 구축",
        ],
      },
    ],
  },
  {
    title: "팩트시트",
    summary:
      "VC·투자사가 포트폴리오와 투자 성과를 관리하는 B2B 투자 데이터 SaaS를 개발·운영했습니다.",
    tools: [
      { name: "Vue 2", icon: "vuedotjs" },
      { name: "Vuex", fallback: Layers },
      { name: "Axios", icon: "axios" },
      { name: "SCSS", icon: "sass" },
      { name: "ApexCharts", fallback: BarChart3 },
      { name: "Docker", icon: "docker" },
    ],
    overview:
      "투자사가 보유한 스타트업 투자 데이터를 기반으로 포트폴리오 현황을 관리하고, 투자 성과를 대시보드와 리포트로 시각화하며, LP 모집과 조합 운영 업무까지 지원하는 투자 관리 플랫폼입니다.",
    highlights: [
      {
        title: "투자 대시보드 & 종합 리포트",
        points: [
          "총 투자금액, 투자기업 수, 멀티플, 수익률 등 핵심 지표와 운영중·청산완료 리소스 요약 제공",
          "예상 수익금액, 가치 상승 Top 10, 회수 실적 Top 10을 차트와 랭킹으로 시각화",
          "리소스별 수익률·포트폴리오 생존율·연도별 신규/후속 투자 분석과 PDF 다운로드 구현",
          "자동 생성, VICS 기준 엑셀 업로드, ZIP 업로드 세 경로의 리포트 생성 플로우 설계",
        ],
      },
      {
        title: "기업 정보 & 포트폴리오",
        points: [
          "기업 기본·상세·주주·재무 정보와 투자 유치 이력, 관련 뉴스를 한 화면에서 조회",
          "기업 가치 Radar Chart와 재무 차트로 복합 지표 시각화, 관심기업·변경 이력 관리",
          "포트폴리오 생성·수정·복사·삭제와 공유 링크 생성, 외부 공유 전용 뷰 구현",
        ],
      },
      {
        title: "LP·조합 모집 관리",
        points: [
          "모집기간·결성금액·GP/CO-GP·납입방식 등 항목 간 의존성이 복잡한 폼의 상태와 검증 관리",
          "LP 회원·그룹, 투자증표, 커뮤니케이션과 조합 신청 현황·납입 상태 관리",
        ],
      },
      {
        title: "엔지니어링 포인트",
        points: [
          "날짜 범위 검증, 금액 포맷팅, GP/CO-GP 조건 검증 등 업무 도메인에 맞춘 입력 UX 설계",
          "Axios 인터셉터로 토큰 기반 인증과 401 응답 처리 흐름을 일원화",
          "Vuex로 포트폴리오 작성 상태, 검색 조건, 공통 모달 상태를 전역 관리",
          "파일 업로드, ZIP/Excel 리포트 생성, PDF 출력 등 비정형 데이터 처리 UI 구현",
        ],
      },
    ],
  },
  {
    title: "관계망",
    summary:
      "수천 개 노드 규모의 관계망을 캔버스에 그리는 KeyLines 기반 시각화 엔진을 만들었습니다.",
    tools: [
      { name: "KeyLines", fallback: Network },
      { name: "React", icon: "react" },
      { name: "TypeScript", icon: "typescript" },
      { name: "WebGL", icon: "webgl" },
      { name: "Zustand", fallback: Layers },
    ],
    overview:
      "Cambridge Intelligence의 KeyLines SDK를 기반으로 비즈니스 엔티티 관계망을 캔버스에 그리는 시각화 엔진입니다. React의 선언형 모델과 Canvas의 명령형 제어를 잇는 상태 브릿지부터 스냅샷 압축 공유까지 그래프 인터랙션 전반을 설계했습니다.",
    highlights: [
      {
        title: "그래프 렌더링 & 인터랙션",
        points: [
          "노드 스타일링(색상·이미지·Halo·Donut)과 링크 표현(곡선·방향·플로우 애니메이션)으로 상태를 시각적으로 구분",
          "화면이 복잡해지는 현상을 막기 위해 연관 노드를 묶고 펼치는 Combo 구조 활용",
          "Organic·Sequential·Hierarchy·Radial 등 목적에 맞는 레이아웃 알고리즘 전환 구성",
        ],
      },
      {
        title: "성능 최적화",
        points: [
          "노드 확장 시 전체를 재바인딩하지 않고 델타 노드/링크만 추가하는 점진적 로딩 파이프라인 구축",
          "Zustand에 KeyLines 인스턴스만 단일 보관해 캔버스를 React 렌더링 생명주기와 격리",
          "사이드바·탭·헤더와 캔버스 사이의 상호작용을 단방향 명령형 흐름으로 정리",
        ],
      },
      {
        title: "분석 기능",
        points: [
          "PageRank·Betweenness·Closeness 등 중심성 분석으로 네트워크 핵심 노드 도출",
          "최단 경로 탐색과 K-Cores·Components 기반 커뮤니티 분류 지원",
          "위경도 기반 지도 배치 모드와 타임바 기반 시계열 변화 관찰 연동",
        ],
      },
    ],
    troubles: [
      {
        title: "대용량 스냅샷의 직렬화와 압축",
        problem:
          "수천 개 노드 상태를 저장·공유해야 했지만 원본 JSON이 수 MB를 넘었고, Base64 인코딩 과정에서 Maximum call stack size exceeded 에러가 발생했습니다.",
        solution:
          "비활성 노드와 고립 링크를 걸러내는 정제 파이프라인을 두고, pako Gzip 압축과 루프 기반 바이트 변환으로 페이로드를 90% 이상 줄이면서 스택 오버플로를 예방했습니다.",
      },
      {
        title: "최단 경로 애니메이션의 레이스 컨디션",
        problem:
          "경로 하이라이트 애니메이션 도중 다른 노드를 빠르게 재클릭하면 비동기 루프가 겹치며 이전 스타일이 오염됐습니다.",
        solution:
          "전역 취소 토큰 버전을 두고 각 프레임 시작 시 일치 여부를 검증해 불일치하면 즉시 중단하고, 백업해 둔 원본 스타일로 롤백하도록 했습니다.",
      },
      {
        title: "이종 그래프 라이브러리 간 데이터 결합",
        problem:
          "React Flow의 nodes/edges 구조와 KeyLines 고유 items 포맷의 스키마가 완전히 달랐습니다.",
        solution:
          "어댑터 패턴으로 실시간 변환 레이어를 두고, 동기화 추적 플래그로 뷰포트 상태 전파 시 데이터 유실을 방지했습니다.",
      },
    ],
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
  const [openProjects, setOpenProjects] = useState<string[]>([]);

  const toggleProject = (title: string) =>
    setOpenProjects((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );

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
        <h2 className="pf-section-title">Skills</h2>
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
        <h2 className="pf-section-title">Projects</h2>
        <div className="pf-projects">
          {PROJECTS.map((project) => {
            const isOpen = openProjects.includes(project.title);
            const panelId = `pf-panel-${project.title}`;

            return (
              <div key={project.title} className="pf-project">
                <button
                  type="button"
                  className="pf-project-toggle"
                  onClick={() => toggleProject(project.title)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <div className="pf-project-head">
                    <h3 className="pf-project-title">{project.title}</h3>
                    <ChevronDown
                      size={18}
                      className={`pf-chevron ${isOpen ? "open" : ""}`}
                    />
                  </div>
                  <p className="pf-project-desc">{project.summary}</p>
                  <div className="pf-project-tools">
                    {project.tools.map((tool) =>
                      tool.icon ? (
                        <img
                          key={tool.name}
                          src={`https://cdn.simpleicons.org/${tool.icon}/ffffff`}
                          alt={tool.name}
                          title={tool.name}
                          className="pf-tool-icon"
                        />
                      ) : tool.fallback ? (
                        <tool.fallback
                          key={tool.name}
                          size={18}
                          className="pf-tool-fallback"
                          aria-label={tool.name}
                        />
                      ) : null
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="pf-detail">
                        <p className="pf-detail-lead">{project.overview}</p>

                        {project.highlights.map((group) => (
                          <div className="pf-detail-group" key={group.title}>
                            <h4 className="pf-detail-group-title">{group.title}</h4>
                            <ul className="pf-detail-list">
                              {group.points.map((point) => (
                                <li key={point}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {project.troubles && (
                          <div className="pf-detail-group">
                            <h4 className="pf-detail-group-title">트러블슈팅</h4>
                            {project.troubles.map((trouble) => (
                              <div className="pf-trouble" key={trouble.title}>
                                <p className="pf-trouble-title">{trouble.title}</p>
                                <div className="pf-trouble-row">
                                  <span className="pf-trouble-label">문제</span>
                                  <span>{trouble.problem}</span>
                                </div>
                                <div className="pf-trouble-row">
                                  <span className="pf-trouble-label">해결</span>
                                  <span>{trouble.solution}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pf-section">
        <h2 className="pf-section-title">Focus</h2>
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
        <h2 className="pf-section-title">Contact</h2>
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
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pf-project {
          border: 1px solid rgba(128, 128, 128, 0.25);
          color: var(--foreground);
          transition: border-color 0.2s ease;
        }

        .pf-project:hover {
          border-color: rgba(128, 128, 128, 0.5);
        }

        .pf-project-toggle {
          display: block;
          width: 100%;
          padding: 24px;
          background: none;
          border: none;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .pf-project-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .pf-project-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
        }

        .pf-chevron {
          flex-shrink: 0;
          opacity: 0.45;
          transition: transform 0.25s ease;
        }

        .pf-chevron.open {
          transform: rotate(180deg);
        }

        .pf-project-desc {
          font-size: 0.9rem;
          line-height: 1.6;
          opacity: 0.75;
          margin: 0 0 16px;
        }

        .pf-project-tools {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 14px;
        }

        .pf-tool-icon {
          width: 18px;
          height: 18px;
          opacity: 0.7;
        }

        [data-theme="light"] .pf-tool-icon {
          filter: invert(1);
        }

        .pf-tool-fallback {
          flex-shrink: 0;
          opacity: 0.55;
        }

        .pf-detail {
          padding: 20px 24px 24px;
          border-top: 1px solid rgba(128, 128, 128, 0.18);
        }

        .pf-detail-lead {
          font-size: 0.88rem;
          line-height: 1.75;
          opacity: 0.75;
          margin: 0 0 24px;
        }

        .pf-detail-group {
          margin-bottom: 22px;
        }

        .pf-detail-group:last-child {
          margin-bottom: 0;
        }

        .pf-detail-group-title {
          font-size: 0.82rem;
          letter-spacing: 0.02em;
          opacity: 0.5;
          margin: 0 0 10px;
        }

        .pf-detail-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .pf-detail-list li {
          position: relative;
          padding-left: 14px;
          font-size: 0.88rem;
          line-height: 1.7;
          opacity: 0.75;
        }

        .pf-detail-list li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.62rem;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.5;
        }

        .pf-trouble {
          margin-bottom: 16px;
        }

        .pf-trouble:last-child {
          margin-bottom: 0;
        }

        .pf-trouble-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0 0 8px;
        }

        .pf-trouble-row {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 10px;
          font-size: 0.88rem;
          line-height: 1.7;
          opacity: 0.75;
          margin-bottom: 4px;
        }

        .pf-trouble-label {
          font-size: 0.72rem;
          opacity: 0.6;
          padding-top: 4px;
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

          .pf-focus-grid {
            grid-template-columns: 1fr;
          }

          .pf-project-toggle {
            padding: 20px;
          }

          .pf-detail {
            padding: 18px 20px 20px;
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
