import type { Metadata } from 'next'
import { generateBreadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Flashcards - Learn Clash Royale Cards',
  description: 'Study Clash Royale cards with interactive flashcards. Learn elixir costs, rarities, and card types. Perfect for memorizing card stats.',
  keywords: ['clash royale flashcards', 'learn cards', 'study cards', 'card stats', 'elixir cost', 'card rarity'],
  openGraph: {
    title: 'Flashcards - Learn Clash Royale Cards | Clash Royale',
    description: 'Study Clash Royale cards with interactive flashcards.',
    url: 'https://clashroyaledle.net/cards/flashcards',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Flashcards - Learn Clash Royale Cards',
    description: 'Study Clash Royale cards with interactive flashcards.',
  },
  alternates: {
    canonical: '/cards/flashcards',
  },
}

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Cards', url: 'https://clashroyaledle.net/cards' },
  { name: 'Flashcards', url: 'https://clashroyaledle.net/cards/flashcards' },
])

export default function FlashcardsLayout({ children }: { children: React.ReactNode }) {
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
