// Simple in-memory sliding window rate limiter (DEV). Replace with Redis in production.
// key pattern: ip:route
interface Entry { count: number; resetAt: number }
const store: Record<string, Entry> = {};

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store[key];
  
  if (!entry || entry.resetAt < now) {
    store[key] = { count: 1, resetAt: now + windowMs };
    return { ok: true, remaining: limit - 1, resetAt: store[key].resetAt };
  }
  
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}
