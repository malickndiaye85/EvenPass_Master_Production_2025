# Instructions de Déploiement Firebase - Système PASS

## 🚨 IMPORTANT : Déploiement des Règles de Sécurité

Les corrections apportées incluent de nouvelles règles de sécurité Firebase qui doivent être déployées pour que le système fonctionne correctement.

---

## 📋 Étape 1 : Vérifier les Fichiers de Règles

### Fichiers Modifiés

1. **firestore.rules** - Règles Firestore
   - ✅ Ajout règles `modification_requests`
   - ✅ Ajout règles `payout_requests`
   - ✅ Ajout règles `bulk_sales`

2. **database.rules.json** - Règles Realtime Database
   - ✅ Ajout règles `/evenpass/global_config/home_ads`
   - ✅ Ajout règles `/evenpass/controllers`
   - ✅ Ajout règles `/evenpass/sessions`
   - ✅ Ajout règles `/evenpass/scans`
   - ✅ Ajout règles `/evenpass/tickets`
   - ✅ Ajout règles `/evenpass/events`

---

## 🚀 Étape 2 : Déployer les Règles

### Option A : Déploiement Complet (Recommandé)

```bash
# Déployer toutes les règles Firebase
firebase deploy --only database,firestore:rules
```

### Option B : Déploiement Séparé

```bash
# Déployer uniquement les règles Realtime Database
firebase deploy --only database

# Déployer uniquement les règles Firestore
firebase deploy --only firestore:rules
```

---

## ✅ Étape 3 : Vérifier le Déploiement

### Via Firebase Console

