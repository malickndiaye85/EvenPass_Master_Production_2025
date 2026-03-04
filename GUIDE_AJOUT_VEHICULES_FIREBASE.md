# Guide d'Ajout de Véhicules Transport dans Firebase

## Accéder à Firebase Console

1. Ouvrir : https://console.firebase.google.com
2. Sélectionner le projet : **evenpasssenegal**
3. Menu latéral → **Realtime Database**

## Structure des Données

```
transport/
  └── vehicles/
      ├── vehicle-001/
      │   ├── pin: "123456"
      │   ├── driverName: "Mamadou Diallo"
      │   ├── licensePlate: "DK-5678-AB"
      │   ├── driverPhone: "+221771234567"
      │   ├── vehicleType: "bus"
      │   ├── capacity: 30
      │   ├── route: "DEM-DEM Express"
      │   ├── isActive: true
      │   ├── enrolledAt: 1772667414000
      │   └── enrolledBy: "admin-uid"
      └── vehicle-002/
          └── ...
```

## Ajouter un Nouveau Véhicule

### Méthode 1 : Console Firebase (Recommandée)

**Étape 1** : Créer la structure
- Aller dans **Realtime Database**
- Si le nœud `transport` n'existe pas, cliquer sur le `+` à côté de la racine
- Nom : `transport`
- Valeur : laisser vide
- Cliquer **Ajouter**

**Étape 2** : Ajouter le nœud vehicles
- Cliquer sur le `+` à côté de `transport`
- Nom : `vehicles`
- Valeur : laisser vide
- Cliquer **Ajouter**

**Étape 3** : Ajouter un véhicule
- Cliquer sur le `+` à côté de `vehicles`
- Nom : `vehicle-001` (identifiant unique)
- Valeur : laisser vide
- Cliquer **Ajouter**

**Étape 4** : Ajouter les champs du véhicule

Pour chaque champ, cliquer sur `+` à côté de `vehicle-001` :

| Nom | Type | Valeur | Description |
|-----|------|--------|-------------|
| pin | string | "123456" | Code PIN 6 chiffres (UNIQUE) |
| driverName | string | "Mamadou Diallo" | Nom du chauffeur |
| licensePlate | string | "DK-5678-AB" | Plaque d'immatriculation |
| driverPhone | string | "+221771234567" | Téléphone chauffeur |
| vehicleType | string | "bus" | Type : bus, minibus, car |
| capacity | number | 30 | Capacité passagers |
| route | string | "DEM-DEM Express" | Ligne/route |
| isActive | boolean | true | Véhicule actif ? |
| enrolledAt | number | 1772667414000 | Timestamp enrôlement |
| enrolledBy | string | "admin-uid" | UID admin qui a enrôlé |

### Méthode 2 : Import JSON

**Étape 1** : Préparer le fichier JSON

Créer un fichier `vehicles.json` :

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
        "route": "DEM-DEM Express",
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
        "route": "DEM-DEM Express",
        "isActive": true,
        "enrolledAt": 1772667414000,
        "enrolledBy": "admin-uid"
      },
      "vehicle-003": {
        "pin": "345678",
        "driverName": "Ibrahima Ndiaye",
        "licensePlate": "DK-3456-EF",
        "driverPhone": "+221773456789",
        "vehicleType": "bus",
        "capacity": 35,
        "route": "DEM-DEM Express",
        "isActive": true,
        "enrolledAt": 1772667414000,
        "enrolledBy": "admin-uid"
      },
      "vehicle-004": {
        "pin": "456789",
        "driverName": "Abdoulaye Fall",
        "licensePlate": "DK-7890-GH",
        "driverPhone": "+221774567890",
        "vehicleType": "car",
        "capacity": 45,
        "route": "DEM-DEM Express",
        "isActive": true,
        "enrolledAt": 1772667414000,
        "enrolledBy": "admin-uid"
      },
      "vehicle-005": {
        "pin": "567890",
        "driverName": "Moussa Sarr",
        "licensePlate": "DK-1234-IJ",
        "driverPhone": "+221775678901",
        "vehicleType": "bus",
        "capacity": 32,
        "route": "DEM-DEM Express",
        "isActive": true,
        "enrolledAt": 1772667414000,
        "enrolledBy": "admin-uid"
      }
    }
  }
}
```

**Étape 2** : Importer dans Firebase
- Dans Realtime Database, cliquer sur les 3 points `⋮` en haut à droite
- Sélectionner **Import JSON**
- Choisir le fichier `vehicles.json`
- Confirmer l'import

## Règles de Sécurité à Appliquer

**IMPORTANT** : Déployer les règles de sécurité pour protéger les données

### Fichier `database.rules.json`

Ajouter cette section :

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

### Déployer les Règles

```bash
firebase deploy --only database
```

## Générer des Codes PIN Uniques

### Script Python

```python
import random

