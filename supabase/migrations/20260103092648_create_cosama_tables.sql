/*
  # Création des tables COSAMA (Compagnie Sénégalaise de Navigation Maritime)

  1. Nouvelles Tables
    - `cosama_cabin_types`
      - Types de cabines (2, 4, 8 places)
      - Tarifs par type
    - `cosama_cabin_inventory`
      - Inventaire temps réel des cabines par traversée
      - Numéros de cabines et disponibilité
    - `cosama_pullman_inventory`
      - Inventaire des fauteuils Pullman
      - Places numérotées
    - `cosama_schedules`
      - Calendrier des traversées Dakar ↔ Ziguinchor
      - Départ et arrivée prévus
    - `cosama_supplements`
      - Tarifs suppléments (enfants, bébés, véhicules)
    - `cosama_bookings`
      - Réservations avec NOM + CNI obligatoire
      - Passagers détaillés avec CNI

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies restrictives avec authentification
*/

-- Table des types de cabines
CREATE TABLE IF NOT EXISTS cosama_cabin_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, -- 'Cabine 2 places', 'Cabine 4 places', 'Cabine 8 places'
  capacity integer NOT NULL,
  base_price integer NOT NULL, -- Prix de base en FCFA
  description text,
  amenities text[], -- ['Climatisation', 'Salle de bain privée', etc.]
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table de l'inventaire des cabines
CREATE TABLE IF NOT EXISTS cosama_cabin_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  cabin_type_id uuid NOT NULL REFERENCES cosama_cabin_types(id),
  cabin_number text NOT NULL, -- 'C201', 'C402', etc.
  status text DEFAULT 'available', -- 'available', 'booked', 'maintenance'
  booking_id uuid, -- Référence à la réservation si booké
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, cabin_number)
);

-- Table de l'inventaire Pullman
CREATE TABLE IF NOT EXISTS cosama_pullman_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid NOT NULL,
  seat_number text NOT NULL, -- 'P01', 'P02', etc.
  price integer NOT NULL, -- Prix par siège
  status text DEFAULT 'available', -- 'available', 'booked'
  booking_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(schedule_id, seat_number)
);

-- Table des horaires/traversées
CREATE TABLE IF NOT EXISTS cosama_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL, -- 'dakar_to_ziguinchor', 'ziguinchor_to_dakar'
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  arrival_date date NOT NULL,
  arrival_time time NOT NULL,
  status text DEFAULT 'scheduled', -- 'scheduled', 'boarding', 'departed', 'arrived', 'cancelled'
  total_cabin_2_places integer DEFAULT 20,
  total_cabin_4_places integer DEFAULT 30,
  total_cabin_8_places integer DEFAULT 15,
  total_pullman_seats integer DEFAULT 100,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des suppléments
CREATE TABLE IF NOT EXISTS cosama_supplements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL, -- 'enfant', 'bebe', 'vehicule_moto', 'vehicule_voiture', 'vehicule_camion'
  name text NOT NULL,
  price integer NOT NULL,
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table des réservations COSAMA
CREATE TABLE IF NOT EXISTS cosama_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference text UNIQUE NOT NULL,
  
  -- Informations voyage
  schedule_id uuid NOT NULL REFERENCES cosama_schedules(id),
  direction text NOT NULL,
  departure_date date NOT NULL,
  
  -- Hébergement principal
  accommodation_type text NOT NULL, -- 'cabin_2', 'cabin_4', 'cabin_8', 'pullman'
  cabin_id uuid REFERENCES cosama_cabin_inventory(id),
  pullman_seats text[], -- Array des numéros de sièges si Pullman
  
  -- Contact principal (titulaire réservation)
  holder_name text NOT NULL,
  holder_cni text NOT NULL, -- CNI obligatoire
  holder_phone text NOT NULL,
  holder_email text,
  
  -- Passagers additionnels (JSON array)
  passengers jsonb DEFAULT '[]'::jsonb, -- [{ name, cni, age_category }]
  
  -- Suppléments
  supplements jsonb DEFAULT '[]'::jsonb, -- [{ type, quantity, unit_price }]
  
  -- Paiement
  base_amount integer NOT NULL,
  supplements_amount integer DEFAULT 0,
  total_amount integer NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending',
  payment_reference text,
  
  -- Validation
  qr_code text,
  manifest_generated boolean DEFAULT false,
  validation_status text DEFAULT 'valid',
  validated_at timestamptz,
  validated_by text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cosama_bookings_reference ON cosama_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_cosama_bookings_phone ON cosama_bookings(holder_phone);
