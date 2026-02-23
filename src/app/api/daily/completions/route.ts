import { NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';

const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'] as const;

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET: Returns completion status for all daily games for the logged-in user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sid = cookieStore.get('sid')?.value;

    if (!sid) {
      return NextResponse.json({ completions: {} });
    }

    const session = await prisma.session.findUnique({ where: { id: sid } });
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ completions: {} });
    }

    const today = getTodayDate();
    const completions: Record<string, { completed: boolean; won: boolean; attempts: number }> = {};

    // Get all today's challenges
    const challenges = await prisma.dailyChallenge.findMany({
      where: { date: today, gameType: { in: [...VALID_GAME_TYPES] } },
    });

    if (challenges.length === 0) {
      return NextResponse.json({ completions: {} });
    }

    // Get participations for all challenges
    const participations = await prisma.dailyParticipation.findMany({
      where: {
        userId: session.userId,
        challengeId: { in: challenges.map(c => c.id) },
      },
    });

    for (const challenge of challenges) {
      const participation = participations.find(p => p.challengeId === challenge.id);
      if (participation && participation.completed) {
        completions[challenge.gameType] = {
          completed: participation.completed,
          won: participation.won,
          attempts: participation.attempts,
        };
      }
    }

    return NextResponse.json({ completions });
  } catch (error) {
    console.error('[DAILY_COMPLETIONS] GET error:', error);
    return NextResponse.json({ completions: {} });
  }
}
