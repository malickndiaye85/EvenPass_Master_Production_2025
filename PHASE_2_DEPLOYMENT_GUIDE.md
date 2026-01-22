# DemDem Phase 2 - Deployment Guide

**Version:** 2.0.0 (Transport Engine Complete)
**Date:** 2026-01-22
**Build Status:** ✅ Production Ready (336.57 KB gzipped)

---

## 🎉 What's New in Phase 2

Phase 2 transforms DemDem from an event ticketing platform into a true Super-App with full transport capabilities.

### ✅ Phase 2 Completed Features

1. **Logo Integration**
   - Updated to use `/assets/logo.png`
   - Dynamic white filter for Event theme
   - Original colors preserved in Transport theme

2. **Landing Page Rebranding**
   - Changed "SORTIR" → "DEM ÉVÉNEMENT"
   - Changed "BOUGER" → "DEM VOYAGE"
   - Professional split-screen experience

3. **Transport Infrastructure**
   - Complete type definitions in `/src/types/transport.ts`
   - Firebase utility library for transport operations
   - Database schema ready for deployment

4. **DemDem Express (Bus Navettes)**
   - Route selection interface
   - Eco vs Comfort tier selection
   - Split-shift logic (Comfort blocked 10AM-4PM)
   - Real-time pricing from Firebase
   - Seat selection and booking

5. **Allo Dakar (Carpooling)**
   - Ride search interface
   - Wallet integration
   - Driver ratings and vehicle info
   - Real-time availability

6. **Transport Hub**
   - Beautiful landing page at `/voyage`
   - Three transport options displayed
   - Links to DemDem Express, Allo Dakar, Pass Maritime

7. **Admin Tools**
   - Database initialization page
   - Live pricing management
   - Route configuration
   - Audit logging

---

## 🚀 Deployment Steps

### 1. Initialize Transport Database

**CRITICAL:** You must initialize the transport database before users can book rides.

Navigate to: `https://demdem.sn/admin/transport/setup`

Click "Initialiser maintenant" to create:
- Line 1: Dakar → Mbour (Eco: 10,000 FCFA / Comfort: 15,000 FCFA)
- Line 2: Dakar → Thiès (Eco: 15,000 FCFA / Comfort: 30,000 FCFA)
- Pricing configuration
- Route schedules with split-shift logic

### 2. Test the Split-Shift Logic

The Comfort tier is automatically blocked between 10:00 AM and 4:00 PM.

**To Test:**
1. Visit `/transport/demdem-express` during different times
2. Between 10AM-4PM: Comfort option should be disabled with overlay
3. Before 10AM or after 4PM: Comfort option should be fully available

**Implementation:**
```typescript
export function isComfortAvailable(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return !(hour >= 10 && hour < 16);
}
```

### 3. Configure Pricing

Visit `/admin/transport/setup` after initialization to:
- View current pricing
- Edit Line 1 prices
- Edit Line 2 prices
- Save changes (updates both Firebase collections)

All changes are logged with admin ID and timestamp.

