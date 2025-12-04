# Setup Checklist

Follow this checklist to get your MotoGP betting app running.

## ✅ Phase 1: Local Development Setup

### 1. Supabase Project Setup
- [ ] Create account at [supabase.com](https://supabase.com)
- [ ] Create new project named "motogp-betting"
- [ ] Wait for project initialization (~2 minutes)
- [ ] Note your project URL and API keys from Settings → API

### 2. Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run `supabase/schema.sql` (creates all tables)
- [ ] Run `supabase/seed-riders.sql` (adds 22 riders)
- [ ] Run `supabase/seed-races.sql` (adds 22 races)
- [ ] Verify in Table Editor: riders table has 22 rows, races has 22 rows

### 3. Environment Configuration
- [ ] Create `.env.local` file in project root
- [ ] Copy template from `.env.local.example`
- [ ] Fill in `NEXT_PUBLIC_SUPABASE_URL` from Supabase Settings → API
- [ ] Fill in `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Settings → API
- [ ] Fill in `SERVICE_ROLE_KEY` from Supabase Settings → API (keep secret!)
- [ ] Set `ADMIN_PASSPHRASE` to a secure password

### 4. Create Players
- [ ] In Supabase SQL Editor, run:
```sql
INSERT INTO players (name, passphrase) VALUES
  ('Gil', 'gil-speed-2026'),
  ('Maxime', 'maxime-speed-2026'),
  ('Ben', 'ben-speed-2026'),
  ('Marcello', 'marcello-speed-2026'),
  ('Willi', 'willi-speed-2026'),
  ('Danny', 'danny-speed-2026'),
  ('Reno', 'reno-speed-2026'),
  ('Stefan', 'stefan-speed-2026'),
  ('Jacques', 'jacques-speed-2026');
```
- [ ] Verify in Table Editor: players table has 9 rows

### 5. Test Locally
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000
- [ ] Click "Login"
- [ ] Test login with one of the players (e.g., Gil / gil-speed-2026)
- [ ] Verify dashboard loads
- [ ] Try making a prediction on any upcoming race
- [ ] Check leaderboard page
- [ ] Check races calendar page

### 6. Verify Everything Works
- [ ] Home page loads ✓
- [ ] Login works ✓
- [ ] Dashboard shows upcoming races ✓
- [ ] Can make predictions ✓
- [ ] Rider dropdown shows all 22 riders ✓
- [ ] Cannot select same rider twice ✓
- [ ] Leaderboard displays ✓
- [ ] Races calendar shows all 22 races ✓
- [ ] Logout works ✓

## ✅ Phase 2: Production Deployment

### 1. GitHub Setup
- [ ] Create new GitHub repository
- [ ] Push code to GitHub:
```bash
git add .
git commit -m "Initial commit - MotoGP betting app"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel Deployment
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up/login with GitHub
- [ ] Click "New Project"
- [ ] Import your GitHub repository
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SERVICE_ROLE_KEY`
  - `ADMIN_PASSPHRASE`
- [ ] Click "Deploy"
- [ ] Wait for deployment (~2 minutes)
- [ ] Test production URL

### 3. Share with Friends
- [ ] Share production URL with your 9 friends
- [ ] Share their individual passphrases (via private message)
- [ ] Ask them to test login and make a test prediction

## ✅ Phase 3: Pre-Season Preparation

### 1. Verify 2026 Schedule
- [ ] Check official MotoGP 2026 calendar when published
- [ ] Update race dates in Supabase if needed
- [ ] Verify FP1 times are correct (critical for deadlines!)
- [ ] Update timezone conversions if necessary

### 2. Championship Predictions
- [ ] Implement championship prediction form (see ROADMAP.md)
- [ ] Test championship prediction flow
- [ ] Lock championship predictions before first race

### 3. Admin Panel (Critical!)
- [ ] Build admin results entry page
- [ ] Build score calculation trigger
- [ ] Test end-to-end: enter results → calculate scores → verify leaderboard

## ✅ Phase 4: Season Launch (Before March 1, 2026)

### 1. Final Testing
- [ ] Test making predictions
- [ ] Test updating predictions before deadline
- [ ] Test deadline enforcement
- [ ] Test leaderboard calculations
- [ ] Test on mobile devices
- [ ] Test with all 9 friends

### 2. Communication
- [ ] Send reminder email/message to all players
- [ ] Share deadline for championship predictions
- [ ] Share deadline for Round 1 (Thailand) predictions
- [ ] Explain scoring system

### 3. Monitoring
- [ ] Set up error tracking (Sentry or similar)
- [ ] Set up analytics (Vercel Analytics)
- [ ] Monitor Supabase usage
- [ ] Set up uptime monitoring

## 📝 Notes

- **Passphrases**: Change the default passphrases in production!
- **Security**: Implement proper password hashing before launch (see ROADMAP.md)
- **Deadlines**: FP1 times in seed data are estimates - update with actual times
- **Backups**: Supabase auto-backups, but export data regularly
- **Support**: Create a group chat for technical support during season

## 🆘 Troubleshooting

### Environment Variables Not Loading
- Restart dev server after changing `.env.local`
- Check file is named exactly `.env.local` (not `.env.local.txt`)
- Verify no extra spaces in variable values

### Supabase Connection Errors
- Verify project URL ends with `.supabase.co`
- Check API keys are copied completely
- Ensure project is not paused (free tier pauses after inactivity)

### Build Failures
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild
- Check Node.js version: `node -v` (needs 20.9.0+)

### Deployment Issues
- Verify all environment variables are set in Vercel
- Check deployment logs for specific errors
- Ensure Supabase project is accessible from Vercel's IP ranges

---

**Ready to launch?** Make sure all Phase 1 and Phase 3 checkboxes are ticked before the season starts!
