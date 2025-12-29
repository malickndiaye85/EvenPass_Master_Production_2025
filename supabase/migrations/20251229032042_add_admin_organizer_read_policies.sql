/*
  # Add Read Policies for Authentication

  ## Changes
  1. Allow authenticated users to check if they have admin privileges
  2. Allow authenticated users to check if they have organizer privileges
  
  ## Security
  - Users can only read their own profiles
  - No modification allowed through these policies
*/

-- Drop and recreate policy for admin status check
DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
CREATE POLICY "Users can check own admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Drop and recreate policy for organizer status check
DROP POLICY IF EXISTS "Users can check own organizer status" ON organizers;
CREATE POLICY "Users can check own organizer status"
  ON organizers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
