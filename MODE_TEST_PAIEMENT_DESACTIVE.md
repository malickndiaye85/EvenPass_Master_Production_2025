# MODE TEST - Paiement Désactivé pour DEM-DEM Express
**Date**: 2026-03-07
**Objectif**: Permettre les tests du tunnel d'achat sans passer par l'étape de paiement

---

## Modifications Effectuées

### 1. Interface Utilisateur - Bouton "Procéder au paiement"

**Fichier**: `src/components/DemDemPurchaseTunnel.tsx`

**Changements** :
- ✅ Bouton passé en **vert** au lieu d'orange
- ✅ Texte changé en **"🧪 MODE TEST - Générer le Pass"**
- ✅ Ajout d'un message **"⚡ Paiement temporairement désactivé pour les tests"**

**Avant** :
```tsx
<button className="...from-amber-400 to-amber-500...">
  Procéder au paiement
</button>
```

**Après** :
```tsx
<button className="...from-green-500 to-green-600...">
  🧪 MODE TEST - Générer le Pass
</button>
<p className="text-center text-amber-400 text-sm font-medium">
  ⚡ Paiement temporairement désactivé pour les tests
</p>
```

### 2. Logique de Création d'Abonnement

**Fichier**: `src/pages/transport/DemDemExpressPage.tsx`

**Améliorations** :
- ✅ Logs détaillés à chaque étape
- ✅ Gestion d'erreurs Firebase améliorée (continue même en cas d'erreur)
- ✅ Mode "continuer quand même" si une erreur survient
- ✅ Création systématique du QR Code valide

**Flux de création** :
```
1. 🎯 Début création abonnement MODE TEST
2. 📱 QR Code généré: SAMAPASS-{phone}-{id}
3. 💾 Sauvegarde dans Firebase abonnements_express/
   ├─ ✅ Succès → Log confirmation
   └─ ⚠️ Erreur → Log mais continue
4. 🚀 Redirection vers /transport/subscription-success
```

---

## Comment Tester

### Étape 1 : Accéder à la page
```
URL: /voyage/express
```

### Étape 2 : Sélectionner un abonnement
1. Choisir une ligne (ex: Keur Massar ⇄ UCAD)
2. Choisir une formule (ECO ou PRESTIGE)
3. Choisir une durée (Hebdomadaire, Mensuel, Trimestriel)

### Étape 3 : Remplir les informations
1. Prénom
2. Nom
3. Numéro de téléphone (+221 77 XXX XX XX)
4. Photo de profil (via upload ou caméra)

### Étape 4 : Confirmer
- Cliquer sur **"Continuer"**
- Vérifier le récapitulatif
- Cliquer sur **"🧪 MODE TEST - Générer le Pass"**

### Étape 5 : Vérifier le résultat
- ✅ Redirection automatique vers `/subscription-success`
- ✅ QR Code affiché
- ✅ Informations de l'abonnement visibles
- ✅ QR Code scannable avec EPscanT

---

## Vérification Firebase

### Console Firebase
1. Ouvrir Firebase Console
2. Aller dans **Realtime Database**
3. Vérifier la structure :

```
abonnements_express/
  sub_1709826543210_x8k2p9w4q/
    id: "sub_1709826543210_x8k2p9w4q"
    subscriber_phone: "221771234567"
    full_name: "Malick NDIAYE"
    subscription_type: "monthly"
    subscription_tier: "eco"
    route_id: "ligne_1"
    route_name: "Keur Massar ⇄ UCAD"
    start_date: "2026-03-07T10:00:00.000Z"
    end_date: "2026-04-07T10:00:00.000Z"
    status: "active"
    qr_code: "SAMAPASS-221771234567-sub_1709826543210_x8k2p9w4q"
    created_at: "2026-03-07T10:00:00.000Z"
    photo_url: "data:image/jpeg;base64,..."
    amount_paid: 19000
```

---

## Tests du QR Code avec EPscanT

