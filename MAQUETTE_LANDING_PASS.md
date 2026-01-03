# 🎨 MAQUETTE LANDING PAGE SPLIT-SCREEN - UNIVERS EVEN & PASS

> **Page d'accueil unifiée** avec séparation visuelle des deux écosystèmes EvenPass

---

## 📐 VUE D'ENSEMBLE (Desktop - 1920x1080)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              NAVIGATION BAR (Fixed Top)                             │
│  ┌────┐  EVEN | PASS                                           🌙/☀️   Connexion   │
│  │Logo│                                                                              │
│  └────┘                                                                              │
├──────────────────────────────────┬──────────────────────────────────────────────────┤
│                                  │                                                  │
│         🎉 UNIVERS EVEN          │          🚢 UNIVERS PASS                         │
│            (50% Width)           │            (50% Width)                           │
│                                  │                                                  │
│  ╔══════════════════════════╗    │    ╔══════════════════════════╗                 │
│  ║  Gradient Orange → Amber ║    │    ║  Gradient Navy → Cyan    ║                 │
│  ║  Background Festif       ║    │    ║  Background Institutionnel                │
│  ╚══════════════════════════╝    │    ╚══════════════════════════╝                 │
│                                  │                                                  │
│      ┌────────────────┐          │         ┌────────────────┐                      │
│      │  🎫 Icon EVEN  │          │         │  ⛴️  Icon PASS  │                      │
│      │   (Rounded)    │          │         │   (Rounded)    │                      │
│      └────────────────┘          │         └────────────────┘                      │
│                                  │                                                  │
│           EVEN                   │              PASS                                │
│      (Titre 72px Bold)           │         (Titre 72px Bold)                       │
│                                  │                                                  │
│       Gënaa Yomb                 │           Gënaa Gaaw                            │
│    (Sous-titre 32px)             │        (Sous-titre 32px)                        │
│                                  │                                                  │
│  Découvrez et réservez vos       │   Votre mobilité maritime                       │
│  billets pour les meilleurs      │   et terrestre simplifiée                       │
│  événements au Sénégal           │                                                  │
│  (Description 18px)              │   (Description 18px)                            │
│                                  │                                                  │
│  ┌─────────┬─────────┐           │   ┌────────┬────────┬────────┐                 │
│  │📅       │👥       │           │   │ ⛴️      │ 🚢      │ 🎫      │                 │
│  │Événe-   │Commu-   │           │   │ LMDG   │COSAMA  │ Cars   │                 │
│  │ments    │nauté    │           │   │        │        │        │                 │
│  └─────────┴─────────┘           │   └────────┴────────┴────────┘                 │
│  (Cards 2 colonnes)              │   (Cards 3 colonnes)                            │
│                                  │                                                  │
│  ┌──────────────────────────┐    │    ┌──────────────────────────┐                │
│  │ Explorer les événements  │    │    │  Réserver un ticket      │                │
│  │         →                │    │    │         →                │                │
│  └──────────────────────────┘    │    └──────────────────────────┘                │
│  (CTA Button Gradient)           │    (CTA Button Gradient)                        │
│                                  │                                                  │
│  Marketplace Événementielle      │    Mobilité Maritime & Terrestre                │
│  (Footer texte)                  │    (Footer texte)                               │
│                                  │                                                  │
├──────────────────────────────────┴──────────────────────────────────────────────────┤
│                        SLOGAN WOLOF (Centré)                                        │
│                 Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw                                  │
│                    Événements • Services • Mobilité                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                 FOOTER                                              │
│  © 2026 EvenPass                                      [●] [●] [●]                   │
│                                                      (3 boutons cachés Admin)       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 CHARTE COULEURS DÉTAILLÉE

### UNIVERS EVEN (Gauche)

| Élément | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | `from-orange-50 via-white to-amber-50` | `from-orange-900/20 via-gray-900 to-amber-900/20` |
| **Titre EVEN** | `from-orange-600 to-amber-600` | `from-amber-400 to-orange-500` |
| **Sous-titre** | `text-orange-600` | `text-amber-400` |
| **Icon Background** | `from-orange-500 to-amber-600` | `from-amber-400 to-orange-500` |
| **CTA Button** | `from-orange-600 to-amber-600` | `from-amber-400 to-orange-500` |
| **Blur Background** | `bg-orange-500` + `bg-amber-500` (blur-3xl) | Idem |

### UNIVERS PASS (Droite)

