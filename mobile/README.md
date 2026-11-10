# Envly mobile (iOS + Android)

App native Expo (React Native) branchée sur l'API de envly.fr.

- **Connexion** : email + mot de passe → `POST /api/auth/mobile` renvoie un JWT. L'app l'envoie en `Authorization: Bearer …` et le middleware Next le transforme en cookie de session : toutes les routes API existantes marchent sans modification.
- **Écrans** : Mes listes, détail d'une liste, ajout par lien (lecture auto via `/api/scrape`), fiche souhait (modifier, prioritaire, supprimer, « Voir le produit » via `/api/go`), listes des amis, profil (déconnexion, suppression du compte).
- **Partager → Envly** : depuis Safari, l'app Amazon, etc. (`expo-share-intent`), le lien ouvre directement l'écran d'ajout.

## Développer

```bash
cd mobile
npm install
npx expo run:ios          # build + simulateur iOS (Xcode requis)
npx expo run:android      # émulateur Android (Android Studio requis)
npx expo start            # relancer seulement le bundler ensuite
```

L'URL de l'API vient de `EXPO_PUBLIC_API_URL` (défaut : `https://envly.fr`). Pour viser le serveur Next local, crée `mobile/.env.local` :

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Le partage vers l'app et les modules natifs ne marchent pas dans Expo Go : il faut un build de dev (`expo run:ios` ou `eas build --profile development`).

Avant de commiter : `npx tsc --noEmit && npx expo lint`.

## Publier sur les stores

Tout se fait avec EAS (build et envoi dans le cloud, pas besoin d'Android Studio).

### Prérequis (une seule fois)

| Quoi | Où | Coût |
|---|---|---|
| Compte Expo | expo.dev | gratuit (30 builds/mois) |
| Apple Developer Program | developer.apple.com | 99 $/an |
| Google Play Console | play.google.com/console | 25 $ une fois |

1. `npm i -g eas-cli` puis `eas login`
2. `eas init` dans `mobile/` (lie le projet à ton compte Expo, ajoute `extra.eas.projectId` dans `app.json`)
3. Vérifie les identifiants dans `app.json` : `ios.bundleIdentifier` et `android.package` valent `fr.envly.app`. **Ils ne peuvent plus changer après la première publication.**

### iOS → App Store

```bash
eas build --platform ios --profile production
eas submit --platform ios --latest
```

EAS crée lui-même certificats et profils de provisioning (connexion à ton compte Apple pendant le build). L'app arrive dans App Store Connect → TestFlight, puis tu remplis la fiche et tu l'envoies en revue.

### Android → Google Play

```bash
eas build --platform android --profile production
eas submit --platform android --latest
```

La toute première fois, Google exige que le premier `.aab` soit envoyé **à la main** dans la Play Console (Test interne), puis tu crées une clé de compte de service pour que `eas submit` fonctionne. Les nouveaux comptes perso doivent aussi faire un test fermé (12 testeurs, 14 jours) avant la production.

### Mises à jour

- Code JS/TS seulement : `eas update --channel production` (mise à jour instantanée, sans revue).
- Changement natif (nouveau module, `app.json`) : nouveau `eas build` + `eas submit`. Le numéro de build s'incrémente tout seul (`autoIncrement`).

## Check-list avant la première revue

- [ ] **Icône 1024×1024** sans transparence pour iOS (`assets/images/icon.png` est en 512 px : à remplacer).
- [ ] Captures d'écran (iPhone 6,9" obligatoire, Android téléphone).
- [ ] URL de politique de confidentialité : `https://envly.fr/privacy.html`.
- [ ] **Compte de démo** pour les reviewers Apple et Google (email + mot de passe avec quelques listes déjà remplies).
- [ ] Suppression du compte depuis l'app : présente (Profil → Supprimer mon compte), exigée par Apple et Google.
- [ ] App Privacy (Apple) / Data safety (Google) : email, nom, contenu créé par l'utilisateur, aucun tracking publicitaire.
- [ ] Si un jour tu ajoutes « Se connecter avec Google » dans l'app, Apple impose aussi « Se connecter avec Apple ».
