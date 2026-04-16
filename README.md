# 🦊 FoxyTac

A production-ready Tic-Tac-Toe web app with login, AI opponents, online multiplayer, achievements, daily puzzles and more.

## ✨ Features

- **Login System** — Register/sign in with username & password (stored locally, SHA-256 hashed)
- **Guest Mode** — Play instantly without an account
- **Avatar Picker** — 20 emoji avatars, changeable any time
- **3 Game Modes** — Local pass & play, vs AI (Easy/Medium/Hard), Online multiplayer
- **Unbeatable AI** — Minimax with alpha-beta pruning
- **Fox Mascot** — Animated SVG fox with 5 moods and speech bubbles
- **4 Themes** — Day, Night, Neon, Pastel (glassmorphism)
- **6 Emoji Marker Sets** — Classic, Hearts & Stars, Fire & Ice, and more
- **Online Multiplayer** — Room codes + invite links via Ably WebSockets
- **In-game Chat** — 50-message chat in online rooms
- **16 Achievements** — With animated unlock toasts
- **Stats Dashboard** — Win rate ring, streaks, per-mode breakdown
- **Daily Puzzle** — New puzzle every day
- **Win Explosion** — Canvas confetti on every win
- **Sound Effects** — Synthesized Web Audio sounds
- **Fully Responsive** — Mobile and desktop

## 🚀 Deploy

### Vercel (recommended)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Git Repository
3. Select this repo → click **Deploy**
4. Done ✅

### Render
1. Go to [render.com](https://render.com) → New Static Site
2. Connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy ✅

### Netlify
1. Go to [netlify.com](https://netlify.com) → Add new site
2. Connect GitHub repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy ✅

## 🌐 Online Multiplayer

Online play uses **Ably** — the key is already included. Works out of the box.

To use your own key:
1. Get a free key at [ably.com](https://ably.com)
2. Create a `.env` file:
   ```
   VITE_ABLY_KEY=your-key-here
   ```
3. Update `src/lib/ably.ts` to use `import.meta.env.VITE_ABLY_KEY`

## 🗂 Project Structure

```
src/
├── App.tsx                  # Root + auth gate
├── components/
│   ├── AuthScreen.tsx       # Login / register screen
│   ├── UserMenu.tsx         # Avatar + logout dropdown
│   ├── GameBoard.tsx        # 3x3 grid
│   ├── Multiplayer.tsx      # Online rooms (Ably)
│   ├── FoxMascot.tsx        # Animated fox SVG
│   ├── AchievementsPanel.tsx
│   ├── AchievementToast.tsx
│   ├── StatsPage.tsx
│   ├── DailyPuzzle.tsx
│   ├── WinExplosion.tsx
│   ├── Scoreboard.tsx
│   └── Settings.tsx
└── lib/
    ├── auth.ts              # Login/register/session
    ├── AI.ts                # Minimax AI
    ├── ably.ts              # Realtime client
    ├── achievements.ts      # 16 achievements + stats
    ├── daily.ts             # Daily puzzles
    ├── sounds.ts            # Web Audio sounds
    ├── storage.ts           # Scores localStorage
    └── themes.ts            # 4 themes + emoji sets
```

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + inline styles |
| Animation | Framer Motion |
| Icons | Lucide React |
| Realtime | Ably WebSockets |
| Auth | localStorage + SHA-256 (Web Crypto API) |
| AI | Minimax + alpha-beta pruning |
| Fonts | Outfit + JetBrains Mono |

## 📝 License

MIT
