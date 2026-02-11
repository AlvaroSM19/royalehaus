'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { emojiRiddles } from '@/data/emoji-riddles';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Search, Sparkles, Trophy, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 5;

// Emojis that are considered "abstract" or attribute-based (not physical descriptors)
const ABSTRACT_EMOJIS = new Set([
  // Elemental/Effects
  '⚡', '🔥', '💨', '❄️', '🧊', '💥', '✨', '🌪️', '☁️', '🌊', '💎', '🔮', '🧪', '💢',
  // Numbers
  '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣',
  // Attributes
  '💪', '🏃', '💀', '👻', '🛡️', '⚔️', '🎯', '🔫', '🪓', '🗡️', '🔱',
  // Actions/States
  '🔄', '💊', '⏸️', '📈', '➡️',
  // Colors/Abstract
  '💙', '💜', '💚', '💖', '🟢', '🟣', '🟤', '🔵', '🟠', '🌑',
]);

// Emojis that directly describe physical appearance (key emojis - too obvious)
const KEY_EMOJIS = new Set([
  // Animals/Creatures (very descriptive)
  '🐷', '🐉', '🦇', '🐶', '🐦', '🐏', '🦅',
  // Character types
  '🧙‍♂️', '🧙‍♀️', '🧔', '👩', '👨', '👸', '🤖', '👺', '👿', '🦹‍♀️', '👼', '💂',
  '🏇', '👑', '👶', '🧊', '🎣',
  // Objects that define the card
  '🎈', '💣', '🛢️', '🛒', '🪵', '⚰️', '🏰', '⛏️',
]);

/**
 * Reorders emojis to make the riddle harder:
 * 1. Key/obvious emojis go to the end (positions 3+)
 * 2. Abstract/attribute emojis go first
 * 3. The most obvious emoji (usually position 0) is moved to last
 */
