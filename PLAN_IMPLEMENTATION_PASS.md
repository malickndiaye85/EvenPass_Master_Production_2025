# 📋 PLAN D'IMPLÉMENTATION - UNIVERS PASS (Mobilité)

> **Mission** : Créer l'écosystème de mobilité maritime et terrestre PASS en extension de l'univers EVEN existant, sans toucher au code source EVEN.

---

## 🎯 PRINCIPE FONDAMENTAL : INTÉGRITÉ DU CODE EVEN

### Règles non-négociables :
1. ✅ **ZÉRO modification** des fichiers existants de l'univers EVEN
2. ✅ **Extension uniquement** via nouveaux composants/pages
3. ✅ **Duplication (Fork)** pour EPscan → EPscan+
4. ✅ **Isolation Firebase** : `/transport/` séparé de `/evenements/`
5. ✅ **Architecture modulaire** : EVEN et PASS techniquement indépendants mais visuellement unifiés

---

## 📁 STRUCTURE DE FICHIERS (NOUVEAUX FICHIERS UNIQUEMENT)

```
/src
├── pages/
│   └── pass/                          [NOUVEAU DOSSIER]
│       ├── PassLandingPage.tsx        → Landing split-screen EVEN/PASS
│       ├── PassWalletPage.tsx         → Wallet abonnements (offline)
│       │
│       ├── lmdg/                      → LIAISON MARITIME DAKAR-GORÉE
│       │   ├── LMDGBookingPage.tsx   → Tunnel achat chaloupe
│       │   └── LMDGTicketDisplay.tsx → Affichage ticket
│       │
│       ├── cosama/                    → COSAMA (Navire)
│       │   ├── COSAMABookingPage.tsx → Tunnel achat navire
│       │   ├── COSAMAInventory.tsx   → Sélection cabines/fauteuils
│       │   └── COSAMATicketDisplay.tsx
│       │
│       ├── interregional/             → BUS/CARS
│       │   ├── InterregionalBookingPage.tsx
│       │   └── InterregionalTicketDisplay.tsx
│       │
│       └── subscriptions/             → ABONNEMENTS
│           ├── SubscriptionPage.tsx   → Achat Pass Annuel/Mensuel
│           └── SubscriptionPhotoUpload.tsx → Upload Photo ID
│
├── components/
│   └── pass/                          [NOUVEAU DOSSIER]
│       ├── PassNavbar.tsx             → Navigation PASS (Bleu Marine)
│       ├── PassFooter.tsx             → Footer PASS
│       ├── PassPaymentModal.tsx       → Modal paiement PASS
│       ├── PassTicketFooter.tsx       → Footer tickets PASS
│       ├── NumericKeypad.tsx          → Clavier numérique Wallet
│       ├── PassQRCode.tsx             → QR Code avec Photo ID
│       └── SplitScreenHero.tsx        → Hero section split EVEN/PASS
│
├── context/
│   └── PassAuthContext.tsx            [NOUVEAU] → Auth spécifique mobilité
│
├── lib/
│   ├── passTicketPDF.ts               [NOUVEAU] → Génération PDF tickets PASS
│   ├── walletOffline.ts               [NOUVEAU] → Service Workers Wallet
│   └── manifestGenerator.ts           [NOUVEAU] → Manifeste sécurité (Commandant)
│
├── types/
│   └── pass.ts                        [NOUVEAU] → Types TypeScript PASS
│
└── styles/
    └── pass-theme.css                 [NOUVEAU] → Variables CSS Bleu Marine/Blanc

/public
└── pass/                              [NOUVEAU DOSSIER]
    ├── epscan-plus.html               → Fork EPscan+ (Mobilité)
    ├── pass-admin-finance.html        → Dashboard Admin Finance PASS
    └── pass-commandant.html           → Dashboard Commandant (Manifeste)
```

---

## 🎨 PHASE 1 : LANDING PAGE SPLIT-SCREEN

### Objectif :
Créer une page d'accueil divisée en 2 univers distincts avec bascule fluide.

### Fichier principal : `src/pages/pass/PassLandingPage.tsx`

