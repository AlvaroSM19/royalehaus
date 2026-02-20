'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, Volume2, Play, Pause, Loader2, Trophy, HelpCircle, CheckCircle, XCircle, Unlock } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { includesNormalized } from '@/lib/text-utils';

const MAX_GUESSES = 5;

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

// Tipos de sonidos disponibles para las pistas
type SoundHintType = 'deploy' | 'attack' | 'hit' | 'death' | 'other';

interface SoundHint {
  type: SoundHintType;
  url: string;
  label: string;
}

export default function SoundQuizPage() {
  const { getCardNameTranslated } = useLanguage();
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cardsWithSounds = useMemo(() => getCardsWithSounds(), []);

  // Generar pistas de sonido para la carta actual
  const generateSoundHints = useCallback((card: ClashCard): SoundHint[] => {
    const folderName = CARD_FOLDER_MAP[card.name];
    if (!folderName) return [];

    const hints: SoundHint[] = [];
    const basePath = `/sounds/cards/Cards/${encodeURIComponent(folderName)}`;
    const cardLower = folderName.toLowerCase().replace(/ /g, '_');

    // Prioridad de pistas:
    // 1. Deploy (despliegue)
    hints.push({
      type: 'deploy',
      url: `${basePath}/${cardLower}_deploy_end_01.ogg`,
      label: 'Deploy Sound'
    });

    // 2. Attack (ataque)
    hints.push({
      type: 'attack',
      url: `${basePath}/${cardLower}_attack_start_01.ogg`,
      label: 'Attack Sound'
    });

    // 3. Hit/Impact (golpe)
    hints.push({
      type: 'hit',
      url: `${basePath}/${cardLower}_hit_01.ogg`,
      label: 'Hit Sound'
    });

    // 4. Death (muerte)
    hints.push({
      type: 'death',
      url: `${basePath}/${cardLower}_death_01.ogg`,
      label: 'Death Sound'
    });

    // 5. Alternative sounds (otras variantes)
    hints.push({
      type: 'other',
      url: `${basePath}/${cardLower}_attack_start_02.ogg`,
      label: 'Alternative Sound'
    });

    return hints;
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const initGame = useCallback(() => {
    stopSound();
    if (cardsWithSounds.length === 0) {
      console.warn('No cards with sounds available');
      return;
    }
    const randomCard = cardsWithSounds[Math.floor(Math.random() * cardsWithSounds.length)];
    const hints = generateSoundHints(randomCard);
    
    setTargetCard(randomCard);
    setSoundHints(hints);
    setCurrentHintIndex(0);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setIsLoadingSound(false);
  }, [cardsWithSounds, stopSound, generateSoundHints]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

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
    if (!targetCard || gameOver || soundHints.length === 0) return;

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
      };
      audio.onended = () => {
        setIsPlaying(false);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        console.error(`Failed to load sound: ${hint.url}`);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    } finally {
      setIsLoadingSound(false);
    }
  }, [gameOver, soundHints, currentHintIndex, stopSound, targetCard]);

  const handleGuess = (card: ClashCard) => {
    if (gameOver || !targetCard) return;

    const newGuesses = [...guesses, card];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    if (card.id === targetCard.id) {
      setWon(true);
      setGameOver(true);
      stopSound();
    } else {
      // Desbloquear próxima pista después de un intento fallido
      if (currentHintIndex < soundHints.length - 1) {
        setCurrentHintIndex(prev => prev + 1);
      }
      
      if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        stopSound();
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
            </h1>
            <button
              onClick={initGame}
              className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-md xs:rounded-lg transition-all hover:scale-105 font-bold text-xs xs:text-sm border border-amber-400/50"
            >
              <RotateCcw className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">New</span>
            </button>
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
              <Unlock className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              <span className="text-[10px] xs:text-xs text-cyan-400/70 uppercase tracking-wide">Hints</span>
              <span className="font-bold text-sm xs:text-base sm:text-lg">{currentHintIndex + 1}/{soundHints.length}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 container mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
          {/* Sound Hints */}
          <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6 md:mb-8">
            <div 
              className="flex flex-col gap-2 xs:gap-3 p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl xs:rounded-2xl border-2 border-cyan-500/30 shadow-2xl w-full max-w-[280px] xs:max-w-[320px] sm:max-w-sm md:max-w-md"
              style={{
                background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
              }}
            >
              <h3 className="text-center text-cyan-400 font-bold text-xs xs:text-sm mb-1">Sound Hints</h3>
              
              <div className="space-y-2">
                {soundHints.slice(0, currentHintIndex + 1).map((hint, index) => (
                  <button
                    key={index}
                    onClick={() => playSound(index)}
                    disabled={isLoadingSound || gameOver}
                    className={`w-full flex items-center justify-between gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg transition-all ${
                      isPlaying && (isLoadingSound ? false : audioRef.current?.src.includes(hint.url))
                        ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 shadow-lg border-2 border-cyan-400'
                        : 'bg-slate-700/60 hover:bg-slate-600/60 border-2 border-slate-600/50'
                    } ${isLoadingSound || gameOver ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      <span className="text-xs xs:text-sm font-medium">{hint.label}</span>
                    </div>
                    <span className="text-[10px] xs:text-xs text-slate-400">#{index + 1}</span>
                  </button>
                ))}
                
                {soundHints.slice(currentHintIndex + 1).map((hint, index) => (
                  <div
                    key={currentHintIndex + 1 + index}
                    className="w-full flex items-center justify-between gap-2 px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg bg-slate-800/40 border-2 border-slate-700/30 opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 text-slate-500" />
                      <span className="text-xs xs:text-sm font-medium text-slate-500">Locked</span>
                    </div>
                    <span className="text-[10px] xs:text-xs text-slate-600">#{currentHintIndex + 2 + index}</span>
                  </div>
                ))}
              </div>
              
              {!gameOver && (
                <p className="text-center text-[10px] xs:text-xs text-slate-400 mt-2">
                  {currentHintIndex < soundHints.length - 1 
                    ? 'Make a wrong guess to unlock more hints!' 
                    : 'All hints unlocked!'}
                </p>
              )}
            </div>
          </div>

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
            <div className="flex flex-wrap justify-center gap-2 xs:gap-3 sm:gap-4 mt-3 xs:mt-4">
              <button
                onClick={playSound}
                className="px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg xs:rounded-xl bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600/50 font-semibold text-xs xs:text-sm transition-all flex items-center gap-1.5 xs:gap-2 hover:scale-105"
              >
                <Volume2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                Play Again
              </button>
              <button
                onClick={initGame}
                className="px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-xs xs:text-sm sm:text-base transition-all hover:scale-105 shadow-lg hover:shadow-amber-500/30 border border-amber-400/50"
              >
                New Game
              </button>
            </div>
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
