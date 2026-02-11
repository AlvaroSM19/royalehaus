'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { baseCards } from '@/data';
import { ClashCard, CardType, CardRarity, AttackType, AttackSpeed } from '@/types/card';
import { Home, RotateCcw, Search, Trophy, HelpCircle, CheckCircle, XCircle, Target, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';

// Condition types that can be combined
interface Condition {
  type: 'rarity' | 'elixir' | 'cardType' | 'attackType' | 'targetAir' | 'attackSpeed' | 'hasEvolution' | 'elixirRange';
  value: string | number | boolean | { min: number; max: number };
  label: string;
}

// All possible conditions
const RARITIES: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Champion'];
const CARD_TYPES: CardType[] = ['Troop', 'Spell', 'Building', 'Champion'];
const ATTACK_TYPES: AttackType[] = ['melee', 'ranged'];
const ATTACK_SPEEDS: AttackSpeed[] = ['very-fast', 'fast', 'medium', 'slow', 'very-slow'];
const ELIXIR_COSTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ELIXIR_RANGES = [
  { min: 1, max: 3, label: '1-3 Elixir' },
  { min: 4, max: 6, label: '4-6 Elixir' },
  { min: 7, max: 10, label: '7+ Elixir' },
];

// Generate all possible conditions
function generateAllConditions(): Condition[] {
  const conditions: Condition[] = [];
  
  // Rarity conditions
  RARITIES.forEach(rarity => {
    conditions.push({
      type: 'rarity',
      value: rarity,
      label: `${rarity} rarity`,
    });
  });
  
  // Card type conditions
  CARD_TYPES.forEach(cardType => {
    conditions.push({
      type: 'cardType',
      value: cardType,
      label: `${cardType}`,
    });
  });
  
  // Elixir cost conditions
  ELIXIR_COSTS.forEach(elixir => {
    conditions.push({
      type: 'elixir',
      value: elixir,
      label: `${elixir} Elixir`,
    });
  });
  
  // Elixir range conditions
  ELIXIR_RANGES.forEach(range => {
    conditions.push({
      type: 'elixirRange',
      value: range,
      label: range.label,
    });
  });
  
  // Attack type conditions
  ATTACK_TYPES.forEach(attackType => {
    conditions.push({
      type: 'attackType',
      value: attackType,
      label: attackType === 'melee' ? 'Melee attack' : 'Ranged attack',
    });
  });
  
  // Target air conditions
  conditions.push({
    type: 'targetAir',
    value: true,
    label: 'Can target air',
  });
  conditions.push({
    type: 'targetAir',
    value: false,
    label: 'Cannot target air',
  });
  
  // Attack speed conditions
  ATTACK_SPEEDS.forEach(speed => {
    const speedLabels: Record<AttackSpeed, string> = {
      'very-fast': 'Very Fast attack',
      'fast': 'Fast attack',
      'medium': 'Medium attack',
      'slow': 'Slow attack',
      'very-slow': 'Very Slow attack',
    };
    conditions.push({
      type: 'attackSpeed',
      value: speed,
      label: speedLabels[speed],
    });
  });
  
  // Evolution conditions
  conditions.push({
    type: 'hasEvolution',
    value: true,
    label: 'Has Evolution',
  });
  conditions.push({
    type: 'hasEvolution',
    value: false,
    label: 'No Evolution',
  });
  
  return conditions;
}

const ALL_CONDITIONS = generateAllConditions();

// Check if a card matches a condition
function cardMatchesCondition(card: ClashCard, condition: Condition): boolean {
  switch (condition.type) {
    case 'rarity':
      return card.rarity === condition.value;
    case 'cardType':
      return card.type === condition.value;
    case 'elixir':
      return card.elixir === condition.value;
    case 'elixirRange': {
      const range = condition.value as { min: number; max: number };
      return card.elixir >= range.min && card.elixir <= range.max;
    }
    case 'attackType':
      return card.attackType === condition.value;
    case 'targetAir':
      return card.targetAir === condition.value;
    case 'attackSpeed':
      return card.attackSpeed === condition.value;
    case 'hasEvolution':
      return card.evolution_available === condition.value;
    default:
      return false;
  }
}

// Check if conditions are compatible (don't contradict each other)
function conditionsAreCompatible(conditions: Condition[]): boolean {
  const types = conditions.map(c => c.type);
  
  // Check for duplicate types (except elixir and elixirRange can coexist)
  for (let i = 0; i < types.length; i++) {
    for (let j = i + 1; j < types.length; j++) {
      if (types[i] === types[j]) {
        return false;
      }
      // elixir and elixirRange should not coexist
      if ((types[i] === 'elixir' && types[j] === 'elixirRange') ||
          (types[i] === 'elixirRange' && types[j] === 'elixir')) {
        return false;
      }
    }
  }
  
  // Check specific incompatibilities
  const hasSpell = conditions.some(c => c.type === 'cardType' && c.value === 'Spell');
  const hasAttackType = conditions.some(c => c.type === 'attackType');
  const hasAttackSpeed = conditions.some(c => c.type === 'attackSpeed');
  const hasTargetAir = conditions.some(c => c.type === 'targetAir');
  
  // Spells don't have attack properties
  if (hasSpell && (hasAttackType || hasAttackSpeed || hasTargetAir)) {
    return false;
  }
  
  return true;
}

// Find all cards matching all conditions
function findMatchingCards(conditions: Condition[]): ClashCard[] {
  return baseCards.filter(card => 
    conditions.every(condition => cardMatchesCondition(card, condition))
  );
}

// Generate a valid puzzle with 3 conditions
function generatePuzzle(): { conditions: Condition[]; matchingCards: ClashCard[] } | null {
  const maxAttempts = 500;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Shuffle conditions and pick 3 random ones
    const shuffled = [...ALL_CONDITIONS].sort(() => Math.random() - 0.5);
    const selectedConditions: Condition[] = [];
    
    for (const condition of shuffled) {
      if (selectedConditions.length >= 3) break;
      
      const testConditions = [...selectedConditions, condition];
      if (conditionsAreCompatible(testConditions)) {
        const matches = findMatchingCards(testConditions);
        // Only add if there are still possible matches
        if (matches.length > 0) {
          selectedConditions.push(condition);
        }
      }
    }
    
    if (selectedConditions.length === 3) {
      const matchingCards = findMatchingCards(selectedConditions);
      // Valid puzzle: 1-10 cards matching
      if (matchingCards.length >= 1 && matchingCards.length <= 10) {
        return { conditions: selectedConditions, matchingCards };
      }
    }
  }
  
  return null;
}

