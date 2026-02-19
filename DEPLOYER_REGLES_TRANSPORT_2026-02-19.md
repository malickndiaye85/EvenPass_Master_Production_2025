# Guide de Déploiement - Règles Firebase Transport

## CORRECTIF PERMISSION_DENIED - 19 Février 2026

### Problème Identifié
Le bouton "Enrôler le Véhicule" échoue avec une erreur `PERMISSION_DENIED` car les règles Firebase Realtime Database ne contenaient pas les autorisations pour les collections de transport.

### Règles Ajoutées

Les nouvelles règles suivantes ont été ajoutées dans `database.rules.json` :

#### 1. Fleet Vehicles (Flotte de Véhicules)
```json
"fleet_vehicles": {
  ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'ops_transport' || root.child('users').child(auth.uid).child('role').val() === 'super_admin' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
  "$vehicleId": {
    ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'ops_transport' || root.child('users').child(auth.uid).child('role').val() === 'super_admin' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
    ".validate": "newData.hasChildren(['vehicle_number', 'type', 'capacity', 'status'])"
  }
}
```

**Autorisations :**
- Lecture : `ops_transport`, `super_admin`, et UID super admin
- Écriture : `ops_transport`, `super_admin`, et UID super admin
- Validation : Les champs obligatoires sont `vehicle_number`, `type`, `capacity`, `status`
- Les champs optionnels (assurance, chauffeur, etc.) peuvent être `N/A`

#### 2. Transport Lines (Lignes de Transport)
```json
"transport_lines": {
  ".read": "auth != null",
  "$lineId": {
    ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'ops_transport' || root.child('users').child(auth.uid).child('role').val() === 'super_admin' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
  }
}
```

**Autorisations :**
- Lecture : Tous les utilisateurs authentifiés
- Écriture : `ops_transport`, `super_admin`, et UID super admin

#### 3. Scan Events (Événements de Scan)
```json
"scan_events": {
  ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'ops_transport' || root.child('users').child(auth.uid).child('role').val() === 'super_admin' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
  "$scanId": {
    ".write": "auth != null"
  }
}
```

**Autorisations :**
- Lecture : `ops_transport`, `super_admin`, et UID super admin
- Écriture : Tous les utilisateurs authentifiés (pour les scans en temps réel)

#### 4. Pass Subscribers (Abonnés Pass)
```json
"pass_subscribers": {
  ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'ops_transport' || root.child('users').child(auth.uid).child('role').val() === 'super_admin' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
  "$subscriberId": {
    ".write": "auth != null"
  }
}
```

**Autorisations :**
- Lecture : `ops_transport`, `super_admin`, et UID super admin
- Écriture : Tous les utilisateurs authentifiés

#### 5. Admin Logs (Logs de Sécurité)
Les règles existantes sont déjà correctes :
```json
"admin_logs": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  "$logId": {
    ".write": true,
    ".validate": "newData.hasChildren(['timestamp', 'action', 'email']) && newData.child('timestamp').isNumber()"
  }
}
```

