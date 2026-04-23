-- Add sprint and race datetime columns to races table
-- These are nullable TIMESTAMPTZ to avoid breaking existing rows

ALTER TABLE races
  ADD COLUMN IF NOT EXISTS sprint_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS race_datetime TIMESTAMPTZ;
