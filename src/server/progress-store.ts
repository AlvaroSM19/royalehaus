import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { getSession } from './auth-store';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const progressFile = path.join(dataDir, 'royale-progress.json');
const useDb = !!process.env.DATABASE_URL;

// Known game IDs for RoyaleHaus
const KNOWN_GAME_IDS = ['royaledle', 'higherlower', 'impostor', 'wordle'];

interface ProgressRecord {
  userId: string;
  progress: any;
  updatedAt: string;
}

// Leaderboard entry types
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  totalGames: number;
  gamesPlayedById: Record<string, number>;
}

export interface StreakEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  streak: number;
}

export interface XpEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  level: number;
  xpTotal: number;
}

export interface HigherLowerHighScoreEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  bestStreak: number;
  updatedAt?: string;
}

export interface ImpostorHighScoreEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  bestStreak: number;
  bestScore: number;
  updatedAt?: string;
}

export interface RoyaledleHighScoreEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  bestWinAttempts: number;
  updatedAt?: string;
}

export interface WordleHighScoreEntry {
  userId: string;
  username: string;
  avatarId: string | null;
  bestAttempts: number;
  longestWordLength: number;
  updatedAt?: string;
}

interface Memory { items: ProgressRecord[] }
const g: any = globalThis as any;
if (!g.__ROYALE_PROGRESS_MEM__) g.__ROYALE_PROGRESS_MEM__ = { items: [] } as Memory;
const mem: Memory = g.__ROYALE_PROGRESS_MEM__;

function ensure() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(progressFile)) fs.writeFileSync(progressFile, '[]');
  } catch {}
}

function readAll(): ProgressRecord[] {
  try { ensure(); return JSON.parse(fs.readFileSync(progressFile, 'utf8') || '[]'); } 
  catch { return mem.items; }
}

function writeAll(list: ProgressRecord[]) {
  try { ensure(); fs.writeFileSync(progressFile, JSON.stringify(list, null, 2)); } 
  catch { mem.items = list; }
}

function blankProgress() {
  return { 
    version: 1, 
    calendar: [], 
    stats: { gamesPlayedTotal: 0, gamesPlayedById: {} }, 
    highScores: {}, 
    stickers: [], 
    cards: [], 
    meta: {}, 
    user: {} 
  };
}

export async function getUserProgress(userId: string) {
  if (useDb) {
    const rec = await (prisma as any).progress.findUnique({ where: { userId } });
    if (!rec) return null;
    
    let prog: any = {};
    try { prog = JSON.parse(rec.data); } catch { prog = {}; }
    if (!prog || typeof prog !== 'object') prog = blankProgress();
    if (!prog.meta) prog.meta = {};
    if (!prog.cards) prog.cards = [];
    
    return prog;
  }
  
  const list = readAll();
  return list.find(r => r.userId === userId)?.progress || null;
}

export async function saveUserProgress(userId: string, progress: any) {
  if (useDb) {
    try { applyAwarding(progress); } catch {}
    await (prisma as any).progress.upsert({ 
      where: { userId }, 
      update: { data: JSON.stringify(progress) }, 
      create: { userId, data: JSON.stringify(progress) } 
    });
    return;
  }
  
  const list = readAll();
  const existing = list.find(r => r.userId === userId);
  const updatedAt = new Date().toISOString();
  try { applyAwarding(progress); } catch {}
  
  if (existing) { 
    existing.progress = progress; 
    existing.updatedAt = updatedAt; 
  } else {
    list.push({ userId, progress, updatedAt });
  }
  writeAll(list);
}

// --- Leaderboard Helpers ---
export async function listTopProgress(limit = 50): Promise<LeaderboardEntry[]> {
  if (useDb) {
    const rows = await (prisma as any).progress.findMany({ 
      include: { user: { select: { id: true, username: true, royaleAvatarId: true } } } 
    });
    
    const mapped: LeaderboardEntry[] = rows.map((r: any) => {
      let parsed: any = {};
      try { parsed = JSON.parse(r.data); } catch {}
      const byId: Record<string, number> = parsed?.stats?.gamesPlayedById || {};
      const total: number = KNOWN_GAME_IDS.reduce((acc, id) => acc + (typeof byId[id] === 'number' ? byId[id] : 0), 0);
      
      return {
        userId: r.userId,
        username: (r as any).user?.username || parsed?.user?.username || 'player',
        avatarId: (r as any).user?.royaleAvatarId || parsed?.user?.avatarId || null,
        totalGames: total,
        gamesPlayedById: byId as Record<string, number>
      };
    });
    
    return mapped.sort((a, b) => b.totalGames - a.totalGames).slice(0, limit);
  }
  
  const list = readAll();
  const records: LeaderboardEntry[] = list.map(rec => {
    const p = rec.progress || {};
    const gamesById: Record<string, number> = p?.stats?.gamesPlayedById || {};
    const total: number = KNOWN_GAME_IDS.reduce((acc, id) => acc + (typeof gamesById[id] === 'number' ? gamesById[id] : 0), 0);
    
    return {
      userId: rec.userId,
      username: p?.user?.username || 'player',
      avatarId: p?.user?.avatarId || null,
      totalGames: total,
      gamesPlayedById: gamesById as Record<string, number>
    };
  });
  
  return records.sort((a, b) => b.totalGames - a.totalGames).slice(0, limit);
}

