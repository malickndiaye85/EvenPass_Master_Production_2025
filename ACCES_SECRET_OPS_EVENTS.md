# Accès Secret OPS Manager Events

## Point d'Entrée Secret

L'accès au Dashboard OPS Manager Events est **dissimulé** dans l'interface publique pour des raisons de sécurité.

### Localisation

**Page :** `/for-organizers` (Pour les organisateurs)

**Élément secret :** Icône Instagram dans le footer

L'icône Instagram ressemble à un simple lien social mais redirige vers le portail de connexion OPS Events.

---

## Flux d'Authentification

### Étape 1 : Accès au formulaire de login

1. Aller sur `https://demdem.sn/for-organizers`
2. Descendre jusqu'au footer
3. Cliquer sur l'icône **Instagram**
4. Redirection automatique vers `/admin/ops-login`

### Étape 2 : Page de connexion

**URL :** `https://demdem.sn/admin/ops-login`

**Design :**
- Fond noir avec gradient
- Logo DEM-DEM en haut
- Icône Activity (OPS Manager Events)
- Formulaire minimaliste noir & orange

**Champs :**
- Email
- Mot de passe (avec option afficher/masquer)

**Bouton :** "Connexion OPS" (Orange)

### Étape 3 : Vérification Firebase

Lors de la soumission du formulaire :

```typescript
1. signInWithEmailAndPassword(auth, email, password)
2. Récupération du user.uid
3. Vérification dans Firebase Realtime Database: users/{uid}/role
4. Contrôle du rôle:
   - ✅ 'ops_event' → Accès accordé
   - ✅ 'super_admin' → Accès accordé
   - ❌ Autre rôle → Accès refusé + déconnexion
5. Si valide: navigate('/admin/ops-events')
```

### Étape 4 : Redirection sécurisée

**Si authentification réussie :**
```
→ /admin/ops-events (Dashboard OPS Manager Events)
```

**Si authentification échouée :**
```
Message d'erreur affiché + utilisateur reste sur /admin/ops-login
```

---

## Protection des Routes

### Route Guard sur /admin/ops-events

**Composant :** `RoleBasedRoute`

**Logique :**

```typescript
// Si non connecté
if (!user) {
  // Détection de route OPS Events
  if (location.pathname.startsWith('/admin/ops-events')) {
    return <Navigate to="/admin/ops-login" />;
  }
  return <Navigate to="/" />;
}

// Si connecté mais rôle incorrect
if (userRole !== 'ops_event' && userRole !== 'super_admin') {
  return <Navigate to={getDefaultRedirectForRole(userRole)} />;
}

// Accès accordé
return <>{children}</>;
```

### Test de sécurité

**Scénario 1 :** Accès direct à l'URL
```
1. Utilisateur tape: https://demdem.sn/admin/ops-events
2. RoleBasedRoute vérifie l'authentification
3. Non connecté → Redirect vers /admin/ops-login
```

**Scénario 2 :** Tentative avec mauvais rôle
```
1. Utilisateur se connecte avec rôle 'organizer'
2. Essaye d'accéder à /admin/ops-events
3. RoleBasedRoute détecte rôle non autorisé
4. Redirect vers /organizer/dashboard
5. Log de sécurité enregistré
```

**Scénario 3 :** Accès légitime
```
1. Utilisateur clique sur Instagram dans footer
2. Remplit le formulaire de login
3. Email: ops@demdem.sn
4. Rôle vérifié: 'ops_event' ✅
5. Redirect vers /admin/ops-events
6. Dashboard chargé
```

---

## Création de Comptes OPS Events

### Via Admin Transversal

**URL :** `https://demdem.sn/admin/transversal`

**Étapes :**

1. Se connecter en tant que `super_admin`
2. Aller dans l'onglet **"Staff Management"**
3. Cliquer sur "Ajouter un membre du staff"
4. Remplir le formulaire :
   - **Email :** ops.events@demdem.sn
   - **Mot de passe :** [Générer un mot de passe fort]
   - **Rôle :** Sélectionner **"OPS Event"**
   - **Nom complet :** Ex. "Mamadou Diallo"
5. Valider

**Résultat :**
- Compte créé dans Firebase Auth
- Rôle `ops_event` défini dans `users/{uid}/role`
- L'utilisateur peut maintenant se connecter via `/admin/ops-login`

