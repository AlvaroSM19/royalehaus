'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import cards from '@/data/cards.json';
import { Home, Calendar, Sparkles, Save, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface DailyChallenge {
  id: number;
  date: string;
  gameType: string;
  cardId: number;
}

const GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'] as const;
const GAME_LABELS: Record<string, string> = {
  'royaledle': 'Royaledle',
  'emoji-riddle': 'Emoji Riddle',
  'sound-quiz': 'Sound Quiz',
};

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function DailyAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // Edit state
  const [editingCell, setEditingCell] = useState<{ date: string; gameType: string } | null>(null);
  const [editCardId, setEditCardId] = useState<number>(1);
  const [cardSearch, setCardSearch] = useState('');

  const fetchChallenges = useCallback(async () => {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 10);

      const start = startDate.toISOString().slice(0, 10);
      const end = endDate.toISOString().slice(0, 10);

      const res = await fetch(`/api/daily/admin?start=${start}&end=${end}`, { credentials: 'include' });

      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showMessage(`Error: ${errorData.error || res.statusText}`, 'error');
      }
    } catch (error) {
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

  // Generate the 21 dates (10 past + today + 10 future)
  const getDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = -10; i <= 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
  };

  // Group challenges by key
  const challengeMap = new Map<string, DailyChallenge>();
  challenges.forEach(c => {
    challengeMap.set(`${c.date}|${c.gameType}`, c);
  });

  const getChallenge = (date: string, gameType: string) => challengeMap.get(`${date}|${gameType}`);

  const getCardName = (cardId: number): string => {
    const card = cards.find((c: { id: number; name: string }) => c.id === cardId);
    return card?.name || `Card #${cardId}`;
  };

  const today = getTodayDate();
  const dates = getDates();

  const handleSave = async (date: string, gameType: string, cardId: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/daily/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, gameType, cardId }),
      });

      if (res.ok) {
        showMessage(`${GAME_LABELS[gameType]} for ${formatDate(date)} saved!`, 'success');
        setEditingCell(null);
        fetchChallenges();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage(`Error: ${data.error || 'Failed to save'}`, 'error');
      }
    } catch {
      showMessage('Error saving challenge', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = async () => {
    if (!confirm('Auto-generate random challenges for empty future slots (next 30 days)?')) return;

    setSaving(true);
    try {
      const newChallenges: { date: string; gameType: string; cardId: number }[] = [];
      const todayDate = new Date();

      for (let i = 0; i <= 30; i++) {
        const date = new Date(todayDate);
        date.setDate(todayDate.getDate() + i);
        const dateStr = date.toISOString().slice(0, 10);

        for (const gameType of GAME_TYPES) {
          if (!challengeMap.has(`${dateStr}|${gameType}`)) {
            const cardId = Math.floor(Math.random() * 168) + 1;
            newChallenges.push({ date: dateStr, gameType, cardId });
          }
        }
      }

      if (newChallenges.length === 0) {
        showMessage('All slots already filled!', 'success');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/daily/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challenges: newChallenges }),
      });

      if (res.ok) {
        const data = await res.json();
        showMessage(`Created ${data.created} new challenges!`, 'success');
        fetchChallenges();
      } else {
        showMessage('Error auto-filling', 'error');
      }
    } catch {
      showMessage('Error auto-filling', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredCardsForEdit = cardSearch.length >= 1
    ? cards.filter((c: { id: number; name: string }) =>
        c.name.toLowerCase().includes(cardSearch.toLowerCase())
      ).slice(0, 15)
    : cards.slice(0, 15);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="animate-spin w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-black/30 pointer-events-none z-0" />

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
                <h1 className="text-base sm:text-lg font-black text-amber-400 tracking-wider">
                  DAILY CHALLENGES
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchChallenges}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-slate-200 font-bold rounded-lg hover:bg-slate-600 text-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleAutoFill}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-900 font-bold rounded-lg hover:from-cyan-400 hover:to-cyan-500 shadow-lg shadow-cyan-500/20 text-xs transition-all disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{saving ? 'Processing...' : 'Auto-fill 30d'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-6 flex-1 max-w-6xl">
          {/* Message Toast */}
          {message && (
            <div
              className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                messageType === 'error'
                  ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                  : 'bg-green-500/10 text-green-300 border border-green-500/30'
              }`}
            >
              {messageType === 'success' ? '✓' : '✕'} {message}
            </div>
          )}

          {/* Calendar Table */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(25, 40, 65, 0.95) 0%, rgba(15, 28, 50, 0.98) 100%)',
              border: '2px solid rgba(60, 90, 140, 0.4)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/30 bg-slate-900/70">
                    <th className="px-3 py-3 text-left text-slate-400 text-[10px] uppercase tracking-wider font-bold w-[140px] sticky left-0 bg-slate-900/95 z-10">
                      Date
                    </th>
                    {GAME_TYPES.map(g => (
                      <th key={g} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider font-bold text-cyan-400 min-w-[180px]">
                        {GAME_LABELS[g]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dates.map((date) => {
                    const isToday = date === today;
                    const isPast = date < today;

                    return (
                      <tr
                        key={date}
                        className={`border-b border-slate-700/20 transition-colors ${
                          isToday
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : isPast
                            ? 'bg-slate-900/40 opacity-60'
                            : 'hover:bg-cyan-400/5'
                        }`}
                      >
                        <td className={`px-3 py-2.5 text-sm font-medium sticky left-0 z-10 ${
                          isToday
                            ? 'text-amber-400 font-bold bg-amber-500/10'
                            : isPast
                            ? 'text-slate-500 bg-slate-900/80'
                            : 'text-white bg-slate-900/80'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            {isToday && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">HOY</span>}
                            <span className="whitespace-nowrap">{formatDate(date)}</span>
                          </div>
                        </td>
                        {GAME_TYPES.map(g => {
                          const challenge = getChallenge(date, g);
                          const isEditing = editingCell?.date === date && editingCell?.gameType === g;
                          const canEdit = !isPast;

                          if (isEditing) {
                            return (
                              <td key={g} className="px-2 py-1.5">
                                <div className="flex flex-col gap-1.5 min-w-[200px]">
                                  <input
                                    type="text"
                                    placeholder="Search card..."
                                    value={cardSearch}
                                    onChange={(e) => setCardSearch(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-slate-800 border border-cyan-500/40 rounded text-white text-xs focus:outline-none focus:border-cyan-400"
                                    autoFocus
                                  />
                                  <div className="max-h-[200px] overflow-y-auto bg-slate-800 rounded border border-slate-700/50">
                                    {filteredCardsForEdit.map((card: { id: number; name: string }) => (
                                      <button
                                        key={card.id}
                                        onClick={() => setEditCardId(card.id)}
                                        className={`w-full flex items-center gap-2 px-2 py-1 hover:bg-cyan-500/10 transition-colors text-left ${
                                          editCardId === card.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300'
                                        }`}
                                      >
                                        <img
                                          src={`/images/cards/${card.id}.webp`}
                                          alt=""
                                          className="w-5 h-5 rounded object-contain bg-slate-700/50"
                                        />
                                        <span className="text-[11px] truncate">{card.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleSave(date, g, editCardId)}
                                      disabled={saving}
                                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 text-white text-[10px] font-bold rounded hover:bg-green-500 disabled:opacity-50"
                                    >
                                      <Save className="w-3 h-3" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => { setEditingCell(null); setCardSearch(''); }}
                                      className="px-2 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={g} className="px-3 py-2.5">
                              {challenge ? (
                                <button
                                  onClick={() => {
                                    if (!canEdit) return;
                                    setEditingCell({ date, gameType: g });
                                    setEditCardId(challenge.cardId);
                                    setCardSearch('');
                                  }}
                                  disabled={!canEdit}
                                  className={`flex items-center gap-2 transition-colors ${
                                    canEdit
                                      ? 'text-slate-300 hover:text-amber-400 cursor-pointer'
                                      : 'text-slate-500 cursor-default'
                                  }`}
                                >
                                  <img
                                    src={`/images/cards/${challenge.cardId}.webp`}
                                    alt=""
                                    className="w-7 h-8 rounded object-contain bg-slate-800/50"
                                  />
                                  <span className="text-xs hidden sm:inline">{getCardName(challenge.cardId)}</span>
                                </button>
                              ) : canEdit ? (
                                <button
                                  onClick={() => {
                                    setEditingCell({ date, gameType: g });
                                    setEditCardId(1);
                                    setCardSearch('');
                                  }}
                                  className="text-slate-600 text-xs hover:text-cyan-400 transition-colors border border-dashed border-slate-700 rounded px-2 py-1 hover:border-cyan-500/50"
                                >
                                  + Add
                                </button>
                              ) : (
                                <span className="text-slate-700 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
              Hoy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900/60 border border-slate-700/40 opacity-70" />
              Pasado (solo lectura)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900/40 border border-slate-700/40" />
              Futuro (editable)
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
