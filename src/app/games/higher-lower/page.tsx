'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, TrendingUp, TrendingDown, Zap, Award, Calendar, Equal, Timer, Sword } from 'lucide-react'
import Link from 'next/link'
import { getRandomCard } from '@/data'
import type { ClashCard, AttackSpeed } from '@/types/card'
import { recordHigherLowerSession } from '@/lib/progress'
import { useLanguage } from '@/lib/useLanguage'

type CompareMode = 'elixir' | 'release_year' | 'attack_speed' | 'damage'

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
  const { getCardNameTranslated } = useLanguage();
  const [currentCard, setCurrentCard] = useState<ClashCard | null>(null)
  const [nextCard, setNextCard] = useState<ClashCard | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [compareMode, setCompareMode] = useState<CompareMode>('damage')

  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-higherlower-highscore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  const initGame = useCallback(() => {
    // For attack_speed and damage modes, filter cards that have valid values
    const getValidCard = () => {
      let card = getRandomCard()
      if (compareMode === 'attack_speed') {
        while (!card.attackSpeed) {
          card = getRandomCard()
        }
      } else if (compareMode === 'damage') {
        while (!card.damage_lvl_11 || card.damage_lvl_11 === null) {
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
    } else if (compareMode === 'damage') {
      return card.damage_lvl_11 || 0
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
        while (newCard.id === nextCard.id || (compareMode === 'attack_speed' && !newCard.attackSpeed) || (compareMode === 'damage' && (!newCard.damage_lvl_11 || newCard.damage_lvl_11 === null))) {
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
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {/* Top row: Title and controls */}
            <div className="flex items-center justify-between mb-2 sm:mb-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs">
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <span className="text-gray-600 hidden xs:inline">/</span>
                <h1 className="text-sm sm:text-lg md:text-xl font-black text-yellow-400 tracking-wide">HIGHER LOWER</h1>
              </div>
              
              <button
                onClick={initGame}
                className="flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 bg-amber-400 text-gray-900 font-bold rounded-lg hover:bg-amber-300 transition-colors text-xs sm:text-sm border-2 border-amber-500"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">New Game</span>
              </button>
            </div>
            
            {/* Stats row */}
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="text-gray-400 text-[10px] sm:text-sm">Score:</span>
                <span className="text-white font-bold text-xs sm:text-base">{score}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="text-gray-400 text-[10px] sm:text-sm">Streak:</span>
                <span className="text-white font-bold text-xs sm:text-base">{streak}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
                <span className="text-gray-400 text-[10px] sm:text-sm">Best:</span>
                <span className="text-white font-bold text-xs sm:text-base">{highScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
          {/* Mode Selector - Mobile visible */}
          <div className="flex flex-wrap gap-2 mb-4 justify-center lg:hidden">
            <button
              onClick={() => { setCompareMode('damage'); initGame() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs border-2 ${
                compareMode === 'damage'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Sword className="w-3.5 h-3.5" />
              Damage
            </button>
            <button
              onClick={() => { setCompareMode('elixir'); initGame() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs border-2 ${
                compareMode === 'elixir'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <img src="/images/elixir.webp" alt="Elixir" className="w-4 h-4" />
              Elixir
            </button>
            <button
              onClick={() => { setCompareMode('release_year'); initGame() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs border-2 ${
                compareMode === 'release_year'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Year
            </button>
            <button
              onClick={() => { setCompareMode('attack_speed'); initGame() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs border-2 ${
                compareMode === 'attack_speed'
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              Speed
            </button>
          </div>

          {/* Cards Container - Stack on mobile, side by side on desktop */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 max-w-6xl mx-auto">
            
            {/* Current Card */}
            <div className="w-full max-w-[280px] sm:max-w-[320px] lg:flex-1 lg:max-w-md">
              <div className="bg-gray-900/95 rounded-xl sm:rounded-2xl border-2 border-gray-600 overflow-hidden shadow-2xl">
                {/* Card Image */}
                <div className="p-4 sm:p-8 flex justify-center">
                  <div className="w-28 h-[135px] sm:w-44 sm:h-[211px] rounded-lg sm:rounded-xl border-4 border-gray-500 overflow-hidden bg-gradient-to-b from-gray-700 to-gray-800 shadow-inner">
                    <img 
                      src={`/images/cards/${currentCard.id}.webp`}
                      alt={getCardNameTranslated(currentCard.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Card Info */}
                <div className="bg-gray-800/80 p-4 sm:p-6 text-center border-t border-gray-700">
                  <h3 className="text-lg sm:text-2xl font-black text-yellow-400 mb-1 truncate">{getCardNameTranslated(currentCard.id)}</h3>
                  <p className="text-red-400 text-[10px] sm:text-sm uppercase tracking-widest font-semibold mb-3 sm:mb-5">{currentCard.type}</p>
                  
                  {/* Value */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                    <span className={`font-black text-cyan-400 ${compareMode === 'attack_speed' ? 'text-xl sm:text-3xl' : 'text-3xl sm:text-5xl'}`}>{getDisplayValue(currentCard)}</span>
                    {compareMode === 'elixir' ? (
                      <img src="/images/elixir.webp" alt="Elixir" className="w-6 h-6 sm:w-10 sm:h-10" />
                    ) : compareMode === 'attack_speed' ? (
                      <Timer className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-400" />
                    ) : compareMode === 'damage' ? (
                      <Sword className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-400" />
                    ) : (
                      <Calendar className="w-5 h-5 sm:w-8 sm:h-8 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-gray-500 text-[10px] sm:text-sm">{compareMode === 'elixir' ? 'Current Elixir' : compareMode === 'attack_speed' ? 'Attack Speed' : compareMode === 'damage' ? 'Damage (Lvl 11)' : 'Release Year'}</p>
                </div>
              </div>
            </div>

            {/* Center - Buttons */}
            <div className="flex flex-col items-center gap-3 sm:gap-5 px-4 sm:px-8 order-first lg:order-none">
              {/* Mode Selector - Desktop only */}
              <div className="hidden lg:flex flex-wrap gap-2 mb-2 justify-center">
              <div className="flex flex-wrap gap-2 mb-2 justify-center">
                <button
                  onClick={() => { setCompareMode('damage'); initGame() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm border-2 ${
                    compareMode === 'damage'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <Sword className="w-4 h-4" />
                  Damage
                </button>
                <button
                  onClick={() => { setCompareMode('elixir'); initGame() }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all text-sm border-2 ${
                    compareMode === 'elixir'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700'
                  }`}
                >
                  <img src="/images/elixir.webp" alt="Elixir" className="w-5 h-5" />
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

              <p className="text-gray-300 text-center text-sm sm:text-base lg:text-lg px-2">
                Is the next card&apos;s {compareMode === 'elixir' ? 'elixir' : compareMode === 'attack_speed' ? 'attack speed' : compareMode === 'damage' ? 'damage' : 'release year'} <span className="text-yellow-400 font-bold">{compareMode === 'attack_speed' ? 'FASTER' : 'HIGHER'}</span> or <span className="text-red-400 font-bold">{compareMode === 'attack_speed' ? 'SLOWER' : 'LOWER'}</span>?
              </p>
              
              {!gameOver && (
                <div className="flex flex-col items-center gap-2 sm:gap-3">
                  <div className="flex gap-2 sm:gap-4">
                    <button
                      onClick={() => handleGuess('higher')}
                      disabled={isAnimating}
                      className="w-28 sm:w-36 lg:w-44 flex items-center justify-center gap-1 sm:gap-2 lg:gap-3 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-amber-400 text-gray-900 font-black rounded-lg sm:rounded-xl hover:bg-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg border-2 border-amber-500 shadow-lg"
                    >
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      {compareMode === 'attack_speed' ? 'Faster' : 'Higher'}
                    </button>
                    
                    <button
                      onClick={() => handleGuess('lower')}
                      disabled={isAnimating}
                      className="w-28 sm:w-36 lg:w-44 flex items-center justify-center gap-1 sm:gap-2 lg:gap-3 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-red-500 text-white font-black rounded-lg sm:rounded-xl hover:bg-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg border-2 border-red-600 shadow-lg"
                    >
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                      {compareMode === 'attack_speed' ? 'Slower' : 'Lower'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleGuess('equal')}
                    disabled={isAnimating}
                    className="w-28 sm:w-36 lg:w-44 flex items-center justify-center gap-1 sm:gap-2 lg:gap-3 px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gray-700 text-white font-black rounded-lg sm:rounded-xl hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg border-2 border-gray-500 shadow-lg"
                  >
                    <Equal className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    Equal
                  </button>
                </div>
              )}

              {/* Result Feedback */}
              {showResult && !gameOver && (
                <div className={`text-xl sm:text-2xl lg:text-3xl font-black ${
                  lastGuessCorrect ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastGuessCorrect ? 'CORRECT!' : 'WRONG!'}
                </div>
              )}
            </div>

            {/* Next Card */}
            <div className="flex-1 max-w-[280px] sm:max-w-[320px] lg:max-w-md">
              <div className={`bg-gray-900/95 rounded-xl sm:rounded-2xl border-2 overflow-hidden shadow-2xl transition-all duration-300 ${
                showResult ? (lastGuessCorrect ? 'border-green-500' : 'border-red-500') : 'border-gray-600'
              }`}>
                {/* Card Image */}
                <div className="p-3 sm:p-5 lg:p-8 flex justify-center">
                  <div className="w-28 h-[135px] sm:w-36 sm:h-[173px] lg:w-44 lg:h-[211px] rounded-lg sm:rounded-xl border-2 sm:border-4 border-gray-500 overflow-hidden bg-gradient-to-b from-gray-700 to-gray-800 shadow-inner">
                    <img 
                      src={`/images/cards/${nextCard.id}.webp`}
                      alt={getCardNameTranslated(nextCard.id)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Card Info */}
                <div className="bg-gray-800/80 p-3 sm:p-4 lg:p-6 text-center border-t border-gray-700">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-yellow-400 mb-1">{getCardNameTranslated(nextCard.id)}</h3>
                  <p className="text-red-400 text-xs sm:text-sm uppercase tracking-widest font-semibold mb-3 sm:mb-4 lg:mb-5">{nextCard.type}</p>
                  
                  {/* Value - Hidden until revealed */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
                    {showResult ? (
                      <>
                        <span className={`font-black text-cyan-400 ${compareMode === 'attack_speed' ? 'text-xl sm:text-2xl lg:text-3xl' : 'text-3xl sm:text-4xl lg:text-5xl'}`}>{getDisplayValue(nextCard)}</span>
                        {compareMode === 'elixir' ? (
                          <img src="/images/elixir.webp" alt="Elixir" className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                        ) : compareMode === 'attack_speed' ? (
                          <Timer className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400" />
                        ) : compareMode === 'damage' ? (
                          <Sword className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400" />
                        ) : (
                          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-cyan-400" />
                        )}
                      </>
                    ) : (
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-600">???</span>
                    )}
                  </div>
                  <p className="text-gray-500 text-xs sm:text-sm">{compareMode === 'elixir' ? 'Next Elixir' : compareMode === 'attack_speed' ? 'Attack Speed' : compareMode === 'damage' ? 'Damage (Lvl 11)' : 'Release Year'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-amber-600 p-6 sm:p-8 lg:p-10 max-w-sm sm:max-w-md text-center shadow-2xl w-full">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-red-500 mb-4 sm:mb-6">GAME OVER</h2>
              <p className="text-gray-300 mb-2 text-base sm:text-lg">
                You scored
              </p>
              <p className="text-yellow-400 font-black text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4">{score}</p>
              {score === highScore && score > 0 && (
                <p className="text-green-400 font-bold mb-3 sm:mb-4 text-base sm:text-lg">New High Score!</p>
              )}
              <p className="text-gray-500 mb-6 sm:mb-8 text-sm sm:text-base">
                {getCardNameTranslated(nextCard.id)} has <span className="text-cyan-400 font-bold">{getDisplayValue(nextCard)}</span> {compareMode === 'elixir' ? 'elixir' : compareMode === 'attack_speed' ? 'attack speed' : compareMode === 'damage' ? 'damage' : 'release year'}
              </p>
              <button
                onClick={initGame}
                className="flex items-center justify-center gap-2 sm:gap-3 mx-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-amber-400 text-gray-900 font-black rounded-lg sm:rounded-xl hover:bg-amber-300 transition-all text-base sm:text-lg border-2 border-amber-500"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
