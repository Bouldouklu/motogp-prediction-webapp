-- Seed data for players table
-- Run this in Supabase SQL Editor to create test players

INSERT INTO players (name, passphrase) VALUES
  ('TestPlayer', 'test123'),
  ('Admin', 'ADMIN')
ON CONFLICT (name) DO NOTHING;
