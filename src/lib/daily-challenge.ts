/**
 * Shared daily-challenge utilities for Royaledle, Emoji Riddle, and Pixel Royale.
 *
 * Design:
 *  - Each day produces ONE deterministic card per game (different seeds).
 *  - Once today's challenge is completed the user can replay the past 7 days.
 *  - Completion flags are stored per-game and per-date in localStorage.
 */

/* ── seeded random (deterministic for a given seed) ── */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* ── date helpers ── */

/** Today's date string (YYYY-MM-DD) in local time */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Return an array of date strings for the last `n` days (including today). */
export function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/* ── countdown ── */
export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  const diff = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── per-game / per-date completion ── */

export interface DailyResult {
  won: boolean;
  guesses: number;
  targetId: number | string;
  date: string;
}

const resultKey = (game: string, date: string) => `${game}-result-${date}`;
const streakKey = (game: string) => `${game}-daily-streak`;

export function getDayResult(game: string, date: string): DailyResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(resultKey(game, date));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDayResult(game: string, result: DailyResult) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(resultKey(game, result.date), JSON.stringify(result));
}

export function isDayCompleted(game: string, date: string): boolean {
  return getDayResult(game, date) !== null;
}

/* ── streak bookkeeping ── */

export interface DailyStreakData {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string;
  history: string[];
}

export function getDailyStreakData(game: string): DailyStreakData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(streakKey(game));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function updateDailyStreak(game: string): DailyStreakData {
  const today = todayStr();
  const existing = getDailyStreakData(game);
  if (!existing) {
    const d: DailyStreakData = {
      currentStreak: 1,
      bestStreak: 1,
      lastPlayedDate: today,
      history: [today],
    };
    localStorage.setItem(streakKey(game), JSON.stringify(d));
    return d;
  }
  if (existing.lastPlayedDate === today) return existing;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const newStreak =
    existing.lastPlayedDate === yesterday.toISOString().slice(0, 10)
      ? existing.currentStreak + 1
      : 1;
  const data: DailyStreakData = {
    currentStreak: newStreak,
    bestStreak: Math.max(newStreak, existing.bestStreak),
    lastPlayedDate: today,
    history: [...existing.history, today].slice(-30),
  };
  localStorage.setItem(streakKey(game), JSON.stringify(data));
  return data;
}

/* ── helpers for the day-selector UI ── */

export interface DayOption {
  date: string;
  label: string;       // "Today", "Yesterday", "Mar 3", etc.
  completed: boolean;
  isToday: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildDayOptions(game: string, days = 8): DayOption[] {
  const dates = lastNDays(days);
  const today = dates[0];
  const yesterday = dates[1];
  return dates.map((date) => {
    const d = new Date(date + 'T12:00:00');
    let label: string;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else label = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
    return { date, label, completed: isDayCompleted(game, date), isToday: date === today };
  });
}
