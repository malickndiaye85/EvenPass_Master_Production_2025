# 🚀 MASTER PROMPT DEM⇄DEM — BOLT IMPLEMENTATION

**Version**: 3.1 Final (+ Dashboard Orga, Pages Marketing, Logins)
**Date**: 28 Janvier 2026
**Projet**: Super-App Mobilité & Événements — Sénégal
**Auteur**: Malick

---

## 📌 INSTRUCTIONS BOLT — À LIRE EN PREMIER

Ce document est le **MASTER PROMPT** consolidé pour implémenter DEM⇄DEM  Bolt. Il contient TOUTES les spécifications validées.

**RÈGLES CRITIQUES:**
1. **NE PAS utiliser de design générique AI** — Suivre strictement la charte graphique
2. **Optimiser Firebase** — Architecture hybride Firestore + Realtime Database obligatoire
3. **Mobile-First** — Toutes les interfaces conçues pour 375px puis responsive
4. **PWA** — Application installable avec mode offline

---

# 📐 SECTION A : FONDATIONS TECHNIQUES

## A.1 — CHARTE GRAPHIQUE OFFICIELLE

```css
/* ===== PALETTE DEM ÉVÉNEMENT ===== */
--event-primary: #FF6B00;      /* Orange Vif - Actions */
--event-secondary: #1A1A1A;    /* Noir - Textes */
--event-bg: #FFFFFF;           /* Blanc - Fond */
--event-accent: #FF8C42;       /* Orange Clair - Hover */
--event-muted: #6B7280;        /* Gris - Textes secondaires */

/* ===== PALETTE DEM VOYAGE ===== */
--voyage-primary: #0A1628;     /* Bleu Nuit - Headers */
--voyage-secondary: #10B981;   /* Vert Émeraude - Actions */
--voyage-bg: #F8FAFC;          /* Gris Très Clair - Fond */
--voyage-accent: #0EA5E9;      /* Cyan - Liens */
--voyage-muted: #64748B;       /* Gris Slate - Secondaires */

/* ===== TYPOGRAPHIE ===== */
--font-primary: 'Inter', -apple-system, sans-serif;
--font-display: 'Poppins', sans-serif;  /* Titres */
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 24px;
--font-size-2xl: 32px;
--font-size-3xl: 48px;

/* ===== ESPACEMENTS (Multiple de 4) ===== */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-6: 24px;  --space-8: 32px;
--space-12: 48px; --space-16: 64px;
```

### RÈGLES ANTI-GÉNÉRIQUE AI
```
❌ INTERDIT:
- Gradients multicolores
- Ombres box-shadow > 20px blur
- Border-radius > 16px (sauf avatars ronds)
- Animations bounce/pulse excessives
- Emojis comme icônes principales

✅ OBLIGATOIRE:
- Icônes SVG Lucide ou Heroicons UNIQUEMENT
- Ombres subtiles: 0 2px 8px rgba(0,0,0,0.08)
- Transitions: 200ms ease-out
- Contrastes WCAG AA minimum
- Couleurs pleines, pas de dégradés
```

---

## A.2 — ARCHITECTURE FIREBASE OPTIMISÉE (CRITIQUE)

### Répartition Hybride Firestore + Realtime Database

```
REALTIME DATABASE (Flux temps réel - ÉCONOMIQUE)
├── /live/
│   ├── positions/{driver_id}      ← GPS chauffeurs (toutes les 15-30s)
│   ├── buses/{line_id}/{bus_id}   ← GPS bus EXPRESS
│   ├── trips_active/{trip_id}     ← Trajets en cours
│   └── online_status/{user_id}    ← Statuts connexion
│
├── /counters/
│   ├── daily/{date}/scans         ← Compteurs scans journaliers
│   ├── daily/{date}/trips         ← Compteurs trajets
│   └── fleet/{owner_id}/stats     ← Stats flotte temps réel
│
└── /queues/
    └── pending_syncs/             ← File sync offline EPscan

FIRESTORE (Données persistantes - LECTURES MINIMISÉES)
├── users/                         ← Profils (cache client 24h)
├── vehicles/                      ← Véhicules (cache 1h)
├── drivers/                       ← Chauffeurs + KYC
├── trips/                         ← Historique trajets archivés
├── transactions/                  ← Historique wallet
├── subscriptions/                 ← Abonnements SAMA PASS
├── events/                        ← Événements
├── tickets/                       ← Billets événements
├── ferry_crossings/               ← Traversées ferry
│
├── aggregates/                    ← DOCUMENTS PRÉ-CALCULÉS
│   ├── fleet_stats/{owner_id}     ← Stats flotte agrégées
│   ├── daily_stats/{date}         ← Stats journalières globales
│   └── monthly_revenue/{month}    ← CA mensuel
│
├── controllers/                   ← Contrôleurs EPscan
├── admins/                        ← Administrateurs
├── admin_logs/                    ← Journal d'audit
└── scans_archive/                 ← Archive scans (post-sync)
```

### Stratégie Cache Client

```javascript
const CacheConfig = {
  CITIES_LIST:     { ttl: 7 * 24 * 3600000 },  // 7 jours
  USER_PROFILE:    { ttl: 24 * 3600000 },      // 24h
  DRIVER_PROFILE:  { ttl: 24 * 3600000 },      // 24h
  WALLET_BALANCE:  { ttl: 2 * 60000 },         // 2 min (depuis RTDB)
  FLEET_VEHICLES:  { ttl: 30 * 60000 },        // 30 min
  FLEET_STATS:     { ttl: 5 * 60000 },         // 5 min (depuis RTDB)
  BUS_POSITIONS:   { ttl: 0 }                  // Temps réel RTDB
};
```

### Smart GPS Tracking

```javascript
// Adaptive Throttling - Économie batterie + Firebase
const GPS_INTERVALS = {
  STATIONARY: 120000,  // 2 min si arrêté > 2min
  SLOW: 30000,         // 30s si vitesse < 20 km/h
  NORMAL: 15000,       // 15s si 20-60 km/h
  FAST: 10000          // 10s si > 60 km/h
};

// Delta minimum: 50 mètres avant d'envoyer une mise à jour
// Compression: 5 décimales GPS (~1m précision)
```

---

## A.3 — CONFIGURATION PROJET

```json
// public/manifest.json
{
  "name": "DEM⇄DEM",
  "short_name": "DemDem",
  "description": "Super-App Mobilité & Événements - Sénégal",
  "theme_color": "#0A1628",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

```html
<!-- index.html <head> -->
<title>DEM⇄DEM | Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw</title>
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png">
```

---

## A.4 — SYSTÈME DE THÈMES DYNAMIQUES

```typescript
// src/contexts/ThemeContext.tsx
type Theme = 'voyage' | 'event' | 'neutral';

