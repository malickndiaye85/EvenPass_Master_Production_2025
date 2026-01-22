# 🇸🇳 DemDem - La Super-App Sénégalaise

**Version:** 1.0.0 (Phase 1 Complete)
**Build Status:** ✅ Production Ready (331.99 KB gzipped)
**Last Updated:** 2026-01-22

---

## What is DemDem?

DemDem is a revolutionary Super-App for Senegal that unifies **events** and **transport** into one seamless experience.

### Dual Identity

1. **"Dem Event" (Sortir)** - Black + Orange Theme
   - Event ticketing & discovery
   - Concerts, festivals, spectacles
   - Organizer dashboards
   - PayDunya payment integration

2. **"Dem Voyage" (Bouger)** - Navy + Green Theme
   - Allo Dakar (Carpooling)
   - DemDem Express (Bus navettes)
   - Pass Maritime (Boat transport)
   - Maps & route planning

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Firebase project configured
- PayDunya merchant account (for payments)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## 📁 Project Structure

```
demdem/
├── src/
│   ├── components/
│   │   ├── Logo.tsx              # Dynamic logo (white in Event mode)
│   │   ├── ThemeWrapper.tsx      # Auto theme switcher
│   │   └── ...
│   ├── context/
│   │   ├── ThemeContext.tsx      # Dual-theme system
│   │   └── FirebaseAuthContext.tsx
│   ├── pages/
│   │   ├── DemDemLandingPage.tsx # Split-screen home
│   │   ├── HomePageNew.tsx       # Event marketplace
│   │   └── pass/                 # Maritime transport
│   └── App.tsx                   # Routing
├── public/
│   ├── assets/
│   │   ├── demdem-logo.svg       # YOUR LOGO HERE
│   │   ├── demdem-icon-512.png   # YOUR ICON HERE
│   │   └── README.md             # Logo requirements
│   └── manifest.json             # PWA config
└── DEMDEM_MIGRATION_GUIDE.md     # Full migration docs
```

---

## 🎨 Branding & Themes

### Transport Theme (Navy + Green)
```css
--color-primary: #0A192F    /* Deep Navy Blue */
--color-secondary: #10B981  /* Emerald Green */
--color-background: #F8FAFC /* Light Gray */
```

### Event Theme (Black + Orange)
```css
--color-primary: #000000    /* Pure Black */
--color-secondary: #FF6B00  /* Vivid Orange */
--color-background: #000000 /* Black */
```

### Logo Behavior
- **Transport Mode:** Original colors (Blue/Green)
- **Event Mode:** Auto-converted to WHITE using CSS filter

---

## 🛣️ Routing Structure

| Route | Component | Theme | Description |
|-------|-----------|-------|-------------|
| `/` | `DemDemLandingPage` | Neutral | Split-screen choice |
| `/evenement` | `HomePageNew` | Event | Event marketplace |
| `/event/:slug` | `EventDetailPage` | Event | Event details |
| `/voyage` | `PassLandingPage` | Transport | Transport hub |
| `/pass/*` | Maritime pages | Transport | Boat booking |

---

## ✅ What's Working Now

### Fully Functional Features

✅ **Dual-Theme System**
- Automatic theme switching based on route
- CSS custom properties for easy styling
- Dark mode support for Event theme

✅ **Event Ticketing** (from EvenPass)
- Event discovery and detail pages
- PayDunya payment integration (Wave, Orange Money)
- 6-digit access codes for validation
- PDF/Image ticket generation
- Organizer dashboards
- Admin finance panel

✅ **Maritime Transport** (from EvenPass Pass)
- LMDG booking (Dakar ↔ Gorée)
- COSAMA routes
- Interregional routes
- Subscription management
- Commandant/Boarding/Commercial dashboards

✅ **Scanning Apps** (EPscan/EPscan+)
- Online validation for events
- Offline capability for transport
- iOS compatibility (NoSleep.js)
- Multi-role access

✅ **PWA Features**
- Service Worker
- Offline support
- Add to Home Screen
- Push notifications ready

---

## 🚧 What's Next (Phase 2)

### Priority Features to Build

1. **Transport Database Schema** 📊
   - Create Firebase collections for routes, bookings, pricing
   - See: `TRANSPORT_TYPES_REFERENCE.md`

2. **Allo Dakar (Carpooling)** 🚗
   - Driver-passenger matching
   - Wallet & refund logic
   - Real-time GPS tracking
   - Maps integration (Leaflet + Pelias)

3. **DemDem Express (Bus)** 🚌
   - Fixed route booking
   - Subscription cards (daily/weekly/monthly)
   - Split-shift logic (Comfort paused 10AM-4PM)
   - Eco vs Comfort tiers

4. **Admin Pricing Manager** 💰
   - Live price editing
   - Route pricing controls
   - Price history tracking
   - Admin audit log

5. **Maps Integration** 🗺️
   - Leaflet maps
   - Custom Pelias geocoding (VPS-hosted)
   - Route visualization
   - Stop markers

---

## 🔧 Configuration

### Environment Variables

Required in `.env`:

```bash
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# PayDunya
VITE_PAYDUNYA_MODE=test|live
VITE_PAYDUNYA_MASTER_KEY=...
VITE_PAYDUNYA_PRIVATE_KEY=...
VITE_PAYDUNYA_PUBLIC_KEY=...
VITE_PAYDUNYA_TOKEN=...

# Optional: Custom Pelias (Maps)
VITE_PELIAS_URL=https://your-pelias.com
```

