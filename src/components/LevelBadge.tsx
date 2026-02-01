"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';

interface XpSummary {
  level: number;
  xpTotal: number;
  toNext: number;
  progress: number;
}

export default function LevelBadge() {
  const { user } = useAuth();
  const [xp, setXp] = useState<XpSummary | null>(null);

  useEffect(() => {
    if (!user) {
      setXp(null);
      return;
    }
    
    const fetchXp = async () => {
      try {
        const res = await fetch('/api/xp', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.ok) setXp(data.data);
        }
      } catch {}
    };
    
    fetchXp();
    
    // Listen for XP updates
    const handler = () => fetchXp();
    window.addEventListener('xp:updated', handler);
    return () => window.removeEventListener('xp:updated', handler);
  }, [user]);

  if (!user || !xp) return null;

  const progressPercent = Math.round(xp.progress * 100);

  return (
    <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-sm">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-black text-xs font-bold shadow-inner">
        {xp.level}
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-[10px] font-bold text-amber-200/90 uppercase tracking-wider">Level</span>
        <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-amber-300/80">{progressPercent}%</span>
      </div>
    </div>
  );
}
