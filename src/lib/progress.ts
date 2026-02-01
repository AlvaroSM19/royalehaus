// Simplified progress module (client). Awarding sólo en servidor (XP rules centralizadas).

export interface HigherLowerHighScore { bestStreak: number; updatedAt: string }
export interface RoyaledleHighScore { bestWinAttempts: number; updatedAt: string }
export interface WordleHighScore { bestAttempts: number; longestWordLength: number; updatedAt: string }
export interface ImpostorHighScore { bestStreak: number; bestScore: number; updatedAt: string }

export interface UserProgress { 
  version: number; 
  calendar: string[]; 
  stats: { gamesPlayedTotal: number; gamesPlayedById: Record<string, number> }; 
  highScores: { 
    higherlower?: HigherLowerHighScore; 
    royaledle?: RoyaledleHighScore; 
    wordle?: WordleHighScore; 
    impostor?: ImpostorHighScore; 
    [k: string]: any 
  }; 
  stickers: string[]; 
  meta?: Record<string, any>; 
  user?: { username?: string; avatarId?: string }; 
  cards?: string[] 
}

const STORAGE_KEY = 'royaleUserProgress'; 
const VERSION = 1;

// Debounced push timer for authenticated users
let __pushTimer: any = null;

function isAuthed() { 
  if (typeof window === 'undefined') return false; 
  try { return !!localStorage.getItem('authUser'); } catch { return false; } 
}

function scheduleServerSync(immediate = false) {
  if (typeof window === 'undefined') return;
  if (!isAuthed()) return;
  const local = getProgress(); 
  if (!local) return;
  if (immediate) { pushProgressMerge(local); return; }
  if (__pushTimer) clearTimeout(__pushTimer);
  __pushTimer = setTimeout(() => { 
    const p = getProgress(); 
    if (p) pushProgressMerge(p); 
  }, 250);
}

export function getProgress(): UserProgress | null { 
  if (typeof window === 'undefined') return null; 
  try {
    const raw = localStorage.getItem(STORAGE_KEY); 
    if (!raw) return null; 
    const p = JSON.parse(raw); 
    if (!p.version) return null; 
    return p;
  } catch { return null; } 
}

function initProgress(): UserProgress { 
  return { 
    version: VERSION, 
    calendar: [], 
    stats: { gamesPlayedTotal: 0, gamesPlayedById: {} }, 
    highScores: {}, 
    stickers: [], 
    meta: {}, 
    user: {}, 
    cards: [] 
  } 
}

export function saveProgress(p: UserProgress) { 
  if (typeof window === 'undefined') return; 
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {} 
}

// Use LOCAL date (not UTC) so user sees today's play correctly in their timezone
function ensureDaily(p?: UserProgress) { 
  if (typeof window === 'undefined') return null; 
  let pr = p || getProgress() || initProgress(); 
  const key = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  if (!pr.calendar.includes(key)) { 
    pr.calendar.push(key); 
    if (pr.calendar.length > 400) pr.calendar = pr.calendar.slice(-400); 
    saveProgress(pr);
  } 
  return pr 
}

import { computeGameXp } from './xp-rules';

export function recordHigherLowerSession(streak: number) {
  if (typeof window === 'undefined') return;
  let p = getProgress() || initProgress();
  p = ensureDaily(p)!;
  p.stats.gamesPlayedTotal++;
  p.stats.gamesPlayedById.higherlower = (p.stats.gamesPlayedById.higherlower || 0) + 1;
  
  const prev = p.highScores.higherlower;
  if (!prev || streak > prev.bestStreak) {
    p.highScores.higherlower = { bestStreak: streak, updatedAt: new Date().toISOString() };
  }
  saveProgress(p);
  scheduleServerSync();
  scheduleServerSync(true);
  
  try { 
    const grant = computeGameXp('higherlower', { streak }); 
    if (grant) fetch('/api/xp', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include', 
      body: JSON.stringify(grant) 
    }).then(() => { 
      try { window.dispatchEvent(new Event('xp:updated')); } catch {} 
    }).catch(() => {}); 
  } catch {}
}

export function recordRoyaledleSession(attempts: number, won: boolean) {
  if (typeof window === 'undefined') return;
  let p = getProgress() || initProgress();
  p = ensureDaily(p)!;
  p.stats.gamesPlayedTotal++;
  p.stats.gamesPlayedById.royaledle = (p.stats.gamesPlayedById.royaledle || 0) + 1;
  
  const prev = p.highScores.royaledle;
  if (won && (!prev || !prev.bestWinAttempts || attempts < prev.bestWinAttempts)) {
    p.highScores.royaledle = { ...prev, bestWinAttempts: attempts, updatedAt: new Date().toISOString() };
  }
  saveProgress(p);
  scheduleServerSync();
  scheduleServerSync(true);
  
  try { 
    const grant = computeGameXp('royaledle', { attempts, won }); 
    if (grant) fetch('/api/xp', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include', 
      body: JSON.stringify(grant) 
    }).then(() => { 
      try { window.dispatchEvent(new Event('xp:updated')); } catch {} 
    }).catch(() => {}); 
  } catch {}
}

