# 🏴‍☠️ AnimeHaus - One Piece Mini Games Platform

A modern web platform featuring interactive mini-games based on One Piece characters, built with Next.js 14 and TypeScript.

## 🎮 Available Games

### ✅ Character Grid
Classic 3x3 grid game featuring One Piece characters with crew and ability filters.

### ✅ Higher or Lower
Guess if the next character's bounty is higher or lower than the current one.

### ✅ Anime Wordle
Wordle-style game where you guess 5-letter One Piece character names in 6 tries.

### 🚧 Coming Soon
- **Guess the Character**: Identify characters from silhouettes or hints
- **Crew Matcher**: Match characters to their respective crews
- **Power Ranking**: Rank characters by their power levels

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📊 Features

- **168 One Piece Characters**: Complete database with bounties, crews, and abilities
- **Responsive Design**: Optimized for desktop and mobile
- **Score Tracking**: Local storage persistence
- **Modern UI**: Clean, anime-themed interface
- **Type Safety**: Full TypeScript implementation

## 🏗️ Project Structure

```
src/
├── app/
│   ├── characters/          # Character browsing page
│   ├── games/
│   │   ├── grid/           # Character Grid game
│   │   ├── higher-lower/   # Higher or Lower game
│   │   └── wordle/         # Anime Wordle game
│   └── page.tsx            # Homepage
├── components/
│   └── ui/                 # Reusable UI components
└── lib/
    └── anime-data.ts       # Character database
```

## 🎯 Game Mechanics

### Character Grid
- Navigate through characters using crew and ability filters
- Find specific characters in a 3x3 grid layout
- Visual feedback and scoring system

### Higher or Lower
- Compare character bounties
- Anti-repetition system for varied gameplay
- Streak tracking and score calculation

### Anime Wordle
- Guess 5-letter character names
- Color-coded feedback system
- Hint system with character details
- Virtual and physical keyboard support

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🌐 Deployment

This project is optimized for deployment on Vercel with automatic builds from the GitHub repository.

## 📈 Database

The character database includes:
- 168 One Piece characters
- Bounty information
- Crew affiliations
- Haki abilities
- Origin locations
- Character images

## 🤝 Contributing

This project uses a branch-based development workflow:
- `master`: Production-ready code
- `ALVARO`: Feature development branch
- `ADRIAN`: Alternative development branch

## 📄 License

This project is for educational and entertainment purposes. One Piece is owned by Eiichiro Oda and Toei Animation.

---

**Built with ❤️ for One Piece fans worldwide** 🏴‍☠️
