'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { baseCards } from '@/data'
import { emojiRiddles } from '@/data/emoji-riddles'
import { ClashCard } from '@/types/card'
import { recordEmojiRiddleSession } from '@/lib/progress'
import { CheckCircle, Clock, Home, Flame, Calendar, XCircle } from 'lucide-react'
import { useLanguage } from '@/lib/useLanguage'
import { includesNormalized } from '@/lib/text-utils'
import {
  seededRandom, todayStr, getTimeUntilReset,
  getDayResult, saveDayResult, isDayCompleted,
  getDailyStreakData, updateDailyStreak,
  buildDayOptions,
  type DailyResult, type DailyStreakData, type DayOption,
} from '@/lib/daily-challenge'

const GAME_ID = 'emoji-riddle'
const MAX_GUESSES = 5

// Cards that have emoji riddles (excluding evolutions)
const availableCardIds = Object.keys(emojiRiddles)
  .map(Number)
  .filter(id => {
    const card = baseCards.find(c => c.id === id)
    return card && card.type !== 'Evolution'
  })

/* ── deterministic daily target (no consecutive repeats) ── */
function getTargetForDate(date: string): number {
  const parts = date.split('-').map(Number)
  const seed = (parts[0] * 10000 + parts[1] * 100 + parts[2]) * 7731
  let idx = Math.floor(seededRandom(seed) * availableCardIds.length)
  // Prevent same target as previous day
  const prev = new Date(date)
  prev.setDate(prev.getDate() - 1)
  const prevStr = prev.toISOString().slice(0, 10)
  const prevParts = prevStr.split('-').map(Number)
  const prevSeed = (prevParts[0] * 10000 + prevParts[1] * 100 + prevParts[2]) * 7731
  const prevIdx = Math.floor(seededRandom(prevSeed) * availableCardIds.length)
  if (idx === prevIdx) idx = (idx + 1) % availableCardIds.length
  return availableCardIds[idx]
}

