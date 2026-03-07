import type { Metadata } from 'next'
import { generateBreadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Logbook - Your Game History',
  description: 'Track your Clash Royale mini-games progress. View your game history, daily streaks, XP earned, and stats across all games.',
  keywords: ['logbook', 'game history', 'progress tracker', 'daily streak', 'XP tracker', 'clash royale stats'],
  openGraph: {
    title: 'Logbook - Your Game History | Clash Royale',
    description: 'Track your progress across all Clash Royale mini-games.',
    url: 'https://clashroyaledle.net/logbook',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Logbook - Your Game History',
    description: 'Track your progress across all Clash Royale mini-games.',
  },
  alternates: {
    canonical: '/logbook',
  },
}

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Logbook', url: 'https://clashroyaledle.net/logbook' },
])

export default function LogbookLayout({ children }: { children: React.ReactNode }) {
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
