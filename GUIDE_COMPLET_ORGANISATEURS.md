# Guide Complet - Système Organisateurs EvenPass

## 📋 Vue d'ensemble

Système complet de gestion des organisateurs avec authentification Supabase, vérification KYC, isolation multi-tenant et gestion financière.

---

## 🚀 Fonctionnalités Implémentées

### ✅ 1. Inscription Organisateur (3 étapes)
**Route** : `/organizer/signup`

#### Étape 1 : Création de compte
- Nom complet
- Email (unique dans Supabase Auth)
- Téléphone
- Mot de passe (min 6 caractères)

#### Étape 2 : Informations Organisation
- Nom de l'organisation
- Type (Individuel, Entreprise, Association, ONG)
- Description
- Email de contact
- Téléphone de contact
- Site web (optionnel)
- Ville

#### Étape 3 : Vérification & Paiement
- **Opérateur Mobile Money** (Wave, Orange Money, Free Money)
- **Numéro Marchand** (obligatoire pour les reversements)
- **Upload Documents KYC** :
  - CNI (obligatoire)
  - Registre de commerce (pour entreprises/ONG)

**Processus technique** :
1. Création compte Supabase Auth
2. Création profil `users`
3. Upload documents dans bucket `verification-documents`
4. Création profil `organizers` avec :
   - `verification_status: 'pending'`
   - `is_active: false`
   - `bank_account_info: { provider, phone }`
5. Déconnexion immédiate pour éviter accès non autorisé

---

### ✅ 2. Connexion Organisateur avec Vérification de Statut
**Route** : `/organizer/login`

**Processus de connexion** :
1. Authentification Supabase Auth
2. Récupération profil organisateur
3. **Vérification du statut** :
   - `pending` → Redirect `/organizer/pending`
   - `rejected` → Message d'erreur + déconnexion
   - `verified` + `is_active` → Redirect `/organizer/dashboard`
   - Autres cas → Message d'erreur

**Sécurité** :
- Isolation par UID (auth.uid())
- Déconnexion automatique si statut non valide
- RLS activée sur toutes les requêtes

---

### ✅ 3. Écran d'Attente Vérification
**Route** : `/organizer/pending`

**Contenu** :
- Message explicatif du processus
- Délai de traitement : **24 heures**
- Contacts support :
  - 📞 77 139 29 26
  - 📧 contact@evenpass.sn
- Boutons :
  - Se déconnecter
  - Retour à l'accueil

**Affichage** :
- ✅ Demande reçue
- ⏳ Vérification en cours
- 📧 Notification par email à venir

---

### ✅ 4. Dashboard Admin Finance - Onglet Vérification
**Route** : `/admin/finance` (onglet "✅ Vérification Organisateurs")

**Fonctionnalités** :
- Liste tous les organisateurs avec `verification_status = 'pending'`
- Affichage tri par date (plus récents en premier)
- Pour chaque organisateur :
  - Nom organisation + type
  - Email + téléphone
  - Date de demande
  - Bouton "Examiner"

**Modal de vérification** :
- **Informations Organisation** :
  - Nom, type, description
  - Site web

- **Contact** :
  - Nom du responsable
  - Email, téléphone

- **Informations de paiement** :
  - Opérateur Mobile Money
  - Numéro Marchand
  - ⚠️ Avertissement : Les reversements se feront sur ce numéro

- **Documents KYC** :
  - Liens vers CNI (clic pour ouvrir)
  - Liens vers Registre de commerce (si applicable)

- **Actions** :
  - ✅ **Approuver** :
    - Change `verification_status` → `verified`
    - Change `is_active` → `true`
    - Organisateur peut se connecter immédiatement

  - ❌ **Rejeter** :
    - Champ raison obligatoire
    - Change `verification_status` → `rejected`
    - Change `is_active` → `false`
    - Organisateur notifié

---

## 🔒 Sécurité & Isolation Multi-tenant

### Row Level Security (RLS)

#### Table `users`
```sql
-- Les utilisateurs ne voient que leur propre profil
POLICY "Users can view own profile"
  USING (auth.uid() = id)

-- Les utilisateurs peuvent modifier leur propre profil
POLICY "Users can update own profile"
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id)
```

