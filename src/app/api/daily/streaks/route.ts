import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';

const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'pixel-royale'] as const;

// GET: Fetch user's streaks for daily challenges
export async function GET(req: NextRequest) {
  try {
    // User must be logged in
    const cookieStore = cookies();
    const sid = cookieStore.get('sid')?.value;
    
    if (!sid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = session.userId;

    // Calculate streaks for each game type
    const streaks: Record<string, { current: number; best: number; totalWins: number }> = {};

    for (const gameType of VALID_GAME_TYPES) {
      // Get all completed (won) participations for this game type, ordered by date
      const participations = await prisma.dailyParticipation.findMany({
        where: {
          userId,
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
          // Allow today to be missing (user might not have played yet)
          break;
        }
      }

      // Calculate best streak ever
      let bestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      // Sort dates chronologically for best streak calculation
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
    console.error('GET /api/daily/streaks error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
