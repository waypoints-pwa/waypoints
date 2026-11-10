# Translation layer (Portuguese, part 1)

Status: shipped
Issue: https://github.com/waypoints-pwa/waypoints/issues/69
Builds after: none

## Problem
waypoints is English only, and every text is written inline in about 60 screen files, so it can't be
offered in Portuguese (PT-PT). This first part adds the layer that holds the app's text per language
and moves the first screens onto it, with the Portuguese text for them, without changing what anyone
sees. Later parts move the remaining screens and then add the Language setting (see Notes).

## Behavior
- **Nothing changes for people using the app.** Every screen reads exactly as before, in English, on
  every phone, whatever the phone's language. No Language setting yet, no version bump, no What's new.
- **Preview for checking the work:** adding `?lang=pt` to the address, before the `#`, shows the
  screens already moved in Portuguese. Example:
  `https://waypoints-pwa.github.io/waypoints/?lang=pt#/settings` shows the heading **Definições**
  instead of **Settings**. It lasts while the address keeps it (tapping around inside the app keeps
  it); it is not remembered, not linked from anywhere, and the installed app never has it.
- In the preview, screens not moved yet stay English (mixed languages are expected there), and so do
  dates, numbers, What's new notes, error reasons from imports, and safety-copy names.
- `?lang=en`, an unknown value (`?lang=fr`) or no `lang` at all: English.
- Moved in this part: the top bar outside a trip and the "nothing here" page, the trip list and
  Welcome screen, Settings, the update banner, the What's new card and page (headings and buttons, not
  the notes), the support line, the copy-code chip, the kind/category names (Hotel, Flight, Sights,
  Groceries…) and the "2 new, 1 changed" merge summary.
- Offline, sync, links, backups and stored data are untouched: no record, setting or file changes.

## Out of scope
- A Language setting, following the phone's language, or remembering a choice.
- Dates, times, numbers and country names following the app's language (`src/ui/format.ts` keeps
  `undefined` locales).
- Any screen or file not listed in the tasks, including `TripLayout.tsx`, `tripNav.ts` and everything
  under `src/ui/items/`.
- Text in `src/domain/`, `src/db/`, `src/sync/`, `src/lib/` and `server/` (error reasons, safety-copy
  names, share text).
- The What's new notes themselves (`CHANGELOG.md`), `GUIDE.md`, screenshots, `README.md`.
- `<html lang>`, the web manifest, a version bump, a `CHANGELOG.md` entry.
- Any i18n library or other new dependency.

## Constraints
- **English must stay character-for-character the same**: the smoke test (`e2e/`) and the guide's
  screenshot script (`scripts/guide/screenshots.ts`) find things by their English text.
- No new dependencies (CLAUDE.md: `src/domain` has no runtime deps; the app has five).
- Internal change: no version bump or changelog entry (CLAUDE.md, "Releases & changelog").
- No data, Dexie, link, backup, sync-protocol or CSP change.
- Portuguese is PT-PT, informal "tu", post-1990 spelling (see Glossary).

## Context for implementers
Read first:
- `src/ui/labels.ts` (51 lines): the four label tables; `ChoiceChips` and `labelOf` callers take them
  as they are, so their shape (`Record<key, { label, emoji }>`) must not change.
- `src/ui/format.ts:69` (`plural`) and `:79-80` (`mergeSummary`); both are imported by about 20 files,
  so both names must keep being exported from `format.ts`.
- `src/App.tsx:91-109` (`MainLayout`) and `:121-131` (`NotFound`), `src/ui/pages/TripsPage.tsx`,
  `src/ui/pages/SettingsPage.tsx`, `src/ui/components/{bits,SupportLine,UpdateBanner,WhatsNew}.tsx`,
  `src/ui/pages/WhatsNewPage.tsx`.