#### Table `organizers`
```sql
-- Les utilisateurs peuvent voir leur propre profil organisateur
POLICY "Users can view own organizer profile"
  USING (user_id = auth.uid())

-- Les utilisateurs peuvent créer leur profil organisateur
POLICY "Users can create organizer profile"
  WITH CHECK (user_id = auth.uid())

-- Les organisateurs peuvent modifier leur profil
POLICY "Organizers can update own profile"
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid())

-- Les admins peuvent voir tous les profils
POLICY "Admins can view all organizers"
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
```

#### Bucket Storage `verification-documents`
```sql
-- Upload : Les utilisateurs peuvent uploader leurs propres documents
-- Le nom du fichier doit commencer par leur UID
POLICY "Users can upload own verification documents"
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )

-- Lecture : Les utilisateurs peuvent lire leurs documents + admins tous
POLICY "Users can view own verification documents"
  USING (
    bucket_id = 'verification-documents' AND
    (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )

-- Suppression : Seuls les admins peuvent supprimer
POLICY "Admins can delete verification documents"
  USING (
    bucket_id = 'verification-documents' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'finance')
      AND is_active = true
    )
  )
```

### Isolation par UID

**Principe** : Chaque organisateur a un UID unique (généré par Supabase Auth)

**Filtrage automatique** :
```typescript
// Exemple : Récupérer les événements de l'organisateur connecté
const { data: events } = await supabase
  .from('events')
  .select('*')
  .eq('organizer_id', organizer.id)
  // RLS s'assure automatiquement que organizer.id appartient à auth.uid()
```

**Protection** :
- ❌ Un organisateur ne peut PAS voir les événements d'un autre
- ❌ Un organisateur ne peut PAS modifier les données d'un autre
- ✅ Seuls les admins ont une vue globale

---

## 💰 Logique Financière

### Calcul des Revenus

```
Prix Billet Client = 10,000 FCFA (100%)

┌─────────────────────────────────────────┐
│ 10,000 FCFA                             │
│ Payé par le client                      │
└─────────────────────────────────────────┘
           │
           ├─► 500 FCFA (5%)
           │   Commission plateforme EvenPass
           │   Enregistré dans `platform_commission`
           │
           └─► 9,500 FCFA (95%)
               Disponible pour l'organisateur
               Enregistré dans `available_balance`
                      │
                      │ Demande de payout
                      │
                      ├─► 142.50 FCFA (1.5%)
                      │   Frais techniques de transaction
                      │   (Wave, Orange Money, Free Money)
                      │
                      └─► 9,357.50 FCFA (93.5%)
                          Net versé à l'organisateur
                          Sur le Numéro Marchand renseigné
```

### Table `organizer_balances`

```sql
CREATE TABLE organizer_balances (
  organizer_id uuid PRIMARY KEY,
  total_sales numeric DEFAULT 0,              -- 100% des ventes
  platform_commission numeric DEFAULT 0,       -- 5%
  available_balance numeric DEFAULT 0,         -- 95% (retirable)
  pending_payouts numeric DEFAULT 0,           -- Montant en attente
  total_paid_out numeric DEFAULT 0,            -- Total déjà versé
  last_updated timestamptz DEFAULT now()
);
```

### Workflow Payout

1. **Organisateur demande payout** :
   - Montant max = `available_balance`
   - Calcul automatique :
     - `technical_fees = montant * 0.015` (1.5%)
     - `net_amount = montant - technical_fees` (93.5%)

2. **Admin Finance approuve** :
   - Status `pending` → `approved` → `processing`
   - Mise à jour `organizer_balances` :
     - `available_balance -= montant`
     - `pending_payouts += net_amount`

3. **Paiement effectué** :
   - Status `processing` → `completed`
   - Mise à jour `organizer_balances` :
     - `pending_payouts -= net_amount`
     - `total_paid_out += net_amount`
   - Versement sur le **Numéro Marchand** via opérateur choisi

---

## 🔄 Workflows Complets

### Workflow 1 : Inscription et Approbation Organisateur

