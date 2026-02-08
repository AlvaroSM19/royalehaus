import Link from 'next/link'
import Image from 'next/image'

const games = [
  { 
    id: 'impostor', 
    title: 'IMPOSTOR', 
    image: '/images/games/2.webp',
    href: '/games/impostor', 
  },
  { 
    id: 'tapone', 
    title: 'TAP ONE', 
    image: '/images/games/5.webp',
    href: '/games/tapone', 
  },
  { 
    id: 'higher-lower', 
    title: 'HIGHER OR LOWER', 
    image: '/images/games/1.webp',
    href: '/games/higher-lower', 
  },
  { 
    id: 'royaledle', 
    title: 'ROYALEDLE', 
    image: '/images/games/3.webp',
    href: '/games/royaledle', 
  },
  { 
    id: 'wordle', 
    title: 'WORDLE', 
    image: '/images/games/4.webp',
    href: '/games/wordle', 
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Games Grid */}
      <section className="px-6 sm:px-10 pt-10 pb-20">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {games.map((game) => (
              <Link
                key={game.id}
                href={game.href}
                className="group block rounded-xl overflow-hidden relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_40px_rgba(245,180,50,0.15)]"
                style={{
                  border: '2px solid rgba(180, 140, 60, 0.35)',
                  background: 'linear-gradient(180deg, rgba(30, 25, 18, 0.6) 0%, rgba(20, 18, 12, 0.8) 100%)',
                }}
              >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {/* Gradient overlay on image bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  {/* Hover shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/0 via-amber-300/0 to-amber-200/0 group-hover:from-amber-400/5 group-hover:via-amber-300/10 group-hover:to-amber-200/5 transition-all duration-500" />
                </div>

                {/* Title bar */}
                <div 
                  className="py-3 px-4"
                  style={{
                    background: 'linear-gradient(90deg, rgba(42, 35, 22, 0.95) 0%, rgba(55, 45, 28, 0.95) 50%, rgba(42, 35, 22, 0.95) 100%)',
                    borderTop: '1px solid rgba(180, 140, 60, 0.25)',
                  }}
                >
                  <h3 
                    className="text-center text-[13px] font-extrabold tracking-[0.25em] uppercase"
                    style={{
                      background: 'linear-gradient(180deg, #f5d485 0%, #c9a44a 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: 'none',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                    }}
                  >
                    {game.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cards Wiki Section */}
      <section className="px-6 sm:px-10 pb-16">
        <div className="max-w-[1100px] mx-auto">
          <div 
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(18, 15, 8, 0.95) 0%, rgba(12, 10, 5, 0.98) 100%)',
              border: '2px solid rgba(180, 140, 60, 0.2)',
              boxShadow: '0 4px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(180, 140, 60, 0.1)',
            }}
          >
            {/* Subtle decorative glow */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px]"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(200, 165, 70, 0.5) 50%, transparent 100%)' }}
            />
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-24 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center top, rgba(200, 165, 70, 0.06) 0%, transparent 70%)' }}
            />

            <div className="relative px-8 py-10 sm:px-12 sm:py-12">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200, 165, 70, 0.5))' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-amber-500/50">Database</span>
                  <div className="w-8 h-[1px]" style={{ background: 'linear-gradient(90deg, rgba(200, 165, 70, 0.5), transparent)' }} />
                </div>
                <h2 
                  className="text-3xl sm:text-4xl font-black uppercase tracking-[0.15em]"
                  style={{
                    background: 'linear-gradient(180deg, #ffe6a0 0%, #d4a843 40%, #a07830 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  }}
                >
                  Cards Wiki
                </h2>
                <p className="text-amber-100/30 mt-3 text-sm tracking-wide font-medium">
                  168 cards from the complete Clash Royale universe
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-3 sm:gap-4 mb-10">
                {[
                  { count: '79', label: 'Troops', accent: '#4ade80' },
                  { count: '21', label: 'Spells', accent: '#60a5fa' },
                  { count: '13', label: 'Buildings', accent: '#f97316' },
                  { count: '8', label: 'Champions', accent: '#c084fc' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="relative group py-5 px-3 rounded-lg text-center overflow-hidden"
                    style={{
                      background: 'linear-gradient(180deg, rgba(30, 26, 16, 0.8) 0%, rgba(18, 16, 10, 0.9) 100%)',
                      border: '1px solid rgba(180, 140, 60, 0.12)',
                    }}
                  >
                    {/* Top accent line */}
                    <div 
                      className="absolute top-0 left-[20%] right-[20%] h-[1px] opacity-60"
                      style={{ background: `linear-gradient(90deg, transparent, ${stat.accent}40, transparent)` }}
                    />
                    <div 
                      className="text-3xl sm:text-4xl font-black"
                      style={{ color: stat.accent, filter: `drop-shadow(0 0 8px ${stat.accent}30)` }}
                    >
                      {stat.count}
                    </div>
                    <div className="text-amber-100/30 text-[10px] sm:text-xs uppercase tracking-[0.25em] mt-2 font-bold">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <Link
                  href="/cards"
                  className="group/btn inline-flex items-center gap-3 px-8 py-3.5 rounded-lg font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(200, 165, 70, 0.15) 0%, rgba(160, 120, 50, 0.1) 100%)',
                    border: '1px solid rgba(200, 165, 70, 0.3)',
                    color: '#d4a843',
                  }}
                >
                  <span>Explore All Cards</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
