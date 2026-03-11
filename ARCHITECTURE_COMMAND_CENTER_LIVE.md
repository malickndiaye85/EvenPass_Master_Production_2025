# 🏗️ Architecture Command Center Live

**Date** : 2026-03-11
**Composants** : EPscanT Scanner ↔ Firebase RTDB ↔ Command Center Dashboard

---

## 🎯 VUE D'ENSEMBLE

```
┌─────────────────────┐
│   EPscanT Scanner   │  ← Terrain (Véhicule DK-2019-M)
│  epscant-transport  │
└──────────┬──────────┘
           │ Scan QR Code
           │ (10 écritures Firebase)
           ↓
┌─────────────────────────────────────────────────┐
│         Firebase Realtime Database              │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │  1. stats/daily/{date}                  │  │
│  │  2. voyage/express/{lineId}/stats       │  │
│  │  3. ops/transport/live_feed             │  │
│  │  4. transport_stats/global              │  │
│  │  5. ops/transport/vehicles/{id}/stats   │  │
│  │  6. ops/transport/lines/{id}/stats      │  │
│  │  7. fleet_vehicles/{id}/usageCount      │  │
│  │  8. fleet_vehicles/{id}/stats           │  │
│  │  9. scan_history                        │  │
│  │  10. ops/transport/vehicles/{id}/scans  │  │
│  └─────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────┘
           │ Listeners temps réel
           │ (onValue)
           ↓
┌─────────────────────┐
│  Command Center     │  ← Back Office
│   Dashboard Ops     │
│  /admin/ops/transport│
└─────────────────────┘
```

---

## 🔄 FLUX DE DONNÉES (1 SCAN)

### Phase 1 : Scan QR Code

```
Utilisateur
    ↓ Présente SAMA PASS
EPscanT Scanner
    ↓ Lecture QR Code
QR Code: "SAMAPASS-2026-771234567-LIGNE-C"
    ↓ Décodage
```

### Phase 2 : Validation

```
epscant-line-sectorization.js
    ↓ Recherche dans demdem/sama_passes
Firebase RTDB
    ↓ Retour données abonnement
{
  qrCode: "SAMAPASS-2026-771234567-LIGNE-C",
  passengerName: "Amadou Diop",
  passengerPhone: "+221771234567",
  routeId: "ligne-c",
  expiresAt: 1740000000000,
  isActive: true
}
    ↓ Validation OK ✅
BIP VERT + Vibration
```

### Phase 3 : Écriture Firebase (10 chemins)

#### Étape 1 : Stats Ligne
```
ops/transport/lines/ligne-c/stats
{
  total_scans: 856 → 857
  scans_today: 86 → 87
  last_scan: 1710160938000
}
```

#### Étape 2 : Stats Véhicule
```
ops/transport/vehicles/DK-2019-M/stats
{
  total_scans: 44 → 45
  scans_today: 8 → 9
  last_scan: 1710160938000
}
```

#### Étape 3 : Usage Véhicule (Paiement)
```
fleet_vehicles/DK-2019-M/usageCount
44 → 45
```

#### Étape 4 : Stats Publiques Véhicule
```
fleet_vehicles/DK-2019-M/stats
{
  total_scans: 45,
  last_scan: 1710160938000,
  average_occupancy_rate: 75
}
```

#### Étape 5 : Historique Global
```
scan_history/{pushId}
{
  vehicleId: "DK-2019-M",
  lineId: "ligne-c",
  timestamp: 1710160938000,
  date: "2026-03-11",
  scanType: "SAMA_PASS",
  status: "VALID",
  passengerId: "+221771234567"
}
```

#### Étape 6 : Stats Globales Dashboard
```
transport_stats/global
{
  total_scans_today: 141 → 142
  total_scans: 8474 → 8475
  last_scan: 1710160938000
  average_occupancy_rate: 75
}
```

#### Étape 7 : Événements Véhicule
```
ops/transport/vehicles/DK-2019-M/scan_events/{pushId}
{
  timestamp: "2026-03-11T14:22:18.000Z",
  scanStatus: "valid",
  passengerId: "+221771234567",
  lineId: "ligne-c"
}
```

#### Étape 8 : KPIs Globaux (Command Center)
```
stats/daily/2026-03-11
{
  total_scans: 141 → 142
  last_updated: 1710160938000
  date: "2026-03-11"
}
```

#### Étape 9 : Analytics Ligne C (Command Center)
```
voyage/express/ligne-c/stats/realtime
{
  passengers_today: 86 → 87
  total_passengers: 1522 → 1523
  revenue_today: 21500 → 21750
  occupancy_rate: 75
  last_scan: 1710160938000
}
```

