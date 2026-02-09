'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, TrendingUp, TrendingDown, Zap, Award, Calendar, Equal, Timer } from 'lucide-react'
import Link from 'next/link'
import { getRandomCard } from '@/data'
import type { ClashCard, AttackSpeed } from '@/types/card'
import { recordHigherLowerSession } from '@/lib/progress'

type CompareMode = 'elixir' | 'release_year' | 'attack_speed'

const ATTACK_SPEED_VALUES: Record<AttackSpeed, number> = {
  'very-fast': 5,
  'fast': 4,
  'medium': 3,
  'slow': 2,
  'very-slow': 1,
}

const ATTACK_SPEED_LABELS: Record<AttackSpeed, string> = {
  'very-fast': 'Very Fast',
  'fast': 'Fast',
  'medium': 'Medium',
  'slow': 'Slow',
  'very-slow': 'Very Slow',
}

export default function HigherLowerGame() {
  const [currentCard, setCurrentCard] = useState<ClashCard | null>(null)
  const [nextCard, setNextCard] = useState<ClashCard | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [compareMode, setCompareMode] = useState<CompareMode>('elixir')

  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-higherlower-highscore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  const initGame = useCallback(() => {
    // For attack_speed mode, filter cards that have an attackSpeed value
    const getValidCard = () => {
      let card = getRandomCard()
      if (compareMode === 'attack_speed') {
        while (!card.attackSpeed) {
          card = getRandomCard()
        }
      }
      return card
    }
    
    const card1 = getValidCard()
    let card2 = getValidCard()
    while (card2.id === card1.id) {
      card2 = getValidCard()
    }
    setCurrentCard(card1)
    setNextCard(card2)
    setScore(0)
    setStreak(0)
    setGameOver(false)
    setShowResult(false)
    setIsAnimating(false)
  }, [compareMode])

  useEffect(() => {
    initGame()
  }, [initGame])

  const getCompareValue = (card: ClashCard): number => {
    if (compareMode === 'elixir') {
      return card.elixir
    } else if (compareMode === 'attack_speed') {
      return card.attackSpeed ? ATTACK_SPEED_VALUES[card.attackSpeed] : 0
    } else {
      return new Date(card.release_date).getFullYear()
    }
  }

  const getDisplayValue = (card: ClashCard): string => {
    if (compareMode === 'attack_speed') {
      return card.attackSpeed ? ATTACK_SPEED_LABELS[card.attackSpeed] : 'N/A'
    }
    return getCompareValue(card).toString()
  }

  const handleGuess = (guess: 'higher' | 'lower' | 'equal') => {
    if (!currentCard || !nextCard || isAnimating || gameOver) return

    setIsAnimating(true)
    setShowResult(true)

    const currentValue = getCompareValue(currentCard)
    const nextValue = getCompareValue(nextCard)
    
    let isCorrect = false
    if (guess === 'higher') {
      isCorrect = nextValue > currentValue
    } else if (guess === 'lower') {
      isCorrect = nextValue < currentValue
    } else {
      isCorrect = nextValue === currentValue
    }

    setLastGuessCorrect(isCorrect)

    setTimeout(() => {
      if (isCorrect) {
        const newScore = score + 1
        const newStreak = streak + 1
        setScore(newScore)
        setStreak(newStreak)
        
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('royalehaus-higherlower-highscore', newScore.toString())
        }

        // Get new card that's valid for current compare mode
        let newCard = getRandomCard()
        while (newCard.id === nextCard.id || (compareMode === 'attack_speed' && !newCard.attackSpeed)) {
          newCard = getRandomCard()
        }
        
        setCurrentCard(nextCard)
        setNextCard(newCard)
        setShowResult(false)
      } else {
        setGameOver(true)
        // Record session for XP
        recordHigherLowerSession(streak)
      }
      setIsAnimating(false)
    }, 1500)
  }

  const currentValue = currentCard ? getCompareValue(currentCard) : 0
  const nextValue = nextCard ? getCompareValue(nextCard) : 0

  if (!currentCard || !nextCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50">
        <div className="text-2xl text-amber-200">Loading...</div>
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
              <h1 className="text-xl font-black text-yellow-400 tracking-wide">HIGHER OR LOWER</h1>
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
                <TrendingUp className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-400 text-sm">Best:</span>
                <span className="text-white font-bold">{highScore}</span>
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

        {/* Game Area */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center gap-6 max-w-6xl mx-auto">
            
            {/* Current Card */}
            <div className="flex-1 max-w-md">
              <div className="bg-gray-900/95 rounded-2xl border-2 border-gray-600 overflow-hidden shadow-2xl">
                {/* Card Image */}
                <div className="p-8 flex justify-center">
                  <div className="w-44 h-[211px] rounded-xl border-4 border-gray-500 overflow-hidden bg-gradient-to-b from-gray-700 to-gray-800 shadow-inner">
                    <img 
                      src={`/images/cards/${currentCard.id}.png`}
                      alt={currentCard.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Card Info */}
                <div className="bg-gray-800/80 p-6 text-center border-t border-gray-700">
                  <h3 className="text-2xl font-black text-yellow-400 mb-1">{currentCard.name}</h3>
                  <p className="text-red-400 text-sm uppercase tracking-widest font-semibold mb-5">{currentCard.type}</p>
                  
                  {/* Value */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className={`font-black text-cyan-400 ${compareMode === 'attack_speed' ? 'text-3xl' : 'text-5xl'}`}>{getDisplayValue(currentCard)}</span>
                    {compareMode === 'elixir' ? (
                      <img src="/images/elixir.png" alt="Elixir" className="w-10 h-10" />
                    ) : compareMode === 'attack_speed' ? (
                      <Timer className="w-8 h-8 text-cyan-400" />
                    ) : (
                      <Calendar className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{compareMode === 'elixir' ? 'Current Elixir' : compareMode === 'attack_speed' ? 'Attack Speed' : 'Release Year'}</p>
                </div>
              </div>
            </div>

            {/* Center - Buttons */}
            <div className="flex flex-col items-center gap-5 px-8">
              {/* Mode Selector */}
              <div className="flex flex-wrap gap-2 mb-2 justify-center">
                <button
                  onClick={() => { setCompareMode('elixir'); initGame() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm border-2 ${
                    compareMode === 'elixir'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <img src="/images/elixir.png" alt="Elixir" className="w-5 h-5" />
                  Elixir
                </button>
                <button
                  onClick={() => { setCompareMode('release_year'); initGame() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm border-2 ${
                    compareMode === 'release_year'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Year
                </button>
                <button
                  onClick={() => { setCompareMode('attack_speed'); initGame() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm border-2 ${
                    compareMode === 'attack_speed'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  Speed
                </button>
              </div>

              <p className="text-gray-300 text-center text-lg">
                Is the next card&apos;s {compareMode === 'elixir' ? 'elixir' : compareMode === 'attack_speed' ? 'attack speed' : 'release year'} <span className="text-yellow-400 font-bold">{compareMode === 'attack_speed' ? 'FASTER' : 'HIGHER'}</span> or <span className="text-red-400 font-bold">{compareMode === 'attack_speed' ? 'SLOWER' : 'LOWER'}</span>?
              </p>
              
              {!gameOver && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleGuess('higher')}
                      disabled={isAnimating}
                      className="w-44 flex items-center justify-center gap-3 px-8 py-4 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg border-2 border-amber-500 shadow-lg"
                    >
                      <TrendingUp className="w-6 h-6" />
                      {compareMode === 'attack_speed' ? 'Faster' : 'Higher'}
                    </button>
                    
                    <button
                      onClick={() => handleGuess('lower')}
                      disabled={isAnimating}
                      className="w-44 flex items-center justify-center gap-3 px-8 py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg border-2 border-red-600 shadow-lg"
                    >
                      <TrendingDown className="w-6 h-6" />
                      {compareMode === 'attack_speed' ? 'Slower' : 'Lower'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleGuess('equal')}
                    disabled={isAnimating}
                    className="w-44 flex items-center justify-center gap-3 px-8 py-4 bg-gray-700 text-white font-black rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg border-2 border-gray-500 shadow-lg"
                  >
                    <Equal className="w-6 h-6" />
                    Equal
                  </button>
                </div>
              )}

              {/* Result Feedback */}
              {showResult && !gameOver && (
                <div className={`text-3xl font-black ${
                  lastGuessCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastGuessCorrect ? 'CORRECT!' : 'WRONG!'}
                </div>
              )}
            </div>

            {/* Next Card */}
            <div className="flex-1 max-w-md">
              <div className={`bg-gray-900/95 rounded-2xl border-2 overflow-hidden shadow-2xl transition-all duration-300 ${
                showResult ? (lastGuessCorrect ? 'border-green-500' : 'border-red-500') : 'border-gray-600'
              }`}>
                {/* Card Image */}
                <div className="p-8 flex justify-center">
                  <div className="w-44 h-[211px] rounded-xl border-4 border-gray-500 overflow-hidden bg-gradient-to-b from-gray-700 to-gray-800 shadow-inner">
                    <img 
                      src={`/images/cards/${nextCard.id}.png`}
                      alt={nextCard.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Card Info */}
                <div className="bg-gray-800/80 p-6 text-center border-t border-gray-700">
                  <h3 className="text-2xl font-black text-yellow-400 mb-1">{nextCard.name}</h3>
                  <p className="text-red-400 text-sm uppercase tracking-widest font-semibold mb-5">{nextCard.type}</p>
                  
                  {/* Value - Hidden until revealed */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {showResult ? (
                      <>
                        <span className={`font-black text-cyan-400 ${compareMode === 'attack_speed' ? 'text-3xl' : 'text-5xl'}`}>{getDisplayValue(nextCard)}</span>
                        {compareMode === 'elixir' ? (
                          <img src="/images/elixir.png" alt="Elixir" className="w-10 h-10" />
                        ) : compareMode === 'attack_speed' ? (
                          <Timer className="w-8 h-8 text-cyan-400" />
                        ) : (
                          <Calendar className="w-8 h-8 text-cyan-400" />
                        )}
                      </>
                    ) : (
                      <span className="text-5xl font-black text-gray-600">???</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{compareMode === 'elixir' ? 'Next Elixir' : compareMode === 'attack_speed' ? 'Attack Speed' : 'Release Year'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-2xl border-2 border-amber-600 p-10 max-w-md text-center shadow-2xl">
              <h2 className="text-4xl font-black text-red-500 mb-6">GAME OVER</h2>
              <p className="text-gray-300 mb-2 text-lg">
                You scored
              </p>
              <p className="text-yellow-400 font-black text-5xl mb-4">{score}</p>
              {score === highScore && score > 0 && (
                <p className="text-green-400 font-bold mb-4 text-lg">New High Score!</p>
              )}
              <p className="text-gray-500 mb-8">
                {nextCard.name} has <span className="text-cyan-400 font-bold">{getDisplayValue(nextCard)}</span> {compareMode === 'elixir' ? 'elixir' : compareMode === 'attack_speed' ? 'attack speed' : 'release year'}
              </p>
              <button
                onClick={initGame}
                className="flex items-center justify-center gap-3 mx-auto px-10 py-4 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition-all text-lg border-2 border-amber-500"
              >
                <RotateCcw className="w-5 h-5" />
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
