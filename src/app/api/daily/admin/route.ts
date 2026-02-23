import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { requireAdmin } from '@/server/auth-utils';

export const runtime = 'nodejs';

const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'] as const;
type GameType = typeof VALID_GAME_TYPES[number];

// GET: Fetch all challenges for a date range (admin only)
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start') || new Date().toISOString().slice(0, 10);
    const endDate = searchParams.get('end') || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();

    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: [{ date: 'asc' }, { gameType: 'asc' }],
    });

    return NextResponse.json({ challenges });
  } catch (error: any) {
    console.error('[ADMIN] GET error:', error?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Create or update a daily challenge (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { date, gameType, cardId } = body;

    if (!date || !gameType || cardId === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const numCardId = parseInt(cardId, 10);
    if (isNaN(numCardId) || numCardId < 1 || numCardId > 171) {
      return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
    }

    const challenge = await prisma.dailyChallenge.upsert({
      where: { date_gameType: { date, gameType } },
      update: { cardId: numCardId },
      create: { date, gameType, cardId: numCardId },
    });

    return NextResponse.json({ challenge });
  } catch (error: any) {
    console.error('[ADMIN] POST error:', error?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT: Bulk create/update challenges (admin only)
export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { challenges } = body as { challenges: { date: string; gameType: GameType; cardId: number }[] };

    if (!Array.isArray(challenges)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const results = [];
    for (const c of challenges) {
      if (!c.date || !c.gameType || c.cardId === undefined) continue;
      if (!VALID_GAME_TYPES.includes(c.gameType)) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) continue;

      const numCardId = typeof c.cardId === 'number' ? c.cardId : parseInt(String(c.cardId), 10);
      if (isNaN(numCardId) || numCardId < 1 || numCardId > 171) continue;

      const challenge = await prisma.dailyChallenge.upsert({
        where: { date_gameType: { date: c.date, gameType: c.gameType } },
        update: { cardId: numCardId },
        create: { date: c.date, gameType: c.gameType, cardId: numCardId },
      });
      results.push(challenge);
    }

    return NextResponse.json({ created: results.length, challenges: results });
  } catch (error: any) {
    console.error('[ADMIN] PUT error:', error?.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
