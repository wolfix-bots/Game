# 🦊 FoxyArcade

A production-ready browser arcade with 20+ games, user accounts, XP system, achievements, leaderboards and cloud save.

## ✨ Features

- **Login / Register** — SHA-256 hashed passwords, avatar picker
- **Cloud Save** — Supabase backend: profiles, scores & leaderboard sync across all devices
- **Local fallback** — works with zero config (localStorage) if Supabase not set up
- **20+ Games** — Snake, 2048, Wordle, Connect Four, Chess, Minesweeper, Blackjack, Pong, Flappy Bird, Reversi, Simon Says, Whack-a-Mole, Memory Match, Hangman, Rock Paper Scissors, Battleship, Checkers, Sudoku, Dino Run, Breakout, Yahtzee, Sliding Puzzle
- **XP & Levels** — earn XP for wins, daily puzzles, achievements
- **16 Achievements** — with animated unlock toasts
- **Global Leaderboard** — real rankings powered by Supabase
- **Per-game Leaderboard** — best scores per game
- **Daily Puzzle** — new Tic-Tac-Toe puzzle every day
- **4 Themes** — Day, Night, Neon, Pastel
- **Online Multiplayer** — FoxyTac online via Ably (room codes + invite links)
- **Fully Responsive** — mobile and desktop

---

## 🚀 Deploy in 2 steps

### Step 1 — Deploy frontend (Vercel / Render / Netlify)

