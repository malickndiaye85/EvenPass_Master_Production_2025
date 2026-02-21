# Guide de Déploiement - Règles Firestore Access Codes

## Contexte
Le formulaire d'enrôlement des véhicules échoue car la collection `access_codes` n'a pas de règles de sécurité dans Firestore.

## Problème Identifié
```
❌ ERREUR: Permission denied (Missing or insufficient permissions)
```

La collection `access_codes` était bloquée par la règle par défaut `allow read, write: if false`.

## Solution Appliquée

Ajout des règles Firestore pour la collection `access_codes` dans `firestore.rules`:

```javascript
// ============================================
// ACCESS CODES COLLECTION (Vehicle & Staff Access Codes)
// ============================================
match /access_codes/{codeId} {
  // Lecture pour tous les authentifiés
  allow read: if isAuthenticated();

  // Création par utilisateurs authentifiés (ops_transport, admin)
  allow create: if isAuthenticated();

  // Modification uniquement par admin
  allow update: if isAdminFinance();

  // Suppression uniquement par admin
  allow delete: if isAdminFinance();
}
```

## Étapes de Déploiement

### 1. Vérifier le Projet Firebase Actif
```bash
firebase projects:list
firebase use default
```

### 2. Déployer les Règles Firestore
```bash
firebase deploy --only firestore:rules
```

### 3. Vérifier le Déploiement
1. Ouvrir la [Console Firebase](https://console.firebase.google.com)
2. Sélectionner votre projet
3. Aller dans **Firestore Database → Règles**
4. Vérifier que les règles pour `access_codes` sont présentes

## Test Post-Déploiement

1. Se connecter en tant qu'ops_transport: malick.ndiaye@demdem.sn
2. Aller sur `/admin/ops/transport`
3. Cliquer sur "Enrôler Véhicule"
4. Remplir le formulaire et soumettre
5. Vérifier que le code d'accès à 6 chiffres est généré
6. Vérifier dans Firestore Database → access_codes que le document est créé

## Structure Attendue dans Firestore

```
access_codes/
  └── {code} (ex: "123456")
      ├── code: "123456"
      ├── type: "vehicle"
      ├── vehicleId: "firebase-generated-key"
      ├── vehiclePlate: "DK-1234-AB"
      ├── isActive: true
      ├── createdAt: Timestamp
      └── usageCount: 0
```

## Logs de Debug

Après déploiement, les logs devraient afficher:
```
✅ [ENROLL] VehicleId généré: xxx
✅ [ENROLL] Code d'accès généré: 123456
✅ Véhicule enregistré avec succès! Code: 123456
```

## En Cas d'Erreur

Si l'erreur persiste après déploiement:

1. Vérifier que l'utilisateur est bien authentifié (UID: UcrRiu416KXZR2lZeeFiS0LgXVx1)
2. Vérifier dans la console que `request.auth != null` est vrai
3. Vérifier les logs de sécurité Firestore dans la console Firebase
4. Tester manuellement dans l'onglet "Règles" de la console avec le simulateur

## Prochaines Étapes

Une fois les règles déployées, tester:
- ✅ Création de code d'accès véhicule
- ✅ Lecture des codes existants
- ✅ Validation d'un code
- ✅ Désactivation d'un code (admin uniquement)
