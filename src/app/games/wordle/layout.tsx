import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Clash Royale Wordle - Guess the Card Name',
  description: 'Play Wordle with Clash Royale card names! Guess the hidden card name letter by letter. Green, yellow, and gray hints guide you.',
  keywords: ['clash royale wordle', 'wordle game', 'card name game', 'word puzzle', 'letter guessing', 'clash royale game'],
  openGraph: {
    title: 'Clash Royale Wordle - Guess the Card Name | Clash Royale',
    description: 'Play Wordle with Clash Royale card names! Guess the hidden card name letter by letter.',
    url: 'https://clashroyaledle.net/games/wordle',
    images: ['/images/games/4.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clash Royale Wordle - Guess the Card Name',
    description: 'Play Wordle with Clash Royale card names!',
    images: ['/images/games/4.webp'],
  },
  alternates: {
    canonical: '/games/wordle',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Games', url: 'https://clashroyaledle.net/#games' },
  { name: 'Wordle', url: 'https://clashroyaledle.net/games/wordle' },
]);

export default function WordleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS.wordle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
