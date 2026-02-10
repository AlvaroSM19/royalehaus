import { Metadata } from 'next';
import { GAME_SCHEMAS, generateBreadcrumbSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'Sound Quiz - Guess the Card by Sound',
  description: 'Test your Clash Royale knowledge by guessing cards from their sound effects!',
  keywords: ['sound quiz', 'audio game', 'clash royale sounds', 'card sounds', 'audio recognition'],
  image: '/images/games/9.webp',
  openGraph: {
    title: 'Sound Quiz - Guess the Card by Sound | RoyaleHaus',
    description: 'Test your Clash Royale knowledge by guessing cards from their sound effects!',
    url: 'https://royalehaus.com/games/sound-quiz',
    images: ['/images/games/9.webp'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sound Quiz - Guess the Card by Sound',
    description: 'Test your Clash Royale knowledge by guessing cards from their sound effects!',
    images: ['/images/games/9.webp'],
  },
  alternates: {
    canonical: '/games/sound-quiz',
  },
};

export default function SoundQuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gameSchema = GAME_SCHEMAS['sound-quiz'] || {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "Sound Quiz",
    "description": "Guess Clash Royale cards by their sound effects",
    "gamePlatform": "Web Browser",
    "genre": ["Quiz", "Audio Game"],
  };
  
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://royalehaus.com' },
    { name: 'Games', url: 'https://royalehaus.com/games' },
    { name: 'Sound Quiz', url: 'https://royalehaus.com/games/sound-quiz' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  )
}
