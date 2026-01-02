# GUIDE DE DÉBOGAGE - Authentification et Accès Dashboards

## CHANGEMENTS EFFECTUÉS

### 1. FirebaseAuthContext - Gestion d'Erreurs Améliorée

**Fichier**: `src/context/FirebaseAuthContext.tsx`

**Modifications**:
- ✅ Ajout de try-catch individuels pour chaque lecture Firebase (users, organizers, admins)
- ✅ Les erreurs de permission ne bloquent plus l'authentification
- ✅ Création d'un profil par défaut si les lectures échouent
- ✅ Logs détaillés à chaque étape du chargement
- ✅ Ajout de l'alias `logout` pour compatibilité avec les pages

**Logs ajoutés**:
```javascript
[FIREBASE AUTH] Setting up auth state listener
[FIREBASE AUTH] Auth state changed: { authenticated, email, uid }
[FIREBASE AUTH] Loading user profile for: <uid>
[FIREBASE AUTH] Is admin UID? <boolean> Expected: <ADMIN_UID>
[FIREBASE AUTH] User data loaded: <boolean>
[FIREBASE AUTH] Organizer data loaded: { exists, isActive, status }
[FIREBASE AUTH] Admin data loaded: { exists, isActive }
[FIREBASE AUTH] Determined role: <role>
[FIREBASE AUTH] User profile created: { email, role, hasOrganizer, hasAdmin }
```

### 2. AdminFinancePage - Attente de l'Authentification

**Fichier**: `src/pages/AdminFinancePage.tsx`

**Modifications**:
- ✅ Utilise `authLoading` du contexte pour attendre que l'auth soit prête
- ✅ Ne charge les données qu'une fois `authLoading = false`
- ✅ Vérifie le rôle admin avant de charger les données
- ✅ Logs détaillés de l'état d'authentification

**Logs ajoutés**:
```javascript
[ADMIN FINANCE] Auth state: { authLoading, user, role, uid }
[ADMIN FINANCE] Access denied, redirecting to home
[ADMIN FINANCE] Access granted, loading data
[MOCK DATA] Loading admin finance... { userRole, uid }
[MOCK DATA] Loaded admin finance data successfully
```

### 3. OpsManagerPage - Attente de l'Authentification

**Fichier**: `src/pages/OpsManagerPage.tsx`

**Modifications**:
- ✅ Même logique que AdminFinancePage
- ✅ Vérifie le rôle admin avant l'accès
- ✅ Logs détaillés

**Logs ajoutés**:
```javascript
[OPS MANAGER] Auth state: { authLoading, user, role, uid }
[OPS MANAGER] Access denied, redirecting to home
[OPS MANAGER] Access granted
```

### 4. OrganizerDashboardPage - Attente de l'Authentification

**Fichier**: `src/pages/OrganizerDashboardPage.tsx`

**Modifications**:
- ✅ Vérifie le rôle organizer OU admin
- ✅ Redirige vers login si pas d'utilisateur
- ✅ Logs détaillés incluant le statut de vérification

**Logs ajoutés**:
```javascript
[ORGANIZER DASHBOARD] Auth state: { authLoading, user, role, uid, organizerStatus }
[ORGANIZER DASHBOARD] No user, redirecting to login
[ORGANIZER DASHBOARD] Not an organizer, redirecting to home
[ORGANIZER DASHBOARD] Access granted, loading data
[MOCK DATA] Loading organizer dashboard... { userRole, uid, organizerId }
[MOCK DATA] Loaded organizer data successfully
```

## COMMENT DÉBOGUER

### Étape 1: Ouvrir la Console du Navigateur

1. Appuyez sur **F12** ou **Ctrl+Shift+I** (Windows/Linux) ou **Cmd+Option+I** (Mac)
2. Allez dans l'onglet **Console**

### Étape 2: Se Connecter

1. Allez sur la page de connexion (Admin Finance, Ops Manager, ou Organisateur)
2. Entrez vos identifiants
3. Observez les logs dans la console

### Étape 3: Analyser les Logs

#### Séquence Normale de Logs pour Admin:

```
[FIREBASE AUTH] Setting up auth state listener
[FIREBASE AUTH] Auth state changed: { authenticated: true, email: "admin@example.com", uid: "Tnq8Isi0fATmidMwEuVrw1SAJkI3" }
[FIREBASE AUTH] Loading user profile for: Tnq8Isi0fATmidMwEuVrw1SAJkI3
[FIREBASE AUTH] Is admin UID? true Expected: Tnq8Isi0fATmidMwEuVrw1SAJkI3
[FIREBASE AUTH] User data loaded: false
[FIREBASE AUTH] Organizer data loaded: { exists: false, isActive: undefined, status: undefined }
[FIREBASE AUTH] Admin data loaded: { exists: false, isActive: undefined }
[FIREBASE AUTH] Determined role: admin
[FIREBASE AUTH] User profile created: { email: "admin@example.com", role: "admin", hasOrganizer: false, hasAdmin: false }
[ADMIN FINANCE] Auth state: { authLoading: false, user: "admin@example.com", role: "admin", uid: "Tnq8Isi0fATmidMwEuVrw1SAJkI3" }
[ADMIN FINANCE] Access granted, loading data
[MOCK DATA] Loading admin finance... { userRole: "admin", uid: "Tnq8Isi0fATmidMwEuVrw1SAJkI3" }
[MOCK DATA] Loaded admin finance data successfully
```

#### Séquence Normale de Logs pour Organisateur:

