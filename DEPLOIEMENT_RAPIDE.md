# Déploiement Rapide - Règles Firebase

## Méthode 1 : Script Automatique (Linux/Mac)

```bash
./deploy-rules.sh
```

Le script va :
1. Vérifier Firebase CLI
2. Créer un backup automatique
3. Afficher aperçu des règles
4. Demander confirmation
5. Déployer

## Méthode 2 : Firebase CLI Manuel

```bash
# 1. Se connecter
firebase login

# 2. Initialiser (première fois seulement)
firebase init database

# 3. Déployer
firebase deploy --only database
```

## Méthode 3 : Console Firebase (Copier-Coller)

**Étape 1** : Copier le contenu de `REGLES_FIREBASE_COMPLETES.json`

**Étape 2** : Ouvrir https://console.firebase.google.com

**Étape 3** : Sélectionner le projet **evenpasssenegal**

**Étape 4** : Menu → **Realtime Database** → Onglet **Rules**

**Étape 5** : Coller le contenu

**Étape 6** : Cliquer **Publish**

## Vérification Rapide

### Test 1 : Lecture Publique (doit fonctionner)

```javascript
// Console browser sur https://evenpass-senegal.web.app
const db = getDatabase();
const eventsRef = ref(db, 'events');
const snapshot = await get(eventsRef);
console.log('✅ Events:', snapshot.val());
```

### Test 2 : Lecture Protégée (doit échouer)

```javascript
// Sans authentification
const vehiclesRef = ref(db, 'transport/vehicles');
const snapshot = await get(vehiclesRef);
// ❌ Error: Permission denied (attendu)
```

### Test 3 : Super Admin (doit fonctionner si connecté comme super admin)

```javascript
// Avec auth.uid === 'Tnq8Isi0fATmidMwEuVrw1SAJkI3'
const financesRef = ref(db, 'finances');
const snapshot = await get(financesRef);
console.log('✅ Finances:', snapshot.val());
```

## Résumé des Règles

| Chemin | Lecture | Écriture |
|--------|---------|----------|
| `/events` | Public | Organisateur ou Admin |
| `/transport/vehicles` | Ops Transport ou Admin | Ops Transport ou Admin |
| `/transport/sessions` | Public | Public |
| `/transport/scans` | Ops Transport ou Admin | Public (scans) |
| `/finances` | Super Admin UNIQUEMENT | Super Admin UNIQUEMENT |
| `/users` | Authentifiés | Propriétaire ou Admin |
| `/organizers` | Public | Propriétaire ou Admin |
| `/opsEvents` | Authentifiés | Authentifiés |
| `/accessCodes` | Super Admin UNIQUEMENT | Super Admin UNIQUEMENT |
| `/adminRoles` | Authentifiés | Super Admin UNIQUEMENT |

## Rôles

### Super Admin
- UID : `Tnq8Isi0fATmidMwEuVrw1SAJkI3`
- Accès : TOTAL

### Ops Transport
- Chemin : `/adminRoles/{uid}/role = "ops_transport"`
- Accès : Véhicules, lignes, scans transport

### Ops Events
- Chemin : `/adminRoles/{uid}/role = "ops_events"`
- Accès : Événements, contrôleurs, scans events

### Organisateur
- Chemin : `/organizers/{uid}`
- Accès : Ses propres événements

## Commandes Utiles

```bash
# Voir règles actuelles
firebase database:get .settings/rules

# Backup manuel
firebase database:get .settings/rules > backup-$(date +%Y%m%d).json

# Déployer uniquement database
firebase deploy --only database

# Tester en local
firebase emulators:start --only database
```

## En Cas d'Erreur

**"Permission Denied"** :
- Vérifier authentification
- Vérifier rôle dans `/adminRoles/{uid}`
- Vérifier que les règles sont déployées

**"Index not defined"** :
- Ajouter `.indexOn` dans les règles
- Redéployer

**Règles non mises à jour** :
- Attendre 1-2 minutes
- Vider cache browser
- Vérifier dans Console Firebase

## Support

Documentation complète : `DEPLOIEMENT_REGLES_FIREBASE_COMPLETES.md`

Guide véhicules : `GUIDE_AJOUT_VEHICULES_FIREBASE.md`
