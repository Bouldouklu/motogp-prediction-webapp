-- Fix: Add missing write policies for the races table.
-- Previously only SELECT was allowed, causing silent failures when
-- admin API routes tried to update race status.

CREATE POLICY "Allow update races" ON races FOR UPDATE USING (true);
CREATE POLICY "Allow insert races" ON races FOR INSERT WITH CHECK (true);