// Logique basée sur useLocation().pathname
// /voyage/*, /pass/* → theme voyage (bleu)
// /even/*, /organizer/* → theme event (orange)
// Sinon → theme neutral

// Variables CSS injectées dynamiquement sur <html>
// Les boutons et headers utilisent var(--primary)
```

---

# 📍 SECTION B : INTERFACES UTILISATEUR

## B.1 — LANDING PAGE PRINCIPALE (Split-Screen)

**Route:** `/`

```
MOBILE (375px):
┌─────────────────────────┐
│ HEADER                  │
│ Logo DemDem centré      │
│ Slogan: "Gënaa Yomb..." │
├─────────────────────────┤
│                         │
│ CARTE VOYAGE            │
│ Fond: #0A1628           │
│ Icône: Bus + Avion SVG  │
│ "DEM VOYAGE"            │
│ CTA: "Explorer →"       │
│ → /voyage               │
│ height: 45vh            │
├─────────────────────────┤
│                         │
│ CARTE ÉVÉNEMENT         │
│ Fond: #1A1A1A           │
│ Icône: Ticket + Musique │
│ "DEM ÉVÉNEMENT"         │
│ CTA: "Découvrir →"      │
│ → /evenement            │
│ height: 45vh            │
└─────────────────────────┘

DESKTOP (>768px): Split 50/50 horizontal, height 100vh
Hover: scale(1.02) + brightness(1.1), transition 300ms
```

---

## B.2 — LANDING /voyage

**Route:** `/voyage`

```
┌─────────────────────────────────┐
│ HEADER                          │
│ Logo DemDem                     │
│ Badge "SAMA PASS" (vert) →      │
│ Badge "Chauffeur Bii" (vert) →  │
├─────────────────────────────────┤
│ TITRE                           │
│ "Voyagez Malin"                 │
│ Sous-titre: "Choisissez..."     │
├─────────────────────────────────┤
│ CARTE A: ALLO DAKAR             │
│ Icône: Car (Lucide SVG)         │
│ "Covoiturage National"          │
│ → /voyage/allo-dakar            │
├─────────────────────────────────┤
│ CARTE B: DEM-DEM EXPRESS        │
│ Icône: Bus (Lucide SVG)         │
│ "Navettes Abonnement"           │
│ "Keur Massar ⇄ Dakar"           │
│ → /voyage/express               │
├─────────────────────────────────┤
│ CARTE C: DEM ZIGUINCHOR         │
│ Icône: Ship (Lucide SVG)        │
│ "Ferry Dakar ⇄ Ziguinchor"      │
│ → /voyage/ferry                 │
├─────────────────────────────────┤
│ SECTION SAMA PASS               │
│ Visuel carte abonné             │
│ "Abonnements illimités"         │
│ Bouton "Découvrir les Pass →"   │
└─────────────────────────────────┘

STYLE CARTES:
- padding: 24px
- border-radius: 12px
- Ombre: 0 4px 12px rgba(10,22,40,0.08)
- Bordures: #10B981 (émeraude)
- CTA: bg-emerald-600 hover:bg-emerald-700
```

---

## B.3 — LANDING /evenement

**Route:** `/evenement`

```
┌─────────────────────────────────┐
│ HEADER                          │
│ Fond: #FFFFFF                   │
│ Logo DemDem (gauche)            │
│ Badge "Nouvelle expérience"     │
│ Style OUTLINE (bordure grise)   │
│ "Organisateur ?" (texte gris)   │
├─────────────────────────────────┤
│ BARRE RECHERCHE                 │
│ Bordure: 1px solid #E5E7EB      │
│ Ombre: 0 2px 8px rgba(0,0,0,0.06)│
│ Placeholder: "Rechercher..."    │
│ Icône loupe SVG à gauche        │
├─────────────────────────────────┤
│ CARTES ÉVÉNEMENTS               │
│ ❌ PAS de badges [EVEN] colorés │
│ Image: aspect-ratio 16/9        │
│ Titre: font-semibold text-lg    │
│ Date: text-sm text-gray-500     │
│ Prix: text-orange-600 font-bold │
│ Hover: translateY(-4px) + ombre │
└─────────────────────────────────┘

COULEURS:
- Actions/Boutons: #FF6B00
- Textes: #1A1A1A
- Fond: #FFFFFF
- Bordures: #E5E7EB
```

---

# 📍 SECTION C : DEM VOYAGE — MODULES DÉTAILLÉS

## C.1 — DEM-DEM EXPRESS (Liste Lignes)

**Route:** `/voyage/express`

```javascript
const LINES = [
  {
    id: 'KM_UCAD',
    name: 'Keur Massar ⇄ UCAD',
    target: 'Étudiants',
    prices: {
      eco: { weekly: 3000, monthly: 10000 },
      confort: { weekly: 5000, monthly: 15000 }
    },
    schedule: { eco: 'Continu', confort: '05h-10h / 16h-19h' }
  },
  {
    id: 'KM_COLOBANE',
    name: 'Keur Massar ⇄ Colobane',
    target: 'Professionnels',
    prices: {
      eco: { weekly: 4500, monthly: 15000 },
      confort: { weekly: 9000, monthly: 30000 }
    }
  },
  // + Port, Ngor, Petersen, Latdior
];
```

```
STRUCTURE CARTE LIGNE:
┌─────────────────────────────────┐
│ 🚌 Keur Massar ⇄ UCAD          │
│ Cible: Étudiants                │
├────────────────┬────────────────┤
│ GAMME ECO      │ GAMME CONFORT  │
│ Ndiaga Ndiaye  │ Bus Coaster    │
│ Hebdo: 3 000F  │ Hebdo: 5 000F  │
│ Mensuel: 10 000│ Mensuel: 15 000│
│ [S'abonner]    │ [S'abonner]    │
└────────────────┴────────────────┘

ECO: bg-gray-100, "Service Continu"
CONFORT: bg-emerald-50, "Split-Shift 05h-10h / 16h-19h"

Clic S'abonner → /voyage/express/subscribe?line={id}&tier={eco|confort}&period={weekly|monthly}
```

---

## C.2 — TUNNEL ABONNEMENT SAMA PASS

**Route:** `/voyage/express/subscribe`

**4 ÉTAPES:**

```
ÉTAPE 1/4 - RÉCAPITULATIF:
- Ligne sélectionnée
- Gamme (ECO/CONFORT)
- Durée (Hebdo/Mensuel)
- Prix
- Boutons [Modifier] [Continuer →]

ÉTAPE 2/4 - IDENTITÉ:
- Nom complet*
- Numéro CNI (13 chiffres)*
- Téléphone (+221 7X XXX XX XX)*

ÉTAPE 3/4 - PHOTO ID:
- Photo obligatoire pour le pass
- [Prendre une Photo]
- [Choisir depuis Galerie]
- Compression < 2MB

