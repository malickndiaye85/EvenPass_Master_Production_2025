# GUIDE MIGRATION ACCESS CODES - EPscanT

**Date** : 2026-03-10
**Problème** : Code d'accès invalide EPscanT
**Cause** : Codes dans Realtime DB, EPscanT lit dans Firestore

---

## ⚡ SOLUTION RAPIDE (2 minutes)

### Option 1 : Page HTML Autonome (RECOMMANDÉ)

1. **Ouvrir dans le navigateur** :
   ```
   https://votre-domaine.com/migrate-access-codes.html
   ```

2. **Cliquer** : "Démarrer la Migration"

3. **Attendre** : Les logs s'affichent en temps réel

4. **Vérifier** : Statistiques de migration (succès/ignorés/échecs)

5. **Tester EPscanT** :
   ```
   https://votre-domaine.com/epscant-login.html
   Code: 811384
   ```

---

### Option 2 : Interface React Admin

1. **Se connecter** comme admin (ops_transport ou super_admin)

2. **Aller sur** :
   ```
   https://votre-domaine.com/admin/ops/transport/migrate-codes
   ```

3. **Cliquer** : "Démarrer la Migration"

4. **Attendre** la fin

5. **Tester EPscanT**

---

## 🔍 Que Fait la Migration ?

### Sources (Realtime DB)
```
fleet_indices/codes/{code}
    ├─ vehicleId
    ├─ vehiclePlate
    ├─ isActive
    └─ createdAt

fleet_vehicles/{vehicleId}
    ├─ access_code
    ├─ license_plate
    ├─ vehicle_number
    └─ status
```

### Destination (Firestore)
```
access_codes/{code}
    ├─ code              ← Clé du document
    ├─ type: "vehicle"
    ├─ vehicleId
    ├─ vehiclePlate
    ├─ isActive
    ├─ createdBy
    ├─ createdAt
    ├─ staffName
    └─ usageCount
```

---

## ✅ Vérification Après Migration

### 1. Console Firebase

**Firestore** :
```
1. Ouvrir: https://console.firebase.google.com/
2. Projet: evenpass-2026
3. Menu → Firestore Database
4. Collection: access_codes
5. Vérifier: Présence de documents (811384, etc.)
```

### 2. Console Navigateur

```javascript
// Ouvrir console (F12)
const firestore = window.firebaseFirestore.getFirestore();
const { doc, getDoc } = window.firebaseFirestore;

// Tester un code
const testRef = doc(firestore, 'access_codes', '811384');
const snap = await getDoc(testRef);

if (snap.exists()) {
  console.log('✅ Code trouvé:', snap.data());
} else {
  console.log('❌ Code non trouvé');
}
```

### 3. Test EPscanT Complet

```
1. Aller sur: /epscant-login.html
2. Code: 811384
3. Console → Vérifier logs:

✅ Attendu:
[SECTORISATION] ✅ Code valide
[SECTORISATION] 🚍 Véhicule: DK-1234-AB
[SECTORISATION] 📍 Ligne: Keur Massar Express
→ Redirection vers /epscant-transport.html

❌ Si erreur:
[SECTORISATION] ❌ Code d'accès invalide
→ La migration n'a pas été exécutée
```

---

## 🐛 Dépannage

### Erreur : "Missing or insufficient permissions"

**Cause** : Règles Firestore pas déployées

**Solution** :
```bash
1. Firebase Console
2. Firestore → Règles
3. Copier le contenu de firestore.rules
4. Publier

Règle critique (ligne 424-437):
match /access_codes/{codeId} {
  allow read: if true;  ← LECTURE PUBLIQUE
  allow create: if isAuthenticated();
  allow update: if isAdminFinance();
  allow delete: if isAdminFinance();
}
```

---

### Erreur : "Code d'accès invalide" après migration

**Cause 1** : Code pas migré

**Vérification** :
```javascript
// Console navigateur
const snap = await getDoc(doc(firestore, 'access_codes', '811384'));
console.log('Existe?', snap.exists());
```

**Solution** : Réexécuter la migration

---

**Cause 2** : Code désactivé

**Vérification** :
```javascript
const data = snap.data();
console.log('Actif?', data.isActive);
```

**Solution** : Activer le code dans Firestore
```javascript
await updateDoc(doc(firestore, 'access_codes', '811384'), {
  isActive: true
});
```

---

### Erreur : "Véhicule non trouvé"

**Cause** : Véhicule absent de Realtime DB

**Vérification** :
```javascript
const rtdb = window.firebaseDatabase.getDatabase();
const { ref, get } = window.firebaseDatabase;

const vehicleRef = ref(rtdb, 'ops/transport/vehicles/{vehicleId}');
const snap = await get(vehicleRef);
console.log('Véhicule existe?', snap.exists());
```

**Solution** : Le véhicule doit être créé dans `ops/transport/vehicles`

---

### Erreur : "Véhicule non assigné à une ligne"

**Cause** : Champ `line_id` manquant

**Vérification** :
```javascript
const vehicleData = snap.val();
console.log('Ligne?', vehicleData.line_id);
```

**Solution** : Assigner une ligne au véhicule
```javascript
await update(ref(rtdb, 'ops/transport/vehicles/{vehicleId}'), {
  line_id: 'line_keur_massar'
});
```

---

## 🎯 Nouveaux Véhicules (Après Migration)

### Auto-Synchronisation

Depuis `AdminOpsTransportPage.tsx` ligne 551-574, chaque nouveau véhicule :

1. ✅ Génère un code 6 chiffres
2. ✅ Écrit dans Realtime DB (`fleet_vehicles`)
3. ✅ Écrit dans Realtime DB (`fleet_indices/codes`)
4. ✅ **Écrit dans Firestore (`access_codes`)** ← NOUVEAU
5. ✅ Synchro transport/vehicles

**Plus besoin de migration manuelle pour les nouveaux véhicules !**

---

## 📊 Logs de Migration Expliqués

### Succès
```
✅ Code 811384 migré (véhicule: DK-1234-AB)
```
→ Code créé dans Firestore

### Ignoré
```
⏭️ Code 811384 déjà présent, ignoré
```
→ Code existe déjà dans Firestore (évite les doublons)

### Échec
```
❌ Erreur pour code 811384: permission-denied
```
→ Règles Firestore bloquent l'écriture

---

## ⚠️ Points Importants

1. **Idempotence** : On peut réexécuter la migration sans risque (détection doublons)

2. **Règles Firestore** : Lecture publique (`allow read: if true`) est sûre car :
   - Écriture strictement contrôlée (admin uniquement)
   - Codes pré-générés (impossible d'en créer arbitrairement)
   - Révocation instantanée via `isActive: false`

3. **Pas de perte de données** : La migration ne supprime rien de Realtime DB

4. **Performance** : Batch writes pour éviter les timeouts

---

## 🚀 Actions Requises

- [ ] Ouvrir `/migrate-access-codes.html`
- [ ] Cliquer "Démarrer la Migration"
- [ ] Vérifier statistiques (succès > 0)
- [ ] Tester EPscanT avec code 811384
- [ ] Vérifier accès scanner transport

---

## 📞 Support

Si problème persiste après migration :

1. Vérifier les règles Firestore (ligne 424-437)
2. Vérifier logs console navigateur (F12)
3. Vérifier Firebase Console → Firestore → access_codes
4. Vérifier que le véhicule a un `line_id` dans Realtime DB

---

**🎯 La migration synchronise Realtime DB et Firestore. EPscanT sera opérationnel immédiatement après.**
