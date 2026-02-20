# 🗺️ Cartographie Complète des URLs — Système Transport DEM-DEM

**Version:** 2.0.0
**Date:** 20 Février 2026
**Mise à jour:** EPscanV Intégré

---

## 🎯 Vue d'Ensemble

Le système DEM-DEM Express comprend maintenant **4 silos majeurs** :

1. **👥 Passagers** (Front-office)
2. **🚗 Chauffeurs** (Gestion trajets)
3. **📱 Contrôleurs** (Scanner terrain)
4. **⚙️ Opérations** (Command Center)

---

## 🌐 1. SILO PASSAGERS (Front-Office)

### Landing & Navigation

| URL | Description | Accès |
|-----|-------------|-------|
| `/voyage` | Landing page DEM-DEM Express | Public |
| `/voyage/hub` | Hub de transport (toutes options) | Public |

### Services de Transport

| URL | Description | Type |
|-----|-------------|------|
| `/transport/demdem-express` | Covoiturage longue distance | Booking |
| `/transport/allo-dakar` | Service taxi urbain | Booking |
| `/voyage/allo-dakar/confirmation` | Confirmation réservation taxi | Protected |

### SAMA PASS (Abonnements)

| URL | Description | Accès |
|-----|-------------|-------|
| `/voyage/abonnements` | Page abonnements mensuels | Public |
| `/voyage/wallet` | Portefeuille utilisateur | Protected |

### Ferry & Maritime

| URL | Description | Accès |
|-----|-------------|-------|
| `/voyage/ferry` | Réservation COSAMA | Public |
| `/pass/lmdg` | Ligne Maritime Dakar-Gorée | Public |
| `/pass/interregional` | Liaisons interrégionales | Public |

### Paiements

| URL | Description | Accès |
|-----|-------------|-------|
| `/pass/payment/success` | Confirmation paiement | Protected |
| `/pass/payment/error` | Erreur paiement | Protected |

---

## 🚗 2. SILO CHAUFFEURS

### Inscription & Authentification

| URL | Description | Statut |
|-----|-------------|--------|
| `/voyage/chauffeur/inscription` | Formulaire inscription chauffeur | Public |
| `/voyage/chauffeur/login` | Connexion chauffeur | Public |
| `/voyage/chauffeur/en-attente` | Page attente validation | Protected |

### Dashboard & Gestion Trajets

| URL | Description | Rôle Requis |
|-----|-------------|-------------|
| `/voyage/conducteur/dashboard` | Dashboard chauffeur | `driver` |
| `/voyage/chauffeur/publier-trajet` | Publication nouveau trajet | `driver` |
| `/voyage/conducteur/trajet` | Trajet actif en cours | `driver` |

### Fonctionnalités Dashboard

- 📊 Vue d'ensemble trajets (actifs, complétés)
- 💰 Revenus & statistiques
- 🚗 Gestion disponibilité véhicule
- 📍 Suivi passagers en temps réel

---

## 📱 3. SILO CONTRÔLEURS (EPscanV) ⭐ NOUVEAU

### Authentification

| URL | Description | Accès |
|-----|-------------|-------|
| `/controller/login` | Login contrôleur terrain | Public |

### Scanner Terrain

| URL | Description | Rôle Requis |
|-----|-------------|-------------|
| `/controller-epscanv` | Scanner SAMA PASS | `controller` |

### Fonctionnalités EPscanV

#### Interface Mobile-First (375px)
- 📷 **Scanner QR** : html5-qrcode en temps réel
- 📊 **Compteurs géants** : Validé (Vert) / Refusé (Rouge) / Total (Bleu)
- 🚌 **Bandeau info** : Ligne + Nom contrôleur
- 📶 **Indicateur réseau** : Online/Offline
- 🔋 **Niveau batterie** : Monitoring temps réel

#### Intelligence Offline
- ✅ **Validation JWT locale** (sans Internet)
- 🔒 **Anti-passback** : Cooldown 2h (IndexedDB)
- 💾 **Stockage offline** : IndexedDB
- 🔄 **Sync auto** : Dès retour réseau
- 📍 **GPS tracking** : Position véhicule (15s)

