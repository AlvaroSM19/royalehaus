import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Higher or Lower - Clash Royale Elixir Game',
  description: 'Play Higher or Lower with Clash Royale cards! Guess if the next card costs more or less elixir. How long can you keep your streak going?',
  keywords: ['higher or lower', 'clash royale elixir', 'elixir game', 'card comparison', 'streak game', 'clash royale quiz'],
  openGraph: {
    title: 'Higher or Lower - Clash Royale Elixir Game | Clash Royale',
    description: 'Guess if the next Clash Royale card costs more or less elixir. Challenge your knowledge!',
    url: 'https://clashroyaledle.net/games/higher-lower',
    images: ['/images/games/2.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Higher or Lower - Clash Royale Elixir Game',
    description: 'Guess if the next card costs more or less elixir!',
    images: ['/images/games/2.webp'],
  },
  alternates: {
    canonical: '/games/higher-lower',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Games', url: 'https://clashroyaledle.net/#games' },
  { name: 'Higher or Lower', url: 'https://clashroyaledle.net/games/higher-lower' },
]);

export default function HigherLowerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS['higher-lower']) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
