import { NextRequest, NextResponse } from 'next/server';
import { listTopProgress } from '@/server/progress-store';

export const runtime = 'nodejs';

function ok(data: any, status = 200) { return NextResponse.json({ ok: true, data }, { status }); }

// Public leaderboard (no auth required for viewing)
export async function GET(_req: NextRequest) {
  try {
    const top = await listTopProgress(10);
    return ok({ leaderboard: top });
  } catch (e: any) {
    console.error('[leaderboard:get:error]', e);
    return ok({ leaderboard: [] }, 200);
  }
}
