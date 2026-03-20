'use client';

import { useState, useCallback, useMemo } from 'react';
import Tesseract from 'tesseract.js';
import { 
  Camera, 
  Trash2, 
  Play, 
  Pause, 
  Upload, 
  Music,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChordDiagram from './components/ChordDiagram';
import EyeTracker from './components/EyeTracker';
import { BackButton } from '../../components/BackButton';

const parseLines = (text: string) => {
  const lines = text.split('\n');
  const result: { chords: string[]; lyrics: string }[] = [];
  const chordRegex = /\b([A-G][b#]?)(maj|min|m|M|7|add|sus|dim|aug|[\d])*\b/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const matches = line.match(chordRegex);
    const chordCount = matches ? matches.length : 0;
    if (chordCount > 0 && chordCount / (line.length + 1) > 0.05) {
      const chords = matches || [];
      const nextLine = (i + 1 < lines.length && !lines[i + 1].match(chordRegex)) ? lines[i + 1].trim() : '';
      result.push({ chords, lyrics: nextLine });
      if (nextLine) i++;
    } else if (line.length > 0) {
      result.push({ chords: [], lyrics: line });
    }
  }
  return result;
};

export default function GuitarTutor() {
  const [step, setStep] = useState(1);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [eyeTrackingActive, setEyeTrackingActive] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const parsedData = useMemo(() => parseLines(text), [text]);
  const allChords = useMemo(() => {
    const s = new Set<string>();
    parsedData.forEach(p => p.chords.forEach(c => s.add(c)));
    return Array.from(s);
  }, [parsedData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const { data: { text: ocrText } } = await Tesseract.recognize(file, 'eng+kor');
      setText((prev) => prev + '\n' + ocrText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const nextLine = useCallback(() => {
    if (parsedData.length === 0) return;
    setCurrentLine((prev) => (prev + 1) % parsedData.length);
  }, [parsedData.length]);

  const prevLine = useCallback(() => {
    if (parsedData.length === 0) return;
    setCurrentLine((prev) => (prev - 1 + parsedData.length) % parsedData.length);
  }, [parsedData.length]);

  const togglePlay = () => {
    const newPlaying = !isPlaying;
    setIsPlaying(newPlaying);
    setEyeTrackingActive(newPlaying);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 relative overflow-hidden font-sans">
      <div className="fixed top-8 left-8 z-[10001]">
        <BackButton />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '5s'}}></div>
      </div>

      <header className="relative z-10 max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between p-5 md:px-8 bg-neutral-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-transform hover:rotate-6">
            <Music size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight leading-none mb-1">Chordial AI</h1>
            <p className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest mt-1">Premium Performance Assistant</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <section className="bg-neutral-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="flex items-center gap-3 text-xl font-extrabold">
                    <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
                    1. Input Sheet
                  </h2>
                  <button onClick={() => setText('')} className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <textarea 
                  className="w-full h-64 bg-black/40 border border-white/5 rounded-2xl p-5 text-neutral-200 text-base outline-none resize-none focus:border-blue-500/50 transition-colors mb-6"
                  placeholder="Paste lyrics/chords or upload image..." 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                />
                
                <div className="flex flex-col gap-4">
                  <label className="block w-full cursor-pointer group">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <div className="w-full p-5 bg-neutral-800 text-white rounded-2xl flex items-center justify-center gap-3 font-extrabold tracking-wide border border-white/5 transition-all hover:bg-neutral-700">
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <><Camera size={24} /><span>SCAN SCORE SHEET (OCR)</span></>
                      )}
                    </div>
                  </label>
                  
                  <button 
                    disabled={!text.trim()}
                    onClick={() => setStep(2)}
                    className="w-full p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center gap-3 font-extrabold tracking-wide shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-transform hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0"
                  >
                    <span>ANALYZE & CONTINUE</span>
                    <ArrowRight size={24} />
                  </button>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10"
            >
              <div className="lg:col-span-4 flex flex-col gap-8">
                <button 
                  onClick={() => { setStep(1); setEyeTrackingActive(false); setIsPlaying(false); }}
                  className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors font-bold group"
                >
                  <ArrowRight size={20} className="rotate-180 transition-transform group-hover:-translate-x-1" />
                  BACK TO INPUT
                </button>

                <section className="bg-neutral-900/60 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black text-blue-500/60 uppercase tracking-widest">Chord Library</h3>
                    <div className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-md">{allChords.length}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                    {allChords.map((chord, idx) => (
                      <div key={chord + idx}>
                        <ChordDiagram name={chord} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className={`lg:col-span-8 transition-all duration-500 ${isFullScreen ? 'fixed inset-0 z-[10002] p-0' : ''}`}>
                <section className={`bg-neutral-900/60 backdrop-blur-3xl border border-white/5 shadow-2xl flex flex-col relative overflow-hidden transition-all duration-500 ${isFullScreen ? 'h-screen w-screen rounded-0 p-20' : 'rounded-[2.5rem] p-10 h-[80vh]'}`}>
                  <div className="flex items-center justify-between mb-12 relative z-20">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.7)] ${isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-neutral-700'}`}></div>
                        <h2 className="text-2xl font-black tracking-tight uppercase">Performance</h2>
                      </div>
                      <div className="flex items-center gap-6">
                        <EyeTracker active={eyeTrackingActive} onNextLine={nextLine} />
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={togglePlay} 
                            className={`px-8 py-4 rounded-full font-black text-sm flex flex-col items-center gap-0 transition-all hover:scale-105 shadow-xl min-w-[180px] ${isPlaying ? 'bg-blue-600 text-white' : 'bg-white text-black'}`}
                          >
                            <div className="flex items-center gap-2">
                              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                              <span>{isPlaying ? 'PAUSE SHOW' : 'START SHOW'}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase mt-1 opacity-70 ${isPlaying ? 'text-blue-200' : 'text-neutral-500'}`}>
                              {isPlaying ? 'Eye Trace Active' : 'Eye Trace Inactive'}
                            </span>
                          </button>
                          
                          <button 
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-4 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors border border-white/5"
                          >
                            {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                          </button>
                        </div>
                      </div>
                  </div>

                  <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-hidden relative z-10">
                    <div className="flex-1 overflow-hidden lg:overflow-y-auto pr-4 space-y-12 scrollbar-hide flex flex-col justify-start py-10">
                      <AnimatePresence mode="wait">
                        {parsedData.length > 0 ? (
                          <motion.div 
                            key={currentLine}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="flex flex-col items-center text-center"
                          >
                            <div className="flex flex-wrap justify-center gap-8 mb-10 w-full">
                              {parsedData[currentLine].chords.map((chord, cIdx) => (
                                <div key={cIdx} className="flex flex-col items-center gap-4 text-[#bfdbfe]">
                                  <div className={`${isFullScreen ? 'w-48' : 'w-32'} transform hover:scale-110 transition-transform`}>
                                    <ChordDiagram name={chord} hideName />
                                  </div>
                                  <span className={`${isFullScreen ? 'text-7xl' : 'text-5xl'} font-black tracking-tighter drop-shadow-[0_10px_20px_rgba(59,130,246,0.4)]`}>
                                    {chord}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div 
                              onClick={nextLine}
                              className={`${isFullScreen ? 'text-3xl md:text-5xl' : 'text-2xl md:text-4xl'} font-black leading-tight tracking-tight text-white max-w-4xl cursor-pointer hover:text-blue-400 transition-colors break-keep`}
                            >
                              {parsedData[currentLine].lyrics}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                             <Upload size={48} className="mb-6 opacity-30" />
                             <p className="text-2xl font-black text-white tracking-widest">STAGE IS EMPTY</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>

                    {parsedData.length > 0 && currentLine < parsedData.length - 1 && (
                      <div className="hidden 2xl:flex w-64 flex-col justify-center items-center gap-4 border-l border-white/10 pl-10 h-full overflow-hidden">
                        <div className="flex flex-col items-center gap-1 mb-2">
                          <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-[0.3em]">Next Up</span>
                          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
                        </div>
                        
                        <div 
                          onClick={nextLine}
                          className="flex flex-col items-center gap-4 cursor-pointer group/next-side w-full"
                        >
                          {parsedData[currentLine + 1].chords.length > 0 && (
                            <div className="flex flex-col items-center gap-4 w-full">
                              <div className="w-32 aspect-[3/4] bg-neutral-900/60 rounded-[3rem] border border-white/10 overflow-hidden flex items-center justify-center p-4 transition-transform group-hover/next-side:scale-105 group-hover/next-side:border-blue-500/30">
                                <ChordDiagram 
                                  name={parsedData[currentLine + 1].chords[0]} 
                                  hideName 
                                  className="bg-transparent border-none p-0 shadow-none hover:scale-100" 
                                />
                              </div>
                              <span className="text-3xl font-black text-blue-400 tracking-tighter drop-shadow-[0_4px_10px_rgba(59,130,246,0.3)]">
                                {parsedData[currentLine + 1].chords[0]}
                              </span>
                            </div>
                          )}
                          
                          <div className="text-center px-4">
                            <p className="text-sm font-bold text-neutral-400 uppercase leading-relaxed line-clamp-3 group-hover/next-side:text-blue-200 transition-colors opacity-80 break-keep">
                              {parsedData[currentLine + 1].lyrics}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {parsedData.length > 0 && (
                    <div className={`absolute bottom-10 left-10 right-10 flex items-center justify-between z-20 ${isFullScreen ? 'bottom-20 left-20 right-20' : ''}`}>
                      <div 
                        onClick={nextLine}
                        className="hidden md:flex flex-col gap-1 cursor-pointer group/upcoming transition-transform hover:scale-[1.02] active:scale-95"
                      >
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest group-hover/upcoming:text-blue-400 transition-colors">Upcoming Line</span>
                        <div className={`${isFullScreen ? 'text-xl' : 'text-lg'} font-bold text-neutral-400 opacity-60 group-hover/upcoming:opacity-100 transition-all break-keep`}>
                          {parsedData[currentLine + 1]?.lyrics || "End of Performance"}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-neutral-800/80 backdrop-blur-xl p-2 rounded-[2rem] border border-white/10 shadow-2xl ml-auto">
                        <button 
                          onClick={prevLine}
                          className="p-4 rounded-full hover:bg-neutral-700 transition-all group"
                        >
                          <ArrowLeft size={20} className="group-hover:text-blue-400 transition-colors" />
                        </button>
                        
                        <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

                        <div className="flex items-baseline gap-1 px-4 min-w-[100px] justify-center">
                          <span className="text-2xl font-black text-blue-400 leading-none">{currentLine + 1}</span>
                          <span className="text-xs font-bold text-blue-400/50 leading-none">/ {parsedData.length}</span>
                        </div>

                        <div className="w-[1px] h-6 bg-white/10 mx-2"></div>

                        <button 
                          onClick={nextLine}
                          className="p-4 rounded-full hover:bg-neutral-700 transition-all group"
                        >
                          <ArrowRight size={20} className="group-hover:text-blue-400 transition-colors" />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
