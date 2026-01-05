# Guide de Résolution - Billets Manquants

## 🎯 Problème

L'organisateur a créé des billets lors de la création de l'événement, mais ils n'apparaissent pas sur la page publique "ACHETER VOS BILLETS".

---

## 🔍 Étape 1: Diagnostic

### Ouvrir la Console du Navigateur

1. Aller sur la page de l'événement (ex: `/event/le-choc-des-titans-franc-vs-tapha-tine`)
2. Appuyer sur **F12** (Windows/Linux) ou **Option + Cmd + I** (Mac)
3. Cliquer sur l'onglet **Console**

### Lire les Logs de Debug

Vous verrez des logs détaillés comme ceci:

```
=== CHARGEMENT ÉVÉNEMENT ===
Slug recherché: le-choc-des-titans-franc-vs-tapha-tine
✅ Événement trouvé: Le Choc des Titans : Franc vs Tapha Tine
📋 Event ID: abc123xyz
📋 Status: published
🎫 Recherche des billets pour event_id: abc123xyz
📊 Nombre de billets trouvés: 0
❌ AUCUN BILLET TROUVÉ!
```

**👉 Si "Nombre de billets trouvés: 0"** → Les billets n'existent pas dans Firebase

**👉 Si "Status: draft"** → L'événement n'est pas publié

---

## ✅ Solution 1: Vérifier le Status de l'Événement

### Problème Possible

L'événement est en mode "draft" au lieu de "published".

### Comment Vérifier

Regarder dans les logs:
```
📋 Status: draft  ← PROBLÈME!
```

### Solution

1. **Via Dashboard Organisateur:**
   - Se connecter au Dashboard Organisateur
   - Aller dans "Mes Événements"
   - Trouver l'événement
   - Cliquer sur "Publier" ou changer le status en "published"