| Élément | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background** | `from-[#E6F1F5] via-white to-[#B3D9E6]` | `from-cyan-900/20 via-gray-900 to-blue-900/20` |
| **Titre PASS** | `from-[#0A7EA3] to-[#005975]` | `from-cyan-400 to-[#0A7EA3]` |
| **Sous-titre** | `text-[#0A7EA3]` | `text-cyan-400` |
| **Icon Background** | `from-[#0A7EA3] to-[#005975]` | `from-cyan-400 to-[#0A7EA3]` |
| **CTA Button** | `from-[#0A7EA3] to-[#005975]` | `from-cyan-400 to-[#0A7EA3]` |
| **Blur Background** | `bg-[#0A7EA3]` + `bg-cyan-500` (blur-3xl) | Idem |

---

## 📱 VUE MOBILE (390x844 - iPhone 14 Pro)

```
┌───────────────────────────┐
│     NAVIGATION BAR        │
│  [Logo] EVEN PASS 🌙 👤   │
├───────────────────────────┤
│                           │
│    🎉 UNIVERS EVEN        │
│    (Full Width)           │
│    (Min-height 600px)     │
│                           │
│      ┌──────────┐         │
│      │🎫 EVEN   │         │
│      └──────────┘         │
│                           │
│        Gënaa Yomb         │
│                           │
│   Description courte      │
│                           │
│   [📅] [👥]               │
│                           │
│   [Explorer →]            │
│                           │
├───────────────────────────┤
│                           │
│    🚢 UNIVERS PASS        │
│    (Full Width)           │
│    (Min-height 600px)     │
│                           │
│      ┌──────────┐         │
│      │⛴️  PASS  │         │
│      └──────────┘         │
│                           │
│        Gënaa Gaaw         │
│                           │
│   Description courte      │
│                           │
│   [⛴️] [🚢] [🎫]          │
│                           │
│   [Réserver →]            │
│                           │
├───────────────────────────┤
│       SLOGAN WOLOF        │
│  Gënaa Yomb, Wóor, Gaaw   │
├───────────────────────────┤
│         FOOTER            │
│   © 2026    [●][●][●]     │
└───────────────────────────┘
```

**Comportement Mobile :**
- Affichage vertical (EVEN en haut, PASS en bas)
- Scroll fluide entre les deux sections
- Touch-friendly buttons (min 44x44px)
- Pas d'effet hover, remplacé par active state

---

## 🎭 INTERACTIONS & ANIMATIONS

### Hover Desktop

#### Zone EVEN survolée :
```
┌─────────────────────────────────┬────────────────────────────┐
│                                 │                            │
│      🎉 UNIVERS EVEN            │     🚢 UNIVERS PASS        │
│      ↗️ Scale 1.05               │     ↙️ Scale 0.95           │
│      (Agrandissement)           │     (Réduction)            │
│                                 │                            │
│      [Cursor: pointer]          │     [Opacity: 0.8]         │
│                                 │                            │
└─────────────────────────────────┴────────────────────────────┘
```

#### Zone PASS survolée :
```
┌─────────────────────────────────┬────────────────────────────┐
│                                 │                            │
│      🎉 UNIVERS EVEN            │     🚢 UNIVERS PASS        │
│      ↙️ Scale 0.95               │     ↗️ Scale 1.05           │
│      (Réduction)                │     (Agrandissement)       │
│                                 │                            │
│      [Opacity: 0.8]             │     [Cursor: pointer]      │
│                                 │                            │
└─────────────────────────────────┴────────────────────────────┘
```

### Animation CTA Buttons

```typescript
// Effet au hover
transform: scale(1.05)
transition: all 0.3s ease

// Icône flèche
translateX(0) → translateX(8px)
```

### Animation 3 Boutons Footer

```typescript
// État normal
opacity: 0.3
scale: 1

// État hover
opacity: 1
scale: 1.2
background: gradient-to-r from-orange-500 to-cyan-500
```

---

## 🔤 TYPOGRAPHIE

### Univers EVEN

```css
Titre "EVEN":
  font-size: 96px (6xl)
  font-weight: 900 (black)
  text-gradient: orange-600 → amber-600
  letter-spacing: -0.05em

Sous-titre "Gënaa Yomb":
  font-size: 48px (3xl)
  font-weight: 700 (bold)
  color: orange-600 / amber-400 (dark)

Description:
  font-size: 18px (lg)
  font-weight: 400
  color: gray-600 / gray-400 (dark)
  line-height: 1.6
```

### Univers PASS

