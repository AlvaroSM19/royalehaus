import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`Checking daily challenges for ${today}...\n`);

  const gameTypes = ['royaledle', 'emoji-riddle', 'pixel-royale'];

  for (const gameType of gameTypes) {
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { date_gameType: { date: today, gameType } },
    });

    if (challenge) {
      console.log(`✅ ${gameType}: Challenge exists (Card ID: ${challenge.cardId})`);
      
      // Count participations
      const participations = await prisma.dailyParticipation.findMany({
        where: { challengeId: challenge.id },
        include: { challenge: true }
      });
      
      console.log(`   - Total participations: ${participations.length}`);
      console.log(`   - Completed: ${participations.filter(p => p.completed).length}`);
      console.log(`   - Won: ${participations.filter(p => p.won).length}`);
    } else {
      console.log(`❌ ${gameType}: No challenge found for today`);
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
    console.log('');
  }

  console.log('\nAll daily challenges checked and created if needed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
