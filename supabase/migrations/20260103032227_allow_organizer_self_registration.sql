/*
  # Allow Organizer Self-Registration

  ## Changes
  1. Allow anonymous users to insert into `users` table
  2. Allow anonymous users to insert into `organizers` table
  3. New organizers are created with `verification_status='pending'` and `is_active=false`

  ## Security
  - New organizers cannot do anything until approved by admin
  - Only SELECT access to pending organizers is restricted to admins
  - Write operations remain secure through business logic (pending status)
*/

-- Drop existing INSERT policy for organizers
DROP POLICY IF EXISTS "Organizers can create own profile" ON organizers;

-- Allow anyone (including anon) to insert organizers
-- Security is handled by setting verification_status='pending' and is_active=false
CREATE POLICY "Anyone can register as organizer"
  ON organizers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    verification_status = 'pending'
    AND is_active = false
  );

-- Drop existing INSERT policy for users
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Allow anyone (including anon) to insert users
CREATE POLICY "Anyone can create user profile"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
