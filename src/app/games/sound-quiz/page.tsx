'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, Volume2, VolumeX, Play, Pause, SkipForward, Loader2, Trophy, HelpCircle, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 5;

// Cards that have sound files available
// Add card IDs here when sounds are uploaded to /public/sounds/cards/{id}.mp3
const CARDS_WITH_SOUNDS: number[] = [
  // Troops with distinctive sounds
  1,   // Knight
  5,   // P.E.K.K.A
  7,   // Balloon
  8,   // Witch
  10,  // Golem
  16,  // Baby Dragon
  17,  // Prince
  18,  // Wizard
  22,  // Hog Rider
  24,  // Ice Wizard
  31,  // Lava Hound
  33,  // Sparky
  38,  // Inferno Dragon
  41,  // Electro Wizard
  46,  // Bandit
  50,  // Mega Knight
  73,  // Phoenix
  // Spells
  81,  // Zap
  82,  // Fireball
  84,  // Rocket
  85,  // Lightning
  92,  // Tornado
  // Champions
  114, // Golden Knight
  115, // Archer Queen
  116, // Skeleton King
  118, // Monk
];

export default function SoundQuizPage() {
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [isLoadingSound, setIsLoadingSound] = useState(false);
  const [audioMode, setAudioMode] = useState<'file' | 'fallback' | 'unavailable'>('file');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const fallbackNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  const cardsWithSounds = useMemo(() => {
    return baseCards.filter(card => CARDS_WITH_SOUNDS.includes(card.id));
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (fallbackNodesRef.current) {
      try {
        fallbackNodesRef.current.osc.stop();
      } catch (error) {
        // ignore oscillator stop errors
      }
      fallbackNodesRef.current = null;
    }
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
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
    setTargetCard(randomCard);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setPlayCount(0);
    setIsLoadingSound(false);
    setAudioMode('file');
  }, [cardsWithSounds, stopSound]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    return () => {
      stopSound();
      if (audioCtxRef.current && typeof audioCtxRef.current.close === 'function') {
        audioCtxRef.current.close().catch(() => undefined);
      }
    };
  }, [stopSound]);

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

  const getSoundUrl = (card: ClashCard) => {
    return `/sounds/cards/${card.id}.mp3`;
  };

  const playFallbackTone = useCallback((cardId: number) => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('No window context');
      }
      const anyWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioCtor = anyWindow.AudioContext || anyWindow.webkitAudioContext;
      if (!AudioCtor) {
        throw new Error('AudioContext unsupported');
      }
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtor();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 180 + ((cardId % 12) * 25);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
      fallbackNodesRef.current = { osc, gain };
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
      setAudioMode('fallback');
      setIsPlaying(true);
      fallbackTimerRef.current = window.setTimeout(() => {
        fallbackNodesRef.current = null;
        setIsPlaying(false);
      }, 1200);
    } catch (error) {
      console.warn('Fallback tone failed', error);
      setAudioMode('unavailable');
    }
  }, []);

  const playSound = useCallback(async () => {
    if (!targetCard || gameOver) return;

    stopSound();
    setIsLoadingSound(true);

    const soundUrl = getSoundUrl(targetCard);
    const cardId = targetCard.id;
    let fallbackHandled = false;

    const handleFallback = () => {
      if (fallbackHandled) return;
      fallbackHandled = true;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      playFallbackTone(cardId);
    };

    try {
      const response = await fetch(soundUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error('Missing sound file');
      }

      const audio = new Audio(soundUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setAudioMode('file');
      };
      audio.onended = () => {
        setIsPlaying(false);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        handleFallback();
      };

      await audio.play();
    } catch (error) {
      handleFallback();
    } finally {
      setIsLoadingSound(false);
      setPlayCount(prev => prev + 1);
    }
  }, [gameOver, playFallbackTone, stopSound, targetCard]);

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
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      stopSound();
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

  // Show message if no sounds available
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
            <Volume2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            <span className="text-[10px] xs:text-xs text-cyan-400/70 uppercase tracking-wide">Plays</span>
            <span className="font-bold text-sm xs:text-base sm:text-lg">{playCount}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
        {/* Sound Player */}
        <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          <div 
            className="flex flex-col items-center gap-2 xs:gap-3 sm:gap-4 p-4 xs:p-5 sm:p-6 md:p-8 rounded-xl xs:rounded-2xl border-2 border-cyan-500/30 shadow-2xl w-full max-w-[280px] xs:max-w-[320px] sm:max-w-sm md:max-w-md"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
            }}
          >
            {/* Sound Wave Animation */}
            <div className={`flex items-center justify-center gap-0.5 xs:gap-1 h-16 xs:h-20 sm:h-24 ${isPlaying ? '' : 'opacity-40'}`}>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 xs:w-2.5 sm:w-3 bg-gradient-to-t from-cyan-500 to-amber-400 rounded-full transition-all ${
                    isPlaying ? 'animate-soundwave' : ''
                  }`}
                  style={{
                    height: isPlaying ? `${20 + Math.random() * 60}px` : '20px',
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.5s',
                  }}
                />
              ))}
            </div>

            {/* Play Button */}
            {!gameOver && (
              <button
                onClick={isPlaying ? stopSound : playSound}
                disabled={audioMode === 'unavailable' || isLoadingSound}
                className={`
                  flex items-center gap-2 xs:gap-2.5 sm:gap-3 px-4 xs:px-5 sm:px-6 md:px-8 py-2.5 xs:py-3 sm:py-3.5 md:py-4 rounded-xl xs:rounded-2xl font-bold text-sm xs:text-base sm:text-lg
                  transition-all shadow-lg hover:scale-105
                  ${audioMode === 'unavailable'
                    ? 'bg-red-600/50 text-red-200 cursor-not-allowed'
                    : isPlaying
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/50 border border-red-400/50'
                      : audioMode === 'fallback'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-900/40 border border-amber-400/50'
                        : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-900/50 border border-cyan-400/50'
                  }
                  ${isLoadingSound ? 'opacity-80 cursor-wait' : ''}
                `}
              >
                {audioMode === 'unavailable' ? (
                  <>
                    <VolumeX className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    <span>Audio Not Available</span>
                  </>
                ) : isLoadingSound ? (
                  <>
                    <Loader2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    <span>Stop</span>
                  </>
                ) : audioMode === 'fallback' ? (
                  <>
                    <Volume2 className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    <span className="hidden xs:inline">Play Placeholder Tone</span>
                    <span className="xs:hidden">Play Tone</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
                    <span>Play Sound</span>
                  </>
                )}
              </button>
            )}

            {audioMode === 'fallback' && !gameOver && targetCard && (
              <p className="text-[10px] xs:text-xs text-amber-300/70 text-center max-w-[200px] xs:max-w-xs">
                Placeholder tone in use because /sounds/cards/{targetCard.id}.mp3 was not found.
              </p>
            )}

            {(audioMode === 'unavailable' || audioMode === 'fallback') && !gameOver && (
              <button
                onClick={initGame}
                className="flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg bg-slate-700/60 hover:bg-slate-600/60 border border-slate-600/50 text-xs xs:text-sm font-medium transition-all hover:scale-105"
              >
                <SkipForward className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                Skip to Next Card
              </button>
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
            <p><span className="text-cyan-400 font-bold">1.</span> Listen to the sound of a Clash Royale card</p>
            <p><span className="text-cyan-400 font-bold">2.</span> Try to guess which card makes that sound</p>
            <p><span className="text-cyan-400 font-bold">3.</span> You can replay the sound as many times as needed</p>
            <p><span className="text-cyan-400 font-bold">4.</span> You have {MAX_GUESSES} attempts to guess correctly!</p>
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
