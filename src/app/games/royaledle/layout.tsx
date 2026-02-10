import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Royaledle - Guess the Clash Royale Card',
  description: 'Play Royaledle and guess the mystery Clash Royale card! Compare attributes like elixir, type, rarity, and year. Daily challenge + unlimited practice mode.',
  keywords: ['royaledle', 'clash royale wordle', 'clash royale guessing game', 'card quiz', 'daily challenge'],
  openGraph: {
    title: 'Royaledle - Guess the Clash Royale Card | RoyaleHaus',
    description: 'Play Royaledle and guess the mystery Clash Royale card! Compare attributes like elixir, type, rarity, and year.',
    url: 'https://royalehaus.com/games/royaledle',
    images: ['/images/games/1.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royaledle - Guess the Clash Royale Card',
    description: 'Play Royaledle and guess the mystery Clash Royale card!',
    images: ['/images/games/1.webp'],
  },
  alternates: {
    canonical: '/games/royaledle',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://royalehaus.com' },
  { name: 'Games', url: 'https://royalehaus.com/#games' },
  { name: 'Royaledle', url: 'https://royalehaus.com/games/royaledle' },
]);

export default function RoyaledleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS.royaledle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
