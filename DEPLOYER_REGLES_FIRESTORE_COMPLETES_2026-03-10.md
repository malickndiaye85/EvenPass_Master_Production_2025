# 🔥 DÉPLOIEMENT RÈGLES FIRESTORE COMPLÈTES - 2026-03-10

## 📋 RÈGLES MISES À JOUR

Le fichier `firestore.rules` a été mis à jour avec **TOUTES** les collections nécessaires pour l'écosystème complet :

### ✅ Nouveautés Ajoutées

1. **Helper Functions**
   - `isOpsManagerEvents()` - Accès OPS Events
   - `isOpsManagerTransport()` - Accès OPS Transport
   - `isStaff()` - Accès staff (controleur, ops)

2. **Collections OPS Events**
   - `ops_events` - Données OPS scanner events
   - `ops_events_scans` - Historique scans events

3. **Collections SAMA Pass**
   - `sama_pass` - QR codes et abonnements
   - `sama_pass_scans` - Historique scans SAMA Pass
   - `maritime_bookings` - Réservations (lecture/création publique)

4. **Collections Transport**
   - `transport_vehicles` - Véhicules (OPS Transport)
   - `transport_lines` - Lignes de transport
   - `transport_scans` - Historique scans EPscanT

5. **Collections Finances**
   - `commissions` - Tracking commissions
   - `wallet_transactions` - Historique portefeuille chauffeurs

6. **Collections Abonnements**
   - `demdem_express_subscriptions` - Abonnements chauffeurs

7. **Logs Sécurité**
   - `securityLogs` - Logs de sécurité (lecture staff)

---

## 🚀 DÉPLOIEMENT

### Option 1 : Firebase CLI (Recommandé)

```bash
# Depuis le dossier racine du projet
firebase deploy --only firestore:rules
```

**Résultat attendu** :
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/evenpasssenegal/overview
```

### Option 2 : Console Firebase

1. Aller sur : https://console.firebase.google.com/project/evenpasssenegal/firestore/rules
2. Copier le contenu de `firestore.rules`
3. Coller dans l'éditeur
4. Cliquer sur "Publier"

---

## 📊 COLLECTIONS COUVERTES

### EVENTS (EvenPass)
- ✅ `events` - Événements
- ✅ `events/{id}/tickets` - Billets
- ✅ `events/{id}/scans` - Scans
- ✅ `events/{id}/attendees` - Participants
- ✅ `orders` - Commandes
- ✅ `organizers` - Organisateurs
- ✅ `tickets` - Billets test

### OPS EVENTS (EPscanV)
- ✅ `ops_events` - Données OPS
- ✅ `ops_events_scans` - Historique scans

### TRANSPORT (DemDem)
- ✅ `trips` - Trajets
- ✅ `transport_vehicles` - Véhicules
- ✅ `transport_lines` - Lignes
- ✅ `transport_scans` - Scans EPscanT
- ✅ `access_codes` - Codes d'accès véhicules
- ✅ `demdem_express_subscriptions` - Abonnements
- ✅ `drivers` - Chauffeurs

### SAMA PASS (Maritime)
- ✅ `sama_pass` - QR codes et abonnements
- ✅ `sama_pass_scans` - Historique scans
- ✅ `maritime_users` - Utilisateurs maritimes
- ✅ `maritime_subscriptions` - Abonnements maritimes
- ✅ `maritime_bookings` - Réservations

### ADMIN & SYSTÈME
- ✅ `users` - Profils utilisateurs
- ✅ `finances` - Données financières
- ✅ `payments` - Paiements
- ✅ `commissions` - Commissions
- ✅ `wallet_transactions` - Transactions portefeuille
- ✅ `statistics` - Statistiques
- ✅ `logs` / `systemLogs` / `auditLogs` / `securityLogs`

### CONFIGURATION
- ✅ `config` - Configuration
- ✅ `settings` - Paramètres
- ✅ `backgrounds` - Arrière-plans landing
- ✅ `home_ads` - Publicités accueil
- ✅ `categories` - Catégories

### STAFF & SÉCURITÉ
- ✅ `security_agents` - Agents de sécurité
- ✅ `agent_access_codes` - Codes accès agents
- ✅ `agent_scans` - Scans agents

### AUTRES
- ✅ `ticket_types` - Types de billets
- ✅ `modification_requests` - Demandes modification
- ✅ `payout_requests` - Demandes paiement
- ✅ `bulk_sales` - Ventes en bloc
- ✅ `_connection_test` - Test connexion

---

## 🔐 PERMISSIONS PAR RÔLE

### Super Admin (Tnq8Isi0fATmidMwEuVrw1SAJkI3)
- ✅ **ACCÈS TOTAL** à toutes les collections
- ✅ Lecture, écriture, modification, suppression partout

### OPS Manager Events
- ✅ Lecture/écriture : `events`, `scans`, `tickets`, `attendees`
- ✅ Lecture/écriture : `ops_events`, `ops_events_scans`
- ✅ Lecture : `users` (via `isStaff()`)

### OPS Manager Transport
- ✅ Lecture/écriture : `transport_vehicles`, `transport_lines`
- ✅ Lecture : `transport_scans`
- ✅ Création : `access_codes`
- ✅ Lecture : `users` (via `isStaff()`)

### Organisateur
- ✅ Lecture publique : `events`
- ✅ Création : événements (avec `organizer_id == uid`)
- ✅ Modification/suppression : ses propres événements
- ✅ Gestion : tickets, scans, attendees de ses événements

### Chauffeur
- ✅ Lecture publique : `trips`, `transport_lines`
- ✅ Création : trajets (avec `driverId == uid`)
- ✅ Modification : ses propres trajets
- ✅ Lecture : son propre profil

### Public (Non authentifié)
- ✅ Lecture : `events`, `trips`, `transport_lines`, `sama_pass`
- ✅ Création : `sama_pass`, `maritime_bookings`, `demdem_express_subscriptions`
- ✅ Authentification : `access_codes` (lecture pour login)

---

## 🧪 TESTS POST-DÉPLOIEMENT

### 1. Test Admin
```javascript
// Firebase Console → Firestore → Rules Playground
// User: Tnq8Isi0fATmidMwEuVrw1SAJkI3
// Collection: finances
// Operation: get
// Résultat: ✅ ALLOWED
```

### 2. Test OPS Events
```javascript
// User: {ops_events_uid}
// Collection: ops_events_scans
// Operation: create
// Résultat: ✅ ALLOWED
```

### 3. Test OPS Transport
```javascript
// User: {ops_transport_uid}
// Collection: transport_vehicles
// Operation: update
// Résultat: ✅ ALLOWED
```

### 4. Test Public
```javascript
// User: null (non authentifié)
// Collection: sama_pass
// Operation: read
// Résultat: ✅ ALLOWED
```

### 5. Test Lecture Publique Access Codes
```javascript
// User: null
// Collection: access_codes
// Document: 811384
// Operation: get
// Résultat: ✅ ALLOWED
```

---

## 🔍 VÉRIFICATION

### Vérifier les Règles Déployées

```bash
firebase firestore:rules:get
```

### Tester les Règles

```bash
firebase emulators:start --only firestore
```

---

## ⚠️ SÉCURITÉ

### Points Critiques

1. **Admin UID hardcodé** : `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
   - ✅ Accès total garanti
   - ⚠️ Ne jamais partager ce UID