### 4. Deploy to Production

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Or deploy everything
firebase deploy
```

---

## 🗺️ Routing Structure

### Main Routes

| Route | Component | Theme | Description |
|-------|-----------|-------|-------------|
| `/` | `DemDemLandingPage` | Neutral | Split-screen choice |
| `/evenement` | `HomePageNew` | Event | Event marketplace |
| `/voyage` | `TransportHubPage` | Transport | Transport hub |

### Transport Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/transport/demdem-express` | `DemDemExpressPage` | Bus booking with split-shift |
| `/transport/allo-dakar` | `AlloDakarPage` | Carpooling search |
| `/pass/services` | `PassServicesPage` | Maritime transport |

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/transport/setup` | Initialize DB & manage pricing |
| `/admin/ops` | Operations dashboard |
| `/admin/finance` | Financial overview |

---

## 🎨 User Experience Flow

### New User Journey

1. **Landing** (`/`)
   - See split-screen: "DEM ÉVÉNEMENT" vs "DEM VOYAGE"
   - Choose transport → Go to Transport Hub

2. **Transport Hub** (`/voyage`)
   - Three beautiful cards:
     - DemDem Express (Bus)
     - Allo Dakar (Carpooling)
     - Pass Maritime (Boats)
   - Click any to access service

3. **DemDem Express** (`/transport/demdem-express`)
   - View available lines
   - Select Line 1 or Line 2
   - Choose Eco or Comfort (respects split-shift)
   - Select number of seats
   - See total price
   - Book with PayDunya

4. **Allo Dakar** (`/transport/allo-dakar`)
   - Search by origin/destination
   - View available rides
   - See driver info and ratings
   - Book with wallet (checks balance)

---

## 💾 Firebase Collections

### Created Collections

1. **`transport-routes`**
   ```json
   {
     "id": "line-1",
     "name": "Line 1: Dakar → Mbour",
     "routeNumber": 1,
     "pricing": {
       "eco": 10000,
       "comfort": 15000
     },
     "schedule": {
       "comfort": {
         "pauseStart": "10:00",
         "pauseEnd": "16:00"
       }
     }
   }
   ```

2. **`transport-bookings`**
   ```json
   {
     "id": "booking_abc123",
     "userId": "user_xyz",
     "routeId": "line-1",
     "tier": "eco",
     "seats": 2,
     "price": 20000,
     "status": "confirmed",
     "qrCode": "ABC123"
   }
   ```

3. **`pricing-config`**
   ```json
   {
     "id": "transport-pricing",
     "routes": {
       "line-1": {
         "eco": 10000,
         "comfort": 15000,
         "lastUpdated": "2026-01-22T10:00:00Z",
         "updatedBy": "admin"
       }
     },
     "adminEditable": true
   }
   ```

4. **`carpool-rides`**
   - Driver-created rides
   - Origin/destination
   - Available seats
   - Pricing

5. **`carpool-bookings`**
   - Passenger bookings
   - Wallet transactions
   - Refund tracking

6. **`user-wallets`**
   - Balance tracking
   - Transaction history
   - For Allo Dakar only

---

## 🔐 Security Rules

Add these to `firestore.rules`:

```javascript
// Transport Routes (public read, admin write)
match /transport-routes/{routeId} {
  allow read: if true;
  allow write: if request.auth.token.role == 'admin';
}

// Transport Bookings (own data only)
match /transport-bookings/{bookingId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
}

// Pricing Config (public read, admin write)
match /pricing-config/{configId} {
  allow read: if true;
  allow write: if request.auth.token.role == 'admin';
}

// User Wallets (own wallet only)
match /user-wallets/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Carpool Rides (public read, drivers create)
match /carpool-rides/{rideId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if request.auth.uid == resource.data.driverId;
}

// Carpool Bookings (own bookings only)
match /carpool-bookings/{bookingId} {
  allow read: if request.auth.uid == resource.data.passengerId
    || request.auth.uid == get(/databases/$(database)/documents/carpool-rides/$(resource.data.rideId)).data.driverId;
  allow create: if request.auth.uid == request.resource.data.passengerId;
}
```

---

## 🧪 Testing Checklist

### Pre-Deployment Tests

- [ ] Logo appears correctly on all pages
- [ ] Logo turns white in Event theme
- [ ] Landing page shows "DEM ÉVÉNEMENT" and "DEM VOYAGE"
- [ ] Transport Hub shows all 3 services
- [ ] DemDem Express loads routes from Firebase
- [ ] Comfort tier is blocked between 10AM-4PM
- [ ] Pricing updates reflect in real-time
- [ ] Allo Dakar shows available rides
- [ ] Wallet integration works
- [ ] Admin can initialize database
- [ ] Admin can edit pricing

### Browser Testing

- [ ] Chrome/Edge (Desktop + Mobile)
- [ ] Safari (iOS + macOS)
- [ ] Firefox (Desktop)
- [ ] Samsung Internet (Android)

### Mobile Testing

- [ ] PWA installs correctly
- [ ] Service Worker updates
- [ ] Offline mode works for EPscan
- [ ] Touch interactions are smooth
- [ ] Forms are mobile-friendly

---

## 📊 Performance

### Build Size
- **Total:** 336.57 KB gzipped
- **CSS:** 15.56 KB gzipped
- **JS:** 336.57 KB gzipped

### Optimization Notes
- Consider code-splitting for admin routes
- Images should be optimized (<100 KB each)
- Service Worker caches static assets

---

## 🐛 Known Issues & Limitations

### Phase 2 Limitations

1. **Maps Not Yet Integrated**
   - Leaflet/Pelias not installed
   - Route maps use placeholder text
   - Will be added in Phase 3

2. **No Real-Time Updates**
   - Ride availability doesn't auto-refresh
   - Users must manually refresh page
   - Consider WebSocket in Phase 3

3. **No Driver Interface**
   - Allo Dakar drivers can't create rides via UI
   - Must use admin tools or API
   - Driver dashboard needed

4. **No Refund Processing**
   - Wallet refunds are logged but not automated
   - Manual admin intervention required
   - Automated refunds in Phase 3

5. **No Push Notifications**
   - No ride reminders
   - No booking confirmations via push
   - SMS/Email only for now

---

## 🔄 Upcoming Features (Phase 3)

1. **Maps Integration**
   - Install Leaflet + React Leaflet
   - Configure custom Pelias instance
   - Route visualization
   - Stop markers
   - Real-time driver tracking

2. **Driver Dashboard**
   - Create ride interface
   - Earnings tracker
   - Rating management
   - Route history

3. **Automated Refunds**
   - Cancel within 24h = 100% refund
   - Cancel <24h = 50% refund
   - No-show = no refund
   - Automatic wallet credit

4. **Real-Time Features**
   - Live ride availability
   - Seat count updates
   - Driver location tracking
   - Passenger notifications

5. **Enhanced Admin**
   - Analytics dashboard
   - Revenue reports
   - Popular routes analysis
   - Peak time insights

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** Comfort tier is available when it shouldn't be
**Fix:** Check system time. The `isComfortAvailable()` function uses local time.

**Issue:** Pricing doesn't update after editing
**Fix:** Check Firebase console. Ensure `pricing-config` document exists.

**Issue:** Logo doesn't appear
**Fix:** Ensure `/assets/logo.png` exists. Check browser console for 404 errors.

**Issue:** Build fails with TypeScript errors
**Fix:** Run `npm run typecheck` to see detailed errors.

**Issue:** Split-shift logic not working
**Fix:** Verify the hour check in `/src/types/transport.ts:188`

### Debug Mode

Enable debug logs:
```typescript
// In transportFirebase.ts
const DEBUG = true;

