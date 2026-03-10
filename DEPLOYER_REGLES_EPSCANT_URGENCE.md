# 🚨 DÉPLOIEMENT URGENT - RÈGLES EPSCANT CODE 898561

## ⚠️ PROBLÈME CRITIQUE

Le code 898561 ne fonctionne PAS car :
1. ❌ Les règles Realtime DB pour `fleet_indices/codes/` n'existent pas
2. ❌ Les règles pour `ops/transport/vehicles/` n'existent pas
3. ❌ Permission Denied sur le fallback

## ✅ SOLUTION

### 1. Règles Ajoutées dans `database.rules.json`

#### A. `fleet_indices/codes/` (LECTURE PUBLIQUE)
```json
"fleet_indices": {
  "codes": {
    ".read": true,
    ".indexOn": ["isActive", "vehicleId"],
    "$codeId": {
      ".write": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_manager_transport' || root.child('adminRoles').child(auth.uid).child('role').val() === 'admin_finance' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
    }
  }
}
```

**Raison**: Les véhicules doivent pouvoir vérifier leur code SANS être authentifiés.

#### B. `ops/transport/vehicles/` (LECTURE PUBLIQUE)
```json
"ops": {
  "transport": {
    "vehicles": {
      ".read": true,
      ".indexOn": ["license_plate", "line_id", "isActive"],
      "$vehicleId": {
        ".write": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_manager_transport' || root.child('adminRoles').child(auth.uid).child('role').val() === 'admin_finance' || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
      }
    },
    "lines": {
      ".read": true,
      "$lineId": {
        ".write": "auth != null",
        "stats": {
          ".write": true
        }
      }
    }
  }
}
```

**Raison**: Les contrôleurs doivent pouvoir lire les infos véhicule + ligne pour la sectorisation.

### 2. Logs de Debug Améliorés

`epscant-line-sectorization.js` affiche maintenant :
- ✅ Chemin exact Firestore
- ✅ Chemin exact Realtime DB
- ✅ Détails complets des erreurs
- ✅ Code d'erreur (PERMISSION_DENIED)

## 🚀 DÉPLOIEMENT

### Option 1: Firebase CLI (RECOMMANDÉ)

```bash
cd /tmp/cc-agent/61964168/project
firebase deploy --only database
```

**Durée**: ~30 secondes

### Option 2: Console Firebase (MANUEL)

1. Ouvrir https://console.firebase.google.com/project/evenpasssenegal/database/evenpasssenegal-default-rtdb/rules
2. Copier le contenu de `database.rules.json`
3. Coller dans l'éditeur
4. Cliquer sur "Publier"

## 🧪 VÉRIFICATION POST-DÉPLOIEMENT

### 1. Page de Debug
```
https://evenpasssenegal.web.app/debug-firestore-codes.html
```

**Actions**:
1. Cliquer sur "📋 Lister Tous les Codes"
   - ✅ Doit afficher tous les codes Firestore
   - ✅ Chercher si 898561 apparaît comme Document ID

2. Cliquer sur "🔍 Chercher 898561"
   - ✅ Si trouvé → OK
   - ❌ Si non trouvé → Essayer "code_898561" ou "vehicle_898561"

3. Cliquer sur "🔍 Query where('code', '==', '898561')"
   - ✅ Doit trouver le document même si l'ID est différent

4. Cliquer sur "🔍 Vérifier fleet_indices/codes/"
   - ✅ Ne doit PLUS afficher "PERMISSION DENIED"
   - ✅ Doit lister les codes dans Realtime DB

### 2. Test Authentification

```
https://evenpasssenegal.web.app/test-code-898561.html
```

**Console attendue** (après déploiement règles):
```
✅ [SECTORISATION] 🔍 Recherche dans Firestore...
✅ [SECTORISATION] 📍 Chemin Firestore: access_codes/898561
✅ [SECTORISATION] ✅ Code trouvé dans Firestore
OU
⚠️ [SECTORISATION] 🔄 FALLBACK: Recherche dans Realtime Database...
✅ [SECTORISATION] ✅ Code trouvé dans fleet_indices
```

