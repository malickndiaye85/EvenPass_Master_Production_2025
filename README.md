# DEM⇄DEM - Super-App Mobilité & Événements

> **Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw**

Super-App sénégalaise unissant **Mobilité** (Voyage) et **Événements**. Une seule application pour découvrir, réserver et vivre toutes vos expériences au Sénégal.

## 🌟 Vue d'ensemble

DemDem est une plateforme tout-en-un qui révolutionne la façon dont les Sénégalais vivent et se déplacent :

### 🎫 DEM ÉVÉNEMENT
- **Billetterie digitale** avec QR codes sécurisés
- **Scan ultra-rapide** (< 200ms) anti-fraude
- **Paiement mobile** (Wave, Orange Money)
- **Dashboard organisateur** en temps réel
- **Marketing pages** professionnelles

### 🚗 DEM VOYAGE
- **ALLO DAKAR** : Covoiturage national
- **DEM-DEM EXPRESS** : Navettes par abonnement
- **DEM ZIGUINCHOR** : Ferry Dakar ⇄ Ziguinchor
- **SAMA PASS** : Abonnements transport illimités

## 🎨 Design System

### Dual Branding

**Univers ÉVÉNEMENT** (Orange & Noir)
```css
--event-primary: #FF6B00
--event-secondary: #1A1A1A
--event-bg: #FFFFFF
```

**Univers VOYAGE** (Bleu Nuit & Vert Émeraude)
```css
--voyage-primary: #0A1628
--voyage-secondary: #10B981
--voyage-bg: #F8FAFC
```

### Principes
- ❌ Pas de gradients multicolores "AI generic"
- ✅ Couleurs pleines et contrastes forts
- ✅ Mobile-first (375px puis responsive)
- ✅ PWA installable avec mode offline

## 🛠️ Stack Technique

- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **Styling:** Tailwind CSS 3
- **Database:** Firebase (Firestore + Realtime DB)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **Hosting:** Firebase Hosting
- **CI/CD:** GitHub Actions
- **Icons:** Lucide React

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- npm ou yarn

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/malickndiaye85/EvenPass_Master_Production_2025.git
cd EvenPass_Master_Production_2025

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Remplir les clés Firebase et Supabase dans .env

# Lancer en développement
npm run dev
```

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## 📁 Structure du Projet

```
├── public/                 # Assets statiques
│   ├── assets/            # Images et icônes
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Composants réutilisables
│   ├── context/           # Contexts React (Auth, Theme)
│   ├── lib/               # Utilitaires et helpers
│   ├── pages/             # Pages de l'application
│   │   ├── pass/          # Pages DEM VOYAGE
│   │   └── transport/     # Pages transport
│   ├── types/             # Types TypeScript
│   ├── App.tsx            # Composant racine
│   ├── firebase.ts        # Configuration Firebase
│   └── index.css          # Variables CSS globales
├── .github/
│   └── workflows/         # CI/CD GitHub Actions
│       ├── firebase-hosting-merge.yml
│       └── firebase-hosting-pull-request.yml
└── firebase.json          # Configuration Firebase

## 🔄 CI/CD & Déploiement

### Déploiement Automatique

Chaque push sur `main` déclenche automatiquement :
1. Build de production
2. Tests (si configurés)
3. Déploiement sur https://demdem.sn

### Configuration GitHub

Ajouter ces secrets dans **Settings → Secrets → Actions** :

```
FIREBASE_SERVICE_ACCOUNT
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Voir [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) pour plus de détails.

## 🔐 Sécurité

- **Authentification** : Firebase Auth avec vérification téléphone
- **RLS** : Row Level Security sur toutes les tables sensibles
- **Anti-fraude** : QR codes JWT avec signature cryptographique
- **Anti-passback** : Cooldown 2h entre scans
- **HTTPS** : Forcé sur tous les endpoints

## 📱 PWA Features

- ✅ Installable sur iOS et Android
- ✅ Mode offline pour EPscan
- ✅ Service Worker avec cache stratégies
- ✅ Wake Lock (écran allumé) pour contrôleurs
- ✅ Background Sync pour scans

## 🎯 Roadmap

- [x] Rebranding EvenPass → DemDem
- [x] Pages marketing modernisées
- [x] Dashboard organisateur amélioré
- [x] Login pages refonte (fond clair)
- [x] CI/CD automatisé
- [ ] Module ALLO DAKAR (Covoiturage)
- [ ] Module DEM-DEM EXPRESS (Navettes)
- [ ] SAMA PASS Wallet offline
- [ ] EPscanV (Transport)
- [ ] Pelias search engine (géocodage)
- [ ] Admin dashboards (Finance, OPS)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add: AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

### Standards de Code

- TypeScript strict mode
- ESLint + Prettier
- Composants fonctionnels avec hooks
- Commits conventionnels (feat, fix, docs, etc.)

## 📞 Support

- **Email** : support@demdem.sn
- **GitHub Issues** : [Créer un ticket](https://github.com/malickndiaye85/EvenPass_Master_Production_2025/issues)
- **Documentation** : Voir `/docs` (à venir)

## 📄 Licence

Propriétaire © 2025-2026 DemDem. Tous droits réservés.

## 👥 Équipe

- **Malick Ndiaye** - Fondateur & Architecte
- **Bolt** - Assistant Développement IA

---

**Version:** 3.1 Final
**Dernière mise à jour:** Janvier 2026
**Statut:** ✅ Production Ready
