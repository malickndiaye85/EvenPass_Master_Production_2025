# SECTORISATION PAR CODE D'ACCÈS - EPSCANT TRANSPORT

**Date** : 2026-03-09
**Auteur** : Bolt
**Statut** : ✅ DÉPLOYÉ

---

## 🎯 Objectif

Le **code d'accès** devient la **source unique de vérité** pour déterminer :
- Sur quelle ligne le bus circule
- Quelles statistiques mettre à jour
- Quels abonnés sont autorisés à monter

**Principe** : Un contrôleur ne peut valider que les pass correspondant à SA ligne active.

---

## 🔐 Architecture de Sectorisation

### **Liaison Code → Véhicule → Ligne**

```
Code d'Accès (811384)
    ↓
Véhicule (vehicleId dans Firestore)
    ↓
Ligne (lineId dans Realtime Database)
    ↓
Stats (scans_today, occupancy_rate)
```

### **Collections Firebase**

#### **1. Firestore : `access_codes/{code}`**
```json
{
  "code": "811384",
  "type": "vehicle",
  "vehicleId": "vehicle_abc123",
  "vehiclePlate": "DK-123-AA",
  "isActive": true,
  "createdAt": "2026-03-09T10:00:00Z",
  "lastUsed": "2026-03-09T14:30:00Z",
  "usageCount": 45
}
```

#### **2. Realtime Database : `ops/transport/vehicles/{vehicleId}`**
```json
{
  "lineId": "line_keur_massar_ucad",
  "licensePlate": "DK-123-AA",
  "driverName": "Modou Diop",
  "isActive": true,
  "stats": {
    "scans_today": 28,
    "total_scans": 1456,
    "occupancy_rate": 56,
    "last_scan": 1709991000000
  }
}
```

#### **3. Realtime Database : `transport_lines/{lineId}`**
```json
{
  "name": "Keur Massar ⇄ UCAD",
  "route": "Keur Massar - UCAD",
  "is_active": true,
  "price_weekly": 10000,
  "price_monthly": 19000
}
```

#### **4. Realtime Database : `ops/transport/lines/{lineId}/stats`**
```json
{
  "scans_today": 156,
  "total_scans": 8923,
  "last_scan": 1709991000000,
  "last_scan_date": "2026-03-09"
}
```

---

## 🔄 Flux Complet

### **1. Connexion du Contrôleur (epscant-login.html)**

```
Contrôleur saisit code → 811384
    ↓
Validation dans Firestore (access_codes/811384)
    ↓
Récupération vehicleId → vehicle_abc123
    ↓
Recherche véhicule dans ops/transport/vehicles
    ↓
Extraction lineId → line_keur_massar_ucad
    ↓
Recherche ligne dans transport_lines
    ↓
SESSION ÉTABLIE
{
  lineId: "line_keur_massar_ucad",
  lineName: "Keur Massar ⇄ UCAD",
  vehicleId: "vehicle_abc123",
  vehiclePlate: "DK-123-AA",
  accessCode: "811384"
}
    ↓
Stockage dans localStorage (epscant_line_session)
    ↓
Redirection vers epscant-transport.html
```

**Affichage** :
- Header : "DK-123-AA"
- Ligne Active : "Keur Massar ⇄ UCAD"

---

### **2. Scan d'un QR Code SAMA PASS**

```
QR Code scanné : SAMAPASS-221778000000--On5AfBcDeFgHiJk
    ↓
Extraction ID Firebase → -On5AfBcDeFgHiJk
    ↓
Recherche dans demdem/sama_passes/-On5AfBcDeFgHiJk
    ↓
Abonnement trouvé
{
  routeId: "line_keur_massar_ucad",
  routeName: "Keur Massar ⇄ UCAD",
  status: "active",
  expiresAt: 1738454400000
}
    ↓
VALIDATION SECTORISATION
    ↓
Comparaison : routeId (abonné) vs lineId (contrôleur)
```

---

### **3. Scénarios de Validation**

#### **✅ Scénario A : MATCH Ligne**

