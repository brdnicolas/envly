# Contributing

## Before every commit

```bash
yarn check         # type-check + lint, web and mobile
```

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org): `feat(mobile): …`, `fix(web): …`, `chore(extension): …`. Scope = `web`, `mobile`, `extension`, `brand`, `docs`.
- **Branches**: `main` is deployed. Work on `feat/…` or `fix/…` branches when something is risky.
- **Language**: code and comments in English, UI copy in French.
- **Package manager**: **Yarn 4** only (no `npm install`, no `package-lock.json`). Any global `yarn` works: it hands over to the pinned binary in `.yarn/releases`. Commit `yarn.lock` with every dependency change.
- **Dependencies**: add them to the app that needs them:
  - web: `yarn workspace @envly/web add <pkg>` (`-D` for dev)
  - mobile: `cd apps/mobile && yarn expo install <pkg>` (picks the version matching the Expo SDK)
  - tooling for the whole repo (scripts/): `yarn add -D <pkg>` at the root
- **Run anything in an app**: `yarn workspace @envly/web <script|bin>`, e.g. `yarn workspace @envly/web prisma studio`.
- **Database**: never edit an applied migration; add a new one (`yarn db:migrate`). See [deployment.md](deployment.md).
- **Secrets**: only in `.env` files (git-ignored) and in Vercel. Templates: `apps/*/.env.example`.
- **Brand**: never edit generated icons by hand, change `scripts/brand/render.mjs` and run `yarn brand`.

## Where things live

| I want to… | Look in |
| --- | --- |
| Change an API route | `apps/web/src/app/api/…` |
| Change the data model | `apps/web/prisma/schema.prisma` + `yarn db:migrate` |
| Change a mobile screen | `apps/mobile/src/app/…` (one file per route) |
| Change shared mobile UI | `apps/mobile/src/components/primitives.tsx`, `constants/theme.ts` |
| Change SEO / social previews | `apps/web/src/app/**/opengraph-image.tsx`, `sitemap.ts`, `robots.ts` |
| Change the extension | `apps/extension/content.js` |
