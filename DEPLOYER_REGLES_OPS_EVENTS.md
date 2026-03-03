# Déploiement des Règles Firebase pour OPS Events

## Problème Résolu
Les règles Firebase Realtime Database pour `opsEvents` ne permettaient pas l'écriture au niveau des collections parent, causant des erreurs "Permission Denied".

## Modifications Apportées

### Avant (Règles Restrictives)
```json
"opsEvents": {
  ".read": "auth != null",
  ".write": "auth != null",
  "events": {
    ".read": "auth != null",
    "$eventId": {
      ".write": "auth != null"  // ❌ Écriture uniquement sur enfants
    }
  },
  "controllers": {
    ".read": "auth != null",
    "$controllerId": {
      ".write": "auth != null"  // ❌ Écriture uniquement sur enfants
    }
  }
}
```

### Après (Règles Corrigées)
```json
"opsEvents": {
  ".read": "auth != null",
  ".write": "auth != null",
  "events": {
    ".read": "auth != null",
    ".write": "auth != null",  // ✅ Écriture sur la collection
    "$eventId": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  },
  "controllers": {
    ".read": "auth != null",
    ".write": "auth != null",  // ✅ Écriture sur la collection
    "$controllerId": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  },
  "scans": {
    ".read": "auth != null",
    ".write": "auth != null",  // ✅ Écriture sur la collection
    "$scanId": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Instructions de Déploiement

### Option 1 : Via la Console Firebase (Recommandé)

1. **Ouvrir la Console Firebase**
   - Allez sur https://console.firebase.google.com/
   - Sélectionnez votre projet

2. **Accéder aux Règles Realtime Database**
   - Menu de gauche : **Realtime Database**
   - Onglet : **Règles**

3. **Copier les Nouvelles Règles**
   - Copiez le contenu complet du fichier `database.rules.json`
   - Collez dans l'éditeur de la console

4. **Publier**
   - Cliquez sur **Publier**
   - Confirmez le déploiement

### Option 2 : Via Firebase CLI (Si disponible)

```bash
# Installer Firebase CLI globalement
npm install -g firebase-tools

# Se connecter
firebase login

# Déployer uniquement les règles Database
firebase deploy --only database
```

### Option 3 : Via GitHub Actions (Automatique)

Le workflow GitHub Actions déploiera automatiquement les règles lors du prochain push vers la branche `main`.

## Vérification du Déploiement

1. **Dans la Console Firebase**
   - Vérifiez que les règles affichent bien `.write: "auth != null"` pour `events`, `controllers` et `scans`

2. **Test de Création de Contrôleur**
   - Connectez-vous en tant qu'OPS Manager
   - Sélectionnez un événement
   - Cliquez sur "Ajouter un Contrôleur"
   - Remplissez le formulaire
   - Le code à 6 chiffres devrait s'afficher

3. **Vérification des Logs Console**
   ```
   [CREATE CONTROLLER] Starting creation for: ...
   [CREATE CONTROLLER] Generated code: 123456
   [CREATE CONTROLLER] Event not found in opsEvents, initializing...
   [CREATE CONTROLLER] Event initialized in opsEvents/events
   [CREATE CONTROLLER] Successfully created controller
   ```

## Impact des Modifications

✅ **Autorise**
- Utilisateurs authentifiés peuvent lire/écrire dans `opsEvents`
- OPS Managers peuvent créer des contrôleurs
- Initialisation automatique des événements dans `opsEvents/events`
- Création de scans par les contrôleurs

⚠️ **Sécurité Maintenue**
- Seuls les utilisateurs authentifiés ont accès
- Pas d'accès public
- Les règles super_admin restent intactes pour les autres collections

## Erreurs Résolues

❌ **Avant**
```
Error: Permission denied
Error loading stats: Error: Permission denied
Error loading affluence: Error: Permission denied
[CREATE CONTROLLER] Error creating controller: Error: Permission denied
```

✅ **Après**
```
[CREATE CONTROLLER] Successfully created controller
Code généré: 123456
```

## Support

Si le problème persiste après le déploiement :

1. Vérifiez que l'utilisateur est bien authentifié
2. Vérifiez le rôle dans Firebase Auth Console
3. Testez avec un autre compte OPS Manager
4. Consultez les logs Firebase Database dans la console

---

**Date de Modification** : 2026-03-03
**Fichier Modifié** : `database.rules.json`
**Déploiement Requis** : OUI - Via Console Firebase ou CLI
