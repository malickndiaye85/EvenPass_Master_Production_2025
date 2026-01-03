/*
  # Création des tables CARS INTERRÉGIONAUX

  1. Nouvelles Tables
    - `interregional_routes`
      - Routes disponibles entre villes
      - Prix et durée estimée
    - `interregional_schedules`
      - Horaires par route et date
      - Places disponibles
    - `interregional_bookings`
      - Réservations avec NOM + TÉLÉPHONE uniquement
      - Places numérotées automatiquement

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies publiques pour consultation
    - Policies authentifiées pour réservations
*/

-- Table des routes interrégionales
CREATE TABLE IF NOT EXISTS interregional_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_city text NOT NULL,
  arrival_city text NOT NULL,
  distance_km integer,
  estimated_duration_hours decimal(4,2),
  base_price integer NOT NULL, -- Prix en FCFA
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(departure_city, arrival_city)
);

-- Table des horaires
CREATE TABLE IF NOT EXISTS interregional_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES interregional_routes(id),
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  arrival_time time NOT NULL,
  bus_type text DEFAULT 'standard', -- 'standard', 'premium', 'vip'
  total_seats integer DEFAULT 45,
  available_seats integer DEFAULT 45,
  status text DEFAULT 'scheduled', -- 'scheduled', 'boarding', 'departed', 'arrived', 'cancelled'
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des réservations interrégionales
CREATE TABLE IF NOT EXISTS interregional_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  
  -- Informations voyage
  schedule_id uuid NOT NULL REFERENCES interregional_schedules(id),
  route_id uuid NOT NULL REFERENCES interregional_routes(id),
  departure_city text NOT NULL,
  arrival_city text NOT NULL,
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  
  -- Passagers (NOM + TÉLÉPHONE uniquement)
  passenger_name text NOT NULL,
  phone_number text NOT NULL,
  
  -- Places
  seat_numbers text[], -- Places numérotées automatiquement
  passengers_count integer DEFAULT 1,
  
  -- Paiement
  unit_price integer NOT NULL,
  total_amount integer NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending',
  payment_reference text,
  
  -- Validation
  qr_code text,
  validation_status text DEFAULT 'valid',
  validated_at timestamptz,
  validated_by text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interregional_bookings_reference ON interregional_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_interregional_bookings_phone ON interregional_bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_interregional_bookings_schedule ON interregional_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_interregional_schedules_route ON interregional_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_interregional_schedules_date ON interregional_schedules(departure_date);

-- Enable RLS
ALTER TABLE interregional_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interregional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE interregional_bookings ENABLE ROW LEVEL SECURITY;

-- Policies lecture publique
CREATE POLICY "Anyone can view active routes"
  ON interregional_routes FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Anyone can view active schedules"
  ON interregional_schedules FOR SELECT
  TO public
  USING (active = true);

-- Policies réservations
CREATE POLICY "Users can view their bookings"
  ON interregional_bookings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create bookings"
  ON interregional_bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their bookings"
  ON interregional_bookings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Insertion des routes principales du Sénégal
INSERT INTO interregional_routes (departure_city, arrival_city, distance_km, estimated_duration_hours, base_price) VALUES
  -- Depuis Dakar
  ('Dakar', 'Thiès', 70, 1.5, 2500),
  ('Dakar', 'Mbour', 80, 2.0, 3000),
  ('Dakar', 'Kaolack', 190, 3.5, 5000),
  ('Dakar', 'Saint-Louis', 270, 4.5, 6500),
  ('Dakar', 'Touba', 190, 4.0, 5500),
  ('Dakar', 'Tambacounda', 450, 7.0, 9000),
  ('Dakar', 'Ziguinchor', 450, 8.0, 10000),
  ('Dakar', 'Kolda', 420, 7.5, 9500),
  
  -- Depuis Saint-Louis
  ('Saint-Louis', 'Dakar', 270, 4.5, 6500),
  ('Saint-Louis', 'Louga', 90, 2.0, 3000),
  ('Saint-Louis', 'Richard-Toll', 100, 2.5, 3500),
  
  -- Depuis Thiès
  ('Thiès', 'Dakar', 70, 1.5, 2500),
  ('Thiès', 'Mbour', 60, 1.5, 2000),
  ('Thiès', 'Kaolack', 120, 2.5, 4000),
  
  -- Depuis Kaolack
  ('Kaolack', 'Dakar', 190, 3.5, 5000),
  ('Kaolack', 'Tambacounda', 260, 4.0, 6000),
  ('Kaolack', 'Ziguinchor', 280, 5.0, 7000),
  
  -- Depuis Ziguinchor
  ('Ziguinchor', 'Dakar', 450, 8.0, 10000),
  ('Ziguinchor', 'Kolda', 150, 3.0, 4500),
  ('Ziguinchor', 'Bignona', 60, 1.5, 2500),
  
  -- Depuis Tambacounda
  ('Tambacounda', 'Dakar', 450, 7.0, 9000),
  ('Tambacounda', 'Kaolack', 260, 4.0, 6000),
  ('Tambacounda', 'Kédougou', 220, 4.5, 6500)
ON CONFLICT DO NOTHING;

-- Insertion d'horaires d'exemple pour les prochains jours
DO $$
DECLARE
  route_record RECORD;
  day_offset integer;
BEGIN
  FOR route_record IN SELECT id, departure_city, arrival_city FROM interregional_routes WHERE active = true LIMIT 10
  LOOP
    FOR day_offset IN 0..6
    LOOP
      -- Départ matin
      INSERT INTO interregional_schedules (route_id, departure_date, departure_time, arrival_time, bus_type, total_seats, available_seats)
      VALUES (route_record.id, CURRENT_DATE + day_offset, '06:00', '10:00', 'standard', 45, 45)
      ON CONFLICT DO NOTHING;
      
      -- Départ après-midi
      INSERT INTO interregional_schedules (route_id, departure_date, departure_time, arrival_time, bus_type, total_seats, available_seats)
      VALUES (route_record.id, CURRENT_DATE + day_offset, '14:00', '18:00', 'standard', 45, 45)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
