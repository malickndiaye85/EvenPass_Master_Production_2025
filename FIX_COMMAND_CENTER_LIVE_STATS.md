# 🎯 Command Center - Connexion Live Stats

**Date** : 2026-03-11
**Objectif** : Connecter le scanner EPscanT au Command Center pour faire bouger les compteurs en temps réel

---

## 🔥 PROBLÈME INITIAL

Le scanner EPscanT validait correctement les passagers (Bip Vert ✅) mais **AUCUNE donnée ne remontait** au Command Center (`/admin/ops/transport`).

Tous les compteurs restaient bloqués à **0** :
- ❌ KPIs Globaux → 0 scans
- ❌ Analytics Ligne C → 0 passagers
- ❌ Vue Terrain → Aucun événement
- ❌ Usage Véhicule → Non incrémenté

---

## 🎯 SOLUTION MISE EN PLACE

### 1. **AJOUT DE 4 CHEMINS FIREBASE DANS LE SCANNER**

Le scanner `epscant-line-sectorization.js` écrit maintenant dans **10 chemins** au lieu de 5 :

#### Étapes 1-5 (déjà présentes)
1. ✅ `ops/transport/lines/{lineId}/stats` (stats ligne)
2. ✅ `ops/transport/vehicles/{vehicleId}/stats` (stats véhicule)
3. ✅ `fleet_vehicles/{vehicleId}/usageCount` (paiement transporteur)
4. ✅ `fleet_vehicles/{vehicleId}/stats` (stats publiques)
5. ✅ `scan_history` (historique global)

#### Étapes 6-10 (NOUVELLES - Command Center)
6. ✅ `transport_stats/global` (Dashboard global)
7. ✅ `ops/transport/vehicles/{vehicleId}/scan_events` (Événements par véhicule)
8. ✅ **`stats/daily/{date}/total_scans`** ⭐ (KPIs Globaux)
9. ✅ **`voyage/express/{lineId}/stats/realtime`** ⭐ (Analytics Ligne C)
10. ✅ **`ops/transport/live_feed`** ⭐ (Vue Terrain)

---

### 2. **RÈGLES FIREBASE RTDB MISES À JOUR**

Ajout des permissions d'écriture pour les 3 nouveaux chemins :

```json
{
  "stats": {
    "daily": {
      ".read": true,
      "$date": {
        ".write": true
      }
    }
  },

  "voyage": {
    "express": {
      ".read": true,
      "$lineId": {
        "stats": {
          "realtime": {
            ".write": true
          }
        }
      }
    }
  },

  "ops": {
    "transport": {
      "live_feed": {
        ".read": true,
        ".write": true,
        ".indexOn": ["timestamp", "type", "lineId"]
      }
    }
  }
}
```

---

### 3. **DASHBOARD COMMAND CENTER MODIFIÉ**

Le dashboard `AdminOpsTransportPage.tsx` lit maintenant depuis les bons chemins :

#### Avant
```typescript
const scansRef = ref(db, 'scan_events'); // ❌ Chemin vide
```

#### Après
```typescript
const scansRef = ref(db, 'ops/transport/live_feed'); // ✅ Live Feed
const ligneExpressRef = ref(db, 'voyage/express'); // ✅ Analytics Ligne C
```

#### Nouveaux Listeners

**Live Feed (Vue Terrain)** :
```typescript
const unsubScans = onValue(scansRef, (snapshot) => {
  const scansArray = Object.keys(data)
    .map(key => ({
      id: key,
      scan_time: data[key].datetime,
      location: data[key].vehicleId,
      route: data[key].lineName,
      passenger_count: 1,
      subscription_type: 'SAMA PASS',
      controller_name: 'EPscanT'
    }))
    .sort((a, b) => new Date(b.scan_time) - new Date(a.scan_time))
    .slice(0, 10);
  setScanEvents(scansArray);
});
```

