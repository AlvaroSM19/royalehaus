'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { RotateCcw, Home, TrendingUp, TrendingDown, Zap, Award, Calendar, Equal, Timer, Sword, Trophy, Target } from 'lucide-react'
import Link from 'next/link'
import { getRandomCard } from '@/data'
import type { ClashCard, AttackSpeed } from '@/types/card'
import { recordHigherLowerSession } from '@/lib/progress'
import { useLanguage } from '@/lib/useLanguage'

type CompareMode = 'elixir' | 'release_year' | 'attack_speed' | 'damage'
type GamePhase = 'menu' | 'playing' | 'game-over'

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

// Topic descriptions for menu
const TOPICS: { mode: CompareMode; icon: React.ReactNode; label: string; description: string; color: string; bgGradient: string }[] = [
  { mode: 'damage', icon: <Sword className="w-8 h-8" />, label: 'Damage', description: 'Compare damage at Level 11', color: 'text-red-400', bgGradient: 'from-red-900/60 to-red-950/80' },
  { mode: 'elixir', icon: <span className="text-3xl">💧</span>, label: 'Elixir Cost', description: 'Compare elixir costs', color: 'text-purple-400', bgGradient: 'from-purple-900/60 to-purple-950/80' },
  { mode: 'release_year', icon: <Calendar className="w-8 h-8" />, label: 'Release Year', description: 'When was each card released?', color: 'text-cyan-400', bgGradient: 'from-cyan-900/60 to-cyan-950/80' },
  { mode: 'attack_speed', icon: <Timer className="w-8 h-8" />, label: 'Attack Speed', description: 'Compare attack speed ratings', color: 'text-amber-400', bgGradient: 'from-amber-900/60 to-amber-950/80' },
]

// Rank system
const RANKS = [
  { key: 'trainingCamp', minScore: 0, icon: '👶', title: 'Training Camp' },
  { key: 'arena1', minScore: 1, icon: '🌱', title: 'Arena 1' },
  { key: 'arena3', minScore: 3, icon: '🏠', title: 'Arena 3' },
  { key: 'arena5', minScore: 5, icon: '🎪', title: 'Arena 5' },
  { key: 'arena8', minScore: 8, icon: '📍', title: 'Arena 8' },
  { key: 'arena10', minScore: 12, icon: '🥉', title: 'Arena 10' },
  { key: 'legendary', minScore: 17, icon: '🏅', title: 'Legendary Arena' },
  { key: 'challenger', minScore: 23, icon: '⭐', title: 'Challenger' },
  { key: 'master', minScore: 30, icon: '💫', title: 'Master' },
  { key: 'champion', minScore: 38, icon: '⚡', title: 'Champion' },
  { key: 'grandChampion', minScore: 47, icon: '👑', title: 'Grand Champion' },
  { key: 'ultimateChampion', minScore: 57, icon: '🏆', title: 'Ultimate Champion' },
]

const getCurrentRank = (score: number) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (score >= RANKS[i].minScore) return RANKS[i]
  }
  return RANKS[0]
}

