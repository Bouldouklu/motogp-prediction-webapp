# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MotoGP Betting WebApp - A full-stack web application to replace an Excel-based MotoGP betting system for 9 friends. Players predict race winners and championship standings, earning points based on prediction accuracy.

**Current Status**: Early initialization phase. Basic TypeScript setup exists but the Next.js 16 application structure has not been created yet.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack
- **Language**: TypeScript (strict mode enabled)
- **Database**: Supabase (PostgreSQL) - not yet configured
- **Styling**: Tailwind CSS - not yet installed
- **Hosting**: Vercel
- **IDE**: WebStorm

## Development Commands

### Current Setup (Basic TypeScript)
```bash
npm run build          # Compile TypeScript to dist/
```

### Future Next.js Commands (Once Migrated)
```bash
npm run dev           # Start development server (uses Turbopack by default in Next.js 16)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

## Architecture Overview

### Database Schema

The application uses Supabase (PostgreSQL) with the following core tables:

- **players**: User accounts with passphrase authentication (no email/password)
- **riders**: MotoGP riders (2026 grid with 22+ riders)
- **races**: 22-race calendar with FP1 deadline timestamps
- **race_predictions**: Player predictions (sprint winner, race winner, glorious 7th)
- **championship_predictions**: Season-long podium predictions (locked before first race)
- **race_results**: Actual race outcomes (sprint and race)
- **player_scores**: Calculated points per race (denormalized for performance)
- **penalties**: Late submission tracking (1st: -10pts, 2nd: -25pts, 3rd+: -50pts)

### Scoring Logic (lib/scoring.ts)

**Race Winner Predictions** (Sprint & Main Race):
- Exact match (1st place): 12 points
- Off by 1 position: 9 points
- Off by 2 positions: 7 points
- Off by 3 positions: 5 points
- Off by 4 positions: 4 points
- Off by 5 positions: 2 points
- Off by 6+ positions: 0 points

**Glorious 7 (7th Place) Predictions**:
- Exact 7th place: 12 points
- Off by 1 position: 9 points
- Off by 2 positions: 7 points
- Off by 3 positions: 5 points
- Off by 4 positions: 4 points
- Off by 5+ positions: 0 points

**Championship Podium** (End of Season):
- 1st place correct: 37 points
- 2nd place correct: 25 points
- 3rd place correct: 25 points

### Application Structure (When Built)

```
app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Home/Landing
├── login/page.tsx                # Passphrase authentication
├── dashboard/page.tsx            # Player dashboard with upcoming races
├── predict/[raceId]/page.tsx    # Prediction form (locks at FP1 start)
├── leaderboard/page.tsx          # Real-time standings
├── races/                        # Race list and details
├── history/page.tsx              # Past predictions & scores
├── admin/                        # Admin-only pages (results entry, player management)
└── api/                          # API routes for auth, predictions, results, scores

components/
├── RiderSelect.tsx               # Dropdown for rider selection
├── PredictionForm.tsx            # Race prediction form with validation
├── LeaderboardTable.tsx          # Rankings display with real-time updates
├── RaceCard.tsx                  # Race info card
├── CountdownTimer.tsx            # Time until FP1 deadline
└── ScoreBreakdown.tsx            # Detailed score view

lib/
├── supabase.ts                   # Supabase client initialization
├── scoring.ts                    # Core scoring algorithms (calculatePositionPoints, calculatePenalty, calculateChampionshipPoints)
├── scraper.ts                    # MotoGP results scraper (future enhancement)
└── utils.ts                      # Helper functions
```

### Key Business Rules

1. **Deadline Enforcement**: Predictions lock at FP1 start time (stored in UTC, displayed in user's timezone)
2. **Late Submission Penalties**: Automatically flagged and penalized progressively
3. **No Duplicate Riders**: Cannot select the same rider for sprint winner, race winner, and glorious 7 in a single race
4. **Missing Predictions**: No prediction = 0 points (no penalty, unlike late submissions)
5. **Tie-Breaking**: Players with same total points are ranked by number of exact predictions

### Authentication Model

Simple passphrase-based authentication (no email/password):
- Each player has unique passphrase (e.g., "marcello-speed-2025")
- Admin has separate elevated passphrase
- Session stored in cookie/localStorage
- No password reset flow (admin can reset manually)

### Data Flow

1. **Prediction Submission**: Player selects 3 riders → validates deadline → validates no duplicates → stores in race_predictions table
2. **Results Entry**: Admin enters race results manually → stores in race_results table → triggers score calculation
3. **Score Calculation**: Compares race_predictions vs race_results → calculates points using scoring.ts algorithms → stores in player_scores table
4. **Leaderboard Display**: Aggregates player_scores + championship_predictions → displays real-time rankings via Supabase subscriptions

## Environment Variables

Required environment variables (in .env.local):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SERVICE_ROLE_KEY=xxx
ADMIN_PASSPHRASE=xxx
```

Optional (for future enhancements):
```
MOTOGP_SCRAPE_URL=https://www.motogp.com/en/Results+Statistics
```

## Development Guidelines

### Code Style
- Follow TypeScript strict mode conventions
- Use async/await for asynchronous operations
- Prefer server-side data fetching in Next.js App Router
- Keep components focused and single-responsibility

### Database Operations
- Use Supabase client-side for reads in components
- Use Service Role Key for admin operations and mutations
- Leverage PostgreSQL's GENERATED ALWAYS columns for calculated fields
- Use database views for complex queries (e.g., leaderboard)

### Testing
- Test scoring logic thoroughly (multiple edge cases exist)
- Validate deadline enforcement across timezones
- Test late submission penalty progression
- Verify no duplicate rider selections

### Phase-Based Development

The project follows a phased approach:
1. **Foundation**: Next.js setup, Supabase schema, authentication, rider components
2. **Core Features**: Prediction forms, deadline logic, results entry, scoring engine, leaderboard
3. **Polish**: Dashboard, detailed views, mobile responsive design, error handling
4. **Enhancements**: Real-time updates, auto-fetch results, notifications, historical stats

## Important Notes

- The 2026 race calendar (22 races from Thailand to Valencia) is in motogp-betting-spec.md
- The 2026 rider grid (22+ riders) seed data is in motogp-betting-spec.md
- Riders can change mid-season (injury/replacement) - riders table must remain updatable
- Each race weekend has Sprint Race (Saturday) + Main Race (Sunday)
- Championship predictions are locked before the first race and scored at season end
- Admin panel is critical for manual results entry and score recalculation

## Reference Files

- **motogp-betting-spec.md**: Complete project specification including full database schema, API endpoints, user flows, and seed data
