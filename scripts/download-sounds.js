/**
 * Sound Download Helper for Clash Royale Sound Quiz
 * 
 * This script provides a mapping of card IDs to their sound effect names,
 * making it easier to organize sound files for the Sound Quiz game.
 * 
 * USAGE:
 *   node scripts/download-sounds.js
 * 
 * SOUND FILE NAMING:
 *   Place .mp3 files in: public/sounds/cards/{cardId}.mp3
 *   Example: public/sounds/cards/1.mp3  → Knight
 *            public/sounds/cards/5.mp3  → P.E.K.K.A
 *            public/sounds/cards/22.mp3 → Hog Rider
 * 
 * SOURCES FOR SOUNDS:
 *   - Clash Royale Wiki: https://clashroyale.fandom.com/wiki/
 *   - Each card page has a "Sound Effects" section with deploy/attack/death sounds
 *   - Download deploy sounds for the quiz game
 */

const fs = require('fs');
const path = require('path');

// Cards that should have sound files for the quiz
const CARDS_FOR_SOUNDS = [
  // Troops with distinctive sounds
  { id: 1, name: 'Knight', soundDesc: 'Deploy grunt' },
  { id: 5, name: 'P.E.K.K.A', soundDesc: 'Robotic stomp & butterfly' },
  { id: 7, name: 'Balloon', soundDesc: 'Balloon inflate & float' },
  { id: 8, name: 'Witch', soundDesc: 'Evil cackle' },
  { id: 9, name: 'Barbarians', soundDesc: 'War cry' },
  { id: 10, name: 'Golem', soundDesc: 'Heavy stone thud' },
  { id: 12, name: 'Valkyrie', soundDesc: 'Battle scream' },
  { id: 13, name: 'Skeleton Army', soundDesc: 'Bones rattling' },
  { id: 16, name: 'Baby Dragon', soundDesc: 'Small roar' },
  { id: 17, name: 'Prince', soundDesc: 'Horse gallop & lance' },
  { id: 18, name: 'Wizard', soundDesc: 'Fire spell cast' },
  { id: 22, name: 'Hog Rider', soundDesc: 'HOG RIDAAAA scream' },
  { id: 24, name: 'Ice Wizard', soundDesc: 'Frost blast' },
  { id: 25, name: 'Royal Giant', soundDesc: 'Giant cannon shot' },
  { id: 31, name: 'Lava Hound', soundDesc: 'Deep lava rumble' },
  { id: 33, name: 'Sparky', soundDesc: 'Electric charge up' },
  { id: 36, name: 'Lumberjack', soundDesc: 'Axe swing & laugh' },
  { id: 38, name: 'Inferno Dragon', soundDesc: 'Beam charging' },
  { id: 40, name: 'Elite Barbarians', soundDesc: 'Aggressive war cry' },
  { id: 41, name: 'Electro Wizard', soundDesc: 'Electric zap & laugh' },
  { id: 46, name: 'Bandit', soundDesc: 'Dash sound' },
  { id: 50, name: 'Mega Knight', soundDesc: 'Heavy metal stomp & landing' },
  { id: 62, name: 'Ram Rider', soundDesc: 'Ram charge' },
  { id: 73, name: 'Phoenix', soundDesc: 'Fire bird cry' },
  // Spells
  { id: 80, name: 'Arrows', soundDesc: 'Arrow volley whistle' },
  { id: 81, name: 'Zap', soundDesc: 'Electric zap burst' },
  { id: 82, name: 'Fireball', soundDesc: 'Fireball explosion' },
  { id: 84, name: 'Rocket', soundDesc: 'Rocket launch & explosion' },
  { id: 85, name: 'Lightning', soundDesc: 'Thunder strike' },
  { id: 86, name: 'Freeze', soundDesc: 'Ice crystallize' },
  { id: 90, name: 'The Log', soundDesc: 'Wood rolling' },
  { id: 92, name: 'Tornado', soundDesc: 'Wind vortex' },
  // Champions
  { id: 114, name: 'Golden Knight', soundDesc: 'Golden dash ability' },
  { id: 115, name: 'Archer Queen', soundDesc: 'Cloak ability' },
  { id: 116, name: 'Skeleton King', soundDesc: 'Soul summon' },
  { id: 118, name: 'Monk', soundDesc: 'Pensive reflect ability' },
];

// Ensure sounds directory exists
const soundsDir = path.join(__dirname, '..', 'public', 'sounds', 'cards');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log('✅ Created directory:', soundsDir);
}

// Check which sounds we already have
const existingFiles = fs.readdirSync(soundsDir)
  .filter(f => f.endsWith('.mp3') || f.endsWith('.ogg') || f.endsWith('.wav'));

const existingIds = new Set(existingFiles.map(f => parseInt(f.split('.')[0], 10)));

console.log('\n🔊 Clash Royale Sound Quiz - Sound Management');
console.log('='.repeat(60));
console.log(`\n📁 Sound directory: ${soundsDir}`);
console.log(`📊 Total cards mapped: ${CARDS_FOR_SOUNDS.length}`);
console.log(`✅ Existing sounds: ${existingIds.size}`);
console.log(`❌ Missing sounds: ${CARDS_FOR_SOUNDS.length - existingIds.size}\n`);

console.log('Card Status:');
console.log('-'.repeat(60));

CARDS_FOR_SOUNDS.forEach(card => {
  const status = existingIds.has(card.id) ? '✅' : '❌';
  const fileName = `${card.id}.mp3`;
  console.log(`${status} ${fileName.padEnd(10)} ${card.name.padEnd(20)} ${card.soundDesc}`);
});

const missing = CARDS_FOR_SOUNDS.filter(c => !existingIds.has(c.id));
if (missing.length > 0) {
  console.log(`\n\n📝 Missing Sounds (${missing.length}):`);
  console.log('-'.repeat(60));
  missing.forEach(card => {
    const wikiUrl = `https://clashroyale.fandom.com/wiki/${card.name.replace(/ /g, '_')}`;
    console.log(`  ${card.id}.mp3 → ${card.name}`);
    console.log(`    Wiki: ${wikiUrl}`);
    console.log(`    Sound: ${card.soundDesc}`);
  });
  console.log('\n📌 Download deploy sounds from the wiki and save as {id}.mp3');
  console.log(`   into: ${soundsDir}`);
} else {
  console.log('\n🎉 All sounds are present!');
}
