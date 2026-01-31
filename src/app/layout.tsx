import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import WallpaperSelector from '@/components/WallpaperSelector'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-clash',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RoyaleHaus - Clash Royale Mini-Games & Wiki',
    template: '%s | RoyaleHaus'
  },
  description: 'Play Clash Royale mini-games and quizzes. Featuring 168 cards including Troops, Spells, Buildings, Champions. Memory games, Wordle, Higher or Lower and more.',
  keywords: [
    'clash royale', 'supercell', 'cards', 'quiz', 'games', 'trivia',
    'wordle', 'grid', 'higher or lower', 'troops', 'spells', 'champions'
  ],
  authors: [{ name: 'RoyaleHaus Team' }],
  creator: 'RoyaleHaus',
  publisher: 'RoyaleHaus',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1e3a8a" />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen bg-black text-amber-100 relative overflow-x-hidden wallpaper-body`}>
        {/* Decorative overlays */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,225,150,0.15),transparent_60%)] z-10 wallpaper-global-overlay"/>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,180,80,0.12),transparent_55%)] z-10 wallpaper-global-overlay"/>
        
        <div className="relative flex min-h-screen flex-col z-20 wallpaper-content">
          {/* Header - Golden/Amber theme like OnePieceHaus */}
          <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 relative overflow-hidden">
            {/* Golden gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3b2816] via-[#b7853f] to-[#e6cf9a] opacity-95 header-bg-overlay"></div>
            
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-25 header-pattern-overlay" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%238a6124' stroke-width='1' stroke-opacity='0.15'%3E%3Cpath d='M0 60h120M60 0v120'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            
            <div className="container flex h-14 items-center relative z-10">
              <div className="mr-4 hidden md:flex">
                <a className="mr-6 flex items-center space-x-2" href="/">
                  <span className="hidden font-extrabold sm:inline-block text-xl tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow">
                    ROYALEHAUS
                  </span>
                </a>
                <nav className="flex items-center space-x-6 text-sm font-semibold tracking-wide">
                  <a
                    className="text-amber-100/80 hover:text-amber-50 transition-colors drop-shadow"
                    href="/"
                  >
                    GAMES
                  </a>
                  <a
                    className="text-amber-100/80 hover:text-amber-50 transition-colors drop-shadow"
                    href="/cards"
                  >
                    WIKI
                  </a>
                  <a
                    className="text-amber-100/80 hover:text-amber-50 transition-colors drop-shadow"
                    href="/logbook"
                  >
                    LOGBOOK
                  </a>
                  <a
                    className="text-amber-100/80 hover:text-amber-50 transition-colors drop-shadow"
                    href="/leaderboard"
                  >
                    LEADERBOARD
                  </a>
                </nav>
              </div>

              {/* Mobile menu button */}
              <button
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none h-9 py-2 mr-2 px-0 text-base hover:bg-transparent md:hidden"
                type="button"
              >
                <svg strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="sr-only">Toggle Menu</span>
              </button>
              
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  <a className="inline-flex items-center rounded-lg font-extrabold text-sm tracking-wide py-2 px-4 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent md:hidden" href="/">
                    ROYALEHAUS
                  </a>
                </div>
                <nav className="flex items-center space-x-4">
                  <WallpaperSelector />
                </nav>
              </div>
            </div>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="py-6 md:px-8 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built by{" "}
                <a
                  href="https://github.com/royalehaus"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  RoyaleHaus Team
                </a>
                . Fan project - Not affiliated with Supercell.
              </p>
              <div className="flex items-center space-x-4">
                <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy
                </a>
                <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
