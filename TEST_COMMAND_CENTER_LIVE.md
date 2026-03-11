# ✅ Test Validation Command Center Live

**Date** : 2026-03-11
**Objectif** : Valider que le Command Center affiche les stats en temps réel

---

## 🎯 SCÉNARIO DE TEST

### Étape 1 : Préparer l'environnement

1. **Ouvrir 2 onglets** dans le navigateur :
   - Onglet 1 : https://demdem-express.web.app/epscant-login.html (Scanner)
   - Onglet 2 : https://demdem-express.web.app/admin/ops/transport (Command Center)

2. **Vider le cache** (IMPORTANT) :
   - Ctrl + Shift + R (Windows/Linux)
   - Cmd + Shift + R (Mac)

3. **Ouvrir la Console** (F12) sur les 2 onglets

---

### Étape 2 : Login Scanner

**Onglet 1** (Scanner) :
1. Entrer le code : `587555`
2. Cliquer sur "Valider"
3. Vérifier dans la console :
   ```
   [SECTORISATION] ✅ Session active chargée
   [SECTORISATION] 🚀 Session de scan démarrée pour le véhicule: DK-2019-M
   ```

---

### Étape 3 : Noter les compteurs AVANT scan

**Onglet 2** (Command Center) :
1. Login : `malick.ndiaye@demdem.sn`
2. Noter les valeurs actuelles :

   ```
   KPIs Globaux :
   - Total scans aujourd'hui : ___

   Analytics Ligne C :
   - Passagers aujourd'hui : ___
   - Revenus : ___

   Vue Terrain :
   - Nombre d'événements : ___

   Véhicule DK-2019-M :
   - Scans aujourd'hui : ___
   ```

---

### Étape 4 : Scanner un QR code SAMA PASS

**Onglet 1** (Scanner) :

**Option A** : Scanner un vrai QR code SAMA PASS

**Option B** : Utiliser un QR code de test
1. Générer un QR sur : https://www.qr-code-generator.com/
2. Contenu : `SAMAPASS-TEST-2026-771234567-LIGNE-C`
3. Scanner le QR code généré

---

### Étape 5 : Vérifier les logs du scanner

**Onglet 1** (Console) :

**Logs attendus** (ordre exact) :
```
[SECTORISATION] 🔍 QR Code détecté : SAMAPASS-...
[SECTORISATION] 📊 Étape 1/10 : Stats de ligne
[SECTORISATION] ✅ Stats de ligne mises à jour
[SECTORISATION] 📊 Étape 2/10 : Stats du véhicule
[SECTORISATION] ✅ Stats du véhicule mises à jour
[SECTORISATION] 📊 Étape 3/10 : fleet_vehicles usageCount
[SECTORISATION] ✅ usageCount incrémenté: 44 → 45
[SECTORISATION] 📊 Étape 4/10 : fleet_vehicles stats publiques
[SECTORISATION] ✅ Stats publiques du véhicule mises à jour
[SECTORISATION] 📊 Étape 5/10 : Journal scan_history
[SECTORISATION] ✅ Scan enregistré dans scan_history
[SECTORISATION] 📊 Étape 6/10 : transport_stats/global (Dashboard)
[SECTORISATION] ✅ Stats globales mises à jour
[SECTORISATION] 📊 Global scans_today: 141 → 142
[SECTORISATION] 📊 Étape 7/10 : scan_events pour le véhicule
[SECTORISATION] ✅ Événement scan créé dans scan_events du véhicule
[SECTORISATION] 📊 Étape 8/10 : stats/daily pour KPIs globaux
[SECTORISATION] ✅ KPI journalier mis à jour: 141 → 142
[SECTORISATION] 📊 Étape 9/10 : voyage/express analytics pour Ligne ligne-c
[SECTORISATION] ✅ Analytics Ligne C mise à jour: +1 passager
[SECTORISATION] 📊 Étape 10/10 : live_feed pour Vue Terrain
[SECTORISATION] ✅ Événement ajouté au Live Feed
[SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS
```

