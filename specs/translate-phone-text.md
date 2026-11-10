# Text made on the phone in both languages (Portuguese, part 5)

Status: ready
Issue: (added when the issue is created)
Builds after: none

## Problem
Parts 1 to 4 (`specs/translation-layer.md` and the three `translate-*` specs, all shipped) moved every
screen onto the translation layer. Text made outside `src/ui` is still English: why a link or file
can't be opened, why connecting or syncing failed, photo and document problems, booking warnings,
packing templates, calendar text and safety-copy names. This part moves the text the phone itself
makes. What the sync server answers is the next part.

## Behavior
- **Nothing changes for people using the app**: everything reads exactly as before, in English. No
  version bump, no What's new.
- **In the `?lang=pt` preview** (part 1), the text moved here is Portuguese. Example:
  `…/waypoints/?lang=pt#/t/abc` shows **Este link está incompleto. Pode ter sido cortado ao ser
  copiado: pede-o outra vez.**; on the Packing page the templates are **Praia**, **Cidade**,
  **Caminhada** and **Esqui**, and **Praia** adds "Protetor solar", "Fato de banho"…
- Moved in this part:
  - why a link or a file can't be opened (9 reasons, such as "This file isn't a waypoints file.");
  - why connecting, syncing, leaving a trip or fetching a file failed, when the phone says it
    ("Couldn't reach the server. Check the address, and that Tailscale is on.");
  - why a Google Maps link couldn't be read, when the phone says it;
  - why a photo or document can't be added ("x.pdf is empty.");
  - the two warnings on a connection ("Leg 2 leaves before leg 1 arrives");
  - the lines written into calendar events ("Check-in from 15:00", "Booking: ABC123");
  - packing templates: their names and items;
  - the "Copy this link:" box of last resort.
