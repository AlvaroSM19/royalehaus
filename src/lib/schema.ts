// JSON-LD Schema Markup for SEO
// See: https://schema.org/VideoGame and https://schema.org/WebApplication

export interface GameSchemaProps {
  name: string;
  description: string;
  url: string;
  image: string;
  gameType?: string;
}

export function generateGameSchema(props: GameSchemaProps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: props.name,
    description: props.description,
    url: props.url,
    image: props.image,
    genre: ['Quiz', 'Trivia', 'Puzzle'],
    gamePlatform: ['Web Browser', 'Mobile Web'],
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Organization',
      name: 'RoyaleHaus',
      url: 'https://royalehaus.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RoyaleHaus',
      url: 'https://royalehaus.com',
    },
    inLanguage: ['en', 'es'],
    isAccessibleForFree: true,
  };
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'RoyaleHaus',
    alternateName: 'Royale Haus',
    url: 'https://royalehaus.com',
    description: 'Free Clash Royale mini-games, quizzes, and complete card wiki. Part of the Haus Universe.',
    inLanguage: ['en', 'es'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://royalehaus.com/cards?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RoyaleHaus',
      url: 'https://royalehaus.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://royalehaus.com/favicon-cr.png',
      },
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RoyaleHaus',
    url: 'https://royalehaus.com',
    logo: 'https://royalehaus.com/favicon-cr.png',
    description: 'Free Clash Royale mini-games platform with quizzes and card wiki.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Spanish'],
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Pre-built schemas for each game
export const GAME_SCHEMAS = {
  royaledle: generateGameSchema({
    name: 'Royaledle - Clash Royale Card Guessing Game',
    description: 'Guess the mystery Clash Royale card by comparing attributes. Daily challenge and unlimited practice mode available.',
    url: 'https://royalehaus.com/games/royaledle',
    image: 'https://royalehaus.com/images/games/1.webp',
  }),
  
  'higher-lower': generateGameSchema({
    name: 'Higher or Lower - Clash Royale Elixir Game',
    description: 'Compare Clash Royale cards and guess if the next one costs more or less elixir. Build your streak!',
    url: 'https://royalehaus.com/games/higher-lower',
    image: 'https://royalehaus.com/images/games/2.webp',
  }),
  
  impostor: generateGameSchema({
    name: 'Find the Impostor - Clash Royale Quiz',
    description: 'Spot the fake card among real Clash Royale cards. Test your knowledge of card attributes!',
    url: 'https://royalehaus.com/games/impostor',
    image: 'https://royalehaus.com/images/games/3.webp',
  }),
  
  wordle: generateGameSchema({
    name: 'Clash Royale Wordle',
    description: 'Guess the Clash Royale card name letter by letter. Green, yellow, and gray hints guide you!',
    url: 'https://royalehaus.com/games/wordle',
    image: 'https://royalehaus.com/images/games/4.webp',
  }),
  
  tapone: generateGameSchema({
    name: 'Tap One - Speed Card Game',
    description: 'Tap the correct Clash Royale card before time runs out! Test your reflexes and card knowledge.',
    url: 'https://royalehaus.com/games/tapone',
    image: 'https://royalehaus.com/images/games/5.webp',
  }),
  
  'pixel-royale': generateGameSchema({
    name: 'Pixel Royale - Guess the Pixelated Card',
    description: 'Guess the Clash Royale card from a pixelated/blurred image. Each guess reveals more clarity!',
    url: 'https://royalehaus.com/games/pixel-royale',
    image: 'https://royalehaus.com/images/games/6.webp',
  }),
  
  'emoji-riddle': generateGameSchema({
    name: 'Emoji Riddle - Decode the Card',
    description: 'Decode which Clash Royale card the emojis represent. Wrong guesses reveal more clues!',
    url: 'https://royalehaus.com/games/emoji-riddle',
    image: 'https://royalehaus.com/images/games/7.webp',
  }),
  
  'sound-quiz': generateGameSchema({
    name: 'Sound Quiz - Guess by Audio',
    description: 'Listen to the sound and guess which Clash Royale card it belongs to!',
    url: 'https://royalehaus.com/games/sound-quiz',
    image: 'https://royalehaus.com/images/games/8.webp',
  }),
};
