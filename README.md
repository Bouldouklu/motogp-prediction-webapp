# MotoGP Betting WebApp

A full-stack web application for MotoGP prediction and betting among friends. Players predict race winners and championship standings, earning points based on prediction accuracy.

## Features

- **Simple Authentication**: Passphrase-based login system (no email required)
- **Race Predictions**: Predict Sprint Winner, Race Winner, and "Glorious 7" (7th place finisher)
- **Championship Predictions**: Season-long podium predictions
- **Real-time Leaderboard**: Live standings with race points and championship points
- **Deadline Enforcement**: Predictions lock at FP1 start time
- **Late Submission Penalties**: Progressive penalties for late predictions
- **2026 Race Calendar**: Full 22-race season with automatic deadline tracking

## Tech Stack

- **Framework**: Next.js 16 (App Router) with Turbopack
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS v3
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- A Supabase account (free tier works fine)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd motogp-bet-webapp
npm install
```

### 2. Set Up Supabase

Follow the detailed instructions in [`supabase/README.md`](supabase/README.md):

1. Create a Supabase project
2. Run `schema.sql` to create tables
3. Run `seed-riders.sql` to add 2026 riders
4. Run `seed-races.sql` to add 2026 race calendar

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSPHRASE=your-admin-password
```

Copy from `.env.local.example` and fill in your Supabase credentials.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Test Players (Optional)

Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO players (name, passphrase) VALUES
  ('test', 'test-speed-2026'),
  ('test2', 'test2-speed-2026'),
ON CONFLICT (name) DO NOTHING;
```

## Project Structure

```
motogp-bet-webapp/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   └── predictions/     # Prediction CRUD
│   ├── dashboard/           # Player dashboard
│   ├── leaderboard/         # Standings page
│   ├── login/               # Login page
│   ├── predict/[raceId]/    # Prediction form
│   └── races/               # Race calendar
├── components/              # React components
│   ├── RiderSelect.tsx      # Rider dropdown
│   └── PredictionForm.tsx   # Prediction form
├── lib/                     # Utilities
│   ├── auth.ts              # Authentication helpers
│   ├── scoring.ts           # Scoring algorithms
│   └── supabase/            # Supabase clients
├── supabase/                # Database files
│   ├── schema.sql           # Database schema
│   ├── seed-riders.sql      # 2025 riders data
│   ├── seed-races.sql       # 2025 calendar data
│   └── README.md            # Setup instructions
├── types/                   # TypeScript types
└── CLAUDE.md                # AI assistant context
```

## Scoring System

### Race Predictions (Sprint & Main Race Winner)
- Exact match: **12 points**
- Off by 1 position: **9 points**
- Off by 2 positions: **7 points**
- Off by 3 positions: **5 points**
- Off by 4 positions: **4 points**
- Off by 5 positions: **2 points**
- Off by 6+ positions: **0 points**

### Glorious 7 (7th Place Prediction)
- Exact 7th place: **12 points**
- Off by 1 position: **9 points**
- Off by 2 positions: **7 points**
- Off by 3 positions: **5 points**
- Off by 4 positions: **4 points**
- Off by 5+ positions: **0 points**

### Championship Podium (End of Season)
- 1st place correct: **37 points**
- 2nd place correct: **25 points**
- 3rd place correct: **25 points**

### Late Submission Penalties
- 1st offense: **-10 points**
- 2nd offense: **-25 points**
- 3rd+ offense: **-50 points each**

## Development Commands

```bash
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically detect Next.js and configure everything.

## Key Features to Implement Next

- [ ] Admin panel for entering race results
- [ ] Automated score calculation after results entry
- [ ] Championship prediction form (locked before first race)
- [ ] Real-time updates with Supabase subscriptions
- [ ] Push notifications for prediction deadlines
- [ ] Historical stats and charts
- [ ] MotoGP results auto-fetch (web scraping or API)
- [ ] Mobile app (React Native or PWA)

## Security Notes

⚠️ **Current Implementation**: The authentication system uses simple passphrase comparison for ease of development. For production use, implement proper password hashing (bcrypt, argon2) and consider using Supabase Auth.

⚠️ **Row Level Security**: The current RLS policies are simplified. Tighten them for production to ensure users can only modify their own predictions.

## Contributing

This is a private project for friends. If you want to use this for your own group:

1. Fork the repository
2. Update player names in seed data
3. Adjust the 2026 race calendar if needed
4. Deploy to your own Vercel + Supabase instance

## License

MIT License - Feel free to use this for your own betting group!

## Support

For issues or questions:
- Check `CLAUDE.md` for architecture details
- Review `supabase/README.md` for database setup
- See the [project specification](motogp-betting-spec.md) for full requirements

---

Built with Next.js 16, Supabase, and Tailwind CSS
