# Diagnostic - Bouton "ACHETER VOS BILLETS" ne répond pas

## 🔍 Problème Identifié

Le bouton "ACHETER VOS BILLETS" apparaît mais aucun billet n'est affiché en dessous.

**Cause**: Les `ticket_types` ne sont pas trouvés dans Firebase pour cet événement.

---

## ✅ Corrections Appliquées

### 1. Ajout de Logs de Debug

**Fichier**: `src/pages/EventDetailPage.tsx` (lignes 78-80)

```javascript
console.log('Event loaded:', eventData.title);
console.log('Ticket types found:', eventData.ticket_types.length);
console.log('Ticket types:', eventData.ticket_types);
```

**Action**: Ouvrir la Console du navigateur (F12) pour voir ces logs

### 2. Message d'Erreur Visible

**Avant**: Aucun message si les ticket_types ne sont pas trouvés

**Après**: Message informatif
```
Aucun billet disponible pour le moment
Les billets seront bientôt en vente
```

### 3. Gestion des Valeurs par Défaut

**Ajout**:
```javascript
quantity_sold: doc.data().quantity_sold || 0,
is_active: doc.data().is_active !== false
```

### 4. Filtrage des Tickets Inactifs

**Avant**: Affiche tous les tickets

**Après**: Filtre les tickets avec `is_active === false`
```javascript
event.ticket_types.filter(t => t.is_active !== false).map(...)
```

---

## 🔧 Comment Diagnostiquer

### Étape 1: Ouvrir la Console du Navigateur

1. Aller sur la page de l'événement
2. Appuyer sur **F12** (Chrome/Firefox) ou **Option + Cmd + I** (Mac)
3. Aller dans l'onglet **Console**
4. Chercher les logs:
   ```
   Event loaded: Le Choc des Titans : Franc vs Tapha Tine
   Ticket types found: 0
   Ticket types: []
   ```

### Étape 2: Vérifier Firebase

#### Option A: Via Dashboard Organisateur
1. Se connecter au Dashboard Organisateur
2. Aller dans "Mes Événements"
3. Cliquer sur l'événement concerné
4. Vérifier la section "Types de Billets"

**Si aucun billet n'apparaît**: Il faut les créer

#### Option B: Via Firebase Console
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet `evenpass-prod`
3. Aller dans **Firestore Database**
4. Chercher la collection `ticket_types`
5. Vérifier si des documents existent pour cet événement

**Structure attendue**:
```javascript
{
  event_id: "abc123xyz", // ID de l'événement dans la collection 'events'
  name: "VIP",
  description: "Accès privilégié",
  price: 50000,
  quantity_total: 100,
  quantity_sold: 0,
  is_active: true
}
```

### Étape 3: Vérifier l'ID de l'Événement

**IMPORTANT**: L'`event_id` dans `ticket_types` doit correspondre exactement à l'`id` du document dans la collection `events`.

#### Comment vérifier:
1. Ouvrir la Console (F12)
2. Dans l'onglet Console, taper:
   ```javascript
   // Copier l'ID affiché
   ```
3. Aller dans Firebase Console → `ticket_types`
4. Vérifier que l'`event_id` correspond

---

## 🚀 Solutions

### Solution 1: Créer les Billets via Dashboard

1. Se connecter comme organisateur
2. Aller dans "Mes Événements"
3. Cliquer sur l'événement
4. Créer les types de billets:
   - **Nom**: VIP, Standard, etc.
   - **Prix**: en FCFA
   - **Quantité**: nombre de places
   - **Description**: optionnelle

### Solution 2: Créer les Billets Manuellement dans Firebase

Si le Dashboard ne fonctionne pas:

1. Aller dans Firebase Console
2. Firestore Database → `ticket_types`
3. Cliquer sur "Ajouter un document"
4. Remplir les champs:

**Exemple pour "Le Choc des Titans"**:

```json
{
  "event_id": "AbCdEfGh123",
  "name": "Tribune VIP",
  "description": "Accès privilégié avec vue dégagée",
  "price": 50000,
  "quantity_total": 200,
  "quantity_sold": 0,
  "is_active": true,
  "created_at": [Timestamp now]
}
```

