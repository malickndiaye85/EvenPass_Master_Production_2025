# CORRECTIF - transport_stats/lines manquant

## Problème identifié

La fonction `incrementLineStats` écrivait dans **10 chemins différents**, mais **JAMAIS** dans `transport_stats/lines/{lineId}/stats` - le seul chemin autorisé par les nouvelles règles Firebase.

## Symptôme

```
Permission denied sur transport_stats/lines/-OnPJ2qAV9PuBThRDncw/stats
```

## Cause racine

**Incohérence Code ↔ Règles Firebase**

### Règles Firebase (database.rules.json) :
```json
"transport_stats": {
  "lines": {
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

### Code EPscanT (AVANT) :
La fonction écrivait dans :
1. ✅ `ops/transport/lines/{lineId}/stats`
2. ✅ `ops/transport/vehicles/{vehicleId}/stats`
3. ✅ `fleet_vehicles/{vehicleId}`
4. ✅ `scan_history`
5. ✅ `transport_stats/global`
6. ✅ `ops/transport/vehicles/{vehicleId}/scan_events`
7. ✅ `stats/daily/{date}`
8. ✅ `voyage/express/{lineId}/stats/realtime`
9. ✅ `ops/transport/live_feed`
10. ❌ **MANQUANT** : `transport_stats/lines/{lineId}/stats`

## Correction appliquée

Ajout d'une **11ème étape** dans `incrementLineStats` :

### Fichier modifié
`public/epscant-line-sectorization.js`

### Code ajouté (ligne 745+)
```javascript
// 11. METTRE À JOUR TRANSPORT_STATS/LINES/{LINEID}/STATS - CRITIQUE POUR RÈGLES FIREBASE
console.log('[SECTORISATION] 📊 Étape 11/11 : transport_stats/lines (RÈGLES FIREBASE)');
const transportStatsPath = `transport_stats/lines/${lineId}/stats`;
console.log('[SECTORISATION] 🔍 CHEMIN COMPLET:', transportStatsPath);
alert('🔍 CHEMIN: ' + transportStatsPath);

const transportStatsLineRef = dbRef(rtdb, transportStatsPath);
const transportStatsLineSnap = await rtdbGet(transportStatsLineRef);

const currentTransportStats = transportStatsLineSnap.exists() ? transportStatsLineSnap.val() : {};
const eco_count = (currentTransportStats.eco_count || 0) + 1;
const comfort_count = currentTransportStats.comfort_count || 0;
const premium_count = currentTransportStats.premium_count || 0;
const total_scans_line = eco_count + comfort_count + premium_count;

await update(transportStatsLineRef, {
    eco_count: eco_count,
    comfort_count: comfort_count,
    premium_count: premium_count,
    total_scans: total_scans_line,
    last_scan: timestamp,
    last_scan_date: today
}).catch(err => {
    console.error('[SECTORISATION] 💥 ÉCHEC update transport_stats/lines:', err);
    alert('💥 ERREUR CRITIQUE transport_stats/lines: ' + err.message);
    throw err;
});

console.log('[SECTORISATION] ✅ transport_stats/lines mis à jour avec succès !');
alert('✅ TEST RÉUSSI !');
```

## Chemins d'écriture Firebase (APRÈS)

La fonction écrit maintenant dans **11 chemins** :

1. `ops/transport/lines/{lineId}/stats`
2. `ops/transport/vehicles/{vehicleId}/stats`
3. `fleet_vehicles/{vehicleId}`
4. `scan_history`
5. `transport_stats/global`
6. `ops/transport/vehicles/{vehicleId}/scan_events`
7. `stats/daily/{date}`
8. `voyage/express/{lineId}/stats/realtime`
9. `ops/transport/live_feed`
10. `ops/transport/vehicles/{vehicleId}/scan_events`
11. ✅ **NOUVEAU** : `transport_stats/lines/{lineId}/stats`

## Validation

### Avant correctif
```
Alert 1: "🚨 APPEL incrementLineStats MAINTENANT !"
Alert 2: "❌ ERREUR CRITIQUE incrementLineStats: Permission denied"
```

### Après correctif (attendu)
```
Alert 1: "🚨 APPEL incrementLineStats MAINTENANT !"
Alert 2: "🔍 CHEMIN: transport_stats/lines/-OnPJ2qAV9PuBThRDncw/stats"
Alert 3: "✅ TEST RÉUSSI !"
```

## Test sur mobile

1. Ouvrir : https://demdem-express.web.app/epscant-transport.html
2. Se connecter avec code **587555**
3. Cliquer sur **"🧪 SIMULER SCAN SUCCÈS"**
4. Observer les alerts en séquence

Si alert "✅ TEST RÉUSSI !" apparaît → Problème résolu.

## Déploiement

- ✅ Code corrigé : `public/epscant-line-sectorization.js`
- ✅ Build réussi : `npm run build`
- ⏳ Push GitHub : En attente
- ⏳ Déploiement automatique : ~2 minutes après push
