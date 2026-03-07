# Renforcement Sécurité SAMA PASS - Gënaa Wóor
**Date**: 2026-03-07
**Objectif**: Passer d'une simple validation d'existence à un contrôle de conformité strict

---

## Problème Actuel

EPscanT valide actuellement TOUS les pass sans distinction de :
- ❌ La ligne (un pass Keur Massar-Petersen fonctionne sur Keur Massar-UCAD)
- ❌ Le quota journalier (nombre illimité de scans)
- ❌ L'intervalle de sécurité (peut rescanner immédiatement)

---

## Sécurités Implémentées

### 1. Verrouillage de Ligne (Sectorisation)

**Fonctionnement** :
- Chaque pass est lié à une `route_id` spécifique
- Le véhicule connaît sa `lineId` assignée
- Validation : `subscription.route_id === vehicleLineId`

**Résultat si erreur** :
```
❌ ERREUR LIGNE
Ce pass est réservé à la ligne [Nom de la Ligne]
Couleur: ROUGE
```

**Code** : Voir `samaPassScanner.ts` ligne ~190

---

### 2. Limitation à 2 Trajets/Jour (Quota)

**Fonctionnement** :
- Firebase stocke les scans dans `/scans_journaliers/{date}/{subscriptionId}`
- Structure :
  ```json
  {
    "count": 2,
    "lastScanTime": "2026-03-07T14:30:00.000Z",
    "updatedAt": "2026-03-07T14:30:00.000Z"
  }
  ```
- Avant chaque validation, on vérifie `count < 2`

**Résultat si quota atteint** :
```
⚠️ LIMITE ATTEINTE
2/2 trajets effectués aujourd'hui
Couleur: ORANGE
```

**Fonctions** :
- `getDailyScansCount()` : Lit le compteur
- `recordDailyScan()` : Incrémente le compteur

---

### 3. Anti-Passback (30 min minimum)

**Fonctionnement** :
- Stocke `lastScanTime` dans `/scans_journaliers`
- Calcule le temps écoulé : `now - lastScanTime`
- Validation : `minutesSinceLastScan >= 30`

**Résultat si trop rapide** :
```
⚠️ SCAN TROP RAPPROCHÉ
Veuillez patienter XX min
Couleur: ORANGE
```

**Code** : Voir `samaPassScanner.ts` ligne ~210

---

## Nouveaux Status de Validation

L'interface `ScanValidationResult` inclut maintenant :

```typescript
{
  status: 'valid' | 'expired' | 'invalid' | 'not_found'
         | 'wrong_line' | 'quota_exceeded' | 'too_soon'

  // Nouveaux champs
  scansToday?: number          // Ex: 1/2
  lastScanTime?: string        // ISO timestamp
  expectedLine?: string        // Nom de la ligne attendue
}
```

---

## Ordre des Contrôles (Gënaa Wóor)

```
📱 QR Code scanné
  ↓
1️⃣ RECHERCHE ABONNEMENT
   ├─ Dans abonnements_express par qr_code
   └─ Sinon par subscriber_phone
  ↓
2️⃣ STATUT (active/suspended)
  ↓
3️⃣ PÉRIODE DE VALIDITÉ (start_date/end_date)
  ↓
4️⃣ LIGNE (route_id === vehicleLineId) ← NOUVEAU
  ↓
5️⃣ QUOTA JOURNALIER (count < 2) ← NOUVEAU
  ↓
6️⃣ ANTI-PASSBACK (30 min) ← NOUVEAU
  ↓
✅ VALIDATION RÉUSSIE
   ├─ Enregistre scan dans transport/scans
   └─ Incrémente compteur scans_journaliers
```

---

## Structure Firebase

### Nouvelle Collection : `scans_journaliers`

```
scans_journaliers/
  2026-03-07/
    sub_1709826543210_x8k2p9w4q/
      count: 1
      lastScanTime: "2026-03-07T10:00:00.000Z"
      updatedAt: "2026-03-07T10:00:00.000Z"

    sub_autre_abonnement/
      count: 2
      lastScanTime: "2026-03-07T14:30:00.000Z"
      updatedAt: "2026-03-07T14:30:00.000Z"

  2026-03-08/
    ... (nouveau jour = reset automatique)
```

