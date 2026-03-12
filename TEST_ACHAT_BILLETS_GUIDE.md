# 🧪 GUIDE DE TEST - ACHAT DE BILLETS ÉVÉNEMENTS

## ✅ CHECKLIST AVANT TEST

- [ ] Projet buildé: `npm run build`
- [ ] Firebase Console accessible
- [ ] Événement créé avec ticket_types
- [ ] Variables d'environnement configurées (pour Wave)

## 🎯 TEST 1: ACHAT AVEC ORANGE MONEY

### Étape 1: Créer un événement de test

**Option A: Via interface admin**
1. Accéder à `/admin`
2. Créer un événement
3. Ajouter des types de billets:
   - VIP Carré Or: 25,000 FCFA
   - Standard: 10,000 FCFA

**Option B: Via Firebase Console**
```javascript
// Collection: events
{
  slug: "test-concert-2026",
  name: "Concert Test 2026",
  venue: "Grand Théâtre",
  start_date: "2026-04-01T20:00:00Z",
  capacity: 500,
  is_active: true
}

// Collection: ticket_types (lié à l'event_id)
{
  event_id: "evt_xxx",
  name: "VIP_CARRE_OR",
  price: 25000,
  quantity_total: 100,
  quantity_sold: 0,
  is_active: true
}
```

### Étape 2: Accéder à la page événement
```
URL: http://localhost:5173/evenement/test-concert-2026
```

**Vérifier:**
- ✅ L'événement s'affiche
- ✅ Les types de billets sont visibles avec prix
- ✅ Bouton "AJOUTER" fonctionne

### Étape 3: Ajouter des billets au panier
1. Cliquer sur "+ AJOUTER" pour VIP Carré Or
2. Augmenter à 2 billets
3. **Vérifier:** Total = 50,000 FCFA

### Étape 4: Ouvrir le formulaire de paiement
1. Cliquer sur "PROCÉDER AU PAIEMENT"
2. **Vérifier:** Modal de checkout s'ouvre

### Étape 5: Remplir le formulaire
```
Nom complet: Amadou Diallo
Téléphone: 771234567
Contact: WhatsApp (sélectionné)
Méthode: Orange Money (sélectionné)
```

### Étape 6: Confirmer l'achat
1. Cliquer sur "CONFIRMER L'ACHAT"
2. **Attendre 2-3 secondes**
3. **Vérifier redirection:** `/success?booking=BK-xxx`

### Étape 7: Vérifier dans Firebase Console

**Collection: bookings**
```javascript
// Devrait contenir 1 nouveau document
{
  booking_number: "BK-...",
  total_amount: 50000,
  customer_phone: "771234567",
  status: "confirmed",  // ✅ Important
  payment_method: "orange_money"
}
```

**Collection: tickets**
```javascript
// Devrait contenir 2 nouveaux documents
Document 1:
{
  ticket_number: "TK-...",
  qr_code: "QR-...",
  category: "VIP_CARRE_OR",  // ✅ Important
  status: "valid",           // ✅ Important
  used: false,               // ✅ Important
  price_paid: 25000
}

Document 2:
{
  ticket_number: "TK-...",
  qr_code: "QR-...",
  category: "VIP_CARRE_OR",  // ✅ Important
  status: "valid",           // ✅ Important
  used: false,               // ✅ Important
  price_paid: 25000
}
```

**Collection: payments**
```javascript
// Devrait contenir 1 nouveau document
{
  payment_reference: "PAY-...",
  amount: 50000,
  phone_number: "00221771234567",
  status: "completed",       // ✅ Important
  payment_method: "orange_money"
}
```

### Étape 8: Vérifier la page de succès
**Sur `/success?booking=BK-xxx`**

- ✅ Affiche "Paiement Confirmé" avec icône verte
- ✅ Affiche le numéro de booking
- ✅ Liste les 2 billets avec QR codes
- ✅ Boutons Email/WhatsApp disponibles
- ✅ Bouton "Télécharger les billets"

## 🎯 TEST 2: VÉRIFICATION ANTI-DOUBLON

