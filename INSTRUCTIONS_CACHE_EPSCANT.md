# Instructions pour voir les modifications EPscanT

## Problème
Les modifications CSS/HTML ne sont pas visibles car le fichier est mis en cache par le navigateur.

## Solution 1 : Hard Refresh (Recommandé)

### Sur Chrome/Edge (Android)
1. Ouvrir EPscanT
2. Appuyer sur les **3 points** en haut à droite
3. Sélectionner **"Paramètres"**
4. Descendre et appuyer sur **"Confidentialité et sécurité"**
5. Appuyer sur **"Effacer les données de navigation"**
6. Cocher **"Images et fichiers en cache"**
7. Appuyer sur **"Effacer les données"**
8. Fermer et **rouvrir EPscanT**

### Sur Chrome (Desktop)
1. Ouvrir EPscanT
2. Appuyer sur **Ctrl + Shift + R** (Windows/Linux)
3. Ou **Cmd + Shift + R** (Mac)

### Sur Firefox (Android)
1. Ouvrir EPscanT
2. Appuyer sur les **3 points** en haut à droite
3. Sélectionner **"Paramètres"**
4. Appuyer sur **"Supprimer les données de navigation"**
5. Cocher **"Cache"**
6. Appuyer sur **"Supprimer les données de navigation"**
7. Fermer et **rouvrir EPscanT**

### Sur Safari (iOS)
1. Ouvrir **Réglages** iOS
2. Descendre et appuyer sur **"Safari"**
3. Appuyer sur **"Effacer historique et données de sites"**
4. Confirmer
5. Rouvrir EPscanT

---

## Solution 2 : Mode Navigation Privée

### Sur n'importe quel navigateur
1. Ouvrir le navigateur
2. Activer le **mode navigation privée/incognito**
3. Aller sur EPscanT
4. Tester le scan

---

## Solution 3 : Désinstaller et Réinstaller la PWA

### Si EPscanT est installé comme PWA
1. **Désinstaller** l'application EPscanT
   - Android : Appui long sur l'icône → Désinstaller
   - iOS : Appui long sur l'icône → Supprimer l'app
2. **Rouvrir** le navigateur
3. **Aller** sur https://votre-url.com/epscant-transport.html
4. **Réinstaller** la PWA

---

## Vérification des Modifications

### Ce que vous devriez voir maintenant :

#### ❌ AVANT (ancien design)
```
┌─────────────────────────────┐
│   🚌 SAMA PASS 🚌         │
│     [PHOTO RONDE]          │
│                            │
│  ┌──────────────────────┐  │
│  │                      │  │
│  │    [QR CODE]         │  │ ← QR CODE VISIBLE
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  🚌 Ligne                 │
│     Keur Massar ⇄ UCAD    │
│                            │
│  💎 Formule               │
│     💎 PRESTIGE           │
│  ...                       │
└─────────────────────────────┘
```

#### ✅ APRÈS (nouveau design)
```
┌─────────────────────────────┐
│ 🚌 SAMA PASS    [PHOTO]   │ ← Header horizontal
│ NOM PRENOM      carrée     │ ← Photo carrée 60x60
│ +221 77 123 45 67          │
├─────────────────────────────┤
│ 🚌 Ligne                   │ ← Infos compactes
│    Keur Massar ⇄ UCAD      │
├─────────────────────────────┤
│ 💎 Formule                 │
│    [💎 PRESTIGE]    ← Badge│
├─────────────────────────────┤
│ 📅 Type                    │
│    Mensuel • 1/2 trajets   │ ← Combiné
├─────────────────────────────┤
│ ⏰ Expire le               │
│    07/04/2026              │
├─────────────────────────────┤
│      ✅ VALIDE             │
├─────────────────────────────┤
│     [CONTINUER]            │
└─────────────────────────────┘
Hauteur réduite de 57% !
PAS de QR code !
```

### Points clés à vérifier :

1. ❌ **Pas de QR code** affiché
2. ✅ **Photo carrée** (60x60px) en haut à droite
3. ✅ **Header horizontal** (nom à gauche, photo à droite)
4. ✅ **Badge inline** pour la formule (ex: [💎 PRESTIGE])
5. ✅ **Type + Quota** sur la même ligne (ex: "Mensuel • 1/2 trajets")
6. ✅ **Carte plus compacte** (~280px au lieu de 650px)
7. ✅ **Textes plus petits** mais lisibles

---

## Dépannage

### Si vous voyez toujours l'ancien design

1. **Vérifier l'URL** : Êtes-vous bien sur `/epscant-transport.html` ?
2. **Vérifier la date** : Regarder en bas de page, doit indiquer la version récente
3. **Forcer le rechargement** : Maintenir le bouton de rechargement appuyé
4. **Vérifier le cache** : Aller dans les paramètres du navigateur
5. **Réinstaller la PWA** : Désinstaller complètement et réinstaller

### Si le scan ne fonctionne plus

1. **Autoriser la caméra** : Vérifier les permissions
2. **Recharger la page** : Fermer et rouvrir EPscanT
3. **Vérifier Firebase** : Les règles doivent être déployées

---

## Commandes de Déploiement

### Pour l'administrateur

```bash
# Build du projet
npm run build

# Synchronisation des fichiers HTML
bash sync-html.sh

# Copie manuelle si nécessaire
cp public/epscant-transport.html dist/epscant-transport.html

# Vérification
grep "pass-card-top" dist/epscant-transport.html
```

### Résultat attendu

```
✅ Build réussi
✅ Synchronisation terminée
✅ 18 fichiers HTML copiés
✅ epscant-transport.html mis à jour
```

---

## URL de Test

### Production
```
https://votre-domaine.com/epscant-transport.html
```

### Local
```
http://localhost:5173/epscant-transport.html
```

---

## Support

Si après avoir suivi toutes ces étapes, vous ne voyez toujours pas les modifications :

1. **Prendre une capture d'écran** de ce que vous voyez
2. **Vérifier la console** du navigateur (F12 ou menu développeur)
3. **Vérifier l'onglet Network** pour voir si le fichier est chargé depuis le cache
4. **Contacter le support** avec les détails

---

**Date de mise à jour** : 2026-03-08
**Version** : 2.0 (Mobile-First Optimisé)
**Fichier** : epscant-transport.html
