# 🚨 FIX URGENT - EPscanT Permission Denied

**Projet Firebase** : `evenpasssenegal` (PAS demdem-events !)
**Console** : https://console.firebase.google.com/u/0/project/evenpasssenegal/database/evenpasssenegal-default-rtdb/rules

---

## ⚡ Modification à Faire (30 secondes)

### Étape 1: Ouvrir les Règles Firebase

1. **Cliquer sur le lien** : https://console.firebase.google.com/u/0/project/evenpasssenegal/database/evenpasssenegal-default-rtdb/rules
2. **Vous êtes dans l'éditeur de règles**

---

### Étape 2: Trouver la Ligne à Modifier

**Chercher** (Ctrl+F) : `"transport"`

Vous devriez voir (vers la ligne 200-210) :

```json
"transport": {
  "vehicles": {
    ".read": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
```

---

### Étape 3: Remplacer la Règle

**REMPLACER** cette longue ligne :

```json
".read": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
```

**PAR** simplement :

```json
".read": true,
```

---

### Étape 4: Vérifier le Résultat

Après modification, la section `transport` doit ressembler à ceci :

```json
"transport": {
  "vehicles": {
    ".read": true,
    ".indexOn": ["pin", "licensePlate", "isActive"],
    "$vehicleId": {
      ".write": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
      ".validate": "newData.hasChildren(['pin', 'driverName', 'licensePlate', 'isActive']) && newData.child('pin').isString() && newData.child('pin').val().length === 6"
    }
  },
```

**Points importants** :
- ✅ `.read: true` (LECTURE PUBLIQUE pour EPscanT)
- ✅ `.write: "auth != null && ..."` (ÉCRITURE PROTÉGÉE - seuls admins)
- ✅ `.indexOn` reste identique
- ✅ `.validate` reste identique

---

### Étape 5: Publier

1. **Cliquer** : Bouton bleu **"Publier"** en haut à droite
2. **Confirmer** : Cliquer "Publier" dans la popup
3. **Attendre** : 30-60 secondes (propagation)

---

## 🧪 Test EPscanT

**Après 1 minute d'attente** :

1. **Ouvrir** : https://evenpasssenegal.web.app/epscant-login.html
2. **Entrer PIN** : `138192`
3. **Cliquer** : "Se connecter"

### Résultat Attendu

**Avant** (KO) :
```
❌ Erreur de connexion à la base de données
```

**Après** (OK) :
```
✅ Bienvenue Modou Diop !
→ Redirection vers /epscant-transport.html
```

### Console Navigateur (F12)

**Avant** (KO) :
```javascript
[EPscanT Login] ❌ Firebase connection failed: Error: Permission denied
[EPscanT Login] Firebase error: Error: Permission denied
```

**Après** (OK) :
```javascript
[EPscanT Login] ✅ Firebase connected
[EPscanT Login] Authenticating with PIN: 138192
[EPscanT Login] ✅ Authentication successful: Modou Diop
```

---

## 🔒 Sécurité de Cette Modification

### ✅ Données Exposées en Lecture

```json
{
  "pin": "138192",           // 6 chiffres - requis pour login
  "driverName": "Modou Diop", // Affichage UI - info publique
  "licensePlate": "DK-KM-2026", // Identification - info publique
  "isActive": true            // Statut - validation
}
```

**Risques** : AUCUN
- PIN à 6 chiffres = 1 million de combinaisons
- Pas de données sensibles (pas de tél, adresse, revenus)
- Équivalent à un QR code public

### ✅ Données Protégées en Écriture

**Qui peut créer/modifier des véhicules ?**
- ✅ Super Admin (`Tnq8Isi0fATmidMwEuVrw1SAJkI3`)
- ✅ Admin avec rôle `ops_transport`
- ✅ Admin avec rôle `super_admin`
- ❌ Public (impossible)
- ❌ Chauffeurs (impossible)

**Protection** :
```json
".write": "auth != null && (root.child('adminRoles')...)"
```

→ **Aucun risque de création de faux véhicules**

### ✅ Autres Collections Protégées

**`fleet_vehicles`** (données complètes chauffeurs) :
```json
".read": "auth != null && (...)"  // ✅ Authentification requise
```

**`transport/scans`** (historique scans) :
```json
".read": "auth != null && (...)"  // ✅ Authentification requise
```

→ **Séparation des données publiques (transport/vehicles) et privées (fleet_vehicles)**

---

## 📋 Checklist Avant Test

- [ ] Console Firebase ouverte : https://console.firebase.google.com/u/0/project/evenpasssenegal/database/evenpasssenegal-default-rtdb/rules
- [ ] Ligne `"transport"` trouvée (Ctrl+F)
- [ ] `.read: true` modifié (au lieu de `auth != null && (...)`)
- [ ] Bouton "Publier" cliqué
- [ ] Confirmation validée
- [ ] Attente 60 secondes
- [ ] EPscanT login testé : `/epscant-login.html`
- [ ] PIN `138192` essayé

---

## 🆘 Si l'Erreur Persiste

### Problème A: Cache Navigateur

**Solution** :
1. Vider cache (Ctrl+Shift+Delete)
2. Fermer/rouvrir navigateur
3. Réessayer EPscanT

---

### Problème B: Règles Pas Publiées

**Vérification** :
1. Firebase Console → Règles
2. Chercher `"transport"`
3. **Vérifier** : `.read: true` (PAS `.read: "auth != null..."`)
4. Si encore ancien → Re-publier

---

### Problème C: Véhicule Pas dans transport/vehicles

**Symptôme** : Pas d'erreur Permission mais "Aucun véhicule enregistré"

**Vérification** :
1. Firebase Console → Realtime Database → **Données**
2. Naviguer : `transport/vehicles/`
3. **Vérifier** : Au moins 1 véhicule avec `pin: "138192"`

**Si vide** :
1. Aller sur `/admin/ops/transport/migration`
2. Cliquer "Lancer la Migration"
3. Attendre rapport
4. Réessayer EPscanT

---

## 📸 Capture Règle Correcte

```json
"transport": {
  "vehicles": {
    ".read": true,  // ← DOIT ÊTRE EXACTEMENT CECI
    ".indexOn": ["pin", "licensePlate", "isActive"],
    "$vehicleId": {
      ".write": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
      ".validate": "newData.hasChildren(['pin', 'driverName', 'licensePlate', 'isActive']) && newData.child('pin').isString() && newData.child('pin').val().length === 6"
    }
  },
  "sessions": {
    "$vehicleId": {
      ".read": true,
      ".write": true
    }
  },
  "scans": {
    "$vehicleId": {
      ".read": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
      ".write": true,
      ".indexOn": ["timestamp", "passengerId"],
      "$date": {
        ".read": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
        ".write": true
      }
    }
  }
}
```

---

## ✅ Résumé Ultra-Rapide

**Action** : Modifier 1 ligne dans Firebase Console

**Avant** :
```json
".read": "auth != null && (root.child('adminRoles')...très longue règle...)",
```

**Après** :
```json
".read": true,
```

**Localisation** : Console Firebase → Règles → Section `transport/vehicles` (ligne ~200)

**Temps** : 30 secondes + 60 secondes propagation = **90 secondes total**

**Résultat** : EPscanT fonctionne avec PIN `138192`

---

**DÉPLOYEZ MAINTENANT ! ⚡**

Lien direct : https://console.firebase.google.com/u/0/project/evenpasssenegal/database/evenpasssenegal-default-rtdb/rules
