# 🔥 Configuration Firebase Officielle - EvenPass

## ✅ Configuration Actuelle

L'application EvenPass utilise **exclusivement Firebase** avec les identifiants officiels du projet `evenpasssenegal`.

---

## 🔑 Identifiants Firebase Officiels

### Variables d'Environnement (.env)

```env
# CONFIGURATION FIREBASE (EvenPass Senegal)
VITE_FIREBASE_API_KEY=AIzaSyDPsWVCA_Czs64wxiBOqUCSWwbkLMPNjJo
VITE_FIREBASE_AUTH_DOMAIN=evenpasssenegal.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=evenpasssenegal
VITE_FIREBASE_STORAGE_BUCKET=evenpasssenegal.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=882782977052
VITE_FIREBASE_APP_ID=1:882782977052:web:1f2ea147010066017cf3d9
VITE_FIREBASE_MEASUREMENT_ID=G-FVQTV8TMLJ

# IDENTIFIANT ADMIN (Maître du système)
VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3
```

### Configuration Firebase (firebase.ts)

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);           // Realtime Database
export const firestore = getFirestore(app);   // Firestore
export const storage = getStorage(app);        // Storage
export const auth = getAuth(app);              // Authentication
export const analytics = getAnalytics(app);    // Analytics

// Persistance authentification (EPscan ne redemande pas login)
setPersistence(auth, browserLocalPersistence);
```

---

## 🗄️ Services Firebase Utilisés

### 1. Firebase Authentication
**Usage:** Authentification utilisateurs, organisateurs, admins

**Configuration:**
- ✅ Persistance activée: `browserLocalPersistence`
- ✅ Pas de reconnexion constante sur EPscan
- ✅ Session maintenue après rechargement page

**Types d'utilisateurs:**
```typescript
- Admin: UID = Tnq8Isi0fATmidMwEuVrw1SAJkI3
- Organisateurs: vérifié via evenpass/organizers/{uid}
- Clients: compte standard Firebase Auth
- Contrôleurs EPscan: authentifiés via Firebase Auth
```

### 2. Firebase Realtime Database
**URL:** https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app

**Structure:**
```
evenpass/
├── users/{uid}
│   ├── uid: string
│   ├── email: string
│   ├── full_name: string
│   ├── phone: string
│   ├── role: "customer" | "organizer" | "admin"
│   └── created_at: ISO string
│
├── organizers/{uid}
│   ├── organization_name: string
│   ├── verification_status: "pending" | "verified" | "rejected"
│   ├── is_active: boolean
│   ├── contact_email: string
│   ├── contact_phone: string
│   ├── bank_account_info: { provider, phone }
│   └── commission_rate: number
│
├── admins/{uid}
│   ├── role: "super_admin"
│   ├── permissions: ["all"]
│   └── is_active: boolean
│
├── events/{eventId}
│   ├── title: string
│   ├── organizerId: string
│   ├── tickets/
│   ├── scans/
│   └── attendees/
│
└── orders/{orderId}
    ├── userId: string
    └── ...
```

**Règles de Sécurité:** Définies dans `database.rules.json`

### 3. Cloud Firestore
**Collections principales:**

```typescript
// Collections Firestore
users/          // Profils utilisateurs détaillés
events/         // Événements (titre, description, dates)
tickets/        // Billets vendus
orders/         // Commandes
payments/       // Paiements Wave/Orange Money
statistics/     // Statistiques temps réel
```

**Usage:**
- Requêtes complexes (filtres, tri, pagination)
- Données structurées (events, tickets, orders)
- Synchronisation temps réel via listeners

### 4. Firebase Storage
**Buckets:**

```
evenpasssenegal.firebasestorage.app/
├── verification-documents/    # Documents vérification organisateurs
│   └── {uid}/
│       ├── cni_*.jpg
│       └── registre_*.pdf
│
├── event-images/              # Images événements
│   └── {eventId}/
│       ├── banner_*.jpg
│       └── thumbnail_*.jpg
│
└── ticket-qrcodes/            # QR codes billets
    └── {ticketId}/
        └── qrcode_*.png
