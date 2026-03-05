# Guide de Test Rapide - Véhicule Keur Massar

**Date**: 2026-03-05
**Objectif**: Valider le flux complet DEM-DEM Express

---

## 🎯 Procédure de Test en 5 Minutes

### Étape 1: Créer le Véhicule Test

1. **Se connecter en tant qu'Admin Ops Transport**
   - URL: `/admin/ops/login`
   - Email: Votre compte admin
   - Mot de passe: Votre mot de passe

2. **Accéder à la page de migration**
   - Cliquer sur le bouton **"Migration"** (icône base de données bleue)
   - Ou aller directement sur `/admin/ops/transport/migration`

3. **Créer le véhicule test Keur Massar**
   - Cliquer sur **"Créer Véhicule Test Keur Massar"**
   - Un popup s'affiche avec le PIN généré

**Exemple de popup** :
```
✅ Véhicule test créé!

Navette: KM-Express-01
Route: Keur Massar ↔ Dakar Centre
PIN: 284751

Utilisez ce PIN pour vous connecter sur EPscanT
```

4. **Noter le PIN généré**
   - Exemple: `284751` (votre PIN sera différent)
   - Ce code est maintenant stocké dans :
     - `fleet_vehicles/{vehicleId}` → `access_code: "284751"`
     - `transport/vehicles/{vehicleId}` → `pin: "284751"`

---

### Étape 2: Vérifier dans Firebase Console

1. **Ouvrir Firebase Console**
   - URL: https://console.firebase.google.com
   - Projet: `demdem-events`

2. **Vérifier fleet_vehicles**
   - Menu: **Realtime Database** → **Données**
   - Naviguer vers: `fleet_vehicles/`
   - Chercher le dernier véhicule créé (tri par timestamp)
   - Vérifier :
     ```json
     {
       "vehicle_number": "KM-Express-01",
       "license_plate": "DK-KM-2026",
       "route": "Keur Massar ↔ Dakar Centre",
       "driver_name": "Modou Diop",
       "access_code": "284751",  // ✅ PIN stocké
       "status": "en_service"
     }
     ```

3. **Vérifier transport/vehicles**
   - Naviguer vers: `transport/vehicles/`
   - Même ID que dans `fleet_vehicles`
   - Vérifier :
     ```json
     {
       "pin": "284751",  // ✅ Même PIN
       "licensePlate": "DK-KM-2026",
       "driverName": "Modou Diop",
       "isActive": true,
       "vehicleId": "-NxYz123...",
       "createdAt": "2026-03-05T...",
       "syncedFrom": "migration_script",
       "testVehicle": true
     }
     ```

**Validation** : ✅ Les deux entrées existent avec le même PIN

---

### Étape 3: Tester la Connexion EPscanT

1. **Ouvrir EPscanT Transport Login**
   - URL: `/epscant-login.html`
   - Ou `/public/epscant-login.html`

2. **Entrer le PIN**
   - Taper les 6 chiffres : `284751`
   - Cliquer sur **"Se connecter"**

3. **Observer les logs console** (F12)
   ```
   🔍 [LOGIN] Recherche PIN: 284751
   🔍 [LOGIN] Vérification transport/vehicles...
   ✅ [LOGIN] Véhicule trouvé: KM-Express-01 (DK-KM-2026)
   ✅ [LOGIN] Chauffeur: Modou Diop
   ✅ [LOGIN] isActive: true
   🎉 [LOGIN] Connexion réussie!
   💾 [LOGIN] Sauvegarde session localStorage
   → Redirection vers scanner...
   ```

4. **Vérifier la redirection**
   - Vous devriez être redirigé vers `/epscant-transport.html` (scanner)
   - Interface scanner s'affiche avec :
     - Nom véhicule: **KM-Express-01**
     - Plaque: **DK-KM-2026**
     - Chauffeur: **Modou Diop**
     - Bouton **"Scanner QR Code"** actif

**Validation** : ✅ Connexion réussie et scanner opérationnel

---

### Étape 4: Tester le Scanner (Optionnel)

Si vous avez un QR Code SAMAPass de test :

1. **Activer la caméra**
   - Cliquer sur **"Scanner QR Code"**
   - Autoriser l'accès caméra si demandé

2. **Scanner un QR Code test**
   - Pointer vers un QR Code SAMAPass
   - Attendre la détection automatique

3. **Vérifier l'enregistrement**
   - Message : "✅ Scan validé - Passager autorisé"
   - Ou : "❌ Abonnement expiré"

4. **Consulter Firebase**
   - Naviguer vers: `transport/scans/{vehicleId}/{date}/`
   - Vérifier l'enregistrement :
     ```json
     {
       "passengerId": "abc123",
       "timestamp": "2026-03-05T14:30:00Z",
       "location": "Keur Massar",
       "vehicleId": "-NxYz123...",
       "scanType": "boarding"
     }
     ```

**Validation** : ✅ Scan enregistré correctement

---

### Étape 5: Tester la Désactivation

1. **Retourner sur Admin Ops Transport**
   - URL: `/admin/ops/transport`

2. **Localiser le véhicule KM-Express-01**
   - Dans le tableau "Gestion de la Flotte Hybride"
   - Trouver la ligne avec plaque `DK-KM-2026`

3. **Mettre en maintenance**
   - Cliquer sur **"Actions"**
   - Sélectionner **"Mettre en Maintenance"**
   - Confirmation : "✅ Véhicule KM-KM-2026 mis en maintenance"

4. **Vérifier la synchronisation**
   - Firebase Console → `fleet_vehicles/{vehicleId}` :
     ```json
     { "status": "en_maintenance" }
     ```
   - Firebase Console → `transport/vehicles/{vehicleId}` :
     ```json
     { "isActive": false }  // ✅ Synchronisé
     ```

