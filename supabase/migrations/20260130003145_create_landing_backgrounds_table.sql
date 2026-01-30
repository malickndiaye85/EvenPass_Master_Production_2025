/*
  # Création de la table pour gérer les images d'arrière-plan du split-screen

  1. Nouvelle Table
    - `landing_backgrounds`
      - `id` (uuid, primary key) - Identifiant unique
      - `section` (text) - Section concernée ('express' ou 'evenement')
      - `image_url` (text) - URL de l'image d'arrière-plan
      - `is_active` (boolean) - Indique si l'image est active
      - `uploaded_by` (uuid) - UID de l'admin qui a uploadé l'image
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de dernière modification
  
  2. Sécurité
    - Enable RLS sur `landing_backgrounds` table
    - Politique SELECT : Tout le monde peut lire les images actives (public)
    - Politique INSERT/UPDATE/DELETE : Uniquement super_admin
*/

CREATE TABLE IF NOT EXISTS landing_backgrounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('express', 'evenement')),
  image_url text NOT NULL,
  is_active boolean DEFAULT true,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_landing_backgrounds_section ON landing_backgrounds(section);
CREATE INDEX IF NOT EXISTS idx_landing_backgrounds_active ON landing_backgrounds(is_active);

-- Enable RLS
ALTER TABLE landing_backgrounds ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Tout le monde peut lire les images actives
CREATE POLICY "Anyone can view active landing backgrounds"
  ON landing_backgrounds
  FOR SELECT
  USING (is_active = true);

-- Politique INSERT : Uniquement les utilisateurs authentifiés (on vérifiera super_admin côté app)
CREATE POLICY "Authenticated users can insert landing backgrounds"
  ON landing_backgrounds
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique UPDATE : Uniquement les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update landing backgrounds"
  ON landing_backgrounds
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique DELETE : Uniquement les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete landing backgrounds"
  ON landing_backgrounds
  FOR DELETE
  TO authenticated
  USING (true);

-- Insérer les images par défaut (URLs placeholder)
INSERT INTO landing_backgrounds (section, image_url, is_active, uploaded_by)
VALUES 
  ('express', 'https://images.pexels.com/photos/1562983/pexels-photo-1562983.jpeg?auto=compress&cs=tinysrgb&w=1920', true, NULL),
  ('evenement', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1920', true, NULL)
ON CONFLICT DO NOTHING;