# Règles Firebase pour Véhicules Transport DEM-DEM Express

## Structure Realtime Database

```json
{
  "transport": {
    "vehicles": {
      "vehicle-001": {
        "pin": "123456",
        "driverName": "Mamadou Diallo",
        "licensePlate": "DK-5678-AB",
        "driverPhone": "+221771234567",
        "vehicleType": "bus",
        "capacity": 30,
        "isActive": true,
        "enrolledAt": 1772667414000,
        "enrolledBy": "admin-uid"
      },
      "vehicle-002": {
        "pin": "234567",
        "driverName": "Ousmane Sow",
        "licensePlate": "DK-9012-CD",
        "driverPhone": "+221772345678",
        "vehicleType": "minibus",
        "capacity": 15,
        "isActive": true,
        "enrolledAt": 1772667414000,
        "enrolledBy": "admin-uid"
      }
    },
    "sessions": {
      "vehicle-001": {
        "lastLogin": 1772667414000,
        "deviceId": "device-fingerprint-hash",
        "isOnline": true
      }
    },
    "scans": {
      "vehicle-001": {
        "2026-03-04": {
          "scan-001": {
            "passId": "pass-123",
            "timestamp": 1772667414000,
            "status": "valid",
            "passengerName": "Fatou Sall"
          }
        }
      }
    }
  }
}
```

## Règles de Sécurité à Déployer

```json
{
  "rules": {
    "transport": {
      "vehicles": {
        ".read": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport')",
        "$vehicleId": {
          ".write": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport')"
        }
      },
      "sessions": {
        "$vehicleId": {
          ".read": true,
          ".write": true
        }
      },
      "scans": {
        "$vehicleId": {
          ".read": "auth != null && (root.child('adminRoles').child(auth.uid).child('role').val() === 'super_admin' || root.child('adminRoles').child(auth.uid).child('role').val() === 'ops_transport')",
          ".write": true
        }
      }
    }
  }
}
```

## Commandes Firebase CLI

```bash
# Déployer uniquement les règles de la base de données
firebase deploy --only database

# Vérifier les règles avant déploiement
firebase database:rules:get
```

## Migration des Données Hardcodées

Les 5 véhicules actuellement hardcodés seront ajoutés manuellement via la console Firebase :

**Console Firebase** → **Realtime Database** → Créer noeud `transport/vehicles`

Ensuite, l'admin pourra enrôler de nouveaux véhicules via l'interface admin (à développer).
