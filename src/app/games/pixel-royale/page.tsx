'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 6;

// Blur and scale for each attempt step (index 0 = initial state before any guess)
// Starts at 95% zoom (scale 1.95) and 90% blur (36px), decreasing 5% zoom and 10% blur per attempt
// Zoom: 1.95 → 1.90 → 1.85 → 1.80 → 1.75 → 1.70 → 1.0 (clear on win/end)
// Blur: 90% → 80% → 70% → 60% → 50% → 40% → 0% (max blur = 40px)
const BLUR_STEPS  = [36, 32, 28, 24, 20, 16, 0]; // 7 values: initial + after each of 6 guesses
const SCALE_STEPS = [1.95, 1.90, 1.85, 1.80, 1.75, 1.70, 1.0];

export default function PixelRoyalePage() {
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  // imageReady: prevents the image from being visible before blur+zoom are applied on new game
  const [imageReady, setImageReady] = useState(false);
  // step controls the blur/zoom level (0 = max blur, 6 = fully clear)
  const [step, setStep] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const initGame = useCallback(() => {
    // CRITICAL: hide image first so user can't see it while new card loads
    setImageReady(false);
    setStep(0);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowHint(false);

    // Pick new card after hiding image
    const card = getRandomCard();
    setTargetCard(card);
  }, []);

  // When targetCard changes, wait for the image to load, then show it with max blur
  useEffect(() => {
    if (!targetCard) return;
    const img = new Image();
    img.src = `/images/cards/${targetCard.id}.webp`;
    img.onload = () => {
      // Image is loaded in browser cache → safe to show with blur
      setImageReady(true);
    };
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
      // Won! Show fully clear
      setStep(MAX_GUESSES);
      setWon(true);
      setGameOver(true);
    } else {
      // Wrong guess – advance one step (less blur, less zoom)
      setStep(newGuesses.length);

      if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        // Reveal fully after a short delay
        setTimeout(() => setStep(MAX_GUESSES), 800);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.webp`;

  // Progressive hints: reveal more info as guesses increase
  const getHints = (): string[] => {
    if (!targetCard) return [];
    const hints: string[] = [];
    const g = guesses.length;
    // After 2 guesses: type + rarity
    if (g >= 2) hints.push(`${targetCard.type} • ${targetCard.rarity}`);
    // After 3 guesses: elixir cost
    if (g >= 3) hints.push(`${targetCard.elixir} Elixir`);
    // After 4 guesses: attack type + targets air
    if (g >= 4) {
      const parts: string[] = [];
      if (targetCard.attackType) parts.push(targetCard.attackType === 'melee' ? 'Melee' : 'Ranged');
      if (targetCard.targetAir !== null) parts.push(targetCard.targetAir ? 'Targets Air' : 'Ground Only');
      if (parts.length) hints.push(parts.join(' • '));
    }
    // After 5 guesses: attack speed + release year
    if (g >= 5) {
      const parts: string[] = [];
      if (targetCard.attackSpeed) parts.push(`${targetCard.attackSpeed.replace('-', ' ')} speed`);
      if (targetCard.release_date) parts.push(`Released ${targetCard.release_date.slice(0, 4)}`);
      if (parts.length) hints.push(parts.join(' • '));
    }
    return hints;
  };

  // Current blur and scale based on step
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
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm hidden sm:inline">
                GUESSES: <span className="text-white font-bold">{guesses.length}/{MAX_GUESSES}</span>
              </span>
              <button
                onClick={initGame}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-gray-900 font-bold rounded-lg hover:bg-amber-400 transition-colors text-sm border-2 border-amber-600 shadow-lg shadow-amber-900/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">New Game</span>
              </button>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
          {/* Game Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center px-6 py-3 bg-gray-900/80 border border-cyan-700/40 rounded-xl">
              <div className="text-2xl font-black text-amber-400">{guesses.length}/{MAX_GUESSES}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Guesses</div>
            </div>
            <div className="text-center px-6 py-3 bg-gray-900/80 border border-cyan-700/40 rounded-xl">
              <div className="text-2xl font-black text-cyan-400">{Math.round((step / MAX_GUESSES) * 100)}%</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Clarity</div>
            </div>
          </div>

          {/* Blurred Image Container */}
          <div className="flex justify-center mb-8">
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

          {/* Game Over State */}
          {gameOver && (
            <div className={`text-center mb-8 p-6 rounded-2xl border max-w-md mx-auto ${
              won
                ? 'bg-green-900/30 border-green-500/40'
                : 'bg-red-900/30 border-red-500/40'
            }`}>
              <div className={`text-4xl mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
                {won ? '🎉 Correct!' : '😔 Game Over'}
              </div>
              <div className="text-xl font-bold text-white mb-2">
                {targetCard && getCardNameTranslated(targetCard.id)}
              </div>
              {won && (
                <div className="text-sm text-green-300/80">
                  Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
                </div>
              )}
              <button
                onClick={initGame}
                className="mt-4 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold transition-all shadow-lg border-2 border-amber-600"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Search Input */}
          {!gameOver && (
            <div className="max-w-md mx-auto mb-8 mt-8">
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
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type at least 2 letters..."
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#0d3b4c]/90 border-2 border-cyan-700/50 text-white placeholder:text-gray-400 focus:outline-none focus:border-cyan-500 transition-all text-lg"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredCards.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0a2530] border border-cyan-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-80 overflow-y-auto">
                    {filteredCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleGuess(card)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-900/40 transition-colors text-left border-b border-cyan-800/30 last:border-b-0"
                      >
                        <img
                          src={getCardImageUrl(card)}
                          alt={card.name}
                          className="w-10 h-10 object-contain rounded-lg bg-gray-800/50"
                        />
                        <div>
                          <div className="font-semibold text-white">{getCardNameTranslated(card.id)}</div>
                          <div className="text-xs text-gray-400">{card.type} • {card.rarity}</div>
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
          <div className="mt-12 max-w-lg mx-auto text-center">
            <h3 className="text-lg font-bold text-amber-400 mb-4">How to Play</h3>
            <div className="text-sm text-gray-400 space-y-2 bg-gray-900/60 border border-gray-700/50 rounded-xl p-6">
              <p>🔍 A card image is hidden behind blur and zoom</p>
              <p>🎯 Try to guess which Clash Royale card it is</p>
              <p>✨ With each wrong guess, the image gets clearer and less zoomed</p>
              <p>🏆 You have {MAX_GUESSES} attempts to guess correctly!</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