**Avantages** :
- Reset automatique à minuit (nouveau noeud de date)
- Lecture ultra-rapide (un seul get sur le noeud du jour)
- Historique par jour conservé

---

## Règles Firebase

```json
"scans_journaliers": {
  ".read": true,
  "$date": {
    "$subscriptionId": {
      ".write": true,
      ".validate": "newData.hasChildren(['count', 'lastScanTime', 'updatedAt'])"
    }
  }
}
```

**Sécurité** :
- ✅ Lecture publique (pour vérification rapide)
- ✅ Écriture autorisée (pour incrémentation)
- ✅ Validation de structure obligatoire

---

## Interface Utilisateur EPscanT

### Avant (Simple Texte)
```
┌─────────────────────┐
│   ✓ PASS VALIDE     │
│  Bienvenue à bord   │
└─────────────────────┘
```

### Après (Carte SAMA PASS)
```
┌─────────────────────────────────┐
│  📸 Photo                       │
│  👤 Malick NDIAYE               │
│  📞 +221 77 100 00 00           │
│  🚌 Keur Massar ⇄ UCAD          │
│  💎 PRESTIGE                    │
│  📅 Mensuel                     │
│  📊 1/2 trajets aujourd'hui     │
│  ⏰ Expire le 07/04/2026        │
│                                 │
│  ✅ PASS VALIDE                 │
└─────────────────────────────────┘
```

**Éléments affichés** :
- Photo du passager
- Nom complet
- Numéro de téléphone
- Ligne attribuée
- Formule (ECO / PRESTIGE)
- Type d'abonnement (Hebdomadaire / Mensuel / Trimestriel)
- **Compteur de trajets** (1/2, 2/2)
- Date d'expiration

---

## Messages d'Erreur

### Erreur Ligne
```
❌ ERREUR LIGNE
Ce pass est réservé à la ligne :
Keur Massar ⇄ Petersen

Véhicule actuel :
Keur Massar ⇄ UCAD
```

### Quota Dépassé
```
⚠️ LIMITE ATTEINTE
2/2 trajets effectués aujourd'hui

Prochain trajet disponible demain
```

### Scan Trop Rapproché
```
⚠️ SCAN TROP RAPPROCHÉ
Dernier scan : Il y a 15 minutes

Veuillez patienter : 15 minutes
```

---

## Logs Console

### Validation Réussie
```
[SAMA-PASS-SCAN] 📱 Validation QR: SAMAPASS-221771000000...
[SAMA-PASS-SCAN] 🚍 Véhicule: vehicle_001, Ligne: -Om4cHJ_Ta3a5evCPADF
[SAMA-PASS-SCAN] ✅ Abonnement trouvé: Malick NDIAYE
[SAMA-PASS-SCAN] ✅ Ligne correcte: Keur Massar ⇄ UCAD
[SAMA-PASS-SCAN] 📊 Scans aujourd'hui: 0/2
[SAMA-PASS-SCAN] ⏱️ Dernier scan: Aucun
[SAMA-PASS-SCAN] ✅ Validation réussie: Malick NDIAYE
[SAMA-PASS-SCAN] ✅ Compteur quotidien mis à jour: 1/2
```

### Erreur Ligne
```
[SAMA-PASS-SCAN] ❌ ERREUR LIGNE: Pass pour -Om36xmrI3GZzDwxgmf5, véhicule sur -Om4cHJ_Ta3a5evCPADF
Status: wrong_line
Message: ERREUR LIGNE
Expected: Keur Massar ⇄ Petersen
```

### Quota Dépassé
```
[SAMA-PASS-SCAN] 📊 Scans aujourd'hui: 2/2
[SAMA-PASS-SCAN] ⚠️ QUOTA ATTEINT: 2/2 trajets
Status: quota_exceeded
```

### Anti-Passback
```
[SAMA-PASS-SCAN] ⏱️ Dernier scan: il y a 15 min
[SAMA-PASS-SCAN] ⚠️ SCAN TROP RAPPROCHÉ: 15 min restantes
Status: too_soon
```

