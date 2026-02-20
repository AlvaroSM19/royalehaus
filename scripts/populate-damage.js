/**
 * Script to populate damage_lvl_11 for all cards
 * Based on official Clash Royale Tournament Level (Level 11) stats
 * 
 * Run with: node scripts/populate-damage.js
 */

const fs = require('fs');
const path = require('path');

// Damage values at Tournament Level (Level 11) for each card
// Source: Official Clash Royale stats, wiki data
// null = card doesn't deal direct damage (e.g., buildings that spawn, defensive spells)
const DAMAGE_DATA = {
  // Troops
  "Knight": 202,
  "Archers": 107,
  "Goblins": 120,
  "Giant": 254,
  "P.E.K.K.A": 816,
  "Minions": 120,
  "Balloon": 374,
  "Witch": 107,
  "Barbarians": 202,
  "Golem": 318,
  "Skeletons": 81,
  "Valkyrie": 243,
  "Skeleton Army": 81,
  "Bomber": 243,
  "Musketeer": 218,
  "Baby Dragon": 160,
  "Prince": 392,
  "Wizard": 281,
  "Mini P.E.K.K.A": 598,
  "Spear Goblins": 81,
  "Giant Skeleton": 190,
  "Hog Rider": 318,
  "Minion Horde": 120,
  "Ice Wizard": 107,
  "Royal Giant": 254,
  "Three Musketeers": 218,
  "Dark Prince": 254,
  "Princess": 175,
  "Fire Spirit": 218,
  "Guards": 107,
  "Lava Hound": 45,
  "Miner": 175,
  "Sparky": 1430,
  "Ice Spirit": 107,
  "Bowler": 310,
  "Lumberjack": 254,
  "Mega Minion": 281,
  "Inferno Dragon": 100,
  "Ice Golem": 81,
  "Elite Barbarians": 310,
  "Electro Wizard": 218,
  "Dart Goblin": 120,
  "Executioner": 198,
  "Battle Ram": 254,
  "Goblin Gang": 120,
  "Bandit": 218,
  "Night Witch": 218,
  "Bats": 81,
  "Cannon Cart": 218,
  "Skeleton Barrel": 81,
  "Flying Machine": 165,
  "Magic Archer": 120,
  "Royal Hogs": 81,
  "Wall Breakers": 374,
  "Rascals": 120,
  "Zappies": 107,
  "Hunter": 107,
  "Goblin Giant": 175,
  "Royal Recruits": 160,
  "Electro Dragon": 218,
  "Ram Rider": 254,
  "Fisherman": 175,
  "Elixir Golem": 107,
  "Battle Healer": 160,
  "Skeleton Dragons": 120,
  "Firecracker": 120,
  "Electro Spirit": 107,
  "Mother Witch": 120,
  "Goblin Drill": 218,
  "Electro Giant": 218,
  "Phoenix": 218,
  "Monk": 202,
  "Little Prince": 120,
  "Mega Knight": 318,
  "Royal Ghost": 243,
  "Goblin Demolisher": 374,
  "Suspicious Bush": 120,
  "Rune Giant": 318,
  "Berserker": 281,
  "Spirit Empress": 107,
  "Void": 218,
  "Goblin Curse": 175,
  "Vines": 81,
  "Goblinstein": 318,
  "Boss Bandit": 318,
  "Tower Princess": 120,
  "Royal Chef": 175,
  "Goblin Machine": 175,
  
  // Evolution Cards (format: "Name Evolution")
  "Knight Evolution": 243,
  "Archers Evolution": 128,
  "Skeletons Evolution": 97,
  "Barbarians Evolution": 243,
  "Royal Giant Evolution": 305,
  "Mortar Evolution": 291,
  "Bats Evolution": 97,
  "Bomber Evolution": 291,
  "Ice Spirit Evolution": 128,
  "Zap Evolution": 262,
  "Skeleton Barrel Evolution": 97,
  "Firecracker Evolution": 144,
  "Royal Recruits Evolution": 192,
  "Valkyrie Evolution": 291,
  "Musketeer Evolution": 262,
  "Battle Ram Evolution": 305,
  "Wizard Evolution": 337,
  "Royal Hogs Evolution": 97,
  "Dart Goblin Evolution": 144,
  "Goblin Cage Evolution": 192,
  "Baby Dragon Evolution": 192,
  "Skeleton Army Evolution": 97,
  "Witch Evolution": 128,
  "P.E.K.K.A Evolution": 979,
  "Hunter Evolution": 128,
  "Electro Dragon Evolution": 262,
  "Wall Breakers Evolution": 449,
  "Executioner Evolution": 238,
  "Goblin Giant Evolution": 210,
  "Goblin Barrel Evolution": 144,
  "Goblin Drill Evolution": 262,
  "Mega Knight Evolution": 382,
  "Inferno Dragon Evolution": 120,
  "Lumberjack Evolution": 305,
  "Royal Ghost Evolution": 291,
  "Cannon Evolution": 210,
  "Tesla Evolution": 210,
  "Giant Snowball Evolution": 262,
  "Furnace Evolution": 262,
  "Goblin Hut Evolution": null,
  "Elixir Collector Evolution": null,
  "Mega Minion Evolution": 337,
  
  // Hero Cards
  "Hero Knight": 243,
  "Hero Mini P.E.K.K.A": 718,
  "Hero Musketeer": 262,
  "Hero Giant": 305,
  
  // Spells
  "Arrows": 362,
  "Fireball": 689,
  "Lightning": 1056,
  "Rocket": 1760,
  "Zap": 218,
  "Poison": 120,
  "Freeze": null,
  "Mirror": null,
  "Rage": null,
  "Clone": null,
  "Tornado": 98,
  "Graveyard": 81,
  "The Log": 362,
  "Barbarian Barrel": 243,
  "Giant Snowball": 218,
  "Earthquake": 176,
  "Royal Delivery": 362,
  "Goblin Barrel": 360,
  "Heal Spirit": null,
  "Electro Shot": 175,
  
  // Buildings
  "Cannon": 175,
  "Tesla": 175,
  "Bomb Tower": 218,
  "Inferno Tower": 100,
  "Mortar": 243,
  "X-Bow": 35,
  "Tombstone": null,
  "Goblin Hut": null,
  "Elixir Collector": null,
  "Barbarian Hut": null,
  "Furnace": null,
  "Goblin Cage": 160,
  
  // Champions
  "Skeleton King": 254,
  "Archer Queen": 362,
  "Golden Knight": 254,
  "Mighty Miner": 218,
  
  // Tower Troops
  "Cannoneer": 189,
  "Dagger Duchess": 126
};

