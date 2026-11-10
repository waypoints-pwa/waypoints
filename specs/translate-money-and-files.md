# Money, files, reviews and the report in both languages (Portuguese, part 3)

Status: ready
Issue: 
Builds after: none

## Problem
Parts 1 and 2 (`specs/translation-layer.md`, `specs/translate-plan-and-items.md`, both shipped) moved
the trip list, Settings, the Plan and the items onto the translation layer. The Money and Files tabs,
reviews, votes and the trip report are still English text written inline, so the app can't be offered
in Portuguese (PT-PT). This part moves them, with their Portuguese text.

## Behavior
- **Nothing changes for people using the app**: every screen reads exactly as before, in English.
  No version bump, no What's new.
- **In the `?lang=pt` preview** (part 1), the screens moved here read in Portuguese. Example:
  `…/waypoints/?lang=pt#/trips/<id>/expenses/new` shows **Nova despesa**, the fields **Para quê**,
  **Valor**, **Pago com** (**💵 Dinheiro** / **💳 Cartão**), **Dia**, **Categoria**, and the buttons
  **Cancelar** and **Guardar**; `…/photos` shows **Ficheiros** with the tabs **Documentos** and
  **Fotos**; `…/report` shows **Relatório da viagem** and **A viagem em números**.
- Moved in this part: the Money tab (totals, balances, settling up, exchange rates, the expense
  list), the expense, payment and exchange forms and the expense page; the Files tab, its photo
  pages, the photo/document page and form, and the "Photos & documents" card on item pages; the
  Reviews page, the reviews card and the "I want to go" vote on item pages; the trip report page
  and the report itself, as it shows, prints and goes into the exported file.
- **A settle-up payment** is still saved with the title "Payment", as today (it is stored text in
  the shared trip). Where the app shows an expense's title, a payment whose saved title is exactly
  "Payment" shows the app's word for it: "Payment" in English (no change), "Pagamento" in the preview.
- **The exported report file** is in the language the page is in: its text is the page's text, its
  browser title is "<trip name> · trip report" (preview: "<trip name> · relatório da viagem"), and
  its `<html lang>` is `en` or `pt`. Its file name stays `<trip>-report[-shareable].html`.
- **A report kept on the sync server** holds numbers, names and dates, not sentences, so each phone
  shows the same kept report in its own language. Nothing changes in what is kept.