ÉTAPE 4/4 - PAIEMENT:
- Abonnement: X FCFA
- Commission (5%): Y FCFA
- Frais Mobile (1.5%): Z FCFA
- TOTAL: X+Y+Z FCFA
- Boutons [Wave] [Orange Money]
- [Confirmer & Payer]
```

---

## C.3 — SAMA PASS CARD (Génération Canvas)

**Dimensions:** 400x650px

```
┌────────────────────────────────┐
│ HEADER SAMA PASS               │
│ Logo DemDem + "SAMA PASS"      │
│ Fond: #0A1628                  │
├────────────────────────────────┤
│                                │
│   ┌──────────────────┐         │
│   │   PHOTO ID       │         │
│   │   200x200px      │         │
│   │   border-radius  │         │
│   └──────────────────┘         │
│                                │
│   NOM COMPLET                  │
│                                │
├────────────────────────────────┤
│   ┌──────────────────┐         │
│   │   QR CODE        │         │
│   │   180x180px      │         │
│   └──────────────────┘         │
│                                │
│   N°: SP-17051234567890        │
├────────────────────────────────┤
│ Ligne: Keur Massar ⇄ UCAD      │
│ Gamme: ECO                     │
│ Validité: 25/01 → 24/02/2026   │
│ Trajets: 0/60 utilisés         │
│                                │
│ ✅ VALIDE (30j restants)       │
│ ou ❌ EXPIRÉ                   │
└────────────────────────────────┘

QR CODE JWT CONTENT:
{
  "sub": "SP-17051234567890",
  "tier": "ECO",
  "line": "KM_UCAD",
  "exp": timestamp_expiration,
  "iat": timestamp_creation
}

BOUTONS:
- "Enregistrer dans Galerie" → download
- "Voir dans Wallet" → /voyage/wallet
```

---

## C.4 — SAMA PASS WALLET (Offline)

**Route:** `/voyage/wallet`

```
┌─────────────────────────────────┐
│ 💳 SAMA PASS WALLET             │
│ "Consultez votre pass"          │
├─────────────────────────────────┤
│                                 │
│ [SP-_________________]          │
│                                 │
│  ┌─────┬─────┬─────┐            │
│  │  1  │  2  │  3  │            │
│  ├─────┼─────┼─────┤            │
│  │  4  │  5  │  6  │   80px     │
│  ├─────┼─────┼─────┤   par      │
│  │  7  │  8  │  9  │   touche   │
│  ├─────┼─────┼─────┤            │
│  │  ⌫  │  0  │  ✓  │            │
│  └─────┴─────┴─────┘            │
│                                 │
│ 📶 Mode: En ligne               │
│ 📴 Mode: Hors ligne (cache)     │
└─────────────────────────────────┘

LOGIQUE:
1. Essayer fetch online (Firebase)
2. Si online → stocker en localStorage
3. Si offline → lire depuis localStorage
4. Badge 📶 vert ou 📴 orange selon mode
```

---

## C.5 — INTERFACE PASSAGER EXPRESS (Style Transit)

**Route:** `/voyage/express/live`

```
┌─────────────────────────────────┐
│ DEM-DEM EXPRESS           [📍]  │
│                          badge  │
├─────────────────────────────────┤
│   ┌─────────────────────────┐   │
│   │    🗺️ CARTE MAPBOX      │   │
│   │   🚏 (Mon arrêt)        │   │
│   │    │  500m              │   │
│   │   🚌 Ligne 12           │   │
│   └─────────────────────────┘   │
├─────────────────────────────────┤
│                          ┌────┐ │
│ Ligne 12 → UCAD          │ GO │ │
│ Arrive à 08:15 • 3 min   │ 🟡 │ │
│                          └────┘ │
│ ●━━━━━━━━━━━━━━━━━○             │
│ 🚌              🚏              │
├─────────────────────────────────┤
│ 🚶 Marche: 2 min jusqu'à l'arrêt│
├─────────────────────────────────┤
│ PROCHAINS BUS (scroll horiz.)   │
│ ┌────────┐ ┌────────┐ ┌───────┐ │
│ │ 🚌 12  │ │ 🚌 05  │ │ 🚌 21 │ │
│ │  3 min │ │  8 min │ │ 15 min│ │
│ │→ UCAD  │ │→Colob. │ │→ Port │ │
│ └────────┘ └────────┘ └───────┘ │
└─────────────────────────────────┘

ACTIONS:
- Badge 📍 → Ouvre carte + détecte arrêt proche
- Cartes bas → Classées par temps d'arrivée croissant
- Clic carte → Sélectionne ligne, affiche parcours
- Bouton GO → Affiche SAMA PASS (QR) plein écran

Position bus = GPS du téléphone du receveur EPscanV
```

---

# 📍 SECTION D : ALLO DAKAR (COVOITURAGE)

## D.1 — MOTEUR RECHERCHE TRAJET

**Route:** `/voyage/allo-dakar`

```
┌─────────────────────────────────┐
│ 🚗 ALLO DAKAR                   │
│ "Covoiturage entre particuliers"│
├─────────────────────────────────┤
│ Départ                          │
│ [📍 Entrez votre ville...]      │
│ (Autocomplétion Pelias)         │
│                                 │
│ Arrivée                         │
│ [📍 Destination...]             │
│                                 │
│ Date                            │
│ [📅 Sélectionner une date]      │
│                                 │
│ Passagers                       │
│ [➖  2  ➕]                      │
│                                 │
│ [🔍 RECHERCHER DES TRAJETS]     │
├─────────────────────────────────┤
│ 💰 Votre avoir: 2 000 FCFA      │
└─────────────────────────────────┘

AUTOCOMPLÉTION: Pelias API avec boundary.country=SN
FALLBACK: Liste statique 20 principales villes si Pelias down
STYLE: Inputs height 56px, padding 16px
```

---

## D.2 — KYC CONDUCTEUR

**Route:** `/voyage/conducteur/inscription`

**4 ÉTAPES avec CNI obligatoire:**

```
ÉTAPE 1/4 - INFORMATIONS:
- Nom complet
- Téléphone (+221)
- Numéro CNI (13 chiffres)

ÉTAPE 2/4 - DOCUMENTS:
- Permis de Conduire (RECTO + VERSO)
- Carte Grise Véhicule
- Attestation Assurance
→ Upload photos obligatoires

ÉTAPE 3/4 - VÉHICULE:
- Marque (select: Toyota, Renault, Peugeot, Autre)
- Modèle
- Année
- Immatriculation
- Nombre de places (2-7)
- Photo du véhicule

ÉTAPE 4/4 - VALIDATION:
- Récapitulatif
- Checkbox CGU
- [Soumettre ma candidature]