### Étape 1: Essayer d'acheter à nouveau
1. Retourner sur `/evenement/test-concert-2026`
2. Ajouter des billets au panier
3. Remplir avec **LE MÊME NUMÉRO** (771234567)
4. Cliquer sur "CONFIRMER L'ACHAT"

**Résultat attendu:**
```
❌ Alert: "Ce numéro de téléphone a déjà effectué un achat pour cet événement.

Limite : 1 transaction par numéro pour éviter les abus."
```

### Étape 2: Acheter avec un autre numéro
1. Utiliser un nouveau numéro: 779876543
2. Compléter l'achat
3. **Vérifier:** Nouvelle réservation créée avec succès

## 🎯 TEST 3: LIMITE DE QUANTITÉ

### Étape 1: Essayer d'ajouter 4+ billets
1. Ajouter 1 billet VIP
2. Cliquer 3x sur le bouton "+"
3. **Au 4e clic:**

**Résultat attendu:**
```
❌ Alert: "Maximum 3 billets par catégorie"
```

## 🎯 TEST 4: VALIDATION FORMULAIRE

### Test 4A: Téléphone manquant
```
Nom: Amadou
Téléphone: [VIDE]
```
**Résultat:** Alert "Veuillez saisir votre numéro de téléphone"

### Test 4B: Email manquant (si contact = email)
```
Contact: Email
Email: [VIDE]
```
**Résultat:** Alert "Veuillez saisir votre adresse email"

### Test 4C: Panier vide
1. Ne pas ajouter de billets
2. Cliquer "PROCÉDER AU PAIEMENT"

**Résultat:** Bouton désactivé (grisé)

## 🎯 TEST 5: STRUCTURE DES BILLETS CRÉÉS

### Vérification manuelle dans Firebase Console

**Ouvrir:** Firestore → tickets → [dernier document créé]

**Vérifier les champs obligatoires:**

```javascript
✅ ticket_number: "TK-xxxxx" (format correct)
✅ qr_code: "QR-xxxxx" (unique)
✅ booking_id: "xxxxx" (référence valide)
✅ event_id: "xxxxx" (référence valide)
✅ ticket_type_id: "xxxxx" (référence valide)
✅ category: "VIP_CARRE_OR" (ou autre nom de ticket_type)
✅ holder_name: "Amadou Diallo"
✅ holder_email: "amadou@example.com" (si fourni)
✅ price_paid: 25000 (nombre)
✅ status: "valid" (PAS "pending")
✅ used: false (boolean)
✅ created_at: Timestamp
✅ updated_at: Timestamp
```

## 🎯 TEST 6: SCAN DES BILLETS (EPscanV)

### Étape 1: Récupérer un QR code
1. Sur `/success?booking=BK-xxx`
2. Copier l'URL du QR code ou scanner directement

### Étape 2: Scanner avec EPscanV
1. Ouvrir EPscanV (pour événements)
2. Scanner le QR code

**Résultat attendu:**
```
✅ BILLET VALIDE
Catégorie: VIP_CARRE_OR
Nom: Amadou Diallo
Prix: 25,000 FCFA
```

### Étape 3: Vérifier le marquage "used"
**Dans Firebase Console:**
```javascript
// Le ticket scanné devrait avoir:
{
  used: true,        // ✅ Changé de false → true
  scanned_at: Timestamp,
  scanned_by: "controleur_id"
}
```

### Étape 4: Essayer de re-scanner
1. Scanner le même QR code à nouveau

**Résultat attendu:**
```
❌ BILLET DÉJÀ UTILISÉ
Scanné le: [date/heure]
```

## 🎯 TEST 7: COMPARAISON AVEC /test-ticket

### Créer via /test-ticket
1. Accéder à `/test-ticket`
2. Créer un billet manuel avec les mêmes paramètres

### Créer via /evenement
1. Acheter un billet via le tunnel normal

### Comparer dans Firebase Console