```
Abonné routeId     : line_keur_massar_ucad
Contrôleur lineId  : line_keur_massar_ucad
    ↓
MATCH = true
    ↓
Actions :
  1. Afficher carte SAMA PASS "VALIDE"
  2. Incrémenter stats ligne (scans_today +1)
  3. Incrémenter stats véhicule (scans_today +1)
  4. Calculer taux d'occupation (scans/50)
  5. Mettre à jour last_scan timestamp
    ↓
Compteurs :
  - Validés : +1
  - Total : +1
```

**Carte Affichée** :
```
┌────────────────────────────────┐
│  🚌 SAMA PASS                  │
├────────────────────────────────┤
│  Malick Ndiaye                 │
│  +221 77 800 00 00             │
│                                │
│  🚌 Ligne: Keur Massar ⇄ UCAD  │
│  💎 Formule: PRESTIGE          │
│  📅 Durée: Mensuel             │
│  ✅ Valable: 08/04/2026        │
│                                │
│  [✅ VALIDE]                   │
│                                │
│  [SUIVANT]                     │
└────────────────────────────────┘
```

---

#### **⚠️ Scénario B : NO MATCH Ligne**

```
Abonné routeId     : line_thiaroye_medina
Contrôleur lineId  : line_keur_massar_ucad
    ↓
MATCH = false
    ↓
Actions :
  1. Afficher carte SAMA PASS "LIGNE NON AUTORISÉE"
  2. NE PAS incrémenter les stats
  3. Afficher détails de la ligne attendue
    ↓
Compteurs :
  - Refusés : +1
  - Total : +1
```

**Carte Affichée** :
```
┌────────────────────────────────┐
│  🚌 SAMA PASS                  │
├────────────────────────────────┤
│  Malick Ndiaye                 │
│  +221 77 800 00 00             │
│                                │
│  🚌 Ligne Pass: Thiaroye ⇄ Med │
│  💎 Formule: PRESTIGE          │
│                                │
│  [⚠️ LIGNE NON AUTORISÉE]      │
│                                │
│  Ce pass est valide uniquement │
│  pour la ligne:                │
│  Thiaroye ⇄ Médina             │
│                                │
│  Ligne Contrôleur:             │
│  Keur Massar ⇄ UCAD            │
│                                │
│  [SUIVANT]                     │
└────────────────────────────────┘
```

---

#### **❌ Scénario C : Abonnement Expiré**

```
Abonné expiresAt   : 1709820000000 (07/03/2026)
Aujourd'hui        : 1709991000000 (09/03/2026)
    ↓
Expiré depuis 2 jours
    ↓
Actions :
  - Afficher "PASS EXPIRÉ"
  - NE PAS vérifier la ligne
  - NE PAS incrémenter les stats
    ↓
Compteurs :
  - Refusés : +1
  - Total : +1
```

---

#### **❌ Scénario D : Abonnement Inactif**

```
Abonné status      : "suspended"
    ↓
Actions :
  - Afficher "PASS SUSPENDED"
  - NE PAS vérifier la ligne
  - NE PAS incrémenter les stats
    ↓
Compteurs :
  - Refusés : +1
  - Total : +1
```

---

## 📊 Remontée Analytics

### **1. Stats Ligne (`ops/transport/lines/{lineId}/stats`)**

**Mise à jour automatique à chaque scan validé** :
```javascript
{
  scans_today: 156,      // +1 à chaque scan
  total_scans: 8923,     // +1 à chaque scan
  last_scan: 1709991000, // Timestamp du dernier scan
  last_scan_date: "2026-03-09"
}
```

**Utilisation** :
- Dashboard Admin Transport → Statistiques par ligne
- Ligne 360 → Scans Aujourd'hui
- Reporting → Performance des lignes

---

### **2. Stats Véhicule (`ops/transport/vehicles/{vehicleId}/stats`)**

**Mise à jour automatique à chaque scan validé** :
```javascript
{
  scans_today: 28,           // +1 à chaque scan
  total_scans: 1456,         // +1 à chaque scan
  occupancy_rate: 56,        // Calculé : (scans_today / capacity) * 100
  last_scan: 1709991000,     // Timestamp
  last_scan_date: "2026-03-09"
}
```

**Calcul Taux d'Occupation** :
```javascript
const capacity = 50; // Capacité par défaut
const occupancyRate = Math.min(100, Math.round((scans_today / capacity) * 100));
```

**Utilisation** :
- Dashboard Transport → Taux d'occupation par bus
- Ligne 360 → Performance des véhicules
- Optimisation → Identifier les bus surchargés

