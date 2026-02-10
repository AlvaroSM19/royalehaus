import type { Metadata } from 'next'
import { generateGameSchema, generateBreadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Royale Memory - Match Card Pairs | RoyaleHaus',
  description: 'Test your memory matching Clash Royale card pairs! Find counters, evolutions, and synergies in this challenging memory game.',
  keywords: ['Clash Royale', 'memory game', 'card matching', 'counters', 'evolutions', 'brain game', 'puzzle'],
  image: '/images/games/7.webp',
  openGraph: {
    title: 'Royale Memory - Match Card Pairs',
    description: 'Test your memory matching Clash Royale card pairs! Find counters, evolutions, and synergies.',
    type: 'website',
    siteName: 'RoyaleHaus',
    images: ['/images/games/7.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royale Memory - Match Card Pairs',
    description: 'Test your memory matching Clash Royale card pairs!',
    images: ['/images/games/7.webp'],
  },
}

export default function MemoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Royale Memory",
    "description": "Memory matching game with Clash Royale cards. Match counters, evolutions, and synergies.",
    "gamePlatform": "Web Browser",
    "genre": ["Puzzle", "Memory", "Card Game"],
    "applicationCategory": "Game",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://royalehaus.com' },
    { name: 'Games', url: 'https://royalehaus.com/games' },
    { name: 'Royale Memory', url: 'https://royalehaus.com/games/memory' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
