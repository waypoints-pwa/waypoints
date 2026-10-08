# waypoints — notes for Claude

Trip companion PWA. Local-first: all data in IndexedDB via Dexie; hosted as a static site on GitHub
Pages (https://timoneiro.github.io/waypoints/). There is no server: trips move between phones as links
(`#/t/<data>`, the trip compressed into the URL fragment) or files, and are merged record by record.

## People's trips — never lose them
Once people use the app, their only copy of a trip may be in their browser. Every change must be
non-destructive for existing data:
- **Dexie versions are append-only** (`src/db/db.ts`): never edit/delete a released `db.version(n)`,
  never change a primary key, never drop a table holding user data. Add a new version, and extend
  `src/db/migrations.test.ts` (it opens a v0.1-shaped database with the current code).
- **Never change the app's origin/base path** (`/waypoints/` on GitHub Pages). Browser storage is per
  origin: moving the app would show everyone an empty app.
- **Trip links live forever in group chats** (`src/domain/sync.ts`, `src/lib/tripLink.ts`): every
  `LINK_VERSION` ever shipped must keep decoding. Add a version instead of changing one.
- **Backup format**: add optional fields only; bumping `BACKUP_VERSION` makes older app versions reject
  new files, so it needs a migration in `parseBackup`.
- **Mixed versions in a group**: records keep fields and kinds/categories they don't know
  (`src/domain/records.ts`), and unknown kinds show as "other". Don't strip unknown fields.
- **Merges** are record-level: newest `updatedAt` wins, tombstones (`deletedAt`) are records too. Never
  hard-delete a shared record. All writes go through `src/db/actions.ts`, which marks them unsent and
  skips saves that change nothing (an unchanged save would override someone else's newer edit).
- Take a snapshot (`takeSnapshot`) before any operation that removes or overwrites local data.
- Ship through a PR (CI runs lint, types, tests, build); merging to `main` deploys to users immediately.

## Releases & changelog
Every user-facing change bumps `version` in `package.json` and adds a `## x.y.z — YYYY-MM-DD` entry at the
top of `CHANGELOG.md`, written for people who use the app (`src/domain/changelog.test.ts` fails CI if the
entry is missing). The entry is the app's "What's new" card. Internal changes skip the bump.

## Content-Security-Policy
The built app ships a CSP `<meta>` (in `vite.config.ts`, build only) with `connect-src 'self'`: the app makes
no network requests at all. Maps, calendars and booking sites are plain links. Anything that fetches from
another host (an exchange-rate API, map tiles) needs adding there, and must stay an optional add-on.

## Principles
- **No accounts, no API keys, no server.** Core features work without any; anything that needs one is an
  optional add-on.
- **Local-first.** Fully usable offline.
- **Links and files are untrusted input**: validated in `src/domain/records.ts` and size-limited; only
  `http(s)` addresses ever become a clickable href (`safeHttpUrl` in `src/domain/links.ts`).
- **Time**: records keep the wall-clock day/time plus the place's IANA zone; `zonedInstant` puts them on the
  real timeline; calendar export is in UTC.
- **Money**: expenses convert at the average rate the trip's exchanges actually got (fees included), unless
  they have their own rate; rates are typed in, never fetched.
- Target scale: a few trips per phone, up to a few hundred items each, groups of 2–10. English only.

## Layout
- `src/domain/` — pure, unit-tested logic. Relative imports use explicit `.ts` extensions. No runtime deps.
- `src/db/` — Dexie schema, write actions, backup/merge IO, snapshots, local settings.
- `src/lib/` — browser helpers: trip link codec, share sheet, update prompt, downloads.
- `src/ui/` — React. `tripData.ts` loads a trip once for all its pages (`useTrip()`), `TripLayout.tsx`
  has its top bar and tabs, `items/` has one file per kind (form + detail page), `pages/` the rest;
  plain CSS tokens in `src/index.css` (light + dark).

## Commands
`npm run dev` · `npm test` · `npm run lint` · `npm run typecheck` · `npm run build`.

On Windows Git Bash, set `MSYS_NO_PATHCONV=1` when passing `BASE_PATH=/waypoints/` to a local build.

## Ideas
`FEATURE_IDEAS.md` is a local, gitignored backlog: add future ideas there, not in issues or the README.
