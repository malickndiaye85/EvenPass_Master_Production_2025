# Guide Complet : OPS Manager Events

## Vue d'ensemble

**OPS Manager Events** est la tour de contrôle pour gérer les accès et le monitoring des contrôleurs utilisant EPscanV lors d'événements (concerts, matchs, festivals, etc.).

---

## Architecture du Système

### Structure Firebase Realtime Database

```
opsEvents/
├── events/
│   └── {eventId}/
│       ├── id: string
│       ├── name: string
│       ├── description: string
│       ├── date: number (timestamp)
│       ├── location: string
│       ├── status: 'upcoming' | 'ongoing' | 'completed'
│       ├── totalTickets: number
│       ├── scannedTickets: number
│       ├── activeControllers: number
│       ├── createdAt: number
│       └── completedAt?: number
│
├── controllers/
│   └── {controllerId}/
│       ├── id: string
│       ├── name: string
│       ├── code: string (6 chiffres uniques)
│       ├── eventId: string
│       ├── position: string
│       ├── createdAt: number
│       ├── isActive: boolean
│       ├── totalScans: number
│       ├── fraudAttempts: number
│       └── lastScanAt?: number
│
└── scans/
    └── {scanId}/
        ├── id: string
        ├── controllerId: string
        ├── controllerName: string
        ├── eventId: string
        ├── ticketId: string
        ├── timestamp: number
        ├── isFraud: boolean
        ├── ticketType?: string
        └── attendeeName?: string
```

---

## 1. Dashboard d'Administration

### URL d'accès
```
https://demdem.sn/admin/ops-events
```

### Rôles autorisés
- `super_admin`
- `ops_event`

### Fonctionnalités

#### A. Gestion des Événements

**Créer un événement**
1. Cliquez sur "Créer un événement"
2. Remplissez le formulaire :
   - Nom de l'événement
   - Description
   - Date et heure
   - Lieu
   - Nombre de billets attendus
3. Validez

**Statuts d'événement**
- `upcoming` : À venir (orange)
- `ongoing` : En cours (vert)
- `completed` : Terminé (gris)

#### B. Cartes Événements

Chaque carte affiche :
- Nom et description
- Statut coloré
- Date et lieu
- Progression : X / Y billets scannés
- Barre de progression visuelle
- Bouton "Voir le dashboard"

---

## 2. Gestion des Contrôleurs

### A. Ajouter un Contrôleur

1. Dans le dashboard d'un événement, cliquez sur "Ajouter un contrôleur"
2. Entrez :
   - **Nom** : Ex. "Abdoulaye Diop"
   - **Position** : Ex. "Porte A - Entrée principale"
3. Validez

**Génération automatique du code**
- Le système génère un code unique de 6 chiffres
- Exemple : `456789`
- Le code est vérifié pour être unique dans toute la base

### B. Tableau des Contrôleurs

| Colonne | Description |
|---------|-------------|
| **Nom** | Nom complet du contrôleur |
| **Position** | Poste assigné |
| **Code** | Code unique à 6 chiffres (format : `123 456`) |
| **Statut** | Actif (vert) / Inactif (gris) |
| **Actions** | Modifier / Supprimer |

### C. Modifier un Contrôleur

1. Cliquez sur l'icône crayon
2. Modifiez le nom ou la position
3. Le code reste inchangé

### D. Supprimer un Contrôleur

1. Cliquez sur l'icône poubelle
2. Confirmez la suppression
3. Le contrôleur et son code sont supprimés

---

## 3. Connexion EPscanV (Contrôleur)

### URL
```
https://demdem.sn/controller-login.html
```

### Processus de connexion

1. Le contrôleur ouvre la page sur son mobile
2. Il saisit son code à 6 chiffres (ex: `456 789`)
3. Le système vérifie :
   - ✅ Code existe dans `opsEvents/controllers`
   - ✅ Code actif (`isActive: true`)
   - ✅ Événement valide
4. Si valide, redirection vers `/scanner.html`

