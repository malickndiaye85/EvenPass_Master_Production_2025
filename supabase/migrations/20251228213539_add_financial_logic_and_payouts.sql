/*
  # Add Financial Logic and Payout Management
  
  ## Overview
  Implements the EvenPass financial model:
  - 5% platform commission for EvenPass
  - 1.5% technical fees for payouts (Wave, Orange Money)
  - 93.5% net amount for organizers
  
  ## New Tables
  
  ### payout_requests
  Organizer withdrawal requests with status tracking
  - `id` (uuid, primary key)
  - `organizer_id` (uuid, foreign key)
  - `request_number` (text, unique) - Human-readable ID
  - `amount_requested` (decimal) - Gross amount (95% after 5% commission)
  - `technical_fees` (decimal) - 1.5% payout fees
  - `net_amount` (decimal) - Final amount (93.5%)
  - `status` (text) - pending, approved, processing, completed, rejected
  - `payment_method` (text) - wave, orange_money
  - `payment_details` (jsonb) - Phone number, account info
  - `requested_at` (timestamptz)
  - `processed_at` (timestamptz)
  - `processed_by` (uuid, foreign key) - Admin who processed
  - `rejection_reason` (text)
  - `transaction_reference` (text) - External payment ref
  - `notes` (text)
  - `created_at` (timestamptz)
  
  ### financial_transactions
  Detailed financial tracking for audit and reporting
  - `id` (uuid, primary key)
  - `transaction_type` (text) - ticket_sale, commission, payout_fee, organizer_payout
  - `related_booking_id` (uuid, foreign key)
  - `related_payout_id` (uuid, foreign key)
  - `organizer_id` (uuid, foreign key)
  - `amount` (decimal)
  - `description` (text)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)
  
  ### organizer_balances
  Real-time balance tracking for organizers
  - `organizer_id` (uuid, primary key, foreign key)
  - `total_sales` (decimal) - Total ticket sales
  - `platform_commission` (decimal) - 5% accumulated
  - `available_balance` (decimal) - 95% available for payout
  - `pending_payouts` (decimal) - Requested but not processed
  - `total_paid_out` (decimal) - Successfully paid out
  - `last_updated` (timestamptz)
  
  ## Modified Tables
  
  ### payments
  Add commission and fee calculations
  - `platform_commission` (decimal) - 5% of amount
  - `organizer_amount` (decimal) - 95% after commission
  
  ## Functions
  
  - Calculate commissions automatically on payment completion
  - Update organizer balances in real-time
  - Generate payout request numbers
  
  ## Security
  
  - RLS policies for payouts (organizers view own, admins view all)
  - Financial transactions visible to admins only
  - Organizer balances visible to owner and admins
*/

-- 1. PAYOUT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS payout_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE NOT NULL,
  request_number text UNIQUE NOT NULL,
  amount_requested decimal(10,2) NOT NULL,
  technical_fees decimal(10,2) NOT NULL,
  net_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  payment_method text NOT NULL CHECK (payment_method IN ('wave', 'orange_money')),
  payment_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason text,
  transaction_reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 2. FINANCIAL TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('ticket_sale', 'commission', 'payout_fee', 'organizer_payout', 'refund')),
  related_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  related_payout_id uuid REFERENCES payout_requests(id) ON DELETE SET NULL,
  organizer_id uuid REFERENCES organizers(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. ORGANIZER BALANCES TABLE
CREATE TABLE IF NOT EXISTS organizer_balances (
  organizer_id uuid PRIMARY KEY REFERENCES organizers(id) ON DELETE CASCADE,
  total_sales decimal(10,2) DEFAULT 0.00,
  platform_commission decimal(10,2) DEFAULT 0.00,
  available_balance decimal(10,2) DEFAULT 0.00,
  pending_payouts decimal(10,2) DEFAULT 0.00,
  total_paid_out decimal(10,2) DEFAULT 0.00,
  last_updated timestamptz DEFAULT now()
);

-- 4. ADD COLUMNS TO PAYMENTS TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'platform_commission'
  ) THEN
    ALTER TABLE payments ADD COLUMN platform_commission decimal(10,2) DEFAULT 0.00;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'organizer_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN organizer_amount decimal(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate payout request number
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS text AS $$
BEGIN
  RETURN 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate financial breakdown
CREATE OR REPLACE FUNCTION calculate_financial_breakdown(sale_amount decimal)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  commission decimal;
  organizer_gross decimal;
  technical_fee decimal;
  organizer_net decimal;
