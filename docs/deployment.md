# Deployment

## Web (Vercel)

The site and the API are deployed by Vercel on every push to `main`.

**Project settings** (Vercel → Project → Settings → General):

| Setting | Value |
| --- | --- |
| Root Directory | `apps/web` |
| Include files outside the root directory in the Build Step | **Enabled** (needed for `yarn.lock` and `.yarn/` at the repo root) |
| Framework | Next.js (auto-detected) |
| Install command | `yarn workspaces focus @envly/web` (installs only the web app, not Expo), set in `apps/web/vercel.json` |
| Build command | `yarn build` → `prisma generate && next build`, set in `apps/web/vercel.json` |
| Functions region | `fra1`, set in `apps/web/vercel.json` (same region as the database) |

> ⚠️ Since the move to `apps/`, **Root Directory must be `apps/web`**, otherwise the build fails.
>
> Yarn: Vercel's own `yarn` is Yarn 1, which ignores `.yarnrc.yml`. So `vercel.json` calls the pinned Yarn 4 directly (`node ../../.yarn/releases/yarn-4.10.3.cjs …`). When upgrading Yarn (`yarn set version`), update that path too. Leave the Install/Build overrides in the dashboard **empty** so `vercel.json` applies.

### Environment variables

Set them in Vercel → Settings → Environment Variables. The full list, with comments, is in [`apps/web/.env.example`](../apps/web/.env.example).

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon pooled connection string |
| `NEXTAUTH_URL` | yes | `https://www.envly.fr` |
| `NEXTAUTH_SECRET` | yes | Also signs the mobile JWTs: rotating it signs everyone out |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | yes | Google sign-in |
| `CLOUDINARY_*` | yes | Image uploads |
| `RESEND_API_KEY` | yes | Password-reset emails |
| `DIRECT_DATABASE_URL` | no | Non-pooled URL for migrations (derived automatically otherwise) |
| `AMAZON_AFFILIATE_TAG`, `AWIN_PUBLISHER_ID` | no | Affiliate links |
| `WEBSHARE_PROXY_URL` | no | Proxy for shops that block the scraper |

## Database migrations

Migrations are **not** run by the Vercel build. Apply them from your machine, before pushing code that needs them:

```bash
yarn db:migrate        # development: create + apply a new migration
yarn db:deploy         # apply pending migrations to the database in apps/web/.env
yarn db:status         # check what is applied

# Wish photo sizes (Wish.imageWidth/imageHeight) are set on upload. To fill rows that lack them:
yarn workspace @envly/web db:backfill-images           # dry run
yarn workspace @envly/web db:backfill-images --write   # save
```

Rules:
- Prefer **additive** migrations (new tables/columns); deploy the migration first, then the code.
- Migrations use Neon's **direct** connection (see `apps/web/prisma.config.ts`). Through the pooler, Prisma's advisory lock can get stuck.

## Mobile

See [mobile.md](mobile.md). Release builds always talk to `https://www.envly.fr`.

## Chrome extension

See [extension.md](extension.md).
