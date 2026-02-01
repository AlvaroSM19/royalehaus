import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Guard producción
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL es obligatorio en producción');
  }
}

// Simple file-based stores (DEV ONLY) with in-memory fallback for serverless environments.
const dataDir = process.env.DATA_DIR || path.join(process.cwd(), '.data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');

interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  avatarId?: string;
  role?: string;
}
interface SessionRecord {
  id: string;
  userId: string;
  createdAt: string;
  lastSeen: string;
}

// In-memory fallback store persisted only for life of process/container
interface MemoryStore { users: UserRecord[]; sessions: SessionRecord[] }
const g: any = globalThis as any;
if (!g.__AUTH_MEM__) g.__AUTH_MEM__ = { users: [], sessions: [] } as MemoryStore;
const mem: MemoryStore = g.__AUTH_MEM__;

const useDb = !!process.env.DATABASE_URL; // toggle based on env
if (process.env.FORCE_DB && !useDb) {
  throw new Error('FORCE_DB activo pero no hay DATABASE_URL');
}

function ensureDir() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]');
    if (!fs.existsSync(sessionsFile)) fs.writeFileSync(sessionsFile, '[]');
  } catch { /* readonly FS - fallback will engage */ }
}

function readJson<T>(file: string, kind: keyof MemoryStore): T {
  try { ensureDir(); return JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); }
  catch { return (mem[kind] as any) as T; }
}

function writeJson(file: string, value: any, kind: keyof MemoryStore) {
  try { ensureDir(); fs.writeFileSync(file, JSON.stringify(value, null, 2)); }
  catch { mem[kind] = value; }
}

export async function findUserByEmailOrUsername(identifier: string): Promise<UserRecord | undefined> {
  if (useDb) {
    const lower = identifier.toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: lower }, { username: lower }] },
      select: { id: true, email: true, username: true, password: true, createdAt: true, updatedAt: true, royaleAvatarId: true, role: true }
    });
    if (!user) return undefined;
    return { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      passwordHash: user.password, 
      createdAt: user.createdAt.toISOString(), 
      updatedAt: user.updatedAt.toISOString(), 
      avatarId: (user as any).royaleAvatarId || undefined, 
      role: user.role || 'user' 
    };
  }
  const users: UserRecord[] = readJson(usersFile, 'users');
  const lower = identifier.toLowerCase();
  return users.find(u => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower);
}

export async function findUserById(id: string) {
  if (useDb) {
    const user = await prisma.user.findUnique({ 
      where: { id }, 
      select: { id: true, email: true, username: true, password: true, createdAt: true, updatedAt: true, royaleAvatarId: true, role: true } 
    });
    if (!user) return undefined;
    return { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      passwordHash: user.password, 
      createdAt: user.createdAt.toISOString(), 
      updatedAt: user.updatedAt.toISOString(), 
      avatarId: (user as any).royaleAvatarId || undefined, 
      role: user.role || 'user' 
    };
  }
  const users: UserRecord[] = readJson(usersFile, 'users'); 
  return users.find(u => u.id === id);
}

export async function createUser(email: string, username: string, password: string) {
  // Random avatar from card IDs 1-79 (troops)
  const randomAvatarId = String(Math.floor(Math.random() * 79) + 1);
  
  try {
    if (useDb) {
      const passwordHash = bcrypt.hashSync(password, 10);
      const user = await prisma.user.create({ 
        data: { 
          email: email.toLowerCase(), 
          username: username.toLowerCase(), 
          password: passwordHash,
          royaleAvatarId: randomAvatarId
        } 
      });
      // create blank progress immediately to avoid merge with stale client local data
      try {
        await (prisma as any).progress.create({ 
          data: { 
            userId: user.id, 
            data: JSON.stringify({ 
              version: 1, 
              calendar: [], 
              stats: { gamesPlayedTotal: 0, gamesPlayedById: {} }, 
              highScores: {}, 
              stickers: [], 
              cards: [], 
              meta: {}, 
              user: { avatarId: randomAvatarId } 
            }) 
          } 
        });
      } catch {}
      return { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        passwordHash: user.password, 
        createdAt: user.createdAt.toISOString(), 
        updatedAt: user.updatedAt.toISOString(), 
        avatarId: (user as any).royaleAvatarId || randomAvatarId 
      };
    }
    
    const users: UserRecord[] = readJson(usersFile, 'users');
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('EMAIL_EXISTS');
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) throw new Error('USERNAME_EXISTS');
    
    const now = new Date().toISOString();
    const passwordHash = bcrypt.hashSync(password, 10);
    const user: UserRecord = { 
      id: crypto.randomUUID(), 
      email, 
      username, 
      passwordHash, 
      createdAt: now, 
      updatedAt: now,
      avatarId: randomAvatarId
    };
    users.push(user);
    writeJson(usersFile, users, 'users');
    return user;
  } catch(err: any) {
    console.error('[CREATE_USER_ERROR]', { message: err?.message, code: err?.code, meta: err?.meta });
    if (err?.message === 'EMAIL_EXISTS' || err?.message === 'USERNAME_EXISTS') throw err;
    throw new Error('CREATE_USER_FAILED:' + (err?.message || 'unknown'));
  }
}

