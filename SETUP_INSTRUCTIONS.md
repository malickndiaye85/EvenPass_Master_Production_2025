# Configuration EvenPass - Instructions de Configuration

## Problème Actuel

Les erreurs que vous rencontrez sont dues à l'absence d'utilisateurs dans la base de données Supabase Auth. Voici comment résoudre ce problème.

## Solution : Créer des Utilisateurs de Test

### Étape 1: Accéder au Dashboard Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Connectez-vous à votre projet
3. Accédez à **Authentication** > **Users** dans le menu latéral

### Étape 2: Créer les Utilisateurs de Test

#### A. Utilisateur Admin (pour Admin Finance, Ops Manager, EPscan)

1. Cliquez sur **"Add user"** > **"Create new user"**
2. Remplissez:
   - **Email**: `admin@evenpass.sn`
   - **Password**: `Admin@2025!` (choisissez un mot de passe sécurisé)
   - **Auto Confirm User**: ✅ Coché
3. Cliquez sur **"Create user"**
4. **Notez l'ID (UUID) de l'utilisateur créé**

#### B. Utilisateur Organisateur (pour Espace Organisateur)

1. Cliquez sur **"Add user"** > **"Create new user"**
2. Remplissez:
   - **Email**: `organisateur@evenpass.sn`
   - **Password**: `Organizer@2025!`
   - **Auto Confirm User**: ✅ Coché
3. Cliquez sur **"Create user"**
4. **Notez l'ID (UUID) de l'utilisateur créé**

### Étape 3: Configurer les Profils dans la Base de Données

Une fois les utilisateurs créés, vous devez exécuter ces requêtes SQL dans l'éditeur SQL de Supabase (**SQL Editor**):

#### Créer le Profil Admin

```sql
-- Remplacez 'USER_ID_ADMIN' par l'UUID de l'utilisateur admin créé à l'étape 2A
-- Créer le profil utilisateur
INSERT INTO users (id, email, full_name, phone)
VALUES (
  'USER_ID_ADMIN',  -- Remplacez par le vrai UUID
  'admin@evenpass.sn',
  'Administrateur EvenPass',
  '+221771234567'
);

-- Créer le profil admin
INSERT INTO admin_users (user_id, role, is_active)
VALUES (
  'USER_ID_ADMIN',  -- Remplacez par le vrai UUID
  'super_admin',
  true
);
```

#### Créer le Profil Organisateur

```sql
-- Remplacez 'USER_ID_ORGANIZER' par l'UUID de l'utilisateur organisateur créé à l'étape 2B
-- Créer le profil utilisateur
INSERT INTO users (id, email, full_name, phone)
VALUES (
  'USER_ID_ORGANIZER',  -- Remplacez par le vrai UUID
  'organisateur@evenpass.sn',
  'Organisateur Test',
  '+221771234568'
);

-- Créer le profil organisateur
INSERT INTO organizers (user_id, organization_name, organization_type, verification_status, contact_email, contact_phone, is_active)
VALUES (
  'USER_ID_ORGANIZER',  -- Remplacez par le vrai UUID
  'EventPro Sénégal',
  'company',
  'verified',
  'organisateur@evenpass.sn',
  '+221771234568',
  true
);
```

### Étape 4: Tester les Connexions

Maintenant vous pouvez tester les différents accès:

#### Tester l'Espace Organisateur
1. Allez sur votre application
2. Cliquez sur **"Espace Organisateur"** dans le header
3. Connectez-vous avec:
   - Email: `organisateur@evenpass.sn`
   - Mot de passe: celui que vous avez défini

#### Tester Admin Finance (Bouton Vert)
1. Cliquez sur le petit bouton vert en bas à droite du footer
2. Connectez-vous avec:
   - Email: `admin@evenpass.sn`
   - Mot de passe: celui que vous avez défini

#### Tester Ops Manager (Bouton Jaune)
1. Cliquez sur le petit bouton jaune en bas à droite du footer
2. Connectez-vous avec les mêmes identifiants admin

