# Sharing and server screens in both languages (Portuguese, part 4)

Status: building
Issue: https://github.com/waypoints-pwa/waypoints/issues/78
Builds after: none

## Problem
Parts 1 to 3 (`specs/translation-layer.md`, `specs/translate-plan-and-items.md`,
`specs/translate-money-and-files.md`, all shipped) moved the trip list, Settings and everything inside
a trip onto the translation layer. The screens for sharing a trip and for the sync server are still
English text written inline, so the app can't be offered in Portuguese (PT-PT). This part moves them,
with their Portuguese text, and fixes three small things earlier parts left in the preview.

## Behavior
- **Nothing changes for people using the app**: every screen reads exactly as before, in English.
  No version bump, no What's new.
- **In the `?lang=pt` preview** (part 1), the screens moved here read in Portuguese. Example:
  `…/waypoints/?lang=pt#/trips/<id>/share` shows **Partilhar com o grupo** and the button
  **🔗 Partilhar link da viagem**, which turns into **✓ Link copiado**; `…/?lang=pt#/server` shows
  **Servidor de sincronização**, the tabs **Tenho um convite** and **O servidor é meu**, and the
  button **Ligar**.
- Moved in this part: the Share page; the "N changes the group hasn't seen yet" notice; the Open a
  trip page; the page a trip link opens (add, update, "Which one are you?"); the iPhone "Open in the
  waypoints app" card; the Sync server page (connecting, people, invites, phones, address,
  disconnecting); the "Put it on the server" page; the sync status block ("Synced 2 minutes ago",
  "Sync now"); and the "You're no longer on this trip on the sync server" notice.
- **Text that goes out to other people** is in the language of the phone that sends it: the message
  sent with a trip link ("Ana shared “Japan in spring” on waypoints. Open the link…") and with a
  server invite. In the preview they are Portuguese; without it, English as today.
- **Three fixes from earlier parts**, in the preview:
  - the Plan shows " · Hoje" after today's date (English: " · Today", looking the same as today);
  - selecting photos reads "2 selecionadas" (documents: "2 selecionados");
  - the selection bar on the Files tab wraps onto a second line when it doesn't fit, so **Cancelar**
    is no longer cut off at 360px. In English it fits on one line, as today.
- Still English in the preview (part 5): what people typed (names, phone names), dates, numbers and
  "2 minutes ago", and every reason that comes from outside `src/ui`: why a link or file can't be
  opened, why connecting or syncing failed, why the server refused a change, the "Copy this link:"
  box of last resort, the suggested phone name ("Android phone"), and safety-copy names.
- Offline, sync, links, backups and stored data are untouched.

## Out of scope
- Everything parts 1 to 3 left out and that is not listed above: the Language setting, date and
  number formats, `<html lang>`, What's new notes, the guide.
- Any file under `src/domain/`, `src/db/`, `src/sync/`, `src/lib/`, `server/`, `scripts/`. Their
  text (error reasons as codes, a new server image, packing templates, calendar text) is part 5.
- The safety-copy name at `src/ui/pages/TripLinkPage.tsx:68` (`Before updating “…” from a link`):
  it is saved text, like the others made in `src/db`. It stays as it is.
- Changing what a link, an invite or a file holds.
- Rewording, reordering or "improving" any English text.

