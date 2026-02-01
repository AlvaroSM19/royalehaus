'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard, RARITY_COLORS, CardType, CardRarity } from '@/types/card';
import { Home, RotateCcw, Search } from 'lucide-react';
import { recordRoyaledleSession } from '@/lib/progress';

type AttributeMatch = 'correct' | 'partial' | 'wrong';

type GuessResult = {
  card: ClashCard;
  matches: {
    name: AttributeMatch;
    elixir: AttributeMatch;
    type: AttributeMatch;
    rarity: AttributeMatch;
    year: AttributeMatch;
    evolution: AttributeMatch;
  };
  hints: {
    elixir: 'higher' | 'lower' | 'equal';
    year: 'higher' | 'lower' | 'equal';
  };
};

const MAX_GUESSES = 8;

export default function RoyaledlePage() {
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const initGame = useCallback(() => {
    const card = getRandomCard();
    setTargetCard(card);
    setGuesses([]);
    setSearchTerm('');
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const getYear = (dateString: string): number => {
    return new Date(dateString).getFullYear();
  };

  const compareCards = (guess: ClashCard, target: ClashCard): GuessResult => {
    const guessYear = getYear(guess.release_date);
    const targetYear = getYear(target.release_date);

    const baseTypes: CardType[] = ['Troop', 'Spell', 'Building'];
    const isGuessBaseType = baseTypes.includes(guess.type);
    const isTargetBaseType = baseTypes.includes(target.type);
    
    let typeMatch: AttributeMatch = 'wrong';
    if (guess.type === target.type) {
      typeMatch = 'correct';
    } else if (
      (isGuessBaseType && isTargetBaseType) || 
      (!isGuessBaseType && !isTargetBaseType)
    ) {
      typeMatch = 'partial';
    }

    const rarityOrder: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Champion', 'Heroic'];
    const guessRarityIdx = rarityOrder.indexOf(guess.rarity);
    const targetRarityIdx = rarityOrder.indexOf(target.rarity);
    let rarityMatch: AttributeMatch = 'wrong';
    if (guess.rarity === target.rarity) {
      rarityMatch = 'correct';
    } else if (Math.abs(guessRarityIdx - targetRarityIdx) === 1) {
      rarityMatch = 'partial';
    }

    return {
      card: guess,
      matches: {
        name: guess.name === target.name ? 'correct' : 'wrong',
        elixir: guess.elixir === target.elixir ? 'correct' : Math.abs(guess.elixir - target.elixir) === 1 ? 'partial' : 'wrong',
        type: typeMatch,
        rarity: rarityMatch,
        year: guessYear === targetYear ? 'correct' : Math.abs(guessYear - targetYear) <= 1 ? 'partial' : 'wrong',
        evolution: guess.evolution_available === target.evolution_available ? 'correct' : 'wrong',
      },
      hints: {
        elixir: guess.elixir === target.elixir ? 'equal' : guess.elixir > target.elixir ? 'lower' : 'higher',
        year: guessYear === targetYear ? 'equal' : guessYear > targetYear ? 'lower' : 'higher',
      },
    };
  };

  const handleGuess = (card: ClashCard) => {
    if (gameOver || !targetCard) return;
    if (guesses.some(g => g.card.id === card.id)) return;

    const result = compareCards(card, targetCard);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    setSearchTerm('');
    setShowSuggestions(false);

    const isWin = result.matches.name === 'correct';
    
    if (isWin || newGuesses.length >= MAX_GUESSES) {
      setGameOver(true);
      setWon(isWin);
      // Record session for XP
      recordRoyaledleSession(newGuesses.length, isWin);
    }
  };

  const filteredCards = baseCards
    .filter(card => 
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !guesses.some(g => g.card.id === card.id)
    )
    .slice(0, 8);

  const getMatchClass = (match: AttributeMatch) => {
    switch (match) {
      case 'correct':
        return 'bg-green-600 border-green-500';
      case 'partial':
        return 'bg-yellow-600 border-yellow-500';
      default:
        return 'bg-red-600/80 border-red-500';
    }
  };

  const getArrow = (hint: 'higher' | 'lower' | 'equal') => {
    if (hint === 'higher') return '↑';
    if (hint === 'lower') return '↓';
    return '';
  };

  return (
    <div className="min-h-screen relative">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header Banner */}
        <div className="bg-gray-900/90 border-b border-gray-700/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <span className="text-gray-600">/</span>
              <h1 className="text-xl font-black text-yellow-400 tracking-wide">ROYALEDLE</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400 text-sm">
                ATTEMPTS: <span className="text-white font-bold">{guesses.length}</span>
              </span>
              <button
                onClick={initGame}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors text-sm border-2 border-amber-500"
              >
                <RotateCcw className="w-4 h-4" />
                New Game
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-green-400">Match</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-yellow-400">Partial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-red-400">No Match</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="container mx-auto px-4 pb-8">
          {/* Search Input */}
          {!gameOver && (
            <div className="relative mb-8 max-w-3xl mx-auto">
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
                  placeholder="Type at least 2 letters..."
                  className="w-full pl-12 pr-4 py-4 bg-[#0d3b4c]/90 border-2 border-cyan-700/50 rounded-xl text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors text-lg"
                />
              </div>
              
              {showSuggestions && searchTerm.length >= 2 && filteredCards.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a2530] border border-cyan-700/50 rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto">
                  {filteredCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleGuess(card)}
                      className="w-full px-4 py-3 text-left hover:bg-cyan-900/50 transition-colors flex items-center gap-4 border-b border-cyan-800/30 last:border-0"
                    >
                      <img 
                        src={`/images/cards/${card.id}.png`}
                        alt={card.name}
                        className="w-10 h-12 object-cover rounded"
                      />
                      <span className="text-white font-medium text-lg">{card.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guesses */}
          <div className="space-y-3 max-w-4xl mx-auto">
            {guesses.map((guess, guessIndex) => (
              <div 
                key={guessIndex} 
                className="bg-[#0d3b4c]/80 backdrop-blur-sm rounded-xl p-3 border border-cyan-800/30"
              >
                <div className="flex items-center gap-2">
                  {/* Card Image */}
                  <div 
                    className="flex-shrink-0 w-12 h-[58px] rounded-lg overflow-hidden border-2 border-cyan-700/50"
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '0ms'
                    }}
                  >
                    <img 
                      src={`/images/cards/${guess.card.id}.png`}
                      alt={guess.card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Type */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.type)} border-2 rounded-lg p-3 text-center`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '100ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Type</div>
                    <div className="text-white font-bold text-sm">{guess.card.type}</div>
                  </div>

                  {/* Rarity */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.rarity)} border-2 rounded-lg p-3 text-center`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '200ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Rarity</div>
                    <div className="text-white font-bold text-sm">{guess.card.rarity}</div>
                  </div>

                  {/* Elixir */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.elixir)} border-2 rounded-lg p-3 text-center`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '300ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Elixir</div>
                    <div className="text-white font-bold text-sm flex items-center justify-center gap-1">
                      {guess.card.elixir}
                      <img src="/images/elixir.png" alt="elixir" className="w-4 h-4" />
                      <span className="text-white/70">{getArrow(guess.hints.elixir)}</span>
                    </div>
                  </div>

                  {/* Year */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.year)} border-2 rounded-lg p-3 text-center`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '400ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Year</div>
                    <div className="text-white font-bold text-sm flex items-center justify-center gap-1">
                      {getYear(guess.card.release_date)}
                      <span className="text-white/70">{getArrow(guess.hints.year)}</span>
                    </div>
                  </div>

                  {/* Evolution */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.evolution)} border-2 rounded-lg p-3 text-center`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '500ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[10px] text-white/70 uppercase tracking-wider mb-1">Evolution</div>
                    <div className="text-white font-bold text-sm">
                      {guess.card.evolution_available ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Game Over */}
          {gameOver && targetCard && (
            <div className={`max-w-md mx-auto mt-8 rounded-xl p-6 text-center ${won ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'}`}>
              {won ? (
                <>
                  <h2 className="text-2xl font-bold text-green-400 mb-2">Victory!</h2>
                  <p className="text-gray-300">
                    You found <span className="text-yellow-400 font-bold">{targetCard.name}</span> in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Game Over</h2>
                  <p className="text-gray-300 mb-3">
                    The card was <span className="text-yellow-400 font-bold">{targetCard.name}</span>
                  </p>
                  <div className="flex items-center justify-center">
                    <img 
                      src={`/images/cards/${targetCard.id}.png`}
                      alt={targetCard.name}
                      className="w-20 h-24 object-cover rounded-lg"
                    />
                  </div>
                </>
              )}
              
              <button
                onClick={initGame}
                className="mt-4 px-6 py-3 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors border-2 border-amber-500"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Remaining Guesses */}
          {!gameOver && (
            <div className="text-center text-gray-400 mt-6">
              {MAX_GUESSES - guesses.length} guesses remaining
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
