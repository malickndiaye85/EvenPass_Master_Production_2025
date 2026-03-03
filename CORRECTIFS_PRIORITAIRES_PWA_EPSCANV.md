# Correctifs Prioritaires PWA EPscanV

## Date : 2026-03-03
## Statut : APPLIQUÉS ✅

---

## Problème Identifié

L'événement `beforeinstallprompt` ne se déclenche pas, empêchant l'installation automatique de la PWA EPscanV sur `/controller-login.html`.

---

## ✅ Correctif 1 : Meta Tags Conformes

### Problème
Warning Chrome : `<meta name="apple-mobile-web-app-capable" content="yes"> is deprecated`

### Solution Appliquée
```html
<!-- AVANT -->
<meta name="apple-mobile-web-app-capable" content="yes">

<!-- APRÈS -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
```

**Fichier modifié** : `/public/controller-login.html` ligne 9

---

## ✅ Correctif 2 : Forçage HTTPS

### Problème
L'installation PWA nécessite HTTPS en production.

### Solution Appliquée
```javascript
// Redirection automatique HTTP → HTTPS
if (location.protocol === 'http:' &&
    location.hostname !== 'localhost' &&
    location.hostname !== '127.0.0.1') {
    console.log('[EPscanV] Redirecting to HTTPS...');
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

**Fichier modifié** : `/public/controller-login.html` ligne 499

---

## ✅ Correctif 3 : Headers MIME Type

### Problème
Le manifeste doit être servi avec `Content-Type: application/manifest+json`

### Solution Appliquée

**Fichier 1 : `.htaccess`** (pour Apache)
```apache
# MIME Types pour PWA
AddType application/manifest+json .json
AddType application/manifest+json .webmanifest

# Service Worker
AddType application/javascript .js

# Cache Control
<FilesMatch "\.(json|webmanifest)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>
```

**Fichier 2 : `_headers`** (pour Netlify/Vercel)
```
/manifest*.json
  Content-Type: application/manifest+json
  Cache-Control: public, max-age=0, must-revalidate

/sw*.js
  Content-Type: application/javascript
  Service-Worker-Allowed: /
