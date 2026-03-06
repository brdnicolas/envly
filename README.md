# Wishly

Application de wishlists partagees construite **integralement par IA** (Claude, Anthropic) en une seule session de conversation.

L'objectif de ce projet est de tester les capacites de Claude (Claude Code CLI) a generer une application web complete, fonctionnelle et deployable, a partir d'un plan d'implementation fourni en langage naturel.

## Le projet

Wishly permet de creer des listes de souhaits et de les partager avec ses proches. La fonctionnalite cle : les reservations sont **anonymes et invisibles** pour le proprietaire de la liste, pour garder la surprise.

### Stack technique

- **Next.js 16** (App Router, Server Components)
- **NextAuth.js** (Google, GitHub, Email/Password)
- **SQLite + Prisma 7** (avec driver adapter)
- **Tailwind CSS + shadcn/ui**
- **cheerio** (scraping d'URLs pour auto-remplir les souhaits)
- **framer-motion** (animations)
- **next-themes** (dark/light mode)

### Fonctionnalites

- Authentification multi-provider (Google, GitHub, credentials)
- CRUD collections et souhaits
- Scraping automatique au collage d'URL (titre, description, images, prix)
- Selection d'images parmi celles scrappees
- Partage public via lien unique (`/w/[slug]`)
- Reservation anonyme (invisible pour le proprietaire)
- Affichage masonry responsive
- Mode sombre/clair

## Lancer le projet

```bash
npm install
npx prisma migrate dev
npm run dev
```

Configurer `.env` avec les variables NextAuth (voir `.env.example` ou la doc NextAuth).

---

## Points positifs

- **Vitesse de developpement** — L'ensemble du projet (scaffolding, auth, CRUD, scraping, partage, landing page, UI) a ete genere en une seule session. Ce qui prendrait plusieurs jours a un dev a ete fait en quelques heures.
- **Bonne comprehension du plan** — Claude a su interpreter un plan d'implementation haut niveau et produire du code fonctionnel pour chaque etape, en respectant l'architecture demandee.
- **Resolution de problemes techniques** — Adaptation a Prisma 7 (driver adapters), migration Next.js 16 (middleware), gestion des SPAs pour le scraping... Claude a su debloquer les situations sans aide exterieure.
- **Iterations rapides sur le design** — Chaque retour UI (masonry, cursor pointer, taille des images, layout mobile) a ete applique rapidement, souvent en un seul echange.
- **Code lisible et structure** — Le code produit est propre, bien organise, et suit les conventions du framework.
- **Connaissance large de l'ecosysteme** — shadcn/ui, NextAuth, Prisma, cheerio, framer-motion... Claude maitrise bien les libs populaires et sait les assembler.

## Points negatifs

- **Iterations excessives sur le CSS/layout** — Le masonry a necessite de nombreux allers-retours (masonry → grid → masonry, tailles de colonnes, gaps...). Claude propose parfois des solutions qui ne marchent pas du premier coup sur des sujets visuels.
- **Scraping fragile** — Les sites SPA (Zalando, Zara) restent difficiles a scraper cote serveur. Claude a produit des fallbacks regex, mais ca reste approximatif (ex: prix a 6000€ sur Zalando).
- **Pas de tests** — Aucun test unitaire ou d'integration n'a ete genere. Le code fonctionne mais il n'y a aucun filet de securite.
- **Tendance a over-engineer** — Sur certaines demandes simples, Claude ajoute parfois plus de complexite que necessaire avant de converger vers la bonne solution.
- **Corrections en chaine** — Certains bugs (chemins Prisma, casing des imports, emplacement de la DB) ont necessite plusieurs corrections successives plutot qu'une resolution directe.
- **Cursor pointer oublie** — Un detail CSS basique qui a du etre rappele plusieurs fois avant d'etre correctement applique partout.
- **Pas de validation cote serveur robuste** — Les API routes font le minimum. Il n'y a pas de validation de schema (zod, etc.) sur les inputs.
