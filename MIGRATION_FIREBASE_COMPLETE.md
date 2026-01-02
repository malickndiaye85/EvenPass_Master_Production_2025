# 🔥 Migration Complète vers Firebase - EvenPass

## ✅ Migration Terminée

L'application EvenPass utilise maintenant **exclusivement Firebase** pour:
- ✅ **Authentication** (Firebase Auth)
- ✅ **Base de données** (Firebase Realtime Database)
- ✅ **Stockage** (Firebase Storage)

**Aucun code Supabase** n'est utilisé dans le système d'authentification organisateur.

---

## 📦 Fichiers Modifiés

### 1. FirebaseAuthContext.tsx ✅
**Chemin:** `src/context/FirebaseAuthContext.tsx`

```typescript
// Utilise maintenant:
- Firebase Auth (signInWithEmailAndPassword)
- Firebase Realtime Database (ref, get)
- Structure: evenpass/users/{uid}, evenpass/organizers/{uid}
```

**Suppression complète de:**
- ❌ `import { supabase } from '../lib/supabase'`
- ❌ Toutes les requêtes Supabase

### 2. OrganizerLoginPage.tsx ✅
**Chemin:** `src/pages/OrganizerLoginPage.tsx`

```typescript
// Avant
import { supabase } from '../lib/supabase';
await supabase.auth.signInWithPassword({...});

// Après
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../firebase';
await signInWithEmailAndPassword(auth, email, password);
```

### 3. OrganizerSignupPage.tsx ✅
**Chemin:** `src/pages/OrganizerSignupPage.tsx`

```typescript
// Avant
import { supabase } from '../lib/supabase';
await supabase.auth.signUp({...});
await supabase.storage.from('verification-documents').upload(...);

// Après
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { uploadBytes, getDownloadURL } from 'firebase/storage';
await createUserWithEmailAndPassword(auth, email, password);
```

### 4. App.tsx ✅
**Chemin:** `src/App.tsx`

```typescript
// Avant
import { MockAuthProvider } from './context/MockAuthContext';
<MockAuthProvider>

// Après
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';
<FirebaseAuthProvider>
```

---

## 🗄️ Structure Firebase Realtime Database

```
evenpasssenegal-default-rtdb/
└── evenpass/
    ├── users/
    │   └── {UID}/
    │       ├── uid: string
    │       ├── email: string
    │       ├── full_name: string
    │       ├── phone: string
    │       ├── role: "organizer" | "customer" | "admin"
    │       ├── created_at: ISO string
    │       └── updated_at: ISO string
    │
    ├── organizers/
    │   └── {UID}/
    │       ├── uid: string
    │       ├── user_id: string
    │       ├── organization_name: string
    │       ├── organization_type: "individual" | "company"
    │       ├── description: string
    │       ├── contact_email: string
    │       ├── contact_phone: string
    │       ├── website: string | null
    │       ├── verification_status: "pending" | "verified" | "rejected"
    │       ├── verification_documents: {
    │       │   cni?: string (URL Firebase Storage)
    │       │   registre?: string (URL Firebase Storage)
    │       │ }
    │       ├── bank_account_info: {
    │       │   provider: "wave" | "orange_money"
    │       │   phone: string
    │       │ }
    │       ├── commission_rate: number
    │       ├── total_events_created: number
    │       ├── total_tickets_sold: number
    │       ├── is_active: boolean
    │       ├── created_at: ISO string
    │       └── updated_at: ISO string
    │
    ├── admins/
    │   └── {UID}/
    │       ├── role: "super_admin"
    │       ├── permissions: ["all"]
    │       ├── is_active: boolean
    │       ├── created_at: ISO string
    │       └── updated_at: ISO string
    │
    ├── events/
    │   └── {eventId}/
    │       ├── organizerId: {UID}
    │       ├── title: string
    │       ├── tickets/
    │       ├── scans/
    │       └── attendees/
    │
    └── orders/
        └── {orderId}/
            ├── userId: string
            └── ...
```

---

## 🔐 Règles de Sécurité Firebase

Les règles sont définies dans `database.rules.json`:

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

---

## 🎯 Créer un Compte Organisateur

### Méthode 1: Via Console Firebase (Recommandé)

Consultez le guide complet: **`FIREBASE_ORGANIZER_SETUP.md`**

#### Résumé Rapide:

1. **Créer l'utilisateur Auth**
   - Console Firebase → Authentication → Add User
   - Email: `organisateur@evenpass.sn`
   - Password: `Test@2025!`
   - Copier l'UID généré

2. **Créer le profil utilisateur**
   - Realtime Database → `evenpass/users/{UID}`
   - Ajouter: uid, email, full_name, phone, role="organizer"

3. **Créer le profil organisateur**
   - Realtime Database → `evenpass/organizers/{UID}`
   - Ajouter tous les champs (voir structure ci-dessus)
   - **Important:** `verification_status: "verified"` et `is_active: true`

### Méthode 2: Via Interface Web

1. Aller sur `/organizer/signup`
2. Remplir le formulaire en 3 étapes
3. Le compte sera créé avec `verification_status: "pending"`
4. Un admin doit ensuite vérifier et activer le compte manuellement

---

## 🚀 Flux d'Authentification

### Connexion Organisateur

