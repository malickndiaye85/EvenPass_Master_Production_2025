# Déploiement des Règles Firebase Complètes

## Fichier `database.rules.json` - Version Complète

Ce fichier contient TOUTES les règles de sécurité pour la plateforme EvenPass.

## Structure Complète des Règles

### 1. Règles Globales

```json
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

Par défaut, tout est INTERDIT. Seules les règles explicites autorisent l'accès.

### 2. Finance (Super Admin uniquement)

```json
"finances": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
},
"logs": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
},
"systemLogs": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
}
```

### 3. Événements (Public en lecture, organisateurs en écriture)

```json
"events": {
  ".read": true,
  "$eventId": {
    ".write": "auth != null && (data.child('organizerId').val() === auth.uid || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
    "tickets": {
      ".read": true,
      ".write": "auth != null"
    },
    "scans": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### 4. Utilisateurs

```json
"users": {
  ".read": "auth != null",
  "$userId": {
    ".write": "auth != null && (auth.uid === $userId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
  }
}
```

### 5. Organisateurs

```json
"organizers": {
  ".read": true,
  "$organizerId": {
    ".write": "auth != null && (auth.uid === $organizerId || auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')"
  }
}
```

### 6. Staff

```json
"staff": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3' || auth != null",
  "$staffId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
  }
}
```

### 7. EvenPass (Contrôleurs et Scans)

```json
"evenpass": {
  "global_config": {
    "home_ads": {
      ".read": true,
      ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
    }
  },
  "controllers": {
    ".read": "auth != null",
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
  },
  "sessions": {
    ".read": "auth != null",
    ".write": "auth != null"
  },
  "scans": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 8. Transport (DEM-DEM Express)

```json
"transport": {
  "vehicles": {
    ".read": "auth != null && (role === 'super_admin' || role === 'ops_transport')",
    ".indexOn": ["pin", "licensePlate", "isActive"],
    "$vehicleId": {
      ".write": "auth != null && (role === 'super_admin' || role === 'ops_transport')",
      ".validate": "newData.hasChildren(['pin', 'driverName', 'licensePlate', 'isActive'])"
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
      ".read": "auth != null && (role === 'super_admin' || role === 'ops_transport')",
      ".write": true,
      ".indexOn": ["timestamp", "passengerId"]
    }
  }
}
```

### 9. Lignes de Transport

```json
"transport_lines": {
  ".read": true,
  "$lineId": {
    ".write": "auth != null && (role === 'ops_transport' || role === 'super_admin')"
  }
}
```

### 10. Abonnés Pass

```json
"pass_subscribers": {
  ".read": "auth != null && (role === 'ops_transport' || role === 'super_admin')",
  "$subscriberId": {
    ".write": "auth != null"
  }
}
```

### 11. Ops Events (Contrôleurs événements)

```json
"opsEvents": {
  ".read": "auth != null",
  ".write": "auth != null",
  "events": {
    ".read": true,
    ".write": "auth != null"
  },
  "controllers": {
    ".read": true,
    ".write": "auth != null",
    ".indexOn": ["eventId", "code"]
  },
  "scans": {
    ".read": "auth != null",
    ".write": "auth != null",
    ".indexOn": ["eventId", "timestamp"]
  }
}
```

### 12. Rôles Admin

```json
"adminRoles": {
  ".read": "auth != null",
  "$userId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
    ".validate": "newData.hasChildren(['role', 'email'])"
  }
}
```

### 13. Codes d'Accès

```json
"accessCodes": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  ".indexOn": ["code", "type", "isActive"],
  "$codeId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
    ".validate": "newData.hasChildren(['code', 'type', 'createdAt'])"
  }
}
```

### 14. Arrière-plans Landing Pages

```json
"landing_backgrounds": {
  ".read": true,
  "$pageId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
    ".validate": "newData.hasChildren(['url', 'updatedAt'])"
  }
}
```

## Déploiement des Règles

### Méthode 1 : Firebase CLI (Recommandée)

**Prérequis** :
```bash
npm install -g firebase-tools
firebase login
```

**Initialiser le projet** :
```bash
cd /chemin/vers/projet
firebase init database
```

**Sélectionner** :
- Use existing project → evenpasssenegal
- Database rules file → database.rules.json

**Déployer** :
```bash
firebase deploy --only database
```

**Output attendu** :
```
✔ Deploy complete!

