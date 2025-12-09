# MotoGP Betting WebApp - Project Specification

## Overview

A web application to replace an Excel-based MotoGP betting system for a group of 9 friends. Players predict race winners and championship standings, earning points based on prediction accuracy.

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 16 (App Router) | Full-stack React, API routes, Turbopack default |
| Language | TypeScript | Type safety, better tooling |
| Database | Supabase (PostgreSQL) | Free tier, real-time, easy auth |
| Styling | Tailwind CSS | Fast, utility-first |
| Hosting | Vercel | Free, auto-deploy from GitHub |
| IDE | WebStorm | As requested |
| AI Dev | Claude Code | As requested |

---

## Current System (Excel) Summary

### Players (9)
Gil, Maxime, Ben, Marcello, Willi, Danny, Reno, Stefan, Jacques, (potentially more to add in future)

### Season Structure
- 22 races (Thailand → Valencia) (confirmed for MotoGP 2026)
- Each race weekend: Sprint Race + Main Race (confirmed for MotoGP 2026)
 
### Predictions Per Race
1. **Sprint Winner** - Who wins Saturday sprint
2. **Race Winner** - Who wins Sunday race  
3. **Glorious 7** - Who finishes exactly 7th in main race

### Championship Predictions (Season Start)
- Predict the final championship podium (1st, 2nd, 3rd)
- Locked before first race, scored at season end

### Scoring System

#### Race Predictions (Sprint & Race Winner)
| Prediction Accuracy | Points |
|---------------------|--------|
| Exact (1st place) | 25 |
| Off by 1 position | 18 |
| Off by 2 positions | 15 |
| Off by 3 positions | 10 |
| Off by 4 positions | 6 |
| Off by 5 positions | 2 |
| Off by 6+ positions | 0 |

#### Glorious 7 (7th Place Prediction)
| Prediction Accuracy | Points |
|---------------------|--------|
| Exact 7th place | 25 |
| Off by 1 position | 18 |
| Off by 2 positions | 15 |
| Off by 3 positions | 10 |
| Off by 4 positions | 6 |
| Off by 5+ positions | 0 |

#### Championship Podium
| Prediction | Points |
|------------|--------|
| 1st place correct | 250 |
| 2nd place correct | 100 |
| 3rd place correct | 100 |
| **Max total** | **450** |

#### Late Submission Penalties
| Offense | Penalty |
|---------|---------|
| 1st late submission | -10 pts |
| 2nd late submission | -25 pts |
| 3rd+ late submission | -50 pts each |

---

## Database Schema

### Tables

```sql
-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  passphrase VARCHAR(100) NOT NULL, -- hashed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders table (MotoGP riders)
CREATE TABLE riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  number INT UNIQUE NOT NULL,
  team VARCHAR(100),
  active BOOLEAN DEFAULT true
);

-- Races table
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INT NOT NULL, -- 1-22
  name VARCHAR(100) NOT NULL, -- "Thailand", "Argentina", etc.
  circuit VARCHAR(150),
  country VARCHAR(50),
  race_date DATE NOT NULL, -- Sunday main race date
  sprint_date DATE NOT NULL, -- Saturday sprint date
  fp1_datetime TIMESTAMPTZ NOT NULL, -- Prediction deadline
  status VARCHAR(20) DEFAULT 'upcoming' -- upcoming, in_progress, completed
);

-- Race Results (actual results from MotoGP)
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id),
  result_type VARCHAR(10) NOT NULL, -- 'sprint' or 'race'
  position INT NOT NULL,
  rider_id UUID REFERENCES riders(id),
  UNIQUE(race_id, result_type, position)
);

-- Player Race Predictions
CREATE TABLE race_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  race_id UUID REFERENCES races(id),
  sprint_winner_id UUID REFERENCES riders(id),
  race_winner_id UUID REFERENCES riders(id),
  glorious_7_id UUID REFERENCES riders(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_late BOOLEAN DEFAULT false,
  UNIQUE(player_id, race_id)
);

-- Championship Predictions (season-long)
CREATE TABLE championship_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  season_year INT NOT NULL,
  first_place_id UUID REFERENCES riders(id),
  second_place_id UUID REFERENCES riders(id),
  third_place_id UUID REFERENCES riders(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season_year)
);

-- Championship Results (final standings)
CREATE TABLE championship_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year INT NOT NULL,
  position INT NOT NULL,
  rider_id UUID REFERENCES riders(id),
  UNIQUE(season_year, position)
);

-- Calculated Scores (denormalized for performance)
CREATE TABLE player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  race_id UUID REFERENCES races(id),
  sprint_points INT DEFAULT 0,
  race_points INT DEFAULT 0,
  glorious_7_points INT DEFAULT 0,
  penalty_points INT DEFAULT 0,
  total_points INT GENERATED ALWAYS AS (sprint_points + race_points + glorious_7_points - penalty_points) STORED,
  UNIQUE(player_id, race_id)
);

-- Penalty tracking
CREATE TABLE penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id),
  race_id UUID REFERENCES races(id),
  offense_number INT NOT NULL, -- 1st, 2nd, 3rd...
  penalty_points INT NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Views

```sql
-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT 
  p.name,
  COALESCE(SUM(ps.total_points), 0) as race_points,
  COALESCE(cp_score.championship_points, 0) as championship_points,
  COALESCE(SUM(ps.total_points), 0) + COALESCE(cp_score.championship_points, 0) as total_points
