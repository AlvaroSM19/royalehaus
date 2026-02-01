"use client";
import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

type FeedbackCategory = 'suggestion' | 'bug' | 'complaint' | 'other';

export default function FeedbackModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter your feedback');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          email: email.trim() || undefined,
          category,
          username: user?.username
        })
      });
      
      if (res.ok) {
        setSuccess(true);
        setContent('');
        setEmail('');
        setCategory('suggestion');
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send feedback');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide bg-gradient-to-r from-pink-500 to-rose-500 text-white border border-pink-400/60 shadow hover:brightness-110 transition"
      >
        <MessageSquarePlus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">SEND FEEDBACK</span>
      </button>

      {/* Modal Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-700/40 rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-700/30">
              <h2 className="text-lg font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                Send Feedback
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-amber-500/10 transition"
              >
                <X className="w-5 h-5 text-amber-300/70" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {success ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🎉</div>
                  <p className="text-lg font-bold text-emerald-400">Thank you!</p>
                  <p className="text-sm text-amber-200/70">Your feedback has been sent.</p>
                </div>
              ) : (
                <>
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-2 uppercase tracking-wide">
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['suggestion', 'bug', 'complaint', 'other'] as FeedbackCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                            category === cat
                              ? 'bg-amber-500/30 border border-amber-400/50 text-amber-200'
                              : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-amber-600/30'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-2 uppercase tracking-wide">
                      Your Message
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tell us what you think, report a bug, or suggest a feature..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>

                  {/* Email (optional) */}
                  {!user && (
                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-2 uppercase tracking-wide">
                        Email <span className="text-slate-500">(optional, for follow-up)</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-amber-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-xs text-red-400 font-semibold">{error}</p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Feedback
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
