import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import WallpaperSelector from '@/components/WallpaperSelector'
import AuthNav from '@/components/AuthNav'
import LevelBadge from '@/components/LevelBadge'
import FeedbackModal from '@/components/FeedbackModal'
import LanguageSelector from '@/components/LanguageSelector'
import VisitCounter from '@/components/VisitCounter'
import MobileMenu from '@/components/MobileMenu'
import CookieNotice from '@/components/CookieNotice'
import { LanguageProvider } from '@/lib/useLanguage'
import { generateWebsiteSchema, generateOrganizationSchema } from '@/lib/schema'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-clash',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Clash Royale – Clash Royale Mini Games & Quizzes | Free Online',
    template: '%s | Clash Royale'
  },
  description: 'Play free Clash Royale mini games online: Higher or Lower elixir game, Card Quiz, Connections, Royale Wordle, Memory Cards, Royaledle, and Impostor. Test your knowledge of troops, spells, champions, elixir costs and rarities.',
  keywords: [
    // Primary keywords
    'clash royale games', 'clash royale mini games', 'clash royale games online free',
    // Higher or Lower specific
    'clash royale higher lower', 'clash royale higher or lower', 'clash royale elixir game', 'guess the elixir clash royale', 'clash royale elixir higher lower',
    // Quiz keywords
    'clash royale quiz', 'clash royale trivia', 'clash royale card quiz', 'clash royale quizzes',
    // Wordle keywords
    'clash royale wordle', 'royaledle', 'clash royale guessing game', 'guess the clash royale card',
    // Connections keywords
    'clash royale connections', 'clash royale puzzle game', 'clash royale card connections',
    // Memory game keywords
    'clash royale memory game', 'clash royale matching game', 'clash royale memory cards',
    // Impostor keywords
    'clash royale impostor', 'clash royale odd one out', 'clash royale spot the fake',
    // Card keywords
    'troops', 'spells', 'champions', 'buildings', 'legendary', 'epic', 'rare', 'common',
    // Feature keywords
    'elixir cost game', 'card rarity quiz', 'clash royale cards', 'supercell'
  ],
  authors: [{ name: 'Clash Royale Team' }],
  creator: 'Clash Royale',
  publisher: 'Clash Royale',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://clashroyaledle.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://clashroyaledle.net',
    title: 'Clash Royale – Clash Royale Mini Games & Quizzes',
    description: 'Practice cards, elixir costs, rarities & card types while playing fast mini games.',
    siteName: 'Clash Royale',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Clash Royale – Clash Royale Mini Games & Quizzes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clash Royale – Clash Royale Mini Games & Quizzes',
    description: 'Play interactive Clash Royale themed mini games: Wordle, Connections, Memory Cards & more.',
    images: ['/og-image.png'],
    creator: '@clashroyale',
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
      { url: '/images/iconos/cr-icon.jpg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/images/iconos/cr-icon.jpg', sizes: '16x16', type: 'image/jpeg' },
    ],
    apple: '/images/iconos/cr-icon.jpg',
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
                    CLASH ROYALE
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

              {/* Mobile Menu */}
              <MobileMenu />
              
              <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                <div className="w-full flex-1 md:w-auto md:flex-none">
                  <a className="inline-flex items-center rounded-lg font-extrabold text-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground py-2 px-4 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent md:hidden" href="/">
                    CLASH ROYALE
                  </a>
                </div>
                {/* Desktop: all icons, Mobile: only wallpaper */}
                <nav className="flex items-center space-x-2 sm:space-x-4">
                  <span className="hidden sm:inline-flex"><VisitCounter /></span>
                  <WallpaperSelector />
                  <span className="hidden sm:inline-flex"><LevelBadge /></span>
                  <span className="hidden sm:inline-flex"><FeedbackModal /></span>
                  <LanguageSelector />
                  <span className="hidden md:inline-flex"><AuthNav /></span>
                </nav>
              </div>
            </div>
          </header>

          {/* Haus Universe Bar */}
          <div className="w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-amber-900/30 overflow-hidden">
            <div className="container flex items-center justify-center gap-3 py-1.5 px-2 sm:px-4">
              <div className="haus-bar-links flex items-center gap-2 sm:gap-3 whitespace-nowrap">
                {/* ONE PIECE */}
                <a 
                  href="https://onepiecehaus.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md hover:bg-amber-500/10 transition group"
                >
                  <img src="/images/iconos/op-icon.png" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-bold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:to-yellow-100">ONE PIECE</span>
                </a>
                
                <span className="text-amber-700/50 text-xs">•</span>
                
                {/* CLASH ROYALE (current) */}
                <a 
                  href="/"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/25"
                >
                  <img src="/images/iconos/cr-icon.jpg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-bold tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">CLASH ROYALE</span>
                </a>

                <span className="text-amber-700/50 text-xs">•</span>

                {/* JJK */}
                <a 
                  href="https://jjkdle.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md hover:bg-purple-500/15 transition group"
                >
                  <img src="/images/iconos/jjk-icon.jpg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-bold tracking-wide bg-gradient-to-r from-purple-300 via-fuchsia-200 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-200 group-hover:to-fuchsia-100">JJK</span>
                </a>

                <span className="text-amber-700/50 text-xs">•</span>

                {/* GAME OF THRONES */}
                <a 
                  href="https://gameofthronesdle.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md hover:bg-red-500/15 transition group"
                >
                  <img src="/images/iconos/got-icon.jpg" alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[10px] sm:text-xs font-bold tracking-wide bg-gradient-to-r from-red-300 via-orange-200 to-red-400 bg-clip-text text-transparent group-hover:from-red-200 group-hover:to-orange-100">GAME OF THRONES</span>
                </a>
              </div>
            </div>
          </div>
          
          <main className="flex-1">
            {children}
          </main>
          
          <footer className="py-4 sm:py-6 px-4 md:px-8 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-3 sm:gap-4 md:h-24 md:flex-row">
              <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground md:text-left">
                Built by{" "}
                <a
                  href="https://github.com/clashroyale"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  Clash Royale Team
                </a>
                . Fan project - Not affiliated with Supercell.
              </p>
              <div className="flex items-center space-x-4">
                <a href="/privacy" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                  Privacy
                </a>
                <a href="/terms" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground">
                  Terms
                </a>
              </div>
            </div>
          </footer>
        </div>
        <CookieNotice />
        </LanguageProvider>
      </body>
    </html>
  )
}