FROM players p
LEFT JOIN player_scores ps ON p.id = ps.player_id
LEFT JOIN (
  -- Championship score calculation would go here
  SELECT player_id, 0 as championship_points FROM championship_predictions
) cp_score ON p.id = cp_score.player_id
GROUP BY p.id, p.name, cp_score.championship_points
ORDER BY total_points DESC;
```

---

## Application Structure

```
motogp-betting/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home/Landing
│   ├── login/
│   │   └── page.tsx            # Passphrase login
│   ├── dashboard/
│   │   └── page.tsx            # Player dashboard
│   ├── predict/
│   │   └── [raceId]/
│   │       └── page.tsx        # Make predictions for a race
│   ├── leaderboard/
│   │   └── page.tsx            # Current standings
│   ├── races/
│   │   ├── page.tsx            # All races list
│   │   └── [raceId]/
│   │       └── page.tsx        # Race details & results
│   ├── history/
│   │   └── page.tsx            # Past predictions & scores
│   ├── admin/
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── results/
│   │   │   └── page.tsx        # Enter/fetch results
│   │   └── players/
│   │       └── page.tsx        # Manage players
│   └── api/
│       ├── auth/
│       │   └── route.ts        # Login endpoint
│       ├── predictions/
│       │   └── route.ts        # CRUD predictions
│       ├── results/
│       │   └── route.ts        # Fetch/update results
│       ├── scores/
│       │   └── route.ts        # Calculate scores
│       └── scrape/
│           └── route.ts        # Fetch MotoGP results
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── RiderSelect.tsx         # Dropdown for rider selection
│   ├── PredictionForm.tsx      # Race prediction form
│   ├── LeaderboardTable.tsx    # Rankings display
│   ├── RaceCard.tsx            # Race info card
│   ├── CountdownTimer.tsx      # Time until deadline
│   └── ScoreBreakdown.tsx      # Detailed score view
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── scoring.ts              # Scoring logic
│   ├── scraper.ts              # MotoGP results scraper
│   └── utils.ts                # Helper functions
├── types/
│   └── index.ts                # TypeScript types
├── public/
│   └── riders/                 # Rider images (optional)
├── .env.local                  # Environment variables
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Core Features

### 1. Authentication (Simple)
- No email/password - just name + passphrase
- Each player has a unique passphrase (e.g., "marcello-speed-2025")
- Session stored in cookie/localStorage
- Admin has separate passphrase with elevated access

### 2. Prediction System
- **Deadline**: Predictions lock at FP1 start time
- **UI**: Dropdown selects for each prediction (Sprint, Race, Glorious 7)
- **Validation**: Can't select same rider twice in one race
- **Late Detection**: Auto-flag if submitted after deadline

### 3. Results Integration
Options (pick one):
1. **Manual Entry**: Admin enters results after each race
2. **Web Scraping**: Scrape from motogp.com or similar
3. **API**: Use ergast.com (sunsetting 2024) or motorsportstats.com

Recommended: Start with manual entry, add scraping later.

