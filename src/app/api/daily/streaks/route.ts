import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { getAuthUser } from '@/server/auth-utils';

export const runtime = 'nodejs';

const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'] as const;

// GET: Fetch user's streaks for daily challenges
export async function GET(req: NextRequest) {
  try {
    // Authenticate using proven auth-store path
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const streaks: Record<string, { current: number; best: number; totalWins: number }> = {};

    for (const gameType of VALID_GAME_TYPES) {
      // Get all completed (won) participations for this game type
      const participations = await prisma.dailyParticipation.findMany({
        where: {
          userId: user.id,
          won: true,
          challenge: { gameType },
        },
        include: { challenge: { select: { date: true } } },
        orderBy: { challenge: { date: 'desc' } },
      });

      const winDates = participations.map(p => p.challenge.date);
      const totalWins = winDates.length;

      // Calculate current streak (consecutive days from today backwards)
      let currentStreak = 0;
      const today = new Date();

      for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().slice(0, 10);

        if (winDates.includes(dateStr)) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Calculate best streak ever
      let bestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      const sortedDates = [...winDates].sort();

      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);

        if (lastDate) {
          const diffDays = Math.round((date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }

        if (tempStreak > bestStreak) bestStreak = tempStreak;
        lastDate = date;
      }

      streaks[gameType] = { current: currentStreak, best: bestStreak, totalWins };
    }

    return NextResponse.json({ streaks });
  } catch (error) {
    console.error('[DAILY_STREAKS] GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
