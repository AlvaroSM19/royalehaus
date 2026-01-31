/**
 * Data types for AnimeHaus
 * Based on the One Piece database structure
 */

export interface AnimeCharacter {
  id: string
  name: string
  crew: string | null
  imageUrl: string
  haki: boolean
  bounty: number | null
  origin: string
  hakiTypes: string[]
  devilFruit: string | null
  features: string[]
}

// Types for filters and searches
export interface CharacterFilter {
  name?: string
  crew?: string | null
  origin?: string
  hasHaki?: boolean
  hasBounty?: boolean
  hasDevilFruit?: boolean
  features?: string[]
  hakiTypes?: string[]
}

// Tipos para el sistema de juegos
export interface GameStats {
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  bestStreak: number
  averageTime: number
}

export interface GameSession {
  gameType: 'grid' | 'wordle' | 'higher-lower' | 'impostor'
  startTime: Date
  endTime?: Date
  score: number
  completed: boolean
  moves: number
}

// Tipos específicos para cada juego
export interface GridCondition {
  type: 'crew' | 'origin' | 'haki' | 'bounty' | 'devilFruit' | 'features'
  value: string | number | boolean
  operator?: 'equals' | 'greater' | 'less' | 'contains'
  label: string
}

export interface GridCell {
  row: number
  col: number
  character?: AnimeCharacter
  isCorrect?: boolean
}

export interface WordleGuess {
  word: string
  result: ('correct' | 'present' | 'absent')[]
  timestamp: Date
}

export interface WordleGame {
  targetCharacter: AnimeCharacter
  guesses: WordleGuess[]
  isCompleted: boolean
  isWon: boolean
}

export interface HigherLowerGame {
  currentCharacter: AnimeCharacter
  nextCharacter: AnimeCharacter
  score: number
  streak: number
  isGameOver: boolean
}

export interface ImpostorRound {
  characters: AnimeCharacter[]
  category: string
  impostorIndex: number
  isCompleted: boolean
  isCorrect?: boolean
}

// Utilidades de tipo
export type CharacterProperty = keyof AnimeCharacter
export type GameType = 'grid' | 'wordle' | 'higher-lower' | 'impostor'

// Constantes de configuración
export const GAME_CONFIG = {
  grid: {
    size: 3,
    timeLimit: 20 * 60, // 20 minutos en segundos
    maxHints: 3,
  },
  wordle: {
    maxGuesses: 6,
    timeLimit: 5 * 60, // 5 minutos
    minNameLength: 3,
    maxNameLength: 12,
  },
  higherLower: {
    timeLimit: null, // Sin límite de tiempo
    streakBonus: 10,
  },
  impostor: {
    charactersPerRound: 5,
    roundsPerGame: 5,
    timeLimit: 10 * 60, // 10 minutos
  },
} as const

// Tipos para categorías de impostor
export interface ImpostorCategory {
  name: string
  property: CharacterProperty
  value: any
  description: string
}

export const IMPOSTOR_CATEGORIES: ImpostorCategory[] = [
  { name: 'Crew Members', property: 'crew', value: null, description: 'Same crew affiliation' },
  { name: 'Haki Users', property: 'haki', value: true, description: 'Can use Haki' },
  { name: 'Devil Fruit Users', property: 'devilFruit', value: null, description: 'Has eaten a Devil Fruit' },
  { name: 'Same Origin', property: 'origin', value: null, description: 'From the same location' },
]