### 4. Scoring Engine
```typescript
// lib/scoring.ts

export function calculatePositionPoints(
  predictedPosition: number,
  actualPosition: number,
  type: 'winner' | 'glorious7'
): number {
  const diff = Math.abs(predictedPosition - actualPosition);
  
  if (type === 'winner') {
    // For Sprint/Race winner predictions
    const pointsMap: Record<number, number> = {
      0: 12, 1: 9, 2: 7, 3: 5, 4: 4, 5: 2
    };
    return pointsMap[diff] ?? 0;
  }
  
  if (type === 'glorious7') {
    // For 7th place prediction
    const pointsMap: Record<number, number> = {
      0: 12, 1: 9, 2: 7, 3: 5, 4: 4
    };
    return pointsMap[diff] ?? 0;
  }
  
  return 0;
}

export function calculatePenalty(offenseNumber: number): number {
  if (offenseNumber === 1) return 10;
  if (offenseNumber === 2) return 25;
  return 50; // 3rd and beyond
}

export function calculateChampionshipPoints(
  predictions: { first: string; second: string; third: string },
  results: { first: string; second: string; third: string }
): number {
  let points = 0;
  if (predictions.first === results.first) points += 37;
  if (predictions.second === results.second) points += 25;
  if (predictions.third === results.third) points += 25;
  return points;
}
```

### 5. Leaderboard
- Real-time updates (Supabase subscriptions)
- Multiple views:
  - Race points only
  - Race + Championship points
  - Per-race breakdown
- Position change indicators (↑↓)

### 6. Admin Panel
- Enter race results manually
- Trigger score recalculation
- Manage players (reset passphrase, etc.)
- Apply manual penalties
- Override prediction deadlines

---

## User Flows

### Player Login
```
1. Go to /login
2. Select name from dropdown
3. Enter passphrase
4. If valid → redirect to /dashboard
5. If invalid → show error
```

### Make Prediction
```
1. From dashboard, see upcoming races
2. Click "Predict" on unlocked race
3. Select Sprint Winner (dropdown of riders)
4. Select Race Winner (dropdown)
5. Select Glorious 7 (dropdown)
6. Click Submit
7. See confirmation with countdown to deadline
```

### View Results
```
1. Go to /races or /leaderboard
2. See completed races with results
3. Click race for detailed breakdown
4. See your prediction vs actual
5. See points earned
```

---

## API Endpoints

### Authentication
```
POST /api/auth
Body: { name: string, passphrase: string }
Response: { success: boolean, token?: string, error?: string }
```

### Predictions
```
GET /api/predictions?playerId=xxx&raceId=xxx
POST /api/predictions
Body: { raceId, sprintWinnerId, raceWinnerId, glorious7Id }

PUT /api/predictions/:id
Body: { sprintWinnerId?, raceWinnerId?, glorious7Id? }
```

### Results
```
GET /api/results?raceId=xxx
POST /api/results (admin only)
Body: { raceId, type: 'sprint'|'race', positions: [{position, riderId}] }
```

### Scores
```
GET /api/scores?playerId=xxx
GET /api/scores/leaderboard
POST /api/scores/recalculate (admin only)
```

---

## Environment Variables

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SERVICE_ROLE_KEY=xxx

# Admin
ADMIN_PASSPHRASE=xxx

