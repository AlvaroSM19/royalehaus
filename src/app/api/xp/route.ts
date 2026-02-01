import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/server/progress-store';
import { grantXp, getXpSummary } from '@/server/xp-service';

export const runtime = 'nodejs';

function ok(data: any, status = 200) { return NextResponse.json({ ok: true, data }, { status }); }
function fail(message: string, status = 400) { return NextResponse.json({ ok: false, error: message }, { status }); }

export async function GET(req: NextRequest) {
  const userId = await requireUser(req);
  if (!userId) return fail('UNAUTHORIZED', 401);
  
  const summary = await getXpSummary(userId);
  return ok(summary);
}

export async function POST(req: NextRequest) {
  const userId = await requireUser(req);
  if (!userId) return fail('UNAUTHORIZED', 401);
  
  try {
    const { kind, amount, meta } = await req.json();
    if (!kind || typeof amount !== 'number') return fail('MISSING_FIELDS');
    
    const result = await grantXp(userId, amount, kind, meta);
    return ok(result);
  } catch (e: any) {
    console.error('[XP_GRANT_ERROR]', e);
    return fail('SERVER_ERROR', 500);
  }
}
