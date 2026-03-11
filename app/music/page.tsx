"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

// Define Types
interface Artist {
  id: string;
  name: string;
  color: string;
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
  };
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
    songs: ["Everything", "Antifreeze", "Love Shine", "기다린 만큼, 더", "나랑 아니면"],
    description: "조휴일의 1인 프로젝트 밴드로, 한국 인디 씬의 독보적인 감성을 대변하며 매 앨범마다 명반을 탄생시킵니다.",
  },
  {
    id: "radiohead",
    name: "Radiohead",
    color: "#ffffff",
    songs: ["Creep", "No Surprises", "Paranoid Android", "Karma Police", "Daydreaming"],
    description: "영국의 전설적인 얼터너티브 록 밴드. 실험적인 사운드와 철학적인 가사로 현대 음악사에 거대한 족적을 남겼습니다.",
  },
  {
    id: "sheena-ringo",
    name: "시이나 링고",
    color: "#ff0080",
    songs: ["Marunouchi Sadistic", "Crime and Punishment", "Gips", "Stem"],
    description: "일본의 싱어송라이터이자 동경사변의 보컬. 독특한 창법과 아방가르드한 음악 세계관으로 J-Pop의 경계를 확장했습니다.",
  },
  {
    id: "ging-nang-boyz",
    name: "깅낭 보이즈",
    color: "#7b00ff",
    songs: ["Baby Baby", "夢で逢えたら", "Enjo-kosai"],
    description: "일본의 펑크 록 밴드. 거침없고 폭발적인 에너지 속에 청춘의 서투름과 순수함을 노래합니다.",
  },
  {
    id: "kim-dong-ryul",
    name: "김동률",
    color: "#ffc400",
    songs: ["Replay", "다시 사랑한다 말할까", "아이처럼", "감사"],
    description: "한국의 독보적인 싱어송라이터. 오케스트라 사운드와 깊은 저음의 보컬로 한국 발라드의 정점을 보여줍니다.",
  },
  {
    id: "jaurim",
    name: "자우림",
    color: "#00d4ff",
    songs: ["스물다섯, 스물하나", "매직 카펫 라이드", "샤이닝", "일탈"],
    description: "보컬 김윤아를 중심으로 한 한국의 대표 록 밴드. 몽환적이면서도 파워풀한 사운드로 긴 시간 사랑받고 있습니다.",
  },
  {
    id: "2hollis",
    name: "2hollis",
    color: "#00ff88",
    songs: ["poster boy", "crush", "trauma", "jeans"],
    description: "미국의 하이퍼팝/일렉트로닉 신성이자 프로듀서. 디지털 카타르시스를 자극하는 독창적인 사운드를 선보입니다.",
  },
];

