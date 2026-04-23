-- Backfill estimated sprint and race datetimes for all 2026 races
-- Run this after add-race-sprint-datetimes.sql

UPDATE races SET
  sprint_datetime = CASE round_number
    WHEN 1  THEN '2026-02-28 08:00:00+00'::timestamptz
    WHEN 2  THEN '2026-03-21 18:00:00+00'::timestamptz
    WHEN 3  THEN '2026-03-28 20:00:00+00'::timestamptz
    WHEN 4  THEN '2026-04-11 12:00:00+00'::timestamptz
    WHEN 5  THEN '2026-04-25 13:00:00+00'::timestamptz
    WHEN 6  THEN '2026-05-09 13:00:00+00'::timestamptz
    WHEN 7  THEN '2026-05-16 13:00:00+00'::timestamptz
    WHEN 8  THEN '2026-05-30 13:00:00+00'::timestamptz
    WHEN 9  THEN '2026-06-06 13:00:00+00'::timestamptz
    WHEN 10 THEN '2026-06-20 13:00:00+00'::timestamptz
    WHEN 11 THEN '2026-06-27 13:00:00+00'::timestamptz
    WHEN 12 THEN '2026-07-11 13:00:00+00'::timestamptz
    WHEN 13 THEN '2026-08-08 13:00:00+00'::timestamptz
    WHEN 14 THEN '2026-08-29 13:00:00+00'::timestamptz
    WHEN 15 THEN '2026-09-12 13:00:00+00'::timestamptz
    WHEN 16 THEN '2026-09-19 13:00:00+00'::timestamptz
    WHEN 17 THEN '2026-10-03 06:00:00+00'::timestamptz
    WHEN 18 THEN '2026-10-10 08:00:00+00'::timestamptz
    WHEN 19 THEN '2026-10-24 04:00:00+00'::timestamptz
    WHEN 20 THEN '2026-10-31 07:00:00+00'::timestamptz
    WHEN 21 THEN '2026-11-14 13:00:00+00'::timestamptz
    WHEN 22 THEN '2026-11-21 13:00:00+00'::timestamptz
  END,
  race_datetime = CASE round_number
    WHEN 1  THEN '2026-03-01 08:00:00+00'::timestamptz
    WHEN 2  THEN '2026-03-22 18:00:00+00'::timestamptz
    WHEN 3  THEN '2026-03-29 20:00:00+00'::timestamptz
    WHEN 4  THEN '2026-04-12 12:00:00+00'::timestamptz
    WHEN 5  THEN '2026-04-26 13:00:00+00'::timestamptz
    WHEN 6  THEN '2026-05-10 13:00:00+00'::timestamptz
    WHEN 7  THEN '2026-05-17 13:00:00+00'::timestamptz
    WHEN 8  THEN '2026-05-31 13:00:00+00'::timestamptz
    WHEN 9  THEN '2026-06-07 13:00:00+00'::timestamptz
    WHEN 10 THEN '2026-06-21 13:00:00+00'::timestamptz
    WHEN 11 THEN '2026-06-28 13:00:00+00'::timestamptz
    WHEN 12 THEN '2026-07-12 13:00:00+00'::timestamptz
    WHEN 13 THEN '2026-08-09 13:00:00+00'::timestamptz
    WHEN 14 THEN '2026-08-30 13:00:00+00'::timestamptz
    WHEN 15 THEN '2026-09-13 13:00:00+00'::timestamptz
    WHEN 16 THEN '2026-09-20 13:00:00+00'::timestamptz
    WHEN 17 THEN '2026-10-04 06:00:00+00'::timestamptz
    WHEN 18 THEN '2026-10-11 08:00:00+00'::timestamptz
    WHEN 19 THEN '2026-10-25 04:00:00+00'::timestamptz
    WHEN 20 THEN '2026-11-01 07:00:00+00'::timestamptz
    WHEN 21 THEN '2026-11-15 13:00:00+00'::timestamptz
    WHEN 22 THEN '2026-11-22 13:00:00+00'::timestamptz
  END;
