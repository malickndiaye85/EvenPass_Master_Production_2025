# ✅ Guide de Vérification : Compteurs EPscanT

**Date** : 2026-03-11
**Objectif** : Vérifier que les compteurs s'incrémentent correctement après chaque scan

---

## 🔍 ÉTAPE 1 : Préparation Firebase Console

### Ouvrir Firebase Console

1. Aller sur https://console.firebase.google.com
2. Sélectionner le projet **demdem-express**
3. Cliquer sur **Realtime Database** dans le menu latéral

---

### Zones à Surveiller

Ouvrir ces 4 chemins dans des onglets séparés :

**Onglet 1** : Stats de Ligne
```
ops/transport/lines/ligne_c_keur_massar/stats
```

**Onglet 2** : Stats de Véhicule
```
ops/transport/vehicles/DK-2019-M/stats
```

**Onglet 3** : Fleet Vehicles (CRITIQUE)
```
fleet_vehicles/DK-2019-M
```

**Onglet 4** : Journal des Scans
```
scan_history
```

---

## 🔧 ÉTAPE 2 : Lancer EPscanT

### Login Contrôleur

1. Ouvrir https://demdem-express.web.app/epscant-transport.html
2. Entrer le code : **587555**
3. Cliquer sur **Se connecter**

**Logs attendus** :
```
[SECTORISATION] 🔐 Authentification avec code: 587555
[SECTORISATION] ✅ Code validé
[SECTORISATION] 🚍 Véhicule: DK-2019-M
[SECTORISATION] 📍 Ligne assignée: Ligne C - Keur Massar ⇄ UCAD
[SECTORISATION] 🔍 Recherche dans transport_lines...
[SECTORISATION] ✅ Ligne trouvée : ligne_c_keur_massar
[SECTORISATION] ✅ Session établie
```

---

## 📊 ÉTAPE 3 : Noter les Valeurs Initiales

### Avant le Premier Scan

**Onglet 1 - ops/transport/lines/ligne_c_keur_massar/stats** :
```
scans_today: _____ (noter la valeur)
total_scans: _____ (noter la valeur)
```

**Onglet 2 - ops/transport/vehicles/DK-2019-M/stats** :
```
scans_today: _____ (noter la valeur)
total_scans: _____ (noter la valeur)
occupancy_rate: _____ (noter la valeur)
```

**Onglet 3 - fleet_vehicles/DK-2019-M** :
```
usageCount: _____ (noter la valeur)
lastUsed: _____ (noter la valeur)
```

**Onglet 4 - scan_history** :
```
Nombre total d'enregistrements : _____ (compter)
```

---

## 🎯 ÉTAPE 4 : Premier Scan Test

### Scanner un QR Code SAMA PASS

**Créer un QR code de test** :
1. Aller sur https://demdem-express.web.app/admin-test-samapass.html
2. Générer un SAMA PASS pour Ligne C
3. Noter le format : `SAMAPASS-221771234567-abc123`

**Scanner le QR code** :
1. Retourner sur EPscanT
2. Cliquer sur le bouton scanner
3. Scanner le QR code généré

---

### Logs Attendus (Console F12)

**Validation** :
```
[SECTORISATION] 🔐 VALIDATION INTELLIGENTE:
[SECTORISATION]    Pass routeId: ligne_c_keur_massar
[SECTORISATION]    Scanner lineId: ligne_c_keur_massar
[SECTORISATION] ✅ NIVEAU 1 : Match ID exact
[SECTORISATION] ✅ VALIDATION RÉUSSIE - Méthode: ID exact Firebase
[SECTORISATION] ✅ Pass autorisé sur cette ligne
[SECTORISATION] ✅ Ligne autorisée - Mise à jour des stats pour paiement
```

**Incrémentation** :
```
[SECTORISATION] 📊 Mise à jour stats ligne: ligne_c_keur_massar
[SECTORISATION] 📊 Mise à jour stats véhicule: DK-2019-M
[SECTORISATION] 📊 Étape 1/5 : Stats ligne ops/transport/lines
[SECTORISATION] ✅ Stats ligne mises à jour: { scansToday: X, totalScans: Y }
[SECTORISATION] 📊 Étape 2/5 : Stats véhicule ops/transport/vehicles
[SECTORISATION] ✅ Stats véhicule mises à jour: { vehicleScansToday: A, vehicleTotalScans: B }
[SECTORISATION] 📊 Étape 3/5 : usageCount dans fleet_vehicles
[SECTORISATION] ✅ usageCount fleet_vehicles: C → D
[SECTORISATION] 📊 Étape 4/5 : Taux d'occupation
[SECTORISATION] 📊 Taux d'occupation: E%
[SECTORISATION] 📊 Étape 5/5 : Journal scan_history
[SECTORISATION] ✅ Scan enregistré dans scan_history
[SECTORISATION] 🎉 TOUTES LES STATS MISES À JOUR AVEC SUCCÈS
```

