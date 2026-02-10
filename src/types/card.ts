/**
 * Data types for RoyaleHaus
 * Based on the Clash Royale cards database
 */

export interface ClashCard {
  id: number
  name: string
  elixir: number
  type: CardType
  rarity: CardRarity
  release_date: string
  evolution_available: boolean
  // Combat properties
  attackType: AttackType | null
  targetAir: boolean | null
  attackSpeed: AttackSpeed | null
  hasHeroMode: boolean
  // Stats at Tournament Level (Level 11)
  damage_lvl_11?: number | null
  // Optional fields for future expansion
  imageUrl?: string
  description?: string
  arena?: number
}

export type AttackType = 'melee' | 'ranged'

export type AttackSpeed = 'very-fast' | 'fast' | 'medium' | 'slow' | 'very-slow'

export type CardType = 'Troop' | 'Spell' | 'Building' | 'Champion' | 'Tower Troop' | 'Evolution' | 'Hero'

export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Champion' | 'Heroic'

// Types for filters and searches
export interface CardFilter {
  name?: string
  type?: CardType
  rarity?: CardRarity
  elixir?: number
  minElixir?: number
  maxElixir?: number
  hasEvolution?: boolean
  releaseYear?: number
}

// Types for the game system
export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  bestStreak: number
  averageTime: number
}

export interface GameSession {
  gameType: GameType
  startTime: Date
  endTime?: Date
  score: number
  completed: boolean
  moves: number
}

// Grid game types
export interface GridCondition {
  type: 'elixir' | 'type' | 'rarity' | 'evolution' | 'release_year'
  value: string | number | boolean
  operator?: 'equals' | 'greater' | 'less' | 'contains'
  label: string
}

export interface GridCell {
  row: number
  col: number
  card?: ClashCard
  isCorrect?: boolean
}

// Wordle game types
export interface WordleGuess {
  word: string
  result: ('correct' | 'present' | 'absent')[]
  timestamp: Date
}

export interface WordleGame {
  targetCard: ClashCard
  guesses: WordleGuess[]
  isCompleted: boolean
  isWon: boolean
}

// Higher/Lower game types
export interface HigherLowerGame {
  currentCard: ClashCard
  nextCard: ClashCard
  score: number
  streak: number
  isGameOver: boolean
  compareBy: 'elixir' | 'release_date'
}

// Impostor game types
export interface ImpostorRound {
  cards: ClashCard[]
  category: string
  impostorIndex: number
  isCompleted: boolean
  isCorrect?: boolean
}

// Type utilities
export type CardProperty = keyof ClashCard
export type GameType = 'grid' | 'wordle' | 'higher-lower' | 'impostor' | 'memory' | 'royaledle' | 'elixir-quiz' | 'timeline'

// Game configuration constants
export const GAME_CONFIG = {
  grid: {
    size: 3,
    timeLimit: 20 * 60, // 20 minutes in seconds
    maxHints: 3,
  },
  wordle: {
    maxGuesses: 6,
    timeLimit: 5 * 60, // 5 minutes
    minNameLength: 3,
    maxNameLength: 15,
  },
  higherLower: {
    timeLimit: null, // No time limit
    streakBonus: 10,
  },
  impostor: {
    cardsPerRound: 5,
    roundsPerGame: 5,
    timeLimit: 10 * 60, // 10 minutes
  },
  memory: {
    easy: { pairs: 6, time: 90 },
    medium: { pairs: 10, time: 120 },
    hard: { pairs: 15, time: 150 },
  },
} as const

// Impostor category types
export interface ImpostorCategory {
  name: string
  property: CardProperty
  value: any
  description: string
}

export const IMPOSTOR_CATEGORIES: ImpostorCategory[] = [
  { name: 'Same Type', property: 'type', value: null, description: 'Cards of the same type' },
  { name: 'Same Rarity', property: 'rarity', value: null, description: 'Cards with same rarity' },
  { name: 'Same Elixir', property: 'elixir', value: null, description: 'Cards costing the same elixir' },
  { name: 'Has Evolution', property: 'evolution_available', value: true, description: 'Cards with evolutions' },
]

// Rarity colors for UI
export const RARITY_COLORS: Record<CardRarity, { bg: string; text: string; border: string; glow: string }> = {
  Common: { bg: 'bg-gray-600', text: 'text-gray-100', border: 'border-gray-400', glow: '#9ca3af' },
  Rare: { bg: 'bg-orange-500', text: 'text-orange-100', border: 'border-orange-400', glow: '#f97316' },
  Epic: { bg: 'bg-purple-600', text: 'text-purple-100', border: 'border-purple-400', glow: '#9333ea' },
  Legendary: { bg: 'bg-yellow-500', text: 'text-yellow-900', border: 'border-yellow-400', glow: '#eab308' },
  Champion: { bg: 'bg-amber-600', text: 'text-amber-100', border: 'border-amber-400', glow: '#d97706' },
  Heroic: { bg: 'bg-cyan-500', text: 'text-cyan-100', border: 'border-cyan-400', glow: '#06b6d4' },
}

// Type icons for UI
export const TYPE_ICONS: Record<CardType, string> = {
  Troop: '⚔️',
  Spell: '✨',
  Building: '🏰',
  Champion: '👑',
  'Tower Troop': '🗼',
  Evolution: '🧬',
  Hero: '🦸',
}

// Elixir cost display
export const getElixirDisplay = (elixir: number): string => {
  if (elixir === 0) return '🔮 Variable'
  return `💧 ${elixir}`
}
