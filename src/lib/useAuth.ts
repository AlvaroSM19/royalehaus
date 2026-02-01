"use client";
import { useEffect, useState, useCallback } from 'react';
import { resetProgress } from '@/lib/progress';

export interface AuthUser { 
  id: string; 
  email: string; 
  username: string; 
  createdAt: string; 
  avatarId?: string; 
  role?: string; 
}

interface AuthState { 
  user: AuthUser | null; 
  loading: boolean; 
}

// --- Global singleton auth store so multiple useAuth() calls stay in sync instantly ---
type Store = { state: AuthState; listeners: Set<() => void>; refreshing: boolean };
const g: any = globalThis as any;
if (!g.__AUTH_STORE__) {
  let initialUser: AuthUser | null = null;
  if (typeof window !== 'undefined') {
    try { 
      const raw = localStorage.getItem('authUser'); 
      if (raw) initialUser = JSON.parse(raw); 
    } catch {}
  }
  g.__AUTH_STORE__ = { 
    state: { user: initialUser, loading: true }, 
    listeners: new Set(), 
    refreshing: false 
  } as Store;
}
const store: Store = g.__AUTH_STORE__;

function notify() { 
  store.listeners.forEach(fn => { try { fn(); } catch {} }); 
}

async function refreshInternal() {
  if (store.refreshing) return; // avoid parallel
  store.refreshing = true;
  
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    const data = await res.json();
    store.state = { user: data.user || null, loading: false };
    try {
      if (typeof window !== 'undefined') {
        if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));
        else localStorage.removeItem('authUser');
      }
    } catch {}
    notify();
  } catch {
    store.state = { ...store.state, loading: false };
    notify();
  } finally { 
    store.refreshing = false; 
  }
}

async function loginInternal(identifier: string, password: string) {
  const res = await fetch('/api/auth/login', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ identifier, password }), 
    credentials: 'include' 
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new Error((data && data.error) || 'LOGIN_FAILED');
  try { resetProgress(); } catch {}
  store.state = { user: data.user, loading: false };
  try { 
    if (typeof window !== 'undefined') localStorage.setItem('authUser', JSON.stringify(data.user)); 
  } catch {}
  try { 
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:changed')); 
  } catch {}
  notify();
}

async function registerInternal(email: string, username: string, password: string) {
  const res = await fetch('/api/auth/register', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ email, username, password }), 
    credentials: 'include' 
  });
  let data: any = null;
  try { data = await res.json(); } catch { data = null; }
  if (!res.ok) throw new Error((data && data.error) || 'REGISTER_FAILED');
  try { resetProgress(); } catch {}
  store.state = { user: data.user, loading: false };
  try { 
    if (typeof window !== 'undefined') localStorage.setItem('authUser', JSON.stringify(data.user)); 
  } catch {}
  try { 
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:changed')); 
  } catch {}
  notify();
}

async function logoutInternal() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  try { resetProgress(); } catch {}
  store.state = { user: null, loading: false };
  try { 
    if (typeof window !== 'undefined') localStorage.removeItem('authUser'); 
  } catch {}
  try { 
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:changed')); 
  } catch {}
  notify();
}

async function updateProfileInternal(data: { username?: string; avatarId?: string }) {
  const res = await fetch('/api/auth/profile', { 
    method: 'PATCH', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data), 
    credentials: 'include' 
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'PROFILE_UPDATE_FAILED');
  store.state = { ...store.state, user: json.user };
  try { 
    if (typeof window !== 'undefined' && json.user) localStorage.setItem('authUser', JSON.stringify(json.user)); 
  } catch {}
  notify();
}

export function useAuth() {
  const [localState, setLocalState] = useState<AuthState>(store.state);

  useEffect(() => {
    const listener = () => setLocalState(store.state);
    store.listeners.add(listener);
    // Trigger initial refresh only the first time (store.loading true)
    if (store.state.loading && !store.refreshing) refreshInternal();
    return () => { store.listeners.delete(listener); };
  }, []);

  const login = useCallback((identifier: string, password: string) => loginInternal(identifier, password), []);
  const register = useCallback((email: string, username: string, password: string) => registerInternal(email, username, password), []);
  const logout = useCallback(() => logoutInternal(), []);
  const refresh = useCallback(() => refreshInternal(), []);
  const updateProfile = useCallback((data: { username?: string; avatarId?: string }) => updateProfileInternal(data), []);

  return { ...localState, login, register, logout, refresh, updateProfile };
}
