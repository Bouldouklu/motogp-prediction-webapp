-- MotoGP 2026 Riders Seed Data
-- Run this after creating the schema

INSERT INTO riders (name, number, team, active) VALUES
  ('Johann Zarco', 5, 'Honda LCR', true),
  ('Toprak Razgatlıoğlu', 7, 'Yamaha Pramac', true),
  ('Luca Marini', 10, 'Honda HRC Castrol', true),
  ('Diogo Moreira', 11, 'Honda LCR', true),
  ('Maverick Viñales', 12, 'KTM Tech3', true),
  ('Fabio Quartararo', 20, 'Yamaha', true),
  ('Franco Morbidelli', 21, 'Ducati VR46', true),
  ('Enea Bastianini', 23, 'KTM Tech3', true),
  ('Raúl Fernández', 25, 'Aprilia Trackhouse', true),
  ('Brad Binder', 33, 'KTM', true),
  ('Joan Mir', 36, 'Honda HRC Castrol', true),
  ('Pedro Acosta', 37, 'KTM', true),
  ('Álex Rins', 42, 'Yamaha', true),
  ('Jack Miller', 43, 'Yamaha Pramac', true),
  ('Fabio Di Giannantonio', 49, 'Ducati VR46', true),
  ('Fermín Aldeguer', 54, 'Ducati Gresini', true),
  ('Francesco Bagnaia', 63, 'Ducati', true),
  ('Marco Bezzecchi', 72, 'Aprilia', true),
  ('Álex Márquez', 73, 'Ducati Gresini', true),
  ('Ai Ogura', 79, 'Aprilia Trackhouse', true),
  ('Jorge Martín', 89, 'Aprilia', true),
  ('Marc Márquez', 93, 'Ducati', true)
ON CONFLICT (number) DO NOTHING;