**Sécurité :**
- Lecture : Super admin uniquement
- Écriture : Autorisée pour tous (pour tracer les tentatives d'accès)
- Validation : Structure obligatoire avec timestamp, action, email

## Déploiement des Règles

### Option 1 : Via Firebase Console (Recommandé)

1. **Accéder à la Console Firebase**
   - Allez sur [https://console.firebase.google.com](https://console.firebase.google.com)
   - Sélectionnez votre projet `evenpass-pro`

2. **Ouvrir la section Realtime Database**
   - Dans le menu de gauche, cliquez sur "Realtime Database"
   - Cliquez sur l'onglet "Règles"

3. **Copier-Coller les Nouvelles Règles**
   - Ouvrez le fichier `database.rules.json` de votre projet
   - Copiez tout le contenu
   - Collez dans l'éditeur de règles Firebase
   - Cliquez sur "Publier"

4. **Vérification**
   - Firebase affichera un message de confirmation
   - Les règles sont déployées instantanément

### Option 2 : Via Firebase CLI

```bash
# Installer Firebase CLI (si nécessaire)
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Sélectionner le projet
firebase use evenpass-pro

# Déployer les règles uniquement
firebase deploy --only database

# Ou déployer tout
firebase deploy
```

## Test des Règles

### Test 1 : Enrôlement de Véhicule
1. Connectez-vous en tant qu'utilisateur avec le rôle `ops_transport`
2. Allez sur `/admin/ops/transport`
3. Cliquez sur "Enrôler Véhicule"
4. Remplissez le formulaire (au minimum : numéro véhicule, immatriculation, ligne)
5. Cliquez sur "Enrôler le Véhicule"
6. **Résultat attendu** : Toast vert "✅ Véhicule enrôlé avec succès!"

### Test 2 : Console Logs
Ouvrez la console développeur (F12) et vérifiez les logs :
- `🚀 handleEnrollVehicle appelé avec:` → Confirme que le clic est détecté
- `💾 Enregistrement du véhicule:` → Confirme que les données sont prêtes
- `✅ Véhicule enregistré avec succès!` → Confirme l'écriture Firebase

### Test 3 : Vérification Firebase
1. Allez dans Firebase Console
2. Realtime Database → Données
3. Cherchez la collection `fleet_vehicles`
4. Vérifiez que votre nouveau véhicule est présent

## Sécurité

### Rôles Autorisés
- `ops_transport` : Gestion complète de la flotte et des lignes
- `super_admin` : Accès complet à toutes les données
- UID `Tnq8Isi0fATmidMwEuVrw1SAJkI3` : Super admin principal

### Validation des Données
- Les véhicules doivent avoir les champs obligatoires : `vehicle_number`, `type`, `capacity`, `status`
- Les champs optionnels peuvent être `N/A` sans bloquer l'enregistrement
- Les logs de sécurité nécessitent : `timestamp`, `action`, `email`

### Logs de Traçabilité
Tous les échecs d'accès sont automatiquement enregistrés dans `admin_logs` avec :
- Timestamp de la tentative
- Action tentée
- Email de l'utilisateur
- Détails de l'erreur

## Résolution des Problèmes

### Si l'erreur PERMISSION_DENIED persiste :

1. **Vérifier le déploiement des règles**
   - Allez dans Firebase Console → Realtime Database → Règles
   - Vérifiez que les nouvelles règles sont présentes

2. **Vérifier le rôle utilisateur**
   - Allez dans Firebase Console → Realtime Database → Données
   - Cherchez `users/[votre-uid]/role`
   - Vérifiez que la valeur est `ops_transport` ou `super_admin`

3. **Vérifier l'authentification**
   - Ouvrez la console développeur (F12)
   - Dans l'onglet "Application" → "Local Storage"
   - Vérifiez qu'un token Firebase est présent

4. **Forcer le rafraîchissement**
   - Déconnectez-vous de l'application
   - Videz le cache du navigateur (Ctrl+Shift+Delete)
   - Reconnectez-vous

## Maintenance

### Ajout d'un Nouveau Rôle Transport

Si vous devez ajouter un nouveau rôle (ex: `ops_maritime`) :

```json
".write": "auth != null && (
  root.child('users').child(auth.uid).child('role').val() === 'ops_transport' ||
  root.child('users').child(auth.uid).child('role').val() === 'ops_maritime' ||
  root.child('users').child(auth.uid).child('role').val() === 'super_admin' ||
  auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'
)"
```

### Audit de Sécurité

Pour vérifier les accès non autorisés :

1. Firebase Console → Realtime Database → Données
2. Allez dans `admin_logs`
3. Filtrez par `action: 'access_denied'`
4. Examinez les tentatives suspectes

## Commit Message Suggéré

```
fix(firebase): autoriser ops_transport pour fleet_vehicles

- Ajout règles fleet_vehicles avec validation
- Ajout règles transport_lines pour ops_transport
- Ajout règles scan_events et pass_subscribers
- Maintien des logs de sécurité pour traçabilité
- Résout PERMISSION_DENIED sur enrôlement véhicules

BREAKING CHANGE: Les utilisateurs sans rôle ops_transport
ne peuvent plus écrire dans fleet_vehicles
```

## Statut

✅ Règles mises à jour dans `database.rules.json`
⏳ **EN ATTENTE : Déploiement via Firebase Console ou CLI**
⏳ Test de l'enrôlement de véhicule en production

---

**Date :** 2026-02-19
**Auteur :** Bolt
**Version :** 1.0.0
**Priorité :** CRITIQUE
