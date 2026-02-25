/**
 * One-time migration: Move RoyaleHaus progress data into the 'royale' namespace
 * 
 * Background:
 * The shared Progress table stores all app data in a single JSON field.
 * RoyaleHaus added a 'royale' namespace pattern but existing data is at root level.
 * This script creates the 'royale' namespace and moves RoyaleHaus-relevant data into it.
 *
 * For SHARED games (higherlower, impostor, wordle, tapone) we copy the data into
 * the royale namespace since the user played on RoyaleHaus.
 * For OnePieceHaus-only games we leave them at root level.
 *
 * Run: $env:DATABASE_URL="..."; npx tsx scripts/migrate-to-royale-namespace.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// RoyaleHaus game IDs (all games that exist on RoyaleHaus)
const ROYALE_GAME_IDS = ['royaledle', 'higherlower', 'impostor', 'wordle', 'tapone', 'pixel-royale', 'emoji-riddle', 'sound-quiz', 'memory'];
// Aliases that might appear in the data
const ROYALE_GAME_ALIASES: Record<string, string> = { 'pixel': 'pixel-royale' };

async function main() {
  console.log('🔍 Migrating Progress records to royale namespace...\n');

  const rows = await prisma.progress.findMany({
    include: { user: { select: { id: true, username: true } } }
  });

  let migrated = 0;
  let skipped = 0;

  for (const row of rows) {
    let data: any;
    try { data = JSON.parse(row.data); } catch { continue; }

    const username = (row as any).user?.username || row.userId;

    // Skip if royale namespace already exists
    if (data.royale) {
      console.log(`  ⏭️  ${username}: royale namespace already exists, skipping`);
      skipped++;
      continue;
    }

    // Check if this user has any RoyaleHaus-relevant data
    const rootGames = data?.stats?.gamesPlayedById || {};
    const rootHighScores = data?.highScores || {};
    
    // Check for any RoyaleHaus game activity (including aliases)
    const allGameKeys = Object.keys(rootGames);
    const hasRoyaleData = allGameKeys.some(k => 
      ROYALE_GAME_IDS.includes(k) || Object.keys(ROYALE_GAME_ALIASES).includes(k)
    ) || Object.keys(rootHighScores).some(k => ROYALE_GAME_IDS.includes(k));

    if (!hasRoyaleData) {
      console.log(`  ⏭️  ${username}: No RoyaleHaus data found, skipping`);
      skipped++;
      continue;
    }

    // Build royale namespace progress
    const royaleGamesById: Record<string, number> = {};
    let royaleTotal = 0;
    
    for (const [gameId, count] of Object.entries(rootGames)) {
      // Map aliases
      const normalizedId = ROYALE_GAME_ALIASES[gameId] || gameId;
      if (ROYALE_GAME_IDS.includes(normalizedId) && typeof count === 'number') {
        royaleGamesById[normalizedId] = (royaleGamesById[normalizedId] || 0) + count;
        royaleTotal += count;
      }
    }

    // Build royale high scores (only for games that exist on RoyaleHaus)
    const royaleHighScores: Record<string, any> = {};
    for (const [gameId, hs] of Object.entries(rootHighScores)) {
      if (ROYALE_GAME_IDS.includes(gameId) && hs && typeof hs === 'object') {
        royaleHighScores[gameId] = { ...hs as any };
      }
    }

    const royaleProgress = {
      version: data.version || 1,
      calendar: [...(data.calendar || [])], // Calendar is shared, copy it
      stats: {
        gamesPlayedTotal: royaleTotal,
        gamesPlayedById: royaleGamesById
      },
      highScores: royaleHighScores,
      stickers: [...(data.stickers || [])], // Copy stickers
      cards: [...(data.cards || [])],
      meta: { ...(data.meta || {}) },
      user: { ...(data.user || {}) }
    };

    // Add royale namespace to data (keep root data intact for OnePieceHaus)
    data.royale = royaleProgress;

    console.log(`  ✅ ${username}: Migrated to royale namespace`);
    console.log(`     Games: ${JSON.stringify(royaleGamesById)}`);
    console.log(`     HighScores: ${Object.keys(royaleHighScores).join(', ') || '(none)'}`);
    console.log(`     Total: ${royaleTotal} games`);

    await prisma.progress.update({
      where: { id: row.id },
      data: { data: JSON.stringify(data) }
    });

    migrated++;
  }

  console.log(`\n✅ Done! Migrated ${migrated} records, skipped ${skipped}`);
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
