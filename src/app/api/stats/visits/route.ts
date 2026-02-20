import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';
import { getSession } from '@/server/auth-store';

// Sister site URLs — each site aggregates visits from all 3
const SISTER_SITES = [
  'https://onepiecehaus.com',
  'https://jujutsukaisenhaus-jujutsu-f3r2po-cddd1f-72-62-237-156.traefik.me',
];

// In-memory cache for sister site counts
let sisterCache: { visits: number; displayVisits: number; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

// Helper to check if user is admin
async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get('sid')?.value;
    if (!sid) return false;
    const session = await getSession(sid);
    if (!session) return false;
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

async function fetchSisterCounts(): Promise<{ visits: number; displayVisits: number }> {
  if (sisterCache && Date.now() - sisterCache.ts < CACHE_TTL) {
    return { visits: sisterCache.visits, displayVisits: sisterCache.displayVisits };
  }
  let totalV = 0, totalD = 0;
  const results = await Promise.allSettled(
    SISTER_SITES.map(async (base) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      try {
        const res = await fetch(`${base}/api/stats/visits?local=true`, {
          signal: ctrl.signal, cache: 'no-store',
        });
        clearTimeout(timer);
        if (!res.ok) return { visits: 0, displayVisits: 0 };
        return await res.json();
      } catch { clearTimeout(timer); return { visits: 0, displayVisits: 0 }; }
    }),
  );
  for (const r of results) {
    const val = r.status === 'fulfilled' ? r.value : { visits: 0, displayVisits: 0 };
    totalV += val.visits || 0;
    totalD += val.displayVisits || 0;
  }
  sisterCache = { visits: totalV, displayVisits: totalD, ts: Date.now() };
  return { visits: totalV, displayVisits: totalD };
}

// GET /api/stats/visits - Get visitor count (aggregated across all sites)
export async function GET(req: NextRequest) {
  try {
    const isLocal = req.nextUrl.searchParams.get('local') === 'true';

    let stat = await prisma.siteStat.findUnique({ where: { id: 'main' } });
    if (!stat) {
      stat = await prisma.siteStat.create({
        data: { id: 'main', visits: 0, displayVisits: 0 },
      });
    }

    // Sister sites call with ?local=true → return raw local counts only
    if (isLocal) {
      return NextResponse.json({ visits: stat.visits, displayVisits: stat.displayVisits });
    }

    // Normal client request → aggregate all 3 sites
    const admin = await isAdmin();
    const sister = await fetchSisterCounts();
    const totalReal = stat.visits + sister.visits;
    const totalDisplay = stat.displayVisits + sister.displayVisits;
    const displayCount = admin ? totalReal : totalDisplay;

    return NextResponse.json({ count: displayCount, isAdmin: admin });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ count: 0, isAdmin: false });
  }
}

// POST /api/stats/visits - Increment visitor count (local only)
export async function POST(req: NextRequest) {
  try {
    let stat = await prisma.siteStat.findUnique({ where: { id: 'main' } });
    const newRealVisits = (stat?.visits ?? 0) + 1;
    const randomBoost = Math.floor(Math.random() * 6) + 3;
    const newDisplayVisits = (stat?.displayVisits ?? 0) + randomBoost;
    stat = await prisma.siteStat.upsert({
      where: { id: 'main' },
      update: { visits: newRealVisits, displayVisits: newDisplayVisits },
      create: { id: 'main', visits: 1, displayVisits: randomBoost },
    });
    return NextResponse.json({ success: true, visits: stat.visits });
  } catch (error) {
    console.error('Stats increment error:', error);
    return NextResponse.json({ success: false });
  }
}
