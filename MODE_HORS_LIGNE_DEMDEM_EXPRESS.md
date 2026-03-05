# Mode Hors-Ligne Complet - DEM-DEM Express

## Vue d'ensemble

EPscanT dispose d'un **mode hors-ligne complet** permettant aux chauffeurs de valider les SAMA PASS même sans connexion internet. Les données sont synchronisées automatiquement dès que la connexion revient.

---

## Architecture

### Technologies utilisées

- **IndexedDB** : Base de données locale dans le navigateur
- **LocalStorage** : Métadonnées de synchronisation
- **Background Sync** : Synchronisation automatique des scans en attente

### Structure des données

#### Store 1: `subscriptions`
Stocke les abonnements actifs pour validation hors-ligne.

```javascript
{
  id: string,
  subscriber_phone: string,
  subscriber_name: string,
  full_name: string,
  qr_code: string,
  status: 'active',
  start_date: string,
  end_date: string,
  subscription_type: string,
  vehicle_id: string,
  cachedAt: number
}
```

**Index:**
- `qr_code` : Recherche par QR code
- `subscriber_phone` : Recherche par téléphone (fallback)

#### Store 2: `pending_scans`
File d'attente des scans en attente de synchronisation.

```javascript
{
  id: string,
  subscriptionId: string,
  vehicleId: string,
  timestamp: number,
  scanData: {
    subscriber_phone: string,
    subscriber_name: string,
    subscription_type: string,
    subscription_tier: string,
    route_name: string,
    scan_status: 'valid'
  },
  synced: boolean
}
```

**Index:**
- `synced` : Filtre les scans non synchronisés
- `timestamp` : Tri chronologique

---

## Cycle de vie

### 1. Login du chauffeur

```
Chauffeur entre son PIN
         ↓
EPscanT se connecte à Firebase
         ↓
Télécharge TOUS les abonnements actifs
         ↓
Stocke dans IndexedDB (subscriptions)
         ↓
✅ Prêt pour validation hors-ligne
```

**Code:**
```javascript
const syncCount = await syncSubscriptionsFromFirebase();
console.log(`✅ ${syncCount} abonnements synchronisés`);
```

### 2. Scan d'un PASS (Mode Online)

```
Passager scanne QR Code
         ↓
1. Recherche dans IndexedDB (cache local)
         ↓
   Trouvé ? → Validation instantanée
         ↓
2. Si pas trouvé, recherche Firebase (si online)
         ↓
   Trouvé ? → Validation
         ↓
3. Enregistrement du scan dans Firebase
         ↓
✅ PASS VALIDE
```

### 3. Scan d'un PASS (Mode Offline)

```
Passager scanne QR Code
         ↓
1. Recherche dans IndexedDB uniquement
         ↓
   Trouvé ? → Validation depuis cache
         ↓
2. Ajout du scan à pending_scans
         ↓
✅ PASS VALIDE (scan mis en queue)
         ↓
Quand connexion revient → Synchronisation auto
```

**Code:**
```javascript
if (!navigator.onLine) {
  await addPendingScan({
    subscriptionId: subscription.id,
    vehicleId: vehicleId,
    timestamp: Date.now(),
    data: scanData
  });
  console.log('📱 Scan mis en queue');
}
```

### 4. Retour de connexion

```
Connexion internet rétablie
         ↓
Event 'online' déclenché
         ↓
1. Re-synchronisation des abonnements actifs
         ↓
2. Envoi de tous les pending_scans vers Firebase
         ↓
3. Marquage des scans comme synced: true
         ↓
✅ Données synchronisées
```

**Code:**
```javascript
window.addEventListener('online', async () => {
  await syncSubscriptionsFromFirebase();
  await syncPendingScans();
  updateOfflineInfo();
});
```

### 5. Déconnexion du chauffeur

```
Chauffeur clique sur "Exit" → "Terminer"
         ↓
Vidage complet du cache
         ↓
- IndexedDB.clear(subscriptions)
- IndexedDB.clear(pending_scans)
- LocalStorage nettoyé
         ↓
✅ Données supprimées (sécurité)
```

**Code:**
```javascript
await clearOfflineData();
localStorage.removeItem('demdem_vehicle_session');
window.location.href = '/epscant-login.html';
```

---

## Fonctionnalités

### Validation Locale Prioritaire

Le scanner vérifie **toujours le cache local en premier** avant d'interroger Firebase:

1. **Cache Hit** → Validation instantanée (même online)
2. **Cache Miss + Online** → Recherche Firebase
3. **Cache Miss + Offline** → Erreur "PASS INVALIDE"

