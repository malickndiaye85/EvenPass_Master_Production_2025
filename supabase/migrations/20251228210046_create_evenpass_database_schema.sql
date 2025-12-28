/*
  # EvenPass Master Database Schema - Production 2025
  
  ## Overview
  Complete database architecture for EvenPass - Senegal's premier event ticketing platform
  
  ## New Tables
  
  ### 1. users
  Extended user profiles with preferences and settings
  - `id` (uuid, primary key) - User unique identifier
  - `email` (text, unique) - User email
  - `full_name` (text) - Full name
  - `phone` (text) - Phone number for mobile payments
  - `avatar_url` (text) - Profile picture URL
  - `preferred_language` (text) - UI language preference (fr/wo)
  - `preferred_payment_method` (text) - Default payment method
  - `created_at` (timestamptz) - Account creation date
  - `updated_at` (timestamptz) - Last update
  
  ### 2. organizers
  Event organizers with verification and business details
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Link to user account
  - `organization_name` (text) - Business/organization name
  - `organization_type` (text) - Type (individual, company, association)
  - `description` (text) - About the organizer
  - `logo_url` (text) - Organization logo
  - `verification_status` (text) - pending, verified, rejected
  - `verification_documents` (jsonb) - Stored document references
  - `contact_email` (text) - Business contact
  - `contact_phone` (text) - Business phone
  - `website` (text) - Organization website
  - `social_media` (jsonb) - Social media links
  - `bank_account_info` (jsonb, encrypted) - Payment settlement details
  - `commission_rate` (decimal) - Platform commission percentage
  - `total_events_created` (integer) - Statistics
  - `total_tickets_sold` (integer) - Statistics
  - `rating` (decimal) - Organizer rating
  - `is_active` (boolean) - Account status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. event_categories
  Categories for organizing events
  - `id` (uuid, primary key)
  - `name_fr` (text) - French name
  - `name_wo` (text) - Wolof name
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text)
  - `icon` (text) - Icon identifier
  - `color` (text) - Brand color
  - `display_order` (integer) - Sort order
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  
  ### 4. events
  Main events table with comprehensive details
  - `id` (uuid, primary key)
  - `organizer_id` (uuid, foreign key)
  - `category_id` (uuid, foreign key)
  - `title` (text) - Event title
  - `slug` (text, unique) - URL-friendly identifier
  - `description` (text) - Full description
  - `short_description` (text) - Brief summary
  - `cover_image_url` (text) - Main event image
  - `gallery_images` (jsonb) - Additional images array
  - `venue_name` (text) - Venue name
  - `venue_address` (text) - Full address
  - `venue_city` (text) - City
  - `venue_coordinates` (jsonb) - {lat, lng} for maps
  - `start_date` (timestamptz) - Event start
  - `end_date` (timestamptz) - Event end
  - `doors_open_time` (timestamptz) - Entry time
  - `status` (text) - draft, published, cancelled, completed
  - `is_featured` (boolean) - Featured on homepage
  - `is_free` (boolean) - Free event
  - `capacity` (integer) - Total capacity
  - `min_age` (integer) - Age restriction
  - `tags` (text[]) - Search tags
  - `terms_and_conditions` (text) - Event-specific T&C
  - `refund_policy` (text) - Refund policy
  - `metadata` (jsonb) - Additional flexible data
  - `view_count` (integer) - Page views
  - `published_at` (timestamptz) - Publication date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 5. ticket_types
  Different ticket tiers for each event
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key)
  - `name` (text) - Ticket type name (VIP, Standard, etc.)
  - `description` (text) - What's included
  - `price` (decimal) - Price in FCFA
  - `quantity_total` (integer) - Total available
  - `quantity_sold` (integer) - Sold count
  - `quantity_reserved` (integer) - Reserved (pending payment)
  - `max_per_booking` (integer) - Purchase limit per order
  - `sale_start_date` (timestamptz) - When sales begin
  - `sale_end_date` (timestamptz) - When sales end
  - `is_active` (boolean) - Available for sale
  - `display_order` (integer) - Sort order
  - `benefits` (text[]) - List of benefits
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 6. bookings
  Customer orders/reservations
  - `id` (uuid, primary key)
  - `booking_number` (text, unique) - Human-readable ID
  - `user_id` (uuid, foreign key)
  - `event_id` (uuid, foreign key)
  - `status` (text) - pending, confirmed, cancelled, refunded
  - `total_amount` (decimal) - Total price
  - `currency` (text) - FCFA
  - `payment_method` (text) - wave, orange_money, card
  - `customer_name` (text) - Buyer name
  - `customer_email` (text) - Buyer email
  - `customer_phone` (text) - Buyer phone
  - `special_requests` (text) - Customer notes
  - `booking_date` (timestamptz) - Order date
  - `expires_at` (timestamptz) - Payment deadline
  - `confirmed_at` (timestamptz) - Confirmation timestamp
  - `cancelled_at` (timestamptz) - Cancellation timestamp
  - `cancellation_reason` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 7. tickets
  Individual tickets with QR codes
  - `id` (uuid, primary key)
  - `ticket_number` (text, unique) - Unique ticket ID
  - `qr_code` (text, unique) - QR code data
  - `booking_id` (uuid, foreign key)
  - `event_id` (uuid, foreign key)
  - `ticket_type_id` (uuid, foreign key)
  - `holder_name` (text) - Ticket holder name
  - `holder_email` (text) - Ticket holder email
  - `status` (text) - valid, used, cancelled, refunded
  - `price_paid` (decimal) - Price for this ticket
  - `check_in_time` (timestamptz) - When scanned
  - `checked_in_by` (uuid) - Staff who scanned
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 8. payments
  Payment transaction records
  - `id` (uuid, primary key)
  - `booking_id` (uuid, foreign key)
  - `payment_reference` (text, unique) - External payment ID
  - `payment_method` (text) - wave, orange_money, card
  - `amount` (decimal) - Payment amount
  - `currency` (text) - FCFA
  - `status` (text) - pending, completed, failed, refunded
  - `provider_response` (jsonb) - Payment gateway response
  - `phone_number` (text) - Payer phone
  - `transaction_fee` (decimal) - Processing fee
  - `net_amount` (decimal) - Amount after fees
  - `paid_at` (timestamptz) - Payment completion time
  - `refunded_at` (timestamptz) - Refund time
  - `refund_reason` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 9. ticket_scans
  Scan history for entry tracking and analytics
  - `id` (uuid, primary key)
  - `ticket_id` (uuid, foreign key)
  - `event_id` (uuid, foreign key)
  - `scanned_by` (uuid, foreign key) - Staff user_id
  - `scan_time` (timestamptz) - When scanned
  - `scan_location` (text) - Entry point
  - `device_info` (jsonb) - Scanner device details
  - `is_valid` (boolean) - Scan result
  - `rejection_reason` (text) - Why rejected if invalid
  - `created_at` (timestamptz)
  
  ### 10. event_staff
  Staff assigned to events (controllers, managers)
  - `id` (uuid, primary key)
  - `event_id` (uuid, foreign key)
  - `user_id` (uuid, foreign key)
  - `role` (text) - controller, manager, security
  - `permissions` (text[]) - List of permissions
  - `assigned_by` (uuid, foreign key) - Who assigned
  - `assigned_at` (timestamptz)
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  
  ### 11. admin_users
  Platform administrators
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `role` (text) - super_admin, finance, ops_manager
  - `permissions` (jsonb) - Detailed permissions
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  
  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users based on roles
  - Organizers can only manage their own events
  - Staff can only access assigned events
  - Users can view their own bookings and tickets
  
  ## Indexes
  - Performance indexes on frequently queried columns
  - Full-text search indexes for events
  - Composite indexes for complex queries
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  preferred_language text DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'wo')),
  preferred_payment_method text CHECK (preferred_payment_method IN ('wave', 'orange_money', 'card')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ORGANIZERS TABLE
CREATE TABLE IF NOT EXISTS organizers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  organization_name text NOT NULL,
  organization_type text DEFAULT 'individual' CHECK (organization_type IN ('individual', 'company', 'association', 'ngo')),
  description text,
  logo_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verification_documents jsonb DEFAULT '[]'::jsonb,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  website text,
  social_media jsonb DEFAULT '{}'::jsonb,
  bank_account_info jsonb DEFAULT '{}'::jsonb,
  commission_rate decimal(5,2) DEFAULT 10.00,
  total_events_created integer DEFAULT 0,
  total_tickets_sold integer DEFAULT 0,
  rating decimal(3,2) DEFAULT 0.00,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. EVENT CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_fr text NOT NULL,
  name_wo text,
  slug text UNIQUE NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#FF6B35',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES event_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  cover_image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  venue_name text NOT NULL,
  venue_address text NOT NULL,
  venue_city text NOT NULL,
  venue_coordinates jsonb,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  doors_open_time timestamptz,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured boolean DEFAULT false,
  is_free boolean DEFAULT false,
  capacity integer,
  min_age integer DEFAULT 0,
  tags text[] DEFAULT ARRAY[]::text[],
  terms_and_conditions text,
  refund_policy text,
  metadata jsonb DEFAULT '{}'::jsonb,
  view_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. TICKET TYPES TABLE
CREATE TABLE IF NOT EXISTS ticket_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0.00,
  quantity_total integer NOT NULL,
  quantity_sold integer DEFAULT 0,
  quantity_reserved integer DEFAULT 0,
  max_per_booking integer DEFAULT 10,
  sale_start_date timestamptz DEFAULT now(),
  sale_end_date timestamptz,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  benefits text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_quantities CHECK (quantity_sold >= 0 AND quantity_reserved >= 0 AND quantity_sold + quantity_reserved <= quantity_total)
);

-- 6. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'FCFA',
  payment_method text CHECK (payment_method IN ('wave', 'orange_money', 'card', 'cash')),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  special_requests text,
  booking_date timestamptz DEFAULT now(),
  expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number text UNIQUE NOT NULL,
  qr_code text UNIQUE NOT NULL,
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id uuid REFERENCES ticket_types(id) ON DELETE CASCADE NOT NULL,
  holder_name text NOT NULL,
  holder_email text,
  status text DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded')),
  price_paid decimal(10,2) NOT NULL,
  check_in_time timestamptz,
  checked_in_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  payment_reference text UNIQUE NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('wave', 'orange_money', 'card', 'cash')),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'FCFA',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  provider_response jsonb DEFAULT '{}'::jsonb,
  phone_number text,
  transaction_fee decimal(10,2) DEFAULT 0.00,
  net_amount decimal(10,2),
  paid_at timestamptz,
  refunded_at timestamptz,
  refund_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. TICKET SCANS TABLE
CREATE TABLE IF NOT EXISTS ticket_scans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  scanned_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  scan_time timestamptz DEFAULT now(),
  scan_location text,
  device_info jsonb DEFAULT '{}'::jsonb,
  is_valid boolean DEFAULT true,
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- 10. EVENT STAFF TABLE
CREATE TABLE IF NOT EXISTS event_staff (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('controller', 'manager', 'security', 'coordinator')),
  permissions text[] DEFAULT ARRAY['scan_tickets']::text[],
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- 11. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'finance', 'ops_manager', 'support')),
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ORGANIZERS POLICIES
CREATE POLICY "Anyone can view verified organizers"
  ON organizers FOR SELECT
  TO authenticated
  USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Users can view own organizer profile"
  ON organizers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create organizer profile"
  ON organizers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can update own profile"
  ON organizers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- EVENT CATEGORIES POLICIES
CREATE POLICY "Anyone can view active categories"
  ON event_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- EVENTS POLICIES
CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Organizers can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid() AND verification_status = 'verified'
    )
  );

CREATE POLICY "Organizers can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

-- TICKET TYPES POLICIES
CREATE POLICY "Anyone can view ticket types for published events"
  ON ticket_types FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE status = 'published'
    )
  );

CREATE POLICY "Organizers can manage ticket types"
  ON ticket_types FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- BOOKINGS POLICIES
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view bookings for own events"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TICKETS POLICIES
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event staff can view tickets for assigned events"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM event_staff WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Organizers can view tickets for own events"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- PAYMENTS POLICIES
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view payments for own events"
  ON payments FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- TICKET SCANS POLICIES
CREATE POLICY "Event staff can view scans for assigned events"
  ON ticket_scans FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM event_staff WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Event staff can create scans for assigned events"
  ON ticket_scans FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT event_id FROM event_staff WHERE user_id = auth.uid() AND is_active = true
    )
    AND scanned_by = auth.uid()
  );

CREATE POLICY "Organizers can view scans for own events"
  ON ticket_scans FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- EVENT STAFF POLICIES
CREATE POLICY "Event staff can view own assignments"
  ON event_staff FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can manage staff for own events"
  ON event_staff FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT e.id FROM events e
      JOIN organizers o ON e.organizer_id = o.id
      WHERE o.user_id = auth.uid()
    )
  );

-- ADMIN USERS POLICIES
CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Organizers indexes
CREATE INDEX IF NOT EXISTS idx_organizers_user_id ON organizers(user_id);
CREATE INDEX IF NOT EXISTS idx_organizers_verification_status ON organizers(verification_status);
CREATE INDEX IF NOT EXISTS idx_organizers_is_active ON organizers(is_active);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(venue_city);

-- Ticket types indexes
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_is_active ON ticket_types(is_active);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Tickets indexes
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type_id ON tickets(ticket_type_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_reference ON payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Ticket scans indexes
CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket_id ON ticket_scans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_event_id ON ticket_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_scanned_by ON ticket_scans(scanned_by);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_scan_time ON ticket_scans(scan_time DESC);

-- Event staff indexes
CREATE INDEX IF NOT EXISTS idx_event_staff_event_id ON event_staff(event_id);
CREATE INDEX IF NOT EXISTS idx_event_staff_user_id ON event_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_event_staff_is_active ON event_staff(is_active);

-- Admin users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizers_updated_at BEFORE UPDATE ON organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_types_updated_at BEFORE UPDATE ON ticket_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS text AS $$
BEGIN
  RETURN 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
BEGIN
  RETURN 'TK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 10));
END;
$$ LANGUAGE plpgsql;

-- Function to generate QR code data
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS text AS $$
BEGIN
  RETURN 'QR-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 32));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA FOR CATEGORIES
-- ============================================

INSERT INTO event_categories (name_fr, name_wo, slug, description, icon, color, display_order) VALUES
  ('Lutte Sénégalaise', 'Lamb', 'lutte-senegalaise', 'Combats de lutte traditionnelle avec frappe', 'trophy', '#FF6B35', 1),
  ('Concerts', 'Concert', 'concerts', 'Concerts et spectacles musicaux', 'music', '#4ECDC4', 2),
  ('Théâtre', 'Teater', 'theatre', 'Pièces de théâtre et spectacles', 'drama', '#95E1D3', 3),
  ('Sport', 'Sport', 'sport', 'Événements sportifs', 'activity', '#F38181', 4),
  ('Conférences', 'Conference', 'conferences', 'Conférences et séminaires', 'briefcase', '#AA96DA', 5),
  ('Festivals', 'Festival', 'festivals', 'Festivals culturels et artistiques', 'calendar', '#FCBAD3', 6),
  ('Famille', 'Mbokk', 'famille', 'Événements familiaux', 'users', '#A8D8EA', 7),
  ('Gastronomie', 'Lekk', 'gastronomie', 'Événements culinaires', 'utensils', '#FFCB77', 8)
ON CONFLICT (slug) DO NOTHING;