import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import WallpaperSelector from '@/components/WallpaperSelector'
import AuthNav from '@/components/AuthNav'
import LevelBadge from '@/components/LevelBadge'
import FeedbackModal from '@/components/FeedbackModal'
import LanguageSelector from '@/components/LanguageSelector'
import VisitCounter from '@/components/VisitCounter'
import { LanguageProvider } from '@/lib/useLanguage'
import { generateWebsiteSchema, generateOrganizationSchema } from '@/lib/schema'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-clash',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'RoyaleHaus - Clash Royale Mini-Games, Quizzes & Card Wiki',
    template: '%s | RoyaleHaus'
  },
  description: 'Play free Clash Royale mini-games: Wordle, Higher or Lower, Impostor, and Royaledle. Complete card wiki with 168+ cards. Track progress, compete on leaderboards, and level up. Part of the Haus Universe.',
  keywords: [
    'clash royale', 'supercell', 'clash royale cards', 'clash royale quiz', 
    'clash royale wordle', 'clash royale game', 'clash royale trivia',
    'clash royale wiki', 'higher or lower', 'troops', 'spells', 'champions',
    'clash royale leaderboard', 'royalehaus', 'haus universe'
  ],
  authors: [{ name: 'RoyaleHaus Team' }],
  creator: 'RoyaleHaus',
  publisher: 'RoyaleHaus',
  metadataBase: new URL('https://royalehaus.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://royalehaus.com',
    siteName: 'RoyaleHaus',
    title: 'RoyaleHaus - Clash Royale Mini-Games & Wiki',
    description: 'Play free Clash Royale mini-games: Wordle, Higher or Lower, Impostor, and Royaledle. Complete card wiki with 168+ cards. Part of the Haus Universe.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RoyaleHaus - Clash Royale Mini-Games',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoyaleHaus - Clash Royale Mini-Games & Wiki',
    description: 'Play free Clash Royale mini-games: Wordle, Higher or Lower, Impostor, and Royaledle. Complete card wiki with 168+ cards.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-cr.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#b45309" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JSON-LD Schema Markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateWebsiteSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
        />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen bg-black text-amber-100 relative overflow-x-hidden wallpaper-body`}>
        <LanguageProvider>
        {/* Decorative overlays */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,225,150,0.15),transparent_60%)] z-10 wallpaper-global-overlay"/>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,180,80,0.12),transparent_55%)] z-10 wallpaper-global-overlay"/>
        
        <div className="relative flex min-h-screen flex-col z-20 wallpaper-content">
          <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
            {/* Dark themed background */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 opacity-95 header-bg-overlay"></div>
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

              {/* Mobile Menu Button */}
              <button
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                type="button"
                aria-haspopup="dialog"
                aria-expanded="false"
                data-state="closed"
              >
                <svg
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                >
                  <path
                    d="M3 6h18M3 12h18M3 18h18"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="sr-only">Toggle Menu</span>
              </button>
              
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  <a className="inline-flex items-center rounded-lg font-extrabold text-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground py-2 px-4 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent md:hidden" href="/">
                    ROYALEHAUS
                  </a>
                </div>
                <nav className="flex items-center space-x-4">
                  <VisitCounter />
                  <WallpaperSelector />
                  <LevelBadge />
                  <FeedbackModal />
                  <LanguageSelector />
                  <AuthNav />
                </nav>
              </div>
            </div>
          </header>

          {/* Haus Universe Bar */}
          <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-900/30">
            <div className="container flex items-center justify-center gap-3 py-1.5 px-4">
              <div className="flex items-center gap-3">
                {/* OnePieceHaus */}
                <a 
                  href="https://onepiecehaus.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-amber-500/10 transition group"
                >
                  <img src="/images/onepiece-logo.svg" alt="" className="w-5 h-5" />
                  <span className="text-xs font-bold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:to-yellow-100">ONEPIECEHAUS</span>
                </a>
                
                <span className="text-amber-700/50">•</span>
                
                {/* RoyaleHaus (current) */}
                <a 
                  href="/"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/25"
                >
                  <img src="/favicon-cr.png" alt="" className="w-5 h-5" />
                  <span className="text-xs font-bold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">ROYALEHAUS</span>
                </a>
              </div>
            </div>
          </div>
          
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
        </LanguageProvider>
      </body>
    </html>
  )
}