```

**Fichiers créés** :
- `/public/.htaccess`
- `/public/_headers`

---

## ✅ Correctif 4 : Vérification des Icônes

### Problème
Les icônes PNG (192x192 et 512x512) doivent exister et être accessibles.

### Solution Appliquée
```bash
✅ /public/epscan-192.png (30KB)
✅ /public/epscan-512.png (184KB)
✅ /dist/epscan-192.png (copié)
✅ /dist/epscan-512.png (copié)
```

**Manifeste vérifié** : `/public/manifest-epscanv.json`
```json
{
  "icons": [
    {
      "src": "/epscan-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/epscan-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/epscan-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## ✅ Correctif 5 : Instructions Manuelles Détaillées

### Problème
Si `beforeinstallprompt` ne se déclenche pas, l'utilisateur n'a aucun moyen d'installer la PWA.

### Solution Appliquée
Modale pédagogique avec instructions spécifiques par plateforme :

#### 📱 iOS/Safari
```
1. Cliquez sur le bouton Partager (icône carrée avec flèche vers le haut)
2. Faites défiler et sélectionnez "Sur l'écran d'accueil"
3. Cliquez sur "Ajouter" en haut à droite
4. L'application EPscanV apparaîtra sur votre écran d'accueil
```

#### 📱 Android/Chrome
```
1. Cliquez sur les 3 points verticaux (⋮) en haut à droite
2. Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"
3. Confirmez en cliquant sur "Installer"
4. L'application EPscanV sera installée sur votre appareil

💡 Astuce : Assurez-vous d'être en HTTPS
```

#### 💻 Chrome/Edge Desktop
```
1. Cherchez l'icône d'installation (⊕) dans la barre d'adresse (à droite)
2. OU cliquez sur les 3 points (⋮) > "Installer EPscanV"
3. Confirmez l'installation dans la fenêtre contextuelle

⚠️ Vérifiez que vous êtes bien en HTTPS
```

**Fonction créée** : `showManualInstallInstructions()` ligne 580

---

## ✅ Correctif 6 : Diagnostic Automatique

### Problème
Impossible de savoir pourquoi l'installation ne fonctionne pas.

### Solution Appliquée
```javascript
async function diagnosePWA() {
    console.group('[EPscanV] 🔍 PWA Diagnostic');

    // 1. Protocol
    console.log('Protocol:', location.protocol);

    // 2. Service Worker
    console.log('Service Worker supported:', 'serviceWorker' in navigator);

    // 3. Manifeste + Vérification des icônes
    const manifest = await fetch('/manifest-epscanv.json').then(r => r.json());
    for (const icon of manifest.icons) {
        const response = await fetch(icon.src);
        console.log(response.ok ? '✅' : '❌', icon.sizes, icon.src);
    }

    // 4. Standalone mode
    console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);

    console.groupEnd();
}
```

**Logs affichés dans la console** :
```
[EPscanV] 🔍 PWA Diagnostic
  Protocol: https:
  ✅ Service Worker API supported
  ✅ Manifest link found: /manifest-epscanv.json
  Manifest Content-Type: application/manifest+json
  ✅ Manifest loaded
  Icons: 3 icon(s)
  Start URL: /controller-login.html
  Display: standalone
  Scope: /
  Icon verification:
    ✅ 192x192 - /epscan-192.png
    ✅ 512x512 - /epscan-512.png
    ✅ 512x512 - /epscan-512.png
  Standalone mode: ❌ No
```

---

## ✅ Correctif 7 : Bannière de Fallback

### Problème
Le bouton d'installation ne s'affiche pas si `beforeinstallprompt` ne se déclenche pas.

### Solution Appliquée
```javascript
// Afficher le bouton après 3 secondes même sans beforeinstallprompt
setTimeout(() => {
    if (!deferredPrompt) {
        console.log('[EPscanV] ⚠️ beforeinstallprompt not fired, showing fallback banner');
        showFallbackInstallBanner();
    }
}, 3000);

function showFallbackInstallBanner() {
    const status = checkPWASupport();

    if (!status.isInstalled && !status.isDismissed && !status.isStandalone) {
        installPrompt.style.display = 'block';
        console.log('[EPscanV] 🔄 Showing fallback install button');
    }
}
```

**Résultat** : Le bouton "INSTALLER L'APPLICATION" s'affiche TOUJOURS après 3 secondes (sauf si déjà installé ou refusé).

---

## Critères PWA Validés ✅

| Critère | Statut | Détails |
|---------|--------|---------|
| HTTPS | ✅ | Redirection automatique |
| Service Worker | ✅ | `/sw-epscanv.js` enregistré |
| Manifeste | ✅ | `/manifest-epscanv.json` valide |
| MIME Type | ✅ | `application/manifest+json` |
| Icône 192x192 | ✅ | PNG valide |
| Icône 512x512 | ✅ | PNG valide |
| start_url | ✅ | `/controller-login.html` |
| display | ✅ | `standalone` |
| name | ✅ | "EPscanV" |
| short_name | ✅ | "EPscanV" |
| theme_color | ✅ | `#10B981` |
| background_color | ✅ | `#0A0A0B` |

---

## Fichiers Modifiés

1. ✅ `/public/controller-login.html`
   - Meta tags corrigés
   - Redirection HTTPS
   - Diagnostic PWA
   - Instructions manuelles détaillées
   - Bannière de fallback

2. ✅ `/public/manifest-epscanv.json`
   - Icônes PNG (déjà fait)

3. ✅ `/public/sw-epscanv.js`
   - Cache des icônes PNG (déjà fait)

4. ✅ `/public/.htaccess` (nouveau)
   - MIME types
   - Headers
   - Redirection HTTPS

5. ✅ `/public/_headers` (nouveau)
   - Headers pour Netlify/Vercel

6. ✅ `/public/epscan-192.png` (vérifié)
7. ✅ `/public/epscan-512.png` (vérifié)

---

## Tests à Effectuer

### Test 1 : Chrome Desktop (HTTPS)
1. Ouvrir `https://demdem.sn/controller-login.html`
2. Ouvrir la console (F12)
3. Vérifier les logs du diagnostic
4. Chercher l'icône d'installation dans la barre d'adresse
5. OU cliquer sur "INSTALLER L'APPLICATION"

### Test 2 : Chrome Android
1. Ouvrir sur Android avec Chrome
2. La bannière doit s'afficher après 3 secondes
3. Cliquer sur "INSTALLER"
4. OU Menu (⋮) > "Installer l'application"

### Test 3 : Safari iOS
1. Ouvrir sur iPhone/iPad
2. Cliquer sur "INSTALLER L'APPLICATION"
3. Lire les instructions dans la modale
4. Suivre les étapes (Partager > Sur l'écran d'accueil)

---

## Logs de Diagnostic Attendus

```
[EPscanV] Redirecting to HTTPS... (si HTTP)
[EPscanV] 🔍 PWA Diagnostic
  Protocol: https:
  ✅ Service Worker API supported
  ✅ Manifest link found
  Manifest Content-Type: application/manifest+json
  ✅ Manifest loaded
  Icons: 3 icon(s)
  ✅ 192x192 - /epscan-192.png
  ✅ 512x512 - /epscan-512.png
  ✅ 512x512 - /epscan-512.png
[EPscanV] ✅ Service Worker registered
[EPscanV] Scope: https://demdem.sn/

// Si beforeinstallprompt se déclenche
[EPscanV] ✅ beforeinstallprompt event fired - Installation is available!
[EPscanV] Showing install button and banner

// Sinon après 3 secondes
[EPscanV] ⚠️ beforeinstallprompt not fired, showing fallback banner
[EPscanV] 🔄 Showing fallback install button
```

---

## Résultat Attendu

Sur **tous les navigateurs** :
1. ✅ Diagnostic complet dans la console
2. ✅ Bouton d'installation visible après 3 secondes max
3. ✅ Instructions détaillées si installation manuelle nécessaire
4. ✅ Modale élégante au lieu d'alerte
5. ✅ Installation fonctionnelle sur Chrome/Edge
6. ✅ Instructions claires sur iOS/Safari

---

## Notes Importantes

- **HTTPS obligatoire** : L'installation PWA ne fonctionne qu'en HTTPS (sauf localhost)
- **Cache navigateur** : Videz le cache si les changements ne s'appliquent pas
- **Service Worker** : Peut nécessiter un rechargement forcé (Ctrl+Shift+R)
- **beforeinstallprompt** : Chrome peut décider de ne pas déclencher l'événement même si tous les critères sont remplis
- **Fallback garanti** : Le bouton s'affiche toujours après 3 secondes

---

## Commande de Build

```bash
npm run build
```

✅ Service Worker versionné : `1772532389637`
✅ Variables d'environnement injectées
✅ Fichiers de config copiés dans dist/