export default function EmojiRiddlePage() {
  const { getCardNameTranslated } = useLanguage()
  const all = useMemo(() => baseCards.filter(c => emojiRiddles[c.id]), [])

  const [activeDate, setActiveDate] = useState(() => todayStr())
  const [targetId, setTargetId] = useState<number | null>(null)
  const [target, setTarget] = useState<ClashCard | null>(null)
  const [emojis, setEmojis] = useState<string[]>([])
  const [revealedCount, setRevealedCount] = useState(1)
  const [input, setInput] = useState('')
  const [filtered, setFiltered] = useState<ClashCard[]>([])
  const [guesses, setGuesses] = useState<ClashCard[]>([])
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [showHelp, setShowHelp] = useState(false)
  const recordedRef = useRef(false)

  const [dayCompleted, setDayCompleted] = useState(false)
  const [dayResult, setDayResult] = useState<DailyResult | null>(null)
  const [dailyStreak, setDailyStreak] = useState<DailyStreakData | null>(null)
  const [countdown, setCountdown] = useState('')
  const [dayOptions, setDayOptions] = useState<DayOption[]>([])
  const [showDayPicker, setShowDayPicker] = useState(false)

  useEffect(() => { const u = () => setCountdown(getTimeUntilReset()); u(); const i = setInterval(u, 1000); return () => clearInterval(i) }, [])

  const refreshDayOptions = useCallback(() => { setDayOptions(buildDayOptions(GAME_ID, 8)) }, [])

  const initGame = useCallback((date: string) => {
    if (availableCardIds.length === 0) return
    const tId = getTargetForDate(date)
    setTargetId(tId)
    setTarget(baseCards.find(c => c.id === tId) || null)
    setEmojis(emojiRiddles[tId] || [])
    setActiveDate(date)
    recordedRef.current = false

    const existing = getDayResult(GAME_ID, date)
    if (existing) {
      setDayCompleted(true); setDayResult(existing); setDailyStreak(getDailyStreakData(GAME_ID))
      setGameState(existing.won ? 'won' : 'lost')
      setRevealedCount(5)
    } else {
      setDayCompleted(false); setDayResult(null)
      setGuesses([]); setInput(''); setGameState('playing')
      setRevealedCount(1)
    }
    refreshDayOptions()
  }, [refreshDayOptions])

  useEffect(() => { initGame(todayStr()) }, [initGame])

  const guessedIds = useMemo(() => new Set(guesses.map(g => g.id)), [guesses])

  useEffect(() => {
    const term = input.trim().toLowerCase()
    if (term.length < 2) { setFiltered([]); return }
    setFiltered(all.filter(c => !guessedIds.has(c.id) && includesNormalized(getCardNameTranslated(c.id), term)).slice(0, 8))
  }, [input, all, guessedIds, getCardNameTranslated])

  const submit = (c: ClashCard) => {
    if (!targetId || gameState !== 'playing' || guessedIds.has(c.id) || dayCompleted) return
    const newGuesses = [...guesses, c]
    setGuesses(newGuesses)
    setInput(''); setFiltered([])

    if (c.id === targetId) {
      setGameState('won')
      const result: DailyResult = { won: true, guesses: newGuesses.length, targetId, date: activeDate }
      saveDayResult(GAME_ID, result); setDayCompleted(true); setDayResult(result)
      if (activeDate === todayStr()) setDailyStreak(updateDailyStreak(GAME_ID))
      setRevealedCount(5)
      refreshDayOptions()
      if (!recordedRef.current) {
        recordedRef.current = true; recordEmojiRiddleSession(newGuesses.length, true)
        fetch('/api/daily', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ gameType: 'emoji-riddle', won: true, attempts: newGuesses.length }) }).catch(() => {})
      }
    } else {
      setRevealedCount(prev => Math.min(emojis.length, prev + 1))
      if (newGuesses.length >= MAX_GUESSES) {
        setGameState('lost')
        const result: DailyResult = { won: false, guesses: newGuesses.length, targetId, date: activeDate }
        saveDayResult(GAME_ID, result); setDayCompleted(true); setDayResult(result)
        if (activeDate === todayStr()) setDailyStreak(getDailyStreakData(GAME_ID))
        setRevealedCount(5)
        refreshDayOptions()
        if (!recordedRef.current) {
          recordedRef.current = true; recordEmojiRiddleSession(newGuesses.length, false)
          fetch('/api/daily', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ gameType: 'emoji-riddle', won: false, attempts: newGuesses.length }) }).catch(() => {})
        }
      }
    }
  }

  const switchDay = (date: string) => { setShowDayPicker(false); initGame(date) }
  const todayDone = typeof window !== 'undefined' ? isDayCompleted(GAME_ID, todayStr()) : false

  return (
    <div className="min-h-screen text-purple-100 flex flex-col relative">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/55 to-black/70" />

      {/* Header */}
      <div className="border-b border-purple-700/40 bg-[#0c0520]/70 backdrop-blur-sm sticky top-0 z-40 shadow-lg shadow-black/40">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/" className="flex items-center gap-1 text-purple-300/70 hover:text-purple-100 transition-colors"><Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span></Link>
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-purple-300 via-fuchsia-300 to-purple-400 bg-clip-text text-transparent drop-shadow">Emoji Riddle
                <span className="text-[10px] px-2 py-0.5 bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-400 rounded-full font-bold ml-2">DAILY</span>
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 text-xs">
              {todayDone && (
                <button onClick={() => setShowDayPicker(s => !s)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition text-xs">
                  <Calendar className="w-3.5 h-3.5" /><span className="hidden sm:inline">Days</span>
                </button>
              )}
              {dayCompleted && <div className="flex items-center gap-1.5 text-purple-400 text-xs"><Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">{countdown}</span></div>}
              <button onClick={() => setShowHelp(s => !s)} className="p-1 rounded hover:bg-purple-300/10 text-lg">❓</button>
            </div>
          </div>
        </div>
      </div>

      {/* Day picker */}
      {showDayPicker && todayDone && (
        <div className="sticky top-[57px] z-30 bg-[#0c0520]/95 backdrop-blur border-b border-purple-700/40 shadow-lg shadow-black/40">
          <div className="container mx-auto px-2 sm:px-4 py-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-purple-400"><Calendar className="w-3.5 h-3.5" /><span className="font-bold uppercase tracking-wide">Play past days</span></div>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map(opt => (
                <button key={opt.date} onClick={() => switchDay(opt.date)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${opt.date === activeDate ? 'bg-fuchsia-600/30 border-fuchsia-500/60 text-fuchsia-300 ring-1 ring-fuchsia-400/40' : opt.completed ? 'bg-green-600/15 border-green-500/40 text-green-400 hover:bg-green-600/25' : 'bg-purple-600/15 border-purple-500/30 text-purple-300 hover:bg-purple-600/25'}`}>
                  <div>{opt.label}</div>
                  {opt.completed && <div className="text-[9px] text-green-400 mt-0.5">✓ Done</div>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl mx-auto p-4 flex-1 flex flex-col relative z-10">
        {/* Active date indicator */}
        {activeDate !== todayStr() && (
          <div className="mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <Calendar className="w-4 h-4" /><span>Playing: <strong>{dayOptions.find(o => o.date === activeDate)?.label || activeDate}</strong></span>
            <button onClick={() => switchDay(todayStr())} className="ml-3 px-2 py-0.5 rounded bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs hover:bg-purple-600/40 transition">← Today</button>
          </div>
        )}

        {showHelp && (
          <div className="mb-6 p-4 rounded-lg bg-[#0c0520]/60 border border-purple-700/40 text-sm leading-relaxed shadow shadow-black/40">
            Guess the Clash Royale card from the emoji clues! You have <strong className="text-fuchsia-300">{MAX_GUESSES} attempts</strong>. A new emoji clue is revealed with each wrong guess.
            <br /><br /><span className="text-fuchsia-400 font-bold">📅 Daily System:</span> Complete today&apos;s challenge, then play the last 7 days using the calendar button!
          </div>
        )}

        {/* Completed Banner */}
        {dayCompleted && dayResult && (gameState === 'won' || gameState === 'lost') && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative rounded-2xl p-6 text-center overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(12, 5, 32, 0.95) 0%, rgba(20, 10, 50, 0.98) 100%)', border: `2px solid ${dayResult.won ? 'rgba(74, 222, 128, 0.5)' : 'rgba(248, 113, 113, 0.5)'}` }}>
              <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-purple-400/60" />
              <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-purple-400/60" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-purple-400/60" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-purple-400/60" />
              <div className="flex items-center justify-center gap-2 mb-3">
                {dayResult.won ? <CheckCircle className="w-8 h-8 text-green-400" /> : <XCircle className="w-8 h-8 text-red-400" />}
                <h3 className={`text-xl font-black uppercase tracking-wider ${dayResult.won ? 'text-green-400' : 'text-red-400'}`}>{dayResult.won ? (activeDate === todayStr() ? 'Daily Completed!' : 'Challenge Completed!') : 'Game Over'}</h3>
              </div>
              {/* Show all emojis */}
              <div className="flex justify-center gap-2 text-3xl mb-4">{emojis.map((e, i) => <span key={i}>{e}</span>)}</div>
              <div className="flex items-center justify-center gap-4 mb-4">
                <img src={`/images/cards/${dayResult.targetId}.webp`} alt={getCardNameTranslated(Number(dayResult.targetId))} className="w-16 h-20 object-cover object-top rounded-lg border-2 border-purple-500/50" />
                <div className="text-left">
                  <div className="text-white font-bold text-lg">{getCardNameTranslated(Number(dayResult.targetId))}</div>
                  <div className={`text-sm ${dayResult.won ? 'text-green-300/80' : 'text-red-300/80'}`}>{dayResult.won ? `🏆 Found in ${dayResult.guesses} attempt${dayResult.guesses !== 1 ? 's' : ''}!` : 'Better luck next time!'}</div>
                </div>
              </div>
              {dailyStreak && dailyStreak.currentStreak > 0 && activeDate === todayStr() && dayResult.won && (
                <div className="flex items-center justify-center gap-2 text-amber-400 mb-3"><Flame className="w-5 h-5" /><span className="font-bold">{dailyStreak.currentStreak} day streak</span>{dailyStreak.currentStreak === dailyStreak.bestStreak && dailyStreak.currentStreak > 1 && <span className="text-xs bg-amber-400/20 px-2 py-0.5 rounded-full">Best!</span>}</div>
              )}
              {activeDate === todayStr() && <div className="bg-[#0c0520]/50 rounded-xl p-4 border border-purple-700/50 mb-3"><div className="flex items-center justify-center gap-2 text-purple-400 text-sm"><Clock className="w-4 h-4" /><span>Next daily in {countdown}</span></div></div>}
              {todayDone && <button onClick={() => setShowDayPicker(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-gradient-to-br from-purple-600 via-fuchsia-500 to-purple-600 text-white shadow-lg shadow-purple-900/40 hover:brightness-110 transition text-sm"><Calendar className="w-4 h-4" /> Play Past Days</button>}
            </div>
          </div>
        )}

        {/* Game area - playing */}
        {gameState === 'playing' && !dayCompleted && (
          <>
            {/* Emoji display */}
            <div className="mb-6 flex justify-center gap-3 sm:gap-4">
              {emojis.map((emoji, i) => (
                <div key={i} className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl text-2xl sm:text-3xl border-2 transition-all duration-300 ${i < revealedCount ? 'bg-purple-600/20 border-purple-500/50 scale-100' : 'bg-[#0c0520]/60 border-purple-700/30 scale-90'}`}>
                  {i < revealedCount ? emoji : '❓'}
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-purple-400 mb-4">
              Attempt {guesses.length + 1} / {MAX_GUESSES} · {revealedCount} / {emojis.length} clues revealed
            </div>

            {/* Search input */}
            <div className="mb-6 relative">
              <div className="flex items-center gap-2 bg-[#0c0520]/60 border border-purple-700/40 rounded-lg px-3 py-2 shadow shadow-black/30">
                <span className="text-purple-300/80">🔍</span>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && filtered.length > 0 && input.trim().length >= 2) submit(filtered[0]) }} placeholder="Type at least 2 characters..." className="flex-1 bg-transparent outline-none text-sm placeholder-zinc-500" />
              </div>
              {filtered.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-[#0c0520]/95 backdrop-blur border border-purple-600/50 rounded-xl shadow-2xl shadow-black/60 max-h-64 overflow-auto ring-1 ring-purple-400/20">
                  <ul className="py-1 divide-y divide-purple-400/10">
                    {filtered.map((c, i) => (
                      <li key={c.id}><button onClick={() => submit(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-purple-300/10 flex items-center gap-3 transition-colors">
                        <img src={`/images/cards/${c.id}.webp`} alt={c.name} className="w-9 h-9 object-cover object-top rounded-lg ring-1 ring-purple-500/30" />
                        <span className="font-medium tracking-wide text-purple-100/90">{getCardNameTranslated(c.id)}</span>
                        {i === 0 && input.trim().length >= 2 && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">Enter</span>}
                      </button></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Guess history */}
            {guesses.length > 0 && (
              <div className="space-y-2 mb-6">
                {guesses.map(g => (
                  <div key={g.id} className={`flex items-center gap-3 p-3 rounded-lg border ${g.id === targetId ? 'bg-green-600/15 border-green-500/40' : 'bg-red-600/10 border-red-500/30'}`}>
                    <img src={`/images/cards/${g.id}.webp`} alt={g.name} className="w-10 h-10 object-cover object-top rounded-lg ring-1 ring-purple-500/30" />
                    <span className="font-semibold text-sm flex-1">{getCardNameTranslated(g.id)}</span>
                    {g.id === targetId ? <CheckCircle className="w-5 h-5 text-green-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
