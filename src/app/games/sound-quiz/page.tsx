'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, Volume2, Play, Pause, Loader2, Trophy, HelpCircle, CheckCircle, XCircle, Unlock, Clock, Flame, Calendar } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { includesNormalized } from '@/lib/text-utils';
import { useAuth } from '@/lib/useAuth';
import {
  seededRandom, todayStr, getTimeUntilReset,
  getDayResult, saveDayResult, isDayCompleted,
  getDailyStreakData, updateDailyStreak,
  buildDayOptions,
  type DailyResult, type DailyStreakData, type DayOption,
} from '@/lib/daily-challenge';

const GAME_ID = 'sound-quiz';
const MAX_GUESSES = 8;

// Mapeo de nombres de cartas a nombres de carpetas en /sounds/cards/Cards/
const CARD_FOLDER_MAP: Record<string, string> = {
  'Knight': 'Knight',
  'Archers': 'Archers',
  'Goblins': 'Goblins',
  'Giant': 'Giant',
  'P.E.K.K.A': 'PEKKA',
  'Minions': 'Minions',
  'Balloon': 'Balloon',
  'Witch': 'Witch',
  'Barbarians': 'Barbarians',
  'Golem': 'Golem',
  'Skeletons': 'Skeletons',
  'Valkyrie': 'Valkyrie',
  'Bomber': 'Bomber',
  'Musketeer': 'Musketeer',
  'Baby Dragon': 'Baby Dragon',
  'Prince': 'Prince',
  'Wizard': 'Wizard',
  'Mini P.E.K.K.A': 'Mini PEKKA',
  'Miner': 'Miner',
  'Giant Skeleton': 'Giant Skeleton',
  'Hog Rider': 'Hog Rider',
  'Ice Wizard': 'Ice Wizard',
  'Royal Giant': 'Royal Giant',
  'Guards': 'Guards',
  'Princess': 'Princess',
  'Dark Prince': 'Dark Prince',
  'Lava Hound': 'Lava Hound',
  'Ice Spirit': 'Ice Spirit',
  'Sparky': 'Sparky',
  'Bowler': 'Bowler',
  'Lumberjack': 'Lumberjack',
  'Battle Ram': 'Battle Ram',
  'Inferno Dragon': 'Inferno Dragon',
  'Mega Minion': 'Mega Minion',
  'Spear Goblins': 'Spear Goblins',
  'Electro Wizard': 'Electro Wizard',
  'Elite Barbarians': 'Elite Barbarians',
  'Fire Spirits': 'Fire Spirits',
  'Hunter': 'Hunter',
  'Executioner': 'Executioner',
  'Bandit': 'Bandit',
  'Night Witch': 'Night Witch',
  'Bats': 'Bats',
  'Mega Knight': 'Mega Knight',
  'Flying Machine': 'Flying Machine',
  'Rascals': 'Rascals',
  'Ram Rider': 'Ram Rider',
  'Magic Archer': 'Magic Archer',
  'Arrows': 'Arrows',
  'Fireball': 'Fireball',
  'Lightning': 'Lightning',
  'Rocket': 'Rocket',
  'Freeze': 'Freeze',
  'Rage': 'Rage Spell',
  'Zap': 'Zap',
  'Poison': 'Poison',
  'Graveyard': 'Graveyard',
  'The Log': 'The Log',
  'Tornado': 'Tornado',
  'Clone': 'Clone Spell',
  'Heal': 'Heal',
  'Snowball': 'Snowball',
  'Barbarian Barrel': 'Barbarian Barrel',
  'Goblin Barrel': 'Goblin Barrel',
  'Royal Ghost': 'Royal Ghost',
  'Cannon': 'Cannon',
  'Cannon Cart': 'Cannon Cart',
  'Bomb Tower': 'Bomb Tower',
  'Tesla': 'Tesla',
  'Inferno Tower': 'Inferno',
  'X-Bow': 'XBow',
  'Mortar': 'Mortar',
  'Elixir Collector': 'Elixir Collector',
  'Furnace': 'Furnace',
  'Tombstone': 'Tombstone',
  'Ice Golem': 'Ice Golem',
  'Electro Dragon': 'Electro Dragon',
  'Royal Hogs': 'Royal Hogs',
  'Royal Recruits': 'Royal Recruits',
  'Giant Goblin': 'Giant Goblin',
  'Skeleton Barrel': 'Skeleton Barrel',
  'Dart Goblin': 'Dart Goblin',
};

