'use client';

import React from 'react';

interface Chord {
  frets: (number | 'x')[];
  fingers?: number[];
  barres?: number[];
}

interface ChordDiagramProps {
  name: string;
  chord?: Chord;
  className?: string;
  hideName?: boolean;
}

const defaultChords: Record<string, Chord> = {
    'DM7': { frets: ['x', 'x', 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
    'Bm': { frets: ['x', 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barres: [2] },
    'Em': { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    'A': { frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    'A7': { frets: ['x', 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
    'GM7': { frets: [3, 'x', 4, 4, 3, 'x'], fingers: [1, 0, 3, 4, 2, 0] },
    'D': { frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    'G': { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
    'C': { frets: ['x', 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
};

export default function ChordDiagram({ name, chord: propChord, className = '', hideName = false }: ChordDiagramProps) {
  const chord = propChord || defaultChords[name] || { frets: [0, 0, 0, 0, 0, 0] };
  const strings = 6, fretCount = 5, width = 120, height = 150;
  const marginX = 20, marginY = 30;
  const stringSpace = (width - 2 * marginX) / (strings - 1);
  const fretSpace = (height - 2 * marginY) / fretCount;

  const validFrets = chord.frets.filter((f): f is number => typeof f === 'number' && f > 0);
  const maxFret = validFrets.length > 0 ? Math.max(...validFrets) : 0;
  const startFret = maxFret > 5 ? Math.max(1, Math.min(...validFrets) - 1) : 1;

  return (
    <div className={`${hideName ? 'p-3 pt-5' : 'p-6'} bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:scale-105 hover:bg-neutral-800/80 text-center ${className}`}>
      {!hideName && (
        <div className="font-mono font-black text-xl mb-4 bg-gradient-to-b from-blue-300 to-blue-500 bg-clip-text text-transparent tracking-tighter">
          {name}
        </div>
      )}
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto overflow-visible block">
        <rect x={marginX} y={marginY} width={width - 2 * marginX} height={height - 2 * marginY} className="fill-[#111]" rx="2" />
        {Array.from({ length: fretCount + 1 }).map((_, i) => (
          <line 
            key={`fret-${i}`} 
            x1={marginX} 
            y1={marginY + i * fretSpace} 
            x2={width - marginX} 
            y2={marginY + i * fretSpace} 
            stroke={i === 0 && startFret === 1 ? '#e2e8f0' : '#333'} 
            strokeWidth={i === 0 && startFret === 1 ? 4 : 1.5} 
            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
          />
        ))}

        {startFret > 1 && (
          <text x={0} y={marginY + fretSpace / 2} className="text-[9px] font-bold fill-neutral-500 font-mono">
            {startFret}fr
          </text>
        )}

        {Array.from({ length: strings }).map((_, i) => (
          <rect 
            key={`string-${i}`} 
            x={marginX + i * stringSpace - 0.5} 
            y={marginY} 
            width={1 + i * 0.2} 
            height={height - 2 * marginY} 
            fill="url(#stringGrad)" 
            className="opacity-60"
          />
        ))}

        <defs>
          <linearGradient id="stringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#444" />
            <stop offset="50%" stopColor="#888" />
            <stop offset="100%" stopColor="#444" />
          </linearGradient>
          <radialGradient id="markGrad">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="80%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
        </defs>

        {chord.frets.map((fret, stringIndex) => {
          if (fret === 'x') {
            return (
              <text key={stringIndex} x={marginX + stringIndex * stringSpace} y={marginY - 8} textAnchor="middle" className="text-sm font-black fill-red-500">×</text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={stringIndex} cx={marginX + stringIndex * stringSpace} cy={marginY - 10} r={4} className="fill-none stroke-blue-400 stroke-2 animate-pulse" />
            );
          }

          const displayFret = (fret as number) - startFret + 1;
          if (displayFret < 1 || displayFret > fretCount) return null;

          return (
            <g key={stringIndex} className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
              <circle 
                cx={marginX + stringIndex * stringSpace} 
                cy={marginY + displayFret * fretSpace - fretSpace / 2} 
                r={stringSpace / 2.2} 
                fill="url(#markGrad)" 
              />
              {chord.fingers?.[stringIndex] !== undefined && (
                <text 
                  x={marginX + stringIndex * stringSpace} 
                  y={marginY + displayFret * fretSpace - fretSpace / 2 + 3} 
                  textAnchor="middle" 
                  className="text-[9px] font-black fill-white pointer-events-none"
                >
                  {chord.fingers[stringIndex]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