- `e2e/fixtures.ts` and `e2e/welcome.e2e.ts`: how smoke tests are written (`test`, `expect` from
  `./fixtures.ts`; `page.goto('')` is the app's home).

The layer (decided, do not redesign):
- `src/i18n/language.ts`: pure, no imports. `src/i18n/plural.ts`: the `plural` helper.
- `src/i18n/en/<area>.tsx` and `src/i18n/pt/<area>.tsx`: one object per area, exported under the
  area's name (`export const settings = { … }`). Areas in this part: `labels`, `common`, `home`,
  `settings`. Area files are always `.tsx`, never import from `src/ui`, `src/db` or `src/lib`, and may
  import only `react` types, `../plural` and, in `pt/`, the `Messages` type from `../en`.
- `src/i18n/en/index.ts`: `export const en = { common, home, labels, settings }` and
  `export type Messages = typeof en`. No `as const` (leaves must be typed `string`, not literals).
- `src/i18n/pt/index.ts`: `export const pt: Messages = { … }`. Each Portuguese area file types its
  object, e.g. `export const settings: Messages['settings'] = { … }`, so a missing or extra key fails
  `npm run typecheck`.
- `src/i18n/index.ts`:
  `export const language: Language = languageFromSearch(typeof location === 'undefined' ? '' : location.search) ?? 'en'`
  and `export const m: Messages = { en, pt }[language]`. It is decided once, when the module loads, so
  module-level tables like `labels.ts` can read `m` directly. Under Vitest (no `location`) it is English.
- Screens use it as `import { m } from '../../i18n'` and `{m.settings.title}`. Imports are
  extensionless, as in `src/ui`.

Message conventions:
- A leaf is a `string`, or a function returning `string` or `ReactNode`. Keys are camelCase, named
  for meaning (`backupDownloaded`), not position.
- One sentence or label is one message. Emoji that open a label stay in the message
  (`'🔗 Open a trip link or file'`). Never build a sentence by joining messages in the screen.
- Numbers and names go in as arguments: `inDays: (n: number) => \`In ${n} days\``;
  counts use `plural` from `../plural` (`plural(n, 'trip')`; Portuguese: `plural(n, 'viagem', 'viagens')`).
- A sentence holding an element (a link, `<strong>`) is a function that takes the finished element
  as a `ReactNode` argument and returns a fragment; the screen builds the element, with its own text
  from another message. Example, in `en/home.tsx`:
  `newHere: (guide: ReactNode) => <>New here? {guide}</>` and `readTheGuide: 'Read the guide'`; in
  `TripsPage.tsx`: `{m.home.newHere(<a className="link" href={LINKS.guide} target="_blank" rel="noreferrer">{m.home.readTheGuide}</a>)}`.
- Names stay as they are in both languages: waypoints, GitHub, Ko-fi, Photon, OpenStreetMap, komoot,
  GeoNames, OurAirports, mwgg/Airports, CC BY 4.0.
- Not messages: `className`s, routes, file names (`waypoints-backup-…json`), emoji-only content
  (`⚙️`, `✕`, `⬇️`), `📍 waypoints`, code comments.

Glossary (PT-PT; use these words, also in later parts):

| English | Portuguese | English | Portuguese |
|---|---|---|---|
| trip | viagem | Settings | Definições |
| journey | trajeto | What's new | Novidades |
| stay | estadia | backup | cópia de segurança |
| activity | atividade | safety copy | cópia de salvaguarda |
| place / Places | local / Locais | file | ficheiro |
| expense | despesa | Home Screen | ecrã principal |
| traveller | viajante | storage | armazenamento |
| phone | telemóvel | address | morada |
| link | link | search | pesquisar |
| share | partilhar | update | atualização |
| sync server | servidor de sincronização | guide | guia |
| booking | reserva | Got it / Later / Reload | Percebi / Mais tarde / Recarregar |
| Save / Cancel / Delete / Edit | Guardar / Cancelar / Eliminar / Editar | import / export | importar / exportar |
| download | descarregar | connect (to a server) | ligar |
| Dismiss | Dispensar | About | Acerca de |
| Coming up / Past trips | Em breve / Viagens passadas | Done (a trip) | Concluída |
| browser | navegador | time zone | fuso horário |
| Plan / Places / Money / Files / Trip (tabs) | Plano / Locais / Dinheiro / Ficheiros / Viagem | All trips | Todas as viagens |
| Day by day / Bookings | Dia a dia / Reservas | Transport (heading) | Transportes |
| New stay / Edit stay | Nova estadia / Editar estadia | New transport / Edit transport | Novo trajeto / Editar trajeto |
| New activity / New place | Nova atividade / Novo local | New trip / Edit trip | Nova viagem / Editar viagem |
| Check-in / Check-out | Check-in / Check-out | booking reference | referência da reserva |
| Leaves / Arrives / Takes | Parte / Chega / Duração | From / To | De / Para |
| connection / layover / stop | ligação / escala / escala | seat | lugar |
| airline / company / flight no. | companhia aérea / empresa / n.º do voo | Directions | Direções |
| Must see | Imperdível | visited | visitado |
| kind, type / category | tipo / categoria | city / airport | cidade / aeroporto |
| Packing & to-do | Bagagem e tarefas | template | modelo |
| packed (N of M packed) | na mala (N de M na mala) | Who's going | Quem vai |
| currency | moeda | Trip report | Relatório da viagem |
| Leave the trip | Sair da viagem | Remove from this phone | Remover deste telemóvel |
| Someone | Alguém | Nothing here yet | Ainda não há nada aqui |

Style: address the person as "tu" ("Ainda não tens viagens"), buttons in the infinitive ("Exportar
todas as viagens"), European forms only (ecrã, ficheiro, telemóvel, partilhar, guardar, "a carregar";
never tela, arquivo, celular, compartilhar, salvar, "carregando"). Keep the English text's tone:
short, plain, friendly.

Fixed translations (the smoke test looks for them): "Settings" → "Definições"; "Your trips" → "As
tuas viagens"; "Plan a trip" → "Planear uma viagem"; "There's nothing here." → "Não há nada aqui.";
"Read the guide" → "Ler o guia".

Do not touch: `src/domain/`, `src/db/`, `src/sync/`, `src/lib/`, `server/`, `scripts/`, `GUIDE.md`,
`CHANGELOG.md`, `package.json`, `index.html`, `vite.config.ts`, existing `e2e/*.e2e.ts` files.

## Tasks

1. **Language from the address**
   - Change: create `src/i18n/language.ts` with `export const LANGUAGES = ['en', 'pt'] as const`,
     `export type Language = (typeof LANGUAGES)[number]` and
     `export function languageFromSearch(search: string): Language | undefined`, which reads `lang`
     with `new URLSearchParams(search)` and returns it only if it is exactly one of `LANGUAGES`.
     Create `src/i18n/language.test.ts` with: `''` → `undefined`; `'?lang=pt'` → `'pt'`;
     `'?lang=en'` → `'en'`; `'?x=1&lang=pt'` → `'pt'`; `'?lang=fr'`, `'?lang=PT'`, `'?lang='`,
     `'?language=pt'` → `undefined`.
   - Depends on: none
   - Done when: `npx vitest run src/i18n/language.test.ts` passes.
   - Executor: haiku

2. **The layer, with labels and the merge summary**
   - Change: create `src/i18n/plural.ts` holding `plural`, moved from `src/ui/format.ts:69`;
     `format.ts` keeps the name with `export { plural } from '../i18n/plural'`. Create
     `src/i18n/index.ts`, `en/index.ts`, `pt/index.ts` as described, with two areas:
     - `labels`: `{ stay, transport, place, expense }`, each a record from the keys in
       `src/ui/labels.ts` to the label. English: the current labels. Portuguese: stay: Hotel,
       Apartamento, Hostel, Casa, Campismo, Outro; transport: Voo, Comboio, Autocarro, Carro, Ferry,
       Outro; place: Atrações, Museus, Natureza, Comida, Bares e cafés, Compras, Outro; expense:
       Comida e bebida, Supermercado, Transportes, Alojamento, Atividades, Compras, Outro.
     - `common`: `mergeSummary: (counts: { added: number; updated: number; removed: number }) => string`.
       English: the body of `mergeSummary` in `format.ts`. Portuguese: "2 novos, 1 alterado, 3
       eliminados" (singular "novo", "alterado", "eliminado" for 1), or "pequenas alterações".

     In `src/ui/labels.ts`, each `label:` reads from `m.labels` (e.g. `label: m.labels.stay.hotel`);
     nothing else changes. In `format.ts`, `mergeSummary` becomes
     `export const mergeSummary = (counts: …) => m.common.mergeSummary(counts)` with the same
     parameter type. Create `src/i18n/messages.test.ts`: walking `en` and `pt` together, every key
     exists in both, every leaf has the same `typeof` in both, and no string leaf is empty.
   - Depends on: task 1
   - Done when: `npx vitest run src/i18n` passes; `grep -c "label: '" src/ui/labels.ts` prints 0;
     `grep -cE "small updates| changed\`" src/ui/format.ts` prints 0; `npm run typecheck`,
     `npm run lint` and `npm test` pass.
   - Executor: sonnet

3. **Shared pieces onto the layer**
   - Change: move every text people read in `src/App.tsx`, `src/ui/components/bits.tsx` (the
     `prompt` text and the `Copy <code>` label), `SupportLine.tsx`, `UpdateBanner.tsx`, `WhatsNew.tsx`
     (heading, "Dismiss", "Got it", the "See N earlier update(s)" / "All updates" link) and
     `src/ui/pages/WhatsNewPage.tsx` (the back link's "Settings" and the heading) into the `common`
     area, in both languages. Leave `ReleaseNotes`, `Inline` and `formatDate` alone.
   - Depends on: task 2
   - Done when: each prints 0:
     `grep -cE "nothing here|Your trips|aria-label=\"Settings\"" src/App.tsx`,
     `grep -cE "Copy this|Copy \\$" src/ui/components/bits.tsx`,
     `grep -cE "Enjoying|Support it" src/ui/components/SupportLine.tsx`,
     `grep -cE "is ready|^ +Reload$|^ +Later$" src/ui/components/UpdateBanner.tsx`,
     `grep -cE "New in waypoints|Dismiss|Got it|earlier update|All updates" src/ui/components/WhatsNew.tsx`,
     `grep -cE "What's new|>Settings<" src/ui/pages/WhatsNewPage.tsx`;
     and `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

4. **Trip list and Welcome onto the layer**
   - Change: move every text people read in `src/ui/pages/TripsPage.tsx` into a new `home` area in
     both languages, including the chips ("Tomorrow", "In N days", "Day N of M", "Done"), the group
     titles and " · 🌐 on the server". Register `home` in both `index.ts` files.
   - Depends on: task 2
   - Done when:
     `grep -cE "Your trips|Coming up|Past trips|Plan a trip|New trip|Tomorrow|on the server|Read the guide|Keep your bookings" src/ui/pages/TripsPage.tsx`
     prints 0; `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

5. **Settings onto the layer**
   - Change: move every text people read in `src/ui/pages/SettingsPage.tsx` into a new `settings`
     area in both languages: headings, paragraphs, buttons, `aria-label`s and the three messages set
     with `setMessage`. `err.message`, `snap.reason`, `stamp()` and the file names stay as they are.
     Register `settings` in both `index.ts` files.
   - Depends on: task 2
   - Done when:
     `grep -cE "Your name|Address search|Sync server|Backup & transfer|Storage is persistent|What's new|No account|Import failed|Safety copies|Connected as|How to use" src/ui/pages/SettingsPage.tsx`
     prints 0; `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

6. **Smoke test for the preview**
   - Change: in `e2e/fixtures.ts`, add
     `export async function expectNoEnglish(page: Page)`, which expects `page.locator('main')` not to
     contain text matching `/\b(the|your|and|with|this|phone|trips?)\b/i`. Create
     `e2e/portuguese.e2e.ts` with three tests:
     (a) `page.goto('?lang=pt')`: the heading "Planear uma viagem" and the link "Ler o guia" are
     visible, a link named "Definições" exists, and `expectNoEnglish` holds;
     (b) `page.goto('?lang=pt#/settings')`: the heading "Definições" is visible and
     `expectNoEnglish` holds; then `page.goto('?lang=pt#/nowhere')`: "Não há nada aqui." and the link
     "As tuas viagens" are visible;
     (c) `page.goto('?lang=fr#/settings')`: the heading "Settings" is visible.
   - Depends on: tasks 3, 4, 5
   - Done when: `npm run smoke` passes, with the three new tests and every existing one.
   - Executor: sonnet

7. **Rule in CLAUDE.md**
   - Change: in `CLAUDE.md`, under "## Layout", add after the `src/lib/` bullet:
     "- `src/i18n/` — the text people read, per language: `en/` is the source and `pt/` must match it
     (the typecheck fails otherwise), one file per area, read through `m`. Text on a screen that
     already uses `m` is never written inline: add it to both languages. Conventions and the
     Portuguese glossary: `specs/translation-layer.md`."
   - Depends on: task 6
   - Done when: `grep -c "src/i18n/" CLAUDE.md` prints 1.
   - Executor: haiku

## Acceptance criteria
- [ ] `npx vitest run src/i18n` passes: every `languageFromSearch` case in task 1, and `en` and `pt`
      have the same keys and leaf types with no empty text.
- [ ] `npm run smoke` passes: all tests that existed before (English unchanged) plus the three in
      `e2e/portuguese.e2e.ts`.
- [ ] Removing any one key from a file in `src/i18n/pt/` makes `npm run typecheck` fail.
- [ ] `git diff origin/main --stat` lists no file under `src/domain/`, `src/db/`, `src/sync/`,
      `src/lib/`, `server/` or `scripts/`, and not `package.json`, `CHANGELOG.md` or `GUIDE.md`.
- [ ] `grep -rn "from '\.\./\.\./ui\|from '\.\./\.\./db\|from '\.\./\.\./lib" src/i18n` prints nothing.
- [ ] With `npm run dev`, `http://localhost:5173/?lang=pt#/settings` reads in Portuguese from top to
      bottom (names such as GitHub and Photon aside), and `http://localhost:5173/#/settings` reads
      exactly as on `main`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: no errors.
- `npm run smoke` (first run: `npx playwright install chromium`): all tests pass.
- Manual: `npm run dev`, then the two addresses in the acceptance criteria, at phone width (360px).

## Escalate when
- A text to move needs a word that is not in the Glossary and has more than one natural PT-PT
  translation for a travel term (list the candidates).
- An English text can't be kept character-for-character (for example a sentence split across
  elements in a way the conventions don't cover).
- A listed file reads text from somewhere this spec says not to touch, and it would stay English
  inside an otherwise Portuguese `main` on the trip list, Welcome, Settings or "nothing here" pages.
- `expectNoEnglish` fails on a name or a correct Portuguese word.
- An existing smoke test or `npm run guide:screenshots` selector would need changing.
- Any change seems needed outside the files named in the tasks, or a new dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- **The series** (each part gets its own `/spec`; none shows Portuguese to anyone until the last):
  1. this spec;
  2. plan and items: trip tabs, Plan, stays, journeys, activities, places and import, trip form and
     info, packing, shared form fields;
  3. money, files, reviews, votes and the trip report (page and exported file);
  4. sharing and server: open/share/link pages, server pages and notices, text in `src/lib`,
     `src/sync`, `src/db` and `src/domain` (error reasons become codes), sync server reasons as codes
     (new server image), calendar export;
  5. the switch: Language in Settings (Automatic / English / Português), Portuguese on phones set to
     Portuguese, dates and numbers following the app's language, `<html lang>`, What's new notes in
     both languages (CI-enforced), the guide and its screenshots in Portuguese, version bump.
- Decided with Ricardo: phone's language plus a Settings override; What's new, the guide and sync
  server messages are translated too; informal "tu"; trajeto, link, locais, telemóvel; a series with
  the switch at the end, so nobody sees a half-translated app.
- Each part writes the Portuguese for the text it moves, so the typecheck guards completeness from
  the start and the translation is reviewed in small pieces.
- No i18n library: typed objects give missing-key errors at compile time, and functions cover
  plurals and word order, with no dependency.
- The language is fixed when the page loads (a module constant, not React state), so tables built at
  import time (`labels.ts`) need no change; part 5 will reload the page when the setting changes and
  keep the choice where it can be read synchronously.
- `?lang=pt` is a preview for building and reviewing, deliberately not remembered; part 5 decides
  whether it stays.
- Dictionaries are bundled with the app (small text), not loaded on demand, so offline is unaffected.
- Shipped as specced. The Glossary rows from "download" down are the words chosen while building;
  later parts use them too. Two texts live in two areas (`common.settings` and `settings.title`,
  `common.yourTrips` and `home.yourTrips`); a later part can keep one of each.
- Dry-run before writing this spec: a `.tsx` dictionary with a fragment imports fine under Vitest,
  oxlint and `tsc -b`.
- Overlap: no unbuilt spec depends on this one, but draft specs built after it (`trip-budget`,
  `expenses-csv-export`, `server-trip-cleanup`, `qr-join`, `plan-editing`, `list-row-stars`) must
  follow the CLAUDE.md rule from task 7 where they add text to a moved screen.
