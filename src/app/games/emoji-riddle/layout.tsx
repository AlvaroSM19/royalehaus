import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
    image: '/images/games/8.webp',
  title: 'Emoji Riddle - Descifra la Carta con Emojis',
  description: 'Descifra qué carta de Clash Royale representan los emojis. ¡Cada emoji incorrecto revela una nueva pista!',
  keywords: ['emoji riddle', 'emoji game', 'clash royale emoji', 'emoji quiz', 'card guessing'],
  openGraph: {
    title: 'Emoji Riddle - Descifra la Carta con Emojis | RoyaleHaus',
    description: 'Descifra qué carta de Clash Royale representan los emojis. ¡Pistas emoji!',
    url: 'https://royalehaus.com/games/emoji-riddle',
    images: ['/images/games/7.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emoji Riddle - Descifra la Carta con Emojis',
    description: 'Descifra qué carta representan los emojis!',
    images: ['/images/games/7.webp'],
  },
  alternates: {
    canonical: '/games/emoji-riddle',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://royalehaus.com' },
  { name: 'Games', url: 'https://royalehaus.com/#games' },
  { name: 'Emoji Riddle', url: 'https://royalehaus.com/games/emoji-riddle' },
]);

export default function EmojiRiddleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(GAME_SCHEMAS['emoji-riddle']) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
