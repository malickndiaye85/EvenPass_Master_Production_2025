# 🔍 DIAGNOSTIC RÔLE ORGANISATEUR - Instructions Critiques

## 🎯 OBJECTIF

Identifier EXACTEMENT pourquoi l'organisateur `jlb2TPyc8lOgnSADSOfRPjGHEk93` est déterminé comme "customer" au lieu de "organizer".

## ✅ CORRECTIONS EFFECTUÉES

### 1. Logs Détaillés Ajoutés
- ✅ Affichage complet des données organisateur (`fullData`)
- ✅ Affichage des types de données (`typeof is_active`, `typeof verification_status`)
- ✅ Comparaisons exactes avec les valeurs attendues
- ✅ Optimisation: données admin chargées UNIQUEMENT pour l'UID admin

### 2. Meta Tag Corrigé
- ✅ Remplacement de `apple-mobile-web-app-capable` par `mobile-web-app-capable`
- ✅ Plus d'avertissement de dépréciation

## 🚨 ACTION REQUISE - TESTEZ MAINTENANT

### Étape 1: Connectez-vous
1. Allez sur `/dashboard/organizer` ou la page de connexion organisateur
2. Connectez-vous avec le compte: `jlb2TPyc8lOgnSADSOfRPjGHEk93`

### Étape 2: Ouvrez la Console
1. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
2. Allez dans l'onglet **Console**

### Étape 3: Trouvez et Copiez Ces Logs

Cherchez cette ligne (elle devrait maintenant afficher TOUTES les données):

```
[FIREBASE AUTH] Organizer data loaded: Object
```

Développez l'objet et vous devriez voir:
```javascript
{
  exists: true,
  fullData: {
    // TOUTES LES DONNÉES ICI
    is_active: ...,
    verification_status: "...",
    organization_name: "...",
    // etc.
  },
  isActive: ...,
  status: "...",
  orgName: "..."
}
```

Puis trouvez cette ligne:
```
[FIREBASE AUTH] Role determination checks: Object
```

Elle devrait afficher:
```javascript
{
  isAdmin: false,
  hasOrganizerData: true,
  organizerIsActive: <valeur>,
  organizerIsActiveType: "<type>",  // CRITIQUE!
  organizerStatus: "<valeur>",
  organizerStatusType: "<type>"     // CRITIQUE!
}
```

### Étape 4: Partagez les Informations

**COPIEZ ET PARTAGEZ CES 2 OBJETS COMPLETS**

Je dois voir:
1. Le contenu exact de `fullData`
2. Les types de `is_active` et `verification_status`

## 🔍 PROBLÈMES POTENTIELS ET SOLUTIONS

### Problème A: `is_active` n'est pas `true` (booléen)

**Symptômes**:
```javascript
organizerIsActive: "true"          // String au lieu de booléen
organizerIsActiveType: "string"    // Devrait être "boolean"
```

**Cause**: Dans Firebase, `is_active` est stocké comme string `"true"` au lieu de booléen `true`

**Solution**: Aller dans Firebase Console → Realtime Database → `/evenpass/organizers/jlb2TPyc8lOgnSADSOfRPjGHEk93`

Modifier:
```json
{
  "is_active": "true"      // ❌ INCORRECT
}
```

En:
```json
{
  "is_active": true         // ✅ CORRECT (booléen, pas string)
}
```

### Problème B: `verification_status` incorrect

**Symptômes**:
```javascript
organizerStatus: "Verified"           // Majuscule
organizerStatus: "pending"            // Pas vérifié
organizerStatus: undefined            // Manquant
```

**Cause**: Le statut n'est pas exactement `"verified"` (minuscule)

**Solution**: Dans Firebase Console → Realtime Database → `/evenpass/organizers/jlb2TPyc8lOgnSADSOfRPjGHEk93`

Modifier:
```json
{
  "verification_status": "Verified"    // ❌ INCORRECT (majuscule)
}
```

En:
```json
{
  "verification_status": "verified"    // ✅ CORRECT (tout en minuscule)
}
```

### Problème C: Données manquantes

**Symptômes**:
```javascript
fullData: null
// ou
fullData: {}
```

**Cause**: Aucune donnée dans `/evenpass/organizers/jlb2TPyc8lOgnSADSOfRPjGHEk93`

**Solution**: Créer l'entrée complète dans Firebase:

```json
{
  "evenpass": {
    "organizers": {
      "jlb2TPyc8lOgnSADSOfRPjGHEk93": {
        "is_active": true,
        "verification_status": "verified",
        "organization_name": "Nom de l'Organisation",
        "organization_type": "company",
        "contact_email": "email@example.com",
        "contact_phone": "+221 XX XXX XX XX",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    }
  }
}
```

## 📋 CHECKLIST COMPLÈTE

### Pour l'Organisateur `jlb2TPyc8lOgnSADSOfRPjGHEk93`:

- [ ] Données existent dans `/evenpass/organizers/jlb2TPyc8lOgnSADSOfRPjGHEk93`
- [ ] `is_active` est **booléen** `true` (pas string `"true"`)
- [ ] `verification_status` est **exactement** `"verified"` (minuscule)
- [ ] `organization_name` est défini
- [ ] `contact_email` est défini
- [ ] Les règles Firebase permettent la lecture (déjà OK si le log affiche les données)

### Pour l'Admin `Tnq8Isi0fATmidMwEuVrw1SAJkI3`:

- [ ] Variable `.env`: `VITE_ADMIN_UID=Tnq8Isi0fATmidMwEuVrw1SAJkI3`
- [ ] Serveur redémarré après modification du `.env`
- [ ] Pas besoin de données dans `/evenpass/admins/` (reconnu par UID)

## 🎬 RÉSUMÉ - PROCHAINES ÉTAPES

1. **TESTEZ**: Connectez-vous avec `jlb2TPyc8lOgnSADSOfRPjGHEk93`
2. **OUVREZ LA CONSOLE** (F12)
3. **COPIEZ** les logs `Organizer data loaded` et `Role determination checks`
4. **PARTAGEZ** ces 2 objets complets

Les logs vous diront EXACTEMENT:
- Si les données existent
- Si `is_active` est un booléen ou une string
- Si `verification_status` est exactement "verified"
- Pourquoi le rôle n'est pas attribué

## ⚡ SI LE PROBLÈME PERSISTE

Après avoir partagé les logs, je pourrai:
1. Identifier le problème exact (type de données, valeur incorrecte, etc.)
2. Vous donner la commande JSON exacte à copier-coller dans Firebase
3. Ou ajuster le code pour accepter les valeurs actuelles

**NE TENTEZ RIEN D'AUTRE AVANT D'AVOIR PARTAGÉ LES LOGS DE LA CONSOLE**

Les nouveaux logs sont ultra-détaillés et montreront la cause exacte du problème.
