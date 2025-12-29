# Mode Développement - EvenPass

## Mode Actuel : MOCK DATA

L'application fonctionne actuellement en **mode développement** avec des données de test simulées. Cela permet de tester l'interface sans avoir besoin de Firebase Auth ou de créer les tables Supabase.

## Fonctionnalités du Mode Mock

### 1. Authentification Simulée

**Connexion automatique** : L'utilisateur est automatiquement connecté avec l'UID admin `Tnq8Isi0fATmidMwEuVrw1SAJkI3`

**Accès complet** :
- Page d'accueil avec événements mockés
- Dashboard Admin Finance (bouton vert)
- Dashboard Ops Manager (bouton jaune)
- Dashboard EPscan (bouton rouge)
- Dashboard Organisateur (bouton orange)

### 2. Données de Test

Les données mockées incluent :
- 4 événements (concerts, conférences, festivals, sports)
- 4 catégories d'événements
- 2 organisateurs
- Types de tickets (VIP, Standard)
- Réservations et statistiques
- Demandes de payout

Tous les appels API vers Supabase sont remplacés par des données locales.

## Comment Tester

### Page d'Accueil
```
http://localhost:5173/
```
- Affiche 4 événements mockés
- Barre de recherche fonctionnelle
- Filtres par catégorie
- Navigation vers les détails d'événements

### Admin Finance (Bouton Vert)
```
http://localhost:5173/admin/finance/login
```
- N'importe quel email/mot de passe fonctionne
- Affiche les statistiques financières mockées
- Liste des demandes de payout
- Boutons "Approuver" et "Rejeter" (simulations)

### Ops Manager (Bouton Jaune)
```
http://localhost:5173/admin/ops/login
```
- N'importe quel email/mot de passe fonctionne
- Accès au dashboard opérationnel

### EPscan (Bouton Rouge)
```
http://localhost:5173/scan/login
```
- N'importe quel email/mot de passe fonctionne
- Interface de scan de billets

### Dashboard Organisateur (Bouton Orange)
```
http://localhost:5173/organizer/login
```
- Email contenant "organisateur" → rôle organisateur
- Autres emails → rôle admin
- Affiche les événements de l'organisateur
- Statistiques et demandes de payout

## Structure des Fichiers Mock

### `src/lib/mockData.ts`
Contient toutes les données de test :
- `mockEvents` - Événements
- `mockCategories` - Catégories
- `mockOrganizers` - Organisateurs
- `mockTicketTypes` - Types de billets
- `mockBookings` - Réservations
- `mockStats` - Statistiques
- `mockPayouts` - Demandes de payout

### `src/context/MockAuthContext.tsx`
Simule l'authentification Firebase :
- Utilisateur admin par défaut
- Fonction `signIn()` simulée
- Fonction `signOut()` simulée
- Pas de vérification réelle

## Passer en Mode Production

Pour basculer vers Firebase Auth et Supabase réels :

### 1. Modifier `src/App.tsx`

```typescript
// AVANT (Mode Mock)
import { MockAuthProvider, useAuth } from './context/MockAuthContext';

// APRÈS (Mode Production)
import { FirebaseAuthProvider, useAuth } from './context/FirebaseAuthContext';
```

```typescript
// AVANT
<MockAuthProvider>
  <AppRoutes />
</MockAuthProvider>

// APRÈS
<FirebaseAuthProvider>
  <AppRoutes />
</FirebaseAuthProvider>
```

### 2. Modifier les Pages

Remplacer les imports dans chaque page :

**HomePageNew.tsx**
```typescript
// AVANT
import { useAuth } from '../context/MockAuthContext';
import { mockEvents, mockCategories } from '../lib/mockData';

// APRÈS
import { useAuth } from '../context/FirebaseAuthContext';
import { supabase } from '../lib/supabase';
```

**OrganizerDashboardPage.tsx**
```typescript
// AVANT
import { useAuth } from '../context/MockAuthContext';
import { mockEvents, mockStats, mockPayouts } from '../lib/mockData';

// APRÈS
import { useAuth } from '../context/FirebaseAuthContext';
import { supabase } from '../lib/supabase';
```

**AdminFinancePage.tsx**
```typescript
// AVANT
import { useAuth } from '../context/MockAuthContext';
import { mockPayouts, mockEvents, mockStats } from '../lib/mockData';

// APRÈS
import { useAuth } from '../context/FirebaseAuthContext';
import { supabase } from '../lib/supabase';
```

### 3. Restaurer les Appels API

Remplacer les fonctions `loadData()` mockées par les appels Supabase originaux.

**Exemple pour HomePage** :
```typescript
const loadData = async () => {
  setLoading(true);
  try {
    const { data: categoriesData } = await supabase
      .from('event_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (categoriesData) setCategories(categoriesData);

    let query = supabase
      .from('events')
      .select(`
        *,
        category:event_categories(*),
        organizer:organizers(*),
        ticket_types(*)
      `)
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date');

    if (selectedCategory) {
      query = query.eq('category_id', selectedCategory);
    }

    const { data: eventsData } = await query.limit(12);

    if (eventsData) setEvents(eventsData as Event[]);
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
};
```

### 4. Créer les Tables Supabase

Appliquez les migrations :
```bash
supabase db push
```

Ou exécutez les fichiers SQL dans `supabase/migrations/`

### 5. Créer l'Utilisateur Admin dans Firebase

Suivez les instructions dans `FIREBASE_AUTH_SETUP.md`

## Avantages du Mode Mock

1. **Développement rapide** : Pas besoin de configurer Firebase ou Supabase
2. **Tests sans risque** : Aucune modification dans la vraie base de données
3. **Démonstration facile** : Présenter l'interface sans configuration
4. **Développement offline** : Travailler sans connexion internet
5. **Debugging simple** : Données prévisibles et contrôlables

## Logs de Développement

Tous les appels mockés affichent des logs dans la console :
```
[MOCK AUTH] Sign in: admin@evenpass.sn
[MOCK DATA] Loading categories and events...
[MOCK DATA] Loaded 4 events
[MOCK DATA] Loading organizer dashboard...
[MOCK] Creating payout request: { amount: 500000, method: 'wave' }
```

## Troubleshooting

### Erreur : "useAuth must be used within a Provider"

Vérifiez que vous importez le bon contexte (MockAuthContext ou FirebaseAuthContext) dans `App.tsx` et dans les pages.

### Les événements ne s'affichent pas

Vérifiez que `mockEvents` est bien importé et que le filtre de date ne bloque pas les événements (voir `mockData.ts`)

### Les statistiques sont à zéro

Vérifiez que `mockStats` est correctement importé dans la page concernée.

## Notes Importantes

- **Mode Mock = Tests uniquement** : Ne déployez JAMAIS en production avec MockAuthContext
- **Données non persistées** : Les modifications sont perdues au refresh de la page
- **Pas de sécurité** : Tout le monde a accès admin en mode mock
- **Performance** : Le mode mock est plus rapide (pas d'appels API réseau)

## Prochaines Étapes

1. Tester toutes les fonctionnalités en mode mock
2. Créer les tables Supabase (migrations)
3. Configurer Firebase Auth avec l'UID admin
4. Basculer vers FirebaseAuthContext
5. Tester en mode production avec vraies données
6. Déployer sur Netlify

## Support

Pour toute question sur le mode développement :
1. Consultez `FIREBASE_AUTH_SETUP.md` pour la config auth
2. Consultez les migrations dans `supabase/migrations/`
3. Vérifiez les logs console (F12) pour les erreurs
