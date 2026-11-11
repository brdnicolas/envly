# Architecture

```
            ┌──────────────────────┐
            │   Neon Postgres      │  eu-central-1 (Frankfurt)
            └──────────▲───────────┘
                       │ Prisma 7 (pooled for the app, direct for migrations)
┌──────────────────────┴───────────────────────┐
│ apps/web — Next.js 16 on Vercel (fra1)       │
│  • pages: landing, dashboard, /w/[slug],     │
│    /u/[slug], /s/[code] (Secret Santa)       │
│  • REST API under /api/*                     │
│  • OG images, sitemap, robots                │
└──────▲──────────────────▲────────────────────┘
       │ cookie session   │ Authorization: Bearer <jwt>
┌──────┴────────┐  ┌──────┴──────────┐
│ Browser /     │  │ apps/mobile     │──► Expo push service ──► APNs
│ apps/extension│  │ (Expo, iOS)     │
└───────────────┘  └─────────────────┘
```

## One backend, three clients

All business logic lives in `apps/web`. The mobile app and the Chrome extension are thin clients of its API.

- **Web**: NextAuth session cookie.
- **Extension**: runs on the user's browser, so its background worker calls `https://www.envly.fr/api/*` with the same session cookie (`credentials: "include"`).
- **Mobile**: a JWT signed with `NEXTAUTH_SECRET`, sent as `Authorization: Bearer …`. `src/middleware.ts` turns it into the NextAuth session cookie, so every API route works unchanged with `getServerSession()`.

### Mobile sign-in

Sign-in and sign-up happen on the website inside an `ASWebAuthenticationSession`:

1. The app opens `/api/auth/mobile/authorize?state=…` (optionally `&mode=signup`).
2. Not signed in → redirect to `/signin` or `/signup` with a `callbackUrl` back to step 1 (Google or email).
3. Signed in → a mobile JWT is minted and the browser is sent to `envly://auth?token=…&state=…`.
4. The app checks `state`, stores the token in the Keychain (`expo-secure-store`).

## Data model (Prisma)

| Model | Purpose |
| --- | --- |
| `User`, `Account`, `Session` | NextAuth users (Google / credentials) |
| `Collection` | A wish list. `isPublic` controls the public page `/w/[slug]` |
| `Wish` | An item: title, link, image (Cloudinary), price, `isPriority` (favourite) |
| `Reservation` | Anonymous reservation of a wish. Only returned to *viewers*, never to the owner or collaborators |
| `CollectionCollaborator` | Shared lists (co-authors) |
| `UserFollow`, `CollectionFollow` | Friends and followed lists |
| `SecretSanta`, `SecretSantaMember` | Gift exchange. `giftToId` is set by the draw and only ever serialised for its own member |
| `PushToken` | Expo push tokens, one per device |
| `Notification` | In-app notifications (web) |

Schema: `apps/web/prisma/schema.prisma`. Migrations: `apps/web/prisma/migrations`.

## Key flows

### Adding a wish

- **From a link** (web, app, iOS share sheet): `/api/scrape` reads the page (JSON-LD, Open Graph, DOM fallbacks, optional proxy). The app can also read pages on-device in a hidden WebView when a shop blocks servers.
- **From the extension**: the content script reads the product page itself (including Amazon's DOM) and posts to `/api/wishes`.
- Images are uploaded to Cloudinary; thumbnails are requested at the right size via URL transforms (`lib/image.ts`).

### Secret Santa (`src/lib/secret-santa.ts`)

1. The organiser creates it and invites friends (people they follow or who follow them) or shares `/s/[code]`.
2. Members join and share a list (usually a dedicated private one). The giver can read that private list after the draw (`isSantaOfCollection`).
3. The draw is a single random cycle (no self-draw, no simple swap), done in one transaction guarded against double draws.
4. Push notifications: invitation, then "the draw happened".

### Push notifications (`src/lib/push.ts`)

Devices register their Expo push token on `/api/push`. The server sends through Expo's push service (`exp.host`), in batches of 100, after the HTTP response (`after()`), and deletes tokens Apple reports as dead.

## Performance

- Vercel functions run in **fra1**, next to the database (Frankfurt).
- The app keeps a stale-while-revalidate cache on disk (`hooks/use-api.ts`): screens paint instantly, then refresh; any write invalidates and refreshes what is on screen.
- Social images are generated on demand (`opengraph-image.tsx`) and cached by Vercel.