function reorderEmojisForDifficulty(emojis: string[]): string[] {
  if (emojis.length <= 2) return emojis;
  
  // Categorize emojis
  const keyEmojis: string[] = [];
  const abstractEmojis: string[] = [];
  const neutralEmojis: string[] = [];
  
  emojis.forEach((emoji, index) => {
    // First emoji is almost always the most obvious - treat as key
    if (index === 0 || KEY_EMOJIS.has(emoji)) {
      keyEmojis.push(emoji);
    } else if (ABSTRACT_EMOJIS.has(emoji)) {
      abstractEmojis.push(emoji);
    } else {
      neutralEmojis.push(emoji);
    }
  });
  
  // Shuffle within categories for variety
  const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);
  
  // Build new order: abstract first, then neutral, then key emojis last
  const reordered = [
    ...shuffle(abstractEmojis),
    ...shuffle(neutralEmojis),
    ...shuffle(keyEmojis),
  ];
  
  // Ensure we have all emojis (fallback if categorization missed some)
  if (reordered.length !== emojis.length) {
    return emojis; // Fallback to original order
  }
  
  return reordered;
}

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
  const [showBonusHint, setShowBonusHint] = useState(false);

  const initGame = useCallback(() => {
    // Get a card that has emojis defined
    const cardsWithEmojis = baseCards.filter(card => emojiRiddles[card.id]);
    const randomCard = cardsWithEmojis[Math.floor(Math.random() * cardsWithEmojis.length)];
    
    // Get original emojis and reorder for difficulty
    const originalEmojis = emojiRiddles[randomCard.id] || [];
    const reorderedEmojis = reorderEmojisForDifficulty(originalEmojis);
    
    setTargetCard(randomCard);
    setEmojis(reorderedEmojis);
    setRevealedCount(1);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
    setShowAnswer(false);
    setShowBonusHint(false);
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

  // Can request bonus hint after 2 guesses, reveals one extra emoji
  const canRequestBonusHint = !gameOver && guesses.length >= 2 && !showBonusHint && revealedCount < emojis.length;
  
  const handleBonusHint = () => {
    if (canRequestBonusHint) {
      setShowBonusHint(true);
      setRevealedCount(prev => Math.min(prev + 1, emojis.length));
    }
  };

  const displayedEmojis = useMemo(() => {
    return emojis.map((emoji, index) => ({
      emoji,
      revealed: index < revealedCount || gameOver,
      isKeyEmoji: KEY_EMOJIS.has(emoji) || index === emojis.length - 1, // Last emoji is usually the key
    }));
  }, [emojis, revealedCount, gameOver]);

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/95 border-b border-amber-900/30 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <Home size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden sm:inline">Home</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-amber-400 flex items-center gap-2">
            <span className="text-2xl">🔮</span>
            <span>Emoji Riddle</span>
          </h1>
          <button
            onClick={initGame}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 px-3 py-1.5 rounded-lg transition-all hover:scale-105 font-bold text-sm border border-amber-400/50"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">New Game</span>
          </button>
        </div>
      </header>

      {/* Stats Panel */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2 text-amber-400 bg-slate-800/60 px-4 py-2 rounded-lg border border-amber-500/20">
            <span className="text-xs text-amber-400/70 uppercase tracking-wide">Guesses</span>
            <span className="font-bold text-lg">{guesses.length}/{MAX_GUESSES}</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400 bg-slate-800/60 px-4 py-2 rounded-lg border border-cyan-500/20">
            <Sparkles size={16} />
            <span className="text-xs text-cyan-400/70 uppercase tracking-wide">Clues</span>
            <span className="font-bold text-lg">{revealedCount}/{emojis.length}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Emoji Display */}
        <div className="flex justify-center mb-8">
          <div 
            className="flex flex-wrap justify-center gap-3 md:gap-4 p-6 md:p-8 rounded-2xl border-2 border-amber-500/30 shadow-2xl max-w-lg"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
            }}
          >
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
                    ? item.isKeyEmoji 
                      ? 'bg-amber-900/40 border-2 border-amber-500/50 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                      : 'bg-cyan-900/40 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20' 
                    : 'bg-slate-800/60 border-2 border-slate-600/50'
                  }
                `}
              >
                {item.revealed ? (
                  <span className={`transform transition-all duration-300 hover:scale-110 ${
                    item.isKeyEmoji ? 'animate-pulse' : ''
                  }`}>
                    {item.emoji}
                  </span>
                ) : (
                  <span className="text-slate-500 text-2xl md:text-3xl">❓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Hint Button */}
        {canRequestBonusHint && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleBonusHint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 hover:from-amber-500/30 hover:to-amber-600/30 transition-all text-amber-300 text-sm font-semibold hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              Reveal Extra Clue
            </button>
          </div>
        )}
        
        {showBonusHint && !gameOver && (
          <div className="text-center mb-6 text-amber-300 text-xs font-medium bg-amber-900/20 border border-amber-500/20 rounded-lg py-2 px-4 max-w-md mx-auto animate-pulse">
            ✨ Bonus clue revealed!
          </div>
        )}

        {/* Game Over State */}
        {gameOver && (
          <div 
            className={`text-center mb-8 p-6 rounded-2xl border-2 max-w-md mx-auto relative overflow-hidden ${
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
            <div className={`absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
            <div className={`absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
            <div className={`absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>
            <div className={`absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 ${won ? 'border-green-400/60' : 'border-red-400/60'}`}></div>

            <div className={`text-4xl mb-2 ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? '🎉 Correct!' : '😔 Game Over'}
            </div>
            <div className="flex items-center justify-center gap-4 mb-4">
              {targetCard && (
                <>
                  <img
                    src={getCardImageUrl(targetCard)}
                    alt={targetCard.name}
                    className="w-16 h-16 object-contain rounded-lg bg-slate-800/50 p-1 border border-slate-600/50"
                  />
                  <div className="text-xl font-bold text-white">
                    {getCardNameTranslated(targetCard.id)}
                  </div>
                </>
              )}
            </div>
            {won && (
              <div className="text-sm text-green-300/80 flex items-center justify-center gap-2">
                <Trophy size={16} />
                Found in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'} with {revealedCount} {revealedCount === 1 ? 'clue' : 'clues'}!
              </div>
            )}
            <button
              onClick={initGame}
              className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold transition-all hover:scale-105 shadow-lg hover:shadow-amber-500/30 border border-amber-400/50"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Search Input */}
        {!gameOver && (
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
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
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-cyan-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-lg"
                style={{
                  background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                }}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCards.length > 0 && (
                <div 
                  className="absolute z-50 w-full mt-2 border-2 border-cyan-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-80 overflow-y-auto"
                  style={{
                    background: 'linear-gradient(145deg, rgba(15, 35, 55, 0.98) 0%, rgba(10, 25, 40, 0.99) 100%)',
                  }}
                >
                  {filteredCards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => handleGuess(card)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-900/40 transition-colors text-left border-b border-slate-700/30 last:border-b-0"
                    >
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-10 h-10 object-contain rounded-lg bg-slate-800/50 p-0.5"
                      />
                      <div>
                        <div className="font-semibold text-white">{getCardNameTranslated(card.id)}</div>
                        <div className="text-xs text-slate-400">{card.type} • {card.rarity}</div>
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
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-3 text-center">
              Previous Guesses
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {guesses.map((card, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    card.id === targetCard?.id
                      ? 'bg-green-900/30 border-green-500/50'
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
                  <span className="text-sm">
                    {card.id === targetCard?.id ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Play */}
        <div className="mt-12 max-w-lg mx-auto text-center">
          <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center justify-center gap-2">
            <HelpCircle size={20} />
            How to Play
          </h3>
          <div 
            className="text-sm text-slate-300 space-y-2 border-2 border-slate-700/50 rounded-xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.6) 0%, rgba(15, 28, 50, 0.7) 100%)',
            }}
          >
            <p>🔮 A sequence of emojis represents a Clash Royale card</p>
            <p>🧩 Abstract clues appear first, key hints come later</p>
            <p>💡 Each wrong guess reveals another emoji clue</p>
            <p>✨ After 2 guesses, you can request a bonus hint!</p>
            <p>🎯 You have {MAX_GUESSES} attempts to guess correctly!</p>
          </div>
        </div>
      </main>

      {/* Keyframes for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
