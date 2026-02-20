'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import cards from '@/data/cards.json';
import { Home, Calendar, Sparkles, Save, RefreshCw } from 'lucide-react';

interface DailyChallenge {
  id: number;
  date: string;
  gameType: string;
  cardId: number;
}

const GAME_TYPES = ['royaledle', 'emoji-riddle', 'pixel-royale'] as const;
const GAME_LABELS: Record<string, string> = {
  'royaledle': 'Royaledle',
  'emoji-riddle': 'Emoji Riddle',
  'pixel-royale': 'Pixel Royale',
};

export default function DailyAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('royaledle');
  const [selectedCard, setSelectedCard] = useState<number>(1);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const fetchChallenges = useCallback(async () => {
    try {
      // Últimos 10 días + hoy + próximos 10 días = 21 días total
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 10);
      
      const start = startDate.toISOString().slice(0, 10);
      const end = endDate.toISOString().slice(0, 10);
      
      const res = await fetch(`/api/daily/admin?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      } else {
        console.error('Failed to fetch challenges:', res.status, res.statusText);
        showMessage('Error loading challenges', 'error');
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      showMessage('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchChallenges();
    }
  }, [user, authLoading, router, fetchChallenges]);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSaveChallenge = async () => {
    if (!selectedDate) {
      showMessage('Please select a date', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/daily/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          gameType: selectedGame,
          cardId: selectedCard,
        }),
      });
      
      if (res.ok) {
        showMessage('Challenge saved successfully!', 'success');
        fetchChallenges();
      } else {
        const data = await res.json();
        showMessage(`Error: ${data.error}`, 'error');
      }
    } catch {
      showMessage('Error saving challenge', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = async () => {
    if (!confirm('This will auto-generate 30 days of challenges. Existing challenges will not be overwritten. Continue?')) {
      return;
    }
    
    setSaving(true);
    try {
      const newChallenges: { date: string; gameType: string; cardId: number }[] = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().slice(0, 10);
        
        for (const gameType of GAME_TYPES) {
          const exists = challenges.find(c => c.date === dateStr && c.gameType === gameType);
          if (!exists) {
            const cardId = Math.floor(Math.random() * 168) + 1;
            newChallenges.push({ date: dateStr, gameType, cardId });
          }
        }
      }
      
      if (newChallenges.length === 0) {
        showMessage('All challenges already exist for the next 30 days!', 'success');
        setSaving(false);
        return;
      }
      
      const res = await fetch('/api/daily/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenges: newChallenges }),
      });
      
      if (res.ok) {
        const data = await res.json();
        showMessage(`Created ${data.created} new challenges!`, 'success');
        fetchChallenges();
      } else {
        showMessage('Error auto-filling challenges', 'error');
      }
    } catch {
      showMessage('Error auto-filling challenges', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Group challenges by date
  const challengesByDate: Record<string, Record<string, DailyChallenge>> = {};
  challenges.forEach(c => {
    if (!challengesByDate[c.date]) challengesByDate[c.date] = {};
    challengesByDate[c.date][c.gameType] = c;
  });

  const getCardName = (cardId: number) => {
    const card = cards.find((c: { id: number; name: string }) => c.id === cardId);
    return card?.name || `Card #${cardId}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-slate-900/95 border-b border-amber-900/30 sticky top-0 z-20">
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-xs">
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home</span>
              </Link>
              <span className="text-slate-600">/</span>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h1 className="text-base sm:text-lg md:text-xl font-black text-amber-400 tracking-wider">
                  DAILY CHALLENGES
                </h1>
              </div>
            </div>

            <button
              onClick={handleAutoFill}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-bold rounded-lg hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/20 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{saving ? 'Processing...' : 'Auto-fill 30 Days'}</span>
            </button>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 flex-1 max-w-5xl">
          {/* Message Toast */}
          {message && (
            <div 
              className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                messageType === 'error' 
                  ? 'bg-red-500/10 text-red-300 border border-red-500/30' 
                  : 'bg-green-500/10 text-green-300 border border-green-500/30'
              }`}
              style={{
                boxShadow: messageType === 'error' 
                  ? '0 0 20px rgba(239, 68, 68, 0.15)' 
                  : '0 0 20px rgba(34, 197, 94, 0.15)'
              }}
            >
              {messageType === 'success' ? '✓' : '✕'} {message}
            </div>
          )}

          {/* Add/Edit Challenge Form */}
          <div 
            className="relative mb-8 p-5 sm:p-6 rounded-xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
              border: '2px solid rgba(60, 90, 140, 0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400/40 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400/40 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400/40 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/40 rounded-br-xl" />

            <h2 className="text-cyan-400 font-bold mb-5 uppercase tracking-wider text-xs flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Add / Edit Challenge
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] mb-2 uppercase tracking-wider font-bold">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-lg text-white text-sm focus:border-cyan-400/60 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-2 uppercase tracking-wider font-bold">Game</label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-lg text-white text-sm focus:border-cyan-400/60 focus:outline-none transition-colors"
                >
                  {GAME_TYPES.map(g => (
                    <option key={g} value={g}>{GAME_LABELS[g]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] mb-2 uppercase tracking-wider font-bold">Card</label>
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-900/80 border border-slate-700/60 rounded-lg text-white text-sm focus:border-cyan-400/60 focus:outline-none transition-colors"
                >
                  {cards.map((card: { id: number; name: string }) => (
                    <option key={card.id} value={card.id}>{card.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveChallenge}
                  disabled={saving || !selectedDate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 font-bold text-sm rounded-lg hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* Challenges Table */}
          <div 
            className="relative rounded-xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
              border: '2px solid rgba(60, 90, 140, 0.4)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
            }}
          >
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-amber-400/40 rounded-tl-xl pointer-events-none z-10" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-amber-400/40 rounded-tr-xl pointer-events-none z-10" />

            <div className="p-4 border-b border-slate-700/40 flex items-center justify-between">
              <h2 className="text-amber-400 font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Challenges
              </h2>
              <span className="text-slate-500 text-[10px] uppercase tracking-wider">
                {Object.keys(challengesByDate).length} days configured
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/30 bg-slate-900/50">
                    <th className="px-4 py-3 text-left text-slate-400 text-[10px] uppercase tracking-wider font-bold">Date</th>
                    {GAME_TYPES.map(g => (
                      <th key={g} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-cyan-400">
                        {GAME_LABELS[g]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(challengesByDate).sort().map((date, idx) => (
                    <tr 
                      key={date} 
                      className={`border-b border-slate-700/20 hover:bg-cyan-400/5 transition-colors ${
                        idx % 2 === 0 ? 'bg-slate-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-white text-sm font-medium">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </td>
                      {GAME_TYPES.map(g => {
                        const challenge = challengesByDate[date]?.[g];
                        return (
                          <td key={g} className="px-4 py-3">
                            {challenge ? (
                              <button
                                onClick={() => {
                                  setSelectedDate(date);
                                  setSelectedGame(g);
                                  setSelectedCard(challenge.cardId);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="text-slate-300 text-sm hover:text-amber-400 transition-colors flex items-center gap-1.5"
                              >
                                <img 
                                  src={`/images/cards/${challenge.cardId}.webp`}
                                  alt=""
                                  className="w-6 h-6 rounded object-contain bg-slate-800/50"
                                />
                                <span className="hidden sm:inline">{getCardName(challenge.cardId)}</span>
                              </button>
                            ) : (
                              <span className="text-slate-600 text-sm">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {Object.keys(challengesByDate).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center">
                        <div className="text-slate-500 text-sm mb-2">No challenges configured</div>
                        <div className="text-slate-600 text-xs">Click &quot;Auto-fill 30 Days&quot; to generate default challenges</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Decorative bottom corners */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-amber-400/40 rounded-bl-xl pointer-events-none z-10" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-amber-400/40 rounded-br-xl pointer-events-none z-10" />
          </div>
        </main>
      </div>
    </div>
  );
}
