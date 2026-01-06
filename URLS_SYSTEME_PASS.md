# URLs Complètes du Système EvenPass + PASS

## 🎯 Univers EVEN (Billetterie Événementielle)

### Pages Publiques
- **Page d'accueil EVEN** : `https://evenpass.sn/even`
- **Détail d'un événement** : `https://evenpass.sn/event/{slug}`
- **Comment ça marche** : `https://evenpass.sn/how-it-works`
- **Pour les organisateurs** : `https://evenpass.sn/for-organizers`
- **Paiement réussi** : `https://evenpass.sn/success`
- **Erreur de paiement** : `https://evenpass.sn/error`

### Espace Organisateur
- **Inscription organisateur** : `https://evenpass.sn/organizer/signup`
- **Connexion organisateur** : `https://evenpass.sn/organizer/login`
- **En attente de vérification** : `https://evenpass.sn/organizer/pending`
- **Dashboard organisateur** : `https://evenpass.sn/organizer/dashboard`
  - Gestion des événements
  - Demandes de report/modification (CORRIGÉ ✓)
  - Statistiques et KPIs
  - Demandes de payout

---

## 🚢 Univers PASS (Transport Maritime & Terrestre)

### Pages Publiques
- **Page d'accueil PASS** : `https://evenpass.sn/` (Page racine)
- **Services PASS** : `https://evenpass.sn/pass/services`
- **Réservation LMDG** : `https://evenpass.sn/pass/lmdg`
- **Réservation COSAMA** : `https://evenpass.sn/pass/cosama`
- **Réservation Interrégionale** : `https://evenpass.sn/pass/interregional`
- **Abonnements** : `https://evenpass.sn/pass/subscriptions`
- **Wallet (Portefeuille)** : `https://evenpass.sn/pass/wallet`
- **Succès paiement** : `https://evenpass.sn/payment/success`
- **Erreur paiement** : `https://evenpass.sn/payment/error`

### Dashboards Maritimes (Protégés - Authentification requise)

#### 1. Smart Manifest System (Commandants)
**URL** : `https://evenpass.sn/pass/commandant`

**Fonctionnalités** :
- Génération automatique du manifeste passagers
- Liste complète avec noms, prénoms, CNI, passeport, téléphone
- Export PDF pour autorités maritimes
- Vue temps réel du fret et des véhicules
- Statistiques de remplissage
- Sélection date/heure de départ

**Accès** : Réservé aux commandants assignés à un navire spécifique

---

#### 2. Boarding Management Dashboard (Accueil/Réception)
**URL** : `https://evenpass.sn/pass/boarding`

**Fonctionnalités** :
- Liste des passagers embarqués (scannés via EPscan+)
- Répartition par catégorie (Cabine, Pullman, Standard)
- Statistiques d'occupation en temps réel
- Taux de remplissage par catégorie
- Suivi des heures d'embarquement
- Filtrage par date de traversée

**Accès** : Réservé au personnel d'accueil assigné à un navire spécifique

---

#### 3. Commercial Performance Dashboard
**URL** : `https://evenpass.sn/pass/commercial`

**Fonctionnalités** :
- Analyse de rentabilité par voyage
- Revenus passagers vs revenus fret
- Taux de remplissage historique
- Prévisions basées sur la capacité
- Vue consolidée des 6 navires (Admin Finance uniquement)
- Export des statistiques commerciales
- Filtrage par date et par navire

**Accès** :
- Personnel commercial : Vue navire assigné uniquement
- Admin Finance : Vue globale des 6 navires

---

#### 4. Vehicle & Cargo System (Fret)
**URL** : `À CRÉER - https://evenpass.sn/pass/cargo`

**Fonctionnalités prévues** :
- Enregistrement du fret (véhicules, marchandises)
- Liaison avec les passagers
- Calcul automatique du poids total
- Intégration dans le manifeste
- Suivi du chargement/déchargement

