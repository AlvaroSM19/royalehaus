'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getProgress, updateUserProfile, syncProgressNowAsync, type UserProgress } from '@/lib/progress';
import cards from '@/data/cards.json';

const allCards = cards as { id: number; name: string; rarity: string }[];
const GAME_IDS = ['royaledle', 'higherlower', 'impostor', 'wordle'] as const;
const GAME_LABELS: Record<string, string> = {
  royaledle: 'Royaledle',
  higherlower: 'Higher Lower', 
  impostor: 'Impostor',
  wordle: 'Wordle'
};

// RoyaleHaus uses numeric card IDs (1-171). If avatarId is not numeric, it's from OnePieceHaus - use default
function getCardImage(cardId: number | string): string {
  const numId = typeof cardId === 'number' ? cardId : parseInt(cardId, 10);
  if (isNaN(numId) || numId < 1 || numId > 171) {
    return '/images/cards/1.png'; // Default avatar for non-RoyaleHaus IDs
  }
  return `/images/cards/${numId}.png`;
}

function computeStreak(calendar: string[]): number {
  const set = new Set(calendar);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

function generateCalendar(calendar: string[]): { day: number; month: string; played: boolean }[] {
  const set = new Set(calendar);
  const result: { day: number; month: string; played: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    result.push({ day: d.getDate(), month, played: set.has(key) });
  }
  return result;
}

export default function LogbookPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      setProgress(getProgress());
      try {
        const u = localStorage.getItem('authUser');
        if (u) setAuthUser(JSON.parse(u));
      } catch {}
    };
    
    loadData();
    setLoading(false);
    
    // Listen for storage changes (when playing games in other tabs)
    const handleStorage = () => loadData();
    window.addEventListener('storage', handleStorage);
    
    // Also refresh on focus (when returning from a game)
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const calendarDays = useMemo(() => generateCalendar(progress?.calendar || []), [progress?.calendar]);
  const streak = computeStreak(progress?.calendar || []);
  const totalGames = progress?.stats?.gamesPlayedTotal || 0;

  const username = authUser?.username || progress?.user?.username || 'Clasher';
  const avatarId = authUser?.avatarId || progress?.user?.avatarId || '1';

  const filteredCards = useMemo(() => {
    if (!avatarSearch) return allCards.slice(0, 48);
    const search = avatarSearch.toLowerCase();
    return allCards.filter(c => c.name.toLowerCase().includes(search)).slice(0, 48);
  }, [avatarSearch]);

  const handleSelectAvatar = useCallback(async (cardId: number) => {
    const avatarStr = String(cardId);
    updateUserProfile({ avatarId: avatarStr });
    setProgress(getProgress());
    setAvatarPickerOpen(false);
    await syncProgressNowAsync();
    if (authUser) {
      try {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ avatarId: avatarStr })
        });
        const newAuth = { ...authUser, avatarId: avatarStr };
        localStorage.setItem('authUser', JSON.stringify(newAuth));
        setAuthUser(newAuth);
      } catch {}
    }
  }, [authUser]);

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 z-0">
          <img src="/images/wallpapers/wallpaper1.webp" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-amber-400 text-xl animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/images/wallpapers/wallpaper1.webp" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" />
      </div>

      <div className="relative z-10 min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative">
                <div 
                  className="w-16 h-[77px] rounded-xl overflow-hidden border-2 border-amber-600/50 cursor-pointer bg-black/50 hover:border-amber-400 hover:scale-105 transition-all group"
                  onClick={() => setAvatarPickerOpen(!avatarPickerOpen)}
                  title="Click to change avatar"
                >
                  <img 
                    src={getCardImage(avatarId)} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/cards/1.png'; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">CHANGE</span>
                  </div>
                </div>

                {/* Avatar Picker */}
                {avatarPickerOpen && (
                  <div className="absolute top-full mt-4 left-0 z-50 w-80">
                    <div className="bg-black/95 border border-amber-600/30 rounded-xl p-4 shadow-2xl">
                      <input
                        type="text"
                        placeholder="Search cards..."
                        value={avatarSearch}
                        onChange={(e) => setAvatarSearch(e.target.value)}
                        className="w-full px-4 py-2.5 mb-4 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                      <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto pr-1">
                        {filteredCards.map((card) => (
                          <button
                            key={card.id}
                            onClick={() => handleSelectAvatar(card.id)}
                            className="aspect-[5/6] rounded-lg overflow-hidden bg-white/5 hover:ring-2 ring-amber-500 transition-all hover:scale-105"
                            title={card.name}
                          >
                            <img 
                              src={getCardImage(card.id)} 
                              alt={card.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/images/cards/1.png'; }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Username */}
              <div>
                <h1 className="text-4xl font-black text-amber-400 tracking-wide uppercase drop-shadow-lg">
                  {username}
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">Player Profile</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="px-5 py-2.5 bg-gradient-to-b from-amber-500 to-amber-600 text-black font-bold text-sm rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all border border-amber-400/50 shadow-lg shadow-amber-900/20"
              >
                Back to Games
              </Link>
              {authUser ? (
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                    localStorage.removeItem('authUser');
                    window.location.reload();
                  }}
                  className="px-5 py-2.5 bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600 text-gray-200 font-bold text-sm rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="px-5 py-2.5 bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-600 text-gray-200 font-bold text-sm rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Info Banner */}
          {!authUser && (
            <div className="mb-8 p-4 bg-white/5 border border-amber-500/20 rounded-xl backdrop-blur-sm">
              <p className="text-gray-300 text-sm">
                <span className="text-amber-400 font-semibold">Note:</span> You are in local mode. <Link href="/auth" className="text-amber-400 underline hover:text-amber-300 transition-colors">Create an account</Link> to sync your progress across devices.
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Daily Streak - Featured */}
            <div className="p-5 bg-amber-600/10 border border-amber-600/30 rounded-xl">
              <div className="text-amber-500 text-xs font-semibold tracking-wider uppercase mb-2">Daily Streak</div>
              <div className="text-4xl font-bold text-amber-400">{streak}</div>
              <div className="text-gray-500 text-xs mt-1">consecutive days</div>
            </div>

            {/* Higher Lower */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all">
              <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-2">Higher Lower</div>
              <div className="text-3xl font-bold text-white">{progress?.highScores?.higherlower?.bestStreak || 0}</div>
              <div className="text-gray-500 text-xs mt-1">best streak</div>
            </div>

            {/* Royaledle */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all">
              <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-2">Royaledle</div>
              <div className="text-3xl font-bold text-white">{progress?.highScores?.royaledle?.bestWinAttempts || '—'}</div>
              <div className="text-gray-500 text-xs mt-1">best attempts</div>
            </div>

            {/* Impostor */}
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all">
              <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-2">Impostor</div>
              <div className="text-3xl font-bold text-white">{progress?.highScores?.impostor?.bestStreak || 0}</div>
              <div className="text-gray-500 text-xs mt-1">best streak</div>
            </div>
          </div>

          {/* Wordle Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all">
              <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-2">Wordle Best</div>
              <div className="text-3xl font-bold text-white">{progress?.highScores?.wordle?.bestAttempts || '—'}</div>
              <div className="text-gray-500 text-xs mt-1">attempts</div>
            </div>
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all">
              <div className="text-gray-400 text-xs font-semibold tracking-wider uppercase mb-2">Longest Word</div>
              <div className="text-3xl font-bold text-white">{progress?.highScores?.wordle?.longestWordLength || '—'}</div>
              <div className="text-gray-500 text-xs mt-1">letters</div>
            </div>
          </div>

          {/* Games Overview */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full" />
              Games Overview
            </h2>
            
            {/* Total */}
            <div className="p-5 bg-amber-600/10 border border-amber-600/30 rounded-xl mb-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-amber-500 text-xs font-semibold tracking-wider uppercase mb-1">Total Games Played</div>
                  <div className="text-5xl font-bold text-amber-400">{totalGames}</div>
                </div>
                <div className="text-gray-500 text-sm">{GAME_IDS.length} game modes</div>
              </div>
            </div>

            {/* Per Game */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {GAME_IDS.map((gameId) => (
                <div key={gameId} className="p-4 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm hover:bg-white/[0.07] hover:border-white/20 transition-all">
                  <div className="text-amber-400 text-xs font-semibold tracking-wider uppercase mb-2">{GAME_LABELS[gameId]}</div>
                  <div className="text-2xl font-bold text-white">{progress?.stats?.gamesPlayedById?.[gameId] || 0}</div>
                  <div className="text-gray-500 text-xs mt-1">games played</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Calendar */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full" />
              Activity Calendar
            </h2>
            
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
                      day.played 
                        ? 'bg-amber-600/80 text-black' 
                        : 'bg-white/5 text-gray-600 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[9px] opacity-70">{day.month}</span>
                    <span className="font-semibold">{day.day}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-4 text-center">Last 28 days — Highlighted days indicate activity</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-center gap-4">
            <Link
              href="/leaderboard"
              className="px-8 py-3 bg-gradient-to-b from-amber-500 to-amber-600 text-black font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all border border-amber-400/50 shadow-lg shadow-amber-900/20"
            >
              View Leaderboards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