**Avantages:**
- Réduction de la latence (pas d'appel réseau)
- Économie de données mobiles
- Fiabilité accrue

### Recherche par QR Code ET Téléphone

Deux méthodes de validation:

1. **QR Code complet** : `SAMAPASS-221771234567-ABC123`
2. **Téléphone seul** : `221771234567` (fallback)

```javascript
// Méthode 1: Par QR Code
subscription = await getSubscriptionFromCache(qrCode);

// Méthode 2: Par téléphone (si échec)
const phone = extractPhoneFromQR(qrCode);
subscription = await getSubscriptionByPhoneFromCache(phone);
```

### Queue Intelligente

Les scans hors-ligne sont **automatiquement mis en queue** et synchronisés dès que possible:

- Stockage local sécurisé
- Ordre chronologique préservé
- Retry automatique en cas d'échec
- Nettoyage des scans synchronisés

### Indicateur Visuel

Interface utilisateur claire montrant:

- **Mode Online** : `🔄 Synchronisé il y a Xmin • 150 abonnements`
- **Mode Offline** : `📱 Mode Hors-Ligne • 150 abonnements en cache`
- **Statut Firebase** : Point vert (connecté) / rouge (déconnecté)

---

## Gestion de la Sécurité

### 1. Expiration du Cache

- **Durée de vie** : 24 heures
- **Vérification** : À chaque scan, vérification de `cachedAt`
- **Re-sync automatique** : Si cache expiré et online

### 2. Nettoyage à la déconnexion

Tout le cache est **immédiatement vidé** quand:
- Le chauffeur se déconnecte
- La session expire
- L'application est fermée (via Exit)

**Raison** : Éviter que des données personnelles persistent sur l'appareil.

### 3. Validation des dates

Même en mode hors-ligne, EPscanT vérifie:
- `status === 'active'`
- `end_date > now()` (pas expiré)
- `start_date <= now()` (déjà actif)

### 4. Protection contre les duplicatas

Les scans en queue ont des IDs uniques:
```javascript
id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
```

Empêche les doublons lors de la synchronisation.

---

## Scénarios d'utilisation

### Scénario 1: Trajet urbain avec connexion stable

```
Login → Sync 150 abonnements
Scan 1 → Cache local → ✅ Instant
Scan 2 → Cache local → ✅ Instant
Scan 3 → Cache local → ✅ Instant
Logout → Vidage cache
```

**Avantage** : Validation ultra-rapide même avec connexion.

### Scénario 2: Zone périurbaine avec coupures réseau

```
Login → Sync 150 abonnements
📶 Connexion OK
Scan 1 → Cache → ✅ Enregistré en ligne
📴 Connexion perdue
Scan 2 → Cache → ✅ Mis en queue
Scan 3 → Cache → ✅ Mis en queue
📶 Connexion rétablie
     → Auto-sync des 2 scans en attente
Logout → Vidage cache
```

**Avantage** : Continuité de service sans interruption.

### Scénario 3: Zone rurale sans réseau

```
Login (WiFi maison) → Sync 150 abonnements
📴 Hors-ligne toute la journée
Scan 1 → Cache → ✅ Mis en queue
Scan 2 → Cache → ✅ Mis en queue
...
Scan 50 → Cache → ✅ Mis en queue
Retour WiFi maison
     → Auto-sync des 50 scans
Logout → Vidage cache
```

**Avantage** : Service complet en zone blanche.

---

## Métriques et Monitoring

### Logs Console

```
[EPscanT] ✅ IndexedDB initialisée
[EPscanT] ✅ Firebase connected
[EPscanT] ✅ Sync initiale: 150 abonnements
[EPscanT] ✅ Abonnement trouvé dans le cache: Mamadou Diop
[EPscanT] 📱 Scan mis en queue (mode hors-ligne)
[EPscanT] 🌐 Connexion rétablie
[EPscanT] 🔄 2 scans en attente de sync
[EPscanT] ✅ Scan synchronisé: scan_1735987654321_abc123
[EPscanT] 🗑️ Cache hors-ligne vidé
```

### LocalStorage Metadata

```javascript
localStorage.getItem('last_sync_timestamp')      // 1735987654321
localStorage.getItem('cached_subscriptions_count') // "150"
```

---

## Limitations Connues

### 1. Nouveaux abonnements en cours de journée

Si un passager **achète un SAMA PASS pendant que le chauffeur est déjà connecté**, le PASS ne sera pas dans le cache local.

**Solutions** :
- Re-sync manuelle (à implémenter)
- Recherche Firebase si online (déjà implémenté)
- Sync automatique toutes les heures (à implémenter)

### 2. Modifications d'abonnements

Si un abonnement est **suspendu/annulé** après la sync, le cache local reste valide jusqu'à la prochaine sync.

**Mitigation** :
- Sync automatique au retour de connexion
- Sync au démarrage de chaque session

### 3. Taille du cache

IndexedDB a des limites par origine (navigateur):
- **Chrome/Edge** : 60% de l'espace disque disponible
- **Firefox** : 50% de l'espace disque
- **Safari** : 1 GB max

Avec 10 000 abonnements × 500 bytes ≈ **5 MB** → Aucun problème.

---

## FAQ

### Q: Que se passe-t-il si je perds la connexion pendant un scan ?

**R:** Le scan est validé depuis le cache local, puis mis en queue. Il sera synchronisé automatiquement dès que la connexion revient.

### Q: Combien de temps les données restent en cache ?

**R:** Jusqu'à la déconnexion du chauffeur. À chaque logout, le cache est complètement vidé pour des raisons de sécurité.

### Q: Les scans hors-ligne sont-ils fiables ?

**R:** Oui. Les données sont validées localement (dates, statut), puis synchronisées vers Firebase dès que possible. Aucune perte de données.

### Q: Puis-je utiliser EPscanT sans jamais avoir de connexion ?

**R:** Non. Une connexion est requise **au login** pour télécharger les abonnements actifs. Ensuite, vous pouvez travailler hors-ligne toute la journée.

### Q: Que se passe-t-il si la synchronisation échoue ?

**R:** Les scans restent en queue et seront re-tentés au prochain retour de connexion. Aucune perte de données.

---

## Roadmap Future

### Version 2.0 (à venir)

- **Sync périodique automatique** : Toutes les heures si online
- **Bouton de refresh manuel** : Forcer la re-sync
- **Statistiques de sync** : Nombre de scans en attente visible
- **Mode dégradé** : Alerte si cache expiré depuis > 24h
- **Service Worker** : Amélioration du background sync
- **Compression des données** : Réduction de la taille du cache

---

## Support Technique

Pour toute question ou problème:

1. Vérifier les logs console (`[EPscanT]`)
2. Vérifier l'indicateur hors-ligne dans l'interface
3. Tester la connexion Firebase (point vert/rouge)
4. En dernier recours : Se déconnecter et reconnecter

**Contact** : support@demdem-express.sn
