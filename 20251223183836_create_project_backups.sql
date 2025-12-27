/*
  # Création du système de backup EvenPass

  1. Nouvelle Table
    - `project_backups`
      - `id` (uuid, primary key)
      - `version_name` (text) - Nom de la version
      - `backup_date` (timestamptz) - Date du backup
      - `project_url` (text) - URL du projet
      - `files_data` (jsonb) - Contenu de tous les fichiers
      - `package_json` (jsonb) - Configuration du projet
      - `description` (text) - Description du backup
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS on `project_backups` table
    - Add policy for authenticated users to read backups
    - Add policy for authenticated users to create backups
*/

CREATE TABLE IF NOT EXISTS project_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_name text NOT NULL,
  backup_date timestamptz DEFAULT now(),
  project_url text,
  files_data jsonb NOT NULL,
  package_json jsonb,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read backups"
  ON project_backups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create backups"
  ON project_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
