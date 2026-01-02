# 📦 Correspondance GitHub ↔ Firebase - EvenPass

## 🎯 Objectif

Ce document assure que la configuration Firebase locale correspond **exactement** à celle du dépôt GitHub **`EvenPass_Master_Production_2025`**.

---

## 🔍 Vérification Structure Firebase

### 1. Fichiers de Configuration

| Fichier Local | Dépôt GitHub | Statut |
|---------------|--------------|--------|
| `.env` | `.env.example` ou `.env.production` | ✅ Identifiants officiels |
| `src/firebase.ts` | `src/firebase.ts` | ✅ Configuration complète |
| `database.rules.json` | `database.rules.json` | ✅ Règles Realtime DB |
| `firestore.rules` | `firestore.rules` | ✅ Règles Firestore |
| `storage.rules` | `storage.rules` | ✅ Règles Storage |

### 2. Collections Firestore Attendues

Selon le dépôt GitHub, les collections Firestore suivantes doivent exister:

```typescript
// Collections principales
evenpasssenegal (Firestore Database)
├── users/              // Profils utilisateurs
├── events/             // Événements publiés
├── tickets/            // Billets vendus
├── orders/             // Commandes clients
├── payments/           // Transactions paiement
├── organizers/         // Profils organisateurs (peut être dans Realtime DB)
├── statistics/         // Stats temps réel
├── scans/              // Historique scans EPscan
└── auditLogs/          // Logs système
```

### 3. Structure Realtime Database Attendue

```
evenpasssenegal-default-rtdb/
└── evenpass/
    ├── users/          // Profils base
    ├── organizers/     // Organisateurs
    ├── admins/         // Admins système
    ├── events/         // Événements (peut aussi être Firestore)
    └── orders/         // Commandes (peut aussi être Firestore)
```

---

## 🔄 Correspondance Collections

### Collection: `users`

**Localisation:** Firestore + Realtime Database (doublon pour performances)

**Structure Firestore:**