**Statut** : Structure créée, interface à développer

---

#### 5. EPscan+ (Version Maritime)
**URL** : `À CRÉER - https://evenpass.sn/scan/pass`

**Fonctionnalités prévues** :
- Scan QR Code des billets maritimes
- Scan fret et véhicules
- Sélection du navire par l'agent
- Mise à jour statut : "Confirmé" → "Embarqué"
- Synchronisation temps réel avec Boarding Dashboard
- Logo bleu EvenPass pour différenciation avec EPscan EVEN

**Statut** : À développer (distinct de EPscan EVEN)

---

## 🔐 Administration & Gestion

### Admin Finance
**URL** : `https://evenpass.sn/admin/finance/login` → `https://evenpass.sn/admin/finance`

**Fonctionnalités existantes** :
- Gestion des événements EVEN
- Validation des organisateurs
- Gestion des paiements
- KPIs et statistiques globales
- Manager des publicités (EVEN/PASS)
- Export financier

**À AJOUTER** :
- Bloc "Gestion des Accès Maritimes"
  - Création de comptes pour commandants, accueil, fret, commercial
  - Attribution des rôles par navire (6 navires)
  - Gestion des identifiants (ID + Mot de passe)
  - Activation/Désactivation des accès

---

### Ops Manager
**URL** : `https://evenpass.sn/admin/ops/login` → `https://evenpass.sn/admin/ops`

**Fonctionnalités existantes** :
- Gestion des agents de contrôle EVEN
- Génération de sessions EPscan
- Base de données des agents

**À AJOUTER** :
- Section séparée "Univers PASS"
  - Enrôlement des agents maritimes (EPscan+)
  - Génération de sessions avec attribution navire
  - Gestion des habilitations par navire
  - Logo réactif : Orange (EVEN) / Bleu (PASS)

---

### EPscan (Version Événementielle)
**URL** : `https://evenpass.sn/scan/login`

**Fonctionnalités** :
- Scan QR Code billets événements
- Validation entrée
- Statistiques en temps réel
- Logo orange EvenPass

---

### Dashboards Additionnels
- **Admin Transversal** : `https://evenpass.sn/admin/transversal`
- **Manifeste Sécurité** : `https://evenpass.sn/admin/manifest`

---

## 📋 Configuration Firebase Requise

### 1. Déployer les Règles de Sécurité

```bash
# Déployer les règles Realtime Database
firebase deploy --only database

# Déployer les règles Firestore
firebase deploy --only firestore:rules
```

### 2. Créer les Collections Firebase

#### Firestore Collections :
- ✅ `events` - Événements EVEN (existant)
- ✅ `organizers` - Organisateurs (existant)
- ✅ `modification_requests` - Demandes organisateurs (CORRIGÉ ✓)
- ✅ `payout_requests` - Demandes de payout (CORRIGÉ ✓)
- 🆕 `maritime_users` - Profils utilisateurs maritimes
- 🆕 `pass_tickets` - Billets de transport
- 🆕 `cargo` - Fret et véhicules
- 🆕 `manifests` - Manifestes générés

#### Realtime Database Paths :
- ✅ `/evenpass/global_config/home_ads` - Publicités (CORRIGÉ ✓)
- ✅ `/evenpass/controllers` - Contrôleurs EPscan
- ✅ `/evenpass/sessions` - Sessions de scan
- ✅ `/evenpass/scans` - Scans effectués

---

## 🚀 Les 6 Navires

### Ferries (4)
1. **Ferry Dakar 1** - ID: `ferry-1`
   - Route: Dakar - Ziguinchor
   - Capacité: 500 passagers, 50 véhicules

2. **Ferry Dakar 2** - ID: `ferry-2`
   - Route: Dakar - Ziguinchor
   - Capacité: 500 passagers, 50 véhicules

3. **Ferry Casamance 1** - ID: `ferry-3`
   - Route: Dakar - Ziguinchor
   - Capacité: 450 passagers, 45 véhicules

