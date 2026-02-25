'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Check } from 'lucide-react';

interface DailyGame {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  color: string;
}

// Check if a daily game has been completed today (localStorage)
function isDailyCompleted(gameId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const today = new Date().toISOString().slice(0, 10);
  const lastDaily = localStorage.getItem(`${gameId}-last-daily`);
  
  return lastDaily === today;
}

// Sync a DB completion into localStorage so other checks pick it up
function syncCompletionToLocalStorage(gameId: string, won: boolean, attempts: number, cardId?: number) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(`${gameId}-last-daily`, today);
  localStorage.setItem(`${gameId}-daily-result`, JSON.stringify({
    won,
    guesses: attempts,
    cardId: cardId || 0,
  }));
}

// Calculate time until midnight UTC
function getTimeUntilReset(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diff = tomorrow.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

function formatCountdown(time: { hours: number; minutes: number; seconds: number }): string {
  const h = String(time.hours).padStart(2, '0');
  const m = String(time.minutes).padStart(2, '0');
  const s = String(time.seconds).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

interface DailyGameCardProps {
  game: DailyGame;
  dbCompleted?: boolean;
}

export function DailyGameCard({ game, dbCompleted }: DailyGameCardProps) {
  const [completed, setCompleted] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [mounted, setMounted] = useState(false);

  // Check completion status - localStorage first, then DB override
  const checkCompletion = useCallback(() => {
    const isCompleted = isDailyCompleted(game.id) || !!dbCompleted;
    setCompleted(isCompleted);
  }, [game.id, dbCompleted]);

  useEffect(() => {
    setMounted(true);
    checkCompletion();
    
    // Update countdown every second
    const updateCountdown = () => {
      const time = getTimeUntilReset();
      setCountdown(formatCountdown(time));
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    // Check completion status periodically
    const checkInterval = setInterval(checkCompletion, 2000);
    
    return () => {
      clearInterval(interval);
      clearInterval(checkInterval);
    };
  }, [checkCompletion]);

  // Don't render until client-side to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className="relative block rounded-xl overflow-hidden"
        style={{
          border: '2px solid rgba(180, 140, 60, 0.4)',
          background: 'linear-gradient(180deg, rgba(30, 25, 18, 0.7) 0%, rgba(20, 18, 12, 0.9) 100%)',
        }}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-800/50" />
        <div 
          className="py-3 px-4"
          style={{
            background: 'linear-gradient(90deg, rgba(42, 35, 22, 0.95) 0%, rgba(55, 45, 28, 0.95) 50%, rgba(42, 35, 22, 0.95) 100%)',
            borderTop: '1px solid rgba(180, 140, 60, 0.25)',
          }}
        >
          <div className="h-4 bg-gray-700/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={game.href}
      className={`group relative block rounded-xl overflow-hidden transition-all duration-300 ${
        completed 
          ? 'opacity-60 hover:opacity-80' 
          : 'hover:-translate-y-1.5 hover:shadow-[0_8px_40px_rgba(245,180,50,0.2)]'
      }`}
      style={{
        border: completed 
          ? '2px solid rgba(100, 100, 100, 0.4)' 
          : '2px solid rgba(180, 140, 60, 0.4)',
        background: completed
          ? 'linear-gradient(180deg, rgba(25, 25, 25, 0.7) 0%, rgba(15, 15, 15, 0.9) 100%)'
          : 'linear-gradient(180deg, rgba(30, 25, 18, 0.7) 0%, rgba(20, 18, 12, 0.9) 100%)',
      }}
    >
      {/* Daily badge or Completed badge */}
      <div 
        className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 sm:gap-1"
        style={{
          background: completed 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.4))'
            : `linear-gradient(135deg, ${game.color}20, ${game.color}40)`,
          border: completed 
            ? '1px solid rgba(34, 197, 94, 0.6)'
            : `1px solid ${game.color}60`,
          color: completed ? '#22c55e' : game.color,
        }}
      >
        {completed ? (
          <>
            <Check className="w-3 h-3" />
            Done
          </>
        ) : (
          'Daily'
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-[3/2] xs:aspect-[4/3] sm:aspect-[16/9] overflow-hidden">
        <Image
          src={game.image}
          alt={game.title}
          fill
          className={`object-cover transition-transform duration-500 ease-out ${
            completed ? 'grayscale group-hover:grayscale-[50%]' : 'group-hover:scale-105'
          }`}
        />
        <div className={`absolute inset-0 ${
          completed 
            ? 'bg-gradient-to-t from-black/80 via-black/40 to-black/20' 
            : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
        }`} />
        {!completed && (
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/0 via-amber-300/0 to-amber-200/0 group-hover:from-amber-400/5 group-hover:via-amber-300/10 group-hover:to-amber-200/5 transition-all duration-500" />
        )}
      </div>

      {/* Content */}
      <div 
        className="py-2 sm:py-3 px-2 sm:px-4"
        style={{
          background: completed
            ? 'linear-gradient(90deg, rgba(30, 30, 30, 0.95) 0%, rgba(40, 40, 40, 0.95) 50%, rgba(30, 30, 30, 0.95) 100%)'
            : 'linear-gradient(90deg, rgba(42, 35, 22, 0.95) 0%, rgba(55, 45, 28, 0.95) 50%, rgba(42, 35, 22, 0.95) 100%)',
          borderTop: completed
            ? '1px solid rgba(100, 100, 100, 0.25)'
            : '1px solid rgba(180, 140, 60, 0.25)',
        }}
      >
        <h3 
          className="text-center text-[10px] xs:text-[11px] sm:text-[12px] font-extrabold tracking-[0.05em] xs:tracking-[0.1em] sm:tracking-[0.2em] uppercase"
          style={{
            background: completed
              ? 'linear-gradient(180deg, #a0a0a0 0%, #707070 100%)'
              : 'linear-gradient(180deg, #f5d485 0%, #c9a44a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
          }}
        >
          {game.title}
        </h3>
        
        {completed ? (
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-gray-300 text-[9px] sm:text-[11px] mt-1 sm:mt-1.5 bg-black/20 rounded-full px-2 sm:px-2.5 py-0.5 mx-auto w-fit">
            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>Next in {countdown}</span>
          </div>
        ) : (
          <p className="text-center text-amber-100/70 text-[9px] xs:text-[10px] sm:text-[11px] mt-0.5 sm:mt-1.5 font-medium line-clamp-2 sm:line-clamp-none">{game.description}</p>
        )}
      </div>
    </Link>
  );
}

interface DailyGamesGridProps {
  games: DailyGame[];
}

export function DailyGamesGrid({ games }: DailyGamesGridProps) {
  const [dbCompletions, setDbCompletions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch completion status from DB for logged-in users
    fetch('/api/daily/completions', { credentials: 'include' })
      .then(res => res.ok ? res.json() : { completions: {} })
      .then(data => {
        const completions: Record<string, boolean> = {};
        for (const [gameType, info] of Object.entries(data.completions || {})) {
          if ((info as any)?.completed) {
            completions[gameType] = true;
            // Sync to localStorage so game pages also know
            syncCompletionToLocalStorage(gameType, (info as any).won, (info as any).attempts);
          }
        }
        setDbCompletions(completions);
      })
      .catch(() => {}); // Silently fail - localStorage still works
  }, []);

  return (
    <div className="daily-games-grid grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 gap-2 xs:gap-2.5 sm:gap-4">
      {games.map((game) => (
        <DailyGameCard key={game.id} game={game} dbCompleted={dbCompletions[game.id]} />
      ))}
    </div>
  );
}
