# 🔥 ARCHITECTURE FIREBASE DEM⇄DEM

**Version:** 3.1 Final
**Date:** 28 Janvier 2026
**Optimisation:** Hybride Realtime Database + Firestore

---

## 📊 STRATÉGIE DE RÉPARTITION

### REALTIME DATABASE (Flux Temps Réel - ÉCONOMIQUE)

```
/live/
  ├── positions/{driver_id}              ← GPS chauffeurs (toutes les 15-30s)
  ├── buses/{line_id}/{bus_id}           ← GPS bus EXPRESS
  ├── trips_active/{trip_id}             ← Trajets en cours
  └── online_status/{user_id}            ← Statuts connexion

/counters/
  ├── daily/{date}/scans                 ← Compteurs scans journaliers
  ├── daily/{date}/trips                 ← Compteurs trajets
  └── fleet/{owner_id}/stats             ← Stats flotte temps réel

/queues/
  └── pending_syncs/                     ← File sync offline EPscan
```

**Raison:** Écritures fréquentes, lecture temps réel, coût 10x moins cher que Firestore

---

### FIRESTORE (Données Persistantes - LECTURES MINIMISÉES)

```
users/                                   ← Profils (cache client 24h)
vehicles/                                ← Véhicules (cache 1h)
drivers/                                 ← Chauffeurs + KYC
trips/                                   ← Historique trajets archivés
transactions/                            ← Historique wallet
subscriptions/                           ← Abonnements SAMA PASS
events/                                  ← Événements
tickets/                                 ← Billets événements
ferry_crossings/                         ← Traversées ferry

aggregates/                              ← DOCUMENTS PRÉ-CALCULÉS
  ├── fleet_stats/{owner_id}             ← Stats flotte agrégées
  ├── daily_stats/{date}                 ← Stats journalières globales
  └── monthly_revenue/{month}            ← CA mensuel

controllers/                             ← Contrôleurs EPscan
admins/                                  ← Administrateurs
admin_logs/                              ← Journal d'audit
scans_archive/                           ← Archive scans (post-sync)
```

**Raison:** Données structurées, requêtes complexes, agrégations

---

## ⚡ STRATÉGIE CACHE CLIENT

```javascript
const CacheConfig = {
  CITIES_LIST:     { ttl: 7 * 24 * 3600000 },  // 7 jours (statique)
  USER_PROFILE:    { ttl: 24 * 3600000 },      // 24h
  DRIVER_PROFILE:  { ttl: 24 * 3600000 },      // 24h
  WALLET_BALANCE:  { ttl: 2 * 60000 },         // 2 min (depuis RTDB)
  FLEET_VEHICLES:  { ttl: 30 * 60000 },        // 30 min
  FLEET_STATS:     { ttl: 5 * 60000 },         // 5 min (depuis RTDB)
  BUS_POSITIONS:   { ttl: 0 }                  // Temps réel RTDB (pas de cache)
};
```

### Implémentation LocalStorage + IndexedDB

- **LocalStorage:** Métadonnées cache (timestamps, versions)
- **IndexedDB:** Gros objets (listes, profils enrichis)
- **SessionStorage:** Données session utilisateur

---

## 📍 SMART GPS TRACKING

### Throttling Adaptatif (Économie Batterie + Firebase)

```javascript
const GPS_INTERVALS = {
  STATIONARY: 120000,  // 2 min si arrêté > 2min
  SLOW: 30000,         // 30s si vitesse < 20 km/h
  NORMAL: 15000,       // 15s si 20-60 km/h
  FAST: 10000          // 10s si > 60 km/h
};
```

### Optimisations

- **Delta minimum:** 50 mètres avant envoi mise à jour
- **Compression:** 5 décimales GPS (~1m précision)
- **Logs anti-fraude:** Chaque coupure GPS pendant trajet = enregistrée

### Structure Position RTDB

```json
{
  "live/positions/{driver_id}": {
    "lat": 14.74536,
    "lng": -17.48329,
    "speed": 45,
    "heading": 187,
    "accuracy": 12,
    "timestamp": 1706447382000
  }
}
```

---

## 🔐 RÈGLES DE SÉCURITÉ

### Realtime Database Rules

```json
{
  "rules": {
    "live": {
      "positions": {
        "$driver_id": {
          ".write": "auth.uid === $driver_id",
          ".read": "auth.token.role === 'ops_transport' || auth.token.fleet_owner === true"
        }
      }
    },
    "counters": {
      ".read": "auth != null",
      ".write": "auth.token.role === 'controller_transport' || auth.token.role === 'controller_event'"
    }
  }
}
```

### Firestore Rules

```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}

match /drivers/{driverId} {
  allow read: if request.auth.uid == driverId ||
                 request.auth.token.role == 'ops_transport';
  allow write: if request.auth.uid == driverId;
}

match /events/{eventId} {
  allow read: if true;
  allow write: if request.auth.token.role == 'organizer' ||
                  request.auth.token.role == 'super_admin';
}
```

---

## 📦 EXEMPLE FLUX DONNÉES

### Création Trajet Covoiturage

1. **Création:** Firestore `/trips/{tripId}` (données permanentes)
2. **Activation:** RTDB `/live/trips_active/{tripId}` (tracking temps réel)
3. **GPS:** RTDB `/live/positions/{driverId}` (updates 15-30s)
4. **Fin trajet:**
   - Archivage Firestore `/trips/{tripId}` (status: completed)
   - Suppression RTDB `/live/trips_active/{tripId}`

### Scan Billet EPscan (Offline-First)

1. **Scan offline:** IndexedDB local
2. **Background Sync:** RTDB `/queues/pending_syncs/`
3. **Traitement:** Cloud Function lit queue
4. **Archive:** Firestore `/scans_archive/{scanId}`
5. **Compteurs:** RTDB `/counters/daily/{date}/scans` (incrémentation)

---

## 💰 ESTIMATION COÛTS FIREBASE

### Répartition Économique

**AVANT (Full Firestore):**
- GPS 100 chauffeurs × 4 updates/min × 12h = 288 000 writes/jour
- Coût: ~$8.64/jour = **$259/mois**

**APRÈS (Hybride RTDB):**
- RTDB GPS: $1/GB stockage + $5/GB téléchargé
- Firestore: Archives uniquement (10x moins de writes)
- Coût estimé: **$30-50/mois** 📉 **ÉCONOMIE 80%+**

---

## 🔄 MIGRATION PROGRESSIVE

### Phase 1: GPS Temps Réel → RTDB
- Positions chauffeurs
- Positions bus EXPRESS
- Compteurs scans

### Phase 2: Queues Sync → RTDB
- EPscan offline sync
- Notifications push queue

### Phase 3: Stats Agrégées → RTDB + Firestore
- Calculs temps réel RTDB
- Snapshots journaliers Firestore

---

**Dernière mise à jour:** 28 Janvier 2026
**Responsable Architecture:** Malick
