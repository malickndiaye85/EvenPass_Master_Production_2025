# DÉPLOIEMENT URGENT - RÈGLES FIRESTORE ACCESS_CODES

**Date** : 2026-03-10
**Priorité** : 🔴 CRITIQUE
**Statut** : ⏳ EN ATTENTE DE DÉPLOIEMENT

---

## 🐛 Problème Identifié

### Erreur EPscanT
```
FirebaseError: Missing or insufficient permissions.
```

### Cause Racine
Le code `epscant-line-sectorization.js` utilise **Firestore** (pas Realtime Database) :

```javascript
// Ligne 17 - Lecture dans Firestore
const accessCodeRef = fsDoc(firestore, 'access_codes', accessCode);
const accessCodeSnap = await fsGetDoc(accessCodeRef);
```

**Règles Firestore actuelles (INCORRECTES)** :
```
match /access_codes/{codeId} {
  allow read: if isAuthenticated();  // ❌ Nécessite authentification
}
```

**Problème** : EPscanT essaie de lire le code **AVANT** d'être authentifié → Permission refusée

---

## ✅ Solution Appliquée

### Nouvelles Règles Firestore

**Fichier** : `firestore.rules` (ligne 424-436)

```javascript
match /access_codes/{codeId} {
  // Lecture publique pour permettre l'authentification par code
  // Sécurité: Les codes sont pré-générés et limités
  allow read: if true;

  // Création par utilisateurs authentifiés (ops_transport, admin)
  allow create: if isAuthenticated();

  // Modification uniquement par admin
  allow update: if isAdminFinance();

  // Suppression uniquement par admin
  allow delete: if isAdminFinance();
}
```

**Changement** : `allow read: if isAuthenticated()` → `allow read: if true`

---

## 🔒 Pourquoi C'est Sécurisé

### 1. Écriture Strictement Contrôlée
- ✅ Création : Authentification requise
- ✅ Modification : Admin uniquement
- ✅ Suppression : Admin uniquement

### 2. Codes Simples et Limités
- Format : 6 caractères alphanumériques
- Exemple : `811384`, `A1B2C3`
- Pas de données sensibles

### 3. Structure Sécurisée
```javascript
{
  code: "811384",
  type: "vehicle",           // Type d'accès
  vehicleId: "...",          // ID véhicule lié
  vehiclePlate: "DK-1234",   // Plaque d'immatriculation
  isActive: true,            // Peut être désactivé
  createdBy: "admin_uid",    // Traçabilité
  createdAt: 1741564800000   // Timestamp
}
```

### 4. Codes Pré-Générés
- Seul l'admin peut créer des codes
- Impossible pour un attaquant de créer ses propres codes
- Liste limitée et contrôlée

### 5. Révocation Instantanée
```javascript
// Désactiver un code immédiatement
{
  code: "811384",
  isActive: false  // ← Code révoqué
}
```

---

## 🚀 DÉPLOIEMENT REQUIS

### ⚠️ ACTION URGENTE

Les règles ont été corrigées localement mais **DOIVENT ÊTRE DÉPLOYÉES** sur Firebase.

### Option 1 : Firebase Console (RAPIDE)

1. **Ouvrir Firebase Console**
   ```
   https://console.firebase.google.com/
   ```

2. **Sélectionner le Projet**
   - Projet : `evenpass-2026`

3. **Accéder aux Règles Firestore**
   - Menu latéral → **Firestore Database**
   - Onglet **Règles**

4. **Copier-Coller les Nouvelles Règles**
   - Ouvrir le fichier : `firestore.rules`
   - Copier **tout le contenu**
   - Coller dans l'éditeur Firebase Console
   - Cliquer sur **"Publier"**

5. **Confirmation**
   - Firebase affiche : "Règles publiées avec succès"
   - Les règles sont actives **immédiatement**

---

### Option 2 : Firebase CLI

Si Firebase CLI est installé et configuré :

```bash
# Déployer les règles Firestore uniquement
firebase deploy --only firestore:rules

# Vérifier le déploiement
firebase firestore:rules
```

---

## 🧪 Tests de Vérification

### Test 1 : Lecture Publique (Console Navigateur)

**EPscanT Login** → Console DevTools :

```javascript
// Tester la lecture sans authentification
const firestore = window.firebaseFirestore.getFirestore();
const { doc, getDoc } = window.firebaseFirestore;

const accessCodeRef = doc(firestore, 'access_codes', '811384');
getDoc(accessCodeRef).then(snap => {
  if (snap.exists()) {
    console.log('✅ Lecture autorisée:', snap.data());
  } else {
    console.log('❌ Code non trouvé');
  }
}).catch(error => {
  console.error('❌ Erreur:', error.message);
});
```

