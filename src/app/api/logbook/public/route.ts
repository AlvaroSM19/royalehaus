import { NextRequest, NextResponse } from 'next/server';
import { getUserProgress } from '@/server/progress-store';
import { findUserByEmailOrUsername } from '@/server/auth-store';

export const runtime = 'nodejs';

function ok(data: any, status = 200) { 
  return NextResponse.json({ ok: true, data }, { status }); 
}

function fail(message: string, status = 400) { 
  return NextResponse.json({ ok: false, error: message }, { status }); 
}

// Helper to compute streak from calendar
function computeCurrentStreak(progress: any): number {
  const set = new Set(progress?.calendar || []);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

// GET /api/logbook/public?username=foo
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = (searchParams.get('username') || '').trim().toLowerCase();
    
    if (!username) {
      return fail('missing username', 400);
    }
    
    const user = await findUserByEmailOrUsername(username);
    
    if (!user || user.username.toLowerCase() !== username) {
      return fail('not found', 404);
    }
    
    const progress = await getUserProgress(user.id);
    const streak = computeCurrentStreak(progress || {});
    
    // Note: findUserByEmailOrUsername already maps royaleAvatarId to avatarId
    return ok({
      user: { 
        id: user.id, 
        username: user.username, 
        avatarId: user.avatarId || null 
      },
      streak,
      progress: progress || null,
    });
  } catch (e: any) {
    console.error('[logbook/public]', e);
    return fail(e?.message || 'error', 500);
  }
}
