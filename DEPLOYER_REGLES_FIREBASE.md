# Déployer les règles Firebase

Les règles Firebase Realtime Database ont été mises à jour pour corriger les problèmes de permissions.

## Étapes pour déployer les règles:

### Option 1: Via la Console Firebase (Recommandé)

1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **Realtime Database**
4. Cliquez sur l'onglet **Règles**
5. Copiez le contenu du fichier `database.rules.json`
6. Collez-le dans l'éditeur de règles
7. Cliquez sur **Publier**

### Option 2: Via Firebase CLI

Si vous avez Firebase CLI installé:

```bash
firebase deploy --only database
```

## Règles mises à jour

Les règles ont été restructurées pour autoriser l'accès au chemin `evenpass/...`:

- `evenpass/users/{userId}` - Accès utilisateur
- `evenpass/organizers/{organizerId}` - Accès organisateur
- `evenpass/admins/{adminId}` - Accès admin
- `evenpass/events/{eventId}` - Gestion événements
- etc.

## Vérification

Après déploiement, testez:
1. Connexion avec l'admin finance (UID: Tnq8Isi0fATmidMwEuVrw1SAJkI3)
2. Connexion avec un organisateur
3. Vérifiez qu'il n'y a plus d'erreur "Permission denied" dans la console