---

### Affichage EPscanT

**Écran attendu** :
```
╔════════════════════════════════╗
║          VALIDE ✓              ║
║                                ║
║  Pass : Keur Massar ⇄ UCAD     ║
║  Contrôleur : Ligne C          ║
║                                ║
║  Scan autorisé                 ║
╚════════════════════════════════╝
```

---

## ✅ ÉTAPE 5 : Vérifier les Incrémentations

### Retour sur Firebase Console

**Onglet 1 - ops/transport/lines/ligne_c_keur_massar/stats** :
```
AVANT :
scans_today: X
total_scans: Y

APRÈS :
scans_today: X + 1 ✅
total_scans: Y + 1 ✅
last_scan: (timestamp mis à jour) ✅
last_scan_date: "2026-03-11" ✅
```

**Onglet 2 - ops/transport/vehicles/DK-2019-M/stats** :
```
AVANT :
scans_today: A
total_scans: B
occupancy_rate: E

APRÈS :
scans_today: A + 1 ✅
total_scans: B + 1 ✅
occupancy_rate: (recalculé) ✅
last_scan: (timestamp mis à jour) ✅
last_scan_date: "2026-03-11" ✅
```

**Onglet 3 - fleet_vehicles/DK-2019-M** :
```
AVANT :
usageCount: C
lastUsed: (ancien timestamp)

APRÈS :
usageCount: C + 1 ✅ CRITIQUE
lastUsed: (nouveau timestamp) ✅
lastUsedDate: "2026-03-11" ✅
```

**Onglet 4 - scan_history** :
```
AVANT :
Nombre d'enregistrements : N

APRÈS :
Nombre d'enregistrements : N + 1 ✅

Nouvel enregistrement :
{
    vehicleId: "DK-2019-M" ✅
    lineId: "ligne_c_keur_massar" ✅
    timestamp: (timestamp actuel) ✅
    date: "2026-03-11" ✅
    scanType: "SAMA_PASS" ✅
    status: "VALID" ✅
    passengerId: "221771234567" ✅
    subscriptionId: "abc123" ✅
    routeId: "ligne_c_keur_massar" ✅
    routeName: "Keur Massar ⇄ UCAD" ✅
}
```

---

## 🔄 ÉTAPE 6 : Test Multiple Scans

### Scanner 5 QR Codes Différents

**Pour chaque scan** :
1. Générer un nouveau SAMA PASS
2. Scanner le QR code
3. Vérifier l'incrémentation dans Firebase

**Après 5 scans** :

**ops/transport/lines/ligne_c_keur_massar/stats** :
```
scans_today: Valeur initiale + 5 ✅
total_scans: Valeur initiale + 5 ✅
```

**ops/transport/vehicles/DK-2019-M/stats** :
```
scans_today: Valeur initiale + 5 ✅
total_scans: Valeur initiale + 5 ✅
```

**fleet_vehicles/DK-2019-M** :
```
usageCount: Valeur initiale + 5 ✅ CRITIQUE
```

**scan_history** :
```
Nombre d'enregistrements : Valeur initiale + 5 ✅
```

---

## 📊 ÉTAPE 7 : Vérifier Dashboard Admin

### Accéder au Dashboard

1. Ouvrir https://demdem-express.web.app/admin/ops/transport
2. Se connecter avec compte admin
3. Aller dans la section **Transport**

---

### Vérifications Visuelles

**Ligne C - Keur Massar ⇄ UCAD** :
```
Scans aujourd'hui : X ✅ (doit correspondre à scans_today)
Total scans : Y ✅ (doit correspondre à total_scans)
Dernier scan : Il y a X min ✅ (récent)
```

**Véhicule DK-2019-M** :
```
Immatriculation : DK-2019-M ✅
Ligne : Ligne C ✅
Scans aujourd'hui : A ✅
Total scans : B ✅
Taux occupation : E% ✅
Revenu estimé : (B × 100) CFA ✅
Dernier scan : Il y a X min ✅
```

---

## ❌ ÉTAPE 8 : Résolution des Problèmes

### Problème 1 : Compteurs ne Bougent Pas

**Symptôme** :
```
Après scan, les valeurs dans Firebase restent identiques
```

**Debug** :
1. Ouvrir Console F12
2. Chercher les logs `[SECTORISATION]`
3. Vérifier s'il y a des erreurs

**Erreurs Possibles** :