```
[FIREBASE AUTH] Auth state changed: { authenticated: true, email: "okcmalick@gmail.com", uid: "<organizer_uid>" }
[FIREBASE AUTH] Loading user profile for: <organizer_uid>
[FIREBASE AUTH] Is admin UID? false Expected: Tnq8Isi0fATmidMwEuVrw1SAJkI3
[FIREBASE AUTH] User data loaded: true
[FIREBASE AUTH] Organizer data loaded: { exists: true, isActive: true, status: "verified" }
[FIREBASE AUTH] Admin data loaded: { exists: false, isActive: undefined }
[FIREBASE AUTH] Determined role: organizer
[FIREBASE AUTH] User profile created: { email: "okcmalick@gmail.com", role: "organizer", hasOrganizer: true, hasAdmin: false }
[ORGANIZER DASHBOARD] Auth state: { authLoading: false, user: "okcmalick@gmail.com", role: "organizer", uid: "<organizer_uid>", organizerStatus: "verified" }
[ORGANIZER DASHBOARD] Access granted, loading data
```

### Étape 4: Diagnostiquer les Problèmes

#### Problème 1: Permission Denied

**Symptôme**: Log montre `Could not load user data: Error: Permission denied`

**Cause**: Les règles Firebase ne sont pas encore déployées

**Solution**:
1. Vérifiez que vous avez publié les règles dans Firebase Console
2. Allez sur https://console.firebase.google.com
3. Projet evenpass-senegal → Realtime Database → Règles
4. Vérifiez que les règles sont identiques à celles dans `database.rules.json`

#### Problème 2: Rôle Incorrect

**Symptôme**: Log montre `Determined role: customer` au lieu de `admin` ou `organizer`

**Cause Admin**:
- L'UID n'est pas `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
- La variable d'environnement `VITE_ADMIN_UID` n'est pas définie

**Solution Admin**:
1. Vérifiez le fichier `.env`:
   ```
   VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3
   ```
2. Redémarrez le serveur de dev

**Cause Organisateur**:
- Pas de données dans `/evenpass/organizers/<uid>`
- `is_active` est `false`
- `verification_status` n'est pas `verified`

**Solution Organisateur**:
1. Allez dans Firebase Console → Realtime Database
2. Naviguez vers `/evenpass/organizers/<uid>`
3. Créez ou modifiez l'entrée:
   ```json
   {
     "is_active": true,
     "verification_status": "verified",
     "organization_name": "Mon Organisation",
     "contact_email": "email@example.com"
   }
   ```

#### Problème 3: Redirection Immédiate

**Symptôme**: La page redirige immédiatement vers l'accueil après connexion

**Cause**: Le rôle ne correspond pas au dashboard

**Solution**:
1. Regardez le log `[FIREBASE AUTH] Determined role`
2. Vérifiez que le rôle est correct pour le dashboard:
   - Admin Finance/Ops Manager: rôle doit être `admin`
   - Dashboard Organisateur: rôle doit être `organizer` ou `admin`

#### Problème 4: Chargement Infini

**Symptôme**: Message "Vérification des accès..." reste affiché

**Cause**: `authLoading` reste `true`

**Solution**:
1. Vérifiez dans les logs que `[FIREBASE AUTH] User profile created` apparaît
2. Si ce log n'apparaît pas, il y a une erreur dans le chargement du profil
3. Regardez les logs d'erreur précédents

## POINTS DE VÉRIFICATION

### ✅ Règles Firebase Déployées

```bash
# Dans Firebase Console → Realtime Database → Règles
# La section "users" doit avoir:
"users": {
  ".read": "auth != null",
  "$userId": {
    ".write": "auth != null && (auth.uid === $userId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
  }
}
```

### ✅ Variable d'Environnement

```bash
# Fichier .env
VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3
```

### ✅ Données Organisateur dans Firebase

```
/evenpass/organizers/<uid>
  ├── is_active: true
  ├── verification_status: "verified"
  ├── organization_name: "..."
  └── contact_email: "..."
```

### ✅ Chemin Firebase Correct

Toutes les requêtes doivent pointer vers `/evenpass/...`:
- ✅ `/evenpass/users/<uid>`
- ✅ `/evenpass/organizers/<uid>`
- ✅ `/evenpass/admins/<uid>`
- ❌ `/users/<uid>` (INCORRECT)

## RÉSUMÉ DES FIXES

1. **Gestion d'erreurs robuste**: Les erreurs de permission ne bloquent plus l'authentification
2. **Attente de l'auth**: Les pages n'accèdent plus aux données avant que l'auth soit prête
3. **Logs détaillés**: Chaque étape est loguée pour faciliter le débogage
4. **Profil par défaut**: Si les données Firebase ne peuvent pas être chargées, un profil minimal est créé
5. **Rôle admin basé sur UID**: Le super admin est reconnu même sans données en base

## PROCHAINES ÉTAPES

1. **Connectez-vous** avec votre compte
2. **Ouvrez la console** du navigateur (F12)
3. **Copiez tous les logs** qui commencent par `[FIREBASE AUTH]`, `[ADMIN FINANCE]`, `[OPS MANAGER]`, ou `[ORGANIZER DASHBOARD]`
4. **Partagez ces logs** si vous rencontrez toujours des problèmes

Les logs vous diront exactement:
- Si l'authentification fonctionne
- Quel UID est utilisé
- Quel rôle est déterminé
- Pourquoi l'accès est refusé (le cas échéant)
