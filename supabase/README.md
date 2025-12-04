# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `motogp-betting`
   - Database password: (choose a strong password)
   - Region: (choose closest to your users)
5. Wait for the project to be created (~2 minutes)

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: (under "Project API keys")
   - **service_role key**: (under "Project API keys" - keep this secret!)

## 3. Configure Environment Variables

1. Create a file named `.env.local` in the root of the project
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SERVICE_ROLE_KEY=your-service-role-key-here
ADMIN_PASSPHRASE=choose-a-secure-admin-password
```

## 4. Run Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `schema.sql` and paste into the editor
4. Click **Run** to create all tables, views, and indexes

## 5. Seed the Database

### Seed Riders (2026 Grid)

1. In the SQL Editor, create a **New Query**
2. Copy the contents of `seed-riders.sql` and paste
3. Click **Run**
4. Verify: Go to **Table Editor** → **riders** to see all 22 riders

### Seed Races (2026 Calendar)

1. In the SQL Editor, create a **New Query**
2. Copy the contents of `seed-races.sql` and paste
3. Click **Run**
4. Verify: Go to **Table Editor** → **races** to see all 22 races

## 6. Create Initial Players (Optional)

If you want to create test players, run this SQL:

```sql
-- Example: Create test players
-- Note: In production, use proper password hashing!
INSERT INTO players (name, passphrase) VALUES
  ('Gil', 'gil-speed-2026'),
  ('Maxime', 'maxime-speed-2026'),
  ('Ben', 'ben-speed-2026'),
  ('Marcello', 'marcello-speed-2026'),
  ('Willi', 'willi-speed-2026'),
  ('Danny', 'danny-speed-2026'),
  ('Reno', 'reno-speed-2026'),
  ('Stefan', 'stefan-speed-2026'),
  ('Jacques', 'jacques-speed-2026')
ON CONFLICT (name) DO NOTHING;
```

## 7. Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check riders count (should be 22)
SELECT COUNT(*) FROM riders;

-- Check races count (should be 22)
SELECT COUNT(*) FROM races;

-- Check players count
SELECT COUNT(*) FROM players;

-- View leaderboard (should be empty initially)
SELECT * FROM leaderboard;
```

## 8. Test the Application

1. Start the Next.js development server: `npm run dev`
2. Visit [http://localhost:3000](http://localhost:3000)
3. Try logging in with one of the test player credentials

## Notes

- **FP1 Times**: The seed data includes estimated FP1 times. Update these with actual times when the 2026 schedule is published.
- **Security**: The current RLS policies are simplified for development. Implement proper authentication for production.
- **Backup**: Supabase automatically backs up your database, but consider exporting important data regularly.
- **Service Role Key**: Never commit the service role key to version control. It's in `.env.local` which is gitignored.

## Troubleshooting

### "relation does not exist" errors
- Make sure you ran `schema.sql` before the seed files

### RLS policy errors
- The current setup allows public read access for testing
- For production, implement proper Row Level Security policies based on user authentication

### Connection issues
- Verify your API keys are correct in `.env.local`
- Check that your Supabase project is active (not paused)
- Ensure you're using the correct Project URL (should end with `.supabase.co`)
