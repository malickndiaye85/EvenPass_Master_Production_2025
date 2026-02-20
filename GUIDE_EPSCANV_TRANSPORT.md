# 📱 EPscanV — Guide Complet du Scanner Terrain

**Version:** 1.0.0
**Date:** 20 Février 2026
**Statut:** Production Ready

---

## 🎯 Vue d'Ensemble

**EPscanV** est le scanner de terrain offline-first conçu pour les contrôleurs DEM-DEM Express. Il permet la validation des SAMA PASS sans connexion Internet, avec synchronisation automatique dès le retour du réseau.

---

## 📍 Points d'Accès

### 🔐 Login Contrôleur
**URL:** `/controller/login`

Interface de connexion sécurisée pour les contrôleurs avec :
- Email/mot de passe
- Validation des identifiants Firebase
- Redirection automatique vers le scanner

### 📷 Scanner EPscanV
**URL:** `/controller-epscanv`

Interface principale de scan avec :
- Vue mobile-first (375px optimisé)
- Caméra QR en temps réel
- Compteurs de stats
- Mode offline complet

### 🧪 Générateur de QR (Test)
**URL:** `/test/qr-generator`

Outil de génération de passes de test pour :
- Créer des QR codes valides
- Tester les différents scénarios
- Télécharger les QR en PNG

---

## 🚀 Fonctionnalités Clés

### 1. **Interface Mobile-First**

```
┌─────────────────────────────┐
│ 🚌 KM - Dakar ⇄ Pikine     │
│    Moussa Diop               │
│                         📶 ON│
├─────────────────────────────┤
│                              │
│     [Zone Scan Caméra]       │
│         250x250px            │
│                              │
├─────────────────────────────┤
│  ✅ VALIDÉ    ❌ REFUSÉ     │
│     48          12           │
│            📊 TOTAL          │
│               60             │
└─────────────────────────────┘
```

#### Bandeau Supérieur
- **Ligne du véhicule** : Ex: "KM - Dakar ⇄ Pikine"
- **Nom du contrôleur** : Ex: "Moussa Diop"
- **Statut réseau** : 📶 ON / 📴 OFF
- **Niveau batterie** : 🔋 85%
- **Scans en attente** : ⏰ 3 scans

#### Zone de Scan
- Caméra arrière activée (facingMode: 'environment')
- QR box 250x250px centré
- FPS: 10 (économie batterie)
- Feedback sonore sur chaque scan

#### Compteurs Géants
- **VALIDÉ** (Vert) : Passes acceptés
- **REFUSÉ** (Rouge) : Passes rejetés
- **TOTAL** (Bleu) : Tous les scans

---

### 2. **Intelligence Offline (JWT)**

#### Validation Locale Sans Internet

```typescript
interface PassData {
  userId: string;
  subscriptionType: string;
  line: string;              // Ex: "KM - Dakar ⇄ Pikine"
  grade: string;             // "VIP" | "Confort" | "Eco"
  expiresAt: string;         // ISO 8601
  issuedAt: string;
  signature: string;         // Hash JWT-like
}
```

#### Règles de Validation

| Règle | Description | Action si Échec |
|-------|-------------|-----------------|
| **Expiration** | `expiresAt > now()` | ❌ "Pass expiré" |
| **Ligne** | `pass.line === vehicle.line` | ❌ "Pass valide pour [ligne], pas [ligne actuelle]" |
| **Grade** | VIP accepté partout, Confort/Eco selon véhicule | ❌ "Grade insuffisant" |
| **Passback** | Cooldown 2h sur le même pass | ❌ "Double scan détecté (Cooldown 2h)" |
| **Signature** | Hash local vérifié | ❌ "Signature invalide" |

#### Anti-Passback (Cooldown 2h)

Stockage dans **IndexedDB** → `scannedPasses`:

```javascript
{
  passId: "user_abc123",
  lastScan: "2026-02-20T15:30:00Z"
}
```

- Le même pass ne peut être scanné qu'une fois toutes les 2 heures
- Empêche le partage de pass entre passagers
- Validation 100% locale, aucun réseau requis

---

### 3. **Synchronisation GPS & Scans**

#### Envoi Position GPS (Toutes les 15s)

```
📍 /live/positions/{vehicleId}
{
  latitude: 14.6937,
  longitude: -17.4441,
  timestamp: "2026-02-20T15:30:00Z",
  speed: 45,
  controller_id: "uid_controleur"
}
```

**Visibilité Ops Manager:**
Le Command Center (`/admin/ops/transport`) affiche en temps réel la position du véhicule sur la carte via l'action **[Localiser]**.

#### Scans Offline → IndexedDB

