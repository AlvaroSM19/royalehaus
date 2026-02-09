'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { Eye, Users } from 'lucide-react';

interface SiteStats {
  visits: number;
  displayVisits: number;
  updatedAt?: string;
}

export default function VisitCounter() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const registerAndFetchVisits = async () => {
      try {
        // Register this visit (POST will set cookie to prevent double counting)
        const postRes = await fetch('/api/site-stats', {
          method: 'POST',
          credentials: 'include',
        });
        if (postRes.ok) {
          const data = await postRes.json();
          setStats({
            visits: data.visits,
            displayVisits: data.displayVisits,
          });
          setRegistered(true);
        }
      } catch (error) {
        console.error('Failed to register visit:', error);
        // Try to at least get current stats
        try {
          const getRes = await fetch('/api/site-stats');
          if (getRes.ok) {
            const data = await getRes.json();
            setStats(data);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    registerAndFetchVisits();
  }, []);

  // Only show to admins
  if (authLoading || !isAdmin) {
    return null;
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
        <Eye className="w-3 h-3" />
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  // Format number with commas
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="flex items-center gap-2" title="Site visits (visible to admins only)">
      {/* Real visits counter */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 text-xs">
        <Eye className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-bold text-indigo-200">{formatNumber(stats.visits)}</span>
        <span className="text-indigo-400/70 hidden sm:inline">visits</span>
      </div>
      
      {/* Live indicator */}
      <div className="flex items-center gap-1 text-xs text-green-400">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="hidden sm:inline text-green-300/70">LIVE</span>
      </div>
    </div>
  );
}
