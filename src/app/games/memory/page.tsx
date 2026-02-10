'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, Brain, Trophy, Timer, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cardsData, baseCards } from '@/data'
import type { ClashCard } from '@/types/card'
import { recordMemorySession } from '@/lib/progress'

// Define logical card pairs: Card + Counter or Card + Evolution
interface CardPair {
  card1Name: string
  card2Name: string
  relationship: 'counter' | 'evolution' | 'synergy'
}

// Predefined counter/synergy pairs based on game meta
const CARD_PAIRS: CardPair[] = [
  // Counters
  { card1Name: 'Skeleton Army', card2Name: 'The Log', relationship: 'counter' },
  { card1Name: 'Minion Horde', card2Name: 'Arrows', relationship: 'counter' },
  { card1Name: 'Sparky', card2Name: 'Electro Wizard', relationship: 'counter' },
  { card1Name: 'Balloon', card2Name: 'Musketeer', relationship: 'counter' },
  { card1Name: 'Hog Rider', card2Name: 'Cannon', relationship: 'counter' },
  { card1Name: 'P.E.K.K.A', card2Name: 'Inferno Tower', relationship: 'counter' },
  { card1Name: 'Goblin Barrel', card2Name: 'Barbarian Barrel', relationship: 'counter' },
  { card1Name: 'Giant', card2Name: 'Mini P.E.K.K.A', relationship: 'counter' },
  { card1Name: 'Witch', card2Name: 'Lightning', relationship: 'counter' },
  { card1Name: 'Elite Barbarians', card2Name: 'Valkyrie', relationship: 'counter' },
  { card1Name: 'Mega Knight', card2Name: 'Inferno Dragon', relationship: 'counter' },
  { card1Name: 'Golem', card2Name: 'Inferno Tower', relationship: 'counter' },
  { card1Name: 'X-Bow', card2Name: 'Earthquake', relationship: 'counter' },
  { card1Name: 'Royal Giant', card2Name: 'Tesla', relationship: 'counter' },
  { card1Name: 'Lava Hound', card2Name: 'Baby Dragon', relationship: 'synergy' },
  { card1Name: 'Prince', card2Name: 'Dark Prince', relationship: 'synergy' },
  { card1Name: 'Giant Skeleton', card2Name: 'Clone', relationship: 'synergy' },
  { card1Name: 'Graveyard', card2Name: 'Poison', relationship: 'synergy' },
  // Card + Evolution pairs - dynamically generated below
]

// Generate evolution pairs from cards data
function generateEvolutionPairs(): CardPair[] {
  const pairs: CardPair[] = []
  const evolutionCards = cardsData.filter(c => c.type === 'Evolution')
  
  evolutionCards.forEach(evoCard => {
    // Find base card by matching name (e.g., "Knight Evolution" -> "Knight")
    const baseName = evoCard.name.replace(' Evolution', '')
    const baseCard = baseCards.find(c => c.name === baseName)
    if (baseCard) {
      pairs.push({
        card1Name: baseCard.name,
        card2Name: evoCard.name,
        relationship: 'evolution'
      })
    }
  })
  
  return pairs
}

interface MemoryCard {
  id: number
  pairId: number
  card: ClashCard
  isFlipped: boolean
  isMatched: boolean
  relationship: 'counter' | 'evolution' | 'synergy'
}

type GameMode = 'counter' | 'evolution' | 'mixed'
type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_SETTINGS = {
  easy: { pairs: 4, cols: 4 },
  medium: { pairs: 6, cols: 4 },
  hard: { pairs: 8, cols: 4 }
}

