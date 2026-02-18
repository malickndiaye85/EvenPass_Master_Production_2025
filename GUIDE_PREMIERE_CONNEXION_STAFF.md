# Guide de Première Connexion Staff

## 🎯 Objectif
Ce document explique le système d'auto-création de compte pour le personnel staff lors de leur première connexion.

---

## 📋 Vue d'ensemble

Lorsqu'un administrateur crée un compte staff dans le Dashboard Transversal, deux scénarios sont possibles :

### Scénario 1 : Compte créé AVEC mot de passe
1. Admin crée le compte avec email + mot de passe
2. Les données sont enregistrées dans `/staff/`, `/users/`, `/admins/` avec `pending_activation: true`
3. Le staff se connecte sur `/admin/login` avec ces identifiants
4. Le système détecte que c'est un compte pré-enregistré
5. Crée automatiquement le compte Firebase Auth
6. Migre les données vers le vrai UID
7. Active le compte (`is_active: true`)
8. Supprime les anciennes entrées temporaires
9. Redirige vers le dashboard approprié

### Scénario 2 : Compte créé SANS mot de passe
1. Admin crée le compte avec seulement l'email (mot de passe vide)
2. Les données sont enregistrées sans mot de passe
3. Le staff se connecte sur `/admin/login` et entre UN NOUVEAU mot de passe
4. Le système détecte que c'est un compte sans mot de passe
5. Affiche le message : "Bienvenue dans l'équipe DEM-DEM !"
6. Crée le compte Firebase Auth avec le mot de passe choisi
7. Migre les données
8. Active le compte
9. Redirige vers le dashboard

---

## 🔒 Sécurité

### Règles Firebase mises à jour

#### 1. `/admin_logs/` - Logs d'audit
```json
"admin_logs": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'",
  "$logId": {
    ".write": true,
    ".validate": "newData.hasChildren(['timestamp', 'action', 'email']) && newData.child('timestamp').isNumber()"
  }
}
```
**Pourquoi** : Permet l'écriture des logs même pour les tentatives de connexion échouées, tout en validant la structure.

#### 2. `/staff/` - Lecture pour authentifiés
```json
"staff": {
  ".read": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3' || auth != null",
  "$staffId": {
    ".write": "auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'"
  }
}
```
**Pourquoi** : Permet au système de lire `/staff/` pendant la connexion pour détecter les comptes pré-enregistrés.

---

## 🧪 Tests à effectuer

### Test 1 : Première connexion avec mot de passe défini
1. Dans Dashboard Transversal, créer un compte staff :
   - Email : `test.staff@demdem.sn`
   - Mot de passe : `Test123!`
   - Rôle : `ops_event`
   - Silo : `Événement`

2. Vérifier dans Firebase Realtime Database :
   ```
   /staff/staff_1234567890_abc123
     ├─ email: "test.staff@demdem.sn"
     ├─ role: "ops_event"
     └─ silo: "evenement"

   /users/staff_1234567890_abc123
     ├─ email: "test.staff@demdem.sn"
     ├─ password: "Test123!"
     └─ pending_activation: true
   ```

3. Déconnexion du super admin

4. Aller sur `/admin/login`

5. Se connecter avec :
   - Email : `test.staff@demdem.sn`
   - Mot de passe : `Test123!`

6. **Résultat attendu** :
   - ✅ Écran de vérification pendant 2 secondes
   - ✅ Compte Firebase Auth créé
   - ✅ Données migrées vers le vrai UID
   - ✅ Redirection vers `/admin/ops-event` (dashboard Événement)
   - ✅ Anciennes entrées temporaires supprimées

### Test 2 : Première connexion SANS mot de passe défini
1. Dans Dashboard Transversal, créer un compte staff :
   - Email : `newstaff@demdem.sn`
   - Mot de passe : **(laisser vide)**
   - Rôle : `finance_event`
   - Silo : `Événement`

2. Vérifier dans Firebase :
   ```
   /users/staff_1234567890_xyz456
     ├─ email: "newstaff@demdem.sn"
     └─ password: "" (ou absent)
   ```

3. Aller sur `/admin/login`

4. Se connecter avec :
   - Email : `newstaff@demdem.sn`
   - Mot de passe : `MonNouveauPass123!`

