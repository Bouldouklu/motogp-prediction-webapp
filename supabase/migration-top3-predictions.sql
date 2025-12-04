-- Migration: Update race_predictions table for Top 3 predictions
-- This migration changes from single winner predictions to top 3 predictions for sprint and race
-- 
-- IMPORTANT: Run this migration in Supabase SQL Editor
-- 
-- Before running, backup your data if needed:
-- SELECT * FROM race_predictions;

-- Step 1: Add new columns for top 3 sprint predictions
ALTER TABLE race_predictions 
ADD COLUMN IF NOT EXISTS sprint_1st_id UUID REFERENCES riders(id),
ADD COLUMN IF NOT EXISTS sprint_2nd_id UUID REFERENCES riders(id),
ADD COLUMN IF NOT EXISTS sprint_3rd_id UUID REFERENCES riders(id);

-- Step 2: Add new columns for top 3 race predictions  
ALTER TABLE race_predictions
ADD COLUMN IF NOT EXISTS race_1st_id UUID REFERENCES riders(id),
ADD COLUMN IF NOT EXISTS race_2nd_id UUID REFERENCES riders(id),
ADD COLUMN IF NOT EXISTS race_3rd_id UUID REFERENCES riders(id);

-- Step 3: Migrate existing data (if any)
-- Copy existing sprint_winner_id to sprint_1st_id
UPDATE race_predictions 
SET sprint_1st_id = sprint_winner_id 
WHERE sprint_winner_id IS NOT NULL AND sprint_1st_id IS NULL;

-- Copy existing race_winner_id to race_1st_id
UPDATE race_predictions 
SET race_1st_id = race_winner_id 
WHERE race_winner_id IS NOT NULL AND race_1st_id IS NULL;

-- Step 4: Drop old columns (run after verifying migration worked)
-- WARNING: Only run these after confirming data was migrated correctly!
-- ALTER TABLE race_predictions DROP COLUMN IF EXISTS sprint_winner_id;
-- ALTER TABLE race_predictions DROP COLUMN IF EXISTS race_winner_id;

-- For now, we keep old columns for backward compatibility during transition
-- You can uncomment the DROP statements above after confirming everything works

-- Step 5: Update player_scores table to store points for each position
-- Add columns for individual position points
ALTER TABLE player_scores
ADD COLUMN IF NOT EXISTS sprint_1st_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sprint_2nd_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sprint_3rd_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS race_1st_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS race_2nd_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS race_3rd_points INT DEFAULT 0;

-- Step 6: Create a new generated column for total_points that includes all positions
-- First, drop the leaderboard view that depends on total_points column
DROP VIEW IF EXISTS leaderboard;

-- Now drop the old generated column
ALTER TABLE player_scores DROP COLUMN IF EXISTS total_points;

-- Recreate with updated calculation including all position points
ALTER TABLE player_scores 
ADD COLUMN total_points INT GENERATED ALWAYS AS (
  COALESCE(sprint_1st_points, 0) + COALESCE(sprint_2nd_points, 0) + COALESCE(sprint_3rd_points, 0) +
  COALESCE(race_1st_points, 0) + COALESCE(race_2nd_points, 0) + COALESCE(race_3rd_points, 0) +
  COALESCE(glorious_7_points, 0) - COALESCE(penalty_points, 0)
) STORED;

-- Recreate the leaderboard view
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

-- Migrate existing sprint_points to sprint_1st_points
UPDATE player_scores 
SET sprint_1st_points = sprint_points 
WHERE sprint_points > 0 AND sprint_1st_points = 0;

-- Migrate existing race_points to race_1st_points  
UPDATE player_scores 
SET race_1st_points = race_points 
WHERE race_points > 0 AND race_1st_points = 0;

-- Step 7: Drop old sprint_points and race_points columns (optional, for cleanup)
-- WARNING: Only run after confirming migration worked!
-- ALTER TABLE player_scores DROP COLUMN IF EXISTS sprint_points;
-- ALTER TABLE player_scores DROP COLUMN IF EXISTS race_points;

-- Verification queries (run these to check migration):
-- SELECT * FROM race_predictions LIMIT 5;
-- SELECT * FROM player_scores LIMIT 5;

-- Note: The application code also needs to be updated to use the new column names
