# Déployer les Règles Firebase Storage

## LE PROBLÈME TROUVÉ

Le bouton "Soumettre" reste bloqué en "Envoi en cours" car **Firebase Storage bloque l'upload des documents de vérification**.

Le chemin `verification-documents/` n'était pas autorisé dans les règles de sécurité.

## SOLUTION : Déployer les nouvelles règles

### Option 1 : Via la Console Firebase (PLUS SIMPLE) ✅

1. **Allez dans Firebase Console** : https://console.firebase.google.com

2. **Sélectionnez votre projet** "EvenPass"

3. **Allez dans Storage** (menu de gauche)

4. **Cliquez sur l'onglet "Règles"** (Rules)

5. **Copiez-collez le contenu du fichier `storage.rules`** dans l'éditeur

6. **Cliquez sur "Publier"** (Publish)

### Option 2 : Via Firebase CLI

```bash
# 1. Installer Firebase CLI si pas déjà fait
npm install -g firebase-tools

# 2. Se connecter à Firebase
firebase login

# 3. Sélectionner le projet
firebase use --add

# 4. Déployer uniquement les règles Storage
firebase deploy --only storage
```

## Vérification après déploiement

1. **Videz le cache du navigateur** : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)

2. **Essayez de créer un compte organisateur** avec un NOUVEL EMAIL

3. **Ouvrez la console du navigateur** (F12) pour voir les logs détaillés :
   - `[ORGANIZER SIGNUP] Starting signup process...`
   - `[ORGANIZER SIGNUP] Creating Firebase auth user...`
   - `[ORGANIZER SIGNUP] Uploading CNI document...`
   - `[ORGANIZER SIGNUP] Signup complete!`

4. Si ça bloque encore, **envoyez-moi les logs de la console**

## Ce qui a été corrigé

1. ✅ Ajout des règles pour `verification-documents/` dans Storage
2. ✅ Logs détaillés pour suivre chaque étape
3. ✅ Meilleure gestion des erreurs
4. ✅ Message d'erreur clair si l'email est déjà utilisé

## Rappel Important

Utilisez un **NOUVEL EMAIL** qui n'a jamais été utilisé dans Firebase, ou supprimez l'ancien compte dans Firebase Console → Authentication.
