-- Seed data for players table
-- Run this in Supabase SQL Editor to create test players

INSERT INTO players (name, passphrase)
VALUES 
    ('ben', 'BRICKENKAMP'),
    ('danny', 'SLINGER'),
    ('gil', 'DELTRUEL'),
    ('jacques', 'DEWEVER'),
    ('marcello', 'BASILIO'),
    ('maxime', 'LEFEBVRE'),
    ('michael', 'KESSLER'),
    ('pascal', 'MICHALLECK'),
    ('pierre-antoine', 'EVRARD'),
    ('reno', 'WIDESON'),
    ('stefan', 'GSTACH'),
    ('theo', 'LEROUX'),
    ('wilhelm', 'WALLINGER'),
    ('paul mority', 'KATH'),
    ('admin', 'ADMIN')
ON CONFLICT (name) DO UPDATE 
SET passphrase = EXCLUDED.passphrase;
