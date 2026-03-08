# SAMA PASS - Résumé Exécutif

## 🎯 Système Complet et Opérationnel

Les SAMA PASS sont des titres de transport numériques pour les abonnements DEM-DEM Express.

---

## 📍 Tunnel d'Achat

**URL**: `/demdem/express` (aussi accessible via `/voyage/express`)

### Flux Utilisateur

```
1. Sélectionner une ligne de transport
   └─> Ex: Keur Massar ⇄ UCAD

2. Choisir la formule
   ├─> ECO: Trajets standards (2/jour max)
   └─> PRESTIGE: Trajets premium (2/jour max)

3. Choisir la durée
   ├─> Hebdomadaire (7 jours)
   ├─> Mensuel (30 jours)
   └─> Trimestriel (90 jours)

4. Informations passager
   ├─> Prénom + Nom
   ├─> Téléphone (+221 XX XXX XXXX)
   └─> Photo

5. Validation
   └─> SAMA PASS créé et affiché
```

---

## 🎫 Qu'est-ce qu'un SAMA PASS ?

C'est une **carte de transport numérique** qui contient :

- Photo du passager
- Nom complet
- Numéro de téléphone
- Ligne de transport autorisée
- Formule (ECO ou PRESTIGE)
- Type d'abonnement (hebdo/mensuel/trimestriel)
- Date d'expiration
- QR code unique

---

## 🔐 Sécurité GËNAA WÓOR

5 contrôles automatiques à chaque scan :

### 1. Statut Actif
Le pass doit être actif (pas expiré, pas suspendu)

### 2. Date de Validité
Le pass ne doit pas avoir dépassé sa date d'expiration

### 3. Ligne Correcte
Le pass est valide uniquement sur la ligne indiquée
- Ex: Un pass "Keur Massar ⇄ UCAD" ne fonctionne pas sur "Pikine ⇄ Plateau"

### 4. Quota Journalier
Maximum 2 trajets par jour
- Le compteur se réinitialise à minuit

### 5. Anti-Passback
Minimum 30 minutes entre deux scans
- Empêche le partage du pass entre passagers

---

## 📱 Utilisation par le Passager

### Obtenir le Pass

1. Acheter sur `/demdem/express`
2. Remplir le formulaire
3. Recevoir le QR code
4. Enregistrer l'image dans la galerie

### Voyager

1. Monter dans le bus
2. Présenter le QR code au conducteur
3. Le conducteur scanne avec EPscanT
4. Validation instantanée : ✅ ou ❌

---

## 🚍 Utilisation par le Conducteur

### Scanner EPscanT

**URL**: `/epscant-login.html`

1. Se connecter avec le PIN du véhicule
2. L'écran scanner s'ouvre
3. Scanner le QR code du passager
4. La carte SAMA PASS s'affiche :
   - ✅ PASS VALIDE → Accepter
   - ❌ PASS INVALIDE → Refuser

### Informations Affichées

- Photo et nom du passager
- Ligne autorisée
- Formule (ECO/PRESTIGE)
- Nombre de trajets aujourd'hui (X/2)
- Date d'expiration
- Statut de validation

---

## 🧪 Générer des Passes de Test

### Méthode 1: Interface Graphique (Rapide)

```
1. Aller sur: /demdem/express?dev=true
2. Scroll en bas de la page
3. Section "Outils de développement"
4. Cliquer "Générer Pass de Test"
5. Le QR code s'affiche immédiatement
```

**Avantages**:
- Instantané (1 clic)
- Données réalistes (noms sénégalais)
- Toujours valide
- Lignes aléatoires

### Méthode 2: Tunnel d'Achat Complet

```
1. Aller sur: /demdem/express
2. Suivre le flux normal d'achat
3. Remplir avec des données de test
4. Le pass est créé normalement
```

**Avantages**:
- Teste le flux complet
- Photo personnalisée possible
- Choix de la ligne précis

