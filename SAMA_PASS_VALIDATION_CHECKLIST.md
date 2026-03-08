# Checklist de Validation SAMA PASS
**Guide Rapide pour Tests**

## ✅ Schéma de Données Requis

### Firebase Path
```
✅ demdem/sama_passes/{id}
❌ abonnements_express/{id}
```

### Champs Obligatoires (camelCase)

| Champ | Type | Exemple | Format |
|-------|------|---------|--------|
| `id` | string | `"sub_1709812345678_abc123"` | Unique |
| `qrCode` | string | `"SAMAPASS-221771234567-sub_xxx"` | SAMAPASS-{phone}-{id} |
| `passengerPhone` | string | `"221771234567"` | Sans espaces, sans + |
| `passengerName` | string | `"Amadou Diallo"` | Prénom Nom |
| `subscriptionType` | string | `"monthly"` | weekly\|monthly\|quarterly |
| `subscriptionTier` | string | `"prestige"` | eco\|standard\|prestige |
| `routeId` | string | `"keur-massar-ucad"` | ID de ligne |
| `routeName` | string | `"Keur Massar ⇄ UCAD"` | Nom lisible |
| `startDate` | **number** | `1709812345678` | Timestamp ms |
| `endDate` | **number** | `1712404345678` | Timestamp ms |
| `expiresAt` | **number** | `1712404345678` | Timestamp ms |
| `status` | string | `"active"` | active uniquement |
| `createdAt` | **number** | `1709812345678` | Timestamp ms |

### Champs Optionnels

| Champ | Type | Exemple |
|-------|------|---------|
| `photoUrl` | string | `"https://..."` |
| `amountPaid` | number | `15000` |
| `isTest` | boolean | `true` |
| `test_pass` | boolean | `true` |

---

## 🔐 Contrôles de Validation GËNAA WÓOR

### 1. Statut
```javascript
✅ subscription.status === 'active'
❌ subscription.status !== 'active'
```

### 2. Expiration
```javascript
✅ Date.now() <= subscription.expiresAt
❌ Date.now() > subscription.expiresAt
```

### 3. Ligne Correcte
```javascript
✅ vehicleLineId === subscription.routeId
❌ vehicleLineId !== subscription.routeId
```

### 4. Quota Journalier
```javascript
✅ scansToday < 2
❌ scansToday >= 2
```

### 5. Anti-Passback
```javascript
✅ minutesSinceLastScan >= 30
❌ minutesSinceLastScan < 30
```

---

## 🚀 Génération Rapide

### Via Interface
```
1. Aller sur: /demdem/express?dev=true
2. Scroll en bas
3. Cliquer: "Générer Pass de Test"
4. QR code s'affiche
```

### Via Code
```typescript
import { generateTestSAMAPass } from './lib/testPassGenerator';

const pass = await generateTestSAMAPass(
  'keur-massar-ucad',  // routeId
  'prestige',          // tier
  'monthly'            // type
);
```

---

## 🧪 Test Complet

### Étape 1: Générer
```
✅ Pass créé dans demdem/sama_passes
✅ QR code: SAMAPASS-221771234567-sub_xxx
✅ Dates en timestamp (number)
```

### Étape 2: Vérifier Firebase
```
Console → demdem/sama_passes → {id}
✅ Tous champs en camelCase
✅ startDate, endDate, expiresAt = number
✅ status = "active"
```

### Étape 3: Scanner
```
✅ Se connecter: /epscant-login.html
✅ PIN véhicule: 1234
✅ Scanner le QR code
```

### Étape 4: Validation
```
✅ Carte SAMA PASS affichée
✅ Message: "PASS VALIDE - Bienvenue à bord"
✅ Compteur: 1/2 trajets
```

---

## ❌ Erreurs Courantes

### Pass Invalide - Code non reconnu
```
Cause: Mauvais chemin ou format
Solution: Vérifier demdem/sama_passes + format QR
```

### Pass Expiré
```
Cause: expiresAt < Date.now()
Solution: Vérifier les timestamps
```

### Erreur Ligne
```
Cause: routeId différent du véhicule
Solution: Vérifier lineId du véhicule
```

### Limite Atteinte
```
Cause: 2 scans déjà faits aujourd'hui
Solution: Attendre minuit ou clear localStorage
```

### Scan Trop Rapproché
```
Cause: < 30 min depuis dernier scan
Solution: Attendre 30 minutes
```

---

## 📊 Lignes de Transport Disponibles

| ID | Nom Complet |
|----|-------------|
| `keur-massar-ucad` | Keur Massar ⇄ UCAD |
| `keur-massar-petersen` | Keur Massar ⇄ Petersen |
| `keur-massar-centre` | Keur Massar ⇄ Dakar Centre |
| `pikine-plateau` | Pikine ⇄ Plateau |
| `guediawaye-centre` | Guédiawaye ⇄ Centre-ville |

---

## 🔧 Commandes Utiles

### Build Complet
```bash
npm run build
bash sync-html.sh
```

### Logs Scanner
```javascript
// F12 → Console
// Chercher: [EPscanT]
```

### Reset Quota Journalier
```javascript
// Dans la console du scanner
const today = new Date().toISOString().split('T')[0];
Object.keys(localStorage)
  .filter(k => k.startsWith(`daily_scans_${today}`))
  .forEach(k => localStorage.removeItem(k));
```

### Nettoyer Passes de Test
```typescript
import { deleteAllTestPasses } from './lib/testPassGenerator';
const deleted = await deleteAllTestPasses();
console.log(`${deleted} passes supprimés`);
```

---

## 📱 Format QR Code

### Correct
```
SAMAPASS-221771234567-sub_1709812345678_abc123
        ↑            ↑
    Sans espaces   ID unique
    Sans +
```

### Incorrect
```
❌ PASS-221771234567-sub_xxx          (pas SAMAPASS)
❌ SAMAPASS-+221 77 123 4567-sub_xxx  (espaces et +)
❌ SAMAPASS-77123456-sub_xxx          (pas 221)
```

---

**Version**: 1.0
**Date**: 2026-03-08
