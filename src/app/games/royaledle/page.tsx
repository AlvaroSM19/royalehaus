'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard, CardType, CardRarity, AttackSpeed } from '@/types/card';
import { Home, RotateCcw, Search, Clock, Trophy, CheckCircle, UserPlus, Flame, Calendar } from 'lucide-react';
import { recordRoyaledleSession } from '@/lib/progress';
import { useLanguage } from '@/lib/useLanguage';
import { useAuth } from '@/lib/useAuth';
import { includesNormalized } from '@/lib/text-utils';
import {
  seededRandom, todayStr, getTimeUntilReset,
  getDayResult, saveDayResult, isDayCompleted,
  getDailyStreakData, updateDailyStreak,
  buildDayOptions,
  type DailyResult, type DailyStreakData, type DayOption,
} from '@/lib/daily-challenge';

const GAME_ID = 'royaledle';

type AttributeMatch = 'correct' | 'partial' | 'wrong';

type GuessResult = {
  card: ClashCard;
  matches: {
    name: AttributeMatch;
    elixir: AttributeMatch;
    type: AttributeMatch;
    rarity: AttributeMatch;
    year: AttributeMatch;
    evolution: AttributeMatch;
    attackType: AttributeMatch;
    targetAir: AttributeMatch;
    attackSpeed: AttributeMatch;
    heroMode: AttributeMatch;
  };
  hints: {
    elixir: 'higher' | 'lower' | 'equal';
    year: 'higher' | 'lower' | 'equal';
    attackSpeed: 'faster' | 'slower' | 'equal' | 'na';
  };
};

const MAX_GUESSES = 8;

// Daily target for any date (deterministic)
function getTargetForDate(date: string): ClashCard {
  const seed = date.split('-').reduce((acc, part) => acc + parseInt(part), 0) * 9973;
  const idx = Math.floor(seededRandom(seed) * baseCards.length);
  return baseCards[idx];
}

