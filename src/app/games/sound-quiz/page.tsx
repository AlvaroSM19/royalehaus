'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, Volume2, VolumeX, Play, Pause, SkipForward, Loader2 } from 'lucide-react';
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
    return `/images/cards/${card.id}.png`;
  };

  // Show message if no sounds available
  if (cardsWithSounds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-cyan-950/30 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-slate-800/60 border border-cyan-500/30">
          <h2 className="text-2xl font-bold text-cyan-300 mb-4">Coming Soon!</h2>
          <p className="text-slate-300">Sound files are being prepared.</p>
          <Link href="/" className="mt-4 inline-block px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-cyan-950/30 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-cyan-900/95 via-teal-900/95 to-cyan-900/95 border-b border-cyan-500/30 backdrop-blur-lg shadow-xl shadow-cyan-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-600/50 hover:bg-slate-700/60 hover:border-cyan-500/50 transition-all group"
              >
                <Home className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300" />
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">Home</span>
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
              🔊 SOUND QUIZ
            </h1>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 border border-cyan-400/30 transition-all shadow-lg shadow-cyan-900/50"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="font-bold text-sm">New</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Game Stats */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-black text-cyan-300">{guesses.length}/{MAX_GUESSES}</div>
            <div className="text-xs text-cyan-400/70 uppercase tracking-wide">Guesses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-teal-300">{playCount}</div>
            <div className="text-xs text-teal-400/70 uppercase tracking-wide">Plays</div>
          </div>
        </div>

        {/* Sound Player */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-slate-800/60 border border-cyan-500/30 shadow-2xl shadow-cyan-900/30">
            {/* Sound Wave Animation */}
            <div className={`flex items-center justify-center gap-1 h-24 ${isPlaying ? '' : 'opacity-40'}`}>
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 bg-gradient-to-t from-cyan-500 to-teal-400 rounded-full transition-all ${
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
                  flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg
                  transition-all shadow-lg
                  ${audioMode === 'unavailable'
                    ? 'bg-red-600/50 text-red-200 cursor-not-allowed'
                    : isPlaying
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-900/50'
                      : audioMode === 'fallback'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-900/40'
                        : 'bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 shadow-cyan-900/50'
                  }
                  ${isLoadingSound ? 'opacity-80 cursor-wait' : ''}
                `}
              >
                {audioMode === 'unavailable' ? (
                  <>
                    <VolumeX className="w-6 h-6" />
                    <span>Audio Not Available</span>
                  </>
                ) : isLoadingSound ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <Pause className="w-6 h-6" />
                    <span>Stop</span>
                  </>
                ) : audioMode === 'fallback' ? (
                  <>
                    <Volume2 className="w-6 h-6" />
                    <span>Play Placeholder Tone</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    <span>Play Sound</span>
                  </>
                )}
              </button>
            )}

            {audioMode === 'fallback' && !gameOver && targetCard && (
              <p className="text-xs text-amber-100/70 text-center max-w-xs">
                Placeholder tone in use because /sounds/cards/{targetCard.id}.mp3 was not found.
                Add a real clip under public/sounds/cards/ to replace it.
              </p>
            )}

            {(audioMode === 'unavailable' || audioMode === 'fallback') && !gameOver && (
              <button
                onClick={initGame}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-all"
              >
                <SkipForward className="w-4 h-4" />
                Skip to Next Card
              </button>
            )}
          </div>
        </div>

        {/* Game Over State */}
        {gameOver && (
          <div className={`text-center mb-8 p-6 rounded-2xl border ${
            won 
              ? 'bg-green-900/30 border-green-500/40' 
              : 'bg-red-900/30 border-red-500/40'
          }`}>
            <div className={`text-4xl mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? '🎉 Correct!' : '😔 Game Over'}
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              {targetCard && (
                <>
                  <img
                    src={getCardImageUrl(targetCard)}
                    alt={targetCard.name}
                    className="w-16 h-16 object-contain rounded-lg bg-slate-700/50"
                  />
                  <div className="text-xl font-bold text-white">
                    {getCardNameTranslated(targetCard.id)}
                  </div>
                </>
              )}
            </div>
            {won && (
              <div className="text-sm text-green-300/80">
                Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
              </div>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <button
                onClick={playSound}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold transition-all flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Play Sound Again
              </button>
              <button
                onClick={initGame}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 font-bold transition-all shadow-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Search Input */}
        {!gameOver && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
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
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border border-cyan-500/40 text-white placeholder:text-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCards.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800/95 border border-cyan-500/40 rounded-xl shadow-2xl shadow-cyan-900/50 overflow-hidden backdrop-blur-xl">
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleGuess(card)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-600/30 transition-colors text-left border-b border-cyan-500/20 last:border-b-0"
                    >
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-10 h-10 object-contain rounded-lg bg-slate-700/50"
                      />
                      <div>
                        <div className="font-semibold text-white">{getCardNameTranslated(card.id)}</div>
                        <div className="text-xs text-cyan-300/70">{card.type} • {card.rarity}</div>
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
          <div className="max-w-md mx-auto mb-8">
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wide mb-3 text-center">
              Previous Guesses
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {guesses.map((card, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    card.id === targetCard?.id
                      ? 'bg-green-900/40 border-green-500/50'
                      : 'bg-slate-800/60 border-red-500/30'
                  }`}
                >
                  <img
                    src={getCardImageUrl(card)}
                    alt={card.name}
                    className="w-8 h-8 object-contain rounded"
                  />
                  <span className={`text-sm font-medium ${
                    card.id === targetCard?.id ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {getCardNameTranslated(card.id)}
                  </span>
                  <span className="text-xs">
                    {card.id === targetCard?.id ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Play */}
        <div className="mt-12 max-w-lg mx-auto text-center">
          <h3 className="text-lg font-bold text-cyan-300 mb-4">How to Play</h3>
          <div className="text-sm text-cyan-200/70 space-y-2">
            <p>🔊 Listen to the sound of a Clash Royale card</p>
            <p>🎯 Try to guess which card makes that sound</p>
            <p>🔁 You can replay the sound as many times as needed</p>
            <p>✨ You have {MAX_GUESSES} attempts to guess correctly!</p>
          </div>
        </div>

        {/* CSS for sound wave animation */}
        <style jsx>{`
          @keyframes soundwave {
            0%, 100% { height: 20px; }
            50% { height: ${60 + Math.random() * 30}px; }
          }
          .animate-soundwave {
            animation: soundwave 0.5s ease-in-out infinite;
          }
        `}</style>
      </main>
    </div>
  );
}
