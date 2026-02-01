import { prisma } from './prisma';

// ==============================
// SISTEMA DE NIVELES v2 - CURVA BALANCEADA
// ==============================
// Diseñado para ser satisfactorio pero no trivial
// Nivel 1-5: Rápido (enganche inicial)
// Nivel 5-15: Moderado (progresión constante)
// Nivel 15+: Desafiante (logro real)

// XP necesario para subir del nivel n al n+1
export function xpForLevel(n: number): number {
  if (n <= 1) return 400;           // Nivel 1→2: 400 XP (~3-4 partidas)
  if (n <= 3) return 500 + (n - 1) * 100;   // Nivel 2-3: 600-700 XP
  if (n <= 5) return 800 + (n - 3) * 150;   // Nivel 4-5: 950-1100 XP
  if (n <= 10) return 1200 + (n - 5) * 300;  // Nivel 6-10: 1500-2700 XP
  if (n <= 20) return 3000 + (n - 10) * 500; // Nivel 11-20: 3500-8000 XP
  // Nivel 20+: Crecimiento exponencial suave
  return Math.round(8000 * Math.pow(1.12, n - 20));
}

export function totalXpForLevel(n: number): number {
  // XP total necesario para ALCANZAR el nivel n
  let sum = 0;
  for (let i = 1; i < n; i++) sum += xpForLevel(i);
  return sum;
}

// Calcular nivel desde XP total
export function levelFromXp(xpTotal: number): number {
  let level = 1;
  let accumulated = 0;
  while (accumulated + xpForLevel(level) <= xpTotal) {
    accumulated += xpForLevel(level);
    level++;
  }
  return level;
}

export type GrantResult = {
  userId: string;
  added: number;
  xpTotal: number;
  level: number;
  leveledUp: boolean;
  levelsGained?: number;
  cappedReason?: 'global' | 'game' | null;
};

// Daily caps (anti-farming)
const GLOBAL_DAILY_CAP = 3000;  // 3000 XP/día máximo
const GAME_DAILY_CAP = 1200;    // 1200 XP/día por juego

async function getTodayCounters(userId: string) {
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  
  // Use shared XpEvent table, filter by 'royale:' prefix
  const events = await (prisma as any).xpEvent.findMany({
    where: { userId, createdAt: { gte: dayStart }, kind: { startsWith: 'royale:' } },
    select: { kind: true, amount: true },
  });
  
  const total = (events as any[]).reduce((a: number, e: any) => a + (e?.amount || 0), 0);
  const perGame: Record<string, number> = {};
  
  for (const e of events) {
    // Match 'royale:game:XXX:action' pattern
    const m = e.kind.match(/^royale:game:([^:]+)/);
    if (m) perGame[m[1]] = (perGame[m[1]] || 0) + e.amount;
  }
  
  return { total, perGame };
}

export async function grantXp(userId: string, amount: number, kind: string, meta?: any): Promise<GrantResult> {
  if (amount <= 0) return { userId, added: 0, xpTotal: 0, level: 1, leveledUp: false, cappedReason: null };
  
  let user: any;
  try {
    user = await (prisma as any).user.findUnique({ where: { id: userId } });
  } catch (e) {
    // Schema not ready; return no-op to avoid breaking UI
    return { userId, added: 0, xpTotal: 0, level: 1, leveledUp: false, cappedReason: null };
  }
  
  if (!user) return { userId, added: 0, xpTotal: 0, level: 1, leveledUp: false, cappedReason: null };

  // Apply caps
  const { total, perGame } = await getTodayCounters(userId);
  let adj = amount;
  let cappedReason: 'global' | 'game' | null = null;

  // Check global daily cap
  if (total >= GLOBAL_DAILY_CAP) {
    adj = Math.floor(amount * 0.1); // Solo 10% después del cap
    cappedReason = 'global';
  }

  // Check per-game daily cap (kind format: 'game:XXX:action')
  const gameMatch = kind.match(/^game:([^:]+)/);
  if (gameMatch) {
    const game = gameMatch[1];
    const current = perGame[game] || 0;
    if (current >= GAME_DAILY_CAP) {
      adj = Math.floor(adj * 0.1); // Solo 10% después del cap
      cappedReason = cappedReason || 'game';
    }
  }
  
  // Prefix kind with 'royale:' for shared table identification
  const prefixedKind = kind.startsWith('royale:') ? kind : `royale:${kind}`;

  if (adj <= 0) {
    return { userId, added: 0, xpTotal: user.xpTotal, level: user.level, leveledUp: false, cappedReason };
  }

  const newTotal = user.xpTotal + adj;
  
  // Level up loop with overflow
  let level = user.level;
  let leftoverXp = newTotal - totalXpForLevel(level);
  let gained = 0;
  
  while (leftoverXp >= xpForLevel(level)) {
    leftoverXp -= xpForLevel(level);
    level += 1;
    gained += 1;
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      // Use shared XpEvent table with prefixed kind
      await tx.xpEvent.create({ data: { userId, kind: prefixedKind, amount: adj, meta } });
      await tx.user.update({ 
        where: { id: userId }, 
        data: { 
          xpTotal: newTotal, 
          level, 
          lastLevelUpAt: gained > 0 ? new Date() : user.lastLevelUpAt 
        } 
      });
    });
  } catch (e) {
    // If columns/table are missing, degrade gracefully
    return { userId, added: 0, xpTotal: user.xpTotal || 0, level: user.level || 1, leveledUp: false, cappedReason: null };
  }

  return { userId, added: adj, xpTotal: newTotal, level, leveledUp: gained > 0, levelsGained: gained, cappedReason };
}

export async function getXpSummary(userId: string) {
  try {
    const user: any = await (prisma as any).user.findUnique({ where: { id: userId } });
    if (!user || user.level == null || user.xpTotal == null) {
      return { level: 1, xpTotal: 0, toNext: xpForLevel(1), progress: 0, today: { total: 0, perGame: {} } };
    }
    const need = xpForLevel(user.level);
    const have = user.xpTotal - totalXpForLevel(user.level);
    const progress = Math.max(0, Math.min(1, have / need));
    const counters = await getTodayCounters(userId);
    return { level: user.level, xpTotal: user.xpTotal, toNext: need - have, progress, today: counters };
  } catch {
    return { level: 1, xpTotal: 0, toNext: xpForLevel(1), progress: 0, today: { total: 0, perGame: {} } };
  }
}
