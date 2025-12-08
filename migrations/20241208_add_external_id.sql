-- Migration: Add external_id to riders and races tables
ALTER TABLE riders ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
ALTER TABLE races ADD COLUMN IF NOT EXISTS external_id VARCHAR(100);
