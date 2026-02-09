'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, Eye, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 6;
const BLUR_LEVELS = [40, 32, 24, 16, 8, 4, 0]; // Higher = more blurred

export default function PixelRoyalePage() {
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const currentBlur = useMemo(() => {
    const index = Math.min(guesses.length, BLUR_LEVELS.length - 1);
    return BLUR_LEVELS[index];
  }, [guesses.length]);

  const initGame = useCallback(() => {
    const card = getRandomCard();
    setTargetCard(card);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowHint(false);
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
      setWon(true);
      setGameOver(true);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-purple-900/95 via-fuchsia-900/95 to-purple-900/95 border-b border-purple-500/30 backdrop-blur-lg shadow-xl shadow-purple-900/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-600/50 hover:bg-slate-700/60 hover:border-purple-500/50 transition-all group"
              >
                <Home className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                <span className="text-sm font-medium text-slate-200 hidden sm:inline">Home</span>
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-purple-300 via-fuchsia-200 to-cyan-300 bg-clip-text text-transparent">
              🎨 PIXEL ROYALE
            </h1>
            <button
              onClick={initGame}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 border border-purple-400/30 transition-all shadow-lg shadow-purple-900/50"
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
            <div className="text-2xl font-black text-purple-300">{guesses.length}/{MAX_GUESSES}</div>
            <div className="text-xs text-purple-400/70 uppercase tracking-wide">Guesses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black text-cyan-300">{Math.round((1 - currentBlur / 40) * 100)}%</div>
            <div className="text-xs text-cyan-400/70 uppercase tracking-wide">Clarity</div>
          </div>
        </div>

        {/* Pixelated Image */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div 
              className={`
                w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80
                rounded-2xl overflow-hidden
                border-4 ${gameOver ? (won ? 'border-green-500' : 'border-red-500') : 'border-purple-500/50'}
                shadow-2xl ${gameOver ? (won ? 'shadow-green-500/30' : 'shadow-red-500/30') : 'shadow-purple-500/30'}
                bg-slate-800/50
                transition-all duration-500
              `}
            >
              {targetCard && (
                <img
                  src={getCardImageUrl(targetCard)}
                  alt="Mystery Card"
                  className="w-full h-full object-contain p-4 transition-all duration-700"
                  style={{
                    filter: gameOver ? 'blur(0px)' : `blur(${currentBlur}px)`,
                    imageRendering: currentBlur > 20 ? 'pixelated' : 'auto',
                  }}
                />
              )}
            </div>
            
            {/* Clarity indicator */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {BLUR_LEVELS.slice(0, -1).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < guesses.length
                      ? 'bg-purple-500 shadow-lg shadow-purple-500/50'
                      : 'bg-slate-700 border border-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Hint button */}
        {!gameOver && guesses.length >= 2 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600/30 border border-amber-500/40 hover:bg-amber-600/40 transition-all text-amber-200 text-sm font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          </div>
        )}
        
        {showHint && !gameOver && (
          <div className="text-center mb-6 text-amber-300 text-sm font-medium bg-amber-900/30 border border-amber-500/30 rounded-lg py-2 px-4 max-w-md mx-auto">
            💡 {getHint()}
          </div>
        )}

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
              className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 font-bold transition-all shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Search Input */}
        {!gameOver && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
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
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border border-purple-500/40 text-white placeholder:text-purple-300/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30 transition-all text-lg"
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCards.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800/95 border border-purple-500/40 rounded-xl shadow-2xl shadow-purple-900/50 overflow-hidden backdrop-blur-xl">
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleGuess(card)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-600/30 transition-colors text-left border-b border-purple-500/20 last:border-b-0"
                    >
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-10 h-10 object-contain rounded-lg bg-slate-700/50"
                      />
                      <div>
                        <div className="font-semibold text-white">{getCardNameTranslated(card.id)}</div>
                        <div className="text-xs text-purple-300/70">{card.type} • {card.rarity}</div>
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
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wide mb-3 text-center">
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
          <h3 className="text-lg font-bold text-purple-300 mb-4">How to Play</h3>
          <div className="text-sm text-purple-200/70 space-y-2">
            <p>🎨 A card image is shown heavily pixelated/blurred</p>
            <p>🔍 Try to guess which Clash Royale card it is</p>
            <p>✨ With each guess, the image becomes clearer</p>
            <p>🎯 You have {MAX_GUESSES} attempts to guess correctly!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
