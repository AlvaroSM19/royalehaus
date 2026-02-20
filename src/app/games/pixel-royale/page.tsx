'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, Search, HelpCircle, Trophy, Check, X, XCircle, CheckCircle, Clock, UserPlus, Flame } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { useAuth } from '@/lib/useAuth';
import { recordPixelRoyaleSession } from '@/lib/progress';
import { includesNormalized } from '@/lib/text-utils';

const MAX_GUESSES = 6;

// Pixelation levels for each step (lower = more pixelated)
// Step 0: very pixelated (hard), Step 6: full resolution (revealed)
// Using pixel sizes: larger number = bigger pixels = harder to see
const PIXEL_SIZES = [32, 20, 12, 8, 4, 2, 1]; // Pixel block size
const BLUR_STEPS  = [8, 5, 3, 2, 1, 0, 0];     // Additional blur for smoothness
const SCALE_STEPS = [1.8, 1.6, 1.4, 1.2, 1.1, 1.05, 1.0]; // Slight zoom

// Daily challenge helpers
interface DailyResult {
  won: boolean;
  guesses: number;
  cardId: number;
}

interface DailyStreakData {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
  history: string[];
}

const DAILY_STREAK_KEY = 'pixel-royale-daily-streak';

function getDailyStreakData(): DailyStreakData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(DAILY_STREAK_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function updateDailyStreak(): DailyStreakData {
  const today = new Date().toISOString().slice(0, 10);
  const existing = getDailyStreakData();
  
  if (!existing) {
    const newData: DailyStreakData = {
      currentStreak: 1,
      bestStreak: 1,
      lastPlayedDate: today,
      history: [today]
    };
    localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(newData));
    return newData;
  }
  
  // Check if already played today
  if (existing.lastPlayedDate === today) {
    return existing;
  }
  
  // Check if yesterday was played (continue streak)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  let newStreak: number;
  if (existing.lastPlayedDate === yesterdayStr) {
    newStreak = existing.currentStreak + 1;
  } else {
    newStreak = 1;
  }
  
  const data: DailyStreakData = {
    currentStreak: newStreak,
    bestStreak: Math.max(newStreak, existing.bestStreak),
    lastPlayedDate: today,
    history: [...existing.history, today].slice(-30)
  };
  
  localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(data));
  return data;
}

function getTimeUntilReset(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { hours, minutes, seconds };
}

// Seeded random for daily challenge
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyCard(): ClashCard {
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((acc, part) => acc + parseInt(part), 0) * 31337;
  const index = Math.floor(seededRandom(seed) * baseCards.length);
  return baseCards[index];
}

// Pixelated Image Component using Canvas
interface PixelatedImageProps {
  src: string;
  pixelSize: number;
  blur: number;
  scale: number;
  className?: string;
  onLoad?: () => void;
}