// Obtener cartas que tienen carpeta de sonidos
const getCardsWithSounds = () => {
  return baseCards.filter(card => CARD_FOLDER_MAP[card.name]);
};

const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.webp`;

// Interface para pistas de sonido
interface SoundHint {
  url: string;
}

// Daily target for any date (deterministic, picks from cards with sounds)
function getTargetForDate(pool: ClashCard[], date: string): ClashCard {
  const seed = date.split('-').reduce((acc, part) => acc + parseInt(part), 0) * 13337;
  const idx = Math.floor(seededRandom(seed) * pool.length);
  return pool[idx];
}

export default function SoundQuizPage() {
  const { getCardNameTranslated } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [soundHints, setSoundHints] = useState<SoundHint[]>([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [isLoadingHints, setIsLoadingHints] = useState(false);

  // Daily system state
  const [activeDate, setActiveDate] = useState(todayStr());
  const [dayCompleted, setDayCompleted] = useState(false);
  const [dayResult, setDayResult] = useState<DailyResult | null>(null);
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null);
  const [countdown, setCountdown] = useState('');
  const [dayOptions, setDayOptions] = useState<DayOption[]>([]);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedRef = useRef(false);

  const cardsWithSounds = useMemo(() => getCardsWithSounds(), []);

  // Migrate old localStorage keys to new format (one-time)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const oldResult = localStorage.getItem('sound-quiz-daily-result');
      const oldDate = localStorage.getItem('sound-quiz-last-daily');
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
        localStorage.removeItem('sound-quiz-daily-result');
        localStorage.removeItem('sound-quiz-last-daily');
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

  // Obtener sonidos reales de una carta desde la API
  const fetchCardSounds = useCallback(async (card: ClashCard): Promise<SoundHint[]> => {
    const folderName = CARD_FOLDER_MAP[card.name];
    if (!folderName) return [];

    try {
      const response = await fetch(`/api/sounds?cardFolder=${encodeURIComponent(folderName)}`);
      const data = await response.json();

      if (!data.available || !data.sounds || data.sounds.length === 0) {
        console.warn(`No sounds found for ${card.name} (${folderName})`);
        return [];
      }

      // Barajar los sonidos y tomar hasta 8
      const shuffled = [...data.sounds].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 8);

      return selected.map((sound: { url: string }) => ({ url: sound.url }));
    } catch (error) {
      console.error(`Failed to fetch sounds for ${card.name}:`, error);
      return [];
    }
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const initGame = useCallback(async (date: string) => {
    stopSound();
    setIsLoadingHints(true);
    recordedRef.current = false;
    setActiveDate(date);

    if (cardsWithSounds.length === 0) {
      setIsLoadingHints(false);
      return;
    }

    // Check if already completed for this date
    const existing = getDayResult(GAME_ID, date);
    if (existing) {
      setDayCompleted(true);
      setDayResult(existing);
      setDailyStreak(getDailyStreakData(GAME_ID));
      const card = baseCards.find(c => c.id === Number(existing.targetId));
      if (card && CARD_FOLDER_MAP[card.name]) {
        const hints = await fetchCardSounds(card);
        setTargetCard(card);
        setSoundHints(hints);
        setCurrentHintIndex(hints.length - 1);
        setGameOver(true);
        setWon(existing.won);
        setGuesses([]);
        setIsLoadingHints(false);
        refreshDayOptions();
        return;
      }
    }

    // For today: try API first (cross-device sync)
    let cardToUse: ClashCard | null = null;

    if (date === todayStr()) {
      try {
        const response = await fetch('/api/daily?game=sound-quiz', { credentials: 'include' });
        if (response.ok) {
          const challenge = await response.json();
          if (challenge?.cardId) {
            const c = baseCards.find(card => card.id === challenge.cardId);
            if (c && CARD_FOLDER_MAP[c.name]) cardToUse = c;
          }
          // Check if user already completed this from another device
          if (challenge?.participation?.completed && cardToUse) {
            const result: DailyResult = {
              won: challenge.participation.won,
              guesses: challenge.participation.attempts,
              targetId: cardToUse.id,
              date,
            };
            saveDayResult(GAME_ID, result);
            const hints = await fetchCardSounds(cardToUse);
            setDayCompleted(true);
            setDayResult(result);
            setDailyStreak(getDailyStreakData(GAME_ID));
            setTargetCard(cardToUse);
            setSoundHints(hints);
            setCurrentHintIndex(hints.length - 1);
            setGameOver(true);
            setWon(challenge.participation.won);
            setIsLoadingHints(false);
            refreshDayOptions();
            return;
          }
        }
      } catch { /* API failed, use fallback */ }
    }

    // Deterministic local card with sounds
    if (!cardToUse) {
      cardToUse = getTargetForDate(cardsWithSounds, date);
    }

    const hints = await fetchCardSounds(cardToUse);

    if (hints.length === 0) {
      // Try random card if daily card has no sounds
      const random = cardsWithSounds[Math.floor(Math.random() * cardsWithSounds.length)];
      const fallbackHints = await fetchCardSounds(random);
      if (fallbackHints.length > 0) {
        cardToUse = random;
        setTargetCard(random);
        setSoundHints(fallbackHints);
      }
      setIsLoadingHints(false);
      refreshDayOptions();
      return;
    }

    setTargetCard(cardToUse);
    setSoundHints(hints);
    setCurrentHintIndex(0);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setDayCompleted(false);
    setDayResult(null);
    setIsLoadingSound(false);
    setIsLoadingHints(false);
    refreshDayOptions();

    // Auto-play first sound
    setTimeout(() => {
      if (hints.length > 0) {
        const firstAudio = new Audio(hints[0].url);
        audioRef.current = firstAudio;
        firstAudio.onplay = () => setIsPlaying(true);
        firstAudio.onended = () => setIsPlaying(false);
        firstAudio.onerror = () => setIsPlaying(false);
        firstAudio.play().catch(() => {});
      }
    }, 500);
  }, [cardsWithSounds, fetchCardSounds, stopSound, refreshDayOptions]);

  useEffect(() => {
    initGame(todayStr());
  }, [initGame]);

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

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
      .filter(card => {
        const englishMatch = includesNormalized(card.name, searchTerm);
        const translatedName = getCardNameTranslated(card.id);
        const translatedMatch = includesNormalized(translatedName, searchTerm);
        return englishMatch || translatedMatch;
      })
      .slice(0, 8);
  }, [searchTerm, guessedCardIds, getCardNameTranslated]);

  const playSound = useCallback(async (hintIndex?: number) => {
    if (!targetCard || soundHints.length === 0) return;

    const indexToPlay = hintIndex !== undefined ? hintIndex : currentHintIndex;
    if (indexToPlay >= soundHints.length) return;

    stopSound();
    setIsLoadingSound(true);

    const hint = soundHints[indexToPlay];

    try {
      const audio = new Audio(hint.url);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoadingSound(false);
      };
      audio.onended = () => {
        setIsPlaying(false);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingSound(false);
        console.error(`Failed to load sound: ${hint.url}`);
        if (indexToPlay < soundHints.length - 1) {
          setTimeout(() => playSound(indexToPlay + 1), 100);
        }
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsLoadingSound(false);
      if (indexToPlay < soundHints.length - 1) {
        setTimeout(() => playSound(indexToPlay + 1), 100);
      }
    }
  }, [soundHints, currentHintIndex, stopSound, targetCard]);

  const handleGuess = (card: ClashCard) => {
    if (gameOver || !targetCard || (dayCompleted && !isAdmin)) return;

    const newGuesses = [...guesses, card];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    const isWin = card.id === targetCard.id;

    if (isWin || newGuesses.length >= MAX_GUESSES) {
      setWon(isWin);
      setGameOver(true);
      stopSound();

      const result: DailyResult = {
        won: isWin,
        guesses: newGuesses.length,
        targetId: targetCard.id,
        date: activeDate,
      };

      saveDayResult(GAME_ID, result);
      setDayResult(result);
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
              gameType: 'sound-quiz',
              won: isWin,
              attempts: newGuesses.length,
            }),
          }).catch(err => console.error('Failed to save to database:', err));
        }
      }

      refreshDayOptions();

      if (!recordedRef.current) {
        recordedRef.current = true;
        // recordSoundQuizSession if available
      }
    } else {
      // Unlock next hint after wrong guess
      if (currentHintIndex < soundHints.length - 1) {
        setCurrentHintIndex(prev => prev + 1);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  // Mostrar mensaje si no hay sonidos disponibles
  if (cardsWithSounds.length === 0) {
    return (
      <div className="min-h-screen relative text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
        <div
          className="text-center p-8 rounded-2xl border-2 border-cyan-500/30"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
          }}
        >
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Coming Soon!</h2>
          <p className="text-slate-300">Sound files are being prepared.</p>
          <Link href="/" className="mt-4 inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Mostrar indicador de carga mientras se obtienen los sonidos
  if (isLoadingHints) {
    return (
      <div className="min-h-screen relative text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
        <div
          className="text-center p-8 rounded-2xl border-2 border-cyan-500/30"
          style={{
            background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
          }}
        >
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cyan-400">Loading sounds...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col text-white">
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
              <Volume2 className="w-4 h-4 xs:w-5 xs:h-5 text-cyan-400" />
              <span>Sound Quiz</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-full font-bold">DAILY</span>
            </h1>
            <div className="flex items-center gap-1.5 xs:gap-2">
              {todayDone && (
                <button onClick={() => setShowDayPicker(s => !s)} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Days</span>
                </button>
              )}
              {dayCompleted && (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">{countdown}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Day picker */}
        {showDayPicker && todayDone && (
          <div className="sticky top-[49px] sm:top-[57px] z-30 bg-gray-900/95 backdrop-blur border-b border-amber-700/40 shadow-lg shadow-black/40">
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

        {/* Stats Panel */}
        <div className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-8">
            {/* Playing past day banner (inline) */}
            {activeDate !== todayStr() && (
              <div className="flex items-center gap-2 text-amber-300 text-xs bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Playing: <strong>{dayOptions.find(o => o.date === activeDate)?.label || activeDate}</strong></span>
                <button onClick={() => switchDay(todayStr())} className="ml-2 px-2 py-0.5 rounded bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs hover:bg-amber-600/40 transition">← Today</button>
              </div>
            )}
            <div className="flex items-center gap-1.5 xs:gap-2 text-amber-400 bg-slate-800/60 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg border border-amber-500/20">
              <span className="text-[10px] xs:text-xs text-amber-400/70 uppercase tracking-wide">Guesses</span>
              <span className="font-bold text-sm xs:text-base sm:text-lg">{guesses.length}/{MAX_GUESSES}</span>
            </div>
            <div className="flex items-center gap-1.5 xs:gap-2 text-cyan-400 bg-slate-800/60 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg border border-cyan-500/20">
              <Unlock className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              <span className="text-[10px] xs:text-xs text-cyan-400/70 uppercase tracking-wide">Hints</span>
              <span className="font-bold text-sm xs:text-base sm:text-lg">{currentHintIndex + 1}/{soundHints.length}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 container mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-5 sm:py-6 md:py-8">

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
                <img src={getCardImageUrl(targetCard)} alt={targetCard.name} className="w-16 h-16 object-contain rounded-lg border-2 border-green-500/50 bg-slate-800/50 p-1" />
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
              {/* Listen to sounds even after completion */}
              <div className="flex justify-center mb-3">
                <button
                  onClick={() => playSound()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/40 transition text-sm font-semibold"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Playing...' : 'Listen'}
                </button>
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
              {/* Admin Play Again */}
              {isAdmin && (
                <button
                  onClick={() => {
                    stopSound();
                    const randomCard = cardsWithSounds[Math.floor(Math.random() * cardsWithSounds.length)];
                    fetchCardSounds(randomCard).then(hints => {
                      setTargetCard(randomCard);
                      setSoundHints(hints);
                      setCurrentHintIndex(0);
                      setGuesses([]);
                      setSearchTerm('');
                      setGameOver(false);
                      setWon(false);
                      setDayCompleted(false);
                      setDayResult(null);
                    });
                  }}
                  className="mt-3 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg border-2 border-purple-400/50 flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Play Again (Admin)
                </button>
              )}

              {/* Play Past Days button */}
              {todayDone && (
                <button onClick={() => setShowDayPicker(true)} className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-br from-cyan-600 via-teal-500 to-cyan-600 text-white shadow-lg shadow-cyan-900/40 hover:brightness-110 transition text-sm">
                  <Calendar className="w-4 h-4" /> Play Past Days
                </button>
              )}
            </div>
          )}

          {/* Sound Hints */}
          {!dayCompleted && (
            <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6 md:mb-8">
              <div
                className="flex flex-col gap-2 xs:gap-3 p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl xs:rounded-2xl border-2 border-cyan-500/30 shadow-2xl w-full max-w-[280px] xs:max-w-[320px] sm:max-w-sm md:max-w-md"
                style={{
                  background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                }}
              >
                <h3 className="text-center text-cyan-400 font-bold text-xs xs:text-sm mb-1">Sound Hints</h3>

                {/* Main Play Button */}
                <button
                  onClick={() => playSound()}
                  disabled={isLoadingSound}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl transition-all mb-3 ${
                    isPlaying
                      ? 'bg-gradient-to-r from-green-600 to-green-500 shadow-lg border-2 border-green-400'
                      : 'bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-lg border-2 border-cyan-400 hover:from-cyan-500 hover:to-cyan-400 hover:scale-105'
                  } ${isLoadingSound ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoadingSound ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-6 h-6" />
                      <span className="text-base font-bold">Playing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6" />
                      <span className="text-base font-bold">Play Sound</span>
                    </>
                  )}
                </button>

                <div className="space-y-2">
                  {soundHints.slice(0, currentHintIndex + 1).map((hint, index) => (
                    <button
                      key={index}
                      onClick={() => playSound(index)}
                      disabled={isLoadingSound}
                      className={`w-full flex items-center justify-between gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg transition-all ${
                        isPlaying && audioRef.current?.src.includes(hint.url)
                          ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-lg border-2 border-cyan-400'
                          : 'bg-slate-700/60 hover:bg-slate-600/60 border-2 border-slate-600/50'
                      } ${isLoadingSound ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        <span className="text-xs xs:text-sm font-medium">Hint {index + 1}</span>
                      </div>
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                    </button>
                  ))}

                  {soundHints.slice(currentHintIndex + 1).map((_, index) => (
                    <div
                      key={currentHintIndex + 1 + index}
                      className="w-full flex items-center justify-between gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg bg-slate-800/40 border-2 border-slate-700/30 opacity-50"
                    >
                      <div className="flex items-center gap-2">
                        <Unlock className="w-4 h-4 text-slate-500" />
                        <span className="text-xs xs:text-sm font-medium text-slate-500">Hint {currentHintIndex + 2 + index}</span>
                      </div>
                      <span className="text-[10px] xs:text-xs text-slate-600">Locked</span>
                    </div>
                  ))}
                </div>

                <p className="text-center text-[10px] xs:text-xs text-slate-400 mt-2">
                  {currentHintIndex < soundHints.length - 1
                    ? 'Make a wrong guess to unlock more hints!'
                    : 'All hints unlocked!'}
                </p>
              </div>
            </div>
          )}

          {/* Game Over State (non-completed-banner, fallback) */}
          {gameOver && !dayCompleted && (
            <div
              className={`text-center mb-4 xs:mb-5 sm:mb-6 md:mb-8 p-3 xs:p-4 sm:p-5 md:p-6 rounded-xl xs:rounded-2xl border-2 w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md mx-auto relative overflow-hidden ${
                won ? 'border-green-500/50' : 'border-red-500/50'
              }`}
              style={{
                background: won
                  ? 'linear-gradient(145deg, rgba(22, 101, 52, 0.3) 0%, rgba(15, 28, 50, 0.95) 100%)'
                  : 'linear-gradient(145deg, rgba(127, 29, 29, 0.3) 0%, rgba(15, 28, 50, 0.95) 100%)',
                animation: 'fadeIn 0.4s ease-out',
              }}
            >
              <div className={`absolute top-1.5 xs:top-2 left-1.5 xs:left-2 w-3 h-3 xs:w-4 xs:h-4 border-l-2 border-t-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
              <div className={`absolute top-1.5 xs:top-2 right-1.5 xs:right-2 w-3 h-3 xs:w-4 xs:h-4 border-r-2 border-t-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
              <div className={`absolute bottom-1.5 xs:bottom-2 left-1.5 xs:left-2 w-3 h-3 xs:w-4 xs:h-4 border-l-2 border-b-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
              <div className={`absolute bottom-1.5 xs:bottom-2 right-1.5 xs:right-2 w-3 h-3 xs:w-4 xs:h-4 border-r-2 border-b-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>

              <div className={`text-2xl xs:text-3xl sm:text-4xl mb-1.5 xs:mb-2 font-bold ${won ? 'text-green-400' : 'text-red-400'}`}>
                {won ? 'Correct!' : 'Game Over'}
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
              {won && (
                <div className="text-xs xs:text-sm text-green-300/80 flex items-center justify-center gap-1.5 xs:gap-2">
                  <Trophy className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                  Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
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
                  placeholder="Type a card name..."
                  className="w-full pl-9 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-lg xs:rounded-xl border-2 border-cyan-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm xs:text-base sm:text-lg"
                  style={{
                    background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                  }}
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredCards.length > 0 && (
                  <div
                    className="absolute z-50 w-full mt-1.5 xs:mt-2 border-2 border-cyan-700/50 rounded-lg xs:rounded-xl shadow-2xl shadow-black/50 overflow-hidden backdrop-blur-xl max-h-60 xs:max-h-72 sm:max-h-80 overflow-y-auto"
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
                    {card.id === targetCard?.id
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                    }
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
              <p><span className="text-cyan-400 font-bold">1.</span> Listen to different sound hints from a Clash Royale card</p>
              <p><span className="text-cyan-400 font-bold">2.</span> Try to guess which card it is</p>
              <p><span className="text-cyan-400 font-bold">3.</span> Each wrong guess unlocks a new sound hint!</p>
              <p><span className="text-cyan-400 font-bold">4.</span> You have {MAX_GUESSES} attempts to guess correctly</p>
              <p><span className="text-cyan-400 font-bold">📅</span> Complete today&apos;s challenge, then play the last 7 days!</p>
            </div>
          </div>

          {/* CSS for animations */}
          <style jsx>{`
            @keyframes soundwave {
              0%, 100% { height: 20px; }
              50% { height: ${60 + Math.random() * 30}px; }
            }
            .animate-soundwave {
              animation: soundwave 0.5s ease-in-out infinite;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </main>
      </div> {/* End content wrapper */}
    </div>
  );
}
