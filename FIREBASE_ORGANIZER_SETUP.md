# 🔥 Configuration Compte Organisateur Firebase

## 📋 Prérequis

Pour créer un compte organisateur, vous devez avoir accès à:
1. **Console Firebase** - https://console.firebase.google.com/
2. **Projet EvenPass Senegal** - `evenpasssenegal`

---

## 🎯 Étape 1: Créer l'Utilisateur Auth

### Via Console Firebase

1. Aller sur **Authentication** → **Users**
2. Cliquer sur **Add User**
3. Remplir les informations:
   ```
   Email: organisateur@evenpass.sn
   Password: Test@2025!
   ```
4. Cliquer sur **Add User**
5. **COPIER L'UID GÉNÉRÉ** (exemple: `AbCd1234EfGh5678IjKl`)

---

## 🗄️ Étape 2: Créer le Profil dans Realtime Database

### Accéder à la Base de Données

1. Aller sur **Realtime Database** dans Firebase Console
2. Cliquer sur votre base de données: `evenpasssenegal-default-rtdb`
3. URL: https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app/

### Structure à Créer

Créez les nœuds suivants (remplacez `{UID}` par l'UID copié à l'étape 1):

#### 1. Profil Utilisateur

**Chemin:** `evenpass/users/{UID}`

```json
{
  "uid": "{UID}",
  "email": "organisateur@evenpass.sn",
  "full_name": "Organisateur Test",
  "phone": "+221771234567",
  "created_at": "2025-01-02T12:00:00.000Z",
  "updated_at": "2025-01-02T12:00:00.000Z",
  "role": "organizer"
}
```

#### 2. Profil Organisateur

**Chemin:** `evenpass/organizers/{UID}`

```json
{
  "uid": "{UID}",
  "user_id": "{UID}",
  "organization_name": "EvenPass Test Organization",
  "organization_type": "company",
  "description": "Organisation de test pour développement",
  "contact_email": "organisateur@evenpass.sn",
  "contact_phone": "+221771234567",
  "verification_status": "verified",
  "verification_documents": {},
  "bank_account_info": {
    "provider": "wave",
    "phone": "+221771234567"
  },
  "commission_rate": 10,
  "total_events_created": 0,
  "total_tickets_sold": 0,
  "is_active": true,
  "created_at": "2025-01-02T12:00:00.000Z",
  "updated_at": "2025-01-02T12:00:00.000Z"
}
```

---

## ✅ Étape 3: Vérifier les Permissions

Les règles de sécurité Firebase sont déjà configurées dans `database.rules.json`:

```json
"organizers": {
  ".read": true,
  "$organizerId": {
    ".write": "auth != null && (auth.uid === $organizerId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
  }
}
```

Ces règles permettent:
- **Lecture publique** des profils organisateurs
- **Écriture** uniquement par l'organisateur lui-même ou l'admin

---

## 🔐 Identifiants de Connexion

Une fois créé, connectez-vous avec:

```yaml
Email:    organisateur@evenpass.sn
Password: Test@2025!
URL:      https://evenpass.sn/organizer/login
```

### Processus de Connexion

1. Le système utilise **Firebase Auth** pour l'authentification
2. Après connexion, il charge automatiquement:
   - Profil utilisateur depuis `evenpass/users/{UID}`
   - Profil organisateur depuis `evenpass/organizers/{UID}`
3. Si `verification_status === 'verified'` ET `is_active === true`:
   - ✅ Accès au dashboard autorisé
4. Sinon:
   - ❌ Redirection vers page "En attente de vérification"

---

## 🛠️ Méthode Alternative: Script Admin

Si vous avez accès au Firebase Admin SDK (Node.js backend), vous pouvez utiliser ce script:

```javascript
const admin = require('firebase-admin');

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app'
});

async function createOrganizer() {
  try {
    // 1. Créer l'utilisateur Auth
    const userRecord = await admin.auth().createUser({
      email: 'organisateur@evenpass.sn',
      password: 'Test@2025!',
      displayName: 'Organisateur Test',
    });

    console.log('✅ User created:', userRecord.uid);

    // 2. Créer le profil utilisateur
    await admin.database().ref(`evenpass/users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: 'organisateur@evenpass.sn',
      full_name: 'Organisateur Test',
      phone: '+221771234567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'organizer'
    });

    // 3. Créer le profil organisateur
    await admin.database().ref(`evenpass/organizers/${userRecord.uid}`).set({
      uid: userRecord.uid,
      user_id: userRecord.uid,
      organization_name: 'EvenPass Test Organization',
      organization_type: 'company',
      description: 'Organisation de test',
      contact_email: 'organisateur@evenpass.sn',
      contact_phone: '+221771234567',
      verification_status: 'verified',
      verification_documents: {},
      bank_account_info: {
        provider: 'wave',
        phone: '+221771234567'
      },
      commission_rate: 10,
      total_events_created: 0,
      total_tickets_sold: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    console.log('✅ Organizer profile created!');
    console.log('Email: organisateur@evenpass.sn');
    console.log('Password: Test@2025!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createOrganizer();
```

---

## 📊 Structure Firebase Complète

```
evenpasssenegal-default-rtdb/
└── evenpass/
    ├── users/
    │   └── {UID}/
    │       ├── uid
    │       ├── email
    │       ├── full_name
    │       ├── phone
    │       ├── role
    │       └── created_at
    ├── organizers/
    │   └── {UID}/
    │       ├── user_id
    │       ├── organization_name
    │       ├── organization_type
    │       ├── verification_status
    │       ├── is_active
    │       ├── contact_email
    │       ├── contact_phone
    │       ├── bank_account_info
    │       └── ...
    ├── events/
    │   └── {eventId}/
    │       ├── title
    │       ├── organizerId (= {UID})
    │       ├── tickets/
    │       ├── scans/
    │       └── attendees/
    └── orders/
        └── {orderId}/
            ├── userId
            ├── eventId
            └── ...
```

---

## 🚀 Test de Connexion

1. **Ouvrir** https://evenpass.sn/organizer/login
2. **Email:** `organisateur@evenpass.sn`
3. **Password:** `Test@2025!`
4. **Cliquer** sur "Se connecter"
5. ✅ **Vérifier** redirection vers `/organizer/dashboard`

---

## 🔒 Statuts de Vérification

Les organisateurs ont 3 statuts possibles:

### 1. Pending (En attente)
```json
{
  "verification_status": "pending",
  "is_active": false
}
```
- Redirection vers `/organizer/pending`
- Affiche "Compte en attente de vérification"

### 2. Rejected (Rejeté)
```json
{
  "verification_status": "rejected",
  "is_active": false
}
```
- Connexion refusée
- Message d'erreur affiché

### 3. Verified (Vérifié) ✅
```json
{
  "verification_status": "verified",
  "is_active": true
}
```
- Accès complet au dashboard
- Peut créer des événements
- Peut vendre des billets

---

## 📞 Support

En cas de problème:
1. Vérifier que l'UID est correct dans les 2 nœuds
2. Vérifier que `verification_status === "verified"`
3. Vérifier que `is_active === true`
4. Vérifier les logs dans la console navigateur (F12)
5. Vérifier les règles de sécurité Firebase

---

**🔥 Firebase Exclusivement - Aucun Supabase!**

© 2026 EvenPass - Powered by Firebase
