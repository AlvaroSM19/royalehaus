import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Find the Impostor - Clash Royale Quiz',
  description: 'Spot the fake card among real Clash Royale cards! Test your knowledge of card attributes in this fast-paced quiz game.',
  keywords: ['impostor game', 'clash royale quiz', 'find the fake', 'card quiz', 'trivia game', 'odd one out'],
  openGraph: {
    title: 'Find the Impostor - Clash Royale Quiz | Clash Royale',
    description: 'Spot the fake card among real Clash Royale cards! Test your knowledge in this quiz.',
    url: 'https://clashroyaledle.net/games/impostor',
    images: ['/images/games/3.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find the Impostor - Clash Royale Quiz',
    description: 'Spot the fake card among real Clash Royale cards!',
    images: ['/images/games/3.webp'],
  },
  alternates: {
    canonical: '/games/impostor',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Games', url: 'https://clashroyaledle.net/#games' },
  { name: 'Impostor', url: 'https://clashroyaledle.net/games/impostor' },
]);

export default function ImpostorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS.impostor) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
