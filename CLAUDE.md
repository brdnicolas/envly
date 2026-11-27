# Envly: instructions for Claude

## Feature parity: web AND mobile

Every user-facing feature must exist on **both** the website (`apps/web`) and the mobile app (`apps/mobile`).

- When adding or changing a feature, build it on both clients in the same change, not one now and one "later".
- The API lives in `apps/web/src/app/api`; both clients use it. A feature isn't done until both UIs use it.
- The only exceptions are things that cannot exist on one platform (iOS share extension, push permissions, Chrome extension, SEO pages, OS-level links). Say so explicitly when a feature is platform-specific.
- Before saying a feature is done, check both: list the web page/component and the mobile screen that ship it.

## Also

- Code and comments in English, UI copy in French (see `docs/contributing.md`).
- Mobile UI: use the app's own components (`components/primitives.tsx`, `components/sheet.tsx` for bottom sheets), not native action sheets or alerts for choices.
- Run `yarn check` before committing.