export default function RoyaledlePage() {
  const { getCardNameTranslated } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Daily system state
  const [activeDate, setActiveDate] = useState(todayStr());
  const [dayCompleted, setDayCompleted] = useState(false);
  const [dayResult, setDayResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const recordedRef = useRef(false);

  // Migrate old localStorage keys to new format (one-time)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const oldResult = localStorage.getItem('royaledle-daily-result');
      const oldDate = localStorage.getItem('royaledle-last-daily');
      if (oldResult && oldDate) {
        const parsed = JSON.parse(oldResult);
        const newKey = `${GAME_ID}-result-${oldDate}`;
        if (!localStorage.getItem(newKey)) {
          const migrated: DailyResult = {
            won: parsed.won,
            guesses: parsed.guesses,
            targetId: parsed.cardId,
            date: oldDate,
          };
          localStorage.setItem(newKey, JSON.stringify(migrated));
        }
        const oldStreak = localStorage.getItem('royaledle-daily-streak');
        const newStreakKey = `${GAME_ID}-daily-streak`;
        if (oldStreak && !localStorage.getItem(newStreakKey)) {
          localStorage.setItem(newStreakKey, oldStreak);
        }
        localStorage.removeItem('royaledle-daily-result');
        localStorage.removeItem('royaledle-last-daily');
        localStorage.removeItem('royaledle-daily-streak');
      }
    } catch { /* ignore migration errors */ }
  }, []);

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

  const initGame = useCallback(async (date: string) => {
    recordedRef.current = false;
    setActiveDate(date);

    // Check if already completed for this date
    const existing = getDayResult(GAME_ID, date);
    if (existing) {
      setDayCompleted(true);
      setDayResult(existing);
      setDailyStreak(getDailyStreakData(GAME_ID));
      const card = baseCards.find(c => c.id === Number(existing.targetId));
      if (card) {
        setTargetCard(card);
        setGameOver(true);
        setWon(existing.won);
        setGuesses([]);
        refreshDayOptions();
        return;
      }
    }

    // For today: try API first (cross-device sync)
    if (date === todayStr()) {
      let cardToUse: ClashCard | null = null;
      try {
        const response = await fetch('/api/daily?game=royaledle', { credentials: 'include' });
        if (response.ok) {
          const challenge = await response.json();
          if (challenge?.cardId) {
            cardToUse = baseCards.find(c => c.id === challenge.cardId) || null;
          }
          if (challenge?.participation?.completed && cardToUse) {
            const result: DailyResult = {
              won: challenge.participation.won,
              guesses: challenge.participation.attempts,
              targetId: cardToUse.id,
              date,
            };
            saveDayResult(GAME_ID, result);
            setDayCompleted(true);
            setDayResult(result);
            setDailyStreak(getDailyStreakData(GAME_ID));
            setTargetCard(cardToUse);
            setGameOver(true);
            setWon(challenge.participation.won);
            setGuesses([]);
            refreshDayOptions();
            return;
          }
        }
      } catch { /* API failed, use fallback */ }

      if (!cardToUse) {
        cardToUse = getTargetForDate(date);
      }
      setTargetCard(cardToUse);
    } else {
      // Past days — deterministic local only
      setTargetCard(getTargetForDate(date));
    }

    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setDayCompleted(false);
    setDayResult(null);
    refreshDayOptions();
  }, [refreshDayOptions]);

  useEffect(() => {
    initGame(todayStr());
  }, [initGame]);

  const switchDay = (date: string) => {
    setShowDayPicker(false);
    initGame(date);
  };

  const todayDone = typeof window !== 'undefined' ? isDayCompleted(GAME_ID, todayStr()) : false;

  const getYear = (dateString: string): number => {
    return new Date(dateString).getFullYear();
  };

  const compareCards = (guess: ClashCard, target: ClashCard): GuessResult => {
    const guessYear = getYear(guess.release_date);
    const targetYear = getYear(target.release_date);

    const baseTypes: CardType[] = ['Troop', 'Spell', 'Building'];
    const isGuessBaseType = baseTypes.includes(guess.type);
    const isTargetBaseType = baseTypes.includes(target.type);
    
    let typeMatch: AttributeMatch = 'wrong';
    if (guess.type === target.type) {
      typeMatch = 'correct';
    } else if (
      (isGuessBaseType && isTargetBaseType) || 
      (!isGuessBaseType && !isTargetBaseType)
    ) {
      typeMatch = 'partial';
    }

    const rarityOrder: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Champion', 'Heroic'];
    const guessRarityIdx = rarityOrder.indexOf(guess.rarity);
    const targetRarityIdx = rarityOrder.indexOf(target.rarity);
    let rarityMatch: AttributeMatch = 'wrong';
    if (guess.rarity === target.rarity) {
      rarityMatch = 'correct';
    } else if (Math.abs(guessRarityIdx - targetRarityIdx) === 1) {
      rarityMatch = 'partial';
    }

    let attackTypeMatch: AttributeMatch = 'wrong';
    if (guess.attackType === target.attackType) {
      attackTypeMatch = 'correct';
    }

    let targetAirMatch: AttributeMatch = 'wrong';
    if (guess.targetAir === target.targetAir) {
      targetAirMatch = 'correct';
    }

    const speedOrder: (AttackSpeed | null)[] = ['very-fast', 'fast', 'medium', 'slow', 'very-slow'];
    const guessSpeedIdx = guess.attackSpeed ? speedOrder.indexOf(guess.attackSpeed) : -1;
    const targetSpeedIdx = target.attackSpeed ? speedOrder.indexOf(target.attackSpeed) : -1;
    
    let attackSpeedMatch: AttributeMatch = 'wrong';
    let attackSpeedHint: 'faster' | 'slower' | 'equal' | 'na' = 'na';
    
    if (guess.attackSpeed === null && target.attackSpeed === null) {
      attackSpeedMatch = 'correct';
      attackSpeedHint = 'equal';
    } else if (guess.attackSpeed === null || target.attackSpeed === null) {
      attackSpeedMatch = 'wrong';
      attackSpeedHint = 'na';
    } else if (guess.attackSpeed === target.attackSpeed) {
      attackSpeedMatch = 'correct';
      attackSpeedHint = 'equal';
    } else if (Math.abs(guessSpeedIdx - targetSpeedIdx) === 1) {
      attackSpeedMatch = 'partial';
      attackSpeedHint = guessSpeedIdx > targetSpeedIdx ? 'faster' : 'slower';
    } else {
      attackSpeedHint = guessSpeedIdx > targetSpeedIdx ? 'faster' : 'slower';
    }

    const heroModeMatch: AttributeMatch = guess.hasHeroMode === target.hasHeroMode ? 'correct' : 'wrong';

    return {
      card: guess,
      matches: {
        name: guess.name === target.name ? 'correct' : 'wrong',
        elixir: guess.elixir === target.elixir ? 'correct' : Math.abs(guess.elixir - target.elixir) === 1 ? 'partial' : 'wrong',
        type: typeMatch,
        rarity: rarityMatch,
        year: guessYear === targetYear ? 'correct' : Math.abs(guessYear - targetYear) <= 1 ? 'partial' : 'wrong',
        evolution: guess.evolution_available === target.evolution_available ? 'correct' : 'wrong',
        attackType: attackTypeMatch,
        targetAir: targetAirMatch,
        attackSpeed: attackSpeedMatch,
        heroMode: heroModeMatch,
      },
      hints: {
        elixir: guess.elixir === target.elixir ? 'equal' : guess.elixir > target.elixir ? 'lower' : 'higher',
        year: guessYear === targetYear ? 'equal' : guessYear > targetYear ? 'lower' : 'higher',
        attackSpeed: attackSpeedHint,
      },
    };
  };

  const handleGuess = (card: ClashCard) => {
    if (gameOver || !targetCard || (dayCompleted && !isAdmin)) return;
    if (guesses.some(g => g.card.id === card.id)) return;

    const result = compareCards(card, targetCard);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    const isWin = result.matches.name === 'correct';
    
    if (isWin || newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      setWon(isWin);

      if (!recordedRef.current) {
        recordedRef.current = true;
        recordRoyaledleSession(newGuesses.length, isWin);
      }

      const dailyResultData: DailyResult = {
        won: isWin,
        guesses: newGuesses.length,
        targetId: targetCard.id,
        date: activeDate,
      };

      saveDayResult(GAME_ID, dailyResultData);
      setDayResult(dailyResultData);
      setDayCompleted(true);

      if (activeDate === todayStr()) {
        setDailyStreak(updateDailyStreak(GAME_ID));

        // Save to database if user is logged in (today only)
        if (user) {
          fetch('/api/daily', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              gameType: 'royaledle',
              won: isWin,
              attempts: newGuesses.length,
            }),
          }).catch(err => console.error('Failed to save to database:', err));
        }
      }

      refreshDayOptions();
    }
  };

  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return baseCards
      .filter(card =>
        includesNormalized(getCardNameTranslated(card.id), searchTerm) &&
        !guesses.some(g => g.card.id === card.id)
      )
      .slice(0, 8);
  }, [searchTerm, guesses, getCardNameTranslated]);

  const getMatchClass = (match: AttributeMatch) => {
    switch (match) {
      case 'correct': return 'bg-green-600 border-green-500';
      case 'partial': return 'bg-yellow-600 border-yellow-500';
      default: return 'bg-red-600/80 border-red-500';
    }
  };

  const getArrow = (hint: 'higher' | 'lower' | 'equal') => {
    if (hint === 'higher') return '↑';
    if (hint === 'lower') return '↓';
    return '';
  };

  const getSpeedArrow = (hint: 'faster' | 'slower' | 'equal' | 'na') => {
    if (hint === 'faster') return '↑';
    if (hint === 'slower') return '↓';
    return '';
  };

  const formatAttackType = (type: string | null) => {
    if (type === null) return 'N/A';
    return type === 'melee' ? 'Melee' : 'Ranged';
  };

  const formatAttackSpeed = (speed: string | null) => {
    if (speed === null) return 'N/A';
    const labels: Record<string, string> = {
      'very-fast': 'V.Fast',
      'fast': 'Fast',
      'medium': 'Med',
      'slow': 'Slow',
      'very-slow': 'V.Slow'
    };
    return labels[speed] || speed;
  };

  return (
    <div className="min-h-screen relative">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Banner */}
        <div className="bg-gray-900/90 border-b border-gray-700/50">
          <div className="container mx-auto px-4 py-3">
            {/* Mobile Header */}
            <div className="flex flex-col gap-3 sm:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                    <Home className="w-4 h-4" />
                  </Link>
                  <span className="text-gray-600">/</span>
                  <h1 className="text-lg font-black text-yellow-400 tracking-wide flex items-center gap-2">
                    ROYALEDLE
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full font-bold">
                      DAILY
                    </span>
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  {todayDone && (
                    <button onClick={() => setShowDayPicker(s => !s)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition text-xs">
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-gray-400 text-sm">
                    <span className="text-white font-bold">{guesses.length}</span>/{MAX_GUESSES}
                  </span>
                </div>
              </div>
              {dayCompleted && (
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next in {countdown}</span>
                </div>
              )}
            </div>
            
            {/* Desktop Header */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <span className="text-gray-600">/</span>
                <h1 className="text-xl font-black text-yellow-400 tracking-wide flex items-center gap-2">
                  ROYALEDLE
                  <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full font-bold">
                    DAILY
                  </span>
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                {todayDone && (
                  <button onClick={() => setShowDayPicker(s => !s)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition text-xs">
                    <Calendar className="w-3.5 h-3.5" /><span>Days</span>
                  </button>
                )}
                <span className="text-gray-400 text-sm">
                  ATTEMPTS: <span className="text-white font-bold">{guesses.length}</span>/{MAX_GUESSES}
                </span>
                {dayCompleted && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Next in {countdown}</span>
                  </div>
                )}
              </div>
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

        {/* Playing past day banner */}
        {activeDate !== todayStr() && (
          <div className="container mx-auto px-4 pt-4">
            <div className="mb-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
              <Calendar className="w-4 h-4" />
              <span>Playing: <strong>{dayOptions.find(o => o.date === activeDate)?.label || activeDate}</strong></span>
              <button onClick={() => switchDay(todayStr())} className="ml-3 px-2 py-0.5 rounded bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs hover:bg-amber-600/40 transition">← Today</button>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-400">Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-yellow-400">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-400">No Match</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="container mx-auto px-4 pb-8">
          {/* Completed Banner */}
          {dayCompleted && dayResult && targetCard && (
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
                    {activeDate === todayStr() ? 'Daily Completed!' : 'Challenge Completed!'}
                  </h3>
                </div>
                
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img
                    src={`/images/cards/${targetCard.id}.webp`}
                    alt={getCardNameTranslated(targetCard.id)}
                    className="w-16 h-20 object-contain rounded-lg border-2 border-green-500/50"
                  />
                  <div className="text-left">
                    <div className="text-white font-bold text-lg">{getCardNameTranslated(targetCard.id)}</div>
                    <div className={`text-sm ${dayResult.won ? 'text-green-300/80' : 'text-red-300/80'}`}>
                      {dayResult.won ? (
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          Solved in {dayResult.guesses} attempt{dayResult.guesses !== 1 ? 's' : ''}!
                        </span>
                      ) : (
                        <span>Better luck next time!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Streak */}
                {dailyStreak && dailyStreak.currentStreak > 0 && activeDate === todayStr() && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-amber-400">
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">{dailyStreak.currentStreak} day streak</span>
                    {dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && (
                      <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>
                    )}
                  </div>
                )}
                
                {/* Countdown to next daily */}
                {activeDate === todayStr() && !isAdmin && (
                  <div className="mt-3 bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-1">
                      <Clock className="w-4 h-4" />
                      <span>Next daily in {countdown}</span>
                    </div>
                  </div>
                )}

                {/* Admin Play Again */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      const card = getRandomCard();
                      setTargetCard(card);
                      setGuesses([]);
                      setSearchTerm('');
                      setGameOver(false);
                      setWon(false);
                      setDayCompleted(false);
                      setDayResult(null);
                    }}
                    className="mt-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg border-2 border-purple-400/50 flex items-center gap-2 mx-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Play Again (Admin)
                  </button>
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
          )}

          {/* Search Input */}
          {!gameOver && (
            <div className="relative mb-8 max-w-3xl mx-auto">
              {/* Scroll hint for mobile */}
              <div className="block sm:hidden text-center mb-1 select-none pointer-events-none">
                <span className="inline-block bg-slate-900/80 text-cyan-300 text-xs px-3 py-1 rounded-full shadow-md animate-pulse">Desliza para ver sugerencias →</span>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
                      e.preventDefault();
                      handleGuess(filteredCards[0]);
                    }
                  }}
                  placeholder="Type at least 2 letters..."
                  className="w-full pl-12 pr-4 py-4 bg-[#0d3b4c]/90 border-2 border-cyan-700/50 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors text-lg"
                />
                {/* Suggestions Dropdown */}
                {showSuggestions && searchTerm.length >= 2 && filteredCards.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a2530] border border-cyan-700/50 rounded-xl overflow-x-auto overflow-y-hidden sm:overflow-y-auto z-50 max-h-64 flex sm:block">
                    {filteredCards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => handleGuess(card)}
                        className="flex-shrink-0 w-full sm:w-auto px-4 py-3 text-left hover:bg-cyan-900/50 transition-colors flex items-center gap-4 border-b border-cyan-800/30 last:border-0"
                      >
                        <img 
                          src={`/images/cards/${card.id}.webp`}
                          alt={getCardNameTranslated(card.id)}
                          className="w-10 h-12 object-cover rounded"
                        />
                        <span className="text-white font-medium text-lg">{getCardNameTranslated(card.id)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guesses */}
          <div className="space-y-3 max-w-6xl mx-auto">
            {guesses.length > 0 && (
              <p className="text-center text-gray-400 text-xs sm:hidden pb-1">
                ← Desliza para ver todas las columnas →
              </p>
            )}
            <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
              {/* Header Row */}
              {guesses.length > 0 && (
                <div className="hidden sm:flex items-center gap-1 px-3 text-xs text-gray-200 uppercase tracking-wider font-bold min-w-[680px]">
                  <div className="w-12 flex-shrink-0"></div>
                  <div className="flex-1 text-center">Type</div>
                  <div className="flex-1 text-center">Rarity</div>
                  <div className="flex-1 text-center">Elixir</div>
                  <div className="flex-1 text-center">Year</div>
                  <div className="flex-1 text-center">Evo</div>
                  <div className="flex-1 text-center">Attack</div>
                  <div className="flex-1 text-center">Air</div>
                  <div className="flex-1 text-center">Speed</div>
                  <div className="flex-1 text-center">Hero</div>
                </div>
              )}
              <div className="space-y-3 min-w-[680px]">
              {guesses.map((guess, guessIndex) => (
                <div 
                  key={guessIndex} 
                  className="bg-[#0d3b4c]/80 backdrop-blur-sm rounded-xl p-2 border border-cyan-800/30"
                >
                <div className="flex items-center gap-1">
                  <div 
                    className="flex-shrink-0 w-12 h-[58px] rounded-lg overflow-hidden border-2 border-cyan-700/50"
                    style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '0ms' }}
                  >
                    <img 
                      src={`/images/cards/${guess.card.id}.webp`}
                      alt={getCardNameTranslated(guess.card.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.type)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '50ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Type</div>
                    <div className="text-white font-bold text-xs truncate">{guess.card.type}</div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.rarity)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '100ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Rarity</div>
                    <div className="text-white font-bold text-xs truncate">{guess.card.rarity}</div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.elixir)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '150ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Elixir</div>
                    <div className="text-white font-bold text-xs flex items-center justify-center gap-0.5">{guess.card.elixir}<img src="/images/elixir.webp" alt="Clash Royale Elixir Cost" className="w-3 h-3" /><span className="text-white/70">{getArrow(guess.hints.elixir)}</span></div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.year)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '200ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Year</div>
                    <div className="text-white font-bold text-xs flex items-center justify-center gap-0.5">{getYear(guess.card.release_date)}<span className="text-white/70">{getArrow(guess.hints.year)}</span></div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.evolution)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '250ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Evo</div>
                    <div className="text-white font-bold text-xs">{guess.card.evolution_available ? '✓' : '✗'}</div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.attackType)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '300ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Attack</div>
                    <div className="text-white font-bold text-xs truncate">{formatAttackType(guess.card.attackType)}</div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.targetAir)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '350ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Air</div>
                    <div className="text-white font-bold text-xs">{guess.card.targetAir === null ? 'N/A' : guess.card.targetAir ? '✓' : '✗'}</div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.attackSpeed)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '400ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Speed</div>
                    <div className="text-white font-bold text-xs flex items-center justify-center gap-0.5">{formatAttackSpeed(guess.card.attackSpeed)}<span className="text-white/70">{getSpeedArrow(guess.hints.attackSpeed)}</span></div>
                  </div>
                  <div className={`flex-1 ${getMatchClass(guess.matches.heroMode)} border-2 rounded-lg p-2 text-center min-w-0`} style={{ animation: `slideInLeft 0.3s ease-out forwards`, animationDelay: '450ms', opacity: 0 }}>
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Hero</div>
                    <div className="text-white font-bold text-xs">{guess.card.hasHeroMode ? '✓' : '✗'}</div>
                  </div>
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>

          {/* Game Over */}
          {gameOver && targetCard && (
            <div className={`max-w-md mx-auto mt-8 rounded-xl p-6 text-center ${won ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'}`}>
              {won ? (
                <>
                  <h2 className="text-2xl font-bold text-green-400 mb-2">Victory!</h2>
                  <p className="text-gray-300">
                    The card was <span className="text-yellow-400 font-bold">{getCardNameTranslated(targetCard.id)}</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Game Over</h2>
                  <p className="text-gray-300 mb-3">
                    The card was <span className="text-yellow-400 font-bold">{getCardNameTranslated(targetCard.id)}</span>
                  </p>
                  <div className="flex items-center justify-center">
                    <img 
                      src={`/images/cards/${targetCard.id}.webp`}
                      alt={getCardNameTranslated(targetCard.id)}
                      className="w-20 h-24 object-cover rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* Admin Play Again (in game over box too) */}
              {dayCompleted && isAdmin && (
                <button
                  onClick={() => {
                    const card = getRandomCard();
                    setTargetCard(card);
                    setGuesses([]);
                    setSearchTerm('');
                    setGameOver(false);
                    setWon(false);
                    setDayCompleted(false);
                    setDayResult(null);
                  }}
                  className="mt-4 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg border-2 border-purple-400/50 flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again (Admin)
                </button>
              )}

              {/* Next daily countdown */}
              {dayCompleted && !isAdmin && activeDate === todayStr() && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Next daily in {countdown}</span>
                </div>
              )}

              {/* Daily Streak Display */}
              {dailyStreak && dailyStreak.currentStreak > 0 && activeDate === todayStr() && (
                <div className="mt-4 flex items-center justify-center gap-2 text-amber-400">
                  <Flame className="w-5 h-5" />
                  <span className="font-bold">{dailyStreak.currentStreak} day streak</span>
                  {dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && (
                    <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>
                  )}
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
                    Create an account to save your stats and compete on leaderboards
                  </p>
                  <a
                    href="/auth"
                    className="block w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-400 transition-colors text-center"
                  >
                    Create Account
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Remaining Guesses */}
          {!gameOver && (
            <div className="text-center text-gray-400 mt-6">
              {MAX_GUESSES - guesses.length} guesses remaining
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