// Main script
const cardsPath = path.join(__dirname, '..', 'src', 'data', 'cards.json');

// Read current cards
let cards;
try {
  const data = fs.readFileSync(cardsPath, 'utf8');
  cards = JSON.parse(data);
  console.log(`Loaded ${cards.length} cards`);
} catch (err) {
  console.error('Error reading cards.json:', err.message);
  process.exit(1);
}

// Add damage_lvl_11 to each card
let updated = 0;
let notFound = [];

cards = cards.map(card => {
  // Look up damage by card name
  const damage = DAMAGE_DATA[card.name];
  
  if (damage !== undefined) {
    card.damage_lvl_11 = damage;
    updated++;
  } else {
    // Card not in our data - set to null
    card.damage_lvl_11 = null;
    notFound.push(card.name);
  }
  
  return card;
});

// BUSINESS REQUIREMENT: Change Furnace type from Building to Troop
cards = cards.map(card => {
  if (card.name === 'Furnace' && card.type === 'Building') {
    console.log('>>> OVERRIDE: Changing Furnace type from Building to Troop');
    card.type = 'Troop';
    // Since it's now a Troop, we should add attack properties
    card.attackType = 'ranged'; // Fire Spirits are ranged
    card.targetAir = true;
    card.attackSpeed = 'medium';
    card.damage_lvl_11 = 218; // Fire Spirit damage
  }
  return card;
});

// Write updated cards
try {
  fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
  console.log(`\n✅ Updated ${updated} cards with damage_lvl_11`);
  
  if (notFound.length > 0) {
    console.log(`\n⚠️ Cards without damage data (set to null): ${notFound.length}`);
    console.log(notFound.join(', '));
  }
  
  console.log('\n✅ Successfully updated cards.json');
} catch (err) {
  console.error('Error writing cards.json:', err.message);
  process.exit(1);
}
