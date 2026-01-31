# Modèle Financier VIP & Fast Track - Implémenté le 31/01/2026

## 🎯 OBJECTIF

Implémenter un modèle financier définitif avec :
- Seuil VIP à 2000 billets
- Libération automatique 70% pour VIP Fast Track
- Accord Exclusivité avec CGU
- Capping frais à 2500 FCFA
- Dashboard transversal avec indicateurs de performance

---

## ✅ RÉSUMÉ DES IMPLÉMENTATIONS

### 1. **Correction Upload d'Images** ⚠️ CRITIQUE

**Problème identifié :**
- Upload bloqué à 0% avec erreur "Upload en cours... 0%"
- Cause : Règles Firebase Storage manquantes pour le dossier `landing-backgrounds/`

**Solution appliquée :**
```storage.rules
match /landing-backgrounds/{fileName} {
  allow read: if true;
  allow write: if isAdminFinance() && isValidFileSize() && isValidImage();
}
```

**Action requise de l'utilisateur :**
```bash
firebase deploy --only storage
```

### 2. **Seuil VIP & Fast Track (H.3)**

**Constantes définies dans `/src/lib/financialModel.ts` :**
```typescript
export const VIP_THRESHOLD = 2000; // Seuil VIP : 2000 billets
export const PLATFORM_COMMISSION_RATE = 0.05; // 5%
export const VIP_IMMEDIATE_RELEASE_RATE = 0.70; // 70%
export const VIP_ESCROW_RATE = 0.25; // 25%
export const TECHNICAL_WITHDRAWAL_FEE_RATE = 0.02; // 2%
export const SERVICE_FEE_CAP = 2500; // 2500 FCFA max
```

**Conditions de libération VIP Fast Track :**
```typescript
if (totalCapacity >= 2000 && exclusivityAgreement === true) {
  // ⚡ VIP Fast Track activé
  immediateRelease = 70% du CA
  escrow = 25%
  platformCommission = 5%
}
```

### 3. **Accord Exclusivité & CGU**

**Toggle implémenté dans CreateEventModal :**
- Toggle "Accord Exclusivité" avec switch visuel
- Modale CGU complète avec 6 sections :
  1. Commission et Tarification
  2. Plafond des Frais (2500 FCFA)
  3. Statut VIP Fast Track
  4. Frais de Retrait (2%)
  5. Séquestre de Sécurité
  6. Exclusivité Platform

**Mode Accord Exclusivité ON :**
```typescript
// Commission 5% ajoutée au prix (payée par acheteur)
totalPrice = ticketPrice + (ticketPrice * 0.05)
netToOrganizer = ticketPrice
```

**Mode Accord Exclusivité OFF :**
```typescript
// 5% partagée (2.5% acheteur / 2.5% vendeur)
buyerFee = (ticketPrice * 0.05) / 2
sellerFee = (ticketPrice * 0.05) / 2
totalPrice = ticketPrice + buyerFee
netToOrganizer = ticketPrice - sellerFee
```

### 4. **Capping des Frais (F.1)**

**Implémentation :**
```typescript
const serviceFee = Math.min(ticketPrice * 0.05, SERVICE_FEE_CAP);
// Maximum 2500 FCFA par billet, peu importe le prix
```

**Exemples :**
```
Billet 10 000 FCFA → Frais 500 FCFA (5%)
Billet 50 000 FCFA → Frais 2500 FCFA (5%)
Billet 100 000 FCFA → Frais 2500 FCFA (plafond atteint)
```

### 5. **Dashboard Admin Transversal - Indicateurs Performance**

**Bloc EVEN - Finance :**
```
┌─────────────────────────────────────────────────────────────┐
│ Chiffre d'affaires Total      │ {even_revenue}              │
│ Commissions Encaissées (5%)   │ {even_revenue * 0.05}       │
│ ⚡ Fonds Libérés VIP (70%)     │ {vip_events * 0.70}         │
│ Encours Séquestre             │ {remaining_escrow}          │
└─────────────────────────────────────────────────────────────┘

Détails :
├─ Événements Standard    : 95% séquestre (libéré après scan)
├─ Événements VIP (≥2000) : 70% immédiat + 25% séquestre
└─ Frais de Service       : Max 2500 FCFA par billet
```

