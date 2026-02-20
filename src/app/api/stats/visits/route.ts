import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/prisma';
import { cookies } from 'next/headers';
import { getSession } from '@/server/auth-store';

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

// GET /api/stats/visits - Get visitor count
// Admin sees real count, others see displayVisits
export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin();
    let stat = await prisma.siteStat.findUnique({ where: { id: 'main' } });
    if (!stat) {
      stat = await prisma.siteStat.create({
        data: { id: 'main', visits: 0, displayVisits: 0 },
      });
    }
    const displayCount = admin ? stat.visits : stat.displayVisits;
    return NextResponse.json({ count: displayCount, isAdmin: admin });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ count: 0, isAdmin: false });
  }
}

// POST /api/stats/visits - Increment visitor count
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
