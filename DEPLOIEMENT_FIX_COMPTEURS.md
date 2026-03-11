# 🚀 Déploiement Fix Compteurs EPscanT

**Date** : 2026-03-11
**Fichiers modifiés** :
- ✅ `public/epscant-line-sectorization.js` (ajout écriture stats globales)
- ✅ `database.rules.json` (permissions Firebase RTDB)
- ✅ `vite.config.ts` (copie des fichiers JS dans dist)
- ✅ Build réussi ✓

---

## 🎯 CE QUI A ÉTÉ CORRIGÉ

Le problème était que le fichier `epscant-line-sectorization.js` n'était **PAS copié dans `/dist`** lors du build, donc les modifications n'étaient **JAMAIS déployées** !

### Avant

```
npm run build
→ dist/
  ├── index.html ✅
  ├── controller-login.html ✅
  ├── epscant-transport.html ✅
  └── epscant-line-sectorization.js ❌ MANQUANT
```

### Après

```
npm run build
→ dist/
  ├── index.html ✅
  ├── controller-login.html ✅
  ├── epscant-transport.html ✅
  └── epscant-line-sectorization.js ✅ PRÉSENT
```

---

## ✅ ACTIONS DÉJÀ FAITES

1. ✅ Ajout de l'écriture dans `transport_stats/global` (étape 6/7)
2. ✅ Ajout de l'écriture dans `scan_events` (étape 7/7)
3. ✅ Mise à jour des règles Firebase RTDB
4. ✅ Modification de `vite.config.ts` pour copier les fichiers JS
5. ✅ Build réussi avec copie des 10 fichiers HTML/JS

---

## 🚀 DÉPLOIEMENT

### Option 1 : Via GitHub Actions (RECOMMANDÉ)

Le workflow GitHub Actions déploie automatiquement sur demdem-express.web.app

```bash
# Commit et push
git add .
git commit -m "fix: Copier fichiers JS EPscanT dans dist pour déploiement"
git push origin main
```

**Résultat attendu** :
- GitHub Actions build le projet
- Copie automatique de `epscant-line-sectorization.js` dans `dist/`
- Déploiement sur Firebase Hosting
- Fichier accessible sur `https://demdem-express.web.app/epscant-line-sectorization.js`

---

### Option 2 : Déploiement Manuel

Si tu veux déployer manuellement via Firebase Console :

1. **Build local** (déjà fait ✅)
   ```bash
   npm run build
   ```

2. **Vérifier que le fichier est dans dist**
   ```bash
   ls -lh dist/epscant-line-sectorization.js
   # -rw-r--r-- 1 appuser appuser 32K Mar 11 13:36 dist/epscant-line-sectorization.js
   ```

3. **Uploader manuellement sur Firebase Hosting**
   - Aller sur https://console.firebase.google.com/project/demdem-express/hosting
   - Cliquer sur "Hosting" → "Release & manage"
   - Uploader le contenu du dossier `dist/`

---

## 🧪 TESTS APRÈS DÉPLOIEMENT

### Test 1 : Vérifier que le fichier JS est accessible

1. Ouvrir https://demdem-express.web.app/epscant-line-sectorization.js
2. Chercher `transport_stats/global` dans le code
3. Si visible → ✅ Fichier bien déployé
4. Si 404 → ❌ Fichier non déployé, refaire le déploiement

---

### Test 2 : Scanner et vérifier les logs

1. Login EPscanT : https://demdem-express.web.app/epscant-login.html
2. Code : **587555**
3. Ouvrir Console (F12)
4. Scanner un QR code SAMA PASS valide
5. Chercher dans les logs :

   ```
   [SECTORISATION] 📊 Étape 6/7 : transport_stats/global (Dashboard)
   [SECTORISATION] ✅ Stats globales mises à jour
   [SECTORISATION] 📊 Global scans_today: 0 → 1
   [SECTORISATION] 📊 Étape 7/7 : scan_events pour le véhicule
   [SECTORISATION] ✅ Événement scan créé dans scan_events du véhicule
   [SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS
   ```

6. **Si tu vois ces logs** → ✅ Le code fonctionne !
7. **Si tu ne les vois pas** → Le fichier JS n'est pas chargé ou en cache

---

### Test 3 : Vérifier Firebase Console

1. Aller sur https://console.firebase.google.com/project/demdem-express/database/demdem-express-default-rtdb/data
2. Naviguer vers `transport_stats/global`
3. Vérifier la présence de :
   ```javascript
   {
     total_scans_today: 1,
     total_scans: 1,
     last_scan: 1710160938000,
     last_scan_date: "2026-03-11",
     average_occupancy_rate: 2
   }
   ```

