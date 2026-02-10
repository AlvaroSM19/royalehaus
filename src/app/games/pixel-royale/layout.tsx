import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Pixel Royale - Adivina la Carta Pixelada',
  description: 'Juega a Pixel Royale y demuestra cuánto sabes de Clash Royale. Adivina la carta oculta mientras la imagen se va revelando poco a poco.',
  keywords: ['pixel royale', 'pixelated card', 'blur game', 'clash royale quiz', 'image guessing'],
  image: '/images/games/6.webp',
  openGraph: {
    title: 'Pixel Royale - Adivina la Carta Pixelada | RoyaleHaus',
    description: 'Juega a Pixel Royale y adivina la carta oculta mientras la imagen se revela.',
    url: 'https://royalehaus.com/games/pixel-royale',
    images: ['/images/games/6.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pixel Royale - Adivina la Carta Pixelada',
    description: 'Adivina la carta oculta mientras la imagen se revela!',
    images: ['/images/games/6.webp'],
  },
  alternates: {
    canonical: '/games/pixel-royale',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://royalehaus.com' },
  { name: 'Games', url: 'https://royalehaus.com/#games' },
  { name: 'Pixel Royale', url: 'https://royalehaus.com/games/pixel-royale' },
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
