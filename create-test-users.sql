-- ============================================
-- SCRIPT DE CRÉATION D'UTILISATEURS DE TEST
-- ============================================
--
-- IMPORTANT: Avant d'exécuter ce script, vous DEVEZ créer les utilisateurs
-- dans Supabase Auth. Suivez les étapes ci-dessous.
--

-- ============================================
-- ÉTAPE 1: Créer les utilisateurs dans Supabase Auth
-- ============================================
--
-- Allez sur https://supabase.com/dashboard
-- → Authentication → Users → Add user → Create new user
--
-- Créez 2 utilisateurs:
-- 1. admin@evenpass.sn (avec mot de passe sécurisé)
-- 2. organisateur@evenpass.sn (avec mot de passe sécurisé)
--
-- ⚠️ Cochez "Auto Confirm User" pour les deux
-- ⚠️ Notez les UUID générés pour chaque utilisateur
--

-- ============================================
-- ÉTAPE 2: Remplacer les UUIDs ci-dessous
-- ============================================
--
-- Remplacez 'ADMIN_USER_ID_HERE' et 'ORGANIZER_USER_ID_HERE'
-- par les vrais UUIDs que vous avez obtenus à l'étape 1
--

-- ============================================
-- CRÉATION DU PROFIL ADMINISTRATEUR
-- ============================================

-- Insérer le profil utilisateur admin
INSERT INTO users (id, email, full_name, phone)
VALUES (
  'ADMIN_USER_ID_HERE',  -- ⚠️ REMPLACEZ PAR LE VRAI UUID
  'admin@evenpass.sn',
  'Administrateur EvenPass',
  '+221771234567'
);

-- Créer le profil admin avec tous les privilèges
INSERT INTO admin_users (user_id, role, is_active, permissions)
VALUES (
  'ADMIN_USER_ID_HERE',  -- ⚠️ REMPLACEZ PAR LE VRAI UUID
  'super_admin',
  true,
  '{
    "finance": true,
    "ops_manager": true,
    "scanner": true,
    "all_access": true
  }'::jsonb
);

-- ============================================
-- CRÉATION DU PROFIL ORGANISATEUR
-- ============================================

-- Insérer le profil utilisateur organisateur
INSERT INTO users (id, email, full_name, phone)
VALUES (
  'ORGANIZER_USER_ID_HERE',  -- ⚠️ REMPLACEZ PAR LE VRAI UUID
  'organisateur@evenpass.sn',
  'Organisateur Test',
  '+221771234568'
);

-- Créer le profil organisateur vérifié
INSERT INTO organizers (
  user_id,
  organization_name,
  organization_type,
  verification_status,
  contact_email,
  contact_phone,
  description,
  is_active,
  commission_rate
)
VALUES (
  'ORGANIZER_USER_ID_HERE',  -- ⚠️ REMPLACEZ PAR LE VRAI UUID
  'EventPro Sénégal',
  'company',
  'verified',
  'organisateur@evenpass.sn',
  '+221771234568',
  'Organisateur professionnel d''événements au Sénégal',
  true,
  10.00
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Vérifier que les utilisateurs ont été créés correctement
SELECT
  u.email,
  u.full_name,
  'Admin' as role
FROM users u
JOIN admin_users au ON u.id = au.user_id
WHERE u.email = 'admin@evenpass.sn';

SELECT
  u.email,
  u.full_name,
  o.organization_name,
  o.verification_status,
  'Organisateur' as role
FROM users u
JOIN organizers o ON u.id = o.user_id
WHERE u.email = 'organisateur@evenpass.sn';

-- ============================================
-- DONNÉES DE DÉMO (OPTIONNEL)
-- ============================================
--
-- Créer un événement de démo pour tester l'affichage
--

-- Récupérer l'ID de l'organisateur
DO $$
DECLARE
  v_organizer_id uuid;
  v_category_id uuid;
  v_event_id uuid;
BEGIN
  -- Récupérer l'organisateur
  SELECT id INTO v_organizer_id
  FROM organizers
  WHERE organization_name = 'EventPro Sénégal'
  LIMIT 1;

  -- Récupérer la catégorie Lutte
  SELECT id INTO v_category_id
  FROM event_categories
  WHERE slug = 'lutte-senegalaise'
  LIMIT 1;

  -- Créer l'événement
  IF v_organizer_id IS NOT NULL AND v_category_id IS NOT NULL THEN
    INSERT INTO events (
      organizer_id,
      category_id,
      title,
      slug,
      description,
      short_description,
      venue_name,
      venue_address,
      venue_city,
      start_date,
      end_date,
      status,
      is_featured,
      is_free,
      capacity,
      min_age
    )
    VALUES (
      v_organizer_id,
      v_category_id,
      'Grand Combat de Lutte - Dakar 2025',
      'grand-combat-lutte-dakar-2025',
      E'Le plus grand combat de lutte de l\'année réunissant les champions nationaux.\n\nAu programme:\n- Combat principal: Champion vs Champion\n- Combats préliminaires\n- Animation musicale\n- Restauration sur place',
      'Combat de lutte avec les meilleurs lutteurs du Sénégal',
      'Stade Demba Diop',
      'Avenue Cheikh Anta Diop, Dakar',
      'Dakar',
      NOW() + INTERVAL '30 days',
      NOW() + INTERVAL '30 days' + INTERVAL '4 hours',
      'published',
      true,
      false,
      15000,
      6
    )
    RETURNING id INTO v_event_id;

    -- Créer les types de billets
    INSERT INTO ticket_types (event_id, name, description, price, quantity_total, display_order)
    VALUES
      (v_event_id, 'Tribune VIP', 'Accès tribune VIP avec vue dégagée sur le ring', 25000, 500, 1),
      (v_event_id, 'Tribune Standard', 'Accès tribune standard', 10000, 2000, 2),
      (v_event_id, 'Pelouse', 'Accès pelouse debout', 5000, 5000, 3);

    RAISE NOTICE 'Événement créé avec succès!';
  ELSE
    RAISE NOTICE 'Erreur: Organisateur ou catégorie non trouvé';
  END IF;
END $$;

-- ============================================
-- INSTRUCTIONS DE TEST
-- ============================================
--
-- 1. TESTER L'ESPACE ORGANISATEUR:
--    - Cliquez sur "Espace Organisateur" (bouton orange dans le header)
--    - Connectez-vous avec: organisateur@evenpass.sn
--    - Vous devriez accéder au Dashboard Organisateur
--
-- 2. TESTER ADMIN FINANCE (Bouton Vert):
--    - Cliquez sur le petit bouton vert en bas à droite du footer
--    - Connectez-vous avec: admin@evenpass.sn
--    - Vous devriez accéder au Dashboard Finance
--
-- 3. TESTER OPS MANAGER (Bouton Jaune):
--    - Cliquez sur le petit bouton jaune en bas à droite du footer
--    - Connectez-vous avec: admin@evenpass.sn
--    - Vous devriez accéder au Dashboard Ops Manager
--
-- 4. TESTER EPSCAN (Bouton Rouge):
--    - Cliquez sur le petit bouton rouge en bas à droite du footer
--    - Connectez-vous avec: admin@evenpass.sn
--    - Vous devriez accéder au Dashboard EPscan
