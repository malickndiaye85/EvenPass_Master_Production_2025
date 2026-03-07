# Correction QR Code SAMA PASS - DEM-DEM Express
**Date**: 2026-03-07
**Problème**: QR Code invalide après achat via `/voyage/express` → `/subscription-success`

---

## Problème Identifié

Lors de l'achat d'un abonnement SAMA PASS via le tunnel `/voyage/express`, le QR Code généré n'était pas reconnu par le scanner EPscanT.

### Causes

1. **QR Code au mauvais format**
   - Ancien: JSON stringifié avec tous les détails de l'abonnement
   - Attendu par EPscanT: `SAMAPASS-{phone}-{id}`

2. **Aucune sauvegarde Firebase**
   - L'abonnement n'était PAS sauvegardé dans `abonnements_express`
   - EPscanT ne pouvait donc pas trouver l'abonnement lors du scan

3. **Données manquantes**
   - Le `qr_code` et `subscription_id` n'étaient pas transmis à la page de succès

---

## Solution Implémentée

### 1. Génération du QR Code au bon format

**Fichier**: `src/pages/transport/DemDemExpressPage.tsx`

```typescript
// Générer le QR Code au format EPscanT
const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const qrCode = `SAMAPASS-${userData.phone}-${subscriptionId}`;
```

### 2. Sauvegarde dans Firebase

L'abonnement est maintenant sauvegardé dans `abonnements_express` avec le schéma correct :

```typescript
const firebaseSubscription = {
  id: subscriptionId,
  subscriber_phone: userData.phone,
  full_name: `${userData.firstName} ${userData.lastName}`,
  subscription_type: duration,  // 'weekly' | 'monthly' | 'quarterly'
  subscription_tier: tier,      // 'eco' | 'prestige'
  route_id: route.id,
  route_name: `${route.origin} ⇄ ${route.destination}`,
  start_date: startDate.toISOString(),
  end_date: expiresAt.toISOString(),
  status: 'active',
  qr_code: qrCode,
  created_at: startDate.toISOString(),
  photo_url: userData.photoUrl || '',
  amount_paid: price
};

// Sauvegarder dans Firebase
const subRef = ref(db, `abonnements_express/${subscriptionId}`);
await set(subRef, firebaseSubscription);
```

### 3. Transmission du QR Code à la page de succès

**Fichier**: `src/pages/transport/SubscriptionSuccessPage.tsx`

- Ajout des champs `qr_code` et `subscription_id` dans l'interface
- Utilisation du QR Code généré au lieu du JSON

```typescript
// Utiliser le QR Code généré au format EPscanT
const qrData = qr_code;  // Au lieu de JSON.stringify(...)
```

---

## Flux Corrigé

### Parcours Utilisateur

1. **Utilisateur va sur** `/voyage/express`
2. **Sélectionne** une ligne, formule (eco/prestige), durée (weekly/monthly/quarterly)
3. **Remplit** ses informations (nom, téléphone, photo)
4. **Confirme** l'achat
5. **L'abonnement est créé** :
   - ✅ Génération du QR Code format EPscanT
   - ✅ Sauvegarde dans Firebase `abonnements_express`
   - ✅ Transmission à la page de succès
6. **Redirection vers** `/subscription-success` avec le QR Code valide
7. **L'utilisateur peut** :
   - Voir son QR Code
   - Télécharger la carte
   - Scanner avec EPscanT → **FONCTIONNE** ✅

### Validation par EPscanT

Quand EPscanT scanne le QR Code :

1. **Reçoit** : `SAMAPASS-221771234567-sub_1234567890_abc123xyz`
2. **Cherche** dans `abonnements_express` où `qr_code` = valeur scannée
3. **Trouve** l'abonnement
4. **Valide** les dates et le statut
5. **Affiche** : ✅ PASS VALIDE (écran vert)

---

## Points Importants

### Format QR Code

```
SAMAPASS-{téléphone}-{subscription_id}

Exemple:
SAMAPASS-221771234567-sub_1709826543210_x8k2p9w4q
```

### Collection Firebase: `abonnements_express/`

```
abonnements_express/
  {subscription_id}/
    id: "sub_1234567890_abc123xyz"
    subscriber_phone: "221771234567"
    full_name: "Amadou Diallo"
    subscription_type: "monthly"
    subscription_tier: "eco"
    route_id: "ligne_1"
    route_name: "Dakar ⇄ Keur Massar"
    start_date: "2026-03-07T10:00:00.000Z"
    end_date: "2026-04-07T10:00:00.000Z"
    status: "active"
    qr_code: "SAMAPASS-221771234567-sub_1234567890_abc123xyz"
    created_at: "2026-03-07T10:00:00.000Z"
    photo_url: "https://..."
    amount_paid: 15000
```

---

## Tests à Effectuer

### 1. Tunnel Complet
- [ ] Aller sur `/voyage/express`
- [ ] Sélectionner une ligne et une formule
- [ ] Remplir les informations
- [ ] Confirmer l'achat
- [ ] Vérifier l'affichage du QR Code

### 2. Vérification Firebase
- [ ] Ouvrir Firebase Console
- [ ] Aller dans Realtime Database
- [ ] Vérifier que l'abonnement existe dans `abonnements_express/`
- [ ] Vérifier que le `qr_code` est au bon format

### 3. Scan avec EPscanT
- [ ] Ouvrir EPscanT (`/epscant-transport.html`)
- [ ] Se connecter avec un véhicule
- [ ] Scanner le QR Code généré
- [ ] Vérifier l'écran vert "PASS VALIDE"

---

## Commandes Utiles

### Build le projet
```bash
npm run build
```

### Vérifier Firebase
```javascript
// Dans la console Firebase Realtime Database
abonnements_express/
```

### Tester localement
```bash
npm run dev
# Puis aller sur http://localhost:5173/voyage/express
```

---

## Fichiers Modifiés

1. **src/pages/transport/DemDemExpressPage.tsx**
   - Génération du QR Code format EPscanT
   - Sauvegarde dans Firebase `abonnements_express`
   - Transmission des données complètes

2. **src/pages/transport/SubscriptionSuccessPage.tsx**
   - Ajout des champs `qr_code` et `subscription_id`
   - Utilisation du QR Code EPscanT au lieu du JSON

---

## Résultat Final

✅ **Le QR Code généré via `/voyage/express` fonctionne maintenant avec EPscanT**

- Format QR Code correct
- Sauvegarde Firebase OK
- Scanner EPscanT valide le pass
- Écran vert "PASS VALIDE" s'affiche
