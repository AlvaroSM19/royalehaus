'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import './styles.css'
import { RotateCcw, Timer, Trophy, Home } from 'lucide-react'
import Link from 'next/link'
import { cardsData, baseCards } from '@/data'
import type { ClashCard } from '@/types/card'
import { recordMemorySession } from '@/lib/progress'
import { useLanguage } from '@/lib/useLanguage'

// ─── Types ─────────────────────────────────────────────────────────────
type Relationship = 'counter' | 'ranged' | 'hero' | 'evolution' | 'same_year' | 'same_elixir' | 'same_speed' | 'melee_duo'

interface PairDef {
  card1Name: string
  card2Name: string
  relationship: Relationship
  description: string
}

interface GameCard {
  id: string
  pairId: number
  card: ClashCard
  isFlipped: boolean
  isMatched: boolean
  relationship: Relationship
  matchDescription: string
  matchTag: string
}

interface MatchNotification {
  id: string
  connection: string
  names: [string, string]
}

// ─── Pair pools ────────────────────────────────────────────────────────
const COUNTER_POOL: PairDef[] = [
  { card1Name: 'Skeleton Army', card2Name: 'The Log', relationship: 'counter', description: 'The Log destroys Skeleton Army' },
  { card1Name: 'Minion Horde', card2Name: 'Arrows', relationship: 'counter', description: 'Arrows destroy Minion Horde' },
  { card1Name: 'Balloon', card2Name: 'Tesla', relationship: 'counter', description: 'Tesla targets air & counters Balloon' },
  { card1Name: 'Hog Rider', card2Name: 'Cannon', relationship: 'counter', description: 'Cannon pulls & counters Hog Rider' },
  { card1Name: 'Giant', card2Name: 'Mini P.E.K.K.A', relationship: 'counter', description: 'Mini P.E.K.K.A melts Giant' },
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

const HERO_POOL: PairDef[] = [
  { card1Name: 'Hero Knight', card2Name: 'Hero Mini P.E.K.K.A', relationship: 'hero', description: 'Both are Hero cards' },
  { card1Name: 'Hero Musketeer', card2Name: 'Hero Giant', relationship: 'hero', description: 'Both are Hero cards' },
]

const SPELL_EVOLUTION_POOL: PairDef[] = [
  { card1Name: 'Zap', card2Name: 'Zap Evolution', relationship: 'evolution', description: 'Zap & its Evolution form' },
  { card1Name: 'Giant Snowball', card2Name: 'Giant Snowball Evolution', relationship: 'evolution', description: 'Giant Snowball & its Evolution' },
  { card1Name: 'Goblin Drill', card2Name: 'Goblin Drill Evolution', relationship: 'evolution', description: 'Goblin Drill & its Evolution' },
]

const SAME_ELIXIR_POOL: PairDef[] = [
  { card1Name: 'Hog Rider', card2Name: 'Valkyrie', relationship: 'same_elixir', description: 'Both cost 4 elixir' },
  { card1Name: 'Musketeer', card2Name: 'Mini P.E.K.K.A', relationship: 'same_elixir', description: 'Both cost 4 elixir' },
  { card1Name: 'Golem', card2Name: 'Three Musketeers', relationship: 'same_elixir', description: 'Both cost 8+ elixir' },
  { card1Name: 'Ice Spirit', card2Name: 'Skeletons', relationship: 'same_elixir', description: 'Both cost 1 elixir' },
  { card1Name: 'Fireball', card2Name: 'Poison', relationship: 'same_elixir', description: 'Both cost 4 elixir spells' },
  { card1Name: 'P.E.K.K.A', card2Name: 'Lava Hound', relationship: 'same_elixir', description: 'Both cost 7 elixir' },
]

const SAME_SPEED_POOL: PairDef[] = [
  { card1Name: 'Prince', card2Name: 'Lumberjack', relationship: 'same_speed', description: 'Both have Very Fast attack speed' },
  { card1Name: 'Bowler', card2Name: 'Sparky', relationship: 'same_speed', description: 'Both have Very Slow attack speed' },
  { card1Name: 'Knight', card2Name: 'Bandit', relationship: 'same_speed', description: 'Both have Medium attack speed' },
  { card1Name: 'Wizard', card2Name: 'Witch', relationship: 'same_speed', description: 'Both have Medium attack speed' },
]

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

// ─── Relationship config ───────────────────────────────────────────────
const REL_EMOJI: Record<Relationship, string> = {
  counter: '\u2694\uFE0F', ranged: '\uD83C\uDFF9', hero: '\uD83E\uDDB8', evolution: '\u2728',
  same_year: '\uD83D\uDCC5', same_elixir: '\uD83D\uDCA7', same_speed: '\u26A1', melee_duo: '\uD83D\uDDE1\uFE0F',
}
const REL_LABEL: Record<Relationship, string> = {
  counter: 'Counter', ranged: 'Ranged', hero: 'Hero', evolution: 'Evolution',
  same_year: 'Same Year', same_elixir: 'Same Elixir', same_speed: 'Same Speed', melee_duo: 'Melee Duo',
}

// ─── Pair selection (8 pairs = 16 cards for 4x4 grid) ─────────────────
const TOTAL_PAIRS = 8

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

  addPairs(COUNTER_POOL, 2)
  addPairs(generateEvolutionPool(), 1)
  addPairs(SAME_ELIXIR_POOL, 1)
  addPairs(MELEE_DUO_POOL, 1)
  addPairs(SAME_SPEED_POOL, 1)
  addPairs(RANGED_POOL, 1)
  addPairs(HERO_POOL, 1)

  if (selected.length < TOTAL_PAIRS) {
    addPairs([...COUNTER_POOL, ...RANGED_POOL, ...SPELL_EVOLUTION_POOL, ...SAME_ELIXIR_POOL, ...MELEE_DUO_POOL, ...generateSameYearPool()], TOTAL_PAIRS - selected.length)
  }

  return selected
}

