# Mobile app (iOS)

Expo SDK 58 + React Native, file-based routing with expo-router (`apps/mobile/src/app`).

## Run in the simulator

```bash
cp apps/mobile/.env.example apps/mobile/.env.development.local   # dev builds → local API
yarn dev                   # web/API on :3000, in another terminal
yarn ios                   # build + launch in the iOS simulator
yarn dev:mobile            # later: only restart Metro
```

- `EXPO_PUBLIC_API_URL` is only read in **dev builds**. Release builds always use `https://www.envly.fr` (`src/lib/api.ts`).
- Expo Go is not supported (native modules: share extension, notifications, secure store…). Use a dev build.

## Install on your own iPhone (free Apple account)

1. Plug the iPhone in, unlock it, trust the Mac.
2. `yarn ios:device`: builds a Release and installs it (`apps/mobile/scripts/install-iphone.sh`).
3. First time only: on the iPhone, *Réglages → Général → VPN et gestion de l'appareil* → trust your developer certificate.

With a free account the signature lasts **7 days**: run the command again to renew it.

## Push notifications

The code is in place (`src/lib/push.ts`, server side `apps/web/src/lib/push.ts`). To send real pushes you need:

1. The **Apple Developer Program** (99 €/year): free accounts cannot sign the push entitlement.
2. `yarn dlx eas-cli init` in `apps/mobile` to get an EAS `projectId`.
3. Builds made with `ENVLY_PUSH=1` (adds the `aps-environment` entitlement, see `plugins/with-optional-push.js`).

The app asks for permission with context: a card on the home screen, and when creating or joining a Secret Santa.

## Native project

`apps/mobile/ios` is generated (Continuous Native Generation) and git-ignored. Configure native behaviour in `app.json` / config plugins, then:

```bash
cd apps/mobile && yarn expo prebuild -p ios && (cd ios && pod install)
```

## Publishing (App Store)

With EAS, once the paid Apple account is active:

```bash
yarn deploy:ios     # from the repo root: checks, EAS build, upload to App Store Connect (TestFlight)
```

It refuses to run with uncommitted changes (EAS builds the committed code) and warns if the branch isn't pushed
(the app talks to www.envly.fr, which must already have the matching API). Under the hood:
`yarn dlx eas-cli build --platform ios --profile production --auto-submit`.

- The `production` profile builds with `ENVLY_PUSH=1` (push entitlement on): it needs the paid account.
- Over-the-air JS updates (`eas update`) would need `expo-updates`, which is not installed yet: every change ships as a new build.
- Before the first review: demo account for Apple, privacy URL (`https://www.envly.fr/privacy.html`), account deletion in-app (Profil → Supprimer mon compte, already there), App Privacy form.

## Publishing (Google Play)

```bash
yarn deploy:android   # from the repo root: checks, EAS build (.aab), upload to Google Play if a key is set
```

1. **First release, by hand** (Google requires it): download the `.aab` from the EAS build page and upload it in the
   Play Console → *Test → Closed testing → Create release*. New personal accounts must run a **closed test with
   12+ testers for 14 days** before production access.
2. **Automatic uploads afterwards**: Google Cloud → service account with access to the app in Play Console →
   JSON key saved as `apps/mobile/google-play-key.json` (git-ignored). `yarn deploy:android` then uploads to the
   *internal testing* track (`eas.json → submit.production.android`); promote it from the Play Console.
3. **Push on Android** goes through Firebase Cloud Messaging: create a Firebase project with an Android app
   `fr.envly.app`, put `google-services.json` in `apps/mobile/` (picked up by `app.config.js`), and give EAS the
   FCM V1 service-account key (`yarn dlx eas-cli credentials` → Android → Push Notifications).

Android-specific UI: the list "…" menu is an alert-style list, the Secret Santa date uses the Material 3 picker
(`@expo/ui/jetpack-compose`), the "Ajouter" pill has no Liquid Glass, and Sign in with Apple is hidden.

## Brand assets

Icons, splash and the header mark are generated: `yarn brand` (source: `scripts/brand/render.mjs`).
