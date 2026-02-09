// XP rules for RoyaleHaus games
// Each function returns { kind: string; amount: number } | null

interface XpGrant {
  kind: string;
  amount: number;
}

// XP values for different game events
const XP_VALUES = {
  // Royaledle (guess the card)
  royaledle: {
    win: 100,
    firstTry: 200,    // Bonus for guessing on first attempt
    quickWin: 50,     // Bonus for winning in <= 3 attempts
  },
  // Higher or Lower
  higherlower: {
    base: 20,         // Per correct guess
    streak5: 50,      // Bonus at 5 streak
    streak10: 100,    // Bonus at 10 streak
    streak25: 250,    // Bonus at 25 streak
  },
  // Impostor
  impostor: {
    correct: 30,      // Per correct identification
    streak3: 50,      // Bonus at 3 streak
    streak5: 100,     // Bonus at 5 streak
    streak10: 200,    // Bonus at 10 streak
  },
  // Wordle
  wordle: {
    win: 80,
    firstTry: 200,
    quickWin: 50,     // <= 3 attempts
  },
  // Tap One
  tapone: {
    base: 10,         // Base XP per game
    rank1: 200,       // Bonus for rank 1
    rank5: 100,       // Bonus for top 5
    rank10: 50,       // Bonus for top 10
  },
};

export function computeGameXp(gameId: string, data: any): XpGrant | null {
  switch (gameId) {
    case 'royaledle': {
      if (!data.won) return null;
      let amount = XP_VALUES.royaledle.win;
      if (data.attempts === 1) amount += XP_VALUES.royaledle.firstTry;
      else if (data.attempts <= 3) amount += XP_VALUES.royaledle.quickWin;
      return { kind: `game:royaledle:win`, amount };
    }
    
    case 'higherlower': {
      const streak = data.streak || 0;
      if (streak <= 0) return null;
      let amount = XP_VALUES.higherlower.base * streak;
      // Add milestone bonuses
      if (streak >= 25) amount += XP_VALUES.higherlower.streak25;
      else if (streak >= 10) amount += XP_VALUES.higherlower.streak10;
      else if (streak >= 5) amount += XP_VALUES.higherlower.streak5;
      return { kind: `game:higherlower:streak`, amount };
    }
    
    case 'impostor': {
      const streak = data.streak || 0;
      if (streak <= 0) return null;
      let amount = XP_VALUES.impostor.correct * streak;
      // Add milestone bonuses
      if (streak >= 10) amount += XP_VALUES.impostor.streak10;
      else if (streak >= 5) amount += XP_VALUES.impostor.streak5;
      else if (streak >= 3) amount += XP_VALUES.impostor.streak3;
      return { kind: `game:impostor:streak`, amount };
    }
    
    case 'wordle': {
      if (!data.won) return null;
      const attempt = data.attempt || 6;
      let amount = XP_VALUES.wordle.win;
      if (attempt === 1) amount += XP_VALUES.wordle.firstTry;
      else if (attempt <= 3) amount += XP_VALUES.wordle.quickWin;
      // Bonus for longer words
      const wordLength = data.wordLength || 5;
      if (wordLength > 5) amount += (wordLength - 5) * 20;
      return { kind: `game:wordle:win`, amount };
    }
    
    case 'tapone': {
      const score = data.score || 0;
      const rank = data.rank || 20;
      let amount = XP_VALUES.tapone.base + Math.floor(score / 10);
      // Add rank bonuses
      if (rank === 1) amount += XP_VALUES.tapone.rank1;
      else if (rank <= 5) amount += XP_VALUES.tapone.rank5;
      else if (rank <= 10) amount += XP_VALUES.tapone.rank10;
      return { kind: `game:tapone:complete`, amount };
    }
    
    default:
      return null;
  }
}
