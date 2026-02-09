'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { emojiRiddles } from '@/data/emoji-riddles';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 5;

export default function EmojiRiddlePage() {
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

  const initGame = useCallback(() => {
    // Get a card that has emojis defined
    const cardsWithEmojis = baseCards.filter(card => emojiRiddles[card.id]);
    const randomCard = cardsWithEmojis[Math.floor(Math.random() * cardsWithEmojis.length)];
    
    setTargetCard(randomCard);
    setEmojis(emojiRiddles[randomCard.id] || []);
    setRevealedCount(1);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowAnswer(false);
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
    } else {
      // Reveal one more emoji on wrong guess
      setRevealedCount(prev => Math.min(prev + 1, emojis.length));
      
      if (newGuesses.length >= MAX_GUESSES) {
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

  const displayedEmojis = useMemo(() => {
    return emojis.map((emoji, index) => ({
      emoji,
      revealed: index < revealedCount || gameOver,
    }));
  }, [emojis, revealedCount, gameOver]);

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
                <span>🔮</span> EMOJI RIDDLE
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
              <div className="text-2xl font-black text-cyan-400">{revealedCount}/{emojis.length}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Clues</div>
            </div>
          </div>

          {/* Emoji Display */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 p-6 md:p-8 rounded-2xl bg-[#0d3b4c]/50 border border-amber-500/30 shadow-2xl shadow-amber-900/20 max-w-lg">
              {displayedEmojis.map((item, index) => (
                <div
                  key={index}
                  className={`
                    w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24
                    flex items-center justify-center
                    rounded-xl
                    text-3xl md:text-4xl lg:text-5xl
                    transition-all duration-500
                    ${item.revealed 
                      ? 'bg-cyan-900/40 border border-cyan-500/40 shadow-lg shadow-cyan-500/20' 
                      : 'bg-gray-800/50 border border-gray-600/50'
                    }
                  `}
                >
                  {item.revealed ? (
                    <span className="transform transition-all duration-300 hover:scale-110">
                      {item.emoji}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-2xl md:text-3xl">❓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              <div className="flex items-center justify-center gap-4 mb-4">
                {targetCard && (
                  <>
                    <img
                      src={getCardImageUrl(targetCard)}
                      alt={targetCard.name}
                      className="w-16 h-16 object-contain rounded-lg bg-gray-800/50"
                    />
                    <div className="text-xl font-bold text-white">
                      {getCardNameTranslated(targetCard.id)}
                    </div>
                  </>
                )}
              </div>
              {won && (
                <div className="text-sm text-green-300/80">
                  Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'} with {revealedCount} {revealedCount === 1 ? 'clue' : 'clues'}!
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
            <div className="max-w-md mx-auto mb-8">
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
            <div className="max-w-md mx-auto mb-8">
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
              <p>🔮 A sequence of emojis represents a Clash Royale card</p>
              <p>🎯 Try to guess which card the emojis describe</p>
              <p>💡 Each wrong guess reveals another emoji clue</p>
              <p>✨ You have {MAX_GUESSES} attempts to guess correctly!</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
