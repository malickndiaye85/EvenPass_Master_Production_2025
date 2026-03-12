# 🚀 INSTRUCTIONS DÉPLOIEMENT MANUEL GITHUB

**Date:** 2026-03-12
**Objectif:** Mettre à jour GitHub directement pour activer MODE DÉMO

---

## 📝 FICHIERS À ÉDITER SUR GITHUB

### 1️⃣ EventDetailPage.tsx

**Chemin GitHub:** `src/pages/EventDetailPage.tsx`

**Ligne 26 - VÉRIFIER que cette ligne existe:**
```typescript
const DEMO_MODE = true;
```

**Ligne 251-275 - VÉRIFIER que ce bloc existe:**
```typescript
if (DEMO_MODE) {
  console.log('🎬 MODE DÉMO ACTIVÉ - Bypass paiement');

  await addDoc(collection(firestore, 'payments'), {
    booking_id: bookingRef.id,
    payment_reference: `DEMO-${Date.now()}`,
    payment_method: 'demo',
    amount: totalAmount,
    currency: 'XOF',
    phone_number: checkoutForm.customer_phone,
    status: 'completed',
    paid_at: Timestamp.now(),
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  });

  await updateDoc(doc(firestore, 'bookings', bookingRef.id), {
    status: 'confirmed',
    updated_at: Timestamp.now(),
  });

  console.log('✅ Billets générés - Redirection vers Success Page');
  navigate(`/success?booking=${bookingNumber}`);
  return;
}
```

---

### 2️⃣ SuccessPage.tsx

**Chemin GitHub:** `src/pages/SuccessPage.tsx`

**Ligne 7 - VÉRIFIER l'import QRCode:**
```typescript
import QRCode from 'react-qr-code';
```

**Lignes 196-244 - VÉRIFIER le bloc d'affichage des billets:**
```typescript
<div className="mb-8">
  <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
    <Ticket className="w-7 h-7 text-[#FF5F05]" />
    Vos Billets
  </h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {booking.tickets.map((ticket: any, index: number) => (
      <div key={ticket.id} className="bg-gradient-to-br from-[#0F0F0F] to-[#1A1A1A] rounded-3xl p-6 border-2 border-[#FF5F05]/30 hover:border-[#FF5F05] transition-all hover:shadow-lg hover:shadow-[#FF5F05]/20">
        <div className="bg-white p-4 rounded-2xl mb-4">
          <QRCode
            value={ticket.qr_code}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            viewBox={`0 0 200 200`}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
            <span className="text-sm text-[#B5B5B5]">Billet #{index + 1}</span>
            <span className="px-3 py-1 bg-green-500/20 rounded-lg text-xs font-bold text-green-400 border border-green-500/30">
              VALIDE
            </span>
          </div>

          <div>
            <p className="text-xs text-[#B5B5B5] mb-1">Titulaire</p>
            <p className="text-base font-bold text-white">{ticket.holder_name}</p>
          </div>

          <div>
            <p className="text-xs text-[#B5B5B5] mb-1">Catégorie</p>
            <p className="text-base font-bold text-[#FF5F05]">{ticket.category}</p>
          </div>

          <div>
            <p className="text-xs text-[#B5B5B5] mb-1">Prix</p>
            <p className="text-lg font-black text-green-400">{ticket.price_paid.toLocaleString()} FCFA</p>
          </div>

          <div className="pt-3 border-t border-[#2A2A2A]">
            <p className="text-xs text-[#B5B5B5] mb-1">N° Billet</p>
            <p className="text-xs font-mono text-white/70">{ticket.ticket_number}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 🔧 PROCÉDURE MODIFICATION GITHUB

### Méthode 1: Interface Web GitHub

1. **Aller sur GitHub**
   - URL: `https://github.com/[votre-username]/[votre-repo]`

2. **Naviguer vers EventDetailPage.tsx**
   - Cliquer: `src` → `pages` → `EventDetailPage.tsx`
   - Cliquer sur le crayon ✏️ en haut à droite

3. **Vérifier ligne 26**
   - Chercher (Ctrl+F): `const DEMO_MODE`
   - Doit être: `const DEMO_MODE = true;`
   - Si absent, l'ajouter après la ligne 25

4. **Vérifier lignes 251-275**
   - Chercher: `if (DEMO_MODE)`
   - Le bloc complet doit être présent
   - Si absent, copier-coller depuis ce document

5. **Commit**
   - Message: `feat: Active MODE DÉMO pour présentation commerciale`
   - Cliquer "Commit changes"

6. **Répéter pour SuccessPage.tsx**
   - Naviguer: `src` → `pages` → `SuccessPage.tsx`
   - Vérifier ligne 7: import QRCode
   - Vérifier lignes 196-244: bloc billets
   - Commit: `feat: Ajout affichage QR Codes sur Success Page`

---

