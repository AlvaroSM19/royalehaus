'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { baseCards as allBaseCards, getCardsByAttackType, getCardsThatTargetAir } from '@/data';
import { ClashCard, CardType, CardRarity } from '@/types/card';
import { RotateCcw, Home, Clock, Award, Zap, Sparkles } from 'lucide-react';
import { recordImpostorSession } from '@/lib/progress';

// Filter out Hero and Tower Troop - only keep standard card types for clean gameplay
const gameCards = allBaseCards.filter(c => 
  c.type === 'Troop' || c.type === 'Spell' || c.type === 'Building' || c.type === 'Champion'
);

type GameMode = 'type' | 'rarity' | 'elixir' | 'releaseYear' | 'attackType' | 'targetAir';
type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_CONFIG = {
  easy: { cardCount: 4, timeLimit: 30 },
  medium: { cardCount: 5, timeLimit: 20 },
  hard: { cardCount: 6, timeLimit: 15 },
};

export default function ImpostorPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('type');
  const [cards, setCards] = useState<ClashCard[]>([]);
  const [impostorIndex, setImpostorIndex] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [conditionText, setConditionText] = useState('');
  const [showCondition, setShowCondition] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);
  const [lastImpostor, setLastImpostor] = useState<ClashCard | null>(null);
  const [lastCondition, setLastCondition] = useState('');
  const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastModeRef = useRef<GameMode | null>(null);
  const lastThemeRef = useRef<string | null>(null); // Track last theme to avoid repetition

  // Strict ambiguity check: no non-impostor card should be the ONLY one
  // with its type, rarity, or elixir. If a card is uniquely different in ANY
  // visible attribute, the user might pick it instead of the real impostor.
  const validateNoAmbiguity = useCallback((
    allCards: ClashCard[], 
    impIdx: number
  ): boolean => {
    for (let i = 0; i < allCards.length; i++) {
      if (i === impIdx) continue; // skip the actual impostor
      
      const card = allCards[i];
      
      // This card must NOT be the only one of its type
      const othersWithSameType = allCards.filter((c, j) => j !== i && c.type === card.type);
      if (othersWithSameType.length === 0) return false;
      
      // This card must NOT be the only one of its rarity
      const othersWithSameRarity = allCards.filter((c, j) => j !== i && c.rarity === card.rarity);
      if (othersWithSameRarity.length === 0) return false;
      
      // This card must NOT be the only one of its elixir cost
      const othersWithSameElixir = allCards.filter((c, j) => j !== i && c.elixir === card.elixir);
      if (othersWithSameElixir.length === 0) return false;
    }
    
    return true;
  }, []);

  const generateRound = useCallback(() => {
    if (!difficulty) return;
    
    const config = DIFFICULTY_CONFIG[difficulty];
    const needed = config.cardCount - 1; // majority cards needed
    
    // "Card attribute" modes (type/rarity) should not repeat consecutively
    // They feel similar: "All others are X" where X is a card property
    const lastWasCardAttribute = lastModeRef.current === 'type' || lastModeRef.current === 'rarity';
    
    // Build available modes with smart filtering
    let allModes: GameMode[] = ['type', 'rarity', 'elixir', 'releaseYear', 'attackType', 'targetAir'];
    
    // If last was type or rarity, exclude BOTH type and rarity from next round
    // This prevents "Champions" followed by "Epic" or similar
    if (lastWasCardAttribute) {
      allModes = allModes.filter(m => m !== 'type' && m !== 'rarity');
    } else {
      // Just exclude the exact last mode
      allModes = allModes.filter(m => m !== lastModeRef.current);
    }
    
    // Shuffle available modes
    const shuffledModes: GameMode[] = [...allModes].sort(() => Math.random() - 0.5);
    
    // Add fallback modes at the end (in case all preferred modes fail)
    const allPossibleModes: GameMode[] = ['type', 'rarity', 'elixir', 'releaseYear', 'attackType', 'targetAir'];
    const fallbackModes = allPossibleModes
      .filter(m => !shuffledModes.includes(m))
      .sort(() => Math.random() - 0.5);
    shuffledModes.push(...fallbackModes);
    
    let majorityCards: ClashCard[] = [];
    let impostor: ClashCard | null = null;
    let condition = '';
    let successMode: GameMode = 'type';

    const tryGenerateForMode = (mode: GameMode): { cards: ClashCard[], impIdx: number, cond: string } | null => {
      const MAX_ATTEMPTS = 20;
      
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let majCards: ClashCard[] = [];
        let imp: ClashCard | null = null;
        let cond = '';

        if (mode === 'type') {
          // TYPE mode: majority share same type, impostor different type
          // Exclude Champion type - too similar to rarity mode and confusing
          const types: CardType[] = ['Troop', 'Spell', 'Building'];
          const shuffledTypes = [...types].sort(() => Math.random() - 0.5);
          const majorityType = shuffledTypes[0];
          const impostorType = shuffledTypes[1];
          
          const pool = gameCards.filter(c => c.type === majorityType);
          if (pool.length < needed) continue;
          
          majCards = pool.sort(() => Math.random() - 0.5).slice(0, needed);
          
          const impPool = gameCards.filter(c => c.type === impostorType);
          if (impPool.length === 0) continue;
          imp = impPool[Math.floor(Math.random() * impPool.length)];
          cond = `All others are ${majorityType}s`;
        } 
        else if (mode === 'rarity') {
          // RARITY mode: use standard rarities only (no Champion - confusing with type)
          const rarities: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];
          const shuffledRarities = [...rarities].sort(() => Math.random() - 0.5);
          const majorityRarity = shuffledRarities[0];
          const impostorRarity = shuffledRarities[1];
          
          const pool = gameCards.filter(c => c.rarity === majorityRarity);
          if (pool.length < needed) continue;
          
          majCards = pool.sort(() => Math.random() - 0.5).slice(0, needed);
          
          const impPool = gameCards.filter(c => c.rarity === impostorRarity);
          if (impPool.length === 0) continue;
          imp = impPool[Math.floor(Math.random() * impPool.length)];
          cond = `All others are ${majorityRarity}`;
        }
        else if (mode === 'elixir') {
          // ELIXIR mode: use ALL card types
          const elixirGroups: { [key: number]: ClashCard[] } = {};
          gameCards.forEach(c => {
            if (!elixirGroups[c.elixir]) elixirGroups[c.elixir] = [];
            elixirGroups[c.elixir].push(c);
          });
          
          const validElixir = Object.entries(elixirGroups)
            .filter(([_, cards]) => cards.length >= needed)
            .map(([e]) => parseInt(e))
            .sort(() => Math.random() - 0.5);
          
          if (validElixir.length < 2) continue;
          
          const majorityElixir = validElixir[0];
          const impostorElixir = validElixir[1];
          
          majCards = elixirGroups[majorityElixir]
            .sort(() => Math.random() - 0.5).slice(0, needed);
          
          imp = elixirGroups[impostorElixir][
            Math.floor(Math.random() * elixirGroups[impostorElixir].length)
          ];
          cond = `All others cost ${majorityElixir} elixir`;
        }
        else if (mode === 'releaseYear') {
          // YEAR mode: use ALL card types
          const yearGroups: { [key: number]: ClashCard[] } = {};
          gameCards.forEach(c => {
            const year = parseInt(c.release_date.split('-')[0]);
            if (!yearGroups[year]) yearGroups[year] = [];
            yearGroups[year].push(c);
          });
          
          const validYears = Object.entries(yearGroups)
            .filter(([_, cards]) => cards.length >= needed)
            .map(([y]) => parseInt(y))
            .sort(() => Math.random() - 0.5);
          
          if (validYears.length < 2) continue;
          
          const majorityYear = validYears[0];
          const impostorYear = validYears[1];
          
          majCards = yearGroups[majorityYear]
            .sort(() => Math.random() - 0.5).slice(0, needed);
          
          imp = yearGroups[impostorYear][
            Math.floor(Math.random() * yearGroups[impostorYear].length)
          ];
          cond = `All others released in ${majorityYear}`;
        }
        else if (mode === 'attackType') {
          // ATTACK TYPE mode: melee vs ranged
          const attackTypes: ('melee' | 'ranged')[] = ['melee', 'ranged'];
          const shuffledTypes = [...attackTypes].sort(() => Math.random() - 0.5);
          const majorityAttackType = shuffledTypes[0];
          const impostorAttackType = shuffledTypes[1];
          
          const pool = getCardsByAttackType(majorityAttackType);
          if (pool.length < needed) continue;
          
          majCards = pool.sort(() => Math.random() - 0.5).slice(0, needed);
          
          const impPool = getCardsByAttackType(impostorAttackType);
          if (impPool.length === 0) continue;
          imp = impPool[Math.floor(Math.random() * impPool.length)];
          cond = `All others are ${majorityAttackType === 'melee' ? 'Melee' : 'Ranged'}`;
        }
        else if (mode === 'targetAir') {
          // TARGET AIR mode: can hit air vs ground-only
          const canHitAir = Math.random() > 0.5;
          
          const pool = getCardsThatTargetAir(canHitAir);
          if (pool.length < needed) continue;
          
          majCards = pool.sort(() => Math.random() - 0.5).slice(0, needed);
          
          const impPool = getCardsThatTargetAir(!canHitAir);
          if (impPool.length === 0) continue;
          imp = impPool[Math.floor(Math.random() * impPool.length)];
          cond = canHitAir ? 'All others can hit air' : 'All others are ground-only';
        }

        if (!imp || majCards.length < needed) continue;
        
        // Build the full card array and validate
        const allCards = [...majCards];
        const impIdx = Math.floor(Math.random() * config.cardCount);
        allCards.splice(impIdx, 0, imp);
        
        if (validateNoAmbiguity(allCards, impIdx)) {
          return { cards: allCards, impIdx, cond };
        }
      }
      
      return null;
    };

    // Try each mode in shuffled order until one succeeds
    let result: { cards: ClashCard[], impIdx: number, cond: string } | null = null;
    
    for (const mode of shuffledModes) {
      result = tryGenerateForMode(mode);
      if (result) {
        successMode = mode;
        break;
      }
    }
    
    // If all modes failed, use ultra-safe type fallback
    if (!result) {
      const troops = gameCards.filter(c => c.type === 'Troop');
      const spells = gameCards.filter(c => c.type === 'Spell');
      const maj = troops.sort(() => Math.random() - 0.5).slice(0, needed);
      const imp = spells[Math.floor(Math.random() * spells.length)];
      const all = [...maj];
      const idx = Math.floor(Math.random() * config.cardCount);
      all.splice(idx, 0, imp);
      
      result = { cards: all, impIdx: idx, cond: 'All others are Troops' };
      successMode = 'type';
    }

    lastModeRef.current = successMode;
    setGameMode(successMode);
    setCards(result.cards);
    setImpostorIndex(result.impIdx);
    setConditionText(result.cond);
    setSelectedIndex(null);
    setShowResult(false);
    setShowCondition(false);
    setTimeLeft(config.timeLimit);
  }, [difficulty, validateNoAmbiguity]);

  useEffect(() => {
    if (difficulty && gameActive && !showResult) {
      generateRound();
    }
  }, [difficulty, gameActive, generateRound, showResult]);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('royale-impostor-high-score');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  useEffect(() => {
    if (!gameActive || showResult || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSelect(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameActive, showResult, timeLeft]);

  // Cleanup auto-next timer on unmount
  useEffect(() => {
    return () => {
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
      }
    };
  }, []);

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setGameActive(true);
    setShowResult(false);
    setShowCondition(false);
    setSelectedIndex(null);
    setLastImpostor(null);
    setLastCondition('');
    setLastPoints(0);
    setCards([]);
    setImpostorIndex(0);
    setConditionText('');
    setTimeLeft(0);
  };

  const handleSelect = (index: number) => {
    if (showResult || !gameActive) return;
    
    setSelectedIndex(index);
    setShowResult(true);

    if (index === impostorIndex) {
      const points = Math.floor(100 * (timeLeft / DIFFICULTY_CONFIG[difficulty!].timeLimit)) + 50;
      const newScore = score + points;
      setScore(newScore);
      setStreak(prev => prev + 1);
      setLastPoints(points);
      setShowCondition(true);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('royale-impostor-high-score', newScore.toString());
      }

      // Auto-advance after 2.5 seconds
      autoNextTimerRef.current = setTimeout(() => {
        generateRound();
      }, 2500);
    } else {
      // Wrong answer - show Wrong for 2.5 seconds then game over
      setLastImpostor(cards[impostorIndex]);
      setLastCondition(conditionText);
      
      // Delay before showing Game Over screen
      autoNextTimerRef.current = setTimeout(() => {
        setGameActive(false);
        recordImpostorSession(streak, score);
      }, 2500);
    }
  };

  const resetGame = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }
    setDifficulty(null);
    setGameActive(false);
    setCards([]);
    setScore(0);
    setStreak(0);
  };

  const newGame = () => {
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }
    setScore(0);
    setStreak(0);
    setShowResult(false);
    setSelectedIndex(null);
    generateRound();
  };

  const formatTime = (seconds: number) => {
    return seconds.toString();
  };

  // Difficulty Selection
  if (!difficulty) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <div 
            className="rounded-3xl p-10 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 45, 60, 0.98) 0%, rgba(8, 30, 45, 0.99) 100%)',
              boxShadow: '0 0 60px rgba(0, 180, 220, 0.15), 0 20px 40px rgba(0,0,0,0.4)',
              border: '2px solid rgba(0, 180, 220, 0.3)'
            }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-20 h-20 border-l-3 border-t-3 border-cyan-400/40 rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-20 h-20 border-r-3 border-t-3 border-cyan-400/40 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-20 h-20 border-l-3 border-b-3 border-cyan-400/40 rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-r-3 border-b-3 border-cyan-400/40 rounded-br-3xl" />
            
            {/* Inner glow border */}
            <div className="absolute inset-2 rounded-2xl border border-cyan-500/20 pointer-events-none" />
            
            <h1 
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 mb-3 uppercase tracking-wider"
              style={{ 
                textShadow: '0 0 30px rgba(245, 180, 50, 0.4)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              IMPOSTOR
            </h1>
            <p className="text-cyan-400/80 mb-10 text-sm font-medium tracking-widest uppercase">Find the card that doesn&apos;t belong</p>
            
            <div className="space-y-4">
              <button
                onClick={() => startGame('easy')}
                className="w-full py-5 rounded-2xl transition-all transform hover:scale-[1.02] hover:-translate-y-1 relative group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(22, 163, 74, 0.95) 100%)',
                  boxShadow: '0 8px 30px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '2px solid rgba(74, 222, 128, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-white text-2xl font-black uppercase tracking-wider drop-shadow-lg">EASY</span>
                <span className="block text-green-100 text-sm font-bold mt-1 tracking-wide">4 CARDS • 30 SECONDS</span>
              </button>
              
              <button
                onClick={() => startGame('medium')}
                className="w-full py-5 rounded-2xl transition-all transform hover:scale-[1.02] hover:-translate-y-1 relative group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.95) 100%)',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '2px solid rgba(252, 211, 77, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-white text-2xl font-black uppercase tracking-wider drop-shadow-lg">MEDIUM</span>
                <span className="block text-amber-100 text-sm font-bold mt-1 tracking-wide">5 CARDS • 20 SECONDS</span>
              </button>
              
              <button
                onClick={() => startGame('hard')}
                className="w-full py-5 rounded-2xl transition-all transform hover:scale-[1.02] hover:-translate-y-1 relative group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(185, 28, 28, 0.95) 100%)',
                  boxShadow: '0 8px 30px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '2px solid rgba(252, 129, 129, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-white text-2xl font-black uppercase tracking-wider drop-shadow-lg">HARD</span>
                <span className="block text-red-100 text-sm font-bold mt-1 tracking-wide">6 CARDS • 15 SECONDS</span>
              </button>
            </div>
            
            {/* Home button */}
            <Link 
              href="/"
              className="inline-flex items-center gap-2 mt-8 text-cyan-400/70 hover:text-cyan-300 transition-colors text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Back to Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (!gameActive && (score > 0 || selectedIndex === -1 || lastImpostor)) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-xl w-full text-center">
          <div 
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(60, 20, 20, 0.98) 0%, rgba(40, 15, 15, 0.99) 100%)',
              boxShadow: '0 0 60px rgba(239, 68, 68, 0.2), 0 20px 40px rgba(0,0,0,0.4)',
              border: '2px solid rgba(239, 68, 68, 0.4)'
            }}
          >
            {/* Decorative inner border */}
            <div className="absolute inset-2 rounded-2xl border border-red-500/20 pointer-events-none" />
            
            <h2 
              className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 via-red-500 to-red-600 mb-6 uppercase tracking-wider"
              style={{ textShadow: '0 0 30px rgba(239, 68, 68, 0.4)' }}
            >
              GAME OVER
            </h2>
            
            {/* Show the impostor that was missed */}
            {lastImpostor && (
              <div 
                className="rounded-2xl p-4 mb-6 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(60, 40, 20, 0.6) 0%, rgba(40, 25, 10, 0.7) 100%)',
                  border: '2px solid rgba(245, 158, 11, 0.4)'
                }}
              >
                <div className="absolute inset-1 rounded-xl border border-amber-500/20 pointer-events-none" />
                <p className="text-amber-400 text-sm font-bold uppercase tracking-widest mb-3">The Impostor Was</p>
                <div className="flex items-center justify-center gap-4">
                  <div 
                    className="w-24 h-28 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(180deg, rgba(80, 50, 20, 0.5) 0%, rgba(60, 35, 15, 0.6) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.5)'
                    }}
                  >
                    <img 
                      src={`/images/cards/${lastImpostor.id}.png`}
                      alt={lastImpostor.name}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-xl font-black">{lastImpostor.name}</p>
                    <p className="text-cyan-400 text-sm font-medium mt-1">{lastCondition}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-center gap-8 mb-6">
              <div>
                <div className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">Streak</div>
                <div className="text-4xl font-black text-white">{streak}</div>
              </div>
              <div>
                <div className="text-amber-400/80 text-xs font-bold uppercase tracking-widest mb-1">Score</div>
                <div 
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500"
                >
                  {score.toLocaleString()}
                </div>
              </div>
            </div>
            
            {score >= highScore && (
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-500/20 border border-green-400/40 mb-6">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-black uppercase tracking-wider">New High Score!</span>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => startGame(difficulty)}
                className="w-full py-4 rounded-xl transition-all transform hover:scale-[1.02] font-black text-lg uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 1) 100%)',
                  boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                  border: '2px solid rgba(252, 211, 77, 0.5)',
                  color: '#1a1a1a'
                }}
              >
                Play Again
              </button>
              <button
                onClick={resetGame}
                className="w-full py-4 rounded-xl transition-all font-bold uppercase tracking-wider text-slate-300 hover:text-white"
                style={{
                  background: 'rgba(30, 30, 40, 0.6)',
                  border: '1px solid rgba(100, 100, 120, 0.3)'
                }}
              >
                Change Difficulty
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Top Stats Bar */}
        <div 
          className="border-b"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 25, 40, 0.98) 0%, rgba(10, 20, 35, 0.95) 100%)',
            borderColor: 'rgba(0, 150, 180, 0.2)'
          }}
        >
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-cyan-400/70 hover:text-cyan-300 transition-colors font-medium">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <div className="w-px h-6 bg-cyan-700/30" />
              <h1 
                className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 uppercase tracking-wider"
              >
                IMPOSTOR
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Score */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-bold uppercase tracking-wide">Score</span>
                <span className="text-white font-black text-lg">{score}</span>
              </div>
              
              {/* Streak */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-bold uppercase tracking-wide">Streak</span>
                <span className="text-white font-black text-lg">{streak}</span>
              </div>
              
              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg ${
                timeLeft <= 5 
                  ? 'bg-red-500/20 border border-red-500/50' 
                  : 'bg-slate-700/30 border border-slate-600/30'
              }`}>
                <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-400' : 'text-slate-400'}`} />
                <span className={`font-black text-2xl ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              {/* New Game */}
              <button
                onClick={newGame}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.95) 100%)',
                  border: '1px solid rgba(252, 211, 77, 0.4)',
                  color: '#1a1a1a'
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="container mx-auto px-4 py-8">
          {/* Title Box */}
          <div 
            className="rounded-2xl p-5 mb-10 text-center max-w-2xl mx-auto relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 60, 80, 0.95) 0%, rgba(10, 45, 60, 0.98) 100%)',
              boxShadow: '0 10px 40px rgba(0, 150, 180, 0.15)',
              border: '2px solid rgba(0, 180, 220, 0.3)'
            }}
          >
            <div className="absolute inset-1 rounded-xl border border-cyan-500/15 pointer-events-none" />
            <p 
              className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 uppercase tracking-wider"
              style={{ textShadow: '0 0 20px rgba(245, 180, 50, 0.3)' }}
            >
              Find the Impostor!
            </p>
            <p className="text-cyan-400 text-sm mt-2 font-medium tracking-wide">One card doesn&apos;t belong with the others</p>
          </div>

          {/* Cards Grid */}
          <div className="flex flex-wrap justify-center gap-5 mb-8">
            {cards.map((card, index) => {
              const isImpostor = index === impostorIndex;
              const isSelected = selectedIndex === index;
              const isCorrect = showResult && isImpostor;
              const isWrong = showResult && isSelected && !isImpostor;
              
              return (
                <button
                  key={card.id}
                  onClick={() => handleSelect(index)}
                  disabled={showResult}
                  className={`relative overflow-hidden rounded-2xl transition-all duration-300 transform ${
                    showResult && !isImpostor && !isSelected ? 'opacity-50 scale-95' : ''
                  } ${!showResult ? 'hover:scale-105 hover:-translate-y-2 cursor-pointer' : ''}`}
                  style={{ 
                    width: '170px',
                    background: isCorrect 
                      ? 'linear-gradient(180deg, rgba(60, 30, 15, 0.98) 0%, rgba(40, 20, 10, 0.99) 100%)'
                      : isWrong
                        ? 'linear-gradient(180deg, rgba(60, 25, 25, 0.98) 0%, rgba(40, 15, 15, 0.99) 100%)'
                        : 'linear-gradient(180deg, rgba(20, 50, 70, 0.95) 0%, rgba(15, 35, 50, 0.98) 100%)',
                    boxShadow: isCorrect 
                      ? '0 0 40px rgba(245, 158, 11, 0.5), 0 10px 30px rgba(0,0,0,0.4)'
                      : isWrong
                        ? '0 0 30px rgba(239, 68, 68, 0.4), 0 10px 30px rgba(0,0,0,0.4)'
                        : '0 10px 30px rgba(0,0,0,0.4)',
                    border: isCorrect 
                      ? '3px solid rgba(245, 158, 11, 0.8)'
                      : isWrong
                        ? '3px solid rgba(239, 68, 68, 0.6)'
                        : '2px solid rgba(0, 150, 180, 0.3)'
                  }}
                >
                  {/* Inner glow for correct */}
                  {isCorrect && (
                    <div className="absolute inset-1 rounded-xl border border-amber-400/30 pointer-events-none" />
                  )}
                  
                  {/* Card Image */}
                  <div 
                    className="aspect-[4/5] overflow-hidden p-3"
                    style={{
                      background: isCorrect 
                        ? 'linear-gradient(180deg, rgba(80, 50, 20, 0.3) 0%, rgba(60, 35, 15, 0.4) 100%)'
                        : 'linear-gradient(180deg, rgba(30, 60, 80, 0.3) 0%, rgba(20, 45, 65, 0.4) 100%)'
                    }}
                  >
                    <img 
                      src={`/images/cards/${card.id}.png`}
                      alt={card.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {/* Separator */}
                  <div className={`mx-3 h-px ${isCorrect ? 'bg-amber-500/40' : 'bg-cyan-600/30'}`} />
                  
                  {/* Card Name Label */}
                  <div className="py-3 px-2">
                    <span className={`text-sm font-bold truncate block text-center ${
                      isCorrect ? 'text-amber-400' : 'text-white'
                    }`}>
                      {card.name}
                    </span>
                  </div>
                  
                  {/* Impostor Badge */}
                  {showResult && isImpostor && (
                    <div 
                      className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide animate-pulse"
                      style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 1) 100%)',
                        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.5)',
                        color: '#1a1a1a'
                      }}
                    >
                      Impostor!
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className="text-center max-w-xl mx-auto">
              {selectedIndex === impostorIndex ? (
                <div 
                  className="rounded-2xl p-6 relative overflow-hidden animate-fadeIn"
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 60, 40, 0.95) 0%, rgba(15, 45, 30, 0.98) 100%)',
                    boxShadow: '0 10px 40px rgba(34, 197, 94, 0.2)',
                    border: '2px solid rgba(34, 197, 94, 0.4)'
                  }}
                >
                  <div className="absolute inset-1 rounded-xl border border-green-500/20 pointer-events-none" />
                  
                  <p className="text-green-400 font-black text-2xl uppercase tracking-wider mb-2">
                    Correct! <span className="text-amber-400">+{lastPoints}</span>
                  </p>
                  
                  {showCondition && (
                    <div className="mt-3 pt-3 border-t border-green-500/20">
                      <p className="text-cyan-400 text-lg font-bold">{conditionText}</p>
                      <p className="text-slate-400 text-sm mt-2">Next round starting...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="rounded-2xl p-6 relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(60, 20, 20, 0.95) 0%, rgba(40, 15, 15, 0.98) 100%)',
                    boxShadow: '0 10px 40px rgba(239, 68, 68, 0.2)',
                    border: '2px solid rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <div className="absolute inset-1 rounded-xl border border-red-500/20 pointer-events-none" />
                  
                  <p className="text-red-400 font-black text-2xl uppercase tracking-wider mb-2">
                    Wrong!
                  </p>
                  <p className="text-slate-300">
                    The impostor was <span className="text-amber-400 font-bold">{cards[impostorIndex]?.name}</span>
                  </p>
                  <p className="text-cyan-400 text-sm mt-2">{conditionText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