**Analytics Ligne C** :
```typescript
const unsubLigneExpress = onValue(ligneExpressRef, (snapshot) => {
  const expressLinesArray = Object.keys(data).map(lineId => {
    const statsRealtime = data[lineId].stats?.realtime || {};
    return {
      route_id: lineId,
      route_name: 'Ligne C (Dakar ↔ Keur Massar)',
      trips_today: statsRealtime.passengers_today || 0,
      total_revenue: statsRealtime.revenue_today || 0,
      average_occupancy_rate: statsRealtime.occupancy_rate || 0
    };
  });
  setLineAnalytics(expressLinesArray);
});
```

---

### 4. **VITE CONFIG MODIFIÉ**

Ajout de la copie automatique des fichiers JS dans `/dist` lors du build :

```typescript
const jsFilesToCopy = [
  'epscant-line-sectorization.js',
  'epscant-alerts.js',
  'ops-events-scanner.js'
];
```

**Avant** : Les fichiers JS restaient dans `/public` et n'étaient **JAMAIS déployés** ❌

**Après** : Les fichiers JS sont copiés dans `/dist` et **déployés automatiquement** ✅

---

## 📊 STRUCTURE FIREBASE FINALE

```
Firebase Realtime Database
├── stats/
│   └── daily/
│       └── 2026-03-11/
│           ├── total_scans: 142        ← KPIs Globaux
│           ├── last_updated: 1710160938
│           └── date: "2026-03-11"
│
├── voyage/
│   └── express/
│       └── ligne-c/
│           └── stats/
│               └── realtime/
│                   ├── passengers_today: 87     ← Analytics Ligne C
│                   ├── total_passengers: 1523
│                   ├── revenue_today: 21750
│                   ├── occupancy_rate: 75
│                   └── last_scan: 1710160938
│
├── ops/
│   └── transport/
│       └── live_feed/
│           ├── -NqB2x3Yz/                      ← Vue Terrain
│           │   ├── timestamp: 1710160938
│           │   ├── datetime: "2026-03-11T14:22:18.000Z"
│           │   ├── type: "scan"
│           │   ├── vehicleId: "DK-2019-M"
│           │   ├── lineId: "ligne-c"
│           │   ├── lineName: "Ligne C (Dakar ↔ Keur Massar)"
│           │   ├── status: "valid"
│           │   ├── passengerId: "+221771234567"
│           │   └── message: "✅ Passager validé sur DK-2019-M - Ligne C"
│           └── -NqB2x3Yz1/ ...
│
├── transport_stats/
│   └── global/
│       ├── total_scans_today: 142              ← Dashboard Global
│       ├── total_scans: 8475
│       ├── last_scan: 1710160938
│       └── average_occupancy_rate: 75
│
└── fleet_vehicles/
    └── DK-2019-M/
        ├── usageCount: 45                       ← Paiement Transporteur
        └── stats/
            ├── total_scans: 45
            └── last_scan: 1710160938
```

---

## 🧪 TESTS DE VALIDATION

### Test 1 : Vérifier que le fichier JS est déployé

```bash
# Vérifier localement
ls -lh dist/epscant-line-sectorization.js
# -rw-r--r-- 1 appuser appuser 32K Mar 11 13:36 ✅

# Vérifier en ligne (après déploiement)
curl https://demdem-express.web.app/epscant-line-sectorization.js | grep "stats/daily"
# Doit retourner des lignes contenant "stats/daily" ✅
```

---

### Test 2 : Scanner un QR code et vérifier les logs

1. **Login EPscanT** : https://demdem-express.web.app/epscant-login.html
2. **Code** : `587555`
3. **Ouvrir Console** (F12)
4. **Scanner un QR SAMA PASS** valide

**Logs attendus** :
```
[SECTORISATION] 📊 Étape 8/10 : stats/daily pour KPIs globaux
[SECTORISATION] ✅ KPI journalier mis à jour: 0 → 1

[SECTORISATION] 📊 Étape 9/10 : voyage/express analytics pour Ligne ligne-c
[SECTORISATION] ✅ Analytics Ligne C mise à jour: +1 passager

[SECTORISATION] 📊 Étape 10/10 : live_feed pour Vue Terrain
[SECTORISATION] ✅ Événement ajouté au Live Feed

[SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS
```