- Still English in the preview (later parts): what people typed (names, titles, notes, captions),
  dates, numbers and money amounts, reasons that come from `src/lib`, `src/sync` or the server (a
  file that can't be read, "too large", why the server refused a file, a failed download), the
  " · Today" after today's date in the Plan (CSS), and every Share, link and server screen.
- Offline, sync, links, backups and stored data are untouched.

## Out of scope
- Everything parts 1 and 2 left out and that is not listed above: the Language setting, date and
  number formats, the app's own `<html lang>`, What's new notes, the guide.
- Any file under `src/domain/`, `src/db/`, `src/sync/`, `server/`, `scripts/`, and any file under
  `src/lib/` other than `reportFile.ts`.
- `src/ui/pages/SharePage.tsx`, `OpenPage.tsx`, `TripLinkPage.tsx`, `ServerPage.tsx`,
  `MoveToServerPage.tsx`, and the components `ServerStatus`, `ServerGoneNotice`, `UnsentNotice`,
  `HandOff` (part 4).
- Changing what is saved: the "Payment" title, record kinds, the kept report's `data`.
- `src/index.css` (the " · Today" text stays for a later part).
- Rewording, reordering or "improving" any English text.

## Constraints
- **English stays character-for-character the same**: the smoke test and
  `scripts/guide/screenshots.ts` find things by English text ("Add photos", "Add", "Select",
  `^Added 4 photos`, "Exchange rates", "Activities", "Which one are you?").
- No new dependencies, no data, Dexie, link, backup, sync-protocol or CSP change, no version bump.
- Follows `specs/translation-layer.md`: its sections "The layer", "Message conventions", "Glossary"
  and "Style" apply here unchanged. Read them before any task.
- The shareable report still leaves names, notes, photos and per-person money out of the page
  itself (CLAUDE.md, "Trip reports"): moving text must not move any element in or out of it.

## Context for implementers
- The layer as built: `src/i18n/index.ts` (`m`, `language`), `src/i18n/en/index.ts`,
  `src/i18n/pt/index.ts`. Copy the shape of `src/i18n/en/items.tsx` and `src/i18n/pt/items.tsx`
  (strings, functions, a record keyed by kind), and how `src/ui/items/stays.tsx` uses `m`.
- New areas, one file each in `en/` and `pt/`, registered in both `index.ts` files in alphabetical
  order: `money` (Money tab, expense, payment and exchange forms, expense page), `files`,
  `reviews` (reviews and votes), `report`.
- Reuse what exists instead of adding a copy: `m.common.save`, `cancel`, `delete`, `add`, `notes`,
  `name`, `someone`; `m.items.editButton` ("✏️ Edit"), `m.items.couldntSave`;
  `m.trip.whichOneAreYou`, `m.trip.youParen` (" (you)"), `m.trip.you`. A word used with the same
  meaning in two of this part's areas (Day, Select, Photos) goes in `common`, once.
- Sentences built from pieces today become one function message each, taking the numbers, names
  and elements as arguments. The ones that need care, because Portuguese changes with number or
  gender:
  - `src/ui/items/expenses.tsx:144` (`gets back …` / `owes …` / `square`), `:162-163` and `:224-227`
    ("N card payments is/are … it's yours / all yours / N of them yours … cost pending chip"; the
    chip is passed in as a `ReactNode`), `:216-217`, `:293` (`splitSummary`), `:487-490`, `:505`,
    `:608`.
  - Confirmations made of several sentences (`src/ui/components/Attachments.tsx:149-151`,
    `src/ui/items/attachments.tsx:65-67` and `:223-224`, `src/ui/items/exchanges.tsx:61`): each
    sentence is its own message, and the screen joins them with the single space they have today,
    as `ItemFooter` does in `src/ui/items/common.tsx`.
  - Anything said about "this photo" / "this document" (`what(a)` in `src/ui/items/attachments.tsx:19`,
    the `noun` prop of `SelectBar`, `plural(n, 'photo')`): a record keyed by `'photo' | 'document'`
    holding the whole sentence or a function of the count, e.g.
    `deleteSome: { photo: (n: number) => \`Delete ${plural(n, 'photo')}?\`, document: … }`. Type
    `SelectBar`'s `noun` prop as `'photo' | 'document'`.
  - Anything said about a booking's journeys ("For every flight on booking X", "It goes from every
    journey on booking X", "Every flight on booking X:"): a record keyed by `'flight' | 'journey'`.
    In `src/ui/attachments.ts:62`, type `Booking.noun` as `'flight' | 'journey'` (what `legNoun` in
    `src/domain/bookings.ts:24` already returns).
  - Report tiles that change with the count (`src/ui/components/ReportView.tsx:51-58`: City/Cities,
    Night away/Nights away…) are functions of the count returning the label; every `plural(n, …)`
    in the report becomes a function message of `n`.
- `src/ui/attachments.ts:69-75` (`ITEM_GROUPS`) and `src/ui/fileGroups.ts:7-14` (`FILE_GROUPS`,
  and `'Whole trip'` at `:65`) read their labels from `m.files.groups` (one set: trip, stays,
  transports, activities, places, expenses). Keep keys, order and shapes;
  `src/ui/fileGroups.test.ts` must pass unchanged (under Vitest the language is English).
- **The payment title.** In `src/ui/labels.ts` add
  `export const PAYMENT_TITLE = 'Payment'` (the saved title, never translated) and
  `export const expenseTitle = (e: { title: string; transfer?: boolean }) => (e.transfer && e.title === PAYMENT_TITLE ? m.money.payment : e.title)`.
  Use `PAYMENT_TITLE` where the form saves it (`expenses.tsx:433`) and `expenseTitle(e)` where an
  expense's title shows: `ExpenseRow` (`expenses.tsx:311`), `ExpensePage`'s `DetailHead` (`:653`)
  and the expenses line of `attachableItems` (`src/ui/attachments.ts:88`).
- **The exported file.** `reportFile` in `src/lib/reportFile.ts:36` gets a fourth parameter,
  `lang: string`, used for `<html lang="…">` at `:52` in place of the fixed `en`. `ReportPage.tsx`
  passes `language` (imported from `../../i18n`) and a title from `m.report.fileTitle(name)`.
  `src/lib` never imports from `src/i18n`. The file name at `ReportPage.tsx:87` is not a message.
- `Stars`, `AverageStars` (`src/ui/components/Reviews.tsx:17`, `:29`) and `Average`
  (`ReportView.tsx:303`) share one message for "Average 4.5 of 5 stars" and one for "4.5 of 5
  stars", both taking the value and the maximum.
- Not messages: `'photo'`, `'document'`, `'cash'`, `'card'`, `'equal'`, `'exact'` and other values
  compared in code, route and query words (`'photos'`, `view`, `sort`, `transfer`), `className`s,
  emoji-only content, amount placeholders (`0.00`, `10000`, `62.50`), currency codes, the `→` in
  routes, `err.message`, `FileProblem` messages thrown by `src/lib/files.ts`, `file.uploadError`.
  The one `FileProblem` made in `Attachments.tsx:324` is a message.
- Smoke tests: `e2e/portuguese.e2e.ts` and `expectNoEnglish`, `importDemoTrip` in `e2e/fixtures.ts`.

Glossary for this part (adds to `specs/translation-layer.md`; fixed):

| English | Portuguese | English | Portuguese |
|---|---|---|---|
| Reviews / review | Avaliações / avaliação | To review / Reviewed | Por avaliar / Avaliados |
| Didn't go (button) / didn't go (in a list) | Não fui / não foi | I want to go | Quero ir |
| Latest / Top rated | Mais recentes / Melhor avaliados | star / stars | estrela / estrelas |
| Cash / Card / Card or bank | Dinheiro / Cartão / Cartão ou banco | Paid with / Paid by | Pago com / Pago por |
| Cash left | Dinheiro que sobra | cost pending / no rate yet | custo pendente / ainda sem taxa |
| Settle up | Acertar contas | square / Everyone is square. | contas certas / Está tudo certo. |
| gets back / owes / pays | recebe / deve / paga a | Balances | Saldos |
| payment / Payment (title) | pagamento / Pagamento | Record payment | Registar pagamento |
| New expense / Edit expense | Nova despesa / Editar despesa | New payment / Edit payment | Novo pagamento / Editar pagamento |
| Money changed / Edit exchange | Novo câmbio / Editar câmbio | Spent so far / Your part | Gasto até agora / A tua parte |
| What for / Amount / Day | Para quê / Valor / Dia | For whom / Split | Para quem / Divisão |
| Split equally / Exact amounts | Dividir por igual / Valores exatos | Not noted | Sem indicação |
| Photos & documents | Fotos e documentos | photo / document | foto / documento |
| Whole trip / The whole trip | Toda a viagem / Toda a viagem | Belongs to / Caption | Pertence a / Legenda |
| Select / Select all / N selected | Selecionar / Selecionar tudo / N selecionados | Share or save | Partilhar ou guardar |
| Stays / Journeys / Activities / Expenses (groups) | Estadias / Trajetos / Atividades / Despesas | Full report / Shareable | Relatório completo / Para partilhar |
| The trip in numbers | A viagem em números | Best of the trip / Not worth it | O melhor da viagem / Não valeu a pena |
| Ideas for next time | Ideias para a próxima | Make it again | Refazer |
| Print or save as PDF | Imprimir ou guardar como PDF | Made with waypoints | Feito com o waypoints |

Fixed translations (the smoke test looks for them): "Expenses" (heading) → "Despesas"; "New
expense" → "Nova despesa"; "New payment" → "Novo pagamento"; "Money changed" → "Novo câmbio";
"Files" → "Ficheiros"; "Documents" / "Photos" → "Documentos" / "Fotos"; "Reviews" → "Avaliações";
"Trip report" → "Relatório da viagem"; "Full report" / "Shareable" → "Relatório completo" / "Para
partilhar"; "The trip in numbers" → "A viagem em números".

**The checks.** Each task's "Done when" uses this helper, which counts matching lines outside
comment lines. Run it in Git Bash from the repo root:

```sh
t() { grep -vE '^\s*(//|/?\*)' "$1" | grep -cE "$2"; }
```

The patterns are samples that catch a forgotten text; the rule is "every text people read".

## Tasks

1. **The Money tab**
   - Change: create the `money` area in both languages and register it. Add `PAYMENT_TITLE` and
     `expenseTitle` to `src/ui/labels.ts` as described. Move every text people read in
     `src/ui/items/expenses.tsx` lines 1 to 328 (`MoneyPage`, `RatesCard`, `SettleRow`,
     `splitSummary`, `ExpenseRow`) into `money`, and use `expenseTitle` in `ExpenseRow`.
   - Depends on: none
   - Done when: this prints 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/items/expenses.tsx "Spent so far|\+ Expense|Your part|Not noted <|Changed money or withdrew|>Balances<|\+ Payment|gets back|owes |'square'|Settle up|Everyone is square|is an estimate|>Expenses<|Note what you spend|Exchange rates|\+ Exchange|can't be counted yet|waiting for what the bank|cost pending<|average of|what you got'|Cash left|Cash converts at|> pays <|Record payment|split by everyone|no rate yet|'Cash'"
     ```
   - Executor: sonnet

2. **Expense, payment and exchange forms, and the expense page**
   - Change: move every text people read in the rest of `src/ui/items/expenses.tsx`
     (`ExpenseForm`, `ExpensePage`) and in `src/ui/items/exchanges.tsx` into `money`, in both
     languages: titles, labels, `aria-label`s, placeholders with words, hints, every `setError`
     text and the delete confirmation. The form saves `PAYMENT_TITLE`; `ExpensePage` shows
     `expenseTitle(e)`.
   - Depends on: task 1
   - Done when: both print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/items/expenses.tsx "What was it for|Enter the amount|Choose the day|Check what the bank|Fill in both|Check the exchange|who received|who it was for|add up to|Edit payment|New payment|Edit expense|New expense|\"What for\"|Dinner, tickets|\"Amount\"|>Amount<|\"Currency\"|will still be owed|Paying part|Paid with|💵 Cash|Card or bank|Not noted for|Converted at|What the bank charged|Not in your bank|Not known yet|What did you get|You got|What it cost|A cash withdrawal|\"Day\"|\"Category\"|'Paid by'|\"To\"|\"Split\"|For whom|Split equally|Exact amounts|each, for|'s part|left to assign|Settle-up payment|Waiting for what|Until then it counts|isn't counted|Add it$|charged by the bank|its own rate|Not counted yet|Add what you got|>Day<|>Notes<|'Split'|'Payment'"
     t src/ui/items/exchanges.tsx "trip's own currency|Enter how much|Enter what it cost|Choose the day|Delete this exchange|Edit exchange|Money changed|Withdrew cash|You got|Amount you got|Currency you got|It cost|\"Day\"|\"Who\"|Airport cash machine|Delete exchange"
     ```
   - Executor: sonnet

3. **Files: shared pieces**
   - Change: create the `files` area in both languages and register it. Move every text people
     read in `src/ui/attachments.ts` (`ITEM_GROUPS`, `stateText`), `src/ui/fileGroups.ts` and
     `src/ui/components/Attachments.tsx` into it. Type `Booking.noun` and `SelectBar`'s `noun` as
     described, and use `expenseTitle` in `attachableItems`. `PhotosPage.tsx` and
     `PhotoGroupPage.tsx` may be edited only as far as the new `noun` type needs.
   - Depends on: task 1
   - Done when: all three print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass
     (`src/ui/fileGroups.test.ts` unchanged):
     ```sh
     t src/ui/attachments.ts "'Stays'|'Journeys'|'Activities'|'Places'|'Expenses'|Only on this phone|Waiting to go up|didn't take it|Shared with the trip|On the server'|Not on the server yet|Not on this phone|too old for photos"
     t src/ui/fileGroups.ts "label: '|'Whole trip'"
     t src/ui/components/Attachments.tsx "whole booking go from|deleted for everyone|Delete [$]|selected<|Select all|^ +(Delete|Cancel|Add)$|Belongs to|The whole trip|Connecting flights|Bought with other|same booking ref|For every|Also shows on|Add photos|Add documents|Adding|is larger than|couldn't be added|Added [{]|Added [$]|\"Caption\"|\"Optional\"|Only on this phone|Not sent to the server|It stays here even|Photos & documents|^ +Add [{]"
     ```
   - Executor: sonnet

4. **Files: the tab and its pages**
   - Change: move every text people read in `src/ui/items/attachments.tsx`,
     `src/ui/pages/PhotosPage.tsx` and `src/ui/pages/PhotoGroupPage.tsx` into `files`, in both
     languages, including the confirmations, "N of M", the "Deleted N photos." notices and the
     `aria-label="View"`. `err.message`, `auto.error` and `file.uploadError` stay as they come.
   - Depends on: task 3
   - Done when: all three print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/items/attachments.tsx "deleted for everyone|It goes from every|Delete this|Getting it from|Previous|Next ›|[}] of [{]|^ +Open$|Share or save|Download|>For<|Every [{]|The whole trip|>Taken<|>Added<|>Size<|Try again|Share it with|deleted from the server|Keep this|Keep it only|needs a name|Couldn't save|Edit [$]|\"Name\"|\"Caption\"|✏️ Edit|^ +Delete$"
     t src/ui/pages/PhotosPage.tsx ">Files<|They stay on this phone|too old to keep|waiting to go up|didn't take|\"View\"|^ +(Documents|Photos|Select)$|Tickets, boarding|Photos of the trip|See all|Deleted [$]|They take"
     t src/ui/pages/PhotoGroupPage.tsx "No photos here|Back to photos|^ +Select$|Deleted [$]|plural\("
     ```
   - Executor: sonnet

5. **Reviews and votes**
   - Change: create the `reviews` area in both languages and register it. Move every text people
     read in `src/ui/components/Reviews.tsx`, `src/ui/components/Votes.tsx` and
     `src/ui/pages/ReviewsPage.tsx` into it, including the star `aria-label`s, the two "So your
     reviews/votes are yours…" hints, the confirmation, and `ReviewsLink`'s lines ("3 to review",
     "A, B and 2 more", "All caught up · 4 things reviewed"). "Which one are you?", "Someone" and
     "Couldn't save. Try again." reuse the existing messages.
   - Depends on: none
   - Done when: all three print 0, and `npm run typecheck`, `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/components/Reviews.tsx "of [$][{]MAX_STARS[}] stars|\"Stars\"|'1 star'|Which one are you|Choose…|So your reviews|Couldn't save|Remove your review|Didn't go|Why not|Worth it|Your note|Save note|Add a note|Remove my review|'You'|'Someone'|didn't go<|>Reviews<"
     t src/ui/components/Votes.tsx "So your votes|I want to go"
     t src/ui/pages/ReviewsPage.tsx ">Reviews<|Nothing to review|show up here|To review <|all caught up|>Reviewed<|\"Order\"|^ +(Latest|Top rated)$|reviewed through|✓ Saved|'more'| and |All caught up|to review\`|'Reviews'"
     ```
   - Executor: sonnet

6. **The trip report and its file**
   - Change: create the `report` area in both languages and register it. Move every text people
     read in `src/ui/pages/ReportPage.tsx` and `src/ui/components/ReportView.tsx` into it. Add the
     `lang` parameter to `reportFile` in `src/lib/reportFile.ts` and pass `language` and
     `m.report.fileTitle(report.trip.name)` from `ReportPage.tsx`, as described. No element moves
     in or out of the shareable version.
   - Depends on: task 5
   - Done when: the first two print 0 and the third prints 0, and `npm run typecheck`,
     `npm run lint` and `npm test` pass:
     ```sh
     t src/ui/pages/ReportPage.tsx "Couldn't keep|Couldn't make|trip report|>Trip report<|\"Version\"|Full report|Shareable$|For anyone|Include what it cost|The total, by|For the group|Print or save|Making the file|Save or send|made by a newer|Kept for everyone|by [$]|has changed since|Make it again|The trip so far|Once it|Keeping it on|Once this phone|Made from the trip"
     t src/ui/components/ReportView.tsx "plural\(|in numbers|label=\"|'City'|'Night away'|'Activity'|'Journey'|'Review'|'Photo'|Busiest day|Longest journey|Priciest day|Most expensive meal|Biggest expense|Ideas for next time|never visited|must-see|>Photos<|Made with waypoints|>Money<|a day[{]| per person|Who paid what|their part|Settling up|> pays <|Everyone is square|without a rate yet|at an estimate|>By day<|Every day's spending|>Reviews<|Nobody reviewed|Best of the trip|Not worth it|Everything else|of 5 stars|didn't go|Stays & journeys| travelling|without times"
     grep -c 'lang="en"' src/lib/reportFile.ts
     ```
   - Executor: sonnet

7. **Smoke test for the preview**
   - Change: add to `e2e/portuguese.e2e.ts` one test that calls `importDemoTrip(page)`, then, with
     `id = backup.trips[0].id`:
     (a) `page.goto(\`?lang=pt#/trips/${id}/money\`)`: the heading "Despesas" is visible;
     (b) `…/expenses/new`: the heading "Nova despesa" and the button "Guardar" are visible;
     `…/expenses/new?transfer=1`: heading "Novo pagamento"; `…/exchanges/new`: heading "Novo câmbio";
     (c) `…/photos`: the heading "Ficheiros" and the tabs "Documentos" and "Fotos" are visible, and
     `expectNoEnglish` holds;
     (d) `…/reviews`: the heading "Avaliações" is visible;
     (e) `…/report`: the heading "Relatório da viagem", the tabs "Relatório completo" and "Para
     partilhar" and the heading "A viagem em números" are visible.
     Existing tests are not edited.
   - Depends on: tasks 2, 4, 6
   - Done when: `npm run smoke` passes, with the new test and every existing one.
   - Executor: sonnet

8. **Glossary upkeep**
   - Change: in `specs/translation-layer.md`, append to the Glossary table every row of this
     spec's "Glossary for this part", plus a row for any money, files or review term that was
     chosen while building and is in neither table. Change nothing else in that file.
   - Depends on: task 7
   - Done when: `grep -c "Acertar contas" specs/translation-layer.md` prints 1 and
     `grep -c "Avaliações" specs/translation-layer.md` prints 1.
   - Executor: sonnet

## Acceptance criteria
- [ ] `npm run smoke` passes: every test that existed before (English unchanged) plus the new
      Portuguese test.
- [ ] `npx vitest run src/i18n src/ui` passes (same keys and leaf types in `en` and `pt`, no empty
      text; `fileGroups.test.ts` and `tripNav.test.ts` unchanged).
- [ ] Every "prints 0" check in tasks 1 to 6 prints 0.
- [ ] `git diff origin/main --stat` lists no file under `src/domain/`, `src/db/`, `src/sync/`,
      `server/` or `scripts/`, no file under `src/lib/` other than `reportFile.ts`, and not
      `package.json`, `CHANGELOG.md`, `GUIDE.md`, `src/index.css` or any file named in Out of scope.
- [ ] `grep -rn "from '\.\./\.\./ui\|from '\.\./\.\./db\|from '\.\./\.\./lib" src/i18n` and
      `grep -n "i18n" src/lib/reportFile.ts` print nothing.
- [ ] `grep -rnE "\b(tela|arquivo|celular|compartilhar|salvar|usuário)\b" src/i18n/pt` prints nothing.
- [ ] `grep -c "PAYMENT_TITLE" src/ui/items/expenses.tsx` prints 1 or more, and
      `grep -rn "'Payment'" src/ui src/i18n/pt` shows only the `PAYMENT_TITLE` line in
      `src/ui/labels.ts`.
- [ ] With `npm run dev` and a trip with a settle-up payment, `http://localhost:5173/?lang=pt#/trips/<id>/money`
      reads in Portuguese apart from what Behavior lists as still English, and the payment shows as
      "Pagamento"; the same address without `?lang=pt` reads exactly as on `main`.
- [ ] From `?lang=pt#/trips/<id>/report`, "Guardar ou enviar como ficheiro" gives a file whose first
      lines hold `<html lang="pt">` and a `<title>` ending in "· relatório da viagem"; without
      `?lang=pt` they hold `<html lang="en">` and "· trip report".
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: no errors.
- `npm run smoke` (first run: `npx playwright install chromium`): all tests pass.
- Manual: `npm run dev`, import a trip, add a payment between two travellers, then the addresses
  in the acceptance criteria at phone width (360px).

## Escalate when
- A money, files or review term is in no Glossary and has more than one natural PT-PT translation
  (list them).
- An English text can't stay character-for-character the same, or a sentence is built from pieces
  in a way the conventions and the cases listed in Context don't cover.
- A Portuguese sentence needs something the screen doesn't pass (gender, a count, whose phone) and
  getting it means changing logic, not just text.
- Showing `expenseTitle` would be needed in a file not named in this spec, or anything about what
  is saved for a payment would change.
- A listed file shows text that comes from a file this spec says not to touch, other than the
  cases listed under Behavior.
- `expectNoEnglish` fails on the Files tab because of a name, the demo trip's own data or a
  correct Portuguese word.
- An existing smoke test, `fileGroups.test.ts` or `scripts/guide/screenshots.ts` would need changing.
- Any change seems needed outside the files named in the tasks, or a new dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 3 of the series listed in `specs/translation-layer.md` (Notes). Parts 1 and 2 are shipped,
  so `Builds after` is "none".
- Decided with Ricardo for this part: "Avaliações"; cash is "Dinheiro", the same word as the Money
  tab (the context tells them apart); "Acertar contas", "contas certas" and "Está tudo certo."; a
  payment keeps its saved title "Payment" and shows as "Pagamento" in Portuguese. The other
  glossary rows were picked while speccing.
- The payment title is matched exactly ("Payment") rather than shown for every transfer, so a
  payment whose title was ever saved differently reads as it always did.
- `reportFile.ts` is the one `src/lib` file touched, because the series puts the exported file in
  this part; it takes the language as an argument so `src/lib` stays free of `src/i18n`.
- `expectNoEnglish` runs only on the Files tab: the demo trip comes from a file, so it has no photos
  or documents, and the other pages show the trip's own English data or currency names.
- Left for part 4, with the other text outside `src/ui`: reasons from `src/lib/files.ts`
  (`FileProblem`), `src/sync` and the server. Left for a later part: the Plan's " · Today" (CSS).
- Overlap: the draft specs `trip-budget` and `expenses-csv-export` touch the Money screens moved
  here. Whichever is built later follows the CLAUDE.md rule (text in both
  languages); if one lands first, its text is moved here like the rest.
