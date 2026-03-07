import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Pixel Royale - Guess the Pixelated Clash Royale Card',
  description: 'Guess the Clash Royale card from a pixelated image! Each wrong guess reveals more clarity. Daily challenge with 6 attempts.',
  keywords: ['pixel royale', 'pixelated card', 'blur game', 'clash royale quiz', 'image guessing', 'daily challenge'],
  openGraph: {
    title: 'Pixel Royale - Guess the Pixelated Card | Clash Royale',
    description: 'Guess the Clash Royale card from a pixelated image! Each guess reveals more clarity.',
    url: 'https://clashroyaledle.net/games/pixel-royale',
    images: ['/images/games/6.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixel Royale - Guess the Pixelated Card',
    description: 'Guess the Clash Royale card from a pixelated image!',
    images: ['/images/games/6.webp'],
  },
  alternates: {
    canonical: '/games/pixel-royale',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Games', url: 'https://clashroyaledle.net/#games' },
  { name: 'Pixel Royale', url: 'https://clashroyaledle.net/games/pixel-royale' },
]);

export default function PixelRoyaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS['pixel-royale']) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