### Structure Firebase

```
users/
  └── {uid}/
      ├── email: "ops.events@demdem.sn"
      ├── role: "ops_event"
      ├── fullName: "Mamadou Diallo"
      ├── createdAt: 1709481234567
      └── isActive: true
```

---

## Messages d'Erreur

### Erreurs d'authentification

| Code Firebase | Message affiché |
|---------------|-----------------|
| `auth/invalid-email` | "Email invalide" |
| `auth/user-not-found` | "Utilisateur non trouvé" |
| `auth/wrong-password` | "Mot de passe incorrect" |
| `auth/invalid-credential` | "Identifiants invalides" |
| `auth/too-many-requests` | "Trop de tentatives. Réessayez plus tard." |

### Erreurs de rôle

**Compte non trouvé dans la base :**
```
"Compte non trouvé dans la base de données"
```

**Rôle non autorisé :**
```
"Accès refusé. Rôle OPS Events requis."
```

---

## Sécurité Avancée

### Logging des accès

Tous les accès sont enregistrés via `securityLogger` :

```typescript
securityLogger.logRouteAccess(
  user.email,
  user.id,
  user.role,
  '/admin/ops-events',
  granted,
  reason
);
```

### Tentatives non autorisées

```typescript
securityLogger.logUnauthorizedAttempt(
  user.email,
  user.id,
  user.role,
  '/admin/ops-events',
  'Role ops_event required'
);
```

### Notice de sécurité

Affiché sur la page de login :

```
⚠️ Accès sécurisé réservé au personnel OPS Events autorisé.
   Toutes les connexions sont enregistrées et surveillées.
```

---

## Points Clés

### Discrétion

✅ **L'icône Instagram est VISUELLEMENT IDENTIQUE aux autres icônes sociales**
- Même design
- Même couleur
- Même taille
- Aucun indice visuel

❌ **Mais en arrière-plan :**
- `onClick={handleInstagramClick}`
- Redirige vers `/admin/ops-login`

### Sécurité Multi-Niveaux

1. **Niveau 1 :** Point d'entrée discret (Instagram)
2. **Niveau 2 :** Page de login dédiée
3. **Niveau 3 :** Authentification Firebase
4. **Niveau 4 :** Vérification du rôle dans la base
5. **Niveau 5 :** Route Guard sur le dashboard
6. **Niveau 6 :** Logging de sécurité

### Maintenance

**Pour changer le point d'entrée :**

Modifier `src/components/Footer.tsx` :

```typescript
// Actuellement : Instagram
const handleInstagramClick = (e: React.MouseEvent) => {
  e.preventDefault();
  navigate('/admin/ops-login');
};

// Exemple : Changer pour Facebook
const handleFacebookClick = (e: React.MouseEvent) => {
  e.preventDefault();
  navigate('/admin/ops-login');
};
```

---

## Checklist de Déploiement

Avant de déployer en production :

- [ ] Vérifier que le rôle `ops_event` existe dans Firebase
- [ ] Créer au moins un compte OPS Events de test
- [ ] Tester la connexion via Instagram
- [ ] Tester l'accès direct à `/admin/ops-events` (doit rediriger)
- [ ] Tester avec un mauvais rôle (doit bloquer)
- [ ] Vérifier les logs de sécurité
- [ ] Documenter les identifiants pour l'équipe OPS

---

## Comptes par Défaut (Exemple)

**Production :**
```
Email: ops.events@demdem.sn
Rôle: ops_event
```

**Test :**
```
Email: ops.test@demdem.sn
Rôle: ops_event
```

---

## Support

En cas de problème d'accès :

1. Vérifier que le compte existe dans Firebase Auth
2. Vérifier que `users/{uid}/role` = "ops_event"
3. Vérifier que `users/{uid}/isActive` = true
4. Consulter les logs de sécurité dans Firebase
5. Contacter l'administrateur système

---

## Résumé

L'accès au Dashboard OPS Manager Events est **entièrement sécurisé** et **discret** :

- Point d'entrée : **Icône Instagram** sur `/for-organizers`
- Login dédié : `/admin/ops-login`
- Rôle requis : `ops_event` ou `super_admin`
- Protection multi-niveaux avec logging complet

**Personne ne peut deviner l'accès sans connaître le secret de l'icône Instagram.**
