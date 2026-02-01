import { NextRequest, NextResponse } from 'next/server';
import { createUser, createSession, publicUser } from '@/server/auth-store';
import { rateLimit } from '@/server/rate-limit';

export const runtime = 'nodejs';

function validateEmail(email: string) { return /.+@.+\..+/.test(email); }

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000); // 10 new accounts/hour/IP
    if (!rl.ok) return NextResponse.json({ error: 'RATE_LIMIT', retryAfter: rl.resetAt }, { status: 429 });
    
    const { email, username, password } = await req.json();
    if (!email || !username || !password) return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    if (!validateEmail(email)) return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 });
    if (username.length < 3) return NextResponse.json({ error: 'USERNAME_TOO_SHORT' }, { status: 400 });
    // Validar username: solo letras, números, guiones y guiones bajos
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return NextResponse.json({ error: 'USERNAME_INVALID_CHARS' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 });
    
    const user = await createUser(email.trim(), username.trim(), password);
    const session = await createSession(user.id);
    const res = NextResponse.json({ user: publicUser(user) });
    
    const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0];
    const secure = forwardedProto ? forwardedProto === 'https' : process.env.NODE_ENV === 'production';
    res.cookies.set('sid', session.id, { httpOnly: true, sameSite: 'lax', path: '/', secure, maxAge: 60 * 60 * 24 * 30 });
    
    return res;
  } catch (e: any) {
    if (e?.message === 'EMAIL_EXISTS') return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 });
    if (e?.message === 'USERNAME_EXISTS') return NextResponse.json({ error: 'USERNAME_EXISTS' }, { status: 409 });
    console.error('[REGISTER_ERROR]', { message: e?.message, code: e?.code, stack: e?.stack });
    const detail = process.env.NODE_ENV !== 'production' ? (e?.message || 'unknown') : undefined;
    return NextResponse.json({ error: 'SERVER_ERROR', detail }, { status: 500 });
  }
}
