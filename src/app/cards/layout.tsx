import type { Metadata } from 'next'
import { generateBreadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Card Database - All Clash Royale Cards',
  description: 'Browse all Clash Royale cards. Filter by type, rarity, and elixir cost. View troops, spells, buildings, champions and evolutions with full stats.',
  keywords: ['clash royale cards', 'card database', 'clash royale troops', 'clash royale spells', 'card list', 'elixir cost', 'card rarity'],
  openGraph: {
    title: 'Card Database - All Clash Royale Cards | Clash Royale',
    description: 'Browse all Clash Royale cards. Filter by type, rarity, and elixir cost.',
    url: 'https://clashroyaledle.net/cards',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Card Database - All Clash Royale Cards',
    description: 'Browse all Clash Royale cards with filters and stats.',
  },
  alternates: {
    canonical: '/cards',
  },
}

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Cards', url: 'https://clashroyaledle.net/cards' },
])

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  )
}
