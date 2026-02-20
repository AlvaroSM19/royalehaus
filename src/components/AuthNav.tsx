"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { Calendar } from 'lucide-react';

export default function AuthNav() {
  const { user, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const doLogout = async () => { await logout(); setConfirming(false); };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link 
          href="/auth?mode=login" 
          className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
        >
          Login
        </Link>
        <Link 
          href="/auth?mode=register" 
          className="px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide bg-rose-600 text-white border border-rose-500 shadow hover:bg-rose-500 transition"
        >
          Register
        </Link>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {!confirming ? (
        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <>
              <Link 
                href="/admin/daily" 
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold tracking-wide bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-600/30 hover:text-amber-300 transition flex items-center gap-1.5"
                title="Daily Challenges Admin"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Daily Admin</span>
              </Link>
              <Link 
                href="/admin/feedback" 
                className="text-[11px] font-semibold tracking-wide text-zinc-400 hover:text-white transition uppercase"
              >
                Feedback
              </Link>
            </>
          )}
          <button 
            onClick={() => setConfirming(true)} 
            className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1">
          <span className="text-[10px] font-semibold text-zinc-400">Confirm?</span>
          <button 
            onClick={doLogout} 
            className="px-2 py-1 rounded bg-red-600 text-[10px] font-bold text-white hover:bg-red-500"
          >
            Yes
          </button>
          <button 
            onClick={() => setConfirming(false)} 
            className="px-2 py-1 rounded bg-zinc-700 text-[10px] font-bold text-zinc-300 hover:bg-zinc-600"
          >
            No
          </button>
        </div>
      )}
    </div>
  );
}
