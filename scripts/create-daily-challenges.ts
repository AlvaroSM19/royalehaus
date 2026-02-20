import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get date from command line argument or use today
  const dateArg = process.argv[2];
  const today = dateArg || new Date().toISOString().slice(0, 10);
  
  console.log(`Creating/checking daily challenges for ${today}...\n`);

  const gameTypes = ['royaledle', 'emoji-riddle', 'pixel-royale'];

  for (const gameType of gameTypes) {
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date: today, gameType } },
    });

    if (challenge) {
      console.log(`✅ ${gameType}: Challenge exists (Card ID: ${challenge.cardId})`);
    } else {
      console.log(`❌ ${gameType}: No challenge found`);
      console.log(`   - Creating a challenge with a random card...`);
      
      // Create a challenge with a random card (1-109)
      const randomCardId = Math.floor(Math.random() * 109) + 1;
      const newChallenge = await prisma.dailyChallenge.create({
        data: {
          date: today,
          gameType,
          cardId: randomCardId,
        },
      });
      
      console.log(`   - ✓ Created challenge with Card ID: ${newChallenge.cardId}`);
    }
  }

  console.log(`\n✅ All challenges ready for ${today}!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
