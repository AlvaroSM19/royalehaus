import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';

// GET: Fetch current site stats
export async function GET() {
  try {
    let stat = await prisma.siteStat.findUnique({
      where: { id: 'main' },
    });

    if (!stat) {
      stat = await prisma.siteStat.create({
        data: { id: 'main', visits: 0, displayVisits: 0 },
      });
    }

    return NextResponse.json({ 
      visits: stat.visits,
      displayVisits: stat.displayVisits,
      updatedAt: stat.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// POST: Increment visit count
export async function POST(request: NextRequest) {
  try {
    // Check for existing visit in this session via cookie
    const visitedCookie = request.cookies.get('royale_visited');
    
    if (visitedCookie?.value === 'true') {
      // Already counted this session, just return current stats
      const stat = await prisma.siteStat.findUnique({
        where: { id: 'main' },
      });
      return NextResponse.json({ 
        visits: stat?.visits ?? 0,
        displayVisits: stat?.displayVisits ?? 0,
        alreadyCounted: true,
      });
    }

    // Increment visit count
    const stat = await prisma.siteStat.upsert({
      where: { id: 'main' },
      update: { 
        visits: { increment: 1 },
        displayVisits: { increment: 1 },
      },
      create: { 
        id: 'main', 
        visits: 1, 
        displayVisits: 1,
      },
    });

    // Create response with cookie to prevent double counting
    const response = NextResponse.json({ 
      visits: stat.visits,
      displayVisits: stat.displayVisits,
      counted: true,
    });

    // Set cookie for 24 hours to prevent recounting
    response.cookies.set('royale_visited', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Error incrementing visit:', error);
    return NextResponse.json({ error: 'Failed to increment visit' }, { status: 500 });
  }
}

// PATCH: Update display visits (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayVisits } = body;

    if (typeof displayVisits !== 'number') {
      return NextResponse.json({ error: 'Invalid displayVisits value' }, { status: 400 });
    }

    const stat = await prisma.siteStat.upsert({
      where: { id: 'main' },
      update: { displayVisits },
      create: { id: 'main', visits: 0, displayVisits },
    });

    return NextResponse.json({ 
      visits: stat.visits,
      displayVisits: stat.displayVisits,
    });
  } catch (error) {
    console.error('Error updating display visits:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