**Bloc VOYAGE - Finance :**
```
┌─────────────────────────────────────────────────────────────┐
│ Revenus Totaux                 │ {total_pass_revenue}       │
│ Commission Platform 5%         │ {prélevé via PayDunya}     │
│ Séquestre Chauffeurs 95%       │ {en attente reversement}   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 TYPES & INTERFACES

### Event Interface (étendue)

```typescript
export interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  imageUrl: string;
  description: string;

  // Existing ticket prices
  p1?: number;
  p2?: number;
  p3?: number;
  standard?: number;
  vip?: number;
  vvip?: number;

  // Financial Model VIP & Fast Track (H.3)
  totalCapacity?: number;
  vipThreshold?: number; // Seuil VIP (défaut: 2000)
  exclusivityAgreement?: boolean; // Accord Exclusivité
  exclusivityCGUAccepted?: boolean; // CGU Exclusivité validées
  fastTrackEnabled?: boolean; // Libération 70% activée

  // Financial stats
  totalTicketsSold?: number;
  totalRevenue?: number;
  releasedFunds?: number; // Fonds libérés (70% pour VIP)
  escrowFunds?: number; // Fonds en séquestre (25%)
  platformCommission?: number; // Commission platform (5%)
}
```

---

## 🔧 FONCTIONS PRINCIPALES

### `/src/lib/financialModel.ts`

#### 1. `calculateServiceFees()`
```typescript
function calculateServiceFees(
  ticketPrice: number,
  exclusivityMode: boolean
): {
  serviceFee: number;
  buyerFee: number;
  sellerFee: number;
  totalPrice: number;
  netToOrganizer: number;
}
```

#### 2. `isEligibleForVIPFastTrack()`
```typescript
function isEligibleForVIPFastTrack(
  totalCapacity: number,
  exclusivityAgreement: boolean
): boolean
```

#### 3. `calculateFundsDistribution()`
```typescript
function calculateFundsDistribution(
  totalRevenue: number,
  isVIPFastTrack: boolean
): {
  immediateRelease: number;
  escrow: number;
  platformCommission: number;
}
```

#### 4. `calculateNetAfterWithdrawal()`
```typescript
function calculateNetAfterWithdrawal(amount: number): number
// Retourne montant - 2% frais techniques
```

#### 5. `generateEventFinancialSummary()`
```typescript
function generateEventFinancialSummary(event): {
  isVIP: boolean;
  vipStatus: string;
  totalRevenue: number;
  immediateRelease: number;
  escrow: number;
  platformCommission: number;
  netAfterWithdrawal: number;
}
```

---

## 🎨 UI/UX - Création d'Événement

### Nouveau Bloc "Modèle Financier VIP & Fast Track"

**Emplacement :**
- Dans `CreateEventModal.tsx`
- Après la section "Types de billets"
- Avant le bouton "Créer l'événement"

**Composants visuels :**
1. **Toggle Accord Exclusivité**
   - Switch moderne ON/OFF
   - Description : "Commission 5% ajoutée au prix • Reversement automatique 70% pour VIP"

2. **Badge Statut VIP** (si capacité ≥ 2000)
   - Mode VIP activé : ⚡ STATUT VIP FAST TRACK ACTIVÉ (vert)
   - Mode éligible : Éligible VIP • Activez l'Accord Exclusivité (orange)

3. **Info Commission** (si Accord OFF)
   - Badge bleu : "Sans Accord Exclusivité : Commission 5% partagée (2.5% acheteur / 2.5% vendeur)"

### Modale CGU

**Déclenchement :** Lors de l'activation du toggle Accord Exclusivité

**Sections de la modale :**
1. Commission et Tarification
2. Plafond des Frais (2500 FCFA)
3. Statut VIP Fast Track (≥2000 billets)
4. Frais de Retrait (2%)
5. Séquestre de Sécurité
6. Exclusivité Platform

**Boutons :**
- [Refuser] → Désactive l'Accord
- [✓ Accepter les CGU] → Active l'Accord + enregistre CGU acceptées

---

## 📈 DASHBOARD ADMIN TRANSVERSAL

### Bloc EVEN - Finance

**4 KPI Cartes :**
```
┌─────────────────────────────────────────────────┐
│ 1. Chiffre d'affaires Total                     │
│    [Icône TrendingUp] {even_revenue}            │
│    "Toutes ventes confondues"                   │
├─────────────────────────────────────────────────┤
│ 2. Commissions Encaissées                       │
│    [Icône CreditCard] {even_revenue * 0.05}     │
│    "5% de commission platform"                  │
├─────────────────────────────────────────────────┤
│ 3. ⚡ Fonds Libérés VIP (70%)                   │
│    [Icône CheckCircle] {vip_revenue * 0.70}     │
│    "Reversement immédiat événements VIP"        │
├─────────────────────────────────────────────────┤
│ 4. Encours Séquestre                            │
│    [Icône Shield] {remaining_escrow}            │
│    "Fonds en attente de libération après scan"  │
└─────────────────────────────────────────────────┘
```

**3 Badges Info :**
- Événements Standard : 95% séquestre
- Événements VIP (≥2000) : 70% immédiat + 25% séquestre
- Frais de Service : Max 2500 FCFA

**Alerte Info :**
> Modèle VIP Fast Track : Les événements ≥2000 places avec Accord Exclusivité bénéficient du reversement automatique de 70% du CA après chaque vente

### Bloc VOYAGE - Finance

**3 KPI Cartes :**
```
┌─────────────────────────────────────────────────┐
│ 1. Revenus Totaux                               │
│    {total_pass_revenue}                         │
├─────────────────────────────────────────────────┤
│ 2. Commission Platform 5%                       │
│    "Prélevé via PayDunya"                       │
├─────────────────────────────────────────────────┤
│ 3. Séquestre Chauffeurs 95%                     │
│    "En attente reversement"                     │
└─────────────────────────────────────────────────┘
```

---

## 🔐 SÉCURITÉ - STORAGE RULES

### Problème corrigé

**Avant :**
```storage.rules
// ❌ Pas de règle pour landing-backgrounds/
// Toute tentative d'upload bloquée par défaut
```

**Après :**
```storage.rules
match /landing-backgrounds/{fileName} {
  // Public : Lecture des images d'accueil
  allow read: if true;

  // Admin Finance uniquement : Upload
  allow write: if isAdminFinance() &&
                 isValidFileSize() &&
                 isValidImage();
}
```

---

## 🚀 DÉPLOIEMENT

### Action Requise

Pour que l'upload d'images fonctionne, déployez les nouvelles règles Storage :

```bash
firebase deploy --only storage
```

### Vérification

1. **Règles Storage déployées** ✅
   - Connectez-vous au Dashboard Admin Transversal
   - Allez dans "Paramètres" → "Gestion des Images d'Accueil"
   - Testez l'upload d'une image
   - Doit afficher la progression 0% → 100% → "Upload réussi"

2. **Création d'événement VIP** ✅
   - Connectez-vous en tant qu'organisateur
   - Créez un événement avec ≥2000 places
   - Activez "Accord Exclusivité"
   - Acceptez les CGU
   - Vérifiez le badge "⚡ STATUT VIP FAST TRACK ACTIVÉ"

3. **Dashboard Finance** ✅
   - Connectez-vous au Dashboard Admin Transversal
   - Onglet "EVEN" → "Finance"
   - Vérifiez l'affichage des 4 KPI + 3 badges info

---

## 📋 EXEMPLES DE CALCULS

### Exemple 1 : Événement Standard (500 places)

**Configuration :**
- Capacité : 500 places
- Accord Exclusivité : OFF
- Prix billet : 10 000 FCFA

**Calculs :**
```
Commission totale  = 10 000 * 5% = 500 FCFA
Frais acheteur     = 500 / 2 = 250 FCFA
Frais vendeur      = 500 / 2 = 250 FCFA
Prix TTC acheteur  = 10 000 + 250 = 10 250 FCFA
Net organisateur   = 10 000 - 250 = 9 750 FCFA