2. **Création publique autorisée** :
   - `sama_pass` - Pour génération QR
   - `maritime_bookings` - Pour réservations
   - `demdem_express_subscriptions` - Pour achats
   - `drivers` - Pour inscription chauffeurs
   - `organizers` - Pour inscription organisateurs

3. **Lecture publique autorisée** :
   - `access_codes` - Pour authentification véhicules
   - `events` - Pour affichage public
   - `trips` - Pour affichage trajets
   - `transport_lines` - Pour affichage lignes

4. **Protection par rôle** :
   - `isOpsManagerEvents()` - Vérifie `role == 'ops_events'`
   - `isOpsManagerTransport()` - Vérifie `role == 'ops_transport'`
   - `isStaff()` - Vérifie `role in ['ops_events', 'ops_transport', 'controleur']`

---

## 📝 CHANGELOG

### 2026-03-10 - RÈGLES COMPLÈTES

**Ajouté** :
- Helper functions : `isOpsManagerEvents()`, `isOpsManagerTransport()`, `isStaff()`
- Collections : `ops_events`, `ops_events_scans`
- Collections : `sama_pass`, `sama_pass_scans`
- Collections : `transport_vehicles`, `transport_lines`, `transport_scans`
- Collections : `commissions`, `wallet_transactions`
- Collections : `demdem_express_subscriptions`
- Logs : `securityLogs`

**Modifié** :
- `events` : Ajout accès OPS Events
- `users` : Ajout accès Staff
- `access_codes` : Création par OPS Transport

**Sécurisé** :
- Blocage par défaut : `match /{document=**}` → `allow read, write: if false`

---

## 🚀 COMMANDE FINALE

```bash
# Déployer les règles
firebase deploy --only firestore:rules

# Vérifier le déploiement
firebase firestore:rules:get

# Tester (optionnel)
firebase emulators:start --only firestore
```

---

## ✅ CHECKLIST

- [ ] Règles copiées dans `firestore.rules`
- [ ] Firebase CLI installé
- [ ] Projet Firebase configuré (`firebase use evenpasssenegal`)
- [ ] Déploiement lancé (`firebase deploy --only firestore:rules`)
- [ ] Règles vérifiées dans Console Firebase
- [ ] Tests effectués (Admin, OPS, Public)
- [ ] EPscanT fonctionnel (login avec code)
- [ ] EPscanV fonctionnel (scan events)
- [ ] SAMA Pass fonctionnel (scan QR)

---

**PRÊT POUR LE DÉPLOIEMENT** 🔥