#### Règles de Validation
1. Vérification expiration (`expiresAt`)
2. Correspondance ligne (ex: KM-Dakar ≠ KM-Ziguinchor)
3. Grade véhicule (VIP/Confort/Eco)
4. Signature JWT valide
5. Cooldown passback 2h

#### Économie d'Énergie
- 🔆 **Wake Lock API** : Écran toujours allumé
- 🌙 **Luminosité auto** : Réduite après 2 min inactivité
- ⚡ **FPS optimisé** : 10 fps caméra

---

## ⚙️ 4. SILO OPÉRATIONS (Command Center)

### Authentification Admin

| URL | Description | Accès |
|-----|-------------|-------|
| `/admin/login` | Login admin unifié | Public |
| `/admin/ops/login` | Login Ops Manager | Public |
| `/admin/finance/login` | Login Finance | Public |

### Command Center Transport

| URL | Description | Rôle Requis |
|-----|-------------|-------------|
| `/admin/ops/transport` | Command Center Transport | `ops_transport` |

#### Fonctionnalités Command Center

**Gestion de la Flotte Hybride**
- 🚌 **Enrôlement véhicules** : Ndiaga Ndiaye, Bus, Minibus
- 📍 **[Localiser]** : Position GPS temps réel (via `/live/positions/{vehicleId}`)
- 🔧 **[Maintenance]** : Toggle statut véhicule (grisage ligne)
- 👤 **[Changer Chauffeur]** : Assignation chauffeur disponible
- 📊 **Stats véhicule** : Trajets/jour, occupation, revenus

**Centre de Disponibilité Prestige Flow**
- 👥 **Abonnés actifs** : Nombre SAMA PASS valides
- 🔮 **Demande estimée** : Calcul prédictif passagers
- 🚌 **Besoin flotte** : Ndiaga Ndiaye requis vs disponibles
- ⚠️ **Alertes capacité** : Manque/excédent places

**Analytics de Ligne 360**
- 📊 **Performance par ligne** : Dakar-Pikine, Dakar-Rufisque...
- 🚌 **Flotte active/requise** : Alertes manque véhicules
- ⏰ **Heures de pointe** : Visualisation demande horaire
- 💰 **Revenus ligne** : CA par ligne

**Vue Terrain • Live Feed**
- 📡 **Scans en direct** : Remontée EPscanV temps réel
- 👤 **Contrôleur actif** : Nom, ligne, localisation
- 📊 **Passagers scannés** : Type abonnement, heure
- 🚌 **Véhicule concerné** : Numéro, ligne

### Dashboard Transversal

| URL | Description | Rôle Requis |
|-----|-------------|-------------|
| `/admin/dashboard` | Vue 360° tous silos | `super_admin` |

### Finance & Reporting

| URL | Description | Rôle Requis |
|-----|-------------|-------------|
| `/admin/finance/event` | Finance événements | `finance` |
| `/admin/finance/voyage` | Finance transport | `finance` |
| `/admin/ops/event` | Ops événements | `ops_event` |

### Configuration Système

| URL | Description | Rôle Requis |
|-----|-------------|-------------|
| `/admin/transport/setup` | Configuration lignes & tarifs | `super_admin` |

---

## 🧪 5. OUTILS DE TEST

### Générateur QR SAMA PASS

| URL | Description | Accès |
|-----|-------------|-------|
| `/test/qr-generator` | Générateur QR codes test | Public |

#### Fonctionnalités Générateur
- 🎨 **Configuration pass** : UserID, ligne, grade, type
- 📱 **Génération QR** : Avec signature JWT valide
- 💾 **Export PNG** : Téléchargement QR code
- 🧪 **Test EPscanV** : QR codes compatibles scanner

#### Cas d'Usage
1. Tester validation offline
2. Tester rejection (ligne incorrecte, expiré)
3. Tester anti-passback (cooldown 2h)
4. Tester grades (VIP, Confort, Eco)

---

