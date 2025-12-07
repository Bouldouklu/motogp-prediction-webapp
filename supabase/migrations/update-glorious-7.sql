-- Migration to update Glorious 7 feature to Mini-League
-- 1. Create table to store the 7 selected riders for each race
-- 2. Update race_predictions to have 3 glorious picks instead of 1

-- 1. New table for Glorious 7 Riders selection
CREATE TABLE IF NOT EXISTS race_glorious_riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES riders(id) ON DELETE CASCADE,
  display_order INT, -- 1-7, just for display sorting if needed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(race_id, rider_id)
);

-- RLS for race_glorious_riders
ALTER TABLE race_glorious_riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to race_glorious_riders" ON race_glorious_riders FOR SELECT USING (true);
CREATE POLICY "Admin write access to race_glorious_riders" ON race_glorious_riders FOR ALL USING (
    EXISTS (SELECT 1 FROM players WHERE id = auth.uid() AND name = 'admin')
);
-- Note: As simple auth is used in this app (passphrase), we rely on app-level logic or simplified policies.
-- In development with simple logic, we might just allow all insert/update if we stick to the pattern in schema.sql.
-- Let's stick to the pattern 'Allow insert...' with true for dev simplicity as seen in schema.sql for race_results.
CREATE POLICY "Allow insert race_glorious_riders" ON race_glorious_riders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update race_glorious_riders" ON race_glorious_riders FOR UPDATE USING (true);
CREATE POLICY "Allow delete race_glorious_riders" ON race_glorious_riders FOR DELETE USING (true);


-- 2. Modify race_predictions
-- Drop the old single prediction column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'race_predictions' AND column_name = 'glorious_7_id') THEN
        ALTER TABLE race_predictions DROP COLUMN glorious_7_id;
    END IF;
END $$;

-- Add the new 3 columns
ALTER TABLE race_predictions
ADD COLUMN IF NOT EXISTS glorious_1st_id UUID REFERENCES riders(id),
ADD COLUMN IF NOT EXISTS glorious_2nd_id UUID REFERENCES riders(id),
ADD COLUMN IF NOT EXISTS glorious_3rd_id UUID REFERENCES riders(id);

-- 3. Modify player_scores?
-- logic: glorious_7_points column can remain, it will just store the sum of the 3 mini-league points.
-- No schema change needed there.