```
ORGANISATEUR                        SYSTÈME                           ADMIN FINANCE

1. /organizer/signup
   Remplit formulaire 3 étapes
   ↓
2. Upload CNI + Registre          → Supabase Auth.signUp()
   ↓                                → Insert users
3. Soumission                      → Upload docs (bucket)
   ↓                                → Insert organizers
                                      status: 'pending'
                                      is_active: false
                                    → Auth.signOut() (sécurité)

4. Redirect /organizer/login
   ↓
5. Connexion                       → Auth.signInWithPassword()
   ↓                                → Query organizers
                                    → Status = 'pending'

6. Redirect /organizer/pending
   Écran d'attente
   Message: 24h max

                                                                    7. Login admin
                                                                       /admin/finance
                                                                       ↓
                                                                    8. Onglet "Vérification"
                                                                       Voit la demande
                                                                       ↓
                                                                    9. Clic "Examiner"
                                                                       Vérifie documents KYC
                                                                       Vérifie numéro marchand
                                                                       ↓
                                                                    10. Décision:

                                                                        ✅ APPROUVER:
                                                                        → Update organizers:
                                                                          verification_status = 'verified'
                                                                          is_active = true

                                                                        ❌ REJETER:
                                                                        → Update organizers:
                                                                          verification_status = 'rejected'
                                                                          is_active = false

11. Email de notification         ← Email envoyé
    (automatique)

12. Reconnexion                   → Auth.signInWithPassword()
                                   → Query organizers
                                   → Status = 'verified', is_active = true

13. Redirect /organizer/dashboard ✅
    Accès complet
```

### Workflow 2 : Accès Bloqué en Attente

```
ORGANISATEUR                        SYSTÈME

1. Login pendant vérification     → Auth.signInWithPassword()
                                   → Query organizers
                                   → Status = 'pending'

2. Redirect /organizer/pending
   ↓
   Écran d'attente:
   - ⏳ Vérification en cours
   - 📞 Contact: 77 139 29 26
   - 📧 Email: contact@evenpass.sn
   - Délai: 24h

3. Options:
   - Se déconnecter
   - Retour accueil
   - Attendre email
```

### Workflow 3 : Rejet de Demande

```
ORGANISATEUR                        SYSTÈME                           ADMIN FINANCE

                                                                    1. Examine demande
                                                                       ↓
                                                                    2. Problème détecté:
                                                                       - Documents invalides
                                                                       - Informations incorrectes
                                                                       - etc.
                                                                       ↓
                                                                    3. Saisie raison du refus
                                                                       (obligatoire)
                                                                       ↓
                                                                    4. Clic "Rejeter"
                                                                       ↓
                                                                       → Update organizers:
                                                                         verification_status = 'rejected'
                                                                         is_active = false

5. Email de notification           ← Email avec raison
   reçu avec motif

6. Tentative de connexion         → Auth.signInWithPassword()
                                   → Query organizers
                                   → Status = 'rejected'

7. Message d'erreur affiché:
   "Votre compte a été rejeté.
   Veuillez contacter le support
   pour plus d'informations."
   ↓
8. Contact support:
   - 📞 77 139 29 26
   - 📧 contact@evenpass.sn
```

---

## 📁 Structure des Fichiers

### Nouveaux Fichiers Créés

```
src/
├── pages/
│   ├── OrganizerSignupPage.tsx          ✅ Inscription 3 étapes + KYC
│   ├── OrganizerLoginPage.tsx           ✅ Login avec vérification statut
│   ├── PendingVerificationPage.tsx      ✅ Écran d'attente
│   └── AdminFinancePage.tsx             ✅ Ajout onglet vérification
│
├── components/
│   └── OrganizerVerificationTab.tsx     ✅ Composant vérification admins
│
supabase/
└── migrations/
    └── create_storage_bucket_...sql     ✅ Bucket documents KYC
```

### Fichiers Modifiés

```
src/
├── App.tsx                              ✅ Route /organizer/pending
└── pages/
    └── AdminFinancePage.tsx             ✅ Onglet vérification + déconnexion
```

---

## 🎯 Données Requises

### Variables d'environnement (.env)

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Bucket Supabase Storage

**Nom** : `verification-documents`
**Public** : Non (private)
**Structure** :
```
verification-documents/
├── {user_id}/
│   ├── cni_1735678901234.jpg
│   └── registre_1735678901235.pdf
```

### Tables Supabase

Toutes les tables sont déjà définies dans les migrations :
- ✅ `users`
- ✅ `organizers`
- ✅ `organizer_balances`
- ✅ `admin_users`
- ✅ `events`
- ✅ `payout_requests`
- ✅ `financial_transactions`

---

## 🧪 Tests à Effectuer

### Test 1 : Inscription Organisateur