## 📍 6. FLUX GPS & TRACKING

### Émission Position (Contrôleurs)

**Source:** EPscanV (`/controller-epscanv`)
**Destination:** `/live/positions/{vehicleId}`
**Fréquence:** Toutes les 15 secondes

```json
{
  "latitude": 14.6937,
  "longitude": -17.4441,
  "timestamp": "2026-02-20T15:30:00Z",
  "speed": 45,
  "controller_id": "uid_controleur"
}
```

### Consommation Position (Ops Manager)

**Source:** Command Center (`/admin/ops/transport`)
**Lecture:** `/live/positions/{vehicleId}`
**Action:** Bouton **[Localiser]** dans tableau flotte

**Modal Localisation:**
- 📍 Latitude/Longitude
- ⚡ Vitesse actuelle
- ⏰ Dernière mise à jour
- 🗺️ Lien Google Maps

---

## 🔄 7. SYNCHRONISATION DONNÉES

### Flux Offline → Online (EPscanV)

**Stockage Offline:** IndexedDB → `pendingScans`

```javascript
{
  id: "scan_1234567890_abc",
  timestamp: "2026-02-20T15:30:00Z",
  passData: { userId, line, grade, ... },
  result: "validated" | "rejected",
  reason: "Pass expiré" (si rejeté),
  location: { latitude, longitude }
}
```

**Sync Online:** Firebase Realtime Database

```
/trips/{tripId}
  ├─ controller_id
  ├─ controller_name
  ├─ vehicle_id
  ├─ line
  ├─ passenger_id
  ├─ subscription_type
  ├─ grade
  ├─ result
  ├─ timestamp
  └─ location: { lat, lng }

/controller_stats/{uid}/{date}
  ├─ validated: +1
  ├─ rejected: +1
  └─ total: +1
```

**Trigger:** Event `window.addEventListener('online')`

---

## 🎭 8. RÔLES & PERMISSIONS

| Rôle | URLs Accessibles | Permissions Firebase |
|------|------------------|---------------------|
| **Public** | Landing, booking, login | Lecture publique limitée |
| **`driver`** | Dashboard chauffeur, publier trajets | R/W sur propres trajets |
| **`controller`** | EPscanV, scanner | W sur trips, controller_stats, live/positions |
| **`ops_transport`** | Command Center transport | R/W fleet_vehicles, R trips, R live/positions |
| **`ops_event`** | Ops événements | R/W events |
| **`finance`** | Finance dashboards | R toutes transactions |
| **`super_admin`** | Tout | R/W global |

---

## 🔐 9. FIREBASE STRUCTURE COMPLÈTE

