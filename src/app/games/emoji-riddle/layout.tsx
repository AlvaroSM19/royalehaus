import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Emoji Riddle - Decode the Clash Royale Card from Emojis',
  description: 'Decode which Clash Royale card the emojis represent! Each wrong guess reveals a new emoji clue. Daily challenge with 5 attempts.',
  keywords: ['emoji riddle', 'emoji game', 'clash royale emoji', 'emoji quiz', 'card guessing', 'daily challenge'],
  openGraph: {
    title: 'Emoji Riddle - Decode the Card from Emojis | Clash Royale',
    description: 'Decode which Clash Royale card the emojis represent! Each wrong guess reveals a new clue.',
    url: 'https://clashroyaledle.net/games/emoji-riddle',
    images: ['/images/games/8.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emoji Riddle - Decode the Card from Emojis',
    description: 'Decode which Clash Royale card the emojis represent!',
    images: ['/images/games/8.webp'],
  },
  alternates: {
    canonical: '/games/emoji-riddle',
  },
};

const breadcrumbs = generateBreadcrumbSchema([
  { name: 'Home', url: 'https://clashroyaledle.net' },
  { name: 'Games', url: 'https://clashroyaledle.net/#games' },
  { name: 'Emoji Riddle', url: 'https://clashroyaledle.net/games/emoji-riddle' },
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
