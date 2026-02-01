"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Lock, Eye, EyeOff, CheckCircle2, Users, Trophy, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

function AuthContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const prettyError = (code: string) => {
    switch (code) {
      case 'INVALID_CREDENTIALS': return 'Invalid email/username or password';
      case 'EMAIL_EXISTS': return 'This email is already registered';
      case 'USERNAME_EXISTS': return 'This username is already taken';
      case 'USERNAME_TOO_SHORT': return 'Username must be at least 3 characters';
      case 'USERNAME_INVALID_CHARS': return 'Username can only contain letters, numbers, hyphens and underscores';
      case 'PASSWORD_TOO_SHORT': return 'Password must be at least 6 characters';
      case 'INVALID_EMAIL': return 'Please enter a valid email address';
      case 'RATE_LIMIT': return 'Too many attempts. Please wait a moment.';
      default: return code.replace(/_/g, ' ');
    }
  };

  const { user, loading, login, register } = useAuth();
  const search = useSearchParams();
  const initialMode = (search.get('mode') === 'register') ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doLogin = async () => {
    setBusy(true); setError(null);
    try { await login(identifier, password); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  
  const doRegister = async () => {
    setBusy(true); setError(null);
    try { await register(email, username, password); } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      mode === 'login' ? doLogin() : doRegister();
    }
  };

  useEffect(() => {
    const m = (search.get('mode') === 'register') ? 'register' : 'login';
    setMode(m);
  }, [search]);

  useEffect(() => {
    if (user) {
      const t = setTimeout(() => router.replace('/'), 200);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
      <div className="flex items-center gap-3 text-blue-300/80">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );
  
  if (user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-blue-100">
      <div className="flex items-center gap-3 text-blue-300/80">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <span>Welcome back! Redirecting...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950 text-blue-100 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center">
        
        {/* Left side - Benefits & Trust indicators */}
        <div className="flex-1 max-w-md lg:pr-8">
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-3 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              {mode === 'login' ? 'Welcome Back!' : 'Join RoyaleHaus'}
            </h1>
            <p className="text-blue-200/70 text-sm lg:text-base">
              {mode === 'login' 
                ? 'Sign in to continue your journey and track your progress across all games.'
                : 'Create a free account to save your progress, compete on leaderboards, and unlock achievements.'}
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/20 border border-amber-500/10">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-100 text-sm">Compete on Leaderboards</h3>
                <p className="text-xs text-amber-300/60">Climb the rankings and show off your skills</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-900/20 border border-amber-500/10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-100 text-sm">Earn XP & Level Up</h3>
                <p className="text-xs text-amber-300/60">Unlock rewards as you progress through levels</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-500/20">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-amber-100 text-sm">Haus Universe Account</h3>
                <p className="text-xs text-amber-300/60">One account for RoyaleHaus, OnePieceHaus & more</p>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-amber-300/50">
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/70 border border-amber-500/20 rounded-2xl p-6 lg:p-8 shadow-2xl shadow-amber-900/20 backdrop-blur-xl">
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-slate-800/50 p-1 mb-6">
              <button 
                onClick={() => setMode('login')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'login' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-blue-300/70 hover:text-blue-200'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setMode('register')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  mode === 'register' 
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-blue-300/70 hover:text-blue-200'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-4" onKeyPress={handleKeyPress}>
              {mode === 'login' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 tracking-wide">
                      Email or Username
                    </label>
                    <input 
                      type="text"
                      value={identifier} 
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Enter your email or username"
                      autoComplete="username"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/70 border border-slate-600/50 outline-none text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/70 border border-slate-600/50 outline-none text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-300 transition"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 tracking-wide">
                      Email Address
                    </label>
                    <input 
                      type="email"
                      value={email} 
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      autoComplete="email"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/70 border border-slate-600/50 outline-none text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 tracking-wide">
                      Username
                    </label>
                    <input 
                      type="text"
                      value={username} 
                      onChange={e => setUsername(e.target.value.toUpperCase())}
                      placeholder="Choose a unique username"
                      autoComplete="username"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/70 border border-slate-600/50 outline-none text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all" 
                    />
                    <p className="mt-1 text-[10px] text-slate-500">This will be your public display name</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-200/80 mb-1.5 tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={password} 
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Create a secure password"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/70 border border-slate-600/50 outline-none text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all" 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-300 transition"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">Minimum 6 characters</p>
                  </div>
                </>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {prettyError(error)}
                </div>
              )}

              <button 
                disabled={busy} 
                onClick={mode === 'login' ? doLogin : doRegister}
                className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-amber-500/25'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 shadow-amber-500/25'
                }`}
              >
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Free Account'
                )}
              </button>
            </div>

            {/* Privacy notice */}
            <div className="mt-6 pt-5 border-t border-amber-700/30">
              <p className="text-[11px] text-center text-amber-200/50 leading-relaxed">
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-amber-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-amber-400 hover:underline">Privacy Policy</a>.
                <br />
                <span className="text-amber-300/40">We never share your personal information.</span>
              </p>
            </div>

            {/* Security badges - mobile */}
            <div className="lg:hidden flex items-center justify-center gap-4 mt-5 text-[10px] text-amber-400/50">
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Encrypted</span>
              </div>
            </div>
          </div>

          {/* Additional trust text */}
          <p className="text-center text-xs text-amber-400/40 mt-4">
            🔒 Your data is protected with industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-blue-950 to-slate-950">
        <div className="flex items-center gap-3 text-blue-300/80">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