---

## 🔒 Sécurité

### **1. Validation du Code d'Accès**

**Checks obligatoires** :
```javascript
✅ Code existe dans Firestore
✅ isActive = true
✅ type = "vehicle"
✅ vehicleId existe
✅ Véhicule existe dans Realtime Database
✅ lineId est défini
✅ Ligne existe et is_active = true
```

**Si échec** :
- Afficher message d'erreur explicite
- NE PAS créer de session
- NE PAS autoriser l'accès au scanner

---

### **2. Validation de Session**

**Au chargement de epscant-transport.html** :
```javascript
const lineSession = window.LineSectorization.getLineSession();

if (!lineSession) {
  console.error('❌ Aucune session de ligne');
  // Rediriger vers login
  window.location.href = '/epscant-login.html';
}
```

---

### **3. Validation de Ligne à Chaque Scan**

**Checks obligatoires** :
```javascript
✅ Session existe
✅ Abonnement est valide (status = active)
✅ Abonnement n'est pas expiré (expiresAt > now)
✅ Ligne abonné correspond à ligne contrôleur (routeId === lineId)
```

**Si échec** :
- Afficher carte avec alerte appropriée
- NE PAS incrémenter les stats
- Incrémenter les refusés

---

## 📁 Fichiers Modifiés

### **1. Service de Sectorisation**
**Fichier** : `public/epscant-line-sectorization.js`
- `authenticateWithAccessCode()` : Authentification avec code
- `validateSubscriptionForLine()` : Validation ligne abonné vs contrôleur
- `incrementLineStats()` : Mise à jour stats ligne + véhicule
- `saveLineSession()` / `getLineSession()` : Gestion session

### **2. Login EPscanT**
**Fichier** : `public/epscant-login.html`
- Import du service de sectorisation
- Utilisation de `authenticateWithAccessCode()`
- Sauvegarde session avec lineId
- Affichage "Ligne [Nom] activée !"

### **3. Scanner EPscanT**
**Fichier** : `public/epscant-transport.html`
- Import du service de sectorisation
- Affichage ligne active dans header
- Validation avec `validateSubscriptionForLine()`
- Fonction `showLineUnauthorizedCard()` pour alertes
- Mise à jour stats automatique

### **4. Service TypeScript**
**Fichier** : `src/lib/lineSectorizationService.ts`
- Version TypeScript pour usage dans React
- Mêmes fonctions que le JS
- Types définis (LineSession, ScanValidationResult)

---

## 🧪 Tests à Effectuer

### **Test 1 : Connexion avec Code d'Accès**

**Prérequis** :
1. Code d'accès créé dans Firestore : `811384`
2. Lié au véhicule : `vehicle_abc123`
3. Véhicule assigné à ligne : `line_keur_massar_ucad`
4. Ligne active dans transport_lines

**Actions** :
1. Aller sur `/epscant-login.html`
2. Saisir code : `811384`
3. Valider

**Résultats Attendus** :
- ✅ Message : "Ligne Keur Massar ⇄ UCAD activée !"
- ✅ Redirection vers `/epscant-transport.html`
- ✅ Header affiche : "DK-123-AA"
- ✅ Ligne Active affiche : "Keur Massar ⇄ UCAD"

---

### **Test 2 : Scan Pass MÊME Ligne**

**Prérequis** :
1. Session active sur ligne : `line_keur_massar_ucad`
2. Pass créé pour ligne : `line_keur_massar_ucad`
3. Pass actif et non expiré

**Actions** :
1. Scanner le QR Code du pass
2. Observer la carte affichée

**Résultats Attendus** :
- ✅ Carte "SAMA PASS" avec statut "✅ VALIDE"
- ✅ Compteur "Validés" : +1
- ✅ Stats ligne : scans_today +1
- ✅ Stats véhicule : scans_today +1
- ✅ Console : "[SECTORISATION] ✅ Ligne autorisée"

---

### **Test 3 : Scan Pass AUTRE Ligne**

**Prérequis** :
1. Session active sur ligne : `line_keur_massar_ucad`
2. Pass créé pour ligne : `line_thiaroye_medina`
3. Pass actif et non expiré

**Actions** :
1. Scanner le QR Code du pass
2. Observer la carte affichée

