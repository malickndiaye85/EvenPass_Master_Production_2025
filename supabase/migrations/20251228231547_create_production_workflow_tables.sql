/*
  # EvenPass Production Workflow Tables

  ## New Tables
  
  1. event_zones - Physical zones/entrances for events
  2. controllers - Personnel who scan tickets
  3. controller_assignments - Assigns controllers to events/zones
  4. scan_sessions - Active scanning sessions
  5. ticket_scans - Individual ticket scan records

  ## Modifications
  - Add workflow status to events table

  ## Security
  - RLS enabled on all tables
  - Basic authenticated access for now
*/

-- Add workflow status columns to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE events ADD COLUMN workflow_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE events ADD COLUMN approved_by uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE events ADD COLUMN approved_at timestamptz;
  END IF;
END $$;

-- Create event_zones table
CREATE TABLE IF NOT EXISTS event_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  zone_name text NOT NULL,
  zone_code text NOT NULL,
  ticket_type_ids uuid[] DEFAULT '{}',
  capacity_limit integer,
  current_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create controllers table
CREATE TABLE IF NOT EXISTS controllers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  contact_phone text NOT NULL,
  id_document_number text NOT NULL,
  equipment_serial text NOT NULL,
  equipment_hardware_id text,
  email text,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create controller_assignments table
CREATE TABLE IF NOT EXISTS controller_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  controller_id uuid NOT NULL,
  event_id uuid NOT NULL,
  zone_id uuid,
  activation_token text UNIQUE NOT NULL,
  activation_link_sent_at timestamptz,
  activated_at timestamptz,
  is_active boolean DEFAULT false,
  assigned_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Create scan_sessions table
CREATE TABLE IF NOT EXISTS scan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  controller_id uuid NOT NULL,
  event_id uuid NOT NULL,
  zone_id uuid,
  session_token text UNIQUE NOT NULL,
  hardware_id_verified text NOT NULL,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  is_active boolean DEFAULT true
);

-- Create ticket_scans table
CREATE TABLE IF NOT EXISTS ticket_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  session_id uuid NOT NULL,
  controller_id uuid NOT NULL,
  event_id uuid NOT NULL,
  zone_id uuid,
  scan_result text NOT NULL,
  scanned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_zones_event_id ON event_zones(event_id);
CREATE INDEX IF NOT EXISTS idx_controllers_active ON controllers(is_active);
CREATE INDEX IF NOT EXISTS idx_controller_assignments_controller ON controller_assignments(controller_id);
CREATE INDEX IF NOT EXISTS idx_controller_assignments_event ON controller_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_controller_assignments_token ON controller_assignments(activation_token);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_active ON scan_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket ON ticket_scans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_event ON ticket_scans(event_id);

-- Enable RLS
ALTER TABLE event_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE controllers ENABLE ROW LEVEL SECURITY;
ALTER TABLE controller_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;

-- Policies - Allow authenticated users for now
CREATE POLICY "Authenticated users can view zones"
  ON event_zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage zones"
  ON event_zones FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view controllers"
  ON controllers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage controllers"
  ON controllers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view assignments"
  ON controller_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage assignments"
  ON controller_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view sessions"
  ON scan_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage sessions"
  ON scan_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view scans"
  ON ticket_scans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create scans"
  ON ticket_scans FOR INSERT
  TO authenticated
  WITH CHECK (true);
