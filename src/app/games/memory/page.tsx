'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, Brain, Trophy, Timer } from 'lucide-react'
import Link from 'next/link'
import { cardsData, baseCards } from '@/data'
import type { ClashCard } from '@/types/card'
import { recordMemorySession } from '@/lib/progress'

// ── Types ──────────────────────────────────────────────────────────────────
type Relationship = 'counter' | 'ranged' | 'hero' | 'evolution' | 'same_year'

interface PairDef {
  card1Name: string
  card2Name: string
  relationship: Relationship
  description: string
}

interface MemoryCard {
  id: number
  pairId: number
  card: ClashCard
  isFlipped: boolean
  isMatched: boolean
  relationship: Relationship
  matchDescription: string
}

// ── Pair Pools ─────────────────────────────────────────────────────────────
// Counter pairs: one card clearly counters the other.
// Avoided: both ranged, both hero, or base+evolution match.
const COUNTER_POOL: PairDef[] = [
  { card1Name: 'Skeleton Army', card2Name: 'The Log', relationship: 'counter', description: 'The Log destroys Skeleton Army' },
  { card1Name: 'Minion Horde', card2Name: 'Arrows', relationship: 'counter', description: 'Arrows destroy Minion Horde' },
  { card1Name: 'Balloon', card2Name: 'Tesla', relationship: 'counter', description: 'Tesla targets air & counters Balloon' },
  { card1Name: 'Hog Rider', card2Name: 'Cannon', relationship: 'counter', description: 'Cannon pulls & counters Hog Rider' },
  { card1Name: 'Giant', card2Name: 'Mini P.E.K.K.A', relationship: 'counter', description: 'Mini P.E.K.K.A melts Giant with high DPS' },
  { card1Name: 'Mega Knight', card2Name: 'P.E.K.K.A', relationship: 'counter', description: 'P.E.K.K.A defeats Mega Knight 1 v 1' },
  { card1Name: 'Witch', card2Name: 'Lightning', relationship: 'counter', description: 'Lightning eliminates the Witch' },
  { card1Name: 'Goblin Barrel', card2Name: 'Barbarian Barrel', relationship: 'counter', description: 'Barbarian Barrel perfectly counters Goblin Barrel' },
  { card1Name: 'Elite Barbarians', card2Name: 'Bowler', relationship: 'counter', description: 'Bowler pushes back Elite Barbarians' },
  { card1Name: 'X-Bow', card2Name: 'Earthquake', relationship: 'counter', description: 'Earthquake deals extra damage to buildings' },
  { card1Name: 'Royal Giant', card2Name: 'Inferno Tower', relationship: 'counter', description: 'Inferno Tower melts Royal Giant' },
  { card1Name: 'Golem', card2Name: 'Inferno Dragon', relationship: 'counter', description: 'Inferno Dragon melts Golem with ramping damage' },
  { card1Name: 'Sparky', card2Name: 'Electro Spirit', relationship: 'counter', description: 'Electro Spirit resets Sparky' },
  { card1Name: 'Lava Hound', card2Name: 'Mega Minion', relationship: 'counter', description: 'Mega Minion targets Lava Hound in the air' },
  { card1Name: 'Prince', card2Name: 'Guards', relationship: 'counter', description: 'Guards absorb Prince charge with shields' },
]

// Ranged pairs: both cards have ranged attack type.
// None are heroes or base+evolution matches.
const RANGED_POOL: PairDef[] = [
  { card1Name: 'Musketeer', card2Name: 'Wizard', relationship: 'ranged', description: 'Both are ranged troops' },
  { card1Name: 'Princess', card2Name: 'Dart Goblin', relationship: 'ranged', description: 'Both are ranged troops' },
  { card1Name: 'Magic Archer', card2Name: 'Firecracker', relationship: 'ranged', description: 'Both are ranged troops' },
  { card1Name: 'Electro Wizard', card2Name: 'Ice Wizard', relationship: 'ranged', description: 'Both are ranged Wizards' },
  { card1Name: 'Flying Machine', card2Name: 'Baby Dragon', relationship: 'ranged', description: 'Both are ranged flying troops' },
  { card1Name: 'Mother Witch', card2Name: 'Spear Goblins', relationship: 'ranged', description: 'Both are ranged troops' },
  { card1Name: 'Archers', card2Name: 'Hunter', relationship: 'ranged', description: 'Both are ranged troops' },
  { card1Name: 'Executioner', card2Name: 'Bomber', relationship: 'ranged', description: 'Both are ranged splash troops' },
]

