// TAP ONE Categories for Clash Royale
// Each category has 9 cards ranked from best (index 0) to worst (index 8)
// IMPORTANT: Every card appears in EXACTLY ONE category (no duplicates)

export interface TapOneElement {
  id: number;       // Card ID from cards.json
  name: string;     // Card name
}

export interface TapOneCategory {
  id: string;
  label: string;
  icon: string;     // Emoji icon for the category
  elements: TapOneElement[];
}

// 10 categories × 9 cards each = 90 unique ranked cards
export const categories: TapOneCategory[] = [
  {
    id: 'tanks',
    label: 'TANKS',
    icon: '🛡️',
    elements: [
      { id: 10, name: 'Golem' },
      { id: 71, name: 'Electro Giant' },
      { id: 50, name: 'Mega Knight' },
      { id: 5, name: 'P.E.K.K.A' },
      { id: 4, name: 'Giant' },
      { id: 21, name: 'Giant Skeleton' },
      { id: 25, name: 'Royal Giant' },
      { id: 39, name: 'Ice Golem' },
      { id: 54, name: 'Cannon Cart' },
    ]
  },
  {
    id: 'win-conditions',
    label: 'WIN CONDITION',
    icon: '🏆',
    elements: [
      { id: 22, name: 'Hog Rider' },
      { id: 7, name: 'Balloon' },
      { id: 62, name: 'Ram Rider' },
      { id: 58, name: 'Royal Hogs' },
      { id: 52, name: 'Skeleton Barrel' },
      { id: 47, name: 'Battle Ram' },
      { id: 32, name: 'Miner' },
      { id: 63, name: 'Wall Breakers' },
      { id: 26, name: 'Three Musketeers' },
    ]
  },
  {
    id: 'spells',
    label: 'SPELLS',
    icon: '✨',
    elements: [
      { id: 84, name: 'Rocket' },
      { id: 85, name: 'Lightning' },
      { id: 82, name: 'Fireball' },
      { id: 89, name: 'Poison' },
      { id: 92, name: 'Tornado' },
      { id: 80, name: 'Arrows' },
      { id: 90, name: 'The Log' },
      { id: 81, name: 'Zap' },
      { id: 95, name: 'Giant Snowball' },
    ]
  },
  {
    id: 'buildings',
    label: 'BUILDINGS',
    icon: '🏰',
    elements: [
      { id: 108, name: 'X-Bow' },
      { id: 104, name: 'Inferno Tower' },
      { id: 107, name: 'Tesla' },
      { id: 105, name: 'Bomb Tower' },
      { id: 101, name: 'Cannon' },
      { id: 103, name: 'Mortar' },
      { id: 111, name: 'Furnace' },
      { id: 109, name: 'Tombstone' },
      { id: 110, name: 'Barbarian Hut' },
    ]
  },
  {
    id: 'cycle',
    label: 'CYCLE',
    icon: '🔄',
    elements: [
      { id: 11, name: 'Skeletons' },
      { id: 34, name: 'Ice Spirit' },
      { id: 70, name: 'Electro Spirit' },
      { id: 29, name: 'Fire Spirit' },
      { id: 68, name: 'Heal Spirit' },
      { id: 2, name: 'Archers' },
      { id: 1, name: 'Knight' },
      { id: 15, name: 'Musketeer' },
      { id: 30, name: 'Guards' },
    ]
  },
  {
    id: 'splash',
    label: 'SPLASH',
    icon: '💥',
    elements: [
      { id: 12, name: 'Valkyrie' },
      { id: 35, name: 'Bowler' },
      { id: 18, name: 'Wizard' },
      { id: 43, name: 'Executioner' },
      { id: 16, name: 'Baby Dragon' },
      { id: 8, name: 'Witch' },
      { id: 14, name: 'Bomber' },
      { id: 67, name: 'Firecracker' },
      { id: 33, name: 'Dark Prince' },
    ]
  },
  {
    id: 'legendary',
    label: 'LEGENDARY',
    icon: '⭐',
    elements: [
      { id: 72, name: 'Mother Witch' },
      { id: 56, name: 'Magic Archer' },
      { id: 41, name: 'Electro Wizard' },
      { id: 46, name: 'Bandit' },
      { id: 36, name: 'Lumberjack' },
      { id: 55, name: 'Royal Ghost' },
      { id: 28, name: 'Princess' },
      { id: 44, name: 'Night Witch' },
      { id: 64, name: 'Fisherman' },
    ]
  },
  {
    id: 'goblins',
    label: 'GOBLINS',
    icon: '👺',
    elements: [
      { id: 83, name: 'Goblin Barrel' },
      { id: 113, name: 'Goblin Drill' },
      { id: 45, name: 'Goblin Gang' },
      { id: 42, name: 'Dart Goblin' },
      { id: 112, name: 'Goblin Cage' },
      { id: 102, name: 'Goblin Hut' },
      { id: 3, name: 'Goblins' },
      { id: 20, name: 'Spear Goblins' },
      { id: 60, name: 'Goblin Giant' },
    ]
  },
  {
    id: 'air',
    label: 'AIR',
    icon: '🦅',
    elements: [
      { id: 31, name: 'Lava Hound' },
      { id: 37, name: 'Mega Minion' },
      { id: 38, name: 'Inferno Dragon' },
      { id: 23, name: 'Minion Horde' },
      { id: 6, name: 'Minions' },
      { id: 69, name: 'Skeleton Dragons' },
      { id: 51, name: 'Flying Machine' },
      { id: 66, name: 'Electro Dragon' },
      { id: 48, name: 'Bats' },
    ]
  },
  {
    id: 'fighters',
    label: 'FIGHTERS',
    icon: '⚔️',
    elements: [
      { id: 27, name: 'Sparky' },
      { id: 17, name: 'Prince' },
      { id: 19, name: 'Mini P.E.K.K.A' },
      { id: 40, name: 'Elite Barbarians' },
      { id: 13, name: 'Skeleton Army' },
      { id: 9, name: 'Barbarians' },
      { id: 59, name: 'Royal Recruits' },
      { id: 53, name: 'Hunter' },
      { id: 57, name: 'Rascals' },
    ]
  },
];