Répartition après vente :
- Séquestre : 9 750 * 95% = 9 262 FCFA (libéré après scan)
- Commission : 500 FCFA
```

### Exemple 2 : Événement VIP Fast Track (3000 places)

**Configuration :**
- Capacité : 3000 places
- Accord Exclusivité : ON
- Prix billet : 10 000 FCFA

**Calculs :**
```
Commission totale  = 10 000 * 5% = 500 FCFA
Frais acheteur     = 500 FCFA (ajouté au prix)
Frais vendeur      = 0 FCFA
Prix TTC acheteur  = 10 000 + 500 = 10 500 FCFA
Net organisateur   = 10 000 FCFA

Répartition après vente (VIP Fast Track) :
- Libération immédiate : 10 000 * 70% = 7 000 FCFA
- Séquestre : 10 000 * 25% = 2 500 FCFA
- Commission : 500 FCFA (5%)

Frais de retrait (2%) :
- Montant brut retrait : 7 000 FCFA
- Frais techniques : 7 000 * 2% = 140 FCFA
- Net reçu : 6 860 FCFA
```

### Exemple 3 : Billet Premium avec Capping

**Configuration :**
- Prix billet : 100 000 FCFA
- Accord Exclusivité : ON

**Calculs :**
```
Commission calculée = 100 000 * 5% = 5 000 FCFA
Plafond             = 2 500 FCFA
Commission appliquée = Math.min(5 000, 2 500) = 2 500 FCFA ✓

Prix TTC acheteur   = 100 000 + 2 500 = 102 500 FCFA
Net organisateur    = 100 000 FCFA