export default function HigherLowerGame() {
  const { getCardNameTranslated } = useLanguage();
  const [currentCard, setCurrentCard] = useState<ClashCard | null>(null)
  const [nextCard, setNextCard] = useState<ClashCard | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu')
  const [showResult, setShowResult] = useState(false)
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [compareMode, setCompareMode] = useState<CompareMode>('damage')
  const [revealNext, setRevealNext] = useState(false)
  const [revealFail, setRevealFail] = useState(false)
  const [isBlindRound, setIsBlindRound] = useState(false)
  const [totalPoints, setTotalPoints] = useState(0)
  const sessionBestRef = useRef(0)
  const recordedRef = useRef(false)

  // Blind rounds happen every 5 streak - current card value is hidden!
  const getStreakMultiplier = (s: number) => s >= 15 ? 4 : s >= 10 ? 3 : s >= 5 ? 2 : 1
  const getStreakLabel = (s: number) => s >= 15 ? '🔥🔥🔥 4×' : s >= 10 ? '🔥🔥 3×' : s >= 5 ? '🔥 2×' : ''

  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-higherlower-highscore')
    if (saved) setHighScore(parseInt(saved, 10))
  }, [])

  const getValidCard = useCallback(() => {
    let card = getRandomCard()
    if (compareMode === 'attack_speed') {
      while (!card.attackSpeed) card = getRandomCard()
    } else if (compareMode === 'damage') {
      while (!card.damage_lvl_11 || card.damage_lvl_11 === null) card = getRandomCard()
    }
    return card
  }, [compareMode])

  const initGame = useCallback((mode?: CompareMode) => {
    const activeMode = mode || compareMode
    if (mode) setCompareMode(mode)
    
    const getCard = () => {
      let card = getRandomCard()
      if (activeMode === 'attack_speed') {
        while (!card.attackSpeed) card = getRandomCard()
      } else if (activeMode === 'damage') {
        while (!card.damage_lvl_11 || card.damage_lvl_11 === null) card = getRandomCard()
      }
      return card
    }
    
    const card1 = getCard()
    let card2 = getCard()
    while (card2.id === card1.id) card2 = getCard()
    
    setCurrentCard(card1)
    setNextCard(card2)
    setScore(0)
    setStreak(0)
    setTotalPoints(0)
    setGamePhase('playing')
    setShowResult(false)
    setIsAnimating(false)
    setRevealNext(false)
    setRevealFail(false)
    setIsBlindRound(false)
    recordedRef.current = false
    sessionBestRef.current = 0
  }, [compareMode])

  const getCompareValue = (card: ClashCard): number => {
    if (compareMode === 'elixir') return card.elixir
    if (compareMode === 'attack_speed') return card.attackSpeed ? ATTACK_SPEED_VALUES[card.attackSpeed] : 0
    if (compareMode === 'damage') return card.damage_lvl_11 || 0
    return new Date(card.release_date).getFullYear()
  }

  const getDisplayValue = (card: ClashCard): string => {
    if (compareMode === 'attack_speed') return card.attackSpeed ? ATTACK_SPEED_LABELS[card.attackSpeed] : 'N/A'
    return getCompareValue(card).toString()
  }

  const handleGuess = (guess: 'higher' | 'lower' | 'equal') => {
    if (!currentCard || !nextCard || isAnimating || gamePhase !== 'playing') return

    setIsAnimating(true)
    setShowResult(true)
    setRevealNext(true)

    const currentValue = getCompareValue(currentCard)
    const nextValue = getCompareValue(nextCard)
    
    let isCorrect = false
    if (guess === 'higher') isCorrect = nextValue > currentValue
    else if (guess === 'lower') isCorrect = nextValue < currentValue
    else isCorrect = nextValue === currentValue

    setLastGuessCorrect(isCorrect)

    if (isCorrect) {
      setRevealFail(false)
      const newScore = score + 1
      const newStreak = streak + 1
      const mult = getStreakMultiplier(streak)
      const blindBonus = isBlindRound ? 2 : 1
      const roundPoints = mult * blindBonus
      setScore(newScore)
      setStreak(newStreak)
      setTotalPoints(prev => prev + roundPoints)
      sessionBestRef.current = Math.max(sessionBestRef.current, newScore)
      
      if (newScore > highScore) {
        setHighScore(newScore)
        localStorage.setItem('royalehaus-higherlower-highscore', newScore.toString())
      }

      setTimeout(() => {
        let newCard = getValidCard()
        while (newCard.id === nextCard.id) newCard = getValidCard()
        
        setCurrentCard(nextCard)
        setNextCard(newCard)
        setShowResult(false)
        setRevealNext(false)
        setIsAnimating(false)
        // Blind round every 5 streak
        setIsBlindRound((newStreak) % 5 === 0 && newStreak > 0)
      }, 600)
    } else {
      setRevealFail(true)
      setStreak(0)
      setTimeout(() => {
        setGamePhase('game-over')
        setIsAnimating(false)
        if (!recordedRef.current) {
          recordHigherLowerSession(sessionBestRef.current)
          recordedRef.current = true
        }
      }, 800)
    }
  }

  // ── Menu Phase ─────────────────────────────────────────────────────────
  if (gamePhase === 'menu') {
    return (
      <div className="min-h-screen text-amber-100 relative">
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/65 via-black/55 to-black/70 -z-10" />
        
        {/* Header */}
        <div className="border-b border-amber-700/40 bg-[#042836]/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              HIGHER OR LOWER
            </h1>
          </div>
        </div>

        {/* Topic Selection Menu */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black text-amber-300 mb-3">Choose Your Topic</h2>
              <p className="text-gray-400 text-lg">Select what you want to compare between Clash Royale cards</p>
            </div>

            {/* Topic Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {TOPICS.map(topic => (
                <button
                  key={topic.mode}
                  onClick={() => initGame(topic.mode)}
                  className={`
                    relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left
                    bg-gradient-to-br ${topic.bgGradient}
                    border-2 border-amber-700/30 hover:border-amber-500/60
                    transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                    shadow-xl hover:shadow-2xl hover:shadow-amber-900/30
                    group
                  `}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-amber-400/10 to-transparent" />
                  
                  <div className="relative z-10">
                    <div className={`${topic.color} mb-3`}>
                      {topic.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-2">{topic.label}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">{topic.description}</p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500/30 group-hover:text-amber-400/60 transition-colors">
                    <TrendingUp className="w-10 h-10" />
                  </div>
                </button>
              ))}
            </div>

            {/* High Score Display */}
            {highScore > 0 && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-amber-900/30 border border-amber-700/40">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-bold">Best Score: {highScore}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Game Over Phase ────────────────────────────────────────────────────
  if (gamePhase === 'game-over') {
    const finalRank = getCurrentRank(score)
    return (
      <div className="min-h-screen text-amber-100 relative">
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40" />
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-3 sm:p-6 overflow-y-auto pt-16 lg:pt-20">
          <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl">
            {/* Poster Card */}
            <div
              className="relative w-full mx-auto overflow-hidden rounded-2xl sm:rounded-[26px] text-white shadow-[0_0_100px_-12px_rgba(255,200,80,0.45)] aspect-[3/4] md:aspect-[16/9]"
              style={{
                background: 'linear-gradient(180deg, #0a1628 0%, #152238 50%, #0a1628 100%)',
                border: '3px solid rgba(245, 180, 50, 0.5)',
              }}
            >
              {/* Decorative overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(1200px_600px at 50% 0%, rgba(245,180,50,0.15), transparent 60%)'
                }} />
                <div className="absolute inset-0 ring-1 ring-amber-900/20 rounded-[14px]" />
              </div>

              {/* Content */}
              <div className="relative px-4 sm:px-8 lg:px-12 py-4 sm:py-6 lg:py-4 flex flex-col md:flex-row h-full justify-between md:items-center md:gap-6 lg:gap-10">
                {/* Left - Title */}
                <div className="text-center md:text-left md:flex-shrink-0">
                  <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.15em] text-amber-400 drop-shadow uppercase">Game Over</div>
                  <div className="mt-1 text-[9px] sm:text-[10px] lg:text-xs font-extrabold tracking-[0.25em] text-amber-500/70 uppercase">Higher or Lower</div>
                </div>

                {/* Center - Rank */}
                <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 justify-center py-4 md:py-0">
                  <div className="text-6xl mb-2">{finalRank.icon}</div>
                  <div className="text-base sm:text-lg md:text-xl font-black text-amber-300 text-center">
                    {finalRank.title}
                  </div>
                </div>

                {/* Right - Score */}
                <div className="text-center md:text-right md:flex-shrink-0">
                  <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-[0.3em] text-amber-400/80">SCORE</div>
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black text-emerald-400 drop-shadow">{score}</div>
                  <div className="text-sm sm:text-base text-amber-300/60 font-bold mt-1">{totalPoints} pts</div>
                  {score === highScore && score > 0 && (
                    <div className="text-green-400 font-bold text-sm mt-1">New High Score!</div>
                  )}
                  <div className="mt-1 text-[8px] sm:text-[9px] font-extrabold tracking-[0.3em] text-amber-500/50 select-none">ROYALEHAUS.COM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 sm:mt-6 mb-6 sm:mb-10 flex flex-col md:flex-row gap-2 sm:gap-3 w-full max-w-md md:max-w-3xl px-3 sm:px-0">
            <button onClick={() => initGame()} className="px-5 py-4 md:py-3 rounded-xl font-bold text-lg md:text-base bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black shadow-lg hover:brightness-110 transition w-full md:w-auto md:flex-1">
              <div className="flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Play Again
              </div>
            </button>
            <button onClick={() => setGamePhase('menu')} className="px-5 py-4 md:py-3 rounded-xl font-bold text-lg md:text-base bg-gradient-to-br from-cyan-600 to-cyan-700 text-white shadow-lg hover:brightness-110 transition w-full md:w-auto md:flex-1">
              <div className="flex items-center justify-center gap-2">
                <Target className="w-5 h-5" />
                Change Topic
              </div>
            </button>
            <Link href="/" className="px-5 py-4 md:py-3 rounded-xl font-bold text-lg md:text-base bg-gray-800 text-gray-300 shadow-lg hover:bg-gray-700 transition w-full md:w-auto md:flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                <Home className="w-5 h-5" />
                Home
              </div>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing Phase ──────────────────────────────────────────────────────
  if (!currentCard || !nextCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50">
        <div className="text-2xl text-amber-200">Loading...</div>
      </div>
    );
  }

  const currentValue = getCompareValue(currentCard)
  const nextValue = getCompareValue(nextCard)

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
      
      <div className="min-h-screen text-amber-100 relative">
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/65 via-black/55 to-black/70 -z-10" />

        {/* Header */}
        <div className="border-b border-amber-700/40 bg-[#042836]/70 backdrop-blur-sm sticky top-0 z-40 shadow-lg shadow-black/40">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <h1 className="text-sm sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">HIGHER OR LOWER</h1>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-sm">
                {/* Topic indicator */}
                <button
                  onClick={() => setGamePhase('menu')}
                  className="flex items-center gap-1 bg-purple-900/50 px-2 py-1 rounded border border-purple-500/40 hover:bg-purple-800/50 transition-colors"
                  title="Change Topic"
                >
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                  <span className="hidden sm:inline text-purple-300">{TOPICS.find(t => t.mode === compareMode)?.label}</span>
                </button>
                <div className="flex items-center gap-1 bg-black/30 px-1.5 sm:px-2 py-1 rounded">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                  <span className="text-white font-bold">{score}</span>
                </div>
                <div className="flex items-center gap-1 bg-black/30 px-1.5 sm:px-2 py-1 rounded">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-orange-400" />
                  <span className="text-white font-bold">{streak}</span>
                  {getStreakLabel(streak) && <span className="text-xs">{getStreakLabel(streak)}</span>}
                </div>
                {isBlindRound && !showResult && (
                  <div className="flex items-center gap-1 bg-fuchsia-900/50 px-1.5 sm:px-2 py-1 rounded border border-fuchsia-500/40 animate-pulse">
                    <span className="text-xs sm:text-sm text-fuchsia-300 font-bold">🔒 BLIND</span>
                  </div>
                )}
                <div className="hidden sm:flex items-center gap-1 bg-black/30 px-2 py-1 rounded">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Best: {highScore}</span>
                </div>
                <button
                  onClick={() => initGame()}
                  className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 text-black font-semibold hover:brightness-110 transition text-[10px] sm:text-sm"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative z-10">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-6 sm:gap-10 h-full">
                {/* Cards row */}
                <div className="flex flex-row items-stretch justify-center gap-3 sm:gap-8 flex-1">
                  {/* Current Card */}
                  <div className={`bg-[#101b24]/70 border border-amber-700/40 rounded-xl backdrop-blur-sm p-2 sm:p-4 w-full md:w-[18rem] lg:w-[20rem] xl:w-[22rem] flex flex-col shadow-md shadow-black/50 transition-opacity duration-300 ${isAnimating ? 'opacity-60' : 'opacity-100'}`}>
                    <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-black/40 border border-amber-700/30 flex items-center justify-center flex-1">
                      <img
                        src={`/images/cards/${currentCard.id}.webp`}
                        alt={getCardNameTranslated(currentCard.id)}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 sm:mt-4 text-center space-y-0.5 sm:space-y-1">
                      <h3 className="text-sm sm:text-xl md:text-2xl font-extrabold text-amber-300 tracking-wide truncate">{getCardNameTranslated(currentCard.id)}</h3>
                      <p className="text-[10px] sm:text-sm uppercase tracking-wider text-amber-500/70 truncate">{currentCard.type} • {currentCard.rarity}</p>
                      <div className="pt-1 sm:pt-2">
                        {isBlindRound && !showResult ? (
                          <>
                            <div className="text-xl sm:text-3xl font-extrabold text-fuchsia-400/60 tracking-widest">🔒 BLIND</div>
                            <p className="text-[9px] sm:text-[11px] mt-0.5 sm:mt-1 text-fuchsia-300/60 tracking-wide">Trust your knowledge!</p>
                          </>
                        ) : (
                          <>
                            <div className={`font-extrabold text-emerald-400 drop-shadow ${compareMode === 'attack_speed' ? 'text-base sm:text-2xl' : 'text-xl sm:text-4xl'}`}>
                              {getDisplayValue(currentCard)}
                            </div>
                            <p className="text-[9px] sm:text-[11px] mt-0.5 sm:mt-1 text-amber-200/60 tracking-wide">
                              {compareMode === 'elixir' ? 'Elixir Cost' : compareMode === 'attack_speed' ? 'Attack Speed' : compareMode === 'damage' ? 'Damage (Lvl 11)' : 'Release Year'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center Buttons (Desktop) */}
                  <div className="hidden md:flex flex-col justify-center items-center gap-4 sm:gap-8 px-2 w-auto">
                    <div className="text-center max-w-md">
                      <p className="text-base md:text-lg text-amber-200/80 leading-relaxed">
                        Is the next card&apos;s {compareMode === 'elixir' ? 'elixir' : compareMode === 'attack_speed' ? 'attack speed' : compareMode === 'damage' ? 'damage' : 'release year'}{' '}
                        <span className="text-amber-400 font-bold">{compareMode === 'attack_speed' ? 'FASTER' : 'HIGHER'}</span> or{' '}
                        <span className="text-red-400 font-bold">{compareMode === 'attack_speed' ? 'SLOWER' : 'LOWER'}</span>?
                      </p>
                    </div>
                    <div className="flex flex-row gap-3 w-full md:w-[22rem]">
                      <button
                        onClick={() => handleGuess('higher')}
                        disabled={isAnimating}
                        className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-4 sm:py-5 text-base sm:text-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-extrabold rounded-xl shadow-inner shadow-amber-900/40 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> {compareMode === 'attack_speed' ? 'Faster' : 'Higher'}
                      </button>
                      <button
                        onClick={() => handleGuess('lower')}
                        disabled={isAnimating}
                        className="flex-1 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-4 sm:py-5 text-base sm:text-xl bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white font-extrabold rounded-xl shadow-inner shadow-rose-900/40 hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
                      >
                        <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" /> {compareMode === 'attack_speed' ? 'Slower' : 'Lower'}
                      </button>
                    </div>
                    <button
                      onClick={() => handleGuess('equal')}
                      disabled={isAnimating}
                      className="w-44 flex items-center justify-center gap-3 px-8 py-3 bg-gray-700 text-white font-black rounded-xl hover:bg-gray-600 transition disabled:opacity-50 text-base border-2 border-gray-500"
                    >
                      <Equal className="w-5 h-5" /> Equal
                    </button>

                    {/* Result Feedback (Desktop) */}
                    {showResult && (
                      <div className="text-center">
                        <div className={`text-3xl font-black ${lastGuessCorrect ? 'text-green-400' : 'text-red-400'}`}>
                          {lastGuessCorrect ? 'CORRECT!' : 'WRONG!'}
                        </div>
                        {lastGuessCorrect && (
                          <div className="text-sm text-amber-300/80 mt-1 font-bold">
                            +{getStreakMultiplier(streak - 1) * (isBlindRound ? 2 : 1)} pts
                            {isBlindRound && ' (blind bonus!)'}
                            {getStreakMultiplier(streak - 1) > 1 && !isBlindRound && ` (${getStreakMultiplier(streak - 1)}\u00d7 streak)`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Next Card */}
                  <div className={`bg-[#101b24]/70 border border-amber-700/40 rounded-xl backdrop-blur-sm p-2 sm:p-4 w-full md:w-[18rem] lg:w-[20rem] xl:w-[22rem] flex flex-col shadow-md shadow-black/50 transition-all duration-300 ${
                    revealNext ? (revealFail ? 'border-red-500/60' : 'border-green-500/60') : ''
                  }`}>
                    <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-black/40 border border-amber-700/30 flex items-center justify-center flex-1">
                      <img
                        src={`/images/cards/${nextCard.id}.webp`}
                        alt={getCardNameTranslated(nextCard.id)}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mt-2 sm:mt-4 text-center space-y-0.5 sm:space-y-1">
                      <h3 className="text-sm sm:text-xl md:text-2xl font-extrabold text-amber-300 tracking-wide truncate">{getCardNameTranslated(nextCard.id)}</h3>
                      <p className="text-[10px] sm:text-sm uppercase tracking-wider text-amber-500/70 truncate">{nextCard.type} • {nextCard.rarity}</p>
                      <div className="pt-1 sm:pt-2 min-h-[48px] sm:min-h-[72px] flex flex-col items-center justify-start">
                        {revealNext ? (
                          <div className={`font-extrabold drop-shadow ${revealFail ? 'text-rose-400' : 'text-emerald-400'} ${compareMode === 'attack_speed' ? 'text-base sm:text-2xl' : 'text-xl sm:text-4xl'}`}>
                            {getDisplayValue(nextCard)}
                          </div>
                        ) : (
                          <div className="text-2xl sm:text-4xl font-extrabold text-amber-300/30 tracking-widest">???</div>
                        )}
                        <p className="text-[9px] sm:text-[11px] mt-0.5 sm:mt-1 text-amber-200/60 tracking-wide">
                          {compareMode === 'elixir' ? 'Elixir Cost' : compareMode === 'attack_speed' ? 'Attack Speed' : compareMode === 'damage' ? 'Damage (Lvl 11)' : 'Release Year'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Buttons */}
                <div className="md:hidden flex flex-col gap-2 w-full max-w-[320px] mx-auto mt-auto pb-2">
                  <button
                    onClick={() => handleGuess('higher')}
                    disabled={isAnimating}
                    className="w-full flex items-center justify-center gap-3 px-6 py-5 text-lg bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-extrabold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <TrendingUp className="w-6 h-6" /> {(compareMode === 'attack_speed' ? 'FASTER' : 'HIGHER')}
                  </button>
                  <button
                    onClick={() => handleGuess('lower')}
                    disabled={isAnimating}
                    className="w-full flex items-center justify-center gap-3 px-6 py-5 text-lg bg-gradient-to-br from-rose-600 via-red-600 to-rose-700 text-white font-extrabold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50"
                  >
                    <TrendingDown className="w-6 h-6" /> {(compareMode === 'attack_speed' ? 'SLOWER' : 'LOWER')}
                  </button>
                  <button
                    onClick={() => handleGuess('equal')}
                    disabled={isAnimating}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 text-base bg-gray-700 text-white font-extrabold rounded-xl hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    <Equal className="w-5 h-5" /> EQUAL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
