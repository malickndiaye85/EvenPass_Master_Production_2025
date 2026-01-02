# Guide de correction pour Admin Finance et Ops Manager

## Problème identifié

Vous êtes redirigé automatiquement vers la page d'accueil après vous être connecté aux pages Admin Finance et Ops Manager avec les identifiants :
- Email : `sn.malickndiaye@gmail.com`
- Mot de passe : `MA85AS93RA18SOU22_SN`

## Cause du problème

Le système vérifie si l'utilisateur a le rôle "admin" dans Firebase Realtime Database. Pour que la connexion fonctionne, il faut créer une entrée admin dans Firebase pour cet utilisateur.

## Solution : Ajouter les données admin dans Firebase

### Étape 1 : Trouver le UID de l'utilisateur

1. Allez sur la [Console Firebase](https://console.firebase.google.com)
2. Sélectionnez le projet **evenpasssenegal**
3. Dans le menu latéral, cliquez sur **Authentication**
4. Trouvez l'utilisateur avec l'email `sn.malickndiaye@gmail.com`
5. Copiez son **UID** (User ID)

### Étape 2 : Ajouter les données admin dans Realtime Database

1. Dans la console Firebase, cliquez sur **Realtime Database** dans le menu latéral
2. Cliquez sur l'onglet **Données**
3. Naviguez vers le nœud `evenpass` (ou créez-le s'il n'existe pas)
4. Créez un nœud `admins` sous `evenpass`
5. Sous `admins`, créez un nœud avec le **UID** de l'utilisateur copié à l'étape 1
6. Ajoutez les propriétés suivantes :

```json
{
  "role": "super_admin",
  "permissions": ["all", "finance", "ops", "verification"],
  "is_active": true,
  "created_at": "2026-01-02T00:00:00.000Z",
  "updated_at": "2026-01-02T00:00:00.000Z",
  "email": "sn.malickndiaye@gmail.com",
  "full_name": "Admin Finance & Ops"
}
```

### Structure finale dans Firebase Realtime Database

```
evenpass/
  admins/
    {UID_DE_sn.malickndiaye@gmail.com}/
      role: "super_admin"
      permissions: ["all", "finance", "ops", "verification"]
      is_active: true
      created_at: "2026-01-02T00:00:00.000Z"
      updated_at: "2026-01-02T00:00:00.000Z"
      email: "sn.malickndiaye@gmail.com"
      full_name: "Admin Finance & Ops"
```

### Étape 3 : Tester la connexion

1. Déconnectez-vous si vous êtes connecté
2. Allez sur `/admin/finance/login` ou `/admin/ops/login`
3. Entrez les identifiants :
   - Email : `sn.malickndiaye@gmail.com`
   - Mot de passe : `MA85AS93RA18SOU22_SN`
4. Vous devriez maintenant accéder aux pages admin

## Alternative rapide : Utiliser le UID master

Si vous ne voulez pas créer de données admin dans Firebase, vous pouvez remplacer le UID dans le fichier `.env` :

1. Ouvrez le fichier `.env`
2. Trouvez la ligne : `VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3`
3. Remplacez le UID par celui de l'utilisateur `sn.malickndiaye@gmail.com`
4. Sauvegardez et redémarrez l'application

## Vérification

Après avoir suivi l'une des solutions ci-dessus, vous pouvez vérifier dans les logs du navigateur (Console de développement) :
- Ouvrez les outils de développement (F12)
- Allez dans l'onglet Console
- Connectez-vous
- Vous devriez voir des logs comme :
  ```
  [FIREBASE AUTH] Admin data loaded: { exists: true, isActive: true }
  [FIREBASE AUTH] Final determined role: admin
  [ADMIN FINANCE] Access granted, loading data
  ```

## Corrections apportées au code

J'ai corrigé le bug dans `src/context/FirebaseAuthContext.tsx` qui empêchait le chargement des données admin pour les utilisateurs qui n'avaient pas le UID master. Maintenant, le système charge toujours les données admin depuis Firebase, ce qui permet à plusieurs utilisateurs d'avoir le rôle admin.
