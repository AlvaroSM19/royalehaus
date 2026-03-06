'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { categories, getRankByScore, RankInfo, TapOneCategory, RANKS } from '@/data/tapone-categories';
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

const SPIN_MIN = 2000;
const SPIN_MAX = 2000;
const REVEAL_READY_DELAY = 120;
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
  fighters: '/images/games/1.webp',
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
  const gameRef = useRef<HTMLDivElement>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);
  const recordedRef = useRef(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const [indices, setIndices] = useState<number[]>(categories.map(() => 0));
  const [phase, setPhase] = useState<'spinning' | 'reveal' | 'finished'>('spinning');
  const [canSelect, setCanSelect] = useState(false);
  const [locked, setLocked] = useState<boolean[]>(categories.map(() => false));
  const [selected, setSelected] = useState<(number | null)[]>(categories.map(() => null));
  const [round, setRound] = useState(0);
  const finished = locked.every(Boolean);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [playerRank, setPlayerRank] = useState<RankInfo | null>(null);
  const [resultsSelected, setResultsSelected] = useState<(number | null)[] | null>(null);
  const [bestRank, setBestRank] = useState<RankInfo | null>(null);
  const [resultsShownOnce, setResultsShownOnce] = useState(false);
  // Roulette: random card IDs shown during spinning (per category)
  const [spinCardIds, setSpinCardIds] = useState<number[]>(categories.map(() => baseCards[0]));
  const spinIntervalRef = useRef<number | null>(null);

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

  // Roulette effect: alternate random card images every 200ms during spinning
  useEffect(() => {
    if (phase === 'spinning') {
      // Start roulette interval
      spinIntervalRef.current = window.setInterval(() => {
        setSpinCardIds(categories.map(() => {
          const randomIdx = Math.floor(Math.random() * baseCards.length);
          return baseCards[randomIdx];
        }));
      }, 200) as unknown as number;
      return () => {
        if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
      };
    } else {
      if (spinIntervalRef.current) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
      }
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
    setPhase('spinning');
    setCanSelect(false);
    const spinDuration = SPIN_MIN + Math.floor(Math.random() * (SPIN_MAX - SPIN_MIN + 1));
    spinTimeoutRef.current = window.setTimeout(() => {
      setIndices((prev: number[]) => {
        const allZero = prev.every(v => v === 0);
        if (allZero) {
          return prev.map((_, i) => Math.floor(Math.random() * categories[i].elements.length));
        }
        return generateRandomIndices(prev);
      });
      revealTimeoutRef.current = window.setTimeout(() => {
        setPhase('reveal');
        setCanSelect(true);
      }, REVEAL_READY_DELAY);
    }, spinDuration) as unknown as number;
  }, [finished, generateRandomIndices]);

  useEffect(() => {
    const first = [TRANSITION_OVERLAYS.tanks, TRANSITION_OVERLAYS['win-conditions'], TRANSITION_OVERLAYS.spells, TRANSITION_OVERLAYS.buildings];
    warmImages(first, 'high').catch(() => {}).then(() => startSpinCycle(true));
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const handleSelect = (catIdx: number) => {
    if (!canSelect || phase !== 'reveal' || locked[catIdx] || finished) return;
    const newLocked = [...locked]; newLocked[catIdx] = true;
    const newSelected = [...selected]; newSelected[catIdx] = indices[catIdx];
    setLocked(newLocked); setSelected(newSelected);
    setRound((r: number) => r + 1);
    if (newLocked.filter(Boolean).length === categories.length) {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      setPhase('finished');
    } else {
      setTimeout(() => startSpinCycle(), 400);
    }
  };

  useEffect(() => {
    if (finished && phase === 'finished' && !showResults && !resultsShownOnce) {
      let score = 0;
      selected.forEach(idx => { if (idx !== null) score += calculatePoints(idx); });
      const rank = getRankByScore(score);
      setFinalScore(score); setPlayerRank(rank);
      setResultsSelected([...selected]);
      try {
        const currentBestJson = localStorage.getItem('tapOneBestRoyale');
        let currentBest: RankInfo | null = null;
        if (currentBestJson) currentBest = JSON.parse(currentBestJson) as RankInfo;
        if (!currentBest || rank.rank < currentBest.rank) {
          localStorage.setItem('tapOneBestRoyale', JSON.stringify(rank));
          setBestRank(rank);
        }
      } catch {}
      if (!recordedRef.current) {
        recordTapOneSession(score, rank.rank);
        recordedRef.current = true;
      }
      setTimeout(() => { setShowResults(true); setResultsShownOnce(true); }, 800);
    }
  }, [finished, phase, showResults, selected, resultsShownOnce]);

  const handleRestart = () => {
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    setIndices(categories.map(() => 0)); setLocked(categories.map(() => false));
    setSelected(categories.map(() => null)); setRound(0);
    setPhase('spinning'); setCanSelect(false);
    setShowResults(false); setFinalScore(0); setPlayerRank(null);
    recordedRef.current = false; setResultsShownOnce(false);
    setTimeout(() => startSpinCycle(true), 0);
  };

  const handleClosePoster = () => {
    setShowResults(false);
    setPhase('finished');
    setCanSelect(false);
    setResultsShownOnce(true);
  };

  useEffect(() => {
    if (showResults) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showResults]);

  // ── Render a single category card (reusable) ──
  const renderCategoryCard = (catIndex: number, heightClass?: string) => {
    const cat = categories[catIndex];
    const idx = locked[catIndex] && selected[catIndex] !== null ? selected[catIndex]! : indices[catIndex];
    const el = cat.elements[idx];
    const clickable = canSelect && phase === 'reveal' && !locked[catIndex] && !finished;
    const overlaySrc = TRANSITION_OVERLAYS[cat.id];
    const h = heightClass ?? 'h-[140px] sm:h-[170px] lg:h-[180px]';
    return (
      <button
        key={cat.id}
        onClick={() => handleSelect(catIndex)}
        disabled={!clickable}
        className={`tapone-mobile-card group relative rounded-xl sm:rounded-2xl p-[2px] transition-transform duration-200 ${clickable ? 'hover:scale-[1.03] cursor-pointer' : ''}`}
        aria-label={`Select ${cat.label}`}
        style={{
          boxShadow: locked[catIndex]
            ? '0 0 0 2px rgba(139,92,246,0.65), 0 4px 12px rgba(139,92,246,0.25)'
            : clickable
              ? '0 0 15px rgba(139,92,246,0.3), 0 0 0 1px rgba(139,92,246,0.4)'
              : '0 6px 16px rgba(0,0,0,0.35)',
        }}
      >
        <div className={`rounded-xl sm:rounded-2xl bg-gradient-to-br ${locked[catIndex] ? 'from-violet-500/80 via-fuchsia-500/70 to-pink-500/70' : 'from-slate-600/50 via-slate-700/50 to-slate-800/50'}`}>
          <div className={`rounded-[10px] sm:rounded-[14px] bg-slate-900/70 backdrop-blur-md overflow-hidden flex flex-col items-center justify-between ${h}`}>
            <div className="w-full flex-1 flex items-center justify-center p-1">
              {phase === 'spinning' && !locked[catIndex] ? (
                <img
                  src={`/images/cards/${spinCardIds[catIndex]}.webp`}
                  alt=""
                  decoding="async"
                  loading="eager"
                  className="max-w-[100px] sm:max-w-[140px] max-h-[80px] sm:max-h-[110px] object-contain opacity-60 transition-opacity duration-100"
                />
              ) : (
                <img
                  src={`/images/cards/${el.id}.webp`}
                  alt={getCardNameTranslated(el.id)}
                  className="max-w-[100px] sm:max-w-[140px] max-h-[80px] sm:max-h-[110px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] opacity-0 animate-fade-in"
                  draggable={false}
                />
              )}
            </div>
            <div className={`tapone-mobile-label w-full py-1.5 sm:py-2 text-center text-[9px] sm:text-[11px] md:text-sm font-extrabold uppercase tracking-wide border-t ${locked[catIndex] ? 'bg-gradient-to-r from-violet-600/30 via-fuchsia-600/25 to-pink-600/30 border-violet-400/30 text-violet-200' : 'bg-gradient-to-r from-slate-700/40 to-slate-800/40 border-slate-600/50 text-slate-200/90'}`}>
              {cat.label}
            </div>
          </div>
        </div>
        {locked[catIndex] && (
          <span className="absolute top-1 right-1 sm:top-2 sm:right-2 inline-flex items-center gap-1 bg-violet-600 text-white text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl shadow-md">✓</span>
        )}
        {clickable && (
          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-violet-400/60 group-hover:ring-violet-300/80 animate-pulse" />
        )}
      </button>
    );
  };

  return (
    <div ref={gameRef} className="min-h-screen text-amber-100 relative">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/65 via-black/55 to-black/70 -z-10" />

      {/* Header */}
      <div className="tapone-header border-b border-amber-700/40 bg-[#042836]/70 backdrop-blur-sm sticky top-0 z-40 shadow-lg shadow-black/40">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="flex items-center gap-1 sm:gap-1.5 text-gray-400 hover:text-white transition-colors text-xs">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <h1 className="text-base sm:text-lg md:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow">☝️ TAP ONE</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-gray-400 text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5">
                {phase === 'spinning' && !finished && (
                  <>
                    <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Spinning...</span>
                  </>
                )}
                {phase === 'reveal' && !finished && (
                  <span className="text-amber-300 font-semibold">TAP! ({round + 1}/{categories.length})</span>
                )}
                {finished && (
                  <span className="text-green-400 font-semibold">Complete!</span>
                )}
              </div>
              <button onClick={handleRestart} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-semibold rounded-lg hover:brightness-110 transition text-xs shadow shadow-black/40">
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">New Game</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status pill — hidden on mobile (info shown in header) */}
      <section className="tapone-status hidden sm:block max-w-7xl mx-auto px-2 sm:px-4 mt-2 sm:mt-4">
        <div className="rounded-xl border border-violet-400/20 bg-violet-600/10 px-3 sm:px-4 py-2 text-violet-200/90 text-xs sm:text-sm">
          {finished ? (
            <span>Game completed! All {categories.length} categories selected.</span>
          ) : phase === 'spinning' && !finished ? (
            <span>🌀 Spinning cards...</span>
          ) : phase === 'reveal' ? (
            <span>Select one category ({round + 1}/{categories.length}) to lock.</span>
          ) : null}
        </div>
      </section>

      {/* Best Rank Bar — Mobile compact */}
      <div className="sm:hidden px-2 mt-2">
        <div className="bg-[#042836]/80 border border-amber-700/30 rounded-xl px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300/80 text-xs font-medium">Best:</span>
            </div>
            {bestRank ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm">🏆 #{bestRank.rank}</span>
                <span className="text-amber-400/70 text-[10px] uppercase">{bestRank.title.replace(/^[^\s]+\s/, '')}</span>
              </div>
            ) : (
              <span className="text-gray-500 text-xs">Play to rank!</span>
            )}
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="tapone-card-container mx-auto max-w-6xl px-1 sm:px-0 mt-2 lg:mt-3">
        {/* Mobile: 2-column grid */}
        <div className="sm:hidden grid grid-cols-2 gap-2 px-1 mb-2">
          {categories.map((_, i) => renderCategoryCard(i))}
        </div>

        {/* Desktop: Row 1 — first 4 categories */}
        <div className="hidden sm:grid grid-cols-4 gap-3 lg:gap-4 px-2 mb-3 lg:mb-4">
          {[0, 1, 2, 3].map(i => renderCategoryCard(i, 'h-[170px] lg:h-[180px]'))}
        </div>

        {/* Desktop: Row 2 — next 4 categories */}
        <div className="hidden sm:grid grid-cols-4 gap-3 lg:gap-4 px-2 mb-3 lg:mb-4">
          {[4, 5, 6, 7].map(i => renderCategoryCard(i))}
        </div>

        {/* Row 3 Desktop: air, Best Rank (span 2), swarm */}
        <div className="hidden sm:grid grid-cols-4 gap-3 lg:gap-4 px-2">
          {renderCategoryCard(8, 'h-[220px]')}

          {/* Best Rank Display (span 2) */}
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-br from-amber-500/60 via-yellow-500/60 to-orange-500/60 col-span-2">
            <div className="rounded-[14px] bg-slate-900/70 backdrop-blur-md overflow-hidden h-[170px] lg:h-[180px] flex flex-row items-stretch">
              <div className="flex-1 flex items-center justify-center px-4 py-5">
                <div className="text-center md:text-left space-y-2">
                  <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-1 justify-center md:justify-start"><span>🏆</span><span>Best Rank</span></h3>
                  {bestRank ? (
                    <>
                      <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-3">
                        <div className="text-4xl font-extrabold text-amber-200 drop-shadow">#{bestRank.rank}</div>
                        <div className="text-xs text-amber-100/90 font-bold leading-tight max-w-xs">{bestRank.title}</div>
                      </div>
                      <div className="text-xs text-emerald-300 font-extrabold tracking-wide">{bestRank.trophies.toLocaleString()} TROPHIES</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-gray-500">---</div>
                      <div className="text-gray-500 text-[10px] mt-0.5">Play to get ranked!</div>
                    </>
                  )}
                </div>
              </div>
              <div className="w-px bg-gradient-to-b from-amber-400/40 via-amber-300/30 to-amber-400/40 my-6"></div>
              <div className="w-1/2 flex items-center justify-center px-4">
                <div className="grid grid-cols-3 gap-2 w-full max-w-md">
                  {RANKS.slice(0, 3).map(r => (
                    <div key={r.rank} className={`rounded-lg border px-2 py-2 text-center ${bestRank && r.rank === bestRank.rank ? 'bg-amber-500/30 border-amber-300 text-amber-100' : 'bg-amber-500/10 border-amber-400/30 text-amber-200/80'}`}>
                      <div className="text-[10px] font-black">#{r.rank}</div>
                      <div className="text-[9px] font-semibold truncate max-w-[80px] mx-auto">{r.title.replace(/^[^\s]+\s/, '')}</div>
                    </div>
                  ))}
                  <div className="col-span-3 text-[10px] text-amber-200/60 font-semibold mt-1 text-center">Top ranks preview</div>
                </div>
              </div>
            </div>
          </div>

          {renderCategoryCard(9, 'h-[170px] lg:h-[180px]')}
        </div>
      </div>

      {/* Bottom Controls — desktop only */}
      <div className="hidden sm:flex justify-center mt-8 gap-4">
        {finished ? (
          <button onClick={handleRestart} className="px-6 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg hover:from-emerald-400 hover:to-emerald-600 transition-colors">
            New Game
          </button>
        ) : phase === 'spinning' && !finished ? (
          <span className="text-base md:text-lg text-amber-200/90 bg-amber-600/10 border border-amber-400/30 rounded-lg px-4 py-3 animate-pulse">🌀 Spinning...</span>
        ) : phase === 'reveal' ? (
          <span className="text-base md:text-lg text-violet-200/90 bg-violet-600/10 border border-violet-400/30 rounded-lg px-3 py-2">Select a category ({round + 1}/{categories.length})</span>
        ) : null}
      </div>

      {/* Fade animation */}
      <style>{`
        @keyframes fadeIn { from {opacity:0; transform: scale(0.9);} to {opacity:1; transform: scale(1);} }
        .animate-fade-in { animation: fadeIn 280ms ease-out forwards; }
      `}</style>

      {/* Results poster */}
      {showResults && playerRank && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto pt-14 lg:pt-16">
          <div className="flex flex-col items-center w-full max-w-2xl sm:max-w-3xl lg:max-w-5xl">
            <div ref={posterRef} className="relative w-full mx-auto overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl" style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98) 0%, rgba(35,25,12,0.99) 50%, rgba(20,15,8,0.98) 100%)', boxShadow: '0 0 40px rgba(245,180,50,0.3), 0 0 80px rgba(245,158,11,0.15)', border: '3px solid rgba(245,180,50,0.7)' }}>
              <div className="absolute inset-1.5 sm:inset-2 rounded-lg sm:rounded-xl border border-amber-500/30 pointer-events-none" />
              <div className="hidden sm:block absolute top-0 left-0 w-14 h-14 border-l-4 border-t-4 border-amber-400/60 rounded-tl-2xl" />
              <div className="hidden sm:block absolute top-0 right-0 w-14 h-14 border-r-4 border-t-4 border-amber-400/60 rounded-tr-2xl" />
              <div className="hidden sm:block absolute bottom-0 left-0 w-14 h-14 border-l-4 border-b-4 border-amber-400/60 rounded-bl-2xl" />
              <div className="hidden sm:block absolute bottom-0 right-0 w-14 h-14 border-r-4 border-b-4 border-amber-400/60 rounded-br-2xl" />
              <div className="relative p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <div className="text-center mb-2 sm:mb-3 lg:mb-4">
                  <div className="text-xl sm:text-3xl lg:text-4xl font-black tracking-[0.15em] sm:tracking-[0.25em] text-white drop-shadow uppercase">BATTLE RESULTS</div>
                  <div className="mt-0.5 text-[9px] sm:text-[10px] lg:text-xs font-extrabold tracking-[0.2em] sm:tracking-[0.35em] text-amber-400/80 uppercase">Clash Royale Tap One</div>
                  <div className="mt-1 sm:mt-2 text-sm sm:text-lg lg:text-xl font-black text-amber-300 drop-shadow leading-tight">#{playerRank.rank} {playerRank.title.replace(/^[^\s]+\s/, '')}</div>
                </div>

                {/* Characters grid 2x5 */}
                <div className="mb-2 sm:mb-3 lg:mb-4">
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 lg:gap-3">
                    {categories.map((cat, i) => {
                      const base = resultsSelected ?? selected;
                      const idx = base[i]!; const el = cat.elements[idx];
                      return (
                        <div key={cat.id} className="relative rounded-md sm:rounded-lg border-2 border-amber-900/40 bg-amber-50/10 p-1 sm:p-1.5 lg:p-2 flex flex-col items-center shadow-inner">
                          <div className="text-[6px] sm:text-[8px] lg:text-[10px] font-black text-amber-500/80 uppercase tracking-wider mb-0.5">{cat.label}</div>
                          <img src={`/images/cards/${el.id}.webp`} alt={getCardNameTranslated(el.id)} className="w-full h-12 sm:h-16 lg:h-20 object-contain drop-shadow" />
                          <div className="mt-0.5 text-[8px] sm:text-[10px] lg:text-xs font-bold text-amber-200 text-center leading-tight line-clamp-2">{getCardNameTranslated(el.id)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Score */}
                <div className="text-center">
                  <div className="text-[10px] sm:text-xs lg:text-sm font-black tracking-[0.3em] text-amber-400/70">TOTAL SCORE</div>
                  <div className="text-lg sm:text-2xl lg:text-3xl font-black text-emerald-400 flex items-baseline justify-center gap-1 drop-shadow-lg">
                    <span>{finalScore} / 1000</span>
                  </div>
                  <div className="inline-block mt-1 px-4 sm:px-6 py-1 sm:py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40">
                    <span className="text-cyan-400 text-xs sm:text-sm font-bold tracking-wide">🏆 {playerRank.trophies.toLocaleString()} TROPHIES</span>
                  </div>
                  <div className="mt-2"><div className="text-[8px] sm:text-[9px] lg:text-[10px] font-extrabold tracking-[0.3em] text-amber-900/50 select-none">ROYALEHAUS.COM</div></div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
              <button onClick={handleRestart} className="flex-1 px-6 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-gradient-to-br from-emerald-600 via-green-600 to-emerald-700 text-white shadow-lg shadow-emerald-900/30 hover:brightness-110 transition">
                New Game
              </button>
              <Link href="/" className="flex-1 px-6 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 text-black shadow-lg shadow-amber-900/30 hover:brightness-110 transition text-center">
                Go to Menu
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}