function PixelatedImage({ src, pixelSize, blur, scale, className, onLoad }: PixelatedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
      onLoad?.();
    };
    img.src = src;
  }, [src, onLoad]);

  useEffect(() => {
    if (!loaded || !imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imgRef.current;
    const size = 256; // Canvas size
    canvas.width = size;
    canvas.height = size;

    // If pixelSize is 1, draw at full resolution
    if (pixelSize <= 1) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, 0, 0, size, size);
      return;
    }

    // Calculate the small size for pixelation
    const smallSize = Math.max(4, Math.floor(size / pixelSize));

    // Create an offscreen canvas for the small version
    const offCanvas = document.createElement('canvas');
    offCanvas.width = smallSize;
    offCanvas.height = smallSize;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    // Draw the image small (this creates the pixelation)
    offCtx.imageSmoothingEnabled = true;
    offCtx.drawImage(img, 0, 0, smallSize, smallSize);

    // Draw the small image back to the main canvas, scaled up with no smoothing
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offCanvas, 0, 0, smallSize, smallSize, 0, 0, size, size);

  }, [loaded, pixelSize]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        transform: `scale(${scale})`,
        opacity: loaded ? 1 : 0,
        transition: 'all 0.7s ease-out',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export default function PixelRoyalePage() {
  // This is now a daily-only game
  
  const { user } = useAuth();
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [step, setStep] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  
  // Daily mode state
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Load best score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pixelRoyale_bestScore');
      if (saved) setBestScore(parseInt(saved, 10));
    } catch {}
  }, []);

  // Countdown timer effect
  useEffect(() => {
    const updateCountdown = () => setCountdown(getTimeUntilReset());
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const initGame = useCallback(() => {
    // Check if already completed today
    const today = new Date().toISOString().slice(0, 10);
    const lastDaily = localStorage.getItem('pixel-royale-last-daily');
    const lastDailyResultStr = localStorage.getItem('pixel-royale-daily-result');
    
    if (lastDaily === today && lastDailyResultStr) {
      try {
        const result = JSON.parse(lastDailyResultStr) as DailyResult;
        setDailyCompleted(true);
        setDailyResult(result);
        setDailyStreak(getDailyStreakData());
        
        // Load the daily card for display
        const dailyCard = getDailyCard();
        setTargetCard(dailyCard);
        setGameOver(true);
        setWon(result.won);
        setStep(MAX_GUESSES);
        setImageReady(true);
        return; // Don't reset the game state
      } catch (e) {
        // Invalid stored data, continue with new game
      }
    } else {
      setDailyCompleted(false);
      setDailyResult(null);
    }
    
    setImageReady(false);
    setStep(0);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowHint(false);
    
    setTargetCard(getDailyCard());
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const guessedCardIds = useMemo(() => new Set(guesses.map(g => g.id)), [guesses]);

  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return baseCards
      .filter(card => !guessedCardIds.has(card.id))
      .filter(card => {
        const englishMatch = includesNormalized(card.name, searchTerm);
        const translatedName = getCardNameTranslated(card.id);
        const translatedMatch = includesNormalized(translatedName, searchTerm);
        return englishMatch || translatedMatch;
      })
      .slice(0, 8);
  }, [searchTerm, guessedCardIds, getCardNameTranslated]);

  const handleGuess = (card: ClashCard) => {
    if (gameOver || !targetCard) return;
    if (dailyCompleted) return;

    const newGuesses = [...guesses, card];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    const isWin = card.id === targetCard.id;
    const isLoss = !isWin && newGuesses.length >= MAX_GUESSES;

    if (isWin) {
      setStep(MAX_GUESSES);
      setWon(true);
      setGameOver(true);
      // Save best score
      if (bestScore === null || newGuesses.length < bestScore) {
        setBestScore(newGuesses.length);
        try { localStorage.setItem('pixelRoyale_bestScore', String(newGuesses.length)); } catch {}
      }
    } else {
      setStep(newGuesses.length);
      if (isLoss) {
        setGameOver(true);
        setTimeout(() => setStep(MAX_GUESSES), 800);
      }
    }

    // Save daily result
    if (isWin || isLoss) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('pixel-royale-last-daily', today);
      localStorage.setItem('pixel-royale-daily-result', JSON.stringify({
        won: isWin,
        guesses: newGuesses.length,
        cardId: targetCard.id
      }));
      setDailyCompleted(true);
      setDailyResult({ won: isWin, guesses: newGuesses.length, cardId: targetCard.id });
      const newStreak = updateDailyStreak();
      setDailyStreak(newStreak);
      
      // Record session for XP
      recordPixelRoyaleSession(newGuesses.length, isWin);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.webp`;

  const getHint = () => {
    if (!targetCard) return '';
    return [`${targetCard.elixir} elixir`, targetCard.type, targetCard.rarity].join(' • ');
  };

  const currentPixelSize = PIXEL_SIZES[Math.min(step, PIXEL_SIZES.length - 1)];
  const currentBlur = BLUR_STEPS[Math.min(step, BLUR_STEPS.length - 1)];
  const currentScale = SCALE_STEPS[Math.min(step, SCALE_STEPS.length - 1)];

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Dark Overlay for wallpaper visibility */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-gray-900/90 border-b border-gray-700/50 sticky top-0 z-20 backdrop-blur-sm">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-slate-600">/</span>
              <h1 className="text-base sm:text-lg md:text-xl font-black text-amber-400 tracking-wider flex items-center gap-2">
                PIXEL ROYALE
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-full font-bold">
                  DAILY
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wide hidden sm:inline">
                Guesses: <span className="text-white font-bold">{guesses.length}/{MAX_GUESSES}</span>
              </span>
              {dailyCompleted && (
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next in {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto w-full px-2 xs:px-3 sm:px-4 py-6 xs:py-8 sm:py-10 md:py-14 flex-1">
          {/* Daily Completed Banner */}
          {dailyCompleted && dailyResult && (
            <div className="mb-8 max-w-2xl mx-auto">
              <div 
                className="relative rounded-2xl p-6 text-center overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 50, 40, 0.95) 0%, rgba(15, 40, 30, 0.98) 100%)',
                  border: '2px solid rgba(34, 197, 94, 0.5)',
                }}
              >
                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-green-400/60" />
                <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-green-400/60" />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-green-400/60" />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-green-400/60" />
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <h3 className="text-xl font-black text-green-400 uppercase tracking-wider">
                    Daily Completed!
                  </h3>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  {targetCard && (
                    <>
                      <img
                        src={`/images/cards/${targetCard.id}.webp`}
                        alt={getCardNameTranslated(targetCard.id)}
                        className="w-16 h-20 object-contain rounded-lg border-2 border-green-500/50"
                      />
                      <div className="text-left">
                        <div className="text-white font-bold text-lg">{getCardNameTranslated(targetCard.id)}</div>
                        <div className="text-green-300/80 text-sm">
                          {dailyResult.won ? (
                            <span className="flex items-center gap-1">
                              <Trophy className="w-4 h-4" />
                              Correct!
                            </span>
                          ) : (
                            <span>Better luck tomorrow!</span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Countdown to next daily */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Next daily available in:</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-black text-amber-400">{countdown.hours.toString().padStart(2, '0')}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Hours</div>
                    </div>
                    <span className="text-2xl font-bold text-slate-600">:</span>
                    <div className="text-center">
                      <div className="text-2xl font-black text-amber-400">{countdown.minutes.toString().padStart(2, '0')}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Minutes</div>
                    </div>
                    <span className="text-2xl font-bold text-slate-600">:</span>
                    <div className="text-center">
                      <div className="text-2xl font-black text-amber-400">{countdown.seconds.toString().padStart(2, '0')}</div>
                      <div className="text-[10px] text-slate-500 uppercase">Seconds</div>
                    </div>
                  </div>
                </div>
                
                {/* Account Creation Reminder */}
                {!user && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                      <UserPlus className="w-5 h-5" />
                      <span className="font-semibold">Save your progress!</span>
                    </div>
                    <p className="text-gray-400 text-sm text-center mb-3">
                      Create an account to save your stats and streaks
                    </p>
                    <a
                      href="/auth"
                      className="block w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-colors text-center text-sm"
                    >
                      Create Account
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Panel */}
          <div className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mb-4 sm:mb-6 md:mb-8">
            <div 
              className="text-center px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl min-w-[70px] xs:min-w-[80px]"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                border: '2px solid rgba(60, 90, 140, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
              }}
            >
              <div className="text-lg xs:text-xl sm:text-2xl font-black text-amber-400">{guesses.length}/{MAX_GUESSES}</div>
              <div className="text-[7px] xs:text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Guesses</div>
            </div>
            <div 
              className="text-center px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl min-w-[70px] xs:min-w-[80px]"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                border: '2px solid rgba(60, 90, 140, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
              }}
            >
              <div className="text-lg xs:text-xl sm:text-2xl font-black text-cyan-400">{Math.round((step / MAX_GUESSES) * 100)}%</div>
              <div className="text-[7px] xs:text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Clarity</div>
            </div>
            {bestScore !== null && (
              <div 
                className="text-center px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg sm:rounded-xl min-w-[70px] xs:min-w-[80px]"
                style={{
                  background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.95) 0%, rgba(30, 25, 15, 0.98) 100%)',
                  border: '2px solid rgba(245, 158, 11, 0.6)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)'
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-amber-400" />
                  <span className="text-lg xs:text-xl sm:text-2xl font-black text-white">{bestScore}</span>
                </div>
                <div className="text-[7px] xs:text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] text-cyan-400">Best</div>
              </div>
            )}
          </div>

          {/* Main Card Container */}
          <div className="flex justify-center mb-4 sm:mb-6 md:mb-8 px-2">
            <div 
              className="relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300 w-full max-w-[200px] xs:max-w-[220px] sm:max-w-[260px] md:max-w-[300px] lg:max-w-[320px]"
              style={{
                background: gameOver 
                  ? won 
                    ? 'linear-gradient(180deg, rgba(20, 60, 30, 0.98) 0%, rgba(10, 40, 20, 0.99) 100%)'
                    : 'linear-gradient(180deg, rgba(60, 20, 20, 0.98) 0%, rgba(40, 15, 15, 0.99) 100%)'
                  : 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                border: gameOver 
                  ? won 
                    ? '2px solid rgba(74, 222, 128, 0.8)' 
                    : '2px solid rgba(248, 113, 113, 0.8)'
                  : '2px solid rgba(60, 90, 140, 0.4)',
                boxShadow: gameOver 
                  ? won 
                    ? '0 0 30px rgba(74, 222, 128, 0.4)' 
                    : '0 0 30px rgba(248, 113, 113, 0.4)'
                  : '0 4px 20px rgba(0,0,0,0.4)'
              }}
            >
              <div className="aspect-square relative">
                {/* Image Area */}
                <div 
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(40, 60, 90, 0.4) 0%, rgba(20, 35, 60, 0.5) 100%)',
                  }}
                >
                  {targetCard && (
                    <PixelatedImage
                      src={getCardImageUrl(targetCard)}
                      pixelSize={currentPixelSize}
                      blur={currentBlur}
                      scale={currentScale}
                      className="w-full h-full object-contain p-2 sm:p-3"
                      onLoad={() => setImageReady(true)}
                    />
                  )}
                </div>
              </div>

              {/* Progress dots */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1 xs:gap-1.5 bg-slate-900/90 px-2 xs:px-3 py-1 xs:py-1.5 rounded-full border border-slate-700/50">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
                      i < guesses.length
                        ? won && i === guesses.length - 1
                          ? 'bg-green-500 shadow-lg shadow-green-500/50'
                          : 'bg-amber-500 shadow-lg shadow-amber-500/50'
                        : 'bg-slate-700 border border-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hint Button */}
          {!gameOver && guesses.length >= 2 && (
            <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md sm:rounded-lg bg-slate-800/80 border border-cyan-600/40 hover:bg-slate-700 transition-all text-cyan-400 text-[11px] xs:text-xs sm:text-sm font-semibold"
              >
                <HelpCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
          )}

          {showHint && !gameOver && (
            <div 
              className="text-center mb-3 sm:mb-4 md:mb-6 text-amber-300 text-[11px] xs:text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl py-2.5 xs:py-3 px-3 xs:px-4 max-w-md mx-auto"
              style={{
                background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.95) 0%, rgba(30, 25, 15, 0.98) 100%)',
                border: '2px solid rgba(245, 158, 11, 0.5)',
              }}
            >
              <span className="text-amber-400 font-bold">HINT:</span> {getHint()}
            </div>
          )}

          {/* Search Input */}
          {!gameOver && (
            <div className="max-w-md mx-auto mb-4 sm:mb-6 md:mb-8 px-1">
              <div className="relative">
                <Search className="absolute left-2.5 xs:left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type at least 2 letters..."
                  className="w-full pl-9 xs:pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 xs:py-3 sm:py-4 rounded-lg sm:rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all text-sm"
                  style={{
                    background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                    border: '2px solid rgba(60, 90, 140, 0.5)',
                  }}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredCards.length > 0 && (
                  <div 
                    className="absolute z-50 w-full mt-2 rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-80 overflow-y-auto"
                    style={{
                      background: 'linear-gradient(180deg, rgba(15, 25, 40, 0.98) 0%, rgba(10, 18, 30, 0.99) 100%)',
                      border: '2px solid rgba(60, 90, 140, 0.5)',
                    }}
                  >
                    {filteredCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleGuess(card)}
                        className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-cyan-900/30 transition-colors text-left border-b border-slate-700/30 last:border-b-0 touch-manipulation active:scale-95"
                      >
                        <img
                          src={getCardImageUrl(card)}
                          alt={card.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-slate-800/50"
                        />
                        <div>
                          <div className="font-semibold text-white text-sm">{getCardNameTranslated(card.id)}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400">{card.type} • {card.rarity}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous Guesses */}
          {guesses.length > 0 && !gameOver && (
            <div className="max-w-lg mx-auto mb-4 sm:mb-6 px-1">
              <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                <div className="flex-1 h-px bg-slate-600/40" />
                <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.1em] sm:tracking-[0.15em] text-slate-400 whitespace-nowrap">Previous Guesses</span>
                <div className="flex-1 h-px bg-slate-600/40" />
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 xs:gap-2">
                {guesses.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 rounded-md sm:rounded-lg transition-all"
                    style={{
                      background: card.id === targetCard?.id 
                        ? 'linear-gradient(180deg, rgba(20, 60, 30, 0.9) 0%, rgba(15, 45, 25, 0.95) 100%)'
                        : 'linear-gradient(180deg, rgba(60, 25, 25, 0.9) 0%, rgba(45, 20, 20, 0.95) 100%)',
                      border: card.id === targetCard?.id 
                        ? '1px solid rgba(74, 222, 128, 0.5)' 
                        : '1px solid rgba(248, 113, 113, 0.4)',
                    }}
                  >
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                    />
                    <span className={`text-xs sm:text-sm font-medium ${
                      card.id === targetCard?.id ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {getCardNameTranslated(card.id)}
                    </span>
                    {card.id === targetCard?.id 
                      ? <Check className="w-3.5 h-3.5 text-green-400" />
                      : <X className="w-3.5 h-3.5 text-red-400" />
                    }
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Game Over Modal */}
          {gameOver && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
              <div 
                className="rounded-xl xs:rounded-2xl sm:rounded-3xl max-w-sm xs:max-w-md w-full overflow-hidden relative mx-2"
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 15, 8, 0.98) 0%, rgba(35, 25, 12, 0.99) 50%, rgba(20, 15, 8, 0.98) 100%)',
                  border: '2px solid rgba(245, 180, 50, 0.7)',
                  boxShadow: '0 0 40px rgba(245, 180, 50, 0.3), 0 0 80px rgba(245, 158, 11, 0.15)'
                }}
              >
                {/* Decorative inner border */}
                <div className="absolute inset-1 rounded-lg xs:rounded-xl border border-amber-500/30 pointer-events-none" />
                
                {/* Corner decorations - tablet and desktop only */}
                <div className="hidden sm:block absolute top-2 sm:top-3 left-2 sm:left-3 w-8 sm:w-12 h-8 sm:h-12 border-l-2 sm:border-l-4 border-t-2 sm:border-t-4 border-amber-400/60 rounded-tl-lg" />
                <div className="hidden sm:block absolute top-2 sm:top-3 right-2 sm:right-3 w-8 sm:w-12 h-8 sm:h-12 border-r-2 sm:border-r-4 border-t-2 sm:border-t-4 border-amber-400/60 rounded-tr-lg" />
                <div className="hidden sm:block absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-8 sm:w-12 h-8 sm:h-12 border-l-2 sm:border-l-4 border-b-2 sm:border-b-4 border-amber-400/60 rounded-bl-lg" />
                <div className="hidden sm:block absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-8 sm:w-12 h-8 sm:h-12 border-r-2 sm:border-r-4 border-b-2 sm:border-b-4 border-amber-400/60 rounded-br-lg" />

                <div className="relative z-10 p-4 xs:p-5 sm:p-6 md:p-8 text-center">
                  {/* Result Icon */}
                  <div className={`mb-3 sm:mb-4 ${won ? 'text-green-400' : 'text-red-400'}`}>
                    {won ? <Trophy className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto" /> : <XCircle className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto" />}
                  </div>

                  {/* Title */}
                  <div className="text-amber-400/80 text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1.5 sm:mb-2">
                    {won ? 'Congratulations!' : 'Game Over'}
                  </div>

                  {/* Card Name */}
                  <div 
                    className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 px-2"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {targetCard && getCardNameTranslated(targetCard.id)}
                  </div>

                  {/* Card Image */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <div 
                      className="w-20 h-20 xs:w-24 xs:h-24 sm:w-28 sm:h-28 rounded-lg sm:rounded-xl overflow-hidden p-1"
                      style={{
                        background: won 
                          ? 'linear-gradient(180deg, rgba(74, 222, 128, 0.3) 0%, rgba(34, 197, 94, 0.2) 100%)'
                          : 'linear-gradient(180deg, rgba(248, 113, 113, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)',
                        border: won ? '2px solid rgba(74, 222, 128, 0.5)' : '2px solid rgba(248, 113, 113, 0.5)',
                      }}
                    >
                      {targetCard && (
                        <img
                          src={getCardImageUrl(targetCard)}
                          alt={targetCard.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="flex items-center gap-2 xs:gap-3 my-3 sm:my-4 md:my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
                    <span className="text-amber-500/60 text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest whitespace-nowrap">
                      {dailyCompleted ? 'Daily Complete!' : 'Daily Challenge'}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
                  </div>

                  {/* Daily Streak Display */}
                  {dailyStreak && dailyStreak.currentStreak > 0 && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-amber-400">
                      <Flame className="w-5 h-5" />
                      <span className="font-bold">{dailyStreak.currentStreak} day streak</span>
                      {dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && (
                        <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>
                      )}
                    </div>
                  )}

                  {/* Next daily countdown */}
                  {dailyCompleted && (
                    <div className="mb-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Next daily in {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}</span>
                    </div>
                  )}

                  {/* Account Creation Reminder */}
                  {!user && (
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                        <UserPlus className="w-5 h-5" />
                        <span className="font-semibold">Save your progress!</span>
                      </div>
                      <p className="text-gray-400 text-sm text-center mb-3">
                        Create an account to save your stats and streaks
                      </p>
                      <a
                        href="/auth"
                        className="block w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-colors text-center text-sm"
                      >
                        Create Account
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* How to Play */}
          <div className="mt-6 sm:mt-8 md:mt-12 max-w-lg mx-auto text-center px-1">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-600/40" />
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-amber-400 whitespace-nowrap">How to Play</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-600/40" />
            </div>
            <div 
              className="text-[11px] xs:text-xs sm:text-sm text-slate-400 space-y-1.5 sm:space-y-2 rounded-lg sm:rounded-xl p-3 xs:p-4 sm:p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.6) 0%, rgba(15, 28, 50, 0.7) 100%)',
                border: '1px solid rgba(60, 90, 140, 0.3)',
              }}
            >
              <p><span className="text-cyan-400 font-bold">1.</span> A card image is hidden behind blur and zoom</p>
              <p><span className="text-cyan-400 font-bold">2.</span> Try to guess which Clash Royale card it is</p>
              <p><span className="text-cyan-400 font-bold">3.</span> With each wrong guess, the image gets clearer</p>
              <p><span className="text-cyan-400 font-bold">4.</span> You have {MAX_GUESSES} attempts to guess correctly!</p>
            </div>
          </div>
        </main>
      </div>

      {/* Fade In Animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
