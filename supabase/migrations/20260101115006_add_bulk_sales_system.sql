/*
  # Système de Ventes en Bloc (Admin Finance)

  1. Nouvelles Tables
    - `bulk_sales`: Enregistre les ventes de bloc générées par l'admin
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key)
      - `ticket_type_id` (uuid, foreign key)
      - `quantity` (integer) - Nombre de billets générés
      - `total_amount` (numeric) - Montant total
      - `created_by` (uuid) - UID de l'admin qui a créré
      - `origin` (text) - Tag "ADMIN_BULK"
      - `notes` (text) - Notes optionnelles
      - `created_at` (timestamptz)

  2. Modifications
    - Ajouter colonne `is_admin_finance` dans `organizers` pour identifier l'admin finance
    - Ajouter colonne `origin` dans `tickets` pour marquer les billets en bloc
    - Ajouter colonne `bulk_sale_id` dans `tickets` pour référencer la vente en bloc

  3. Security
    - Enable RLS
    - Policies pour Admin Finance uniquement
*/

-- Ajouter colonne is_admin_finance à organizers
ALTER TABLE organizers
  ADD COLUMN IF NOT EXISTS is_admin_finance boolean DEFAULT false;

-- Créer un index pour performance
CREATE INDEX IF NOT EXISTS idx_organizers_admin_finance ON organizers(is_admin_finance) WHERE is_admin_finance = true;

-- Table bulk_sales
CREATE TABLE IF NOT EXISTS bulk_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id uuid REFERENCES ticket_types(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  origin text NOT NULL DEFAULT 'ADMIN_BULK',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bulk_sales_event ON bulk_sales(event_id);
CREATE INDEX IF NOT EXISTS idx_bulk_sales_created_by ON bulk_sales(created_by);
CREATE INDEX IF NOT EXISTS idx_bulk_sales_created_at ON bulk_sales(created_at DESC);

-- Ajouter colonnes à tickets
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS origin text DEFAULT 'WEB_SALE',
  ADD COLUMN IF NOT EXISTS bulk_sale_id uuid REFERENCES bulk_sales(id) ON DELETE SET NULL;

-- Index sur origin pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_tickets_origin ON tickets(origin);
CREATE INDEX IF NOT EXISTS idx_tickets_bulk_sale ON tickets(bulk_sale_id) WHERE bulk_sale_id IS NOT NULL;

-- RLS pour bulk_sales
ALTER TABLE bulk_sales ENABLE ROW LEVEL SECURITY;

-- Admin Finance peut tout voir et créer
CREATE POLICY "Admin Finance can view all bulk sales"
  ON bulk_sales
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.user_id = auth.uid()
      AND organizers.is_admin_finance = true
    )
  );

CREATE POLICY "Admin Finance can create bulk sales"
  ON bulk_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.user_id = auth.uid()
      AND organizers.is_admin_finance = true
    )
  );

