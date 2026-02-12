'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { baseCards, getRandomCard } from '@/data';
import { ClashCard } from '@/types/card';
import { Home, RotateCcw, Trophy, Gamepad2, Delete, Sparkles, Droplets, Sword, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { RARITY_COLORS } from '@/types/card';
import { recordWordleSession } from '@/lib/progress';
import { useLanguage } from '@/lib/useLanguage';

const MAX_GUESSES = 8;
const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

export default function WordlePage() {
  const { getCardNameTranslated } = useLanguage();
  const [targetCard, setTargetCard] = useState<ClashCard | null>(null);
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});
  const [shake, setShake] = useState(false);
  const [revealRow, setRevealRow] = useState<number | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

  const initGame = useCallback(() => {
    // Get a random card with a name that's reasonable length (3-8 chars)
    let card = getRandomCard();
    let word = card.name.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Keep trying until we get a word of reasonable length
    while (word.length < 3 || word.length > 8) {
      card = getRandomCard();
      word = card.name.toUpperCase().replace(/[^A-Z]/g, '');
    }
    
    setTargetCard(card);
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setGameOver(false);
    setWon(false);
    setLetterStates({});
    setRevealRow(null);
    setIsRevealing(false);
  }, []);

  useEffect(() => {
    initGame();
    const savedScore = localStorage.getItem('royalehaus-wordle-score');
    const savedGames = localStorage.getItem('royalehaus-wordle-games');
    if (savedScore) setScore(parseInt(savedScore));
    if (savedGames) setGamesPlayed(parseInt(savedGames));
  }, [initGame]);

  const getLetterState = (letter: string, index: number, word: string): LetterState => {
    if (!targetWord) return 'empty';
    
    const upperLetter = letter.toUpperCase();
    const targetArray = targetWord.split('');
    const wordArray = word.toUpperCase().split('');
    
    // First check if it's in the correct position
    if (targetArray[index] === upperLetter) {
      return 'correct';
    }
    
    // Count occurrences in target
    const targetCount = targetArray.filter(l => l === upperLetter).length;
    
    // Count how many of this letter are already marked as correct
    let correctCount = 0;
    for (let i = 0; i < wordArray.length; i++) {
      if (wordArray[i] === upperLetter && targetArray[i] === upperLetter) {
        correctCount++;
      }
    }
    
    // Count how many of this letter before this index are marked as present
    let presentCount = 0;
    for (let i = 0; i < index; i++) {
      if (wordArray[i] === upperLetter && targetArray[i] !== upperLetter && targetArray.includes(upperLetter)) {
        presentCount++;
      }
    }
    
    // If there are still occurrences left, mark as present
    if (targetArray.includes(upperLetter) && correctCount + presentCount < targetCount) {
      return 'present';
    }
    
    return 'absent';
  };

  const updateLetterStates = (word: string) => {
    const newStates = { ...letterStates };
    
    for (let i = 0; i < word.length; i++) {
      const letter = word[i].toUpperCase();
      const state = getLetterState(letter, i, word);
      
      // Only upgrade state (absent -> present -> correct)
      if (!newStates[letter] || 
          (newStates[letter] === 'absent' && state !== 'absent') ||
          (newStates[letter] === 'present' && state === 'correct')) {
        newStates[letter] = state;
      }
    }
    
    setLetterStates(newStates);
  };

  const handleKeyPress = (key: string) => {
    if (gameOver || isRevealing) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== targetWord.length) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const submittedGuess = currentGuess;
      const newGuesses = [...guesses, submittedGuess];
      setGuesses(newGuesses);
      setCurrentGuess('');
      setRevealRow(newGuesses.length - 1);
      setIsRevealing(true);
      updateLetterStates(submittedGuess);
      
      setTimeout(() => {
        setRevealRow(null);
        setIsRevealing(false);
        
        if (submittedGuess.toUpperCase() === targetWord) {
          setWon(true);
          setGameOver(true);
          const newScore = score + 1;
          const newGames = gamesPlayed + 1;
          setScore(newScore);
          setGamesPlayed(newGames);
          localStorage.setItem('royalehaus-wordle-score', newScore.toString());
          localStorage.setItem('royalehaus-wordle-games', newGames.toString());
          // Record session for XP
          recordWordleSession(true, newGuesses.length, targetWord.length);
        } else if (newGuesses.length >= MAX_GUESSES) {
          setGameOver(true);
          const newGames = gamesPlayed + 1;
          setGamesPlayed(newGames);
          localStorage.setItem('royalehaus-wordle-games', newGames.toString());
          // Record session for XP (loss)
          recordWordleSession(false, newGuesses.length, targetWord.length);
        }
      }, targetWord.length * 150 + 300);
      
    } else if (key === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < targetWord.length) {
      setCurrentGuess(prev => prev + key);
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isRevealing) return;
      
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, targetWord, isRevealing, guesses]);

  const getKeyClass = (key: string) => {
    const state = letterStates[key];
    if (state === 'correct') return 'bg-green-600 border-green-500 text-white';
    if (state === 'present') return 'bg-yellow-600 border-yellow-500 text-white';
    if (state === 'absent') return 'bg-gray-700 border-gray-600 text-gray-400';
    return 'bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700';
  };

  const getCellClass = (letter: string, index: number, rowIndex: number, word: string) => {
    if (!letter) return 'bg-gray-900/80 border-gray-700';
    
    // If this row is being revealed, add animation
    if (revealRow === rowIndex) {
      const state = getLetterState(letter, index, word);
      const delay = index * 150;
      return `animate-flip ${state === 'correct' ? 'bg-green-600 border-green-500' : state === 'present' ? 'bg-yellow-600 border-yellow-500' : 'bg-gray-700 border-gray-600'}`;
    }
    
    // Already guessed rows
    if (rowIndex < guesses.length) {
      const state = getLetterState(letter, index, word);
      if (state === 'correct') return 'bg-green-600 border-green-500';
      if (state === 'present') return 'bg-yellow-600 border-yellow-500';
      return 'bg-gray-700 border-gray-600';
    }
    
    // Current row being typed
    return 'bg-gray-900/80 border-gray-500';
  };

  return (
    <div className="min-h-screen relative">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gray-900/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3">
            {/* Mobile Layout */}
            <div className="flex flex-col gap-2 sm:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    <Home className="w-4 h-4" />
                  </Link>
                  <h1 className="text-lg font-black text-yellow-400 tracking-wide">ROYALE WORDLE</h1>
                </div>
                <button
                  onClick={initGame}
                  className="flex items-center gap-1 px-2 py-1.5 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors text-xs border-2 border-amber-500"
                >
                  <RotateCcw className="w-3 h-3" />
                  New
                </button>
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-white font-bold text-sm">{score}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-white font-bold text-sm">{gamesPlayed}</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
                <h1 className="text-xl font-black text-yellow-400 tracking-wide">ROYALE WORDLE</h1>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-400 text-sm">Score:</span>
                  <span className="text-white font-bold">{score}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-400 text-sm">Games:</span>
                  <span className="text-white font-bold">{gamesPlayed}</span>
                </div>
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
        </div>

        {/* Game Over Modal - Shows at top */}
        {gameOver && targetCard && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className={`max-w-md w-full rounded-2xl p-8 text-center ${won ? 'bg-gradient-to-b from-green-900/90 to-green-950/90 border-2 border-green-500' : 'bg-gradient-to-b from-red-900/90 to-red-950/90 border-2 border-red-500'}`}>
              {/* Card Image */}
              <div className="mb-6">
                <img 
                  src={`/images/cards/${targetCard.id}.webp`}
                  alt={getCardNameTranslated(targetCard.id)}
                  className="w-24 h-[115px] object-cover mx-auto rounded-lg drop-shadow-2xl"
                />
              </div>
              
              {won ? (
                <>
                  <h2 className="text-3xl font-black text-green-400 mb-2 tracking-wide">VICTORY!</h2>
                  <p className="text-gray-300 text-lg">
                    You guessed <span className="text-yellow-400 font-bold">{getCardNameTranslated(targetCard.id)}</span>
                  </p>
                  <p className="text-gray-400 mt-1">in {guesses.length} {guesses.length === 1 ? 'try' : 'tries'}</p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-red-400 mb-2 tracking-wide">GAME OVER</h2>
                  <p className="text-gray-300 text-lg">
                    The word was <span className="text-yellow-400 font-bold">{getCardNameTranslated(targetCard.id)}</span>
                  </p>
                </>
              )}
              
              {/* Card Info */}
              <div className="flex items-center justify-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1">
                  <img src="/images/elixir.webp" alt="Clash Royale Elixir Cost" className="w-4 h-4" />
                  <span className="text-cyan-400 font-bold">{targetCard.elixir}</span>
                </span>
                <span className="text-gray-400">{targetCard.type}</span>
                <span style={{ color: RARITY_COLORS[targetCard.rarity]?.glow || '#fff' }}>{targetCard.rarity}</span>
              </div>
              
              <button
                onClick={initGame}
                className="mt-6 px-8 py-3 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors border-2 border-amber-500 text-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Game Area */}
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 flex flex-col items-center">
          {/* Hints Section */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            {/* Rarity Hint - Unlocks at 3 attempts */}
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
              guesses.length >= 3 
                ? 'bg-purple-900/50 border-purple-500' 
                : 'bg-gray-900/50 border-gray-700'
            }`}>
              <Sparkles className={`w-3 h-3 sm:w-4 sm:h-4 ${guesses.length >= 3 ? 'text-purple-400' : 'text-gray-600'}`} />
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Rarity</span>
              {guesses.length >= 3 && targetCard ? (
                <span className="font-bold text-sm sm:text-base" style={{ color: RARITY_COLORS[targetCard.rarity]?.glow || '#fff' }}>
                  {targetCard.rarity}
                </span>
              ) : (
                <span className="text-gray-600 text-[10px] sm:text-xs flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 3
                </span>
              )}
            </div>

            {/* Elixir Hint - Unlocks at 5 attempts */}
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
              guesses.length >= 5 
                ? 'bg-cyan-900/50 border-cyan-500' 
                : 'bg-gray-900/50 border-gray-700'
            }`}>
              <Droplets className={`w-3 h-3 sm:w-4 sm:h-4 ${guesses.length >= 5 ? 'text-cyan-400' : 'text-gray-600'}`} />
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Elixir</span>
              {guesses.length >= 5 && targetCard ? (
                <span className="font-bold text-cyan-400 flex items-center gap-1 text-sm sm:text-base">
                  {targetCard.elixir}
                  <img src="/images/elixir.webp" alt="Clash Royale Elixir Cost" className="w-3 h-3 sm:w-4 sm:h-4" />
                </span>
              ) : (
                <span className="text-gray-600 text-[10px] sm:text-xs flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 5
                </span>
              )}
            </div>

            {/* Type Hint - Unlocks at 7 attempts */}
            <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
              guesses.length >= 7 
                ? 'bg-amber-900/50 border-amber-500' 
                : 'bg-gray-900/50 border-gray-700'
            }`}>
              <Sword className={`w-3 h-3 sm:w-4 sm:h-4 ${guesses.length >= 7 ? 'text-amber-400' : 'text-gray-600'}`} />
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase">Type</span>
              {guesses.length >= 7 && targetCard ? (
                <span className="font-bold text-amber-400 text-sm sm:text-base">{targetCard.type}</span>
              ) : (
                <span className="text-gray-600 text-[10px] sm:text-xs flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 7
                </span>
              )}
            </div>
          </div>

          {/* Word Length */}
          <div className="text-gray-400 text-sm mb-4 flex items-center gap-2">
            <span className="bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
              {targetWord.length} letters
            </span>
          </div>

          {/* Grid */}
          <div className={`flex flex-col gap-2 mb-6 ${shake ? 'animate-shake' : ''}`}>
            {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
              const isCurrentRow = rowIndex === guesses.length;
              const word = rowIndex < guesses.length ? guesses[rowIndex] : isCurrentRow ? currentGuess : '';
              
              return (
                <div key={rowIndex} className="flex gap-2 justify-center">
                  {Array.from({ length: targetWord.length }).map((_, colIndex) => {
                    const letter = word[colIndex] || '';
                    
                    return (
                      <div
                        key={colIndex}
                        className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-xl md:text-2xl font-bold rounded-lg border-2 transition-all ${getCellClass(letter, colIndex, rowIndex, word)}`}
                        style={revealRow === rowIndex ? { animationDelay: `${colIndex * 150}ms` } : {}}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Keyboard */}
          <div className="flex flex-col gap-2">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1 justify-center">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    disabled={gameOver}
                    className={`${key === 'ENTER' || key === 'BACK' ? 'px-3 md:px-4 text-xs' : 'w-9 md:w-11'} h-12 md:h-14 rounded-lg border-2 font-bold transition-all ${getKeyClass(key)} disabled:opacity-50`}
                  >
                    {key === 'BACK' ? <Delete className="w-5 h-5 mx-auto" /> : key}
                  </button>
                ))}
              </div>
            ))}
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes flip {
          0% { transform: rotateX(0); }
          50% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        .animate-flip {
          animation: flip 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