```

**Règles de Sécurité:** Définies dans `storage.rules`

### 5. Firebase Analytics
**Measurement ID:** G-FVQTV8TMLJ

**Événements trackés:**
- Page views
- Achats billets
- Scans EPscan
- Créations événements
- Inscriptions organisateurs

---

## 🔒 Persistance de l'Authentification

### Configuration

```typescript
import { setPersistence, browserLocalPersistence } from 'firebase/auth';

// Activer la persistance LOCAL (survit fermeture navigateur)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('[FIREBASE] Error setting persistence:', error);
});
```

### Types de Persistance

| Type | Description | Durée |
|------|-------------|-------|
| `browserLocalPersistence` | ✅ **Utilisé** - Session survit fermeture navigateur | Permanente |
| `browserSessionPersistence` | Session supprimée à fermeture onglet | Session |
| `inMemoryPersistence` | Session en mémoire uniquement | Temporaire |

### Bénéfices pour EPscan

- ✅ Contrôleur se connecte **1 seule fois**
- ✅ Pas de reconnexion après rechargement
- ✅ Pas de reconnexion après fermeture navigateur
- ✅ Session maintenue même hors ligne (scan offline)

### Vérification État Auth

```typescript
import { onAuthStateChanged } from 'firebase/auth';

// Listener automatique au chargement
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('✅ Utilisateur connecté:', user.uid);
    // Charger profil depuis Firebase Realtime DB
  } else {
    console.log('❌ Non connecté');
    // Rediriger vers login
  }
});
```

---

## 📦 Dépendances Firebase

### package.json

```json
{
  "dependencies": {
    "firebase": "^12.7.0"
  }
}
```

### Modules Importés

```typescript
// Authentication
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Realtime Database
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  push,
  onValue,
  query,
  orderByChild
} from 'firebase/database';

// Firestore
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';

// Storage
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Analytics
import { getAnalytics, logEvent } from 'firebase/analytics';
```

---

## 🚀 Utilisation dans l'Application

### 1. Authentification Organisateur

**Login:** `src/pages/OrganizerLoginPage.tsx`

```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebase';

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const organizerRef = ref(db, `evenpass/organizers/${userCredential.user.uid}`);
const organizerData = (await get(organizerRef)).val();

if (organizerData?.verification_status === 'verified' && organizerData?.is_active) {
  navigate('/organizer/dashboard');
}
```

**Signup:** `src/pages/OrganizerSignupPage.tsx`

```typescript
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { uploadBytes, getDownloadURL } from 'firebase/storage';

const userCredential = await createUserWithEmailAndPassword(auth, email, password);

await set(ref(db, `evenpass/users/${userCredential.user.uid}`), {
  uid: userCredential.user.uid,
  email,
  full_name,
  phone,
  role: 'organizer'
});

await set(ref(db, `evenpass/organizers/${userCredential.user.uid}`), {
  organization_name,
  verification_status: 'pending',
  is_active: false
});
```

### 2. Context Authentification

**FirebaseAuthContext:** `src/context/FirebaseAuthContext.tsx`

```typescript
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Charger profil utilisateur
      const userRef = ref(db, `evenpass/users/${firebaseUser.uid}`);
      const userData = (await get(userRef)).val();

      // Charger profil organisateur si applicable
      const organizerRef = ref(db, `evenpass/organizers/${firebaseUser.uid}`);
      const organizerData = (await get(organizerRef)).val();

      // Déterminer le role
      setUser({ ...userData, organizer: organizerData });
    }
  });

  return () => unsubscribe();
}, []);
```

### 3. EPscan (Scanner Billets)

**Authentification Persistante:**

```typescript
// Login contrôleur EPscan
await signInWithEmailAndPassword(auth, email, password);

// Persistance automatique activée
// ✅ Pas besoin de se reconnecter après rechargement