2. **Via Firebase Console:**
   - Aller sur [Firebase Console](https://console.firebase.google.com/)
   - Sélectionner le projet `evenpass-prod`
   - Firestore Database → Collection `events`
   - Trouver le document de l'événement
   - Modifier le champ `status` → mettre `"published"`
   - Enregistrer

---

## ✅ Solution 2: Vérifier l'Existence des Billets dans Firebase

### Diagnostic

Dans la Console navigateur:
```
📊 Nombre de billets trouvés: 0
❌ AUCUN BILLET TROUVÉ!
```

**Cela signifie:** Les billets n'ont pas été créés dans Firebase.

### Vérification Manuelle

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Projet `evenpass-prod` → Firestore Database
3. Chercher la collection `ticket_types`
4. Filtrer par `event_id` = l'ID de votre événement (visible dans les logs)

**Si la collection est vide ou ne contient aucun document avec cet event_id:**

→ Les billets n'ont jamais été créés lors de la création de l'événement.

---

## ✅ Solution 3: Créer les Billets Manuellement

### Option A: Via Dashboard Organisateur (Recommandé)

**⚠️ ATTENTION:** Actuellement, le Dashboard Organisateur ne permet pas de créer des billets pour un événement déjà existant.

**Solution temporaire:** Créer un **nouvel événement** avec les billets depuis le Dashboard.

### Option B: Via Firebase Console (Avancé)

1. Aller dans Firebase Console
2. Firestore Database → Collection `ticket_types`
3. Cliquer sur **"Ajouter un document"**
4. **Laisser l'ID auto-généré**
5. Remplir les champs:

**Exemple pour "Le Choc des Titans":**

#### Billet 1: VIP
```json
{
  "event_id": "ABC123XYZ",
  "name": "Tribune VIP",
  "price": 50000,
  "quantity_total": 200,
  "quantity_sold": 0,
  "is_active": true,
  "created_at": [Timestamp - cliquer sur l'horloge]
}
```

#### Billet 2: Standard
```json
{
  "event_id": "ABC123XYZ",
  "name": "Tribune Standard",
  "price": 25000,
  "quantity_total": 500,
  "quantity_sold": 0,
  "is_active": true,
  "created_at": [Timestamp - cliquer sur l'horloge]
}
```

**🚨 IMPORTANT:** Remplacer `"ABC123XYZ"` par l'**ID réel** de l'événement.

**Comment trouver l'Event ID:**
- Regarder dans les logs de la Console navigateur:
  ```
  📋 Event ID: voici_le_vrai_id
  ```

---

## 📋 Structure Exacte des Données

### Type de Données Firebase

| Champ | Type | Exemple |
|-------|------|---------|
| `event_id` | string | `"Abc123Xyz"` |
| `name` | string | `"Tribune VIP"` |
| `price` | number | `50000` |
| `quantity_total` | number | `200` |
| `quantity_sold` | number | `0` |
| `is_active` | boolean | `true` |
| `created_at` | timestamp | (utiliser l'icône horloge) |

**⚠️ Erreurs courantes:**
- ❌ `price: "50000"` (string) → ✅ `price: 50000` (number)
- ❌ `is_active: "true"` (string) → ✅ `is_active: true` (boolean)
- ❌ `event_id` qui ne correspond pas à l'ID de l'événement

---

## 🔄 Après Correction

1. **Actualiser la page** de l'événement (Ctrl+R ou Cmd+R)
2. Ouvrir la Console (F12)
3. Vérifier les nouveaux logs:
   ```
   📊 Nombre de billets trouvés: 2  ← ✅ CORRIGÉ!
   Billet 1: { name: "Tribune VIP", price: 50000, ... }
   Billet 2: { name: "Tribune Standard", price: 25000, ... }
   ```
4. Les billets doivent maintenant s'afficher sur la page

---

## 🐛 Pourquoi les Billets n'Ont Pas Été Créés?

### Causes Possibles

1. **Erreur silencieuse lors de la création**
   - Vérifier les logs de la console lors de la création d'événement
   - Chercher des messages d'erreur Firebase

2. **Permissions Firestore insuffisantes**
   - Les règles Firestore sont correctes (ligne 218-225 de `firestore.rules`)
   - Ce n'est probablement pas la cause

3. **Problème de réseau**
   - L'événement a été créé mais pas les billets
   - Perte de connexion pendant la création

4. **Bug dans le code**
   - Le code de création a été vérifié et est correct
   - Les logs ont été ajoutés pour identifier le problème

---

## 🔍 Vérification Avancée

### Tester la Création d'un Nouvel Événement

1. Se connecter au Dashboard Organisateur
2. Créer un **NOUVEAU** événement de test
3. Ajouter 2 types de billets (ex: Standard + VIP)
4. Enregistrer
5. **Ouvrir la Console (F12)** immédiatement
6. Chercher les logs:
   ```
   [CREATE EVENT] Creating 2 ticket types...
   [CREATE EVENT] Creating ticket 1: {...}
   [CREATE EVENT] Ticket created with ID: xyz123
   [CREATE EVENT] Creating ticket 2: {...}
   [CREATE EVENT] Ticket created with ID: abc456
   [CREATE EVENT] ✅ 2 billets créés pour l'événement EventID
   ```

**Si ces logs n'apparaissent pas** → Il y a un problème avec Firebase ou les permissions.

---

## 📞 Support Avancé

### Si le Problème Persiste

**Fournir les informations suivantes:**

1. **Copie complète des logs** de la Console (F12)
2. **Screenshot** de Firebase Console:
   - Collection `events` → Document de l'événement
   - Collection `ticket_types` → Tous les documents
3. **Slug de l'événement** (ex: `le-choc-des-titans-franc-vs-tapha-tine`)
4. **Date/heure** de création de l'événement

### Vérification Firebase Permissions

Exécuter ce script dans la Console navigateur:

```javascript
// Test de lecture des ticket_types
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from './src/firebase';

try {
  const snapshot = await getDocs(collection(firestore, 'ticket_types'));
  console.log('✅ Lecture autorisée, documents trouvés:', snapshot.size);
} catch (error) {
  console.error('❌ Erreur de permission:', error);
}
```

---

## ✅ Checklist Complète

- [ ] Console ouverte (F12)
- [ ] Logs de chargement visibles
- [ ] Event ID récupéré depuis les logs
- [ ] Status = "published"
- [ ] Firebase Console accessible
- [ ] Collection `ticket_types` vérifiée
- [ ] Documents avec `event_id` correct créés
- [ ] Champs avec les bons types (number, boolean, string)
- [ ] Page actualisée après modifications
- [ ] Billets visibles sur la page publique

---

## 🎉 Résultat Attendu

Après correction, sur la page de l'événement:

```
╔════════════════════════════════════╗
║   🛒 ACHETER VOS BILLETS          ║
╠════════════════════════════════════╣
║  Tribune VIP                       ║
║  Accès privilégié avec vue dégagée ║
║                         50,000 F   ║
║  [Ajouter au panier]              ║
║  200 places restantes • Max 3      ║
╠════════════════════════════════════╣
║  Tribune Standard                  ║
║  Accès standard                    ║
║                         25,000 F   ║
║  [Ajouter au panier]              ║
║  500 places restantes • Max 3      ║
╚════════════════════════════════════╝
```

---

## 📧 Contact

**Support Technique:**
- Email: contact@evenpass.sn
- WhatsApp: +221 77 139 29 26

**Documentation:**
- Guide utilisateur: `GUIDE_UTILISATEUR.md`
- Guide organisateur: `GUIDE_COMPLET_ORGANISATEURS.md`

---

**Date de mise à jour:** 2026-01-05
**Version:** 2.0
**Statut:** ✅ Logs de debug ajoutés + Guide complet
