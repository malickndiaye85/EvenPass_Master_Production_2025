# Guide EPscanV Autonome - Nouvelle Architecture

## Date de Mise à Jour
**21 Février 2026**

---

## Philosophie

EPscanV est désormais une application **100% autonome** pour les apprentis-chauffeurs. Ils peuvent travailler sans que l'Ops Manager soit connecté, sans dépendance au système central d'authentification.

---

## Gestion des Véhicules

### Interface Admin - Ajout de Nouveaux Véhicules

**Page:** `src/pages/admin/AdminVehiclePINManager.tsx`

Cette interface permet de:
- Générer automatiquement des PIN à 6 chiffres
- Ajouter les informations du véhicule (numéro, ligne, capacité, chauffeur)
- Exporter le code TypeScript pour mise à jour
- Gérer la liste complète des véhicules autorisés

### Processus d'Ajout d'un Véhicule

1. Ouvrir l'interface de gestion des PIN
2. Générer un nouveau PIN à 6 chiffres
3. Remplir les informations du véhicule
4. Cliquer sur "Exporter le code TypeScript"
5. Copier le code généré
6. Ouvrir `src/lib/vehicleAuthService.ts`
7. Remplacer l'objet `LOCAL_VEHICLE_DATABASE`
8. Sauvegarder et redéployer l'application

### Format de Stockage

Les véhicules sont stockés dans un objet TypeScript simple:
```typescript
const LOCAL_VEHICLE_DATABASE = {
  'PIN': { vehicleId, vehicle_number, license_plate, capacity, route, driver_name, driver_phone }
}
```

---

## Architecture Technique

### 1. Authentification par PIN (100% LOCAL)

**Fichier:** `src/lib/vehicleAuthService.ts`

#### Principe - Validation Instantanée Locale
1. **Base Locale** - Liste hardcodée des véhicules avec leurs PIN
2. **Validation Directe** - Recherche du PIN dans l'objet JavaScript
3. **Session Locale** - Sauvegarde immédiate dans localStorage
4. **AUCUN appel Firebase** pendant le login (aucune erreur de permission possible)

#### Code
```typescript
const LOCAL_VEHICLE_DATABASE: Record<string, {
  vehicleId: string;
  vehicle_number: string;
  license_plate: string;
  capacity: number;
  route: string;
  driver_name?: string;
  driver_phone?: string;
}> = {
  '435016': {
    vehicleId: 'VEHICLE_DK2022S',
    vehicle_number: 'DK-2022-S',
    license_plate: 'DK-2022-S',
    capacity: 32,
    route: 'Ligne 7 - Parcelles Assainies',
    driver_name: 'Boubacar Diallo',
    driver_phone: '+221771234567'
  }
};

// Validation instantanée
const vehicleData = LOCAL_VEHICLE_DATABASE[normalizedPin];
```

