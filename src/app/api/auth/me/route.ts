import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById, publicUser } from '@/server/auth-store';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sid = req.cookies.get('sid')?.value;
  if (!sid) return NextResponse.json({ user: null });
  
  const session = await getSession(sid);
  if (!session) return NextResponse.json({ user: null });
  
  const user = await findUserById(session.userId);
  if (!user) return NextResponse.json({ user: null });
  
  return NextResponse.json({ user: publicUser(user) });
}