#### Design :
```
┌─────────────────────────────────────────────────────┐
│            NAVIGATION TOP (Adaptative)              │
│  Logo EvenPass  |  EVEN  |  PASS  | Theme | Login  │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   UNIVERS EVEN       │      UNIVERS PASS            │
│   (Gauche 50%)       │      (Droite 50%)            │
│                      │                              │
│ 🎉 Design Festif     │  🚢 Design Institutionnel    │
│ Gradients Orange     │  Bleu Marine & Blanc         │
│ Événements           │  Mobilité                    │
│ "Gënaa Yomb"         │  "Gënaa Gaaw"                │
│                      │                              │
│ [EXPLORER EVENTS]    │  [RÉSERVER TICKET]           │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
│                  SLOGAN WOLOF                       │
│        "Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw"         │
└─────────────────────────────────────────────────────┘
│                  FOOTER                             │
│  [🔘] [🔘] [🔘] ← 3 boutons cachés (Admin/Ops)     │
└─────────────────────────────────────────────────────┘
```

#### Interactions :
- **Hover** : Agrandissement léger de la zone survolée (scale 1.02)
- **Click** : Redirection vers `/events` (EVEN) ou `/pass/services` (PASS)
- **Responsive** : Sur mobile, affichage vertical (EVEN en haut, PASS en bas)

#### Charte couleurs :
| Univers | Primaire | Secondaire | Gradient |
|---------|----------|------------|----------|
| **EVEN** | `#FF5F05` | `#FF8C42` | Orange → Amber |
| **PASS** | `#003D5C` | `#0A7EA3` | Navy → Cyan |

---

## 🚢 PHASE 2 : TUNNELS D'ACHAT "ZÉRO FRICTION"

### 2.1 LMDG (Dakar ↔ Gorée - Chaloupe)

#### Fichier : `src/pages/pass/lmdg/LMDGBookingPage.tsx`

**Flux utilisateur :**
```
Étape 1 : Sélection trajet
  → Dakar → Gorée (A/R)
  → Date et heure

Étape 2 : Tarification automatique
  → Détection géolocalisation (optionnelle)
  → Sélection statut :
     • Non-résident (5200 Adulte / 2700 Enfant)
     • Résident Afrique (2700 / 1700)
     • National (1500 / 500)
     • Goréen (100 / 50)

Étape 3 : Identification minimale
  → Numéro mobile UNIQUEMENT (pas de nom pour unitaires)
  → Validation format : +221 XX XXX XX XX

Étape 4 : Paiement
  → Wave / Orange Money
  → Commission 5% + Frais techniques 1.5%

Étape 5 : Génération ticket
  → QR Code
  → Numéro unique
  → PDF téléchargeable
  → SMS de confirmation
```

**Champs requis :**
```typescript
interface LMDGBooking {
  phone: string;                    // Obligatoire
  route: 'dakar-goree' | 'goree-dakar';
  trip_type: 'one_way' | 'round_trip';
  passenger_category: 'non_resident' | 'resident_africa' | 'national' | 'goreen';
  adult_count: number;
  child_count: number;
  travel_date: Date;
  travel_time: string;              // '08:00', '10:00', etc.
  total_price: number;
  booking_ref: string;              // Auto-généré
}
```

---

### 2.2 COSAMA (Dakar ↔ Ziguinchor - Navire)

#### Fichier : `src/pages/pass/cosama/COSAMABookingPage.tsx`

**Flux utilisateur :**
```
Étape 1 : Sélection hébergement
  → Affichage inventaire en temps réel :
     • Fauteuil Pullman (places disponibles)
     • Cabine 8 places
     • Cabine 4 places
     • Cabine 2 places (petit-déjeuner inclus)

Étape 2 : Suppléments
  → Bébés (0-4 ans) : Gratuit
  → Enfants (5-11 ans) : Demi-tarif
  → Véhicules : Voiture (63000) / Moto (30000)

Étape 3 : Identification OBLIGATOIRE
  → Nom + Prénom
  → Numéro CNI (Carte Nationale d'Identité)
  → Numéro mobile
  → ⚠️ Requis pour sécurité maritime

Étape 4 : Récapitulatif tarif
  → Tarif base (Résident vs Non-résident)
  → Suppléments
  → Total TTC

Étape 5 : Paiement & Ticket
```

