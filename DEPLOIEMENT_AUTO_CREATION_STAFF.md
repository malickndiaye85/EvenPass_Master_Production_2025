# Instructions de Déploiement - Auto-Création Staff

## 📋 Pré-requis

- [x] Build complété avec succès
- [x] Fichier `dist/assets/index-BcrWfxQc.js` généré (2.0M)
- [x] Modifications dans `database.rules.json` prêtes
- [x] Tests unitaires en local OK

---

## 🚀 Étapes de déploiement

### Étape 1 : Déployer les règles Firebase Database

```bash
firebase deploy --only database
```

**Vérification** :
1. Aller dans [Firebase Console](https://console.firebase.google.com)
2. Sélectionner le projet `demdem-sn`
3. Aller dans **Realtime Database** > **Rules**
4. Vérifier que les règles contiennent :
   ```json
   "admin_logs": {
     ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
     "$logId": {
       ".write": true,
       ".validate": "newData.hasChildren(['timestamp', 'action', 'email']) && newData.child('timestamp').isNumber()"
     }
   }
   ```

**Temps estimé** : 30 secondes

---

### Étape 2 : Déployer le frontend sur Firebase Hosting

```bash
firebase deploy --only hosting
```

**Ce qui sera déployé** :
- Tous les fichiers du dossier `dist/`
- Nouveau JS : `index-BcrWfxQc.js` (2.0M)
- Service Worker mis à jour avec timestamp : `1771454102775`

**Vérification** :
1. Aller sur `https://demdem.sn`
2. Ouvrir la console du navigateur (F12)
3. Vérifier que le JS chargé est `index-BcrWfxQc.js`
4. Vérifier qu'il n'y a pas d'erreur 404

**Temps estimé** : 2-3 minutes

---

### Étape 3 : Vider le cache utilisateur

**Pour Chrome/Edge** :
1. `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
2. Ou : F12 > Application > Clear storage > Clear site data

**Pour Firefox** :
1. `Ctrl+Shift+Delete`
2. Cocher "Cache"
3. Cliquer sur "Effacer maintenant"

**Alternative** : Navigation privée pour tester immédiatement

---

### Étape 4 : Tests de validation

#### Test 1 : Connexion avec compte pré-enregistré

1. Aller sur `https://demdem.sn/admin/login`
2. Entrer les identifiants de Malick : `malick.ndiaye@demdem.sn` / `[son mot de passe]`
3. Cliquer sur "Se connecter"

**Résultat attendu** :
```
✅ Écran de vérification (2 secondes)
✅ Compte Firebase Auth créé automatiquement
✅ Redirection vers le dashboard approprié
✅ Aucune erreur dans la console
```

**Logs attendus dans la console** :
```
[UNIFIED LOGIN] Login attempt for: malick.ndiaye@demdem.sn
[FIREBASE AUTH] 🔐 signIn called for: malick.ndiaye@demdem.sn
[FIREBASE AUTH] ❌ Sign in error: auth/invalid-credential
[UNIFIED LOGIN] Sign in failed, checking for pre-registered staff account...
[UNIFIED LOGIN] Found pre-registered staff account
[UNIFIED LOGIN] Password matches! Creating Firebase Auth account...
[UNIFIED LOGIN] Firebase Auth account created with UID: [nouveau UID]
[UNIFIED LOGIN] Account migration completed successfully
[UNIFIED LOGIN] Sign in successful, showing verification screen
```

#### Test 2 : Vérification dans Firebase

1. Aller dans Firebase Console > Authentication
2. Vérifier que le compte `malick.ndiaye@demdem.sn` est créé

3. Aller dans Realtime Database
4. Vérifier que :
   - `/admins/[nouvel UID]` existe avec `is_active: true`
   - `/staff/[nouvel UID]` existe
   - `/users/[nouvel UID]` existe sans champ `password`
   - L'ancien `/staff/staff_[timestamp]_[random]` est supprimé

#### Test 3 : Vérification des logs

1. Dans Realtime Database, aller dans `/admin_logs/`
2. Vérifier qu'il y a un nouveau log avec :
   ```json
   {
     "timestamp": 1771454200000,
     "action": "login_attempt",
     "email": "malick.ndiaye@demdem.sn",
     "success": true
   }
   ```

3. Vérifier qu'il n'y a **AUCUNE erreur** `PERMISSION_DENIED`

#### Test 4 : Navigation dans l'application

1. Une fois connecté, vérifier que :
   - Le nom/email s'affiche correctement
   - Les permissions du rôle sont appliquées
   - Pas d'erreur de chargement des données

---

## ✅ Checklist de validation finale

### Avant déploiement
- [x] Build complété sans erreur
- [x] Nouveau code présent dans `dist/assets/index-BcrWfxQc.js`
- [x] Message "Bienvenue dans l'équipe DEM-DEM" présent dans le bundle
- [x] Message "Staff account found but no password set" présent dans le bundle

### Après déploiement rules
- [ ] Règles Firebase déployées avec succès
- [ ] Règle `/admin_logs/$logId/.write: true` visible dans la console
- [ ] Règle `/staff/.read: auth.uid === ... || auth != null` visible

### Après déploiement hosting
- [ ] Hosting déployé avec succès
- [ ] JS `index-BcrWfxQc.js` accessible sur `https://demdem.sn/assets/index-BcrWfxQc.js`
- [ ] Pas d'erreur 404 dans la console

### Tests fonctionnels
- [ ] Connexion réussie avec compte pré-enregistré
- [ ] Compte Firebase Auth créé automatiquement
- [ ] Données migrées vers le vrai UID
- [ ] Anciennes entrées temporaires supprimées
- [ ] Logs écrits sans erreur `PERMISSION_DENIED`
- [ ] Redirection vers le bon dashboard
- [ ] Aucune erreur dans la console navigateur

---

## 🔄 Rollback en cas de problème

### Si les règles causent un problème

1. Restaurer les anciennes règles :
```bash
git checkout HEAD~1 database.rules.json
firebase deploy --only database
```

### Si le frontend cause un problème

1. Trouver la version précédente dans Firebase Console :
   - Hosting > Release history
   - Cliquer sur "Roll back" à côté de la version précédente

2. Ou redéployer l'ancien build :
```bash
git checkout HEAD~1 dist/
firebase deploy --only hosting
```

---

## 📊 Monitoring post-déploiement

### Pendant les 24 premières heures

1. **Surveiller les logs Firebase** :
   - Realtime Database > Data > `/admin_logs/`
   - Vérifier qu'il n'y a pas de pics d'erreurs

2. **Surveiller Firebase Authentication** :
   - Authentication > Users
   - Vérifier que les nouveaux comptes sont créés correctement

3. **Surveiller les erreurs JavaScript** :
   - Ouvrir la console sur plusieurs pages
   - Vérifier qu'il n'y a pas d'erreurs liées à l'authentification

### Métriques à surveiller

- **Taux de réussite de connexion** : Devrait augmenter à ~100%
- **Nombre de comptes créés dans Auth** : Devrait correspondre au nombre de staff pré-enregistrés qui se connectent
- **Erreurs `PERMISSION_DENIED`** : Devrait disparaître complètement
- **Erreurs `auth/invalid-credential`** : Devrait diminuer significativement

---

## 📞 Support et dépannage

### Problèmes courants

#### 1. "Email ou mot de passe incorrect" persiste

**Diagnostic** :
```
Console > Logs > Chercher "[UNIFIED LOGIN] Sign in failed, checking for pre-registered staff account..."
```

**Si ce log n'apparaît pas** :
- Le cache navigateur n'est pas vidé → `Ctrl+Shift+R`
- L'ancien JS est encore chargé → Navigation privée

**Si ce log apparaît mais aucun compte n'est trouvé** :
- Vérifier que le compte existe dans `/staff/` avec le bon email
- Vérifier que les règles permettent la lecture de `/staff/`

#### 2. Erreur `PERMISSION_DENIED` sur `/admin_logs/`

**Solution** :
```bash
firebase deploy --only database
```

Attendre 30 secondes et réessayer.

#### 3. Erreur `auth/email-already-in-use`

**Cause** : Le compte Firebase Auth existe déjà mais pas dans la base de données.

**Solution** :
1. Aller dans Firebase Console > Authentication
2. Supprimer le compte avec cet email
3. Réessayer la connexion

#### 4. Redirection incorrecte après connexion

**Diagnostic** :
- Vérifier le rôle dans `/admins/[UID]/role`
- Vérifier que `silo` et `silo_id` sont corrects

**Solution** :
- Corriger manuellement dans Realtime Database
- Ou supprimer le compte et recommencer

---

## 🎯 Résumé des commandes

```bash
# Déploiement complet
firebase deploy --only database
firebase deploy --only hosting

# Vérification du build
ls -lh dist/assets/index-*.js
grep "Staff account found but no password set" dist/assets/index-*.js

# Rollback si nécessaire
git checkout HEAD~1 database.rules.json
firebase deploy --only database
```

---

**Date** : 2026-02-18
**Responsable déploiement** : Administrateur système
**Temps estimé total** : 5-10 minutes
**Impact utilisateur** : Aucun (amélioration transparente)
**Fenêtre de maintenance** : Aucune requise