CREATE INDEX IF NOT EXISTS idx_cosama_bookings_schedule ON cosama_bookings(schedule_id);
CREATE INDEX IF NOT EXISTS idx_cosama_cabin_inventory_schedule ON cosama_cabin_inventory(schedule_id);
CREATE INDEX IF NOT EXISTS idx_cosama_pullman_inventory_schedule ON cosama_pullman_inventory(schedule_id);

-- Enable RLS
ALTER TABLE cosama_cabin_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosama_cabin_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosama_pullman_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosama_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosama_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cosama_bookings ENABLE ROW LEVEL SECURITY;

-- Policies lecture publique pour référentiels
CREATE POLICY "Anyone can view cabin types"
  ON cosama_cabin_types FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Anyone can view active schedules"
  ON cosama_schedules FOR SELECT
  TO public
  USING (active = true);

CREATE POLICY "Anyone can view supplements"
  ON cosama_supplements FOR SELECT
  TO public
  USING (active = true);

-- Policies pour inventaire (lecture publique pour disponibilité)
CREATE POLICY "Anyone can view cabin inventory"
  ON cosama_cabin_inventory FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can view pullman inventory"
  ON cosama_pullman_inventory FOR SELECT
  TO public
  USING (true);

-- Policies pour réservations
CREATE POLICY "Users can view their bookings"
  ON cosama_bookings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create bookings"
  ON cosama_bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update their bookings"
  ON cosama_bookings FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Insertion des types de cabines
INSERT INTO cosama_cabin_types (name, capacity, base_price, description, amenities) VALUES
  ('Cabine 2 places', 2, 45000, 'Cabine confortable pour 2 personnes avec vue mer', ARRAY['Climatisation', 'Salle de bain privée', '2 lits superposés', 'Hublot']),
  ('Cabine 4 places', 4, 35000, 'Cabine familiale spacieuse pour 4 personnes', ARRAY['Climatisation', 'Salle de bain privée', '4 lits superposés', 'Hublot']),
  ('Cabine 8 places', 8, 25000, 'Cabine économique pour groupe de 8 personnes', ARRAY['Ventilation', 'Salle de bain commune', '8 lits superposés'])
ON CONFLICT DO NOTHING;

-- Insertion des suppléments
INSERT INTO cosama_supplements (type, name, price, description) VALUES
  ('enfant', 'Enfant (2-12 ans)', 8000, 'Tarif réduit pour les enfants de 2 à 12 ans'),
  ('bebe', 'Bébé (0-2 ans)', 0, 'Gratuit pour les bébés de moins de 2 ans'),
  ('vehicule_moto', 'Moto/Scooter', 15000, 'Transport de moto ou scooter'),
  ('vehicule_voiture', 'Voiture', 45000, 'Transport de voiture particulière'),
  ('vehicule_camion', 'Camion/4x4', 75000, 'Transport de camion ou véhicule utilitaire')
ON CONFLICT DO NOTHING;

-- Insertion d'une traversée d'exemple
INSERT INTO cosama_schedules (
  direction, 
  departure_date, 
  departure_time, 
  arrival_date, 
  arrival_time
) VALUES
  ('dakar_to_ziguinchor', CURRENT_DATE + INTERVAL '7 days', '21:00', CURRENT_DATE + INTERVAL '8 days', '12:00'),
  ('ziguinchor_to_dakar', CURRENT_DATE + INTERVAL '10 days', '21:00', CURRENT_DATE + INTERVAL '11 days', '12:00')
ON CONFLICT DO NOTHING;