```
/
├─ users/{uid}
│  ├─ email
│  ├─ role: "controller" | "driver" | "ops_transport" | "super_admin"
│  └─ created_at
│
├─ controllers/{uid}
│  ├─ name: "Moussa Diop"
│  ├─ line: "KM - Dakar ⇄ Pikine"
│  ├─ vehicleId: "vehicle_abc123"
│  └─ status: "active" | "inactive"
│
├─ drivers/{uid}
│  ├─ name
│  ├─ phone
│  ├─ status: "available" | "on_trip" | "off_duty"
│  ├─ current_vehicle_id
│  └─ license_number
│
├─ fleet_vehicles/{vehicleId}
│  ├─ vehicle_number: "NN-001"
│  ├─ type: "ndiaga_ndiaye" | "bus" | "minibus"
│  ├─ capacity: 25
│  ├─ route: "KM - Dakar ⇄ Pikine"
│  ├─ license_plate: "DK-1234-AB"
│  ├─ status: "en_service" | "en_maintenance" | "en_pause"
│  ├─ assigned_driver_id
│  ├─ current_trips_today: 12
│  ├─ total_revenue_today: 45000
│  ├─ average_occupancy_rate: 78
│  ├─ last_scan_location
│  └─ last_scan_time
│
├─ trips/{tripId}
│  ├─ controller_id
│  ├─ controller_name
│  ├─ vehicle_id
│  ├─ line
│  ├─ passenger_id
│  ├─ subscription_type: "SAMA_PASS_MENSUEL"
│  ├─ grade: "Confort"
│  ├─ result: "validated" | "rejected"
│  ├─ reason: "Pass expiré" (si rejeté)
│  ├─ timestamp
│  └─ location: { latitude, longitude }
│
├─ controller_stats/{uid}/{date}
│  ├─ validated: 145
│  ├─ rejected: 12
│  └─ total: 157
│
├─ transport_lines/{lineId}
│  ├─ name: "KM - Dakar ⇄ Pikine"
│  ├─ trips_today: 85
│  ├─ average_occupancy_rate: 72
│  ├─ total_revenue: 125000
│  ├─ active_vehicles: 8
│  ├─ required_vehicles: 10
│  └─ peak_hours: [...]
│
├─ pass_subscribers/{uid}
│  ├─ full_name
│  ├─ email
│  ├─ phone
│  ├─ subscription_type: "SAMA_PASS_MENSUEL"
│  ├─ subscription_status: "active" | "suspended" | "expired"
│  ├─ line: "KM - Dakar ⇄ Pikine"
│  ├─ grade: "Confort"
│  ├─ total_trips: 42
│  └─ last_trip_date
│
└─ live/
   └─ positions/{vehicleId}
      ├─ latitude: 14.6937
      ├─ longitude: -17.4441
      ├─ timestamp: "2026-02-20T15:30:00Z"
      ├─ speed: 45
      └─ controller_id: "uid"
```

---

## 🚀 10. FLUX UTILISATEUR COMPLET

### Parcours Contrôleur (EPscanV)

```
1. /controller/login
   ↓
2. Authentification Firebase
   ↓
3. Redirection /controller-epscanv
   ↓
4. Chargement info contrôleur
   GET /controllers/{uid} → { name, line, vehicleId }
   ↓
5. Démarrage caméra
   html5-qrcode → Camera arrière
   ↓
6. Scan QR Code
   Validation locale (JWT signature)
   ├─ ✅ Validé → Compteur +1, Son succès
   └─ ❌ Refusé → Compteur +1, Son erreur
   ↓
7. Stockage
   ├─ 📶 Online → POST /trips + /controller_stats
   └─ 📴 Offline → IndexedDB (pendingScans)
   ↓
8. GPS Tracking (loop 15s)
   PUT /live/positions/{vehicleId}
   ↓
9. Retour Online
   Sync IndexedDB → Firebase
```

### Parcours Ops Manager (Monitoring)

```
1. /admin/ops/login
   ↓
2. Authentification Firebase
   ↓
3. Redirection /admin/ops/transport
   ↓
4. Chargement données temps réel
   ├─ GET /fleet_vehicles → Tableau flotte
   ├─ GET /pass_subscribers → Calcul disponibilité
   ├─ GET /transport_lines → Analytics 360
   ├─ GET /scan_events → Live feed terrain
   └─ GET /drivers → Chauffeurs disponibles
   ↓
5. Actions disponibles
   ├─ [Enrôler Véhicule] → POST /fleet_vehicles
   ├─ [Localiser] → GET /live/positions/{vehicleId}
   ├─ [Maintenance] → PUT /fleet_vehicles/{id}/status
   └─ [Changer Chauffeur] → PUT /fleet_vehicles/{id}/assigned_driver_id
   ↓
6. Monitoring continu
   onValue() → Mise à jour temps réel
```

---

## 📊 11. MÉTRIQUES & MONITORING

### KPIs Command Center

| Métrique | Source | Calcul |
|----------|--------|--------|
| **Abonnés Actifs** | `/pass_subscribers` | `count(status === 'active')` |
| **Demande Estimée** | Abonnés actifs | `activeSubscribers * 0.7` |
| **Flotte Active** | `/fleet_vehicles` | `count(status === 'en_service')` |
| **Capacité Actuelle** | Flotte active | `sum(vehicle.capacity)` |
| **Ndiaga Requis** | Demande estimée | `ceil(demand / 25)` |
| **Gap Capacité** | Capacité vs Demande | `capacity - demand` |