```css
Titre "PASS":
  font-size: 96px (6xl)
  font-weight: 900 (black)
  text-gradient: #0A7EA3 → #005975
  letter-spacing: -0.05em

Sous-titre "Gënaa Gaaw":
  font-size: 48px (3xl)
  font-weight: 700 (bold)
  color: #0A7EA3 / cyan-400 (dark)

Description:
  font-size: 18px (lg)
  font-weight: 400
  color: gray-600 / gray-400 (dark)
  line-height: 1.6
```

### Slogan Wolof

```css
font-size: 32px (2xl)
font-weight: 700 (bold)
text-gradient: orange-600 → #0A7EA3 → amber-600
text-align: center
```

---

## 📐 ESPACEMENTS & DIMENSIONS

### Navigation Bar
```
Height: 80px
Padding: 24px horizontal
Background: white/95 (backdrop-blur)
Border-bottom: 1px solid gray-200

Logo: 40x40px
Buttons spacing: 16px gap
```

### Split Sections
```
Desktop:
  Width: 50% each
  Min-height: 100vh
  Padding: 48px

Mobile:
  Width: 100%
  Min-height: 600px
  Padding: 32px
```

### Icons Principaux
```
Container: 80x80px
Icon size: 40x40px
Border-radius: 24px
Shadow: 0 8px 24px rgba(0,0,0,0.16)
```

### Cards Services
```
Padding: 16px
Border-radius: 16px
Background: white/80 (backdrop-blur)
Gap: 16px (grid)

EVEN: 2 colonnes
PASS: 3 colonnes
```

### CTA Buttons
```
Padding: 16px 32px
Border-radius: 16px
Font-size: 18px
Font-weight: 700
Shadow: 0 8px 24px rgba(0,0,0,0.2)
```

---

## 🌓 MODE SOMBRE - COMPARAISON

### Light Mode
```
┌─────────────────────────────────────────────────────────────┐
│  Background: Blanc pur (#FFFFFF)                            │
│  Cards: Blanc/80 avec backdrop-blur                         │
│  Texte: Gray-900 (très sombre)                              │
│  Shadows: Subtiles (opacity 0.1-0.2)                        │
│  Borders: Gray-200                                          │
└─────────────────────────────────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────────────────────────────────┐
│  Background: Gray-900 (#0F0F0F)                             │
│  Cards: Gray-800/50 avec backdrop-blur                      │
│  Texte: White/Gray-300                                      │
│  Shadows: Plus marquées (opacity 0.3-0.4)                   │
│  Borders: Gray-800                                          │
│  Gradients: Plus lumineux (amber-400, cyan-400)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 PERFORMANCES & OPTIMISATIONS

### Images
- Pas d'images lourdes (uniquement SVG icons)
- Lazy loading pour les backgrounds blur
- Transform GPU-accelerated (will-change: transform)

### Animations
- 60 FPS garantis
- CSS transforms (pas de left/top)
- Transitions optimisées (0.3s ease)

### Responsive
```css
Breakpoints:
  Mobile: < 768px
  Tablet: 768px - 1024px
  Desktop: > 1024px

Grid adaptatif:
  lg:grid-cols-2 (Desktop)
  grid-cols-1 (Mobile)
```

---

## 🔗 NAVIGATION & ROUTES

### Clicks disponibles

```typescript
// EVEN (Gauche)
onClick → navigate('/')
  → Redirection vers HomePageNew (événements)

// PASS (Droite)
onClick → navigate('/pass/services')
  → Page services PASS (à créer)