**Erreur : Permission denied**
```
[SECTORISATION] ❌ Erreur mise à jour stats: FirebaseError: Permission denied
```

**Solution** :
- Vérifier les règles Firebase Realtime Database
- Déployer les règles complètes depuis `firestore.rules`
- Commande : `firebase deploy --only database`

---

**Erreur : rtdbSet is not a function**
```
[SECTORISATION] ❌ Erreur mise à jour stats: rtdbSet is not a function
```

**Solution** :
- Vérifier que `window.firebaseDatabase` est bien importé
- Vérifier que les fonctions `update` et `push` sont disponibles
- Recharger la page EPscanT

---

**Erreur : vehicleId undefined**
```
[SECTORISATION] 📊 Mise à jour stats véhicule: undefined
```

**Solution** :
- Le login n'a pas récupéré le vehicleId
- Vérifier que le code 587555 existe dans `ops/transport/access_codes`
- Vérifier que le code contient `vehicleId: "DK-2019-M"`

---

### Problème 2 : usageCount reste à 0

**Symptôme** :
```
fleet_vehicles/DK-2019-M/usageCount: 0 (ne bouge pas)
```

**Debug** :
```
[SECTORISATION] ⚠️ fleet_vehicles/DK-2019-M n'existe pas
```

**Solution** :
1. Créer manuellement dans Firebase Console :
```
fleet_vehicles/
  DK-2019-M/
    licensePlate: "DK-2019-M"
    lineId: "ligne_c_keur_massar"
    usageCount: 0
```

2. Rescanner un QR code
3. Vérifier que `usageCount` passe à 1

---

### Problème 3 : scan_history ne se Crée Pas

**Symptôme** :
```
scan_history reste vide après scans
```

**Debug** :
```
[SECTORISATION] 📊 Étape 5/5 : Journal scan_history
[SECTORISATION] ❌ Erreur mise à jour stats: push is not defined
```

**Solution** :
- Vérifier que `push` est bien importé de `window.firebaseDatabase`
- Ajouter dans le code :
```javascript
const { ref: dbRef, get: rtdbGet, update, push } = window.firebaseDatabase;
```

---

### Problème 4 : Logs Manquants

**Symptôme** :
```
Pas de logs [SECTORISATION] dans la console
```

**Solution** :
1. Ouvrir Console F12
2. Vérifier qu'il n'y a pas de filtres actifs
3. Chercher manuellement "SECTORISATION"
4. Si toujours rien, recharger la page et rescanner

---

## 📋 CHECKLIST FINALE

### ✅ Validation Complète

**Login** :
- [ ] Code 587555 accepté
- [ ] Session établie avec lineId et vehicleId
- [ ] Logs de sectorisation visibles

**Scan** :
- [ ] QR code SAMA PASS validé
- [ ] Écran "VALIDE ✓" affiché
- [ ] Logs d'incrémentation complets (5 étapes)

**Firebase Console** :
- [ ] `ops/transport/lines/{lineId}/stats` incrémenté
- [ ] `ops/transport/vehicles/{vehicleId}/stats` incrémenté
- [ ] `fleet_vehicles/{vehicleId}/usageCount` incrémenté ← **CRITIQUE**
- [ ] `scan_history` nouveau enregistrement créé

**Dashboard Admin** :
- [ ] Compteurs affichés correctement
- [ ] Revenu estimé calculé
- [ ] Dernière activité récente

---

## 🎉 SUCCESS CRITERIA

### Compteurs Fonctionnent Si :

1. **Après 1 scan** :
   - usageCount passe de N à N+1 ✅

2. **Après 10 scans** :
   - usageCount passe de N à N+10 ✅
   - scan_history contient 10 nouveaux enregistrements ✅
   - Dashboard affiche les 10 scans ✅

3. **Logs complets** :
   - Les 5 étapes apparaissent dans la console ✅
   - Pas d'erreurs ❌
   - Message "TOUTES LES STATS MISES À JOUR AVEC SUCCÈS" ✅

---

## 💰 Calcul Revenu Test

**Exemple après 10 scans** :

```
fleet_vehicles/DK-2019-M:
  usageCount: 10

Revenu/scan : 100 CFA
→ Revenu total = 10 × 100 = 1,000 CFA ✅
```

**Vérifier dans Dashboard** :
```
Véhicule DK-2019-M
  Revenu estimé : 1,000 CFA ✅
```

---

## 📞 Support

**Si les compteurs ne fonctionnent toujours pas après ces vérifications** :

1. Copier tous les logs de la console
2. Faire une capture d'écran de Firebase Console
3. Noter les valeurs avant/après
4. Contacter le support avec ces informations

**Le travail du transporteur DOIT être comptabilisé pour qu'il soit payé !**