### Données stockées en session
```javascript
sessionStorage.setItem('controller_code', '456789');
sessionStorage.setItem('controller_id', 'ctrl_abc123');
sessionStorage.setItem('controller_name', 'Abdoulaye Diop');
sessionStorage.setItem('controller_position', 'Porte A');
sessionStorage.setItem('event_id', 'event_xyz456');
sessionStorage.setItem('event_name', 'Concert Youssou Ndour');
sessionStorage.setItem('controller_type', 'ops_events');
```

---

## 4. Enregistrement des Scans

### Processus automatique

Chaque fois qu'un billet est scanné sur `/scanner.html` :

1. **Création du scan record**
   ```javascript
   {
     id: 'scan_123',
     controllerId: 'ctrl_abc123',
     controllerName: 'Abdoulaye Diop',
     eventId: 'event_xyz456',
     ticketId: 'TKT-001',
     timestamp: 1709481234567,
     isFraud: false,
     ticketType: 'VIP',
     attendeeName: 'Modou Fall'
   }
   ```

2. **Mise à jour du contrôleur**
   - `totalScans` += 1
   - `fraudAttempts` += 1 (si fraude détectée)
   - `lastScanAt` = timestamp actuel

3. **Mise à jour de l'événement**
   - `scannedTickets` += 1 (uniquement si scan valide)

### Détection de fraude

Un scan est marqué comme fraude si :
- Le billet a déjà été scanné
- Le QR code est invalide
- Le billet est expiré

---

## 5. Monitoring en Temps Réel

### KPIs (Indicateurs Clés)

**4 cartes colorées :**

1. **Scans valides** (Vert)
   - Nombre de scans réussis
   - Sur total de billets

2. **Tentatives de fraude** (Rouge)
   - Nombre de scans frauduleux détectés

3. **Contrôleurs actifs** (Orange)
   - Nombre de contrôleurs avec `isActive: true`

4. **Taux de remplissage** (Bleu)
   - Pourcentage de billets scannés

### Barre de progression globale
- Affiche visuellement : scannés / total
- Gradient orange
- Mise à jour en temps réel

---

## 6. Classement Staff (Performance)

### Tableau en temps réel

Le tableau affiche tous les contrôleurs triés par nombre de scans (du plus élevé au plus bas) :

| Rang | Nom | Position | Scans | Fraudes | Dernier scan |
|------|-----|----------|-------|---------|--------------|
| 1 🥇 | Abdoulaye Diop | Porte A | 247 | 3 | 14:32 |
| 2 🥈 | Fatou Sall | Porte B | 198 | 1 | 14:31 |
| 3 🥉 | Ousmane Ndiaye | VIP | 156 | 0 | 14:29 |
| 4 | Aminata Wade | Backstage | 89 | 2 | 14:25 |

**Médailles :**
- 🥇 Top 1 : Fond or
- 🥈 Top 2 : Fond argent
- 🥉 Top 3 : Fond bronze

---

## 7. Graphique d'Affluence

### Visualisation par tranches de 15 minutes

Le graphique affiche le nombre d'entrées (scans valides) par intervalle de 15 minutes :

```
Scans
  │
250 │     ┌──┐
    │     │  │
200 │  ┌──┤  │
    │  │  │  │
150 │  │  │  │  ┌──┐
    │  │  │  │  │  │
100 │──┤  │  │  │  │──┐
    │  │  │  │  │  │  │
 50 │  │  │  │  │  │  │
    │  │  │  │  │  │  │
  0 └──┴──┴──┴──┴──┴──┴──
     14:00 14:15 14:30 14:45 15:00 15:15 15:30
```

**Couleur :** Gradient orange (brand color)

**Calcul automatique :**
- Regroupe les scans par tranches de 15 min
- Exclut les scans frauduleux
- Met à jour en temps réel

---

## 8. Clôture de Mission

### Terminer la mission

**Bouton rouge :** "Terminer la mission"