**Vercel (recommended):**
1. Go to [vercel.com](https://vercel.com) → Import Git Repo → select this repo
2. Click **Deploy** — works immediately in local mode

**Render:**
- Build command: `npm run build`
- Publish directory: `dist`

**Netlify:**
- Build command: `npm run build`
- Publish directory: `dist`

---

### Step 2 — Enable cloud saves (Supabase, free)

> Skip this if you're happy with local-only saves.

**1. Create a free Supabase project**
- Go to [supabase.com](https://supabase.com) → New project

**2. Run this SQL in the Supabase SQL Editor:**

```sql
-- Users table
create table if not exists foxytac_users (
  id            text primary key,
  username      text unique not null,
  avatar        text not null default '🦊',
  password_hash text not null,
  xp            integer not null default 0,
  level         integer not null default 1,
  games_played  integer not null default 0,
  games_won     integer not null default 0,
  game_stats    jsonb   not null default '{}'::jsonb,
  achievements  text[]  not null default '{}',
  joined_at     bigint  not null default extract(epoch from now())*1000,
  last_seen     bigint  not null default extract(epoch from now())*1000
);

-- Scores table (leaderboard)
create table if not exists foxytac_scores (
  id         bigserial primary key,
  user_id    text not null references foxytac_users(id) on delete cascade,
  username   text not null,
  avatar     text not null,
  game_id    text not null,
  score      integer not null default 0,
  result     text,
  created_at timestamptz default now()
);

create index if not exists scores_game_id on foxytac_scores(game_id);
create index if not exists scores_user_id on foxytac_scores(user_id);

-- Open RLS policies
alter table foxytac_users  enable row level security;
alter table foxytac_scores enable row level security;
create policy "public_all_users"  on foxytac_users  for all using (true) with check (true);
create policy "public_all_scores" on foxytac_scores for all using (true) with check (true);
```

**3. Get your keys**
- Supabase Dashboard → **Settings → API**
- Copy **Project URL** and **anon/public key**

**4. Add env vars to Vercel**
- Vercel → Your Project → **Settings → Environment Variables**
- Add:
  - `VITE_SUPABASE_URL` = `https://xxxx.supabase.co`
  - `VITE_SUPABASE_ANON` = `your-anon-key`
- Click **Redeploy**

✅ Cloud saves now work — profiles and scores persist across all devices!

---

### Step 3 — Enable OAuth (Google, GitHub, Discord, Twitter) — Optional

> This lets users sign in with one click — no password needed.

**1. Enable providers in Supabase**
- Supabase Dashboard → **Authentication → Providers**
- Enable each provider you want:

| Provider | What you need |
|----------|--------------|
| **Google** | Google Cloud Console → OAuth 2.0 Client ID + Secret |
| **GitHub** | GitHub → Settings → Developer Settings → OAuth Apps → New App |
| **Discord** | Discord Developer Portal → New Application → OAuth2 |
| **Twitter/X** | Twitter Developer Portal → App → Keys & Tokens |

**2. Set the redirect URL**

In each provider's settings, add this as an allowed redirect URL:
```
https://your-supabase-project.supabase.co/auth/v1/callback
```

**3. Set your site URL in Supabase**
- Supabase → **Authentication → URL Configuration**
- Set **Site URL** to your deployed app URL (e.g. `https://your-app.vercel.app`)
- Add it to **Redirect URLs** too

**4. No extra env vars needed** — Supabase handles all the OAuth tokens internally.

✅ OAuth buttons on the login screen will now work!

---

### Google OAuth — Step by Step

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials → Create OAuth Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs: `https://xxxx.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client Secret** → paste into Supabase Google provider settings

### GitHub OAuth — Step by Step

1. Go to **github.com → Settings → Developer Settings → OAuth Apps → New OAuth App**
2. Homepage URL: your app URL
3. Authorization callback URL: `https://xxxx.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret** → paste into Supabase GitHub provider settings

### Discord OAuth — Step by Step

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. New Application → **OAuth2 → Redirects → Add Redirect**
3. Add: `https://xxxx.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret** → paste into Supabase Discord provider settings

---

## 🎮 Games

| Game | Players | Type |
|------|---------|------|
| FoxyTac (Tic-Tac-Toe) | 1–2 + Online | Classic |
| Connect Four | 1–2 | Classic |
| Snake | 1 | Arcade |
| 2048 | 1 | Puzzle |
| Wordle | 1 | Word |
| Minesweeper | 1 | Puzzle |
| Memory Match | 1–2 | Memory |
| Hangman | 1 | Word |
| Pong | 1–2 | Classic |
| Blackjack | 1 | Card |
| Rock Paper Scissors | 1–2 | Quick |
| Reversi | 1–2 | Strategy |
| Simon Says | 1 | Memory |
| Whack-a-Mole | 1 | Arcade |
| Flappy Bird | 1 | Arcade |
| Chess | 1–2 | Strategy |
| Checkers | 1–2 | Classic |
| Sudoku | 1 | Puzzle |
| Battleship | 1–2 | Strategy |
| Dino Run | 1 | Endless |
| Breakout | 1 | Arcade |
| Yahtzee | 1–4 | Dice |
| 15 Sliding Puzzle | 1 | Puzzle |

---

## 🗂 Project Structure

```
src/
├── App.tsx                    # Root + auth gate + Supabase sync
├── pages/
│   ├── ArcadeHub.tsx          # Game selection lobby
│   ├── GameRouter.tsx         # Routes to individual games
│   ├── ProfilePage.tsx        # User profile + stats
│   └── GlobalLeaderboardPage.tsx
├── games/                     # All 20+ game components
├── components/
│   ├── AuthScreen.tsx         # Login / register
│   ├── UserMenu.tsx           # Avatar + logout dropdown
│   ├── GameShell.tsx          # Shared game wrapper
│   ├── FoxMascot.tsx          # Animated fox SVG
│   ├── AchievementsPanel.tsx
│   ├── AchievementToast.tsx
│   ├── StatsPage.tsx
│   ├── DailyPuzzle.tsx
│   └── WinExplosion.tsx
└── lib/
    ├── auth.ts                # Login/register (Supabase + localStorage fallback)
    ├── profile.ts             # XP, stats, leaderboard (Supabase + localStorage fallback)
    ├── supabase.ts            # Supabase client + SQL schema comments
    ├── arcade.ts              # Game definitions
    ├── AI.ts                  # Minimax AI
    ├── ably.ts                # Online multiplayer
    ├── achievements.ts        # 16 achievements
    ├── daily.ts               # Daily puzzles
    ├── sounds.ts              # Web Audio
    ├── storage.ts             # Score helpers
    └── themes.ts              # 4 themes
```

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + inline styles |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Supabase (Postgres + REST) |
| Auth | SHA-256 hashed passwords (Web Crypto API) |
| Realtime | Ably WebSockets (online multiplayer) |
| AI | Minimax + alpha-beta pruning |

## 📝 License

MIT
