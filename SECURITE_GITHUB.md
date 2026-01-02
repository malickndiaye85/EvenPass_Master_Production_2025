# Guide de Sécurité GitHub - EvenPass

## ⚠️ ATTENTION : Fichiers sensibles

Le fichier `.env` contient des informations **ULTRA-SENSIBLES** et ne doit **JAMAIS** être sur GitHub !

### Contenu sensible du .env
- Clés API Firebase (accès total à votre base de données)
- Clés Supabase (accès à toutes les données)
- UID Admin (accès administrateur total)
- Clés Cloudinary (upload d'images)

## ✅ Protection mise en place

1. **`.gitignore` configuré** - Le fichier `.env` ne sera pas envoyé sur GitHub
2. **`.env.example` créé** - Modèle sans données sensibles pour GitHub

## 📋 Workflow recommandé

### Pour vous (développeur principal)

1. **Gardez votre fichier `.env` UNIQUEMENT en local** sur votre ordinateur
2. **Ne le mettez JAMAIS** :
   - Sur GitHub
   - Dans un zip public
   - Dans un email
   - Sur un cloud public (Google Drive, Dropbox, etc.)

### Pour d'autres développeurs

Si quelqu'un d'autre doit travailler sur le projet :

1. Il clone le repo GitHub
2. Il copie `.env.example` vers `.env` :
   ```bash
   cp .env.example .env
   ```
3. Vous lui donnez les clés **en privé** (message privé, fichier chiffré)
4. Il remplace les valeurs dans son fichier `.env` local

## 🚨 Si vous avez déjà mis .env sur GitHub

Si vous avez **déjà poussé** le fichier `.env` sur GitHub, suivez ces étapes **IMMÉDIATEMENT** :

### 1. Régénérer TOUTES les clés

#### Firebase
1. Allez sur https://console.firebase.google.com
2. Sélectionnez votre projet **evenpasssenegal**
3. Paramètres du projet > Paramètres généraux
4. Supprimez l'ancienne application web
5. Créez une nouvelle application web
6. Récupérez les nouvelles clés

#### Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Settings > API
4. Cliquez sur "Reset" pour les clés API
5. Récupérez les nouvelles clés

#### Cloudinary
1. Allez sur https://cloudinary.com
2. Settings > Security
3. Régénérez les clés API

### 2. Retirer .env de l'historique Git

```bash
# Retirer .env de l'historique Git
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Forcer le push
git push origin --force --all
```

### 3. Mettre à jour votre .env local

Remplacez toutes les anciennes clés par les nouvelles dans votre fichier `.env` local.

## 📦 Quand vous créez un ZIP

### À INCLURE
- Tout le code source
- package.json
- .gitignore
- .env.example
- README.md
- Documentation

### À EXCLURE
- `.env` (JAMAIS !)
- `node_modules/`
- `dist/`
- Fichiers temporaires

### Commande pour créer un ZIP propre
```bash
# Sur votre ordinateur, depuis le dossier du projet
zip -r evenpass-backup.zip . -x "*.env" -x "node_modules/*" -x "dist/*"
```

## ✅ Checklist avant chaque push GitHub

Avant de pousser sur GitHub, vérifiez :

- [ ] Le fichier `.env` est dans `.gitignore`
- [ ] Vous n'avez pas de clés en dur dans le code
- [ ] Aucun mot de passe dans les fichiers
- [ ] `node_modules/` n'est pas inclus
- [ ] `dist/` n'est pas inclus

## 🔐 Bonnes pratiques

1. **Ne jamais** écrire de clés directement dans le code
2. **Toujours** utiliser les variables d'environnement (`import.meta.env.VITE_...`)
3. **Sauvegarder** votre `.env` dans un endroit sûr (gestionnaire de mots de passe, coffre chiffré)
4. **Changer** les clés régulièrement
5. **Limiter** les permissions des clés API au strict minimum

## 📞 En cas de fuite

Si vous pensez que vos clés ont été exposées :

1. **Régénérez IMMÉDIATEMENT** toutes les clés (voir section ci-dessus)
2. **Vérifiez** les logs Firebase/Supabase pour détecter des accès suspects
3. **Changez** le mot de passe admin
4. **Surveillez** l'activité pendant quelques jours

## 📚 Ressources

- [Sécurité Firebase](https://firebase.google.com/docs/rules)
- [Sécurité Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Git Secrets](https://github.com/awslabs/git-secrets)

---

**Rappel important** : Le fichier `.env` est comme la clé de votre maison. Ne la laissez jamais traîner !