### Méthode 2: Git CLI (si vous avez accès terminal)

```bash
# Cloner le repo
git clone https://github.com/[votre-username]/[votre-repo].git
cd [votre-repo]

# Créer une branche
git checkout -b feat/mode-demo

# Éditer les fichiers avec nano/vim/vscode
nano src/pages/EventDetailPage.tsx
nano src/pages/SuccessPage.tsx

# Commit
git add src/pages/EventDetailPage.tsx src/pages/SuccessPage.tsx
git commit -m "feat: Active MODE DÉMO + QR Codes Success Page"

# Push
git push origin feat/mode-demo

# Créer Pull Request sur GitHub
# Puis merger dans main
```

---

## ✅ VÉRIFICATION POST-DÉPLOIEMENT

### 1. GitHub Actions

Après le commit, vérifier:
- Aller dans l'onglet "Actions" sur GitHub
- Le workflow doit se lancer automatiquement
- Attendre que le cercle devienne VERT ✅

### 2. Test sur le site déployé

**URL de test:** `https://[votre-domaine]/evenement/[slug-test]`

**Parcours de test:**
1. Ajouter 2 billets VIP au panier
2. Remplir téléphone: 771234567
3. Cliquer "Acheter maintenant"
4. Cliquer "Confirmer et Payer"
5. ⚡ **Doit rediriger immédiatement** vers `/success`
6. **Vérifier:** 2 QR Codes affichés avec toutes les infos

**Console navigateur (F12):**
```
🎬 MODE DÉMO ACTIVÉ - Bypass paiement
✅ Billets générés - Redirection vers Success Page
```

---

## 🎬 CHECKLIST PRÉSENTATION

**Avant la démo:**
- [ ] GitHub Actions vert ✅
- [ ] Site déployé et accessible
- [ ] Événement test créé dans Firebase
- [ ] Billets configurés (VIP 50000, GOLD 100000)
- [ ] Test complet du parcours réussi

**Pendant la démo:**
- [ ] Navigateur en plein écran
- [ ] Fermer onglets inutiles
- [ ] Préparer téléphone fictif: +221 77 123 45 67
- [ ] Avoir Firebase Console ouverte (onglet séparé)

**Script de démo:**
1. "Voici notre tunnel d'achat événements"
2. "Le client choisit ses billets VIP"
3. "Remplit son numéro de téléphone"
4. "Clique sur Payer et..."
5. ⚡ **BOOM - Instantané!**
6. "Les billets sont là avec QR Codes scannables"
7. (Optionnel) Scanner avec EPscanV pour montrer validation

---

## 🔥 TROUBLESHOOTING

### Problème: GitHub Actions échoue

**Solution:**
1. Vérifier les erreurs dans l'onglet Actions
2. Souvent c'est une erreur de syntaxe TypeScript
3. Vérifier les imports en haut des fichiers
4. Re-commit avec la correction

### Problème: MODE DÉMO ne s'active pas

**Vérification:**
1. Ouvrir Console navigateur (F12)
2. Chercher: `🎬 MODE DÉMO ACTIVÉ`
3. Si absent, vérifier que `DEMO_MODE = true` ligne 26
4. Forcer refresh: Ctrl+Shift+R

### Problème: QR Codes ne s'affichent pas

**Vérification:**
1. Console navigateur → Erreurs?
2. Vérifier import: `import QRCode from 'react-qr-code';`
3. Vérifier package.json contient: `"react-qr-code": "^2.0.18"`
4. Si manquant, ajouter et rebuild

### Problème: Déploiement prend trop de temps

**Solution rapide:**
1. Annuler le déploiement GitHub
2. Builder localement: `npm run build`
3. Uploader le dossier `dist/` via FTP/Netlify/Vercel
4. Pointer le domaine vers le nouveau build

---

## 📞 SUPPORT URGENCE

**Si tout échoue:**

1. **Utiliser la version locale:**
   ```bash
   npm install
   npm run build
   npm run preview
   ```
   Faire la démo sur localhost:4173

2. **Enregistrer une vidéo:**
   - Screen record du parcours complet
   - Montrer la vidéo pendant la présentation
   - Dire "voici le parcours en temps réel"

3. **Slides de backup:**
   - Captures d'écran de chaque étape
   - Montrer slide par slide
   - Expliquer oralement

---

## 🎯 RÉSUMÉ 30 SECONDES

```
1. Éditer EventDetailPage.tsx ligne 26: DEMO_MODE = true
2. Éditer SuccessPage.tsx ligne 7: import QRCode
3. Commit sur GitHub
4. Attendre GitHub Actions vert ✅
5. Tester sur le site déployé
6. Ready pour démo! 🎬
```

---

**Status:** 📝 INSTRUCTIONS PRÊTES
**Temps estimé:** 5-10 minutes
**Difficulté:** ⭐⭐ Facile

Bonne chance pour votre présentation! 🚀