- **Text that is saved or sent is written in the language the phone has at that moment**, and stays
  that way: packing items added from a template, calendar files, safety-copy names ("Before
  importing a file"), the suggested phone name ("Android phone"), the name given to a photo or
  document that has none, and the last sync failure kept for the Trip tab.
- **Templates in a group with two languages**: an item is left out if its name in either language
  is already on the list. Example: the list has "Sunscreen" (added by an English phone); a phone in
  Portuguese taps **Praia**: "Protetor solar" is not added, the other nine are, in Portuguese.
  Tapping a template twice still adds nothing the second time.
- Still English in the preview: everything the sync server answers (why it refused a change, a
  file, an invite or a Google Maps link: next part), what people typed, dates, numbers and
  "2 minutes ago" (the switch, last part).
- Offline, sync, links, backups and stored data are untouched: no record, setting or file changes
  shape.

## Out of scope
- Any file under `server/`, and `src/domain/serverProtocol.ts`. Text the server sends is shown as
  it comes, as today.
- The Language setting, date and number formats, `<html lang>`, What's new notes, the guide.
- Showing saved text (safety-copy names, packing items, `lastError`) in a language other than the
  one it was written in.
- Rewording, reordering or "improving" any English text.
- Errors nobody reads: `new Error(…)` in `src/lib/places.ts`, `src/lib/reportFile.ts`,
  `src/lib/tripLink.ts:35,78` and `src/domain/sync.ts:87`. They stay as they are.

## Constraints
- **English stays character-for-character the same** (smoke tests and unit tests find it by text).
- **`src/domain` never imports `src/i18n`**: the sync server runs it with Node type stripping,
  which can't read `.tsx`. Domain code returns a code or takes the words as an argument. Domain
  *tests* may import `../i18n/en/index.ts`.
- `src/sync`, `src/lib` and `src/db` may import `m` (`import { m } from '../i18n'`).
- `erasableSyntaxOnly` is on: no constructor parameter properties (`constructor(public code…)`).
- No new dependencies, no Dexie, link, backup, sync-protocol or CSP change, no version bump.
- Follows `specs/translation-layer.md`: "Message conventions", "Glossary" and "Style" apply
  unchanged. Read them before any task.

## Context for implementers
- The layer: `src/i18n/index.ts` (`m`, `language`), `src/i18n/en/index.ts`, `src/i18n/pt/index.ts`.
  Copy the shape of `src/i18n/en/share.tsx` and `src/i18n/pt/share.tsx`. Areas are registered in
  both `index.ts` files in alphabetical order.
- New areas: `reasons` (why something failed) and `calendar`. Additions to `items`, `packing`,
  `files`, `share`, `server`, `settings`, with the names below. All names are decided.

**Data reasons** (`src/domain/records.ts:11`, `src/domain/sync.ts`, `src/lib/tripLink.ts:81`):
- `DataError` becomes:
  ```ts
  export type DataErrorCode = 'dataMissing' | 'tooLarge' | 'notWaypointsFile' | 'newerFile' | 'notTripLink' | 'newerLink' | 'invalidRecord' | 'futureDated' | 'incompleteLink'
  export class DataError extends Error {
    code?: DataErrorCode
    table?: string
    constructor(message: string, code?: DataErrorCode, table?: string) { super(message); this.code = code; this.table = table }
  }
  ```
  Every English message stays where it is; each `new DataError(…)` gets its code as second
  argument: `sync.ts:47,106` `dataMissing`; `:49` `tooLarge`; `:61,63` `notWaypointsFile`; `:65`
  `newerFile`; `:97,99` `notTripLink`; `:98` `newerLink`; `records.ts:218` `invalidRecord` with
  `table` as third argument; `records.ts:222` `futureDated`; `tripLink.ts:81` `incompleteLink`.
  The two in `server/src/sync.ts` are not touched (no code).
- `reasons.data: (err: { message: string; code?: string; table?: string }) => string`. English:
  `(err) => err.message` (the domain holds the English). Portuguese: by `code`, and `err.message`
  when the code is missing or unknown:

  | code | Portuguese |
  |---|---|
  | dataMissing | Faltam alguns dos seus dados. |
  | tooLarge | É demasiado grande para abrir. |
  | notWaypointsFile | Este ficheiro não é do waypoints. |
  | newerFile | Este ficheiro foi feito por uma versão mais recente do waypoints. Atualiza a app e tenta outra vez. |
  | notTripLink | Este link não é uma viagem do waypoints. |
  | newerLink | Este link foi feito por uma versão mais recente do waypoints. Atualiza a app para o abrir. |
  | futureDated | Tem alterações com data no futuro. Verifica a data e a hora do telemóvel que o enviou. |
  | incompleteLink | Este link está incompleto. Pode ter sido cortado ao ser copiado: pede-o outra vez. |
  | invalidRecord | `Contém ${noun}.` with `noun` by `table`: trips "uma viagem inválida", travellers "um viajante inválido", stays "uma estadia inválida", transports "um trajeto inválido", activities "uma atividade inválida", places "um local inválido", expenses "uma despesa inválida", exchanges "um câmbio inválido", reviews "uma avaliação inválida", packingItems "um item de bagagem inválido", votes "um voto inválido", attachments "uma foto ou um documento inválido", reports "um relatório inválido"; any other table "dados inválidos". |

- The three screens that show it change `err instanceof DataError ? err.message : …` to
  `err instanceof DataError ? m.reasons.data(err) : …`: `src/ui/pages/OpenPage.tsx:51`,
  `src/ui/pages/SettingsPage.tsx:46`, `src/ui/pages/TripLinkPage.tsx:31`.

**Reasons the phone makes** (messages in `reasons`, read with `m` where they are thrown):
- `src/sync/client.ts`: `:33` `notAServerAddress`; `:36` `mustBeHttps` (Portuguese, fixed: "O
  endereço do servidor tem de começar por https://"); `:42` `unreachable` (the `UNREACHABLE`
  constant keeps its name, its value becomes `m.reasons.unreachable`); `:57`
  `phoneNoLongerConnected`; `:60` `serverError: (status: number) => string`. On `:60` the server's
  own `message` is still used first, as it comes.
- `src/sync/account.ts`: `:26` `notAWaypointsServer`; `:60` `notConnected`; `:139,142`
  `notOnThatServer`; `:160` `couldntLeave`.
- `src/sync/files.ts`: `:103` `fileMismatch`; `:131` `fileDeleted`; `:133` `phoneNotConnected`;
  `:139` `notOnServerYet`.
- `src/sync/googleMaps.ts:11-14`: the four exported constants keep their names; three take their
  value from `m.reasons`: `googleUnreachable`, `googleOldServer`, `googleUnreadable`. The fourth is
  what the **server** answers and is compared with on `:24`, so it stays English as
  `GOOGLE_LIST_NOT_SHARED`; what is thrown on `:24` becomes `new Error(m.reasons.googleListNotShared)`.
  `'Not found'` on `:23` and `err.message` on `:27` stay.
- `src/lib/files.ts`: `:54,59` `couldntShrinkPhoto`; `:77` `notAPhoto: (name: string) => string`;
  `:99` `emptyFile: (name)`; `:100` `fileTooLarge: (name)`.
- Portuguese for these: "o servidor" is always the sync server; Tailscale keeps its name.

**Saved or sent text** (written in the phone's language, read with `m` where it is made):
- `settings.safetyName`: `{ removing: (name: string) => string, importing: string, connecting: string, updatingFromLink: (name: string) => string }`
  for `src/db/actions.ts:277`, `src/db/backupIO.ts:70`, `src/sync/account.ts:31` and
  `src/ui/pages/TripLinkPage.tsx:69`. Portuguese starts with "Antes de" ("Antes de remover “…”").
- `server.deviceAndroidPhone`, `deviceAndroidTablet`, `deviceWindowsPc`, `devicePhone` for
  `src/sync/account.ts:168-169` (Portuguese: "Telemóvel Android", "Tablet Android", "PC Windows",
  "Telemóvel"). `'iPad'`, `'iPhone'` and `'Mac'` are names and stay.
- `files.photoFileName` ("Photo.jpg" / "Foto.jpg") and `files.documentFileName` ("Document" /
  "Documento") for `src/lib/files.ts:84,103`.
- `share.copyLinkPrompt` ("Copy this link:") for `src/lib/shareSheet.ts:13`.

**Booking warnings** (`src/domain/bookings.ts:41,58-65`, `src/ui/components/ConnectionCard.tsx:24-28`):
- `export type JoinWarning = { kind: 'place'; leg: number; from: string; place: string } | { kind: 'time'; leg: number }`,
  where `leg` is `n` (the earlier leg; the next one is `leg + 1`). `ConnectionJoin.warnings` becomes
  `JoinWarning[]`, in the same order as today (place first).
- `items.legLeavesFrom: (next: number, from: string, prev: number, place: string) => string`
  (Portuguese: "O trajeto 2 parte de MUC, mas o trajeto 1 chega a FRA") and
  `items.legLeavesBefore: (next: number, prev: number) => string` ("O trajeto 2 parte antes de o
  trajeto 1 chegar"). `ConnectionCard` maps each warning to its message; the `<p>`'s `key` is `w.kind`.
- `src/domain/bookings.test.ts:112,119,125` expect the objects instead of the sentences. Nothing
  else in that file changes.

**Calendar text** (`src/domain/calendar.ts:32-85`):
- `export interface CalendarWords { seat: (seat: string) => string; booking: (ref: string) => string; checkInFrom: (time: string) => string; checkOutBy: (time: string) => string; phone: (phone: string) => string }`.
- `transportEvent(t, words)`, `stayEvent(s, words)`, `activityEvent(a, words)` and
  `tripEvents(stays, transports, activities, words)` take it as a required last argument. In
  `tripEvents`, `.map(transportEvent)` becomes `.map((t) => transportEvent(t, words))` (and the
  same for the other two): `map` would pass the index as `words`.
- The `calendar` area has those five keys. English: `` `Seat ${seat}` ``, `` `Booking: ${ref}` ``,
  `` `Check-in from ${time}` ``, `` `Check-out by ${time}` ``, `` `Phone: ${phone}` ``. Portuguese:
  "Lugar 23A", "Reserva: ABC123", "Check-in a partir das 15:00", "Check-out até às 11:00",
  "Telefone: …".
- Callers pass `m.calendar`: `src/ui/items/stays.tsx:178`, `src/ui/items/activities.tsx:158`,
  `src/ui/items/transport.tsx:190`, `src/ui/pages/TripInfoPage.tsx:25`.
- `src/domain/calendar.test.ts` adds `import { en } from '../i18n/en/index.ts'` and passes
  `en.calendar` to every call of the four functions. Its expectations don't change.

**Packing templates** (`src/domain/packing.ts:8-35,56-66`, `src/ui/pages/PackingPage.tsx:49-52,102-106`):
- In the domain: `TEMPLATES` is deleted;
  `export const TEMPLATE_IDS = ['beach', 'city', 'hiking', 'skiing'] as const`,
  `export type TemplateId = (typeof TEMPLATE_IDS)[number]`, and `Template.id` is typed `TemplateId`.
- `newFromTemplate(existing: PackingItem[], template: { items: string[] }, sameAs: string[][] = []): string[]`.
  `sameAs[k][i]` is another language's name for `template.items[i]`. Item `i` is left out when
  `template.items[i]` or any `sameAs[k][i]` is on the list (same trimming and case rule as today),
  or was already added in this call. What it returns is still from `template.items`, trimmed.
- `packing.templates: Record<'beach' | 'city' | 'hiking' | 'skiing', { label: string; items: string[] }>`.
  English: the labels and lists from `src/domain/packing.ts:15-34`, same order. Portuguese, same
  order (fixed):
  - Praia: Protetor solar, Fato de banho, Toalha de praia, Óculos de sol, Chinelos, Chapéu, Garrafa
    de água, Saco de praia, Creme pós-solar, Máscara de snorkel.
  - Cidade: Carregador do telemóvel, Power bank, Sapatos confortáveis, Guarda-chuva, Mochila
    pequena, Adaptador de tomada, Máquina fotográfica, Mapas offline, Garrafa de água reutilizável,
    Medicamentos.
  - Caminhada: Botas de caminhada, Impermeável, Garrafa de água, Snacks para o caminho, Kit de
    primeiros socorros, Lanterna frontal, Chapéu de sol, Mapa e bússola, Agasalho, Pensos para
    bolhas.
  - Esqui: Casaco de esqui, Calças de esqui, Luvas, Óculos de esqui, Roupa térmica, Capacete, Meias
    de esqui, Batom de cieiro, Gola térmica, Forfait.
- `src/i18n/index.ts` gains `export const dictionaries: Record<Language, Messages> = { en, pt }`,
  and `m` becomes `dictionaries[language]`.
- `PackingPage`: the chips come from `TEMPLATE_IDS` with `m.packing.templates[id].label`;
  `fromTemplate(id: TemplateId)` calls
  `newFromTemplate(t.packingItems, m.packing.templates[id], Object.values(dictionaries).map((d) => d.packing.templates[id].items))`.
- `src/domain/packing.test.ts`: the import drops `TEMPLATES`; the two tests that use it (`:61-65`
  and `:76-84`) move to `src/i18n/templates.test.ts` (task 6). Other tests stay.

- Smoke tests: `e2e/portuguese.e2e.ts`, and `importDemoTrip` in `e2e/fixtures.ts`. The demo trip
  has no packing items.
- Do not touch: `server/`, `src/domain/serverProtocol.ts`, `scripts/`, `package.json`,
  `CHANGELOG.md`, `GUIDE.md`, existing tests in `e2e/`.

**The checks.** Each task's "Done when" uses this helper, which counts matching lines outside
comment lines. Run it in Git Bash from the repo root:

```sh
t() { grep -vE '^\s*(//|/?\*)' "$1" | grep -cE "$2"; }
```

## Tasks

1. **Why a link or file can't be opened**
   - Change: `DataError` and its codes as in Context (**Data reasons**); create the `reasons` area
     in both languages with `data`, and register it; the three screens use `m.reasons.data(err)`.
     Create `src/domain/dataReasons.test.ts`: `parseBackup('x')` and `parseBackup('{}')` throw a
     `DataError` with code `notWaypointsFile`; `parseBackup('{"app":"waypoints","schemaVersion":999}')`
     `newerFile`; `decodeLink({})` `notTripLink`; `decodeLink({ v: 99 })` `newerLink`;
     `checkRecord('votes', {})` `invalidRecord` with `table` `'votes'` and message
     `'It contains an invalid vote.'`. Create `src/i18n/reasons.test.ts`: `en.reasons.data` returns
     the `message` given; `pt.reasons.data({ message: 'x', code: 'notWaypointsFile' })` is
     `'Este ficheiro não é do waypoints.'`; with `code: 'invalidRecord', table: 'expenses'` it is
     `'Contém uma despesa inválida.'`; with `table: 'somethingNew'`, `'Contém dados inválidos.'`;
     with no code, or `code: 'nope'`, it is `'x'`.
   - Depends on: none
   - Done when: `npx vitest run src/domain src/i18n` passes;
     `grep -c "DataError ? err.message" src/ui/pages/OpenPage.tsx src/ui/pages/SettingsPage.tsx src/ui/pages/TripLinkPage.tsx`
     prints 0 for each; `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

2. **Why connecting, syncing or a Google Maps link failed**
   - Change: the messages listed in Context for `src/sync/client.ts`, `account.ts` (reasons, the
     safety-copy name on `:31` and the four phone names), `files.ts` and `googleMaps.ts`, in both
     languages (`reasons`, `settings.safetyName.connecting`, `server.device…`).
   - Depends on: task 1
   - Done when: the first four print 0 and the fifth prints 1, and `npm run typecheck`,
     `npm run lint` and `npm test` pass:
     ```sh
     t src/sync/client.ts "That isn't a server|must start with https|Couldn't reach|no longer connected|Server error"
     t src/sync/account.ts "isn't a waypoints server|Before connecting|Not connected to a server|not on the server at|Couldn't leave|Android phone|Android tablet|Windows PC|'Phone'"
     t src/sync/files.ts "isn't the one that was added|has been deleted|isn't connected to the sync|isn't on the server yet"
     t src/sync/googleMaps.ts "Can't reach your|needs updating|didn't give the place"
     grep -c "This list isn't shared" src/sync/googleMaps.ts
     ```
   - Executor: sonnet

3. **Files, the copy box and safety-copy names**
   - Change: the messages listed in Context for `src/lib/files.ts` (four reasons, two file names),
     `src/lib/shareSheet.ts:13`, `src/db/actions.ts:277`, `src/db/backupIO.ts:70` and
     `src/ui/pages/TripLinkPage.tsx:69`, in both languages.
   - Depends on: task 2
   - Done when: all five print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/lib/files.ts "couldn't make the photo|can't be opened on|is empty|is too large|'Photo.jpg'|'Document'"
     t src/lib/shareSheet.ts "Copy this link"
     t src/db/actions.ts "Before removing"
     t src/db/backupIO.ts "Before importing"
     t src/ui/pages/TripLinkPage.tsx "Before updating"
     ```
   - Executor: sonnet

4. **Booking warnings**
   - Change: as in Context (**Booking warnings**): `src/domain/bookings.ts`,
     `src/domain/bookings.test.ts` (the three expectations), `src/i18n/{en,pt}/items.tsx`,
     `src/ui/components/ConnectionCard.tsx`.
   - Depends on: none
   - Done when: `t src/domain/bookings.ts "leaves from|leaves before"` prints 0;
     `npx vitest run src/domain/bookings.test.ts` passes; `npm run typecheck`, `npm run lint` and
     `npm test` pass.
   - Executor: sonnet

5. **Calendar text**
   - Change: as in Context (**Calendar text**): `src/domain/calendar.ts`,
     `src/domain/calendar.test.ts`, the `calendar` area in both languages (registered), and the
     four callers. Add to `src/domain/calendar.test.ts` one test: with
     `import { pt } from '../i18n/pt/index.ts'`, `stayEvent(stay({ checkInTime: '15:00', checkOutTime: '11:00', confirmation: 'ABC123' }), pt.calendar).description`
     contains `'Check-in a partir das 15:00'`, `'Check-out até às 11:00'` and `'Reserva: ABC123'`.
   - Depends on: none
   - Done when:
     `t src/domain/calendar.ts "Seat [$]|Booking: |Check-in from|Check-out by|Phone: "` prints 0;
     `npx vitest run src/domain/calendar.test.ts` passes; `npm run typecheck`, `npm run lint` and
     `npm test` pass.
   - Executor: sonnet

6. **Packing templates**
   - Change: as in Context (**Packing templates**): `src/domain/packing.ts`,
     `src/domain/packing.test.ts`, `src/i18n/index.ts`, `src/i18n/{en,pt}/packing.tsx`,
     `src/ui/pages/PackingPage.tsx`. Add to `src/domain/packing.test.ts`, with the file's own
     `item` and `template` helpers:
     `newFromTemplate([item('1', 'Sunscreen')], template(['Protetor solar', 'Chapéu']), [['Sunscreen', 'Hat']])`
     is `['Chapéu']`; `newFromTemplate([item('1', 'protetor solar ')], template(['Sunscreen', 'Hat']), [['Protetor solar', 'Chapéu']])`
     is `['Hat']`; `newFromTemplate([], template(['Hat']), [['Hat'], ['Chapéu']])` is `['Hat']`.
     Create `src/i18n/templates.test.ts` (imports `en`, `pt`, and `TEMPLATE_IDS`, `newFromTemplate`
     from `../domain/packing.ts`): in each language the keys of `packing.templates` are exactly
     `TEMPLATE_IDS`, every template has a label and at least 8 items with no repeats (ignoring
     case); `en` and `pt` have the same number of items in every template;
     `en.packing.templates.beach.items[0]` is `'Sunscreen'` and `pt`'s is `'Protetor solar'`; for
     each language and template, adding it to an empty list and then again (the first result turned
     into items) gives `[]`; `'Water bottle'` has the same Portuguese name in `beach` and `hiking`.
   - Depends on: none
   - Done when: `t src/domain/packing.ts "Sunscreen|'Beach'|Ski pass"` prints 0;
     `npx vitest run src/domain/packing.test.ts src/i18n` passes; `npm run typecheck`,
     `npm run lint` and `npm test` pass.
   - Executor: sonnet

7. **Smoke test for the preview**
   - Change: add one test to `e2e/portuguese.e2e.ts`. Existing tests are not edited. It:
     (a) `page.goto('?lang=pt#/t/not-a-real-link')`: the text "Este link está incompleto." is visible;
     (b) `page.goto('?lang=pt#/open')`: write a file `not-a-trip.json` holding `hello` to a temp
     folder (as `importDemoTrip` does), set it on `page.locator('input[type=file]')`; the text
     "Este ficheiro não é do waypoints." is visible;
     (c) `page.goto('?lang=pt#/server')`: click the text "O servidor é meu", fill
     `page.getByLabel('Endereço do servidor')` with `http://example.com` and
     `page.getByLabel('Código do servidor')` with `AAAA-BBBB-CCCC`, click the button named exactly
     "Continuar"; the text "O endereço do servidor tem de começar por https://" is visible;
     (d) `importDemoTrip(page)`, then with `id = backup.trips[0].id`,
     `` page.goto(`?lang=pt#/trips/${id}/packing`) ``: click the button named exactly "Praia"; the
     texts "Protetor solar" and "0 de 10 na mala" are visible. Then
     `` page.goto(`#/trips/${id}/packing`) `` (English): "0 of 10 packed" is visible; click the
     button named exactly "Beach"; "0 of 10 packed" is still visible and
     `page.getByText('Sunscreen')` has count 0.
   - Depends on: tasks 1, 2, 6
   - Done when: `npm run smoke` passes, with the new test and every existing one.
   - Executor: sonnet

8. **Rule, glossary and series upkeep**
   - Change: in `CLAUDE.md`, at the end of the `src/i18n/` bullet under "## Layout", add: " Text
     made outside the screens: `src/sync`, `src/lib` and `src/db` read `m` too; `src/domain` never
     imports `src/i18n` (the server runs it), so it returns a code or takes the words as an
     argument." In `specs/translation-layer.md`: append to the Glossary table a row for each term
     chosen while building that is in no Glossary table (compare `src/i18n/pt/reasons.tsx`,
     `calendar.tsx` and the keys this spec adds against the table, and list the terms in the
     report), including "leg (of a connection) → trajeto" and "Beach / City / Hiking / Skiing
     (templates) → Praia / Cidade / Caminhada / Esqui"; in Notes, replace items 5 and 6 of "The
     series" with:
     "5. text made on the phone: reasons from `src/lib`, `src/sync`, `src/db` and `src/domain`,
     packing templates, calendar export, safety-copy names (`translate-phone-text`);
     6. what the sync server answers: reasons as codes, translated by the app (new server image);
     7. the switch: Language in Settings (Automatic / English / Português), Portuguese on phones set
     to Portuguese, dates and numbers following the app's language, `<html lang>`, What's new notes
     in both languages (CI-enforced), the guide and its screenshots in Portuguese, version bump.";
     and in the two Notes lines that say "part 5 will reload" and "part 5 decides", change "part 5"
     to "part 7". Change nothing else in those files (`specs/BACKLOG.md` already names the new
     parts).
   - Depends on: task 7
   - Done when: `grep -c "never imports .src/i18n." CLAUDE.md` prints 1;
     `grep -c "7. the switch" specs/translation-layer.md` prints 1;
     `grep -c "part 5 will\|part 5 decides" specs/translation-layer.md` prints 0;
     `grep -c "Praia / Cidade" specs/translation-layer.md` prints 1.
   - Executor: sonnet

## Acceptance criteria
- [ ] `npm run smoke` passes: every test that existed before (English unchanged) plus the new one.
- [ ] `npx vitest run src/i18n src/domain` passes (same keys and leaf types in `en` and `pt`, no
      empty text, and the cases in `dataReasons.test.ts`, `reasons.test.ts`, `templates.test.ts`,
      `packing.test.ts`, `bookings.test.ts` and `calendar.test.ts`).
- [ ] Every "prints 0" check in tasks 1 to 6 prints 0.
- [ ] `grep -rn "i18n" src/domain --include=*.ts | grep -v "\.test\.ts"` prints nothing.
- [ ] `git diff origin/main --stat` lists no file under `server/` or `scripts/`, and not
      `src/domain/serverProtocol.ts`, `package.json`, `CHANGELOG.md` or `GUIDE.md`.
- [ ] `grep -rn "from '\.\./\.\./ui\|from '\.\./\.\./db\|from '\.\./\.\./lib\|from '\.\./\.\./sync" src/i18n`
      prints nothing.
- [ ] `grep -rnE "\b(tela|arquivo|celular|compartilhar|salvar|usuário)\b" src/i18n/pt` prints nothing.
- [ ] With `npm run dev` and a trip holding two journeys on one booking ref where the second leaves
      before the first arrives: the journey's page shows "Leg 2 leaves before leg 1 arrives", and
      with `?lang=pt` "O trajeto 2 parte antes de o trajeto 1 chegar".
- [ ] With `npm run dev` and `?lang=pt`, the calendar file downloaded from a stay with a check-in
      time holds "Check-in a partir das"; without `?lang=pt` it holds "Check-in from".
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test` (app, server, app↔server), `npm run build`: no errors.
- `npm run smoke` (first run: `npx playwright install chromium`): all tests pass.
- Manual: `npm run dev`, then the two checks in the acceptance criteria.

## Escalate when
- A term is in no Glossary and has more than one natural PT-PT translation (list them).
- An English text can't stay character-for-character the same, or an existing test other than the
  ones this spec names would need changing.
- `npm run typecheck` fails in the `server` or node project because a file they include now
  reaches `src/i18n`.
- A reason listed here turns out to be made by the server, or one not listed is shown to people
  and made in `src/domain`, `src/db`, `src/sync` or `src/lib`.
- Importing `m` into `src/sync`, `src/lib` or `src/db` creates an import cycle or breaks a test.
- A Portuguese sentence needs something the code doesn't have (gender, a count) and getting it
  means changing logic beyond what Context describes.
- Any change seems needed outside the files named in the tasks, or a new dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 5 of the series in `specs/translation-layer.md` (Notes). Parts 1 to 4 are shipped, so
  `Builds after` is "none".
- Decided with Ricardo: the original part 5 is cut in two. This spec has the text the phone makes
  (no server change); what the server answers becomes part 6 (codes, new server image) and the
  Language switch part 7. Task 8 updates the series list.
- Decided with Ricardo: a template item is skipped when its name in either language is on the
  list, so a group with two languages gets no doubles. It works by position: item `i` of a template
  is the same thing in every language, which `templates.test.ts` guards by length.
- Decided with Ricardo: safety-copy names are saved in the language the app had when they were
  made. Nothing stored changes shape; a copy made in English keeps its English name.
- The same goes for the last sync failure (`lastError` in the server settings): it is saved as
  text, and the language only changes on a reload, so it is replaced at the next sync.
- Why two mechanisms: `src/sync`, `src/lib` and `src/db` only run in the app, so they read `m`
  directly, which is the smallest change. `src/domain` also runs in the sync server, so it gets
  codes (`DataError`), structured results (booking warnings) or the words as an argument
  (calendar, templates). The server part can reuse `DataError.code` for the reasons it sends.
- English for `DataError` stays in the domain (the server sends it as text today), so
  `en.reasons.data` just returns the message: one source, and no chance of the two drifting.
- `GOOGLE_LIST_NOT_SHARED` stays English because it is compared with the server's answer; the
  server part replaces that comparison with a code.
- No version bump: English is unchanged, and nobody has Portuguese yet.
- Overlap: `google-list-import` and `google-maps-links` (shipped) own `src/sync/googleMaps.ts`;
  `packing-lists` (shipped) owns the templates; `journey-connections` (shipped) the warnings. No
  unbuilt spec touches these files, a Dexie version or a shared table, so `Builds after` is "none".