// Rank information for scoring
export interface RankInfo {
  rank: number;
  title: string;
  trophies: number;
}

export const RANKS: RankInfo[] = [
  { rank: 1, title: '🏆 ULTIMATE CHAMPION', trophies: 9000 },
  { rank: 2, title: '👑 GRAND CHAMPION', trophies: 8500 },
  { rank: 3, title: '💎 ROYAL CHAMPION', trophies: 8000 },
  { rank: 4, title: '⚡ CHAMPION', trophies: 7500 },
  { rank: 5, title: '🌟 MASTER III', trophies: 7000 },
  { rank: 6, title: '✨ MASTER II', trophies: 6500 },
  { rank: 7, title: '💫 MASTER I', trophies: 6000 },
  { rank: 8, title: '🔥 CHALLENGER III', trophies: 5500 },
  { rank: 9, title: '⭐ CHALLENGER II', trophies: 5000 },
  { rank: 10, title: '🎯 CHALLENGER I', trophies: 4600 },
  { rank: 11, title: '🏅 LEGENDARY ARENA', trophies: 4000 },
  { rank: 12, title: '🎖️ ARENA 14', trophies: 3500 },
  { rank: 13, title: '🥇 ARENA 13', trophies: 3000 },
  { rank: 14, title: '🥈 ARENA 12', trophies: 2500 },
  { rank: 15, title: '🥉 ARENA 11', trophies: 2000 },
  { rank: 16, title: '📍 ARENA 10', trophies: 1500 },
  { rank: 17, title: '🎪 ARENA 9', trophies: 1000 },
  { rank: 18, title: '🏠 ARENA 8', trophies: 500 },
  { rank: 19, title: '🌱 ARENA 7', trophies: 200 },
  { rank: 20, title: '👶 TRAINING CAMP', trophies: 0 },
];

export function getRankByNumber(rank: number): RankInfo {
  return RANKS[Math.min(Math.max(rank, 1), 20) - 1];
}

export function getRankByScore(score: number): RankInfo {
  // Score range: 20*9=180 (all worst) to 100*9=900 (all best per category, but max is 10 categories)
  // Actually: 10 categories, each pick scores 110 - (index+1)*10
  // Best: 100*10 = 1000, Worst: 20*10 = 200
  let rank = 20;
  if (score >= 950) rank = 1;
  else if (score >= 900) rank = 2;
  else if (score >= 850) rank = 3;
  else if (score >= 800) rank = 4;
  else if (score >= 750) rank = 5;
  else if (score >= 700) rank = 6;
  else if (score >= 650) rank = 7;
  else if (score >= 600) rank = 8;
  else if (score >= 550) rank = 9;
  else if (score >= 500) rank = 10;
  else if (score >= 450) rank = 11;
  else if (score >= 400) rank = 12;
  else if (score >= 350) rank = 13;
  else if (score >= 300) rank = 14;
  else if (score >= 250) rank = 15;
  else if (score >= 200) rank = 16;
  else if (score >= 150) rank = 17;
  else if (score >= 100) rank = 18;
  else if (score >= 50) rank = 19;
  return getRankByNumber(rank);
}
