import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Royale Guesser - Find All Matching Cards',
  description: 'Play Royale Guesser! Given 3 conditions, find all Clash Royale cards that match. Test your knowledge of card types, rarities, elixir costs and more!',
  keywords: ['royale guesser', 'clash royale quiz', 'card finder', 'clash royale conditions', 'card matching game'],
  openGraph: {
    title: 'Royale Guesser - Find All Matching Cards | RoyaleHaus',
    description: 'Given 3 conditions, find all Clash Royale cards that match. Test your knowledge!',
    url: 'https://royalehaus.com/games/royale-guesser',
    images: ['/images/games/royale-guesser.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Royale Guesser - Find All Matching Cards',
    description: 'Given 3 conditions, find all Clash Royale cards that match!',
    images: ['/images/games/royale-guesser.webp'],
  },
  alternates: {
    canonical: '/games/royale-guesser',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://royalehaus.com' },
  { name: 'Games', url: 'https://royalehaus.com/#games' },
  { name: 'Royale Guesser', url: 'https://royalehaus.com/games/royale-guesser' },
]);

export default function RoyaleGuesserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            GAME_SCHEMAS.royaleGuesser,
            breadcrumbs,
          ]),
        }}
      />
      {children}
    </>
  );
}