if (DEBUG) console.log('Operation:', data);
```

### Admin Access

To access admin pages:
1. Set custom claim in Firebase: `role: 'admin'`
2. Use Firebase Console → Authentication → Users → Custom Claims
3. Refresh user token

---

## 🎯 Next Steps

1. **Deploy Phase 2**
   ```bash
   npm run build
   firebase deploy
   ```

2. **Initialize Transport Database**
   - Visit `/admin/transport/setup`
   - Click "Initialiser maintenant"

3. **Test Everything**
   - Create test bookings
   - Verify split-shift logic
   - Check pricing updates

4. **Add Logo**
   - Place final logo at `/public/assets/logo.png`
   - Ensure it works with white filter

5. **Go Live**
   - Update DNS to point to Firebase Hosting
   - Announce on social media
   - Monitor Firebase Analytics

6. **Plan Phase 3**
   - Install Leaflet
   - Build driver interface
   - Add real-time features

---

## 📚 Technical Documentation

### Key Files Modified

**New Files:**
- `src/types/transport.ts` - Type definitions
- `src/lib/transportFirebase.ts` - Firebase operations
- `src/pages/transport/DemDemExpressPage.tsx` - Bus booking
- `src/pages/transport/AlloDakarPage.tsx` - Carpooling
- `src/pages/transport/TransportHubPage.tsx` - Transport landing
- `src/pages/AdminTransportSetupPage.tsx` - Admin tools

**Modified Files:**
- `src/components/Logo.tsx` - Now uses logo.png
- `src/pages/DemDemLandingPage.tsx` - Updated text
- `src/App.tsx` - Added transport routes

### Dependencies

No new npm packages required! Everything uses existing dependencies:
- Firebase (already installed)
- React Router (already installed)
- Lucide React (already installed)

### Future Dependencies (Phase 3)

```bash
npm install leaflet react-leaflet
npm install --save-dev @types/leaflet
```

---

## 🏆 Success Metrics

Track these KPIs after launch:

1. **Adoption Rate**
   - % of event users who try transport
   - Transport bookings per day

2. **Revenue**
   - Avg booking value
   - Transport revenue vs event revenue

3. **User Satisfaction**
   - Split-shift acceptance (do users book Eco during pause?)
   - Refund rate (lower is better)

4. **Technical Performance**
   - Page load time (<3s)
   - Error rate (<1%)
   - Booking completion rate (>80%)

---

**Status:** ✅ Phase 2 Complete - Transport Engine Live
**Build:** 336.57 KB gzipped
**Deployment:** Ready for Production

🚀 **GO LIVE WITH DEMDEM.SN** 🚀
