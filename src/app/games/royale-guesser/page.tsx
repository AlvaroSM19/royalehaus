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
  
  RARITIES.forEach(rarity => {
    conditions.push({ type: 'rarity', value: rarity, label: `${rarity} rarity` });
  });
  
  CARD_TYPES.forEach(cardType => {
    conditions.push({ type: 'cardType', value: cardType, label: `${cardType}` });
  });
  
  ELIXIR_COSTS.forEach(elixir => {
    conditions.push({ type: 'elixir', value: elixir, label: `${elixir} Elixir` });
  });
  
  ELIXIR_RANGES.forEach(range => {
    conditions.push({ type: 'elixirRange', value: range, label: range.label });
  });
  
  ATTACK_TYPES.forEach(attackType => {
    conditions.push({
      type: 'attackType',
      value: attackType,
      label: attackType === 'melee' ? 'Melee attack' : 'Ranged attack',
    });
  });
  
  conditions.push({ type: 'targetAir', value: true, label: 'Can target air' });
  conditions.push({ type: 'targetAir', value: false, label: 'Cannot target air' });
  
  ATTACK_SPEEDS.forEach(speed => {
    const speedLabels: Record<AttackSpeed, string> = {
      'very-fast': 'Very Fast attack',
      'fast': 'Fast attack',
      'medium': 'Medium attack',
      'slow': 'Slow attack',
      'very-slow': 'Very Slow attack',
    };
    conditions.push({ type: 'attackSpeed', value: speed, label: speedLabels[speed] });
  });
  
  conditions.push({ type: 'hasEvolution', value: true, label: 'Has Evolution' });
  conditions.push({ type: 'hasEvolution', value: false, label: 'No Evolution' });
  
  return conditions;
}

const ALL_CONDITIONS = generateAllConditions();

function cardMatchesCondition(card: ClashCard, condition: Condition): boolean {
  switch (condition.type) {
    case 'rarity': return card.rarity === condition.value;
    case 'cardType': return card.type === condition.value;
    case 'elixir': return card.elixir === condition.value;
    case 'elixirRange': {
      const range = condition.value as { min: number; max: number };
      return card.elixir >= range.min && card.elixir <= range.max;
    }
    case 'attackType': return card.attackType === condition.value;
    case 'targetAir': return card.targetAir === condition.value;
    case 'attackSpeed': return card.attackSpeed === condition.value;
    case 'hasEvolution': return card.evolution_available === condition.value;
    default: return false;
  }
}

function conditionsAreCompatible(conditions: Condition[]): boolean {
  const types = conditions.map(c => c.type);
  
  for (let i = 0; i < types.length; i++) {
    for (let j = i + 1; j < types.length; j++) {
      if (types[i] === types[j]) return false;
      if ((types[i] === 'elixir' && types[j] === 'elixirRange') ||
          (types[i] === 'elixirRange' && types[j] === 'elixir')) return false;
    }
  }
  
  const hasSpell = conditions.some(c => c.type === 'cardType' && c.value === 'Spell');
  const hasAttackType = conditions.some(c => c.type === 'attackType');
  const hasAttackSpeed = conditions.some(c => c.type === 'attackSpeed');
  const hasTargetAir = conditions.some(c => c.type === 'targetAir');
  
  if (hasSpell && (hasAttackType || hasAttackSpeed || hasTargetAir)) return false;
  
  return true;
}

function findMatchingCards(conditions: Condition[]): ClashCard[] {
  return baseCards.filter(card => 
    conditions.every(condition => cardMatchesCondition(card, condition))
  );
}

