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
  active BOOLEAN DEFAULT true
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
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed'))
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

-- Player Race Predictions
CREATE TABLE IF NOT EXISTS race_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  sprint_winner_id UUID REFERENCES riders(id),
  race_winner_id UUID REFERENCES riders(id),
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
CREATE TABLE IF NOT EXISTS player_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  sprint_points INT DEFAULT 0,
  race_points INT DEFAULT 0,
  glorious_7_points INT DEFAULT 0,
  penalty_points INT DEFAULT 0,
  total_points INT GENERATED ALWAYS AS (sprint_points + race_points + glorious_7_points - penalty_points) STORED,
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
CREATE OR REPLACE VIEW leaderboard AS
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
