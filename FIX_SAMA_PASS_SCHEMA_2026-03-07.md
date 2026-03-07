# Fix SAMA PASS Schema - 2026-03-07

## Problème résolu
Erreur `PERMISSION_DENIED` lors de la création de SAMA PASS de test.

## Cause
1. Le chemin Firebase utilisé était `abonnements_express` au lieu de `demdem/sama_passes`
2. Les noms de champs ne correspondaient pas au schéma validé par Firebase
3. Les règles Firebase n'existaient pas pour le nouveau chemin

## Corrections appliquées

### 1. Règles Firebase (`database.rules.json`)

Ajout de la section `demdem`:

```json
"demdem": {
  "sama_passes": {
    ".read": true,
    ".indexOn": ["qrCode", "passengerPhone", "expiresAt", "isTest"],
    "$passId": {
      ".write": true,
      ".validate": "newData.hasChildren(['qrCode', 'passengerName', 'passengerPhone', 'createdAt', 'expiresAt'])"
    }
  },
  "transport_scans": {
    ".read": true,
    "$scanId": {
      ".write": true,
      ".indexOn": ["timestamp", "vehicleId", "passId"]
    }
  },
  "transport_lines": {
    ".read": true,
    "$lineId": {
      ".write": "auth != null && (ops_transport || super_admin)"
    }
  }
}
```

### 2. Schéma des données

**Ancien schéma (non conforme):**
```javascript
{
  qr_code: "...",
  full_name: "...",
  subscriber_phone: "...",
  start_date: "...",
  end_date: "...",
  test_pass: true
}
```

**Nouveau schéma (conforme):**
```javascript
{
  qrCode: "...",
  passengerName: "...",
  passengerPhone: "...",
  startDate: "...",
  endDate: "...",
  createdAt: 1234567890,
  expiresAt: 1234567890,
  isTest: true,
  status: "active",
  subscriptionType: "monthly",
  subscriptionTier: "eco",
  routeName: "..."
}
```

### 3. Fichiers modifiés

#### `/public/admin-test-samapass.html`
- ✅ Chemin: `abonnements_express` → `demdem/sama_passes`
- ✅ Champs: camelCase au lieu de snake_case
- ✅ Timestamps: utilise `Date.now()` au lieu de dates ISO
- ✅ Flag test: `test_pass` → `isTest`

#### `/public/epscant-transport.html`
- ✅ Chemin: `abonnements_express` → `demdem/sama_passes`
- ✅ Champs: tous les champs adaptés au camelCase
- ✅ Index IndexedDB: `qr_code` → `qrCode`, `subscriber_phone` → `passengerPhone`
- ✅ Validation: utilise `expiresAt` (timestamp) au lieu de `end_date` (string)
- ✅ Scans: enregistrés dans `demdem/transport_scans` avec `passId`

#### `/public/test-ticket.html`
- ✅ Déjà conforme (utilisait déjà le bon chemin et les bons champs)

## Validation

### Test 1: Création de SAMA PASS
```
URL: https://demdem.sn/admin-test-samapass.html
Action: Créer un SAMA PASS de test
Résultat attendu: Aucune erreur PERMISSION_DENIED
```

### Test 2: Affichage du SAMA PASS
```
URL: https://demdem.sn/test-ticket.html
Action: Afficher le dernier SAMA PASS créé
Résultat attendu: QR Code et informations affichés
```

### Test 3: Scanner le SAMA PASS
```
URL: https://demdem.sn/epscant-transport.html
Action: Scanner le QR Code du SAMA PASS
Résultat attendu: "PASS VALIDE" avec détails de l'abonné
```

## Structure Firebase finale

```
/demdem
  /sama_passes
    /-On4zLCa0a_fTHIOuzer
      qrCode: "DEMDEM-2217701234567-1234567890"
      passengerName: "Mamadou Diallo"
      passengerPhone: "221770123456"
      createdAt: 1709772043408
      expiresAt: 1712364043408
      status: "active"
      subscriptionType: "monthly"
      subscriptionTier: "eco"
      routeName: "Dakar - Rufisque"
      isTest: true

  /transport_scans
    /1709772150123
      vehicleId: "vehicle-123"
      passId: "-On4zLCa0a_fTHIOuzer"
      passengerPhone: "221770123456"
      passengerName: "Mamadou Diallo"
      timestamp: 1709772150123
      scanStatus: "valid"

  /transport_lines
    /route-dakar-rufisque
      name: "Dakar - Rufisque"
      isActive: true
```

## Déploiement

Les règles Firebase doivent être déployées avec:
```bash
firebase deploy --only database
```

## Pages concernées

✅ `/admin-test-samapass.html` - Création de SAMA PASS
✅ `/test-ticket.html` - Affichage de SAMA PASS
✅ `/epscant-transport.html` - Scanner transport DEM-DEM