### Firebase Collections

**Existing (Events):**
- `events` - Event listings
- `tickets` - Purchased tickets
- `organizers` - Organizer accounts
- `access-codes` - 6-digit validation codes
- `payouts` - Financial transactions

**To Create (Transport):**
- `transport-routes` - Bus/carpool routes
- `transport-bookings` - User bookings
- `carpools` - Ride listings
- `user-wallets` - Wallet balances
- `pricing-config` - Admin-editable prices
- `bus-subscriptions` - Monthly/weekly passes

---

## 📱 PWA Configuration

### Icons Required

Place in `/public/assets/`:

1. `demdem-icon-512.png` (512x512)
2. `demdem-logo.svg` or `.png` (any size)

### Manifest

The app name, colors, and branding are configured in:
- `/public/manifest.json`
- `/index.html` (meta tags)

### Service Worker

Auto-registers in `/sw.js`. Handles:
- Offline caching
- Background sync
- Push notifications

---

## 🔐 Security

### Firebase Rules

Events are protected by:
- Organizer ownership checks
- Admin role verification
- User authentication

Transport will need:
- Driver verification
- Route access controls
- Admin-only pricing edits

### Payment Security

- PayDunya handles all sensitive payment data
- No credit card info stored locally
- Webhooks for payment verification
- Automatic refund processing

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| `DEMDEM_MIGRATION_GUIDE.md` | Complete migration from EvenPass to DemDem |
| `TRANSPORT_TYPES_REFERENCE.md` | Database schemas, business logic, types |
| `README_DEMDEM.md` | This file - quick reference |
| `/public/assets/README.md` | Logo placement instructions |

---

## 🚀 Deployment

### Firebase Hosting

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

### Domain Setup

1. Point `demdem.sn` to Firebase Hosting
2. Set up redirect from `evenpass.sn` → `demdem.sn`
3. Update PayDunya webhook URLs
4. Configure DNS records

### Pre-Deploy Checklist

- [ ] Add logo files to `/public/assets/`
- [ ] Test all themes on mobile
- [ ] Verify PayDunya test mode works
- [ ] Check PWA installation flow
- [ ] Test offline mode (EPscan)
- [ ] Update Firebase security rules
- [ ] Configure custom domain
- [ ] Test on low-end Android devices
- [ ] Verify iOS compatibility

---

## 🧪 Testing

### Manual Testing

1. **Landing Page**
   - Visit `/` and verify split-screen
   - Click "SORTIR" → should go to events (black theme)
   - Click "BOUGER" → should go to transport (navy theme)

2. **Theme Switching**
   - Navigate between `/evenement` and `/voyage`
   - Logo should change color automatically
   - Background colors should transition

3. **Existing Features**
   - Browse events at `/evenement`
   - Test event booking flow
   - Verify PayDunya payment (test mode)
   - Check ticket generation
   - Test maritime Pass booking

### Browser Compatibility

- Chrome/Edge (Chromium)
- Safari (iOS + macOS)
- Firefox
- Samsung Internet (Android)

---

## 👥 User Roles

### Event Side (Dem Event)

- **Guest** - Browse events, buy tickets
- **User** - Registered, can track purchases
- **Organizer** - Create events, manage sales
- **Admin** - Full access, financial oversight

### Transport Side (Dem Voyage)

- **Passenger** - Book rides, manage wallet/subscriptions
- **Driver** - Offer carpools, receive payouts (Allo Dakar)
- **Controller** - Scan tickets on buses/boats
- **Ops Manager** - Fleet management, route oversight
- **Admin** - Pricing, payouts, system config

---

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Lucide React (icons)

### Backend
- Firebase Auth (user management)
- Firestore (database)
- Firebase Storage (media)
- Firebase Functions (serverless)
- Firebase Hosting (deployment)

### Payments
- PayDunya API (Wave, Orange Money)

### Maps (To Integrate)
- Leaflet (map display)
- Custom Pelias (geocoding)

### PWA
- Service Workers
- Workbox (caching)
- NoSleep.js (iOS wake lock)

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Logo Not Showing

Check:
1. File exists at `/public/assets/demdem-logo.svg`
2. Or fallback at `/public/assets/demdem-logo.png`
3. Console for 404 errors

### Theme Not Switching

- Check route is wrapped in `<ThemeWrapper mode="...">`
- Verify `ThemeContext` is provided in `App.tsx`
- Clear localStorage and refresh

### PayDunya Fails

- Verify test/live mode in `.env`
- Check API keys are correct
- Test webhook URL is accessible
- Review Firebase Functions logs

---

## 📞 Support

For issues related to:
- **Firebase:** Check Firebase Console logs
- **PayDunya:** Contact PayDunya support
- **Maps:** Verify Pelias endpoint
- **General:** Review `DEMDEM_MIGRATION_GUIDE.md`

---

## 📜 License

Proprietary - DemDem SN © 2026

---

## 🎯 Vision

DemDem is building the ultimate Senegalese Super-App. One app for everything:
- **Sortir** (Go Out) - Events, entertainment, culture
- **Bouger** (Move) - Transport, travel, mobility

**Mission:** Make it easy for Senegalese people to discover, experience, and move through their country with confidence.

**Tagline:** *Une seule app pour tout* 🇸🇳

---

**Status:** Phase 1 Complete ✅
**Next:** Build Transport Features 🚀
**Estimated Time to MVP:** 24-32 hours

Let's move Senegal forward, one click at a time.