Si VIP Fast Track :
- Libération : 100 000 * 70% = 70 000 FCFA
- Séquestre : 100 000 * 25% = 25 000 FCFA
- Commission : 2 500 FCFA (plafonné)
```

---

## 🎯 STATUTS VIP

### Matrice de décision

| Capacité | Accord Exclusivité | Statut | Reversement |
|----------|-------------------|--------|-------------|
| < 2000   | OFF               | Standard | 95% séquestre après scan |
| < 2000   | ON                | Standard | 95% séquestre après scan |
| ≥ 2000   | OFF               | **Éligible VIP** | 95% séquestre après scan |
| ≥ 2000   | ON                | **⚡ VIP Fast Track** | 70% immédiat + 25% séquestre |

### Affichage UI selon statut

**Standard :**
```
Aucun badge affiché
```

**Éligible VIP :**
```
[Badge Orange]
📊 Capacité : 2500 / 2000 places
🔓 Activez l'Accord Exclusivité pour débloquer le Fast Track
```

**VIP Fast Track :**
```
[Badge Vert Animé]
⚡ STATUT VIP FAST TRACK ACTIVÉ
✅ Reversement automatique de 70% du CA après chaque vente
✅ 25% en séquestre de sécurité
✅ 5% commission platform
```

---

## 📦 FICHIERS MODIFIÉS

### Nouveaux fichiers

- `/src/lib/financialModel.ts` - Module calculs financiers VIP

### Fichiers modifiés

1. `/src/types.ts` - Interface Event étendue
2. `/src/components/CreateEventModal.tsx` - Toggle Exclusivité + CGU
3. `/src/pages/AdminTransversalDashboard.tsx` - Indicateurs performance
4. `/storage.rules` - Règles Firebase Storage (landing-backgrounds)

---

## ✅ BUILD PRODUCTION

```bash
✓ 1610 modules transformed
✓ built in 18.66s

dist/assets/index-qoYToy5b.css    131.22 kB │ gzip:  17.95 kB
dist/assets/index-DeJl7PtP.js   1,654.05 kB │ gzip: 365.34 kB
```

---

## 🎓 FORMATION & DOCUMENTATION

### Pour les Organisateurs

**Activation VIP Fast Track :**
1. Créez un événement avec au moins 2000 places
2. Cochez "Accord Exclusivité"
3. Lisez et acceptez les CGU
4. Badge ⚡ VIP Fast Track s'affiche
5. Après chaque vente, 70% reversé immédiatement sur votre solde

**Sans Accord Exclusivité :**
- Commission 5% partagée
- 2.5% payé par acheteur
- 2.5% déduit de votre net
- 95% en séquestre jusqu'à après l'événement

### Pour les Super Admins

**Dashboard Transversal :**
- `/admin/transversal` → Vue d'ensemble financière
- Onglet "EVEN" → Finance : 4 KPI + détails
- Onglet "DEM-DEM" → Finance : 3 KPI voyage
- Filtres : Tous | Nouveaux | En attente docs | Validés

**Validation KYC :**
- Onglet "EVEN" → Validation KYC : Liste organisateurs
- Onglet "DEM-DEM" → Validation Chauffeurs : Liste chauffeurs
- Actions : [✓ Valider] | [✗ Rejeter]
- Documents consultables : Permis, Assurance, Carte Grise

---

## 🔒 SÉCURITÉ & CONFORMITÉ

### Engagement Exclusivité

En activant l'Accord Exclusivité, l'organisateur s'engage à :
- Utiliser EvenPass comme plateforme exclusive
- Ne pas vendre de billets en dehors de la plateforme
- Respecter les CGU spécifiques
- Accepter la commission ajoutée au prix

### Protection des Fonds

**Séquestre de sécurité :**
- Événements Standard : 95% en séquestre
- Événements VIP : 25% en séquestre
- Libération après validation des scans d'entrée
- Protection acheteurs ET organisateurs

**Frais de retrait :**
- 2% de frais techniques
- Couvre frais bancaires et mobile money
- Appliqué au moment du retrait vers compte bancaire/MM

---

## 📞 SUPPORT

### En cas de problème

**Upload d'images bloqué :**
```bash
# Vérifier que les règles sont déployées
firebase deploy --only storage

# Vérifier dans Firebase Console
# Storage → Rules → landing-backgrounds doit exister
```

**Badge VIP ne s'affiche pas :**
- Vérifier capacité totale ≥ 2000
- Vérifier Accord Exclusivité activé
- Vérifier CGU acceptées
- Rafraîchir la page

**Calculs financiers incorrects :**
- Vérifier dans `/src/lib/financialModel.ts`
- Constantes définies correctement
- Tester avec console.log() les valeurs

---

## 🎉 CONCLUSION

Le modèle financier VIP & Fast Track est maintenant pleinement opérationnel avec :

✅ Seuil VIP à 2000 billets
✅ Libération automatique 70% pour VIP
✅ Accord Exclusivité avec CGU complètes
✅ Capping frais à 2500 FCFA
✅ Dashboard avec indicateurs de performance
✅ Correction bug upload d'images
✅ Build production validé

**Action requise :** Déployer les règles Storage avec `firebase deploy --only storage`

---

Implémenté le 31/01/2026 par Bolt
Document version 1.0
