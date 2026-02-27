# Déploiement des Règles Firebase - Transport Lines Public

## Problème Résolu

Les lignes de transport DEM-DEM Express ne s'affichaient pas sur les navigateurs où l'utilisateur n'était pas connecté car les règles Firebase exigeaient une authentification pour lire `transport_lines`.

### Erreur constatée
```
[DEBUG-ROUTES] Error fetching transport lines: Error: Permission denied
```

## Solution Appliquée

Modification de `database.rules.json` ligne 145:

**AVANT:**
```json
"transport_lines": {
  ".read": "auth != null",
  "$lineId": {
    ".write": "auth != null && (...)"
  }
}
```

**APRÈS:**
```json
"transport_lines": {
  ".read": true,
  "$lineId": {
    ".write": "auth != null && (...)"
  }
}
```

## Pourquoi cette modification est sécurisée

1. **Lecture publique** : Les lignes de transport sont des informations publiques que tous les clients doivent pouvoir consulter pour voir les offres d'abonnement
2. **Écriture protégée** : Seuls les utilisateurs authentifiés avec le rôle `ops_transport`, `super_admin` ou le super admin peuvent créer/modifier/supprimer des lignes
3. **Pas de données sensibles** : Les lignes contiennent uniquement des informations publiques (nom, trajet, tarifs)

## Déploiement

### Option 1: Via Firebase Console (Recommandé)

1. Connectez-vous à [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet `evenpasssenegal`
3. Allez dans **Realtime Database** > **Règles**
4. Localisez la section `transport_lines` (ligne ~144)
5. Changez `.read` de `"auth != null"` à `true`
6. Cliquez sur **Publier**

### Option 2: Via Firebase CLI

Si vous avez Firebase CLI installé localement:

```bash
# Depuis la racine du projet
firebase deploy --only database
```

## Vérification

Après le déploiement, testez sur un navigateur en navigation privée (non connecté):

1. Ouvrez `/voyage/express` ou `/transport/demdem-express`
2. Les lignes devraient s'afficher immédiatement
3. Dans la console, vous devriez voir:
   ```
   [DEBUG-ROUTES] Total lines count: 3
   [DEBUG-ROUTES] Active lines count: 3
   ```

## Impact

Cette modification permet:
- Aux visiteurs non connectés de consulter les lignes DEM-DEM Express
- De procéder à l'achat d'abonnements sans authentification préalable
- Une meilleure expérience utilisateur (pas besoin de créer un compte juste pour voir les offres)

## Données Concernées

Cette règle s'applique uniquement à la collection `transport_lines` qui contient:
- `name` : Nom de la ligne (ex: "Ligne A")
- `route` : Trajet (ex: "Keur Massar ⇄ Colobane")
- `price_weekly`, `price_monthly`, `price_quarterly` : Tarifs économie
- `price_weekly_confort`, `price_monthly_confort`, `price_quarterly_confort` : Tarifs prestige (optionnel)
- `has_confort` : Booléen indiquant si la ligne propose une classe prestige
- `is_active` : Statut actif/inactif
- `created_at` : Date de création

Aucune donnée personnelle ou sensible n'est exposée.
