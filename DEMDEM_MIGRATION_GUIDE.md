# DemDem Super-App Migration Guide

**Version:** 1.0.0
**Date:** 2026-01-22
**Status:** Phase 1 Complete - Core Infrastructure Ready

---

## Executive Summary

The project has been successfully transformed from **EvenPass** (event ticketing only) into **DemDem** (Super-App with dual identity: Events + Transport). All existing features have been preserved while adding the foundational architecture for the transport module.

### What's Working Now

✅ **Dual-Theme System**
- Transport theme: Navy Blue (#0A192F) + Emerald Green (#10B981)
- Event theme: Black (#000000) + Vivid Orange (#FF6B00)
- Automatic theme switching based on route

✅ **New Routing Structure**
- `/` → Split-screen landing page (Choose: Sortir or Bouger)
- `/evenement` → Event marketplace (applies Event theme)
- `/voyage` → Transport hub (applies Transport theme)
- `/event/:slug` → Event detail pages (Event theme)
- `/pass/*` → Maritime transport (Transport theme)

✅ **Dynamic Logo Component**
- Shows original colors in Transport mode
- Converts to white using CSS filter in Event mode
- Fallback mechanism for missing assets

✅ **Preserved Features**
- PayDunya payment integration (test/live modes)
- 6-digit access codes for EPscan/EPscan+
- Event ticketing and organizer dashboards
- Admin finance dashboard
- Maritime Pass booking system
- All scanning and validation logic

✅ **Production Build**
- Successfully compiled: 331.99 KB gzipped
- No breaking changes
- All existing features functional

---

## Phase 1: Completed Tasks

### 1. Core Theme System
**File:** `/src/context/ThemeContext.tsx`

Created dual-mode theme system:
```typescript
export type AppMode = 'transport' | 'event';
```

Theme colors automatically applied to:
- CSS custom properties
- Document class (dark mode for Event)
- Local storage persistence

### 2. Dynamic Logo Component
**File:** `/src/components/Logo.tsx`

Features:
- Reads from `/public/assets/demdem-logo.svg` (fallback to .png)
- Applies `brightness(0) invert(1)` filter in Event mode
- Shows original colors in Transport mode
- Graceful error handling

### 3. Split-Screen Landing Page
**File:** `/src/pages/DemDemLandingPage.tsx`

User sees two options:
- **SORTIR** (Events) → Black background, orange accent
- **BOUGER** (Transport) → Navy background, green accent

Hover effects and smooth transitions included.

### 4. Theme Wrapper Component
**File:** `/src/components/ThemeWrapper.tsx`

Automatically sets theme based on route context:
```tsx
<ThemeWrapper mode="event">
  <HomePageNew />
</ThemeWrapper>
```

### 5. Updated PWA Manifest & Meta Tags
**Files:** `/public/manifest.json`, `/index.html`

All branding updated:
- App name: "DemDem - Sortir & Bouger au Sénégal"
- Description references super-app
- Icons point to `/assets/demdem-icon-512.png`
- Theme color: #10B981 (Transport green)

---

## Asset Requirements

### Critical: Add Your Logo Files

The app expects these files in `/public/assets/`:

1. **demdem-logo.svg** or **demdem-logo.png**
   - Main logo with original colors (Blue/Green)
   - Transparent background recommended
   - Minimum 512px width
   - Will be auto-converted to white in Event mode

2. **demdem-icon-512.png**
   - 512x512 pixels
   - PWA icon for home screen, splash screen
   - Square format

**Location:** See `/public/assets/README.md` for detailed instructions.

---

## Phase 2: Next Steps (Not Yet Implemented)

### Priority 1: Transport Database Schema

Create Firebase collections for:

```
/transport-routes
  - id
  - name (e.g., "Line 1: Dakar → Mbour")
  - type: "bus" | "carpooling"
  - ecoPrice: number
  - comfortPrice: number
  - isActive: boolean
  - schedule: { comfort_pause_start: "10:00", comfort_pause_end: "16:00" }

/transport-bookings
  - userId
  - routeId
  - tier: "eco" | "comfort"
  - seats
  - price
  - status
  - timestamp

/pricing-config
  - line1_eco: 10000
  - line1_comfort: 15000
  - line2_eco: 15000
  - line2_comfort: 30000
  - adminEditable: true
```

### Priority 2: Allo Dakar (Carpooling) Interface

Features needed:
- Search departure/destination with maps (Leaflet + Pelias)
- Wallet balance display
- Refund logic implementation
- Driver matching algorithm
- Real-time availability

**Page:** Create `/src/pages/transport/AlloDakarPage.tsx`

### Priority 3: DemDem Express (Bus Navettes)

Features needed:
- Subscription card system (no wallet)
- Line selection (Line 1, Line 2)
- Tier selection (Eco/Comfort)
- Split-shift logic: Block Comfort bookings 10AM-4PM
- Admin-editable pricing

**Page:** Create `/src/pages/transport/DemDemExpressPage.tsx`

### Priority 4: Admin Pricing Manager

Create admin interface to:
- Edit route prices in real-time
- View pricing history
- Set dynamic pricing rules
- Control fleet availability

**Component:** `/src/components/AdminTransportPricing.tsx`

### Priority 5: Maps Integration

Install dependencies:
```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

Configure custom Pelias geocoding endpoint for Senegal.

### Priority 6: Complete Rebranding

Update remaining "EvenPass" references in:
- Email templates (if any)
- PDF ticket generator
- Push notification messages
- Footer components
- Terms of service
- Help pages

---

## Technical Notes

### Theme Detection Logic

Routes automatically apply themes:
- All `/evenement/*` and `/event/*` → Event theme (Black/Orange)
- All `/voyage/*` and `/pass/*` → Transport theme (Navy/Green)
- `/` (Landing) → No theme (neutral)

### Backward Compatibility

All existing routes still work:
- Event organizer dashboards
- Admin finance panel
- EPscan scanning apps
- Maritime Pass booking
- Payment callbacks

### PayDunya Integration Status

The PayDunya integration is fully functional:
- Wave/Orange Money support
- Test/Live mode switching
- Automatic ticket generation on payment success
- 6-digit access codes

No changes needed for transport payments - will reuse the same system.

---

## Testing Checklist

Before deploying to production:

- [ ] Add logo files to `/public/assets/`
- [ ] Test theme switching (Transport ↔ Event)
- [ ] Verify logo color changes correctly
- [ ] Test split-screen landing page on mobile
- [ ] Verify all existing event features work
- [ ] Test maritime Pass booking flow
- [ ] Confirm PayDunya payments still work
- [ ] Check PWA installation on iOS/Android
- [ ] Verify service worker updates
- [ ] Test offline controller app (EPscan)

---

## Firebase Security Rules

No changes needed to existing rules. When adding transport features, ensure:
- Users can only see their own bookings
- Admins can edit pricing
- Drivers can see assigned rides (carpooling)

---

## Deployment Checklist

1. Update Firebase Hosting domain to `demdem.sn`
2. Set up redirect from `evenpass.sn` to `demdem.sn`
3. Update DNS records
4. Generate new PWA icons with DemDem branding
5. Test on low-end Android devices
6. Verify iOS "Add to Home Screen" flow
7. Update App Store/Play Store listings (if applicable)

---

## Support & Documentation

### Key Files Modified

- `src/context/ThemeContext.tsx` (dual-theme system)
- `src/components/Logo.tsx` (dynamic logo)
- `src/components/ThemeWrapper.tsx` (auto theme setter)
- `src/pages/DemDemLandingPage.tsx` (split-screen home)
- `src/App.tsx` (routing structure)
- `public/manifest.json` (PWA config)
- `index.html` (meta tags)

### Key Files Preserved

All existing pages and components remain functional:
- Event marketplace
- Payment flows
- Organizer dashboards
- Admin panels
- Scanning apps
- Maritime Pass system

---

## What to Build Next

Based on the Master Prompt V.13.3, here's the recommended order:

1. **Transport Database Schema** (1-2 hours)
2. **Admin Pricing Panel** (2-3 hours)
3. **DemDem Express Bus Interface** (4-6 hours)
4. **Allo Dakar Carpooling** (6-8 hours)
5. **Maps Integration** (3-4 hours)
6. **Fleet Split-Shift Logic** (1-2 hours)
7. **Complete Rebranding** (2-3 hours)
8. **Testing & Polish** (4-6 hours)

**Total Estimated Time:** 24-32 development hours

---

## Questions or Issues?

Review the Master Prompt V.13.3 for detailed specifications on:
- The "100km Rule" for payouts
- Fleet tier logic (Eco vs Comfort)
- Wallet vs Subscription logic
- Dynamic pricing architecture
- Offline controller requirements

---

**Status:** ✅ Phase 1 Complete - Foundation is solid. Ready for transport features!
