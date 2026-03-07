# Test EPscanT - Interface SAMA PASS

## Problème Résolu
✅ Le fichier `epscant-transport.html` dans `dist/` est maintenant synchronisé avec `public/`

## Comment Tester

### 1. Vider le Cache du Navigateur
**IMPORTANT** : Appuyez sur `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac) pour forcer le rechargement.

### 2. Accéder à EPscanT
```
http://localhost:5173/epscant-transport.html
```

### 3. Se Connecter
- Utiliser un PIN de véhicule valide
- Ou créer un véhicule via la console admin

### 4. Scanner un QR Code SAMA PASS

#### Résultat Attendu - PASS VALIDE
Vous devriez voir une **carte complète** avec :
```
┌─────────────────────────────┐
│   [Photo de profil]         │
│   👤 Nom de l'abonné        │
│   📞 +221 77 100 00 00      │
│                             │
│   🚌 Ligne                  │
│      Keur Massar ⇄ UCAD     │
│                             │
│   💎 Formule                │
│      💎 PRESTIGE            │
│                             │
│   📅 Type                   │
│      Mensuel                │
│                             │
│   📊 Trajets aujourd'hui    │
│      1/2                    │
│                             │
│   ⏰ Expire le              │
│      07/04/2026             │
│                             │
│   ✅ PASS VALIDE            │
└─────────────────────────────┘
```

#### Au Lieu de l'Ancien Affichage Texte
```
❌ ANCIEN (à ne plus voir):
✓ PASS VALIDE
Bienvenue à bord

Abonné: Malick NDIAYE
Forfait: Prestige Mensuel
Ligne: Keur Massar ⇄ UCAD
Expire le: 07/04/2026
```

### 5. Tester les Cas d'Erreur

#### Quota Dépassé (après 2 scans)
Vous devriez voir :
```
⚠️ LIMITE ATTEINTE
2/2 trajets effectués aujourd'hui
Prochain trajet disponible demain
```

#### Scan Trop Rapide (< 30 min)
Vous devriez voir :
```
⚠️ SCAN TROP RAPPROCHÉ
Dernier scan : Il y a 15 minutes
Veuillez patienter
15 minutes
```

#### Erreur de Ligne
Vous devriez voir :
```
❌ ERREUR LIGNE
Ce pass est réservé à :
Keur Massar ⇄ Petersen

Véhicule actuel :
Keur Massar ⇄ UCAD
```

## Vérification Technique

### Vérifier dans la Console du Navigateur (F12)
Vous devriez voir ces logs :
```
[EPscanT] 📱 Scan détecté: SAMAPASS-221771000000-xxx
[EPscanT] 🔐 VALIDATION GËNAA WÓOR - Contrôles de sécurité
[EPscanT] ✅ LIGNE: Correcte
[EPscanT] 📊 QUOTA: 0/2 trajets aujourd'hui
[EPscanT] ✅ TOUS LES CONTRÔLES PASSÉS
```

### Inspecter l'Élément Modal
1. Ouvrir DevTools (F12)
2. Aller dans Elements
3. Chercher `class="sama-pass-card"`
4. Vous devriez voir la structure de la carte

## En Cas de Problème

### La carte ne s'affiche toujours pas ?

1. **Vérifier le fichier chargé** :
   - Ouvrir DevTools → Sources
   - Chercher `epscant-transport.html`
   - Rechercher (Ctrl+F) : `sama-pass-card`
   - Si absent → Le cache n'est pas vidé

2. **Forcer la synchronisation** :
```bash
./sync-html.sh
```

3. **Rebuild complet** :
```bash
npm run build
./sync-html.sh
```

4. **Vider le cache navigateur** :
   - Chrome : Paramètres → Confidentialité → Effacer les données
   - Firefox : Options → Confidentialité → Effacer l'historique récent
   - Ou : `Ctrl+Shift+Suppr`

## Script de Synchronisation

Pour synchroniser les fichiers HTML après modification :
```bash
./sync-html.sh
```

Ce script copie tous les fichiers de `public/` vers `dist/`.
