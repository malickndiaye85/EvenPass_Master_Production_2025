# Guide Professionnel : Génération de SAMA PASS de Test Valides

**Date**: 2026-03-08
**Statut**: ✅ COMPLET ET VALIDÉ
**Objectif**: Générer des SAMA PASS de test qui respectent 100% des critères de sécurité GËNAA WÓOR

---

## 📋 Table des Matières

1. [Vue d'ensemble du système](#vue-densemble-du-système)
2. [Schéma de données requis](#schéma-de-données-requis)
3. [Critères de validation GËNAA WÓOR](#critères-de-validation-gënaa-wóor)
4. [Méthodes de génération](#méthodes-de-génération)
5. [Tests et validation](#tests-et-validation)
6. [Dépannage](#dépannage)

---

## Vue d'ensemble du système

### Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                    TUNNEL D'ACHAT / GÉNÉRATION                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Utilisateur sélectionne une ligne de transport             │
│     (Ex: Keur Massar ⇄ UCAD)                                   │
│                                                                 │
│  2. Choix de la formule                                        │
│     - ECO: 2 trajets/jour max                                  │
│     - PRESTIGE: 2 trajets/jour max                            │
│                                                                 │
│  3. Choix de la durée                                          │
│     - Hebdomadaire (7 jours)                                   │
│     - Mensuel (30 jours)                                       │
│     - Trimestriel (90 jours)                                   │
│                                                                 │
│  4. Informations passager                                      │
│     - Prénom + Nom                                             │
│     - Téléphone (+221 77 XXX XXXX)                            │
│     - Photo                                                    │
│                                                                 │
│  5. GÉNÉRATION DU SAMA PASS                                    │
│     ↓                                                           │
│     Firebase: demdem/sama_passes/{id}                          │
│     ↓                                                           │
│     Format QR: SAMAPASS-{phone}-{subscriptionId}              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VALIDATION EPscanT (Scanner)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ÉTAPE 1: Recherche du Pass                                    │
│  ✓ Lecture depuis demdem/sama_passes                           │
│  ✓ Recherche par QR code exact                                 │
│  ✓ Fallback: recherche par téléphone                           │
│                                                                 │
│  ÉTAPE 2: Validation GËNAA WÓOR (Sécurité)                    │
│  ✓ Contrôle 1: Statut 'active'                                │
│  ✓ Contrôle 2: Date d'expiration non dépassée                 │
│  ✓ Contrôle 3: Ligne correcte (routeId)                       │
│  ✓ Contrôle 4: Quota journalier (max 2 trajets/jour)          │
│  ✓ Contrôle 5: Anti-passback (30 min entre scans)             │
│                                                                 │
│  ÉTAPE 3: Enregistrement du Scan                               │
│  ✓ Sauvegarde dans demdem/transport_scans                      │
│  ✓ Mise à jour du compteur quotidien                           │
│  ✓ Horodatage du dernier scan                                  │
│                                                                 │
│  ÉTAPE 4: Affichage de la Carte SAMA PASS                      │
│  ✓ Photo du passager                                           │
│  ✓ Informations complètes                                      │
│  ✓ Compteur de trajets                                         │
│  ✓ Statut de validation                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schéma de données requis

### Structure Firebase Attendue

**Chemin**: `demdem/sama_passes/{subscriptionId}`

```typescript
interface SAMAPass {
  // Identifiants
  id: string;                    // Ex: "sub_1709812345678_abc123"
  qrCode: string;                // Ex: "SAMAPASS-221771234567-sub_1709812345678_abc123"

  // Informations passager
  passengerPhone: string;        // Ex: "221771234567" (sans espaces, sans +)
  passengerName: string;         // Ex: "Amadou Diallo"
  photoUrl?: string;             // URL Cloudinary (optionnel pour test)

  // Abonnement
  subscriptionType: 'weekly' | 'monthly' | 'quarterly';
  subscriptionTier: 'eco' | 'standard' | 'prestige';

  // Ligne de transport
  routeId: string;               // Ex: "keur-massar-ucad"
  routeName: string;             // Ex: "Keur Massar ⇄ UCAD"

  // Dates (TIMESTAMP en millisecondes)
  startDate: number;             // Ex: 1709812345678
  endDate: number;               // Ex: 1712404345678
  expiresAt: number;             // Ex: 1712404345678 (identique à endDate)
  createdAt: number;             // Ex: 1709812345678

  // Statut
  status: 'active';              // TOUJOURS 'active' pour un pass valide

  // Métadonnées
  amountPaid?: number;           // Ex: 15000 (optionnel)
  isTest?: boolean;              // true pour les passes de test
  test_pass?: boolean;           // true pour les passes de test (alias)
}
```

### ⚠️ Points Critiques

| Critère | OBLIGATOIRE | Exemple |
|---------|-------------|---------|
| **Chemin Firebase** | `demdem/sama_passes/` | ❌ PAS `abonnements_express` |
| **Noms de champs** | camelCase | ✅ `passengerPhone` ❌ `subscriber_phone` |
| **Type des dates** | number (timestamp) | ✅ `1709812345678` ❌ `"2026-03-08T..."` |
| **Format téléphone** | Sans espaces, sans + | ✅ `221771234567` ❌ `+221 77 123 4567` |
| **Format QR** | `SAMAPASS-{phone}-{id}` | ✅ Exact ❌ Variations |
| **Statut** | `'active'` | ✅ String ❌ Boolean |

---

## Critères de validation GËNAA WÓOR

### Contrôle 1: Statut du Pass

```javascript
✅ VALIDE: subscription.status === 'active'
❌ INVALIDE: subscription.status === 'expired' | 'suspended'
```

**Message EPscanT si échec**:
```
PASS EXPIRED / PASS SUSPENDED
Abonnement inactif
```

---

### Contrôle 2: Date d'Expiration

```javascript
const now = Date.now();
✅ VALIDE: now <= subscription.expiresAt
❌ INVALIDE: now > subscription.expiresAt
```

**Message EPscanT si échec**:
```
PASS EXPIRÉ - Xj
Renouvellement nécessaire
```

**Calcul des dates**:
```javascript
const startDate = new Date();
const daysToAdd = {
  'weekly': 7,
  'monthly': 30,
  'quarterly': 90
};

const expiresAt = new Date(startDate);
expiresAt.setDate(expiresAt.getDate() + daysToAdd[subscriptionType]);

// Convertir en timestamp
const startTimestamp = startDate.getTime();      // Ex: 1709812345678
const expiresTimestamp = expiresAt.getTime();    // Ex: 1712404345678
```

---

### Contrôle 3: Ligne de Transport

```javascript
const vehicleLineId = vehicleSession.lineId;    // Ex: "keur-massar-ucad"
const passLineId = subscription.routeId;        // Ex: "keur-massar-ucad"

✅ VALIDE: vehicleLineId === passLineId || !vehicleLineId
❌ INVALIDE: vehicleLineId !== passLineId
```

**Message EPscanT si échec**:
```
ERREUR LIGNE
Pass pour: Keur Massar ⇄ UCAD
Véhicule sur: Pikine ⇄ Plateau
```

**Lignes disponibles** (configurées dans `demdem/transport_lines`):
- `keur-massar-ucad` → Keur Massar ⇄ UCAD
- `keur-massar-petersen` → Keur Massar ⇄ Petersen
- `keur-massar-centre` → Keur Massar ⇄ Dakar Centre
- `pikine-plateau` → Pikine ⇄ Plateau
- `guediawaye-centre` → Guédiawaye ⇄ Centre-ville

---

### Contrôle 4: Quota Journalier

```javascript
const today = new Date().toISOString().split('T')[0];  // "2026-03-08"
const dailyScansKey = `daily_scans_${today}_${subscription.id}`;
const scansToday = localStorage.getItem(dailyScansKey)?.count || 0;

✅ VALIDE: scansToday < 2
❌ INVALIDE: scansToday >= 2
```

**Message EPscanT si échec**:
```
LIMITE ATTEINTE
2/2 trajets aujourd'hui
```

**Règles**:
- **ECO**: Maximum 2 trajets par jour
- **PRESTIGE**: Maximum 2 trajets par jour
- Le compteur se réinitialise à minuit
- Stockage local dans le scanner (localStorage)

---

### Contrôle 5: Anti-Passback

```javascript
const lastScanTime = localStorage.getItem(dailyScansKey)?.lastScanTime;
if (lastScanTime) {
  const lastScan = new Date(lastScanTime);
  const minutesSince = Math.floor((Date.now() - lastScan.getTime()) / (1000 * 60));

  ✅ VALIDE: minutesSince >= 30
  ❌ INVALIDE: minutesSince < 30
}
```

**Message EPscanT si échec**:
```
SCAN TROP RAPPROCHÉ
Dernier scan il y a X minutes
```

**Règle**: Minimum 30 minutes entre deux scans du même pass.

---

## Méthodes de génération

### Méthode 1: Générateur de Test Automatique (Rapide)

**Fichier**: `src/lib/testPassGenerator.ts`

```typescript
import { generateTestSAMAPass } from '../../lib/testPassGenerator';

// Générer un pass de test avec valeurs par défaut
const testPass = await generateTestSAMAPass();

// Générer un pass pour une ligne spécifique
const testPass = await generateTestSAMAPass('keur-massar-ucad', 'prestige', 'monthly');

// Résultat
{
  id: "sub_1709812345678_abc123",
  qrCode: "SAMAPASS-221771234567-sub_1709812345678_abc123",
  passengerName: "Amadou Diallo",
  passengerPhone: "221771234567",
  routeId: "keur-massar-ucad",
  routeName: "Keur Massar ⇄ UCAD",
  subscriptionType: "monthly",
  subscriptionTier: "prestige",
  status: "active",
  startDate: 1709812345678,
  endDate: 1712404345678,
  expiresAt: 1712404345678,
  createdAt: 1709812345678,
  test_pass: true
}
```

**Avantages**:
- ✅ Génère automatiquement tous les champs
- ✅ Téléphone sénégalais valide (221 77/78/76/70)
- ✅ Nom sénégalais réaliste
- ✅ Dates correctes (timestamps)
- ✅ Enregistré directement dans Firebase
- ✅ Flag `test_pass: true` pour nettoyage facile

**Utilisation dans l'interface**:

Page: `/demdem/express?dev=true`

1. Scroll en bas de la page
2. Section "Outils de développement"
3. Cliquer sur "Générer Pass de Test"
4. Le QR code s'affiche immédiatement

---

### Méthode 2: Tunnel d'Achat Complet (Réaliste)

**Page**: `/demdem/express`

**Étapes**:

1. **Sélectionner une ligne**
   - Cliquer sur une ligne de transport
   - Ex: "Keur Massar ⇄ UCAD"

2. **Choisir la formule**
   - ECO ou PRESTIGE
   - Prix affiché dynamiquement

3. **Choisir la durée**
   - Hebdomadaire, Mensuel, ou Trimestriel

4. **Remplir les informations**
   ```
   Prénom: Amadou
   Nom: Diallo
   Téléphone: +221 77 123 4567
   Photo: [Upload ou Prendre]
   ```

5. **Valider**
   - Le pass est créé dans Firebase
   - Redirection vers `/transport/subscription-success`
   - QR code affiché

**Code de création** (`DemDemExpressPage.tsx`):

```typescript
const handlePurchaseConfirm = async (userData: UserIdentity) => {
  const { route, tier, duration } = purchaseSelection;

  // Calculer les dates
  const startDate = new Date();
  const daysMap = { weekly: 7, monthly: 30, quarterly: 90 };
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + daysMap[duration]);

  // Générer l'ID et le QR
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const cleanPhone = userData.phone.replace(/[\s+]/g, '');
  const qrCode = `SAMAPASS-${cleanPhone}-${subscriptionId}`;

  // Créer le pass avec timestamps
  const startTimestamp = startDate.getTime();
  const expiresTimestamp = expiresAt.getTime();

  const firebaseSubscription = {
    id: subscriptionId,
    qrCode: qrCode,
    passengerPhone: cleanPhone,
    passengerName: `${userData.firstName} ${userData.lastName}`,
    subscriptionType: duration,
    subscriptionTier: tier,
    routeId: route.id,
    routeName: `${route.origin} ⇄ ${route.destination}`,
    startDate: startTimestamp,
    endDate: expiresTimestamp,
    expiresAt: expiresTimestamp,
    status: 'active',
    createdAt: startTimestamp,
    photoUrl: userData.photoUrl || '',
    amountPaid: route.pricing[tier][duration],
    isTest: true
  };

  // Enregistrer dans Firebase
  const { ref, set } = await import('firebase/database');
  const { db } = await import('../../firebase');
  const subRef = ref(db, `demdem/sama_passes/${subscriptionId}`);
  await set(subRef, firebaseSubscription);

  // Rediriger vers la page de succès
  navigate('/transport/subscription-success', { state: subscriptionData });
};
```

---

### Méthode 3: Création Manuelle Firebase (Debug)

**Firebase Console** → Realtime Database

1. Naviguer vers `demdem/sama_passes`
2. Cliquer sur "➕ Ajouter un enfant"
3. Nom: `sub_test_manual_001`
4. Ajouter les champs:

```json
{
  "id": "sub_test_manual_001",
  "qrCode": "SAMAPASS-221771234567-sub_test_manual_001",
  "passengerPhone": "221771234567",
  "passengerName": "Amadou Diallo",
  "subscriptionType": "monthly",
  "subscriptionTier": "prestige",
  "routeId": "keur-massar-ucad",
  "routeName": "Keur Massar ⇄ UCAD",
  "startDate": 1709812345678,
  "endDate": 1712404345678,
  "expiresAt": 1712404345678,
  "status": "active",
  "createdAt": 1709812345678,
  "test_pass": true
}
```

**⚠️ Attention**: Les dates doivent être en **number** (pas en string).

---

## Tests et validation

### Test Complet Étape par Étape

#### ÉTAPE 1: Générer le Pass

**Option A - Générateur automatique**:
```
1. Aller sur /demdem/express?dev=true
2. Scroll en bas
3. Cliquer "Générer Pass de Test"
4. Noter le QR code affiché
```

**Option B - Tunnel d'achat**:
```
1. Aller sur /demdem/express
2. Sélectionner "Keur Massar ⇄ UCAD"
3. Choisir PRESTIGE + Mensuel
4. Remplir les infos:
   - Amadou Diallo
   - +221 77 123 4567
   - Photo test
5. Valider
6. Noter le QR code sur la page de succès
```

---

#### ÉTAPE 2: Vérifier dans Firebase

**Firebase Console** → Realtime Database → `demdem/sama_passes`

✅ **Checklist**:
- [ ] Le pass existe dans `demdem/sama_passes`
- [ ] Tous les champs sont en camelCase
- [ ] Les dates sont en **number** (pas string)
- [ ] Le téléphone est sans espaces (221771234567)
- [ ] Le QR code commence par "SAMAPASS-"
- [ ] Le statut est "active"

**Exemple de pass valide**:
```
demdem/
  └── sama_passes/
        └── sub_1709812345678_abc123/
              ├── id: "sub_1709812345678_abc123"
              ├── qrCode: "SAMAPASS-221771234567-sub_1709812345678_abc123"
              ├── passengerPhone: "221771234567"
              ├── passengerName: "Amadou Diallo"
              ├── startDate: 1709812345678         ← number
              ├── endDate: 1712404345678           ← number
              ├── expiresAt: 1712404345678         ← number
              ├── status: "active"
              ├── subscriptionType: "monthly"
              ├── subscriptionTier: "prestige"
              ├── routeId: "keur-massar-ucad"
              ├── routeName: "Keur Massar ⇄ UCAD"
              ├── createdAt: 1709812345678         ← number
              └── test_pass: true
```

---

#### ÉTAPE 3: Se Connecter au Scanner EPscanT

**URL**: `/epscant-login.html`

1. **Créer un véhicule de test** (si pas déjà fait):
   ```
   Firebase Console → demdem/transport_vehicles/

   Ajouter un véhicule:
   {
     "id": "VEH-TEST-001",
     "plateNumber": "DK-1234-AB",
     "lineId": "keur-massar-ucad",
     "lineName": "Keur Massar ⇄ UCAD",
     "status": "active",
     "pinCode": "1234"
   }
   ```

2. **Se connecter**:
   ```
   Véhicule: VEH-TEST-001
   PIN: 1234
   ```

3. **Vérifier la connexion**:
   - L'écran du scanner s'affiche
   - La ligne est affichée en haut
   - Le lecteur QR est actif

---

#### ÉTAPE 4: Scanner le QR Code

**Méthodes**:

**Option A - QR code physique**:
1. Imprimer le QR code de la page de succès
2. Pointer la caméra du scanner vers le QR

**Option B - QR code à l'écran**:
1. Ouvrir `/transport/subscription-success` sur un autre écran
2. Pointer la caméra du scanner vers l'écran

**Option C - Saisie manuelle** (pour debug):
```javascript
// Dans la console du scanner (F12)
const decodedText = "SAMAPASS-221771234567-sub_1709812345678_abc123";
// Simuler le scan
```

---

#### ÉTAPE 5: Observer la Validation

**Console Logs Attendus**:

```
[EPscanT] 📱 Scan détecté: SAMAPASS-221771234567-sub_1709812345678_abc123
[EPscanT] 🔍 Longueur QR: 56
[EPscanT] 🔍 Commence par SAMAPASS? true
[EPscanT] 🌐 Recherche en ligne...
[EPscanT] 📊 1 abonnements dans la base
[EPscanT] ✅ Abonnement trouvé en ligne (QR exact): Amadou Diallo

[EPscanT] 🔐 VALIDATION GËNAA WÓOR - Contrôles de sécurité
[EPscanT] 🚍 Ligne véhicule: keur-massar-ucad
[EPscanT] 🎫 Ligne pass: keur-massar-ucad

[EPscanT] ✅ LIGNE: Correcte
[EPscanT] 📊 QUOTA: 0/2 trajets aujourd'hui
[EPscanT] ✅ TOUS LES CONTRÔLES PASSÉS

[EPscanT] ✅ Scan enregistré en ligne pour: Amadou Diallo
```

---

#### ÉTAPE 6: Vérifier la Carte Affichée

**Carte SAMA PASS Affichée** (si tout est valide):

```
┌─────────────────────────────────────────────┐
│  [Photo]                                    │
│                                             │
│  👤 Amadou Diallo                          │
│  📞 +221 77 123 4567                       │
│                                             │
│  🚌 Ligne                                  │
│     Keur Massar ⇄ UCAD                     │
│                                             │
│  💎 Formule                                │
│     💎 PRESTIGE                            │
│                                             │
│  📅 Type                                   │
│     Mensuel                                │
│                                             │
│  📊 Trajets aujourd'hui                     │
│     1/2                                    │
│                                             │
│  ⏰ Expire le                              │
│     07 avril 2026                          │
│                                             │
│  ✅ PASS VALIDE                            │
│     Bienvenue à bord                       │
│                                             │
│  [Bouton Fermer]                           │
└─────────────────────────────────────────────┘
```

**Éléments visibles**:
- ✅ Photo du passager (si fournie)
- ✅ Nom complet
- ✅ Téléphone formaté
- ✅ Ligne de transport
- ✅ Formule (ECO ou PRESTIGE)
- ✅ Type d'abonnement
- ✅ Compteur de trajets (X/2)
- ✅ Date d'expiration
- ✅ Message de validation vert

---

### Tests des Contrôles de Sécurité

#### Test 1: Pass Expiré

**Créer un pass expiré**:
```typescript
const yesterday = Date.now() - (24 * 60 * 60 * 1000);
const firebaseSubscription = {
  ...
  startDate: yesterday - (30 * 24 * 60 * 60 * 1000),
  endDate: yesterday,
  expiresAt: yesterday,
  status: 'active'
};
```

**Résultat attendu**:
```
❌ PASS EXPIRÉ - 1j
Renouvellement nécessaire
```

---

#### Test 2: Mauvaise Ligne

**Créer un pass pour une autre ligne**:
```typescript
const firebaseSubscription = {
  ...
  routeId: 'pikine-plateau',
  routeName: 'Pikine ⇄ Plateau'
};
```

**Scanner avec véhicule sur ligne différente**:
```
Véhicule: keur-massar-ucad
Pass: pikine-plateau
```

**Résultat attendu**:
```
❌ ERREUR LIGNE
Pass pour: Pikine ⇄ Plateau
Véhicule sur: Keur Massar ⇄ UCAD
```

---

#### Test 3: Quota Atteint

**Simuler 2 scans le même jour**:
```javascript
// Dans la console du scanner
const today = new Date().toISOString().split('T')[0];
const dailyScansKey = `daily_scans_${today}_${subscriptionId}`;
localStorage.setItem(dailyScansKey, JSON.stringify({
  count: 2,
  lastScanTime: new Date().toISOString()
}));
```

**Scanner une 3ème fois**:

**Résultat attendu**:
```
⚠️ LIMITE ATTEINTE
2/2 trajets aujourd'hui
```

---

#### Test 4: Anti-Passback

**Simuler un scan récent**:
```javascript
// Scan il y a 5 minutes
const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
const dailyScansKey = `daily_scans_${today}_${subscriptionId}`;
localStorage.setItem(dailyScansKey, JSON.stringify({
  count: 1,
  lastScanTime: fiveMinutesAgo.toISOString()
}));
```

**Scanner immédiatement**:

**Résultat attendu**:
```
⚠️ SCAN TROP RAPPROCHÉ
Dernier scan il y a 5 minutes
```

---

## Dépannage

### Problème: Pass Invalide - Code non reconnu

**Symptômes**:
```
❌ PASS INVALIDE
Code non reconnu: SAMAPASS-221771234567-xxx
```

**Causes possibles**:

1. **Mauvais chemin Firebase**
   ```
   ❌ abonnements_express
   ✅ demdem/sama_passes
   ```

2. **Mauvais format de QR**
   ```
   ❌ PASS-221771234567-xxx
   ✅ SAMAPASS-221771234567-xxx
   ```

3. **Champs en snake_case**
   ```
   ❌ subscriber_phone
   ✅ passengerPhone
   ```

4. **Dates en string**
   ```
   ❌ "2026-03-08T12:00:00Z"
   ✅ 1709812345678
   ```

**Solution**:
```bash
# Rebuild complet
npm run build
bash sync-html.sh

# Vérifier Firebase Console
# - Chemin: demdem/sama_passes
# - Champs: camelCase
# - Dates: number
```

---

### Problème: Pass trouvé mais invalide

**Symptômes**: Le pass est trouvé dans Firebase mais rejeté par un contrôle.

**Diagnostic**:

1. **Vérifier les logs**:
   ```
   F12 → Console
   Chercher: [EPscanT]
   ```

2. **Identifier le contrôle échoué**:
   - ❌ STATUT → Vérifier `status: 'active'`
   - ❌ EXPIRÉ → Vérifier `expiresAt > Date.now()`
   - ❌ LIGNE → Vérifier `routeId` correspond
   - ❌ QUOTA → Réinitialiser localStorage
   - ❌ ANTI-PASSBACK → Attendre 30 min

---

### Problème: Scanner ne démarre pas

**Symptômes**: Écran noir, pas de caméra.

**Solutions**:

1. **Autoriser la caméra**:
   ```
   Chrome → Paramètres → Confidentialité
   → Autorisations du site → Caméra
   → Autoriser pour demdem.sn
   ```

2. **Vérifier le véhicule**:
   ```
   Firebase Console → demdem/transport_vehicles
   - Véhicule existe?
   - PIN correct?
   - lineId défini?
   ```

3. **Forcer le rechargement**:
   ```
   Ctrl + Shift + R (hard refresh)
   ```

---

### Problème: Dates invalides

**Symptômes**: Pass rejeté comme expiré alors qu'il est actif.

**Causes**:
- Dates stockées en string au lieu de number
- Mauvais calcul de timestamp

**Vérification**:
```javascript
// Dans Firebase Console
typeof subscription.startDate    // doit être "number"
typeof subscription.expiresAt    // doit être "number"

// Exemple valide
subscription.startDate = 1709812345678    // ✅ number
subscription.startDate = "2026-03-08..."  // ❌ string
```

**Correction**:
```typescript
// CORRECT
const startDate = new Date();
const startTimestamp = startDate.getTime();  // number

// INCORRECT
const startDate = new Date().toISOString();  // string
```

---

### Problème: Téléphone non nettoyé

**Symptômes**: QR code avec espaces ou caractères spéciaux.

**Exemple incorrect**:
```
SAMAPASS-+221 77 123 4567-sub_xxx
```

**Correction**:
```typescript
// Nettoyer le téléphone AVANT de générer le QR
const cleanPhone = userData.phone.replace(/[\s+]/g, '');
// Résultat: "221771234567"

const qrCode = `SAMAPASS-${cleanPhone}-${subscriptionId}`;
// Résultat: "SAMAPASS-221771234567-sub_xxx"
```

---

## Résumé des Points Clés

### ✅ Checklist de Validation Complète

**Avant de tester un pass**:

- [ ] Enregistré dans `demdem/sama_passes` (pas `abonnements_express`)
- [ ] Tous les champs en camelCase (pas snake_case)
- [ ] Dates en number (timestamps), pas en string
- [ ] Téléphone sans espaces ni + (221771234567)
- [ ] QR code au format exact: `SAMAPASS-{phone}-{id}`
- [ ] Statut = `'active'` (string)
- [ ] `expiresAt` > Date actuel
- [ ] `routeId` correspond à une ligne existante
- [ ] `routeName` descriptif et lisible

**Lors du scan**:

- [ ] Véhicule connecté avec PIN valide
- [ ] Ligne du véhicule correspond au pass
- [ ] Quota < 2 trajets aujourd'hui
- [ ] Dernier scan > 30 minutes
- [ ] Connexion internet disponible (ou cache valide)

---

## Support Technique

**En cas de blocage**:

1. **Consulter les logs**: F12 → Console → Chercher `[EPscanT]`
2. **Vérifier Firebase**: Console → demdem/sama_passes
3. **Tester le générateur**: `/demdem/express?dev=true`
4. **Rebuild complet**: `npm run build && bash sync-html.sh`
5. **Clear cache**: localStorage.clear() dans la console

---

**Document créé le**: 2026-03-08
**Dernière mise à jour**: 2026-03-08
**Version**: 1.0 - PRODUCTION READY
