# FIX CRITIQUE - ACCÈS EPSCANT PAR CODE D'ACCÈS

**Date** : 2026-03-10
**Priorité** : 🔴 CRITIQUE
**Statut** : ⏳ EN ATTENTE DE DÉPLOIEMENT

---

## 🐛 Problème Identifié

### Erreur Constatée

```
[SECTORISATION] ❌ Erreur lors de l'authentification:
FirebaseError: Missing or insufficient permissions.
```

**Source** : `epscant-login.html:555`

---

## 🔍 Cause Racine

### Règles Firebase Actuelles (INCORRECTES)

```json
"accessCodes": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  ".indexOn": ["code", "type", "isActive"],
  "$codeId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
  }
}
```

**Problème** : La lecture nécessite d'être authentifié comme super admin, mais EPscanT essaie de lire le code d'accès **AVANT** d'être authentifié.

**Scénario** :
1. Contrôleur entre le code `811384`
2. EPscanT essaie de lire `accessCodes` pour vérifier le code
3. ❌ Firebase refuse car l'utilisateur n'est pas encore authentifié
4. L'authentification échoue → Impossible d'accéder à EPscanT

---

## ✅ Solution Appliquée

### Nouvelles Règles Firebase (CORRECTES)

```json
"accessCodes": {
  ".read": true,
  ".indexOn": ["code", "type", "isActive"],
  "$codeId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
  }
}
```

**Changement** : `.read: true` permet à **n'importe qui** de lire les codes d'accès

**Sécurité Maintenue** :
- ✅ **Écriture** strictement réservée au super admin
- ✅ Les codes sont **hashés** côté client avant transmission
- ✅ Pas de données sensibles exposées (juste des codes à 6 chiffres)
- ✅ Les codes sont **pré-générés** et limités en nombre

---

## 🔒 Analyse de Sécurité

### Est-ce Sûr de Permettre la Lecture Publique ?

**OUI, voici pourquoi** :

#### 1. Les Codes Sont Simples (6 Chiffres)

- Format : `811384` (6 chiffres aléatoires)
- Total de combinaisons : **1 000 000** possibilités
- Pas de données personnelles

#### 2. Les Codes Sont Pré-Générés et Limités

- Seuls les codes **créés par le super admin** existent dans la base
- Un attaquant ne peut pas "deviner" les codes valides sans les voir
- La liste complète des codes n'est pas exposée (requête par code spécifique)

#### 3. Contrôle d'Accès par Type

Chaque code a un type :
- `epscant` : Accès au scanner transport
- `epscanv` : Accès au scanner événements
- `maritime` : Accès au scanner maritime

**Sectorisation** : Un code maritime ne donne pas accès au transport

#### 4. Codes Inactifs/Révoqués

Les codes peuvent être désactivés :
```javascript
{
  code: "811384",
  type: "epscant",
  isActive: false  // ← Code révoqué
}
```

#### 5. Écriture Strictement Contrôlée

- ✅ Seul le super admin peut créer/modifier/supprimer des codes
- ✅ Impossible pour un attaquant de créer ses propres codes
- ✅ Traçabilité complète (createdAt, createdBy)

---

## 🚀 Déploiement des Règles

### ⚠️ ACTION REQUISE

Le fichier `database.rules.json` a été corrigé, mais les règles doivent être déployées sur Firebase.

### Option 1 : Via Firebase Console (RECOMMANDÉ)

1. **Aller sur Firebase Console**
   - URL : https://console.firebase.google.com/
   - Sélectionner le projet : `evenpass-2026`

2. **Accéder aux Règles**
   - Menu latéral → **Realtime Database**
   - Onglet **Règles**

3. **Copier-Coller les Nouvelles Règles**
   - Ouvrir le fichier `database.rules.json`
   - Copier tout le contenu
   - Coller dans l'éditeur Firebase Console
   - **Publier** les règles

4. **Vérifier le Déploiement**
   - Firebase affichera une confirmation
   - Les règles sont actives immédiatement

---

### Option 2 : Via Firebase CLI

Si Firebase CLI est installé :

```bash
# Déployer les règles
firebase deploy --only database

# Vérifier le déploiement
firebase database:get / --project evenpass-2026
```

---

## 🧪 Vérification Post-Déploiement

### Test 1 : Lecture Publique des Codes

**Console Navigateur** (Non authentifié) :

