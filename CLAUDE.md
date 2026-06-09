# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MotoGP Betting WebApp — a Next.js 16 full-stack app for 9 friends to predict MotoGP race outcomes and championship standings, earning points based on accuracy. Replaces an Excel-based system.

**Current Status**: Core features fully built and deployed to Vercel. Admin panel functional. Scoring engine implemented and tested.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript strict mode
- **Database**: Supabase (PostgreSQL) with `@supabase/ssr`
- **Styling**: Tailwind CSS 3, `clsx` + `tailwind-merge` via `lib/utils.ts`
- **Charts**: Recharts (leaderboard trend chart)
- **Hosting**: Vercel

## Development Commands

```bash
npm run dev           # Start dev server (Next.js 16, Turbopack)
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
```

There is no test runner configured in `package.json`. `lib/scoring.test.ts` uses Jest-style `describe`/`test` syntax but Jest is not installed — tests cannot currently be run.

## Architecture

### Key Directories

- `app/` — Next.js App Router pages and API routes
- `components/` — React UI components
- `lib/` — Business logic, Supabase clients, auth, scoring, API integration
- `supabase/` — Schema SQL, migration SQL files, seed SQL files

### Authentication (`lib/auth.ts`)

Custom passphrase-based auth (no email/password). Session stored as a Base64-encoded JSON cookie (`motogp_session`). Admin access is determined solely by `name === 'admin'` (case-insensitive). Key functions: `authenticatePlayer`, `getCurrentUser`, `requireAdmin`.

### Supabase Clients

Three clients, all in `lib/supabase/`:
- `server.ts` — server-side (uses `next/headers` cookies, for Server Components and API routes)
- `client.ts` — browser-side (for Client Components)
- `service.ts` — service role client that bypasses RLS; use only in admin API routes after verifying admin auth
- `middleware.ts` — session refresh middleware

Always use `lib/supabase/server.ts` in API routes and Server Components. Use `service.ts` only when RLS bypass is required (e.g., admin writes).

### Scoring Engine (`lib/scoring.ts`)

The core business logic. Key functions:
- `calculatePositionPoints(actualPos, predictedPos, type)` — awards points for top-3 and glorious predictions
- `calculateRaceScore(prediction, sprintResults, raceResults, lateCount, gloriousRiderIds)` — full score for one prediction
- `calculateChampionshipPoints(predictions, results)` — end-of-season championship points
- `calculatePenalty(offenseNumber)` — late submission penalties (25 / 25 / 50 / 75 pts)

**Glorious 7 Mini-League**: Admin selects 7 riders per race (`race_glorious_riders` table). Players predict the top 3 finishers *within that subset*. Scoring uses relative position among the 7 selected riders, not absolute race position.

### API Routes (`app/api/`)

| Route | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | Authenticate player |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/predictions` | GET/POST | Race predictions |
| `/api/championship` | GET/POST | Championship predictions |
| `/api/scores/calculate` | POST | Calculate & store race scores |
| `/api/scores/breakdown` | GET | Score detail for a player/race |
| `/api/scores/history` | GET | Score history |
| `/api/admin/results` | POST | Save race/sprint results (admin) |
| `/api/admin/championship-results` | POST | Save championship results (admin) |
| `/api/admin/generate-glorious-7` | POST | Set Glorious 7 riders for a race |
| `/api/admin/races/[raceId]/status` | PATCH | Update race status (upcoming/in_progress/completed) |
| `/api/cron/sync-motogp` | GET | Sync riders/races from MotoGP API |

### Database Schema (`supabase/schema.sql`)

Core tables: `players`, `riders`, `races`, `race_predictions`, `race_results`, `player_scores`, `championship_predictions`, `championship_results`, `penalties`.

Migration tables (applied separately): `race_glorious_riders` (from `supabase/migrations/update-glorious-7.sql`).

The `player_scores.total_points` is a `GENERATED ALWAYS AS` computed column — never write to it directly.

The `leaderboard` view (in schema.sql) uses `security_invoker = true` and excludes the `admin` user.

**RLS note**: All tables have RLS enabled, but policies are permissive (open read/write for development). Admin-only writes are enforced at the application layer, not database layer.

### MotoGP API Sync (`lib/motogp-api.ts`, `lib/sync-service.ts`)

`SyncService` fetches riders and race events from `https://api.motogp.pulselive.com/motogp/v1/results`. FP1 times are currently estimated (10:45 AM on `date_start`); exact session times require manual correction. Triggered via `/api/cron/sync-motogp`.

## Key Business Rules

1. **Prediction deadline**: Locks at FP1 start time (`races.fp1_datetime`, UTC). Enforced in the prediction API.
2. **Late submissions**: Progressive penalties — 1st: −25 pts, 2nd: −25 pts, 3rd: −50 pts, 4th+: −75 pts.
3. **No duplicate riders within a category**: Cannot pick the same rider for sprint 1st and sprint 2nd. Same rider CAN appear in both sprint and race predictions.
4. **Glorious 7 scoring**: Uses relative ranking within the 7 admin-selected riders, not their actual race position.
5. **Tie-breaking**: Same total points → more exact predictions wins.
6. **Championship**: Predictions locked before race 1, scored at season end. Points: 1st=250, 2nd=100, 3rd=100.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Admin passphrase is stored as a player record in the database (name: `admin`), not an env variable.

## Database Setup

Run in order in Supabase SQL Editor:
1. `supabase/schema.sql` — main schema, views, RLS
2. `supabase/migrations/update-glorious-7.sql` — `race_glorious_riders` table + alters `race_predictions`
3. `supabase/migrations/fix-race-results-rls.sql` — RLS fix
4. `supabase/migrations/fix-leaderboard-security-definer.sql` — leaderboard view fix
5. `supabase/seed-riders.sql`, `supabase/seed-races.sql`, `supabase/seed-players.sql` — seed data

## Reference Files

- `motogp-betting-spec.md` — original full spec (may be outdated vs current implementation)
- `supabase/README.md` — database setup instructions
- `ToDo.md` — current outstanding tasks