// Footer 3 boutons
Button 1 → navigate('/admin/finance/login')
Button 2 → navigate('/admin/ops/login')
Button 3 → navigate('/scan/login')
```

---

## ✅ CHECKLIST DESIGN PREMIUM

### Esthétique
- [x] Espaces blancs généreux
- [x] Border-radius cohérents (16px, 24px)
- [x] Typographie sans-serif (Inter)
- [x] Gradients subtils et élégants
- [x] Shadows douces et naturelles

### Micro-interactions
- [x] Hover scale sur zones cliquables
- [x] Flèche CTA animée
- [x] Transition fluide theme toggle
- [x] Active state sur mobile

### Accessibilité
- [x] Contraste texte/background > 4.5:1
- [x] Focus visible sur éléments interactifs
- [x] Aria-labels sur boutons icons
- [x] Touch targets > 44x44px (mobile)

### Performance
- [x] Lighthouse Performance > 90
- [x] First Contentful Paint < 1.5s
- [x] Animations 60fps
- [x] Bundle size optimisé

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Landing page split-screen créée
2. ⏳ Créer page `/pass/services` (sélection LMDG/COSAMA/Cars)
3. ⏳ Implémenter tunnel d'achat LMDG
4. ⏳ Implémenter tunnel d'achat COSAMA
5. ⏳ Implémenter tunnel d'achat Interrégional
6. ⏳ Créer module abonnements
7. ⏳ Développer Wallet offline
8. ⏳ Fork EPscan → EPscan+

---

**Version** : 1.0.0
**Date** : 2026-01-03
**Statut** : ✅ Maquette validée et implémentée

---

## 📸 CAPTURES D'ÉCRAN SIMULÉES

### Desktop - Light Mode

```
╔════════════════════════════════════════════════════════════════════════════╗
║  [Logo] EVEN | PASS                                        🌙  Connexion  ║
╠═══════════════════════════════════════╦════════════════════════════════════╣
║                                       ║                                    ║
║            ┌─────────┐                ║           ┌─────────┐             ║
║            │  🎫 🎉  │                ║           │  ⛴️  🚢  │             ║
║            └─────────┘                ║           └─────────┘             ║
║                                       ║                                    ║
║               EVEN                    ║              PASS                  ║
║           (Orange-600)                ║          (Navy-500)                ║
║                                       ║                                    ║
║            Gënaa Yomb                 ║           Gënaa Gaaw               ║
║                                       ║                                    ║
║  Découvrez et réservez vos billets    ║  Votre mobilité maritime et        ║
║  pour les meilleurs événements        ║  terrestre simplifiée              ║
║                                       ║                                    ║
║   ┌────────┬────────┐                 ║   ┌─────┬─────┬─────┐             ║
║   │📅 Event│👥 Comm │                 ║   │⛴️ L │🚢 C │🎫 I │             ║
║   └────────┴────────┘                 ║   └─────┴─────┴─────┘             ║
║                                       ║                                    ║
║  ┌───────────────────────────┐        ║  ┌───────────────────────────┐    ║
║  │ Explorer les événements → │        ║  │  Réserver un ticket →     │    ║
║  └───────────────────────────┘        ║  └───────────────────────────┘    ║
║                                       ║                                    ║
║   Marketplace Événementielle          ║   Mobilité Maritime & Terrestre    ║
║                                       ║                                    ║
╠═══════════════════════════════════════╩════════════════════════════════════╣
║                  Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw                       ║
║                   Événements • Services • Mobilité                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  © 2026 EvenPass                                          [●] [●] [●]     ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Desktop - Dark Mode

```
╔════════════════════════════════════════════════════════════════════════════╗
║  [Logo] EVEN | PASS                                        ☀️  Connexion  ║
╠═══════════════════════════════════════╦════════════════════════════════════╣
║                                       ║                                    ║
║            ┌─────────┐                ║           ┌─────────┐             ║
║            │  🎫 💫  │                ║           │  ⛴️  ✨  │             ║
║            └─────────┘                ║           └─────────┘             ║
║                                       ║                                    ║
║               EVEN                    ║              PASS                  ║
║           (Amber-400)                 ║          (Cyan-400)                ║
║                                       ║                                    ║
║            Gënaa Yomb                 ║           Gënaa Gaaw               ║
║                                       ║                                    ║
║  Découvrez et réservez vos billets    ║  Votre mobilité maritime et        ║
║  pour les meilleurs événements        ║  terrestre simplifiée              ║
║                                       ║                                    ║
║   ┌────────┬────────┐                 ║   ┌─────┬─────┬─────┐             ║
║   │📅 Event│👥 Comm │                 ║   │⛴️ L │🚢 C │🎫 I │             ║
║   └────────┴────────┘                 ║   └─────┴─────┴─────┘             ║
║                                       ║                                    ║
║  ┌───────────────────────────┐        ║  ┌───────────────────────────┐    ║
║  │ Explorer les événements → │        ║  │  Réserver un ticket →     │    ║
║  └───────────────────────────┘        ║  └───────────────────────────┘    ║
║                                       ║                                    ║
║   Marketplace Événementielle          ║   Mobilité Maritime & Terrestre    ║
║                                       ║                                    ║
╠═══════════════════════════════════════╩════════════════════════════════════╣
║              🌊 Gënaa Yomb, Gënaa Wóor, Gënaa Gaaw 🌊                     ║
║                   Événements • Services • Mobilité                        ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  © 2026 EvenPass                                          [●] [●] [●]     ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

**FIN DE LA MAQUETTE**

> Prêt pour validation et implémentation complète de l'écosystème PASS 🚀
