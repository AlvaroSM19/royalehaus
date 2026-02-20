import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';

// Valid game types for daily challenges
const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'pixel-royale'] as const;
type GameType = typeof VALID_GAME_TYPES[number];

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET: Fetch today's daily challenge for a game type + user's participation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get('game') as GameType;
    const dateParam = searchParams.get('date'); // Optional: for admin preview
    
    if (!gameType || !VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const date = dateParam || getTodayDate();

    // Get the challenge for this date
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date, gameType } },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for this date', date }, { status: 404 });
    }

    // Check if user is logged in
    const cookieStore = cookies();
    const sid = cookieStore.get('sid')?.value;
    let participation = null;
    let userId: string | null = null;

    if (sid) {
      const session = await prisma.session.findUnique({
        where: { id: sid },
        include: { user: true },
      });
      
      if (session && session.expiresAt > new Date()) {
        userId = session.userId;
        participation = await prisma.dailyParticipation.findUnique({
          where: { challengeId_userId: { challengeId: challenge.id, userId } },
        });
      }
    }

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        date: challenge.date,
        gameType: challenge.gameType,
        cardId: challenge.cardId, // Always send cardId (needed for authenticated users)
      },
      participation: participation ? {
        completed: participation.completed,
        won: participation.won,
        attempts: participation.attempts,
        completedAt: participation.completedAt,
      } : null,
      isLoggedIn: !!userId,
    });
  } catch (error) {
    console.error('GET /api/daily error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Record a guess/attempt for the daily challenge
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameType, guessedCardId, won } = body;

    if (!gameType || !VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // User must be logged in
    const cookieStore = cookies();
    const sid = cookieStore.get('sid')?.value;
    
    if (!sid) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const userId = session.userId;
    const date = getTodayDate();

    // Get today's challenge
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date, gameType } },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for today' }, { status: 404 });
    }

    // Check if already participated
    let participation = await prisma.dailyParticipation.findUnique({
      where: { challengeId_userId: { challengeId: challenge.id, userId } },
    });

    if (participation?.completed) {
      return NextResponse.json({ 
        error: 'Already completed today\'s challenge',
        participation: {
          completed: true,
          won: participation.won,
          attempts: participation.attempts,
        }
      }, { status: 400 });
    }

    const isCorrect = guessedCardId === challenge.cardId;
    const newAttempts = (participation?.attempts || 0) + 1;
    const isCompleted = won || isCorrect;

    if (participation) {
      participation = await prisma.dailyParticipation.update({
        where: { id: participation.id },
        data: {
          attempts: newAttempts,
          completed: isCompleted,
          won: isCorrect || won,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    } else {
      participation = await prisma.dailyParticipation.create({
        data: {
          challengeId: challenge.id,
          userId,
          attempts: 1,
          completed: isCompleted,
          won: isCorrect || won,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    return NextResponse.json({
      correct: isCorrect,
      completed: participation.completed,
      won: participation.won,
      attempts: participation.attempts,
      // Reveal the answer if completed
      correctCardId: participation.completed ? challenge.cardId : undefined,
    });
  } catch (error) {
    console.error('POST /api/daily error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
