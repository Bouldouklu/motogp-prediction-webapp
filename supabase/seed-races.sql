-- MotoGP 2026 Race Calendar Seed Data
-- Run this after creating the schema
-- Note: FP1 times are set to Friday 10:45 AM local time (adjust as needed for actual schedule)

INSERT INTO races (round_number, name, circuit, country, race_date, sprint_date, fp1_datetime, status) VALUES
  (1, 'Thailand', 'Chang International Circuit', 'Thailand', '2026-03-01', '2026-02-28', '2026-02-27 03:45:00+00', 'upcoming'),
  (2, 'Brazil', 'Autódromo Internacional Ayrton Senna', 'Brazil', '2026-03-22', '2026-03-21', '2026-03-20 13:45:00+00', 'upcoming'),
  (3, 'USA', 'Circuit of the Americas', 'USA', '2026-03-29', '2026-03-28', '2026-03-27 15:45:00+00', 'upcoming'),
  (4, 'Qatar', 'Lusail International Circuit', 'Qatar', '2026-04-12', '2026-04-11', '2026-04-10 12:45:00+00', 'upcoming'),
  (5, 'Spain', 'Circuito de Jerez – Ángel Nieto', 'Spain', '2026-04-26', '2026-04-25', '2026-04-24 08:45:00+00', 'upcoming'),
  (6, 'France', 'Bugatti Circuit', 'France', '2026-05-10', '2026-05-09', '2026-05-08 08:45:00+00', 'upcoming'),
  (7, 'Catalonia', 'Circuit de Barcelona-Catalunya', 'Spain', '2026-05-17', '2026-05-16', '2026-05-15 08:45:00+00', 'upcoming'),
  (8, 'Italy', 'Autodromo Internazionale del Mugello', 'Italy', '2026-05-31', '2026-05-30', '2026-05-29 08:45:00+00', 'upcoming'),
  (9, 'Hungary', 'Balaton Park Circuit', 'Hungary', '2026-06-07', '2026-06-06', '2026-06-05 08:45:00+00', 'upcoming'),
  (10, 'Czech Republic', 'Brno Circuit', 'Czech Republic', '2026-06-21', '2026-06-20', '2026-06-19 08:45:00+00', 'upcoming'),
  (11, 'Netherlands', 'TT Circuit Assen', 'Netherlands', '2026-06-28', '2026-06-27', '2026-06-26 08:45:00+00', 'upcoming'),
  (12, 'Germany', 'Sachsenring', 'Germany', '2026-07-12', '2026-07-11', '2026-07-10 08:45:00+00', 'upcoming'),
  (13, 'UK', 'Silverstone Circuit', 'United Kingdom', '2026-08-09', '2026-08-08', '2026-08-07 09:45:00+00', 'upcoming'),
  (14, 'Aragon', 'MotorLand Aragón', 'Spain', '2026-08-30', '2026-08-29', '2026-08-28 08:45:00+00', 'upcoming'),
  (15, 'San Marino', 'Misano World Circuit Marco Simoncelli', 'San Marino', '2026-09-13', '2026-09-12', '2026-09-11 08:45:00+00', 'upcoming'),
  (16, 'Austria', 'Red Bull Ring', 'Austria', '2026-09-20', '2026-09-19', '2026-09-18 08:45:00+00', 'upcoming'),
  (17, 'Japan', 'Mobility Resort Motegi', 'Japan', '2026-10-04', '2026-10-03', '2026-10-02 01:45:00+00', 'upcoming'),
  (18, 'Indonesia', 'Pertamina Mandalika International Street Circuit', 'Indonesia', '2026-10-11', '2026-10-10', '2026-10-09 03:45:00+00', 'upcoming'),
  (19, 'Australia', 'Phillip Island Grand Prix Circuit', 'Australia', '2026-10-25', '2026-10-24', '2026-10-23 00:45:00+00', 'upcoming'),
  (20, 'Malaysia', 'Petronas Sepang International Circuit', 'Malaysia', '2026-11-01', '2026-10-31', '2026-10-30 02:45:00+00', 'upcoming'),
  (21, 'Portugal', 'Algarve International Circuit', 'Portugal', '2026-11-15', '2026-11-14', '2026-11-13 10:45:00+00', 'upcoming'),
  (22, 'Valencia', 'Circuit Ricardo Tormo', 'Spain', '2026-11-22', '2026-11-21', '2026-11-20 09:45:00+00', 'upcoming')
ON CONFLICT DO NOTHING;

-- Note: The FP1 times above are estimates in UTC.
-- You should verify and adjust these based on the actual 2026 MotoGP schedule when it's published.