CATÉGORISATION AUTO:
- Si Année < 8 ans ET Climatisation = true → CONFORT
- Sinon → ECO

STATUTS POST-SOUMISSION:
- PENDING: "Dossier en cours d'examen (24-48h)"
- APPROVED: Accès portail "Chauffeur Bii"
- REJECTED: Motif + possibilité resoumettre
```

---

## D.3 — PORTAIL "CHAUFFEUR BII"

**Route:** `/voyage/conducteur/dashboard`

```
3 ONGLETS (Tab bar en bas):

ONGLET 1 - MON ARGENT:
┌─────────────────────────────────┐
│ 💰 Solde Disponible             │
│      45 750 FCFA                │
│ [Retirer vers Wave]             │
├─────────────────────────────────┤
│ Historique                      │
│ 24/01 - Trajet Dakar→Thiès      │
│ +3 200 FCFA ✅                  │
│ 23/01 - Retrait Wave            │
│ -20 000 FCFA ✅                 │
└─────────────────────────────────┘

ONGLET 2 - MES DOCUMENTS:
- Statut chaque document (✅ Valide, ⚠️ Expire bientôt)
- Bouton [Mettre à jour] si expiration proche

ONGLET 3 - MA QUALITÉ:
- Note moyenne /5
- Badge 🏆 TOP CONDUCTEUR si note > 4.8
- Liste derniers avis
```

---

## D.4 — INTERFACE CONDUCTEUR ALL-IN-ONE

**Route:** `/voyage/conducteur/trajet`

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER - Trajet en cours                              🔋📶 │
│ Dakar → Thiès • 45 min restant                             │
│ [Navigation GPS]                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              🗺️ CARTE INTERACTIVE                          │
│              (Mapbox/Google Maps)                           │
│              Position chauffeur + tracé destination         │
│                                                             │
│                              ┌──────────────┐               │
│                              │   SCANNER    │               │
│                              │   (flottant) │               │
│                              └──────────────┘               │
├─────────────────────────────────────────────────────────────┤
│ PROCHAINES COURSES (scroll horizontal)                      │
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐      │
│ │ 10:30         │ │ 11:15         │ │ 14:00         │      │
│ │ Thiès→Mbour   │ │ Mbour→Dakar   │ │ Dakar→Kaolack │      │
│ │ 2 500 FCFA    │ │ 3 800 FCFA    │ │ 8 500 FCFA    │      │
│ └───────────────┘ └───────────────┘ └───────────────┘      │
└─────────────────────────────────────────────────────────────┘

BOUTON SCANNER INTÉGRÉ:
─────────────────────────
SCAN DÉPART (avec bouton GO):
- Chauffeur scanne QR passager à la montée
- Valide billet → statut "À bord"

SCAN ARRIVÉE (avec bouton GO):
- Second scan à destination
- DÉCLENCHE libération des fonds (95%)
- Message: "Course terminée - [Montant] ajouté à votre solde"

GPS obligatoire pour mode "EN LIGNE"
Si GPS désactivé → alerte + passage HORS LIGNE après 30s
```

---

## D.5 — WALLET & SÉQUESTRE (Règle 100km)

```javascript
// LOGIQUE FINANCIÈRE

async function processTrip(tripId) {
  const trip = await getTrip(tripId);
  const distance = trip.distance_km;
  const amount = trip.driver_earnings; // Après commission 5%

  if (distance > 100) {
    // LONGUE DISTANCE: Avance 30% au départ, 70% à l'arrivée

    // Au START_TRIP:
    await payWaveAdvance(trip.driver_id, amount * 0.30);

    // Au END_TRIP:
    await releaseToWallet(trip.driver_id, amount * 0.70);

  } else {
    // COURTE DISTANCE: Tout libéré à l'arrivée
    await releaseToWallet(trip.driver_id, amount);
  }
}

// EXCEPTION: Si conducteur.rating < 3.5 → Pas d'avance, tout en séquestre
```

---

# 📍 SECTION E : GESTION DE FLOTTE

## E.1 — STRUCTURE FLOTTE

```javascript
// Modèles
Vehicle → appartient à Owner (User)
Driver → assigné à Vehicle
Relation: One-to-Many (1 Owner → N Vehicles)
Self-Driving: Owner peut s'assigner comme Driver de son véhicule
```

## E.2 — MODES DE PAIEMENT (Smart Switch)

```
MODE FLOTTE (Salarié):
- Wallet destinataire = OWNER
- Use case: Taxis entreprise, Bus, Gestionnaires

MODE VERSEMENT (Location/Work&Pay):
- Wallet destinataire = DRIVER
- Use case: Taxis jaune-noir, Clandos, Location journalière

Commission plateforme (5%) prélevée à la source dans tous les cas
```

## E.3 — INSCRIPTION GESTIONNAIRE FLOTTE

```
TOUS les gestionnaires de flotte sont PRO (pas de distinction < 3 ou > 3 véhicules)

FRAIS: 20 000 FCFA / mois
- Prélevé automatiquement sur le net à percevoir (wallet)
- Prélèvement en 2 tranches possible
- PAS d'abonnement séparé, PAS d'UI explicite sur les frais (éviter fuite prospects)

UI Inscription:
┌─────────────────────────────────┐
│ 🏢 COMPTE GESTIONNAIRE DE FLOTTE│
├─────────────────────────────────┤
│ Nombre de véhicules à gérer     │
│ [➖  5  ➕]                      │
│                                 │
│ ☑️ J'accepte les conditions     │
│    générales d'utilisation      │
│                                 │
│ [CONTINUER]                     │
└─────────────────────────────────┘

Cloud Function: Prélèvement mensuel le 1er du mois sur wallet
```

## E.4 — DASHBOARD GESTIONNAIRE FLOTTE

```
┌─────────────────────────────────┐
│ 📊 MON TABLEAU DE BORD          │
├─────────────────────────────────┤
│ KPIs TEMPS RÉEL                 │
│ ┌─────────┬─────────┬─────────┐ │
│ │ 127 500F│   23    │  412 km │ │
│ │CA Jour  │ Courses │ Distance│ │
│ └─────────┴─────────┴─────────┘ │
├─────────────────────────────────┤
│ VÉHICULES (5)                   │
│ ┌─────────────────────────────┐ │
│ │ 🟢 DK-2847 • Moussa D.      │ │
│ │ En ligne • 45 000F aujourd'hui│
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🔴 DK-9921 • Ibrahima       │ │
│ │ Hors ligne depuis 2h        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [🗺️ CARTE FLOTTE]              │
│ (Position temps réel véhicules) │
├─────────────────────────────────┤
│ [📤 EXPORTER RAPPORT]           │
│ PDF/Excel par véhicule          │
└─────────────────────────────────┘

LOGS GPS: Chaque coupure GPS pendant trajet = enregistrée (anti-fraude)
ALERTES: Notification gestionnaire si signal GPS perdu
```

