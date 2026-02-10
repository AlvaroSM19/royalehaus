import type { Metadata } from 'next'
import { generateGameSchema, generateBreadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Stat Battle - Guess the Higher Stat | RoyaleHaus',
  description: 'Compare Clash Royale card stats in this VS battle game! Guess which card has higher damage, elixir cost, or other attributes.',
  keywords: ['Clash Royale', 'stat battle', 'card comparison', 'damage', 'elixir', 'VS game', 'trivia'],
  openGraph: {
    title: 'Stat Battle - Guess the Higher Stat',
    description: 'Compare Clash Royale card stats in this VS battle game!',
    type: 'website',
    siteName: 'RoyaleHaus',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stat Battle - Guess the Higher Stat',
    description: 'Compare Clash Royale card stats in this VS battle game!',
  },
}

export default function StatBattleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Stat Battle",
    "description": "Compare Clash Royale card stats. Guess which card has higher damage, elixir, or other attributes.",
    "gamePlatform": "Web Browser",
    "genre": ["Trivia", "Card Game", "Quiz"],
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
    { name: 'Stat Battle', url: 'https://royalehaus.com/games/stat-battle' },
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