5. **Résultat attendu** :
   - ✅ Message : "Bienvenue dans l'équipe DEM-DEM !"
   - ✅ Compte Firebase Auth créé avec le nouveau mot de passe
   - ✅ Données migrées
   - ✅ Redirection vers `/admin/finance-event`

### Test 3 : Mot de passe trop court (première connexion sans mot de passe)
1. Créer un compte sans mot de passe
2. Essayer de se connecter avec un mot de passe de 3 caractères
3. **Résultat attendu** :
   - ❌ Message d'erreur : "Bienvenue dans l'équipe DEM-DEM ! Votre mot de passe doit contenir au moins 6 caractères."

### Test 4 : Mauvais mot de passe (compte avec mot de passe)
1. Créer un compte avec mot de passe `Test123!`
2. Essayer de se connecter avec `WrongPass!`
3. **Résultat attendu** :
   - ❌ Message d'erreur : "Mot de passe incorrect pour ce compte staff"

### Test 5 : Email non pré-enregistré
1. Essayer de se connecter avec un email qui n'existe pas dans `/staff/`
2. **Résultat attendu** :
   - ❌ Message d'erreur : "Email ou mot de passe incorrect"

---

## 🔍 Diagnostic en cas de problème

### Les logs à surveiller (Console navigateur)

#### Connexion réussie :
```
[UNIFIED LOGIN] Login attempt for: test.staff@demdem.sn
[FIREBASE AUTH] 🔐 signIn called for: test.staff@demdem.sn
[FIREBASE AUTH] ❌ Sign in error: auth/invalid-credential
[UNIFIED LOGIN] Sign in failed, checking for pre-registered staff account...
[UNIFIED LOGIN] Found pre-registered staff account
[UNIFIED LOGIN] Password matches! Creating Firebase Auth account...
[UNIFIED LOGIN] Firebase Auth account created with UID: AbCdEfGh123
[UNIFIED LOGIN] Account migration completed successfully
[UNIFIED LOGIN] Sign in successful, showing verification screen
```

#### Première connexion sans mot de passe :
```
[UNIFIED LOGIN] Found pre-registered staff account
[UNIFIED LOGIN] Staff account found but no password set - first login detected
[UNIFIED LOGIN] Creating Firebase Auth account with provided password...
[UNIFIED LOGIN] Firebase Auth account created with UID: XyZ789
[UNIFIED LOGIN] First login setup completed successfully
```

### Erreurs possibles

#### 1. `PERMISSION_DENIED` sur `/admin_logs/`
**Cause** : Règles Firebase non déployées
**Solution** :
```bash
firebase deploy --only database
```

#### 2. `auth/email-already-in-use`
**Cause** : Le compte Firebase Auth existe déjà
**Solution** : Supprimer le compte dans Firebase Console > Authentication

#### 3. Cache navigateur
**Cause** : Ancien JS chargé
**Solution** : `Ctrl+Shift+R` ou navigation privée

---

## 📦 Déploiement

### 1. Déployer les règles Firebase
```bash
firebase deploy --only database
```

### 2. Vérifier que le build est à jour
```bash
npm run build
```

### 3. Déployer sur Firebase Hosting
```bash
firebase deploy --only hosting
```

### 4. Vider le cache (utilisateurs)
- Chrome/Edge : `Ctrl+Shift+R`
- Firefox : `Ctrl+Shift+Delete`
- Ou utiliser navigation privée

---

## ✅ Checklist de validation

- [ ] Les règles Firebase sont déployées
- [ ] Le build contient les nouvelles modifications
- [ ] Test 1 réussi (avec mot de passe)
- [ ] Test 2 réussi (sans mot de passe)
- [ ] Test 3 réussi (validation mot de passe court)
- [ ] Test 4 réussi (mauvais mot de passe)
- [ ] Test 5 réussi (email inexistant)
- [ ] Les logs s'écrivent correctement dans `/admin_logs/`
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Le hosting est déployé
- [ ] Le cache utilisateur est vidé

---

## 📞 Support

En cas de problème :
1. Vérifier les logs dans la console navigateur
2. Vérifier les données dans Firebase Realtime Database
3. Vérifier que les règles Firebase sont bien déployées
4. Vider le cache navigateur
5. Tester en navigation privée

---

**Date de création** : 2026-02-18
**Dernière modification** : 2026-02-18
**Version** : 1.0
