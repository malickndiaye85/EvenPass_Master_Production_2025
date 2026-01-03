# 🧹 Nettoyage Firebase pour Production

## Objectif

Supprimer toutes les données de test et repartir sur une base propre pour le lancement en production.

---

## 🔥 Accès Firebase Console

1. Se connecter à [Firebase Console](https://console.firebase.google.com)
2. Sélectionner le projet EvenPass
3. Menu latéral : **Realtime Database**

---

## 📊 Données à conserver

### ✅ À GARDER

```
/users/
  - Comptes organisateurs vérifiés
  - Comptes administrateurs

/organizers/
  - Profils organisateurs validés
```

### ❌ À SUPPRIMER

```
/events/
  - Tous les événements de test
  - Billets de test
  - Statistiques de test

/transport/pass/bookings/
  - Toutes les réservations de test (LMDG, COSAMA, Interrégional)

/transport/abonnements/subscriptions/
  - Tous les abonnements de test

/scans/
  - Historique des scans de test
```

---

## 🎯 Procédure de nettoyage

### Étape 1 : Backup (Sécurité)

Avant toute suppression, exporter les données :

1. Dans Firebase Console, Realtime Database
2. Cliquer sur les **3 points** à droite de la base
3. **Export JSON**
4. Sauvegarder le fichier : `backup_avant_nettoyage_YYYY-MM-DD.json`

### Étape 2 : Supprimer les événements de test

**Dans Realtime Database :**

1. Naviguer vers `/events`
2. Pour chaque événement de test :
   - Clic droit sur le nœud
   - **Delete**
3. Confirmer la suppression

**Identifiez les événements de test par :**
- Nom contenant "Test"
- Prix à 1000 FCFA ou moins
- Dates passées
- Organisateur "test@example.com"

### Étape 3 : Supprimer les réservations PASS

**Dans Realtime Database :**

1. Naviguer vers `/transport/pass/bookings`
2. Sélectionner le nœud `bookings`
3. Clic droit → **Delete**
4. Confirmer

**Alternative sécurisée (supprimer un par un) :**
- Vérifier chaque booking
- Supprimer uniquement ceux avec `payment_status: "pending"` ou numéros de test

### Étape 4 : Supprimer les abonnements de test

**Dans Realtime Database :**

1. Naviguer vers `/transport/abonnements/subscriptions`
2. Pour chaque abonnement de test :
   - Vérifier le champ `user_email`
   - Si contient "test" ou "example" → Supprimer
   - Clic droit → **Delete**

### Étape 5 : Nettoyer Firebase Storage (Photos)

**Dans Firebase Storage :**

1. Menu latéral : **Storage**
2. Dossier `subscriptions/`
   - Supprimer les photos de test
   - Identifier par :
     - Nom de fichier contenant "test"
     - Date d'upload ancienne
     - Taille anormale

3. Dossier `events/` (si existant)
   - Supprimer les images d'événements de test

### Étape 6 : Nettoyer les scans

**Dans Realtime Database :**

1. Naviguer vers `/scans` (si existant)
2. Supprimer tous les enregistrements de scan
3. Clic droit sur le nœud → **Delete**

### Étape 7 : Réinitialiser les compteurs

**Si vous avez des compteurs globaux :**

```
/stats/
  total_events: 0
  total_bookings: 0
  total_subscriptions: 0
  total_revenue: 0
```

Réinitialiser à 0 pour repartir proprement.

---

## 🔐 Utilisateurs à conserver

### Administrateurs

Conserver les comptes avec rôle `admin` :
- admin@evenpass.sn
- ops@evenpass.sn
- finance@evenpass.sn

### Organisateurs vérifiés

Conserver uniquement les organisateurs avec :
- `verification_status: "approved"`
- Email professionnel valide
- Documents vérifiés

### Supprimer

- Comptes avec `verification_status: "pending"`
- Comptes test (email contenant "test" ou "example")
- Comptes créés pour démo

---

## 🧪 Validation post-nettoyage

### Checklist de vérification

| Élément | Statut | Action |
|---------|--------|--------|
| Événements actifs | ❌ Aucun | ✅ Normal pour démarrage |
| Réservations PASS | ❌ Aucune | ✅ Normal pour démarrage |
| Abonnements actifs | ❌ Aucun | ✅ Normal pour démarrage |
| Admins connectés | ✅ Présents | ✅ Requis |
| Organisateurs vérifiés | ✅ Présents | ✅ Optionnel |
| Photos Storage | 🧹 Nettoyé | ✅ Requis |

### Test de création

Après nettoyage, tester :

1. **Créer un événement** (en tant qu'organisateur)
   - Upload photo
   - Définir prix
   - Publier
   - ✅ Devrait fonctionner

2. **Réserver un transport** (LMDG ou COSAMA)
   - Sélectionner trajet
   - Ajouter passagers
   - Simuler paiement
   - ✅ Devrait générer booking_number

3. **Créer un abonnement**
   - Upload photo
   - Remplir formulaire
   - Simuler paiement
   - ✅ Devrait générer subscription_number

---

## 📋 Script de nettoyage (Option avancée)

Si vous avez accès aux Firebase Admin SDK :

```javascript
// cleanup-firebase.js
const admin = require('firebase-admin');

admin.initializeApp({
  databaseURL: 'https://YOUR_PROJECT.firebaseio.com',
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.database();

async function cleanupTestData() {
  console.log('🧹 Début du nettoyage...');

  // Supprimer les événements
  await db.ref('events').once('value', (snapshot) => {
    snapshot.forEach((child) => {
      const event = child.val();
      if (event.organizer_email && event.organizer_email.includes('test')) {
        console.log(`Suppression événement: ${child.key}`);
        child.ref.remove();
      }
    });
  });

  // Supprimer les bookings PASS
  console.log('Suppression des réservations PASS...');
  await db.ref('transport/pass/bookings').remove();

  // Supprimer les abonnements de test
  await db.ref('transport/abonnements/subscriptions').once('value', (snapshot) => {
    snapshot.forEach((child) => {
      const sub = child.val();
      if (sub.user_email && sub.user_email.includes('test')) {
        console.log(`Suppression abonnement: ${child.key}`);
        child.ref.remove();
      }
    });
  });

  console.log('✅ Nettoyage terminé !');
}

cleanupTestData().catch(console.error);
```

**Utilisation :**
```bash
node cleanup-firebase.js
```

---

## ⚠️ Précautions

1. **TOUJOURS faire un backup avant**
2. **Vérifier 2 fois avant de supprimer**
3. **Ne PAS supprimer** :
   - `/users` (sauf comptes test)
   - `/organizers` (sauf test)
   - Configuration système
   - Règles de sécurité

4. **Documenter** ce qui est supprimé
5. **Tester** après nettoyage

---

## 🎯 État après nettoyage

Base de données propre :

```
/
├── users/
│   ├── {admin_uid}/
│   └── {verified_organizer_uid}/
├── organizers/
│   └── {verified_organizer_id}/
├── events/              ← VIDE (prêt pour production)
├── transport/
│   ├── pass/
│   │   └── bookings/    ← VIDE (prêt pour production)
│   └── abonnements/
│       └── subscriptions/ ← VIDE (prêt pour production)
└── stats/               ← Compteurs à 0
```

---

## 🚀 Prêt pour production

Une fois le nettoyage effectué :

1. ✅ Base de données propre
2. ✅ Storage nettoyé
3. ✅ Compteurs réinitialisés
4. ✅ Admins en place
5. ✅ Tests validés

**Vous pouvez lancer la production ! 🎉**

---

## 📞 Support

En cas de problème pendant le nettoyage :
- Restaurer le backup JSON
- Contacter le support Firebase
- Vérifier les règles de sécurité

**IMPORTANT : Ne jamais supprimer les règles de sécurité (Rules) !**