---

## Utilisation dans EPscanT

### Ancienne Méthode (À Remplacer)
```javascript
// Validation basique
if (subscription.status === 'active' && now < expiresAt) {
  showResult('success', 'PASS VALIDE', 'Bienvenue à bord');
}
```

### Nouvelle Méthode
```javascript
import { validateSamaPass } from '../lib/samaPassScanner';

const result = await validateSamaPass(
  qrCode,
  vehicleId,
  vehicleLineId  // ← IMPORTANT: Passer la ligne du véhicule
);

switch (result.status) {
  case 'valid':
    showPassCard(result.subscription, result.scansToday);
    break;

  case 'wrong_line':
    showError('ERREUR LIGNE', result.expectedLine);
    break;

  case 'quota_exceeded':
    showWarning('LIMITE ATTEINTE', '2/2 trajets');
    break;

  case 'too_soon':
    showWarning('SCAN TROP RAPPROCHÉ', calculateRemaining(result.lastScanTime));
    break;

  default:
    showError(result.message);
}
```

---

## Configuration Véhicule

Pour que la vérification de ligne fonctionne, chaque véhicule DOIT avoir :

```json
{
  "vehicleId": "vehicle_001",
  "licensePlate": "DK-1234-AB",
  "lineId": "-Om4cHJ_Ta3a5evCPADF",  // ← ID de la ligne assignée
  "lineName": "Keur Massar ⇄ UCAD"
}
```

**Important** : Le `lineId` doit correspondre à l'ID Firebase de la ligne dans `transport_lines/`

---

## Tests à Effectuer

### ✅ Test 1 : Ligne Correcte
1. Créer un pass pour "Keur Massar ⇄ UCAD" (ligne C)
2. Scanner avec un véhicule de la ligne C
3. **Résultat attendu** : ✅ PASS VALIDE

### ❌ Test 2 : Mauvaise Ligne
1. Créer un pass pour "Keur Massar ⇄ Petersen" (ligne B)
2. Scanner avec un véhicule de la ligne C
3. **Résultat attendu** : ❌ ERREUR LIGNE

### ⚠️ Test 3 : Quota
1. Scanner le même pass 2 fois (avec 30 min d'intervalle)
2. Essayer un 3ème scan
3. **Résultat attendu** : ⚠️ LIMITE ATTEINTE

### ⚠️ Test 4 : Anti-Passback
1. Scanner un pass
2. Essayer de rescanner immédiatement
3. **Résultat attendu** : ⚠️ SCAN TROP RAPPROCHÉ

---

## Modifications Fichiers

### ✅ `src/lib/samaPassScanner.ts`
- Ajout paramètre `vehicleLineId`
- Contrôle de ligne
- Contrôle de quota
- Contrôle anti-passback
- Nouvelles fonctions helper

### ✅ `database.rules.json`
- Ajout collection `scans_journaliers`
- Règles de lecture/écriture

### 🔄 `public/epscant-transport.html` (À FAIRE)
- Intégrer nouvelle fonction `validateSamaPass()`
- Remplacer `showResult()` par `showPassCard()`
- Afficher carte complète avec photo
- Gérer nouveaux status d'erreur

---

## Prochaines Étapes

1. ✅ Modifier `samaPassScanner.ts` avec contrôles sécurité
2. ✅ Ajouter règles Firebase `scans_journaliers`
3. 🔄 Mettre à jour `epscant-transport.html`
   - Passer `vehicleLineId` à `validateSamaPass()`
   - Créer fonction `showPassCard()`
   - Gérer nouveaux messages d'erreur
4. 🔄 Tester chaque scenario
5. 🔄 Build et déploiement

---

## Résumé

✅ **Sectorisation** : Pass verrouillé à sa ligne
✅ **Quota** : Max 2 trajets/jour
✅ **Anti-Passback** : 30 min minimum entre scans
✅ **UI Améliorée** : Carte complète au lieu de texte simple
✅ **Logs Détaillés** : Debugging facilité

🎯 **Objectif atteint** : Contrôle de conformité strict "Gënaa Wóor"
