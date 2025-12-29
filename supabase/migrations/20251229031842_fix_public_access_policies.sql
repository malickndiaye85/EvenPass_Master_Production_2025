/*
  # Fix Public Access Policies
  
  ## Changes
  1. Update RLS policies to allow public (anon) access to:
     - Event categories
     - Published events
     - Ticket types for published events
  
  ## Security
  - Maintains security for sensitive operations
  - Only allows read access to public data
  - All write operations still require authentication
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON event_categories;
DROP POLICY IF EXISTS "Anyone can view published events" ON events;
DROP POLICY IF EXISTS "Anyone can view ticket types for published events" ON ticket_types;

-- EVENT CATEGORIES - Public read access
CREATE POLICY "Public can view active categories"
  ON event_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- EVENTS - Public read access for published events
CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- TICKET TYPES - Public read access for published events
CREATE POLICY "Public can view ticket types for published events"
  ON ticket_types FOR SELECT
  TO anon, authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE status = 'published'
    )
  );

-- ORGANIZERS - Public read access for verified organizers
DROP POLICY IF EXISTS "Anyone can view verified organizers" ON organizers;

CREATE POLICY "Public can view verified organizers"
  ON organizers FOR SELECT
  TO anon, authenticated
  USING (verification_status = 'verified' AND is_active = true);