---

## 🗂️ Stockage Firebase

### Chemin Unique
```
demdem/sama_passes/{subscriptionId}
```

**IMPORTANT**: Tous les passes sont dans `demdem/sama_passes`
- ❌ PAS dans `abonnements_express`
- ❌ PAS dans `subscriptions`
- ✅ UNIQUEMENT dans `demdem/sama_passes`

### Format des Données

**Champs en camelCase** (pas snake_case):
- `passengerPhone` ✅ (pas `subscriber_phone` ❌)
- `passengerName` ✅ (pas `full_name` ❌)
- `routeId` ✅ (pas `route_id` ❌)

**Dates en timestamps** (pas en strings):
- `startDate: 1709812345678` ✅ (pas `"2026-03-08..."` ❌)
- `expiresAt: 1712404345678` ✅ (pas `"2026-04-07..."` ❌)

---

## 📊 Lignes de Transport

Lignes disponibles dans le système :

| ID Technique | Nom Affiché |
|--------------|-------------|
| `keur-massar-ucad` | Keur Massar ⇄ UCAD |
| `keur-massar-petersen` | Keur Massar ⇄ Petersen |
| `keur-massar-centre` | Keur Massar ⇄ Dakar Centre |
| `pikine-plateau` | Pikine ⇄ Plateau |
| `guediawaye-centre` | Guédiawaye ⇄ Centre-ville |

Chaque ligne est configurée dans `demdem/transport_lines`

---

## ✅ Test Rapide (1 minute)

### Créer un Pass
```
1. /demdem/express?dev=true
2. Cliquer "Générer Pass de Test"
3. Noter le QR code
```

### Scanner le Pass
```
1. /epscant-login.html
2. PIN: 1234 (véhicule de test)
3. Scanner le QR code
4. Voir la carte ✅ PASS VALIDE
```

---

## 🚨 Erreurs Possibles

### Pass Invalide
**Cause**: Mauvais format ou mauvais chemin Firebase
**Solution**: Vérifier `demdem/sama_passes` et format QR

### Pass Expiré
**Cause**: Date d'expiration dépassée
**Solution**: Générer un nouveau pass

### Erreur Ligne
**Cause**: Pass pour une autre ligne
**Solution**: Utiliser le bon véhicule ou créer un pass pour la bonne ligne

### Limite Atteinte
**Cause**: 2 trajets déjà faits aujourd'hui
**Solution**: Attendre minuit ou reset le compteur

### Scan Trop Rapproché
**Cause**: Moins de 30 minutes depuis le dernier scan
**Solution**: Attendre 30 minutes

---

## 📞 Support

### Vérifications de Base

1. **Firebase Console**
   - Path: `demdem/sama_passes`
   - Champs en camelCase
   - Dates en number

2. **Logs Console** (F12)
   - Chercher `[EPscanT]`
   - Lire les messages d'erreur

3. **Rebuild**
   ```bash
   npm run build
   bash sync-html.sh
   ```

### Commandes Utiles

**Nettoyer les passes de test**:
```typescript
import { deleteAllTestPasses } from './lib/testPassGenerator';
await deleteAllTestPasses();
```

**Reset quota journalier** (console du scanner):
```javascript
const today = new Date().toISOString().split('T')[0];
Object.keys(localStorage)
  .filter(k => k.startsWith(`daily_scans_${today}`))
  .forEach(k => localStorage.removeItem(k));
```

---

## 📚 Documentation Complète

- **Guide Pro**: `GUIDE_SAMA_PASS_TEST_PRO_2026-03-08.md`
- **Checklist**: `SAMA_PASS_VALIDATION_CHECKLIST.md`
- **Fix Complet**: `FIX_SAMA_PASS_UI_COMPLETE_2026-03-07.md`

---

**Version**: 1.0
**Date**: 2026-03-08
**Statut**: Production Ready ✅
