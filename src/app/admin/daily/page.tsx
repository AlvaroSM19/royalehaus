'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import cards from '@/data/cards.json';

interface DailyChallenge {
  id: number;
  date: string;
  gameType: string;
  cardId: number;
}

const GAME_TYPES = ['royaledle', 'emoji-riddle', 'pixel-royale'] as const;
const GAME_COLORS: Record<string, string> = {
  'royaledle': '#f59e0b',
  'emoji-riddle': '#ec4899',
  'pixel-royale': '#8b5cf6',
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

  const fetchChallenges = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 35);
      const end = endDate.toISOString().slice(0, 10);
      
      const res = await fetch(`/api/daily/admin?start=${today}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setChallenges(data.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
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

  const handleSaveChallenge = async () => {
    if (!selectedDate) {
      setMessage('Please select a date');
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
        setMessage('Challenge saved successfully!');
        fetchChallenges();
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error saving challenge');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
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
          // Check if challenge already exists
          const exists = challenges.find(c => c.date === dateStr && c.gameType === gameType);
          if (!exists) {
            // Pick a random card (1-168)
            const cardId = Math.floor(Math.random() * 168) + 1;
            newChallenges.push({ date: dateStr, gameType, cardId });
          }
        }
      }
      
      if (newChallenges.length === 0) {
        setMessage('All challenges already exist for the next 30 days!');
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
        setMessage(`Created ${data.created} new challenges!`);
        fetchChallenges();
      } else {
        setMessage('Error auto-filling challenges');
      }
    } catch (error) {
      setMessage('Error auto-filling challenges');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-amber-400/60 hover:text-amber-400 text-sm mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 
              className="text-2xl sm:text-3xl font-black uppercase tracking-wider"
              style={{
                background: 'linear-gradient(180deg, #ffe6a0 0%, #d4a843 40%, #a07830 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Daily Challenges Admin
            </h1>
          </div>
          <button
            onClick={handleAutoFill}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-sm rounded-lg hover:from-green-500 hover:to-green-600 transition-all disabled:opacity-50"
          >
            {saving ? 'Processing...' : 'Auto-fill 30 Days'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
            message.includes('Error') ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'
          }`}>
            {message}
          </div>
        )}

        {/* Add/Edit Challenge Form */}
        <div 
          className="mb-8 p-6 rounded-xl"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 25, 18, 0.9) 0%, rgba(20, 18, 12, 0.95) 100%)',
            border: '1px solid rgba(180, 140, 60, 0.3)',
          }}
        >
          <h2 className="text-amber-400 font-bold mb-4 uppercase tracking-wider text-sm">Add / Edit Challenge</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-amber-100/60 text-xs mb-2 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="w-full px-3 py-2 bg-black/40 border border-amber-500/30 rounded-lg text-amber-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-amber-100/60 text-xs mb-2 uppercase tracking-wider">Game</label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-amber-500/30 rounded-lg text-amber-100 text-sm"
              >
                {GAME_TYPES.map(g => (
                  <option key={g} value={g}>{g.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-amber-100/60 text-xs mb-2 uppercase tracking-wider">Card</label>
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(Number(e.target.value))}
                className="w-full px-3 py-2 bg-black/40 border border-amber-500/30 rounded-lg text-amber-100 text-sm"
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
                className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-sm rounded-lg hover:from-amber-500 hover:to-amber-600 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Challenges Table */}
        <div 
          className="rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 25, 18, 0.9) 0%, rgba(20, 18, 12, 0.95) 100%)',
            border: '1px solid rgba(180, 140, 60, 0.3)',
          }}
        >
          <div className="p-4 border-b border-amber-500/20">
            <h2 className="text-amber-400 font-bold uppercase tracking-wider text-sm">Upcoming Challenges</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-amber-500/10">
                  <th className="px-4 py-3 text-left text-amber-100/60 text-xs uppercase tracking-wider">Date</th>
                  {GAME_TYPES.map(g => (
                    <th key={g} className="px-4 py-3 text-left text-xs uppercase tracking-wider" style={{ color: GAME_COLORS[g] }}>
                      {g.replace('-', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(challengesByDate).sort().map(date => (
                  <tr key={date} className="border-b border-amber-500/5 hover:bg-amber-500/5">
                    <td className="px-4 py-3 text-amber-100 text-sm font-medium">
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
                              }}
                              className="text-amber-100/80 text-sm hover:text-amber-400 transition-colors"
                            >
                              {getCardName(challenge.cardId)}
                            </button>
                          ) : (
                            <span className="text-amber-100/20 text-sm">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {Object.keys(challengesByDate).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-amber-100/40 text-sm">
                      No challenges configured. Click "Auto-fill 30 Days" to generate default challenges.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