-- Fonction pour générer des billets en bloc
CREATE OR REPLACE FUNCTION generate_bulk_tickets(
  p_event_id uuid,
  p_ticket_type_id uuid,
  p_quantity integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bulk_sale_id uuid;
  v_ticket_price numeric;
  v_total_amount numeric;
  v_ticket_number text;
  v_qr_code text;
  v_tickets_created jsonb[] := '{}';
  v_ticket_id uuid;
  v_event_title text;
  v_ticket_type_name text;
  i integer;
BEGIN
  -- Vérifier que l'utilisateur est Admin Finance
  IF NOT EXISTS (
    SELECT 1 FROM organizers
    WHERE user_id = auth.uid()
    AND is_admin_finance = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin Finance only';
  END IF;

  -- Récupérer le prix du billet et infos
  SELECT price, name INTO v_ticket_price, v_ticket_type_name
  FROM ticket_types
  WHERE id = p_ticket_type_id;

  SELECT title INTO v_event_title
  FROM events
  WHERE id = p_event_id;

  IF v_ticket_price IS NULL THEN
    RAISE EXCEPTION 'Ticket type not found';
  END IF;

  -- Calculer le montant total
  v_total_amount := v_ticket_price * p_quantity;

  -- Créer l'entrée bulk_sale
  INSERT INTO bulk_sales (
    event_id,
    ticket_type_id,
    quantity,
    total_amount,
    created_by,
    notes
  )
  VALUES (
    p_event_id,
    p_ticket_type_id,
    p_quantity,
    v_total_amount,
    auth.uid(),
    p_notes
  )
  RETURNING id INTO v_bulk_sale_id;

  -- Générer les billets
  FOR i IN 1..p_quantity LOOP
    -- Générer ticket number et QR code
    SELECT 'TK-' || LPAD(FLOOR(random() * 1000000)::text, 6, '0') INTO v_ticket_number;
    SELECT 'QR-' || encode(gen_random_bytes(16), 'hex') INTO v_qr_code;

    -- Insérer le billet
    INSERT INTO tickets (
      ticket_number,
      qr_code,
      event_id,
      ticket_type_id,
      price_paid,
      status,
      origin,
      bulk_sale_id,
      holder_name,
      holder_email
    )
    VALUES (
      v_ticket_number,
      v_qr_code,
      p_event_id,
      p_ticket_type_id,
      v_ticket_price,
      'valid',
      'ADMIN_BULK',
      v_bulk_sale_id,
      'Vente en Bloc - ' || v_ticket_type_name,
      NULL
    )
    RETURNING id INTO v_ticket_id;

    -- Ajouter aux résultats
    v_tickets_created := v_tickets_created || jsonb_build_object(
      'ticket_id', v_ticket_id,
      'ticket_number', v_ticket_number,
      'qr_code', v_qr_code
    );
  END LOOP;

  -- Mettre à jour quantity_sold du ticket_type
  UPDATE ticket_types
  SET quantity_sold = quantity_sold + p_quantity
  WHERE id = p_ticket_type_id;

  -- Retourner le résultat
  RETURN jsonb_build_object(
    'bulk_sale_id', v_bulk_sale_id,
    'quantity', p_quantity,
    'total_amount', v_total_amount,
    'event_title', v_event_title,
    'ticket_type_name', v_ticket_type_name,
    'tickets', v_tickets_created
  );
END;
$$;

-- Fonction pour obtenir les statistiques avec distinction web/bulk
CREATE OR REPLACE FUNCTION get_event_sales_stats(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_web_sales numeric := 0;
  v_bulk_sales numeric := 0;
  v_total_sales numeric := 0;
  v_web_tickets integer := 0;
  v_bulk_tickets integer := 0;
  v_total_tickets integer := 0;
  v_commission numeric := 0;
  v_gateway_fees numeric := 0;
  v_net_payout numeric := 0;
BEGIN
  -- Ventes Web (origin = 'WEB_SALE')
  SELECT
    COALESCE(SUM(price_paid), 0),
    COUNT(*)
  INTO v_web_sales, v_web_tickets
  FROM tickets
  WHERE event_id = p_event_id
  AND origin = 'WEB_SALE'
  AND status = 'valid';

  -- Ventes en Bloc (origin = 'ADMIN_BULK')
  SELECT
    COALESCE(SUM(price_paid), 0),
    COUNT(*)
  INTO v_bulk_sales, v_bulk_tickets
  FROM tickets
  WHERE event_id = p_event_id
  AND origin = 'ADMIN_BULK'
  AND status = 'valid';

  -- Total
  v_total_sales := v_web_sales + v_bulk_sales;
  v_total_tickets := v_web_tickets + v_bulk_tickets;

  -- Commission 5% sur TOUT
  v_commission := v_total_sales * 0.05;

  -- Frais passerelle 1.5% UNIQUEMENT sur ventes web
  v_gateway_fees := v_web_sales * 0.015;

  -- Payout net
  v_net_payout := v_total_sales - v_commission - v_gateway_fees;

  RETURN jsonb_build_object(
    'web_sales', v_web_sales,
    'web_tickets', v_web_tickets,
    'bulk_sales', v_bulk_sales,
    'bulk_tickets', v_bulk_tickets,
    'total_sales', v_total_sales,
    'total_tickets', v_total_tickets,
    'commission', v_commission,
    'gateway_fees', v_gateway_fees,
    'net_payout', v_net_payout
  );
END;
$$;

-- Commentaires
COMMENT ON COLUMN organizers.is_admin_finance IS 'Indique si cet organisateur a les droits Admin Finance';
COMMENT ON TABLE bulk_sales IS 'Ventes en bloc générées par Admin Finance';
COMMENT ON COLUMN tickets.origin IS 'Source du billet: WEB_SALE ou ADMIN_BULK';
COMMENT ON COLUMN tickets.bulk_sale_id IS 'Référence à la vente en bloc si applicable';
COMMENT ON FUNCTION generate_bulk_tickets IS 'Génère des billets en masse pour Admin Finance';
COMMENT ON FUNCTION get_event_sales_stats IS 'Statistiques détaillées avec distinction web vs bulk';
