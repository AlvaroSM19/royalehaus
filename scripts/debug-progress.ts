/**
 * Debug: Inspect Progress records to understand H/L data structure
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.progress.findMany({
    include: { user: { select: { id: true, username: true } } }
  });

  for (const row of rows) {
    let data: any;
    try { data = JSON.parse(row.data); } catch { continue; }

    const username = (row as any).user?.username || row.userId;
    
    console.log(`\n=== ${username} ===`);
    
    // Root level H/L
    const rootHL = data?.highScores?.higherlower;
    if (rootHL) console.log(`  Root H/L: bestStreak=${rootHL.bestStreak}, updatedAt=${rootHL.updatedAt}`);
    
    // Root level stats
    const rootGames = data?.stats?.gamesPlayedById;
    if (rootGames) console.log(`  Root games:`, JSON.stringify(rootGames));
    
    // Royale namespace
    const royale = data?.royale;
    if (royale) {
      const royaleHL = royale?.highScores?.higherlower;
      if (royaleHL) console.log(`  Royale H/L: bestStreak=${royaleHL.bestStreak}, updatedAt=${royaleHL.updatedAt}`);
      else console.log(`  Royale H/L: (none)`);
      
      const royaleGames = royale?.stats?.gamesPlayedById;
      if (royaleGames) console.log(`  Royale games:`, JSON.stringify(royaleGames));
      
      // All high scores
      console.log(`  Royale highScores keys:`, Object.keys(royale?.highScores || {}));
    } else {
      console.log(`  Royale namespace: (none)`);
    }
    
    // Other namespaces
    const keys = Object.keys(data).filter(k => !['version','calendar','stats','highScores','stickers','cards','meta','user','royale','onepiece','jjk'].includes(k));
    if (keys.length) console.log(`  Other keys:`, keys);
  }
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