5. **Tenter une nouvelle connexion EPscanT**
   - Retourner sur `/epscant-login.html`
   - Entrer le même PIN : `284751`
   - **Résultat attendu** : ❌ "PIN invalide ou véhicule désactivé"

**Validation** : ✅ Désactivation fonctionne correctement

---

## 📋 Checklist de Validation Complète

### ✅ Phase 1: Création

- [ ] Véhicule créé dans `fleet_vehicles` avec PIN
- [ ] Véhicule synchronisé dans `transport/vehicles`
- [ ] PIN identique dans les deux collections
- [ ] `isActive: true` dans `transport/vehicles`

### ✅ Phase 2: Connexion

- [ ] PIN accepté sur EPscanT login
- [ ] Redirection vers scanner réussie
- [ ] Informations véhicule affichées correctement
- [ ] Session sauvegardée dans localStorage

### ✅ Phase 3: Scanner (Optionnel)

- [ ] Caméra activée sans erreur
- [ ] QR Code détecté et validé
- [ ] Scan enregistré dans Firebase
- [ ] Compteurs mis à jour

### ✅ Phase 4: Désactivation

- [ ] Statut changé dans admin
- [ ] `isActive` synchronisé à `false`
- [ ] PIN refusé lors de nouvelle connexion
- [ ] Message d'erreur approprié affiché

---

## 🐛 Problèmes Courants et Solutions

### Problème 1: "PIN invalide" immédiatement après création

**Cause possible** : Délai de propagation Firebase (rare)

**Solution** :
1. Attendre 5 secondes
2. Réessayer la connexion
3. Si échec persiste, vérifier Firebase Console

---

### Problème 2: Redirection vers scanner échoue

**Cause possible** : Fichier `epscant-transport.html` manquant

**Solution** :
1. Vérifier que `/public/epscant-transport.html` existe
2. Vérifier dans `dist/` après build
3. Si manquant, vérifier configuration Vite

---

### Problème 3: Caméra ne s'active pas

**Cause possible** : Permissions navigateur

**Solution** :
1. Vérifier autorisations site (icône cadenas URL)
2. Autoriser caméra manuellement
3. Tester sur HTTPS (requis pour caméra sur mobile)

---

### Problème 4: Double écriture n'a pas eu lieu

**Symptômes** : Véhicule dans `fleet_vehicles` mais pas dans `transport/vehicles`

**Solution** :
1. Lancer migration manuelle : `/admin/ops/transport/migration`
2. Ou réenrôler le véhicule
3. Vérifier logs console pour erreurs réseau

---

## 🎯 Scénarios de Test Avancés

### Test A: Migration en Masse

**Objectif** : Valider la migration de 10+ véhicules

**Procédure** :
1. Créer 10 véhicules manuellement dans Firebase Console `fleet_vehicles`
2. Assigner des PINs : `111111`, `222222`, ..., `101010`
3. Lancer migration : `/admin/ops/transport/migration`
4. Vérifier rapport : 10 migrés, 0 ignorés, 0 échecs
5. Tester connexion avec chaque PIN

**Résultat attendu** : Tous les PINs fonctionnent

---

### Test B: PIN Collision

**Objectif** : Vérifier unicité des PINs

**Procédure** :
1. Créer véhicule A avec PIN `123456`
2. Tenter de créer véhicule B avec même PIN `123456`
3. Observer comportement

**Résultat attendu** :
- Firebase accepte (pas de contrainte unique)
- EPscanT login trouve le **premier** véhicule trouvé
- **Recommandation** : Implémenter vérification unicité côté admin

---

### Test C: Réactivation Véhicule

**Objectif** : Valider cycle désactivation → réactivation

**Procédure** :
1. Désactiver véhicule (maintenance)
2. Vérifier PIN refusé
3. Réactiver véhicule (remettre en service)
4. Vérifier PIN accepté à nouveau

**Résultat attendu** : PIN fonctionne après réactivation

---

## 📊 Données de Test Prêtes à l'Emploi

### Véhicule Test Keur Massar

```json
{
  "vehicle_number": "KM-Express-01",
  "type": "ndiaga_ndiaye",
  "capacity": 25,
  "route": "Keur Massar ↔ Dakar Centre",
  "license_plate": "DK-KM-2026",
  "driver_name": "Modou Diop",
  "driver_phone": "77 123 45 67",
  "insurance_expiry": "2026-12-31",
  "technical_control_expiry": "2026-12-31",
  "status": "en_service",
  "access_code": "284751",  // Votre PIN sera différent
  "epscanv_pin": "284751"
}
```

### QR Code SAMAPass Test (JSON)

Si vous avez besoin de générer un QR Code test :

```json
{
  "id": "test_passenger_001",
  "full_name": "Awa Diallo",
  "phone": "77 987 65 43",
  "subscription_type": "monthly",
  "subscription_status": "active",
  "valid_until": "2026-04-05",
  "qr_code_hash": "abc123def456"
}
```

Encoder avec : https://www.qr-code-generator.com/

---

## ✅ Conclusion du Test

Si tous les tests passent, vous pouvez confirmer que :

✅ **Double écriture** fonctionne correctement
✅ **Migration** opérationnelle
✅ **Connexion PIN** sans Firebase Auth validée
✅ **Scanner** prêt pour production
✅ **Désactivation/Réactivation** fonctionnelle

**Prochaine étape** : Lancer en production avec les vrais chauffeurs !

---

**Durée totale du test** : 5-10 minutes
**Prérequis** : Accès Admin Ops Transport + Firebase Console
**Support** : Voir `DEMDEM_EXPRESS_FINALISATION_2026-03-05.md`

---

**Bon test ! 🚀**