4. Naviguer vers `ops/transport/vehicles/DK-2019-M/scan_events`
5. Vérifier la présence d'événements avec `scanStatus: "valid"`

---

### Test 4 : Vérifier le Dashboard

1. Aller sur https://demdem-express.web.app/admin/ops/transport
2. Vérifier que **Total scans aujourd'hui** n'est plus à 0
3. Vérifier que les stats par véhicule s'affichent
4. Scanner un nouveau QR code
5. Vérifier que le compteur s'incrémente en temps réel

---

## 🐛 DÉPANNAGE

### Problème : Le fichier JS est toujours en 404

**Cause** : Le déploiement n'a pas encore été fait ou le cache navigateur

**Solutions** :
1. Attendre que GitHub Actions termine le déploiement (2-3 minutes)
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Vérifier que le commit a bien été pushé sur `main`
4. Vérifier les logs GitHub Actions : https://github.com/YOUR_REPO/actions

---

### Problème : Les logs ne s'affichent pas

**Cause 1** : Ancien fichier JS en cache

**Solution** :
```bash
# Vider complètement le cache
1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton Reload
3. Sélectionner "Empty Cache and Hard Reload"
```

**Cause 2** : Le fichier n'est pas chargé dans la page

**Solution** :
```bash
# Vérifier dans la console Network
1. Ouvrir DevTools → Network
2. Recharger la page
3. Chercher "epscant-line-sectorization.js"
4. Vérifier Status Code = 200 (et pas 304 ou 404)
```

---

### Problème : PERMISSION_DENIED dans les logs

**Cause** : Les règles Firebase RTDB ne sont pas déployées

**Solution** :
1. Aller sur https://console.firebase.google.com/project/demdem-express/database/demdem-express-default-rtdb/rules
2. Vérifier la présence de :
   ```json
   "transport_stats": {
     "global": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. Si absent, copier-coller le contenu de `database.rules.json`
4. Cliquer sur "Publier"
5. Réessayer le scan

---

### Problème : Compteurs toujours à 0 après scan

**Cause 1** : Pas de scans encore enregistrés aujourd'hui

**Solution** : Scanner un QR code SAMA PASS valide et vérifier les logs

**Cause 2** : Le dashboard lit depuis un autre chemin

**Solution** :
```javascript
// Vérifier dans la console du dashboard
console.log(await get(ref(rtdb, 'transport_stats/global')));
// Doit retourner { total_scans_today: X, ... }
```

**Cause 3** : Date de reset (nouveau jour)

**Solution** : Les compteurs `scans_today` se reset automatiquement. Vérifier `total_scans` qui ne se reset jamais.

---

## 📋 CHECKLIST FINALE

### Avant Déploiement

- [x] Code modifié dans `epscant-line-sectorization.js`
- [x] Règles Firebase mises à jour dans `database.rules.json`
- [x] `vite.config.ts` modifié pour copier les fichiers JS
- [x] Build réussi (`npm run build`)
- [x] Fichier présent dans `dist/` (32 KB)

### Après Déploiement

- [ ] Fichier accessible sur `https://demdem-express.web.app/epscant-line-sectorization.js`
- [ ] Logs affichent "Étape 6/7 : transport_stats/global"
- [ ] `transport_stats/global` existe dans Firebase
- [ ] `scan_events` contient des événements
- [ ] Dashboard affiche les compteurs
- [ ] Les compteurs s'incrémentent à chaque scan

---

## 🎯 RÉSUMÉ

**Problème initial** : Les fichiers JS n'étaient pas copiés dans `/dist` lors du build, donc jamais déployés.

**Solution** : Modification de `vite.config.ts` pour copier automatiquement les fichiers JS critiques.

**Fichiers copiés maintenant** :
- `epscant-line-sectorization.js` (validation + stats)
- `epscant-alerts.js` (alertes audio/tactiles)
- `ops-events-scanner.js` (scanner événements)

**Prochaine étape** : Commit + Push → GitHub Actions déploie automatiquement → Tests

---

## ✅ VALIDATION

**Critère de succès** : Scanner un QR code et voir dans les logs :
```
[SECTORISATION] 📊 Global scans_today: 0 → 1
[SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS
```

**Si ce log s'affiche** → 🎉 **FIX VALIDÉ ET OPÉRATIONNEL !**