#### Avantages
- L'apprenti tape **UNIQUEMENT** son PIN (6 chiffres)
- Login **INSTANTANÉ** (< 1ms, pas d'attente réseau)
- Aucun appel Firebase = aucune erreur de permission
- Fonctionne hors ligne
- Compatible avec n'importe quel téléphone (même vieux modèles)
- Pas de dépendance à Google Auth ou autre service externe

---

### 2. Session de Travail Locale

**Storage:** `localStorage` avec clé `epscanv_vehicle_session`

#### Structure de la Session
```typescript
interface VehicleSession {
  vehicleId: string;           // ID Firebase du véhicule
  vehicleNumber: string;        // Ex: "L221241"
  licensePlate: string;         // Ex: "DK-1234-AB"
  capacity: number;             // Capacité du véhicule
  route: string;                // Ex: "Keur Massar - UCAD"
  driverName?: string;          // Nom de l'apprenti
  driverPhone?: string;         // Téléphone
  loginTimestamp: number;       // Timestamp de connexion
  pin: string;                  // PIN utilisé
}
```

#### Persistance
- **Source de vérité:** localStorage
- **Durée:** 24 heures maximum
- **Vérification:** À chaque chargement de page

---

### 3. Tracking des Scans par Véhicule

**Structure Firebase:** `/scans/{vehicleId}/{date}/{scanId}`

#### Exemple de Chemin
```
/scans/
  └── VEHICLE_001/
      └── 2026-02-21/
          ├── scan_1234567890_abc123
          ├── scan_1234567891_def456
          └── scan_1234567892_ghi789
```

#### Données Enregistrées
```typescript
{
  vehicleId: "VEHICLE_001",
  vehicleNumber: "L221241",
  route: "Keur Massar - UCAD",
  passengerId: "USER_123",
  subscriptionType: "mensuel_premium",
  grade: "GENAA",
  result: "validated",        // ou "rejected"
  reason: null,               // ou motif de rejet
  timestamp: serverTimestamp(),
  location: {
    latitude: 14.7645,
    longitude: -17.3660
  },
  scannedBy: "Apprenti Mamadou"
}
```

---

### 4. Interface Apprenti

**Fichier:** `src/pages/transport/EPscanVPage.tsx`

#### Affichage du Header
```typescript
<div className="bg-gradient-to-r from-[#10B981] to-[#059669] p-4">
  <div className="text-white font-black text-lg">
    Navette {session.vehicleNumber}
  </div>
  <div className="text-green-100 text-sm">
    {session.route}
  </div>
</div>
```

#### Informations Visibles
- **Numéro du véhicule:** Ex: "Navette L221241"
- **Trajet:** Ex: "Keur Massar - UCAD"
- **Statut de connexion:** En ligne / Hors ligne
- **Batterie:** Niveau de batterie du téléphone
- **Scans en attente:** Nombre de scans à synchroniser

---

### 5. Mode Offline-First

#### IndexedDB
- **Base locale:** `EPscanVDB`
- **Tables:**
  - `pendingScans` - Scans en attente de sync
  - `scannedPasses` - Historique local pour anti-passback

#### Synchronisation
```typescript
// Si en ligne
await recordVehicleScan(scanData);

// Si hors ligne
await savePendingScan(scanResult);

// Quand revient en ligne
await syncPendingScans();
```

---

## Workflow Apprenti

### 1. Connexion
1. Ouvrir `/controller/login`
2. Saisir le **PIN à 6 chiffres** du véhicule
3. Validation REST automatique
4. Redirection vers `/controller-epscanv`

### 2. Scan
1. Démarrer le scanner
2. Scanner le QR Code du passager
3. Validation locale (expiration, ligne, anti-passback)
4. Enregistrement dans `/scans/{vehicleId}/{date}/`

### 3. Fin de Service
1. Bouton "Déconnexion"
2. Effacement de la session locale
3. Retour au login

---

## Dashboard Admin - Filtrage par Véhicule

### Requête Firebase
```typescript
const scansRef = ref(db, `scans/${vehicleId}/${date}`);
const snapshot = await get(scansRef);
```

### Calcul des Revenus
```typescript
const scans = snapshot.val();
const revenue = Object.values(scans)
  .filter(scan => scan.result === 'validated')
  .reduce((total, scan) => {
    const price = getSubscriptionPrice(scan.subscriptionType);
    return total + price;
  }, 0);
```

### Rapport par Navette
- **Total validés** par véhicule
- **Total rejetés** par véhicule
- **Revenus** par véhicule
- **Performance** (taux de validation)

---

## Points Clés de Sécurité

### 1. Aucune Authentification Centrale Requise
- ❌ Pas de dépendance à Firebase Auth
- ✅ PIN = seule clé d'accès
- ✅ Validation directe via REST

### 2. Session Isolée
- Chaque véhicule a sa propre session
- Pas de croisement de données
- Tracking précis par `vehicleId`

### 3. Anti-Passback Local
- Cooldown de **2 heures** par passager
- Vérification dans IndexedDB
- Pas de double scan

---

## Avantages

### Pour l'Apprenti
- ✅ Connexion simple (PIN 6 chiffres)
- ✅ Travail autonome
- ✅ Pas besoin du manager
- ✅ Interface claire (numéro bus + trajet)
- ✅ Fonctionne hors ligne

### Pour l'Admin
- ✅ Tracking précis par véhicule
- ✅ Filtrage facile des revenus
- ✅ Rapports détaillés
- ✅ Identification des navettes performantes

### Technique
- ✅ Aucun blocage Firebase Auth
- ✅ Scalable (1 PIN par véhicule)
- ✅ Données bien organisées
- ✅ Synchronisation automatique

---

## Migration de l'Ancien Système

### Ancien Flux (DEPRECATED)
```
User → Google Login → auth.currentUser → Pin Validation → Session
```

### Nouveau Flux (ACTUEL - 100% LOCAL)
```
User → PIN → Validation Locale Instantanée → localStorage Session → Scan
```

**Temps total:** < 1ms (aucun appel réseau)

### Fichiers Modifiés
1. **NEW:** `src/lib/vehicleAuthService.ts`
2. **UPDATED:** `src/pages/transport/ControllerLoginPage.tsx`
3. **UPDATED:** `src/pages/transport/EPscanVPage.tsx`

### Fichiers Non Modifiés (Routes)
- `src/App.tsx` - Routes `/controller/*` déjà publiques

---

## Tests de Validation

### Test 1: Login avec PIN
```
1. Aller sur /controller/login
2. Saisir un PIN valide (ex: 123456)
3. Vérifier redirection vers /controller-epscanv
4. Vérifier localStorage contient la session
```

### Test 2: Affichage Véhicule
```
1. Vérifier header affiche "Navette XXXXX"
2. Vérifier trajet affiché
3. Vérifier bouton déconnexion présent
```

### Test 3: Scan et Tracking
```
1. Scanner un QR Code valide
2. Vérifier enregistrement dans /scans/{vehicleId}/
3. Vérifier vehicleId présent dans les données
```

### Test 4: Mode Offline
```
1. Déconnecter le réseau
2. Scanner un QR Code
3. Vérifier sauvegarde dans IndexedDB
4. Reconnecter réseau
5. Vérifier synchronisation automatique
```

---

## Dépannage

### Problème: "Code incorrect"
**Solution:** Vérifier que le PIN existe dans `/fleet_vehicles/{vehicleId}/epscanv_pin`

### Problème: "Véhicule désactivé"
**Solution:** Vérifier `/fleet_vehicles/{vehicleId}/epscanv_active = true`

### Problème: Session expirée
**Solution:** La session dure 24h. Se reconnecter avec le PIN.

### Problème: Scans non synchronisés
**Solution:** Vérifier connexion Internet. Les scans en attente sont dans IndexedDB.

---

## Conclusion

Le nouveau système EPscanV est **totalement autonome**, permettant aux apprentis-chauffeurs de travailler en toute indépendance avec un tracking précis par véhicule pour des rapports admin détaillés.

**Architecture:** REST-based, localStorage, Firebase RTDB
**Sécurité:** PIN-only, session locale, anti-passback
**Performance:** Offline-first, sync automatique, wake lock
**UX:** Interface claire, feedback visuel, sons

---

**Dernière mise à jour:** 21 Février 2026
**Version:** 2.0 - Architecture Autonome
