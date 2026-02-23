import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';

// Valid game types for daily challenges
const VALID_GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'] as const;
type GameType = typeof VALID_GAME_TYPES[number];

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET: Fetch today's daily challenge - PÚBLICO (no requiere autenticación)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get('game') as GameType;
    const dateParam = searchParams.get('date');
    
    if (!gameType || !VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    const date = dateParam || getTodayDate();

    // Buscar el challenge del día
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date, gameType } },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for this date', date }, { status: 404 });
    }

    // Siempre devolver el cardId - es público
    return NextResponse.json({
      id: challenge.id,
      date: challenge.date,
      gameType: challenge.gameType,
      cardId: challenge.cardId,
    });
  } catch (error) {
    console.error('[DAILY_API] GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: Guardar participación (solo usuarios autenticados)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameType, won, attempts } = body;

    if (!gameType || !VALID_GAME_TYPES.includes(gameType)) {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Usuario debe estar logueado
    const cookieStore = await cookies();
    const sid = cookieStore.get('sid')?.value;
    
    if (!sid) {
      // No logueado - OK, se guarda en localStorage
      return NextResponse.json({ ok: true, saved: false, message: 'Guest mode - saved locally' });
    }

    const session = await prisma.session.findUnique({
      where: { id: sid },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ ok: true, saved: false, message: 'Session expired' });
    }

    const userId = session.userId;
    const date = getTodayDate();

    // Obtener challenge de hoy
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date, gameType } },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'No challenge for today' }, { status: 404 });
    }

    // Crear o actualizar participación
    const participation = await prisma.dailyParticipation.upsert({
      where: { 
        challengeId_userId: { 
          challengeId: challenge.id, 
          userId 
        } 
      },
      create: {
        challengeId: challenge.id,
        userId,
        attempts: attempts || 1,
        completed: true,
        won,
        completedAt: new Date(),
      },
      update: {
        attempts: attempts || 1,
        completed: true,
        won,
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
      }
    });
  } catch (error) {
    console.error('[DAILY_API] POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