---

# 📍 SECTION F : EPSCAN SUITE

## F.1 — EPscanV (Transport Offline-First)

**Route:** `/controller-epscanv`

```
┌─────────────────────────────────┐
│ EPscanV                    🔋95%│
│ Ligne: KM ⇄ UCAD                │
│ Conducteur: Amadou D.           │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │    ZONE SCAN CAMÉRA     │    │
│  │    [Cadre QR centré]    │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  ┌───────┐┌───────┐┌───────┐   │
│  │  42   ││   3   ││  45   │   │
│  │ VALID ││REFUSÉ ││ TOTAL │   │
│  │  🟢   ││  🔴   ││  🔵   │   │
│  └───────┘└───────┘└───────┘   │
│  Font: 48px bold               │
├─────────────────────────────────┤
│ 📴 Mode Offline                 │
│ Dernière sync: 08:32            │
│ [🔄 Synchroniser maintenant]    │
└─────────────────────────────────┘

VALIDATION JWT OFFLINE:
1. Vérifier signature (clé publique embarquée)
2. Vérifier non expiré (exp > now)
3. Vérifier bonne ligne
4. Vérifier tier (CONFORT passe partout, ECO seulement ECO)
5. Anti-passback: Cooldown 2h par pass

STOCKAGE: IndexedDB local + Background Sync
WAKE LOCK: Écran toujours allumé
RESET AUTO: Compteurs à 00h00

DIFFUSION GPS: Position téléphone receveur = position bus
→ Envoi RTDB toutes les 15-30s selon vitesse
→ Mode économie si arrêté > 2min
```

## F.2 — EPscan+ (Ferry COSAMA)

**Route:** `/controller-epscan-plus`

```
┌─────────────────────────────────┐
│ EPscan+ | DEM ZIGUINCHOR   🔋📶│
│ Traversée: DK→ZIG #2026-0127   │
├─────────────────────────────────┤
│ MODE: [PASSAGERS] [FRET]       │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │    📷 ZONE SCAN QR      │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│ COMPTEURS PASSAGERS             │
│ ┌───────┬───────┬───────┐       │
│ │ 247   │  12   │ 259   │       │
│ │EMBARQ.│REFUSÉ │ TOTAL │       │
│ └───────┴───────┴───────┘       │
│ PAR CLASSE:                     │
│ (Référencer catégories tunnel   │
│  COSAMA existant)               │
├─────────────────────────────────┤
│ [📋 VOIR MANIFESTE]             │
│ [🚗 PASSER EN MODE FRET]        │
└─────────────────────────────────┘

MODE FRET: Véhicules + Tonnage
MANIFESTE: Export PDF, envoi capitaine
BOARDING: Embarquement par vagues (VIP → Standard → Fauteuil → Pont)
```

## F.3 — LOGIN CONTRÔLEUR UNIFIÉ

**Route:** `/controller-login`

```
┌─────────────────────────────────┐
│        LOGO DEMDEM              │
│                                 │
│   "Accès Contrôleur"            │
│                                 │
│   Code d'accès                  │
│   ┌─┬─┬─┬─┬─┬─┐                 │
│   │ │ │ │ │ │ │                 │
│   └─┴─┴─┴─┴─┴─┘                 │
│   (6 chiffres)                  │
│                                 │
│   [SE CONNECTER]                │
│                                 │
│   ⓘ Contactez votre             │
│   superviseur pour              │
│   obtenir un code               │
└─────────────────────────────────┘

REDIRECTION PAR RÔLE:
- event_controller → EPscan (Event)
- ferry_controller → EPscan+ (Ferry)
- transport_controller → EPscanV (Transport)

GESTION CONTRÔLEURS:
- Event → par OPS MANAGER EVENT
- Transport (EXPRESS + MARITIME) → par OPS MANAGER TRANSPORT
- Ajout contrôleur = KYC complète avec CNI obligatoire
```

---

# 📍 SECTION G : DEM ÉVÉNEMENT

## G.1 — BILLET CANVAS (No-PDF Policy)

**Dimensions:** 400x600px

```
┌────────────────────────────────┐
│ HEADER (60px)                  │
│ Logo DemDem + Logo Organisateur│
├────────────────────────────────┤
│ BADGE VIP (si applicable)      │
│ Bandeau doré #D4AF37           │
├────────────────────────────────┤
│ QR CODE (200x200px)            │
│ Centré, quiet zone 20px        │
├────────────────────────────────┤
│ INFOS                          │
│ Titre: Bold 18px               │
│ Date: Medium 14px + icône      │
│ Lieu: Regular 14px + icône     │
├────────────────────────────────┤
│ FOOTER                         │
│ Nom client (discret)           │
│ Tél: 77***26 (masqué)          │
│ N° Billet                      │
└────────────────────────────────┘

BOUTON: "Enregistrer dans Galerie" → download ticket_{id}.jpg
```

## G.2 — MODE ACCORD EXCLUSIVITÉ

```
FORMULAIRE CRÉATION ÉVÉNEMENT (Section Tarification):

┌─────────────────────────────────────────────────┐
│ Mode Accord Exclusivité          [TOGGLE OFF]  │
│ ⓘ Survolez pour plus d'infos                   │
└─────────────────────────────────────────────────┘

TOOLTIP:
"Mode Exclusivité ACTIVÉ:
• Les frais (5%) sont ajoutés au prix acheteur
• Vous recevez 100% du prix affiché
• Seuls 2% de frais Mobile Money sont déduits

Mode Standard (désactivé):
• Frais partagés: 2.5% vous / 2.5% acheteur"

TOGGLE: OFF = bg-gray-200, ON = bg-orange-500
```

## G.3 — VIP CAPPING (Frais Plafonnés)

```javascript
const calculateEventFees = (basePrice, isExclusivityMode) => {
  const PLATFORM_RATE = 0.05;  // 5%
  const MM_RATE = 0.015;       // 1.5%
  const VIP_CAP = 2500;        // Plafond FCFA

  let platformFee = basePrice * PLATFORM_RATE;

  // VIP CAPPING: Si frais > 2500, plafonner
  if (platformFee > VIP_CAP) {
    platformFee = VIP_CAP;
  }

  const mmFee = (basePrice + platformFee) * MM_RATE;

  if (isExclusivityMode) {
    return {
      buyerPays: basePrice + platformFee + mmFee,
      organizerReceives: basePrice - (basePrice * 0.02)
    };
  } else {
    const sharedFee = platformFee / 2;
    return {
      buyerPays: basePrice + sharedFee + mmFee,
      organizerReceives: basePrice - sharedFee
    };
  }
};
```