**Champs requis :**
```typescript
interface COSAMABooking {
  // Identification (OBLIGATOIRE)
  first_name: string;
  last_name: string;
  national_id: string;              // CNI
  phone: string;

  // Réservation
  route: 'dakar-ziguinchor' | 'ziguinchor-dakar';
  accommodation_type: 'pullman' | 'cabin_8' | 'cabin_4' | 'cabin_2';
  passenger_category: 'resident' | 'non_resident';

  // Passagers
  adults: number;
  children_5_11: number;            // Demi-tarif
  babies_0_4: number;               // Gratuit

  // Véhicules (optionnel)
  vehicle_type?: 'car' | 'motorcycle' | null;

  // Prix
  base_price: number;
  supplements: number;
  vehicle_fee: number;
  total_price: number;

  travel_date: Date;
  booking_ref: string;
}
```

**Inventaire en temps réel :**
```typescript
interface COSAMAInventory {
  departure_id: string;
  date: Date;
  pullman_available: number;
  cabin_8_available: number;
  cabin_4_available: number;
  cabin_2_available: number;
  vehicle_slots_available: number;
}
```

---

### 2.3 INTERRÉGIONAL (Bus/Cars)

#### Fichier : `src/pages/pass/interregional/InterregionalBookingPage.tsx`

**Flux utilisateur :**
```
Étape 1 : Sélection itinéraire
  → Ville départ (dropdown)
  → Ville arrivée (dropdown)
  → Date de départ

Étape 2 : Choix départ
  → Liste des départs disponibles avec horaires
  → Places disponibles
  → Tarif affiché

Étape 3 : Identification
  → Nom + Prénom
  → Numéro mobile

Étape 4 : Paiement & Ticket
```

**Champs requis :**
```typescript
interface InterregionalBooking {
  first_name: string;
  last_name: string;
  phone: string;

  departure_city: string;
  arrival_city: string;
  travel_date: Date;
  departure_time: string;

  seat_number: string;              // Auto-assigné ou choix manuel
  passenger_count: number;
  price_per_seat: number;
  total_price: number;

  operator: string;                 // Nom compagnie bus
  booking_ref: string;
}
```

---

## 🎫 PHASE 3 : MODULE ABONNEMENTS (PASS ANNUELS/MENSUELS)

### Fichier : `src/pages/pass/subscriptions/SubscriptionPage.tsx`

**Types d'abonnements :**
```typescript
interface SubscriptionType {
  id: string;
  name: string;                     // "LMDG Mensuel", "Tout Réseau Annuel", etc.
  service: 'lmdg' | 'cosama' | 'interregional' | 'all';
  duration: 'monthly' | 'annual';
  price: number;
  validity_days: number;
  description: string;
  benefits: string[];
}
```

**Flux d'achat abonnement :**
```
Étape 1 : Sélection abonnement
  → Affichage grille tarifs
  → Avantages listés

Étape 2 : Identification + Photo ID OBLIGATOIRE
  → Nom + Prénom
  → Numéro mobile
  → Upload photo claire (format portrait)
  → ⚠️ BLOCAGE : Ticket ne peut pas être généré sans photo

Étape 3 : Validation photo
  → Détection visage (optionnel via API)
  → Recadrage automatique
  → Compression

Étape 4 : Paiement

Étape 5 : Génération Pass
  → QR Code unique
  → Photo ID intégrée
  → Stockage Firebase Storage
  → Accessible offline via Wallet
```

**Structure Pass :**
```typescript
interface PassSubscription {
  id: string;
  user_phone: string;
  full_name: string;
  photo_url: string;                // Firebase Storage URL
  subscription_type_id: string;

  qr_code: string;
  pass_number: string;              // Format : PASS-LMDG-2026-XXXXX

  issued_date: Date;
  expiry_date: Date;
  status: 'active' | 'expired' | 'suspended';

  usage_count: number;              // Nombre de validations
  last_scan_date?: Date;
}
```

---

## 📱 PHASE 4 : WALLET (MODE OFFLINE)

### Fichier : `src/pages/pass/PassWalletPage.tsx`