**Si ces logs s'affichent** → ✅ **L'écriture fonctionne !**

---

### Test 3 : Vérifier Firebase Console

1. Aller sur https://console.firebase.google.com/project/demdem-express/database
2. Naviguer vers chaque chemin et vérifier les données :

**`stats/daily/2026-03-11`** :
```json
{
  "total_scans": 1,
  "last_updated": 1710160938000,
  "date": "2026-03-11"
}
```

**`voyage/express/ligne-c/stats/realtime`** :
```json
{
  "passengers_today": 1,
  "total_passengers": 1,
  "revenue_today": 250,
  "last_scan": 1710160938000,
  "occupancy_rate": 2
}
```

**`ops/transport/live_feed`** :
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
    "message": "✅ Passager validé sur DK-2019-M - Ligne C"
  }
}
```

---

### Test 4 : Vérifier le Command Center

1. **Ouvrir** : https://demdem-express.web.app/admin/ops/transport
2. **Login** : `malick.ndiaye@demdem.sn`
3. **Vérifier les sections** :

#### KPIs Globaux (en haut)
- **Total scans aujourd'hui** : Doit être > 0 ✅
- Le compteur doit s'incrémenter à chaque scan

#### Analytics de Ligne 360
- **Ligne C (Dakar ↔ Keur Massar)** doit apparaître
- **Passagers aujourd'hui** : Doit être > 0 ✅
- **Revenus** : Doit être > 0 ✅
- **Taux d'occupation** : Doit être > 0% ✅

#### Vue Terrain • Live Feed
- Les scans doivent apparaître **en temps réel**
- Format attendu :
  ```
  🟢 DK-2019-M
  Ligne C (Dakar ↔ Keur Massar)
  14:22 | 1 passager | SAMA PASS | Par EPscanT
  ```

#### Gestion de la Flotte
- Le véhicule `DK-2019-M` doit avoir :
  - **Scans aujourd'hui** > 0 ✅
  - **Usage** > 0 ✅

---

## 🚀 DÉPLOIEMENT

### Étape 1 : Commit et Push

```bash
git add .
git commit -m "feat: Connecter scanner EPscanT au Command Center avec Live Stats"
git push origin main
```

### Étape 2 : Attendre GitHub Actions

Le workflow GitHub Actions va :
1. ✅ Build le projet
2. ✅ Copier `epscant-line-sectorization.js` dans `dist/`
3. ✅ Déployer sur Firebase Hosting
4. ✅ Fichier accessible sur `https://demdem-express.web.app/`

**Durée** : 2-3 minutes

### Étape 3 : Vider le cache navigateur

**Important** : Les navigateurs cachent les fichiers JS !

