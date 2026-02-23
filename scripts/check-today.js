const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log('Today:', today);
  
  const challenges = await p.dailyChallenge.findMany({
    where: { date: today }
  });
  
  console.log('Challenges:', JSON.stringify(challenges, null, 2));
  
  if (challenges.length === 0) {
    console.log('\nNo challenges found! Creating them...');
    const GAME_TYPES = ['royaledle', 'emoji-riddle', 'sound-quiz'];
    for (const gameType of GAME_TYPES) {
      const cardId = Math.floor(Math.random() * 168) + 1;
      const created = await p.dailyChallenge.upsert({
        where: { date_gameType: { date: today, gameType } },
        create: { date: today, gameType, cardId },
        update: {},
      });
      console.log(`Created ${gameType}: cardId=${created.cardId}`);
    }
  }
  
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
