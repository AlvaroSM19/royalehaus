'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, HelpCircle, Trophy, Check, X } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 6;

// Blur (px) and scale for each attempt step (index 0 = initial state before any guess)
const BLUR_STEPS  = [40, 32, 24, 16, 8, 3, 0];
const SCALE_STEPS = [3.5, 3.0, 2.5, 2.0, 1.5, 1.2, 1.0];

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
  const [bestScore, setBestScore] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load best score from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pixelRoyale_bestScore');
      if (saved) setBestScore(parseInt(saved, 10));
    } catch {}
  }, []);

  const initGame = useCallback(() => {
    setImageReady(false);
    setStep(0);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowHint(false);
    const card = getRandomCard();
    setTargetCard(card);
  }, []);

  useEffect(() => {
    if (!targetCard) return;
    const img = new Image();
    img.src = `/images/cards/${targetCard.id}.png`;
    img.onload = () => setImageReady(true);
  }, [targetCard]);

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

    const newGuesses = [...guesses, card];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    if (card.id === targetCard.id) {
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
      if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        setTimeout(() => setStep(MAX_GUESSES), 800);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.png`;

  const getHint = () => {
    if (!targetCard) return '';
    return [`${targetCard.elixir} elixir`, targetCard.type, targetCard.rarity].join(' • ');
  };

  const currentBlur = BLUR_STEPS[Math.min(step, BLUR_STEPS.length - 1)];
  const currentScale = SCALE_STEPS[Math.min(step, SCALE_STEPS.length - 1)];

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-slate-900/95 border-b border-amber-900/30 sticky top-0 z-20">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-slate-600">/</span>
              <h1 className="text-base sm:text-lg md:text-xl font-black text-amber-400 tracking-wider">
                PIXEL ROYALE
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-wide hidden sm:inline">
                Guesses: <span className="text-white font-bold">{guesses.length}/{MAX_GUESSES}</span>
              </span>
              <button
                onClick={initGame}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 text-xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Game</span>
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 flex-1">
          {/* Stats Panel */}
          <div className="flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div 
              className="text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                border: '2px solid rgba(60, 90, 140, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
              }}
            >
              <div className="text-xl sm:text-2xl font-black text-amber-400">{guesses.length}/{MAX_GUESSES}</div>
              <div className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Guesses</div>
            </div>
            <div 
              className="text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                border: '2px solid rgba(60, 90, 140, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
              }}
            >
              <div className="text-xl sm:text-2xl font-black text-cyan-400">{Math.round((step / MAX_GUESSES) * 100)}%</div>
              <div className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">Clarity</div>
            </div>
            {bestScore !== null && (
              <div 
                className="text-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.95) 0%, rgba(30, 25, 15, 0.98) 100%)',
                  border: '2px solid rgba(245, 158, 11, 0.6)',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)'
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xl sm:text-2xl font-black text-white">{bestScore}</span>
                </div>
                <div className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-[0.1em] text-cyan-400">Best</div>
              </div>
            )}
          </div>

          {/* Main Card Container */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div 
              className="relative rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300"
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
              <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 relative">
                {/* Image Area */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(180deg, rgba(40, 60, 90, 0.4) 0%, rgba(20, 35, 60, 0.5) 100%)',
                  }}
                >
                  {targetCard && (
                    <img
                      ref={imgRef}
                      src={getCardImageUrl(targetCard)}
                      alt="Mystery Card"
                      className="w-full h-full object-contain p-2 sm:p-3 transition-all duration-700 ease-out"
                      style={{
                        filter: imageReady ? `blur(${currentBlur}px)` : 'blur(60px)',
                        transform: imageReady ? `scale(${currentScale})` : 'scale(4)',
                        opacity: imageReady ? 1 : 0,
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Progress dots */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-700/50">
                {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all ${
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
            <div className="flex justify-center mb-4 sm:mb-6">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/80 border border-cyan-600/40 hover:bg-slate-700 transition-all text-cyan-400 text-xs sm:text-sm font-semibold"
              >
                <HelpCircle className="w-4 h-4" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
          )}

          {showHint && !gameOver && (
            <div 
              className="text-center mb-4 sm:mb-6 text-amber-300 text-xs sm:text-sm font-medium rounded-xl py-3 px-4 max-w-md mx-auto"
              style={{
                background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.95) 0%, rgba(30, 25, 15, 0.98) 100%)',
                border: '2px solid rgba(245, 158, 11, 0.5)',
              }}
            >
              💡 {getHint()}
            </div>
          )}

          {/* Search Input */}
          {!gameOver && (
            <div className="max-w-md mx-auto mb-6 sm:mb-8">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
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
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all text-sm sm:text-base"
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
            <div className="max-w-lg mx-auto mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="flex-1 h-px bg-slate-600/40" />
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400">Previous Guesses</span>
                <div className="flex-1 h-px bg-slate-600/40" />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {guesses.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
              <div 
                className="rounded-2xl sm:rounded-3xl max-w-md w-full overflow-hidden relative"
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 15, 8, 0.98) 0%, rgba(35, 25, 12, 0.99) 50%, rgba(20, 15, 8, 0.98) 100%)',
                  border: '2px solid rgba(245, 180, 50, 0.7)',
                  boxShadow: '0 0 40px rgba(245, 180, 50, 0.3), 0 0 80px rgba(245, 158, 11, 0.15)'
                }}
              >
                {/* Decorative inner border */}
                <div className="absolute inset-1 sm:inset-2 rounded-xl border border-amber-500/30 pointer-events-none" />
                
                {/* Corner decorations - desktop only */}
                <div className="hidden md:block absolute top-3 left-3 w-12 h-12 border-l-4 border-t-4 border-amber-400/60 rounded-tl-lg" />
                <div className="hidden md:block absolute top-3 right-3 w-12 h-12 border-r-4 border-t-4 border-amber-400/60 rounded-tr-lg" />
                <div className="hidden md:block absolute bottom-3 left-3 w-12 h-12 border-l-4 border-b-4 border-amber-400/60 rounded-bl-lg" />
                <div className="hidden md:block absolute bottom-3 right-3 w-12 h-12 border-r-4 border-b-4 border-amber-400/60 rounded-br-lg" />

                <div className="relative z-10 p-6 sm:p-8 text-center">
                  {/* Result Icon */}
                  <div className={`text-5xl sm:text-6xl mb-4 ${won ? '' : 'grayscale'}`}>
                    {won ? '🎉' : '😔'}
                  </div>

                  {/* Title */}
                  <div className="text-amber-400/80 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2">
                    {won ? 'Congratulations!' : 'Game Over'}
                  </div>

                  {/* Card Name */}
                  <div 
                    className="text-2xl sm:text-3xl md:text-4xl font-black mb-4"
                    style={{
                      background: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {targetCard && getCardNameTranslated(targetCard.id)}
                  </div>

                  {/* Card Image */}
                  <div className="flex justify-center mb-4">
                    <div 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden p-1"
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

                  {/* Score Badge */}
                  {won && (
                    <div className="inline-block px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 mb-4">
                      <span className="text-cyan-400 font-bold text-sm">
                        Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
                      </span>
                    </div>
                  )}

                  {/* Separator */}
                  <div className="flex items-center gap-3 my-4 sm:my-6">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
                    <span className="text-amber-500/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Play Again?</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={initGame}
                      className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-wider text-sm sm:text-base transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: 'linear-gradient(90deg, #f59e0b 0%, #eab308 50%, #f59e0b 100%)',
                        color: '#1e1b18',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      New Game
                    </button>
                    <Link
                      href="/"
                      className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold uppercase tracking-wider text-sm sm:text-base bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-600/50 transition-all text-center"
                    >
                      Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* How to Play */}
          <div className="mt-8 sm:mt-12 max-w-lg mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-slate-600/40" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] text-amber-400">How to Play</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-slate-600/40" />
            </div>
            <div 
              className="text-xs sm:text-sm text-slate-400 space-y-2 rounded-xl p-4 sm:p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.6) 0%, rgba(15, 28, 50, 0.7) 100%)',
                border: '1px solid rgba(60, 90, 140, 0.3)',
              }}
            >
              <p>🔍 A card image is hidden behind blur and zoom</p>
              <p>🎯 Try to guess which Clash Royale card it is</p>
              <p>✨ With each wrong guess, the image gets clearer</p>
              <p>🏆 You have {MAX_GUESSES} attempts to guess correctly!</p>
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