```
📦 IndexedDB → pendingScans
{
  id: "scan_1234567890_abc",
  timestamp: "2026-02-20T15:30:00Z",
  passData: { ... },
  result: "validated" | "rejected",
  reason: "Pass expiré",
  location: {
    latitude: 14.6937,
    longitude: -17.4441
  }
}
```

#### Synchronisation Auto (Dès Retour Réseau)

Événement `window.addEventListener('online')` déclenche :

```typescript
syncPendingScans() {
  for (const scan of pendingScans) {
    await push(ref(db, 'trips'), {
      controller_id: user.uid,
      vehicle_id: vehicleId,
      passenger_id: scan.passData.userId,
      result: scan.result,
      timestamp: scan.timestamp,
      location: scan.location
    });

    clearPendingScan(scan.id);
  }
}
```

---

### 4. **Économie d'Énergie**

#### Wake Lock API

```typescript
wakeLockRef.current = await navigator.wakeLock.request('screen');
```

- **Empêche l'écran de s'éteindre** pendant le service
- Critique pour éviter l'interruption du scanner
- Se libère automatiquement à la fermeture

#### Gestion de Luminosité

| Condition | Action |
|-----------|--------|
| **Scan actif** | Luminosité maximale (`brightness: 'high'`) |
| **2 min d'inactivité** | Réduction automatique (`brightness: 'low'`) |
| **Nouveau scan** | Remontée immédiate à `'high'` |

#### Surveillance Batterie

```typescript
const battery = await navigator.getBattery();
batteryLevel = battery.level * 100; // 85%
```

Affichage en temps réel : 🔋 85%

---

## 🔒 Configuration Firebase

### Structure Realtime Database

```json
{
  "controllers": {
    "{uid}": {
      "name": "Moussa Diop",
      "line": "KM - Dakar ⇄ Pikine",
      "vehicleId": "vehicle_abc123"
    }
  },

  "trips": {
    "{tripId}": {
      "controller_id": "uid",
      "controller_name": "Moussa Diop",
      "vehicle_id": "vehicle_abc123",
      "line": "KM - Dakar ⇄ Pikine",
      "passenger_id": "user_xyz",
      "subscription_type": "SAMA_PASS_MENSUEL",
      "grade": "Confort",
      "result": "validated",
      "timestamp": "2026-02-20T15:30:00Z",
      "location": {
        "latitude": 14.6937,
        "longitude": -17.4441
      }
    }
  },

  "controller_stats": {
    "{uid}": {
      "2026-02-20": {
        "validated": 145,
        "rejected": 12,
        "total": 157
      }
    }
  },

  "live/positions": {
    "{vehicleId}": {
      "latitude": 14.6937,
      "longitude": -17.4441,
      "timestamp": "2026-02-20T15:30:00Z",
      "speed": 45,
      "controller_id": "uid"
    }
  }
}
```

### Règles de Sécurité

```json
{
  "rules": {
    "controllers": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "root.child('users').child(auth.uid).child('role').val() === 'ops_transport'"
      }
    },

    "trips": {
      ".read": "auth != null && (root.child('users').child(auth.uid).child('role').val() === 'controller' || root.child('users').child(auth.uid).child('role').val() === 'ops_transport')",
      ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'controller'"
    },

    "controller_stats": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'ops_transport'",
        ".write": "$uid === auth.uid"
      }
    },

    "live": {
      "positions": {
        "$vehicleId": {
          ".read": "auth != null",
          ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'controller'"
        }
      }
    }
  }
}
```

---

## 🧪 Test Complet

### 1. Générer un Pass de Test

1. Aller sur `/test/qr-generator`
2. Configurer :
   - **Ligne** : "KM - Dakar ⇄ Pikine"
   - **Grade** : "Confort"
   - **Type** : "SAMA_PASS_MENSUEL"
3. Cliquer **"Générer le QR Code"**
4. **Télécharger PNG**

### 2. Configurer le Contrôleur

Dans Firebase Realtime Database :

```json
{
  "controllers": {
    "{votre_uid}": {
      "name": "Test Contrôleur",
      "line": "KM - Dakar ⇄ Pikine",
      "vehicleId": "vehicle_test_001"
    }
  }
}
```

### 3. Tester le Scanner

1. Se connecter sur `/controller/login`
2. Accéder au scanner `/controller-epscanv`
3. Cliquer **"Démarrer le Scanner"**
4. Scanner le QR code généré
5. Vérifier :
   - ✅ **Pass validé** (compteur vert +1)
   - 🔊 **Son de succès**
   - 📊 **Stats mises à jour**

### 4. Tester Mode Offline