// ═══════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function RoyaleMemoryGame() {
  const { getCardNameTranslated } = useLanguage()
  const headerRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const recordedRef = useRef(false)
  const [cardSize, setCardSize] = useState(170)

  // Build deck from pair definitions
  const buildDeck = useCallback((): GameCard[] => {
    const pairs = selectGamePairs()
    const deck: GameCard[] = []
    pairs.forEach((pair, idx) => {
      const c1 = cardsData.find(c => c.name === pair.card1Name)!
      const c2 = cardsData.find(c => c.name === pair.card2Name)!
      const tag = `${pair.relationship}:${pair.card1Name}|${pair.card2Name}`
      deck.push(
        { id: `${idx}-0-${Math.random().toString(36).slice(2,6)}`, pairId: idx, card: c1, isFlipped: false, isMatched: false, relationship: pair.relationship, matchDescription: pair.description, matchTag: tag },
        { id: `${idx}-1-${Math.random().toString(36).slice(2,6)}`, pairId: idx, card: c2, isFlipped: false, isMatched: false, relationship: pair.relationship, matchDescription: pair.description, matchTag: tag },
      )
    })
    return [...deck].sort(() => Math.random() - 0.5)
  }, [])

  const [cards, setCards] = useState<GameCard[]>(() => buildDeck())
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [firstChoice, setFirstChoice] = useState<GameCard | null>(null)
  const [secondChoice, setSecondChoice] = useState<GameCard | null>(null)
  const [canClick, setCanClick] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTimeLeft, setPreviewTimeLeft] = useState(3)
  const [matchNotifications, setMatchNotifications] = useState<MatchNotification[]>([])

  // Load best score
  useEffect(() => {
    const saved = localStorage.getItem('royalehaus-memory-best')
    if (saved) setBestScore(parseInt(saved))
  }, [])

  // Preview timer
  useEffect(() => {
    if (showPreview) {
      setCanClick(false)
      setPreviewTimeLeft(3)
      const countdown = setInterval(() => {
        setPreviewTimeLeft((prev: number) => {
          const t = prev - 0.1
          if (t <= 0) { clearInterval(countdown); return 0 }
          return t
        })
      }, 100)
      const done = setTimeout(() => {
        setShowPreview(false)
        setCanClick(true)
        clearInterval(countdown)
      }, 3000)
      return () => { clearTimeout(done); clearInterval(countdown) }
    }
  }, [showPreview])

  // Auto-preview on first load
  useEffect(() => {
    setIsPlaying(false)
    setCanClick(false)
    setShowPreview(true)
    setPreviewTimeLeft(3)
  }, [])

  // Game timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isPlaying) {
      timer = setInterval(() => setTime((p: number) => p + 1), 1000)
    }
    return () => clearInterval(timer)
  }, [isPlaying])

  // Responsive card size
  const recomputeCardSize = useCallback(() => {
    if (typeof window === 'undefined') return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const hH = headerRef.current?.getBoundingClientRect().height || 60
    const sH = statsRef.current?.getBoundingClientRect().height || 100
    const gap = vw < 380 ? 4 : vw < 480 ? 6 : vw < 640 ? 8 : 12
    const previewH = showPreview ? 50 : 0
    const hPad = vw < 380 ? 8 : vw < 480 ? 12 : vw < 640 ? 16 : 32
    const maxW = Math.floor((vw - hPad * 2 - gap * 3) / 4)
    const maxH = Math.floor((vh - hH - sH - previewH - 40 - gap * 3) / 4)
    const base = Math.min(maxH, maxW, 200)
    const minA = vw > 820 ? 140 : vw > 640 ? 120 : vw > 480 ? 100 : vw > 380 ? 75 : 65
    setCardSize(Math.max(minA, base))
  }, [showPreview])

  useEffect(() => {
    recomputeCardSize()
    window.addEventListener('resize', recomputeCardSize)
    window.addEventListener('orientationchange', recomputeCardSize)
    return () => {
      window.removeEventListener('resize', recomputeCardSize)
      window.removeEventListener('orientationchange', recomputeCardSize)
    }
  }, [recomputeCardSize])

  const startNewGame = () => {
    const deck = buildDeck()
    setCards(deck); setScore(0); setMoves(0); setTime(0)
    setIsPlaying(false); setFirstChoice(null); setSecondChoice(null)
    setCanClick(false); setShowPreview(true); setPreviewTimeLeft(3)
    setMatchNotifications([]); recordedRef.current = false
  }

  const handleCardClick = (clicked: GameCard) => {
    if (!canClick || clicked.isFlipped || clicked.isMatched || showPreview) return
    if (!isPlaying) setIsPlaying(true)

    const newCards: GameCard[] = cards.map((c: GameCard) =>
      c.id === clicked.id ? { ...c, isFlipped: true } : c
    )
    setCards(newCards)

    if (firstChoice === null) {
      setFirstChoice(clicked)
    } else {
      setSecondChoice(clicked)
      setCanClick(false)
      setMoves((p: number) => p + 1)

      const isMatch = firstChoice.matchTag === clicked.matchTag

      if (isMatch) {
        setScore((p: number) => p + 10)
        setCards((prev: GameCard[]) =>
          prev.map((c: GameCard) =>
            c.id === firstChoice.id || c.id === clicked.id
              ? { ...c, isMatched: true, isFlipped: true } : c
          )
        )
        const nId = `${firstChoice.id}-${clicked.id}-${Date.now()}`
        setMatchNotifications(prev => [...prev, {
          id: nId,
          connection: `${REL_EMOJI[firstChoice.relationship]} ${REL_LABEL[firstChoice.relationship]}`,
          names: [firstChoice.card.name, clicked.card.name]
        }])
        setTimeout(() => setMatchNotifications(prev => prev.filter(n => n.id !== nId)), 2500)
        setCanClick(true)
      } else {
        setTimeout(() => {
          setCards((prev: GameCard[]) =>
            prev.map((c: GameCard) =>
              c.id === firstChoice.id || c.id === clicked.id
                ? { ...c, isFlipped: false } : c
            )
          )
          setCanClick(true)
        }, 1000)
      }
      setFirstChoice(null)
      setSecondChoice(null)
    }
  }

  // Game completion
  useEffect(() => {
    if (cards.every((c: GameCard) => c.isMatched) && cards.length > 0) {
      setIsPlaying(false)
      if (score > bestScore) {
        setBestScore(score)
        localStorage.setItem('royalehaus-memory-best', score.toString())
      }
      if (!recordedRef.current) {
        recordedRef.current = true
        recordMemorySession(moves, time, 'hard')
      }
    }
  }, [cards, score, bestScore, moves, time])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec < 10 ? '0' : ''}${sec}`
  }

  const gap = typeof window !== 'undefined'
    ? (window.innerWidth < 380 ? 4 : window.innerWidth < 480 ? 6 : window.innerWidth < 640 ? 8 : 12)
    : 12
  const gridW = cardSize * 4 + gap * 3

  return (
    <div className="min-h-screen relative text-amber-100">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/65 via-black/55 to-black/70 -z-10" />
      <div className="relative z-10">
        {/* Header */}
        <div ref={headerRef} className="border-b border-amber-700/40 bg-[#042836]/70 backdrop-blur-sm sticky top-0 z-40 shadow-lg shadow-black/40">
          <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <Link href="/" className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline">Home</span>
                </Link>
                <h1 className="text-base sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow">Royale Memory</h1>
              </div>
              <button onClick={startNewGame} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-semibold shadow shadow-black/40 hover:brightness-110 transition text-xs sm:text-base">
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" /> New Game
              </button>
            </div>
          </div>
        </div>

        {/* Match Notifications */}
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {matchNotifications.map((n) => (
            <div key={n.id} className="bg-gradient-to-r from-green-600/95 to-emerald-600/95 backdrop-blur-sm border border-green-400/50 rounded-xl px-4 py-3 shadow-lg shadow-black/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="text-center">
                <p className="text-green-100 text-xs uppercase tracking-wide mb-1">Match Found!</p>
                <p className="text-white font-bold text-sm">{n.connection}</p>
                <p className="text-green-200/80 text-xs mt-1">{n.names[0]} + {n.names[1]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4" ref={statsRef}>
          <div className="mx-auto" style={{ maxWidth: gridW }}>
            {showPreview && (
              <div className="bg-amber-500/20 border border-amber-400/40 backdrop-blur-sm rounded-lg p-2 sm:p-4 mb-2 sm:mb-4 text-center">
                <div className="flex items-center justify-center gap-1 sm:gap-2 text-amber-200">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span className="font-semibold text-xs sm:text-base">Memorize the cards! {previewTimeLeft.toFixed(1)}s</span>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center bg-[#06394f]/70 border border-amber-700/40 backdrop-blur-sm rounded-lg p-2 sm:p-3 mb-3 sm:mb-6 shadow shadow-black/40">
              <div className="flex items-center gap-3 sm:gap-8">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-amber-200/60">Best</p>
                    <p className="font-bold text-sm sm:text-base">{bestScore}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                  <div>
                    <p className="text-[10px] sm:text-xs uppercase tracking-wide text-amber-200/60">Time</p>
                    <p className="font-bold text-sm sm:text-base">{formatTime(time)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-8">
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-amber-200/60">Moves</p>
                  <p className="font-bold text-sm sm:text-base">{moves}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-amber-200/60">Score</p>
                  <p className="font-bold text-sm sm:text-base">{score}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Area — 4x4 Grid */}
        <div className="container mx-auto px-1 sm:px-4 pb-4 sm:pb-12">
          <div className="mx-auto" style={{ maxWidth: gridW }}>
            <div className="grid grid-cols-4 mb-4 sm:mb-8 mx-auto" style={{ gap, width: gridW }}>
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`group rounded-xl transition-transform duration-300 ${card.isMatched ? 'matched-card cursor-default' : 'cursor-pointer hover:scale-[1.02]'} ${showPreview ? 'cursor-default' : ''}`}
                  style={{ perspective: '1000px', width: cardSize, height: cardSize }}
                >
                  <div
                    className={`card-3d-wrapper transition-transform duration-500 ${(card.isFlipped || card.isMatched || showPreview) ? 'rotate-y-180' : 'rotate-y-0'}`}
                    style={{ width: cardSize, height: cardSize }}
                  >
                    {/* Back */}
                    <div className="card-face back rounded-xl overflow-hidden" style={{ width: cardSize, height: cardSize }}>
                      <img
                        src="/images/games/memory/card-back.png"
                        alt="Card back"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const parent = e.currentTarget.parentElement as HTMLElement
                          if (parent) parent.classList.add('card-back-royal')
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="shield-ring" />
                      <div className="shield-cross" />
                      <div className="game-title">CLASH ROYALE</div>
                    </div>
                    {/* Front */}
                    <div className="card-face front rounded-xl overflow-hidden" style={{ width: cardSize, height: cardSize }}>
                      <div className="w-full h-full card-front-frame hover:shadow-lg shadow shadow-black/40 relative" style={{ width: cardSize, height: cardSize }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
                          <img
                            src={`/images/cards/${card.card.id}.webp`}
                            alt={getCardNameTranslated(card.card.id)}
                            className="w-3/4 h-3/4 object-contain drop-shadow-lg"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                          <h3 className="text-amber-100 font-semibold text-[10px] sm:text-sm drop-shadow text-center leading-tight">{getCardNameTranslated(card.card.id)}</h3>
                        </div>
                        {card.isMatched && (
                          <span className="absolute top-1 right-1 text-[10px] bg-black/50 rounded-full w-5 h-5 flex items-center justify-center">{REL_EMOJI[card.relationship]}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Win Modal */}
              {!isPlaying && cards.length > 0 && cards.every(c => c.isMatched) && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(180deg, rgba(20,15,8,0.98) 0%, rgba(35,25,12,0.99) 50%, rgba(20,15,8,0.98) 100%)', border: '3px solid rgba(245,180,50,0.7)', boxShadow: '0 0 40px rgba(245,180,50,0.3)' }}>
                    <div className="absolute inset-1.5 rounded-xl border border-amber-500/30 pointer-events-none" />
                    <div className="p-6 sm:p-8 text-center">
                      <div className="text-4xl mb-2">🏆</div>
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500 mb-1">Victory!</h2>
                      <p className="text-slate-300 mb-5 text-sm">
                        Completed in <span className="text-amber-400 font-bold">{formatTime(time)}</span> with <span className="text-cyan-400 font-bold">{moves} moves</span> — Score: <span className="text-emerald-400 font-bold">{score}</span>
                      </p>
                      <button onClick={startNewGame} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black font-semibold shadow-lg shadow-black/40 hover:brightness-110 transition">
                        <RotateCcw className="w-5 h-5" /> Play Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}