### 1. Générer un Pass
- Suivre le tunnel d'achat complet
- Récupérer le QR Code affiché

### 2. Scanner avec EPscanT
```
URL: /epscant-transport.html
```

1. Se connecter avec un véhicule
2. Scanner le QR Code
3. **Résultat attendu** : ✅ Écran vert "PASS VALIDE"

### 3. Vérifications
- [ ] Le nom du passager s'affiche
- [ ] Le type d'abonnement est correct (weekly/monthly/quarterly)
- [ ] La formule est correcte (eco/prestige)
- [ ] La ligne est correcte
- [ ] L'écran est vert avec "PASS VALIDE"

---

## Gestion des Erreurs

### Si une erreur survient pendant la création

**Comportement** :
1. ⚠️ Erreur loguée dans la console
2. 💬 Dialog affiché : "MODE TEST - Erreur détectée"
3. 🔄 Option : **"Continuer quand même ?"**
   - ✅ Oui → Création de données minimales et redirection
   - ❌ Non → Retour au formulaire

**Logs Console** :
```
[DEMDEM-EXPRESS] 🎯 Début création abonnement MODE TEST
[DEMDEM-EXPRESS] 📱 QR Code généré: SAMAPASS-221771234567-sub_xxx
[DEMDEM-EXPRESS] 💾 Sauvegarde dans Firebase...
[DEMDEM-EXPRESS] ✅ Abonnement sauvegardé dans Firebase
[DEMDEM-EXPRESS] 🚀 Redirection vers la page de succès...
```

---

## Rétablir le Paiement (Plus Tard)

Quand les tests seront validés, pour rétablir le paiement obligatoire :

### 1. Restaurer le bouton original

**Fichier**: `src/components/DemDemPurchaseTunnel.tsx`

```tsx
// Remplacer par :
<button
  onClick={handleConfirm}
  className="w-full bg-gradient-to-r from-amber-400 to-amber-500 text-blue-950 py-4 rounded-2xl font-bold text-lg hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg shadow-amber-400/50"
>
  Procéder au paiement
</button>
// Supprimer le message de test
```

### 2. Ajouter l'intégration de paiement

**Fichier**: `src/pages/transport/DemDemExpressPage.tsx`

```tsx
const handlePurchaseConfirm = async (userData: UserIdentity) => {
  // Ajouter ici l'intégration Wave/Orange Money/etc.
  const paymentResult = await initiatePayment(price, userData.phone);

  if (paymentResult.success) {
    // Continuer avec la création de l'abonnement
  } else {
    // Afficher erreur de paiement
  }
};
```

### 3. Vérifier le statut de paiement

Ajouter un champ `payment_verified: boolean` dans Firebase et ne créer l'abonnement qu'après confirmation du paiement.

---

## Points Importants

### ✅ Ce qui fonctionne maintenant
- Tunnel d'achat complet sans paiement
- Génération du QR Code au bon format
- Sauvegarde dans Firebase
- Scan avec EPscanT validé

### ⚠️ À faire plus tard
- Intégration Wave/Orange Money
- Vérification du paiement côté serveur
- Webhook de confirmation de paiement
- Gestion des échecs de paiement
- Remboursements

### 🧪 Mode Test actif
- Le bouton indique clairement qu'on est en mode test
- Les utilisateurs savent que le paiement est désactivé
- Tous les abonnements créés sont marqués "active" directement

---

## Commandes Utiles

### Build
```bash
npm run build
```

### Dev
```bash
npm run dev
# Puis aller sur http://localhost:5173/voyage/express
```

### Vérifier Firebase
Ouvrir la console : https://console.firebase.google.com/

---

## Résumé

✅ **Le paiement est maintenant contourné pour les tests**
✅ **Le QR Code généré est valide et scannable**
✅ **Les données sont sauvegardées dans Firebase**
✅ **EPscanT valide correctement les abonnements**

🧪 **MODE TEST ACTIVÉ** - Vous pouvez maintenant tester le tunnel complet !
