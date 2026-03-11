# 🚨 FIX CRITIQUE: Déployer les Règles transport_stats

## ❌ Problème identifié

Le Debug Overlay a révélé l'erreur exacte :

```
ERREUR CRITIQUE incrementLineStats:
Cannot read properties of undefined (reading '_checkNotDeleted')
```

**Cause** : Les règles Firebase Realtime Database bloquent l'écriture dans `transport_stats/lines/{lineId}/stats`

## ✅ Solution appliquée

Ajout des règles manquantes dans `database.rules.json` :

```json
"transport_stats": {
  "global": {
    ".read": true,
    ".write": true
  },
  "lines": {
    ".read": true,
    "$lineId": {
      ".write": true,
      "stats": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

## 🚀 DÉPLOIEMENT REQUIS

### Option 1: Console Firebase (RECOMMANDÉ)

1. Ouvre : https://console.firebase.google.com/project/demdem-express/database/demdem-express-default-rtdb/rules

2. **Remplace** tout le contenu par le fichier `database.rules.json` du projet

3. **Publie** les règles

### Option 2: Firebase CLI (si installé localement)

```bash
firebase deploy --only database
```

## 🧪 Test après déploiement

1. Retourne sur : https://demdem-express.web.app/epscant-transport.html
2. Connecte-toi avec **587555**
3. Clique sur **"🧪 SIMULER SCAN SUCCÈS"**

### Résultat attendu :

✅ **TEST RÉUSSI !**
✅ **Vérifiez Firebase Console pour voir les stats mises à jour.**

Pas d'erreur "Permission denied" ou "_checkNotDeleted".

## 📊 Chemins Firebase concernés

Les chemins suivants doivent maintenant fonctionner :

```
transport_stats/global/total_scans
transport_stats/global/eco_count
transport_stats/global/comfort_count
transport_stats/global/premium_count
transport_stats/lines/{lineId}/stats/total_scans
transport_stats/lines/{lineId}/stats/eco_count
transport_stats/lines/{lineId}/stats/comfort_count
transport_stats/lines/{lineId}/stats/premium_count
```

## 📝 Notes techniques

Le Debug Overlay ajouté affiche maintenant :
- **Bus ID** : Identifiant du véhicule
- **Line ID** : Identifiant de la ligne
- **Status** : État en temps réel
- **Logs** : 5 derniers événements avec timestamps
- **Bouton Test** : Simulation de scan complète

Cela permettra de diagnostiquer tous les problèmes futurs directement sur mobile.