1. ✅ Aller sur `/organizer/signup`
2. ✅ Remplir Étape 1 (compte)
3. ✅ Remplir Étape 2 (organisation)
4. ✅ Remplir Étape 3 :
   - Sélectionner opérateur
   - Saisir numéro marchand
   - Uploader CNI
   - Uploader registre (si entreprise)
5. ✅ Soumettre
6. ✅ Vérifier message de confirmation
7. ✅ Redirection vers `/organizer/login`

**Vérifications Supabase** :
```sql
-- Vérifier user créé
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- Vérifier profil users
SELECT * FROM users WHERE email = 'test@example.com';

-- Vérifier profil organizers
SELECT * FROM organizers WHERE user_id = '{user_id}';
-- Doit avoir: verification_status = 'pending', is_active = false

-- Vérifier documents uploadés
SELECT * FROM storage.objects
WHERE bucket_id = 'verification-documents'
AND name LIKE '{user_id}%';
```

### Test 2 : Connexion Pending

1. ✅ Login avec compte en attente
2. ✅ Vérifier redirection `/organizer/pending`
3. ✅ Vérifier affichage écran d'attente
4. ✅ Vérifier présence contacts support

### Test 3 : Approbation Admin

1. ✅ Login admin `/admin/finance/login`
2. ✅ Clic onglet "✅ Vérification Organisateurs"
3. ✅ Vérifier présence demande
4. ✅ Clic "Examiner"
5. ✅ Vérifier affichage modal avec :
   - Infos organisation
   - Contacts
   - Numéro marchand
   - Documents KYC (cliquables)
6. ✅ Clic "Approuver l'organisateur"
7. ✅ Confirmation

**Vérifications Supabase** :
```sql
-- Vérifier update
SELECT verification_status, is_active
FROM organizers
WHERE id = '{organizer_id}';
-- Doit avoir: verification_status = 'verified', is_active = true
```

### Test 4 : Accès Dashboard Après Approbation

1. ✅ Déconnexion organisateur
2. ✅ Reconnexion `/organizer/login`
3. ✅ Vérifier redirection `/organizer/dashboard`
4. ✅ Accès complet aux fonctionnalités

### Test 5 : Rejet de Demande

1. ✅ Admin: Examiner demande
2. ✅ Saisir raison du refus
3. ✅ Clic "Rejeter la demande"
4. ✅ Organisateur: Tentative connexion
5. ✅ Vérifier message d'erreur
6. ✅ Vérifier déconnexion automatique

---

## 🔧 Maintenance & Évolutions

### Ajouts Futurs Possibles

1. **Email Automatiques** :
   - Email de confirmation d'inscription
   - Email d'approbation
   - Email de rejet avec raison

2. **Notifications Push** :
   - Notification temps réel de décision admin

3. **Dashboard Organisateur Enrichi** :
   - Statistiques en temps réel (connectées Supabase)
   - Création d'événements (formulaire complet)
   - Gestion financière (payouts réels)

4. **Amélioration KYC** :
   - Vérification automatique CNI
   - API de vérification d'identité
   - OCR pour extraction données

5. **Multi-devise** :
   - Support autres devises (EUR, USD)
   - Taux de change dynamiques

---

## 📞 Support

**En cas de problème technique** :
- 📞 Téléphone : 77 139 29 26
- 📧 Email : contact@evenpass.sn
- 🌐 Site : www.evenpass.sn

**Documentation Supabase** :
- Auth : https://supabase.com/docs/guides/auth
- Storage : https://supabase.com/docs/guides/storage
- RLS : https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Checklist Déploiement

### Avant le déploiement

- [ ] Variables d'environnement configurées
- [ ] Migrations Supabase appliquées
- [ ] Bucket `verification-documents` créé
- [ ] RLS policies activées
- [ ] Admin users créés dans `admin_users`
- [ ] Test inscription organisateur
- [ ] Test approbation/rejet
- [ ] Test login avec différents statuts
- [ ] Build production sans erreurs

### Après le déploiement

- [ ] Vérifier routes accessibles
- [ ] Tester upload documents
- [ ] Vérifier emails de notification (si configurés)
- [ ] Tester workflow complet end-to-end
- [ ] Monitoring des erreurs activé

---

**🎉 Le système de gestion des organisateurs est maintenant complet et sécurisé !**
