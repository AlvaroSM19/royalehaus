'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getProgress, updateUserProfile, syncProgressNowAsync, type UserProgress } from '@/lib/progress';
import { MessageSquare, Calendar, Trophy, Gamepad2, Star, X } from 'lucide-react';
import cards from '@/data/cards.json';

const allCards = cards as { id: number; name: string; rarity: string }[];
const GAME_IDS = ['royaledle', 'higherlower', 'impostor', 'wordle', 'tapone', 'pixel-royale', 'emoji-riddle', 'sound-quiz'] as const;
const GAME_LABELS: Record<string, string> = {
  royaledle: 'Royaledle',
  higherlower: 'Higher Lower', 
  impostor: 'Impostor',
  wordle: 'Wordle',
  tapone: 'Tap One',
  'pixel-royale': 'Pixel Royale',
  'emoji-riddle': 'Emoji Riddle',
  'sound-quiz': 'Sound Quiz'
};

const DAYS_TO_SHOW = 56; // 8 weeks

// Card frame design variants (inspired by AnimeHaus)
const FRAME_VARIANTS = {
  gold: {
    label: 'GOLD',
    frame: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600',
    inner: 'bg-[#0b0b0d]/95',
    glow: 'shadow-amber-500/30',
  },
  silver: {
    label: 'SILVER',
    frame: 'bg-gradient-to-br from-zinc-200 via-slate-100 to-zinc-400',
    inner: 'bg-[#0d1013]/95',
    glow: 'shadow-zinc-400/30',
  },
  rainbow: {
    label: 'RAINBOW',
    frame: 'bg-gradient-to-br from-pink-400 via-cyan-400 to-violet-500',
    inner: 'bg-[#05060b]/95',
    glow: 'shadow-pink-500/30',
  },
  cosmic: {
    label: 'COSMIC',
    frame: 'bg-gradient-to-br from-indigo-500 via-fuchsia-600 to-cyan-500',
    inner: 'bg-gradient-to-b from-[#0a0d21] via-[#120a24] to-[#02060f]',
    glow: 'shadow-indigo-500/30',
  },
  oceanic: {
    label: 'OCEANIC',
    frame: 'bg-gradient-to-br from-teal-300 via-emerald-400 to-cyan-500',
    inner: 'bg-gradient-to-b from-[#021d23] via-[#022f38] to-[#031316]',
    glow: 'shadow-teal-500/30',
  },
  ember: {
    label: 'EMBER',
    frame: 'bg-gradient-to-br from-orange-500 via-amber-600 to-red-600',
    inner: 'bg-gradient-to-b from-[#1a0b02] via-[#2b0f04] to-[#100401]',
    glow: 'shadow-orange-500/30',
  },
  neon: {
    label: 'NEON',
    frame: 'bg-gradient-to-br from-fuchsia-500 via-violet-600 to-blue-600',
    inner: 'bg-[#05060a]/95',
    glow: 'shadow-fuchsia-500/30',
  },
  prism: {
    label: 'PRISM',
    frame: 'bg-gradient-to-br from-amber-300 via-white to-amber-400',
    inner: 'bg-gradient-to-b from-[#0c0c0e] via-[#141418] to-[#050506]',
    glow: 'shadow-white/30',
  },
};

// RoyaleHaus uses numeric card IDs (1-171). If avatarId is not numeric, it's from OnePieceHaus - use default
function getCardImage(cardId: number | string): string {
  const numId = typeof cardId === 'number' ? cardId : parseInt(cardId, 10);
  if (isNaN(numId) || numId < 1 || numId > 171) {
    return '/images/cards/1.webp'; // Default avatar for non-RoyaleHaus IDs
  }
  return `/images/cards/${numId}.webp`;
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

function generateCalendar(calendar: string[]): { day: number; month: string; played: boolean; date: string }[] {
  const set = new Set(calendar);
  const result: { day: number; month: string; played: boolean; date: string }[] = [];
  for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    result.push({ day: d.getDate(), month, played: set.has(key), date: key });
  }
  return result;
}