**Actions exécutées :**
1. Désactive tous les codes de l'événement (`isActive: false`)
2. Change le statut de l'événement à `completed`
3. Enregistre `completedAt: timestamp`

**Conséquence :**
- Les contrôleurs ne peuvent plus se connecter avec leurs codes
- Le dashboard passe en mode lecture seule
- Les statistiques sont figées

### Confirmation

```
⚠️ Terminer la mission ?
Tous les codes seront désactivés.

[Annuler]  [Confirmer]
```

---

## 9. Export de Rapport

### Format CSV

**Bouton :** "Exporter" (icône téléchargement)

**Nom du fichier :**
```
rapport-Concert-Youssou-Ndour-1709481234567.csv
```

**Structure du rapport :**

```csv
RAPPORT D'ACTIVITÉ OPS EVENTS

Événement:,Concert Youssou Ndour
Date:,03/03/2026
Lieu:,Grand Théâtre de Dakar

RÉSUMÉ
Total scans:,1247
Scans valides:,1189
Tentatives de fraude:,58
Contrôleurs actifs:,8

PERFORMANCE PAR CONTRÔLEUR
Nom,Position,Scans,Fraudes détectées,Dernier scan
Abdoulaye Diop,Porte A,247,3,03/03/2026 14:32:15
Fatou Sall,Porte B,198,1,03/03/2026 14:31:42
Ousmane Ndiaye,VIP,156,0,03/03/2026 14:29:08
...
```

**Utilisation :**
- Audit des contrôleurs
- Facturation du staff
- Analyse de performance
- Rapports pour l'organisateur

---

## 10. Mises à Jour en Temps Réel

### Firebase Realtime Listeners

Le système utilise des listeners Firebase pour des mises à jour instantanées :

```javascript
// Écoute de l'événement
listenToEvent(eventId, (event) => {
  // Met à jour les KPIs
  updateKPIs(event);
});

// Écoute des contrôleurs
listenToEventControllers(eventId, (controllers) => {
  // Rafraîchit le tableau des contrôleurs
  updateControllersTable(controllers);
});

// Écoute des scans
listenToEventScans(eventId, (scans) => {
  // Recalcule les stats et le graphique
  updateStats(scans);
  updateChart(scans);
});
```

**Résultat :**
- Les changements apparaissent instantanément sur tous les écrans
- Pas besoin de rafraîchir la page
- Collaboration multi-utilisateurs fluide

---

## 11. Design System

### Palette de couleurs

```css
Noir : #000000 (fond principal)
Gris foncé : #18181b (zinc-900, cartes)
Gris moyen : #27272a (zinc-800, bordures)
Orange : #F97316 (brand, actions)
Orange foncé : #EA580C (hover)
Vert : #10B981 (succès, scans valides)
Rouge : #EF4444 (fraude, danger)
Bleu : #3B82F6 (info)
```

### Typographie

```css
Font : -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
Titres : font-bold
Corps : font-normal
Codes : font-mono
```

### Composants

**Bouton primaire :**
```css
bg-orange-500 hover:bg-orange-600
text-white font-bold
px-6 py-3 rounded-lg
```

**Carte :**
```css
bg-zinc-900 border border-zinc-800
rounded-lg p-6
hover:border-orange-500/50
```

**Badge actif :**
```css
bg-green-500/20 text-green-400
border border-green-500/30
px-3 py-1 rounded-full
```

---

## 12. Sécurité & Permissions

### Règles Firebase

```json
{
  "rules": {
    "opsEvents": {
      ".read": "auth != null",
      ".write": "auth != null &&
                (root.child('users').child(auth.uid).child('role').val() === 'super_admin' ||
                 root.child('users').child(auth.uid).child('role').val() === 'ops_event')"
    }
  }
}
```

### Contrôle d'accès

**Frontend :**
```tsx
<RoleBasedRoute allowedRoles={['super_admin', 'ops_event']}>
  <AdminOpsEventsPage />
</RoleBasedRoute>
```

