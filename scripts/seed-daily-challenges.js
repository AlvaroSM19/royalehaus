/**
 * Seed script to generate 30 days of daily challenges
 * Run with: node scripts/seed-daily-challenges.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GAME_TYPES = ['royaledle', 'emoji-riddle', 'pixel-royale'];
const TOTAL_CARDS = 168;

async function main() {
  console.log('🎮 Seeding daily challenges...\n');

  const today = new Date();
  const challenges = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);

    for (const gameType of GAME_TYPES) {
      // Check if exists
      const existing = await prisma.dailyChallenge.findUnique({
        where: { date_gameType: { date: dateStr, gameType } },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Random card ID (1-168)
      const cardId = Math.floor(Math.random() * TOTAL_CARDS) + 1;

      challenges.push({
        date: dateStr,
        gameType,
        cardId,
      });
    }
  }

  if (challenges.length > 0) {
    const result = await prisma.dailyChallenge.createMany({
      data: challenges,
      skipDuplicates: true,
    });
    created = result.count;
  }

  console.log(`✅ Created: ${created} challenges`);
  console.log(`⏭️  Skipped: ${skipped} (already exist)`);
  console.log('\n📅 Challenges for today:');

  const todayStr = today.toISOString().slice(0, 10);
  const todayChallenges = await prisma.dailyChallenge.findMany({
    where: { date: todayStr },
  });

  for (const c of todayChallenges) {
    console.log(`   - ${c.gameType}: Card #${c.cardId}`);
  }

  console.log('\n✨ Done!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