1. **Firestore Rules**
   - Aller sur [Firebase Console](https://console.firebase.google.com)
   - Sélectionner votre projet
   - Aller dans **Firestore Database** → **Rules**
   - Vérifier que les règles pour `modification_requests`, `payout_requests` et `bulk_sales` sont présentes

2. **Realtime Database Rules**
   - Aller dans **Realtime Database** → **Rules**
   - Vérifier que le chemin `/evenpass` existe avec toutes les sous-branches

### Via Firebase CLI

```bash
# Afficher les règles Firestore actuelles
firebase firestore:rules get

# Afficher les règles Realtime Database actuelles
firebase database:get /.settings/rules
```

---

## 🔧 Étape 4 : Créer les Collections Manquantes

### Collections Firestore à Créer

Les collections suivantes seront créées automatiquement lors de la première utilisation, mais vous pouvez les créer manuellement dans Firebase Console :

1. **maritime_users** - Profils des utilisateurs maritimes
   ```json
   {
     "id": "user-uid",
     "email": "commandant@example.com",
     "name": "Jean Dupont",
     "role": "commandant",
     "vessel_id": "ferry-1",
     "vessel_name": "Ferry Dakar 1",
     "photo_url": "",
     "status": "active",
     "created_at": "2026-01-06T00:00:00Z"
   }
   ```

2. **pass_tickets** - Billets de transport
   ```json
   {
     "id": "ticket-id",
     "ticket_number": "PASS20260106001",
     "vessel_id": "ferry-1",
     "vessel_name": "Ferry Dakar 1",
     "route": "Dakar - Ziguinchor",
     "departure_date": "2026-01-10",
     "departure_time": "09:00",
     "passenger_name": "Marie Diop",
     "passenger_phone": "+221771234567",
     "passenger_cni": "1234567890123",
     "category": "Pullman",
     "price": 15000,
     "status": "confirmed",
     "has_cargo": false,
     "payment_method": "wave",
     "qr_code": "PASS20260106001",
     "created_at": "2026-01-06T00:00:00Z"
   }
   ```

3. **cargo** - Fret et véhicules
   ```json
   {
     "id": "cargo-id",
     "cargo_type": "vehicle",
     "vessel_id": "ferry-1",
     "ticket_id": "ticket-id",
     "passenger_name": "Marie Diop",
     "vehicle_type": "Voiture",
     "vehicle_registration": "DK-1234-AB",
     "weight_kg": 1500,
     "status": "registered",
     "created_at": "2026-01-06T00:00:00Z"
   }
   ```

4. **manifests** - Manifestes générés
   ```json
   {
     "id": "manifest-id",
     "vessel_id": "ferry-1",
     "vessel_name": "Ferry Dakar 1",
     "route": "Dakar - Ziguinchor",
     "departure_date": "2026-01-10",
     "departure_time": "09:00",
     "total_passengers": 250,
     "total_cargo_weight": 50000,
     "total_vehicles": 30,
     "status": "ready",
     "generated_by": "commandant-uid",
     "generated_at": "2026-01-06T00:00:00Z"
   }
   ```

### Structure Realtime Database

Créer dans la Realtime Database :

```json
{
  "evenpass": {
    "global_config": {
      "home_ads": {
        "evenBackgroundUrl": "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
        "passBackgroundUrl": "https://images.pexels.com/photos/3408356/pexels-photo-3408356.jpeg",
        "lastUpdated": 1704499200000,
        "updatedBy": "system"
      }
    },
    "controllers": {},
    "sessions": {},
    "scans": {},
    "tickets": {},
    "events": {}
  }
}
```

---

## 🧪 Étape 5 : Tester les Corrections

### Test 1 : Demandes de Modification/Report (Organisateur)

1. Se connecter comme organisateur : `https://evenpass.sn/organizer/login`
2. Aller dans le dashboard
3. Cliquer sur "Nouvelle demande"
4. Sélectionner un événement
5. Remplir la description
6. Cliquer sur "Envoyer la demande"
7. ✅ Devrait afficher "Demande envoyée avec succès!"

**Erreur attendue AVANT correction** : "Erreur lors de l'envoi de la demande"
**Résultat attendu APRÈS correction** : Demande enregistrée dans Firestore

---

### Test 2 : Photos Publicitaires (Admin Finance)

1. Se connecter comme Admin Finance : `https://evenpass.sn/admin/finance/login`
   - UID Admin : `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
2. Aller dans la section "Publicités Home"
3. Upload une image pour EVEN ou PASS
4. ✅ Devrait uploader et sauvegarder dans Firebase

**Erreur attendue AVANT correction** : "Permission denied"
**Résultat attendu APRÈS correction** : Image uploadée et URL sauvegardée

---

### Test 3 : Logo Wallet

1. Aller sur : `https://evenpass.sn/pass/wallet`
2. ✅ Le logo affiché devrait être le logo dynamique (bleu pour PASS)

**Résultat attendu** : Logo bleu EvenPass au lieu de l'ancien logo

---

### Test 4 : Boutons Admin dans Footer PASS

1. Aller sur : `https://evenpass.sn/pass/services`
2. Scroller jusqu'au footer
3. ✅ Les 3 petits boutons ronds (Admin Finance, Ops Manager, EPscan) doivent être visibles

**Résultat attendu** : Boutons présents dans le footer de PassServicesPage

---

## 🐛 Dépannage

### Problème : "Permission denied" lors de l'envoi de demandes

**Solution** :
```bash
# Redéployer les règles Firestore
firebase deploy --only firestore:rules

# Vérifier dans Firebase Console que les règles sont bien actives
```

### Problème : "Missing or insufficient permissions" pour les publicités

**Solution** :
```bash
# Redéployer les règles Realtime Database
firebase deploy --only database

# Vérifier que le chemin /evenpass/global_config/home_ads existe
```

### Problème : Les collections maritimes n'existent pas

**Solution** :
Les collections seront créées automatiquement lors de la première utilisation. Vous pouvez aussi les créer manuellement dans Firebase Console.

---

## 📊 Vérification Finale

### Checklist de Déploiement

- [ ] Règles Firestore déployées
- [ ] Règles Realtime Database déployées
- [ ] Structure `/evenpass` créée dans Realtime Database
- [ ] Admin Finance peut modifier les publicités
- [ ] Organisateurs peuvent envoyer des demandes
- [ ] Logo dynamique affiché dans Wallet
- [ ] Boutons admin présents dans footer PASS
- [ ] Projet compile sans erreur (`npm run build`)

---

## 🔒 Sécurité

### Admin Finance UID

L'UID de l'Admin Finance est hardcodé dans les règles :
```
Tnq8Isi0fATmidMwEuVrw1SAJkI3
```

**Important** : Seul ce compte a accès total aux données sensibles (finances, logs, configuration globale).

### Isolation des Données Maritimes

Les règles sont configurées pour que :
- Chaque commandant ne voie que les données de son navire
- Chaque personnel d'accueil ne gère que son navire
- Seul l'Admin Finance a une vue globale des 6 navires

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifier les logs dans Firebase Console
2. Vérifier les logs dans la console du navigateur (F12)
3. Vérifier que les règles sont bien déployées
4. Vérifier que l'utilisateur a les bons droits

---

**Dernière mise à jour** : 2026-01-06
**Version des règles** : 2.0.0-maritime