// XP leaderboard
export async function listTopXp(limit = 10): Promise<XpEntry[]> {
  if (useDb) {
    try {
      type RawRow = { id: string; username: string; royaleAvatarId: string | null; lvl: number; xp: number };
      const rows = await prisma.$queryRaw<RawRow[]>`
        SELECT id, username, "royaleAvatarId", COALESCE("level", 1) AS lvl, COALESCE("xpTotal", 0) AS xp
        FROM "User"
        ORDER BY "level" DESC, "xpTotal" DESC
        LIMIT ${limit}
      `;
      return rows.map((r: RawRow) => ({ userId: r.id, username: r.username, avatarId: r.royaleAvatarId, level: r.lvl, xpTotal: r.xp }));
    } catch {
      const rows = await prisma.user.findMany({ select: { id: true, username: true, royaleAvatarId: true }, take: limit });
      return rows.map((r: { id: string; username: string; royaleAvatarId: string | null }) => ({ userId: r.id, username: r.username, avatarId: r.royaleAvatarId || null, level: 1, xpTotal: 0 }));
    }
  }
  
  try {
    const gg: any = globalThis as any;
    const users: any[] = gg.__AUTH_MEM__?.users || [];
    const list = users.map(u => ({
      userId: u.id,
      username: u.username || 'player',
      avatarId: u.avatarId || null,
      level: typeof u.level === 'number' ? u.level : 1,
      xpTotal: typeof u.xpTotal === 'number' ? u.xpTotal : 0
    }));
    return list.sort((a, b) => (b.level - a.level) || (b.xpTotal - a.xpTotal)).slice(0, limit);
  } catch {
    return [];
  }
}

// Higher Lower leaderboard
export async function listTopHigherLower(limit = 10): Promise<HigherLowerHighScoreEntry[]> {
  const collect = async (): Promise<HigherLowerHighScoreEntry[]> => {
    if (useDb) {
      const rows = await (prisma as any).progress.findMany({ 
        include: { user: { select: { id: true, username: true, royaleAvatarId: true } } } 
      });
      return rows.map((r: any) => {
        let parsed: any = {}; 
        try { parsed = JSON.parse(r.data); } catch {}
        const hs = parsed?.highScores?.higherlower;
        return hs && typeof hs.bestStreak === 'number' ? {
          userId: r.userId,
          username: (r as any).user?.username || parsed?.user?.username || 'player',
          avatarId: (r as any).user?.royaleAvatarId || parsed?.user?.avatarId || null,
          bestStreak: hs.bestStreak,
          updatedAt: hs.updatedAt
        } : null;
      }).filter(Boolean) as HigherLowerHighScoreEntry[];
    }
    
    return readAll().map(rec => {
      const p = rec.progress || {};
      const hs = p?.highScores?.higherlower;
      return hs && typeof hs.bestStreak === 'number' ? {
        userId: rec.userId,
        username: p?.user?.username || 'player',
        avatarId: p?.user?.avatarId || null,
        bestStreak: hs.bestStreak,
        updatedAt: hs.updatedAt
      } : null;
    }).filter(Boolean) as HigherLowerHighScoreEntry[];
  };
  
  return (await collect()).sort((a, b) => b.bestStreak - a.bestStreak).slice(0, limit);
}

// Impostor leaderboard
export async function listTopImpostor(limit = 10): Promise<ImpostorHighScoreEntry[]> {
  const collect = async (): Promise<ImpostorHighScoreEntry[]> => {
    if (useDb) {
      const rows = await (prisma as any).progress.findMany({ 
        include: { user: { select: { id: true, username: true, royaleAvatarId: true } } } 
      });
      return rows.map((r: any) => {
        let parsed: any = {}; 
        try { parsed = JSON.parse(r.data); } catch {}
        const hs = parsed?.highScores?.impostor;
        return hs && typeof hs.bestStreak === 'number' ? {
          userId: r.userId,
          username: (r as any).user?.username || parsed?.user?.username || 'player',
          avatarId: (r as any).user?.royaleAvatarId || parsed?.user?.avatarId || null,
          bestStreak: hs.bestStreak,
          bestScore: hs.bestScore || 0,
          updatedAt: hs.updatedAt
        } : null;
      }).filter(Boolean) as ImpostorHighScoreEntry[];
    }
    
    return readAll().map(rec => {
      const p = rec.progress || {};
      const hs = p?.highScores?.impostor;
      return hs && typeof hs.bestStreak === 'number' ? {
        userId: rec.userId,
        username: p?.user?.username || 'player',
        avatarId: p?.user?.avatarId || null,
        bestStreak: hs.bestStreak,
        bestScore: hs.bestScore || 0,
        updatedAt: hs.updatedAt
      } : null;
    }).filter(Boolean) as ImpostorHighScoreEntry[];
  };
  
  return (await collect()).sort((a, b) => {
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    return b.bestScore - a.bestScore;
  }).slice(0, limit);
}

