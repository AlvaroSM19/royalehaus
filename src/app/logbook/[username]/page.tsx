"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type UserProgress = {
  version: number;
  calendar: string[];
  stats: { gamesPlayedTotal: number; gamesPlayedById: Record<string, number> };
  highScores: any;
  stickers: string[];
  cards: string[];
  meta: Record<string, any>;
  user: { username?: string; avatarId?: string };
};

const DAYS_TO_SHOW = 60;

function buildCalendar(progress: UserProgress | null) {
  const days: { date: string; played: boolean }[] = [];
  const played = new Set(progress?.calendar || []);
  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA');
    days.push({ date: key, played: played.has(key) });
  }
  return days;
}

// RoyaleHaus uses numeric card IDs (1-171). If avatarId is not numeric, it's from OnePieceHaus - use default
function getCardImage(cardId: string | null): string {
  if (!cardId) return '/images/cards/1.png';
  // Check if it's a valid numeric ID for RoyaleHaus
  const numId = parseInt(cardId, 10);
  if (isNaN(numId) || numId < 1 || numId > 171) {
    return '/images/cards/1.png'; // Default avatar for non-RoyaleHaus IDs
  }
  return `/images/cards/${numId}.png`;
}

export default function PublicLogbookPage({ params }: { params: { username: string } }) {
  const uname = (params.username || '').toLowerCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id: string; username: string; avatarId: string | null } | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/logbook/public?username=${encodeURIComponent(uname)}`, { cache: 'no-store' });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'Not found');
        setProfile(j.data.user);
        setProgress(j.data.progress);
        setStreak(j.data.streak || 0);
        setError(null);
      } catch (e: any) {
        setError(e?.message || 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [uname]);

  const calendar = useMemo(() => buildCalendar(progress), [progress]);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/60 to-black/80 -z-10" />
      <div className="container mx-auto px-4 py-10 space-y-12">
        
        {/* Header */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="w-28 h-[135px] rounded-2xl overflow-hidden ring-2 ring-amber-400/50 bg-slate-800 flex items-center justify-center">
                <img
                  src={getCardImage(profile?.avatarId || null)}
                  alt={profile?.username || 'avatar'}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/cards/1.png';
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <h1 className="text-5xl sm:text-6xl font-extrabold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,200,90,0.25)] leading-none select-none">
                    {(profile?.username || uname).toUpperCase()}
                  </h1>
                </div>
              </div>
              <div className="text-[11px] text-amber-300/70 font-medium mt-1">Public logbook • view only</div>
            </div>
          </div>
          
          <div className="flex gap-4 self-start">
            <Link
              href="/leaderboard"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black shadow shadow-black/40 hover:brightness-110 transition"
            >
              ⟵ Back to Leaderboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 text-amber-200 shadow shadow-black/40 hover:brightness-110 transition"
            >
              Games
            </Link>
          </div>
        </header>

        {loading && <div className="text-amber-300/70 text-sm">Loading…</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            <section className="grid md:grid-cols-5 gap-4">
              <div className="op-card bg-[#101b24]/70 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm shadow shadow-black/40 col-span-2 md:col-span-1">
                <div className="text-[10px] uppercase tracking-wide text-amber-400 font-bold mb-1">Daily Streak</div>
                <div className="text-3xl font-black text-amber-200">{streak}</div>
              </div>
              <div className="op-card bg-[#101b24]/70 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm shadow shadow-black/40">
                <div className="text-[10px] uppercase tracking-wide text-amber-400 font-bold mb-1">Royaledle (Best)</div>
                <div className="text-xl font-extrabold text-amber-100">
                  {progress?.highScores?.royaledle?.bestWinAttempts ?? '—'}
                </div>
              </div>
              <div className="op-card bg-[#101b24]/70 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm shadow shadow-black/40">
                <div className="text-[10px] uppercase tracking-wide text-amber-400 font-bold mb-1">Higher Lower (Best Streak)</div>
                <div className="text-2xl font-black text-amber-100">
                  {progress?.highScores?.higherlower?.bestStreak ?? '—'}
                </div>
              </div>
              <div className="op-card bg-[#101b24]/70 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm shadow shadow-black/40">
                <div className="text-[10px] uppercase tracking-wide text-amber-400 font-bold mb-1">Impostor (Best Streak)</div>
                <div className="text-2xl font-black text-amber-100">
                  {progress?.highScores?.impostor?.bestStreak ?? '—'}
                </div>
              </div>
              <div className="op-card bg-[#101b24]/70 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm shadow shadow-black/40">
                <div className="text-[10px] uppercase tracking-wide text-amber-400 font-bold mb-1">Wordle (Best)</div>
                <div className="text-xl font-black text-amber-100">
                  {progress?.highScores?.wordle?.bestAttempts ?? '—'}
                </div>
              </div>
            </section>

            {/* Games Overview */}
            <section className="mt-8">
              <h2 className="text-xl font-extrabold mb-4 bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                GAMES OVERVIEW
              </h2>
              {(() => {
                const ids = ['royaledle', 'higherlower', 'impostor', 'wordle'];
                const total = ids.reduce((a, id) => a + (progress?.stats?.gamesPlayedById?.[id] || 0), 0);
                return (
                  <div className="op-card bg-gradient-to-br from-emerald-600/30 via-emerald-700/30 to-teal-700/30 border border-emerald-400/40 rounded-2xl p-5 backdrop-blur-sm shadow-lg shadow-emerald-900/40 flex flex-col mb-4">
                    <div className="text-xs uppercase tracking-wide font-black text-emerald-300 mb-1">TOTAL (4 GAMES)</div>
                    <div className="text-3xl font-black text-emerald-100">{total}</div>
                    <div className="text-[10px] text-emerald-200/70 font-semibold mt-1">Sum of all games played</div>
                  </div>
                );
              })()}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {[
                  { id: 'royaledle', label: 'Royaledle' },
                  { id: 'higherlower', label: 'Higher Lower' },
                  { id: 'impostor', label: 'Impostor' },
                  { id: 'wordle', label: 'Wordle' },
                ].map(g => {
                  const count = progress?.stats?.gamesPlayedById?.[g.id] || 0;
                  return (
                    <div
                      key={g.id}
                      className="op-card bg-[#101b24]/70 border border-amber-700/40 rounded-2xl p-5 backdrop-blur-sm shadow shadow-black/40 flex flex-col"
                    >
                      <div className="text-xs uppercase tracking-wide text-amber-400 font-bold mb-1">{g.label}</div>
                      <div className="text-2xl font-black text-amber-200">{count}</div>
                      <div className="text-[10px] text-amber-300/60 font-semibold mt-1">Games Played</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Calendar */}
            <section>
              <h2 className="text-2xl font-extrabold mb-4 bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
                Daily Playing Chart
              </h2>
              <div className="grid grid-cols-12 gap-1 md:gap-1.5 max-w-4xl">
                {calendar.map(d => {
                  const dateObj = new Date(d.date);
                  const dayStr = String(dateObj.getDate()).padStart(2, '0');
                  const monthStr = dateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
                  return (
                    <div
                      key={d.date}
                      title={d.date}
                      className={`relative flex flex-col items-center justify-center rounded-md md:rounded-lg border text-[8px] md:text-[10px] font-black leading-tight aspect-square select-none ${
                        d.played
                          ? 'bg-emerald-500/70 border-emerald-300/60 text-emerald-950'
                          : 'bg-slate-800/60 border-slate-600/50 text-slate-400'
                      }`}
                    >
                      <span>{dayStr}</span>
                      <span className="text-[7px] md:text-[9px] tracking-wide">{monthStr}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-amber-300/60 mt-2">
                Last {DAYS_TO_SHOW} days. Green = at least one game played.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