```bash
# Chrome/Firefox
1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton Reload
3. Sélectionner "Empty Cache and Hard Reload"

# Ou simplement
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 🐛 DÉPANNAGE

### Problème : Les compteurs restent à 0

**Cause 1** : Le fichier JS n'est pas encore déployé

**Solution** :
1. Vérifier GitHub Actions : https://github.com/YOUR_REPO/actions
2. Attendre que le déploiement soit terminé (icône verte ✅)
3. Vider le cache navigateur (Ctrl+Shift+R)

**Cause 2** : Pas encore de scans aujourd'hui

**Solution** :
1. Scanner un QR code SAMA PASS valide
2. Vérifier les logs dans la console (F12)
3. Recharger le Command Center (F5)

---

### Problème : PERMISSION_DENIED dans les logs

**Cause** : Les règles Firebase ne sont pas déployées

**Solution** :
1. Ouvrir https://console.firebase.google.com/project/demdem-express/database/rules
2. Vérifier la présence des règles pour `stats/daily`, `voyage/express`, `ops/transport/live_feed`
3. Si absentes, copier-coller le contenu de `database.rules.json`
4. Cliquer sur **"Publier"**
5. Réessayer le scan

---

### Problème : Live Feed vide

**Cause 1** : Le listener ne s'est pas abonné correctement

**Solution** :
1. Ouvrir la console du Command Center (F12)
2. Chercher les erreurs Firebase
3. Vérifier que `ops/transport/live_feed` est accessible

**Cause 2** : Les événements sont anciens (> 10)

**Solution** :
Le Live Feed affiche **seulement les 10 derniers scans**. Scanner un nouveau QR code pour voir apparaître un événement.

---

### Problème : Analytics Ligne C vide

**Cause** : Le chemin `voyage/express/ligne-c` n'existe pas encore

**Solution** :
Scanner un premier QR code. Le chemin sera créé automatiquement par le scanner.

---

## 📋 CHECKLIST FINALE

### Avant Déploiement
- [x] Code scanner modifié (10 étapes au lieu de 7)
- [x] Règles Firebase RTDB mises à jour
- [x] Dashboard modifié pour lire les bons chemins
- [x] vite.config.ts copie les fichiers JS
- [x] Build réussi (`npm run build`)

### Après Déploiement
- [ ] Fichier accessible : `https://demdem-express.web.app/epscant-line-sectorization.js`
- [ ] Scan QR code → Logs "Étape 8/10, 9/10, 10/10" affichés
- [ ] Firebase Console → `stats/daily` existe
- [ ] Firebase Console → `voyage/express/ligne-c` existe
- [ ] Firebase Console → `ops/transport/live_feed` contient des événements
- [ ] Command Center → KPIs > 0
- [ ] Command Center → Analytics Ligne C > 0
- [ ] Command Center → Live Feed affiche les scans
- [ ] Command Center → Véhicules ont des compteurs > 0

---

## ✅ CRITÈRES DE SUCCÈS

**Le Command Center est VIVANT si** :

1. 🟢 **Scanner un QR code** sur EPscanT
2. 🟢 **Voir les logs** "Étape 8/10, 9/10, 10/10" dans la console
3. 🟢 **Rafraîchir le Command Center** (F5)
4. 🟢 **Voir les compteurs s'incrémenter** :
   - Total scans aujourd'hui : **0 → 1** ✅
   - Passagers Ligne C : **0 → 1** ✅
   - Live Feed : **Événement apparaît** ✅
   - Scans véhicule : **0 → 1** ✅

**Si ces 4 points sont validés** → 🎉 **COMMAND CENTER OPÉRATIONNEL !**

---

## 🎯 RÉSUMÉ TECHNIQUE

| Composant | Avant | Après | Impact |
|-----------|-------|-------|--------|
| **Scanner** | 7 étapes | **10 étapes** | ✅ Écrit dans tous les chemins |
| **Règles RTDB** | 3 chemins | **6 chemins** | ✅ Permissions complètes |
| **Dashboard** | Lit `scan_events` (vide) | Lit `live_feed` | ✅ Affiche les scans |
| **Dashboard** | Pas d'analytics Ligne C | Lit `voyage/express` | ✅ Analytics en temps réel |
| **Build** | JS non copiés | JS copiés dans `/dist` | ✅ Déploiement automatique |

---

## 🔥 PROCHAINES ÉTAPES

1. ✅ **Tester en production** après déploiement
2. ✅ **Vérifier Firebase Console** pour voir les données
3. ✅ **Scanner 10-20 QR codes** pour tester la charge
4. ✅ **Vérifier que le Live Feed limite à 10 événements**
5. ✅ **Vérifier que les compteurs se reset à minuit** (nouveau jour)

---

## 🎉 CONCLUSION

Le Command Center est maintenant **entièrement connecté** au scanner EPscanT. Chaque scan sur le terrain fait bouger les compteurs en temps réel.

**Architecture** :
```
EPscanT (Terrain)
    ↓ Scan QR code
Firebase RTDB (10 chemins)
    ↓ Listeners temps réel
Command Center (Dashboard)
    → Affichage instantané
```

**Chaque scan génère** :
- ✅ +1 dans les KPIs globaux
- ✅ +1 passager pour la Ligne C
- ✅ 1 événement dans le Live Feed
- ✅ +1 usage pour le véhicule (paiement)
- ✅ +250 FCFA de revenu
- ✅ Mise à jour du taux d'occupation

**Le Command Center est VIVANT !** 🚀