**🚨 Si ces logs ne s'affichent PAS** :
- Le fichier JS n'est pas chargé ou est en cache
- Vider le cache et recharger (Ctrl+Shift+R)
- Vérifier Network tab : `epscant-line-sectorization.js` Status = 200

---

### Étape 6 : Vérifier le Command Center

**Onglet 2** (Recharger F5) :

#### Test 1 : KPIs Globaux
```
Total scans aujourd'hui : [AVANT] → [AVANT + 1] ✅
```
**Si le compteur n'a pas bougé** → ❌ Échec

---

#### Test 2 : Analytics Ligne C

Chercher la carte **"Ligne C (Dakar ↔ Keur Massar)"**

```
Passagers aujourd'hui : [AVANT] → [AVANT + 1] ✅
Revenus : [AVANT] → [AVANT + 250 FCFA] ✅
```

**Si "Ligne C" n'apparaît pas** → ❌ Échec
**Si les compteurs n'ont pas bougé** → ❌ Échec

---

#### Test 3 : Vue Terrain • Live Feed

Un nouvel événement doit apparaître **en haut de la liste** :

```
🟢 DK-2019-M
Ligne C (Dakar ↔ Keur Massar)
14:22 | 1 passager | SAMA PASS | Par EPscanT
```

**Si aucun événement n'apparaît** → ❌ Échec
**Si l'événement apparaît** → ✅ Succès

---

#### Test 4 : Gestion de la Flotte

Chercher le véhicule **"DK-2019-M"** dans le tableau

```
Scans aujourd'hui : [AVANT] → [AVANT + 1] ✅
Usage : [AVANT] → [AVANT + 1] ✅
```

**Si les compteurs n'ont pas bougé** → ❌ Échec

---

### Étape 7 : Vérifier Firebase Console

1. Ouvrir : https://console.firebase.google.com/project/demdem-express/database
2. Vérifier chaque chemin :

#### `stats/daily/2026-03-11`
```json
{
  "total_scans": 142,
  "last_updated": 1710160938000,
  "date": "2026-03-11"
}
```
**Si le chemin n'existe pas** → ❌ Échec

---

#### `voyage/express/ligne-c/stats/realtime`
```json
{
  "passengers_today": 87,
  "total_passengers": 1523,
  "revenue_today": 21750,
  "last_scan": 1710160938000,
  "occupancy_rate": 75
}
```
**Si le chemin n'existe pas** → ❌ Échec

---

#### `ops/transport/live_feed`

Doit contenir des événements avec cette structure :
```json
{
  "-NqB2x3Yz": {
    "timestamp": 1710160938000,
    "datetime": "2026-03-11T14:22:18.000Z",
    "type": "scan",
    "vehicleId": "DK-2019-M",
    "lineId": "ligne-c",
    "lineName": "Ligne C (Dakar ↔ Keur Massar)",
    "status": "valid",
    "passengerId": "+221771234567",
    "message": "✅ Passager validé sur DK-2019-M - Ligne C",
    "occupancyRate": 2
  }
}
```
**Si aucun événement récent** → ❌ Échec

---

#### `transport_stats/global`
```json
{
  "total_scans_today": 142,
  "total_scans": 8475,
  "last_scan": 1710160938000,
  "last_scan_date": "2026-03-11",
  "average_occupancy_rate": 75
}
```
**Si les valeurs ne correspondent pas** → ❌ Échec

---

## 📊 GRILLE DE VALIDATION

| Test | Attendu | Statut | Notes |
|------|---------|--------|-------|
| **Logs scanner (10 étapes)** | ✅ Affiché | ⬜ | |
| **KPIs Globaux +1** | ✅ Incrémenté | ⬜ | |
| **Analytics Ligne C +1** | ✅ Incrémenté | ⬜ | |
| **Live Feed événement** | ✅ Visible | ⬜ | |
| **Véhicule scans +1** | ✅ Incrémenté | ⬜ | |
| **Firebase `stats/daily`** | ✅ Existe | ⬜ | |
| **Firebase `voyage/express`** | ✅ Existe | ⬜ | |
| **Firebase `live_feed`** | ✅ Existe | ⬜ | |

