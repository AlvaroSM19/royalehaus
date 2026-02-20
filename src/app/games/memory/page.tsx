'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Home, Brain, Trophy, Timer } from 'lucide-react'
import Link from 'next/link'
import { cardsData, baseCards } from '@/data'
import type { ClashCard } from '@/types/card'
import { recordMemorySession } from '@/lib/progress'
import { useLanguage } from '@/lib/useLanguage'

// Types
type Relationship = 'counter' | 'ranged' | 'hero' | 'evolution' | 'same_year' | 'same_elixir' | 'same_speed' | 'melee_duo'

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

// Counter pairs
const COUNTER_POOL: PairDef[] = [
  { card1Name: 'Skeleton Army', card2Name: 'The Log', relationship: 'counter', description: 'The Log destroys Skeleton Army' },
  { card1Name: 'Minion Horde', card2Name: 'Arrows', relationship: 'counter', description: 'Arrows destroy Minion Horde' },
  { card1Name: 'Balloon', card2Name: 'Tesla', relationship: 'counter', description: 'Tesla targets air & counters Balloon' },
  { card1Name: 'Hog Rider', card2Name: 'Cannon', relationship: 'counter', description: 'Cannon pulls & counters Hog Rider' },
  { card1Name: 'Giant', card2Name: 'Mini P.E.K.K.A', relationship: 'counter', description: 'Mini P.E.K.K.A melts Giant with high DPS' },
  { card1Name: 'Mega Knight', card2Name: 'P.E.K.K.A', relationship: 'counter', description: 'P.E.K.K.A defeats Mega Knight 1v1' },
  { card1Name: 'Witch', card2Name: 'Lightning', relationship: 'counter', description: 'Lightning eliminates the Witch' },
  { card1Name: 'Goblin Barrel', card2Name: 'Barbarian Barrel', relationship: 'counter', description: 'Barbarian Barrel counters Goblin Barrel' },
  { card1Name: 'Elite Barbarians', card2Name: 'Bowler', relationship: 'counter', description: 'Bowler pushes back Elite Barbarians' },
  { card1Name: 'X-Bow', card2Name: 'Earthquake', relationship: 'counter', description: 'Earthquake deals extra damage to buildings' },
  { card1Name: 'Royal Giant', card2Name: 'Inferno Tower', relationship: 'counter', description: 'Inferno Tower melts Royal Giant' },
  { card1Name: 'Golem', card2Name: 'Inferno Dragon', relationship: 'counter', description: 'Inferno Dragon melts Golem' },
  { card1Name: 'Sparky', card2Name: 'Electro Spirit', relationship: 'counter', description: 'Electro Spirit resets Sparky' },
  { card1Name: 'Lava Hound', card2Name: 'Mega Minion', relationship: 'counter', description: 'Mega Minion targets Lava Hound in the air' },
  { card1Name: 'Prince', card2Name: 'Guards', relationship: 'counter', description: 'Guards absorb Prince charge with shields' },
]

// Ranged pairs
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

// Hero pairs
const HERO_POOL: PairDef[] = [
  { card1Name: 'Hero Knight', card2Name: 'Hero Mini P.E.K.K.A', relationship: 'hero', description: 'Both are Hero cards' },
  { card1Name: 'Hero Musketeer', card2Name: 'Hero Giant', relationship: 'hero', description: 'Both are Hero cards' },
]

// Spell evolution pairs
const SPELL_EVOLUTION_POOL: PairDef[] = [
  { card1Name: 'Zap', card2Name: 'Zap Evolution', relationship: 'evolution', description: 'Zap & its Evolution form' },
  { card1Name: 'Giant Snowball', card2Name: 'Giant Snowball Evolution', relationship: 'evolution', description: 'Giant Snowball & its Evolution' },
  { card1Name: 'Goblin Drill', card2Name: 'Goblin Drill Evolution', relationship: 'evolution', description: 'Goblin Drill & its Evolution' },
]

// Same elixir cost pairs (cards sharing the same cost)
const SAME_ELIXIR_POOL: PairDef[] = [
  { card1Name: 'Hog Rider', card2Name: 'Valkyrie', relationship: 'same_elixir', description: 'Both cost 4 elixir' },
  { card1Name: 'Musketeer', card2Name: 'Mini P.E.K.K.A', relationship: 'same_elixir', description: 'Both cost 4 elixir' },
  { card1Name: 'Golem', card2Name: 'Three Musketeers', relationship: 'same_elixir', description: 'Both cost 8+ elixir - expensive!' },
  { card1Name: 'Ice Spirit', card2Name: 'Skeletons', relationship: 'same_elixir', description: 'Both cost 1 elixir - cheapest cycle cards' },
  { card1Name: 'Fireball', card2Name: 'Poison', relationship: 'same_elixir', description: 'Both cost 4 elixir spells' },
  { card1Name: 'P.E.K.K.A', card2Name: 'Lava Hound', relationship: 'same_elixir', description: 'Both cost 7 elixir - heavy tanks' },
]