function generatePuzzle(): { conditions: Condition[]; matchingCards: ClashCard[] } | null {
  const maxAttempts = 500;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = [...ALL_CONDITIONS].sort(() => Math.random() - 0.5);
    const selectedConditions: Condition[] = [];
    
    for (const condition of shuffled) {
      if (selectedConditions.length >= 3) break;
      
      const testConditions = [...selectedConditions, condition];
      if (conditionsAreCompatible(testConditions)) {
        const matches = findMatchingCards(testConditions);
        if (matches.length > 0) {
          selectedConditions.push(condition);
        }
      }
    }
    
    if (selectedConditions.length === 3) {
      const matchingCards = findMatchingCards(selectedConditions);
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

  const getCardImageUrl = (card: ClashCard) => `/images/cards/${card.id}.webp`;

  const remainingCards = targetCards.filter(tc => !foundCards.some(fc => fc.id === tc.id));
  const maxWrongGuesses = 5;
  const wrongGuessesLeft = maxWrongGuesses - wrongGuesses.length;

  useEffect(() => {
    if (wrongGuesses.length >= maxWrongGuesses && !gameOver) {
      setGameOver(true);
    }
  }, [wrongGuesses.length, gameOver]);

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-slate-900/95 border-b border-amber-900/30 sticky top-0 z-20 backdrop-blur-sm">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <h1 className="text-base sm:text-lg md:text-xl font-black text-amber-400 tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              ROYALE GUESSER
            </h1>
            <button
              onClick={initGame}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 text-xs px-2 sm:px-3 py-1.5 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Game</span>
            </button>
          </div>
        </header>

        {/* Stats Panel */}
        <div 
          className="border-b border-amber-900/30"
          style={{
            background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.95) 0%, rgba(30, 25, 15, 0.98) 100%)',
          }}
        >
          <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <div 
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-[10px] sm:text-xs text-green-400/70 uppercase tracking-wide font-bold">Found</span>
              <span className="font-black text-lg sm:text-xl text-white">{foundCards.length}</span>
              <span className="text-green-400/60">/</span>
              <span className="text-cyan-400 text-sm font-bold">{targetCards.length}</span>
            </div>
            <div 
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
              }}
            >
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-[10px] sm:text-xs text-red-400/70 uppercase tracking-wide font-bold">Wrong</span>
              <span className="font-black text-lg sm:text-xl text-white">{wrongGuesses.length}</span>
              <span className="text-red-400/60">/</span>
              <span className="text-red-400 text-sm font-bold">{maxWrongGuesses}</span>
            </div>
          </div>
        </div>

        <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
          {/* Conditions Display Card */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div 
              className="relative w-full max-w-md rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                border: '2px solid rgba(60, 90, 140, 0.4)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header glow */}
              <div 
                className="absolute top-0 left-1/4 right-1/4 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.5), transparent)' }}
              />
              
              <div className="p-4 sm:p-6">
                <h2 className="text-sm sm:text-base font-black text-cyan-400 mb-4 text-center flex items-center justify-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  Find all matching cards
                </h2>
                
                <div className="space-y-2 sm:space-y-3">
                  {conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all"
                      style={{
                        background: 'linear-gradient(180deg, rgba(45, 35, 20, 0.6) 0%, rgba(30, 25, 15, 0.8) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      <span 
                        className="w-6 h-6 flex items-center justify-center rounded-full font-black text-xs"
                        style={{
                          background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                          color: '#1e293b',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm sm:text-base text-white font-bold">{condition.label}</span>
                    </div>
                  ))}
                </div>
                
                {/* Hint section */}
                <div className="h-px bg-slate-600/40 my-4" />
                
                {!showHint && !gameOver && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="w-full text-center text-xs sm:text-sm text-cyan-400/70 hover:text-cyan-400 transition-colors font-medium"
                  >
                    💡 Show hint: How many cards?
                  </button>
                )}
                {showHint && !gameOver && (
                  <div className="text-center text-sm sm:text-base font-bold animate-pulse"
                    style={{
                      background: 'linear-gradient(180deg, #fbbf24 0%, #d97706 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    ✨ There {targetCards.length === 1 ? 'is' : 'are'} {targetCards.length} card{targetCards.length !== 1 ? 's' : ''} to find!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Game Over Modal */}
          {gameOver && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
              <div 
                className="relative rounded-2xl sm:rounded-3xl max-w-lg w-full overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 15, 8, 0.98) 0%, rgba(35, 25, 12, 0.99) 50%, rgba(20, 15, 8, 0.98) 100%)',
                  border: '2px solid rgba(245, 180, 50, 0.7)',
                  boxShadow: '0 0 40px rgba(245, 180, 50, 0.3), 0 0 80px rgba(245, 158, 11, 0.15)',
                }}
              >
                {/* Decorative inner border */}
                <div className="absolute inset-1 sm:inset-2 rounded-xl border border-amber-500/30 pointer-events-none" />
                
                {/* Corner decorations */}
                <div className="hidden sm:block absolute top-3 left-3 w-12 h-12 border-l-4 border-t-4 border-amber-400/60" />
                <div className="hidden sm:block absolute top-3 right-3 w-12 h-12 border-r-4 border-t-4 border-amber-400/60" />
                <div className="hidden sm:block absolute bottom-3 left-3 w-12 h-12 border-l-4 border-b-4 border-amber-400/60" />
                <div className="hidden sm:block absolute bottom-3 right-3 w-12 h-12 border-r-4 border-b-4 border-amber-400/60" />

                <div className="relative p-6 sm:p-8 text-center">
                  {/* Result label */}
                  <div className="text-amber-400/80 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-2">
                    {won ? 'Perfect Score' : gaveUp ? 'Gave Up' : 'Game Over'}
                  </div>
                  
                  {/* Main result */}
                  <div 
                    className="text-5xl sm:text-6xl md:text-7xl font-black mb-2"
                    style={{
                      background: won 
                        ? 'linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)'
                        : 'linear-gradient(180deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {won ? '🎉' : '😔'}
                  </div>
                  
                  <div className="text-lg sm:text-xl md:text-2xl text-amber-400 font-black uppercase tracking-wider mb-4">
                    {won ? 'All Cards Found!' : 'Better Luck Next Time'}
                  </div>
                  
                  {won && (
                    <div 
                      className="inline-block px-4 py-1.5 rounded-full mb-4"
                      style={{
                        background: 'rgba(34, 211, 238, 0.2)',
                        border: '1px solid rgba(34, 211, 238, 0.4)',
                      }}
                    >
                      <span className="text-cyan-400 font-bold text-sm">
                        <Trophy className="w-4 h-4 inline mr-1" />
                        {foundCards.length} cards with {wrongGuesses.length} mistake{wrongGuesses.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  {/* Show missing cards if not won */}
                  {!won && remainingCards.length > 0 && (
                    <>
                      {/* Separator */}
                      <div className="flex items-center gap-2 my-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-amber-500/60" />
                        <span className="text-amber-500/60 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Missing Cards</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-500/40 to-amber-500/60" />
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {remainingCards.map(card => (
                          <div 
                            key={card.id} 
                            className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg"
                            style={{
                              background: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid rgba(100, 116, 139, 0.4)',
                            }}
                          >
                            <img
                              src={getCardImageUrl(card)}
                              alt={card.name}
                              className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                            />
                            <span className="text-xs sm:text-sm text-white font-medium">{getCardNameTranslated(card.id)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                    <button
                      onClick={initGame}
                      className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-gray-900 font-black rounded-xl hover:from-amber-400 hover:via-yellow-400 hover:to-amber-400 shadow-lg shadow-amber-500/30 uppercase tracking-wider px-6 sm:px-8 py-2.5 sm:py-3 transition-all active:scale-95"
                    >
                      Play Again
                    </button>
                    <Link
                      href="/"
                      className="bg-slate-800/80 text-slate-300 font-bold rounded-xl hover:bg-slate-700 border border-slate-600/50 uppercase tracking-wider px-6 sm:px-8 py-2.5 sm:py-3 text-center transition-all"
                    >
                      Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Input */}
          {!gameOver && (
            <div className="max-w-md mx-auto mb-6 sm:mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
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
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl text-white placeholder:text-slate-500 focus:outline-none transition-all text-sm sm:text-base font-medium"
                  style={{
                    background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                    border: '2px solid rgba(60, 90, 140, 0.4)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                  }}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && filteredCards.length > 0 && (
                  <div 
                    className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden max-h-72 sm:max-h-80 overflow-y-auto"
                    style={{
                      background: 'linear-gradient(180deg, rgba(15, 25, 40, 0.98) 0%, rgba(10, 18, 30, 0.99) 100%)',
                      border: '2px solid rgba(60, 90, 140, 0.5)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    {filteredCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleGuess(card)}
                        className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-cyan-900/40 transition-colors text-left border-b border-slate-700/30 last:border-b-0"
                      >
                        <img
                          src={getCardImageUrl(card)}
                          alt={card.name}
                          className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg bg-slate-800/50 p-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-sm sm:text-base truncate">{getCardNameTranslated(card.id)}</div>
                          <div className="text-[10px] sm:text-xs text-slate-400">{card.type} • {card.rarity}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Give Up Button */}
              <button
                onClick={handleGiveUp}
                className="mt-4 w-full text-center text-xs sm:text-sm text-slate-500 hover:text-red-400 transition-colors font-medium"
              >
                Give up and see answers
              </button>
            </div>
          )}

          {/* Found Cards Section */}
          {foundCards.length > 0 && !gameOver && (
            <div className="max-w-lg mx-auto mb-6">
              <h3 className="text-[10px] sm:text-xs font-extrabold text-green-400 uppercase tracking-[0.15em] mb-3 text-center flex items-center justify-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Found Cards
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {foundCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all"
                    style={{
                      background: 'linear-gradient(180deg, rgba(22, 101, 52, 0.4) 0%, rgba(20, 83, 45, 0.6) 100%)',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                    }}
                  >
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                    />
                    <span className="text-xs sm:text-sm font-bold text-green-300 truncate max-w-[80px] sm:max-w-none">
                      {getCardNameTranslated(card.id)}
                    </span>
                    <span className="text-xs sm:text-sm">✅</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wrong Guesses Section */}
          {wrongGuesses.length > 0 && !gameOver && (
            <div className="max-w-lg mx-auto mb-6">
              <h3 className="text-[10px] sm:text-xs font-extrabold text-red-400 uppercase tracking-[0.15em] mb-3 text-center flex items-center justify-center gap-2">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Wrong ({wrongGuessesLeft} left)
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
                {wrongGuesses.map((card, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all"
                    style={{
                      background: 'linear-gradient(180deg, rgba(127, 29, 29, 0.3) 0%, rgba(91, 33, 33, 0.4) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                    }}
                  >
                    <img
                      src={getCardImageUrl(card)}
                      alt={card.name}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded"
                    />
                    <span className="text-xs sm:text-sm font-bold text-red-300 truncate max-w-[80px] sm:max-w-none">
                      {getCardNameTranslated(card.id)}
                    </span>
                    <span className="text-xs sm:text-sm">❌</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to Play */}
          <div className="mt-8 sm:mt-12 max-w-lg mx-auto">
            <h3 className="text-sm sm:text-base font-black text-amber-400 mb-3 sm:mb-4 text-center flex items-center justify-center gap-2 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              How to Play
            </h3>
            <div 
              className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.6) 0%, rgba(15, 28, 50, 0.7) 100%)',
                border: '2px solid rgba(60, 90, 140, 0.3)',
              }}
            >
              <div className="text-xs sm:text-sm text-slate-300 space-y-2 sm:space-y-3">
                <p className="flex items-start gap-2">
                  <span className="text-amber-400">🎯</span>
                  <span>Read the 3 conditions shown above</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-cyan-400">🔍</span>
                  <span>Find ALL cards that match ALL conditions</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-400">✅</span>
                  <span>Correct guesses are marked green</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400">❌</span>
                  <span>You can only make {maxWrongGuesses} wrong guesses!</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-yellow-400">💡</span>
                  <span>Click &quot;Show hint&quot; to see how many cards</span>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Global Styles */}
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
