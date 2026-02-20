'use client';

import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';

export default function VisitCounter() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const hasVisited = sessionStorage.getItem('visited');
    const fetchCount = () => {
      fetch('/api/stats/visits')
        .then(res => res.json())
        .then(data => { setCount(data.count); setIsAdmin(data.isAdmin); })
        .catch(() => {});
    };
    if (!hasVisited) {
      fetch('/api/stats/visits', { method: 'POST' })
        .then(() => { sessionStorage.setItem('visited', 'true'); fetchCount(); })
        .catch(() => fetchCount());
    } else {
      fetchCount();
    }
  }, [mounted]);

  if (!mounted || !isAdmin || count === null) return null;

  return (
    <div className="flex items-center gap-2" title="Site visits (visible to admins only)">
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 text-xs">
        <Eye className="w-3.5 h-3.5 text-indigo-400" />
        <span className="font-bold text-indigo-200">{count.toLocaleString()}</span>
        <span className="text-[9px] text-emerald-400/90 font-semibold">(real)</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-green-400">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="hidden sm:inline text-green-300/70">LIVE</span>
      </div>
    </div>
  );
}