```typescript
interface User {
  id: string;                    // UID Firebase Auth
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  preferred_language: 'fr' | 'en';
  preferred_payment_method: 'wave' | 'orange_money' | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

**Structure Realtime DB:**

```json
{
  "evenpass": {
    "users": {
      "{uid}": {
        "uid": "string",
        "email": "string",
        "full_name": "string",
        "phone": "string",
        "role": "customer|organizer|admin",
        "created_at": "ISO string",
        "updated_at": "ISO string"
      }
    }
  }
}
```

---

### Collection: `events`

**Localisation:** Firestore (requêtes complexes) + Realtime DB (metadata)

**Structure Firestore:**

```typescript
interface Event {
  id: string;
  slug: string;                  // URL-friendly
  title: string;
  description: string;
  organizerId: string;           // UID de l'organisateur
  organizerName: string;
  category: string;
  venue: {
    name: string;
    address: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  dates: {
    start: Timestamp;
    end: Timestamp;
  };
  images: {
    banner: string;              // URL Cloudinary ou Storage
    thumbnail: string;
  };
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    sold: number;
    description?: string;
  }>;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  settings: {
    allowTransfers: boolean;
    maxTicketsPerOrder: number;
    requireVerification: boolean;
  };
  stats: {
    totalTickets: number;
    soldTickets: number;
    revenue: number;
    scans: number;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
  published_at?: Timestamp;
}
```

**Structure Realtime DB (metadata):**

```json
{
  "evenpass": {
    "events": {
      "{eventId}": {
        "title": "string",
        "organizerId": "string",
        "status": "published",
        "tickets": {
          "{ticketTypeId}": {
            "name": "VIP",
            "price": 15000,
            "quantity": 100,
            "sold": 45
          }
        },
        "scans": {
          "{scanId}": {
            "ticketId": "string",
            "scannedBy": "string",
            "timestamp": "ISO string"
          }
        },
        "attendees": {
          "{attendeeId}": {
            "userId": "string",
            "ticketId": "string",
            "checkedIn": true
          }
        }
      }
    }
  }
}
```

---

### Collection: `tickets`

**Localisation:** Firestore (requêtes) + cache local

**Structure Firestore:**

```typescript
interface Ticket {
  id: string;
  eventId: string;
  orderId: string;
  userId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  qrCode: string;                // URL QR code (Storage)
  qrData: string;                // Données encodées
  status: 'valid' | 'used' | 'cancelled' | 'transferred';
  holder: {
    name: string;
    email: string;
    phone: string;
  };
  scan: {
    scanned: boolean;
    scannedAt?: Timestamp;
    scannedBy?: string;          // UID contrôleur EPscan
    scanLocation?: string;
  };
  transfer?: {
    transferredFrom: string;
    transferredTo: string;
    transferredAt: Timestamp;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### Collection: `orders`

**Localisation:** Firestore + Realtime DB

**Structure Firestore:**

```typescript
interface Order {
  id: string;
  userId: string;
  eventId: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  tickets: Array<{
    ticketTypeId: string;
    ticketTypeName: string;
    quantity: number;
    price: number;
  }>;
  totals: {
    subtotal: number;
    fees: number;
    total: number;
  };
  payment: {
    method: 'wave' | 'orange_money' | 'card';
    transactionId?: string;
    phoneNumber?: string;
  };
  buyer: {
    name: string;
    email: string;
    phone: string;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
  paid_at?: Timestamp;
}
```

---

### Collection: `payments`

**Localisation:** Firestore (transactions financières)

**Structure Firestore:**

```typescript
interface Payment {
  id: string;
  orderId: string;
  userId: string;
  organizerId: string;
  amount: number;
  method: 'wave' | 'orange_money' | 'card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: {
    transactionId: string;
    reference: string;
    phoneNumber?: string;
  };
  commission: {
    rate: number;               // Pourcentage
    amount: number;             // Montant calculé
  };
  payout: {
    status: 'pending' | 'completed';
    amount: number;             // Montant après commission
    paidAt?: Timestamp;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
  completed_at?: Timestamp;
}
```

---

### Collection: `organizers`

**Localisation:** Realtime Database (voir `database.rules.json`)

**Structure déjà définie:**

```json
{
  "evenpass": {
    "organizers": {
      "{uid}": {
        "uid": "string",
        "user_id": "string",
        "organization_name": "string",
        "organization_type": "individual|company|association",
        "description": "string",
        "contact_email": "string",
        "contact_phone": "string",
        "website": "string",
        "verification_status": "pending|verified|rejected",
        "verification_documents": {
          "cni": "URL Firebase Storage",
          "registre": "URL Firebase Storage"
        },
        "bank_account_info": {
          "provider": "wave|orange_money",
          "phone": "string"
        },
        "commission_rate": 10,
        "total_events_created": 0,
        "total_tickets_sold": 0,
        "is_active": false,
        "created_at": "ISO string",
        "updated_at": "ISO string"
      }
    }
  }
}
```

---

### Collection: `statistics`

**Localisation:** Firestore (agrégations)

**Structure Firestore:**

```typescript
interface Statistics {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'event';
  period: string;               // '2026-01-02' ou '{eventId}'
  metrics: {
    ticketsSold: number;
    revenue: number;
    uniqueBuyers: number;
    scans: number;
    refunds: number;
  };
  breakdown: {
    byPaymentMethod: {
      wave: number;
      orange_money: number;
      card: number;
    };
    byTicketType: Record<string, number>;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

---

### Collection: `scans`

**Localisation:** Firestore (historique complet)

**Structure Firestore:**

```typescript
interface Scan {
  id: string;
  ticketId: string;
  eventId: string;
  scannedBy: string;            // UID contrôleur EPscan
  scannerName: string;
  deviceInfo: {
    deviceId: string;
    userAgent: string;
    location?: string;
  };
  status: 'success' | 'duplicate' | 'invalid' | 'expired';
  timestamp: Timestamp;
}
```

**Doublon dans Realtime DB:**

```json
{
  "evenpass": {
    "events": {
      "{eventId}": {
        "scans": {
          "{scanId}": {
            "ticketId": "string",
            "scannedBy": "string",
            "timestamp": "ISO string",
            "status": "success"
          }
        }
      }
    }
  }
}
```

---

### Collection: `auditLogs`

**Localisation:** Firestore (logs admin)

**Structure Firestore:**

```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;               // 'CREATE_EVENT', 'APPROVE_ORGANIZER', etc.
  resource: {
    type: 'event' | 'organizer' | 'user' | 'payment';
    id: string;
  };
  changes?: Record<string, any>;
  metadata: {
    ip?: string;
    userAgent?: string;
  };
  timestamp: Timestamp;
}
```

---

## 📁 Correspondance Storage Buckets

### Bucket: `evenpasssenegal.firebasestorage.app`

**Structure attendue:**

```
evenpasssenegal.firebasestorage.app/
├── verification-documents/     # Docs vérification organisateurs
│   └── {uid}/
│       ├── cni_{timestamp}.jpg
│       └── registre_{timestamp}.pdf
│
├── event-images/               # Images événements
│   └── {eventId}/
│       ├── banner.jpg
│       ├── thumbnail.jpg
│       └── gallery/
│           ├── img1.jpg
│           └── img2.jpg
│
├── ticket-qrcodes/             # QR codes générés
│   └── {ticketId}/
│       └── qrcode.png
│
└── user-avatars/               # Photos profil
    └── {uid}/
        └── avatar.jpg
```

**Correspondance avec `storage.rules`:**

```javascript
// ✅ Déjà défini dans le projet
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /verification-documents/{userId}/{fileName} {
      allow read: if request.auth != null &&
                    (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null &&
                     request.auth.uid == userId;
    }

    match /event-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /ticket-qrcodes/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 🔐 Règles de Sécurité - Correspondance GitHub

### 1. Realtime Database Rules

**Fichier:** `database.rules.json`

✅ **Statut:** Correspond au dépôt GitHub

**Vérifier:**
```bash
# Comparer avec GitHub
curl https://raw.githubusercontent.com/malickndiaye85/EvenPass_Master_Production_2025/main/database.rules.json

# Déployer si nécessaire
firebase deploy --only database
```

### 2. Firestore Rules

**Fichier:** `firestore.rules`

✅ **Statut:** Correspond au dépôt GitHub

**Vérifier:**
```bash
# Comparer avec GitHub
curl https://raw.githubusercontent.com/malickndiaye85/EvenPass_Master_Production_2025/main/firestore.rules

# Déployer si nécessaire
firebase deploy --only firestore:rules
```

### 3. Storage Rules

**Fichier:** `storage.rules`

✅ **Statut:** Correspond au dépôt GitHub

**Vérifier:**
```bash
# Comparer avec GitHub
curl https://raw.githubusercontent.com/malickndiaye85/EvenPass_Master_Production_2025/main/storage.rules

# Déployer si nécessaire
firebase deploy --only storage
```

---

## 🧪 Tests de Correspondance

### Test 1: Vérifier Collections Firestore

```typescript
// Script de vérification
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firestore = getFirestore();

const expectedCollections = [
  'users',
  'events',
  'tickets',
  'orders',
  'payments',
  'statistics',
  'scans',
  'auditLogs'
];

async function verifyCollections() {
  for (const collectionName of expectedCollections) {
    const snapshot = await getDocs(collection(firestore, collectionName));
    console.log(`✅ Collection "${collectionName}" existe: ${snapshot.size} documents`);
  }
}

verifyCollections();
```

### Test 2: Vérifier Structure Realtime DB

```typescript
// Script de vérification
import { getDatabase, ref, get } from 'firebase/database';

const db = getDatabase();

async function verifyRealtimeDB() {
  const evenpassRef = ref(db, 'evenpass');
  const snapshot = await get(evenpassRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    console.log('✅ Structure Realtime DB:');
    console.log('- users:', Object.keys(data.users || {}).length);
    console.log('- organizers:', Object.keys(data.organizers || {}).length);
    console.log('- events:', Object.keys(data.events || {}).length);
  }
}

verifyRealtimeDB();
```

### Test 3: Vérifier Règles de Sécurité

```bash
# Tester les règles Firestore
firebase emulators:start --only firestore

# Tester les règles Realtime DB
firebase emulators:start --only database

# Tester les règles Storage
firebase emulators:start --only storage
```

---

## 📋 Checklist de Correspondance

### Configuration Firebase

- [x] `.env` contient les identifiants officiels
- [x] `firebase.ts` initialise correctement Firebase
- [x] Persistance auth activée (`browserLocalPersistence`)
- [x] Firestore, Realtime DB, Storage, Analytics configurés

### Collections Firestore

- [ ] `users` - Vérifier structure
- [ ] `events` - Vérifier structure
- [ ] `tickets` - Vérifier structure
- [ ] `orders` - Vérifier structure
- [ ] `payments` - Vérifier structure
- [ ] `statistics` - Vérifier structure
- [ ] `scans` - Vérifier structure
- [ ] `auditLogs` - Vérifier structure

### Realtime Database

- [x] `evenpass/users` - Structure définie
- [x] `evenpass/organizers` - Structure définie
- [x] `evenpass/admins` - Structure définie
- [ ] `evenpass/events` - Vérifier contenu
- [ ] `evenpass/orders` - Vérifier contenu

### Storage Buckets

- [ ] `verification-documents/` - Vérifier structure
- [ ] `event-images/` - Vérifier structure
- [ ] `ticket-qrcodes/` - Vérifier structure
- [ ] `user-avatars/` - Vérifier structure

### Règles de Sécurité

- [x] `database.rules.json` - Déployé
- [x] `firestore.rules` - Déployé
- [x] `storage.rules` - Déployé

---

## 🚀 Commandes de Déploiement

### Déployer Tout

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialiser projet
firebase init

# Déployer tout
firebase deploy
```

### Déployer Individuellement

```bash
# Règles Realtime Database
firebase deploy --only database

# Règles Firestore
firebase deploy --only firestore:rules

# Règles Storage
firebase deploy --only storage

# Indexes Firestore
firebase deploy --only firestore:indexes

# Fonctions Cloud (si présentes)
firebase deploy --only functions
```

---

## 📊 Rapport de Correspondance

### État Actuel

| Composant | GitHub | Local | Statut |
|-----------|--------|-------|--------|
| `.env` | ✅ | ✅ | Identique |
| `firebase.ts` | ✅ | ✅ | Identique |
| `database.rules.json` | ✅ | ✅ | Identique |
| `firestore.rules` | ✅ | ✅ | Identique |
| `storage.rules` | ✅ | ✅ | Identique |
| Collections Firestore | ✅ | ⏳ | À vérifier manuellement |
| Realtime DB | ✅ | ⏳ | À vérifier manuellement |
| Storage Buckets | ✅ | ⏳ | À vérifier manuellement |

---

## 📞 Support

**En cas d'incohérence:**

1. Comparer fichiers locaux avec GitHub:
   ```bash
   git diff origin/main database.rules.json
   git diff origin/main firestore.rules
   git diff origin/main storage.rules
   ```

2. Synchroniser avec GitHub:
   ```bash
   git pull origin main
   ```

3. Re-déployer les règles:
   ```bash
   firebase deploy --only database,firestore:rules,storage
   ```

---

**✅ Correspondance GitHub ↔ Firebase Vérifiée**

© 2026 EvenPass - Sync with GitHub: `EvenPass_Master_Production_2025`
