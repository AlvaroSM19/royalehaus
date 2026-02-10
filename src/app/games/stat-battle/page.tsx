'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, Swords, Trophy, Zap, Heart, Coins, Crown, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { baseCards } from '@/data'
import type { ClashCard } from '@/types/card'
import { recordStatBattleSession } from '@/lib/progress'

type StatType = 'damage' | 'elixir'
type GamePhase = 'choosing' | 'revealing' | 'result'

interface RoundResult {
  leftCard: ClashCard
  rightCard: ClashCard
  stat: StatType
  winner: 'left' | 'right' | 'tie'
  playerChoice: 'left' | 'right'
  correct: boolean
}

const STAT_CONFIG: Record<StatType, { label: string; icon: React.ReactNode; color: string; getValue: (card: ClashCard) => number | null }> = {
  damage: {
    label: 'Damage',
    icon: <Swords size={20} />,
    color: 'text-red-400',
    getValue: (card) => card.damage_lvl_11 ?? null
  },
  elixir: {
    label: 'Elixir Cost',
    icon: <Zap size={20} />,
    color: 'text-purple-400',
    getValue: (card) => card.elixir
  }
}

export default function StatBattleGame() {
  const [leftCard, setLeftCard] = useState<ClashCard | null>(null)
  const [rightCard, setRightCard] = useState<ClashCard | null>(null)
  const [currentStat, setCurrentStat] = useState<StatType>('damage')
  const [phase, setPhase] = useState<GamePhase>('choosing')
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [round, setRound] = useState(1)
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([])
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [lives, setLives] = useState(3)
  const [showVS, setShowVS] = useState(false)

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-statbattle-highscore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  const getValidCards = useCallback(() => {
    // Filter cards that have the stat we're comparing
    return baseCards.filter(card => {
      if (currentStat === 'damage') {
        return card.damage_lvl_11 !== null && card.damage_lvl_11 !== undefined
      }
      return true
    })
  }, [currentStat])

  const pickNewCards = useCallback(() => {
    const validCards = getValidCards()
    if (validCards.length < 2) return

    // Pick random stat
    const stats: StatType[] = ['damage', 'elixir']
    const randomStat = stats[Math.floor(Math.random() * stats.length)]
    setCurrentStat(randomStat)

    // Filter again with new stat
    const filteredCards = randomStat === 'damage' 
      ? validCards.filter(c => c.damage_lvl_11 !== null && c.damage_lvl_11 !== undefined)
      : validCards

    // Pick two random different cards
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
    const card1 = shuffled[0]
    let card2 = shuffled[1]
    
    // Ensure cards are different
    let attempts = 0
    while (card2.id === card1.id && attempts < 10) {
      card2 = filteredCards[Math.floor(Math.random() * filteredCards.length)]
      attempts++
    }

    setLeftCard(card1)
    setRightCard(card2)
    setPhase('choosing')
    setShowVS(true)
    
    // Animate VS out after a moment
    setTimeout(() => setShowVS(false), 800)
  }, [getValidCards])

  const initGame = useCallback(() => {
    setScore(0)
    setStreak(0)
    setRound(1)
    setRoundHistory([])
    setGameOver(false)
    setLives(3)
    setLastResult(null)
    pickNewCards()
  }, [pickNewCards])

  useEffect(() => {
    initGame()
  }, []) // Only on mount

  const handleChoice = (choice: 'left' | 'right') => {
    if (phase !== 'choosing' || !leftCard || !rightCard) return

    setPhase('revealing')

    const config = STAT_CONFIG[currentStat]
    const leftValue = config.getValue(leftCard)
    const rightValue = config.getValue(rightCard)

    // Handle null values (shouldn't happen with filtering, but safety)
    if (leftValue === null || rightValue === null) {
      setTimeout(() => {
        pickNewCards()
        setRound(r => r + 1)
      }, 1500)
      return
    }

    // Determine winner (higher is better for damage, lower is better for elixir... 
    // Actually let's make it simple: higher value wins for all stats)
    let winner: 'left' | 'right' | 'tie' = 'tie'
    if (leftValue > rightValue) {
      winner = 'left'
    } else if (rightValue > leftValue) {
      winner = 'right'
    }

    // For elixir, we flip the logic - lower cost is "better"
    // But for the game, player guesses which has MORE of the stat
    // So we ask "which has higher [stat]?" - simple and consistent

    const correct = choice === winner || winner === 'tie'

    const result: RoundResult = {
      leftCard,
      rightCard,
      stat: currentStat,
      winner,
      playerChoice: choice,
      correct
    }

    setRoundHistory(prev => [...prev, result])
    setLastResult(correct ? 'correct' : 'wrong')

    setTimeout(() => {
      if (correct) {
        setScore(s => s + 1)
        setStreak(st => st + 1)
        
        const newScore = score + 1
        if (newScore > highScore) {
          setHighScore(newScore)
          localStorage.setItem('royalehaus-statbattle-highscore', newScore.toString())
        }
        
        setPhase('result')
        setTimeout(() => {
          setRound(r => r + 1)
          setLastResult(null)
          pickNewCards()
        }, 1500)
      } else {
        const newLives = lives - 1
        setLives(newLives)
        setStreak(0)
        
        if (newLives <= 0) {
          setGameOver(true)
          recordStatBattleSession(score, streak)
        } else {
          setPhase('result')
          setTimeout(() => {
            setRound(r => r + 1)
            setLastResult(null)
            pickNewCards()
          }, 1500)
        }
      }
    }, 1500)
  }

  const getStatDisplay = (card: ClashCard) => {
    const config = STAT_CONFIG[currentStat]
    const value = config.getValue(card)
    if (value === null) return '—'
    return value.toString()
  }

  const getCardImagePath = (card: ClashCard) => {
    return `/images/cards/${card.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
  }

  if (!leftCard || !rightCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="text-2xl text-amber-200">Loading...</div>
      </div>
    )
  }

  const config = STAT_CONFIG[currentStat]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="w-full bg-gray-900/95 backdrop-blur-sm border-b border-amber-500/30 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors">
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>
          <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Swords size={24} />
            Stat Battle
          </h1>
          <button
            onClick={initGame}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
            Restart
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="w-full bg-gray-800/60 border-b border-gray-700/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  size={24}
                  className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-sm">Round</span>
            <span className="text-lg font-bold text-amber-400">{round}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <span className="text-amber-200 font-medium">{score}</span>
            </div>
            <div className="text-gray-500 text-sm">
              Best: {highScore}
            </div>
          </div>
        </div>
      </div>

      {/* Question Banner */}
      <div className="w-full bg-gradient-to-r from-cyan-900/50 via-cyan-800/50 to-cyan-900/50 border-b border-cyan-500/30 py-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-cyan-200 text-sm mb-1">Which card has higher...</p>
          <div className={`flex items-center justify-center gap-2 text-2xl font-bold ${config.color}`}>
            {config.icon}
            <span>{config.label}</span>
            {config.icon}
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl flex items-center justify-center gap-4 md:gap-8">
          {/* Left Card */}
          <button
            onClick={() => handleChoice('left')}
            disabled={phase !== 'choosing'}
            className={`
              relative flex-1 max-w-xs bg-gradient-to-br from-gray-800 to-gray-900 
              rounded-2xl border-2 transition-all duration-300 transform
              ${phase === 'choosing' 
                ? 'border-cyan-500/50 hover:border-cyan-400 hover:scale-105 cursor-pointer' 
                : 'border-gray-600'
              }
              ${lastResult === 'correct' && roundHistory[roundHistory.length - 1]?.playerChoice === 'left'
                ? 'border-green-400 shadow-lg shadow-green-400/30'
                : ''
              }
              ${lastResult === 'wrong' && roundHistory[roundHistory.length - 1]?.playerChoice === 'left'
                ? 'border-red-400 shadow-lg shadow-red-400/30'
                : ''
              }
              ${roundHistory[roundHistory.length - 1]?.winner === 'left' && phase !== 'choosing'
                ? 'ring-2 ring-amber-400'
                : ''
              }
            `}
          >
            <div className="p-4 sm:p-6">
              {/* Card Image */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-4">
                <Image
                  src={getCardImagePath(leftCard)}
                  alt={leftCard.name}
                  fill
                  className="object-contain drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/cards/unknown.png'
                  }}
                />
              </div>
              
              {/* Card Name */}
              <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-3">
                {leftCard.name}
              </h3>
              
              {/* Stats (hidden until revealed) */}
              <div className={`
                text-center py-3 rounded-xl transition-all duration-500
                ${phase !== 'choosing' 
                  ? 'bg-gray-700/50' 
                  : 'bg-gray-700/30'
                }
              `}>
                {phase !== 'choosing' ? (
                  <div className={`text-3xl font-bold ${config.color}`}>
                    {getStatDisplay(leftCard)}
                  </div>
                ) : (
                  <div className="text-2xl text-gray-500">?</div>
                )}
              </div>
              
              {/* Card Info */}
              <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Zap size={14} className="text-purple-400" />
                  {leftCard.elixir}
                </span>
                <span>{leftCard.rarity}</span>
              </div>
            </div>
          </button>

          {/* VS Divider */}
          <div className="relative">
            <div className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              w-16 h-16 sm:w-20 sm:h-20 rounded-full
              bg-gradient-to-br from-amber-500 to-amber-700
              flex items-center justify-center
              shadow-lg shadow-amber-500/30
              transition-transform duration-300
              ${showVS ? 'scale-125' : 'scale-100'}
            `}>
              <span className="text-xl sm:text-2xl font-black text-gray-900">VS</span>
            </div>
            
            {/* Decorative lines */}
            <div className="hidden md:block absolute top-1/2 -left-8 w-8 h-0.5 bg-gradient-to-r from-transparent to-amber-500/50" />
            <div className="hidden md:block absolute top-1/2 -right-8 w-8 h-0.5 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          {/* Right Card */}
          <button
            onClick={() => handleChoice('right')}
            disabled={phase !== 'choosing'}
            className={`
              relative flex-1 max-w-xs bg-gradient-to-br from-gray-800 to-gray-900 
              rounded-2xl border-2 transition-all duration-300 transform
              ${phase === 'choosing' 
                ? 'border-cyan-500/50 hover:border-cyan-400 hover:scale-105 cursor-pointer' 
                : 'border-gray-600'
              }
              ${lastResult === 'correct' && roundHistory[roundHistory.length - 1]?.playerChoice === 'right'
                ? 'border-green-400 shadow-lg shadow-green-400/30'
                : ''
              }
              ${lastResult === 'wrong' && roundHistory[roundHistory.length - 1]?.playerChoice === 'right'
                ? 'border-red-400 shadow-lg shadow-red-400/30'
                : ''
              }
              ${roundHistory[roundHistory.length - 1]?.winner === 'right' && phase !== 'choosing'
                ? 'ring-2 ring-amber-400'
                : ''
              }
            `}
          >
            <div className="p-4 sm:p-6">
              {/* Card Image */}
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-4">
                <Image
                  src={getCardImagePath(rightCard)}
                  alt={rightCard.name}
                  fill
                  className="object-contain drop-shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/cards/unknown.png'
                  }}
                />
              </div>
              
              {/* Card Name */}
              <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-3">
                {rightCard.name}
              </h3>
              
              {/* Stats (hidden until revealed) */}
              <div className={`
                text-center py-3 rounded-xl transition-all duration-500
                ${phase !== 'choosing' 
                  ? 'bg-gray-700/50' 
                  : 'bg-gray-700/30'
                }
              `}>
                {phase !== 'choosing' ? (
                  <div className={`text-3xl font-bold ${config.color}`}>
                    {getStatDisplay(rightCard)}
                  </div>
                ) : (
                  <div className="text-2xl text-gray-500">?</div>
                )}
              </div>
              
              {/* Card Info */}
              <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Zap size={14} className="text-purple-400" />
                  {rightCard.elixir}
                </span>
                <span>{rightCard.rarity}</span>
              </div>
            </div>
          </button>
        </div>
      </main>

      {/* Result Feedback */}
      {lastResult && (
        <div className={`
          fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-xl
          font-bold text-xl transition-all animate-bounce
          ${lastResult === 'correct' 
            ? 'bg-green-500/90 text-white' 
            : 'bg-red-500/90 text-white'
          }
        `}>
          {lastResult === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-amber-500/50 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-bold text-red-400 mb-2">Game Over!</h2>
            <p className="text-gray-300 mb-6">
              You scored <span className="text-amber-400 font-bold">{score} points</span>
              {streak > 0 && (
                <> with a max streak of <span className="text-cyan-400 font-bold">{Math.max(...roundHistory.filter(r => r.correct).map((_, i, arr) => {
                  let count = 1;
                  for (let j = i + 1; j < arr.length && roundHistory[j].correct; j++) count++;
                  return count;
                }), 0)}</span></>
              )}
            </p>
            
            {score === highScore && score > 0 && (
              <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg py-2 px-4 mb-4">
                <span className="text-amber-400 font-medium">🏆 New High Score!</span>
              </div>
            )}

            <button
              onClick={initGame}
              className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={20} />
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Streak Indicator */}
      {streak >= 3 && !gameOver && (
        <div className="fixed top-24 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full font-bold animate-pulse">
          🔥 {streak} Streak!
        </div>
      )}
    </div>
  )
}
