# Migration Firestore : Collection `access_codes`

## Structure de données

### Collection : `access_codes`

Chaque document représente un code PIN unique pour un contrôleur (fixe ou volant).

```typescript
interface AccessCode {
  code: string;              // Code PIN à 6 chiffres (ex: "123456")
  type: 'fixe' | 'volant';   // Type de contrôleur
  role: 'controller';         // Rôle Firebase
  userId?: string;            // UID Firebase si lié à un compte

  // Pour contrôleurs fixes (liés à un véhicule)
  vehicleId?: string;         // ID du véhicule
  vehiclePlate?: string;      // Plaque d'immatriculation

  // Pour contrôleurs volants
  name?: string;              // Nom du contrôleur
  phone?: string;             // Téléphone du contrôleur

  // Métadonnées
  active: boolean;            // Code actif ou désactivé
  createdAt: Timestamp;
  createdBy: string;          // UID de l'admin qui a créé le code
  lastUsedAt?: Timestamp;
  usageCount: number;
}
```

## Règles de Sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Collection access_codes
    match /access_codes/{codeId} {
      // Lecture : Tous les utilisateurs authentifiés (pour vérifier le code)
      allow read: if request.auth != null;

      // Création/Modification : Uniquement ops_transport et super_admin
      allow create, update: if request.auth != null &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ops_transport' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin');

      // Suppression : Uniquement super_admin
      allow delete: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
  }
}
```

## Index Firestore Requis

Dans la console Firebase, créer ces index :

1. **Index pour recherche par code**
   - Collection: `access_codes`
   - Champs: `code` (ASC), `active` (ASC)
   - Mode: Single

## Exemples de Documents

### Contrôleur Fixe (véhicule)

```json
{
  "code": "248573",
  "type": "fixe",
  "role": "controller",
  "vehicleId": "bus_001",
  "vehiclePlate": "DK-1234-AB",
  "active": true,
  "createdAt": "2026-02-20T10:00:00Z",
  "createdBy": "admin_uid_123",
  "usageCount": 42,
  "lastUsedAt": "2026-02-20T15:30:00Z"
}
```

### Contrôleur Volant (personnel)

```json
{
  "code": "789012",
  "type": "volant",
  "role": "controller",
  "name": "Moussa Diallo",
  "phone": "+221771234567",
  "active": true,
  "createdAt": "2026-02-20T10:00:00Z",
  "createdBy": "admin_uid_123",
  "usageCount": 15,
  "lastUsedAt": "2026-02-20T14:00:00Z"
}
```

## Génération de Codes Sécurisés

Les codes PIN doivent être :
- Uniques (vérification dans Firestore)
- Aléatoires (pas de séquences évidentes : 123456, 000000, etc.)
- 6 chiffres exactement

## Migration Données Existantes

Si des contrôleurs existent déjà avec email/password :
1. Générer un code PIN unique pour chacun
2. Créer le document dans `access_codes`
3. Envoyer le code par SMS ou WhatsApp
4. Conserver l'ancien compte pour référence (mais login désactivé)

## Administration des Codes

Interface dans le Dashboard Ops Transport pour :
- Créer de nouveaux codes (fixe ou volant)
- Désactiver un code (si compromis)
- Régénérer un code (si oublié)
- Voir l'historique d'utilisation
- Lier/délier un code à un véhicule

## Sécurité

### Bonnes Pratiques
- ✅ Codes uniques et aléatoires
- ✅ Possibilité de désactiver un code instantanément
- ✅ Tracking de l'utilisation (détection d'abus)
- ✅ Pas de limite de tentatives (mais logging pour sécurité)
- ✅ Codes changés régulièrement (mensuel recommandé)

### Protection Anti-Brute Force
- Logger chaque tentative de connexion (succès et échecs)
- Alerter si > 10 tentatives échouées en 5 minutes
- Verrouillage IP possible (côté serveur)

## Workflow d'Authentification

1. Utilisateur saisit le code PIN (6 chiffres)
2. Requête Firestore : `access_codes` où `code == PIN` et `active == true`
3. Si trouvé :
   - Créer session Firebase (signInAnonymously)
   - Stocker les métadonnées (type, véhicule, etc.) dans localStorage
   - Incrémenter `usageCount`
   - Mettre à jour `lastUsedAt`
   - Rediriger vers `/controller-epscanv`
4. Si non trouvé :
   - Afficher "Code incorrect"
   - Vibration + animation shake
   - Logger la tentative échouée