#### Tester EPscan (Bouton Rouge)
1. Cliquez sur le petit bouton rouge en bas à droite du footer
2. Connectez-vous avec les mêmes identifiants admin

## Structure de l'Application

### Accès Public
- **Page d'accueil**: Visible par tous, affiche les événements publiés
- **Détails d'événement**: Accessible à tous

### Accès Organisateur
- **Login**: `/organizer/login`
- **Dashboard**: `/organizer/dashboard` (protégé, réservé aux organisateurs)

### Accès Admin
- **Admin Finance Login**: `/admin/finance/login`
- **Admin Finance**: `/admin/finance` (protégé, réservé aux admins)
- **Ops Manager Login**: `/admin/ops/login`
- **Ops Manager**: `/admin/ops` (protégé, réservé aux admins)
- **EPscan Login**: `/scan/login`
- **EPscan**: `/scan` (protégé, réservé aux admins)

## Palette de Couleurs EvenPass

- **Noir profond**: `#0F0F0F` (Arrière-plans)
- **Orange EvenPass**: `#FF7A00` (Boutons principaux, accents)
- **Blanc pur**: `#FFFFFF` (Textes principaux)
- **Gris UI**: `#2A2A2A` (Cartes, conteneurs)
- **Gris texte**: `#B5B5B5` (Textes secondaires)

## Dépannage

### Erreur 404 sur les tables
✅ **Résolu** - Les politiques RLS ont été mises à jour pour permettre l'accès public

### Erreur 400 sur l'authentification
➡️ Créez les utilisateurs comme indiqué ci-dessus

### L'organisateur ne peut pas se connecter
- Vérifiez que le profil `organizers` a bien été créé
- Vérifiez que `verification_status = 'verified'`
- Vérifiez que `is_active = true`

### L'admin ne peut pas se connecter
- Vérifiez que le profil `admin_users` a bien été créé
- Vérifiez que `role = 'super_admin'` (ou 'finance', 'ops_manager')
- Vérifiez que `is_active = true`

## Données de Démo (Optionnel)

Pour créer un événement de démo et tester l'affichage:

```sql
-- Récupérer l'ID de l'organisateur
SELECT id FROM organizers WHERE organization_name = 'EventPro Sénégal';

-- Créer un événement de démo (remplacez ORGANIZER_ID)
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
  capacity
)
SELECT
  'ORGANIZER_ID',  -- Remplacez par le vrai UUID
  id,  -- Prend la première catégorie (Lutte)
  'Grand Combat de Lutte - Dakar 2025',
  'grand-combat-lutte-dakar-2025',
  'Le plus grand combat de lutte de l''année avec les champions nationaux',
  'Combat de lutte avec les meilleurs lutteurs du Sénégal',
  'Stade Demba Diop',
  'Avenue Cheikh Anta Diop, Dakar',
  'Dakar',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '30 days' + INTERVAL '4 hours',
  'published',
  true,
  15000
FROM event_categories
WHERE slug = 'lutte-senegalaise'
LIMIT 1;

-- Créer des types de billets
INSERT INTO ticket_types (event_id, name, description, price, quantity_total)
SELECT
  id,
  'Tribune VIP',
  'Accès tribune VIP avec vue dégagée',
  25000,
  500
FROM events WHERE slug = 'grand-combat-lutte-dakar-2025';

INSERT INTO ticket_types (event_id, name, description, price, quantity_total)
SELECT
  id,
  'Tribune Standard',
  'Accès tribune standard',
  10000,
  2000
FROM events WHERE slug = 'grand-combat-lutte-dakar-2025';

INSERT INTO ticket_types (event_id, name, description, price, quantity_total)
SELECT
  id,
  'Pelouse',
  'Accès pelouse',
  5000,
  5000
FROM events WHERE slug = 'grand-combat-lutte-dakar-2025';
```

## Support

Si vous rencontrez des problèmes, vérifiez:
1. Les variables d'environnement dans `.env`
2. Les logs de la console navigateur (F12 > Console)
3. Les erreurs dans l'onglet Network (F12 > Network)
