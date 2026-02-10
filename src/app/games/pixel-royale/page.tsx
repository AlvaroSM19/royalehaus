'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 6;
const GRID_SIZE = 8; // 8x8 grid
const TOTAL_TILES = GRID_SIZE * GRID_SIZE; // 64 tiles

// Calculate how many tiles to reveal per failed guess
const TILES_PER_REVEAL = Math.floor(TOTAL_TILES / (MAX_GUESSES + 1)); // ~9 tiles per guess

export default function PixelRoyalePage() {
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  
  // Track which tiles are revealed (indices 0-63 for 8x8 grid)
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  // Track newly revealed tiles for animation
  const [newlyRevealed, setNewlyRevealed] = useState<Set<number>>(new Set());

  // Generate random tiles to reveal
  const revealRandomTiles = useCallback((count: number, currentRevealed: Set<number>) => {
    const available = [];
    for (let i = 0; i < TOTAL_TILES; i++) {
      if (!currentRevealed.has(i)) {
        available.push(i);
      }
    }
    
    // Shuffle and pick
    const shuffled = available.sort(() => Math.random() - 0.5);
    const toReveal = shuffled.slice(0, Math.min(count, available.length));
    
    return new Set(toReveal);
  }, []);

  const initGame = useCallback(() => {
    const card = getRandomCard();
    setTargetCard(card);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowHint(false);
    setRevealedTiles(new Set());
    setNewlyRevealed(new Set());
  }, []);

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
      // Won! Reveal all tiles
      setRevealedTiles(new Set(Array.from({ length: TOTAL_TILES }, (_, i) => i)));
      setWon(true);
      setGameOver(true);
    } else {
      // Wrong guess - reveal more tiles
      const tilesToReveal = revealRandomTiles(TILES_PER_REVEAL, revealedTiles);
      setNewlyRevealed(tilesToReveal);
      setRevealedTiles(prev => {
        const next = new Set(prev);
        tilesToReveal.forEach(t => next.add(t));
        return next;
      });
      
      // Clear animation state after animation completes
      setTimeout(() => setNewlyRevealed(new Set()), 600);
      
      if (newGuesses.length >= MAX_GUESSES) {
        // Game over - reveal all after a delay
        setTimeout(() => {
          setRevealedTiles(new Set(Array.from({ length: TOTAL_TILES }, (_, i) => i)));
        }, 800);
        setGameOver(true);
      }
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

  const getHint = () => {
    if (!targetCard) return '';
    const hints = [];
    hints.push(`${targetCard.elixir} elixir`);
    hints.push(targetCard.type);
    hints.push(targetCard.rarity);
    return hints.join(' • ');
  };

  // Calculate revealed percentage
  const revealedPercent = Math.round((revealedTiles.size / TOTAL_TILES) * 100);

  return (
    <div className="min-h-screen relative bg-[#0a0a0a]">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0d1a24] via-[#0a1018] to-[#080808] pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Banner - Unified style */}
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
              <div className="text-2xl font-black text-cyan-400">{revealedPercent}%</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Revealed</div>
            </div>
          </div>

          {/* Grid Image Container */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div 
                className={`
                  w-48 h-48 md:w-64 md:h-64 lg:w-72 lg:h-72
                  rounded-2xl overflow-hidden
                  border-4 ${gameOver ? (won ? 'border-green-500' : 'border-red-500') : 'border-amber-500/50'}
                  shadow-2xl ${gameOver ? (won ? 'shadow-green-500/30' : 'shadow-red-500/30') : 'shadow-amber-500/20'}
                  bg-[#0d3b4c]/50
                  transition-all duration-500
                  relative
                `}
              >
                {/* Base Image (always rendered but covered by tiles) */}
                {targetCard && (
                  <img
                    src={getCardImageUrl(targetCard)}
                    alt="Mystery Clash Royale Card - Guess the pixelated card"
                    className="w-full h-full object-contain p-4 absolute inset-0"
                  />
                )}
                
                {/* Grid Overlay */}
                <div 
                  className="absolute inset-0 grid"
                  style={{
                    gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                    gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                  }}
                >
                  {Array.from({ length: TOTAL_TILES }).map((_, index) => {
                    const isRevealed = revealedTiles.has(index);
                    const isNew = newlyRevealed.has(index);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          transition-all duration-500 ease-out
                          ${isRevealed 
                            ? 'opacity-0 scale-90' 
                            : 'opacity-100 scale-100'
                          }
                          ${isNew ? 'animate-tile-reveal' : ''}
                        `}
                        style={{
                          backgroundColor: isRevealed ? 'transparent' : '#1a1a2e',
                          boxShadow: isRevealed ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                        }}
                      >
                        {/* Pixelated preview (subtle hint of color beneath) */}
                        {!isRevealed && (
                          <div 
                            className="w-full h-full"
                            style={{
                              backgroundColor: `hsl(${(index * 7) % 360}, 10%, 12%)`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
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
            <div className="text-center mb-6 text-amber-300 text-sm font-medium bg-amber-900/30 border border-amber-500/30 rounded-lg py-3 px-4 max-w-md mx-auto">
              💡 {getHint()}
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
              <div className="flex flex-wrap justify-center gap-2">
                {guesses.map((card, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      card.id === targetCard?.id
                        ? 'bg-green-900/40 border-green-500/50'
                        : 'bg-gray-900/60 border-red-500/30'
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
            <h3 className="text-lg font-bold text-amber-400 mb-4">How to Play</h3>
            <div className="text-sm text-gray-400 space-y-2 bg-gray-900/60 border border-gray-700/50 rounded-xl p-6">
              <p>🎨 A card image is hidden behind a mosaic grid</p>
              <p>🔍 Try to guess which Clash Royale card it is</p>
              <p>✨ With each wrong guess, tiles fade away to reveal the image</p>
              <p>🎯 You have {MAX_GUESSES} attempts to guess correctly!</p>
            </div>
          </div>
        </main>
      </div>
      
      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes tile-reveal {
          0% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
        
        .animate-tile-reveal {
          animation: tile-reveal 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
