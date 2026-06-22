# Frame

> Align your progress photos

## Stack

- **Expo SDK 54**
- **React Native 0.81**
- **TypeScript**
- **NativeWind** (Tailwind for RN)
- **Supabase** — auth & database
- **RevenueCat** — in-app purchases
- **PostHog** — analytics

## Quick Start

```bash
npm install
npx expo start
```

Copy `.env.example` to `.env` and fill in your service keys.

## Build

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Submit

```bash
eas submit -p ios
eas submit -p android
```

Update `eas.json` with your App Store Connect and Google Play credentials.

## Environment Variables

See `.env.example` for required keys.

## Architecture

```
app/
  _layout.tsx   # Root layout with providers
  index.tsx     # Home screen
  auth.tsx      # Magic link sign-in
  settings.tsx  # Settings & account
  paywall.tsx   # RevenueCat paywall
hooks/
  useAuth.ts
  usePremium.ts
  usePushNotifications.ts
  useDeepLink.ts
lib/
  supabase.ts
  revenuecat.ts
  posthog.ts
components/
  Marketing.tsx
```

## Monetization

RevenueCat powers the premium paywall. Free users see the paywall; premium users get full access.

## Auth

Supabase magic link + Apple Sign In (iOS).

## Analytics

PostHog tracks screen views, button taps, and purchase events.