// Same attack speed pairs
const SAME_SPEED_POOL: PairDef[] = [
  { card1Name: 'Prince', card2Name: 'Lumberjack', relationship: 'same_speed', description: 'Both have Very Fast attack speed' },
  { card1Name: 'Bowler', card2Name: 'Sparky', relationship: 'same_speed', description: 'Both have Very Slow attack speed' },
  { card1Name: 'Knight', card2Name: 'Bandit', relationship: 'same_speed', description: 'Both have Medium attack speed' },
  { card1Name: 'Wizard', card2Name: 'Witch', relationship: 'same_speed', description: 'Both have Medium attack speed' },
]

// Melee duo pairs
const MELEE_DUO_POOL: PairDef[] = [
  { card1Name: 'P.E.K.K.A', card2Name: 'Mega Knight', relationship: 'melee_duo', description: 'Both are melee tanks' },
  { card1Name: 'Knight', card2Name: 'Valkyrie', relationship: 'melee_duo', description: 'Both are melee mini-tanks' },
  { card1Name: 'Lumberjack', card2Name: 'Mini P.E.K.K.A', relationship: 'melee_duo', description: 'Both are fast melee DPS' },
  { card1Name: 'Dark Prince', card2Name: 'Prince', relationship: 'melee_duo', description: 'Both are melee with charge' },
  { card1Name: 'Barbarians', card2Name: 'Elite Barbarians', relationship: 'melee_duo', description: 'Both are Barbarian melee cards' },
]

function generateEvolutionPool(): PairDef[] {
  const pairs: PairDef[] = []
  const spellEvoNames = new Set(SPELL_EVOLUTION_POOL.flatMap(p => [p.card1Name, p.card2Name]))
  const evolutionCards = cardsData.filter(c => c.type === 'Evolution')
  evolutionCards.forEach(evoCard => {
    if (spellEvoNames.has(evoCard.name)) return
    const baseName = evoCard.name.replace(' Evolution', '')
    const baseCard = baseCards.find(c => c.name === baseName)
    if (baseCard) {
      pairs.push({ card1Name: baseName, card2Name: evoCard.name, relationship: 'evolution', description: `${evoCard.name} is the evolution of ${baseName}` })
    }
  })
  return pairs
}

function generateSameYearPool(): PairDef[] {
  const pairs: PairDef[] = []
  const byYear: Record<number, ClashCard[]> = {}
  baseCards.forEach(c => {
    if (!c.release_date) return
    const year = parseInt(c.release_date.slice(0, 4), 10)
    if (year < 2017 || year > 2025) return
    if (c.type === 'Evolution' || c.type === 'Hero') return
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(c)
  })
  Object.entries(byYear).forEach(([yearStr, cards]) => {
    const year = parseInt(yearStr, 10)
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      pairs.push({ card1Name: shuffled[i].name, card2Name: shuffled[i + 1].name, relationship: 'same_year', description: `Both released in ${year}` })
    }
  })
  return pairs
}

// Pair selection with variety (9 pairs)
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

  // Diverse mix: counter, evolution, same_elixir, melee, same_speed, ranged, hero, same_year
  addPairs(COUNTER_POOL, 2)
  addPairs(generateEvolutionPool(), 1)
  addPairs(SAME_ELIXIR_POOL, 1)
  addPairs(MELEE_DUO_POOL, 1)
  addPairs(SAME_SPEED_POOL, 1)
  addPairs(RANGED_POOL, 1)
  addPairs(HERO_POOL, 1)
  addPairs(generateSameYearPool(), 1)

  // Fill remaining
  if (selected.length < TOTAL_PAIRS) {
    addPairs([...COUNTER_POOL, ...RANGED_POOL, ...SPELL_EVOLUTION_POOL, ...SAME_ELIXIR_POOL, ...MELEE_DUO_POOL, ...generateSameYearPool()], TOTAL_PAIRS - selected.length)
  }

  return selected
}

// Relationship display config
const REL_EMOJI: Record<Relationship, string> = {
  counter: '⚔️', ranged: '🏹', hero: '🦸', evolution: '✨',
  same_year: '📅', same_elixir: '💧', same_speed: '⚡', melee_duo: '🗡️',
}
const REL_LABEL: Record<Relationship, string> = {
  counter: 'Counter', ranged: 'Ranged', hero: 'Hero', evolution: 'Evolution',
  same_year: 'Same Year', same_elixir: 'Same Elixir', same_speed: 'Same Speed', melee_duo: 'Melee Duo',
}
const REL_COLOR: Record<Relationship, string> = {
  counter: 'from-red-500/90 to-red-700/90 border-red-400',
  ranged: 'from-blue-500/90 to-blue-700/90 border-blue-400',
  hero: 'from-amber-500/90 to-amber-700/90 border-amber-400',
  evolution: 'from-purple-500/90 to-purple-700/90 border-purple-400',
  same_year: 'from-green-500/90 to-green-700/90 border-green-400',
  same_elixir: 'from-cyan-500/90 to-cyan-700/90 border-cyan-400',
  same_speed: 'from-yellow-500/90 to-yellow-700/90 border-yellow-400',
  melee_duo: 'from-orange-500/90 to-orange-700/90 border-orange-400',
}