# Optional: MotoGP scraping
MOTOGP_SCRAPE_URL=https://www.motogp.com/en/Results+Statistics
```

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase project and schema
- [ ] Create basic authentication flow
- [ ] Build rider selection component
- [ ] Seed database with riders and 2026 race calendar

### Phase 2: Core Features (Week 2)
- [ ] Prediction form and submission
- [ ] Deadline enforcement logic
- [ ] Manual results entry (admin)
- [ ] Scoring engine implementation
- [ ] Basic leaderboard display

### Phase 3: Polish (Week 3)
- [ ] Dashboard with upcoming/past races
- [ ] Detailed race results view
- [ ] Score breakdown per player
- [ ] Mobile responsive design
- [ ] Error handling and loading states

### Phase 4: Enhancements (Week 4+)
- [ ] Real-time updates with Supabase subscriptions
- [ ] Results auto-fetch (scraping/API)
- [ ] Push notifications for deadlines
- [ ] Historical stats and charts
- [ ] Season archive

---

## 2026 Race Calendar (Seed Data)

| Round | Race | Circuit | Date |
|-------|------|---------|------|
| 1 | Thailand | Chang International Circuit | Mar 1 |
| 2 | Brazil | Autódromo Internacional Ayrton Senna | Mar 22 |
| 3 | USA | Circuit of the Americas | Mar 29 |
| 4 | Qatar | Lusail International Circuit | Apr 12 |
| 5 | Spain | Circuito de Jerez – Ángel Nieto | Apr 26 |
| 6 | France | Bugatti Circuit | May 10 |
| 7 | Catalonia | Circuit de Barcelona-Catalunya | May 17 |
| 8 | Italy | Autodromo Internazionale del Mugello | May 31 |
| 9 | Hungary | Balaton Park Circuit | Jun 7 |
| 10 | Czech Republic | Brno Circuit | Jun 21 |
| 11 | Netherlands | TT Circuit Assen | Jun 28 |
| 12 | Germany | Sachsenring | Jul 12 |
| 13 | UK | Silverstone Circuit | Aug 9 |
| 14 | Aragon | MotorLand Aragón | Aug 30 |
| 15 | San Marino | Misano World Circuit Marco Simoncelli | Sep 13 |
| 16 | Austria | Red Bull Ring | Sep 20 |
| 17 | Japan | Mobility Resort Motegi | Oct 4 |
| 18 | Indonesia | Pertamina Mandalika International Street Circuit | Oct 11 |
| 19 | Australia | Phillip Island Grand Prix Circuit | Oct 25 |
| 20 | Malaysia | Petronas Sepang International Circuit | Nov 1 |
| 21 | Portugal | Algarve International Circuit | Nov 15 |
| 22 | Valencia | Circuit Ricardo Tormo | Nov 22 |

---

## Riders (2026 Grid - Seed Data)

| # | Rider | Team |
|---|-------|------|
| 5 | Johann Zarco | Honda LCR |
| 7 | Toprak Razgatlıoğlu | Yamaha Pramac |
| 10 | Luca Marini | Honda HRC Castrol |
| 11 | Diogo Moreira | Honda LCR |
| 12 | Maverick Viñales | KTM Tech3 |
| 20 | Fabio Quartararo | Yamaha |
| 21 | Franco Morbidelli | Ducati VR46 |
| 23 | Enea Bastianini | KTM Tech3 |
| 25 | Raúl Fernández | Aprilia Trackhouse |
| 33 | Brad Binder | KTM |
| 36 | Joan Mir | Honda HRC Castrol |
| 37 | Pedro Acosta | KTM |
| 42 | Álex Rins | Yamaha |
| 43 | Jack Miller | Yamaha Pramac |
| 49 | Fabio Di Giannantonio | Ducati VR46 |
| 54 | Fermín Aldeguer | Ducati Gresini |
| 63 | Francesco Bagnaia | Ducati |
| 72 | Marco Bezzecchi | Aprilia |
| 73 | Álex Márquez | Ducati Gresini |
| 79 | Ai Ogura | Aprilia Trackhouse |
| 89 | Jorge Martín | Aprilia |
| 93 | Marc Márquez | Ducati |

---

## Quick Start Commands

```bash
# Requires Node.js 20.9.0+
node -v  # Check your version

# Create project
npx create-next-app@latest motogp-betting --typescript --tailwind --app

# Install dependencies
cd motogp-betting
npm install @supabase/supabase-js @supabase/ssr

# Development (uses Turbopack by default in Next.js 16)
npm run dev

# Build
npm run build

# Deploy (via Vercel CLI or GitHub push)
vercel --prod
```

---

## Notes

- **Deadline Logic**: Use the FP1 datetime as the cutoff. Store in UTC, display in user's local timezone.
- **Rider Changes**: Occasionally riders change mid-season (injury, replacement). Keep the riders table updatable.
- **No Prediction = 0 Points**: Missing a prediction results in 0 points for that race, no penalty.
- **Ties**: If players tie on points, the one with more exact predictions ranks higher.

---

## Contact / Admin

Set up an admin account with full access to:
- Enter/modify results
- Reset player passphrases  
- Apply manual penalties
- Recalculate all scores

---

*Document Version: 1.0*  
*Last Updated: December 2024*