## Constraints
- **English stays character-for-character the same**: the smoke test finds things by English text
  ("🔗 Share trip link", "✓ Link copied", "+ Add to my trips", "Update my copy", "Your copy is up to
  date", "Your copy already has everything in this link.", "Which one are you?").
- No new dependencies, no data, Dexie, link, backup, sync-protocol or CSP change, no version bump.
- Follows `specs/translation-layer.md`: its sections "The layer", "Message conventions", "Glossary"
  and "Style" apply here unchanged. Read them before any task.

## Context for implementers
- The layer as built: `src/i18n/index.ts` (`m`), `src/i18n/en/index.ts`, `src/i18n/pt/index.ts`.
  Copy the shape of `src/i18n/en/trip.tsx` and `src/i18n/pt/trip.tsx` (strings, functions taking
  numbers and names, Portuguese agreeing with a count), and how `src/ui/pages/TripInfoPage.tsx`
  uses `m`.
- New areas, one file each in `en/` and `pt/`, registered in both `index.ts` files in alphabetical
  order: `share` (Share page, unsent notice, Open page, trip link page, hand-off card) and `server`
  (Sync server page, "Put it on the server" page, sync status, "no longer on this trip" notice).
- Reuse what exists instead of adding a copy: `m.common.yourTrips`, `settings`, `cancel`, `done`;
  `m.trip.shareWithGroup` ("Share with the group"), `yourName`, `whichOneAreYou`, `you` (the "you"
  chip), `youParen`, `remove`, `notOnServerGetsLinks`, `putOnServer` ("🌐 Put it on the server");
  `m.settings.syncServer` ("Sync server"). Add to `common`, once: `linkCopied` ("✓ Link copied"),
  `shared` ("✓ Shared") and `ok` ("OK", the same in Portuguese); they are used in both new areas.
- Sentences built from pieces today become one function message each. Decided shapes:
  - `share.counts: (n: { stays: number; journeys: number; activities: number; places: number; expenses: number }) => string[]`:
    the five "3 stays" texts, in that order. Used at `SharePage.tsx:47-53` and
    `TripLinkPage.tsx:77-83`; the screens keep their `join(' · ')` and their `<li>`s.
  - `share.shareText: (who: string, tripName: string) => string` for `SharePage.tsx:36` (`who` may
    be empty: "Here’s “…” on waypoints…").
  - `share.serverNote: (onServer: string[], others: string[]) => string` for the whole text of
    `ServerNote` (`SharePage.tsx:108-111`), both sentences with the single space between them.
  - `share.longLink: (characters: string) => string`; the screen keeps `link.length.toLocaleString()`.
  - `share.sharedBy: (name: string | undefined) => string` ("Ana shared a trip" / "A shared trip");
    the screen keeps ` · ` and `fmtTimestamp`.
  - A sentence holding an element takes it as a `ReactNode`: `SharePage.tsx:93-94` (the
    `<strong>`; its text is its own message, "Open a trip link or file"), `TripLinkPage.tsx:125`
    (the `<strong>` summary), `HandOff.tsx:42` (the `<strong>`; its text is its own message).
  - `ServerStatus.tsx:40-41`: `server.couldntSync: (ago: string | undefined, reason: string) => string`
    and `server.savedWillGoUp: (n: number) => string`; `:45-46`: `synced: (ago: string)`,
    `waitingFirstSync`, `toSend: (n: number)`; `:51-52`: `refused: (n: number, reason: string) => string`
    (the whole text, both sentences). The screen keeps the single spaces and the ` · ` it has today.
  - `ServerPage.tsx:236-238`: `disconnectedFrom: (host: string, waiting: number) => string` (the
    whole notice); `:248-249`: `disconnectConfirm: (admin: boolean) => string`; `:263`:
    `onHost: (host: string, trips: number) => string`; `:287-288`: `inviteShareText: (memberName: string | undefined) => string`;
    `:293-295`: `inviteIntro: (memberName: string | undefined) => string` and
    `worksOnceUntil: (date: string) => string`, joined by the screen with the single space;
    `:299`: `shareTitle` ("waypoints sync server"); `:328`: `peopleText: (admin: boolean) => string`
    (both sentences); `:396`: `active: (ago: string)` and `added: (ago: string)`.
- Reasons stay as they come (part 5): `err.message` in `useAction` (`ServerPage.tsx:41`) and in
  `OpenPage.tsx:50` / `TripLinkPage.tsx:30` when it is a `DataError`, `server.lastError`,
  `server.rejected[0].reason`. The fallbacks written in those screens ("That file couldn't be
  opened.", "This link couldn't be opened.") are messages.
- Not messages: routes and query words (`'invite'`, `'server'`, `'as'`), `'new'`, `'invite' | 'admin'`,
  `'shared' | 'copied'`, the address placeholders (`https://my-server.example.ts.net:13443`,
  `https://…/waypoints/#/t/…`), the example code `K7QM-2XRP-9HTW` inside its placeholder sentence,
  file names (`….waypoints.json`), `🌐 {m.name}`, `👤`, `🧭`, `🧳`, Safari, `className`s.
- **Today** (`src/index.css:446`, `src/ui/pages/PlanPage.tsx:175`): delete the CSS rule
  `.day-today .day-head h3::after { content: ' · Today'; }` (keep line 445, the colour). Add
  `plan.dayToday: (date: string) => string` (English `` `${date} · Today` ``, Portuguese
  `` `${date} · Hoje` ``) and write the heading as
  `<h3>{day.day === today ? m.plan.dayToday(fmtDay(day.day)) : fmtDay(day.day)}</h3>`.
- **Selected** (`src/i18n/en/files.tsx:20`, `src/i18n/pt/files.tsx:22`,
  `src/ui/components/Attachments.tsx:159`): `nSelected` becomes a record keyed by
  `'photo' | 'document'`, like `deleteSome` next to it. English: both `` `${n} selected` ``.
  Portuguese: photo "1 selecionada" / "N selecionadas" (also for 0); document "1 selecionado" /
  "N selecionados". The screen reads `m.files.nSelected[noun](n)`.
- **Selection bar** (`src/index.css:165`, the `.select-bar` rule): add `flex-wrap: wrap;` to it.
  Nothing else in that rule changes.
- Smoke tests: `e2e/portuguese.e2e.ts`, and `expectNoEnglish`, `importDemoTrip`, `dismissNotices`
  in `e2e/fixtures.ts`. `setUp` and `shareLink` in `e2e/share-merge.e2e.ts:7-21` show how a test
  gets a trip link from the clipboard; that file is not edited and exports nothing, so the new test
  has its own copy of `setUp`.

Glossary for this part (adds to `specs/translation-layer.md`; fixed):

| English | Portuguese | English | Portuguese |
|---|---|---|---|
| invite / Invite someone | convite / Convidar alguém | admin (chip) / the admin | admin / o administrador |
| sign-in link | link de acesso | Sign in as Ana | Entrar como Ana |
| Connect / Connecting… | Ligar / A ligar… | Disconnect (button) | Desligar do servidor |
| Disconnect this phone | Desligar este telemóvel do servidor | disconnected (a phone) | desligado do servidor |
| server address | endereço do servidor (never "morada") | server code | código do servidor |
| Sync now / Syncing… / Synced | Sincronizar agora / A sincronizar… / Sincronizado | change / changes | alteração / alterações |
| Forget this server | Esquecer este servidor | Continue / Checking… | Continuar / A verificar… |
| I have an invite / I run the server | Tenho um convite / O servidor é meu | Who are you? / Someone new | Quem és tu? / Alguém novo |
| People on the server / Your phones | Pessoas no servidor / Os teus telemóveis | this phone (chip) | este telemóvel |
| Add another phone / Connected phones | Adicionar outro telemóvel / Telemóveis ligados | This phone's name | Nome deste telemóvel |
| Change address / Save address | Alterar endereço / Guardar endereço | Who's who | Quem é quem |
| your copy | a tua cópia | group chat | conversa de grupo |
| Share trip link / Share the link | Partilhar link da viagem / Partilhar o link | Link copied / Shared | Link copiado / Partilhado |
| Save as a file | Guardar como ficheiro | Send update | Enviar atualização |
| Open a trip / Open link / Open a file | Abrir uma viagem / Abrir link / Abrir um ficheiro | Paste / Paste trip link | Colar / Colar link da viagem |
| Add to my trips / Update my copy | Adicionar às minhas viagens / Atualizar a minha cópia | Open the trip | Abrir a viagem |
| Add me / Skip for now | Adicionar-me / Agora não | phone-only trip | viagem só neste telemóvel |
| Open in the waypoints app | Abrir na app waypoints | Today | Hoje |

Fixed translations (the smoke test looks for them): "🔗 Share trip link" → "🔗 Partilhar link da
viagem"; "✓ Link copied" → "✓ Link copiado"; "Open a trip" → "Abrir uma viagem"; "+ Add to my
trips" → "+ Adicionar às minhas viagens"; "Skip for now" → "Agora não"; "I have an invite" / "I run
the server" → "Tenho um convite" / "O servidor é meu"; "Connect" → "Ligar"; "Connect this phone to
a sync server first." → "Liga primeiro este telemóvel a um servidor de sincronização."; "Open a trip
link or file" (inside the Share page's sentence) → "Abrir um link ou ficheiro de viagem", the same
words as `home.openTripLinkOrFile`; "Open a trip link" (inside the hand-off card) → "Abrir um link
ou ficheiro de viagem" too, as that is the button the person will find.

**The checks.** Each task's "Done when" uses this helper, which counts matching lines outside
comment lines. Run it in Git Bash from the repo root:

```sh
t() { grep -vE '^\s*(//|/?\*)' "$1" | grep -cE "$2"; }
```

The patterns are samples that catch a forgotten text; the rule is "every text people read".

## Tasks

1. **The Share page and the unsent notice**
   - Change: create the `share` area in both languages and register it; add `linkCopied`, `shared`
     and `ok` to `common`. Move every text people read in `src/ui/pages/SharePage.tsx` and
     `src/ui/components/UnsentNotice.tsx` into `share` (or the reused messages), with the shapes in
     Context.
   - Depends on: none
   - Done when: both print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/pages/SharePage.tsx "Share with the group|Everyone keeps their own|No server is involved|merged item by item|Your name|Shown to the others|\"Optional\"|haven't seen yet|Link copied|✓ Shared|Share trip link|Paste it into|makes a long link|Save as a file|Anyone with the link|Open a trip link or file|is on the sync server|still handy|on waypoints\. Open|plural\("
     t src/ui/components/UnsentNotice.tsx "hasn't seen yet|Send update|plural\("
     ```
   - Executor: sonnet

2. **Opening a trip: the Open page, the trip link page and the hand-off card**
   - Change: move every text people read in `src/ui/pages/OpenPage.tsx`,
     `src/ui/pages/TripLinkPage.tsx` and `src/ui/components/HandOff.tsx` into `share` (or the reused
     messages), in both languages, including the three `setError` texts, the "Opened N trips: …"
     notice and `aria-label="Trip link"`. `TripLinkPage.tsx:68` stays as it is.
   - Depends on: task 1
   - Done when: all three print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/pages/OpenPage.tsx "isn't a waypoints trip link|Couldn't paste|Opened [$]|couldn't be opened|Your trips|Open a trip|Paste a trip link|Paste trip link|\"Trip link\"|Open link|Open a file|plural\("
     t src/ui/pages/TripLinkPage.tsx "couldn't be opened|Your trips|Open the trip|shared a trip|A shared trip|>With |Your copy|Add to my trips|saved on this phone|Changes for your copy|Update my copy|newest version|is on your phone|Which one are you|Not on the list|'Your name'|Add me|Skip for now|plural\("
     t src/ui/components/HandOff.tsx "Link copied|Open in the waypoints app|Safari keeps|Copy this link|from your Home Screen|Open a trip link|and then Paste|No waypoints on|Use it here"
     ```
   - Executor: sonnet

3. **Sync status, the "no longer on this trip" notice and "Put it on the server"**
   - Change: create the `server` area in both languages and register it. Move every text people
     read in `src/ui/components/ServerStatus.tsx`, `src/ui/components/ServerGoneNotice.tsx` and
     `src/ui/pages/MoveToServerPage.tsx` into it (or the reused messages), with the shapes in
     Context. `server.lastError` and `server.rejected[0].reason` are passed in as they come.
   - Depends on: task 1
   - Done when: all three print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/components/ServerStatus.tsx "was disconnected|Sync server settings|Couldn't sync|last time|will go up|Synced |first sync|to send|server refused|They stay on|Syncing|Sync now|plural\("
     t src/ui/components/ServerGoneNotice.tsx "no longer on this trip|stays on this phone|^ +OK$"
     t src/ui/pages/MoveToServerPage.tsx "is on the server|Back to the trip|Connect this phone|Sync server|Choose which traveller|” on the server|Say who each|Who's who|\(you\)|gets links|Only the people linked|go up too|^ +Cancel$|Put it on the server"
     ```
   - Executor: sonnet

4. **The Sync server page**
   - Change: move every text people read in `src/ui/pages/ServerPage.tsx` into `server` (or the
     reused messages), in both languages: headings, paragraphs, labels, hints, the placeholder
     sentence, buttons, chips, `aria-label`s, the three `confirm` texts and the two texts shared with
     an invite. `err.message` in `useAction` stays as it comes. In `src/i18n/pt/settings.tsx:24`,
     change `', mas este telemóvel foi desligado.'` to `', mas este telemóvel foi desligado do servidor.'`.
   - Depends on: task 3
   - Done when: the first prints 0 and the second prints 1, and `npm run typecheck`, `npm run lint`
     and `npm test` pass:
     ```sh
     t src/ui/pages/ServerPage.tsx ">Settings<|>Sync server<|Optional\. With|I have an invite|I run the server|Invite link or code|From the server's admin|A link, or a code|Server address|Server code|Printed in the server|Who are you|Someone new|Already on the server|signs this phone in|Your name|How the others|This phone's name|Shown in your list|Connecting…|'Continue'|Sign in as|'Connect'|A safety copy|was disconnected from|Forget this server|the server code'|sign-in link from|Disconnect this phone|already connected|>admin<|on the server$|Stops syncing|^ +Disconnect$|Sign in to the|Join my waypoints|A sign-in link|An invite for|It works once|waypoints sync server'|Link copied|✓ Shared|Share the link|^ +Done$|from the server\?|People on the server|seen only by|>you<|^ +Sign-in link$|^ +Remove$|Invite someone|Lost a phone|stops syncing right away|Your phones|Use the server on another|Add another phone|Connected phones|>this phone<|Active [$]|Added [$]|is now reached|New server address|Checking…|Save address|^ +Cancel$|Change address|plural\("
     grep -c "foi desligado do servidor" src/i18n/pt/settings.tsx
     ```
   - Executor: sonnet

5. **Today, "selecionadas" and the selection bar**
   - Change: the three changes described in Context under **Today**, **Selected** and **Selection
     bar**: `src/index.css`, `src/ui/pages/PlanPage.tsx`, `src/i18n/{en,pt}/plan.tsx`,
     `src/i18n/{en,pt}/files.tsx`, `src/ui/components/Attachments.tsx`. Create
     `src/i18n/selected.test.ts` (import `en` from `./en` and `pt` from `./pt`) with:
     `en.files.nSelected.photo(2)` and `.document(2)` are `'2 selected'`;
     `pt.files.nSelected.photo(1)` is `'1 selecionada'`, `.photo(2)` `'2 selecionadas'`, `.photo(0)`
     `'0 selecionadas'`; `pt.files.nSelected.document(1)` is `'1 selecionado'`, `.document(3)`
     `'3 selecionados'`; `en.plan.dayToday('Wed 10 Mar')` is `'Wed 10 Mar · Today'` and
     `pt.plan.dayToday('qua., 10/03')` is `'qua., 10/03 · Hoje'`.
   - Depends on: none
   - Done when: `npx vitest run src/i18n` passes; `grep -c "Today" src/index.css` prints 0;
     `grep -c "nSelected(n)" src/ui/components/Attachments.tsx` prints 0;
     `sed -n '/^\.select-bar {/,/^}/p' src/index.css | grep -c "flex-wrap: wrap"` prints 1;
     `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

6. **Smoke test for the preview**
   - Change: add to `e2e/portuguese.e2e.ts` two tests. Existing tests are not edited.
     **Test A** calls `importDemoTrip(page)`, then, with `id = backup.trips[0].id`:
     (a) `page.goto('?lang=pt#/open')`: the heading "Abrir uma viagem" is visible and
     `expectNoEnglish` holds;
     (b) `?lang=pt#/server`: the heading "Servidor de sincronização", the tabs "Tenho um convite" and
     "O servidor é meu" and the button named exactly "Ligar" are visible, and `expectNoEnglish` holds;
     (c) `` `?lang=pt#/trips/${id}/server` ``: the text "Liga primeiro este telemóvel a um servidor de
     sincronização." is visible;
     (d) `` `?lang=pt#/trips/${id}/photos` ``: write a small text file to a temp folder (as
     `importDemoTrip` does), set it on
     `page.locator('label', { hasText: 'Adicionar documentos' }).locator('input[type=file]')`, click
     the button named exactly "Adicionar", then the button named exactly "Selecionar"; "0
     selecionados" is visible, and the buttons "Selecionar tudo", "Eliminar" and "Cancelar" each
     pass `toBeInViewport({ ratio: 1 })`.
     **Test B** takes `{ page, newPhone }`, makes both phones ready with its own copy of `setUp`
     from `e2e/share-merge.e2e.ts:7-13` (without the clock line), calls `importDemoTrip(page)`, then:
     `` `?lang=pt#/trips/${id}/share` ``: the heading "Partilhar com o grupo" is visible and
     `expectNoEnglish` holds; click the button "🔗 Partilhar link da viagem"; "✓ Link copiado" is
     visible; read the link with `page.evaluate<string>('navigator.clipboard.readText()')`; on the
     second phone, `goto(link.replace('#/t/', '?lang=pt#/t/'))`; the button "+ Adicionar às minhas
     viagens" is visible; click it; the text "Qual deles és tu?" and the button "Agora não" are
     visible.
   - Depends on: tasks 2, 4, 5
   - Done when: `npm run smoke` passes, with the two new tests and every existing one.
   - Executor: sonnet

7. **Glossary and series upkeep**
   - Change: in `specs/translation-layer.md`, append to the Glossary table every row of this
     spec's "Glossary for this part", plus a row for any sharing or server term that was chosen
     while building and is in neither table. In the same file's Notes, replace items 4 and 5 of
     "The series" with:
     "4. sharing and server screens: open/share/link pages, server pages and notices
     (`translate-sharing-and-server`);
     5. text outside the screens: text in `src/lib`, `src/sync`, `src/db` and `src/domain` (error
     reasons become codes), sync server reasons as codes (new server image), packing templates,
     calendar export;
     6. the switch: Language in Settings (Automatic / English / Português), Portuguese on phones set
     to Portuguese, dates and numbers following the app's language, `<html lang>`, What's new notes
     in both languages (CI-enforced), the guide and its screenshots in Portuguese, version bump."
     Change nothing else in that file.
   - Depends on: task 6
   - Done when: `grep -c "link de acesso" specs/translation-layer.md` prints 1,
     `grep -c "Desligar do servidor" specs/translation-layer.md` prints 1 and
     `grep -c "6. the switch" specs/translation-layer.md` prints 1.
   - Executor: sonnet

## Acceptance criteria
- [ ] `npm run smoke` passes: every test that existed before (English unchanged) plus the two new
      Portuguese tests.
- [ ] `npx vitest run src/i18n src/ui` passes (same keys and leaf types in `en` and `pt`, no empty
      text, the cases in `selected.test.ts`).
- [ ] Every "prints 0" check in tasks 1 to 5 prints 0.
- [ ] `for f in $(ls src/ui/*.ts* src/ui/pages/*.tsx src/ui/components/*.tsx src/ui/items/*.tsx | grep -v test); do grep -q "i18n" $f || echo $f; done`
      prints only `src/ui/components/Combobox.tsx` and `src/ui/hooks.ts` (no text of their own).
- [ ] `git diff origin/main --stat` lists no file under `src/domain/`, `src/db/`, `src/sync/`,
      `src/lib/`, `server/` or `scripts/`, and not `package.json`, `CHANGELOG.md`, `GUIDE.md` or
      `e2e/share-merge.e2e.ts`.
- [ ] `grep -rn "from '\.\./\.\./ui\|from '\.\./\.\./db\|from '\.\./\.\./lib" src/i18n` prints nothing.
- [ ] `grep -rnE "\b(tela|arquivo|celular|compartilhar|salvar|usuário)\b" src/i18n/pt` prints
      nothing, and `grep -rn "morada do servidor" src/i18n/pt` prints nothing.
- [ ] With `npm run dev`, `http://localhost:5173/?lang=pt#/server` reads in Portuguese from top to
      bottom, in both tabs; `http://localhost:5173/#/server` reads exactly as on `main`.
- [ ] With `npm run dev` and a trip that includes today, the Plan's heading for today ends in
      " · Today" in the accent colour, as on `main`; with `?lang=pt` it ends in " · Hoje".
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: no errors.
- `npm run smoke` (first run: `npx playwright install chromium`): all tests pass.
- Manual: `npm run dev`, import a trip, then the addresses in the acceptance criteria at phone
  width (360px).

## Escalate when
- A sharing or server term is in no Glossary and has more than one natural PT-PT translation
  (list them).
- An English text can't stay character-for-character the same, or a sentence is built from pieces
  in a way the conventions and the shapes listed in Context don't cover.
- A Portuguese sentence needs something the screen doesn't pass (gender, a count) and getting it
  means changing logic, not just text.
- A text to move turns out to be made in a file this spec says not to touch, other than the
  reasons listed under Behavior.
- `expectNoEnglish` fails on the Open, Sync server or Share page because of a name, the demo
  trip's own data or a correct Portuguese word.
- The selection bar still cuts a button off at 360px with `flex-wrap: wrap`, or the English bar
  changes shape at 360px.
- An existing smoke test or `scripts/guide/screenshots.ts` would need changing.
- Any change seems needed outside the files named in the tasks, or a new dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 4 of the series listed in `specs/translation-layer.md` (Notes). Parts 1 to 3 are shipped, so
  `Builds after` is "none".
- Decided with Ricardo for this part: the original part 4 is cut in two. This spec has the
  screens; the text outside `src/ui` (reasons as codes, the server image, packing templates,
  calendar text) becomes part 5, and the Language switch part 6. Task 7 updates the series list.
- Decided with Ricardo: "link de acesso" and "Entrar como Ana"; "Desligar do servidor" (always
  with "do servidor", because "desligar o telemóvel" means switching it off); the three leftovers
  from parts 2 and 3 are fixed here. The other glossary rows were picked while speccing. A server's
  address is "endereço", not "morada" (a postal address).
- The message sent with a link or an invite follows the sender's language, because the app can't
  know the reader's; the link itself opens in the reader's language.
- " · Today" moves from CSS into the heading's text. It looks the same, and screen readers now
  read it. No smoke test or screenshot selector looks for a day heading.
- `flex-wrap` also applies in English, where the bar fits on one line at 360px, so nothing people
  see changes and there is no version bump.
- `expectNoEnglish` runs on the Open, Sync server (not connected) and Share pages: they show no
  trip data beyond counts. The trip link page shows the trip's own English name and people.
- Smoke test (d) uses a document, not a photo: it needs no image, and the Documents tab is the
  Files tab's default. The photo wording is covered by `selected.test.ts`.
- Overlap: the draft spec `qr-join` touches the Share page moved here. It is not built;
  whichever is built later follows the CLAUDE.md rule (text in both languages), and if `qr-join`
  lands first, its text is moved here like the rest. No shared helper, table or Dexie version is
  involved, so `Builds after` stays "none".