export default function RoyaleMemoryGame() {
  const { getCardNameTranslated } = useLanguage()
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

  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-memory-best')
    if (saved) setBestScore(parseInt(saved, 10))
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (gameStarted && !gameWon && !showPreview) {
      interval = setInterval(() => setTimer(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [gameStarted, gameWon, showPreview])

  const initGame = useCallback(() => {
    const pairs = selectGamePairs()
    const memoryCards: MemoryCard[] = []
    pairs.forEach((pair, idx) => {
      const c1 = cardsData.find(c => c.name === pair.card1Name)!
      const c2 = cardsData.find(c => c.name === pair.card2Name)!
      memoryCards.push(
        { id: idx * 2, pairId: idx, card: c1, isFlipped: true, isMatched: false, relationship: pair.relationship, matchDescription: pair.description },
        { id: idx * 2 + 1, pairId: idx, card: c2, isFlipped: true, isMatched: false, relationship: pair.relationship, matchDescription: pair.description },
      )
    })
    const shuffled = [...memoryCards].sort(() => Math.random() - 0.5)
    setCards(shuffled); setFlippedCards([]); setMoves(0); setMatchedPairs(0)
    setGameWon(false); setGameStarted(true); setTimer(0); setIsChecking(false)
    setMatchPopup(null); setMatchHistory([])
    setShowPreview(true)
    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isFlipped: false })))
      setShowPreview(false)
    }, 2500)
  }, [])

  useEffect(() => { initGame() }, [initGame])

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
          setCards(prev => prev.map(c => c.pairId === card1.pairId ? { ...c, isMatched: true } : c))
          setMatchPopup({ relationship: card1.relationship, description: card1.matchDescription })
          setMatchHistory(prev => [...prev, { card1Name: card1.card.name, card2Name: card2.card.name, relationship: card1.relationship, description: card1.matchDescription }])
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
          setCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, isFlipped: false } : c))
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

  // Star rating based on moves
  const getStars = (m: number): number => {
    if (m <= 12) return 3
    if (m <= 18) return 2
    return 1
  }

  if (!gameStarted || cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-2xl text-amber-200 animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="w-full bg-[#042836]/80 backdrop-blur-sm border-b border-amber-700/40 px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-20 shadow-lg shadow-black/40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs">
              <Home size={16} /><span className="hidden sm:inline">Home</span>
            </Link>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow flex items-center gap-2">
              <Brain size={20} className="text-amber-400" /> Royale Memory
            </h1>
          </div>
          <button onClick={initGame} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-bold rounded-lg hover:brightness-110 transition text-xs sm:text-sm shadow-lg shadow-amber-500/20">
            <RotateCcw size={14} /><span className="hidden sm:inline">New Game</span>
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="w-full bg-slate-800/60 border-b border-slate-700/50 px-3 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Timer size={14} /><span>{formatTime(timer)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <span>Moves: {moves}</span>
          </div>
          <div className="flex items-center gap-1.5 text-green-400">
            <Trophy size={14} /><span>{matchedPairs}/{TOTAL_PAIRS}</span>
          </div>
          {bestScore && (
            <div className="flex items-center gap-1.5 text-gray-400">
              <span>Best: {bestScore}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview countdown */}
      {showPreview && (
        <div className="text-center py-2 bg-amber-600/15 border-b border-amber-500/30 text-amber-300 font-semibold text-sm animate-pulse">
          Memorize the cards & their relationships!
        </div>
      )}

      {/* Relationship Legend */}
      <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 mt-2">
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {(['counter', 'evolution', 'same_elixir', 'melee_duo', 'same_speed', 'ranged', 'hero', 'same_year'] as Relationship[]).map(rel => (
            <span key={rel} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-[9px] sm:text-[10px] text-slate-300">
              {REL_EMOJI[rel]} {REL_LABEL[rel]}
            </span>
          ))}
        </div>
      </div>

      {/* Game Board 6x3 */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div className="grid gap-2 sm:gap-2.5" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', maxWidth: 680 }}>
          {cards.map(card => {
            const faceUp = card.isFlipped || card.isMatched
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                disabled={card.isMatched || card.isFlipped || isChecking || showPreview}
                className={`
                  relative aspect-[3/4] w-[80px] sm:w-[96px] md:w-[100px] rounded-xl overflow-hidden
                  transition-all duration-300 transform
                  ${!faceUp ? 'hover:scale-105 cursor-pointer' : ''}
                  ${card.isMatched ? 'opacity-75 scale-95' : ''}
                `}
              >
                {/* Card Back - CSS styled (no image dependency) */}
                {!faceUp && (
                  <div className="absolute inset-0 rounded-xl border-2 border-amber-500/60 shadow-lg overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #b45309 0%, #92400e 30%, #78350f 50%, #92400e 70%, #b45309 100%)' }}
                  >
                    {/* Decorative pattern */}
                    <div className="absolute inset-1 rounded-lg border border-amber-400/30" />
                    <div className="absolute inset-2 rounded-md border border-amber-300/15" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-amber-400/40 flex items-center justify-center bg-amber-900/50">
                        <span className="text-xl sm:text-2xl select-none">👑</span>
                      </div>
                    </div>
                    {/* Corner diamonds */}
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 rotate-45 bg-amber-400/30 rounded-sm" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 rotate-45 bg-amber-400/30 rounded-sm" />
                    <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rotate-45 bg-amber-400/30 rounded-sm" />
                    <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rotate-45 bg-amber-400/30 rounded-sm" />
                  </div>
                )}

                {/* Card Front */}
                {faceUp && (
                  <div className={`absolute inset-0 rounded-xl border-2 ${
                    card.isMatched ? 'border-green-400/80 bg-gradient-to-b from-green-900/40 to-slate-900/90' : 'border-cyan-500/60 bg-gradient-to-b from-slate-800/90 to-slate-900/95'
                  } flex flex-col items-center justify-center p-1 shadow-lg`}>
                    <img
                      src={`/images/cards/${card.card.id}.webp`}
                      alt={card.card.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain"
                    />
                    <p className="text-[8px] sm:text-[9px] text-white text-center mt-0.5 leading-tight line-clamp-2 font-medium px-0.5">
                      {getCardNameTranslated(card.card.id)}
                    </p>
                    {card.isMatched && (
                      <span className="absolute top-0.5 right-0.5 text-[10px] bg-black/40 rounded-full w-4 h-4 flex items-center justify-center">{REL_EMOJI[card.relationship]}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </main>

      {/* Match Popup */}
      {matchPopup && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50" style={{ animation: 'bounceIn 0.4s ease-out forwards' }}>
          <div className={`bg-gradient-to-r ${REL_COLOR[matchPopup.relationship]} border rounded-xl px-5 py-3 shadow-2xl backdrop-blur-sm max-w-sm text-center`}>
            <p className="text-white font-black text-base">{REL_EMOJI[matchPopup.relationship]} {REL_LABEL[matchPopup.relationship]}!</p>
            <p className="text-white/90 text-xs mt-0.5">{matchPopup.description}</p>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {gameWon && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative rounded-2xl overflow-hidden max-w-md w-full" style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98) 0%, rgba(35,25,12,0.99) 50%, rgba(20,15,8,0.98) 100%)', border: '3px solid rgba(245,180,50,0.7)', boxShadow: '0 0 40px rgba(245,180,50,0.3)' }}>
            <div className="absolute inset-1.5 rounded-xl border border-amber-500/30 pointer-events-none" />
            <div className="p-6 sm:p-8 text-center">
              {/* Stars */}
              <div className="text-4xl mb-2 flex justify-center gap-1">
                {[1, 2, 3].map(s => (
                  <span key={s} className={s <= getStars(moves) ? 'drop-shadow-lg' : 'opacity-30'}>{s <= getStars(moves) ? '⭐' : '☆'}</span>
                ))}
              </div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 mb-1">Victory!</h2>
              <p className="text-slate-300 mb-4 text-sm">
                Completed in <span className="text-amber-400 font-bold">{moves} moves</span> and <span className="text-cyan-400 font-bold">{formatTime(timer)}</span>
              </p>

              {/* Pairs summary */}
              <div className="bg-slate-800/50 rounded-xl p-3 mb-5 border border-slate-700/40">
                <h3 className="text-amber-400/80 font-bold text-xs uppercase tracking-wider mb-2">Pairs Found</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {matchHistory.map((pair, i) => (
                    <div key={i} className="flex items-center justify-center gap-1.5 text-xs">
                      <span className="text-[10px]">{REL_EMOJI[pair.relationship]}</span>
                      <span className="text-white font-medium">{pair.card1Name}</span>
                      <span className="text-slate-500">+</span>
                      <span className="text-white font-medium">{pair.card2Name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={initGame} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-black rounded-xl hover:brightness-110 transition shadow-lg shadow-amber-500/30 uppercase tracking-wider text-sm">
                <RotateCcw size={16} /> Play Again
              </button>
            </div>
          </div>
        </div>
      )}

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