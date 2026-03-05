'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, Search, HelpCircle, CheckCircle, Clock, Flame, Calendar } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { recordPixelRoyaleSession } from '@/lib/progress';
import { includesNormalized } from '@/lib/text-utils';
import {
  seededRandom, todayStr, getTimeUntilReset,
  getDayResult, saveDayResult, isDayCompleted,
  getDailyStreakData, updateDailyStreak,
  buildDayOptions,
  type DailyResult, type DailyStreakData, type DayOption,
} from '@/lib/daily-challenge';

const GAME_ID = 'pixel-royale';
const MAX_GUESSES = 6;

// Blur and scale for each attempt step (index 0 = initial state before any guess)
const BLUR_STEPS  = [36, 32, 28, 24, 20, 16, 0];
const SCALE_STEPS = [1.95, 1.90, 1.85, 1.80, 1.75, 1.70, 1.0];

// Daily target for any date
function getTargetForDate(date: string): ClashCard {
  const seed = date.split('-').reduce((acc, part) => acc + parseInt(part), 0) * 31337;
  const idx = Math.floor(seededRandom(seed) * baseCards.length);
  return baseCards[idx];
}

export default function PixelRoyalePage() {
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
  const imgRef = useRef<HTMLImageElement>(null);

  // Daily system state
  const [activeDate, setActiveDate] = useState(todayStr());
  const [dayCompleted, setDayCompleted] = useState(false);
  const [dayResult, setDayResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const recordedRef = useRef(false);

  // Countdown timer
  useEffect(() => {
    const update = () => setCountdown(getTimeUntilReset());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshDayOptions = useCallback(() => {
    setDayOptions(buildDayOptions(GAME_ID, 8));
  }, []);

  const initGame = useCallback((date: string) => {
    setImageReady(false);
    setStep(0);
    setActiveDate(date);
    recordedRef.current = false;

    const card = getTargetForDate(date);
    setTargetCard(card);

    const existing = getDayResult(GAME_ID, date);
    if (existing) {
      setDayCompleted(true);
      setDayResult(existing);
      setDailyStreak(getDailyStreakData(GAME_ID));
      setGameOver(true);
      setWon(existing.won);
      setGuesses([]);
      setStep(MAX_GUESSES); // reveal fully
    } else {
      setDayCompleted(false);
      setDayResult(null);
      setGuesses([]);
      setSearchTerm('');
      setGameOver(false);
      setWon(false);
      setShowHint(false);
    }
    refreshDayOptions();
  }, [refreshDayOptions]);

  // When targetCard changes, wait for the image to load, then show it with blur
  useEffect(() => {
    if (!targetCard) return;
    const img = new Image();
    img.src = `/images/cards/${targetCard.id}.webp`;
    img.onload = () => {
      setImageReady(true);
    };
  }, [targetCard]);

  useEffect(() => {
    initGame(todayStr());
  }, [initGame]);

  const switchDay = (date: string) => {
    setShowDayPicker(false);
    initGame(date);
  };

  const todayDone = typeof window !== 'undefined' ? isDayCompleted(GAME_ID, todayStr()) : false;

  const guessedCardIds = useMemo(() => new Set(guesses.map(g => g.id)), [guesses]);

  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return baseCards
      .filter(card => !guessedCardIds.has(card.id))
      .filter(card => includesNormalized(getCardNameTranslated(card.id), searchTerm))
      .slice(0, 8);
  }, [searchTerm, guessedCardIds, getCardNameTranslated]);

  const handleGuess = (card: ClashCard) => {
    if (gameOver || !targetCard) return;

    const newGuesses = [...guesses, card];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    const correct = card.id === targetCard.id;

    if (correct) {
      setStep(MAX_GUESSES);
      setWon(true);
      setGameOver(true);

      const result: DailyResult = {
        won: true,
        guesses: newGuesses.length,
        targetId: targetCard.id,
        date: activeDate,
      };
      saveDayResult(GAME_ID, result);
      setDayResult(result);
      setDayCompleted(true);

      if (activeDate === todayStr()) {
        setDailyStreak(updateDailyStreak(GAME_ID));
      }
      refreshDayOptions();

      if (!recordedRef.current) {
        recordedRef.current = true;
        recordPixelRoyaleSession(newGuesses.length, true);
      }
    } else {
      setStep(newGuesses.length);

      if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        setTimeout(() => setStep(MAX_GUESSES), 800);

        const result: DailyResult = {
          won: false,
          guesses: newGuesses.length,
          targetId: targetCard.id,
          date: activeDate,
        };
        saveDayResult(GAME_ID, result);
        setDayResult(result);
        setDayCompleted(true);

        if (activeDate === todayStr()) {
          setDailyStreak(updateDailyStreak(GAME_ID));
        }
        refreshDayOptions();

        if (!recordedRef.current) {
          recordedRef.current = true;
          recordPixelRoyaleSession(newGuesses.length, false);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.webp`;

  // Progressive hints
  const getHints = (): string[] => {
    if (!targetCard) return [];
    const hints: string[] = [];
    const g = guesses.length;
    if (g >= 2) hints.push(`${targetCard.type} • ${targetCard.rarity}`);
    if (g >= 3) hints.push(`${targetCard.elixir} Elixir`);
    if (g >= 4) {
      const parts: string[] = [];
      if (targetCard.attackType) parts.push(targetCard.attackType === 'melee' ? 'Melee' : 'Ranged');
      if (targetCard.targetAir !== null) parts.push(targetCard.targetAir ? 'Targets Air' : 'Ground Only');
      if (parts.length) hints.push(parts.join(' • '));
    }
    if (g >= 5) {
      const parts: string[] = [];
      if (targetCard.attackSpeed) parts.push(`${targetCard.attackSpeed.replace('-', ' ')} speed`);
      if (targetCard.release_date) parts.push(`Released ${targetCard.release_date.slice(0, 4)}`);
      if (parts.length) hints.push(parts.join(' • '));
    }
    return hints;
  };

  const currentBlur = BLUR_STEPS[Math.min(step, BLUR_STEPS.length - 1)];
  const currentScale = SCALE_STEPS[Math.min(step, SCALE_STEPS.length - 1)];

  return (
    <div className="min-h-screen relative bg-[#0a0a0a]">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d1a24] via-[#0a1018] to-[#080808] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header Banner */}
        <div className="bg-gray-900/95 border-b border-amber-500/30 shadow-lg shadow-amber-900/20">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-gray-600">/</span>
              <h1 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide flex items-center gap-2">
                <span>🎨</span> PIXEL ROYALE
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full font-bold">DAILY</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {todayDone && (
                <button onClick={() => setShowDayPicker(s => !s)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition text-xs">
                  <Calendar className="w-3.5 h-3.5" /><span className="hidden sm:inline">Days</span>
                </button>
              )}
              {dayCompleted && (
                <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">{countdown}</span>
                </div>
              )}
              <span className="text-gray-400 text-sm">
                <span className="text-white font-bold">{guesses.length}</span>/{MAX_GUESSES}
              </span>
            </div>
          </div>
        </div>

        {/* Day picker */}
        {showDayPicker && todayDone && (
          <div className="sticky top-[57px] z-30 bg-gray-900/95 backdrop-blur border-b border-amber-700/40 shadow-lg shadow-black/40">
            <div className="container mx-auto px-2 sm:px-4 py-3">
              <div className="flex items-center gap-2 mb-2 text-xs text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-wide">Play past days</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map(opt => (
                  <button key={opt.date} onClick={() => switchDay(opt.date)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${opt.date === activeDate ? 'bg-amber-600/30 border-amber-500/60 text-amber-300 ring-1 ring-amber-400/40' : opt.completed ? 'bg-green-600/15 border-green-500/40 text-green-400 hover:bg-green-600/25' : 'bg-gray-600/15 border-gray-500/30 text-gray-300 hover:bg-gray-600/25'}`}>
                    <div>{opt.label}</div>
                    {opt.completed && <div className="text-[10px] text-green-400">✓ Done</div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Playing past day banner */}
          {activeDate !== todayStr() && (
            <div className="mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Playing: <strong>{dayOptions.find(o => o.date === activeDate)?.label || activeDate}</strong></span>
              <button onClick={() => switchDay(todayStr())} className="ml-3 px-2 py-0.5 rounded bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs hover:bg-amber-600/40 transition">← Today</button>
            </div>
          )}

          {/* Completed Banner */}
          {dayCompleted && dayResult && targetCard && (
            <div className="relative mb-6 p-6 rounded-2xl max-w-md mx-auto overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(20, 50, 40, 0.95) 0%, rgba(15, 40, 30, 0.98) 100%)',
                border: '2px solid rgba(34, 197, 94, 0.5)',
              }}
            >
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-green-400/60" />
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-green-400/60" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-green-400/60" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-green-400/60" />
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <h3 className="text-xl font-black text-green-400 uppercase tracking-wider">
                  {activeDate === todayStr() ? 'Daily Completed!' : 'Challenge Completed!'}
                </h3>
              </div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <img src={`/images/cards/${targetCard.id}.webp`} alt={targetCard.name} className="w-16 h-20 object-cover object-top rounded-lg border-2 border-green-500/50" />
                <div className="text-left">
                  <div className="text-white font-bold text-lg">{getCardNameTranslated(targetCard.id)}</div>
                  <div className={`text-sm ${dayResult.won ? 'text-green-300/80' : 'text-red-300/80'}`}>
                    {dayResult.won ? `🎉 Solved in ${dayResult.guesses} guess${dayResult.guesses !== 1 ? 'es' : ''}!` : 'Better luck next time!'}
                  </div>
                </div>
              </div>
              {dailyStreak && dailyStreak.currentStreak > 0 && activeDate === todayStr() && (
                <div className="mt-3 flex items-center justify-center gap-2 text-amber-400">
                  <Flame className="w-5 h-5" />
                  <span className="font-bold">{dailyStreak.currentStreak} day streak</span>
                  {dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && (
                    <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>
                  )}
                </div>
              )}
              {activeDate === todayStr() && (
                <div className="mt-2 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" /><span>Next in {countdown}</span>
                </div>
              )}
            </div>
          )}

          {/* Game Stats */}
          {!dayCompleted && (
            <div className="flex justify-center gap-3 sm:gap-8 mb-4 sm:mb-8">
              <div className="text-center px-3 sm:px-6 py-2 sm:py-3 bg-gray-900/80 border border-cyan-700/40 rounded-xl">
                <div className="text-lg sm:text-2xl font-black text-amber-400">{guesses.length}/{MAX_GUESSES}</div>
                <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Guesses</div>
              </div>
              <div className="text-center px-3 sm:px-6 py-2 sm:py-3 bg-gray-900/80 border border-cyan-700/40 rounded-xl">
                <div className="text-lg sm:text-2xl font-black text-cyan-400">{Math.round((step / MAX_GUESSES) * 100)}%</div>
                <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide">Clarity</div>
              </div>
            </div>
          )}

          {/* Blurred Image Container */}
          <div className="flex justify-center mb-4 sm:mb-8">
            <div className="relative">
              <div
                className={`
                  w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72
                  rounded-2xl overflow-hidden
                  border-4 ${gameOver ? (won ? 'border-green-500' : 'border-red-500') : 'border-amber-500/50'}
                  shadow-2xl ${gameOver ? (won ? 'shadow-green-500/30' : 'shadow-red-500/30') : 'shadow-amber-500/20'}
                  bg-[#0d3b4c]/50
                  relative
                `}
              >
                {targetCard && (
                  <img
                    ref={imgRef}
                    src={getCardImageUrl(targetCard)}
                    alt="Mystery Clash Royale Card"
                    className="w-full h-full object-contain p-4 absolute inset-0 transition-all duration-700 ease-out"
                    style={{
                      filter: imageReady ? `blur(${currentBlur}px)` : 'blur(60px)',
                      transform: imageReady ? `scale(${currentScale})` : 'scale(4)',
                      opacity: imageReady ? 1 : 0,
                    }}
                  />
                )}
              </div>

              {/* Progress indicator dots */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < guesses.length
                        ? won && i === guesses.length - 1
                          ? 'bg-green-500 shadow-lg shadow-green-500/50'
                          : 'bg-amber-500 shadow-lg shadow-amber-500/50'
                        : 'bg-gray-700 border border-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Hint button */}
          {!gameOver && guesses.length >= 2 && (
            <div className="flex justify-center mb-6 mt-8">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-900/40 border border-cyan-600/40 hover:bg-cyan-900/60 transition-all text-cyan-300 text-sm font-semibold"
              >
                <HelpCircle className="w-4 h-4" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
          )}

          {showHint && !gameOver && (
            <div className="text-center mb-6 max-w-md mx-auto space-y-2">
              {getHints().length > 0 ? getHints().map((hint, i) => (
                <div key={i} className="text-amber-300 text-sm font-medium bg-amber-900/30 border border-amber-500/30 rounded-lg py-2 px-4 animate-fadeIn">
                  💡 {hint}
                </div>
              )) : (
                <div className="text-amber-300/60 text-sm italic bg-amber-900/20 border border-amber-500/20 rounded-lg py-2 px-4">
                  💡 Make more guesses to unlock hints...
                </div>
              )}
            </div>
          )}

          {/* Game Over State (non-daily banner) */}
          {gameOver && !dayCompleted && (
            <div className={`text-center mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl border max-w-md mx-auto ${
              won ? 'bg-green-900/30 border-green-500/40' : 'bg-red-900/30 border-red-500/40'
            }`}>
              <div className={`text-2xl sm:text-4xl mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
                {won ? '🎉 Correct!' : '😔 Game Over'}
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mb-2">
                {targetCard && getCardNameTranslated(targetCard.id)}
              </div>
              {won && (
                <div className="text-sm text-green-300/80">
                  Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
                </div>
              )}
            </div>
          )}

          {/* Search Input */}
          {!gameOver && (
            <div className="max-w-md mx-auto mb-6 sm:mb-8 mt-6 sm:mt-8">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
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
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl bg-[#0d3b4c]/90 border-2 border-cyan-700/50 text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 transition-all text-sm sm:text-lg"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredCards.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0a2530] border border-cyan-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-80 overflow-y-auto">
                    {filteredCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleGuess(card)}
                        className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-cyan-900/40 transition-colors text-left border-b border-cyan-800/30 last:border-b-0"
                      >
                        <img
                          src={getCardImageUrl(card)}
                          alt={card.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-lg bg-gray-800/50"
                        />
                        <div>
                          <div className="font-semibold text-white text-sm">{getCardNameTranslated(card.id)}</div>
                          <div className="text-[10px] sm:text-xs text-gray-400">{card.type} • {card.rarity}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Previous Guesses */}
          {guesses.length > 0 && (
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide mb-3 text-center">
                Previous Guesses
              </h3>
              <div className="space-y-2">
                {guesses.map((card, index) => {
                  const isCorrect = card.id === targetCard?.id;
                  const matches: string[] = [];
                  const misses: string[] = [];
                  if (targetCard && !isCorrect) {
                    if (card.type === targetCard.type) matches.push('Type'); else misses.push('Type');
                    if (card.rarity === targetCard.rarity) matches.push('Rarity'); else misses.push('Rarity');
                    if (card.elixir === targetCard.elixir) matches.push('Elixir'); else misses.push('Elixir');
                    if (card.attackType === targetCard.attackType && card.attackType) matches.push('Attack');
                  }
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                        isCorrect
                          ? 'bg-green-900/40 border-green-500/50'
                          : 'bg-gray-900/60 border-red-500/30'
                      }`}
                    >
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-10 h-10 object-contain rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium ${
                          isCorrect ? 'text-green-300' : 'text-red-300'
                        }`}>
                          {getCardNameTranslated(card.id)}
                        </span>
                        {!isCorrect && (matches.length > 0 || misses.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {matches.map(m => (
                              <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-green-800/60 text-green-300 border border-green-600/30">✓ {m}</span>
                            ))}
                            {misses.map(m => (
                              <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-red-800/40 text-red-400 border border-red-600/20">✗ {m}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-xs shrink-0">
                        {isCorrect ? '✅' : '❌'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* How to Play */}
          <div className="mt-8 sm:mt-12 max-w-lg mx-auto text-center">
            <h3 className="text-base sm:text-lg font-bold text-amber-400 mb-3 sm:mb-4">How to Play</h3>
            <div className="text-xs sm:text-sm text-gray-400 space-y-2 bg-gray-900/60 border border-gray-700/50 rounded-xl p-4 sm:p-6">
              <p>🔍 A card image is hidden behind blur and zoom</p>
              <p>🎯 Try to guess which Clash Royale card it is</p>
              <p>✨ With each wrong guess, the image gets clearer and less zoomed</p>
              <p>🏆 You have {MAX_GUESSES} attempts to guess correctly!</p>
              <p>📅 Complete today&apos;s challenge, then play the last 7 days!</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
