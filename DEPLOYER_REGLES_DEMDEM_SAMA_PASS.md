# Déploiement des règles Firebase pour DEM-DEM SAMA PASS

## ⚠️ URGENT: Permission Denied Fix

Les règles Firebase pour le système DEM-DEM SAMA PASS ont été ajoutées dans `database.rules.json` mais doivent être déployées manuellement.

## 🔧 Commande de déploiement

```bash
firebase deploy --only database
```

## 📋 Nouvelles règles ajoutées

### `demdem/sama_passes`
- **Lecture**: Publique (pour les scanners)
- **Écriture**: Publique (pour création de pass)
- **Validation**:
  - Champs requis: `qrCode`, `passengerName`, `passengerPhone`, `createdAt`, `expiresAt`
  - `qrCode` doit être une chaîne de caractères
- **Index**: `qrCode`, `passengerPhone`, `expiresAt`, `isTest`

### `demdem/transport_scans`
- **Lecture**: Publique (pour statistiques)
- **Écriture**: Publique (pour enregistrer les scans)
- **Index**: `timestamp`, `vehicleId`, `passId`

### `demdem/transport_lines`
- **Lecture**: Publique (pour affichage lignes)
- **Écriture**: Super admin + ops_transport uniquement

## ✅ Vérification après déploiement

1. Accéder à: `https://demdem.sn/admin-test-samapass.html`
2. Créer un SAMA PASS de test
3. Vérifier qu'aucune erreur PERMISSION_DENIED n'apparaît
4. Accéder à: `https://demdem.sn/test-ticket.html`
5. Vérifier que le QR Code s'affiche correctement
6. Scanner avec: `https://demdem.sn/epscant-transport.html`

## 🔍 Console Firebase

Après déploiement, vérifier dans Firebase Console:
- **Database > Realtime Database > Rules**
- Chercher la section `"demdem"`
- Confirmer que les 3 sous-sections existent:
  - `sama_passes`
  - `transport_scans`
  - `transport_lines`

## 🚨 Si le problème persiste

Vérifier dans Firebase Console > Realtime Database:
1. Que la base de données est bien créée
2. Que les règles sont bien déployées
3. Que le chemin exact est: `/demdem/sama_passes/`

## 📱 Pages concernées

- `/admin-test-samapass.html` - Création de SAMA PASS
- `/test-ticket.html` - Affichage et test de SAMA PASS
- `/epscant-transport.html` - Scanner transport DEM-DEM
