'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { ArrowLeft, RefreshCw, Trash2, CheckCircle, Eye, Filter, MessageSquare } from 'lucide-react';

interface Feedback {
  id: string;
  content: string;
  email: string | null;
  username: string | null;
  category: string;
  status: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'pending' | 'read' | 'resolved';
type CategoryFilter = 'all' | 'suggestion' | 'bug' | 'complaint' | 'other';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  read: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const CATEGORY_COLORS: Record<string, string> = {
  suggestion: 'bg-emerald-500/20 text-emerald-400',
  bug: 'bg-red-500/20 text-red-400',
  complaint: 'bg-orange-500/20 text-orange-400',
  other: 'bg-gray-500/20 text-gray-400',
};

export default function FeedbackAdminPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', { credentials: 'include' });
      const data = await res.json();
      if (data.ok) {
        setFeedbacks(data.data.feedbacks || []);
      }
    } catch (e) {
      console.error('Failed to fetch feedbacks:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f));
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      const res = await fetch('/api/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      }
    } catch (e) {
      console.error('Failed to delete feedback:', e);
    }
  };

  const filtered = feedbacks.filter(f => {
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    return true;
  });

  // Check if admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a1520] flex items-center justify-center">
        <div className="text-red-400 text-lg">Access denied. Admin only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1520]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/logbook" 
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Feedback Admin
              </h1>
              <p className="text-gray-500 text-sm">{filtered.length} feedback encontrados</p>
            </div>
          </div>
          <button
            onClick={fetchFeedbacks}
            className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 text-gray-400">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="read">Read</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-gray-200 text-sm focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All</option>
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug</option>
              <option value="complaint">Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No feedback found</div>
          ) : (
            filtered.map((fb) => (
              <div 
                key={fb.id}
                className="p-5 bg-white/[0.03] border border-white/10 rounded-xl hover:bg-white/[0.05] transition"
              >
                {/* Top row: badges + date + actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase border ${STATUS_COLORS[fb.status] || STATUS_COLORS.pending}`}>
                      {fb.status === 'pending' ? '⏳ Pending' : fb.status === 'read' ? '👁 Read' : '✓ Resolved'}
                    </span>
                    
                    {/* Category badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${CATEGORY_COLORS[fb.category] || CATEGORY_COLORS.other}`}>
                      {fb.category === 'bug' ? '🐛' : fb.category === 'suggestion' ? '💡' : fb.category === 'complaint' ? '😤' : '📝'} {fb.category}
                    </span>

                    {/* Date */}
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                      📅 {new Date(fb.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(fb.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Username */}
                    {fb.username && (
                      <span className="text-amber-400 text-xs font-semibold">@{fb.username}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {fb.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(fb.id, 'read')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition flex items-center gap-1"
                        title="Mark as Read"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Read
                      </button>
                    )}
                    {fb.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(fb.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition flex items-center gap-1"
                        title="Mark as Resolved"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => deleteFeedback(fb.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                  {fb.content}
                </p>

                {/* Email if provided */}
                {fb.email && (
                  <p className="text-gray-500 text-xs mt-3 flex items-center gap-1">
                    📧 <a href={`mailto:${fb.email}`} className="text-amber-400/70 hover:text-amber-400 underline">{fb.email}</a>
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
