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
cd apps/mobile
yarn dlx eas-cli build --platform ios --profile production
yarn dlx eas-cli submit --platform ios --latest
```

- The `production` profile builds with `ENVLY_PUSH=1` (push entitlement on): it needs the paid account.
- Over-the-air JS updates (`eas update`) would need `expo-updates`, which is not installed yet: every change ships as a new build.
- Before the first review: demo account for Apple, privacy URL (`https://www.envly.fr/privacy.html`), account deletion in-app (Profil → Supprimer mon compte, already there), App Privacy form.

## Brand assets

Icons, splash and the header mark are generated: `yarn brand` (source: `scripts/brand/render.mjs`).
