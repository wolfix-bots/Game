# 🎮 Tic-Tac-Toe Pro

A production-ready Tic-Tac-Toe web app with local multiplayer, AI opponents, and real-time online play.

## ✨ Features

- **3 Game Modes** — Local pass & play, vs AI (Easy / Medium / Hard), Online multiplayer
- **Unbeatable AI** — Minimax algorithm with alpha-beta pruning
- **4 Themes** — Day, Night, Neon, Pastel (glassmorphism / neomorphic)
- **6 Emoji Sets** — Classic, Hearts & Stars, Fire & Ice, and more
- **Real-time Online** — Powered by PartyKit WebSockets, room codes + invite links
- **In-game Chat** — 50-message chat in online rooms
- **Sound Effects** — Synthesized click, win, and draw sounds
- **Scoreboard** — Per-mode win/loss/draw tracking in localStorage
- **Fully Responsive** — Works on mobile and desktop

## 🚀 Quick Start

```bash
npm install
npm run dev
```

## 🌐 Online Multiplayer Setup (PartyKit)

Online play requires a free PartyKit deployment:

```bash
# 1. Deploy the PartyKit server (signs in with GitHub)
npx partykit deploy

# 2. Copy your host URL from the output, e.g.:
#    tictactoe-pro.yourname.partykit.dev

# 3. Add to your .env file:
cp .env.example .env
# Edit .env and set VITE_PARTYKIT_HOST=tictactoe-pro.yourname.partykit.dev

# 4. Restart dev server
npm run dev
```

### Deploying to Vercel

1. Push this repo to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variable:
   - `VITE_PARTYKIT_HOST` = `tictactoe-pro.yourname.partykit.dev`
4. Deploy — done! ✅

## 🗂 Project Structure

```
├── party/
│   └── server.ts          # PartyKit WebSocket server (game logic)
├── src/
│   ├── App.tsx             # Root component, game state
│   ├── components/
│   │   ├── GameBoard.tsx   # 3x3 grid with animations
│   │   ├── Multiplayer.tsx # Online room management
│   │   ├── Scoreboard.tsx  # Win/loss/draw tracker
│   │   └── Settings.tsx    # Theme & emoji picker
│   └── lib/
│       ├── AI.ts           # Minimax AI
│       ├── sounds.ts       # Web Audio synthesized sounds
│       ├── storage.ts      # localStorage scores
│       ├── supabase.ts     # Supabase client (optional)
│       └── themes.ts       # Theme & emoji definitions
├── .env.example            # Environment variable template
├── partykit.json           # PartyKit config
└── vercel.json             # Vercel deployment config
```

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + custom CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| Realtime | PartyKit (WebSockets) |
| AI | Minimax + alpha-beta pruning |
| Persistence | localStorage (scores) |
| Fonts | Outfit + JetBrains Mono |

## 📄 License

MIT
