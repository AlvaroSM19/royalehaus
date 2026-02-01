import { NextRequest, NextResponse } from 'next/server';
import { getSession, findUserById, updateUser, publicUser } from '@/server/auth-store';

export const runtime = 'nodejs';

async function handleProfileUpdate(req: NextRequest) {
  try {
    const sid = req.cookies.get('sid')?.value;
    if (!sid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    
    const session = await getSession(sid);
    if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    
    const user = await findUserById(session.userId);
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    
    const body = await req.json();
    const updateData: { username?: string; avatarId?: string } = {};
    
    // Only allow avatarId updates (username is immutable after creation)
    if (body.avatarId !== undefined) updateData.avatarId = body.avatarId;
    
    const updated = await updateUser(user.id, updateData);
    if (!updated) return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
    
    return NextResponse.json({ user: publicUser(updated) });
  } catch (e: any) {
    if (e?.message === 'USERNAME_EXISTS') return NextResponse.json({ error: 'USERNAME_EXISTS' }, { status: 409 });
    console.error('[PROFILE_UPDATE_ERROR]', e);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}

// Support both PATCH and PUT methods
export async function PATCH(req: NextRequest) {
  return handleProfileUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleProfileUpdate(req);
}