def generate_pin():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

# Générer 100 PINs uniques
pins = set()
while len(pins) < 100:
    pins.add(generate_pin())

for i, pin in enumerate(sorted(pins), 1):
    print(f"vehicle-{i:03d}: {pin}")
```

### En JavaScript (Console Browser)

```javascript
const generatePIN = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const pins = new Set();
while (pins.size < 100) {
  pins.add(generatePIN());
}

Array.from(pins).sort().forEach((pin, i) => {
  console.log(`vehicle-${String(i + 1).padStart(3, '0')}: ${pin}`);
});
```

## Vérification Post-Ajout

### 1. Vérifier dans Firebase Console
- Les véhicules apparaissent dans `transport/vehicles`
- Tous les champs sont présents
- Les PINs sont uniques

### 2. Tester la Connexion
- Ouvrir `/epscant-login.html`
- Saisir un PIN
- Vérifier la connexion réussie
- Vérifier la redirection vers `/epscant-transport.html`

### 3. Vérifier la Session
- Ouvrir DevTools → Application → Local Storage
- Chercher `demdem_vehicle_session`
- Vérifier les données :
  ```json
  {
    "vehicleId": "vehicle-001",
    "driverName": "Mamadou Diallo",
    "licensePlate": "DK-5678-AB",
    "loginTime": 1772667414000
  }
  ```

### 4. Vérifier les Logs Firebase
- Realtime Database → `transport/sessions/{vehicleId}`
- Vérifier la présence de :
  - `lastLogin`
  - `deviceId`
  - `isOnline`

## Gestion des Véhicules

### Désactiver un Véhicule

Dans Firebase Console :
- `transport/vehicles/{vehicleId}/isActive` → `false`

Le véhicule ne pourra plus se connecter.

### Réactiver un Véhicule

Dans Firebase Console :
- `transport/vehicles/{vehicleId}/isActive` → `true`

### Changer le PIN d'un Véhicule

Dans Firebase Console :
- `transport/vehicles/{vehicleId}/pin` → nouveau PIN (6 chiffres)
- **IMPORTANT** : Vérifier que le nouveau PIN est unique

### Supprimer un Véhicule

Dans Firebase Console :
- Cliquer sur `{vehicleId}` → Supprimer
- ⚠️ **ATTENTION** : Suppression définitive

## Bonnes Pratiques

### Sécurité des PINs
- ✅ Toujours 6 chiffres
- ✅ Uniques dans toute la base
- ✅ Ne jamais partager publiquement
- ✅ Changer régulièrement si compromis

### Naming Convention
- `vehicle-001`, `vehicle-002`, etc. (numérotation séquentielle)
- OU `vehicle-{licensePlate}` (ex: `vehicle-DK5678AB`)
- OU `vehicle-{uuid}` (identifiant aléatoire)

### Capacité
- Bus : 30-45 passagers
- Minibus : 12-20 passagers
- Car : 50+ passagers

### Types de Véhicules
- `bus` : Bus standard
- `minibus` : Minibus/Van
- `car` : Car/Autocar
- `taxi` : Taxi collectif (7 places)

## Migrations Futures

### Interface Admin (À Développer)

Créer une page admin pour :
- Enrôler nouveaux véhicules via formulaire
- Générer PINs automatiquement
- Voir liste tous véhicules
- Activer/désactiver véhicules
- Modifier informations véhicules
- Voir statistiques par véhicule

### Export/Backup

Régulièrement exporter les données :
```bash
# Firebase CLI
firebase database:get /transport/vehicles > backup-vehicles.json
```

### Monitoring

Créer des alertes pour :
- Nouveaux véhicules ajoutés
- Véhicules inactifs depuis X jours
- Tentatives connexion avec PIN invalide
- Anomalies de scans

## Support

En cas de problème :
- Vérifier les règles Firebase déployées
- Vérifier les logs dans la console browser
- Vérifier la structure exacte des données
- Tester avec un PIN connu fonctionnel

## Résumé Commandes Rapides

```bash
# Voir les règles actuelles
firebase database:rules:get

# Déployer nouvelles règles
firebase deploy --only database

# Backup véhicules
firebase database:get /transport/vehicles > backup.json

# Restaurer véhicules
firebase database:set /transport/vehicles backup.json
```