export default function LogbookPage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [authUser, setAuthUser] = useState<any>(null);
  const [selectedFrame, setSelectedFrame] = useState<keyof typeof FRAME_VARIANTS>('gold');

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
              <div className="relative group">
                <div 
                  className={`w-20 h-[96px] rounded-xl overflow-hidden p-[2px] cursor-pointer hover:scale-105 transition-all shadow-lg ${FRAME_VARIANTS[selectedFrame].frame} ${FRAME_VARIANTS[selectedFrame].glow}`}
                  onClick={() => setAvatarPickerOpen(true)}
                  title="Click to change avatar"
                >
                  <div className={`w-full h-full rounded-[10px] overflow-hidden ${FRAME_VARIANTS[selectedFrame].inner}`}>
                    <img 
                      src={getCardImage(avatarId)} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/cards/1.webp'; }}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setAvatarPickerOpen(true)} 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-amber-500 text-black text-[10px] font-bold shadow"
                >
                  EDIT
                </button>
              </div>

              {/* Username */}
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-amber-400 tracking-wide uppercase drop-shadow-lg">
                  {username}
                </h1>
                <p className="text-gray-500 text-sm mt-1 font-medium flex items-center gap-2">
                  <Trophy className="w-3 h-3" /> Player Profile
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {authUser?.role === 'admin' && (
                <Link
                  href="/admin/feedback"
                  className="px-5 py-2.5 bg-gradient-to-b from-pink-500 to-rose-600 text-white font-bold text-sm rounded-lg hover:from-pink-400 hover:to-rose-500 transition-all border border-pink-400/50 shadow-lg shadow-pink-900/20 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </Link>
              )}
              <Link
                href="/"
                className="px-5 py-2.5 bg-gradient-to-b from-amber-500 to-amber-600 text-black font-bold text-sm rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all border border-amber-400/50 shadow-lg shadow-amber-900/20 flex items-center gap-2"
              >
                <Gamepad2 className="w-4 h-4" /> Games
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
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5">
                {calendarDays.map((day, i) => (
                  <div
                    key={i}
                    title={day.date}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
                      day.played 
                        ? 'bg-amber-600/80 text-black' 
                        : 'bg-white/5 text-gray-600 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[7px] sm:text-[8px] opacity-70">{day.month}</span>
                    <span className="font-semibold text-[10px] sm:text-xs">{day.day}</span>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-4 text-center">Last {DAYS_TO_SHOW} days — Highlighted days indicate activity</p>
            </div>
          </div>

          {/* Frame Variants Showcase */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <span className="w-1 h-6 bg-gradient-to-b from-amber-500 to-yellow-600 rounded-full" />
              Avatar Frame Style
            </h2>
            
            <div className="p-5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-gray-400 text-sm mb-4">Choose a frame style for your avatar card:</p>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                {(Object.keys(FRAME_VARIANTS) as Array<keyof typeof FRAME_VARIANTS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFrame(key)}
                    className={`relative aspect-[3/4] rounded-lg p-[2px] transition-all hover:scale-105 ${FRAME_VARIANTS[key].frame} ${
                      selectedFrame === key ? 'ring-2 ring-white scale-105' : ''
                    }`}
                  >
                    <div className={`w-full h-full rounded-[6px] ${FRAME_VARIANTS[key].inner} flex items-center justify-center`}>
                      <span className="text-[8px] font-bold text-white/70">{FRAME_VARIANTS[key].label}</span>
                    </div>
                    {selectedFrame === key && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-center gap-4">
            <Link
              href="/leaderboard"
              className="px-8 py-3 bg-gradient-to-b from-amber-500 to-amber-600 text-black font-bold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all border border-amber-400/50 shadow-lg shadow-amber-900/20 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" /> View Leaderboards
            </Link>
            <Link
              href="/cards/flashcards"
              className="px-8 py-3 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-bold rounded-lg hover:from-indigo-400 hover:to-indigo-500 transition-all border border-indigo-400/50 shadow-lg shadow-indigo-900/20"
            >
              Study Flashcards
            </Link>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {avatarPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900/95 border border-amber-700/40 rounded-2xl p-6 w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-amber-200 tracking-wide">Select Avatar</h3>
              <button 
                onClick={() => setAvatarPickerOpen(false)} 
                className="p-2 rounded-lg bg-slate-700 text-amber-200 hover:bg-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              autoFocus
              value={avatarSearch}
              onChange={(e) => setAvatarSearch(e.target.value)}
              placeholder="Search cards..."
              className="mb-4 w-full px-4 py-3 rounded-lg bg-slate-800 border border-amber-600/40 text-amber-100 text-sm outline-none focus:border-amber-500 transition-colors"
            />
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 overflow-y-auto pr-1 flex-1">
              {filteredCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectAvatar(card.id)}
                  className={`relative aspect-[5/6] rounded-lg overflow-hidden p-[2px] transition-all hover:scale-105 hover:ring-2 ring-amber-500 ${FRAME_VARIANTS[selectedFrame].frame}`}
                  title={card.name}
                >
                  <div className={`w-full h-full rounded-[6px] overflow-hidden ${FRAME_VARIANTS[selectedFrame].inner}`}>
                    <img 
                      src={getCardImage(card.id)} 
                      alt={card.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/images/cards/1.webp'; }}
                    />
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 text-center">
                Click on a card to select it as your avatar. Use the frame picker above to change the style.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
