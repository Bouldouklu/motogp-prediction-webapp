-- MotoGP Betting WebApp Database Schema
-- Run this in Supabase SQL Editor to create all tables, views, and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  passphrase VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders table (MotoGP riders)
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  number INT UNIQUE NOT NULL,
  team VARCHAR(100),
  active BOOLEAN DEFAULT true,
  external_id VARCHAR(100)
);

-- Races table
CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  circuit VARCHAR(150),
  country VARCHAR(50),
  race_date DATE NOT NULL,
  sprint_date DATE NOT NULL,
  fp1_datetime TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  external_id VARCHAR(100)
);

-- Race Results (actual results from MotoGP)
CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  result_type VARCHAR(10) NOT NULL CHECK (result_type IN ('sprint', 'race')),
  position INT NOT NULL,
  rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
  UNIQUE(race_id, result_type, position)
);

-- Player Race Predictions (Top 3 for Sprint and Race + Glorious 7)
CREATE TABLE IF NOT EXISTS race_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  -- Top 3 Sprint predictions
  sprint_1st_id UUID REFERENCES riders(id),
  sprint_2nd_id UUID REFERENCES riders(id),
  sprint_3rd_id UUID REFERENCES riders(id),
  -- Top 3 Race predictions
  race_1st_id UUID REFERENCES riders(id),
  race_2nd_id UUID REFERENCES riders(id),
  race_3rd_id UUID REFERENCES riders(id),
  -- Glorious 7th prediction
  glorious_7_id UUID REFERENCES riders(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_late BOOLEAN DEFAULT false,
  UNIQUE(player_id, race_id)
);

-- Championship Predictions (season-long)
CREATE TABLE IF NOT EXISTS championship_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season_year INT NOT NULL,
  first_place_id UUID REFERENCES riders(id),
  second_place_id UUID REFERENCES riders(id),
  third_place_id UUID REFERENCES riders(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season_year)
);

-- Championship Results (final standings)
CREATE TABLE IF NOT EXISTS championship_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_year INT NOT NULL,
  position INT NOT NULL,
  rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
  UNIQUE(season_year, position)
);

-- Calculated Scores (denormalized for performance)
-- Stores individual position points for top 3 sprint and top 3 race predictions
CREATE TABLE IF NOT EXISTS player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  -- Sprint top 3 points
  sprint_1st_points INT DEFAULT 0,
  sprint_2nd_points INT DEFAULT 0,
  sprint_3rd_points INT DEFAULT 0,
  -- Race top 3 points
  race_1st_points INT DEFAULT 0,
  race_2nd_points INT DEFAULT 0,
  race_3rd_points INT DEFAULT 0,
  -- Glorious 7 and penalties
  glorious_7_points INT DEFAULT 0,
  penalty_points INT DEFAULT 0,
  -- Auto-calculated total
  total_points INT GENERATED ALWAYS AS (
    COALESCE(sprint_1st_points, 0) + COALESCE(sprint_2nd_points, 0) + COALESCE(sprint_3rd_points, 0) +
    COALESCE(race_1st_points, 0) + COALESCE(race_2nd_points, 0) + COALESCE(race_3rd_points, 0) +
    COALESCE(glorious_7_points, 0) - COALESCE(penalty_points, 0)
  ) STORED,
  UNIQUE(player_id, race_id)
);

-- Penalty tracking
CREATE TABLE IF NOT EXISTS penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  offense_number INT NOT NULL,
  penalty_points INT NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_race_predictions_player ON race_predictions(player_id);