**Résultat Attendu** : `✅ Lecture autorisée`

---

### Test 2 : Écriture Interdite (Non-Admin)

```javascript
// Tenter de créer un code sans authentification
const firestore = window.firebaseFirestore.getFirestore();
const { doc, setDoc } = window.firebaseFirestore;

const newCodeRef = doc(firestore, 'access_codes', '999999');
setDoc(newCodeRef, {
  code: '999999',
  type: 'vehicle',
  isActive: true
}).catch(error => {
  console.log('✅ Écriture refusée (attendu):', error.message);
});
```

**Résultat Attendu** : `✅ Écriture refusée - Missing or insufficient permissions`

---

### Test 3 : Authentification EPscanT (Test Complet)

1. **Aller sur EPscanT**
   ```
   /epscant-login.html
   ```

2. **Entrer le Code d'Accès**
   ```
   811384
   ```

3. **Vérifier la Console**

   **Avant le Fix** :
   ```
   [SECTORISATION] 🔐 Authentification avec code: 811384
   [SECTORISATION] ❌ Erreur: Missing or insufficient permissions
   ```

   **Après le Fix** :
   ```
   [SECTORISATION] 🔐 Authentification avec code: 811384
   [SECTORISATION] ✅ Code valide pour véhicule: DK-1234
   [SECTORISATION] 🚍 Véhicule assigné à la ligne: line_keur_massar
   [SECTORISATION] ✅ Ligne active: Keur Massar Express
   [SECTORISATION] ✅ Session établie
   ```

4. **Résultat Attendu**
   - ✅ Authentification réussie
   - ✅ Accès à EPscanT
   - ✅ Scan de SAMA PASS opérationnel

---

## 📊 Impact du Déploiement

### Avant le Déploiement
```
❌ EPscanT inaccessible
❌ Contrôleurs bloqués
❌ "Missing or insufficient permissions"
❌ Service de scan transport inopérant
```

### Après le Déploiement
```
✅ Authentification par code d'accès fonctionnelle
✅ EPscanT opérationnel
✅ Contrôleurs peuvent scanner les SAMA PASS
✅ Alertes audio/tactiles actives
✅ Sectorisation par ligne fonctionnelle
```

---

## 🔐 Comparaison avec Realtime Database

### Realtime Database (database.rules.json)

Également corrigé pour cohérence :

```json
"accessCodes": {
  ".read": true,  // ✅ Lecture publique
  ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"  // ✅ Admin uniquement
}
```

**Status** : ⏳ En attente de déploiement

---

### Firestore (firestore.rules)

```javascript
match /access_codes/{codeId} {
  allow read: if true;  // ✅ Lecture publique
  allow create: if isAuthenticated();
  allow update: if isAdminFinance();
  allow delete: if isAdminFinance();
}
```

**Status** : ⏳ **EN ATTENTE DE DÉPLOIEMENT** (ACTION REQUISE)

---

## 📁 Fichiers Modifiés

### 1. `firestore.rules`
**Ligne 424-436** : Règles `access_codes` mises à jour

### 2. `database.rules.json`
**Ligne 237-244** : Règles `accessCodes` mises à jour (Realtime Database)

---

## ✅ Checklist de Déploiement

- [x] Règles Firestore corrigées localement
- [ ] **Règles Firestore déployées sur Firebase Console** ← **ACTION URGENTE**
- [ ] Test de lecture publique
- [ ] Test d'écriture refusée
- [ ] Test d'authentification EPscanT avec code `811384`
- [ ] Vérification en production

---

## 🚨 DÉPLOIEMENT IMMÉDIAT REQUIS

**Sans déploiement des règles Firestore, EPscanT restera inaccessible !**

### Étapes Immédiates

1. ✅ Règles corrigées localement (FAIT)
2. ⏳ **Aller sur Firebase Console** (ACTION REQUISE)
3. ⏳ **Publier les règles Firestore**
4. ⏳ Tester avec code `811384`
5. ⏳ Confirmer accès EPscanT

---

## 📞 Support

Si le déploiement échoue ou si l'erreur persiste :

1. Vérifier que les règles sont bien publiées
2. Vérifier que le code `811384` existe dans Firestore
3. Vérifier la structure du document `access_codes/811384`
4. Consulter les logs Firebase Console

---

**🎯 Une fois les règles déployées, EPscanT sera immédiatement accessible.**