Resource: evenpasssenegal (default)
- Database Rules
```

### Méthode 2 : Console Firebase

1. Ouvrir https://console.firebase.google.com
2. Sélectionner **evenpasssenegal**
3. Menu → **Realtime Database**
4. Onglet **Rules**
5. Copier-coller le contenu de `database.rules.json`
6. Cliquer **Publish**

## Vérification Post-Déploiement

### 1. Vérifier dans Console Firebase

**Realtime Database → Rules** :
- Vérifier que les règles sont bien déployées
- Date de dernière publication affichée

### 2. Tester les Accès

**Test lecture publique (events)** :
```javascript
// Dans la console browser
import { getDatabase, ref, get } from 'firebase/database';
const db = getDatabase();
const eventsRef = ref(db, 'events');
const snapshot = await get(eventsRef);
console.log('Events:', snapshot.val()); // Doit fonctionner
```

**Test véhicules (nécessite auth)** :
```javascript
// Doit échouer si non authentifié
const vehiclesRef = ref(db, 'transport/vehicles');
const snapshot = await get(vehiclesRef);
// Error: Permission denied
```

**Test super admin** :
```javascript
// Avec auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'
const financesRef = ref(db, 'finances');
const snapshot = await get(financesRef);
console.log('Finances:', snapshot.val()); // Doit fonctionner
```

### 3. Simuler les Règles

Dans **Console Firebase → Realtime Database → Rules** :

**Simulateur** :
- Type: Read
- Location: /transport/vehicles
- Authenticated: No
- Résultat attendu: **Denied**

**Simulateur** :
- Type: Read
- Location: /events
- Authenticated: No
- Résultat attendu: **Allowed**

## Index pour Performance

Les règles incluent des index pour optimiser les requêtes :

```json
".indexOn": ["pin", "licensePlate", "isActive"]
".indexOn": ["eventId", "code"]
".indexOn": ["timestamp", "passengerId"]
".indexOn": ["code", "type", "isActive"]
```

Ces index accélèrent les recherches sur ces champs.

## Hiérarchie des Permissions

### Super Admin (`Tnq8Isi0fATmidMwEuVrw1SAJkI3`)
- Accès TOTAL à tout
- Peut modifier finances, logs, staff
- Peut créer/modifier/supprimer tous les rôles

### Ops Transport
- Peut lire/écrire dans `transport/vehicles`
- Peut lire `transport/scans`
- Peut gérer `transport_lines`
- Peut voir `pass_subscribers`

### Ops Events
- Peut gérer `opsEvents/controllers`
- Peut voir `opsEvents/scans`
- Peut modifier événements assignés

### Organisateurs
- Peuvent modifier leurs propres événements
- Peuvent voir tickets de leurs événements
- Peuvent voir scans de leurs événements

### Utilisateurs Authentifiés
- Peuvent lire événements publics
- Peuvent modifier leur propre profil
- Peuvent scanner (écrire dans scans)

### Utilisateurs Non-Authentifiés
- Peuvent UNIQUEMENT lire événements publics
- Peuvent lire configuration publique

## Sécurité Renforcée

### Validations

**Véhicules** :
- PIN doit être string de 6 caractères
- Doit avoir champs obligatoires : pin, driverName, licensePlate, isActive

**Codes d'Accès** :
- Code doit être string de 6 caractères
- Doit avoir : code, type, createdAt

**Rôles Admin** :
- Doit avoir : role, email

### Restrictions

**Finance** :
- UNIQUEMENT super admin
- Aucun autre rôle ne peut accéder

**Logs Système** :
- UNIQUEMENT super admin
- Traçabilité garantie

**Sessions Véhicules** :
- Lecture/écriture publique pour flexibilité
- Données non sensibles (lastLogin, isOnline)

## Commandes Utiles

### Voir les règles actuelles
```bash
firebase database:get .settings/rules --pretty
```

### Backup des règles
```bash
firebase database:get .settings/rules > backup-rules-$(date +%Y%m%d).json
```

### Restaurer des règles
```bash
firebase deploy --only database
```

### Test local des règles (émulateur)
```bash
firebase emulators:start --only database
```

## Résolution de Problèmes

### Erreur "Permission Denied"

**Vérifier** :
1. L'utilisateur est-il authentifié ?
2. Le rôle est-il correct dans `/adminRoles/{uid}` ?
3. Les règles sont-elles bien déployées ?
4. Le chemin d'accès est-il correct ?

**Solution** :
```javascript
// Vérifier le rôle de l'utilisateur
const roleRef = ref(db, `adminRoles/${auth.currentUser.uid}`);
const snapshot = await get(roleRef);
console.log('Mon rôle:', snapshot.val());
```

### Erreur "Index not defined"

**Cause** : Requête sur un champ non indexé

**Solution** :
Ajouter dans les règles :
```json
".indexOn": ["champManquant"]
```

Puis redéployer :
```bash
firebase deploy --only database
```

### Règles non mises à jour

**Cause** : Cache Firebase

**Solution** :
1. Attendre 1-2 minutes
2. Vider cache browser (Ctrl+Shift+Delete)
3. Redémarrer navigateur
4. Vérifier dans Console Firebase que les règles sont bien publiées

## Monitoring

### Logs d'Accès

Dans **Console Firebase → Realtime Database → Usage** :

- Nombre de lectures
- Nombre d'écritures
- Erreurs de permission
- Bande passante utilisée

### Alertes

Configurer des alertes pour :
- Trop de "Permission Denied" (attaque ?)
- Pics inhabituels de lecture/écriture
- Accès à des chemins sensibles (`/finances`, `/logs`)

## Checklist Déploiement

- [ ] Copier `database.rules.json` dans le projet
- [ ] Vérifier que super admin UID est correct
- [ ] Tester en local avec émulateur Firebase
- [ ] Déployer : `firebase deploy --only database`
- [ ] Vérifier dans Console Firebase
- [ ] Tester lecture publique (/events)
- [ ] Tester lecture protégée (/transport/vehicles)
- [ ] Tester accès super admin (/finances)
- [ ] Vérifier index créés
- [ ] Tester permissions de chaque rôle
- [ ] Documenter changements
- [ ] Backup des anciennes règles

## Maintenance

### Révision Mensuelle
- Vérifier les logs d'accès
- Identifier patterns suspects
- Mettre à jour si nouveaux besoins
- Tester toutes les permissions

### Backup Automatique
```bash
#!/bin/bash
# backup-rules.sh
DATE=$(date +%Y%m%d-%H%M%S)
firebase database:get .settings/rules > "backups/rules-$DATE.json"
echo "Backup créé: rules-$DATE.json"
```

Exécuter hebdomadairement via cron.

## Support

En cas de problème avec les règles :
1. Vérifier les logs dans Console Firebase
2. Tester avec le simulateur de règles
3. Vérifier l'authentification
4. Consulter la documentation Firebase
5. Contacter le support si nécessaire