BEGIN
  -- 5% platform commission
  commission := ROUND(sale_amount * 0.05, 2);
  
  -- 95% goes to organizer initially
  organizer_gross := sale_amount - commission;
  
  -- 1.5% technical fees for payout
  technical_fee := ROUND(organizer_gross * 0.015, 2);
  
  -- 93.5% net for organizer
  organizer_net := organizer_gross - technical_fee;
  
  result := jsonb_build_object(
    'sale_amount', sale_amount,
    'platform_commission', commission,
    'platform_percentage', 5.00,
    'organizer_gross', organizer_gross,
    'organizer_gross_percentage', 95.00,
    'technical_fees', technical_fee,
    'technical_fees_percentage', 1.50,
    'organizer_net', organizer_net,
    'organizer_net_percentage', 93.50
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update organizer balance on payment completion
CREATE OR REPLACE FUNCTION update_organizer_balance_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_organizer_id uuid;
  v_breakdown jsonb;
BEGIN
  -- Only process when payment is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get organizer_id from booking
    SELECT e.organizer_id INTO v_organizer_id
    FROM bookings b
    JOIN events e ON b.event_id = e.id
    WHERE b.id = NEW.booking_id;
    
    IF v_organizer_id IS NOT NULL THEN
      -- Calculate breakdown
      v_breakdown := calculate_financial_breakdown(NEW.amount);
      
      -- Update payment record with commission
      UPDATE payments SET
        platform_commission = (v_breakdown->>'platform_commission')::decimal,
        organizer_amount = (v_breakdown->>'organizer_gross')::decimal
      WHERE id = NEW.id;
      
      -- Ensure organizer balance exists
      INSERT INTO organizer_balances (organizer_id)
      VALUES (v_organizer_id)
      ON CONFLICT (organizer_id) DO NOTHING;
      
      -- Update organizer balance
      UPDATE organizer_balances SET
        total_sales = total_sales + NEW.amount,
        platform_commission = platform_commission + (v_breakdown->>'platform_commission')::decimal,
        available_balance = available_balance + (v_breakdown->>'organizer_gross')::decimal,
        last_updated = now()
      WHERE organizer_id = v_organizer_id;
      
      -- Record financial transactions
      INSERT INTO financial_transactions (transaction_type, related_booking_id, organizer_id, amount, description, metadata)
      VALUES
        ('ticket_sale', NEW.booking_id, v_organizer_id, NEW.amount, 'Ticket sale', v_breakdown),
        ('commission', NEW.booking_id, v_organizer_id, (v_breakdown->>'platform_commission')::decimal, 'Platform commission (5%)', v_breakdown);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to process payout request
CREATE OR REPLACE FUNCTION process_payout_request()
RETURNS TRIGGER AS $$
BEGIN
  -- When payout is completed, update balances
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Update organizer balance
    UPDATE organizer_balances SET
      available_balance = available_balance - NEW.amount_requested,
      pending_payouts = pending_payouts - NEW.amount_requested,
      total_paid_out = total_paid_out + NEW.net_amount,
      last_updated = now()
    WHERE organizer_id = NEW.organizer_id;
    
    -- Record financial transactions
    INSERT INTO financial_transactions (transaction_type, related_payout_id, organizer_id, amount, description)
    VALUES
      ('payout_fee', NEW.id, NEW.organizer_id, NEW.technical_fees, 'Technical payout fees (1.5%)'),
      ('organizer_payout', NEW.id, NEW.organizer_id, NEW.net_amount, 'Payout to organizer');
      
  -- When payout is approved, mark as pending
  ELSIF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    
    UPDATE organizer_balances SET
      available_balance = available_balance - NEW.amount_requested,
      pending_payouts = pending_payouts + NEW.amount_requested,
      last_updated = now()
    WHERE organizer_id = NEW.organizer_id;
    
  -- When payout is rejected, release the balance
  ELSIF NEW.status = 'rejected' AND OLD.status IN ('pending', 'approved') THEN
    
    UPDATE organizer_balances SET
      pending_payouts = GREATEST(0, pending_payouts - NEW.amount_requested),
      last_updated = now()
    WHERE organizer_id = NEW.organizer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_balance_on_payment ON payments;
CREATE TRIGGER trigger_update_balance_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_organizer_balance_on_payment();

DROP TRIGGER IF EXISTS trigger_process_payout ON payout_requests;
CREATE TRIGGER trigger_process_payout
  AFTER INSERT OR UPDATE ON payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION process_payout_request();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_balances ENABLE ROW LEVEL SECURITY;

-- PAYOUT REQUESTS POLICIES
CREATE POLICY "Organizers can view own payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create payout requests"
  ON payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payout requests"
  ON payout_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

CREATE POLICY "Admins can update payout requests"
  ON payout_requests FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

-- FINANCIAL TRANSACTIONS POLICIES
CREATE POLICY "Admins can view all financial transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

CREATE POLICY "Organizers can view own financial transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

-- ORGANIZER BALANCES POLICIES
CREATE POLICY "Organizers can view own balance"
  ON organizer_balances FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM organizers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all organizer balances"
  ON organizer_balances FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM admin_users WHERE is_active = true
    )
  );

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payout_requests_organizer_id ON payout_requests(organizer_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_created_at ON payout_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_organizer_id ON financial_transactions(organizer_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_booking_id ON financial_transactions(related_booking_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_payout_id ON financial_transactions(related_payout_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_created_at ON financial_transactions(created_at DESC);