// Royaledle leaderboard
export async function listTopRoyaledle(limit = 10): Promise<RoyaledleHighScoreEntry[]> {
  const collect = async (): Promise<RoyaledleHighScoreEntry[]> => {
    if (useDb) {
      const rows = await (prisma as any).progress.findMany({ 
        include: { user: { select: { id: true, username: true, royaleAvatarId: true } } } 
      });
      return rows.map((r: any) => {
        let parsed: any = {}; 
        try { parsed = JSON.parse(r.data); } catch {}
        const hs = parsed?.highScores?.royaledle;
        return hs && typeof hs.bestWinAttempts === 'number' ? {
          userId: r.userId,
          username: (r as any).user?.username || parsed?.user?.username || 'player',
          avatarId: (r as any).user?.royaleAvatarId || parsed?.user?.avatarId || null,
          bestWinAttempts: hs.bestWinAttempts,
          updatedAt: hs.updatedAt
        } : null;
      }).filter(Boolean) as RoyaledleHighScoreEntry[];
    }
    
    return readAll().map(rec => {
      const p = rec.progress || {};
      const hs = p?.highScores?.royaledle;
      return hs && typeof hs.bestWinAttempts === 'number' ? {
        userId: rec.userId,
        username: p?.user?.username || 'player',
        avatarId: p?.user?.avatarId || null,
        bestWinAttempts: hs.bestWinAttempts,
        updatedAt: hs.updatedAt
      } : null;
    }).filter(Boolean) as RoyaledleHighScoreEntry[];
  };
  
  return (await collect()).sort((a, b) => a.bestWinAttempts - b.bestWinAttempts).slice(0, limit);
}

// Wordle leaderboard
export async function listTopWordle(limit = 10): Promise<WordleHighScoreEntry[]> {
  const collect = async (): Promise<WordleHighScoreEntry[]> => {
    if (useDb) {
      const rows = await (prisma as any).progress.findMany({ 
        include: { user: { select: { id: true, username: true, royaleAvatarId: true } } } 
      });
      return rows.map((r: any) => {
        let parsed: any = {}; 
        try { parsed = JSON.parse(r.data); } catch {}
        const hs = parsed?.highScores?.wordle;
        return hs && typeof hs.bestAttempts === 'number' ? {
          userId: r.userId,
          username: (r as any).user?.username || parsed?.user?.username || 'player',
          avatarId: (r as any).user?.royaleAvatarId || parsed?.user?.avatarId || null,
          bestAttempts: hs.bestAttempts,
          longestWordLength: hs.longestWordLength || 0,
          updatedAt: hs.updatedAt
        } : null;
      }).filter(Boolean) as WordleHighScoreEntry[];
    }
    
    return readAll().map(rec => {
      const p = rec.progress || {};
      const hs = p?.highScores?.wordle;
      return hs && typeof hs.bestAttempts === 'number' ? {
        userId: rec.userId,
        username: p?.user?.username || 'player',
        avatarId: p?.user?.avatarId || null,
        bestAttempts: hs.bestAttempts,
        longestWordLength: hs.longestWordLength || 0,
        updatedAt: hs.updatedAt
      } : null;
    }).filter(Boolean) as WordleHighScoreEntry[];
  };
  
  return (await collect()).sort((a, b) => {
    if (a.bestAttempts !== b.bestAttempts) return a.bestAttempts - b.bestAttempts;
    return b.longestWordLength - a.longestWordLength;
  }).slice(0, limit);
}