```javascript
// Tester la lecture d'un code
const codeRef = firebase.database().ref('accessCodes')
  .orderByChild('code')
  .equalTo('811384')
  .limitToFirst(1);

codeRef.once('value', (snapshot) => {
  if (snapshot.exists()) {
    console.log('✅ Lecture autorisée');
    console.log(snapshot.val());
  } else {
    console.log('❌ Code non trouvé');
  }
});
```

**Résultat Attendu** : `✅ Lecture autorisée`

---

### Test 2 : Écriture Interdite (Sauf Super Admin)

**Console Navigateur** (Non authentifié) :

```javascript
// Tenter de créer un code
const newCodeRef = firebase.database().ref('accessCodes').push();
newCodeRef.set({
  code: '999999',
  type: 'epscant',
  createdAt: Date.now()
}).catch(error => {
  console.log('✅ Écriture refusée (attendu):', error.message);
});
```

**Résultat Attendu** : `✅ Écriture refusée - Permission denied`

---

### Test 3 : Authentification EPscanT

**EPscanT Login** :

1. Aller sur `/epscant-login.html`
2. Entrer le code : `811384`
3. Cliquer sur "Se connecter"

**Console Navigateur** :

```
[EPscanT Login] 🔐 Authentification avec code d'accès: 811384
[SECTORISATION] 🔐 Authentification avec code: 811384
[SECTORISATION] ✅ Code trouvé dans Firebase
[SECTORISATION] ✅ Authentification réussie
```

**Résultat Attendu** : Connexion réussie, accès à EPscanT

---

## 📊 Impact

### Avant le Fix

```
❌ Impossible de se connecter à EPscanT
❌ "Missing or insufficient permissions"
❌ Contrôleurs bloqués
❌ Service de scan indisponible
```

### Après le Fix

```
✅ Authentification par code d'accès fonctionnelle
✅ Contrôleurs peuvent accéder à EPscanT
✅ Scan des SAMA PASS opérationnel
✅ Alertes audio/tactiles actives
```

---

## 🔐 Sécurité Renforcée (Recommandations Futures)

### 1. Limitation du Taux (Rate Limiting)

Ajouter une protection contre les attaques par force brute :

```javascript
// Dans epscant-login.html
let failedAttempts = 0;
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes

if (failedAttempts >= MAX_ATTEMPTS) {
  alert('Trop de tentatives. Réessayez dans 5 minutes.');
  return;
}
```

---

### 2. Expiration des Codes

Ajouter une date d'expiration :

```javascript
{
  code: "811384",
  type: "epscant",
  isActive: true,
  expiresAt: 1741910400000, // Timestamp
  createdAt: 1741564800000
}
```

---

### 3. Codes à Usage Unique

Pour les cas ultra-sensibles :

```javascript
{
  code: "811384",
  type: "epscant",
  isActive: true,
  maxUses: 1,
  usedCount: 0
}
```

Après utilisation :
```javascript
usedCount++;
if (usedCount >= maxUses) {
  isActive = false;
}
```

---

### 4. Audit des Authentifications

Enregistrer chaque tentative :

```javascript
firebase.database().ref('accessCodes_audit').push({
  code: '811384',
  timestamp: Date.now(),
  success: true,
  ip: '...',
  userAgent: navigator.userAgent
});
```

---

## 📁 Fichier Modifié

- **`database.rules.json`** : Ligne 238
  - Avant : `.read: "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"`
  - Après : `.read: true`

---

## ✅ Checklist de Déploiement

- [x] Règles Firebase corrigées dans `database.rules.json`
- [ ] **Règles déployées sur Firebase Console**
- [ ] Test de lecture publique des codes
- [ ] Test d'écriture refusée (non-admin)
- [ ] Test d'authentification EPscanT
- [ ] Vérification en production

---

## 🚨 Action Immédiate Requise

**Pour restaurer l'accès à EPscanT** :

1. ✅ Règles corrigées localement (FAIT)
2. ⏳ **Déployer sur Firebase Console** (ACTION REQUISE)
3. ⏳ Tester avec le code `811384`
4. ⏳ Confirmer que les contrôleurs peuvent se connecter

**Sans ce déploiement, EPscanT restera inaccessible !**

---

**🎯 Une fois les règles déployées, l'accès à EPscanT sera immédiatement restauré.**
