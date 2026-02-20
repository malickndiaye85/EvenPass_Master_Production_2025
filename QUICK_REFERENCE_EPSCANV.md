# ⚡ EPscanV — Référence Rapide

## 🔗 URLs Essentielles

```
Login Contrôleur    → /controller/login
Scanner EPscanV     → /controller-epscanv
Générateur QR Test  → /test/qr-generator
Command Center      → /admin/ops/transport
```

## 📱 Interface Scanner

```
┌─────────────────────────────┐
│ 🚌 Ligne | Contrôleur  📶  │  ← Bandeau info
├─────────────────────────────┤
│     [Caméra QR 250x250]     │  ← Zone scan
├─────────────────────────────┤
│  ✅ 48   ❌ 12   📊 60     │  ← Compteurs géants
└─────────────────────────────┘
```

## 🎯 Règles de Validation

| Validation | Vérification |
|-----------|--------------|
| ✅ **Expiration** | `expiresAt > now()` |
| ✅ **Ligne** | `pass.line === vehicle.line` |
| ✅ **Grade** | VIP (tous), Confort, Eco |
| ✅ **Passback** | Cooldown 2h |
| ✅ **Signature** | Hash JWT local |

## 🔒 Firebase Structure

```json
controllers/{uid}
  ├─ name: "Moussa Diop"
  ├─ line: "KM - Dakar ⇄ Pikine"
  └─ vehicleId: "vehicle_abc"

trips/{tripId}
  ├─ controller_id
  ├─ passenger_id
  ├─ result: "validated" | "rejected"
  ├─ timestamp
  └─ location: { lat, lng }

controller_stats/{uid}/{date}
  ├─ validated: 145
  ├─ rejected: 12
  └─ total: 157

live/positions/{vehicleId}
  ├─ latitude: 14.6937
  ├─ longitude: -17.4441
  ├─ speed: 45
  └─ timestamp
```

## 🧪 Test Rapide (5 min)

1. **Générer QR** → `/test/qr-generator`
2. **Config Firebase** :
   ```json
   controllers/{uid}: {
     name: "Test",
     line: "KM - Dakar ⇄ Pikine",
     vehicleId: "vehicle_001"
   }
   ```
3. **Login** → `/controller/login`
4. **Scanner** → Activer caméra
5. **Scan QR** → ✅ Validé

## 📴 Mode Offline

| État | Indicateur | Action |
|------|-----------|--------|
| **Online** | 📶 ON | Sync immédiate |
| **Offline** | 📴 OFF | Stockage IndexedDB |
| **Retour online** | 🔄 | Auto-sync |

## 🔋 Économie d'Énergie

- 🔆 **Wake Lock** → Écran toujours allumé
- 🌙 **2 min inactivité** → Luminosité réduite
- 📍 **GPS** → Toutes les 15s
- 🔋 **Autonomie** → 8h+

## 🚨 Dépannage Express

| Problème | Solution |
|----------|----------|
| 📷 Caméra bloquée | HTTPS requis + Permissions |
| 🔄 Sync échoue | Vérifier role "controller" |
| 📍 GPS absent | Activer géolocalisation |
| ❌ Validation échoue | Vérifier ligne/grade |

## 🎨 Feedback Visuel

| Résultat | Couleur | Son | Action |
|----------|---------|-----|--------|
| ✅ Validé | Vert | 800Hz sine | Compteur +1 |
| ❌ Refusé | Rouge | 200Hz sawtooth | Compteur +1 |

## 📊 Monitoring Ops

Le Command Center reçoit en temps réel :
- 📍 Position GPS (toutes les 15s)
- 📊 Stats scans (validé/refusé)
- 🚌 Véhicule actif
- 👤 Contrôleur assigné

## 🔑 Permissions Requises

```
✅ Caméra (environnement arrière)
✅ Géolocalisation (GPS)
✅ Stockage (IndexedDB)
✅ Wake Lock (écran)
✅ Audio (feedback sonore)
```

## ⚙️ Config Production

**Remplacer clé publique dans** `src/lib/passValidator.ts` :

```typescript
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
[CLÉ RSA PRODUCTION]
-----END PUBLIC KEY-----`;
```

## 📈 Métriques Cibles

| Métrique | Objectif |
|----------|----------|
| Temps scan | < 500ms |
| Validation offline | < 100ms |
| Sync Firebase | < 2s |
| Autonomie | 8h+ |

---

**Version:** 1.0.0 | **Date:** 20/02/2026 | **Statut:** ✅ Production Ready