4. **Ferry Casamance 2** - ID: `ferry-4`
   - Route: Dakar - Ziguinchor
   - Capacité: 450 passagers, 45 véhicules

### Chaloupes (2)
5. **Chaloupe Gorée 1** - ID: `chaloupe-1`
   - Route: Dakar - Gorée
   - Capacité: 200 passagers, 0 véhicule

6. **Chaloupe Gorée 2** - ID: `chaloupe-2`
   - Route: Dakar - Gorée
   - Capacité: 200 passagers, 0 véhicule

---

## ✅ Corrections Effectuées

### 1. Logo Wallet
- ✅ Remplacement de `Logo` par `DynamicLogo` dans WalletPage
- Le logo s'adapte maintenant au contexte (Orange EVEN / Bleu PASS)

### 2. Demandes de Modification/Report
- ✅ Correction de l'erreur d'envoi dans OrganizerDashboard
- ✅ Ajout des règles Firestore pour `modification_requests`
- ✅ Validation des champs avant envoi
- ✅ Meilleurs messages d'erreur

### 3. Permissions Firebase
- ✅ Règles Firestore pour collections organisateurs
- ✅ Règles Realtime Database pour publicités
- Les organisateurs peuvent maintenant créer et consulter leurs demandes

### 4. Boutons Admin
- ✅ Déplacés du footer de PassLandingPage (racine)
- ✅ Placés dans le footer de PassServicesPage
- Les 3 boutons cachés sont maintenant dans l'univers PASS

### 5. Structure Maritime
- ✅ Types TypeScript créés (maritime.ts)
- ✅ Fonctions de gestion créées (maritimeData.ts)
- ✅ Smart Manifest System opérationnel
- ✅ Boarding Dashboard opérationnel
- ✅ Commercial Dashboard opérationnel
- ✅ Routes ajoutées dans App.tsx
- ✅ Compilation réussie

---

## 🔧 Tâches Restantes

### Priorité Haute
1. **Créer le bloc de gestion des accès maritimes dans Admin Finance**
   - Interface de création de comptes maritimes
   - Attribution des rôles (commandant, accueil, fret, commercial)
   - Liaison navire + utilisateur
   - Gestion des identifiants

2. **Créer le bloc d'enrôlement PASS dans Ops Manager**
   - Section EVEN/PASS séparée
   - Enrôlement agents EPscan+
   - Génération sessions avec navire
   - Logo réactif

3. **Développer EPscan+ (Version Maritime)**
   - Interface de scan maritime
   - Scan fret/véhicules
   - Sélection navire
   - Logo bleu

4. **Créer le Vehicle & Cargo System**
   - Interface d'enregistrement du fret
   - Calcul poids/dimensions
   - Liaison passagers
   - Intégration manifeste

### Priorité Moyenne
5. **Créer les comptes maritimes dans Firebase**
   - Collection `maritime_users`
   - Comptes test pour chaque rôle
   - Custom Claims pour la sécurité

6. **Tester le flux complet**
   - Réservation → Paiement → Génération billet
   - Scan EPscan+ → Mise à jour statut
   - Génération manifeste → Export PDF
   - Statistiques commerciales

---

## 📊 Measurement ID

**Google Analytics** : `G-FVQTV8TMLJ`

Utilisé pour le tracking des dashboards d'exploitation maritime (logo bleu).

---

## 🎨 Design Guidelines

### Logo Dynamique
- **EVEN** : Orange (#FF5F05)
- **PASS** : Bleu (#0A7EA3)

### Thèmes
- Mode sombre disponible
- Bordures arrondies 40px/120px (selon contexte)
- Transitions fluides

### Accessibilité
- Contrastes respectés
- Boutons tactiles optimisés
- Responsive mobile-first

---

**Dernière mise à jour** : 2026-01-06
**Statut du build** : ✅ Compilation réussie
**Version** : 1.0.0-maritime
