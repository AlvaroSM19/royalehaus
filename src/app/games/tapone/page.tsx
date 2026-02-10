'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { categories, getRankByScore, RankInfo, TapOneCategory } from '@/data/tapone-categories';
import { useAuth } from '@/lib/useAuth';
import { recordTapOneSession } from '@/lib/progress';
import cards from '@/data/cards.json';
import { useLanguage } from '@/lib/useLanguage';

// Get random card IDs for spinning animation (only base cards, no evolutions)
const baseCards = cards.filter(c => !c.type.includes('Evolution') && !c.type.includes('Hero') && !c.type.includes('Tower')).map(c => c.id);
const getRandomCardIds = (count: number): number[] => {
  const shuffled = [...baseCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Spin timing configuration
const SPIN_DURATION = 2500;
const REVEAL_DELAY = 100;
const SPIN_INTERVAL = 200; // How fast cards change during spin (slower = more readable)

// Calculate score for a selection: index 0 = 100pts, index 8 = 20pts
const calculatePoints = (index: number): number => 110 - (index + 1) * 10;

export default function TapOnePage() {
  const { user } = useAuth();
  const { getCardNameTranslated } = useLanguage();
  
  // Game state
  const [phase, setPhase] = useState<'spinning' | 'reveal' | 'finished'>('spinning');
  const [indices, setIndices] = useState<number[]>(categories.map(() => 0));
  const [locked, setLocked] = useState<boolean[]>(categories.map(() => false));
  const [selected, setSelected] = useState<(number | null)[]>(categories.map(() => null));
  const [round, setRound] = useState(0);
  const [canSelect, setCanSelect] = useState(false);
  
  // Spinning animation state - random cards shown during spin
  const [spinningCards, setSpinningCards] = useState<number[][]>(categories.map(() => getRandomCardIds(20)));
  const [spinIndex, setSpinIndex] = useState(0);
  
  // Results state
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [playerRank, setPlayerRank] = useState<RankInfo | null>(null);
  const [bestRank, setBestRank] = useState<RankInfo | null>(null);
  
  // Refs for timeout management
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const spinAnimRef = useRef<NodeJS.Timeout | null>(null);
  const recordedRef = useRef(false);
  const posterRef = useRef<HTMLDivElement>(null);
  
  const finished = locked.every(Boolean);

  // Load best rank from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('tapOneBestRoyale');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.rank === 'number') {
          setBestRank(parsed);
        }
      }
    } catch {}
  }, []);

  // Spinning card animation
  useEffect(() => {
    if (phase === 'spinning') {
      spinAnimRef.current = setInterval(() => {
        setSpinIndex(prev => prev + 1);
      }, SPIN_INTERVAL);
      return () => {
        if (spinAnimRef.current) clearInterval(spinAnimRef.current);
      };
    }
  }, [phase]);

  // Generate random indices for non-locked categories
  const generateRandomIndices = useCallback((prev: number[]): number[] => {
    return prev.map((oldIdx, i) => {
      if (locked[i]) return oldIdx;
      const len = categories[i].elements.length;
      if (len <= 1) return 0;
      let r: number;
      do {
        r = Math.floor(Math.random() * len);
      } while (r === oldIdx && len > 1);
      return r;
    });
  }, [locked]);

  // Start a spin cycle
  const startSpinCycle = useCallback((force = false) => {
    if (!force && finished) return;
    
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    
    // Generate new random cards for spinning animation
    setSpinningCards(categories.map(() => getRandomCardIds(20)));
    setSpinIndex(0);
    setPhase('spinning');
    setCanSelect(false);
    
    spinTimeoutRef.current = setTimeout(() => {
      setIndices(prev => {
        const allZero = prev.every(v => v === 0);
        if (allZero) {
          return prev.map((_, i) => Math.floor(Math.random() * categories[i].elements.length));
        }
        return generateRandomIndices(prev);
      });
      
      revealTimeoutRef.current = setTimeout(() => {
        setPhase('reveal');
        setCanSelect(true);
      }, REVEAL_DELAY);
    }, SPIN_DURATION);
  }, [finished, generateRandomIndices]);

  // Initial spin
  useEffect(() => {
    startSpinCycle(true);
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      if (spinAnimRef.current) clearInterval(spinAnimRef.current);
    };
  }, []);

  // Handle category selection
  const handleSelect = (catIdx: number) => {
    if (!canSelect || phase !== 'reveal' || locked[catIdx] || finished) return;
    
    const newLocked = [...locked];
    newLocked[catIdx] = true;
    
    const newSelected = [...selected];
    newSelected[catIdx] = indices[catIdx];
    
    setLocked(newLocked);
    setSelected(newSelected);
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

  // Calculate and show results when finished
  useEffect(() => {
    if (finished && phase === 'finished' && !showResults && !recordedRef.current) {
      let score = 0;
      selected.forEach(idx => {
        if (idx !== null) {
          score += calculatePoints(idx);
        }
      });
      
      const rank = getRankByScore(score);
      setFinalScore(score);
      setPlayerRank(rank);
      
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

  // Restart game
  const handleRestart = () => {
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    if (spinAnimRef.current) clearInterval(spinAnimRef.current);
    
    setIndices(categories.map(() => 0));
    setLocked(categories.map(() => false));
    setSelected(categories.map(() => null));
    setRound(0);
    setPhase('spinning');
    setCanSelect(false);
    setShowResults(false);
    setFinalScore(0);
    setPlayerRank(null);
    recordedRef.current = false;
    
    setTimeout(() => startSpinCycle(true), 0);
  };

  // Render category card - Responsive design
  const renderCard = (cat: TapOneCategory, catIdx: number) => {
    const idx = locked[catIdx] && selected[catIdx] !== null ? selected[catIdx]! : indices[catIdx];
    const element = cat.elements[idx];
    const isLocked = locked[catIdx];
    const clickable = canSelect && phase === 'reveal' && !isLocked && !finished;
    
    // Get current spinning card for this category
    const currentSpinCard = spinningCards[catIdx]?.[spinIndex % (spinningCards[catIdx]?.length || 1)] || 1;
    
    return (
      <button
        key={cat.id}
        onClick={() => handleSelect(catIdx)}
        disabled={!clickable}
        className={`
          relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 group
          ${clickable ? 'hover:scale-[1.02] sm:hover:scale-[1.03] cursor-pointer ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-slate-900' : ''}
          ${isLocked ? 'ring-2 ring-amber-500/60' : ''}
          active:scale-95 touch-manipulation
        `}
        style={{
          background: isLocked 
            ? 'linear-gradient(180deg, rgba(60, 45, 15, 0.98) 0%, rgba(40, 30, 10, 0.99) 100%)'
            : 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
          boxShadow: isLocked 
            ? '0 0 20px rgba(245, 180, 50, 0.5), inset 0 0 15px rgba(245, 180, 50, 0.1)' 
            : clickable
              ? '0 4px 20px rgba(0, 200, 255, 0.3), 0 0 0 1px rgba(100, 200, 255, 0.4)'
              : '0 4px 15px rgba(0,0,0,0.4), 0 0 0 1px rgba(60, 80, 120, 0.2)',
          border: isLocked ? '2px solid rgba(245, 180, 50, 0.8)' : '2px solid rgba(60, 90, 140, 0.4)'
        }}
      >
        {/* Inner golden frame for locked */}
        {isLocked && (
          <div className="absolute inset-0.5 sm:inset-1 rounded-lg sm:rounded-xl border border-amber-400/40 pointer-events-none" />
        )}
        
        {/* Pulsing indicator when clickable */}
        {clickable && (
          <div className="absolute inset-0 rounded-xl animate-pulse bg-cyan-400/10 pointer-events-none" />
        )}
        
        {/* Card content */}
        <div className="p-1 sm:p-1.5">
          {/* Card Image Area */}
          <div 
            className="relative aspect-[3/4] flex items-center justify-center overflow-hidden rounded-md sm:rounded-lg"
            style={{
              background: 'linear-gradient(180deg, rgba(40, 60, 90, 0.4) 0%, rgba(20, 35, 60, 0.5) 100%)',
              border: isLocked ? '1px solid rgba(245, 180, 50, 0.3)' : '1px solid rgba(80, 110, 160, 0.25)'
            }}
          >
            {phase === 'spinning' && !isLocked ? (
              // Spinning animation - rapidly changing cards
              <img
                src={`/images/cards/${currentSpinCard}.png`}
                alt="Loading Clash Royale card"
                className="w-full h-full object-contain p-0.5 sm:p-1"
                loading="eager"
              />
            ) : (
              // Revealed card - high resolution
              <img
                src={`/images/cards/${element.id}.png`}
                alt={getCardNameTranslated(element.id)}
                className="w-full h-full object-contain p-0.5 sm:p-1 animate-fadeIn"
                loading="eager"
              />
            )}
          </div>
        </div>
        
        {/* Separator line */}
        <div className={`mx-1.5 sm:mx-2 h-px ${isLocked ? 'bg-amber-500/40' : 'bg-slate-600/40'}`} />
        
        {/* Category Label - Responsive text */}
        <div className="py-1 sm:py-1.5">
          <span className={`
            block text-center text-[8px] sm:text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.15em]
            ${isLocked ? 'text-amber-400' : clickable ? 'text-cyan-300' : 'text-slate-400'}
          `}
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {cat.label}
          </span>
        </div>
      </button>
    );
  };

  // Best Rank Panel (shown in the grid)
  const renderBestRankPanel = () => (
    <div 
      className="col-span-2 rounded-xl p-3 flex items-center justify-between"
      style={{
        background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.95) 0%, rgba(30, 25, 15, 0.98) 100%)',
        boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
        border: '2px solid rgba(245, 158, 11, 0.6)'
      }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold mb-1">
          <Trophy className="w-3.5 h-3.5" />
          Best Rank
        </div>
        {bestRank ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">#{bestRank.rank}</span>
              <span className="text-amber-400/90 text-[10px] font-semibold uppercase">{bestRank.title}</span>
            </div>
            <div className="text-cyan-400 text-[11px] font-bold mt-0.5">
              {bestRank.trophies.toLocaleString().replace(/,/g, '.')} TROPHIES
            </div>
          </>
        ) : (
          <>
            <div className="text-2xl font-black text-gray-500">---</div>
            <div className="text-gray-500 text-[10px] mt-0.5">Play to get ranked!</div>
          </>
        )}
      </div>
      
      <div className="w-px h-12 bg-amber-600/30 mx-3" />
      
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex gap-1.5">
          {[1, 2, 3].map(r => (
            <div 
              key={r}
              className={`px-2 py-1.5 rounded-md text-center min-w-[48px] ${
                r === 1 ? 'bg-amber-500/20 border border-amber-500/50' :
                r === 2 ? 'bg-slate-500/20 border border-slate-400/40' :
                'bg-amber-700/20 border border-amber-600/40'
              }`}
            >
              <div className={`text-[10px] font-bold ${r === 1 ? 'text-amber-400' : r === 2 ? 'text-slate-300' : 'text-amber-600'}`}>
                #{r}
              </div>
              <div className="text-[8px] text-gray-400 truncate">
                {r === 1 ? 'ULTIM...' : r === 2 ? 'GRAND...' : 'ROYAL...'}
              </div>
            </div>
          ))}
        </div>
        <span className="text-gray-500 text-[8px] uppercase tracking-wider">Top ranks</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header - responsive */}
        <div className="bg-slate-900/95 border-b border-amber-900/30 flex-shrink-0 sticky top-0 z-20">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/" className="flex items-center gap-1 sm:gap-1.5 text-gray-400 hover:text-white transition-colors text-xs">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Home</span>
              </Link>
              <h1 className="text-base sm:text-lg md:text-xl font-black text-amber-400 tracking-wider">TAP ONE</h1>
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
                  <span className="text-amber-300 font-semibold">TAP! ({round + 1}/10)</span>
                )}
                {finished && (
                  <span className="text-green-400 font-semibold">Complete!</span>
                )}
              </div>
              <button
                onClick={handleRestart}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-colors text-xs shadow-lg shadow-amber-500/20"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">New Game</span>
              </button>
            </div>
          </div>
        </div>

        {/* Best Rank Bar - Mobile */}
        <div className="sm:hidden bg-slate-800/80 border-b border-amber-700/30 px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300/80 text-xs font-medium">Best:</span>
            </div>
            {bestRank ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm">#{bestRank.rank}</span>
                <span className="text-amber-400/70 text-[10px] uppercase">{bestRank.title}</span>
                <span className="text-cyan-400 text-[10px] font-bold">{bestRank.trophies.toLocaleString()} 🏆</span>
              </div>
            ) : (
              <span className="text-gray-500 text-xs">Play to rank!</span>
            )}
          </div>
        </div>

        {/* Game Grid - Responsive */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-3 md:p-4">
          <div className="w-full max-w-5xl">
            {/* Mobile: 2 columns, Tablet: 3 columns, Desktop: 5 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {categories.map((cat, i) => renderCard(cat, i))}
            </div>
            
            {/* Best Rank Panel - Desktop only */}
            <div className="hidden sm:block mt-3">
              {renderBestRankPanel()}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Results Modal - Responsive */}
      {showResults && playerRank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div 
            ref={posterRef}
            className="relative rounded-2xl sm:rounded-3xl max-w-4xl w-full overflow-hidden my-auto"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 15, 8, 0.98) 0%, rgba(35, 25, 12, 0.99) 50%, rgba(20, 15, 8, 0.98) 100%)',
              boxShadow: '0 0 40px rgba(245, 180, 50, 0.3), 0 0 80px rgba(245, 158, 11, 0.15)',
              border: '2px sm:border-[3px] solid rgba(245, 180, 50, 0.7)'
            }}
          >
            {/* Inner decorative border */}
            <div className="absolute inset-1 sm:inset-2 rounded-xl sm:rounded-2xl border border-amber-500/30 pointer-events-none" />
            
            {/* Corner decorations - hidden on mobile */}
            <div className="hidden sm:block absolute top-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-l-4 border-t-4 border-amber-400/60 rounded-tl-3xl" />
            <div className="hidden sm:block absolute top-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-r-4 border-t-4 border-amber-400/60 rounded-tr-3xl" />
            <div className="hidden sm:block absolute bottom-0 left-0 w-12 sm:w-16 h-12 sm:h-16 border-l-4 border-b-4 border-amber-400/60 rounded-bl-3xl" />
            <div className="hidden sm:block absolute bottom-0 right-0 w-12 sm:w-16 h-12 sm:h-16 border-r-4 border-b-4 border-amber-400/60 rounded-br-3xl" />
            
            <div className="p-4 sm:p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <div className="inline-block mb-2 sm:mb-4">
                  <div className="text-amber-400/80 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2">Your Result</div>
                  <div className="h-px w-20 sm:w-32 mx-auto bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                </div>
                
                <div className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 mb-2 sm:mb-3"
                  style={{ textShadow: '0 0 40px rgba(245, 180, 50, 0.5)' }}
                >
                  #{playerRank.rank}
                </div>
                
                <div className="text-lg sm:text-xl md:text-2xl text-amber-400 font-black uppercase tracking-wider mb-2">
                  {playerRank.title}
                </div>
                
                <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40">
                  <span className="text-cyan-400 text-sm sm:text-base md:text-lg font-bold tracking-wide">
                    🏆 {playerRank.trophies.toLocaleString()} TROPHIES
                  </span>
                </div>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
                <span className="text-amber-500/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Your Selections</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
              </div>

              {/* Selected Cards Grid - Responsive */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 md:gap-3 mb-4 sm:mb-6 md:mb-8">
                {categories.map((cat, i) => {
                  const idx = selected[i];
                  if (idx === null) return null;
                  const element = cat.elements[idx];
                  
                  return (
                    <div 
                      key={cat.id} 
                      className="rounded-lg sm:rounded-xl overflow-hidden"
                      style={{ 
                        background: 'linear-gradient(180deg, rgba(40, 55, 80, 0.6) 0%, rgba(25, 35, 55, 0.7) 100%)',
                        border: '1px solid rgba(100, 130, 180, 0.3)'
                      }}
                    >
                      <div className="aspect-square p-1 sm:p-2">
                        <img
                          src={`/images/cards/${element.id}.png`}
                          alt={getCardNameTranslated(element.id)}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="h-px bg-slate-600/40" />
                      <div className="py-1 sm:py-2 px-0.5 sm:px-1">
                        <div className="text-[8px] sm:text-[10px] md:text-[11px] text-amber-400 font-bold uppercase tracking-wider text-center truncate">{cat.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4">
                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-gray-900 font-black rounded-xl hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/30 uppercase tracking-wider text-sm sm:text-base"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  Play Again
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-slate-800/80 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-all border border-slate-600/50 uppercase tracking-wider text-sm sm:text-base"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
