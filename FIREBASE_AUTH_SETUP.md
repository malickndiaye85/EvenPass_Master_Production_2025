# Configuration Firebase Auth - EvenPass

## Architecture d'Authentification

L'application utilise maintenant **Firebase Auth** pour l'authentification et **Supabase** uniquement pour la base de données.

### Accès Admin Sécurisé

L'accès aux 3 dashboards admin (Finance, Ops Manager, EPscan) est protégé par l'UID Firebase spécifique : `Tnq8Isi0fATmidMwEuVrw1SAJkI3`

## Étapes de Configuration

### 1. Créer l'Utilisateur Admin dans Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet **evenpasssenegal**
3. Allez dans **Authentication** > **Users**
4. Cliquez sur **Add user**
5. Créez l'utilisateur avec :
   - **Email** : `admin@evenpass.sn` (ou votre email)
   - **Password** : Un mot de passe sécurisé
6. Cliquez sur **Add user**
7. **IMPORTANT** : Copiez l'**UID** de l'utilisateur créé

### 2. Vérifier l'UID Admin

L'UID de l'utilisateur admin DOIT être : `Tnq8Isi0fATmidMwEuVrw1SAJkI3`

Si l'UID ne correspond pas, vous avez 2 options :

#### Option A : Utiliser le compte existant (RECOMMANDÉ)
Si un compte avec l'UID `Tnq8Isi0fATmidMwEuVrw1SAJkI3` existe déjà dans Firebase :
- Utilisez ce compte pour vous connecter
- Assurez-vous de connaître le mot de passe
- Si vous avez oublié le mot de passe, réinitialisez-le dans Firebase Console

#### Option B : Importer l'utilisateur avec l'UID spécifique
Firebase ne permet pas de modifier les UIDs, mais vous pouvez importer un utilisateur avec un UID spécifique :

1. Dans Firebase Console, allez dans **Authentication** > **Users** > **Import users**
2. Créez un fichier CSV avec ce format :
```csv
uid,email,passwordHash,displayName
Tnq8Isi0fATmidMwEuVrw1SAJkI3,admin@evenpass.sn,,Admin EvenPass
```
3. Importez ce fichier
4. L'utilisateur sera créé avec le bon UID
5. Définissez un mot de passe via Firebase Console

### 3. Créer les Utilisateurs Organisateurs (Optionnel)

Pour tester l'**Espace Organisateur**, créez un utilisateur dans Firebase Auth, puis ajoutez son profil dans Supabase.

#### Dans Firebase Console

1. **Authentication** > **Users** > **Add user**
2. Email : `organisateur@evenpass.sn`
3. Password : (votre choix)
4. **Copiez l'UID généré**

#### Dans Supabase (SQL Editor)

Remplacez `FIREBASE_UID_HERE` par l'UID copié :

```sql
-- Créer le profil utilisateur
INSERT INTO users (id, email, full_name, phone)
VALUES (
  'FIREBASE_UID_HERE',
  'organisateur@evenpass.sn',
  'Organisateur Test',
  '+221771234568'
);

-- Créer le profil organisateur
INSERT INTO organizers (
  user_id,
  organization_name,
  organization_type,
  verification_status,
  contact_email,
  contact_phone,
  is_active
)
VALUES (
  'FIREBASE_UID_HERE',
  'EventPro Sénégal',
  'company',
  'verified',
  'organisateur@evenpass.sn',
  '+221771234568',
  true
);
```

## Tester l'Authentification

### Accès Admin (Boutons Footer)

Les 3 boutons colorés dans le footer donnent accès aux dashboards admin :

#### 🟢 Admin Finance (Bouton Vert)
- Cliquez sur le petit bouton vert en bas à droite du footer
- **Email** : `admin@evenpass.sn`
- **Password** : Le mot de passe défini dans Firebase
- ✅ Vérifie que l'UID = `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
- Accès à : `/admin/finance`

#### 🟡 Ops Manager (Bouton Jaune)
- Cliquez sur le petit bouton jaune en bas à droite du footer
- **Email** : `admin@evenpass.sn`
- **Password** : Le mot de passe défini dans Firebase
- ✅ Vérifie que l'UID = `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
- Accès à : `/admin/ops`

#### 🔴 EPscan (Bouton Rouge)
- Cliquez sur le petit bouton rouge en bas à droite du footer
- **Email** : `admin@evenpass.sn`
- **Password** : Le mot de passe défini dans Firebase
- ✅ Vérifie que l'UID = `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
- Accès à : `/scan`

### Accès Organisateur

