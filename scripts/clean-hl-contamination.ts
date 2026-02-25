/**
 * One-time migration: Clean Higher-or-Lower cross-platform contamination
 * 
 * Background:
 * A bug in extractAppProgress() caused OnePieceHaus root-level data to be
 * read as RoyaleHaus data and merged into the 'royale' namespace. This means
 * users who played H/L on OnePieceHaus had their best streaks copied into
 * royale.highScores.higherlower.
 *
 * This script:
 * 1. Reads all Progress records
 * 2. For each, checks if royale.highScores.higherlower matches root-level highScores.higherlower
 * 3. If they match (contamination), removes H/L data from the royale namespace
 * 4. Also cleans OnePieceHaus-only game IDs from royale.stats.gamesPlayedById
 * 
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/clean-hl-contamination.ts
 * Or:  npx tsx scripts/clean-hl-contamination.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OnePieceHaus-only game IDs that should never appear in the royale namespace
const ONEPIECE_ONLY_GAMES = ['connections', 'tictactoe', 'crewquiz', 'grid', 'onepiecedle', 'tapone_op'];

async function main() {
  console.log('🔍 Scanning Progress records for H/L contamination...\n');

  const rows = await prisma.progress.findMany({
    include: { user: { select: { id: true, username: true } } }
  });

  let cleaned = 0;
  let skipped = 0;

  for (const row of rows) {
    let data: any;
    try { data = JSON.parse(row.data); } catch { continue; }

    const rootHL = data?.highScores?.higherlower;
    const royale = data?.royale;
    const royaleHL = royale?.highScores?.higherlower;

    let modified = false;

    // Check 1: H/L contamination - royale H/L matches root H/L (copied from OnePieceHaus)
    if (rootHL && royaleHL) {
      if (royaleHL.bestStreak === rootHL.bestStreak) {
        console.log(`  🧹 ${(row as any).user?.username || row.userId}: Removing contaminated H/L (bestStreak=${royaleHL.bestStreak}, matches OnePieceHaus)`);
        delete royale.highScores.higherlower;
        modified = true;
      }
    }

    // Check 2: Even without root match, if royale has H/L but user has 0 H/L games played on royale, 
    // the H/L data was likely contaminated
    if (royaleHL && !modified) {
      const royaleHLGames = royale?.stats?.gamesPlayedById?.higherlower || 0;
      if (royaleHLGames === 0 && rootHL) {
        console.log(`  🧹 ${(row as any).user?.username || row.userId}: Removing H/L data (0 royale games but has score - likely contamination)`);
        delete royale.highScores.higherlower;
        modified = true;
      }
    }

    // Check 3: Remove OnePieceHaus-only game IDs from royale namespace
    if (royale?.stats?.gamesPlayedById) {
      for (const opGame of ONEPIECE_ONLY_GAMES) {
        if (royale.stats.gamesPlayedById[opGame]) {
          console.log(`  🧹 ${(row as any).user?.username || row.userId}: Removing OnePieceHaus game "${opGame}" from royale stats`);
          delete royale.stats.gamesPlayedById[opGame];
          modified = true;
        }
      }
    }

    // Check 4: Recalculate gamesPlayedTotal if we removed games
    if (modified && royale?.stats) {
      const ROYALE_GAME_IDS = ['royaledle', 'higherlower', 'impostor', 'wordle', 'tapone', 'pixel-royale', 'emoji-riddle', 'sound-quiz', 'memory'];
      const byId = royale.stats.gamesPlayedById || {};
      royale.stats.gamesPlayedTotal = ROYALE_GAME_IDS.reduce((sum: number, id: string) => sum + (typeof byId[id] === 'number' ? byId[id] : 0), 0);
    }

    if (modified) {
      data.royale = royale;
      await prisma.progress.update({
        where: { id: row.id },
        data: { data: JSON.stringify(data) }
      });
      cleaned++;
    } else {
      skipped++;
    }
  }

  console.log(`\n✅ Done! Cleaned ${cleaned} records, skipped ${skipped}`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
