'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { baseCards, getCardsByType, getCardsByRarity } from '@/data';
import { ClashCard, CardType, CardRarity } from '@/types/card';
import { RotateCcw, Home, Trophy, Target, Clock, Award, Zap, TrendingUp } from 'lucide-react';
import { recordImpostorSession } from '@/lib/progress';

type GameMode = 'type' | 'rarity' | 'elixir';
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
  const [hint, setHint] = useState('');

  const generateRound = useCallback(() => {
    if (!difficulty) return;
    
    const config = DIFFICULTY_CONFIG[difficulty];
    const mode = ['type', 'rarity', 'elixir'][Math.floor(Math.random() * 3)] as GameMode;
    setGameMode(mode);
    
    let majorityCards: ClashCard[] = [];
    let impostor: ClashCard | null = null;
    let hintText = '';

    if (mode === 'type') {
      const types: CardType[] = ['Troop', 'Spell', 'Building', 'Champion'];
      const majorityType = types[Math.floor(Math.random() * types.length)];
      const otherTypes = types.filter(t => t !== majorityType);
      const impostorType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
      
      majorityCards = getCardsByType(majorityType)
        .sort(() => Math.random() - 0.5)
        .slice(0, config.cardCount - 1);
      
      const impostorOptions = getCardsByType(impostorType);
      impostor = impostorOptions[Math.floor(Math.random() * impostorOptions.length)];
      hintText = majorityType + 's';
    } 
    else if (mode === 'rarity') {
      const rarities: CardRarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];
      const majorityRarity = rarities[Math.floor(Math.random() * rarities.length)];
      const otherRarities = rarities.filter(r => r !== majorityRarity);
      const impostorRarity = otherRarities[Math.floor(Math.random() * otherRarities.length)];
      
      majorityCards = getCardsByRarity(majorityRarity)
        .sort(() => Math.random() - 0.5)
        .slice(0, config.cardCount - 1);
      
      const impostorOptions = getCardsByRarity(impostorRarity);
      impostor = impostorOptions[Math.floor(Math.random() * impostorOptions.length)];
      hintText = majorityRarity + ' Cards';
    }
    else {
      const elixirCosts = [2, 3, 4, 5, 6];
      const majorityElixir = elixirCosts[Math.floor(Math.random() * elixirCosts.length)];
      const otherElixir = elixirCosts.filter(e => e !== majorityElixir);
      const impostorElixir = otherElixir[Math.floor(Math.random() * otherElixir.length)];
      
      majorityCards = baseCards
        .filter(c => c.elixir === majorityElixir)
        .sort(() => Math.random() - 0.5)
        .slice(0, config.cardCount - 1);
      
      const impostorOptions = baseCards.filter(c => c.elixir === impostorElixir);
      impostor = impostorOptions[Math.floor(Math.random() * impostorOptions.length)];
      hintText = majorityElixir + ' Elixir Cards';
    }

    if (!impostor || majorityCards.length < config.cardCount - 1) {
      generateRound();
      return;
    }

    const allCards = [...majorityCards];
    const impIdx = Math.floor(Math.random() * config.cardCount);
    allCards.splice(impIdx, 0, impostor);
    
    setCards(allCards);
    setImpostorIndex(impIdx);
    setHint(hintText);
    setSelectedIndex(null);
    setShowResult(false);
    setTimeLeft(config.timeLimit);
  }, [difficulty]);

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

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setScore(0);
    setStreak(0);
    setGameActive(true);
  };

  const handleSelect = (index: number) => {
    if (showResult || !gameActive) return;
    
    setSelectedIndex(index);
    setShowResult(true);

    if (index === impostorIndex) {
      const points = Math.floor(100 * (timeLeft / DIFFICULTY_CONFIG[difficulty!].timeLimit));
      const newScore = score + points + 50;
      setScore(newScore);
      setStreak(prev => prev + 1);
      
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('royale-impostor-high-score', newScore.toString());
      }
    }
  };

  const nextRound = () => {
    if (selectedIndex !== impostorIndex) {
      setGameActive(false);
      // Record session for XP when game ends (wrong answer)
      recordImpostorSession(streak, score);
      return;
    }
    generateRound();
  };

  const resetGame = () => {
    setDifficulty(null);
    setGameActive(false);
    setCards([]);
    setScore(0);
    setStreak(0);
  };

  const newGame = () => {
    setScore(0);
    setStreak(0);
    generateRound();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Difficulty Selection
  if (!difficulty) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <div className="bg-[#0a2530]/80 backdrop-blur-md rounded-2xl p-10 border border-cyan-700/30 text-center shadow-2xl shadow-cyan-900/20">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 mb-3 tracking-widest uppercase drop-shadow-lg" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              IMPOSTOR
            </h1>
            <p className="text-gray-400 mb-10 text-sm tracking-wide">Find the card that doesn&apos;t belong</p>
            
            <div className="space-y-4">
              <button
                onClick={() => startGame('easy')}
                className="w-full py-4 bg-gradient-to-r from-green-600/90 to-green-500/90 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-xl transition-all shadow-lg border border-green-400/30 hover:border-green-300/50 hover:shadow-green-500/20 hover:shadow-xl uppercase tracking-wider"
              >
                Easy
                <span className="block text-xs font-normal opacity-80 mt-1">4 cards • 30 seconds</span>
              </button>
              <button
                onClick={() => startGame('medium')}
                className="w-full py-4 bg-gradient-to-r from-yellow-600/90 to-amber-500/90 hover:from-yellow-500 hover:to-amber-400 text-white font-bold rounded-xl transition-all shadow-lg border border-yellow-400/30 hover:border-yellow-300/50 hover:shadow-yellow-500/20 hover:shadow-xl uppercase tracking-wider"
              >
                Medium
                <span className="block text-xs font-normal opacity-80 mt-1">5 cards • 20 seconds</span>
              </button>
              <button
                onClick={() => startGame('hard')}
                className="w-full py-4 bg-gradient-to-r from-red-600/90 to-rose-500/90 hover:from-red-500 hover:to-rose-400 text-white font-bold rounded-xl transition-all shadow-lg border border-red-400/30 hover:border-red-300/50 hover:shadow-red-500/20 hover:shadow-xl uppercase tracking-wider"
              >
                Hard
                <span className="block text-xs font-normal opacity-80 mt-1">6 cards • 15 seconds</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (!gameActive && score > 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <div className="max-w-lg w-full text-center">
          <div className="bg-[#0a2530]/80 backdrop-blur-md rounded-2xl p-10 border border-red-600/30 shadow-2xl shadow-red-900/20">
            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-300 to-red-500 mb-4 tracking-widest uppercase">GAME OVER</h2>
            <p className="text-gray-400 mb-2">You reached streak <span className="text-cyan-400 font-bold">{streak}</span></p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300 mb-8">Score: {score}</p>
            
            {score >= highScore && (
              <p className="text-green-400 mb-6 font-semibold tracking-wide">NEW HIGH SCORE!</p>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => startGame(difficulty)}
                className="w-full py-4 bg-gradient-to-r from-yellow-500/90 to-amber-400/90 hover:from-yellow-400 hover:to-amber-300 text-blue-900 font-bold rounded-xl transition-all shadow-lg border border-yellow-300/30 uppercase tracking-wider"
              >
                Play Again
              </button>
              <button
                onClick={resetGame}
                className="w-full py-4 bg-[#0a2530]/80 hover:bg-[#0d3540] text-white font-bold rounded-xl transition-colors border border-cyan-700/30 uppercase tracking-wider"
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
        {/* Sub Header */}
        <div className="bg-gray-900/90 border-b border-gray-700/50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <span className="text-gray-600">/</span>
              <h1 className="text-xl font-black text-yellow-400 tracking-wide">IMPOSTOR</h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-400 text-sm">Score:</span>
                <span className="text-white font-bold">{score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-400 text-sm">Streak:</span>
                <span className="text-white font-bold">{streak}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className="text-gray-400 text-sm">Time:</span>
                <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</span>
              </div>
              <button
                onClick={newGame}
                className="flex items-center gap-2 px-4 py-2 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors text-sm border-2 border-amber-500"
              >
                <RotateCcw className="w-4 h-4" />
                New Game
              </button>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="container mx-auto px-4 py-8">
          {/* Hint Box */}
          <div className="bg-[#0d3b4c]/90 backdrop-blur-sm rounded-xl p-4 mb-8 border border-cyan-800/50 text-center max-w-2xl mx-auto">
            <p className="text-cyan-400 font-medium">Find the impostor among:</p>
            <p className="text-yellow-400 text-xl font-bold">{hint}</p>
          </div>

          {/* Cards Grid */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
          {cards.map((card, index) => (
            <button
              key={card.id}
              onClick={() => handleSelect(index)}
              disabled={showResult}
              className={`relative overflow-hidden rounded-xl transition-all transform hover:scale-105 ${
                showResult
                  ? index === impostorIndex
                    ? 'ring-4 ring-red-500 scale-105'
                    : selectedIndex === index
                      ? 'ring-4 ring-gray-500 opacity-70'
                      : 'opacity-70'
                  : 'hover:ring-2 hover:ring-yellow-400 cursor-pointer'
              }`}
              style={{ width: '160px' }}
            >
              {/* Card Image */}
              <div className="aspect-[5/6] bg-gradient-to-b from-blue-900/50 to-blue-950/50 border border-cyan-800/30 rounded-t-xl overflow-hidden">
                <img 
                  src={`/images/cards/${card.id}.png`}
                  alt={card.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Card Name Label */}
              <div className="bg-[#0d3b4c] py-2 px-1 border-t border-cyan-800/30">
                <span className="text-white text-sm font-medium truncate block text-center">{card.name}</span>
              </div>
              
              {/* Impostor Badge */}
              {showResult && index === impostorIndex && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Impostor!
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Result & Next */}
        {showResult && (
          <div className="text-center max-w-md mx-auto">
            {selectedIndex === impostorIndex ? (
              <div className="bg-[#0d3b4c]/90 backdrop-blur-sm rounded-xl p-4 border border-green-600/50 mb-4">
                <p className="text-green-400 font-bold text-lg">
                  Correct! +{Math.floor(100 * (timeLeft / DIFFICULTY_CONFIG[difficulty].timeLimit)) + 50} points
                </p>
              </div>
            ) : (
              <div className="bg-[#0d3b4c]/90 backdrop-blur-sm rounded-xl p-4 border border-red-600/50 mb-4">
                <p className="text-red-400 font-bold text-lg">
                  Wrong! The impostor was {cards[impostorIndex]?.name}
                </p>
              </div>
            )}
            
            <button
              onClick={nextRound}
              className="px-8 py-3 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors border-2 border-amber-500"
            >
              {selectedIndex === impostorIndex ? 'Next Round' : 'See Results'}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