#### 🟠 Espace Organisateur (Bouton Header)
- Cliquez sur le bouton orange **"Espace Organisateur"** dans le header
- **Email** : `organisateur@evenpass.sn`
- **Password** : Le mot de passe défini dans Firebase
- ✅ Vérifie que l'utilisateur a un profil `organizers` actif dans Supabase
- Accès à : `/organizer/dashboard`

## Dépannage

### Erreur : "Accès non autorisé - UID admin requis"

**Cause** : L'UID de l'utilisateur Firebase ne correspond pas à `Tnq8Isi0fATmidMwEuVrw1SAJkI3`

**Solution** :
1. Vérifiez l'UID dans Firebase Console
2. Assurez-vous d'utiliser le bon compte admin
3. Si nécessaire, importez l'utilisateur avec le bon UID (voir Option B ci-dessus)

### Erreur : "Compte organisateur non trouvé"

**Cause** : Le profil `organizers` n'existe pas dans Supabase pour cet UID Firebase

**Solution** :
1. Vérifiez que l'UID dans la table `organizers` correspond à l'UID Firebase
2. Exécutez le script SQL ci-dessus en remplaçant l'UID
3. Vérifiez que `is_active = true` et `verification_status = 'verified'`

### Erreur : Firebase Auth "auth/wrong-password" ou "auth/user-not-found"

**Cause** : Email ou mot de passe incorrect

**Solution** :
1. Vérifiez que l'utilisateur existe dans Firebase Console
2. Réinitialisez le mot de passe si nécessaire
3. Vérifiez que l'email est correct

### Erreur : "Failed to load resource: the server responded with a status of 404"

**Cause** : Les tables Supabase n'existent pas ou les politiques RLS bloquent l'accès

**Solution** :
1. Vérifiez que les migrations Supabase ont été appliquées
2. Vérifiez que les politiques RLS permettent l'accès public aux événements publiés
3. Consultez les migrations dans `supabase/migrations/`

## Variables d'Environnement

Le fichier `.env` contient déjà les bonnes configurations :

```env
# Firebase (Auth)
VITE_FIREBASE_API_KEY=AIzaSyDPsWVCA_Czs64wxiBOqUCSWwbkLMPNjJo
VITE_FIREBASE_AUTH_DOMAIN=evenpasssenegal.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=evenpasssenegal
VITE_FIREBASE_STORAGE_BUCKET=evenpasssenegal.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=882782977052
VITE_FIREBASE_APP_ID=1:882782977052:web:1f2ea147010066017cf3d9

# UID Admin (Protection des accès admin)
VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3

# Supabase (Base de données uniquement)
VITE_SUPABASE_URL=https://zuwdafqwtluhujwyxvxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Architecture Technique

### Flux d'Authentification

1. **Login Page** → Utilise `signInWithEmailAndPassword` de Firebase Auth
2. **Vérification** →
   - Pour admin : Vérifie que `user.uid === VITE_ADMIN_UID`
   - Pour organisateur : Vérifie le profil `organizers` dans Supabase
3. **Session** → Firebase Auth gère la session automatiquement
4. **Context** → `FirebaseAuthContext` charge les données utilisateur depuis Supabase
5. **Protected Routes** → `ProtectedRoute` vérifie l'authentification Firebase

### Fichiers Modifiés

- `src/context/FirebaseAuthContext.tsx` - Nouveau contexte Firebase Auth
- `src/pages/AdminFinanceLoginPage.tsx` - Login admin avec vérification UID
- `src/pages/OpsManagerLoginPage.tsx` - Login admin avec vérification UID
- `src/pages/EPscanLoginPage.tsx` - Login admin avec vérification UID
- `src/pages/OrganizerLoginPage.tsx` - Login organisateur avec vérification profil
- `src/App.tsx` - Utilise `FirebaseAuthProvider` au lieu de `SupabaseAuthProvider`
- `.env` - Variables d'environnement Firebase et Supabase

## Sécurité

- Les pages admin sont protégées par l'UID Firebase spécifique
- Seul l'utilisateur avec UID `Tnq8Isi0fATmidMwEuVrw1SAJkI3` peut accéder aux dashboards admin
- Les organisateurs doivent avoir un profil actif et vérifié dans Supabase
- Les routes protégées vérifient l'authentification Firebase avant d'afficher le contenu
- Les politiques RLS de Supabase protègent les données sensibles

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de la console (F12 > Console)
2. Vérifiez l'onglet Network (F12 > Network) pour les erreurs API
3. Assurez-vous que l'UID admin est correct dans Firebase
4. Vérifiez que les profils existent dans Supabase pour les organisateurs