```json
{
  "event_id": "AbCdEfGh123",
  "name": "Tribune Standard",
  "description": "Accès standard",
  "price": 25000,
  "quantity_total": 500,
  "quantity_sold": 0,
  "is_active": true,
  "created_at": [Timestamp now]
}
```

**IMPORTANT**: Remplacer `"AbCdEfGh123"` par l'ID réel de l'événement dans Firebase.

### Solution 3: Utiliser la Console du Navigateur

Pour trouver l'ID de l'événement:

1. Ouvrir la page de l'événement
2. F12 → Console
3. Taper:
   ```javascript
   // L'ID sera affiché dans les logs "Event loaded"
   ```

---

## ✅ Validation

Après avoir créé les `ticket_types`:

1. **Actualiser la page** de l'événement (Ctrl + R ou Cmd + R)
2. Ouvrir la Console (F12)
3. Vérifier les logs:
   ```
   Ticket types found: 2  ← Doit être > 0
   ```
4. Les billets doivent maintenant s'afficher sous "ACHETER VOS BILLETS"

---

## 📊 Structure de Données Complète

### Collection `events`
```javascript
{
  id: "auto-generated-by-firebase",
  title: "Le Choc des Titans : Franc vs Tapha Tine",
  slug: "le-choc-des-titans-franc-vs-tapha-tine",
  venue_name: "Arène Nationale",
  city: "Dakar",
  start_date: Timestamp,
  status: "published",
  is_free: false,
  // ...
}
```

### Collection `ticket_types`
```javascript
{
  id: "auto-generated-by-firebase",
  event_id: "ID_DE_L_EVENEMENT_CI_DESSUS", // ← DOIT CORRESPONDRE
  name: "VIP",
  price: 50000,
  quantity_total: 100,
  quantity_sold: 0,
  is_active: true
}
```

**Relation**: `ticket_types.event_id` = `events.id`

---

## 🎯 Checklist de Vérification

- [ ] Console ouverte (F12)
- [ ] Logs "Ticket types found" visible
- [ ] Nombre de tickets > 0
- [ ] Firebase: Collection `ticket_types` existe
- [ ] Firebase: Documents avec `event_id` correct
- [ ] `is_active: true` sur au moins un ticket
- [ ] `quantity_sold < quantity_total`
- [ ] Page actualisée après modifications

---

## 🆘 Si le Problème Persiste

### Vérifications Avancées

1. **Erreur de connexion Firebase**:
   - Vérifier que `.env` contient les bonnes variables
   - Vérifier que Firebase est accessible (pas de firewall)

2. **Erreur de permissions**:
   - Vérifier les règles Firestore
   - Collection `ticket_types` doit être lisible par tous

3. **Données corrompues**:
   - Vérifier que `price` est un nombre (pas une string)
   - Vérifier que `quantity_total` et `quantity_sold` sont des nombres
   - Vérifier que `event_id` est une string (pas un object)

### Script de Test Firebase

Ouvrir la Console (F12) et taper:

```javascript
// Charger Firebase
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from './src/firebase';

// Récupérer les tickets
const eventId = "VOTRE_EVENT_ID_ICI";
const ticketTypesRef = collection(firestore, 'ticket_types');
const q = query(ticketTypesRef, where('event_id', '==', eventId));
const snapshot = await getDocs(q);

console.log('Tickets trouvés:', snapshot.docs.length);
snapshot.docs.forEach(doc => {
  console.log(doc.id, doc.data());
});
```

---

## 📞 Support

Si le problème persiste après ces vérifications:

1. **Envoyer les logs de la Console** (copier/coller)
2. **Envoyer un screenshot** de Firebase Console (collection `ticket_types`)
3. **Indiquer le slug** de l'événement (ex: `le-choc-des-titans-franc-vs-tapha-tine`)

Contact: contact@evenpass.sn / +221 77 139 29 26

---

**Date**: 2026-01-05
**Version**: 1.0
**Statut**: ✅ Corrections appliquées