export default function RoyaleMemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [totalPairs, setTotalPairs] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [gameMode, setGameMode] = useState<GameMode>('mixed')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [showModeSelect, setShowModeSelect] = useState(true)

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-memory-best')
    if (saved) setBestScore(parseInt(saved, 10))
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameWon) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameWon])

  const initGame = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty]
    const pairCount = settings.pairs
    
    // Get available pairs based on mode
    let availablePairs: CardPair[] = []
    const evolutionPairs = generateEvolutionPairs()
    
    if (gameMode === 'counter') {
      availablePairs = CARD_PAIRS.filter(p => p.relationship === 'counter' || p.relationship === 'synergy')
    } else if (gameMode === 'evolution') {
      availablePairs = evolutionPairs
    } else {
      availablePairs = [...CARD_PAIRS, ...evolutionPairs]
    }
    
    // Shuffle and select pairs
    const shuffledPairs = [...availablePairs].sort(() => Math.random() - 0.5).slice(0, pairCount)
    
    // Create memory cards from pairs
    const memoryCards: MemoryCard[] = []
    shuffledPairs.forEach((pair, pairIndex) => {
      const card1 = cardsData.find(c => c.name === pair.card1Name)
      const card2 = cardsData.find(c => c.name === pair.card2Name)
      
      if (card1 && card2) {
        memoryCards.push({
          id: pairIndex * 2,
          pairId: pairIndex,
          card: card1,
          isFlipped: false,
          isMatched: false,
          relationship: pair.relationship
        })
        memoryCards.push({
          id: pairIndex * 2 + 1,
          pairId: pairIndex,
          card: card2,
          isFlipped: false,
          isMatched: false,
          relationship: pair.relationship
        })
      }
    })
    
    // Shuffle all cards
    const shuffledCards = [...memoryCards].sort(() => Math.random() - 0.5)
    
    setCards(shuffledCards)
    setFlippedCards([])
    setMoves(0)
    setMatchedPairs(0)
    setTotalPairs(shuffledPairs.length)
    setGameWon(false)
    setGameStarted(true)
    setTimer(0)
    setShowModeSelect(false)
    setIsChecking(false)
  }, [gameMode, difficulty])

  const handleCardClick = (cardId: number) => {
    if (isChecking) return
    if (flippedCards.length >= 2) return
    if (cards.find(c => c.id === cardId)?.isMatched) return
    if (flippedCards.includes(cardId)) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)

    // Update card state
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))

    // Check for match when 2 cards are flipped
    if (newFlipped.length === 2) {
      setIsChecking(true)
      setMoves(m => m + 1)

      const [first, second] = newFlipped
      const card1 = cards.find(c => c.id === first)
      const card2 = cards.find(c => c.id === second)

      setTimeout(() => {
        if (card1 && card2 && card1.pairId === card2.pairId) {
          // Match found!
          setCards(prev => prev.map(c => 
            c.pairId === card1.pairId ? { ...c, isMatched: true } : c
          ))
          setMatchedPairs(m => {
            const newMatched = m + 1
            if (newMatched === totalPairs) {
              setGameWon(true)
              // Record session
              recordMemorySession(moves + 1, timer, difficulty)
              // Check best score
              if (!bestScore || moves + 1 < bestScore) {
                setBestScore(moves + 1)
                localStorage.setItem('royalehaus-memory-best', (moves + 1).toString())
              }
            }
            return newMatched
          })
        } else {
          // No match - flip back
          setCards(prev => prev.map(c => 
            newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
          ))
        }
        setFlippedCards([])
        setIsChecking(false)
      }, 1000)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRelationshipLabel = (rel: string) => {
    switch (rel) {
      case 'counter': return '⚔️ Counter'
      case 'evolution': return '✨ Evolution'
      case 'synergy': return '🤝 Synergy'
      default: return rel
    }
  }

  const getRelationshipColor = (rel: string) => {
    switch (rel) {
      case 'counter': return 'text-red-400'
      case 'evolution': return 'text-purple-400'
      case 'synergy': return 'text-green-400'
      default: return 'text-amber-400'
    }
  }

  // Mode selection screen
  if (showModeSelect) {
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
              <Brain size={24} />
              Royale Memory
            </h1>
            <div className="w-20"></div>
          </div>
        </header>

        {/* Mode Selection */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-amber-500/30 p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-amber-400 text-center mb-6">
              Select Game Mode
            </h2>

            {/* Game Mode */}
            <div className="mb-6">
              <label className="block text-amber-200 text-sm font-medium mb-3">Pair Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(['counter', 'evolution', 'mixed'] as GameMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      gameMode === mode
                        ? 'bg-amber-500 text-gray-900'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {mode === 'counter' && '⚔️ Counters'}
                    {mode === 'evolution' && '✨ Evolutions'}
                    {mode === 'mixed' && '🎲 Mixed'}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {gameMode === 'counter' && 'Find cards that counter each other'}
                {gameMode === 'evolution' && 'Match cards with their evolutions'}
                {gameMode === 'mixed' && 'A mix of counters and evolutions'}
              </p>
            </div>

            {/* Difficulty */}
            <div className="mb-8">
              <label className="block text-amber-200 text-sm font-medium mb-3">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      difficulty === diff
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {diff === 'easy' && '4 Pairs'}
                    {diff === 'medium' && '6 Pairs'}
                    {diff === 'hard' && '8 Pairs'}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={initGame}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-900 font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sparkles size={20} />
              Start Game
            </button>

            {bestScore && (
              <p className="text-center text-amber-200/60 mt-4">
                Best Score: {bestScore} moves
              </p>
            )}
          </div>
        </main>
      </div>
    )
  }

  const settings = DIFFICULTY_SETTINGS[difficulty]

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
            <Brain size={24} />
            Royale Memory
          </h1>
          <button
            onClick={() => setShowModeSelect(true)}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
            New Game
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="w-full bg-gray-800/60 border-b border-gray-700/50 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2 text-cyan-400">
            <Timer size={16} />
            <span>{formatTime(timer)}</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span>Moves: {moves}</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Trophy size={16} />
            <span>{matchedPairs}/{totalPairs} Pairs</span>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div 
          className="grid gap-3"
          style={{ 
            gridTemplateColumns: `repeat(${settings.cols}, minmax(0, 1fr))`,
            maxWidth: settings.cols * 100 + (settings.cols - 1) * 12
          }}
        >
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isMatched || card.isFlipped || isChecking}
              className={`
                aspect-[3/4] w-20 sm:w-24 rounded-xl transition-all duration-300 transform
                ${card.isFlipped || card.isMatched 
                  ? 'rotate-y-180' 
                  : 'hover:scale-105'
                }
                ${card.isMatched 
                  ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/20' 
                  : ''
                }
              `}
              style={{ perspective: '1000px' }}
            >
              <div 
                className={`relative w-full h-full transition-transform duration-300 transform-style-3d ${
                  card.isFlipped || card.isMatched ? '' : ''
                }`}
              >
                {/* Card Back */}
                {!card.isFlipped && !card.isMatched && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl border-2 border-amber-500/50 flex items-center justify-center shadow-lg">
                    <div className="text-4xl">👑</div>
                  </div>
                )}
                
                {/* Card Front */}
                {(card.isFlipped || card.isMatched) && (
                  <div className={`absolute inset-0 bg-gray-700/90 rounded-xl border-2 ${
                    card.isMatched ? 'border-green-400' : 'border-cyan-500/50'
                  } flex flex-col items-center justify-center p-1 shadow-lg`}>
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      <Image
                        src={`/images/cards/${card.card.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`}
                        alt={card.card.name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/cards/unknown.png'
                        }}
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-white text-center mt-1 leading-tight line-clamp-2">
                      {card.card.name}
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Win Modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-amber-500/50 p-8 max-w-md w-full text-center animate-fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-amber-400 mb-2">You Win!</h2>
            <p className="text-gray-300 mb-6">
              Completed in <span className="text-amber-400 font-bold">{moves} moves</span> and{' '}
              <span className="text-cyan-400 font-bold">{formatTime(timer)}</span>
            </p>
            
            {/* Show matched pairs */}
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <h3 className="text-amber-200 font-medium mb-3">Pairs Found:</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Array.from(new Set(cards.map(c => c.pairId))).map(pairId => {
                  const pair = cards.filter(c => c.pairId === pairId)
                  if (pair.length !== 2) return null
                  return (
                    <div key={pairId} className="flex items-center justify-center gap-2 text-sm">
                      <span className="text-white">{pair[0].card.name}</span>
                      <span className={getRelationshipColor(pair[0].relationship)}>
                        {pair[0].relationship === 'counter' ? '⚔️' : 
                         pair[0].relationship === 'evolution' ? '✨' : '🤝'}
                      </span>
                      <span className="text-white">{pair[1].card.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModeSelect(true)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Change Mode
              </button>
              <button
                onClick={initGame}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