**Flux utilisateur :**
```
1. Clic bouton "Wallet" sur PWA
2. Affichage clavier numérique (0-9)
3. Saisie numéro téléphone
4. Récupération Pass depuis cache (Service Worker)
5. Affichage :
   • Photo ID
   • Nom
   • Type abonnement
   • Validité restante
   • QR Code (scannable offline)
```

**Service Worker :** `src/lib/walletOffline.ts`
```typescript
// Synchronisation périodique
// Cache Pass actifs
// Génération QR Code offline (Canvas API)
// Gestion expiration
```

**Sécurité :**
- Données chiffrées dans localStorage
- Token JWT embarqué dans QR Code
- Validation signature côté scanner

---

## 💰 PHASE 5 : LOGIQUE FINANCIÈRE & RÉCONCILIATION

### Dashboard Admin Finance : `public/pass-admin-finance.html`

**Architecture :**
```typescript
interface FinancialDashboard {
  universe: 'even' | 'pass';        // Switcher

  // Métriques PASS
  pass_metrics: {
    total_revenue: number;
    lmdg_revenue: number;
    cosama_revenue: number;
    interregional_revenue: number;
    subscription_revenue: number;

    commission_evenpass: number;    // 5%
    technical_fees: number;         // 1.5%
    net_partner_revenue: number;    // 95% - 1.5%
  };

  // Transactions
  transactions: PassTransaction[];
}

interface PassTransaction {
  id: string;
  booking_ref: string;
  service: 'lmdg' | 'cosama' | 'interregional' | 'subscription';
  operator: string;                 // Partenaire (LMDG SA, COSAMA, etc.)

  gross_amount: number;             // Montant brut
  commission: number;               // 5% EvenPass
  technical_fees: number;           // 1.5% sur les 95%
  net_amount: number;               // Montant net partenaire

  payment_method: 'wave' | 'orange_money';
  payment_status: 'pending' | 'completed' | 'failed';

  created_at: Date;
}
```

**Calcul exemple :**
```
Ticket LMDG Aller-Retour National : 1500 FCFA

1. Montant brut : 1500 FCFA
2. Commission EvenPass (5%) : 75 FCFA
3. Montant net vers partenaire : 1425 FCFA
4. Frais techniques Mobile Money (1.5% de 1425) : 21.38 FCFA
5. Montant final partenaire : 1403.62 FCFA
```

**Vue Admin :**
- Tableau réconciliation par opérateur
- Export CSV
- Graphiques revenus
- Filtres par période/service

---

## 🛠️ PHASE 6 : EPSCAN+ (FORK CONTRÔLE MOBILITÉ)

### Fichier : `public/epscan-plus.html`

**Différences avec EPscan (EVEN) :**

| Fonctionnalité | EPscan (EVEN) | EPscan+ (PASS) |
|----------------|---------------|----------------|
| **Affichage Photo ID** | ❌ Non | ✅ Oui (abonnés) |
| **Manifeste Sécurité** | ❌ Non | ✅ Oui (COSAMA) |
| **Bouton Report** | ❌ Non | ✅ +48h validité |
| **Offline Mode** | ⚠️ Partiel | ✅ Complet |
| **Statistiques** | Scans basiques | H/F/E/Bébés détaillés |

**Fonctionnalités EPscan+ :**

#### 1. Affichage Photo ID
```typescript
interface ScanResultPass extends ScanResult {
  passenger_photo_url?: string;     // Si abonnement
  id_verified: boolean;             // Match photo vs personne
}
```

Lors du scan :
- Affichage photo ID en overlay
- Comparaison visuelle par contrôleur
- Bouton "Validé" / "Refuser"

#### 2. Manifeste de Sécurité (COSAMA)
```typescript
interface SecurityManifest {
  departure_id: string;
  date: Date;
  route: string;

  passengers: {
    adults_male: number;
    adults_female: number;
    children: number;
    babies: number;
    total: number;
  };

  vehicles: {
    cars: number;
    motorcycles: number;
  };

  generated_at: Date;
  generated_by: string;             // UID Commandant
}
```

Export PDF pour le Commandant avant départ.

#### 3. Bouton Report (+48h)
En cas de rotation annulée :
- Scan ticket
- Clic "Reporter"
- Ajout automatique +48h validité
- Notification SMS client
- Log dans Firebase

---

