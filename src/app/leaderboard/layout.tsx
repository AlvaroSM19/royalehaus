import type { Metadata } from 'next'
import { generateBreadcrumbSchema } from '@/lib/schema'

export const metadata: Metadata = {
  title: 'Leaderboard - Top Clash Royale Players',
  description: 'See the top players on the Clash Royale games leaderboard. Rankings by XP, games played, streaks, and more.',
  keywords: ['leaderboard', 'clash royale ranking', 'top players', 'XP leaderboard', 'best scores', 'clash royale stats'],
  openGraph: {
    title: 'Leaderboard - Top Players | Clash Royale',
    description: 'See the top players on the Clash Royale games leaderboard.',
    url: 'https://clashroyaledle.net/leaderboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard - Top Clash Royale Players',
    description: 'See the top players on the leaderboard.',
  },
  alternates: {
    canonical: '/leaderboard',
  },
}

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Leaderboard', url: 'https://clashroyaledle.net/leaderboard' },
])

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
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
