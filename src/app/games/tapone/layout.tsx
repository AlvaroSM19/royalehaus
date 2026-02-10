import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Tap One - Speed Card Selection Game',
  description: 'Tap the correct Clash Royale card before time runs out! Test your reflexes and card knowledge in this fast-paced mini-game.',
  keywords: ['tap one', 'speed game', 'reflex game', 'clash royale cards', 'quick quiz'],
  openGraph: {
    title: 'Tap One - Speed Card Selection Game | RoyaleHaus',
    description: 'Tap the correct Clash Royale card before time runs out! Fast-paced mini-game.',
    url: 'https://royalehaus.com/games/tapone',
    images: ['/images/games/5.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tap One - Speed Card Selection Game',
    description: 'Tap the correct card before time runs out!',
    images: ['/images/games/5.webp'],
  },
  alternates: {
    canonical: '/games/tapone',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://royalehaus.com' },
  { name: 'Games', url: 'https://royalehaus.com/#games' },
  { name: 'Tap One', url: 'https://royalehaus.com/games/tapone' },
]);

export default function TaponeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS.tapone) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
