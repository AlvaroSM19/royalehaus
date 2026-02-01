import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmailOrUsername, verifyPassword, createSession, publicUser } from '@/server/auth-store';
import { rateLimit } from '@/server/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000); // 10 attempts / 15 min
    if (!rl.ok) return NextResponse.json({ error: 'RATE_LIMIT', retryAfter: rl.resetAt }, { status: 429 });

    // Safely parse JSON body
    let body: any = null;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }
    
    const identifier = body?.identifier?.toString();
    const password = body?.password?.toString();
    if (!identifier || !password) return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });

    const user = await findUserByEmailOrUsername(identifier.trim());
    if (!user) return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    if (!verifyPassword(user, password)) return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });

    const session = await createSession(user.id);
    const res = NextResponse.json({ user: publicUser(user) });
    
    const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0];
    const secure = forwardedProto ? forwardedProto === 'https' : process.env.NODE_ENV === 'production';
    res.cookies.set('sid', session.id, { httpOnly: true, sameSite: 'lax', path: '/', secure, maxAge: 60 * 60 * 24 * 30 });
    
    return res;
  } catch (e: any) {
    console.error('[LOGIN_ERROR]', { message: e?.message, code: e?.code, stack: e?.stack });
    const detail = process.env.NODE_ENV !== 'production' ? (e?.message || 'unknown') : undefined;
    return NextResponse.json({ error: 'SERVER_ERROR', detail }, { status: 500 });
  }
}