**NE DOIT PLUS APPARAÎTRE**:
```
❌ [SECTORISATION] 🔒 PERMISSION DENIED sur: fleet_indices/codes/898561
```

## 🔍 DIAGNOSTIC SI ÇA NE MARCHE TOUJOURS PAS

### A. Le code n'est pas trouvé dans Firestore

**Cause probable**: Le Document ID n'est pas exactement "898561"

**Solution**:
1. Ouvrir `/debug-firestore-codes.html`
2. Lister tous les codes
3. Identifier le vrai Document ID
4. Modifier `epscant-line-sectorization.js` pour chercher le bon ID

**OU** utiliser une Query au lieu d'un doc() direct :
```javascript
// Au lieu de:
const accessCodeRef = doc(firestore, 'access_codes', codeStr);

// Utiliser:
const codesRef = collection(firestore, 'access_codes');
const q = query(codesRef, where('code', '==', codeStr));
const snapshot = await getDocs(q);
```

### B. Permission Denied persiste

**Cause**: Les règles ne sont pas déployées ou Firebase met du temps à propager

**Solution**:
1. Attendre 1-2 minutes après le déploiement
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Vérifier que les règles sont bien déployées dans la console Firebase

### C. Le véhicule n'existe pas dans ops/transport/vehicles/

**Cause**: Le véhicule a été créé dans `fleet_vehicles` mais pas migré vers `ops/transport/vehicles`

**Solution**:
1. Ouvrir `/admin/ops/transport`
2. Re-créer le véhicule avec le code 898561
3. Vérifier que le véhicule apparaît dans `ops/transport/vehicles/{id}`

## 📊 STRUCTURE DES DONNÉES ATTENDUE

### Firestore: `access_codes/898561`
```json
{
  "code": "898561",
  "type": "vehicle",
  "vehicleId": "{vehicleId}",
  "vehiclePlate": "DK-1234-AB",
  "isActive": true,
  "createdAt": 1710086400000,
  "createdBy": "{opsManagerUID}",
  "staffName": "Véhicule ...",
  "usageCount": 0
}
```

### Realtime DB: `fleet_indices/codes/898561`
```json
{
  "vehicleId": "{vehicleId}",
  "vehiclePlate": "DK-1234-AB",
  "isActive": true,
  "createdAt": 1710086400000,
  "createdBy": "{opsManagerUID}",
  "usageCount": 0
}
```

### Realtime DB: `ops/transport/vehicles/{vehicleId}`
```json
{
  "license_plate": "DK-1234-AB",
  "line_id": "{lineId}",
  "driver_name": "...",
  "vehicle_number": "...",
  "isActive": true,
  "access_code": "898561"
}
```

### Realtime DB: `transport_lines/{lineId}`
```json
{
  "name": "Ligne X",
  "route": "Point A - Point B",
  "is_active": true,
  "created_at": 1710086400000
}
```

## ✅ CHECKLIST FINALE

- [ ] Règles déployées dans Firebase Realtime Database
- [ ] `/debug-firestore-codes.html` ne renvoie plus "Permission Denied"
- [ ] Le code 898561 est trouvé (Firestore OU Realtime DB)
- [ ] Le véhicule existe dans `ops/transport/vehicles/`
- [ ] La ligne existe dans `transport_lines/`
- [ ] Le véhicule a un `line_id` valide
- [ ] `/test-code-898561.html` affiche "Authentification Réussie"
- [ ] `/epscant-login.html` accepte le code 898561

## 🚨 IMPACT PRODUCTION

**CRITIQUE**: Tant que les règles ne sont pas déployées, AUCUN bus ne peut se connecter à EPscanT.

**Temps d'indisponibilité estimé**: 0 (les règles peuvent être déployées sans interruption de service)

---

**Date**: 2026-03-10
**Priorité**: 🔴 CRITIQUE
**Action requise**: DÉPLOYER LES RÈGLES IMMÉDIATEMENT