**Connexion contrôleur :**
- Pas d'authentification Firebase requise
- Validation par code unique à 6 chiffres
- Session locale uniquement

---

## 13. Flux Complet d'Utilisation

### Avant l'événement

1. **Admin crée l'événement**
   - `/admin/ops-events`
   - Clic sur "Créer un événement"
   - Remplit le formulaire
   - Valide

2. **Admin ajoute les contrôleurs**
   - Sélectionne l'événement
   - "Ajouter un contrôleur"
   - Nom + Position
   - Code généré automatiquement

3. **Admin transmet les codes**
   - Par SMS, email ou en personne
   - Chaque contrôleur reçoit son code unique

### Le jour de l'événement

4. **Contrôleurs se connectent**
   - Ouvrent `demdem.sn/controller-login.html`
   - Saisissent leur code à 6 chiffres
   - Accèdent au scanner

5. **Scans en continu**
   - Chaque billet scanné est enregistré
   - Stats mises à jour en temps réel
   - Admin surveille le dashboard

6. **Monitoring live**
   - Classement des contrôleurs
   - Détection des fraudes
   - Graphique d'affluence

### Après l'événement

7. **Clôture de mission**
   - Admin clique "Terminer la mission"
   - Tous les codes désactivés
   - Événement marqué "Terminé"

8. **Export du rapport**
   - Clic sur "Exporter"
   - Téléchargement CSV
   - Archivage et analyse

---

## 14. Codes d'Exemple

### Génération de code unique

```typescript
function generateControllerCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Exemple : "456789"
```

### Vérification d'unicité

```typescript
async function isCodeUnique(code: string): Promise<boolean> {
  const controllersRef = ref(database, 'opsEvents/controllers');
  const codeQuery = query(controllersRef, orderByChild('code'), equalTo(code));
  const snapshot = await get(codeQuery);
  return !snapshot.exists();
}
```

### Enregistrement d'un scan

```typescript
await recordScan(
  controllerId: "ctrl_123",
  controllerName: "Abdoulaye Diop",
  eventId: "evt_456",
  ticketId: "TKT-001",
  isFraud: false,
  ticketType: "VIP",
  attendeeName: "Modou Fall"
);
```

---

## 15. Troubleshooting

### Problème : Code refusé à la connexion

**Vérifications :**
1. Le code existe-t-il dans `opsEvents/controllers` ?
2. Le contrôleur est-il actif (`isActive: true`) ?
3. L'événement est-il toujours actif (non `completed`) ?

**Solution :**
- Vérifier le code dans le dashboard admin
- Réactiver le contrôleur si nécessaire

### Problème : Stats ne s'affichent pas

**Causes possibles :**
- Aucun scan enregistré
- Événement vide

**Solution :**
- Vérifier qu'il y a des scans dans Firebase
- Attendre quelques secondes (listeners Firebase)

### Problème : Export CSV vide

**Cause :**
- Aucune donnée de scan

**Solution :**
- Effectuer au moins un scan avant d'exporter

---

## 16. Évolutions Futures

### Phase 2
- [ ] Export PDF avec graphiques
- [ ] Notifications push aux contrôleurs
- [ ] Système de shifts (horaires)
- [ ] Attribution automatique de codes par SMS

### Phase 3
- [ ] Dashboard mobile dédié
- [ ] Statistiques avancées (heatmaps)
- [ ] Intégration avec système de paie
- [ ] Gestion multi-événements simultanés

---

## Résumé

**OPS Manager Events** est un système complet de gestion des accès et de monitoring pour les événements utilisant EPscanV.

**Points clés :**
- ✅ Codes uniques à 6 chiffres
- ✅ Dashboard temps réel
- ✅ Classement des contrôleurs
- ✅ Détection de fraude
- ✅ Clôture de mission
- ✅ Export CSV complet
- ✅ Design professionnel noir & orange

**URL principale :** `https://demdem.sn/admin/ops-events`

**Pour toute question :** Contactez l'équipe technique EvenPass
