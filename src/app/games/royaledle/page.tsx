'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { getDailyCard, getRandomPracticeCard } from '@/lib/shuffle-bag';
import { ClashCard, RARITY_COLORS, CardType, CardRarity, AttackType, AttackSpeed } from '@/types/card';
import { Home, RotateCcw, Search, Calendar, Shuffle, Clock, Trophy, CheckCircle, UserPlus, Flame } from 'lucide-react';
import { recordRoyaledleSession } from '@/lib/progress';
import { useLanguage } from '@/lib/useLanguage';
import { useAuth } from '@/lib/useAuth';
import { includesNormalized } from '@/lib/text-utils';

type GameMode = 'daily' | 'practice';

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

interface DailyResult {
  won: boolean;
  guesses: number;
  cardId: number;
}

interface DailyStreakData {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
  history: string[]; // dates when completed
}

const DAILY_STREAK_KEY = 'royaledle-daily-streak';

// Get daily streak data
function getDailyStreakData(): DailyStreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, bestStreak: 0, lastPlayedDate: '', history: [] };
  }
  try {
    const stored = localStorage.getItem(DAILY_STREAK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return { currentStreak: 0, bestStreak: 0, lastPlayedDate: '', history: [] };
}

// Update daily streak
function updateDailyStreak(): DailyStreakData {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  const data = getDailyStreakData();
  
  // Already played today
  if (data.lastPlayedDate === today) {
    return data;
  }
  
  // Played yesterday - continue streak
  if (data.lastPlayedDate === yesterday) {
    data.currentStreak += 1;
  } else {
    // Streak broken - reset to 1
    data.currentStreak = 1;
  }
  
  // Update best streak
  if (data.currentStreak > data.bestStreak) {
    data.bestStreak = data.currentStreak;
  }
  
  data.lastPlayedDate = today;
  if (!data.history.includes(today)) {
    data.history.push(today);
    // Keep only last 365 days
    if (data.history.length > 365) {
      data.history = data.history.slice(-365);
    }
  }
  
  localStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(data));
  return data;
}

// Calculate time until next daily reset (midnight UTC)
function getTimeUntilReset(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

export default function RoyaledlePage() {
  const { getCardNameTranslated } = useLanguage();
  const { user } = useAuth();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null);
  const [countdown, setCountdown] = useState(getTimeUntilReset());
  const [dailyStreak, setDailyStreak] = useState(getDailyStreakData());

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const initGame = useCallback(() => {
    // Check if already completed today
    const today = new Date().toISOString().split('T')[0];
    const lastDaily = localStorage.getItem('royaledle-last-daily');
    const lastDailyResultStr = localStorage.getItem('royaledle-daily-result');
    
    if (lastDaily === today && lastDailyResultStr) {
      try {
        const result = JSON.parse(lastDailyResultStr) as DailyResult;
        setDailyCompleted(true);
        setDailyResult(result);
        // Still set the target card so we can show it
        const card = getDailyCard();
        setTargetCard(card);
        setGameOver(true);
        setWon(result.won);
        return; // Don't reset the game state
      } catch (e) {
        // Invalid stored data, continue with new game
      }
    } else {
      setDailyCompleted(false);
      setDailyResult(null);
    }
    
    const card = getDailyCard();
    setTargetCard(card);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

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

    // Attack Type comparison
    let attackTypeMatch: AttributeMatch = 'wrong';
    if (guess.attackType === target.attackType) {
      attackTypeMatch = 'correct';
    } else if (guess.attackType === null || target.attackType === null) {
      attackTypeMatch = 'wrong';
    }

    // Target Air comparison
    let targetAirMatch: AttributeMatch = 'wrong';
    if (guess.targetAir === target.targetAir) {
      targetAirMatch = 'correct';
    } else if (guess.targetAir === null || target.targetAir === null) {
      targetAirMatch = 'wrong';
    }

    // Attack Speed comparison
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

    // Hero Mode comparison
    let heroModeMatch: AttributeMatch = guess.hasHeroMode === target.hasHeroMode ? 'correct' : 'wrong';

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
    if (gameOver || !targetCard) return;
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
      // Record session for XP
      recordRoyaledleSession(newGuesses.length, isWin);
      
      // Save daily result to prevent replaying
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('royaledle-last-daily', today);
      localStorage.setItem('royaledle-daily-result', JSON.stringify({
        won: isWin,
        guesses: newGuesses.length,
        cardId: targetCard?.id
      }));
      
      // Save to database if user is logged in
      if (user) {
        fetch('/api/daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            gameType: 'royaledle',
            guessedCardId: card.id,
            won: isWin,
          }),
        }).catch(err => console.error('Failed to save daily completion:', err));
      }
      
      // Update daily streak
      const newStreak = updateDailyStreak();
      setDailyStreak(newStreak);
      setDailyCompleted(true);
    }
  };

  const filteredCards = baseCards
    .filter(card => 
      includesNormalized(getCardNameTranslated(card.id), searchTerm) &&
      !guesses.some(g => g.card.id === card.id)
    )
    .slice(0, 8);

  const getMatchClass = (match: AttributeMatch) => {
    switch (match) {
      case 'correct':
        return 'bg-green-600 border-green-500';
      case 'partial':
        return 'bg-yellow-600 border-yellow-500';
      default:
        return 'bg-red-600/80 border-red-500';
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
            {/* Mobile Header - Stacked */}
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
                <span className="text-gray-400 text-sm">
                  <span className="text-white font-bold">{guesses.length}</span>/{MAX_GUESSES}
                </span>
              </div>
              {dailyCompleted && (
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Next in {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}</span>
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
                <span className="text-gray-400 text-sm">
                  ATTEMPTS: <span className="text-white font-bold">{guesses.length}</span>/{MAX_GUESSES}
                </span>
                {dailyCompleted && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Next in {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
                {/* Suggestions Dropdown - horizontal scroll on mobile */}
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
            {/* Scroll hint for mobile */}
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
                  {/* Card Image */}
                  <div 
                    className="flex-shrink-0 w-12 h-[58px] rounded-lg overflow-hidden border-2 border-cyan-700/50"
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '0ms'
                    }}
                  >
                    <img 
                      src={`/images/cards/${guess.card.id}.webp`}
                      alt={getCardNameTranslated(guess.card.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* ...existing code... */}
                  {/* All columns unchanged, just moved into min-w container for scroll */}
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

              {/* Next daily countdown */}
              {dailyCompleted && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Next daily in {countdown.hours.toString().padStart(2, '0')}:{countdown.minutes.toString().padStart(2, '0')}:{countdown.seconds.toString().padStart(2, '0')}</span>
                </div>
              )}

              {/* Daily Streak Display */}
              {dailyStreak && dailyStreak.currentStreak > 0 && (
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