1. **Désactiver le réseau** (mode avion)
2. Scanner plusieurs QR codes
3. Vérifier :
   - ⚠️ **Bandeau "X scans en attente"**
   - 📴 **Indicateur "OFF"**
   - 💾 **Scans stockés dans IndexedDB**
4. **Réactiver le réseau**
5. Vérifier :
   - 🔄 **Synchronisation automatique**
   - 📶 **Indicateur "ON"**
   - 🔥 **Scans envoyés vers Firebase**

### 5. Tester Anti-Passback

1. Scanner le **même QR code**
2. Attendre **moins de 2h**
3. Scanner à nouveau
4. Vérifier :
   - ❌ **"Double scan détecté (Cooldown 2h)"**
   - 🔴 **Compteur rejeté +1**

---

## 📊 Monitoring Ops Manager

Le **Command Center** (`/admin/ops/transport`) reçoit en temps réel :

### Vue Terrain • Live Feed

```
┌─────────────────────────────────────┐
│ 🟢 KM - Dakar ⇄ Pikine             │
│    Station Liberté 6                │
│    👥 12 passagers | Par Moussa Diop│
│    ⏰ 15:30                          │
└─────────────────────────────────────┘
```

### Localisation GPS

Action **[Localiser]** sur un véhicule :

```
┌─────────────────────────────────────┐
│ 📍 Véhicule DK-1234-AB              │
│                                     │
│ Latitude:  14.6937                  │
│ Longitude: -17.4441                 │
│ Vitesse:   45 km/h                  │
│                                     │
│ [Ouvrir dans Google Maps]           │
└─────────────────────────────────────┘
```

---

## 🛠 Dépannage

### Problème : Caméra ne démarre pas

**Causes possibles :**
- Permissions refusées
- HTTPS non activé (requis pour accès caméra)
- Navigateur non supporté

**Solutions :**
1. Vérifier les permissions dans les paramètres du navigateur
2. Utiliser HTTPS (pas HTTP)
3. Tester sur Chrome/Safari mobile

### Problème : Scans non synchronisés

**Causes possibles :**
- Règles Firebase bloquantes
- Rôle contrôleur non défini

**Solutions :**
1. Vérifier `/users/{uid}/role = "controller"`
2. Vérifier les règles Firebase (voir section sécurité)
3. Consulter la console navigateur (F12)

### Problème : GPS non envoyé

**Causes possibles :**
- Permissions géolocalisation refusées
- `vehicleId` manquant dans `controllers/{uid}`

**Solutions :**
1. Activer la géolocalisation dans les paramètres
2. Vérifier la structure Firebase (section Configuration)

---

## 🚀 Déploiement Production

### Checklist Pré-Déploiement

- [ ] Règles Firebase configurées
- [ ] Rôles contrôleurs définis dans `/users/{uid}/role`
- [ ] Structure `controllers/{uid}` créée pour chaque contrôleur
- [ ] HTTPS activé (obligatoire pour caméra)
- [ ] Tests offline/online effectués
- [ ] Wake Lock API testée sur appareils cibles
- [ ] QR codes de production générés avec clé privée réelle

### Configuration Production

Remplacer la clé publique de test dans `src/lib/passValidator.ts` :

```typescript
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
[VOTRE CLÉ PUBLIQUE RSA RÉELLE]
-----END PUBLIC KEY-----`;
```

### Performance Attendue

| Métrique | Valeur |
|----------|--------|
| **Temps de scan** | < 500ms |
| **Validation offline** | < 100ms |
| **Sync vers Firebase** | < 2s |
| **GPS update** | Toutes les 15s |
| **Autonomie batterie** | 8h+ (avec Wake Lock) |

---

## 📱 Compatibilité

| Navigateur | Support | Notes |
|------------|---------|-------|
| **Chrome Android** | ✅ | Recommandé |
| **Safari iOS** | ✅ | Wake Lock limité |
| **Firefox Android** | ⚠️ | Tester Wake Lock |
| **Samsung Internet** | ✅ | Full support |

---

## 🎯 Roadmap

### Version 1.1 (Q2 2026)
- [ ] Intégration Mapbox pour affichage carte en temps réel
- [ ] Statistiques détaillées par ligne/contrôleur
- [ ] Mode nuit automatique
- [ ] Validation biométrique (empreinte)

### Version 1.2 (Q3 2026)
- [ ] Support multi-langue (Wolof, Français, Anglais)
- [ ] Rapports journaliers PDF
- [ ] Mode hors-ligne avancé (cache 7 jours)

---

**Document maintenu par :** Équipe Technique DEM-DEM Express
**Dernière mise à jour :** 20 Février 2026
**Version EPscanV :** 1.0.0 Production Ready
