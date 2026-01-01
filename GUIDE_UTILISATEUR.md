# Guide Utilisateur EvenPass - Architecture Complète

## 📋 Vue d'ensemble

EvenPass est une plateforme de billetterie événementielle avec un système de rôles et workflows complets.

---

## 👥 Rôles et Accès

### 1. **Organisateur d'événements**
**Parcours complet :**

#### 📝 Inscription
- **URL** : `/organizer/signup`
- **Processus** :
  1. Étape 1 : Informations personnelles (nom, email, téléphone)
  2. Étape 2 : Informations organisation (nom, type, description, contacts)
- **Status initial** : `pending` (en attente d'approbation)
- **Notification** : Email envoyé une fois approuvé

#### 🔐 Connexion
- **URL** : `/organizer/login`
- **Accès après approbation** seulement

#### 🎯 Dashboard Organisateur (`/organizer/dashboard`)
**Fonctionnalités disponibles :**

##### Finances
- **Revenus nets** : 95% des ventes (après commission 5%)
- **Solde disponible** : Montant retirable
- **Demandes de payout** avec :
  - Frais techniques : 1.5%
  - Montant net final : 93.5% des ventes
  - Méthodes : Wave ou Orange Money

##### Événements
- **Bouton "Créer un événement"** dans le header
- Liste de tous les événements créés
- Statistiques par événement (billets vendus, revenus)

##### Actions disponibles
- ✅ Créer un événement (status initial : `draft`)
- ✅ Voir statistiques financières
- ✅ Demander un payout
- ✅ Se déconnecter

---

### 2. **Admin Finance** 💰
**Rôle** : Gestion financière et validation des événements

#### 🔐 Connexion
- **URL** : `/admin/finance/login`
- **Credentials de test** :
  - Email : `admin@evenpass.sn`
  - Mot de passe : `admin123`

#### 🎯 Dashboard (`/admin/finance`)

##### Onglet "Payouts"
**Gestion des demandes de payout :**
- ⏳ **En attente** : Payouts à approuver
- ✅ **Approuvés** : Payouts en traitement
- Actions :
  - Approuver une demande
  - Rejeter avec raison
  - Voir détails (montant, frais, net)

##### Onglet "Tous les Événements"
**Gestion complète des événements :**

**Événements en Brouillon (draft) :**
- ⚡ **MASTER GO** : Active l'événement → `published`
  - Déblo que les ventes
  - Met l'événement en ligne
  - Visible par le public

**Événements Publiés :**
- ⏸️ **Suspendre** : Bloque temporairement les ventes
- 🗑️ **Supprimer** : Suppression définitive

**Statistiques financières :**
- 💰 **Total des ventes**
- 🏦 **Commission plateforme** (5%)
- 💸 **Frais de payout** (1.5%)
- 👥 **Payouts organisateurs** (93.5%)

##### Actions disponibles
- ✅ Approuver/rejeter les payouts
- ✅ Activer les événements (Master GO)
- ✅ Suspendre les événements
- ✅ Supprimer les événements
- ✅ Voir toutes les statistiques financières
- ✅ Se déconnecter

---

### 3. **Ops Manager** ⚙️
**Rôle** : Gestion des opérations et du personnel événementiel

#### 🔐 Connexion
- **URL** : `/admin/ops/login`
- **Credentials de test** :
  - Email : `ops@evenpass.sn`
  - Mot de passe : `ops123`

#### 🎯 Dashboard (`/admin/ops`)
**Fonctionnalités :**
- Gestion des contrôleurs d'accès
- Affectation du personnel aux événements
- Statistiques opérationnelles

##### Actions disponibles
- ✅ Gérer le personnel événementiel
- ✅ Voir les statistiques opérationnelles
- ✅ Se déconnecter

---

### 4. **Contrôleur d'Accès (EP Scan)** 📱
**Rôle** : Scanner les billets à l'entrée des événements

#### 🔐 Connexion
- **URL** : `/scan/login`
- **Accès via** : Lien d'activation envoyé par Ops Manager

#### 🎯 Page Scan (`/scan`)
**Fonctionnalités :**
- Scanner QR codes des billets
- Validation en temps réel
- Historique des scans

---

## 🔄 Workflows Complets

### Workflow 1 : Devenir Organisateur

```
1. Visiteur → /organizer/signup
   ↓
2. Remplit formulaire (2 étapes)
   ↓
3. Soumission → Status: PENDING
   ↓
4. Admin Finance → Approuve le compte
   ↓
5. Status: VERIFIED → Email de confirmation
   ↓
6. Organisateur peut se connecter → /organizer/login
   ↓
7. Accès au dashboard → /organizer/dashboard
```

### Workflow 2 : Créer un Événement

```
1. Organisateur connecté → Dashboard
   ↓
2. Clique "Créer un événement"
   ↓
3. Remplit formulaire événement
   ↓
4. Soumission → Status: DRAFT
   ↓
5. Admin Finance → Onglet "Événements"
   ↓
6. Sélectionne l'événement en brouillon
   ↓
7. Clique "MASTER GO" ⚡
   ↓
8. Status: PUBLISHED → Visible sur la plateforme
   ↓
9. Ventes ouvertes au public
```

### Workflow 3 : Demander un Payout

```
1. Organisateur → Dashboard
   ↓
2. Voit "Solde disponible: X FCFA"
   ↓
3. Clique "Nouvelle demande"
   ↓
4. Entre montant + méthode (Wave/Orange Money)
   ↓
5. Soumission → Status: PENDING
   ↓
6. Admin Finance → Onglet "Payouts"
   ↓
7. Examine la demande
   ↓
8. Approuve → Status: APPROVED → PROCESSING
   ↓
9. Paiement effectué → Status: COMPLETED
```

### Workflow 4 : Acheter un Billet

```
1. Visiteur → Page d'accueil (/)
   ↓
2. Parcourt les événements publiés
   ↓
3. Clique sur un événement → /event/:slug
   ↓
4. Sélectionne type de billet + quantité
   ↓
5. Clique "Acheter maintenant"
   ↓
6. Modale paiement (Wave/Orange Money)
   ↓
7. Paiement validé
   ↓
8. Génération billet + QR code
   ↓
9. Email de confirmation + PDF
```

---

## 💰 Logique Financière

### Répartition des Revenus

```
Prix Billet = 10,000 FCFA

┌─────────────────────────────────┐
│ 10,000 FCFA (100%)              │
│ Prix payé par le client         │
└─────────────────────────────────┘
           │
           ├─► 500 FCFA (5%)
           │   Commission EvenPass
           │
           └─► 9,500 FCFA (95%)
               Disponible pour l'organisateur
                      │
                      │ (Demande de payout)
                      │
                      ├─► 142.50 FCFA (1.5%)
                      │   Frais techniques de payout
                      │
                      └─► 9,357.50 FCFA (93.5%)
                          Net reçu par l'organisateur
```

### Statuts des Payouts

- **PENDING** : En attente d'approbation admin
- **APPROVED** : Approuvé, en traitement
- **PROCESSING** : Paiement en cours
- **COMPLETED** : Payé avec succès
- **REJECTED** : Refusé (avec raison)

---

## 🎫 Statuts des Événements

### Draft (Brouillon)
- Créé par l'organisateur
- **Non visible** sur la plateforme
- **Ventes fermées**
- En attente de validation admin
- **Action** : Master GO → Published

### Published (Publié)
- Approuvé par Admin Finance
- **Visible** sur la plateforme
- **Ventes ouvertes**
- **Actions** : Suspendre ou Supprimer

### Suspended (Suspendu)
- Temporairement désactivé
- **Non visible** sur la plateforme
- **Ventes bloquées**
- Peut être réactivé

### Cancelled (Annulé)
- Événement annulé définitivement
- Remboursements en cours

### Completed (Terminé)
- Événement passé
- Archives disponibles

---

## 🔐 Sécurité et Permissions

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour garantir :
- Les organisateurs voient **uniquement leurs événements**
- Les utilisateurs voient **uniquement leurs billets**
- Les admins ont **accès complet** selon leur rôle
- Le personnel voit **uniquement les événements assignés**

### Rôles Admin

Dans la base de données (`admin_users.role`) :
- **super_admin** : Accès complet
- **finance** : Gestion financière et validation événements
- **ops_manager** : Gestion opérations et personnel
- **support** : Support client

---

## 🚀 Accès Rapides

### Pour tester localement :

**Organisateur :**
- Inscription : http://localhost:5173/organizer/signup
- Login : http://localhost:5173/organizer/login

**Admin Finance :**
- Login : http://localhost:5173/admin/finance/login
- Email : `admin@evenpass.sn` / Mot de passe : `admin123`

**Ops Manager :**
- Login : http://localhost:5173/admin/ops/login
- Email : `ops@evenpass.sn` / Mot de passe : `ops123`

**Public :**
- Accueil : http://localhost:5173/

---

## 📊 Données de Test (Mock Data)

Le système utilise actuellement des données de test incluant :
- 5 événements (2 en brouillon, 3 publiés)
- 2 organisateurs avec profils complets
- Demandes de payout en différents statuts
- Statistiques financières réalistes

---

## ✅ Fonctionnalités Implémentées

- ✅ Inscription organisateur (formulaire 2 étapes)
- ✅ Login multi-rôles (Organisateur, Admin Finance, Ops Manager)
- ✅ Dashboard organisateur avec finances
- ✅ Demandes de payout avec calcul automatique
- ✅ Dashboard Admin Finance avec 2 onglets
- ✅ Gestion complète des événements (Master GO, Suspension, Suppression)
- ✅ Gestion des payouts (Approuver/Rejeter)
- ✅ Boutons de déconnexion dans tous les dashboards
- ✅ Statistiques financières en temps réel
- ✅ Mock Data pour tests complets

---

## 🎯 Prochaines Étapes (Intégration Supabase)

Lorsque vous serez prêt à connecter la vraie base de données :
1. Les Mock Data seront remplacées par des appels Supabase
2. L'authentification utilisera Supabase Auth
3. Les RLS policies sont déjà définies dans les migrations
4. Les rôles et permissions sont prêts dans la base

---

**🎉 Le système est maintenant complet et prêt pour les tests !**
