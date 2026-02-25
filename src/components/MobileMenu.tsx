'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Menu, X, Gamepad2, BookOpen, Trophy, User, LogIn, UserPlus, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import WallpaperSelector from './WallpaperSelector';
import FeedbackModal from './FeedbackModal';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    if (!mounted) return;
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [open, mounted]);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
    setConfirmLogout(false);
  }, [pathname]);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    await logout();
    close();
    setConfirmLogout(false);
  };

  return (
    <div className="md:hidden mr-2">
      <button
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center justify-center rounded-md px-3 py-2 text-amber-100 hover:text-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 transition"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-[1000] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          />
          {/* Side drawer */}
          <aside
            className={`fixed top-0 left-0 h-full w-[78%] max-w-xs bg-gradient-to-b from-slate-900 via-slate-950 to-black backdrop-blur-md border-r border-amber-700/40 shadow-2xl shadow-black/50 flex flex-col overflow-y-auto transition-transform duration-300 z-[1001] ${open ? 'translate-x-0' : '-translate-x-full'}`}
            aria-hidden={!open}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/30 shrink-0">
              <Link 
                href="/" 
                onClick={close}
                className="font-extrabold tracking-wide text-sm bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent"
              >
                ROYALEHAUS
              </Link>
              <button
                aria-label="Close menu"
                onClick={close}
                className="p-2 rounded-md hover:bg-white/10 text-amber-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col px-2 py-4 text-sm font-semibold tracking-wide">
              <Link href="/" onClick={close} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-amber-400/10 text-amber-100">
                <Gamepad2 className="w-4 h-4 text-amber-300" /> <span>GAMES</span>
              </Link>
              <Link href="/cards" onClick={close} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-amber-400/10 text-amber-100">
                <BookOpen className="w-4 h-4 text-emerald-300" /> <span>WIKI</span>
              </Link>
              <Link href="/logbook" onClick={close} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-amber-400/10 text-amber-100">
                <User className="w-4 h-4 text-sky-300" /> <span>LOGBOOK</span>
              </Link>
              <Link href="/leaderboard" onClick={close} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-amber-400/10 text-amber-100">
                <Trophy className="w-4 h-4 text-amber-300" /> <span>LEADERBOARD</span>
              </Link>
            </nav>

            {/* Divider */}
            <div className="mx-4 h-px bg-amber-700/30" />

            {/* Account Section */}
            <div className="px-2 py-4">
              <p className="text-[10px] uppercase tracking-wider text-amber-500/50 font-bold mb-3 px-3">
                Account
              </p>

              {user ? (
                <div className="flex flex-col">
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={close}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-purple-300 hover:bg-purple-500/10 transition-colors font-semibold tracking-wide text-sm"
                    >
                      <Shield className="w-4 h-4 text-purple-400" />
                      ADMIN PANEL
                    </Link>
                  )}

                  {!confirmLogout ? (
                    <button
                      onClick={() => setConfirmLogout(true)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 transition-colors font-semibold tracking-wide text-sm w-full text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-400/70" />
                      LOGOUT
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-3 bg-slate-800/50 rounded-lg">
                      <span className="text-xs text-amber-100/70">Confirm logout?</span>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-1 rounded bg-red-600 text-xs font-bold text-white hover:bg-red-500"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmLogout(false)}
                        className="px-3 py-1 rounded bg-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-600"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link
                    href="/auth?mode=login"
                    onClick={close}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-amber-100/80 hover:text-amber-50 hover:bg-amber-500/10 transition-colors font-semibold tracking-wide text-sm"
                  >
                    <LogIn className="w-4 h-4 text-amber-400/70" />
                    LOGIN
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    onClick={close}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg bg-rose-600/20 text-rose-200 hover:bg-rose-600/30 transition-colors font-semibold tracking-wide text-sm border border-rose-500/30"
                  >
                    <UserPlus className="w-4 h-4 text-rose-400" />
                    REGISTER
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className="mt-auto px-4 pb-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <WallpaperSelector />
                <div className="flex-1" />
                <FeedbackModal />
              </div>
              <div className="flex gap-3">
                <Link href="/privacy" onClick={close} className="text-xs text-amber-100/40 hover:text-amber-100/70 transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" onClick={close} className="text-xs text-amber-100/40 hover:text-amber-100/70 transition-colors">
                  Terms
                </Link>
              </div>
              <p className="text-[10px] text-amber-100/30">
                Fan project - Not affiliated with Supercell
              </p>
            </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  );
}