**Validation réussie si** : **8/8 tests sont ✅**

---

## 🐛 DÉPANNAGE RAPIDE

### Problème : Logs scanner OK mais Command Center à 0

**Diagnostic** :
1. Ouvrir Console Command Center (F12)
2. Chercher des erreurs Firebase :
   ```
   PERMISSION_DENIED
   ```

**Solution** :
- Les règles Firebase ne sont pas déployées
- Aller sur https://console.firebase.google.com/project/demdem-express/database/rules
- Copier-coller `database.rules.json`
- Publier

---

### Problème : Aucun log "Étape 8/10, 9/10, 10/10"

**Diagnostic** :
1. Ouvrir Network tab (F12)
2. Chercher `epscant-line-sectorization.js`
3. Vérifier Status Code

**Solution si 304 (cached)** :
- Vider le cache : Ctrl+Shift+R
- Ou désactiver cache : DevTools → Network → "Disable cache"

**Solution si 404** :
- Le fichier n'est pas déployé
- Attendre le déploiement GitHub Actions
- Ou déployer manuellement

---

### Problème : Live Feed vide

**Diagnostic** :
```javascript
// Console Command Center
const db = firebase.database();
db.ref('ops/transport/live_feed').once('value', snap => {
  console.log('Live Feed:', snap.val());
});
```

**Si `null`** :
- Aucun scan n'a encore été fait
- Scanner un QR code

**Si PERMISSION_DENIED** :
- Règles Firebase manquantes
- Ajouter la règle pour `ops/transport/live_feed`

---

### Problème : Analytics Ligne C vide

**Diagnostic** :
```javascript
// Console Command Center
const db = firebase.database();
db.ref('voyage/express/ligne-c').once('value', snap => {
  console.log('Ligne C:', snap.val());
});
```

**Si `null`** :
- Le chemin n'a pas encore été créé
- Scanner un premier QR code

**Si PERMISSION_DENIED** :
- Règles Firebase manquantes
- Ajouter la règle pour `voyage/express`

---

## ✅ CRITÈRES DE SUCCÈS FINAL

Le test est **RÉUSSI** si :

1. ✅ **Scanner** affiche 10 étapes dans les logs
2. ✅ **Command Center** affiche KPIs > 0
3. ✅ **Live Feed** affiche le scan en temps réel
4. ✅ **Analytics Ligne C** affiche les stats
5. ✅ **Firebase Console** contient les 4 chemins

**Si TOUS les critères sont validés** → 🎉 **COMMAND CENTER OPÉRATIONNEL !**

---

## 🚀 TEST DE CHARGE (OPTIONNEL)

Pour tester la performance, scanner **10 QR codes d'affilée** :

1. Scanner 10 fois de suite
2. Vérifier que **tous les logs s'affichent**
3. Recharger Command Center (F5)
4. Vérifier que **tous les compteurs ont bien +10**

**Résultat attendu** :
- KPIs : +10 scans ✅
- Ligne C : +10 passagers ✅
- Live Feed : 10 nouveaux événements ✅
- Véhicule : +10 scans ✅

**Si un seul compteur est décalé** → ❌ Perte de données
**Si tous les compteurs sont corrects** → ✅ Performance OK

---

## 📝 RAPPORT DE TEST

**Date** : ___________
**Testeur** : ___________

**Environnement** :
- URL Scanner : https://demdem-express.web.app/epscant-login.html
- URL Command Center : https://demdem-express.web.app/admin/ops/transport
- Code véhicule : 587555
- QR code testé : ___________

**Résultats** :
- [ ] Logs 10 étapes affichés
- [ ] KPIs incrémentés
- [ ] Analytics Ligne C fonctionnelle
- [ ] Live Feed affiche les scans
- [ ] Véhicule compteurs à jour
- [ ] Firebase Console OK

**Statut final** : ⬜ RÉUSSI / ⬜ ÉCHEC

**Notes** :
___________________________________________
___________________________________________
___________________________________________
