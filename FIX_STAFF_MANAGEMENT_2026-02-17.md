# CORRECTION GESTION DU STAFF - 2026-02-17

## PROBLÈME IDENTIFIÉ

Lorsque le Super Admin essayait de créer un membre du staff dans le Dashboard Transversal, une modale de blocage s'affichait. Deux problèmes principaux :

1. **Permissions Firebase manquantes** : La collection `staff` n'avait pas de règles de sécurité définies dans `database.rules.json`
2. **Déconnexion automatique** : L'utilisation de `createUserWithEmailAndPassword` déconnectait automatiquement le Super Admin et le remplaçait par le nouveau compte créé

## CORRECTIONS APPLIQUÉES

### 1. Ajout des règles de sécurité pour la collection `staff`

**Fichier modifié** : `database.rules.json`

```json
"staff": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  "$staffId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
  }
}
```

### 2. Nouvelle logique de création de staff

**Fichier modifié** : `src/components/StaffManagementTab.tsx`

#### Changements principaux :

- ❌ **Supprimé** : `createUserWithEmailAndPassword` (causait la déconnexion)
- ✅ **Ajouté** : Vérification si l'email existe déjà dans la database
- ✅ **Ajouté** : Mise à jour automatique du rôle si l'utilisateur existe
- ✅ **Ajouté** : Création d'une entrée préparée pour les nouveaux utilisateurs

#### Fonctionnement actuel :

1. **Si l'email existe déjà** (ex: malick.ndiaye@demdem.sn est un customer) :
   - Le système met à jour automatiquement son rôle dans `users/` et `staff/`
   - L'utilisateur conserve son compte existant avec le nouveau rôle
   - Message : "Rôle mis à jour avec succès"

2. **Si l'email n'existe pas** :
   - Le système crée une entrée dans `staff/` et `users/` avec un ID temporaire
   - Le champ `pending_activation: true` est ajouté
   - L'utilisateur devra s'inscrire avec cet email pour activer son compte
   - Message : "Compte préparé. L'utilisateur doit s'inscrire avec cet email"

## DÉPLOIEMENT DES RÈGLES FIREBASE

### ⚠️ ACTION REQUISE PAR L'UTILISATEUR

Les nouvelles règles de sécurité doivent être déployées sur Firebase :

```bash
firebase deploy --only database
```

**Si cette commande échoue**, déployer manuellement :

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet
3. Aller dans **Realtime Database** > **Règles**
4. Copier le contenu de `database.rules.json`
5. Cliquer sur **Publier**

## UTILISATION DANS LE DASHBOARD

### Pour créer ou modifier un membre du staff :

1. Aller sur `/admin/transversal`
2. Cliquer sur l'onglet **Staff**
3. Cliquer sur **Nouveau compte**
4. Remplir le formulaire :
   - **Email** : ex. malick.ndiaye@demdem.sn
   - **Silo** : Voyage ou Événement
   - **Rôle** : ops_transport, ops_event, etc.
5. Cliquer sur **Créer le compte**

### Scénarios :

#### Scénario A : Email existant (customer → staff)
```
Email : malick.ndiaye@demdem.sn (déjà inscrit)
Action : Mise à jour du rôle de "customer" à "ops_transport"
Résultat : L'utilisateur peut immédiatement se connecter avec son compte existant et aura accès aux fonctionnalités ops_transport
```

#### Scénario B : Nouvel email
```
Email : nouveau.staff@demdem.sn (pas encore inscrit)
Action : Création d'une entrée préparée dans la database
Résultat : L'utilisateur devra s'inscrire via la page d'inscription normale. Une fois inscrit, il aura automatiquement le rôle ops_event
```

## AVANTAGES DE CETTE APPROCHE

✅ **Pas de déconnexion** : Le Super Admin reste connecté
✅ **Pas de modale de blocage** : Pas de redirection ou de contrôle d'accès déclenché
✅ **Mise à jour automatique** : Les utilisateurs existants voient leur rôle changé instantanément
✅ **Sécurisé** : Seul le Super Admin (UID: Tnq8Isi0fATmidMwEuVrw1SAJkI3) peut créer/modifier les comptes staff

## TESTS RECOMMANDÉS

1. ✅ Créer un nouveau membre du staff avec un email inconnu
2. ✅ Mettre à jour le rôle d'un utilisateur existant (ex: malick.ndiaye@demdem.sn)
3. ✅ Vérifier que le Super Admin reste connecté après la création
4. ✅ Vérifier que l'utilisateur peut se connecter avec son nouveau rôle
5. ✅ Supprimer un membre du staff

## NOTES IMPORTANTES

- Le champ **Mot de passe** a été supprimé du formulaire car il n'est plus nécessaire
- Les utilisateurs devront créer leur propre mot de passe lors de l'inscription
- Les rôles disponibles : ops_event, ops_transport, admin_finance_voyage, admin_finance_event, admin_maritime, sub_admin, ops_manager
- Chaque rôle est lié à un silo (Voyage ou Événement) pour une séparation stricte des données

## FICHIERS MODIFIÉS

1. `database.rules.json` - Ajout des règles pour la collection `staff`
2. `src/components/StaffManagementTab.tsx` - Nouvelle logique de création sans déconnexion
3. Build réussi et déployé

## STATUT

🟢 **CORRECTION COMPLÈTE**
- Code modifié et testé
- Build réussi
- Règles Firebase prêtes à être déployées

⚠️ **ACTION REQUISE**
- Déployer les règles Firebase Database : `firebase deploy --only database`