// This sub-component will only run in the browser
const MusicVisualization = ({ onNodeSelect }: { onNodeSelect: (id: string, data: NodeData) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<SigmaInstance | null>(null);
  const onNodeSelectRef = useRef(onNodeSelect);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  useEffect(() => {
    let sigmaInstance: SigmaInstance | null = null;
    let animationFrameId: number | null = null;
    let isDestroyed = false;

    // Dynamic imports to prevent SSR errors
    Promise.all([
      import("sigma"),
      import("graphology"),
      import("graphology-layout-forceatlas2")
    ]).then(([{ Sigma }, { default: Graph }, { default: forceAtlas2 }]) => {
      if (isDestroyed || !containerRef.current) return;

      const graph = new Graph();

      ARTISTS.forEach((artist, i) => {
        const angle = (i / ARTISTS.length) * Math.PI * 2;
        graph.addNode(artist.id, {
          x: Math.cos(angle) * 10,
          y: Math.sin(angle) * 10,
          size: 15,
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
            color: artist.color + "88",
            labelColor: "#ffffff",
            isSong: true,
            parentArtist: artist.name,
          });
          graph.addEdge(artist.id, songId, { color: artist.color + "44" });
        });
      });

      // Cross-Artist Connections
      graph.addEdge("black-skirts", "radiohead", { type: "line", label: "Alt-Rock Influence", weight: 2 });
      graph.addEdge("jaurim", "black-skirts", { type: "line", label: "KR Indie", weight: 2 });
      graph.addEdge("sheena-ringo", "ging-nang-boyz", { type: "line", label: "JP Vibe", weight: 2 });
      graph.addEdge("radiohead", "2hollis", { type: "line", label: "Experimental", weight: 2 });
      graph.addEdge("radiohead", "sheena-ringo", { type: "line", label: "Art Rock", weight: 2 });
      graph.addEdge("kim-dong-ryul", "black-skirts", { type: "line", label: "Songwriters", weight: 1 });

      const sigma = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: true,
        defaultEdgeColor: "#333",
        labelColor: { attribute: "labelColor", color: "#ffffff" },
        labelSize: 14,
        labelFont: "inherit",
        labelWeight: "700",
        labelRenderedSizeThreshold: 0,
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
        graph.setNodeAttribute(draggedNode, "highlighted", true);
        graph.setNodeAttribute(draggedNode, "labelColor", "#000000");
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
        if (draggedNode) {
          graph.setNodeAttribute(draggedNode, "highlighted", false);
          graph.setNodeAttribute(draggedNode, "labelColor", "#ffffff");
        }
        isDragging = false;
        draggedNode = null;
      });

      sigma.on("enterNode", (e: { node: string }) => {
        graph.setNodeAttribute(e.node, "highlighted", true);
        graph.setNodeAttribute(e.node, "labelColor", "#000000");
      });

      sigma.on("leaveNode", (e: { node: string }) => {
        graph.setNodeAttribute(e.node, "highlighted", false);
        graph.setNodeAttribute(e.node, "labelColor", "#ffffff");
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
        scalingRatio: 20, 
        barnesHutOptimize: true,
        linLogMode: true,
        strongGravityMode: false
      };

      forceAtlas2.assign(graph, { settings: layoutSettings, iterations: 100 });

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

    return () => {
      isDestroyed = true;
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      if (sigmaInstance) sigmaInstance.kill();
      if (window.sigmaInstance === sigmaInstance) window.sigmaInstance = null;
    };
  }, []); // Run only once on mount

  return <div ref={containerRef} className="sigma-container" />;
};

export default function MusicPage() {
  const [selectedNode, setSelectedNode] = useState<{ id: string; label: string; desc: string; color: string } | null>(null);

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

  return (
    <div className="music-page-container">
      <header className="music-header">
        <Link href="/" className="back-button" aria-label="Go back">
          <ArrowLeft size={24} />
        </Link>
      </header>

      <div className="main-content">
        <MusicVisualization onNodeSelect={handleNodeSelect} />
        
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
                <span className="node-count">{ARTISTS.length + ARTISTS.reduce((acc, a) => acc + a.songs.length, 0)} Total</span>
              </div>
              <div className="scroll-area">
                {ARTISTS.map(artist => (
                  <div key={artist.id} className="artist-group">
                    <button className="list-item artist-item" onClick={() => handleListItemClick(artist.id)}>
                      <div className="item-indicator" style={{ backgroundColor: artist.color }} />
                      <span className="item-label">{artist.name}</span>
                    </button>
                    <div className="song-list">
                      {artist.songs.map((song, i) => (
                        <button key={`${artist.id}-song-${i}`} className="list-item song-item" onClick={() => handleListItemClick(`${artist.id}-song-${i}`)}>
                          <span className="item-label">{song}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
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

        .back-button {
          pointer-events: auto;
          color: rgba(255, 255, 255, 0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
        }

        .back-button:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(-5px);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .main-content {
          flex: 1;
          display: flex;
          position: relative;
          overflow: hidden;
        }

        :global(.sigma-container) {
          flex: 1;
          cursor: crosshair;
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
          padding: 2rem;
          padding-top: 6rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .list-search-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .node-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.5rem;
          display: block;
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