**Résultats Attendus** :
- ⚠️ Carte "SAMA PASS" avec statut "⚠️ LIGNE NON AUTORISÉE"
- ⚠️ Message : "Ce pass est valide uniquement pour la ligne Thiaroye ⇄ Médina"
- ⚠️ Affichage "Ligne Contrôleur : Keur Massar ⇄ UCAD"
- ✅ Compteur "Refusés" : +1
- ❌ Stats ligne : PAS de mise à jour
- ❌ Stats véhicule : PAS de mise à jour
- ✅ Console : "[SECTORISATION] ⚠️ LIGNE NON AUTORISÉE"

---

### **Test 4 : Code d'Accès Invalide**

**Actions** :
1. Aller sur `/epscant-login.html`
2. Saisir code : `999999` (inexistant)
3. Valider

**Résultats Attendus** :
- ❌ Message d'erreur : "Code d'accès invalide"
- ❌ PAS de redirection
- ❌ PAS de session créée

---

### **Test 5 : Vérification Console Firebase**

**Actions** :
1. Après un scan validé
2. Aller dans Firebase Console
3. Vérifier `ops/transport/lines/{lineId}/stats`
4. Vérifier `ops/transport/vehicles/{vehicleId}/stats`

**Résultats Attendus** :
- ✅ `scans_today` incrémenté
- ✅ `total_scans` incrémenté
- ✅ `last_scan` mis à jour
- ✅ `last_scan_date` = aujourd'hui
- ✅ `occupancy_rate` calculé

---

## 🎯 Avantages du Système

### **1. Source Unique de Vérité**
Le code d'accès détermine TOUT :
- Quelle ligne est active
- Quels pass sont autorisés
- Où vont les stats

### **2. Sécurité Renforcée**
- Impossible de valider un pass sur la mauvaise ligne
- Contrôle strict de l'accès par code
- Traçabilité complète (last_scan, usageCount)

### **3. Analytics Précises**
- Stats par ligne fiables
- Taux d'occupation réel par véhicule
- Identification des lignes performantes

### **4. Expérience Utilisateur**
- Message clair si mauvaise ligne
- Pas de confusion pour le contrôleur
- Affichage constant de la ligne active

---

## 🚨 Points d'Attention

### **1. Code d'Accès Non Lié**
**Symptôme** : "Ce code n'est pas un code véhicule"
**Cause** : `type` != "vehicle" dans Firestore
**Solution** : Créer le code avec `type: "vehicle"`

### **2. Véhicule Sans Ligne**
**Symptôme** : "Véhicule non assigné à une ligne"
**Cause** : `lineId` manquant dans `ops/transport/vehicles/{vehicleId}`
**Solution** : Assigner le véhicule à une ligne

### **3. Ligne Désactivée**
**Symptôme** : "Ligne désactivée"
**Cause** : `is_active: false` dans `transport_lines/{lineId}`
**Solution** : Réactiver la ligne

### **4. Pass Sans routeId**
**Symptôme** : Validation échoue systématiquement
**Cause** : `routeId` manquant dans l'abonnement SAMA PASS
**Solution** : S'assurer que tous les pass ont un `routeId` valide

---

## 📱 URLs de Test

- **Login Scanner** : https://evenpasssenegal.web.app/epscant-login.html
- **Scanner Transport** : https://evenpasssenegal.web.app/epscant-transport.html
- **Firebase Console** : https://console.firebase.google.com/project/evenpasssenegal/database/evenpasssenegal-default-rtdb/data

---

## ✅ Checklist de Déploiement

- [x] Service de sectorisation créé
- [x] Login modifié pour utiliser code d'accès
- [x] Scanner modifié pour validation par ligne
- [x] Fonction d'alerte ligne non autorisée
- [x] Remontée stats ligne automatique
- [x] Remontée stats véhicule automatique
- [x] Calcul taux d'occupation
- [x] Affichage ligne active dans header
- [x] Build et sync HTML
- [ ] Test avec code d'accès réel
- [ ] Test scan pass même ligne
- [ ] Test scan pass autre ligne
- [ ] Vérification stats Firebase

---

**🎉 Le système de sectorisation par code d'accès est maintenant opérationnel !**

**Prochaine Étape** : Tester avec un code d'accès réel et des passes SAMA PASS sur différentes lignes.