## 🗄️ PHASE 7 : STRUCTURE FIREBASE (ISOLATION DONNÉES)

### Architecture `/transport/` (nouveau nœud)

```
transport/
├── lmdg/
│   ├── bookings/{bookingId}
│   ├── inventory/{dateId}
│   └── prices/{categoryId}
│
├── cosama/
│   ├── bookings/{bookingId}
│   ├── inventory/{departureId}
│   ├── prices/{accommodationType}
│   └── manifests/{departureId}
│
├── interregional/
│   ├── bookings/{bookingId}
│   ├── routes/{routeId}
│   ├── operators/{operatorId}
│   └── schedules/{scheduleId}
│
├── subscriptions/
│   ├── passes/{passId}
│   │   ├── user_phone
│   │   ├── full_name
│   │   ├── photo_url
│   │   ├── qr_code
│   │   ├── issued_date
│   │   ├── expiry_date
│   │   └── status
│   │
│   └── types/{typeId}
│
├── scans/
│   ├── {scanId}
│   │   ├── booking_ref
│   │   ├── service
│   │   ├── scanned_by
│   │   ├── scanned_at
│   │   └── location
│
├── transactions/
│   └── {transactionId}
│       ├── booking_ref
│       ├── gross_amount
│       ├── commission
│       ├── technical_fees
│       ├── net_amount
│       └── payment_status
│
└── operators/
    └── {operatorId}
        ├── name
        ├── service_type
        ├── balance
        └── bank_details
```

### Règles de sécurité Firebase :
```json
{
  "transport": {
    ".read": "auth != null",
    ".write": "auth != null && (root.child('admins/' + auth.uid).exists() || root.child('operators/' + auth.uid).exists())"
  }
}
```

---

## 🎨 PHASE 8 : DESIGN SYSTEM PASS (Bleu Marine & Blanc)

### Fichier : `src/styles/pass-theme.css`

```css
:root {
  /* PASS Primary Colors */
  --pass-navy-50: #E6F1F5;
  --pass-navy-100: #B3D9E6;
  --pass-navy-200: #80C1D6;
  --pass-navy-300: #4DA9C7;
  --pass-navy-400: #1A91B8;
  --pass-navy-500: #0A7EA3;          /* Principal */
  --pass-navy-600: #006B8C;
  --pass-navy-700: #005975;
  --pass-navy-800: #00475E;
  --pass-navy-900: #003D5C;          /* Sombre */

  /* PASS Accents */
  --pass-cyan-light: #5DD4F0;
  --pass-cyan: #00C2E0;
  --pass-white: #FFFFFF;
  --pass-gray-50: #F8FAFC;
  --pass-gray-100: #F1F5F9;

  /* Shadows */
  --pass-shadow-sm: 0 2px 8px rgba(0, 61, 92, 0.08);
  --pass-shadow-md: 0 4px 16px rgba(0, 61, 92, 0.12);
  --pass-shadow-lg: 0 8px 24px rgba(0, 61, 92, 0.16);

  /* Borders */
  --pass-border-radius: 16px;
  --pass-border-color: rgba(0, 61, 92, 0.1);
}

/* Dark mode PASS */
.dark {
  --pass-navy-500: #1A91B8;
  --pass-navy-900: #E6F1F5;
  --pass-white: #0F0F0F;
  --pass-gray-50: #1A1A1A;
}
```

### Composants UI PASS :
- Boutons : Bleu marine, corners arrondis 12px, hover scale 1.02
- Cards : Blanc pur, shadow subtile, border navy 1px
- Inputs : Border navy, focus ring cyan
- Typography : Inter Medium/Semibold, Navy 900

---

## 📱 PHASE 9 : PWA & MODE OFFLINE

### Service Worker : `public/sw.js` (extension)

**Stratégies de cache :**
```javascript
// Cache PASS assets
const PASS_CACHE = 'evenpass-pass-v1';
const PASS_ASSETS = [
  '/pass',
  '/pass/wallet',
  '/pass/lmdg',
  '/pass-theme.css',
  '/epscan-plus.html'
];

// Cache-First pour assets statiques PASS
// Network-First pour bookings temps réel
// Offline fallback pour Wallet
```