// Streak leaderboard
export async function listTopStreaks(limit = 10): Promise<StreakEntry[]> {
  const collect = async (): Promise<StreakEntry[]> => {
    if (useDb) {
      const rows = await (prisma as any).progress.findMany({ 
        include: { user: { select: { id: true, username: true, royaleAvatarId: true } } } 
      });
      return rows.map((r: any) => {
        let parsed: any = {}; 
        try { parsed = JSON.parse(r.data); } catch {}
        const streak = computeCurrentStreak(parsed);
        return {
          userId: r.userId,
          username: (r as any).user?.username || parsed?.user?.username || 'player',
          avatarId: (r as any).user?.royaleAvatarId || parsed?.user?.avatarId || null,
          streak
        };
      });
    }
    
    return readAll().map(rec => {
      const p = rec.progress || {};
      return {
        userId: rec.userId,
        username: p?.user?.username || 'player',
        avatarId: p?.user?.avatarId || null,
        streak: computeCurrentStreak(p)
      };
    });
  };
  
  return (await collect()).filter(e => e.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, limit);
}

// Merge strategy
export function mergeProgress(server: any | null, local: any): any {
  if (!server) return local || blankProgress();
  const merged = { ...server };
  
  // calendar: union
  const calSet = new Set([...(server.calendar || []), ...(local.calendar || [])]);
  merged.calendar = Array.from(calSet).sort();
  
  // stats: sum counts
  merged.stats = {
    gamesPlayedTotal: (server.stats?.gamesPlayedTotal || 0) + (local.stats?.gamesPlayedTotal || 0),
    gamesPlayedById: { ...(server.stats?.gamesPlayedById || {}), ...(local.stats?.gamesPlayedById || {}) }
  };
  
  // highScores: choose better per key
  merged.highScores = { ...(server.highScores || {}) };
  for (const [k, v] of Object.entries(local.highScores || {})) {
    const s = (server.highScores || {})[k];
    if (!s) merged.highScores[k] = v;
    else if (v && typeof v === 'object') {
      if ('bestWinAttempts' in v && (!('bestWinAttempts' in s) || (v as any).bestWinAttempts < (s as any).bestWinAttempts)) {
        merged.highScores[k] = v;
      } else if ('bestStreak' in v) {
        const localStreak = (v as any).bestStreak;
        const serverStreak = (s as any).bestStreak;
        if (typeof localStreak === 'number' && (!('bestStreak' in s) || localStreak > serverStreak)) {
          merged.highScores[k] = v;
        }
      } else if ('bestAttempts' in v && (!('bestAttempts' in s) || (v as any).bestAttempts < (s as any).bestAttempts)) {
        merged.highScores[k] = v;
      }
    }
  }
  
  // stickers and cards: union
  merged.stickers = Array.from(new Set([...(server.stickers || []), ...(local.stickers || [])]));
  merged.cards = Array.from(new Set([...(server.cards || []), ...(local.cards || [])]));
  
  // user profile: do NOT inherit local user fields
  merged.user = server.user ? { ...server.user } : {};
  
  // meta union (server override)
  merged.meta = { ...(local.meta || {}), ...(server.meta || {}) };
  
  // version keep newest
  merged.version = Math.max(server.version || 1, local.version || 1);
  
  // Re-run awarding
  applyAwarding(merged);
  
  return merged;
}

export async function requireUser(req: Request): Promise<string | null> {
  const cookie = req.headers.get('cookie') || '';
  const match = cookie.match(/sid=([^;]+)/);
  if (!match) return null;
  const session = await getSession(decodeURIComponent(match[1]));
  return (session as any)?.userId || null;
}

// --- Server awarding logic ---
function computeCurrentStreak(progress: any): number {
  const set = new Set(progress.calendar || []);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

export function applyAwarding(p: any) {
  if (!p.stickers) p.stickers = [];
  if (!p.cards) p.cards = [];
  if (!p.meta) p.meta = {};
  
  const addSticker = (id: string) => { 
    if (!p.stickers.includes(id)) p.stickers.push(id); 
  };
  
  const streak = computeCurrentStreak(p);
  const total = p.stats?.gamesPlayedTotal || 0;
  
  if (total >= 1) addSticker('first-game');
  if (total >= 10) addSticker('ten-games');
  if (total >= 50) addSticker('fifty-games');
  if (total >= 100) addSticker('hundred-games');
  if (streak >= 7) addSticker('seven-day-streak');
  if (streak >= 30) addSticker('thirty-day-streak');
  
  // Game-specific stickers
  const hl = p.highScores?.higherlower;
  if (hl?.bestStreak >= 10) addSticker('higherlower-10-streak');
  if (hl?.bestStreak >= 25) addSticker('higherlower-25-streak');
  
  const imp = p.highScores?.impostor;
  if (imp?.bestStreak >= 5) addSticker('impostor-5-streak');
  if (imp?.bestStreak >= 10) addSticker('impostor-10-streak');
  
  const royaledle = p.highScores?.royaledle;
  if (royaledle?.bestWinAttempts === 1) addSticker('royaledle-first-try');
  
  const wordle = p.highScores?.wordle;
  if (wordle?.bestAttempts === 1) addSticker('wordle-first-try');
}
