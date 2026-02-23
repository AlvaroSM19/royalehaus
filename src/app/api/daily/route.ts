import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { getAuthUser } from '@/server/auth-utils';

export const runtime = 'nodejs';

const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'] as const;
type GameType = typeof VALID_GAME_TYPES[number];

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET: Fetch today's daily challenge (public)
// If user is logged in, also returns their participation status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get('game') as GameType;
    const dateParam = searchParams.get('date');

    if (!gameType || !VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const date = dateParam || getTodayDate();

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date, gameType } },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for this date', date }, { status: 404 });
    }

    // Check participation if user is logged in (uses proven auth-store path)
    let participation = null;
    const user = await getAuthUser(req);
    if (user) {
      const p = await prisma.dailyParticipation.findUnique({
        where: { challengeId_userId: { challengeId: challenge.id, userId: user.id } },
      });
      if (p) {
        participation = { completed: p.completed, won: p.won, attempts: p.attempts };
      }
    }

    return NextResponse.json({
      id: challenge.id,
      date: challenge.date,
      gameType: challenge.gameType,
      cardId: challenge.cardId,
      participation,
    });
  } catch (error) {
    console.error('[DAILY] GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Save daily participation (authenticated users only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameType, won, attempts } = body;

    if (!gameType || !VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Authenticate using proven auth-store path
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ ok: true, saved: false, message: 'Not authenticated' });
    }

    const date = getTodayDate();

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date, gameType } },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for today' }, { status: 404 });
    }

    // Upsert participation
    const participation = await prisma.dailyParticipation.upsert({
      where: {
        challengeId_userId: { challengeId: challenge.id, userId: user.id },
      },
      create: {
        challengeId: challenge.id,
        userId: user.id,
        attempts: attempts || 1,
        completed: true,
        won: !!won,
        completedAt: new Date(),
      },
      update: {
        attempts: attempts || 1,
        completed: true,
        won: !!won,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      saved: true,
      participation: {
        completed: participation.completed,
        won: participation.won,
        attempts: participation.attempts,
      },
    });
  } catch (error) {
    console.error('[DAILY] POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