**Les deux doivent avoir la même structure:**
```javascript
// Billet de /test-ticket
{
  category: "VIP_CARRE_OR",
  status: "valid",
  used: false,
  qr_code: "QR-xxx",
  // ...
}

// Billet de /evenement (tunnel)
{
  category: "VIP_CARRE_OR",    // ✅ Identique
  status: "valid",             // ✅ Identique
  used: false,                 // ✅ Identique
  qr_code: "QR-yyy",           // ✅ Format identique
  // ...
}
```

**Les deux doivent scanner de la même façon avec EPscanV**

## 🐛 RÉSOLUTION DE PROBLÈMES

### Problème: Billets créés avec status "pending"

**Cause:** Code pas à jour
**Solution:**
```bash
git pull
npm run build
```

### Problème: Champ "category" manquant

**Cause:** ticket_type.name vide dans Firebase
**Solution:** Vérifier que tous les ticket_types ont un champ `name` défini

### Problème: Champ "used" manquant

**Cause:** Ancienne version du code
**Solution:** Vérifier `EventDetailPage.tsx` ligne 237

### Problème: Alert "Ce numéro a déjà acheté"

**Cause:** Normal, c'est l'anti-doublon
**Solution:** Utiliser un autre numéro de téléphone

### Problème: Redirection vers /error

**Causes possibles:**
1. Règles Firestore trop restrictives
2. Variables d'environnement manquantes (pour Wave)
3. Erreur réseau

**Diagnostics:**
```javascript
// Ouvrir la console navigateur (F12)
// Chercher les erreurs Firebase
// Format: "FirebaseError: Missing or insufficient permissions"
```

**Solutions:**
```javascript
// Firestore Rules - Autoriser l'écriture sur tickets
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tickets/{ticketId} {
      allow create: if true;  // Pour les tests
      allow read: if true;
      allow update: if true;
    }
    match /bookings/{bookingId} {
      allow create: if true;
      allow read: if true;
      allow update: if true;
    }
    match /payments/{paymentId} {
      allow create: if true;
      allow read: if true;
    }
  }
}
```

## ✅ CHECKLIST FINALE

Après tous les tests, vérifier:

- [ ] ✅ Billets créés avec `status: 'valid'`
- [ ] ✅ Billets créés avec `category` définie
- [ ] ✅ Billets créés avec `used: false`
- [ ] ✅ QR codes uniques générés
- [ ] ✅ Anti-doublon fonctionne
- [ ] ✅ Limite de 3 billets fonctionne
- [ ] ✅ Page de succès affiche les billets
- [ ] ✅ Scan EPscanV valide les billets
- [ ] ✅ Marquage `used: true` après scan
- [ ] ✅ Structure identique à /test-ticket

## 📊 RAPPORT DE TEST

```
┌─────────────────────────────────────────────────────┐
│ TEST D'ACHAT DE BILLETS - RAPPORT                  │
├─────────────────────────────────────────────────────┤
│ Date: _______________                               │
│ Testeur: _______________                            │
│                                                     │
│ ✅ TEST 1: Achat Orange Money        [ PASS/FAIL ] │
│ ✅ TEST 2: Anti-doublon              [ PASS/FAIL ] │
│ ✅ TEST 3: Limite quantité           [ PASS/FAIL ] │
│ ✅ TEST 4: Validation formulaire     [ PASS/FAIL ] │
│ ✅ TEST 5: Structure billets         [ PASS/FAIL ] │
│ ✅ TEST 6: Scan EPscanV              [ PASS/FAIL ] │
│ ✅ TEST 7: Comparaison /test-ticket  [ PASS/FAIL ] │
│                                                     │
│ Problèmes rencontrés:                              │
│ ___________________________________________________ │
│ ___________________________________________________ │
│ ___________________________________________________ │
│                                                     │
│ Notes:                                             │
│ ___________________________________________________ │
│ ___________________________________________________ │
│ ___________________________________________________ │
└─────────────────────────────────────────────────────┘
```

---

**Version:** 1.0.0
**Date:** 2026-03-12
**Temps estimé:** 30-45 minutes pour tous les tests