// Hero pairs: both are Hero type cards.
const HERO_POOL: PairDef[] = [
  { card1Name: 'Hero Knight', card2Name: 'Hero Mini P.E.K.K.A', relationship: 'hero', description: 'Both are Hero cards' },
  { card1Name: 'Hero Musketeer', card2Name: 'Hero Giant', relationship: 'hero', description: 'Both are Hero cards' },
]

// Spell evolution pairs – ensures there's always a "spell + evolution" possibility.
const SPELL_EVOLUTION_POOL: PairDef[] = [
  { card1Name: 'Zap', card2Name: 'Zap Evolution', relationship: 'evolution', description: 'Zap Evolution is the evolution of the spell Zap' },
  { card1Name: 'Giant Snowball', card2Name: 'Giant Snowball Evolution', relationship: 'evolution', description: 'Giant Snowball Evolution is the evolution of the spell' },
  { card1Name: 'Goblin Drill', card2Name: 'Goblin Drill Evolution', relationship: 'evolution', description: 'Goblin Drill Evolution is the evolution of Goblin Drill' },
]

// Generate troop/building evolution pairs from data (skipping spells handled above).
function generateEvolutionPool(): PairDef[] {
  const pairs: PairDef[] = []
  const spellEvoNames = new Set(SPELL_EVOLUTION_POOL.flatMap(p => [p.card1Name, p.card2Name]))
  const evolutionCards = cardsData.filter(c => c.type === 'Evolution')

  evolutionCards.forEach(evoCard => {
    if (spellEvoNames.has(evoCard.name)) return
    const baseName = evoCard.name.replace(' Evolution', '')
    const baseCard = baseCards.find(c => c.name === baseName)
    if (baseCard) {
      pairs.push({
        card1Name: baseName,
        card2Name: evoCard.name,
        relationship: 'evolution',
        description: `${evoCard.name} is the evolution of ${baseName}`,
      })
    }
  })
  return pairs
}

// Generate "same year" pairs from baseCards released between 2017 and 2025.
// Only pairs where both cards share the EXACT same release year and neither card
// is already used in another pool to avoid ambiguity.
function generateSameYearPool(): PairDef[] {
  const pairs: PairDef[] = []
  // Group base cards by release year (2017-2025 only)
  const byYear: Record<number, ClashCard[]> = {}
  baseCards.forEach(c => {
    if (!c.release_date) return
    const year = parseInt(c.release_date.slice(0, 4), 10)
    if (year < 2017 || year > 2025) return
    // Exclude Evolutions and Heroes to avoid overlap with other pools
    if (c.type === 'Evolution' || c.type === 'Hero') return
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(c)
  })

  // Create shuffled pairs within each year
  Object.entries(byYear).forEach(([yearStr, cards]) => {
    const year = parseInt(yearStr, 10)
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push({
        card1Name: shuffled[i].name,
        card2Name: shuffled[i + 1].name,
        relationship: 'same_year',
        description: `Both cards were released in ${year}`,
      })
    }
  })
  return pairs
}

// ── Pair Selection (9 pairs, no card reuse, no ambiguity) ──────────────────
const TOTAL_PAIRS = 9

function selectGamePairs(): PairDef[] {
  const selected: PairDef[] = []
  const usedCards = new Set<string>()

  const addPairs = (pool: PairDef[], count: number) => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    let added = 0
    for (const pair of shuffled) {
      if (added >= count) break
      if (usedCards.has(pair.card1Name) || usedCards.has(pair.card2Name)) continue
      const c1 = cardsData.find(c => c.name === pair.card1Name)
      const c2 = cardsData.find(c => c.name === pair.card2Name)
      if (!c1 || !c2) continue
      selected.push(pair)
      usedCards.add(pair.card1Name)
      usedCards.add(pair.card2Name)
      added++
    }
    return added
  }

  // Order: hero first (limited pool), then same_year, counter, ranged, evolutions
  addPairs(HERO_POOL, 1)
  addPairs(generateSameYearPool(), 2)
  addPairs(COUNTER_POOL, 2)
  addPairs(RANGED_POOL, 2)
  addPairs(SPELL_EVOLUTION_POOL, 1)
  addPairs(generateEvolutionPool(), 1)

  // Fill remaining if needed
  if (selected.length < TOTAL_PAIRS) {
    addPairs([...COUNTER_POOL, ...RANGED_POOL, ...generateEvolutionPool(), ...generateSameYearPool()], TOTAL_PAIRS - selected.length)
  }

  return selected
}

