'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { emojiRiddles } from '@/data/emoji-riddles';
import { ClashCard } from '@/types/card';
import { Home, Search, Sparkles, Trophy, HelpCircle, CheckCircle, XCircle, Clock, UserPlus, Flame, Calendar } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { recordEmojiRiddleSession } from '@/lib/progress';
import { includesNormalized } from '@/lib/text-utils';
import {
  seededRandom, todayStr, getTimeUntilReset,
  getDayResult, saveDayResult, isDayCompleted,
  getDailyStreakData, updateDailyStreak,
  buildDayOptions,
  type DailyResult, type DailyStreakData, type DayOption,
} from '@/lib/daily-challenge';

const GAME_ID = 'emoji-riddle';
const MAX_GUESSES = 5;

interface GuessEntry {
  cardId: number;
  cardName: string;
  correct: boolean;
}

// Daily target for any date
function getTargetForDate(availableCardIds: number[], date: string): number {
  const seed = date.split('-').reduce((acc, part) => acc + parseInt(part), 0) * 7731; // Different multiplier
  return availableCardIds[Math.floor(seededRandom(seed) * availableCardIds.length)];
}

export default function EmojiRiddlePage() {
  const { getCardNameTranslated } = useLanguage();

  // Game state
  const [targetCardId, setTargetCardId] = useState<number | null>(null);
  const [targetEmojis, setTargetEmojis] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Daily system state
  const [activeDate, setActiveDate] = useState(todayStr());
  const [dayCompleted, setDayCompleted] = useState(false);
  const [dayResult, setDayResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const recordedRef = useRef(false);

  // Cards that have emoji riddles
  const availableCardIds = useMemo(() => Object.keys(emojiRiddles).map(Number), []);

  useEffect(() => {
    const updateCountdown = () => setCountdown(getTimeUntilReset());
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const refreshDayOptions = useCallback(() => {
    setDayOptions(buildDayOptions(GAME_ID, 8));
  }, []);

  const initGame = useCallback((date: string) => {
    if (availableCardIds.length === 0) return;

    const targetId = getTargetForDate(availableCardIds, date);
    setTargetCardId(targetId);
    setTargetEmojis(emojiRiddles[targetId] || []);
    setActiveDate(date);
    recordedRef.current = false;

    const existing = getDayResult(GAME_ID, date);
    if (existing) {
      setDayCompleted(true);
      setDayResult(existing);
      setDailyStreak(getDailyStreakData(GAME_ID));
      setGameOver(true);
      setWon(existing.won);
      setGuesses([]);
    } else {
      setDayCompleted(false);
      setDayResult(null);
      setGuesses([]);
      setSearchTerm('');
      setGameOver(false);
      setWon(false);
    }
    refreshDayOptions();
  }, [refreshDayOptions, availableCardIds]);

  useEffect(() => {
    initGame(todayStr());
  }, [initGame]);

  const switchDay = (date: string) => {
    setShowDayPicker(false);
    initGame(date);
  };

  const todayDone = typeof window !== 'undefined' ? isDayCompleted(GAME_ID, todayStr()) : false;

  const guessedCardIds = useMemo(() => new Set(guesses.map(g => g.cardId)), [guesses]);

  const getCardById = (id: number): ClashCard | undefined => {
    return baseCards.find(card => card.id === id);
  };

  const filteredCards = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return availableCardIds
      .map(id => getCardById(id))
      .filter((card): card is ClashCard => card !== undefined)
      .filter(card => !guessedCardIds.has(card.id))
      .filter(card => includesNormalized(getCardNameTranslated(card.id), term))
      .slice(0, 8);
  }, [searchTerm, availableCardIds, guessedCardIds, getCardNameTranslated]);

  const handleGuess = (card: ClashCard) => {
    if (gameOver || targetCardId === null) return;

    const correct = card.id === targetCardId;
    const newGuesses = [...guesses, {
      cardId: card.id,
      cardName: getCardNameTranslated(card.id),
      correct
    }];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    if (correct) {
      setWon(true);
      setGameOver(true);
      
      const dailyResult: DailyResult = {
        won: true,
        guesses: newGuesses.length,
        targetId: targetCardId.toString(),
        date: activeDate
      };

      saveDayResult(GAME_ID, dailyResult);
      setDayResult(dailyResult);
      setDayCompleted(true);

      if (activeDate === todayStr()) {
        setDailyStreak(updateDailyStreak(GAME_ID));
      }

      refreshDayOptions();

      if (!recordedRef.current) {
        recordedRef.current = true;
        recordEmojiRiddleSession(newGuesses.length, true);
      }
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      
      const dailyResult: DailyResult = {
        won: false,
        guesses: newGuesses.length,
        targetId: targetCardId.toString(),
        date: activeDate
      };

      saveDayResult(GAME_ID, dailyResult);
      setDayResult(dailyResult);
      setDayCompleted(true);

      if (activeDate === todayStr()) {
        setDailyStreak(updateDailyStreak(GAME_ID));
      }

      refreshDayOptions();

      if (!recordedRef.current) {
        recordedRef.current = true;
        recordEmojiRiddleSession(newGuesses.length, false);
      }
    }
  };

  const targetCard = targetCardId ? getCardById(targetCardId) : null;

  return (
    <div className="min-h-screen text-purple-100 flex flex-col relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A051A] via-[#1A0F2E] to-[#0A051A] opacity-90" />
      <div className="fixed inset-0 bg-[url('/images/wallpapers/clash-royale-arena.webp')] bg-cover bg-center opacity-10 pointer-events-none" />

      {/* Navigation */}
      <div className="relative z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 rounded-lg hover:bg-purple-300/10 text-purple-300 transition">
                <Home className="w-5 h-5" />
              </Link>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent drop-shadow flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Emoji Riddle
                <span className="text-[10px] px-2 py-0.5 bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-400 rounded-full font-bold ml-2">DAILY</span>
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 text-xs">
              {todayDone && (
                <button onClick={() => setShowDayPicker(s => !s)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition text-xs">
                  <Calendar className="w-3.5 h-3.5" /><span className="hidden sm:inline">Days</span>
                </button>
              )}
              {dayCompleted && <div className="flex items-center gap-1.5 text-purple-400 text-xs"><Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">{countdown}</span></div>}
              <button onClick={() => setShowHelp(s => !s)} className="p-1 rounded hover:bg-purple-300/10 text-lg">❓</button>
            </div>
          </div>
        </div>
      </div>

      {/* Day picker */}
      {showDayPicker && todayDone && (
        <div className="sticky top-[57px] z-30 bg-[#0c0520]/95 backdrop-blur border-b border-purple-700/40 shadow-lg shadow-black/40">
          <div className="container mx-auto px-2 sm:px-4 py-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-purple-400"><Calendar className="w-3.5 h-3.5" /><span className="font-bold uppercase tracking-wide">Play past days</span></div>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map(opt => (
                <button key={opt.date} onClick={() => switchDay(opt.date)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${opt.date === activeDate ? 'bg-fuchsia-600/30 border-fuchsia-500/60 text-fuchsia-300 ring-1 ring-fuchsia-400/40' : opt.completed ? 'bg-green-600/15 border-green-500/40 text-green-400 hover:bg-green-600/25' : 'bg-purple-600/15 border-purple-500/30 text-purple-300 hover:bg-purple-600/25'}`}>
                  <div>{opt.label}</div>
                  {opt.completed && <div className="text-[10px] text-green-400">✓ Done</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {activeDate !== todayStr() && (
          <div className="mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <Calendar className="w-4 h-4" /><span>Playing: <strong>{dayOptions.find(o => o.date === activeDate)?.label || activeDate}</strong></span>
            <button onClick={() => switchDay(todayStr())} className="ml-3 px-2 py-0.5 rounded bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs hover:bg-purple-600/40 transition">← Today</button>
          </div>
        )}

        {showHelp && (
          <div className="mb-6 p-4 rounded-lg bg-[#0c0520]/60 border border-purple-700/40 text-sm leading-relaxed shadow shadow-black/40">
            Guess the Clash Royale card from the emoji clues! Each emoji represents something about the card.
            <br /><br />
            <span className="text-yellow-400 font-bold">💡 Tips:</span> Look for clues about the card's appearance, abilities, or theme.
            <br /><br />
            <span className="text-fuchsia-400 font-bold">📅 Daily System:</span> Complete today's riddle, then play the last 7 days using the calendar button!
          </div>
        )}

        {/* Completed Banner */}
        {dayCompleted && dayResult && targetCard && (
          <div className="relative mb-6 p-6 rounded-2xl bg-gradient-to-br from-[#1A0F2E]/90 to-[#0A051A]/90 border border-purple-700/50 shadow-2xl shadow-black/60">
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-purple-400/60" />
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-purple-400/60" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-purple-400/60" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-purple-400/60" />
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <h3 className="text-xl font-black text-green-400 uppercase tracking-wider">{activeDate === todayStr() ? 'Daily Completed!' : 'Challenge Completed!'}</h3>
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src={`/images/cards/${targetCard.id}.webp`} alt={targetCard.name} className="w-16 h-20 object-cover object-top rounded-lg border-2 border-purple-500/50" />
              <div className="text-left">
                <div className="text-white font-bold text-lg">{getCardNameTranslated(targetCard.id)}</div>
                <div className="text-2xl mb-2">{targetEmojis.join(' ')}</div>
                <div className={`text-sm ${dayResult.won ? 'text-green-300/80' : 'text-red-300/80'}`}>{dayResult.won ? `🎉 Solved in ${dayResult.guesses} attempt${dayResult.guesses !== 1 ? 's' : ''}!` : 'Better luck next time!'}</div>
              </div>
            </div>
            {dailyStreak && dailyStreak.currentStreak > 0 && activeDate === todayStr() && <div className="mt-3 flex items-center justify-center gap-2 text-amber-400"><Flame className="w-5 h-5" /><span className="font-bold">{dailyStreak.currentStreak} day streak</span>{dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>}</div>}
            {activeDate === todayStr() && <div className="mt-2 flex items-center justify-center gap-2 text-purple-400 text-sm"><Clock className="w-4 h-4" /><span>Next riddle in {countdown}</span></div>}
          </div>
        )}

        {/* Game area */}
        {!dayCompleted && (
          <>
            {/* Emoji display */}
            <div className="text-center mb-8">
              <h2 className="text-purple-300 text-xl font-bold mb-4">Guess this card:</h2>
              <div className="text-6xl mb-4 tracking-wider">
                {targetEmojis.join(' ')}
              </div>
              <div className="text-purple-400 text-sm">
                {MAX_GUESSES - guesses.length} guesses remaining
              </div>
            </div>

            {/* Search input */}
            <div className="relative mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(e.target.value.length >= 2);
                  }}
                  onFocus={() => setShowSuggestions(searchTerm.length >= 2)}
                  placeholder="Search for a card..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#1A0F2E]/60 border border-purple-700/40 text-purple-100 placeholder-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                />
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && filteredCards.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A0F2E]/95 border border-purple-700/40 rounded-xl shadow-lg z-50 backdrop-blur">
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleGuess(card)}
                      className="w-full p-3 text-left hover:bg-purple-600/20 transition-colors border-b border-purple-700/20 last:border-b-0 flex items-center gap-3"
                    >
                      <img src={`/images/cards/${card.id}.webp`} alt={card.name} className="w-8 h-10 object-cover rounded" />
                      <span className="text-purple-100">{getCardNameTranslated(card.id)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Previous guesses */}
        {guesses.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-purple-300 font-bold mb-3">Your guesses:</h3>
            {guesses.map((guess, index) => (
              <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${guess.correct ? 'bg-green-500/10 border-green-500/40' : 'bg-red-500/10 border-red-500/40'}`}>
                <img src={`/images/cards/${guess.cardId}.webp`} alt={guess.cardName} className="w-8 h-10 object-cover rounded" />
                <span className="text-purple-100 flex-1">{guess.cardName}</span>
                {guess.correct ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Game over - show target */}
        {gameOver && targetCard && (
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">
              {won ? '🎉 Congratulations!' : '😔 Game Over!'}
            </h3>
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src={`/images/cards/${targetCard.id}.webp`} alt={targetCard.name} className="w-20 h-24 object-cover rounded-lg border-2 border-purple-500/50" />
              <div>
                <div className="text-xl font-bold text-white">{getCardNameTranslated(targetCard.id)}</div>
                <div className="text-2xl mb-2">{targetEmojis.join(' ')}</div>
                <div className="text-purple-300">{targetCard.type} • {targetCard.rarity}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}