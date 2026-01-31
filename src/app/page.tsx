import Link from 'next/link'
import Image from 'next/image'

const games = [
  { 
    id: 'higher-lower', 
    title: 'HIGHER OR LOWER', 
    image: '/images/games/1.webp',
    href: '/games/higher-lower', 
  },
  { 
    id: 'impostor', 
    title: 'IMPOSTOR', 
    image: '/images/games/2.webp',
    href: '/games/impostor', 
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
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 gap-10">
            {games.map((game) => (
              <Link
                key={game.id}
                href={game.href}
                className="group block overflow-hidden rounded-2xl border-4 border-amber-400/60 hover:border-yellow-400 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-400/30 hover:-translate-y-2"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 py-4 px-4 border-t-2 border-amber-500/50">
                  <h3 className="text-center font-black text-amber-100 text-2xl tracking-wider drop-shadow-md">
                    {game.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cards Wiki Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black text-yellow-400 mb-4 uppercase tracking-widest">
            Cards Wiki
          </h2>
          <p className="text-blue-200/70 mb-8">
            Explore our complete database of 168 Clash Royale cards
          </p>
          
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-700/50">
              <div className="text-2xl font-black text-yellow-400">79</div>
              <div className="text-blue-300/70 text-sm uppercase tracking-wider">Troops</div>
            </div>
            <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-700/50">
              <div className="text-2xl font-black text-yellow-400">21</div>
              <div className="text-blue-300/70 text-sm uppercase tracking-wider">Spells</div>
            </div>
            <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-700/50">
              <div className="text-2xl font-black text-yellow-400">13</div>
              <div className="text-blue-300/70 text-sm uppercase tracking-wider">Buildings</div>
            </div>
            <div className="bg-blue-900/40 p-4 rounded-xl border border-blue-700/50">
              <div className="text-2xl font-black text-yellow-400">8</div>
              <div className="text-blue-300/70 text-sm uppercase tracking-wider">Champions</div>
            </div>
          </div>

          <Link
            href="/cards"
            className="inline-block px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-amber-900 font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-yellow-500/30"
          >
            Explore All Cards
          </Link>
        </div>
      </section>
    </div>
  )
}
