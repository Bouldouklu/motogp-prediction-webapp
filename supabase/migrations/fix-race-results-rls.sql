-- Migration: Fix race_results RLS policies
-- Issue: "Failed to save sprint results" error when admin tries to save race results
-- Cause: Missing INSERT, UPDATE, DELETE policies on race_results table
-- 
-- Run this script in your Supabase SQL Editor if you already have the database set up

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Allow insert race results" ON race_results;
DROP POLICY IF EXISTS "Allow update race results" ON race_results;
DROP POLICY IF EXISTS "Allow delete race results" ON race_results;

-- Add INSERT policy for race_results (allows saving new results)
CREATE POLICY "Allow insert race results" ON race_results FOR INSERT WITH CHECK (true);

-- Add UPDATE policy for race_results (allows updating existing results)
CREATE POLICY "Allow update race results" ON race_results FOR UPDATE USING (true);

-- Add DELETE policy for race_results (allows deleting results before re-inserting)
CREATE POLICY "Allow delete race results" ON race_results FOR DELETE USING (true);