**Manifest.json :** Ajouter shortcut Wallet
```json
{
  "shortcuts": [
    {
      "name": "Wallet PASS",
      "short_name": "Wallet",
      "url": "/pass/wallet",
      "icons": [{ "src": "/icon-512.png", "sizes": "512x512" }]
    }
  ]
}
```

---

## 🧪 PHASE 10 : TESTS & VALIDATION

### Checklist avant déploiement :

#### Fonctionnel :
- [ ] Split-screen responsive (Desktop + Mobile)
- [ ] Tunnel LMDG (téléphone seul OK)
- [ ] Tunnel COSAMA (CNI obligatoire OK)
- [ ] Tunnel Interrégional
- [ ] Abonnement bloqué sans photo
- [ ] Wallet offline fonctionnel
- [ ] EPscan+ affiche photo ID
- [ ] Manifeste PDF généré
- [ ] Bouton Report +48h fonctionne

#### Financier :
- [ ] Commission 5% calculée correctement
- [ ] Frais techniques 1.5% appliqués
- [ ] Dashboard switche EVEN ↔ PASS
- [ ] Export CSV transactions PASS

#### Sécurité :
- [ ] Données `/transport/` isolées
- [ ] QR Codes signés
- [ ] Wallet chiffré localStorage
- [ ] Pas d'exposition credentials

#### Design :
- [ ] Charte Bleu Marine respectée
- [ ] Animations fluides (60fps)
- [ ] Mode sombre PASS fonctionnel
- [ ] Typographie cohérente

---

## 📅 TIMELINE ESTIMÉE (SPRINTS)

### Sprint 1 (Landing + Structure) :
- Jour 1-2 : Landing split-screen + navigation
- Jour 3 : Types TypeScript + Firebase structure
- Jour 4 : Components UI PASS (Navbar/Footer)

### Sprint 2 (Tunnels d'achat) :
- Jour 5-6 : LMDG complet
- Jour 7-8 : COSAMA + inventaire
- Jour 9 : Interrégional

### Sprint 3 (Abonnements + Wallet) :
- Jour 10-11 : Module abonnements + upload photo
- Jour 12-13 : Wallet offline + Service Worker

### Sprint 4 (EPscan+ & Admin) :
- Jour 14-15 : Fork EPscan+
- Jour 16 : Dashboard Admin Finance PASS
- Jour 17 : Manifeste Commandant

### Sprint 5 (Tests & Polish) :
- Jour 18-19 : Tests end-to-end
- Jour 20 : Corrections bugs
- Jour 21 : Optimisations performance

---

## ✅ VALIDATION FINALE

### Critères de succès :
1. ✅ Code EVEN 100% intact (aucun fichier modifié)
2. ✅ PASS fonctionnel de bout en bout
3. ✅ Design premium (animations, polish)
4. ✅ Mode offline Wallet opérationnel
5. ✅ EPscan+ avec photo ID fonctionnel
6. ✅ Réconciliation financière exacte
7. ✅ PWA installable
8. ✅ Performances optimales (Lighthouse 90+)

---

## 🚀 DÉPLOIEMENT

### Environnement :
- Netlify (comme EVEN)
- Firebase Realtime Database (extension nœud `/transport/`)
- Cloudinary (photos ID)

### Variables d'environnement (nouvelles) :
```env
VITE_PASS_ENABLED=true
VITE_EPSCAN_PLUS_ENABLED=true
VITE_WALLET_ENCRYPTION_KEY=...
VITE_COMMANDANT_UID=...
```

### Build :
```bash
npm run build
# Vérifier que les routes PASS sont bien bundlées
# Tester PWA offline
```

---

## 📞 SUPPORT & MAINTENANCE

### Logs à implémenter :
```typescript
console.log('[PASS] Message')
console.log('[LMDG] Message')
console.log('[COSAMA] Message')
console.log('[WALLET] Message')
console.log('[EPSCAN+] Message')
```

### Monitoring :
- Firebase Analytics (événements PASS)
- Erreurs Sentry (séparation EVEN/PASS)
- Métriques temps de réponse

---

**FIN DU PLAN D'IMPLÉMENTATION**

> Prêt à passer à la Phase 1 : Création de la landing page split-screen 🎨