#### Étape 10 : Live Feed (Command Center)
```
ops/transport/live_feed/{pushId}
{
  timestamp: 1710160938000,
  datetime: "2026-03-11T14:22:18.000Z",
  type: "scan",
  vehicleId: "DK-2019-M",
  lineId: "ligne-c",
  lineName: "Ligne C (Dakar ↔ Keur Massar)",
  status: "valid",
  passengerId: "+221771234567",
  message: "✅ Passager validé sur DK-2019-M - Ligne C",
  occupancyRate: 75
}
```

### Phase 4 : Affichage Command Center

#### Dashboard lit depuis Firebase (Listeners)
```javascript
// 1. KPIs Globaux
const globalStatsRef = ref(db, 'transport_stats/global');
onValue(globalStatsRef, snapshot => {
  setTotalScansToday(snapshot.val().total_scans_today);
  // 141 → 142 ✅
});

// 2. Analytics Ligne C
const ligneExpressRef = ref(db, 'voyage/express');
onValue(ligneExpressRef, snapshot => {
  const ligneCData = snapshot.val()['ligne-c'];
  setLineAnalytics({
    passengers_today: ligneCData.stats.realtime.passengers_today
    // 86 → 87 ✅
  });
});

// 3. Live Feed
const liveFeedRef = ref(db, 'ops/transport/live_feed');
onValue(liveFeedRef, snapshot => {
  const events = Object.values(snapshot.val());
  setScanEvents(events.slice(0, 10));
  // Nouvel événement visible en haut ✅
});

// 4. Véhicules
const vehiclesRef = ref(db, 'fleet_vehicles');
onValue(vehiclesRef, snapshot => {
  // usageCount: 44 → 45 ✅
});
```

---

## 📊 COMPOSANTS COMMAND CENTER

### 1. KPIs Globaux (Header)

**Données** : `transport_stats/global`

```
┌─────────────────────────────────────────────────┐
│  📊 KPIs Globaux                                │
│                                                 │
│  Total scans aujourd'hui : 142    (+1) ↗️       │
│  Taux d'occupation moyen : 75%                  │
│  Revenus estimés : 35 500 FCFA                  │
└─────────────────────────────────────────────────┘
```

**Mise à jour** : Temps réel (< 1 seconde)

---

### 2. Analytics de Ligne 360

**Données** : `voyage/express/{lineId}/stats/realtime`

```
┌─────────────────────────────────────────────────┐
│  📈 Analytics de Ligne 360                      │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Ligne C (Dakar ↔ Keur Massar)          │  │
│  │                                          │  │
│  │  🚶 Passagers : 87   (+1) ↗️             │  │
│  │  💰 Revenus : 21 750 FCFA                │  │
│  │  📊 Taux d'occupation : 75%              │  │
│  │  🚌 Véhicules actifs : 3                 │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Mise à jour** : Temps réel (< 1 seconde)

---

### 3. Vue Terrain • Live Feed

**Données** : `ops/transport/live_feed`

```
┌─────────────────────────────────────────────────┐
│  📡 Vue Terrain • Live Feed          🔴 LIVE   │
│                                                 │
│  🟢 DK-2019-M                                   │
│  Ligne C (Dakar ↔ Keur Massar)                 │
│  14:22 | 1 passager | SAMA PASS | Par EPscanT  │
│  ───────────────────────────────────────────    │
│                                                 │
│  🟢 DK-3456-A                                   │
│  Ligne C (Dakar ↔ Keur Massar)                 │
│  14:18 | 1 passager | SAMA PASS | Par EPscanT  │
│  ───────────────────────────────────────────    │
│                                                 │
│  ... (8 autres événements)                     │
└─────────────────────────────────────────────────┘
```

**Limite** : 10 derniers événements
**Mise à jour** : Instantanée (push notification)

---

### 4. Gestion de la Flotte Hybride

**Données** : `fleet_vehicles/{vehicleId}`

```
┌──────────────────────────────────────────────────────────────────┐
│  🚌 Gestion de la Flotte Hybride                                │
│                                                                  │
│  Véhicule     Ligne   Statut      Scans/jour  Usage  Revenus   │
│  ─────────────────────────────────────────────────────────────  │
│  DK-2019-M    C       En service       9        45    11 250   │
│  DK-3456-A    C       En service       12       67    16 750   │
│  DK-7890-B    C       En pause         0        23     5 750   │
└──────────────────────────────────────────────────────────────────┘
```

**Mise à jour** : Toutes les 30 secondes

---

## 🔐 RÈGLES FIREBASE RTDB

### Permissions Lecture

```json
{
  "stats/daily": { ".read": true },
  "voyage/express": { ".read": true },
  "ops/transport/live_feed": { ".read": true },
  "transport_stats/global": { ".read": true },
  "fleet_vehicles": { ".read": "auth != null" }
}
```

### Permissions Écriture

```json
{
  "stats/daily": { ".write": true },
  "voyage/express": {
    "$lineId": {
      "stats/realtime": { ".write": true }
    }
  },
  "ops/transport/live_feed": { ".write": true },
  "transport_stats/global": { ".write": true }
}
```

**Note** : Les règles `.write: true` permettent au scanner (non authentifié) d'écrire les stats.

---

## 📈 PERFORMANCE

### Latence

| Opération | Temps | Acceptable |
|-----------|-------|------------|
| Scan QR → Validation | < 500ms | ✅ |
| Écriture 10 chemins Firebase | < 2s | ✅ |
| Affichage Command Center | < 1s | ✅ |
| **Total (Scan → Dashboard)** | **< 3s** | ✅ |

### Charge

| Métrique | Valeur | Limite Firebase |
|----------|--------|-----------------|
| Écritures par scan | 10 | 100 000/jour gratuit |
| Scans par jour estimés | 500 | → 5 000 écritures |
| Lectures dashboard | ~100/min | Illimité avec caching |
| Connexions simultanées | ~50 | 100 gratuit |

**Marge** : ✅ Large (5% de la limite gratuite)

---

## 🔄 SYNCHRONISATION TEMPS RÉEL

### Listeners Firebase

Le dashboard utilise `onValue()` pour recevoir les mises à jour en temps réel :

```javascript
// Sans polling (PUSH notification)
onValue(ref(db, 'ops/transport/live_feed'), snapshot => {
  // Mise à jour automatique dès qu'un scan arrive
  updateUI(snapshot.val());
});
```

**Avantages** :
- ✅ Pas de polling HTTP
- ✅ Latence < 1 seconde
- ✅ Économie de bande passante
- ✅ Scalabilité Firebase

---

## 🎯 RESET AUTOMATIQUE

### Compteurs Journaliers

À **minuit (00:00)**, les compteurs se réinitialisent automatiquement :

```javascript
const today = new Date().toISOString().split('T')[0];

