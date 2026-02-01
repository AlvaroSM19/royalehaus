import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/server/auth-store';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sid = req.cookies.get('sid')?.value;
  if (sid) await destroySession(sid);
  
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sid', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  
  return res;
}