// ── Relationship helpers ───────────────────────────────────────────────────
const REL_EMOJI: Record<Relationship, string> = {
  counter: '⚔️',
  ranged: '🏹',
  hero: '🦸',
  evolution: '✨',
  same_year: '📅',
}
const REL_LABEL: Record<Relationship, string> = {
  counter: 'Counter',
  ranged: 'Ranged',
  hero: 'Hero',
  evolution: 'Evolution',
  same_year: 'Same Year',
}
const REL_COLOR: Record<Relationship, string> = {
  counter: 'from-red-500/90 to-red-700/90 border-red-400',
  ranged: 'from-blue-500/90 to-blue-700/90 border-blue-400',
  hero: 'from-amber-500/90 to-amber-700/90 border-amber-400',
  evolution: 'from-purple-500/90 to-purple-700/90 border-purple-400',
  same_year: 'from-green-500/90 to-green-700/90 border-green-400',
}

// ── Component ──────────────────────────────────────────────────────────────
export default function RoyaleMemoryGame() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [gameWon, setGameWon] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [timer, setTimer] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [matchPopup, setMatchPopup] = useState<{ relationship: Relationship; description: string } | null>(null)
  const [matchHistory, setMatchHistory] = useState<PairDef[]>([])

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-memory-best')
    if (saved) setBestScore(parseInt(saved, 10))
  }, [])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameWon && !showPreview) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameWon, showPreview])

  // ── Init game ────────────────────────────────────────────────────────────
  const initGame = useCallback(() => {
    const pairs = selectGamePairs()

    const memoryCards: MemoryCard[] = []
    pairs.forEach((pair, idx) => {
      const c1 = cardsData.find(c => c.name === pair.card1Name)!
      const c2 = cardsData.find(c => c.name === pair.card2Name)!
      memoryCards.push(
        { id: idx * 2,     pairId: idx, card: c1, isFlipped: true, isMatched: false, relationship: pair.relationship, matchDescription: pair.description },
        { id: idx * 2 + 1, pairId: idx, card: c2, isFlipped: true, isMatched: false, relationship: pair.relationship, matchDescription: pair.description },
      )
    })

    // Shuffle
    const shuffled = [...memoryCards].sort(() => Math.random() - 0.5)

    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatchedPairs(0)
    setGameWon(false)
    setGameStarted(true)
    setTimer(0)
    setIsChecking(false)
    setMatchPopup(null)
    setMatchHistory([])

    // Preview: show all cards for 2 s then flip
    setShowPreview(true)
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isFlipped: false })))
      setShowPreview(false)
    }, 2000)
  }, [])

  // Start on mount
  useEffect(() => {
    initGame()
  }, [initGame])

  // ── Card click ───────────────────────────────────────────────────────────
  const handleCardClick = (cardId: number) => {
    if (showPreview || isChecking) return
    if (flippedCards.length >= 2) return
    const clickedCard = cards.find(c => c.id === cardId)
    if (!clickedCard || clickedCard.isMatched || clickedCard.isFlipped) return

    const newFlipped = [...flippedCards, cardId]
    setFlippedCards(newFlipped)
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c))

    if (newFlipped.length === 2) {
      setIsChecking(true)
      setMoves(m => m + 1)

      const card1 = cards.find(c => c.id === newFlipped[0])!
      const card2 = cards.find(c => c.id === newFlipped[1])!

      setTimeout(() => {
        if (card1.pairId === card2.pairId) {
          // Match!
          setCards(prev => prev.map(c =>
            c.pairId === card1.pairId ? { ...c, isMatched: true } : c
          ))

          // Show popup
          setMatchPopup({ relationship: card1.relationship, description: card1.matchDescription })
          setMatchHistory(prev => [...prev, {
            card1Name: card1.card.name,
            card2Name: card2.card.name,
            relationship: card1.relationship,
            description: card1.matchDescription,
          }])
          setTimeout(() => setMatchPopup(null), 2000)

          setMatchedPairs(m => {
            const newMatched = m + 1
            if (newMatched === TOTAL_PAIRS) {
              setGameWon(true)
              recordMemorySession(moves + 1, timer, 'hard')
              if (!bestScore || moves + 1 < bestScore) {
                setBestScore(moves + 1)
                localStorage.setItem('royalehaus-memory-best', (moves + 1).toString())
              }
            }
            return newMatched
          })
        } else {
          // No match – flip back
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c
          ))
        }
        setFlippedCards([])
        setIsChecking(false)
      }, 1000)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if (!gameStarted || cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50">
        <div className="text-2xl text-amber-200">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <header className="w-full bg-gray-900/95 backdrop-blur-sm border-b border-amber-500/30 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors">
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>
          <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2">
            <Brain size={24} />
            Royale Memory
          </h1>
          <button
            onClick={initGame}
            className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw size={18} />
            New Game
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="w-full bg-gray-800/60 border-b border-gray-700/50 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2 text-cyan-400">
            <Timer size={16} />
            <span>{formatTime(timer)}</span>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span>Moves: {moves}</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Trophy size={16} />
            <span>{matchedPairs}/{TOTAL_PAIRS}</span>
          </div>
          {bestScore && (
            <div className="flex items-center gap-2 text-gray-400">
              <span>Best: {bestScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview countdown */}
      {showPreview && (
        <div className="text-center py-2 bg-amber-500/20 text-amber-300 font-semibold text-sm animate-pulse">
          Memorize the cards!
        </div>
      )}

      {/* Game Board  6x3 grid */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div
          className="grid gap-2 sm:gap-3"
          style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', maxWidth: 660 }}
        >
          {cards.map(card => {
            const faceUp = card.isFlipped || card.isMatched
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped || isChecking || showPreview}
                className={`
                  relative aspect-[3/4] w-[88px] sm:w-[100px] rounded-xl overflow-hidden
                  transition-all duration-300 transform
                  ${!faceUp ? 'hover:scale-105 cursor-pointer' : ''}
                  ${card.isMatched ? 'ring-2 ring-green-400 shadow-lg shadow-green-400/20 opacity-80' : ''}
                `}
              >
                {/* Card Back */}
                {!faceUp && (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl border-2 border-amber-500/50 flex items-center justify-center shadow-lg">
                    <img
                      src="/images/games/memory/card-back.png"
                      alt="Card Back"
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        // Fallback to emoji if image not found
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<span class="text-3xl sm:text-4xl select-none">👑</span>';
                      }}
                    />
                  </div>
                )}

                {/* Card Front */}
                {faceUp && (
                  <div className={`absolute inset-0 bg-gray-800 rounded-xl border-2 ${
                    card.isMatched ? 'border-green-400' : 'border-cyan-500/60'
                  } flex flex-col items-center justify-center p-1 shadow-lg`}>
                    <img
                      src={`/images/cards/${card.card.id}.png`}
                      alt={card.card.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                    />
                    <p className="text-[9px] sm:text-[10px] text-white text-center mt-1 leading-tight line-clamp-2 font-medium">
                      {card.card.name}
                    </p>
                    {card.isMatched && (
                      <span className="text-[10px] mt-0.5">{REL_EMOJI[card.relationship]}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </main>

      {/* Match Popup (toast) */}
      {matchPopup && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50" style={{ animation: 'bounceIn 0.4s ease-out forwards' }}>
          <div className={`bg-gradient-to-r ${REL_COLOR[matchPopup.relationship]} border rounded-xl px-6 py-4 shadow-2xl backdrop-blur-sm max-w-sm text-center`}>
            <p className="text-white font-black text-lg">
              {REL_EMOJI[matchPopup.relationship]} {REL_LABEL[matchPopup.relationship]}!
            </p>
            <p className="text-white/90 text-sm mt-1">{matchPopup.description}</p>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-amber-500/50 p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-amber-400 mb-2">You Win!</h2>
            <p className="text-gray-300 mb-6">
              Completed in <span className="text-amber-400 font-bold">{moves} moves</span> and{' '}
              <span className="text-cyan-400 font-bold">{formatTime(timer)}</span>
            </p>

            {/* Matched pairs summary */}
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <h3 className="text-amber-200 font-medium mb-3">Pairs Found:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {matchHistory.map((pair, i) => (
                  <div key={i} className="flex items-center justify-center gap-2 text-sm">
                    <span className="text-xs">{REL_EMOJI[pair.relationship]}</span>
                    <span className="text-white">{pair.card1Name}</span>
                    <span className="text-gray-500">+</span>
                    <span className="text-white">{pair.card2Name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={initGame}
              className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Keyframes for popup animation */}
      <style jsx>{`
        @keyframes bounceIn {
          0%   { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.8); }
          60%  { transform: translateX(-50%) translateY(-8px) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
