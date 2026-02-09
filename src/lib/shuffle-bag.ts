// Shuffle Bag implementation for Royaledle daily card rotation
// This ensures cards don't repeat until all cards have been used once

import { ClashCard } from '@/types/card';
import { baseCards } from '@/data';

const STORAGE_KEY = 'royaledle-shuffle-bag';
const DAILY_CARD_KEY = 'royaledle-daily-card';

interface ShuffleBagState {
  remainingCardIds: number[];
  usedCardIds: number[];
  lastUpdated: string;
}

interface DailyCardState {
  cardId: number;
  date: string;
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get seed from date for deterministic shuffling
function getDateSeed(dateString: string): number {
  let seed = 0;
  for (let i = 0; i < dateString.length; i++) {
    seed = ((seed << 5) - seed) + dateString.charCodeAt(i);
    seed = seed & seed; // Convert to 32bit integer
  }
  return Math.abs(seed);
}

// Seeded random for deterministic results
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Fisher-Yates shuffle with seeded random
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Initialize or load shuffle bag from localStorage
function getShuffleBag(): ShuffleBagState {
  if (typeof window === 'undefined') {
    return initializeNewBag();
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state: ShuffleBagState = JSON.parse(stored);
      // Validate state
      if (Array.isArray(state.remainingCardIds) && Array.isArray(state.usedCardIds)) {
        return state;
      }
    }
  } catch (e) {
    console.warn('Failed to load shuffle bag, initializing new one');
  }
  
  return initializeNewBag();
}

// Create a fresh shuffle bag with all cards
function initializeNewBag(): ShuffleBagState {
  const seed = getDateSeed(getTodayDate() + '-init');
  const random = seededRandom(seed);
  const shuffledIds = shuffleArray(baseCards.map(c => c.id), random);
  
  return {
    remainingCardIds: shuffledIds,
    usedCardIds: [],
    lastUpdated: getTodayDate(),
  };
}

// Save shuffle bag to localStorage
function saveShuffleBag(state: ShuffleBagState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save shuffle bag');
  }
}

// Get the daily card state
function getDailyCardState(): DailyCardState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(DAILY_CARD_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load daily card state');
  }
  
  return null;
}

// Save daily card state
function saveDailyCardState(state: DailyCardState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(DAILY_CARD_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save daily card state');
  }
}

// Get today's card from the shuffle bag (same card all day for everyone)
export function getDailyCard(): ClashCard {
  const today = getTodayDate();
  
  // Check if we already have a card for today
  const dailyState = getDailyCardState();
  if (dailyState && dailyState.date === today) {
    const card = baseCards.find(c => c.id === dailyState.cardId);
    if (card) return card;
  }
  
  // Need to pick a new card for today
  let bag = getShuffleBag();
  
  // If bag is empty, refill it
  if (bag.remainingCardIds.length === 0) {
    bag = initializeNewBag();
  }
  
  // Pick the first card from remaining
  const cardId = bag.remainingCardIds[0];
  
  // Update the bag (move card to used)
  bag.remainingCardIds = bag.remainingCardIds.slice(1);
  bag.usedCardIds.push(cardId);
  bag.lastUpdated = today;
  
  // Save states
  saveShuffleBag(bag);
  saveDailyCardState({ cardId, date: today });
  
  const card = baseCards.find(c => c.id === cardId);
  if (!card) {
    // Fallback: use deterministic selection based on date
    const seed = getDateSeed(today);
    const index = seed % baseCards.length;
    return baseCards[index];
  }
  
  return card;
}

// Get random card for practice mode (not from shuffle bag)
export function getRandomPracticeCard(): ClashCard {
  const seed = Date.now();
  const random = seededRandom(seed);
  const index = Math.floor(random() * baseCards.length);
  return baseCards[index];
}

// Get shuffle bag stats (for debugging/display)
export function getShuffleBagStats(): { remaining: number; used: number; total: number } {
  const bag = getShuffleBag();
  return {
    remaining: bag.remainingCardIds.length,
    used: bag.usedCardIds.length,
    total: baseCards.length,
  };
}

// Reset shuffle bag (for testing)
export function resetShuffleBag(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DAILY_CARD_KEY);
}