---

# 📍 SECTION G-BIS : DASHBOARD ORGANISATEUR EVENT (REFONTE)

## G.4 — DASHBOARD ORGANISATEUR (Amélioré)

**Route:** `/organizer/dashboard`

**PROBLÈMES ACTUELS À CORRIGER:**
- KPIs peu visibles et design trop basique
- Liste événements monotone sans hiérarchie visuelle
- Manque de call-to-action clairs

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ Logo DemDem              Bonjour, [Nom Organisateur] 👋      │
│                          [+ Créer un événement]              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ KPIs PRINCIPAUX (4 cartes avec icônes SVG)                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│
│ │ 💰          │ │ 🎫          │ │ 💳          │ │ 📊       ││
│ │ REVENUS     │ │ BILLETS     │ │ PAIEMENTS   │ │ SCANS    ││
│ │             │ │             │ │             │ │          ││
│ │ 1 250 000 F │ │ Vendus: 847 │ │ Wave: 78%   │ │ Taux:    ││
│ │ +15% ↑      │ │ Restants:153│ │ OM: 22%     │ │ 89%      ││
│ │             │ │             │ │             │ │          ││
│ │ Confirmés   │ │ Total: 1000 │ │ Commission  │ │ Entrées  ││
│ │             │ │             │ │ en attente  │ │ validées ││
│ └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘│
│                                                              │
│ Fond: #FFFFFF                                                │
│ Bordure gauche colorée: #FF6B00 (accent)                     │
│ Ombre: 0 2px 8px rgba(0,0,0,0.06)                            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 📡 APERÇU SCANS EN TEMPS RÉEL                                │
│ (Section optionnelle - visible si événement en cours)        │
│                                                              │
│ ┌───────────────────────────────────────────────────────────┐│
│ │ Marathon Puma Sport Edition           🟢 EN COURS         ││
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                       ││
│ │ Scannés: 423/500 (85%)               [Voir détails →]     ││
│ └───────────────────────────────────────────────────────────┘│
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 📅 MES ÉVÉNEMENTS                                            │
│                                                              │
│ [Tous] [À venir] [En cours] [Passés]   🔍 Rechercher...     │
│                                                              │
│ ┌───────────────────────────────────────────────────────────┐│
│ │ ┌─────────┐                                               ││
│ │ │  IMAGE  │ Marathon Puma Sport Edition ONE               ││
│ │ │  EVENT  │ 📅 22 Fév 2026 • Dakar                        ││
│ │ │         │                                               ││
│ │ └─────────┘ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││
│ │             │ Vendus   │ │ Revenus  │ │ Statut   │       ││
│ │             │   423    │ │ 847 000F │ │ 🟢 Actif │       ││
│ │             └──────────┘ └──────────┘ └──────────┘       ││
│ │                                                           ││
│ │ [📊 Stats] [✏️ Modifier] [👁️ Voir page]                  ││
│ └───────────────────────────────────────────────────────────┘│
│                                                              │
│ ┌───────────────────────────────────────────────────────────┐│
│ │ ┌─────────┐                                               ││
│ │ │  IMAGE  │ Safari Week Bandia                            ││
│ │ │  EVENT  │ 📅 21 Fév 2026 • Mbour                        ││
│ │ │         │                                               ││
│ │ └─────────┘ ┌──────────┐ ┌──────────┐ ┌──────────┐       ││
│ │             │ Vendus   │ │ Revenus  │ │ Statut   │       ││
│ │             │    0     │ │    0 F   │ │ 🟡 Draft │       ││
│ │             └──────────┘ └──────────┘ └──────────┘       ││
│ │                                                           ││
│ │ [📝 Compléter] [🗑️ Supprimer]                             ││
│ └───────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘

