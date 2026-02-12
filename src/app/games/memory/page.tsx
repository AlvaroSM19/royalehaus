'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, Brain, Trophy, Timer, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cardsData, baseCards } from '@/data'
import type { ClashCard } from '@/types/card'
import { recordMemorySession } from '@/lib/progress'

// ── Types ──────────────────────────────────────────────────────────────────
type Relationship = 'counter' | 'ranged' | 'hero' | 'evolution' | 'same_year'

interface PairDef {
      {/* Game Board 6x3 grid - scroll horizontal en móvil */}
      <main className="flex-1 flex items-center justify-center px-2 xs:px-3 sm:px-4 py-2 xs:py-3 sm:py-4">
        {/* Scroll hint for mobile */}
        <div className="block sm:hidden text-center mb-2 select-none pointer-events-none w-full">
          <span className="inline-block bg-slate-900/80 text-cyan-300 text-xs px-3 py-1 rounded-full shadow-md animate-pulse">Desliza para ver todas las cartas →</span>
        </div>
        <div className="w-full max-w-[680px] overflow-x-auto pb-2 sm:overflow-visible">
          <div className="grid grid-cols-6 gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 min-w-[340px] xs:min-w-[400px] sm:min-w-[520px] md:min-w-[640px] lg:min-w-[680px]">
            {cards.map(card => {
              const faceUp = card.isFlipped || card.isMatched
              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  disabled={card.isMatched || card.isFlipped || isChecking || showPreview}
                  className={`
                    relative aspect-[3/4] w-full rounded-md xs:rounded-lg sm:rounded-xl overflow-hidden
                    transition-all duration-300 transform touch-manipulation
                    ${!faceUp ? 'hover:scale-105 hover:-translate-y-1 cursor-pointer active:scale-95' : ''}
                    ${card.isMatched ? 'ring-1 xs:ring-2 ring-green-400 shadow-md xs:shadow-lg shadow-green-400/30 scale-95' : ''}
                  `}
                  style={{ perspective: '1000px' }}
                >
                  {/* Card Back */}
                  {!faceUp && (
                    <div 
                      className="absolute inset-0 rounded-md xs:rounded-lg sm:rounded-xl flex items-center justify-center shadow-md xs:shadow-lg border xs:border-2 border-amber-500/50"
                      style={{
                        background: 'linear-gradient(145deg, rgba(180, 130, 40, 0.9) 0%, rgba(120, 80, 20, 0.95) 100%)',
                      }}
                    >
                      <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>
                      <img 
                        src="/images/card-back.svg" 
                        alt="Card back" 
                        className="w-10 h-12 xs:w-12 xs:h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 object-contain z-10 drop-shadow-lg"
                      />
                    </div>
                  )}

                  {/* Card Front */}
                  {faceUp && (
                    <div 
                      className={`absolute inset-0 rounded-md xs:rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-0.5 xs:p-1 shadow-md xs:shadow-lg border xs:border-2 ${
                        card.isMatched ? 'border-green-400' : 'border-cyan-500/60'
                      }`}
                      style={{
                        background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                      }}
                    >
                      <img
                        src={`/images/cards/${card.card.id}.webp`}
                        alt={card.card.name}
                        className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain drop-shadow-md"
                      />
                      <p className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-white text-center mt-0.5 leading-tight line-clamp-2 font-medium px-0.5">
                        {card.card.name}
                      </p>
                      {card.isMatched && (
                        <span className="text-[10px] xs:text-xs sm:text-sm mt-0.5 drop-shadow-md">{REL_EMOJI[card.relationship]}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </main>
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
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
        <div className="relative z-10 text-2xl text-amber-400 font-bold animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Dark Overlay for wallpaper visibility */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-gray-900/90 border-b border-gray-700/50 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors group"
          >
            <Home size={18} className="xs:w-5 xs:h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden sm:inline text-sm">Home</span>
          </Link>
          <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-amber-400 flex items-center gap-1.5 xs:gap-2">
            <Brain size={18} className="xs:w-5 xs:h-5 sm:w-[22px] sm:h-[22px] text-cyan-400" />
            <span className="hidden xs:inline">Royale Memory</span>
            <span className="xs:hidden">Memory</span>
          </h1>
          <button
            onClick={initGame}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-md sm:rounded-lg transition-all hover:scale-105 border border-amber-500/30 text-xs xs:text-sm"
          >
            <RotateCcw size={14} className="xs:w-4 xs:h-4" />
            <span className="hidden sm:inline">New Game</span>
          </button>
        </div>
      </header>

      {/* Stats Panel */}
      <div className="bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-3 flex flex-wrap items-center justify-center gap-2 xs:gap-3 sm:gap-4 md:gap-8 text-xs xs:text-sm">
          <div className="flex items-center gap-1.5 xs:gap-2 text-cyan-400 bg-slate-800/60 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-md sm:rounded-lg border border-cyan-500/20">
            <Timer size={14} className="xs:w-4 xs:h-4" />
            <span className="font-mono font-bold">{formatTime(timer)}</span>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 text-amber-400 bg-slate-800/60 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-md sm:rounded-lg border border-amber-500/20">
            <span className="text-[10px] xs:text-xs text-amber-400/70 hidden xs:inline">Moves</span>
            <span className="text-[10px] xs:hidden text-amber-400/70">M</span>
            <span className="font-bold">{moves}</span>
          </div>
          <div className="flex items-center gap-1.5 xs:gap-2 text-green-400 bg-slate-800/60 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-md sm:rounded-lg border border-green-500/20">
            <Sparkles size={14} className="xs:w-4 xs:h-4" />
            <span className="font-bold">{matchedPairs}/{TOTAL_PAIRS}</span>
          </div>
          {bestScore && (
            <div className="flex items-center gap-1.5 xs:gap-2 text-yellow-400 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-md sm:rounded-lg border border-yellow-500/30">
              <Trophy size={14} className="xs:w-4 xs:h-4" />
              <span className="font-bold">{bestScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview countdown */}
      {showPreview && (
        <div className="text-center py-2 xs:py-2.5 sm:py-3 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 text-amber-300 font-bold text-xs xs:text-sm animate-pulse border-b border-amber-500/30">
          <span className="flex items-center justify-center gap-1.5 xs:gap-2">
            <Brain size={16} className="xs:w-[18px] xs:h-[18px] animate-bounce" />
            Memorize the cards!
          </span>
        </div>
      )}

      {/* Game Board 6x3 grid */}
      <main className="flex-1 flex items-center justify-center p-2 xs:p-3 sm:p-4">
        <div
          className="grid grid-cols-6 gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 w-full max-w-[320px] xs:max-w-[380px] sm:max-w-[480px] md:max-w-[600px] lg:max-w-[680px]"
        >
          {cards.map(card => {
            const faceUp = card.isFlipped || card.isMatched
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped || isChecking || showPreview}
                className={`
                  relative aspect-[3/4] w-full rounded-md xs:rounded-lg sm:rounded-xl overflow-hidden
                  transition-all duration-300 transform touch-manipulation
                  ${!faceUp ? 'hover:scale-105 hover:-translate-y-1 cursor-pointer active:scale-95' : ''}
                  ${card.isMatched ? 'ring-1 xs:ring-2 ring-green-400 shadow-md xs:shadow-lg shadow-green-400/30 scale-95' : ''}
                `}
                style={{ perspective: '1000px' }}
              >
                {/* Card Back */}
                {!faceUp && (
                  <div 
                    className="absolute inset-0 rounded-md xs:rounded-lg sm:rounded-xl flex items-center justify-center shadow-md xs:shadow-lg border xs:border-2 border-amber-500/50"
                    style={{
                      background: 'linear-gradient(145deg, rgba(180, 130, 40, 0.9) 0%, rgba(120, 80, 20, 0.95) 100%)',
                    }}
                  >
                    <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImEiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHBhdGggZD0iTTAgMGgyMHYyMEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjEuNSIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>
                    <img 
                      src="/images/card-back.svg" 
                      alt="Card back" 
                      className="w-10 h-12 xs:w-12 xs:h-14 sm:w-14 sm:h-16 md:w-16 md:h-20 object-contain z-10 drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Card Front */}
                {faceUp && (
                  <div 
                    className={`absolute inset-0 rounded-md xs:rounded-lg sm:rounded-xl flex flex-col items-center justify-center p-0.5 xs:p-1 shadow-md xs:shadow-lg border xs:border-2 ${
                      card.isMatched ? 'border-green-400' : 'border-cyan-500/60'
                    }`}
                    style={{
                      background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
                    }}
                  >
                    <img
                      src={`/images/cards/${card.card.id}.webp`}
                      alt={card.card.name}
                      className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain drop-shadow-md"
                    />
                    <p className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-white text-center mt-0.5 leading-tight line-clamp-2 font-medium px-0.5">
                      {card.card.name}
                    </p>
                    {card.isMatched && (
                      <span className="text-[10px] xs:text-xs sm:text-sm mt-0.5 drop-shadow-md">{REL_EMOJI[card.relationship]}</span>
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
        <div className="fixed bottom-4 xs:bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.4s_ease-out] w-[90%] xs:w-auto">
          <div 
            className={`bg-gradient-to-r ${REL_COLOR[matchPopup.relationship]} rounded-lg xs:rounded-xl px-4 xs:px-5 sm:px-6 py-3 xs:py-3.5 sm:py-4 shadow-2xl backdrop-blur-sm max-w-sm text-center border border-white/20`}
            style={{
              animation: 'bounceIn 0.4s ease-out forwards',
            }}
          >
            <p className="text-white font-black text-sm xs:text-base sm:text-lg drop-shadow-md">
              {REL_EMOJI[matchPopup.relationship]} {REL_LABEL[matchPopup.relationship]}!
            </p>
            <p className="text-white/90 text-xs xs:text-sm mt-0.5 xs:mt-1">{matchPopup.description}</p>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 xs:p-4 animate-[fadeIn_0.3s_ease-out]">
          <div 
            className="relative rounded-xl xs:rounded-2xl p-4 xs:p-5 sm:p-6 md:p-8 max-w-sm xs:max-w-md w-full text-center border xs:border-2 border-amber-500/50 overflow-hidden mx-2"
            style={{
              background: 'linear-gradient(145deg, rgba(25, 40, 65, 0.98) 0%, rgba(15, 28, 50, 0.99) 100%)',
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            {/* Decorative corners */}
            <div className="absolute top-1.5 xs:top-2 left-1.5 xs:left-2 w-3 xs:w-4 h-3 xs:h-4 border-l xs:border-l-2 border-t xs:border-t-2 border-amber-400/60"></div>
            <div className="absolute top-1.5 xs:top-2 right-1.5 xs:right-2 w-3 xs:w-4 h-3 xs:h-4 border-r xs:border-r-2 border-t xs:border-t-2 border-amber-400/60"></div>
            <div className="absolute bottom-1.5 xs:bottom-2 left-1.5 xs:left-2 w-3 xs:w-4 h-3 xs:h-4 border-l xs:border-l-2 border-b xs:border-b-2 border-amber-400/60"></div>
            <div className="absolute bottom-1.5 xs:bottom-2 right-1.5 xs:right-2 w-3 xs:w-4 h-3 xs:h-4 border-r xs:border-r-2 border-b xs:border-b-2 border-amber-400/60"></div>

            <div className="text-green-400 mb-2 xs:mb-3 sm:mb-4">
              <Trophy className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 mx-auto" />
            </div>
            <h2 className="text-xl xs:text-2xl sm:text-3xl font-bold text-amber-400 mb-1.5 xs:mb-2 drop-shadow-lg">Victory!</h2>
            <p className="text-slate-300 text-sm xs:text-base mb-4 xs:mb-5 sm:mb-6">
              Completed in <span className="text-amber-400 font-bold">{moves} moves</span> and{' '}
              <span className="text-cyan-400 font-bold">{formatTime(timer)}</span>
            </p>

            {/* Matched pairs summary */}
            <div className="bg-slate-800/60 rounded-lg xs:rounded-xl p-3 xs:p-4 mb-4 xs:mb-5 sm:mb-6 border border-slate-700/50">
              <h3 className="text-amber-200 font-medium mb-2 xs:mb-3 flex items-center justify-center gap-1.5 xs:gap-2 text-sm xs:text-base">
                <Sparkles size={14} className="xs:w-4 xs:h-4 text-amber-400" />
                Pairs Found
              </h3>
              <div className="space-y-1.5 xs:space-y-2 max-h-28 xs:max-h-32 sm:max-h-40 overflow-y-auto custom-scrollbar">
                {matchHistory.map((pair, i) => (
                  <div key={i} className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 text-[11px] xs:text-xs sm:text-sm py-0.5 xs:py-1 hover:bg-slate-700/30 rounded-md xs:rounded-lg transition-colors flex-wrap">
                    <span className="text-sm xs:text-base">{REL_EMOJI[pair.relationship]}</span>
                    <span className="text-white font-medium truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">{pair.card1Name}</span>
                    <span className="text-slate-500">+</span>
                    <span className="text-white font-medium truncate max-w-[80px] xs:max-w-[100px] sm:max-w-none">{pair.card2Name}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={initGame}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold py-2 xs:py-2.5 sm:py-3 px-3 xs:px-4 rounded-lg xs:rounded-xl transition-all hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-1.5 xs:gap-2 border border-amber-400/50 text-sm xs:text-base"
            >
              <RotateCcw size={16} className="xs:w-[18px] xs:h-[18px]" />
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Keyframes for animations */}
      <style jsx>{`
        @keyframes bounceIn {
          0%   { opacity: 0; transform: translateX(-50%) translateY(40px) scale(0.8); }
          60%  { transform: translateX(-50%) translateY(-8px) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.4);
          border-radius: 4px;
        }
      `}</style>
      </div> {/* End content wrapper */}
    </div>
  )
}
