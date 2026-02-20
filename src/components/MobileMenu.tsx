'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Gamepad2, BookOpen, Trophy, User, Image, MessageSquare, LogIn, UserPlus, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Close menu when pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
    setConfirmLogout(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    setConfirmLogout(false);
  };

  const menuItems = [
    { href: '/', label: 'GAMES', icon: Gamepad2 },
    { href: '/cards', label: 'WIKI', icon: BookOpen },
    { href: '/logbook', label: 'LOGBOOK', icon: User },
    { href: '/leaderboard', label: 'LEADERBOARD', icon: Trophy },
  ];

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-md p-2 text-amber-100 hover:bg-amber-500/10 transition-colors md:hidden"
        type="button"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div 
        className={`fixed top-0 left-0 z-[101] h-full w-72 max-w-[85vw] bg-gradient-to-b from-slate-900 via-slate-950 to-black border-r border-amber-700/30 transform transition-transform duration-300 ease-out md:hidden flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-amber-700/30 shrink-0">
          <Link 
            href="/" 
            onClick={() => setIsOpen(false)}
            className="font-extrabold text-lg tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent"
          >
            ROYALEHAUS
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-md text-amber-100 hover:bg-amber-500/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold tracking-wide text-sm ${
                    isActive 
                      ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30' 
                      : 'text-amber-100/80 hover:text-amber-50 hover:bg-amber-500/10'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-amber-400/70'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="mx-4 h-px bg-amber-700/30" />

          {/* Account Section */}
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-amber-500/50 font-bold mb-3 px-4">
              Account
            </p>
            
            {user ? (
              <div className="space-y-1">
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 transition-colors font-semibold tracking-wide text-sm"
                  >
                    <Shield className="w-5 h-5 text-purple-400" />
                    ADMIN PANEL
                  </Link>
                )}
                
                {!confirmLogout ? (
                  <button
                    onClick={() => setConfirmLogout(true)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 transition-colors font-semibold tracking-wide text-sm w-full text-left"
                  >
                    <LogOut className="w-5 h-5 text-red-400/70" />
                    LOGOUT
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 rounded-lg">
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
              <div className="space-y-1">
                <Link
                  href="/auth?mode=login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-amber-100/80 hover:text-amber-50 hover:bg-amber-500/10 transition-colors font-semibold tracking-wide text-sm"
                >
                  <LogIn className="w-5 h-5 text-amber-400/70" />
                  LOGIN
                </Link>
                <Link
                  href="/auth?mode=register"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-600/20 text-rose-200 hover:bg-rose-600/30 transition-colors font-semibold tracking-wide text-sm border border-rose-500/30"
                >
                  <UserPlus className="w-5 h-5 text-rose-400" />
                  REGISTER
                </Link>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-4 h-px bg-amber-700/30" />

          {/* Haus Universe Section */}
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-amber-500/50 font-bold mb-3 px-4">
              Haus Universe
            </p>
            <a
              href="https://onepiecehaus.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-amber-100/60 hover:text-amber-50 hover:bg-amber-500/10 transition-colors font-semibold tracking-wide text-sm"
            >
              <img src="/images/onepiece-logo.svg" alt="" className="w-5 h-5" />
              ONEPIECEHAUS
            </a>
          </div>
        </div>

        {/* Bottom Section - Fixed */}
        <div className="shrink-0 p-4 border-t border-amber-700/30 bg-slate-950/80">
          <div className="flex gap-3">
            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="text-xs text-amber-100/40 hover:text-amber-100/70 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              onClick={() => setIsOpen(false)}
              className="text-xs text-amber-100/40 hover:text-amber-100/70 transition-colors"
            >
              Terms
            </Link>
          </div>
          <p className="text-[10px] text-amber-100/30 mt-2">
            Fan project - Not affiliated with Supercell
          </p>
        </div>
      </div>
    </>
  );
}
