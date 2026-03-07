import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Royaledle - Guess the Clash Royale Card',
  description: 'Play Royaledle and guess the mystery Clash Royale card! Compare attributes like elixir, type, rarity, and year. Daily challenge + unlimited practice mode.',
  keywords: ['royaledle', 'clash royale wordle', 'clash royale guessing game', 'card quiz', 'daily challenge', 'guess the card'],
  openGraph: {
    title: 'Royaledle - Guess the Clash Royale Card | Clash Royale',
    description: 'Play Royaledle and guess the mystery Clash Royale card! Compare attributes like elixir, type, rarity, and year.',
    url: 'https://clashroyaledle.net/games/royaledle',
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
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Games', url: 'https://clashroyaledle.net/#games' },
  { name: 'Royaledle', url: 'https://clashroyaledle.net/games/royaledle' },
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
