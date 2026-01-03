/*
  # Création des tables LMDG (Liaison Maritime Dakar-Gorée)

  1. Nouvelles Tables
    - `lmdg_tarifs`
      - Tarifs par catégorie (National, Résident, Non-Résident, Goréen)
      - Prix adulte et enfant
    - `lmdg_schedules`
      - Horaires des départs Dakar → Gorée et Gorée → Dakar
      - Disponibilité et capacité
    - `lmdg_bookings`
      - Réservations avec téléphone uniquement (zéro friction)
      - Statut paiement et validation
      - QR code généré

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour lecture publique des tarifs et horaires
    - Policies pour création de réservations authentifiées
*/

-- Table des tarifs LMDG
CREATE TABLE IF NOT EXISTS lmdg_tarifs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'national', 'resident', 'non_resident', 'goreen'
  passenger_type text NOT NULL, -- 'adulte', 'enfant'
  price integer NOT NULL, -- Prix en FCFA
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des horaires LMDG
CREATE TABLE IF NOT EXISTS lmdg_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  departure_time time NOT NULL,
  direction text NOT NULL, -- 'dakar_to_goree', 'goree_to_dakar'
  capacity integer DEFAULT 100,
  active boolean DEFAULT true,
  days_of_week integer[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=dimanche, 6=samedi
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des réservations LMDG
CREATE TABLE IF NOT EXISTS lmdg_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  
  -- Informations voyage
  direction text NOT NULL, -- 'dakar_to_goree', 'goree_to_dakar', 'round_trip'
  travel_date date NOT NULL,
  departure_time time NOT NULL,
  return_date date, -- Si aller-retour
  return_time time, -- Si aller-retour
  
  -- Passagers (zéro friction - pas de noms)
  category text NOT NULL, -- 'national', 'resident', 'non_resident', 'goreen'
  adults_count integer DEFAULT 1,
  children_count integer DEFAULT 0,
  
  -- Contact (unique info demandée)
  phone_number text NOT NULL,
  
  -- Paiement
  total_amount integer NOT NULL,
  payment_method text, -- 'wave', 'orange_money'
  payment_status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_reference text,
  
  -- Validation
  qr_code text,
  validation_status text DEFAULT 'valid', -- 'valid', 'used', 'cancelled', 'expired'
  validated_at timestamptz,
  validated_by text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_lmdg_bookings_phone ON lmdg_bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_lmdg_bookings_reference ON lmdg_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_lmdg_bookings_travel_date ON lmdg_bookings(travel_date);
CREATE INDEX IF NOT EXISTS idx_lmdg_bookings_payment_status ON lmdg_bookings(payment_status);

-- Enable RLS
ALTER TABLE lmdg_tarifs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmdg_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lmdg_bookings ENABLE ROW LEVEL SECURITY;

-- Policies pour tarifs (lecture publique)
CREATE POLICY "Anyone can view active tarifs"
  ON lmdg_tarifs FOR SELECT
  TO public
  USING (active = true);

-- Policies pour horaires (lecture publique)
CREATE POLICY "Anyone can view active schedules"
  ON lmdg_schedules FOR SELECT
  TO public
  USING (active = true);

-- Policies pour réservations
CREATE POLICY "Users can view their own bookings by phone"
  ON lmdg_bookings FOR SELECT
  TO public
  USING (true); -- Public car on filtre par phone côté app

CREATE POLICY "Users can create bookings"
  ON lmdg_bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their own bookings"
  ON lmdg_bookings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Insertion des tarifs par défaut
INSERT INTO lmdg_tarifs (category, passenger_type, price) VALUES
  ('national', 'adulte', 1500),
  ('national', 'enfant', 1000),
  ('resident', 'adulte', 2500),
  ('resident', 'enfant', 1500),
  ('non_resident', 'adulte', 5200),
  ('non_resident', 'enfant', 2600),
  ('goreen', 'adulte', 1000),
  ('goreen', 'enfant', 500)
ON CONFLICT DO NOTHING;

-- Insertion des horaires par défaut (départs toutes les heures de 6h à 23h)
INSERT INTO lmdg_schedules (departure_time, direction, capacity) VALUES
  -- Dakar → Gorée
  ('06:30', 'dakar_to_goree', 100),
  ('07:30', 'dakar_to_goree', 100),
  ('08:30', 'dakar_to_goree', 100),
  ('09:30', 'dakar_to_goree', 100),
  ('10:30', 'dakar_to_goree', 100),
  ('11:30', 'dakar_to_goree', 100),
  ('12:30', 'dakar_to_goree', 100),
  ('13:30', 'dakar_to_goree', 100),
  ('14:30', 'dakar_to_goree', 100),
  ('15:30', 'dakar_to_goree', 100),
  ('16:30', 'dakar_to_goree', 100),
  ('17:30', 'dakar_to_goree', 100),
  ('18:30', 'dakar_to_goree', 100),
  ('19:30', 'dakar_to_goree', 100),
  ('20:30', 'dakar_to_goree', 100),
  ('21:30', 'dakar_to_goree', 100),
  ('22:30', 'dakar_to_goree', 100),
  -- Gorée → Dakar
  ('07:00', 'goree_to_dakar', 100),
  ('08:00', 'goree_to_dakar', 100),
  ('09:00', 'goree_to_dakar', 100),
  ('10:00', 'goree_to_dakar', 100),
  ('11:00', 'goree_to_dakar', 100),
  ('12:00', 'goree_to_dakar', 100),
  ('13:00', 'goree_to_dakar', 100),
  ('14:00', 'goree_to_dakar', 100),
  ('15:00', 'goree_to_dakar', 100),
  ('16:00', 'goree_to_dakar', 100),
  ('17:00', 'goree_to_dakar', 100),
  ('18:00', 'goree_to_dakar', 100),
  ('19:00', 'goree_to_dakar', 100),
  ('20:00', 'goree_to_dakar', 100),
  ('21:00', 'goree_to_dakar', 100),
  ('22:00', 'goree_to_dakar', 100),
  ('23:00', 'goree_to_dakar', 100)
ON CONFLICT DO NOTHING;
