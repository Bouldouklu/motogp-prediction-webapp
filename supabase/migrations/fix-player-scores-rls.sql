-- Fix missing RLS policies for player_scores table
-- The table had SELECT but no INSERT/UPDATE/DELETE policies, causing score saves to fail

CREATE POLICY "Allow insert player scores" ON player_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update player scores" ON player_scores FOR UPDATE USING (true);
CREATE POLICY "Allow delete player scores" ON player_scores FOR DELETE USING (true);
