# 🔧 Configuration GitHub pour DemDem

## Étape 1: Créer le dépôt GitHub

```bash
# Le dépôt existe déjà : malickndiaye85/EvenPass_Master_Production_2025
# Ou créer un nouveau dépôt "DemDem" si souhaité
```

## Étape 2: Lier le projet local au dépôt

```bash
# Déjà initialisé avec:
# git init
# git branch -m main

# Ajouter le remote
git remote add origin https://github.com/malickndiaye85/EvenPass_Master_Production_2025.git

# Ou si nouveau dépôt:
# git remote add origin https://github.com/malickndiaye85/DemDem.git
```

## Étape 3: Premier commit et push

```bash
# Ajouter tous les fichiers
git add .

# Commit initial
git commit -m "feat: DemDem conversion complete with CI/CD"

# Push vers GitHub
git push -u origin main
```

## Étape 4: Configurer les GitHub Secrets

Aller dans **Settings → Secrets and variables → Actions** et ajouter :

### 1. FIREBASE_SERVICE_ACCOUNT
```json
{
  "type": "service_account",
  "project_id": "evenpasssenegal",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  ...
}
```
Source : Firebase Console → Project Settings → Service Accounts → Generate new private key

### 2. Variables d'environnement Firebase

Copier depuis votre fichier `.env` :

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=evenpasssenegal.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=evenpasssenegal
VITE_FIREBASE_STORAGE_BUCKET=evenpasssenegal.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=https://evenpasssenegal...firebasedatabase.app
```

### 3. Variables Supabase (optionnel)

```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Étape 5: Vérifier le workflow

Une fois poussé vers GitHub :

1. Aller dans l'onglet **Actions**
2. Vérifier que le workflow "Deploy to Firebase Hosting on merge" s'exécute
3. Attendre la fin du build et déploiement (2-3 min)

## Étape 6: Configurer le domaine demdem.sn

### Dans Firebase Console

1. Hosting → Add custom domain
2. Entrer `demdem.sn`
3. Suivre les instructions DNS

### Chez votre registrar DNS

Ajouter les enregistrements A fournis par Firebase :

```
Type A: demdem.sn → [IP Firebase]
Type A: www.demdem.sn → [IP Firebase]
```

## 🎉 Terminé !

Votre application sera accessible sur :
- **Production** : https://demdem.sn
- **Preview** : Auto-généré pour chaque Pull Request

## 🔄 Workflow de développement

```bash
# Créer une feature branch
git checkout -b feature/nouvelle-fonctionnalite

# Faire des modifications
# ...

# Commit
git add .
git commit -m "feat: ajout nouvelle fonctionnalité"

# Push et créer une PR
git push origin feature/nouvelle-fonctionnalite
# Puis créer une Pull Request sur GitHub

# Une fois la PR validée et mergée, déploiement auto sur demdem.sn
```

---
**Date:** Janvier 2026
**Par:** Bolt