### KPIs EPscanV

| Métrique | Stockage | Fréquence |
|----------|----------|-----------|
| **Validé** | `/controller_stats/{uid}/{date}/validated` | Temps réel |
| **Refusé** | `/controller_stats/{uid}/{date}/rejected` | Temps réel |
| **Total** | `/controller_stats/{uid}/{date}/total` | Temps réel |
| **Position GPS** | `/live/positions/{vehicleId}` | Toutes les 15s |

---

## 🛠️ 12. CONFIGURATION REQUISE

### EPscanV (Contrôleurs)

**Hardware:**
- 📱 Smartphone Android/iOS
- 📷 Caméra arrière
- 📍 GPS activé
- 🔋 Batterie 50%+ recommandée

**Software:**
- 🌐 Chrome 90+ / Safari 14+
- 🔒 HTTPS activé (requis pour caméra)
- 💾 IndexedDB supporté
- 🔐 Permissions : Caméra, GPS, Stockage, Wake Lock

**Firebase:**
```json
/controllers/{uid}: {
  name: "Nom Contrôleur",
  line: "KM - Dakar ⇄ Pikine",
  vehicleId: "vehicle_abc123"
}

/users/{uid}: {
  role: "controller"
}
```

### Command Center (Ops Manager)

**Hardware:**
- 💻 Desktop/Laptop/Tablette
- 🖥️ Écran 1280px+ recommandé
- 🌐 Connexion stable

**Software:**
- Chrome 90+ / Edge 90+ / Safari 14+
- Firebase initialisé

**Firebase:**
```json
/users/{uid}: {
  role: "ops_transport"
}
```

---

## 🎯 13. CHECKLIST DÉPLOIEMENT PRODUCTION

### ✅ Backend (Firebase)

- [ ] Règles Realtime Database configurées
- [ ] Rôles définis pour tous utilisateurs
- [ ] Structure `controllers/{uid}` créée
- [ ] Structure `drivers/{uid}` créée
- [ ] Structure `fleet_vehicles` initialisée
- [ ] Clé publique RSA production configurée

### ✅ Frontend

- [ ] Variables d'environnement `.env` correctes
- [ ] HTTPS activé (obligatoire caméra)
- [ ] Build production `npm run build`
- [ ] Service Worker vérifié
- [ ] PWA manifest configuré

### ✅ Tests

- [ ] Test login contrôleur
- [ ] Test scanner QR validé
- [ ] Test scanner QR refusé
- [ ] Test mode offline
- [ ] Test synchronisation auto
- [ ] Test anti-passback 2h
- [ ] Test GPS tracking
- [ ] Test Command Center localisation
- [ ] Test actions flotte (maintenance, chauffeur)

---

## 🌟 14. NOUVEAUTÉS v2.0.0

### ⭐ EPscanV Terrain Scanner

- ✅ **Validation offline-first** avec JWT local
- ✅ **Anti-passback 2h** via IndexedDB
- ✅ **GPS tracking 15s** vers Command Center
- ✅ **Sync auto** pendingScans → Firebase
- ✅ **Wake Lock API** écran toujours allumé
- ✅ **Économie batterie** luminosité adaptative

### ⭐ Command Center Amélioré

- ✅ **Gestion flotte hybride** (Ndiaga, Bus, Minibus)
- ✅ **Actions temps réel** : Localiser, Maintenance, Changer Chauffeur
- ✅ **Centre Disponibilité** : Calcul prédictif besoin flotte
- ✅ **Analytics 360** : Performance ligne, heures pointe
- ✅ **Live Feed** : Scans terrain remontés en direct

### ⭐ Générateur QR Test

- ✅ **Création passes test** pour EPscanV
- ✅ **Export PNG** QR codes
- ✅ **Tous scénarios** : Validation, rejection, passback

---

**Document maintenu par :** Équipe Technique DEM-DEM Express
**Dernière mise à jour :** 20 Février 2026
**Version Système :** 2.0.0 — EPscanV Production Ready
