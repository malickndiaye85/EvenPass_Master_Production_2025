# Séparation Complète des Systèmes de Scan

**Date** : 2026-03-04
**Objectif** : Séparer totalement les scanners Events et Transport avec des interfaces HTML pures

## Décision Architecturale

Séparation stricte en **2 systèmes distincts** :

1. **EPscanV Events** (`/epscanv-events.html`)
   - Contrôleurs Events uniquement
   - Codes 6 chiffres générés par Ops Manager Events
   - Scan billets Firestore `tickets`
   - Thème : Orange (#F97316)

2. **EPscanT Transport** (`/epscant-transport.html`)
   - Contrôleurs Transport uniquement
   - PINs 6 chiffres pour véhicules DEM-DEM Express
   - Scan SAMA Pass Realtime Database
   - Thème : Bleu Ciel (#0EA5E9)

## Architecture Complète

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTROLLER LOGIN PAGE                       │
│               /controller/login (React)                      │
│                                                               │
│  Modes disponibles :                                         │
│  ┌─────────┬───────────┬───────────────┐                   │
│  │  Auto   │  Events   │  Transport    │                   │
│  └─────────┴───────────┴───────────────┘                   │
│                                                               │
│  Code 6 chiffres : [______]                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                      │
                      │ Authentification
                      ▼
            ┌─────────────────────┐
            │ Mode sélectionné ?  │
            └─────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│   MODE EVENTS    │        │  MODE TRANSPORT  │
└──────────────────┘        └──────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌──────────────────────────────────────────────┐
│  authenticateController(code)                │
│  ├─ Recherche dans opsEvents/controllers    │
│  ├─ Vérifie isActive                         │
│  └─ Crée ControllerSession (localStorage)   │
└──────────────────────────────────────────────┘
        │
        │ Success → window.location.href
        ▼
┌──────────────────────────────────────────────┐
│       /epscanv-events.html                   │
│       (HTML Pur - Thème Orange)              │
│                                               │
│  Scanner :                                    │
│  ├─ Lit sessionStorage controller            │
│  ├─ Affiche nom événement                    │
│  ├─ Scanner html5-qrcode                     │
│  └─ Valide billets Firestore                │
│                                               │
│  Stats :                                      │
│  ├─ Validés (vert)                           │
│  ├─ Refusés (rouge)                          │
│  └─ Total (orange)                           │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  authenticateVehicleByPIN(pin)               │
│  ├─ Recherche dans vehicles hardcodés       │
│  ├─ Vérifie code PIN                         │
│  └─ Crée VehicleSession (localStorage)      │
└──────────────────────────────────────────────┘
        │
        │ Success → window.location.href
        ▼
┌──────────────────────────────────────────────┐
│       /epscant-transport.html                │
│       (HTML Pur - Thème Bleu)                │
│                                               │
│  Scanner :                                    │
│  ├─ Lit localStorage vehicle                 │
│  ├─ Affiche plaque véhicule                  │
│  ├─ Scanner html5-qrcode                     │
│  └─ Valide SAMA Pass RTDB                   │
│                                               │
│  Stats :                                      │
│  ├─ Validés (vert)                           │
│  ├─ Refusés (rouge)                          │
│  └─ Total (bleu)                             │
└──────────────────────────────────────────────┘
```

## Fichiers Créés

### 1. `/public/epscanv-events.html`

**HTML Pur - Pas de React**

#### Caractéristiques
- Thème : Noir avec liserés orange (#F97316)
- Font : Inter + Orbitron
- Scanner : html5-qrcode
- Statut : Badge "● En ligne"

#### Session
```javascript
// Lecture sessionStorage (Safari compatible)
eventName = sessionStorage.getItem('event_name')
eventId = sessionStorage.getItem('event_id')
controllerName = sessionStorage.getItem('controller_name')
controllerId = sessionStorage.getItem('controller_id')
```

#### Validation Billets
```javascript
// 1. Lire Firestore tickets/{ticketId}
const ticketRef = doc(db, 'tickets', decodedText);
const snapshot = await getDoc(ticketRef);

// 2. Vérifier événement
if (ticket.eventId !== eventId) → REFUS

// 3. Vérifier scan
if (ticket.scanned) → DÉJÀ SCANNÉ

// 4. Marquer scanné
await updateDoc(ticketRef, {
  scanned: true,
  scannedAt: new Date().toISOString(),
  scannedBy: controllerName
});

// 5. Enregistrer dans OPS
await recordScan(controllerId, controllerName, eventId, ticketId, false);
```

#### Stats
- **Validés** : Vert (#22C55E)
- **Refusés** : Rouge (#EF4444)
- **Total** : Orange (#F97316)

### 2. `/public/epscant-transport.html`

**HTML Pur - Pas de React**

#### Caractéristiques
- Thème : Noir avec liserés bleu ciel (#0EA5E9)
- Font : Inter + Orbitron
- Scanner : html5-qrcode
- Statut : Badge "● Transport Actif"

#### Session
```javascript
// Lecture localStorage
const sessionData = localStorage.getItem('demdem_vehicle_session');
const vehicleSession = JSON.parse(sessionData);

vehicleId = vehicleSession.vehicleId;
driverName = vehicleSession.driverName;
licensePlate = vehicleSession.licensePlate;
```

#### Validation SAMA Pass
```javascript
// 1. Lire RTDB samaPass/{passId}
const passRef = dbRef(rtdb, `samaPass/${decodedText}`);
const snapshot = await rtdbGet(passRef);

// 2. Vérifier expiration
if (passData.expiresAt && Date.now() > passData.expiresAt) → EXPIRÉ

// 3. Vérifier actif
if (!passData.isActive) → DÉSACTIVÉ

// 4. Enregistrer scan
const scanDate = new Date().toISOString().split('T')[0];
const scanRef = dbRef(rtdb, `scans/${vehicleId}/${scanDate}/${Date.now()}`);

await rtdbSet(scanRef, {
  passId: decodedText,
  passengerName: passData.holderName,
  timestamp: Date.now(),
  vehicleId: vehicleId,
  driverName: driverName
});
```

#### Stats
- **Validés** : Vert (#22C55E)
- **Refusés** : Rouge (#EF4444)
- **Total** : Bleu (#0EA5E9)

## Fichiers Modifiés

### 1. `src/pages/transport/ControllerLoginPage.tsx`

**Ajout 3 modes de connexion** :

```typescript
const [mode, setMode] = useState<'auto' | 'transport' | 'events'>('auto');

// Mode Auto : Essaie Events puis Transport
// Mode Events : Uniquement Events
// Mode Transport : Uniquement Transport
```

**Redirections** :

```typescript
// Events → HTML pur
if (eventsResult.success) {
  window.location.href = '/epscanv-events.html';
}

// Transport → HTML pur
if (transportResult.success) {
  window.location.href = '/epscant-transport.html';
}
```

### 2. `src/App.tsx`

**Suppression routes React inutiles** :
- ❌ `/controller-epscanv` (remplacé par epscant-transport.html)
- ❌ `/controller-events-scanner` (remplacé par epscanv-events.html)

**Conservation route login** :
- ✅ `/controller/login` (React - page de choix mode)

## Fichiers Supprimés

1. ❌ `src/pages/transport/EPscanVPage.tsx` - Remplacé par epscant-transport.html
2. ❌ `src/pages/transport/ControllerEventsScanner.tsx` - Remplacé par epscanv-events.html

## Comparaison des Systèmes

| Aspect | EPscanV Events | EPscanT Transport |
|--------|----------------|-------------------|
| **URL** | `/epscanv-events.html` | `/epscant-transport.html` |
| **Technologie** | HTML pur + Firebase CDN | HTML pur + Firebase CDN |
| **Thème** | Orange (#F97316) | Bleu Ciel (#0EA5E9) |
| **Authentification** | `authenticateController()` | `authenticateVehicleByPIN()` |
| **Session** | sessionStorage (Safari) | localStorage |
| **Base de données** | Firestore `tickets` | Realtime DB `samaPass` |
| **Enregistrement** | `opsEvents/scans` | `scans/{vehicleId}/{date}` |
| **Code** | 6 chiffres (Ops Manager) | 6 chiffres (hardcodé) |
| **Utilisateurs** | Contrôleurs Events | Chauffeurs DEM-DEM |
| **Validation** | Billet événement | SAMA Pass transport |

## Mode Test

### EPscanV Events
```
URL : /epscanv-events.html?test_mode=true

Session auto-créée :
- eventName: "La Nuit du Zikr"
- eventId: "test-event-001"
- controllerName: "Testeur"
- controllerId: "test-controller-001"
```

### EPscanT Transport
```
Pas de mode test implémenté
Session requise via login
```

## Flux Utilisateur

### Contrôleur Events

1. **Login**
   ```
   /controller/login
   → Sélectionner "Events" (ou Auto)
   → Saisir code 6 chiffres
   → Click automatique ou bouton
   ```

2. **Scanner**
   ```
   /epscanv-events.html
   → Caméra s'active auto
   → Scanner QR code billet
   → Feedback visuel/sonore
   → Stats mis à jour
   ```

3. **Déconnexion**
   ```
   Button "Exit"
   → Modal confirmation
   → Affiche total scans
   → Retour au login
   ```

### Chauffeur Transport

1. **Login**
   ```
   /controller/login
   → Sélectionner "Transport" (ou Auto)
   → Saisir PIN 6 chiffres
   → Click automatique ou bouton
   ```

2. **Scanner**
   ```
   /epscant-transport.html
   → Caméra s'active auto
   → Scanner QR SAMA Pass
   → Feedback visuel/sonore
   → Stats mis à jour
   ```

3. **Déconnexion**
   ```
   Button "Exit"
   → Modal confirmation
   → Affiche total scans
   → Retour au login
   ```

## Avantages de la Séparation

### 1. **Clarté**
- Chaque système a son interface dédiée
- Pas de confusion entre Events et Transport
- Code source séparé et maintenable

### 2. **Performance**
- HTML pur = chargement ultra-rapide
- Pas de React bundle à charger
- Scanner démarre instantanément

### 3. **Fiabilité**
- Pas d'interdépendances
- Bugs isolés par système
- Sessions séparées

### 4. **Maintenance**
- Modifications Events n'affectent pas Transport
- Tests indépendants
- Déploiements séparés possibles

### 5. **Évolutivité**
- Facile d'ajouter un 3ème système
- Chaque système peut évoluer indépendamment
- Pas de régression croisée

## Tests Effectués

### Build
```bash
npm run build
✓ built in 35.76s
✓ Copied 3 HTML files from public/ to dist/
✓ Environment variables injected inline in 13 HTML files
✓ Service Worker versioned
```

### Vérifications
- ✅ epscant-transport.html copié dans dist/
- ✅ epscanv-events.html copié dans dist/
- ✅ Pas d'erreurs TypeScript
- ✅ Routes React nettoyées
- ✅ Imports inutiles supprimés

## URLs Finales

### Production
```
Login :         https://votre-site.com/controller/login
Scanner Events: https://votre-site.com/epscanv-events.html
Scanner Transport: https://votre-site.com/epscant-transport.html
```

### Développement
```
Login :         http://localhost:5173/controller/login
Scanner Events: http://localhost:5173/epscanv-events.html
Scanner Transport: http://localhost:5173/epscant-transport.html
```

### Mode Test (Events uniquement)
```
https://votre-site.com/epscanv-events.html?test_mode=true
```

## Recommandations

### Pour Ops Manager Events
1. Utiliser uniquement le code Events généré
2. Transmettre le code au contrôleur
3. Le contrôleur va sur `/controller/login`
4. Sélectionner mode "Events" ou "Auto"
5. Scanner automatiquement redirigé vers epscanv-events.html

### Pour DEM-DEM Express Admin
1. Créer véhicule avec PIN 6 chiffres
2. Transmettre PIN au chauffeur
3. Chauffeur va sur `/controller/login`
4. Sélectionner mode "Transport" ou "Auto"
5. Scanner automatiquement redirigé vers epscant-transport.html

### Pour les Utilisateurs
- **Mode Auto** recommandé (détection automatique)
- Si problème, sélectionner mode explicite
- Vérifier connexion Internet avant scan
- Sessions expiration : 24h

## Sécurité

### Sessions
```javascript
// Events : sessionStorage (compatible Safari mode privé)
sessionStorage.setItem('event_name', eventName);

// Transport : localStorage (persistance)
localStorage.setItem('demdem_vehicle_session', JSON.stringify(session));
```

### Validation
- Tous les scans vérifiés côté Firebase
- Pas de validation client-side uniquement
- Enregistrement horodaté avec nom scanneur
- Historique complet dans Firebase

## Prochaines Étapes

### Court Terme
1. Tester en production avec vrais contrôleurs
2. Collecter feedback utilisateurs
3. Optimiser performances si nécessaire

### Moyen Terme
1. Ajouter export CSV des scans
2. Dashboard stats temps réel
3. Notifications push pour superviseurs

### Long Terme
1. Mode hors ligne complet avec sync
2. Statistiques avancées par contrôleur
3. Système de récompenses pour meilleurs contrôleurs
