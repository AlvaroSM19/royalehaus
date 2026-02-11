"use client";
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface Entry { 
  userId: string; 
  username: string; 
  avatarId: string | null; 
  totalGames?: number; 
  gamesPlayedById?: Record<string, number>; 
  level?: number; 
  xpTotal?: number;
  streak?: number;
  bestStreak?: number;
  bestScore?: number;
  bestWinAttempts?: number;
  bestAttempts?: number;
  longestWordLength?: number;
}

type FilterType = 'xp' | 'streak' | 'higherlower' | 'royaledle' | 'impostor' | 'wordle' | 'tapone';

// RoyaleHaus uses numeric card IDs (1-171). If avatarId is not numeric, it's from OnePieceHaus - use default
function getCardImage(cardId: string | null): string {
  if (!cardId) return '/images/cards/1.webp';
  // Check if it's a valid numeric ID for RoyaleHaus
  const numId = parseInt(cardId, 10);
  if (isNaN(numId) || numId < 1 || numId > 171) {
    return '/images/cards/1.webp'; // Default avatar for non-RoyaleHaus IDs
  }
  return `/images/cards/${numId}.webp`;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('xp');
  const [extra, setExtra] = useState<any[]>([]);
  const [me, setMe] = useState<{ id: string } | null>(null);

  // Fetch main leaderboard data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch('/api/leaderboard', { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok || !j?.ok) throw new Error(j?.error || 'failed');
        setData(j.data.leaderboard || []);
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch current user
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/me', { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          if (j?.user?.id) setMe({ id: j.user.id });
        }
      } catch {}
    })();
  }, []);

  // Fetch extra leaderboards (streak + high scores) when filter changes
  useEffect(() => {
    const typeMap: Record<string, string> = {
      xp: 'xp',
      streak: 'streak',
      higherlower: 'higherlower',
      royaledle: 'royaledle',
      impostor: 'impostor',
      wordle: 'wordle'
    };
    const type = typeMap[filter];
    if (!type) return;
    
    (async () => {
      try {
        const r = await fetch(`/api/leaderboards?type=${type}`, { cache: 'no-store' });
        const j = await r.json();
        if (r.ok && j.ok) {
          setExtra(j.data.entries || []);
        } else {
          setExtra([]);
        }
      } catch {
        setExtra([]);
      }
    })();
  }, [filter]);

  const ranked = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      if (filter === 'xp') return (b.level ?? 0) - (a.level ?? 0) || (b.xpTotal ?? 0) - (a.xpTotal ?? 0);
      if (filter === 'streak') return 0; // handled by extra
      return (b.gamesPlayedById?.[filter] || 0) - (a.gamesPlayedById?.[filter] || 0);
    });
    return sorted.map((e, i) => ({ ...e, rank: i + 1 })).slice(0, 10);
  }, [data, filter]);

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/60 to-black/80 -z-10" />
      <div className="container mx-auto px-4 py-10 space-y-10">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,200,90,0.3)] leading-tight">
              Leaderboard
            </h1>
            <p className="text-amber-200/80 mt-3 max-w-xl text-sm md:text-base font-medium">
              Top players ranked by XP, high scores, and streaks.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 items-start w-full">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'xp', label: '🏆 XP Level' },
                { id: 'streak', label: '🔥 Day Streak' },
                { id: 'higherlower', label: '📈 Higher/Lower' },
                { id: 'impostor', label: '🎯 Impostor' },
                { id: 'tapone', label: '🎰 Tap One' },
                { id: 'wordle', label: '📝 Wordle' },
                { id: 'royaledle', label: '👑 Royaledle' },
              ].map(b => {
                const active = filter === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => setFilter(b.id as FilterType)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold tracking-wide border transition shadow ${
                      active
                        ? 'bg-amber-500/25 text-amber-100 border-amber-400/60 shadow-amber-500/30'
                        : 'bg-slate-800/60 text-amber-200/70 border-amber-600/30 hover:text-amber-100 hover:bg-slate-700/60'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
            
            {/* Back Button */}
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black shadow shadow-black/40 hover:brightness-110 transition"
              >
                ⛵ Back
              </Link>
            </div>
          </div>
        </header>

        {/* Leaderboard Table */}
        <section>
          {loading && <div className="text-amber-300/70 text-sm">Loading leaderboard…</div>}
          {error && <div className="text-red-400 text-sm">{error}</div>}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-xl border border-amber-700/40 bg-[#101b24]/60 backdrop-blur-sm shadow shadow-black/40">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-amber-300/70 bg-amber-900/20">
                    <th className="px-3 py-2 font-bold">Rank</th>
                    <th className="px-3 py-2 font-bold">Player</th>
                    {filter === 'xp' && (
                      <>
                        <th className="px-3 py-2 font-bold">🏆 Level</th>
                        <th className="px-3 py-2 font-bold">XP Total</th>
                      </>
                    )}
                    {filter === 'streak' && <th className="px-3 py-2 font-bold">🔥 Day Streak</th>}
                    {filter === 'higherlower' && <th className="px-3 py-2 font-bold">📈 Best Streak</th>}
                    {filter === 'impostor' && (
                      <>
                        <th className="px-3 py-2 font-bold">🎯 Best Streak</th>
                        <th className="px-3 py-2 font-bold">Score</th>
                      </>
                    )}
                    {filter === 'tapone' && (
                      <>
                        <th className="px-3 py-2 font-bold">🎰 Best Rank</th>
                        <th className="px-3 py-2 font-bold">Score</th>
                      </>
                    )}
                    {filter === 'wordle' && (
                      <>
                        <th className="px-3 py-2 font-bold">📝 Best Attempts</th>
                        <th className="px-3 py-2 font-bold">Longest Word</th>
                      </>
                    )}
                    {filter === 'royaledle' && <th className="px-3 py-2 font-bold">👑 Best Attempts</th>}
                  </tr>
                </thead>
                <tbody>
                  {extra.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-amber-300/50">
                        No entries yet. Be the first!
                      </td>
                    </tr>
                  )}
                  {extra.map((e: any, i: number) => {
                    const isMe = me && me.id === e.userId;
                    return (
                      <tr
                        key={e.userId}
                        className={`border-t border-amber-700/30 hover:bg-amber-800/10 ${
                          isMe ? 'relative ring-1 ring-amber-400/60 bg-amber-900/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-black text-amber-200">#{i + 1}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-[48px] rounded-lg overflow-hidden ring-2 ${
                                isMe ? 'ring-emerald-400/70' : 'ring-amber-500/40'
                              } bg-slate-800 flex-shrink-0`}
                            >
                              <img
                                src={getCardImage(e.avatarId)}
                                alt={e.username}
                                className="object-cover w-full h-full"
                                onError={(ev) => {
                                  (ev.target as HTMLImageElement).src = '/images/cards/1.webp';
                                }}
                              />
                            </div>
                            <div className="flex flex-col leading-tight">
                              <Link
                                href={`/logbook/${encodeURIComponent(e.username || 'player')}`}
                                className={`font-bold text-sm ${
                                  isMe ? 'text-emerald-200' : 'text-amber-100'
                                } hover:underline`}
                              >
                                {(e.username || 'player').toUpperCase()}
                              </Link>
                            </div>
                          </div>
                        </td>
                        {filter === 'xp' && (
                          <>
                            <td className="px-3 py-2 font-semibold text-emerald-300">{e.level}</td>
                            <td className="px-3 py-2 text-amber-100/70">
                              {e.xpTotal?.toLocaleString()}
                            </td>
                          </>
                        )}
                        {filter === 'streak' && (
                          <td className="px-3 py-2 font-semibold text-emerald-300">
                            {e.streak} days
                          </td>
                        )}
                        {filter === 'higherlower' && (
                          <td className="px-3 py-2 font-semibold text-emerald-300">
                            {e.bestStreak}
                          </td>
                        )}
                        {filter === 'impostor' && (
                          <>
                            <td className="px-3 py-2 font-semibold text-emerald-300">
                              {e.bestStreak}
                            </td>
                            <td className="px-3 py-2 text-amber-100/70">{e.bestScore}</td>
                          </>
                        )}
                        {filter === 'tapone' && (
                          <>
                            <td className="px-3 py-2 font-semibold text-emerald-300">
                              #{e.bestRank}
                            </td>
                            <td className="px-3 py-2 text-amber-100/70">{e.bestScore}</td>
                          </>
                        )}
                        {filter === 'wordle' && (
                          <>
                            <td className="px-3 py-2 font-semibold text-emerald-300">
                              {e.bestAttempts}
                            </td>
                            <td className="px-3 py-2 text-amber-100/70">
                              {e.longestWordLength} chars
                            </td>
                          </>
                        )}
                        {filter === 'royaledle' && (
                          <td className="px-3 py-2 font-semibold text-emerald-300">
                            {e.bestWinAttempts}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer Note */}
        <section className="text-[11px] text-amber-300/50 max-w-2xl">
          <p>
            Counts reflect synced sessions (local-only play not logged unless user signs in). 
            Updates when page loads; live realtime coming later.
          </p>
        </section>
      </div>
    </div>
  );
}