export function verifyPassword(user: UserRecord, password: string) { 
  return bcrypt.compareSync(password, user.passwordHash); 
}

export async function createSession(userId: string): Promise<SessionRecord> {
  if (useDb) {
    const session = await prisma.session.create({ 
      data: { 
        userId, 
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) 
      } 
    });
    return { 
      id: session.id, 
      userId: session.userId, 
      createdAt: session.createdAt.toISOString(), 
      lastSeen: session.createdAt.toISOString() 
    };
  }
  const sessions: SessionRecord[] = readJson(sessionsFile, 'sessions');
  const session: SessionRecord = { 
    id: crypto.randomUUID(), 
    userId, 
    createdAt: new Date().toISOString(), 
    lastSeen: new Date().toISOString() 
  };
  sessions.push(session);
  writeJson(sessionsFile, sessions, 'sessions');
  return session;
}

export async function getSession(id: string): Promise<SessionRecord | undefined> {
  if (useDb) {
    const s = await prisma.session.findUnique({ where: { id } });
    if (!s) return undefined;
    if (s.expiresAt < new Date()) { 
      await prisma.session.delete({ where: { id: s.id } }); 
      return undefined; 
    }
    return { 
      id: s.id, 
      userId: s.userId, 
      createdAt: s.createdAt.toISOString(), 
      lastSeen: s.createdAt.toISOString() 
    };
  }
  const sessions: SessionRecord[] = readJson(sessionsFile, 'sessions');
  const s = sessions.find(s => s.id === id);
  if (s) { 
    s.lastSeen = new Date().toISOString(); 
    writeJson(sessionsFile, sessions, 'sessions'); 
  }
  return s;
}

export async function destroySession(id: string) {
  if (useDb) { 
    try { await prisma.session.delete({ where: { id } }); } catch {} 
    return; 
  }
  const sessions: SessionRecord[] = readJson(sessionsFile, 'sessions');
  const idx = sessions.findIndex(s => s.id === id);
  if (idx >= 0) { 
    sessions.splice(idx, 1); 
    writeJson(sessionsFile, sessions, 'sessions'); 
  }
}

export function publicUser(u: UserRecord) {
  const base: any = { 
    id: u.id, 
    email: u.email, 
    username: u.username, 
    createdAt: u.createdAt 
  };
  if (u.avatarId) base.avatarId = u.avatarId;
  if (u.role) base.role = u.role;
  return base;
}

export async function updateUser(userId: string, data: { username?: string; avatarId?: string }) {
  if (useDb) {
    const updateData: any = {};
    // username immutable after creation
    if (data.avatarId !== undefined) updateData.royaleAvatarId = data.avatarId;
    if (!Object.keys(updateData).length) return;
    
    try {
      const user = await prisma.user.update({ 
        where: { id: userId }, 
        data: updateData 
      });
      
      // Sync avatar into progress JSON if exists
      if (data.avatarId !== undefined) {
        const prog = await (prisma as any).progress.findUnique({ where: { userId } });
        if (prog) {
          try {
            const parsed = JSON.parse(prog.data);
            parsed.user = { ...(parsed.user || {}), avatarId: data.avatarId };
            await (prisma as any).progress.update({ 
              where: { userId }, 
              data: { data: JSON.stringify(parsed) } 
            });
          } catch {}
        }
      }
      
      return { 
        id: user.id, 
        email: user.email, 
        username: user.username, 
        passwordHash: user.password, 
        createdAt: user.createdAt.toISOString(), 
        updatedAt: user.updatedAt.toISOString(), 
        avatarId: (user as any).royaleAvatarId || undefined 
      } as UserRecord;
    } catch (e: any) {
      if (e.code === 'P2002') throw new Error('USERNAME_EXISTS');
      throw e;
    }
  } else {
    const users: UserRecord[] = readJson(usersFile, 'users');
    const u = users.find(u => u.id === userId);
    if (!u) return;
    
    if (data.avatarId !== undefined) u.avatarId = data.avatarId;
    u.updatedAt = new Date().toISOString();
    writeJson(usersFile, users, 'users');
    
    // Update progress file if exists
    if (data.avatarId !== undefined) {
      try {
        const progressFile = path.join(dataDir, 'royale-progress.json');
        let arr: any[] = [];
        try { arr = JSON.parse(fs.readFileSync(progressFile, 'utf8')); } catch {}
        const rec = arr.find(r => r.userId === userId);
        if (rec) {
          rec.progress.user = { ...(rec.progress.user || {}), avatarId: data.avatarId };
          fs.writeFileSync(progressFile, JSON.stringify(arr, null, 2));
        }
      } catch {}
    }
    return u;
  }
}
