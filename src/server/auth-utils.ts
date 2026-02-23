import { NextRequest } from 'next/server';
import { getSession, findUserById } from '@/server/auth-store';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role?: string;
}

/**
 * Get the authenticated user from a request cookie.
 * Uses the SAME proven auth path as /api/auth/me:
 *   req.cookies.get('sid') → getSession(sid) → findUserById(session.userId)
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    const sid = req.cookies.get('sid')?.value;
    if (!sid) return null;

    const session = await getSession(sid);
    if (!session) return null;

    const user = await findUserById(session.userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  } catch {
    return null;
  }
}

/**
 * Require admin role. Returns the user if admin, null otherwise.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthUser | null> {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'admin') return null;
  return user;
}