export function recordWordleSession(won: boolean, attempt: number, wordLength: number) {
  if (typeof window === 'undefined') return;
  let p = getProgress() || initProgress();
  p = ensureDaily(p)!;
  p.stats.gamesPlayedTotal++;
  p.stats.gamesPlayedById.wordle = (p.stats.gamesPlayedById.wordle || 0) + 1;
  
  const prev = p.highScores.wordle;
  if (won && (!prev || !prev.bestAttempts || attempt < prev.bestAttempts || 
      (attempt === prev.bestAttempts && wordLength > (prev.longestWordLength || 0)))) {
    p.highScores.wordle = { 
      bestAttempts: attempt, 
      longestWordLength: wordLength, 
      updatedAt: new Date().toISOString() 
    };
  }
  saveProgress(p);
  scheduleServerSync();
  scheduleServerSync(true);
  
  try { 
    const grant = computeGameXp('wordle', { won, attempt, wordLength }); 
    if (grant) fetch('/api/xp', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include', 
      body: JSON.stringify(grant) 
    }).then(() => { 
      try { window.dispatchEvent(new Event('xp:updated')); } catch {} 
    }).catch(() => {}); 
  } catch {}
}

export function recordImpostorSession(streak: number, score: number) {
  if (typeof window === 'undefined') return;
  let p = getProgress() || initProgress();
  p = ensureDaily(p)!;
  p.stats.gamesPlayedTotal++;
  p.stats.gamesPlayedById.impostor = (p.stats.gamesPlayedById.impostor || 0) + 1;
  
  const prev = p.highScores.impostor;
  if (!prev || streak > prev.bestStreak || (streak === prev.bestStreak && score > prev.bestScore)) {
    p.highScores.impostor = { 
      bestStreak: streak, 
      bestScore: score, 
      updatedAt: new Date().toISOString() 
    };
  }
  saveProgress(p);
  scheduleServerSync();
  scheduleServerSync(true);
  
  try { 
    const grant = computeGameXp('impostor', { streak, score }); 
    if (grant) fetch('/api/xp', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include', 
      body: JSON.stringify(grant) 
    }).then(() => { 
      try { window.dispatchEvent(new Event('xp:updated')); } catch {} 
    }).catch(() => {}); 
  } catch {}
}

// Expose manual sync trigger (optional UI hook)
export function syncProgressNow() { 
  if (typeof window === 'undefined') return; 
  if (!isAuthed()) return; 
  const p = getProgress(); 
  if (p) pushProgressMerge(p); 
}

// Async version that waits for sync to complete
export async function syncProgressNowAsync(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isAuthed()) return true;
  const p = getProgress();
  if (!p) return true;
  try { await pushProgressMerge(p); return true; } catch { return false; }
}

export function resetProgress() { 
  if (typeof window === 'undefined') return; 
  try { localStorage.removeItem(STORAGE_KEY); } catch {} 
}

export function updateUserProfile(partial: { username?: string; avatarId?: string }) { 
  if (typeof window === 'undefined') return; 
  let p = getProgress() || initProgress(); 
  p.user = { ...(p.user || {}), ...partial }; 
  saveProgress(p); 
}

export function getUserProfile() { 
  return getProgress()?.user 
}

export async function fetchServerProgress(): Promise<UserProgress | null> { 
  try {
    const r = await fetch('/api/progress', { credentials: 'include' }); 
    if (!r.ok) return null; 
    const j = await r.json(); 
    return j?.data?.progress || null;
  } catch { return null; } 
}

export async function pushProgressMerge(local: UserProgress): Promise<UserProgress | null> { 
  try {
    const r = await fetch('/api/progress', { 
      method: 'PUT', 
      body: JSON.stringify({ progress: local }), 
      headers: { 'Content-Type': 'application/json' }, 
      credentials: 'include' 
    }); 
    if (!r.ok) return null; 
    const j = await r.json(); 
    return j?.data?.progress || null;
  } catch { return null; } 
}

// Manual debugging helper (call from console window.__debugProgress())
if (typeof window !== 'undefined') { 
  (window as any).__debugProgress = () => getProgress(); 
}
