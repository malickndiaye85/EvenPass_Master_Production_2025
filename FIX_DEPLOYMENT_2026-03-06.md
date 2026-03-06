# Fix Deployment - 2026-03-06

## Problèmes Résolus

### 1. Fichiers Temporaires Vite
**Problème**: Fichiers `*.timestamp-*` générés par Vite causant des erreurs dans GitHub Actions
**Solution**:
- Suppression des fichiers `vite.config.ts.timestamp-*`
- Ajout dans `.gitignore` pour éviter leur commit
- Ajout d'une étape de nettoyage dans GitHub Actions workflow

### 2. Configuration GitHub Actions
**Améliorations**:
- Nettoyage automatique des fichiers temporaires avant build
- Suppression du cache Vite avant installation
- Build propre avec `CI=false npm run build`

### 3. Bypass Test SAMA PASS
**Implémentation**:
- Bouton "Générer Pass de Test" accessible via `/voyage/express?test=true`
- Génération instantanée d'abonnements valides dans `abonnements_express`
- QR code scannable immédiatement avec EPscanT
- Format: `SAMAPASS-221771234567-{timestamp}{random}`

**Données du pass test**:
```javascript
{
  qr_code: "SAMAPASS-221771234567-...",
  full_name: "Test User XXX",
  subscriber_phone: "221771234567",
  start_date: Date actuelle,
  end_date: +30 jours,
  status: "active",
  subscription_type: "monthly",
  subscription_tier: "eco",
  route_id: "test-route",
  route_name: "Ligne Test DEM-DEM",
  test_pass: true
}
```

### 4. Gestion dans Admin Transversal
**Boutons de suppression**:
- Visibles dans les sections "Événements" et "Transport"
- Affichent le nombre de pass de test
- Suppression ciblée (seulement `test_pass: true`)
- Confirmation avant suppression

## Fichiers Modifiés

1. `.gitignore` - Exclusion fichiers temporaires
2. `.github/workflows/final_deploy.yml` - Nettoyage avant build
3. `src/pages/transport/DemDemExpressPage.tsx` - Bouton test + paramètre `?test=true`
4. `src/pages/AdminTransversalDashboard.tsx` - Boutons de suppression
5. `src/lib/testPassGenerator.ts` - Génération et nettoyage

## URLs de Test

- **Génération**: `/voyage/express?test=true`
- **Scanner**: EPscanT (application mobile ou web)
- **Admin**: `/admin/transversal`

## Résultat

Build propre sans erreurs:
- ✓ Fichiers temporaires supprimés
- ✓ Build réussi (17.90s)
- ✓ GitHub Actions prêt pour déploiement
- ✓ Pass de test fonctionnel
