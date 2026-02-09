// Module wrapper for Clash Royale cards data
import cardsJson from './cards.json'
import type { ClashCard } from '../types/card'

export const cardsData: ClashCard[] = cardsJson as ClashCard[]

// Filter out only base cards (not evolutions) for most games
export const baseCards: ClashCard[] = cardsData.filter(card => card.type !== 'Evolution')

// Get cards by type
export const getCardsByType = (type: ClashCard['type']): ClashCard[] => 
  cardsData.filter(card => card.type === type)

// Get cards by rarity
export const getCardsByRarity = (rarity: ClashCard['rarity']): ClashCard[] => 
  cardsData.filter(card => card.rarity === rarity)

// Get cards by elixir cost
export const getCardsByElixir = (elixir: number): ClashCard[] => 
  cardsData.filter(card => card.elixir === elixir)

// Get cards by attack type (melee/ranged)
export const getCardsByAttackType = (attackType: 'melee' | 'ranged'): ClashCard[] =>
  cardsData.filter(card => card.attackType === attackType)

// Get cards that can target air
export const getCardsThatTargetAir = (canTarget: boolean): ClashCard[] =>
  cardsData.filter(card => card.targetAir === canTarget)

// Get cards by attack speed
export const getCardsByAttackSpeed = (speed: ClashCard['attackSpeed']): ClashCard[] =>
  cardsData.filter(card => card.attackSpeed === speed)

// Get cards with hero mode
export const getCardsWithHeroMode = (): ClashCard[] =>
  cardsData.filter(card => card.hasHeroMode === true)

// Get cards with evolutions
export const getCardsWithEvolution = (): ClashCard[] => 
  cardsData.filter(card => card.evolution_available)

// Get random card
export const getRandomCard = (excludeEvolutions = true): ClashCard => {
  const pool = excludeEvolutions ? baseCards : cardsData
  return pool[Math.floor(Math.random() * pool.length)]
}

// Get random cards (unique)
export const getRandomCards = (count: number, excludeEvolutions = true): ClashCard[] => {
  const pool = excludeEvolutions ? baseCards : cardsData
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export default cardsData
