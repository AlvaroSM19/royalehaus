'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard, RARITY_COLORS, CardType, CardRarity, AttackType, AttackSpeed } from '@/types/card';
import { Home, RotateCcw, Search } from 'lucide-react';
import { recordRoyaledleSession } from '@/lib/progress';
import { useLanguage } from '@/lib/useLanguage';

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
    attackType: AttributeMatch;
    targetAir: AttributeMatch;
    attackSpeed: AttributeMatch;
    heroMode: AttributeMatch;
  };
  hints: {
    elixir: 'higher' | 'lower' | 'equal';
    year: 'higher' | 'lower' | 'equal';
    attackSpeed: 'faster' | 'slower' | 'equal' | 'na';
  };
};

const MAX_GUESSES = 8;

export default function RoyaledlePage() {
  const { getCardNameTranslated } = useLanguage();
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

    // Attack Type comparison
    let attackTypeMatch: AttributeMatch = 'wrong';
    if (guess.attackType === target.attackType) {
      attackTypeMatch = 'correct';
    } else if (guess.attackType === null || target.attackType === null) {
      attackTypeMatch = 'wrong';
    }

    // Target Air comparison
    let targetAirMatch: AttributeMatch = 'wrong';
    if (guess.targetAir === target.targetAir) {
      targetAirMatch = 'correct';
    } else if (guess.targetAir === null || target.targetAir === null) {
      targetAirMatch = 'wrong';
    }

    // Attack Speed comparison
    const speedOrder: (AttackSpeed | null)[] = ['very-fast', 'fast', 'medium', 'slow', 'very-slow'];
    const guessSpeedIdx = guess.attackSpeed ? speedOrder.indexOf(guess.attackSpeed) : -1;
    const targetSpeedIdx = target.attackSpeed ? speedOrder.indexOf(target.attackSpeed) : -1;
    
    let attackSpeedMatch: AttributeMatch = 'wrong';
    let attackSpeedHint: 'faster' | 'slower' | 'equal' | 'na' = 'na';
    
    if (guess.attackSpeed === null && target.attackSpeed === null) {
      attackSpeedMatch = 'correct';
      attackSpeedHint = 'equal';
    } else if (guess.attackSpeed === null || target.attackSpeed === null) {
      attackSpeedMatch = 'wrong';
      attackSpeedHint = 'na';
    } else if (guess.attackSpeed === target.attackSpeed) {
      attackSpeedMatch = 'correct';
      attackSpeedHint = 'equal';
    } else if (Math.abs(guessSpeedIdx - targetSpeedIdx) === 1) {
      attackSpeedMatch = 'partial';
      attackSpeedHint = guessSpeedIdx > targetSpeedIdx ? 'faster' : 'slower';
    } else {
      attackSpeedHint = guessSpeedIdx > targetSpeedIdx ? 'faster' : 'slower';
    }

    // Hero Mode comparison
    let heroModeMatch: AttributeMatch = guess.hasHeroMode === target.hasHeroMode ? 'correct' : 'wrong';

    return {
      card: guess,
      matches: {
        name: guess.name === target.name ? 'correct' : 'wrong',
        elixir: guess.elixir === target.elixir ? 'correct' : Math.abs(guess.elixir - target.elixir) === 1 ? 'partial' : 'wrong',
        type: typeMatch,
        rarity: rarityMatch,
        year: guessYear === targetYear ? 'correct' : Math.abs(guessYear - targetYear) <= 1 ? 'partial' : 'wrong',
        evolution: guess.evolution_available === target.evolution_available ? 'correct' : 'wrong',
        attackType: attackTypeMatch,
        targetAir: targetAirMatch,
        attackSpeed: attackSpeedMatch,
        heroMode: heroModeMatch,
      },
      hints: {
        elixir: guess.elixir === target.elixir ? 'equal' : guess.elixir > target.elixir ? 'lower' : 'higher',
        year: guessYear === targetYear ? 'equal' : guessYear > targetYear ? 'lower' : 'higher',
        attackSpeed: attackSpeedHint,
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
      getCardNameTranslated(card.id).toLowerCase().includes(searchTerm.toLowerCase()) &&
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

  const getSpeedArrow = (hint: 'faster' | 'slower' | 'equal' | 'na') => {
    if (hint === 'faster') return '↑';
    if (hint === 'slower') return '↓';
    return '';
  };

  const formatAttackType = (type: string | null) => {
    if (type === null) return 'N/A';
    return type === 'melee' ? 'Melee' : 'Ranged';
  };

  const formatAttackSpeed = (speed: string | null) => {
    if (speed === null) return 'N/A';
    const labels: Record<string, string> = {
      'very-fast': 'V.Fast',
      'fast': 'Fast',
      'medium': 'Med',
      'slow': 'Slow',
      'very-slow': 'V.Slow'
    };
    return labels[speed] || speed;
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
                      e.preventDefault();
                      handleGuess(filteredCards[0]);
                    }
                  }}
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
                        alt={getCardNameTranslated(card.id)}
                        className="w-10 h-12 object-cover rounded"
                      />
                      <span className="text-white font-medium text-lg">{getCardNameTranslated(card.id)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guesses */}
          <div className="space-y-3 max-w-6xl mx-auto">
            {/* Header Row */}
            {guesses.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-3 text-xs text-gray-200 uppercase tracking-wider font-bold">
                <div className="w-12 flex-shrink-0"></div>
                <div className="flex-1 text-center">Type</div>
                <div className="flex-1 text-center">Rarity</div>
                <div className="flex-1 text-center">Elixir</div>
                <div className="flex-1 text-center">Year</div>
                <div className="flex-1 text-center">Evo</div>
                <div className="flex-1 text-center">Attack</div>
                <div className="flex-1 text-center min-w-[70px]">Air Target</div>
                <div className="flex-1 text-center">Speed</div>
                <div className="flex-1 text-center">Hero</div>
              </div>
            )}
            
            {guesses.map((guess, guessIndex) => (
              <div 
                key={guessIndex} 
                className="bg-[#0d3b4c]/80 backdrop-blur-sm rounded-xl p-2 border border-cyan-800/30"
              >
                <div className="flex items-center gap-1">
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
                      alt={getCardNameTranslated(guess.card.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Type */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.type)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '50ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Type</div>
                    <div className="text-white font-bold text-xs truncate">{guess.card.type}</div>
                  </div>

                  {/* Rarity */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.rarity)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '100ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Rarity</div>
                    <div className="text-white font-bold text-xs truncate">{guess.card.rarity}</div>
                  </div>

                  {/* Elixir */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.elixir)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '150ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Elixir</div>
                    <div className="text-white font-bold text-xs flex items-center justify-center gap-0.5">
                      {guess.card.elixir}
                      <img src="/images/elixir.png" alt="elixir" className="w-3 h-3" />
                      <span className="text-white/70">{getArrow(guess.hints.elixir)}</span>
                    </div>
                  </div>

                  {/* Year */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.year)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '200ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Year</div>
                    <div className="text-white font-bold text-xs flex items-center justify-center gap-0.5">
                      {getYear(guess.card.release_date)}
                      <span className="text-white/70">{getArrow(guess.hints.year)}</span>
                    </div>
                  </div>

                  {/* Evolution */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.evolution)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '250ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Evo</div>
                    <div className="text-white font-bold text-xs">
                      {guess.card.evolution_available ? '✓' : '✗'}
                    </div>
                  </div>

                  {/* Attack Type */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.attackType)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '300ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Attack</div>
                    <div className="text-white font-bold text-xs truncate">
                      {formatAttackType(guess.card.attackType)}
                    </div>
                  </div>

                  {/* Target Air */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.targetAir)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '350ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Air</div>
                    <div className="text-white font-bold text-xs">
                      {guess.card.targetAir === null ? 'N/A' : guess.card.targetAir ? '✓' : '✗'}
                    </div>
                  </div>

                  {/* Attack Speed */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.attackSpeed)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '400ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Speed</div>
                    <div className="text-white font-bold text-xs flex items-center justify-center gap-0.5">
                      {formatAttackSpeed(guess.card.attackSpeed)}
                      <span className="text-white/70">{getSpeedArrow(guess.hints.attackSpeed)}</span>
                    </div>
                  </div>

                  {/* Hero Mode */}
                  <div 
                    className={`flex-1 ${getMatchClass(guess.matches.heroMode)} border-2 rounded-lg p-2 text-center min-w-0`}
                    style={{ 
                      animation: `slideInLeft 0.3s ease-out forwards`,
                      animationDelay: '450ms',
                      opacity: 0
                    }}
                  >
                    <div className="text-[8px] text-white/70 uppercase tracking-wider sm:hidden">Hero</div>
                    <div className="text-white font-bold text-xs">
                      {guess.card.hasHeroMode ? '✓' : '✗'}
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
                    You found <span className="text-yellow-400 font-bold">{getCardNameTranslated(targetCard.id)}</span> in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Game Over</h2>
                  <p className="text-gray-300 mb-3">
                    The card was <span className="text-yellow-400 font-bold">{getCardNameTranslated(targetCard.id)}</span>
                  </p>
                  <div className="flex items-center justify-center">
                    <img 
                      src={`/images/cards/${targetCard.id}.png`}
                      alt={getCardNameTranslated(targetCard.id)}
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
