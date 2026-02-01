import { NextRequest, NextResponse } from 'next/server';
import { getUserProgress, saveUserProgress, mergeProgress, requireUser } from '@/server/progress-store';

export const runtime = 'nodejs';

function ok(data: any, status = 200) { return NextResponse.json({ ok: true, data }, { status }); }
function fail(message: string, status = 400) { return NextResponse.json({ ok: false, error: message }, { status }); }

export async function GET(req: NextRequest) {
  const userId = await requireUser(req);
  if (!userId) return fail('UNAUTHORIZED', 401);
  
  const progress = await getUserProgress(userId);
  return ok({ progress });
}

export async function PUT(req: NextRequest) {
  const userId = await requireUser(req);
  if (!userId) return fail('UNAUTHORIZED', 401);
  
  try {
    const { progress: local } = await req.json();
    if (!local) return fail('MISSING_PROGRESS');
    
    const server = await getUserProgress(userId);
    const merged = mergeProgress(server, local);
    await saveUserProgress(userId, merged);
    
    return ok({ progress: merged });
  } catch (e: any) {
    console.error('[PROGRESS_PUT_ERROR]', e);
    return fail('SERVER_ERROR', 500);
  }
}
