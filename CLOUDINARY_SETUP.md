# Configuration Cloudinary pour EvenPass

## Configuration requise

Votre application utilise maintenant **Cloudinary** au lieu de Firebase Storage pour stocker les documents KYC (CNI et registre de commerce).

## Étapes de configuration

### 1. Créer un Upload Preset (IMPORTANT)

1. **Allez sur votre dashboard Cloudinary** : https://console.cloudinary.com

2. **Connectez-vous** avec votre compte

3. **Allez dans Settings** (Paramètres) → **Upload**

4. **Scroll jusqu'à "Upload presets"**

5. **Cliquez sur "Add upload preset"**

6. **Configurez le preset comme suit** :
   - **Preset name** : `evenpass_upload` (IMPORTANT - doit correspondre au .env)
   - **Signing Mode** : **Unsigned** (IMPORTANT !)
   - **Folder** : Laissez vide (sera défini dynamiquement)
   - **Allowed formats** : `jpg, jpeg, png, pdf`
   - **Max file size** : `10 MB`
   - **Access mode** : `public`

7. **Cliquez sur "Save"**

### 2. Vérifier la configuration

Votre Cloud Name est déjà configuré dans le code : `dus8ia9x8`

### 3. Tester l'upload

1. **Videz le cache du navigateur** : `Ctrl + Shift + R` (Windows/Linux) ou `Cmd + Shift + R` (Mac)

2. **Allez sur la page d'inscription organisateur** : `/organizer/signup`

3. **Remplissez le formulaire** avec un NOUVEL EMAIL

4. **Uploadez les documents** (CNI et/ou Registre de commerce)

5. **Soumettez le formulaire**

6. **Ouvrez la console du navigateur** (F12) pour voir les logs :
   ```
   [ORGANIZER SIGNUP] Starting signup process...
   [ORGANIZER SIGNUP] Creating Firebase auth user...
   [CLOUDINARY] Uploading file: cni.jpg to folder: verification-documents/USER_ID
   [CLOUDINARY] Upload successful: https://res.cloudinary.com/dus8ia9x8/...
   [ORGANIZER SIGNUP] CNI uploaded successfully to Cloudinary
   ```

### 4. Vérifier les uploads dans Cloudinary

1. Allez dans **Media Library** sur votre dashboard Cloudinary

2. Vous devriez voir un dossier `verification-documents/`

3. Chaque organisateur aura son sous-dossier avec son `userId`

## En cas d'erreur

### Erreur : "Upload preset not found"

Vérifiez que vous avez bien créé le preset `evenpass_upload` dans votre dashboard Cloudinary et qu'il est en mode **Unsigned**.

### Erreur : "Invalid file format"

Vérifiez que vous uploadez bien un fichier image (JPG, PNG) ou PDF.

### Erreur : "File size too large"

Le fichier ne doit pas dépasser 10 MB.

## Avantages de Cloudinary

- ✅ **Gratuit** jusqu'à 25 GB de stockage et 25 GB de bande passante
- ✅ **Pas besoin du forfait Blaze** de Firebase
- ✅ **Optimisation automatique** des images
- ✅ **CDN mondial** pour un accès rapide partout
- ✅ **Transformations d'images** disponibles si nécessaire

## Structure des URLs

Les documents uploadés auront des URLs comme :
```
https://res.cloudinary.com/dus8ia9x8/image/upload/v1234567890/verification-documents/USER_ID/cni_abc123.jpg
```

## Sécurité

- Les documents sont publics par URL mais non listables
- Seul l'admin peut voir les documents dans le dashboard de vérification
- Les URLs sont difficiles à deviner (contiennent un hash)
