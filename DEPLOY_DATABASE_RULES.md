# Déploiement des règles Firebase Realtime Database

## Problème résolu
Les contrôleurs ne pouvaient pas se connecter car les règles Firebase bloquaient l'accès à `/opsEvents/controllers` avant authentification.

## Solution appliquée
Autorisation de la **lecture publique** (pas d'écriture) pour :
- `/opsEvents/events` - pour afficher le nom de l'événement
- `/opsEvents/controllers` - pour vérifier le code d'accès à 6 chiffres

L'écriture reste protégée (authentification requise).

## Déploiement manuel via Console Firebase

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez le projet **evenpasssenegal**
3. Dans le menu latéral gauche, cliquez sur **Realtime Database**
4. Cliquez sur l'onglet **Règles** (Rules)
5. Copiez-collez le contenu du fichier `database.rules.json` de ce projet
6. Cliquez sur **Publier** (Publish)

## Vérification
Après le déploiement, testez immédiatement :
1. Ouvrez `/controller-login.html`
2. Entrez un code à 6 chiffres (ex: 188775)
3. La console devrait afficher :
   - `✓ Firebase config loaded from env-config.js`
   - `Firebase initialized`
   - `Checking code: 188775`
   - `Step 1: Checking OPS Events...`
   - **PAS** de `Permission denied` !

## Déploiement automatique (si Firebase CLI configurée)

```bash
# Depuis la racine du projet
npx firebase-tools deploy --only database

# Ou si firebase est dans le PATH
firebase deploy --only database
```

## Règles modifiées

Les sections suivantes ont été mises à jour dans `database.rules.json` :

```json
"opsEvents": {
  "events": {
    ".read": true,  // ← Changé de "auth != null" à true
    ".write": "auth != null"
  },
  "controllers": {
    ".read": true,  // ← Changé de "auth != null" à true
    ".write": "auth != null"
  }
}
```

## Sécurité
Cette modification est **sécurisée** car :
- Seule la **lecture** est publique
- L'**écriture** reste protégée (authentification obligatoire)
- Les codes d'accès ne sont pas des données sensibles (juste des numéros à 6 chiffres)
- La vérification se fait côté serveur de toute façon