```typescript
// 1. Utilisateur entre email + password
organisateur@evenpass.sn / Test@2025!

// 2. Firebase Auth vérifie les credentials
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 3. Chargement du profil organisateur
const organizerRef = ref(db, `evenpass/organizers/${user.uid}`);
const organizerData = (await get(organizerRef)).val();

// 4. Vérification du statut
if (verification_status === "verified" && is_active === true) {
  // ✅ Accès autorisé → /organizer/dashboard
} else if (verification_status === "pending") {
  // ⏳ En attente → /organizer/pending
} else if (verification_status === "rejected") {
  // ❌ Rejeté → Afficher erreur
}
```

### Chargement Automatique (onAuthStateChanged)

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Charger user + organizer + admin depuis Firebase Realtime DB
      const userRef = ref(db, `evenpass/users/${firebaseUser.uid}`);
      const organizerRef = ref(db, `evenpass/organizers/${firebaseUser.uid}`);
      const adminRef = ref(db, `evenpass/admins/${firebaseUser.uid}`);

      // Déterminer le role
      if (isAdmin || adminData) role = 'admin';
      else if (organizerData && verified && active) role = 'organizer';
      else role = 'customer';
    }
  });
}, []);
```

---

## 📊 Configuration Firebase

### Variables d'Environnement (.env)

```env
# Firebase Auth + Realtime Database + Storage
VITE_FIREBASE_API_KEY=AIzaSyDPsWVCA_Czs64wxiBOqUCSWwbkLMPNjJo
VITE_FIREBASE_AUTH_DOMAIN=evenpasssenegal.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=evenpasssenegal
VITE_FIREBASE_STORAGE_BUCKET=evenpasssenegal.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=882782977052
VITE_FIREBASE_APP_ID=1:882782977052:web:1f2ea147010066017cf3d9

# Admin Master UID
VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3
```

### Initialisation Firebase (firebase.ts)

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

---

## 🧪 Tests de Connexion

### Test 1: Compte Organisateur Vérifié

```yaml
Email: organisateur@evenpass.sn
Password: Test@2025!
Expected: Redirection vers /organizer/dashboard
```

### Test 2: Compte En Attente

```yaml
verification_status: "pending"
is_active: false
Expected: Redirection vers /organizer/pending
```

### Test 3: Compte Rejeté

```yaml
verification_status: "rejected"
Expected: Message d'erreur + déconnexion
```

---

## 🔄 Statuts de Vérification

| Statut | is_active | Résultat |
|--------|-----------|----------|
| pending | false | En attente de validation |
| verified | true | ✅ Accès complet dashboard |
| verified | false | Compte vérifié mais désactivé |
| rejected | false | ❌ Accès refusé |

---

## 🛠️ Actions Post-Migration

### Pour Tester le Système

1. **Créer un compte organisateur**
   - Suivre `FIREBASE_ORGANIZER_SETUP.md`
   - Utiliser Console Firebase

2. **Se connecter**
   ```
   URL: https://evenpass.sn/organizer/login
   Email: organisateur@evenpass.sn
   Password: Test@2025!
   ```

3. **Créer un événement**
   - Dashboard → "Créer un événement"
   - Remplir les informations
   - Créer des catégories de billets

4. **Vendre des billets**
   - Page publique → Event Detail
   - Acheter des billets
   - Vérifier les stats dans le dashboard

---

## 📁 Fichiers Encore avec Supabase (À Migrer)

Ces fichiers utilisent encore Supabase mais PAS pour l'authentification organisateur:

- `src/pages/EventDetailPage.tsx` - Chargement événements
- `src/pages/EPscanPage.tsx` - Scanner billets
- `src/pages/SuccessPage.tsx` - Page confirmation
- `src/components/BulkSalesModal.tsx` - Ventes en gros
- `src/components/OrganizerVerificationTab.tsx` - Vérification organisateurs

**Note:** Ces fichiers seront migrés vers Firebase dans une phase ultérieure. Pour l'instant, seul le **système d'authentification organisateur** utilise Firebase exclusivement.

---

## ✅ État Actuel

| Composant | Database | Status |
|-----------|----------|--------|
| Auth Organisateur | 🔥 Firebase | ✅ 100% |
| Auth Admin | 🔥 Firebase | ✅ 100% |
| Signup Organisateur | 🔥 Firebase | ✅ 100% |
| Login Organisateur | 🔥 Firebase | ✅ 100% |
| Storage Documents | 🔥 Firebase Storage | ✅ 100% |
| Événements | 🟦 Supabase | ⏳ À migrer |
| Billets | 🟦 Supabase | ⏳ À migrer |
| Scanner EPscan | 🟦 Supabase | ⏳ À migrer |

---

## 🎉 Résumé

**Migration Réussie!** L'authentification organisateur utilise maintenant:

✅ Firebase Auth (pas Supabase Auth)
✅ Firebase Realtime Database (pas Supabase Postgres)
✅ Firebase Storage (pas Supabase Storage)
✅ Build production réussi (1.2 MB)

**Prochaines étapes:**
1. Créer un compte organisateur via Console Firebase
2. Tester le login sur `/organizer/login`
3. Créer un événement depuis le dashboard
4. (Optionnel) Migrer le reste de l'app vers Firebase

---

**🔥 100% Firebase - Aucun Supabase dans l'Auth!**

© 2026 EvenPass - Powered by Firebase
