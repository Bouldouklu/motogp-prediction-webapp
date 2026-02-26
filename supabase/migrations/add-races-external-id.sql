-- Migration: Add external_id to races table and clean up duplicate rows
--
-- Background: The races table was initially populated via seed-races.sql which
-- did not set external_id. When the sync cron ran it couldn't find existing rows
-- by external_id and inserted 22 duplicate race rows.
--
-- This migration:
--   1. Adds the external_id column (it was in schema.sql but missing from the live DB)
--   2. Removes the duplicates inserted by the sync (keeping the sync rows which have
--      correct API names, round numbers and external_ids)
--   3. Removes the original seed rows (no external_id, approximate data)
--   4. Adds a unique index so this can never happen again
--
-- Run this in the Supabase SQL Editor BEFORE re-running the sync cron job.

-- Step 1: Add the column if it doesn't already exist
ALTER TABLE races ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);

-- Step 2: Delete seed rows that have no external_id
--   (these are the old manually-seeded rows; the sync already inserted better ones)
--   Safety check: only delete if there ARE rows with external_id present,
--   meaning the sync has already run successfully.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM races WHERE external_id IS NOT NULL) THEN
    DELETE FROM races WHERE external_id IS NULL;
    RAISE NOTICE 'Deleted seed rows without external_id';
  ELSE
    RAISE NOTICE 'No synced rows found yet — seed rows preserved. Run sync cron first, then re-run this migration.';
  END IF;
END $$;

-- Step 3: Add a unique index on external_id to prevent future duplicates
--   (partial index ignores NULLs, so manually-added races without external_id are fine)
CREATE UNIQUE INDEX IF NOT EXISTS idx_races_external_id
  ON races (external_id)
  WHERE external_id IS NOT NULL;
