# FIX SAMA PASS - Schéma Firebase Corrigé

**Date**: 2026-03-07
**Statut**: ✅ RÉSOLU

---

## Problème Identifié

Les SAMA PASS de test affichaient l'erreur :
```
❌ PASS INVALIDE
Code non reconnu: SAMAPASS-221771234567-xxx
```

### Causes Racine

1. **Mauvais chemin Firebase** : Le générateur enregistrait dans `abonnements_express` au lieu de `demdem/sama_passes`
2. **Mauvais schéma de données** : Les champs ne correspondaient pas au format attendu par EPscanT
3. **Types incompatibles** : Dates en string au lieu de timestamps

---

## Solution Appliquée

### 1. Correction du Chemin Firebase

**AVANT** :
```typescript
const abonnementsRef = ref(db, 'abonnements_express');
```

**APRÈS** :
```typescript
const abonnementsRef = ref(db, 'demdem/sama_passes');
```

### 2. Correction du Schéma de Données

**AVANT** :
```typescript
{
  qr_code: string,
  full_name: string,
  subscriber_phone: string,
  start_date: string,    // ❌ String
  end_date: string,      // ❌ String
  route_id: string,
  route_name: string
}
```

**APRÈS** :
```typescript
{
  qrCode: string,
  passengerName: string,
  passengerPhone: string,
  startDate: number,     // ✅ Timestamp
  endDate: number,       // ✅ Timestamp
  expiresAt: number,     // ✅ Timestamp
  routeId: string,
  routeName: string,
  subscriptionType: 'monthly' | 'weekly',
  subscriptionTier: 'eco' | 'standard' | 'prestige',
  status: 'active'
}
```

---

## Test du Nouveau Système

### Étape 1 : Générer un Pass de Test

1. Aller sur `/demdem/express`
2. Activer le mode développeur (en bas de page)
3. Cliquer sur **"Générer Pass de Test"**
4. Scanner le QR code généré avec EPscanT

### Résultat Attendu

Vous devriez voir la **carte SAMA PASS complète** avec toutes les informations.

---

## Checklist de Validation

- [x] Pass créés dans `demdem/sama_passes`
- [x] Schéma compatible avec EPscanT
- [x] Timestamps au lieu de strings
- [x] Lignes réalistes avec IDs corrects
- [x] Noms sénégalais aléatoires
- [x] Formules ECO/STANDARD/PRESTIGE