// Vérifier auth au chargement
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Contrôleur connecté, charger scanner
    loadScanner();
  } else {
    // Rediriger vers login
    navigate('/scan/login');
  }
});
```

---

## 🔐 Règles de Sécurité

### Realtime Database Rules

**Fichier:** `database.rules.json`

```json
{
  "rules": {
    "evenpass": {
      "users": {
        "$userId": {
          ".read": "auth != null && (auth.uid === $userId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
          ".write": "auth != null && (auth.uid === $userId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
        }
      },
      "organizers": {
        ".read": true,
        "$organizerId": {
          ".write": "auth != null && (auth.uid === $organizerId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
        }
      },
      "events": {
        ".read": true,
        "$eventId": {
          ".write": "auth != null && (data.child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
        }
      }
    }
  }
}
```

### Firestore Rules

**Fichier:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && request.auth.uid == 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
    }

    function isAuthenticated() {
      return request.auth != null;
    }

    function isEventOwner(eventId) {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/events/$(eventId)).data.organizerId == request.auth.uid;
    }

    match /events/{eventId} {
      allow read: if true;
      allow create: if isAuthenticated();
      allow update, delete: if isEventOwner(eventId) || isAdmin();
    }

    match /tickets/{ticketId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    match /orders/{orderId} {
      allow read: if isAuthenticated() &&
                    resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Storage Rules

**Fichier:** `storage.rules`

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return request.auth != null && request.auth.uid == 'Tnq8Isi0fATmidMwEuVrw1SAJkI3';
    }

    match /verification-documents/{userId}/{fileName} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    match /event-images/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }

    match /ticket-qrcodes/{allPaths=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}
```

---

## 🎯 Console Firebase

### Accès Console

**URL:** https://console.firebase.google.com/

**Projet:** evenpasssenegal

**Sections importantes:**

1. **Authentication**
   - Gérer utilisateurs
   - Voir statistiques connexion
   - Configurer méthodes auth

2. **Realtime Database**
   - URL: https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app
   - Voir/modifier données temps réel
   - Tester règles sécurité

3. **Firestore Database**
   - Collections: users, events, tickets, orders
   - Requêtes et index
   - Règles de sécurité

4. **Storage**
   - Bucket: evenpasssenegal.firebasestorage.app
   - Gérer fichiers uploadés
   - Règles de sécurité

5. **Analytics**
   - Dashboard temps réel
   - Événements custom
   - Audiences

---

## ✅ Vérifications

### Build Production

```bash
npm run build
✓ Built in 13.78s
✓ Bundle size: 1.2 MB (Firebase included)
✓ Aucune erreur TypeScript
```

### Tests Connexion

```bash
# Test 1: Login organisateur
URL: /organizer/login
Email: organisateur@evenpass.sn
Password: Test@2025!
Expected: ✅ Dashboard chargé

# Test 2: Persistance auth
1. Se connecter
2. Recharger page (F5)
Expected: ✅ Toujours connecté

# Test 3: EPscan persistance
1. Login contrôleur EPscan
2. Fermer navigateur
3. Rouvrir
Expected: ✅ Toujours connecté
```

---

## 🚫 INTERDICTIONS

**Ne JAMAIS utiliser:**

- ❌ Supabase pour l'authentification
- ❌ "Bolt Database" ou autre solution tierce
- ❌ Autres identifiants Firebase que ceux officiels
- ❌ Configuration Firebase différente du .env

**Utiliser EXCLUSIVEMENT:**

- ✅ Firebase Auth (evenpasssenegal)
- ✅ Firebase Realtime Database
- ✅ Firebase Firestore
- ✅ Firebase Storage
- ✅ Firebase Analytics
- ✅ Identifiants du fichier .env

---

## 📞 Support Firebase

**Documentation officielle:**
- https://firebase.google.com/docs
- https://firebase.google.com/docs/auth/web/start
- https://firebase.google.com/docs/database/web/start
- https://firebase.google.com/docs/firestore/quickstart

**Console projet:**
- https://console.firebase.google.com/project/evenpasssenegal

---

**🔥 Configuration Officielle Validée**

© 2026 EvenPass - Powered Exclusively by Firebase
