# Envly

> Wishlists partagées, surprises préservées.

Envly lets you collect gift ideas from any online shop, share your lists with friends and family, and let them reserve gifts **anonymously**: you never know who offers what, and nobody gives the same thing twice. It also runs **Secret Santa** draws.

This repository is a monorepo with three apps that share one backend:

| App | Folder | Stack | Ships to |
| --- | --- | --- | --- |
| **Web + API** | [`apps/web`](apps/web) | Next.js 16, Prisma 7, Neon Postgres, NextAuth | [www.envly.fr](https://www.envly.fr) (Vercel) |
| **iOS app** | [`apps/mobile`](apps/mobile) | Expo SDK 58, React Native, expo-router | iPhone (TestFlight / App Store) |
| **Chrome extension** | [`apps/extension`](apps/extension) | Manifest V3, vanilla JS | Chrome Web Store |

The mobile app and the extension have no backend of their own: they call the Next.js API (`apps/web/src/app/api`).

---

## Quick start

Requirements: **Node 22** (`nvm use`), **Yarn** (any version: the repo pins Yarn 4.10 in `.yarn/releases`, or run `corepack enable`), and for iOS: **Xcode 26** + CocoaPods.

```bash
yarn install                          # one install for the whole monorepo
cp apps/web/.env.example apps/web/.env # then fill in the secrets
yarn db:generate                      # Prisma client
yarn dev                              # → http://localhost:3000
```

Mobile (in a second terminal, with the web server running):

```bash
cp apps/mobile/.env.example apps/mobile/.env.development.local
yarn ios                              # builds and opens the iOS simulator
```

---

## Scripts

Everything runs from the repo root. The repo is a **Yarn 4 workspace** (`apps/web` = `@envly/web`, `apps/mobile` = `@envly/mobile`): one `yarn install`, one `yarn.lock`. Each app still gets its own `node_modules` (`installConfig.hoistingLimits: "workspaces"`), because the web and the mobile app need different React and TypeScript versions.

| Command | What it does |
| --- | --- |
| `yarn install` | Install all dependencies (root + web + mobile) |
| `yarn dev` / `dev:web` | Next.js dev server on :3000 |
| `yarn dev:mobile` | Metro bundler for an already-installed dev build |
| `yarn ios` | Build the iOS app and run it in the simulator |
| `yarn ios:device` | Build a Release and install it on a plugged-in iPhone |
| `yarn deploy:ios` | Build on EAS and send to App Store Connect / TestFlight (needs a clean, committed tree) |
| `yarn release:ios` | New App Store version: version computed from commits (`feat:` → 1.x.0, `fix:` → 1.0.x), commit + tag `mobile-vX.Y.Z`, then build + upload |
| `yarn deploy:android` | Build the Android bundle on EAS and send it to Google Play (internal testing) |
| `yarn build` | Production build of the web app (runs `prisma generate`) |
| `yarn check` | Type-check + lint web and mobile (run before every commit) |
| `yarn typecheck` / `lint` | The two halves of `check`, also available per app (`:web`, `:mobile`) |
| `yarn db:migrate` | Create & apply a migration in development (`prisma migrate dev`) |
| `yarn db:deploy` | Apply pending migrations to the configured database |
| `yarn db:status` / `db:studio` | Migration status / Prisma Studio |
| `yarn extension:zip` | Package the extension → `apps/extension/dist/envly-extension.zip` |
| `yarn brand` | Regenerate every logo, icon, favicon and OG asset from one source |
| `yarn scrape:bench` | Benchmark the product-page scraper on real URLs |

---

## Repository layout

```
envly/
├── apps/
│   ├── web/              Next.js site + REST API + Prisma schema
│   │   ├── src/app/      Pages (App Router) and /api routes
│   │   ├── src/lib/      Auth, Prisma, scraping, Secret Santa, push, SEO…
│   │   ├── prisma/       schema.prisma + migrations
│   │   └── assets/og/    Fonts and marks for generated social images
│   ├── mobile/           Expo app (iOS), routes in src/app
│   └── extension/        Chrome extension (content script + popup)
│       └── store/        Chrome Web Store listing: text, screenshots, promo images
├── docs/                 Architecture, deployment, mobile, extension guides
├── scripts/brand/        Single source for the Envly logo and all its exports
├── .yarn/releases/       Pinned Yarn binary (used automatically by any `yarn`)
├── yarn.lock             Single lockfile for every app
└── package.json          Workspaces + scripts that orchestrate every app
```

## Documentation

- [Architecture](docs/architecture.md): how the apps talk to each other, auth, data model, key flows
- [Deployment](docs/deployment.md): Vercel, environment variables, database migrations
- [Mobile](docs/mobile.md): running, installing on an iPhone, push notifications, App Store
- [Chrome extension](docs/extension.md): local install, packaging, Web Store publishing
- [Contributing](docs/contributing.md): conventions, checks, commit style
