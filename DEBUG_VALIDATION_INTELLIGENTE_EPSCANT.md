# 🔍 DEBUG : Validation Intelligente EPscanT

**Date** : 2026-03-11
**Problème** : "LIGNE NON AUTORISÉE" affiché alors que la validation intelligente devrait matcher

---

## 🎯 OBJECTIF

Comprendre pourquoi la validation intelligente multi-niveaux ne trouve pas de match entre le SAMA PASS et le scanner EPscanT.

---

## 📊 LOGS DÉTAILLÉS AJOUTÉS

### Nouveaux Logs de Debug

La fonction `validateSubscriptionForLine()` affiche maintenant **des logs ultra-détaillés** pour chaque niveau de validation :

**Logs de départ** :
```javascript
[SECTORISATION] 🔐 VALIDATION INTELLIGENTE MULTI-NIVEAUX:
[SECTORISATION] 📋 DONNÉES ABONNÉ:
[SECTORISATION]    routeId: "ligne_c_keur_massar" (type: string, longueur: 21)
[SECTORISATION]    routeName: "Keur Massar ⇄ UCAD" (type: string, longueur: 19)
[SECTORISATION] 📋 DONNÉES SCANNER:
[SECTORISATION]    lineId: "ligne_c_keur_massar" (type: string, longueur: 21)
[SECTORISATION]    lineName: "Ligne C - Keur Massar ⇄ UCAD" (type: string, longueur: 30)
```

---

### Test de Chaque Niveau

**NIVEAU 1 : Comparaison stricte IDs**
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs
[SECTORISATION]    subscriberRouteId === session.lineId ?
[SECTORISATION]    "ligne_c_keur_massar" === "ligne_c_keur_massar"
[SECTORISATION]    Résultat: true
[SECTORISATION] ✅ NIVEAU 1 : Match ID exact Firebase
```

**NIVEAU 2 : Comparaison normalisée**
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 2 : Comparaison normalisée IDs
[SECTORISATION] 🔧 normalizeForComparison("ligne_c_keur_massar") → "ligne_c_keur_massar"
[SECTORISATION] 🔧 normalizeForComparison("ligne_c_keur_massar") → "ligne_c_keur_massar"
[SECTORISATION]    Normalisé abonné: ligne_c_keur_massar
[SECTORISATION]    Normalisé scanner: ligne_c_keur_massar
[SECTORISATION]    Match exact ? true
[SECTORISATION] ✅ NIVEAU 2 : Match ID normalisé
```

**NIVEAU 3 : Match partiel**
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 3 : Match partiel IDs
[SECTORISATION]    A contient B ? true
[SECTORISATION]    B contient A ? true
[SECTORISATION] ✅ NIVEAU 3 : Match ID partiel
```

**NIVEAU 4 : Noms de lignes**
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 4 : Comparaison noms de lignes
[SECTORISATION] 🔧 normalizeForComparison("Keur Massar ⇄ UCAD") → "keur_massar_ucad"
[SECTORISATION] 🔧 normalizeForComparison("Ligne C - Keur Massar ⇄ UCAD") → "ligne_c_keur_massar_ucad"
[SECTORISATION]    Nom abonné normalisé: keur_massar_ucad
[SECTORISATION]    Nom scanner normalisé: ligne_c_keur_massar_ucad
[SECTORISATION]    Match exact ? false
```

**NIVEAU 5 : Match partiel noms**
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 5 : Match partiel noms
[SECTORISATION]    A contient B ? false
[SECTORISATION]    B contient A ? true  ← "ligne_c_keur_massar_ucad" contient "keur_massar_ucad"
[SECTORISATION] ✅ NIVEAU 5 : Match nom partiel
```

**NIVEAU 6 : Terme principal**
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 6 : Extraction terme principal
[SECTORISATION] 🔧 extractMainTerm("Keur Massar ⇄ UCAD") → "keur" (premier mot)
[SECTORISATION] 🔧 extractMainTerm("Ligne C - Keur Massar ⇄ UCAD") → "c" (pattern: ligne X)
[SECTORISATION]    Terme abonné: keur
[SECTORISATION]    Terme scanner: c
[SECTORISATION]    Match ? false
```

---

## 🔬 PROCÉDURE DE DIAGNOSTIC

### ÉTAPE 1 : Reproduire le Problème