STYLE:
- Fond page: #F9FAFB (gris très clair)
- Cartes: #FFFFFF avec ombre subtile
- Statuts: 🟢 Actif (#10B981), 🟡 Draft (#F59E0B), 🔴 Terminé (#6B7280)
- Actions: Boutons outline, hover bg-orange-50
- Images événements: aspect-ratio 16/9, border-radius 8px
```

---

# 📍 SECTION G-TER : PAGES MARKETING (REBRANDING DEMDEM)

## G.5 — PAGE "COMMENT ÇA MARCHE" ACHETEURS

**Route:** `/comment-ca-marche` ou `/how-it-works`

**IMPORTANT:** Remplacer TOUS les "EvenPass" par "DemDem" ou "DEM ÉVÉNEMENT"

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ Logo DemDem                      [Acheter] [Organisateur ?] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 Simple, Rapide, Sécurisé                                  │
│                                                              │
│        Comment ça                                            │
│          marche ?                                            │
│                                                              │
│ 4 étapes pour vivre une expérience événementielle           │
│ révolutionnaire                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────┐  ┌─────────────────────┐            │
│ │ 🔍                  │  │ 💳                  │            │
│ │ 01                  │  │ 02                  │            │
│ │ DÉCOUVREZ           │  │ ACHETEZ             │            │
│ │                     │  │                     │            │
│ │ Parcourez notre     │  │ Payez en toute      │            │
│ │ catalogue           │  │ sécurité avec       │            │
│ │ d'événements au     │  │ Orange Money ou     │            │
│ │ Sénégal. Concerts,  │  │ Wave. Transaction   │            │
│ │ lutte, théâtre...   │  │ cryptée instantanée │            │
│ └─────────────────────┘  └─────────────────────┘            │
│                                                              │
│ ┌─────────────────────┐  ┌─────────────────────┐            │
│ │ 📱                  │  │ ✅                  │            │
│ │ 03                  │  │ 04                  │            │
│ │ RECEVEZ             │  │ ENTREZ              │            │
│ │                     │  │                     │            │
│ │ Votre billet digital│  │ Présentez votre QR  │            │
│ │ arrive instantané-  │  │ code. Scan ultra-   │            │
│ │ ment avec QR code   │  │ rapide (< 200ms),   │            │
│ │ unique et sécurisé  │  │ validation instant. │            │
│ └─────────────────────┘  └─────────────────────┘            │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│        La Différence DEM ÉVÉNEMENT                           │
│                                                              │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ ❌ Billetterie          │ │ ✅ Solution DEM ÉVÉNEMENT   │ │
│ │    Traditionnelle       │ │                             │ │
│ │                         │ │ ✓ Entrée instantanée        │ │
│ │ • Files d'attente       │ │   (< 200ms)                 │ │
│ │   interminables         │ │                             │ │
│ │ • Risque de billets     │ │ ✓ Sécurité maximale         │ │
│ │   contrefaits           │ │   anti-fraude               │ │
│ │ • Perte ou oubli du     │ │                             │ │
│ │   billet papier         │ │ ✓ Billet toujours sur       │ │
│ │ • Gestion manuelle      │ │   vous (smartphone)         │ │
│ │   et erreurs            │ │                             │ │
│ │                         │ │ ✓ Traçabilité complète      │ │
│ │                         │ │   en temps réel             │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ 🔒      │ │ ⚡      │ │ 🕐      │ │ 📱      │            │
│ │Sécurité │ │ Ultra   │ │ 24/7    │ │ 100%    │            │
│ │ Totale  │ │ Rapide  │ │Disponib.│ │ Digital │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                              │
│              [DÉCOUVRIR LES ÉVÉNEMENTS →]                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘

STYLE:
- Fond: #FFFFFF
- Accent: #FF6B00 (orange DEM EVENT)
- Cartes étapes: Bordure gauche orange, fond blanc
- Icônes: SVG Lucide (Search, CreditCard, Smartphone, CheckCircle)
- Bouton CTA: bg-orange-500 hover:bg-orange-600
```

---

## G.6 — PAGE "DEVENIR ORGANISATEUR"

**Route:** `/organisateur` ou `/become-organizer`

**IMPORTANT:** Remplacer TOUS les "EvenPass" par "DemDem" ou "DEM ÉVÉNEMENT"

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                       │
│ Logo DemDem                    [Se connecter] [S'inscrire]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🏆 Solution Professionnelle                                  │
│                                                              │
│           Créez                                              │
│           Vendez                                             │
│           Gérez                                              │
│                                                              │
│ La plateforme tout-en-un pour transformer vos événements    │
│ en succès                                                    │
│                                                              │
│              [DEVENIR ORGANISATEUR →]                        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ CHIFFRES CLÉS (4 cards horizontales)                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ ⚡       │ │ 🛡️       │ │ 🕐       │ │ 🎫       │        │
│ │ < 200ms  │ │ 100%     │ │ 24/7     │ │ +10K     │        │
│ │ Temps de │ │ Anti-    │ │ Support  │ │ Billets  │        │
│ │ scan     │ │ fraude   │ │ actif    │ │ vendus   │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│        La Rupture DEM ÉVÉNEMENT                              │
│ Transformez votre gestion d'événements :                     │
│ du chaos manuel à l'excellence digitale                      │
│                                                              │
│ ┌─────────────────────────┐ ┌─────────────────────────────┐ │
│ │ ❌ Gestion              │ │ ✅ Plateforme              │ │
│ │    Traditionnelle       │ │    DEM ÉVÉNEMENT           │ │
│ │                         │ │                             │ │
│ │ • Gestion manuelle      │ │ ✓ Automatisation complète  │ │
│ │   chronophage           │ │   (< 1 min)                │ │
│ │ • Fraude et billets     │ │                             │ │
│ │   contrefaits           │ │ ✓ Sécurité maximale        │ │
│ │ • Comptage manuel       │ │   garantie                 │ │
│ │   et erreurs            │ │                             │ │
│ │ • Files d'attente       │ │ ✓ Dashboard temps réel     │ │
│ │   interminables         │ │   précis                   │ │
│ │ • Visibilité financière │ │                             │ │
│ │   limitée               │ │ ✓ Fluidité et rapidité     │ │
│ │                         │ │   optimales                │ │
│ │                         │ │                             │ │
│ │                         │ │ ✓ Transparence financière  │ │
│ │                         │ │   totale                   │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│        Fonctionnalités Puissantes                            │
│                                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 📊              │ │ 🎫              │ │ 💰              │ │
│ │ Dashboard       │ │ Billets         │ │ Paiements       │ │
│ │ Temps Réel      │ │ Sécurisés       │ │ Instantanés     │ │
│ │                 │ │                 │ │                 │ │
│ │ Suivez vos      │ │ QR codes        │ │ Recevez vos     │ │
│ │ ventes et       │ │ uniques,        │ │ gains via Wave  │ │
│ │ entrées live    │ │ anti-fraude     │ │ ou Orange Money │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                              │
│              [CRÉER MON COMPTE ORGANISATEUR →]               │
│                                                              │
└─────────────────────────────────────────────────────────────┘

STYLE:
- Fond: Dégradé très léger orange en haut (#FFF7ED → #FFFFFF)
- Accent: #FF6B00
- Cartes: Fond blanc, ombre subtile
- Titre "Créez Vendez Gérez":
  - "Créez" = #1A1A1A
  - "Vendez" = #FF6B00
  - "Gérez" = #10B981
```

---

# 📍 SECTION G-QUATER : PAGES LOGIN MODERNISÉES

## G.7 — LOGIN ORGANISATEUR (Modernisé)

**Route:** `/organizer/login`

**PROBLÈME ACTUEL:** Fond noir trop générique "dark mode AI", pas assez branded

**IMPORTANT:** Conserver les accès cachés existants (admin, etc.)

```
NOUVEAU DESIGN - FOND CLAIR MODERNE:

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │                                                        │  │
│ │                                                        │  │
│ │              ┌─────────────────┐                       │  │
│ │              │                 │                       │  │
│ │              │   LOGO DEMDEM   │                       │  │
│ │              │                 │                       │  │
│ │              └─────────────────┘                       │  │
│ │                                                        │  │
│ │              Espace Organisateur                       │  │
│ │              Gérez vos événements en toute simplicité  │  │
│ │                                                        │  │
│ │  ┌──────────────────────────────────────────────────┐  │  │
│ │  │                                                  │  │  │
│ │  │  Email                                           │  │  │
│ │  │  ┌──────────────────────────────────────────┐   │  │  │
│ │  │  │ 📧  votre@email.com                      │   │  │  │
│ │  │  └──────────────────────────────────────────┘   │  │  │
│ │  │                                                  │  │  │
│ │  │  Mot de passe                                    │  │  │
│ │  │  ┌──────────────────────────────────────────┐   │  │  │
│ │  │  │ 🔒  ••••••••                         👁️  │   │  │  │
│ │  │  └──────────────────────────────────────────┘   │  │  │
│ │  │                                                  │  │  │
│ │  │                    Mot de passe oublié ?         │  │  │
│ │  │                                                  │  │  │
│ │  │  ┌──────────────────────────────────────────┐   │  │  │
│ │  │  │           SE CONNECTER →                 │   │  │  │
│ │  │  └──────────────────────────────────────────┘   │  │  │
│ │  │                                                  │  │  │
│ │  │  ─────────────── ou ───────────────             │  │  │
│ │  │                                                  │  │  │
│ │  │  Pas encore organisateur ?                       │  │  │
│ │  │                                                  │  │  │
│ │  │  ┌──────────────────────────────────────────┐   │  │  │
│ │  │  │       Créer un compte organisateur       │   │  │  │
│ │  │  └──────────────────────────────────────────┘   │  │  │
│ │  │                                                  │  │  │
│ │  │              Retour à l'accueil                  │  │  │
│ │  │                                                  │  │  │
│ │  └──────────────────────────────────────────────────┘  │  │
│ │                                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

STYLE:
- Fond page: #F8FAFC (gris très clair) ou dégradé subtil
- Carte login: #FFFFFF avec ombre douce
- Border-radius carte: 16px
- Inputs:
  - Fond: #F9FAFB
  - Bordure: 1px solid #E5E7EB
  - Focus: bordure #FF6B00
  - Height: 52px
  - Icônes: à gauche, couleur #9CA3AF
- Bouton principal: bg-orange-500, full width, height 52px
- Bouton secondaire: outline orange, fond transparent
- "Mot de passe oublié": texte orange, aligné droite
- Texte secondaire: #6B7280

ACCÈS CACHÉS À CONSERVER:
- Triple-tap sur logo → /admin/login
- URL directe → /master-go (accès admin existant)
- Tous les autres accès cachés existants
```

---

## G.8 — LOGIN ACHETEUR / UTILISATEUR

**Route:** `/login`

```
DESIGN MODERNE - COHÉRENT AVEC ORGANISATEUR:

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              ┌─────────────────┐                             │
│              │   LOGO DEMDEM   │                             │
│              └─────────────────┘                             │
│                                                              │
│              Connexion                                       │
│              Accédez à vos billets et réservations          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Téléphone                                           │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 🇸🇳 +221  │  7X XXX XX XX                      │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  Code PIN                                            │   │
│  │  ┌────┬────┬────┬────┐                               │   │
│  │  │    │    │    │    │  (4 chiffres)                 │   │
│  │  └────┴────┴────┴────┘                               │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              SE CONNECTER →                    │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ─────────────── ou ───────────────                  │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │         Créer un compte                        │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  PIN oublié ? Contactez le support                   │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘

MÊME STYLE QUE LOGIN ORGANISATEUR
- Fond clair, carte blanche
- Inputs modernes avec icônes
- Boutons orange branded
```

---

## G.9 — LOGIN ADMIN (Modernisé)

**Route:** `/admin/login` (accès via /master-go ou triple-tap logo)

```
DESIGN SOBRE ET PROFESSIONNEL:

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│              ┌─────────────────┐                             │
│              │   LOGO DEMDEM   │                             │
│              │   ADMIN         │                             │
│              └─────────────────┘                             │
│                                                              │
│              Administration                                  │
│              Accès réservé aux administrateurs              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  Identifiant                                         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 👤  admin@demdem.sn                            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  Mot de passe                                        │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 🔒  ••••••••                               👁️  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │              ACCÉDER →                         │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│              ← Retour à l'accueil                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

STYLE:
- Fond: #0A1628 (bleu nuit) ou #1A1A1A (noir event)
- Carte: #FFFFFF
- Accent: #FF6B00 pour bouton
- Plus sobre que les autres logins
```

---

# 📍 SECTION H : ADMINISTRATION

## H.1 — ARCHITECTURE RÔLES (Custom Claims)

```
HIÉRARCHIE:
SUPER ADMIN (Malick)
├── ADMIN FINANCE EVENT
├── ADMIN FINANCE VOYAGE
├── OPS MANAGER EVENT → gère contrôleurs event
├── OPS MANAGER TRANSPORT → gère contrôleurs transport + ferry
└── PARTNER ADMIN (GIE) → accès limité à sa flotte

RÔLES DISPONIBLES:
- super_admin
- admin_finance_event
- admin_finance_voyage
- ops_event
- ops_transport
- partner_admin
- driver
- controller_event
- controller_ferry
- controller_transport
- organizer
```

## H.2 — DASHBOARD SUPER ADMIN

**Route:** `/admin/dashboard`

```
┌─────────────────────────────────┐
│ DEMDEM ADMIN                    │
│ [VUE EVENT] [VUE VOYAGE]        │
│     ○          ●                │
├─────────────────────────────────┤

VUE EVENT:
- KPIs: Événements, CA, Payouts en attente
- Accès: Finance Event, Organisateurs, Master Go

VUE VOYAGE:
- KPIs: Trajets, Abonnés, Conducteurs
- Accès: Finance Voyage, Flotte & GIE, Alertes

SIDEBAR: Menus dynamiques selon vue active
```

## H.3 — GESTION ADMINS

**Route:** `/admin/team`

```
CRÉATION ADMIN:
- Super Admin crée identifiant + mot de passe (pas d'email auto)
- Partenaires: Email fourni par eux (pas forcément @demdem.sn)

ACTIONS:
- Modifier, Suspendre, Réactiver, Supprimer
- Reset mot de passe
- Journal d'audit complet
```

---

# 📍 SECTION I : SÉCURITÉ

## I.1 — AUTHENTIFICATION PIN + WHATSAPP

```
ACCÈS QUOTIDIEN:
- Connexion avec Téléphone + Code PIN

ALERTE NOUVEL APPAREIL:
- Si tentative sur nouvel appareil OU plusieurs échecs PIN
- Code de vérification envoyé via API WhatsApp
- Message: "Votre code de sécurité DemDem est : XXXX. Ne le partagez pas."

AVANTAGE: Zéro coût SMS, sécurité niveau bancaire
```

## I.2 — ANTI-FRAUDE GPS

```
CONTRAINTES:
- Mode "EN LIGNE" = GPS haute précision obligatoire
- Si GPS désactivé pendant course:
  1. Notification immédiate chauffeur
  2. Passage HORS LIGNE après 30 secondes
  3. Notification gestionnaire de flotte

LOGS:
- Chaque coupure GPS pendant trajet = enregistrée
- Permet vérification "courses au noir"
```

---

# ✅ CHECKLIST VALIDATION

Après chaque phase, vérifier:
- [ ] Build sans erreurs
- [ ] Routes fonctionnelles
- [ ] Thèmes appliqués correctement (voyage=bleu, event=orange)
- [ ] Mobile responsive (375px)
- [ ] Données Firebase correctement structurées (RTDB vs Firestore)
- [ ] Cache client implémenté
- [ ] Mode offline fonctionnel (EPscan, Wallet)

---

** Une fois projet est finalisé deployez sur demdem.sn .Je veux maintenant automatiser le déploiement.

GitHub : Connecte ce projet à mon dépôt GitHub.

GitHub Actions : Crée un fichier de workflow .github/workflows/firebase-hosting-merge.yml pour que chaque 'Push' sur la branche main déploie automatiquement l'application sur demdem.sn.

Firebase Hosting : Assure-toi que toutes les configurations dans firebase.json sont prêtes pour le domaine personnalisé.

Persistence : Garde une copie propre et documentée du code source sur GitHub pour que je puisse la récupérer.
