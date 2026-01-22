# DemDem Assets Directory

## Required Logo Files

Please place your DemDem logo files in this directory:

### 1. Main Logo (With Original Colors: Blue/Green)
- **Filename:** `demdem-logo.png`
- **Usage:** Displayed throughout the app
- **Behavior:**
  - In **Transport Mode** (Navy + Green theme): Shown with original colors
  - In **Event Mode** (Black + Orange theme): Automatically converted to WHITE using CSS filter
- **Requirements:**
  - Transparent background recommended
  - High resolution (at least 512px width)
  - PNG format preferred
  - Original colors: Blue (#0A192F) and/or Green (#10B981)

### 2. App Icon (512x512)
- **Filename:** `demdem-icon-512.png`
- **Usage:** PWA icon, favicon, app icon
- **Requirements:**
  - Exactly 512x512 pixels
  - PNG format
  - Can be square or with transparent corners
  - Used for home screen, splash screen, and browser tab

## Current Status

The app is configured to use these files. Once you add them, the branding will be complete.

## Dynamic Logo Logic

The Logo component (`/src/components/Logo.tsx`) automatically applies:
- **Transport theme:** No filter (original colors)
- **Event theme:** `brightness(0) invert(1)` CSS filter (converts to white)

This ensures the logo looks premium on both light (Transport) and dark (Event) backgrounds.