CREATE INDEX IF NOT EXISTS idx_race_predictions_race ON race_predictions(race_id);
CREATE INDEX IF NOT EXISTS idx_player_scores_player ON player_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_player_scores_race ON player_scores(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_race ON race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_races_status ON races(status);
CREATE INDEX IF NOT EXISTS idx_races_round ON races(round_number);

-- Leaderboard view
-- Note: Excludes admin users (identified by name = 'admin', case-insensitive)
-- Using security_invoker = true to ensure RLS policies of the querying user are applied
CREATE OR REPLACE VIEW leaderboard 
WITH (security_invoker = true)
AS
SELECT
  p.id as player_id,
  p.name,
  COALESCE(SUM(ps.total_points), 0) as race_points,
  COALESCE(
    (
      SELECT
        CASE
          WHEN cp.first_place_id = cr1.rider_id THEN 37
          ELSE 0
        END +
        CASE
          WHEN cp.second_place_id = cr2.rider_id THEN 25
          ELSE 0
        END +
        CASE
          WHEN cp.third_place_id = cr3.rider_id THEN 25
          ELSE 0
        END
      FROM championship_predictions cp
      LEFT JOIN championship_results cr1 ON cr1.position = 1 AND cr1.season_year = cp.season_year
      LEFT JOIN championship_results cr2 ON cr2.position = 2 AND cr2.season_year = cp.season_year
      LEFT JOIN championship_results cr3 ON cr3.position = 3 AND cr3.season_year = cp.season_year
      WHERE cp.player_id = p.id
      LIMIT 1
    ),
    0
  ) as championship_points,
  COALESCE(SUM(ps.total_points), 0) + COALESCE(
    (
      SELECT
        CASE
          WHEN cp.first_place_id = cr1.rider_id THEN 37
          ELSE 0
        END +
        CASE
          WHEN cp.second_place_id = cr2.rider_id THEN 25
          ELSE 0
        END +
        CASE
          WHEN cp.third_place_id = cr3.rider_id THEN 25
          ELSE 0
        END
      FROM championship_predictions cp
      LEFT JOIN championship_results cr1 ON cr1.position = 1 AND cr1.season_year = cp.season_year
      LEFT JOIN championship_results cr2 ON cr2.position = 2 AND cr2.season_year = cp.season_year
      LEFT JOIN championship_results cr3 ON cr3.position = 3 AND cr3.season_year = cp.season_year
      WHERE cp.player_id = p.id
      LIMIT 1
    ),
    0
  ) as total_points
FROM players p
LEFT JOIN player_scores ps ON p.id = ps.player_id
WHERE LOWER(p.name) != 'admin'
GROUP BY p.id, p.name
ORDER BY total_points DESC;

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE championship_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalties ENABLE ROW LEVEL SECURITY;

-- Public read access for authentication and public data
CREATE POLICY "Public read access to players for auth" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access to riders" ON riders FOR SELECT USING (true);
CREATE POLICY "Public read access to races" ON races FOR SELECT USING (true);
CREATE POLICY "Public read access to race results" ON race_results FOR SELECT USING (true);
CREATE POLICY "Public read access to championship results" ON championship_results FOR SELECT USING (true);
CREATE POLICY "Public read access to player scores" ON player_scores FOR SELECT USING (true);
CREATE POLICY "Public read access to leaderboard" ON player_scores FOR SELECT USING (true);

-- Admin write access for race results (allows saving race/sprint results)
CREATE POLICY "Allow insert race results" ON race_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update race results" ON race_results FOR UPDATE USING (true);
CREATE POLICY "Allow delete race results" ON race_results FOR DELETE USING (true);

-- Players can read their own data
CREATE POLICY "Players can read their own predictions" ON race_predictions FOR SELECT USING (true);
CREATE POLICY "Players can read their own championship predictions" ON championship_predictions FOR SELECT USING (true);

-- Players can insert/update their own predictions (before deadline)
CREATE POLICY "Players can insert their own race predictions" ON race_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own race predictions" ON race_predictions FOR UPDATE USING (true);
CREATE POLICY "Players can insert their own championship predictions" ON championship_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can update their own championship predictions" ON championship_predictions FOR UPDATE USING (true);

-- Note: For production, you should implement proper authentication and restrict these policies
-- This is a simplified version for initial development

-- Grant SELECT permission on leaderboard view to anon and authenticated roles
GRANT SELECT ON leaderboard TO anon;
GRANT SELECT ON leaderboard TO authenticated;
