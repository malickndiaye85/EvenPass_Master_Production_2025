# Déploiement des Règles Firestore - Collection Tickets

## Problème identifié

Le scanner EPscanV affiche un point ROUGE car il ne peut pas accéder à Firestore. Les règles de sécurité bloquent l'accès à la collection `tickets` au niveau racine.

## Solution appliquée

Ajout de règles pour la collection `/tickets/{ticketId}` dans `firestore.rules` :

```javascript
// ============================================
// TICKETS COLLECTION (Root level - for test tickets)
// ============================================
match /tickets/{ticketId} {
  // Lecture publique pour scanner EPscanV
  allow read: if true;

  // Création pour générateur de billets test
  allow create: if true;

  // Modification pour marquer comme scanné
  allow update: if true;

  // Admin : Accès total
  allow read, write: if isAdminFinance();
}

// ============================================
// TEST CONNECTION COLLECTION
// ============================================
match /_connection_test/{testId} {
  // Lecture pour test de connexion
  allow read: if true;
}
```

## Déploiement OBLIGATOIRE

**CRITICAL:** Les règles DOIVENT être déployées pour que le système fonctionne.

### Option 1 : Console Firebase (RECOMMANDÉ)

1. Aller sur https://console.firebase.google.com/project/evenpasssenegal/firestore/rules
2. Copier le contenu de `firestore.rules`
3. Cliquer sur "Publier"

### Option 2 : Firebase CLI

```bash
firebase deploy --only firestore:rules --project evenpasssenegal
```

### Option 3 : GitHub Actions

Le workflow `.github/workflows/final_deploy.yml` devrait déployer automatiquement lors du prochain commit.

## Vérification

Après déploiement :

1. Ouvrir EPscanV Events
2. Le point à côté de "ACTIF" doit être VERT
3. Ouvrir la console (F12) et vérifier les logs :
   - `[EPscanV] ✅ Firebase Firestore connected successfully`

## Logs de diagnostic

Le scanner affiche maintenant des logs détaillés :

- `[EPscanV] Testing Firebase connection...` - Test de connexion au chargement
- `[EPscanV] 🔍 Scan detected: DEM-ZIKR-2026-XXXX` - Billet scanné
- `[EPscanV] 📝 Checking Firestore for ticket` - Requête Firestore
- `[EPscanV] ✅ Ticket found in database` - Succès
- `[EPscanV] ❌ Firestore query failed` - Erreur avec détails

## Corrections appliquées

1. ✅ Ajout indicateur connexion Firebase (point vert/rouge)
2. ✅ Logs détaillés dans le scanner
3. ✅ Règles Firestore pour collection tickets
4. ✅ Correction données de test (date, prix)
5. ✅ Injection auto-ticket dans Firestore
