"use client";

import React, { useEffect, useRef, useState } from "react";
import { ExternalLink, ArrowLeft, Search, X, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { BackButton } from "../../components/BackButton";

// Define Types
type Region = "kr" | "global" | "jp";

interface Artist {
  id: string;
  name: string;
  color: string;
  region: Region;
  songs: string[];
  description?: string;
}

interface NodeData {
  label: string;
  color: string;
  description?: string;
  isSong?: boolean;
  parentArtist?: string;
}

interface SigmaNodeEvent {
  node: string;
  event: {
    original: MouseEvent | TouchEvent;
    preventSigmaDefault(): void;
  };
}

interface SigmaMouseCoords {
  x: number;
  y: number;
  preventSigmaDefault(): void;
  original: MouseEvent | TouchEvent;
}

interface SigmaInstance {
  getGraph(): {
    getNodeAttributes(key: string): NodeData;
  };
  getNodeDisplayData(key: string): { x: number; y: number } | undefined;
  getCamera(): {
    animate(state: { x: number; y: number; ratio: number }, options: { duration: number; easing: string }): void;
    animatedZoom(options?: { duration?: number }): void;
    animatedUnzoom(options?: { duration?: number }): void;
  };
  refresh(): void;
  kill(): void;
}

declare global {
  interface Window {
    sigmaInstance: SigmaInstance | null;
  }
}

const ARTISTS: Artist[] = [
  {
    id: "black-skirts",
    name: "검정치마",
    color: "#ff3e3e",
    region: "kr",
    songs: ["Everything", "Antifreeze", "Love Shine", "기다린 만큼, 더", "나랑 아니면"],
    description: "조휴일의 1인 프로젝트 밴드로, 한국 인디 씬의 독보적인 감성을 대변하며 매 앨범마다 명반을 탄생시킵니다.",
  },
  {
    id: "radiohead",
    name: "Radiohead",
    color: "#ffffff",
    region: "global",
    songs: ["Creep", "No Surprises", "Paranoid Android", "Karma Police", "Daydreaming"],
    description: "영국의 전설적인 얼터너티브 록 밴드. 실험적인 사운드와 철학적인 가사로 현대 음악사에 거대한 족적을 남겼습니다.",
  },
  {
    id: "sheena-ringo",
    name: "시이나 링고",
    color: "#ff0080",
    region: "jp",
    songs: ["Marunouchi Sadistic", "Crime and Punishment", "Gips", "Stem"],
    description: "일본의 싱어송라이터이자 동경사변의 보컬. 독특한 창법과 아방가르드한 음악 세계관으로 J-Pop의 경계를 확장했습니다.",
  },
  {
    id: "ging-nang-boyz",
    name: "깅낭 보이즈",
    color: "#7b00ff",
    region: "jp",
    songs: ["Baby Baby", "夢で逢えたら", "Enjo-kosai"],
    description: "일본의 펑크 록 밴드. 거침없고 폭발적인 에너지 속에 청춘의 서투름과 순수함을 노래합니다.",
  },
  {
    id: "kim-dong-ryul",
    name: "김동률",
    color: "#ffc400",
    region: "kr",
    songs: ["Replay", "다시 사랑한다 말할까", "아이처럼", "감사", "기억의 습작"],
    description: "한국의 독보적인 싱어송라이터. 오케스트라 사운드와 깊은 저음의 보컬로 한국 발라드의 정점을 보여줍니다.",
  },
  {
    id: "jaurim",
    name: "자우림",
    color: "#00d4ff",
    region: "kr",
    songs: ["스물다섯, 스물하나", "매직 카펫 라이드", "샤이닝", "일탈"],
    description: "보컬 김윤아를 중심으로 한 한국의 대표 록 밴드. 몽환적이면서도 파워풀한 사운드로 긴 시간 사랑받고 있습니다.",
  },
  {
    id: "2hollis",
    name: "2hollis",
    color: "#00ff88",
    region: "global",
    songs: ["poster boy", "crush", "trauma", "jeans"],
    description: "미국의 하이퍼팝/일렉트로닉 신성이자 프로듀서. 디지털 카타르시스를 자극하는 독창적인 사운드를 선보입니다.",
  },
  {
    id: "john-lennon",
    name: "John Lennon",
    color: "#f4a300",
    region: "global",
    songs: ["Imagine", "Instant Karma!", "Jealous Guy", "Woman"],
    description: "비틀즈 출신의 싱어송라이터. 평화와 이상을 노래한 가사로 시대를 초월한 앤썸을 남겼습니다.",
  },
  {
    id: "lee-moonsae",
    name: "이문세",
    color: "#ff5e5e",
    region: "kr",
    songs: ["휘파람", "옛사랑", "광화문연가", "붉은 노을"],
    description: "한국 가요사에 굵직한 발자취를 남긴 국민 가수. 서정적인 멜로디와 부드러운 음색이 특징입니다.",
  },
  {
    id: "sanulrim",
    name: "산울림",
    color: "#8affc1",
    region: "kr",
    songs: ["회상", "아니 벌써", "청춘", "너의 의미"],
    description: "1970~80년대 한국 록의 실험 정신을 이끈 3형제 밴드. 독창적인 사운드로 후배 뮤지션들에게 큰 영향을 주었습니다.",
  },
  {
    id: "lee-sang-eun",
    name: "이상은",
    color: "#ffb6e6",
    region: "kr",
    songs: ["비밀의 화원", "담다디", "언젠가는", "삶은 여행"],
    description: "독보적인 감성과 예술적 실험으로 자신만의 음악 세계를 구축해온 싱어송라이터입니다.",
  },
  {
    id: "jo-duk-bae",
    name: "조덕배",
    color: "#c9a0ff",
    region: "kr",
    songs: ["나의 옛날이야기", "그대 내맘에 들어오면은", "꿈에", "슬픈 노래는 부르지 않을거야"],
    description: "구수한 음색과 담백한 가사로 한 시대의 정서를 대변한 한국의 싱어송라이터입니다.",
  },
  {
    id: "delispice",
    name: "델리스파이스",
    color: "#5ee7ff",
    region: "kr",
    songs: ["항상 엔진을 켜둘께", "챠우챠우", "고백", "Missing You"],
    description: "1990년대 한국 모던록/인디 씬을 대표하는 밴드. 담담한 가사와 청량한 사운드가 특징입니다.",
  },
  {
    id: "c-jamm",
    name: "씨잼 (C JAMM)",
    color: "#ff8a3d",
    region: "kr",
    songs: ["You Better(휙)", "신기루", "포커페이스", "A-Yo"],
    description: "탄탄한 라임과 개성 있는 톤으로 한국 힙합 씬에서 독자적인 입지를 다진 래퍼입니다.",
  },
  {
    id: "silica-gel",
    name: "실리카겔",
    color: "#2effa0",
    region: "kr",
    songs: ["Realize", "NO PAIN", "Mercurial", "Desert Eagle"],
    description: "사이키델릭하고 몽환적인 사운드로 젊은 세대에게 큰 사랑을 받는 한국 밴드입니다.",
  },
  {
    id: "hyukoh-sunset",
    name: "혁오 & Sunset Rollercoaster",
    color: "#ffd23f",
    region: "kr",
    songs: ["Young Man", "와리가리", "TOMBOY", "위잉위잉"],
    description: "한국과 대만을 대표하는 밴드의 협업. 여유롭고 이국적인 그루브가 돋보입니다.",
  },
  {
    id: "the-beatles",
    name: "The Beatles",
    color: "#e63946",
    region: "global",
    songs: ["Let It Be", "Hey Jude", "Yesterday", "Come Together"],
    description: "대중음악사에 가장 큰 영향을 남긴 영국 밴드. 시대를 초월한 명곡들을 남겼습니다.",
  },
  {
    id: "billy-joel",
    name: "Billy Joel",
    color: "#ffb703",
    region: "global",
    songs: ["Piano Man", "Uptown Girl", "Just the Way You Are", "We Didn't Start the Fire"],
    description: "피아노를 중심으로 한 서정적 스토리텔링으로 사랑받는 미국의 싱어송라이터입니다.",
  },
  {
    id: "michael-jackson",
    name: "Michael Jackson",
    color: "#d90429",
    region: "global",
    songs: ["Rock with You", "Black or White"],
    description: "팝의 황제. 장르를 넘나드는 사운드와 퍼포먼스로 대중음악의 기준을 새로 썼습니다.",
  },
  {
    id: "nina-simone",
    name: "Nina Simone",
    color: "#8338ec",
    region: "global",
    songs: ["Feeling Good", "My Baby Just Cares for Me", "Sinnerman", "I Put a Spell on You"],
    description: "재즈와 소울을 넘나든 깊은 보컬로 사회적 메시지를 노래한 전설적인 아티스트입니다.",
  },
  {
    id: "frank-sinatra",
    name: "Frank Sinatra",
    color: "#fb8500",
    region: "global",
    songs: ["That's Life", "My Way", "Fly Me to the Moon", "New York, New York"],
    description: "스윙과 재즈 보컬의 정수를 보여준 20세기 미국 대중음악의 아이콘입니다.",
  },
  {
    id: "keane",
    name: "Keane",
    color: "#3a86ff",
    region: "global",
    songs: ["Somewhere Only We Know", "Everybody's Changing", "Bedshaped", "Bend and Break"],
    description: "피아노 중심의 애틋한 멜로디로 2000년대 브릿팝 씬을 대표한 영국 밴드입니다.",
  },
  {
    id: "weezer",
    name: "Weezer",
    color: "#2ec4b6",
    region: "global",
    songs: ["Island In The Sun", "Buddy Holly", "Say It Ain't So", "Beverly Hills"],
    description: "파워팝과 얼터너티브 록을 결합해 특유의 유쾌한 사운드를 선보이는 미국 밴드입니다.",
  },
  {
    id: "the-strokes",
    name: "The Strokes",
    color: "#ff006e",
    region: "global",
    songs: ["Reptilia", "Last Nite", "Someday", "Hard to Explain"],
    description: "2000년대 개러지 록 리바이벌을 이끈 뉴욕 출신 밴드입니다.",
  },
  {
    id: "hoobastank",
    name: "Hoobastank",
    color: "#6a4c93",
    region: "global",
    songs: ["The Reason", "Crawling in the Dark", "Out of Control", "Running Away"],
    description: "감성적인 록발라드로 2000년대 초반 전세계적인 사랑을 받은 미국 밴드입니다.",
  },
  {
    id: "franz-ferdinand",
    name: "Franz Ferdinand",
    color: "#ffbe0b",
    region: "global",
    songs: ["Take Me Out", "Do You Want To", "This Fire", "Michael"],
    description: "댄서블한 리듬과 날카로운 기타 사운드로 유명한 스코틀랜드 록 밴드입니다.",
  },
  {
    id: "bruno-mars",
    name: "Bruno Mars",
    color: "#fb5607",
    region: "global",
    songs: ["Locked out of Heaven", "Just the Way You Are", "Uptown Funk", "24K Magic"],
    description: "레트로 소울과 펑크(funk) 감성을 현대적으로 재해석하는 팝스타입니다.",
  },
  {
    id: "coldplay",
    name: "Coldplay",
    color: "#ffd60a",
    region: "global",
    songs: ["Adventure of a Lifetime", "Yellow", "Viva la Vida", "Fix You"],
    description: "서정적인 멜로디와 웅장한 사운드스케이프로 전세계적인 팬덤을 보유한 영국 밴드입니다.",
  },
  {
    id: "yutaka-ozaki",
    name: "尾崎豊 (Yutaka Ozaki)",
    color: "#ff477e",
    region: "jp",
    songs: ["I Love You", "15の夜", "卒業", "シェリー"],
    description: "청춘의 반항과 방황을 노래해 일본 록의 전설로 남은 싱어송라이터입니다.",
  },
  {
    id: "hikaru-utada",
    name: "宇多田ヒカル (Hikaru Utada)",
    color: "#7bdff2",
    region: "jp",
    songs: ["First Love", "Automatic", "traveling", "Flavor Of Life"],
    description: "R&B 감성과 섬세한 가사로 J-Pop의 흐름을 바꾼 아티스트입니다.",
  },
  {
    id: "sukimaswitch",
    name: "スキマスイッチ (SUKIMASWITCH)",
    color: "#b8f2e6",
    region: "jp",
    songs: ["奏(かなで)", "全力少年", "ボクノート", "ガラナ"],
    description: "따뜻한 멜로디와 진솔한 가사로 사랑받는 일본의 남성 듀오입니다.",
  },
  {
    id: "masayoshi-yamazaki",
    name: "山崎まさよし (Masayoshi Yamazaki)",
    color: "#aed9e0",
    region: "jp",
    songs: ["One more time, One more chance", "セロリ", "アドレナリン", "名前のない鳥"],
    description: "어쿠스틱 기타와 애틋한 목소리로 시대를 대표하는 명곡을 남긴 일본 싱어송라이터입니다.",
  },
  {
    id: "aimyon",
    name: "あいみょん (aimyon)",
    color: "#ffcbf2",
    region: "jp",
    songs: ["ハルノヒ", "マリーゴールド", "君はロックを聴かない", "愛を伝えたいだとか"],
    description: "독특한 가사 감각과 자연스러운 보컬로 일본 젊은 세대에게 폭넓은 사랑을 받는 싱어송라이터입니다.",
  },
  {
    id: "kana-boon",
    name: "KANA-BOON",
    color: "#f15bb5",
    region: "jp",
    songs: ["シルエット", "ないものねだり", "フルドライブ", "スターマーカー"],
    description: "에너지 넘치는 사운드와 청춘의 감성을 담은 곡으로 유명한 일본 록 밴드입니다.",
  },
];

const REGION_LABELS: Record<"all" | Region, string> = {
  all: "전체",
  kr: "국내",
  global: "해외",
  jp: "J-POP",
};

// This sub-component will only run in the browser
const MusicVisualization = ({
  onNodeSelect,
  matchedNodeIds,
}: {
  onNodeSelect: (id: string, data: NodeData) => void;
  matchedNodeIds: Set<string> | null;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<SigmaInstance | null>(null);
  const onNodeSelectRef = useRef(onNodeSelect);
  const hoveredNodeRef = useRef<string | null>(null);
  const matchSetRef = useRef<Set<string> | null>(null);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  // Push filter changes into the live graph without rebuilding it
  useEffect(() => {
    matchSetRef.current = matchedNodeIds;
    sigmaRef.current?.refresh();
  }, [matchedNodeIds]);

  useEffect(() => {
    let sigmaInstance: SigmaInstance | null = null;
    let animationFrameId: number | null = null;
    let initFrameId: number | null = null;
    let isDestroyed = false;

    // Dynamic imports to prevent SSR errors
    Promise.all([
      import("sigma"),
      import("graphology"),
      import("graphology-layout-forceatlas2")
    ]).then(([{ Sigma }, { default: Graph }, { default: forceAtlas2 }]) => {
      if (isDestroyed) return;

      // Defer to the next frame so the flex layout has already given the
      // container real dimensions before Sigma measures it.
      initFrameId = requestAnimationFrame(() => {
      if (isDestroyed || !containerRef.current) return;

      const graph = new Graph();

      ARTISTS.forEach((artist, i) => {
        const angle = (i / ARTISTS.length) * Math.PI * 2;
        const artistSize = 12 + Math.min(artist.songs.length, 8) * 1.6;

        graph.addNode(artist.id, {
          x: Math.cos(angle) * 10,
          y: Math.sin(angle) * 10,
          size: artistSize,
          label: artist.name,
          color: artist.color,
          labelColor: "#ffffff",
          description: artist.description,
        });

        artist.songs.forEach((song, j) => {
          const songId = `${artist.id}-song-${j}`;
          const songAngle = angle + (Math.random() - 0.5) * 0.5;
          graph.addNode(songId, {
            x: Math.cos(songAngle) * 15,
            y: Math.sin(songAngle) * 15,
            size: 5,
            label: song,
            color: artist.color + "aa",
            labelColor: "#ffffff",
            isSong: true,
            parentArtist: artist.name,
          });
          graph.addEdge(artist.id, songId, { color: artist.color + "33", size: 1, edgeType: "song" });
        });
      });

      // Cross-Artist Connections — rendered as brighter "constellation" links
      const crossLinks: [string, string, string][] = [
        ["black-skirts", "radiohead", "Alt-Rock Influence"],
        ["jaurim", "black-skirts", "KR Indie"],
        ["sheena-ringo", "ging-nang-boyz", "JP Vibe"],
        ["radiohead", "2hollis", "Experimental"],
        ["radiohead", "sheena-ringo", "Art Rock"],
        ["kim-dong-ryul", "black-skirts", "Songwriters"],
      ];
      crossLinks.forEach(([a, b, label]) => {
        graph.addEdge(a, b, { label, size: 2, color: "#ffffff40", edgeType: "cross" });
      });

      const sigma = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: true,
        defaultEdgeColor: "#333",
        labelColor: { attribute: "labelColor", color: "#ffffff" },
        labelSize: 14,
        labelFont: "inherit",
        labelWeight: "700",
        labelRenderedSizeThreshold: 0,
        nodeReducer: (node, data) => {
          const res = { ...data };
          const matchSet = matchSetRef.current;
          const hovered = hoveredNodeRef.current;

          if (matchSet) {
            if (!matchSet.has(node)) {
              res.color = "#1c1c22";
              res.label = "";
            }
            return res;
          }

          if (hovered) {
            const isSelf = node === hovered;
            const isNeighbor = !isSelf && graph.areNeighbors(hovered, node);
            if (isSelf) {
              res.highlighted = true;
              res.labelColor = "#000000";
            } else if (!isNeighbor) {
              res.color = "#22222a";
              res.label = "";
            }
          }

          return res;
        },
        edgeReducer: (edge, data) => {
          const res = { ...data };
          const matchSet = matchSetRef.current;
          const hovered = hoveredNodeRef.current;
          const [source, target] = graph.extremities(edge);

          if (matchSet) {
            if (!matchSet.has(source) || !matchSet.has(target)) {
              res.hidden = true;
            }
            return res;
          }

          if (hovered) {
            if (source === hovered || target === hovered) {
              res.size = (data.size || 1) + 1.5;
              if (data.edgeType === "cross") res.color = "#ffffffcc";
            } else {
              res.hidden = true;
            }
          }

          return res;
        },
      });

      sigmaInstance = sigma as unknown as SigmaInstance;
      sigmaRef.current = sigma as unknown as SigmaInstance;

      // Interaction
      let draggedNode: string | null = null;
      let isDragging = false;

      sigma.on("downNode", (e: SigmaNodeEvent) => {
        if (sigmaRef.current !== sigmaInstance) return;
        isDragging = true;
        draggedNode = e.node;
        if (containerRef.current) containerRef.current.style.cursor = "grabbing";
      });

      sigma.getMouseCaptor().on("mousemovebody", (e: SigmaMouseCoords) => {
        if (!isDragging || !draggedNode) return;
        const pos = sigma.viewportToGraph(e);
        graph.setNodeAttribute(draggedNode, "x", pos.x);
        graph.setNodeAttribute(draggedNode, "y", pos.y);
        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
      });

      sigma.getMouseCaptor().on("mouseup", () => {
        isDragging = false;
        draggedNode = null;
        if (containerRef.current) containerRef.current.style.cursor = "default";
      });

      sigma.on("enterNode", (e: { node: string }) => {
        hoveredNodeRef.current = e.node;
        if (containerRef.current) containerRef.current.style.cursor = "pointer";
        sigma.refresh();
      });

      sigma.on("leaveNode", () => {
        hoveredNodeRef.current = null;
        if (containerRef.current) containerRef.current.style.cursor = "default";
        sigma.refresh();
      });

      sigma.on("clickNode", (e: { node: string }) => {
        if (isDestroyed) return;
        const nodeData = graph.getNodeAttributes(e.node) as NodeData;
        onNodeSelectRef.current(e.node, nodeData);

        // Zoom on click
        const pos = sigma.getNodeDisplayData(e.node);
        if (pos) {
          sigma.getCamera().animate(
            { x: pos.x, y: pos.y, ratio: 0.15 },
            { duration: 800, easing: "quadraticInOut" }
          );
        }
      });

      // Physics
      const settings = forceAtlas2.inferSettings(graph);
      const layoutSettings = {
        ...settings,
        gravity: 0.02,
        scalingRatio: 30,
        barnesHutOptimize: true,
        linLogMode: true,
        strongGravityMode: false
      };

      forceAtlas2.assign(graph, { settings: layoutSettings, iterations: 150 });

      let frames = 0;
      const animate = () => {
        if (isDestroyed) return;
        if (!isDragging && frames % 2 === 0) {
          forceAtlas2.assign(graph, { settings: layoutSettings, iterations: 1 });
        }
        frames++;
        animationFrameId = requestAnimationFrame(animate);
      };
      animationFrameId = requestAnimationFrame(animate);

      // Store sigma in window for external access
      window.sigmaInstance = sigmaInstance as unknown as SigmaInstance;
      });
    });

    return () => {
      isDestroyed = true;
      if (initFrameId !== null) cancelAnimationFrame(initFrameId);
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (sigmaInstance) sigmaInstance.kill();
      if (window.sigmaInstance === sigmaInstance) window.sigmaInstance = null;
    };
  }, []); // Run only once on mount

  const handleZoomIn = () => sigmaRef.current?.getCamera().animatedZoom({ duration: 300 });
  const handleZoomOut = () => sigmaRef.current?.getCamera().animatedUnzoom({ duration: 300 });
  const handleResetView = () =>
    sigmaRef.current?.getCamera().animate({ x: 0, y: 0, ratio: 1 }, { duration: 400, easing: "quadraticInOut" });

  return (
    <div className="sigma-wrapper">
      <div ref={containerRef} className="sigma-container" />
      <div className="zoom-controls">
        <button onClick={handleZoomIn} aria-label="확대">
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} aria-label="축소">
          <ZoomOut size={18} />
        </button>
        <button onClick={handleResetView} aria-label="초기 화면으로">
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default function MusicPage() {
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; desc: string; color: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<"all" | Region>("all");

  const searchOnYoutube = React.useCallback((query: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
  }, []);

  const handleNodeSelect = React.useCallback((nodeId: string, nodeData: NodeData) => {
    const description = nodeData.isSong
      ? `${nodeData.parentArtist}의 명곡 중 하나입니다.`
      : (nodeData.description || "이 아티스트에 대한 정보가 없습니다.");

    setSelectedNode({
      id: nodeId,
      label: nodeData.label,
      desc: description,
      color: nodeData.color,
    });
  }, []);

  const handleListItemClick = React.useCallback((nodeId: string) => {
    const sigma = window.sigmaInstance;
    if (!sigma) return;

    const graph = sigma.getGraph();
    const nodeData = graph.getNodeAttributes(nodeId) as NodeData;
    handleNodeSelect(nodeId, nodeData);

    const pos = sigma.getNodeDisplayData(nodeId);
    if (pos) {
      sigma.getCamera().animate(
        { x: pos.x, y: pos.y, ratio: 0.15 },
        { duration: 800, easing: "quadraticInOut" }
      );
    }
  }, [handleNodeSelect]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredArtists = React.useMemo(() => {
    return ARTISTS.filter((artist) => {
      if (regionFilter !== "all" && artist.region !== regionFilter) return false;
      if (!normalizedQuery) return true;
      const nameMatches = artist.name.toLowerCase().includes(normalizedQuery);
      const songMatches = artist.songs.some((song) => song.toLowerCase().includes(normalizedQuery));
      return nameMatches || songMatches;
    });
  }, [normalizedQuery, regionFilter]);

  const totalSongCount = React.useMemo(
    () => filteredArtists.reduce((acc, a) => acc + a.songs.length, 0),
    [filteredArtists]
  );

  const isFilterActive = normalizedQuery !== "" || regionFilter !== "all";

  const matchedNodeIds = React.useMemo(() => {
    if (!isFilterActive) return null;
    const ids = new Set<string>();
    filteredArtists.forEach((artist) => {
      ids.add(artist.id);
      const artistNameMatches = artist.name.toLowerCase().includes(normalizedQuery);
      artist.songs.forEach((song, i) => {
        if (!normalizedQuery || artistNameMatches || song.toLowerCase().includes(normalizedQuery)) {
          ids.add(`${artist.id}-song-${i}`);
        }
      });
    });
    return ids;
  }, [filteredArtists, normalizedQuery, isFilterActive]);

  const getVisibleSongs = React.useCallback(
    (artist: Artist) => {
      if (!normalizedQuery) return artist.songs;
      if (artist.name.toLowerCase().includes(normalizedQuery)) return artist.songs;
      return artist.songs.filter((song) => song.toLowerCase().includes(normalizedQuery));
    },
    [normalizedQuery]
  );

  return (
    <div className="music-page-container">
      <header className="music-header">
        <BackButton />
      </header>

      <div className="main-content">
        <MusicVisualization onNodeSelect={handleNodeSelect} matchedNodeIds={matchedNodeIds} />

        <aside className="node-list-panel">
          {selectedNode ? (
            <div className="detail-view">
              <div className="detail-header">
                <button className="panel-back-btn" onClick={() => setSelectedNode(null)}>
                  <ArrowLeft size={18} />
                  <span>Back to List</span>
                </button>
              </div>

              <div className="detail-body">
                <div className="detail-title-section">
                  <div className="artist-indicator large" style={{ backgroundColor: selectedNode.color }} />
                  <h2 style={{ color: selectedNode.color }}>{selectedNode.label}</h2>
                </div>

                <p className="detail-desc">{selectedNode.desc}</p>

                <div className="detail-actions">
                  <button className="action-btn primary" onClick={() => searchOnYoutube(selectedNode.label)}>
                    <ExternalLink size={18} />
                    <span>Watch on YouTube</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="list-search-header">
                <h3>Musical Nodes</h3>

                <div className="search-box">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="아티스트나 곡 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="clear-btn" onClick={() => setSearchQuery("")} aria-label="검색어 지우기">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="region-chips">
                  {(["all", "kr", "global", "jp"] as const).map((region) => (
                    <button
                      key={region}
                      className={`region-chip ${regionFilter === region ? "active" : ""}`}
                      onClick={() => setRegionFilter(region)}
                    >
                      {REGION_LABELS[region]}
                    </button>
                  ))}
                </div>

                <span className="node-count">
                  {filteredArtists.length} Artists · {totalSongCount} Songs
                </span>
              </div>
              <div className="scroll-area">
                {filteredArtists.length === 0 ? (
                  <div className="empty-state">검색 결과가 없습니다.</div>
                ) : (
                  filteredArtists.map((artist) => (
                    <div key={artist.id} className="artist-group">
                      <button className="list-item artist-item" onClick={() => handleListItemClick(artist.id)}>
                        <div className="item-indicator" style={{ backgroundColor: artist.color }} />
                        <span className="item-label">{artist.name}</span>
                        <span className="song-count-badge">{artist.songs.length}</span>
                      </button>
                      <div className="song-list">
                        {getVisibleSongs(artist).map((song) => {
                          const songIndex = artist.songs.indexOf(song);
                          return (
                            <button
                              key={`${artist.id}-song-${songIndex}`}
                              className="list-item song-item"
                              onClick={() => handleListItemClick(`${artist.id}-song-${songIndex}`)}
                            >
                              <span className="item-label">{song}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      <style jsx>{`
        .music-page-container {
          width: 100vw;
          height: 100vh;
          background: #000;
          background-image:
            radial-gradient(circle at 20% 30%, #1a1a2e 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, #16213e 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #0f3460 0%, transparent 50%);
          color: white;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .music-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 2.5rem;
          z-index: 20;
          pointer-events: none;
        }


        .main-content {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        :global(.sigma-wrapper) {
          flex: 1;
          position: relative;
          overflow: hidden;
        }

        :global(.sigma-container) {
          width: 100%;
          height: 100%;
          cursor: default;
        }

        :global(.zoom-controls) {
          position: absolute;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 15;
        }

        :global(.zoom-controls button) {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(20px);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        :global(.zoom-controls button:hover) {
          background: rgba(255, 255, 255, 0.12);
          color: white;
          transform: translateY(-2px);
        }

        .node-list-panel {
          width: 380px;
          background: rgba(10, 10, 15, 0.7);
          backdrop-filter: blur(40px);
          border-left: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          z-index: 10;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .list-search-header {
          padding: 1.5rem 2rem 1.25rem;
          padding-top: 6rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }

        .list-search-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.6rem 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          transition: border-color 0.2s;
        }

        .search-box:focus-within {
          border-color: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 0.8);
        }

        .search-box input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
        }

        .search-box input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .clear-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          display: flex;
          padding: 0;
        }

        .clear-btn:hover {
          color: #fff;
        }

        .region-chips {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .region-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.5);
          border-radius: 999px;
          padding: 0.35rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .region-chip:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .region-chip.active {
          background: #fff;
          color: #000;
          border-color: #fff;
        }

        .node-count {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .empty-state {
          padding: 3rem 1rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.9rem;
        }

        .scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .scroll-area::-webkit-scrollbar {
          width: 4px;
        }
        .scroll-area::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .detail-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          animation: slideIn 0.4s ease-out;
        }

        .detail-header {
          padding: 6rem 1.5rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .panel-back-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: color 0.2s;
          font-size: 0.95rem;
          padding: 0;
        }

        .panel-back-btn:hover {
          color: white;
        }

        .detail-body {
          padding: 2.5rem;
          flex: 1;
          overflow-y: auto;
        }

        .detail-title-section {
          margin-bottom: 2rem;
        }

        .artist-indicator.large {
          width: 16px;
          height: 16px;
          margin-bottom: 1rem;
          box-shadow: 0 0 15px currentColor;
        }

        h2 {
          font-size: 2.5rem;
          font-weight: 850;
          margin: 0;
          letter-spacing: -0.04em;
          line-height: 1.1;
        }

        .detail-desc {
          font-size: 1.15rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 3rem;
          font-weight: 300;
        }

        .action-btn {
          width: 100%;
          padding: 1rem;
          border-radius: 16px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 1rem;
        }

        .action-btn.primary {
          background: white;
          color: black;
        }

        .action-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          background: #f0f0f0;
        }

        .artist-group {
          margin-bottom: 2rem;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          text-align: left;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .list-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          transform: translateX(6px);
        }

        .artist-item {
          font-weight: 700;
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .item-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .song-count-badge {
          margin-left: auto;
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.06);
          border-radius: 999px;
          padding: 0.15rem 0.55rem;
        }

        .song-list {
          padding-left: 1.5rem;
          margin-top: 0.5rem;
        }

        .song-item {
          font-size: 0.95rem;
          padding: 0.5rem 1rem;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        :global(.sigma-label) {
          font-family: var(--font-geist-sans), sans-serif !important;
          font-weight: 700 !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
