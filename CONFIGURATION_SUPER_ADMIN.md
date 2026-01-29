# Configuration Super Admin - Dashboard Transversal

## UID Super Admin
```
Tnq8Isi0fATmidMwEuVrw1SAJkI3
```

## Configuration Firebase Realtime Database

### Structure requise dans `admins/{uid}`

Créez ou mettez à jour le nœud suivant dans Firebase Realtime Database :

```json
{
  "admins": {
    "Tnq8Isi0fATmidMwEuVrw1SAJkI3": {
      "role": "super_admin",
      "permissions": ["all"],
      "is_active": true,
      "full_name": "Super Admin",
      "email": "admin@evenpass.sn",
      "created_at": "2026-01-29T00:00:00.000Z",
      "updated_at": "2026-01-29T00:00:00.000Z",
      "can_access_even": true,
      "can_access_pass": true,
      "can_access_finance": true,
      "can_manage_users": true,
      "can_manage_organizers": true
    }
  }
}
```

## Règles Firebase Realtime Database

Assurez-vous que les règles permettent au super admin d'accéder à toutes les données :

```json
{
  "rules": {
    "admins": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "organizers": {
      ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || auth.uid == 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
      "$organizerId": {
        ".read": "auth != null && (auth.uid == $organizerId || root.child('admins').child(auth.uid).exists())",
        ".write": "auth != null && auth.uid == $organizerId"
      }
    },
    "users": {
      ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || auth.uid == 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    },
    "events": {
      ".read": true,
      ".write": "auth != null"
    },
    "bookings": {
      ".read": "auth != null && (root.child('admins').child(auth.uid).exists() || auth.uid == 'Tnq8Isi0fATmidMwEuVrw1SAJkI3')",
      "$bookingId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

## Fonctionnalités du Dashboard Transversal

### 1. **Vue d'ensemble** (Onglet principal)
- Chiffre d'affaires EVEN (Événements)
- Chiffre d'affaires PASS (Transport maritime + Abonnements)
- Total général consolidé
- Filtres par date
- Export CSV des rapports financiers
- Détail des revenus PASS par type (LMDG, COSAMA, Interrégional, Abonnements)
- Rapports partenaires avec commissions

### 2. **Gestion Événements** (Onglet EVEN)
- Accès au Dashboard Admin EVEN
- Accès à l'Espace Organisateurs
- Accès à EPscan Plus (Scanner de billets)
- Statistiques globales EVEN

### 3. **Gestion Voyage** (Onglet DEM-DEM)
- Accès au Pass Maritime (LMDG, COSAMA, Interrégional)
- Accès au SAMA PASS (Abonnements DEM-DEM Express)
- Accès au Transport Hub (Allo Dakar + DEM-DEM)
- Statistiques détaillées PASS par type

## Flux d'authentification

1. **Login** : `/admin-login`
   - Connexion via Firebase Authentication
   - Email : admin@evenpass.sn
   - Mot de passe : (configuré dans Firebase Auth)

2. **Vérification du rôle** :
   - Si `user.role === 'super_admin'` OU `user.id === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'`
   - → Redirection automatique vers `/admin/transversal`
   - Sinon → Redirection vers `/admin/finance`

3. **Protection de la route** :
   - Seuls les utilisateurs avec `role: 'super_admin'` peuvent accéder au dashboard transversal
   - Vérification explicite de l'UID pour forcer l'accès même en cas d'erreur de chargement

## Accès direct

URL : `https://evenpass-senegal.com/admin/transversal`

## Notes importantes

- ✅ Le système utilise **EXCLUSIVEMENT Firebase** (Auth + Realtime Database + Firestore)
- ✅ Aucune dépendance à Supabase
- ✅ Les abonnements SAMA PASS sont stockés dans Firestore : `users/{uid}/subscriptions`
- ✅ Cache localStorage pour mode offline du QR Code SAMA PASS
- ✅ Le super admin a un accès total à toutes les sections

## Test de connexion

1. Allez sur `/admin-login`
2. Connectez-vous avec l'email du super admin
3. Vous devriez être automatiquement redirigé vers `/admin/transversal`
4. Vérifiez que vous voyez les 3 onglets : Vue d'ensemble, Gestion Événements, Gestion Voyage