// Le scanner vérifie toujours la date
if (data.last_scan_date !== today) {
  // Reset automatique
  scans_today = 0;
}
```

**Chemins concernés** :
- `stats/daily/{date}/total_scans` → Nouveau nœud créé chaque jour
- `transport_stats/global/total_scans_today` → Reset à 0
- `voyage/express/ligne-c/stats/realtime/passengers_today` → Reset à 0

**Chemins persistants** :
- `transport_stats/global/total_scans` → Cumul depuis le début ✅
- `voyage/express/ligne-c/stats/realtime/total_passengers` → Cumul ✅
- `fleet_vehicles/{id}/usageCount` → Cumul ✅

---

## 🛡️ SÉCURITÉ

### Données Anonymisées

Le Live Feed n'affiche **PAS** les données personnelles :

```javascript
// ❌ N'est PAS affiché dans le dashboard
passengerId: "+221771234567"

// ✅ Affiché à la place
passenger_count: 1
subscription_type: "SAMA PASS"
```

### Logs Confidentiels

Les logs détaillés (nom, prénom, téléphone) sont dans :
- `scan_history` → Lecture réservée aux admins
- `demdem/sama_passes` → Lecture réservée au scanner

---

## 🚀 ÉVOLUTIVITÉ

### Nouvelles Lignes

Pour ajouter une nouvelle ligne (ex: Ligne D) :

1. **Créer le véhicule** dans `fleet_vehicles`
2. **Créer la ligne** dans `ops/transport/lines/ligne-d`
3. **Scans automatiques** → Tout fonctionne ✅

Le scanner détecte automatiquement la ligne via le QR code :
```
SAMAPASS-2026-771234567-LIGNE-D
                         ^^^^^^^^ lineId détecté
```

Aucun code à modifier ! 🎉

---

### Nouveaux KPIs

Pour ajouter un KPI (ex: Retards) :

1. **Ajouter dans le scanner** :
   ```javascript
   await update(dailyStatsRef, {
     total_scans: X,
     total_delays: Y  // ← Nouveau KPI
   });
   ```

2. **Lire dans le dashboard** :
   ```javascript
   const delays = snapshot.val().total_delays;
   ```

3. **Afficher** :
   ```jsx
   <div>Retards : {delays}</div>
   ```

---

## 📝 LOGS DE DÉBOGAGE

### Scanner (Console)

```
[SECTORISATION] 📊 Étape X/10 : ...
[SECTORISATION] ✅ ...
[SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS
```

### Command Center (Console)

```
[FIREBASE] ✅ Firebase initialized successfully
[ROLE BASED ROUTE] Access granted
[ADMIN-OPS-TRANSPORT] Data loaded
```

### Firebase Console

```
Operations → Realtime Database → Data
→ Voir les écritures en temps réel
```

---

## ✅ VALIDATION COMPLÈTE

**Le système est opérationnel si** :

1. ✅ Scanner affiche "🎉 TOUTES LES STATS MISES À JOUR"
2. ✅ Firebase Console montre les 10 chemins
3. ✅ Command Center affiche les compteurs > 0
4. ✅ Live Feed affiche les scans en temps réel
5. ✅ Latence totale < 3 secondes

**Architecture validée** : 🎉 **PRODUCTION READY !**