export default function RoyaleGuesserPage() {
  const { getCardNameTranslated } = useLanguage();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [targetCards, setTargetCards] = useState<ClashCard[]>([]);
  const [foundCards, setFoundCards] = useState<ClashCard[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState<ClashCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const initGame = useCallback(() => {
    const puzzle = generatePuzzle();
    if (puzzle) {
      setConditions(puzzle.conditions);
      setTargetCards(puzzle.matchingCards);
      setFoundCards([]);
      setWrongGuesses([]);
      setSearchTerm('');
      setGameOver(false);
      setWon(false);
      setShowHint(false);
      setGaveUp(false);
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const guessedCardIds = useMemo(() => {
    return new Set([...foundCards.map(c => c.id), ...wrongGuesses.map(c => c.id)]);
  }, [foundCards, wrongGuesses]);

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
    if (gameOver) return;
    
    setSearchTerm('');
    setShowSuggestions(false);
    
    const isCorrect = targetCards.some(tc => tc.id === card.id);
    
    if (isCorrect) {
      const newFoundCards = [...foundCards, card];
      setFoundCards(newFoundCards);
      
      // Check if all cards found
      if (newFoundCards.length === targetCards.length) {
        setWon(true);
        setGameOver(true);
      }
    } else {
      setWrongGuesses(prev => [...prev, card]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCards.length > 0 && searchTerm.length >= 2) {
      handleGuess(filteredCards[0]);
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    setGameOver(true);
  };

  const getCardImageUrl = (card: ClashCard) => {
    return `/images/cards/${card.id}.webp`;
  };

  const remainingCards = targetCards.filter(tc => !foundCards.some(fc => fc.id === tc.id));
  const maxWrongGuesses = 5;
  const wrongGuessesLeft = maxWrongGuesses - wrongGuesses.length;

  // End game if too many wrong guesses
  useEffect(() => {
    if (wrongGuesses.length >= maxWrongGuesses && !gameOver) {
      setGameOver(true);
    }
  }, [wrongGuesses.length, gameOver]);

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900/95 border-b border-amber-900/30 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 xs:gap-2 text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <Home className="w-4 h-4 xs:w-5 xs:h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden sm:inline">Home</span>
          </Link>
          <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-amber-400 flex items-center gap-1.5 xs:gap-2">
            <Target className="w-4 h-4 xs:w-5 xs:h-5 text-cyan-400" />
            <span>Royale Guesser</span>
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
        <div className="max-w-4xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-6">
          <div className="flex items-center gap-1.5 xs:gap-2 text-green-400 bg-slate-800/60 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg border border-green-500/20">
            <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            <span className="text-[10px] xs:text-xs text-green-400/70 uppercase tracking-wide">Found</span>
            <span className="font-bold text-sm xs:text-base sm:text-lg">{foundCards.length}/{targetCards.length}</span>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 text-red-400 bg-slate-800/60 px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-md xs:rounded-lg border border-red-500/20">
            <XCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
            <span className="text-[10px] xs:text-xs text-red-400/70 uppercase tracking-wide">Wrong</span>
            <span className="font-bold text-sm xs:text-base sm:text-lg">{wrongGuesses.length}/{maxWrongGuesses}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-2 xs:px-3 sm:px-4 py-4 xs:py-5 sm:py-6 md:py-8">
        {/* Conditions Display */}
        <div className="flex justify-center mb-4 xs:mb-5 sm:mb-6 md:mb-8">
          <div 
            className="w-full max-w-[320px] xs:max-w-[360px] sm:max-w-md md:max-w-lg p-4 xs:p-5 sm:p-6 rounded-xl xs:rounded-2xl border-2 border-cyan-500/30 shadow-2xl"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
            }}
          >
            <h2 className="text-sm xs:text-base sm:text-lg font-bold text-cyan-400 mb-3 xs:mb-4 text-center flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 xs:w-5 xs:h-5" />
              Find all cards that match:
            </h2>
            <div className="space-y-2 xs:space-y-3">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 xs:gap-3 px-3 xs:px-4 py-2 xs:py-3 rounded-lg xs:rounded-xl bg-slate-800/60 border border-amber-500/30"
                >
                  <span className="w-5 h-5 xs:w-6 xs:h-6 flex items-center justify-center rounded-full bg-amber-500 text-slate-900 font-bold text-xs xs:text-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm xs:text-base text-white font-medium">{condition.label}</span>
                </div>
              ))}
            </div>
            
            {/* Hint */}
            {!showHint && !gameOver && (
              <button
                onClick={() => setShowHint(true)}
                className="mt-3 xs:mt-4 w-full text-center text-xs xs:text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors"
              >
                Show hint: How many cards?
              </button>
            )}
            {showHint && !gameOver && (
              <div className="mt-3 xs:mt-4 text-center text-sm xs:text-base text-amber-300 font-medium animate-pulse">
                💡 There are {targetCards.length} card{targetCards.length !== 1 ? 's' : ''} to find!
              </div>
            )}
          </div>
        </div>

        {/* Game Over State */}
        {gameOver && (
          <div 
            className={`text-center mb-4 xs:mb-5 sm:mb-6 md:mb-8 p-3 xs:p-4 sm:p-5 md:p-6 rounded-xl xs:rounded-2xl border-2 w-full max-w-[320px] xs:max-w-sm sm:max-w-md md:max-w-lg mx-auto relative overflow-hidden ${
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

            <div className={`text-2xl xs:text-3xl sm:text-4xl mb-2 xs:mb-3 ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? '🎉 Perfect!' : gaveUp ? '😔 Gave Up' : '😔 Game Over'}
            </div>
            
            {won && (
              <div className="text-xs xs:text-sm text-green-300/80 flex items-center justify-center gap-1.5 xs:gap-2 mb-3 xs:mb-4">
                <Trophy className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                <span>Found all {targetCards.length} cards with {wrongGuesses.length} wrong guess{wrongGuesses.length !== 1 ? 'es' : ''}!</span>
              </div>
            )}
            
            {/* Show missing cards if not won */}
            {!won && remainingCards.length > 0 && (
              <div className="mb-3 xs:mb-4">
                <p className="text-xs xs:text-sm text-slate-400 mb-2">Missing cards:</p>
                <div className="flex flex-wrap justify-center gap-1.5 xs:gap-2">
                  {remainingCards.map(card => (
                    <div key={card.id} className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-3 py-1 xs:py-1.5 rounded-md xs:rounded-lg bg-slate-800/60 border border-slate-600/50">
                      <img
                        src={getCardImageUrl(card)}
                        alt={card.name}
                        className="w-6 h-6 xs:w-8 xs:h-8 object-contain rounded"
                      />
                      <span className="text-xs xs:text-sm text-white">{getCardNameTranslated(card.id)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={initGame}
              className="mt-2 xs:mt-3 px-4 xs:px-5 sm:px-6 py-2 xs:py-2.5 sm:py-3 rounded-lg xs:rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold text-sm xs:text-base transition-all hover:scale-105 shadow-lg hover:shadow-amber-500/30 border border-amber-400/50"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Search Input */}
        {!gameOver && (
          <div className="w-full max-w-[280px] xs:max-w-xs sm:max-w-sm md:max-w-md mx-auto mb-4 xs:mb-5 sm:mb-6">
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
                className="w-full pl-9 xs:pl-10 sm:pl-12 pr-3 xs:pr-4 py-2.5 xs:py-3 sm:py-3.5 rounded-lg xs:rounded-xl border-2 border-cyan-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm xs:text-base sm:text-lg"
                style={{
                  background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                }}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCards.length > 0 && (
                <div 
                  className="absolute z-50 w-full mt-1.5 xs:mt-2 border-2 border-cyan-700/50 rounded-lg xs:rounded-xl shadow-2xl shadow-black/50 overflow-hidden max-h-60 xs:max-h-72 sm:max-h-80 overflow-y-auto"
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
            
            {/* Give Up Button */}
            <button
              onClick={handleGiveUp}
              className="mt-3 xs:mt-4 w-full text-center text-xs xs:text-sm text-slate-500 hover:text-red-400 transition-colors"
            >
              Give up and see answers
            </button>
          </div>
        )}

        {/* Found Cards */}
        {foundCards.length > 0 && (
          <div className="w-full max-w-[320px] xs:max-w-sm sm:max-w-md md:max-w-lg mx-auto mb-4 xs:mb-5 sm:mb-6">
            <h3 className="text-xs xs:text-sm font-bold text-green-400 uppercase tracking-wide mb-2 xs:mb-3 text-center flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              Found Cards
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 xs:gap-2">
              {foundCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 rounded-md xs:rounded-lg border-2 bg-green-900/30 border-green-500/50"
                >
                  <img
                    src={getCardImageUrl(card)}
                    alt={card.name}
                    className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 object-contain rounded"
                  />
                  <span className="text-xs xs:text-sm font-medium text-green-300 truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">
                    {getCardNameTranslated(card.id)}
                  </span>
                  <span className="text-xs xs:text-sm">✅</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wrong Guesses */}
        {wrongGuesses.length > 0 && (
          <div className="w-full max-w-[320px] xs:max-w-sm sm:max-w-md md:max-w-lg mx-auto mb-4 xs:mb-5 sm:mb-6">
            <h3 className="text-xs xs:text-sm font-bold text-red-400 uppercase tracking-wide mb-2 xs:mb-3 text-center flex items-center justify-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              Wrong Guesses ({wrongGuessesLeft} left)
            </h3>
            <div className="flex flex-wrap justify-center gap-1.5 xs:gap-2">
              {wrongGuesses.map((card, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 xs:gap-2 px-2 xs:px-2.5 sm:px-3 py-1.5 xs:py-2 rounded-md xs:rounded-lg border-2 bg-slate-800/60 border-red-500/30"
                >
                  <img
                    src={getCardImageUrl(card)}
                    alt={card.name}
                    className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 object-contain rounded"
                  />
                  <span className="text-xs xs:text-sm font-medium text-red-300 truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">
                    {getCardNameTranslated(card.id)}
                  </span>
                  <span className="text-xs xs:text-sm">❌</span>
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
            <p>🎯 Read the 3 conditions shown above</p>
            <p>🔍 Find ALL cards that match ALL conditions</p>
            <p>✅ Correct guesses are marked green</p>
            <p>❌ You can only make {maxWrongGuesses} wrong guesses!</p>
            <p>💡 Click "Show hint" to see how many cards to find</p>
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
