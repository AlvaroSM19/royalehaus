'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { emojiRiddles } from '@/data/emoji-riddles';
import { ClashCard } from '@/types/card';
import { Home, Search, Sparkles, Trophy, HelpCircle, CheckCircle, XCircle, Clock, UserPlus, Flame } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { useAuth } from '@/lib/useAuth';

const MAX_GUESSES = 5;

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

const DAILY_STREAK_KEY = 'emoji-riddle-daily-streak';

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
  
  if (existing.lastPlayedDate === today) {
    return existing;
  }
  
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

function getTimeUntilReset(): string {
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
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Seeded random for daily challenge
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyCard(): ClashCard {
  const cardsWithEmojis = baseCards.filter(card => emojiRiddles[card.id]);
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split('-').reduce((acc, part) => acc + parseInt(part), 0) * 7919;
  const index = Math.floor(seededRandom(seed) * cardsWithEmojis.length);
  return cardsWithEmojis[index];
}

// Emojis that are considered "abstract" or attribute-based (not physical descriptors)
const ABSTRACT_EMOJIS = new Set([
  // Elemental/Effects
  '⚡', '🔥', '💨', '❄️', '🧊', '💥', '✨', '🌪️', '☁️', '🌊', '💎', '🔮', '🧪', '💢',
  // Numbers
  '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣',
  // Attributes
  '💪', '🏃', '💀', '👻', '🛡️', '⚔️', '🎯', '🔫', '🪓', '🗡️', '🔱',
  // Actions/States
  '🔄', '💊', '⏸️', '📈', '➡️',
  // Colors/Abstract
  '💙', '💜', '💚', '💖', '🟢', '🟣', '🟤', '🔵', '🟠', '🌑',
]);

// Emojis that directly describe physical appearance (key emojis - too obvious)
const KEY_EMOJIS = new Set([
  // Animals/Creatures (very descriptive)
  '🐷', '🐉', '🦇', '🐶', '🐦', '🐏', '🦅',
  // Character types
  '🧙‍♂️', '🧙‍♀️', '🧔', '👩', '👨', '👸', '🤖', '👺', '👿', '🦹‍♀️', '👼', '💂',
  '🏇', '👑', '👶', '🧊', '🎣',
  // Objects that define the card
  '🎈', '💣', '🛢️', '🛒', '🪵', '⚰️', '🏰', '⛏️',
]);

/**
 * Reorders emojis to make the riddle harder:
 * 1. Key/obvious emojis go to the end (positions 3+)
 * 2. Abstract/attribute emojis go first
 * 3. The most obvious emoji (usually position 0) is moved to last
 */
function reorderEmojisForDifficulty(emojis: string[]): string[] {
  if (emojis.length <= 2) return emojis;
  
  // Categorize emojis
  const keyEmojis: string[] = [];
  const abstractEmojis: string[] = [];
  const neutralEmojis: string[] = [];
  
  emojis.forEach((emoji, index) => {
    // First emoji is almost always the most obvious - treat as key
    if (index === 0 || KEY_EMOJIS.has(emoji)) {
      keyEmojis.push(emoji);
    } else if (ABSTRACT_EMOJIS.has(emoji)) {
      abstractEmojis.push(emoji);
    } else {
      neutralEmojis.push(emoji);
    }
  });
  
  // Shuffle within categories for variety
  const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
  
  // Build new order: abstract first, then neutral, then key emojis last
  const reordered = [
    ...shuffle(abstractEmojis),
    ...shuffle(neutralEmojis),
    ...shuffle(keyEmojis),
  ];
  
  // Ensure we have all emojis (fallback if categorization missed some)
  if (reordered.length !== emojis.length) {
    return emojis; // Fallback to original order
  }
  
  return reordered;
}

export default function EmojiRiddlePage() {
  // This is now a daily-only game
  
  const { user } = useAuth();
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [emojis, setEmojis] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(1); // Start with 1 emoji revealed
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showBonusHint, setShowBonusHint] = useState(false);
  
  // Daily mode state
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyResult, setDailyResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null);
  const [countdown, setCountdown] = useState('');

  // Check daily completion status
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastDaily = localStorage.getItem('emoji-riddle-last-daily');
    const lastDailyResultStr = localStorage.getItem('emoji-riddle-daily-result');
    
    if (lastDaily === today && lastDailyResultStr) {
      try {
        const result = JSON.parse(lastDailyResultStr) as DailyResult;
        setDailyCompleted(true);
        setDailyResult(result);
        setDailyStreak(getDailyStreakData());
        
        // Load the daily card for display
        const dailyCard = getDailyCard();
        const originalEmojis = emojiRiddles[dailyCard.id] || [];
        setTargetCard(dailyCard);
        setEmojis(originalEmojis);
        setGameOver(true);
        setWon(result.won);
      } catch {}
    } else {
      setDailyCompleted(false);
      setDailyResult(null);
    }
    
    // Countdown timer
    const updateCountdown = () => setCountdown(getTimeUntilReset());
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const initGame = useCallback(() => {
    // For daily mode, only allow one attempt per day
    if (dailyCompleted) return;
    
    const cardToUse = getDailyCard();
    
    // Get original emojis and reorder for difficulty
    const originalEmojis = emojiRiddles[cardToUse.id] || [];
    const reorderedEmojis = reorderEmojisForDifficulty(originalEmojis);
    
    setTargetCard(cardToUse);
    setEmojis(reorderedEmojis);
    setRevealedCount(1);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowAnswer(false);
    setShowBonusHint(false);
  }, [dailyCompleted]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const guessedCardIds = useMemo(() => new Set(guesses.map(g => g.id)), [guesses]);

  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return baseCards
      .filter(card => !guessedCardIds.has(card.id))
      .filter(card => {
        const englishMatch = card.name.toLowerCase().includes(term);
        const translatedName = getCardNameTranslated(card.id);
        const translatedMatch = translatedName.toLowerCase().includes(term);
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
      setWon(true);
      setGameOver(true);
    } else {
      // Reveal one more emoji on wrong guess
      setRevealedCount(prev => Math.min(prev + 1, emojis.length));
      
      if (isLoss) {
        setGameOver(true);
      }
    }

    // Save daily result
    if (isWin || isLoss) {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('emoji-riddle-last-daily', today);
      localStorage.setItem('emoji-riddle-daily-result', JSON.stringify({
        won: isWin,
        guesses: newGuesses.length,
        cardId: targetCard.id
      }));
      setDailyCompleted(true);
      setDailyResult({ won: isWin, guesses: newGuesses.length, cardId: targetCard.id });
      const newStreak = updateDailyStreak();
      setDailyStreak(newStreak);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  const getCardImageUrl = (card: ClashCard) => {
    return `/images/cards/${card.id}.webp`;
  };

  // Can request bonus hint after 2 guesses, reveals one extra emoji
  const canRequestBonusHint = !gameOver && guesses.length >= 2 && !showBonusHint && revealedCount < emojis.length;
  
  const handleBonusHint = () => {
    if (canRequestBonusHint) {
      setShowBonusHint(true);
      setRevealedCount(prev => Math.min(prev + 1, emojis.length));
    }
  };

  const displayedEmojis = useMemo(() => {
    return emojis.map((emoji, index) => ({
      emoji,
      revealed: index < revealedCount || gameOver,
      isKeyEmoji: KEY_EMOJIS.has(emoji) || index === emojis.length - 1, // Last emoji is usually the key
    }));
  }, [emojis, revealedCount, gameOver]);

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Dark Overlay for wallpaper visibility */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-gray-900/90 border-b border-gray-700/50 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 xs:gap-2 text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <Home className="w-4 h-4 xs:w-5 xs:h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden sm:inline">Home</span>
          </Link>
          <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-amber-400 flex items-center gap-1.5 xs:gap-2">
            <span className="text-lg xs:text-xl sm:text-2xl">🔮</span>
            <span>Emoji Riddle</span>
            <span className="text-[10px] px-2 py-0.5 bg-pink-500/20 border border-pink-500/50 text-pink-400 rounded-full font-bold">
              DAILY
            </span>
          </h1>
          <div className="flex items-center gap-2">
            {dailyCompleted && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{countdown}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Stats Panel */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-8">
          <div className="flex items-center gap-1.5 xs:gap-2 text-amber-400 bg-slate-800/60 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg border border-amber-500/20">
            <span className="text-[10px] xs:text-xs text-amber-400/70 uppercase tracking-wide">Guesses</span>
            <span className="font-bold text-sm xs:text-base sm:text-lg">{guesses.length}/{MAX_GUESSES}</span>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 text-cyan-400 bg-slate-800/60 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg border border-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            <span className="text-[10px] xs:text-xs text-cyan-400/70 uppercase tracking-wide">Clues</span>
            <span className="font-bold text-sm xs:text-base sm:text-lg">{revealedCount}/{emojis.length}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
        {/* Emoji Display */}
        <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          <div 
            className="flex flex-wrap justify-center gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8 rounded-xl xs:rounded-2xl border-2 border-amber-500/30 shadow-2xl w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] md:max-w-lg"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
            }}
          >
            {displayedEmojis.map((item, index) => (
              <div
                key={index}
                className={`
                  w-11 h-11 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24
                  flex items-center justify-center
                  rounded-lg xs:rounded-xl
                  text-xl xs:text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
                  transition-all duration-500
                  ${item.revealed 
                    ? item.isKeyEmoji 
                      ? 'bg-amber-900/40 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                      : 'bg-cyan-900/40 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-800/60 border-2 border-slate-600/50'
                  }
                `}
              >
                {item.revealed ? (
                  <span className={`transform transition-all duration-300 hover:scale-110 ${
                    item.isKeyEmoji ? 'animate-pulse' : ''
                  }`}>
                    {item.emoji}
                  </span>
                ) : (
                  <span className="text-slate-500 text-lg xs:text-xl sm:text-2xl md:text-3xl">❓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Hint Button */}
        {canRequestBonusHint && (
          <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6">
            <button
              onClick={handleBonusHint}
              className="flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 hover:from-amber-500/30 hover:to-amber-600/30 transition-all text-amber-300 text-xs xs:text-sm font-semibold hover:scale-105"
            >
              <Sparkles className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              Reveal Extra Clue
            </button>
          </div>
        )}
        
        {showBonusHint && !gameOver && (
          <div className="text-center mb-4 xs:mb-5 sm:mb-6 text-amber-300 text-[10px] xs:text-xs font-medium bg-amber-900/20 border border-amber-500/20 rounded-md xs:rounded-lg py-1.5 xs:py-2 px-3 xs:px-4 max-w-[280px] xs:max-w-xs sm:max-w-md mx-auto animate-pulse flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> Bonus clue revealed!
          </div>
        )}

        {/* Game Over State */}
        {gameOver && (
          <div 
            className={`text-center mb-4 xs:mb-5 sm:mb-6 md:mb-8 p-3 xs:p-4 sm:p-5 md:p-6 rounded-xl xs:rounded-2xl border-2 w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md mx-auto relative overflow-hidden ${
              won 
                ? 'border-green-500/50' 
                : 'border-red-500/50'
            }`}
            style={{
              background: won 
                ? 'linear-gradient(145deg, rgba(22, 101, 52, 0.3) 0%, rgba(15, 28, 50, 0.95) 100%)'
                : 'linear-gradient(145deg, rgba(127, 29, 29, 0.3) 0%, rgba(15, 28, 50, 0.95) 100%)',
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            {/* Decorative corners */}
            <div className={`absolute top-1.5 xs:top-2 left-1.5 xs:left-2 w-3 h-3 xs:w-4 xs:h-4 border-l-2 border-t-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
            <div className={`absolute top-1.5 xs:top-2 right-1.5 xs:right-2 w-3 h-3 xs:w-4 xs:h-4 border-r-2 border-t-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
            <div className={`absolute bottom-1.5 xs:bottom-2 left-1.5 xs:left-2 w-3 h-3 xs:w-4 xs:h-4 border-l-2 border-b-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
            <div className={`absolute bottom-1.5 xs:bottom-2 right-1.5 xs:right-2 w-3 h-3 xs:w-4 xs:h-4 border-r-2 border-b-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>

            <div className={`mb-1.5 xs:mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won 
                ? <><CheckCircle className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 mx-auto mb-1" /><span className="text-xl xs:text-2xl sm:text-3xl font-bold">Correct!</span></>
                : <><XCircle className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 mx-auto mb-1" /><span className="text-xl xs:text-2xl sm:text-3xl font-bold">Game Over</span></>
              }
            </div>
            <div className="flex items-center justify-center gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
              {targetCard && (
                <>
                  <img
                    src={getCardImageUrl(targetCard)}
                    alt={targetCard.name}
                    className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 object-contain rounded-md xs:rounded-lg bg-slate-800/50 p-0.5 xs:p-1 border border-slate-600/50"
                  />
                  <div className="text-base xs:text-lg sm:text-xl font-bold text-white">
                    {getCardNameTranslated(targetCard.id)}
                  </div>
                </>
              )}
            </div>

            {/* Daily Streak Display */}
            {dailyStreak && dailyStreak.currentStreak > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2 text-amber-400">
                <Flame className="w-5 h-5" />
                <span className="font-bold">{dailyStreak.currentStreak} day streak</span>
                {dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && (
                  <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>
                )}
              </div>
            )}

            {/* Next daily countdown */}
            {dailyCompleted && (
              <div className="mt-2 flex items-center justify-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Next daily in {countdown}</span>
              </div>
            )}

            {/* Account Creation Reminder */}}
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
        )}

        {/* Search Input */}
        {!gameOver && (
          <div className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-4 xs:mb-5 sm:mb-6 md:mb-8">
            <div className="relative">
              <Search className="absolute left-3 xs:left-4 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-slate-400" />
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
                className="w-full pl-9 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-cyan-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm xs:text-base sm:text-lg"
                style={{
                  background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                }}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCards.length > 0 && (
                <div 
                  className="absolute z-50 w-full mt-1.5 xs:mt-2 border-2 border-cyan-700/50 rounded-lg xs:rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-60 xs:max-h-72 sm:max-h-80 overflow-y-auto"
                  style={{
                    background: 'linear-gradient(145deg, rgba(15, 35, 55, 0.98) 0%, rgba(10, 25, 40, 0.99) 100%)',
                  }}
                >
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleGuess(card)}
                      className="w-full flex items-center gap-2 xs:gap-3 px-2.5 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 hover:bg-cyan-900/40 transition-colors text-left border-b border-slate-700/30 last:border-b-0"
                    >
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 object-contain rounded-md xs:rounded-lg bg-slate-800/50 p-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white text-sm xs:text-base truncate">{getCardNameTranslated(card.id)}</div>
                        <div className="text-[10px] xs:text-xs text-slate-400">{card.type} • {card.rarity}</div>
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
          <div className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-4 xs:mb-5 sm:mb-6 md:mb-8">
            <h3 className="text-xs xs:text-sm font-bold text-slate-300 uppercase tracking-wide mb-2 xs:mb-3 text-center">
              Previous Guesses
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 xs:gap-2">
              {guesses.map((card, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-1.5 xs:gap-2 px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 rounded-md xs:rounded-lg border-2 transition-all ${
                    card.id === targetCard?.id
                      ? 'bg-green-900/30 border-green-500/50'
                      : 'bg-slate-800/60 border-red-500/30'
                  }`}
                >
                  <img
                    src={getCardImageUrl(card)}
                    alt={card.name}
                    className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 object-contain rounded"
                  />
                  <span className={`text-xs xs:text-sm font-medium truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none ${
                    card.id === targetCard?.id ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {getCardNameTranslated(card.id)}
                  </span>
                  <span className="text-xs xs:text-sm">
                    {card.id === targetCard?.id ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Play */}
        <div className="mt-6 xs:mt-8 sm:mt-10 md:mt-12 w-full max-w-[280px] xs:max-w-xs sm:max-w-md md:max-w-lg mx-auto text-center">
          <h3 className="text-sm xs:text-base sm:text-lg font-bold text-amber-400 mb-2 xs:mb-3 sm:mb-4 flex items-center justify-center gap-1.5 xs:gap-2">
            <HelpCircle className="w-4 h-4 xs:w-5 xs:h-5" />
            How to Play
          </h3>
          <div 
            className="text-xs xs:text-sm text-slate-300 space-y-1.5 xs:space-y-2 border-2 border-slate-700/50 rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-5 md:p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.6) 0%, rgba(15, 28, 50, 0.7) 100%)',
            }}
          >
            <p><span className="text-cyan-400 font-bold">1.</span> A sequence of emojis represents a Clash Royale card</p>
            <p><span className="text-cyan-400 font-bold">2.</span> Abstract clues appear first, key hints come later</p>
            <p><span className="text-cyan-400 font-bold">3.</span> Each wrong guess reveals another emoji clue</p>
            <p><span className="text-cyan-400 font-bold">4.</span> After 2 guesses, you can request a bonus hint!</p>
            <p><span className="text-cyan-400 font-bold">5.</span> You have {MAX_GUESSES} attempts to guess correctly!</p>
          </div>
        </div>
      </main>
      </div> {/* End content wrapper */}

      {/* Keyframes for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
