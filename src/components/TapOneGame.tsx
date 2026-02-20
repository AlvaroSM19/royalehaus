'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { categories, getRankByScore, RankInfo, TapOneCategory } from '@/data/tapone-categories';
import { useAuth } from '@/lib/useAuth';
import { recordTapOneSession } from '@/lib/progress';
import cards from '@/data/cards.json';
import { useLanguage } from '@/lib/useLanguage';

// Constants
const baseCards = cards.filter(c => !c.type.includes('Evolution') && !c.type.includes('Hero') && !c.type.includes('Tower')).map(c => c.id);
const getRandomCardIds = (count: number): number[] => {
  const shuffled = [...baseCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const SPIN_DURATION = 2500;
const REVEAL_DELAY = 100;
const SPIN_INTERVAL = 200;
const calculatePoints = (index: number): number => 110 - (index + 1) * 10;

const TRANSITION_OVERLAYS: Record<string, string> = {
  tanks: '/images/games/1.webp',
  'win-conditions': '/images/games/2.webp',
  spells: '/images/games/3.webp',
  buildings: '/images/games/4.webp',
  cycle: '/images/games/5.webp',
  splash: '/images/games/6.webp',
  legendary: '/images/games/7.webp',
  goblins: '/images/games/8.webp',
  air: '/images/games/9.webp',
  swarm: '/images/games/1.webp',
};

const warmImages = async (urls: string[], priority: 'high' | 'low' = 'low') => {
  if (typeof window === 'undefined') return;
  const decodes: Promise<void>[] = [];
  for (const u of urls) {
    const img = new window.Image();
    try { (img as any).fetchPriority = priority; } catch {}
    img.decoding = 'async';
    img.src = u;
    if (typeof (img as any).decode === 'function') {
      decodes.push((img as any).decode().then(() => undefined).catch(() => undefined));
    }
  }
  await Promise.race([
    Promise.all(decodes),
    new Promise<void>(resolve => setTimeout(resolve, 200)),
  ]);
};

export default function TapOneGame() {
  const { user } = useAuth();
  const { getCardNameTranslated } = useLanguage();
  const [phase, setPhase] = useState<'spinning' | 'reveal' | 'finished'>('spinning');
  const [indices, setIndices] = useState<number[]>(categories.map(() => 0));
  const [locked, setLocked] = useState<boolean[]>(categories.map(() => false));
  const [selected, setSelected] = useState<(number | null)[]>(categories.map(() => null));
  const [round, setRound] = useState(0);
  const [canSelect, setCanSelect] = useState(false);
  const [spinningCards, setSpinningCards] = useState<number[][]>(categories.map(() => getRandomCardIds(20)));
  const [spinIndex, setSpinIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [playerRank, setPlayerRank] = useState<RankInfo | null>(null);
  const [bestRank, setBestRank] = useState<RankInfo | null>(null);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinAnimRef = useRef<NodeJS.Timeout | null>(null);
  const recordedRef = useRef(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const finished = locked.every(Boolean);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('tapOneBestRoyale');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.rank === 'number') setBestRank(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const overlayUrls = Object.values(TRANSITION_OVERLAYS);
    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 200));
    idle(async () => {
      try { await warmImages(overlayUrls, 'low'); } catch {}
      const firstCards = categories.map(c => `/images/cards/${c.elements[0]?.id}.webp`).filter(Boolean);
      try { await warmImages(firstCards, 'low'); } catch {}
    });
  }, []);

  useEffect(() => {
    if (phase === 'spinning') {
      spinAnimRef.current = setInterval(() => { setSpinIndex(prev => prev + 1); }, SPIN_INTERVAL);
      return () => { if (spinAnimRef.current) clearInterval(spinAnimRef.current); };
    }
  }, [phase]);

  const generateRandomIndices = useCallback((prev: number[]): number[] => {
    return prev.map((oldIdx, i) => {
      if (locked[i]) return oldIdx;
      const len = categories[i].elements.length;
      if (len <= 1) return 0;
      let r: number;
      do { r = Math.floor(Math.random() * len); } while (r === oldIdx && len > 1);
      return r;
    });
  }, [locked]);

  const startSpinCycle = useCallback((force = false) => {
    if (!force && finished) return;
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    setSpinningCards(categories.map(() => getRandomCardIds(20)));
    setSpinIndex(0);
    setPhase('spinning');
    setCanSelect(false);
    spinTimeoutRef.current = setTimeout(() => {
      setIndices(prev => {
        const allZero = prev.every(v => v === 0);
        if (allZero) return prev.map((_, i) => Math.floor(Math.random() * categories[i].elements.length));
        return generateRandomIndices(prev);
      });
      revealTimeoutRef.current = setTimeout(() => {
        setPhase('reveal');
        setCanSelect(true);
      }, REVEAL_DELAY);
    }, SPIN_DURATION);
  }, [finished, generateRandomIndices]);

  useEffect(() => {
    startSpinCycle(true);
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (spinAnimRef.current) clearInterval(spinAnimRef.current);
    };
  }, []);

  const handleSelect = (catIdx: number) => {
    if (!canSelect || phase !== 'reveal' || locked[catIdx] || finished) return;
    const newLocked = [...locked]; newLocked[catIdx] = true;
    const newSelected = [...selected]; newSelected[catIdx] = indices[catIdx];
    setLocked(newLocked); setSelected(newSelected);
    setRound(r => r + 1);
    if (newLocked.filter(Boolean).length === categories.length) {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (spinAnimRef.current) clearInterval(spinAnimRef.current);
      setPhase('finished');
    } else {
      setTimeout(() => startSpinCycle(), 400);
    }
  };

  useEffect(() => {
    if (finished && phase === 'finished' && !showResults && !recordedRef.current) {
      let score = 0;
      selected.forEach(idx => { if (idx !== null) score += calculatePoints(idx); });
      const rank = getRankByScore(score);
      setFinalScore(score); setPlayerRank(rank);
      try {
        if (!bestRank || rank.rank < bestRank.rank) {
          localStorage.setItem('tapOneBestRoyale', JSON.stringify(rank));
          setBestRank(rank);
        }
      } catch {}
      recordedRef.current = true;
      recordTapOneSession(score, rank.rank);
      setTimeout(() => setShowResults(true), 800);
    }
  }, [finished, phase, showResults, selected, bestRank]);

  const handleRestart = () => {
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    if (spinAnimRef.current) clearInterval(spinAnimRef.current);
    setIndices(categories.map(() => 0)); setLocked(categories.map(() => false));
    setSelected(categories.map(() => null)); setRound(0);
    setPhase('spinning'); setCanSelect(false);
    setShowResults(false); setFinalScore(0); setPlayerRank(null);
    recordedRef.current = false;
    setTimeout(() => startSpinCycle(true), 0);
  };

  const renderCard = (cat: TapOneCategory, catIdx: number) => {
    const idx = locked[catIdx] && selected[catIdx] !== null ? selected[catIdx]! : indices[catIdx];
    const element = cat.elements[idx];
    const isLocked = locked[catIdx];
    const clickable = canSelect && phase === 'reveal' && !isLocked && !finished;
    const currentSpinCard = spinningCards[catIdx]?.[spinIndex % (spinningCards[catIdx]?.length || 1)] || 1;
    const overlayUrl = TRANSITION_OVERLAYS[cat.id];
    return (
      <button
        key={cat.id}
        onClick={() => handleSelect(catIdx)}
        disabled={!clickable}
        className={`group relative rounded-xl sm:rounded-2xl p-[2px] transition-all duration-200 ${clickable ? 'hover:scale-[1.02] sm:hover:scale-[1.03] cursor-pointer' : ''} active:scale-95 touch-manipulation`}
        style={{
          background: isLocked
            ? 'linear-gradient(135deg, rgba(245,180,50,0.8), rgba(220,130,20,0.7), rgba(245,180,50,0.8))'
            : clickable
              ? 'linear-gradient(135deg, rgba(0,200,255,0.6), rgba(100,180,255,0.4), rgba(0,200,255,0.6))'
              : 'linear-gradient(135deg, rgba(60,80,120,0.4), rgba(40,60,100,0.3))',
          boxShadow: isLocked
            ? '0 0 20px rgba(245, 180, 50, 0.4), 0 8px 24px rgba(245, 158, 11, 0.2)'
            : clickable ? '0 4px 20px rgba(0, 200, 255, 0.3)' : '0 6px 16px rgba(0,0,0,0.35)',
        }}
      >
        <div className={`rounded-[10px] sm:rounded-[14px] overflow-hidden flex flex-col items-center justify-between ${isLocked ? 'bg-slate-900/80' : 'bg-slate-900/70'} backdrop-blur-md h-[130px] sm:h-[160px] lg:h-[170px]`}>
          <div className="w-full flex-1 flex items-center justify-center relative">
            {phase === 'spinning' && !isLocked ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={`/images/cards/${currentSpinCard}.webp`} alt="" className="w-full h-full object-contain p-1 sm:p-2 opacity-40" loading="eager" />
                {overlayUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-3xl sm:text-4xl drop-shadow-lg">{cat.icon}</span>
                  </div>
                )}
              </div>
            ) : (
              <img src={`/images/cards/${element.id}.webp`} alt={getCardNameTranslated(element.id)} className="w-full h-full object-contain p-1 sm:p-2 animate-fadeIn" loading="eager" />
            )}
          </div>
          <div className={`w-full py-1 sm:py-1.5 text-center border-t ${isLocked ? 'bg-gradient-to-r from-amber-600/30 via-yellow-600/25 to-amber-600/30 border-amber-500/40' : 'bg-gradient-to-r from-slate-700/40 to-slate-800/40 border-slate-600/50'}`}>
            <span className={`block text-[8px] sm:text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.15em] ${isLocked ? 'text-amber-400' : clickable ? 'text-cyan-300' : 'text-slate-400'}`}>
              {cat.label}
            </span>
          </div>
        </div>
        {isLocked && (
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 inline-flex items-center bg-amber-500 text-slate-900 text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl shadow-md font-bold">✓</span>
        )}
        {clickable && (
          <span className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl ring-2 ring-cyan-400/50 group-hover:ring-cyan-300/70 animate-pulse" />
        )}
      </button>
    );
  };

  const renderBestRankPanel = () => (
    <div className="relative rounded-xl sm:rounded-2xl p-[2px] h-full" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.6), rgba(234,179,8,0.5), rgba(245,158,11,0.6))' }}>
      <div className="rounded-[10px] sm:rounded-[14px] bg-slate-900/80 backdrop-blur-md h-full p-3 sm:p-4 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold mb-1"><Trophy className="w-3.5 h-3.5" /> Best Rank</div>
          {bestRank ? (
            <>
              <div className="flex items-baseline gap-1.5"><span className="text-2xl font-black text-white">#{bestRank.rank}</span><span className="text-amber-400/90 text-[10px] font-semibold uppercase">{bestRank.title}</span></div>
              <div className="text-cyan-400 text-[11px] font-bold mt-0.5">{bestRank.trophies.toLocaleString().replace(/,/g, '.')} TROPHIES</div>
            </>
          ) : (
            <><div className="text-2xl font-black text-gray-500">---</div><div className="text-gray-500 text-[10px] mt-0.5">Play to get ranked!</div></>
          )}
        </div>
        <div className="w-px h-12 bg-amber-600/30 mx-3" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(r => (
              <div key={r} className={`px-2 py-1.5 rounded-md text-center min-w-[48px] ${r === 1 ? 'bg-amber-500/20 border border-amber-500/50' : r === 2 ? 'bg-slate-500/20 border border-slate-400/40' : 'bg-amber-700/20 border border-amber-600/40'}`}>
                <div className={`text-[10px] font-bold ${r === 1 ? 'text-amber-400' : r === 2 ? 'text-slate-300' : 'text-amber-600'}`}>#{r}</div>
                <div className="text-[8px] text-gray-400 truncate">{r === 1 ? 'ULTIM...' : r === 2 ? 'GRAND...' : 'ROYAL...'}</div>
              </div>
            ))}
          </div>
          <span className="text-gray-500 text-[8px] uppercase tracking-wider">Top ranks</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      <div className="relative z-10 flex flex-col flex-1">
        <div className="bg-[#042836]/80 backdrop-blur-sm border-b border-amber-700/40 flex-shrink-0 sticky top-0 z-20 shadow-lg shadow-black/40">
          <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="flex items-center gap-1 sm:gap-1.5 text-gray-400 hover:text-white transition-colors text-xs"><Home className="w-3.5 h-3.5" /><span className="hidden xs:inline">Home</span></Link>
              <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow">TAP ONE</h1>
            </div>
            <button onClick={handleRestart} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:brightness-110 transition text-xs sm:text-sm shadow-lg shadow-amber-500/20">
              <RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">New Game</span>
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 mt-2">
          <div className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm border ${finished ? 'bg-green-600/10 border-green-400/30 text-green-300' : phase === 'spinning' ? 'bg-amber-600/10 border-amber-400/30 text-amber-200/90 animate-pulse' : 'bg-cyan-600/10 border-cyan-400/30 text-cyan-200/90'}`}>
            {finished ? <span>Game completed! All {categories.length} categories selected.</span> : phase === 'spinning' ? <span>Spinning cards...</span> : <span>Select a category! ({round + 1}/{categories.length})</span>}
          </div>
        </div>

        <div className="sm:hidden px-2 mt-2">
          <div className="rounded-xl bg-slate-800/80 border border-amber-700/30 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-400" /><span className="text-amber-300/80 text-xs font-medium">Best:</span></div>
              {bestRank ? (
                <div className="flex items-center gap-2"><span className="text-white font-black text-sm">#{bestRank.rank}</span><span className="text-amber-400/70 text-[10px] uppercase">{bestRank.title}</span><span className="text-cyan-400 text-[10px] font-bold">{bestRank.trophies.toLocaleString()} 🏆</span></div>
              ) : <span className="text-gray-500 text-xs">Play to rank!</span>}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4">
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-2 sm:mb-3">{categories.slice(0, 4).map((cat, i) => renderCard(cat, i))}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-2 sm:mb-3">{categories.slice(4, 8).map((cat, i) => renderCard(cat, i + 4))}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {renderCard(categories[8], 8)}
              <div className="hidden sm:block col-span-2">{renderBestRankPanel()}</div>
              {renderCard(categories[9], 9)}
            </div>
            <div className="sm:hidden mt-2">{renderBestRankPanel()}</div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.28s ease-out forwards; }
      `}</style>

      {showResults && playerRank && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto pt-14 lg:pt-16">
          <div className="flex flex-col items-center w-full max-w-2xl sm:max-w-3xl lg:max-w-5xl">
            <div ref={posterRef} className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98) 0%, rgba(35,25,12,0.99) 50%, rgba(20,15,8,0.98) 100%)', boxShadow: '0 0 40px rgba(245,180,50,0.3), 0 0 80px rgba(245,158,11,0.15)', border: '3px solid rgba(245,180,50,0.7)' }}>
              <div className="absolute inset-1.5 sm:inset-2 rounded-lg sm:rounded-xl border border-amber-500/30 pointer-events-none" />
              <div className="hidden sm:block absolute top-0 left-0 w-14 h-14 border-l-4 border-t-4 border-amber-400/60 rounded-tl-2xl" />
              <div className="hidden sm:block absolute top-0 right-0 w-14 h-14 border-r-4 border-t-4 border-amber-400/60 rounded-tr-2xl" />
              <div className="hidden sm:block absolute bottom-0 left-0 w-14 h-14 border-l-4 border-b-4 border-amber-400/60 rounded-bl-2xl" />
              <div className="hidden sm:block absolute bottom-0 right-0 w-14 h-14 border-r-4 border-b-4 border-amber-400/60 rounded-br-2xl" />
              <div className="relative p-4 sm:p-6 lg:p-8">
                <div className="text-center mb-3 sm:mb-5">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-white drop-shadow uppercase">BATTLE RESULTS</div>
                  <div className="mt-1 text-[9px] sm:text-[10px] lg:text-xs font-extrabold tracking-[0.2em] sm:tracking-[0.35em] text-amber-400/80 uppercase">Clash Royale Tap One</div>
                  <div className="mt-1 sm:mt-2 h-px w-24 sm:w-40 mx-auto bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                </div>
                <div className="text-center mb-3 sm:mb-5">
                  <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 mb-1 sm:mb-2">#{playerRank.rank}</div>
                  <div className="text-base sm:text-xl md:text-2xl text-amber-400 font-black uppercase tracking-wider mb-2">{playerRank.title}</div>
                  <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40">
                    <span className="text-cyan-400 text-sm sm:text-base md:text-lg font-bold tracking-wide">🏆 {playerRank.trophies.toLocaleString()} TROPHIES</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-5">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
                  <span className="text-amber-500/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Your Selections</span>
                  <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 lg:gap-3 mb-4 sm:mb-6">
                  {categories.map((cat, i) => {
                    const idx = selected[i]; if (idx === null) return null;
                    const element = cat.elements[idx]; const points = calculatePoints(idx);
                    return (
                      <div key={cat.id} className="relative rounded-md sm:rounded-lg border-2 border-amber-900/40 bg-amber-50/10 p-1 sm:p-1.5 lg:p-2 flex flex-col items-center shadow-inner">
                        <div className="text-[6px] sm:text-[8px] lg:text-[10px] font-black text-amber-500/80 uppercase tracking-wider mb-0.5">{cat.label}</div>
                        <img src={`/images/cards/${element.id}.webp`} alt={getCardNameTranslated(element.id)} className="w-full h-10 sm:h-14 lg:h-18 object-contain drop-shadow" />
                        <div className="mt-0.5 text-[7px] sm:text-[9px] lg:text-[11px] font-bold text-amber-200 text-center leading-tight line-clamp-2">{getCardNameTranslated(element.id)}</div>
                        <div className={`mt-0.5 text-[8px] sm:text-[10px] font-black ${points >= 80 ? 'text-green-400' : points >= 50 ? 'text-amber-400' : 'text-red-400'}`}>+{points}pts</div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mb-2">
                  <div className="text-[10px] sm:text-xs lg:text-sm font-black tracking-[0.3em] text-amber-400/70">TOTAL SCORE</div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 drop-shadow-lg">{finalScore} / 1000</div>
                </div>
                <div className="text-center mt-2"><div className="text-[8px] sm:text-[9px] lg:text-[10px] font-extrabold tracking-[0.3em] text-amber-900/50 select-none">ROYALEHAUS.COM</div></div>
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
              <button onClick={handleRestart} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-black rounded-xl hover:brightness-110 transition shadow-lg shadow-amber-500/30 uppercase tracking-wider text-sm sm:text-base">
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" /> Play Again
              </button>
              <Link href="/" className="flex-1 flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-slate-800/80 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition border border-slate-600/50 uppercase tracking-wider text-sm sm:text-base">
                <Home className="w-4 h-4 sm:w-5 sm:h-5" /> Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}