import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';

const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'pixel-royale'] as const;
type GameType = typeof VALID_GAME_TYPES[number];

// Check if user is admin
async function isAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get('sid')?.value;
    
    if (!sid) return false;

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: { user: true },
    });

    return session?.user?.role === 'admin' && session.expiresAt > new Date();
  } catch (error) {
    console.error('[ADMIN_API] isAdmin error:', error);
    return false;
  }
}

// GET: Fetch all challenges for a date range (admin only)
export async function GET(req: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      console.log('[ADMIN_API] GET: Not admin - denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('start') || new Date().toISOString().slice(0, 10);
    const endDate = searchParams.get('end') || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().slice(0, 10);
    })();

    console.log(`[ADMIN_API] GET: Fetching challenges from ${startDate} to ${endDate}`);

    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
      },
      orderBy: [{ date: 'asc' }, { gameType: 'asc' }],
    });

    console.log(`[ADMIN_API] GET: Found ${challenges.length} challenges`);
    return NextResponse.json({ challenges });
  } catch (error: any) {
    console.error('[ADMIN_API] GET error:', error?.message, error?.code, error?.meta);
    return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
  }
}

// POST: Create or update a daily challenge (admin only)
export async function POST(req: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      console.log('[ADMIN_API] POST: Not admin - denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { date, gameType, cardId } = body;
    console.log(`[ADMIN_API] POST: date=${date}, gameType=${gameType}, cardId=${cardId}`);

    if (!date || !gameType || cardId === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Validate cardId is a valid number
    const numCardId = parseInt(cardId, 10);
    if (isNaN(numCardId) || numCardId < 1 || numCardId > 171) {
      return NextResponse.json({ error: 'Invalid card ID' }, { status: 400 });
    }

    // Upsert the challenge
    const challenge = await prisma.dailyChallenge.upsert({
      where: { date_gameType: { date, gameType } },
      update: { cardId: numCardId },
      create: { date, gameType, cardId: numCardId },
    });

    console.log(`[ADMIN_API] POST: Challenge saved`, challenge);
    return NextResponse.json({ challenge });
  } catch (error: any) {
    console.error('[ADMIN_API] POST error:', error?.message, error?.code, error?.meta);
    return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
  }
}

// PUT: Bulk create/update challenges (for auto-generation)
export async function PUT(req: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      console.log('[ADMIN_API] PUT: Not admin - denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { challenges } = body as { challenges: { date: string; gameType: GameType; cardId: number }[] };
    console.log(`[ADMIN_API] PUT: Received ${challenges?.length || 0} challenges`);

    if (!Array.isArray(challenges)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const results = [];
    for (const c of challenges) {
      if (!c.date || !c.gameType || c.cardId === undefined) continue;
      if (!VALID_GAME_TYPES.includes(c.gameType)) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) continue;

      const numCardId = typeof c.cardId === 'number' ? c.cardId : parseInt(c.cardId, 10);
      if (isNaN(numCardId) || numCardId < 1 || numCardId > 171) continue;

      const challenge = await prisma.dailyChallenge.upsert({
        where: { date_gameType: { date: c.date, gameType: c.gameType } },
        update: { cardId: numCardId },
        create: { date: c.date, gameType: c.gameType, cardId: numCardId },
      });
      results.push(challenge);
    }

    console.log(`[ADMIN_API] PUT: Created/updated ${results.length} challenges`);
    return NextResponse.json({ created: results.length, challenges: results });
  } catch (error: any) {
    console.error('[ADMIN_API] PUT error:', error?.message, error?.code, error?.meta);
    return NextResponse.json({ error: 'Server error', details: error?.message }, { status: 500 });
  }
}
