# 🚨 FIX CRITIQUE - URL Firebase Database (2026-03-10)

## 🔍 Problème Identifié

Firebase Realtime Database **a migré vers la région europe-west1** mais les fichiers utilisaient encore l'ancienne URL.

### ❌ URL Incorrecte (Ancienne)
```
https://evenpasssenegal-default-rtdb.firebaseio.com/
```

### ✅ URL Correcte (Nouvelle)
```
https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app
```

---

## 📋 Symptômes

```
[FIREBASE WARNING] Database lives in a different region.
Please change your database URL to
https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app
```

**Impact** :
- ⚠️ Connexions lentes (redirections cross-region)
- ⚠️ Warnings dans la console
- ⚠️ Performance dégradée

---

## 🛠️ Correctifs Appliqués

### 1️⃣ Fichier Principal : `src/firebase.ts`
```typescript
const firebaseConfig = {
  databaseURL: 'https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app',
  // ...
};
```
✅ **Déjà correct**

---

### 2️⃣ Configuration Publique : `public/env-config.js`
```javascript
window.__FIREBASE_CONFIG__ = {
  databaseURL: "https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app",
  // ...
};

// Alias pour compatibilité
window.FIREBASE_CONFIG = window.__FIREBASE_CONFIG__;
```
✅ **Corrigé + ajout alias**

---

### 3️⃣ Fichiers HTML Standalone

#### ✅ `public/create-ligne-e.html`
```javascript
const firebaseConfig = window.FIREBASE_CONFIG || {
  databaseURL: "https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app",
  // ...
};
```
✅ **Corrigé**

#### ✅ `public/debug-code-898561-full.html`
```javascript
const firebaseConfig = window.FIREBASE_CONFIG || {
  databaseURL: "https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app",
  // ...
};
```
✅ **Corrigé**

#### ✅ `public/quick-fix-898561.html`
```javascript
const firebaseConfig = {
  databaseURL: "https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app",
  // ...
};
```
✅ **Corrigé** (ancien projet remplacé)

---

### 4️⃣ Configuration Principale

#### `public/epscant-login.html`
```javascript
databaseURL: window.__FIREBASE_CONFIG__?.databaseURL ||
  "https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app"
```
✅ **Déjà correct**

---

## ✅ Vérification Post-Fix

### Test 1 : Vérifier la Configuration
```
URL : /debug-code-898561-full.html
Action : Cliquer "Lancer Diagnostic Complet"
Attendu : Aucun warning Firebase, connexion directe
```

### Test 2 : Login EPscanT
```
URL : /epscant-login.html
Code : 898561
Attendu :
  - ✅ Connexion Firebase sans warning
  - ✅ Authentification réussie
  - ✅ Redirection vers /epscant-transport.html
```

### Test 3 : Création Ligne E
```
URL : /create-ligne-e.html
Action : Cliquer "Créer la Ligne E dans Firebase"
Attendu :
  - ✅ Ligne créée dans transport_lines/
  - ✅ Aucun warning région
```

---

## 📊 Configuration Finale Complète

```javascript
{
  apiKey: "AIzaSyDPsWVCA_Czs64wxiBOqUCSWwbkLMPNjJo",
  authDomain: "evenpasssenegal.firebaseapp.com",
  databaseURL: "https://evenpasssenegal-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "evenpasssenegal",
  storageBucket: "evenpasssenegal.firebasestorage.app",
  messagingSenderId: "882782977052",
  appId: "1:882782977052:web:1f2ea147010066017cf3d9",
  measurementId: "G-FVQTV8TMLJ"
}
```

---

## 🎯 Prochaine Étape

**ÉTAPE 1** - Vérifier configuration :
```
Ouvrir : /debug-code-898561-full.html
Cliquer : "Lancer Diagnostic Complet"
Vérifier : Aucun warning Firebase
```

**ÉTAPE 2** - Créer Ligne E (si nécessaire) :
```
Soit : Depuis diagnostic → "Créer Ligne E"
Soit : URL directe → /create-ligne-e.html
```

**ÉTAPE 3** - Tester Login :
```
URL : /epscant-login.html
Code : 898561
Résultat : ✅ Login réussi sans warning
```

---

## 📝 Notes Importantes

1. ✅ **Tous les fichiers corrigés** utilisent la nouvelle URL europe-west1
2. ✅ **Alias ajouté** : `window.FIREBASE_CONFIG` = `window.__FIREBASE_CONFIG__`
3. ✅ **Build réussi** : 26 fichiers avec injection env
4. ⚠️ **Performance** : Connexions désormais optimales (même région)

---

## 🚀 Build & Déploiement

```bash
npm run build
# ✓ built in 26.29s
# ✓ Copied 7 HTML files from public/ to dist/
# ✓ Env injected in 26 files
```

✅ **Prêt pour déploiement**
