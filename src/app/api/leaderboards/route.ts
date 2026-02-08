import { NextRequest, NextResponse } from 'next/server';
import { 
  listTopProgress, 
  listTopXp, 
  listTopStreaks, 
  listTopHigherLower, 
  listTopImpostor, 
  listTopRoyaledle, 
  listTopWordle,
  listTopTapOne 
} from '@/server/progress-store';

export const runtime = 'nodejs';

function ok(data: any, status = 200) { return NextResponse.json({ ok: true, data }, { status }); }

// Public leaderboards by game/type (no auth required for viewing)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // Support both 'game' and 'type' params for compatibility
  const filter = searchParams.get('type') || searchParams.get('game') || 'xp';
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
  
  try {
    let entries: any[] = [];
    
    switch (filter) {
      case 'total':
        entries = await listTopProgress(limit);
        break;
      case 'xp':
        entries = await listTopXp(limit);
        break;
      case 'streak':
        entries = await listTopStreaks(limit);
        break;
      case 'higherlower':
        entries = await listTopHigherLower(limit);
        break;
      case 'impostor':
        entries = await listTopImpostor(limit);
        break;
      case 'royaledle':
        entries = await listTopRoyaledle(limit);
        break;
      case 'wordle':
        entries = await listTopWordle(limit);
        break;
      case 'tapone':
        entries = await listTopTapOne(limit);
        break;
      default:
        entries = await listTopXp(limit);
    }
    
    return ok({ type: filter, entries });
  } catch (e: any) {
    console.error('[leaderboards:get:error]', e);
    return ok({ type: filter, entries: [] }, 200);
  }
}