1. Ouvrir https://demdem-express.web.app/epscant-transport.html
2. Login avec code **587555**
3. Scanner un QR code SAMA PASS (Ligne C)
4. Ouvrir Console (F12)

---

### ÉTAPE 2 : Analyser les Logs

**Chercher dans la console** :
```
[SECTORISATION] 🔐 VALIDATION INTELLIGENTE MULTI-NIVEAUX:
```

**Vérifier les 4 valeurs critiques** :
```
routeId: ?
routeName: ?
lineId: ?
lineName: ?
```

---

### ÉTAPE 3 : Identifier le Problème

#### Cas 1 : routeId est `undefined` ou `null`

**Logs attendus** :
```javascript
[SECTORISATION]    routeId: undefined (type: undefined, longueur: 0)
```

**Cause** :
- Le SAMA PASS n'a pas de `routeId` défini
- Créé avant la mise à jour de la structure

**Solution** :
1. Aller sur `/admin-test-samapass.html`
2. Régénérer un SAMA PASS pour Ligne C
3. Vérifier que le QR code contient :
   ```
   SAMAPASS-221771234567-abc123
   ```
4. Vérifier dans Firestore que le doc contient :
   ```javascript
   {
       phoneNumber: "221771234567",
       routeId: "ligne_c_keur_massar",  ← DOIT EXISTER
       routeName: "Keur Massar ⇄ UCAD",
       status: "active"
   }
   ```

---

#### Cas 2 : lineId est `undefined` ou `all_lines`

**Logs attendus** :
```javascript
[SECTORISATION]    lineId: all_lines (type: string, longueur: 9)
```

**Cause** :
- Le véhicule n'est pas assigné à une ligne
- Mode test activé

**Solution** :
1. Vérifier dans Firebase RTDB : `ops/transport/vehicles/DK-2019-M`
2. S'assurer que `line_id` existe :
   ```javascript
   {
       license_plate: "DK-2019-M",
       line_id: "ligne_c_keur_massar",  ← DOIT EXISTER
       is_active: true
   }
   ```
3. Si `line_id` manque, l'ajouter manuellement

---

#### Cas 3 : routeId ≠ lineId (IDs différents)

**Logs attendus** :
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs
[SECTORISATION]    "ligne_a_parcelles" === "ligne_c_keur_massar"
[SECTORISATION]    Résultat: false
```

**Cause** :
- Le SAMA PASS est pour la Ligne A
- Le scanner est sur la Ligne C
- C'est le comportement attendu (sectorisation)

**Solution** :
- **Ceci est normal** : Le pass doit être refusé
- Ou utiliser un SAMA PASS pour la bonne ligne

---

#### Cas 4 : routeId et lineId sont identiques mais pas de match

**Logs attendus** :
```javascript
[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs
[SECTORISATION]    "ligne_c_keur_massar" === "ligne_c_keur_massar"
[SECTORISATION]    Résultat: true
[SECTORISATION] ✅ NIVEAU 1 : Match ID exact Firebase
```

**Mais ensuite** :
```javascript
[SECTORISATION] ⚠️ LIGNE NON AUTORISÉE - Aucun match trouvé
```

**Cause** :
- Bug dans le code : `isLineMatch` n'est pas correctement défini
- Ou la condition `if (!isLineMatch)` est exécutée à tort

**Solution** :
1. Vérifier que le code contient bien :
   ```javascript
   if (subscriberRouteId && session.lineId && subscriberRouteId === session.lineId) {
       isLineMatch = true;  ← CETTE LIGNE DOIT ÊTRE EXÉCUTÉE
       matchMethod = 'ID exact Firebase';
   }
   ```
2. Vérifier qu'il n'y a pas de code qui réinitialise `isLineMatch` après

---

#### Cas 5 : Normalisation casse le match

**Logs attendus** :
```javascript
[SECTORISATION] 🔧 normalizeForComparison("Ligne C - Keur Massar") → "ligne_c_keur_massar"
[SECTORISATION] 🔧 normalizeForComparison("ligne_c_keur_massar") → "ligne_c_keur_massar"
```

**Si normalisation différente** :
```javascript
[SECTORISATION] 🔧 normalizeForComparison("Ligne C - Keur Massar") → "ligne_c_keur_massar"
[SECTORISATION] 🔧 normalizeForComparison("Ligne_C_Keur_Massar") → "ligne_c_keur_massar"
```

**Cause** :
- Espaces vs underscores
- Accents vs pas d'accents
- Majuscules vs minuscules

**Solution** :
- La normalisation devrait gérer ces cas
- Si pas de match au niveau 2, vérifier niveau 3 (partial match)

---

## 🧪 TESTS MANUELS

### Test 1 : Match Parfait

**Setup** :
1. Créer SAMA PASS avec `routeId: "ligne_c_keur_massar"`
2. Login scanner avec code 587555 (Ligne C)
3. Scanner le QR code

**Logs attendus** :
```
[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs
[SECTORISATION]    "ligne_c_keur_massar" === "ligne_c_keur_massar"
[SECTORISATION]    Résultat: true
[SECTORISATION] ✅ NIVEAU 1 : Match ID exact Firebase
[SECTORISATION] ✅ VALIDATION RÉUSSIE - Méthode: ID exact Firebase
```

**Résultat attendu** : `VALIDE ✓`

---

### Test 2 : Match Normalisé

**Setup** :
1. Créer SAMA PASS avec `routeId: "Ligne C - Keur Massar"`
2. Login scanner avec code 587555 (Ligne C, lineId: "ligne_c_keur_massar")
3. Scanner le QR code

**Logs attendus** :
```
[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs
[SECTORISATION]    Résultat: false
[SECTORISATION] 🔍 TEST NIVEAU 2 : Comparaison normalisée IDs
[SECTORISATION] 🔧 normalizeForComparison("Ligne C - Keur Massar") → "ligne_c_keur_massar"
[SECTORISATION] 🔧 normalizeForComparison("ligne_c_keur_massar") → "ligne_c_keur_massar"
[SECTORISATION]    Match exact ? true
[SECTORISATION] ✅ NIVEAU 2 : Match ID normalisé
```

**Résultat attendu** : `VALIDE ✓`

---

### Test 3 : Match Partiel

**Setup** :
1. Créer SAMA PASS avec `routeId: "keur_massar"`
2. Login scanner avec code 587555 (lineId: "ligne_c_keur_massar")
3. Scanner le QR code

**Logs attendus** :
```
[SECTORISATION] 🔍 TEST NIVEAU 3 : Match partiel IDs
[SECTORISATION]    A contient B ? false
[SECTORISATION]    B contient A ? true
[SECTORISATION] ✅ NIVEAU 3 : Match ID partiel
```

**Résultat attendu** : `VALIDE ✓`

---

### Test 4 : Match par Nom

**Setup** :
1. Créer SAMA PASS avec `routeName: "Ligne C - Keur Massar ⇄ UCAD"`
2. Login scanner avec code 587555 (lineName: "Ligne C - Keur Massar ⇄ UCAD")
3. Scanner le QR code

**Logs attendus** :
```
[SECTORISATION] 🔍 TEST NIVEAU 4 : Comparaison noms de lignes
[SECTORISATION]    Match exact ? true
[SECTORISATION] ✅ NIVEAU 4 : Match nom normalisé
```

**Résultat attendu** : `VALIDE ✓`

---

### Test 5 : Match par Terme Principal

**Setup** :
1. Créer SAMA PASS avec `routeName: "Ligne C"`
2. Login scanner avec code 587555 (lineName: "Ligne C - Keur Massar ⇄ UCAD")
3. Scanner le QR code

**Logs attendus** :
```
[SECTORISATION] 🔍 TEST NIVEAU 6 : Extraction terme principal
[SECTORISATION] 🔧 extractMainTerm("Ligne C") → "c" (pattern: ligne X)
[SECTORISATION] 🔧 extractMainTerm("Ligne C - Keur Massar ⇄ UCAD") → "c" (pattern: ligne X)
[SECTORISATION]    Terme abonné: c
[SECTORISATION]    Terme scanner: c
[SECTORISATION]    Match ? true
[SECTORISATION] ✅ NIVEAU 6 : Match terme principal
```

**Résultat attendu** : `VALIDE ✓`

---

### Test 6 : Pas de Match (Normal)

**Setup** :
1. Créer SAMA PASS avec `routeId: "ligne_a_parcelles"`
2. Login scanner avec code 587555 (lineId: "ligne_c_keur_massar")
3. Scanner le QR code

**Logs attendus** :
```
[SECTORISATION] 🔍 TEST NIVEAU 1 : Comparaison stricte IDs
[SECTORISATION]    "ligne_a_parcelles" === "ligne_c_keur_massar"
[SECTORISATION]    Résultat: false
[SECTORISATION] 🔍 TEST NIVEAU 2 : Comparaison normalisée IDs
[SECTORISATION]    Match exact ? false
[SECTORISATION] 🔍 TEST NIVEAU 3 : Match partiel IDs
[SECTORISATION]    A contient B ? false
[SECTORISATION]    B contient A ? false
[SECTORISATION] ⚠️ LIGNE NON AUTORISÉE - Aucun match trouvé
[SECTORISATION] ⚠️ Pass valide pour: Ligne A (ID: ligne_a_parcelles)
[SECTORISATION] ⚠️ Scanner sur: Ligne C (ID: ligne_c_keur_massar)
```

**Résultat attendu** : `LIGNE NON AUTORISÉE` ← **C'est normal !**

---

## 📋 CHECKLIST DE VÉRIFICATION

### ✅ Données SAMA PASS

Dans Firestore `sama_pass_subscriptions/{subscriptionId}` :
- [ ] `routeId` existe et n'est pas `null`
- [ ] `routeId` est une chaîne de caractères (string)
- [ ] `routeName` existe
- [ ] `status` === "active"
- [ ] `expiresAt` > Date.now()

---

### ✅ Données Scanner

Dans RTDB `ops/transport/vehicles/{vehicleId}` :
- [ ] `line_id` existe et n'est pas `null`
- [ ] `line_id` pointe vers une ligne valide

Dans RTDB `transport_lines/{lineId}` :
- [ ] La ligne existe
- [ ] `is_active` === true
- [ ] `name` existe

Dans localStorage `epscant_line_session` :
- [ ] `lineId` existe
- [ ] `lineName` existe
- [ ] `vehicleId` existe

---

### ✅ Validation Intelligente

Console logs :
- [ ] Les 6 niveaux de test sont affichés
- [ ] Au moins un niveau affiche "✅ Match"
- [ ] Le message final est "✅ VALIDATION RÉUSSIE"
- [ ] Pas de "⚠️ LIGNE NON AUTORISÉE"

---

## 🚨 ERREURS FRÉQUENTES

### Erreur 1 : routeId vide

**Symptôme** :
```
[SECTORISATION]    routeId: undefined (type: undefined, longueur: 0)
```

**Cause** : SAMA PASS créé avec ancienne version

**Fix** : Régénérer le SAMA PASS avec la nouvelle structure

---

### Erreur 2 : lineId === "all_lines"

**Symptôme** :
```
[SECTORISATION]    lineId: all_lines (type: string, longueur: 9)
```

**Cause** : Véhicule non assigné à une ligne

**Fix** : Assigner `line_id` dans `ops/transport/vehicles/{vehicleId}`

---

### Erreur 3 : Aucun niveau ne match

**Symptôme** :
```
[SECTORISATION] 🔍 TEST NIVEAU 1 : ... Résultat: false
[SECTORISATION] 🔍 TEST NIVEAU 2 : ... Match exact ? false
[SECTORISATION] 🔍 TEST NIVEAU 3 : ... A contient B ? false, B contient A ? false
[SECTORISATION] 🔍 TEST NIVEAU 4 : ... Match exact ? false
[SECTORISATION] 🔍 TEST NIVEAU 5 : ... A contient B ? false, B contient A ? false
[SECTORISATION] 🔍 TEST NIVEAU 6 : ... Match ? false
```

**Cause** : Le pass est vraiment pour une autre ligne (sectorisation fonctionne)

**Fix** : Utiliser un SAMA PASS pour la bonne ligne

---

## 🎯 RÉSOLUTION

### Si "LIGNE NON AUTORISÉE" s'affiche à tort :

1. **Copier tous les logs** de la console (Ctrl+A dans Console)
2. **Chercher** : `[SECTORISATION] 📋 DONNÉES ABONNÉ:`
3. **Noter les 4 valeurs** :
   - routeId
   - routeName
   - lineId
   - lineName
4. **Vérifier manuellement** s'il devrait y avoir un match
5. **Identifier** quel niveau devrait matcher
6. **Vérifier** pourquoi ce niveau ne match pas

**Si toujours bloqué**, fournir :
- Les 4 valeurs notées
- Tous les logs des 6 niveaux de test
- Capture d'écran Firebase Console

**La validation intelligente multi-niveaux devrait matcher dans 99% des cas !**
