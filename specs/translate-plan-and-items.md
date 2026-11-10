# Plan and items in both languages (Portuguese, part 2)

Status: shipped
Issue: https://github.com/waypoints-pwa/waypoints/issues/72
Builds after: none

## Problem
Part 1 (`specs/translation-layer.md`, shipped) added the translation layer and moved the trip list and
Settings onto it. Everything inside a trip is still English text written inline, so the app can't be
offered in Portuguese (PT-PT). This part moves the trip's frame, the Plan, stays, journeys,
activities, places, the trip form, the Trip tab and the packing page, with their Portuguese text.

## Behavior
- **Nothing changes for people using the app**: every screen reads exactly as before, in English.
  No version bump, no What's new.
- **In the `?lang=pt` preview** (part 1), the screens moved here read in Portuguese. Example:
  `…/waypoints/?lang=pt#/trips/<id>/stays/new` shows **Nova estadia**, the fields **Nome**, **Tipo**,
  **Check-in**, **Check-out**, and the buttons **Cancelar** and **Guardar**; the tabs at the bottom
  read **Plano · Locais · Dinheiro · Ficheiros · Viagem**.
- Moved in this part: the trip's top bar and tabs, the "not on this phone" and "not in the trip any
  more" pages, the item form frame (Cancel/Save, Edit/Delete and its confirmation), map, calendar
  and call buttons, the connection card, all form fields (dates, time zones, currencies, cities,
  airports, addresses), the Plan tab and its entries, stay, journey, activity and place pages and
  forms, the Google Maps list import page, the trip form, the Trip tab, and the packing page.
- Still English in the preview (later parts): what the people typed (names, notes), dates and
  numbers, the photos/documents, reviews and votes blocks shown on item pages, the server status and
  "unsent changes" blocks, reasons that come from the sync server or from `src/domain` (connection
  warnings, lookup and leave errors), calendar event text, packing template names and items, and
  every Money, Files, Reviews, Report, Share and server screen.
- Offline, sync, links, backups and stored data are untouched.

## Out of scope
- Everything part 1 left out and that is not listed above: the Language setting, formats, `<html lang>`,
  What's new notes, the guide.
- Any file under `src/domain/`, `src/db/`, `src/sync/`, `src/lib/`, `server/`, `scripts/`.
- `src/ui/items/expenses.tsx`, `exchanges.tsx`, `attachments.tsx`, `src/ui/attachments.ts`,
  `fileGroups.ts`, and the components `Attachments`, `Reviews`, `Votes`, `ReportView`, `ServerStatus`,
  `ServerGoneNotice`, `UnsentNotice`, `HandOff` (parts 3 and 4).
- Packing templates (`TEMPLATES` in `src/domain/packing.ts`): names and items stay English (part 4).
- Rewording, reordering or "improving" any English text.

## Constraints
- **English stays character-for-character the same**: the smoke test and
  `scripts/guide/screenshots.ts` find things by English text (tab names, "Add", "Select",
  "Which one are you?", headings).
- No new dependencies, no data, Dexie, link, backup, sync or CSP change, no version bump.
- Follows `specs/translation-layer.md`: its sections "The layer", "Message conventions", "Glossary"
  and "Style" apply here unchanged. Read them before any task.

## Context for implementers
- The layer as built: `src/i18n/index.ts` (`m`), `src/i18n/en/index.ts` (the `en` object and
  `Messages`), `src/i18n/pt/index.ts`. Copy the shape of `src/i18n/en/common.tsx` and
  `src/i18n/pt/common.tsx`, and how `src/ui/pages/SettingsPage.tsx` uses `m`.
- New areas, one file each in `en/` and `pt/`, registered in both `index.ts` files in alphabetical
  order: `trip` (frame, tabs, trip form, Trip tab), `items` (form frame, footer, links, connection
  card), `fields`, `plan`, `stays`, `journeys`, `activities`, `places`, `packing`.
- A word used with the same meaning on several screens goes in `common`, once: Save, Cancel,
  Delete, Edit, Back, Add, Done, Name, Notes, Link, Address, Calendar, Booking, Website, Phone,
  Someone. Screens then use `m.common.save`. Don't add a second copy in an area.
- `src/ui/tripNav.ts:3-9` (`TABS`): each `label` reads from `m.trip.tabs`; keep `as const`, keys,
  paths and icons. `src/ui/tripNav.test.ts` must pass unchanged.
- `src/ui/items/common.tsx:35-54` (`ItemFooter`): the confirmation is built from the `what` prop
  (`Delete this ${what}?`). Portuguese needs the whole question per kind ("Eliminar esta estadia?",
  "Eliminar este trajeto?"). Type the prop as
  `'stay' | 'journey' | 'activity' | 'place' | 'expense' | 'payment'` and read
  `m.items.deleteConfirm[what]` (six whole questions). The second sentence (" It will also be
  deleted for the others when you share the trip.") is its own message; in English the result must
  be identical to today, including the single space between the two. Callers keep passing the same
  values, so `expenses.tsx` is not edited.
- `src/ui/entries.ts` builds the Plan's lines as strings (`describeEntry`): "arrives …", "Arrive in
  X", "Flight from X", "Check in: X", "until 15:00". Each becomes a function message taking the parts
  (`arriveIn: (to: string) => …`, `modeFrom: (mode: string, from: string) => …`).
- Default labels in parameters (`label = 'Notes'` in `src/ui/components/fields.tsx:29`,
  `label = 'City'` in `PlaceFields.tsx:29`) read from `m` the same way: `label = m.common.notes`.
- Names that stay as they are in both languages: `🗺️ Google Maps`, `🍎 Apple Maps`, Photon,
  OpenStreetMap, the `https://maps.app.goo.gl/…` placeholders, time zone ids, currency codes.
- Example placeholders are translated naturally, with Portuguese examples where the English one
  names a language-specific thing ("Japan in spring" → "Japão na primavera"; "Lisbon" → "Lisboa").
- Not messages: route segments (`'transport'`, `'edit'`), `SEGMENT`, record kinds compared in code
  (`answer.kind === 'place'`), `className`s, emoji-only content, `err.message`, warnings in
  `join.warnings`, `template.label` and template items.
- Smoke tests: `e2e/portuguese.e2e.ts` (part 1's three tests), `expectNoEnglish` and `importDemoTrip`
  in `e2e/fixtures.ts`. `importDemoTrip(page)` returns the backup; the trip id is
  `backup.trips[0].id`.

Glossary for this part (adds to part 1's; fixed):

| English | Portuguese | English | Portuguese |
|---|---|---|---|
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

## Tasks

1. **The trip's frame and shared pieces**
   - Change: move every text people read into the layer, in both languages, from
     `src/ui/TripLayout.tsx`, `src/ui/tripNav.ts`, `src/ui/items/common.tsx`, `src/ui/items/save.ts`,
     `src/ui/components/ItemLinks.tsx`, `src/ui/components/ConnectionCard.tsx`,
     `src/ui/components/fields.tsx`, `src/ui/components/PlaceFields.tsx`, and `'Someone'` in
     `src/ui/tripData.ts:189`. Create the areas `trip`, `items` and `fields`, and add the shared
     words to `common`. `ItemFooter` as described above.
   - Depends on: none
   - Done when: each prints 0:
     `grep -cE "isn't on this phone|See your trips|All trips|\"Back\"|Share with the group" src/ui/TripLayout.tsx`,
     `grep -c "label: '" src/ui/tripNav.ts`,
     `grep -cE "^ +(Cancel|Save|Delete|Back)$|✏️ Edit|Delete this|any more" src/ui/items/common.tsx`,
     `grep -c "Couldn't save" src/ui/items/save.ts`,
     `grep -cE "Directions|Add to Google Calendar|Calendar file|📞 Call" src/ui/components/ItemLinks.tsx`,
     `grep -c "Layover" src/ui/components/ConnectionCard.tsx`,
     `grep -cE "'Notes'|time \(optional\)|: date|Used in this trip|All time zones|Times are local to|Change time zone|This trip|All currencies" src/ui/components/fields.tsx`,
     `grep -cE "'City'|'Airport'|'Address'|In this trip|'Cities'|'Airports'|turn it on in Settings|Searching…|Found by Photon|Found online" src/ui/components/PlaceFields.tsx`,
     `grep -c "'Someone'" src/ui/tripData.ts`;
     and `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

2. **The Plan tab**
   - Change: move every text people read in `src/ui/pages/PlanPage.tsx` and `src/ui/entries.ts` into
     a new `plan` area, in both languages. `plural(c.stops, 'stop')` becomes a message taking the
     number.
   - Depends on: task 1
   - Done when: each prints 0:
     `grep -cE "Day by day|Bookings$|Tomorrow!|days to go|First up|Trip over|Trip report|Nothing else with a time|Before the trip|After the trip|Add an activity|Connections|No transport yet|No stays yet|No activities yet|'stop'|until " src/ui/pages/PlanPage.tsx`,
     `grep -cE "arrives |Arrive in|Check in|Check out|until " src/ui/entries.ts`;
     and `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

3. **Stays, journeys and activities**
   - Change: move every text people read in `src/ui/items/stays.tsx`, `transport.tsx` and
     `activities.tsx` into new `stays`, `journeys` and `activities` areas, in both languages: form
     titles, labels, placeholders, hints, the `setError` messages, detail-page terms and headings.
   - Depends on: task 1
   - Done when: each prints 0:
     `grep -cE "Give the stay|Edit stay|New stay|\"Name\"|\"Type\"|Check-in|Check-out|Booking reference|>Booking<|Booking page|\"Phone\"|\"Link\"|Door code|>Address<|>Notes<|>Calendar<" src/ui/items/stays.tsx`,
     `grep -cE "Fill in where|Edit transport|New transport|\"How\"|\"From\"|\"To\"|Leaves|Arrives|is local to|overnight|Airline|Flight no|\"Seat\"|Booking ref|>Booking<|Booking page|Terminal|>Takes<|Part of a connection|Getting there|>Notes<|>Calendar<" src/ui/items/transport.tsx`,
     `grep -cE "What are you doing|Edit activity|New activity|\"What\"|\"When\"|Ends at|meeting point|Booking reference|>Booking<|Tickets|>When<|>Place<|>Website<|>Where<|>Notes<|>Calendar<" src/ui/items/activities.tsx`;
     and `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

4. **Places and the list import**
   - Change: move every text people read in `src/ui/items/places.tsx` and `placesImport.tsx` into a
     new `places` area, in both languages, including the `aria-label`s ("Mark X as visited"), the
     two `setLookupError` texts and the "Added N places" notice. Text returned by
     `src/sync/googleMaps.ts` or the server stays as it comes.
   - Depends on: task 1
   - Done when: each prints 0:
     `grep -cE "Import list|Save the places|Paste a Google|Import it|All cities|No city|Most wanted|No places match|as visited|Give the place|web address|Edit place|New place|Fill in$|Looking it up|\"Kind\"|Shown first|Must see|Open saved map link|>Website<|>Notes<|Plan a visit" src/ui/items/places.tsx`,
     `grep -cE ">Places<|Import a Google Maps list|^ +Done$|Shared Google Maps list link|Look it up|Looking it up|Shared list|Already in the trip|^ +Cancel$|not a Google Maps link|single place" src/ui/items/placesImport.tsx`;
     and `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

5. **The trip form and the Trip tab**
   - Change: move every text people read in `src/ui/pages/TripFormPage.tsx` and `TripInfoPage.tsx`
     into the `trip` area, in both languages, including the `confirm` texts (remove from this phone,
     leave the trip, the photos-and-documents warning in `filesGo`) and the server sections of the
     Trip tab. `(err as Error).message` stays as it comes.
   - Depends on: task 1
   - Done when: each prints 0:
     `grep -cE "Give the trip|Choose when|ends before|up to a year|at least one traveller|Edit trip|New trip|Where it's kept|Who's going|Not on the server|Add from the server|Just you|Anything useful|Create trip|\"Name\"|\"Currency\"|\"Time zone\"|\"Starts\"|\"Ends\"" src/ui/pages/TripFormPage.tsx`,
     `grep -cE "from this phone|>Dates<|Who's going|Which one are you|Only on this phone|Share with the group|Packing & to-do|Nothing here yet|Open the list|Trip report|See the report|On the sync server|Leave the trip|Leaving…" src/ui/pages/TripInfoPage.tsx`;
     and `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

6. **The packing page**
   - Change: move every text people read in `src/ui/pages/PackingPage.tsx` into a new `packing`
     area, in both languages. Template names and items keep coming from `TEMPLATES`.
   - Depends on: task 1
   - Done when:
     `grep -cE "Who's bringing it|Nobody yet|Packing & to-do|Nothing here yet|Add from a template|Add an item|^ +(Add|Save|Cancel|Delete)$|Delete this item|\"Item\"" src/ui/pages/PackingPage.tsx`
     prints 0; `npm run typecheck`, `npm run lint` and `npm test` pass.
   - Executor: sonnet

7. **Smoke test for the preview**
   - Change: add to `e2e/portuguese.e2e.ts` one test that calls `importDemoTrip(page)`, then, with
     `id = backup.trips[0].id`:
     (a) `page.goto(\`?lang=pt#/trips/${id}\`)`: links named "Plano", "Locais", "Dinheiro",
     "Ficheiros" and "Viagem" are visible in `nav.tabbar`, and a link named "Todas as viagens" exists;
     (b) `?lang=pt#/trips/${id}/stays/new`: the heading "Nova estadia" and the buttons "Guardar" and
     "Cancelar" are visible, and `expectNoEnglish` holds; `…/transport/new`: the heading "Novo
     trajeto" is visible and `expectNoEnglish` holds; `…/activities/new`: heading "Nova atividade";
     `…/places/new`: heading "Novo local";
     (c) `?lang=pt#/trips/${id}/packing`: the heading "Bagagem e tarefas" is visible;
     (d) `?lang=pt#/trips/${id}/trip`: the heading "Quem vai" is visible.
     Existing tests are not edited.
   - Depends on: tasks 2, 3, 4, 5, 6
   - Done when: `npm run smoke` passes, with the new test and every existing one.
   - Executor: sonnet

8. **Glossary upkeep**
   - Change: in `specs/translation-layer.md`, append to the Glossary table every row of this spec's
     "Glossary for this part", plus a row for any travel term that was chosen while building and is
     in neither table. Change nothing else in that file.
   - Depends on: task 7
   - Done when: `grep -c "Bagagem e tarefas" specs/translation-layer.md` prints 1 and
     `grep -c "Imperdível" specs/translation-layer.md` prints 1.
   - Executor: sonnet

## Acceptance criteria
- [ ] `npm run smoke` passes: every test that existed before (English unchanged) plus the new
      Portuguese test.
- [ ] `npx vitest run src/i18n src/ui` passes (same keys and leaf types in `en` and `pt`, no empty
      text; `tripNav.test.ts` unchanged).
- [ ] Every "prints 0" grep in tasks 1 to 6 prints 0.
- [ ] `git diff origin/main --stat` lists no file under `src/domain/`, `src/db/`, `src/sync/`,
      `src/lib/`, `server/` or `scripts/`, and not `package.json`, `CHANGELOG.md`, `GUIDE.md`,
      `src/ui/items/expenses.tsx` or any other file named in Out of scope.
- [ ] `grep -rn "from '\.\./\.\./ui\|from '\.\./\.\./db\|from '\.\./\.\./lib" src/i18n` prints nothing.
- [ ] `grep -rnE "\b(tela|arquivo|celular|compartilhar|salvar|usuário)\b" src/i18n/pt` prints nothing.
- [ ] With `npm run dev` and a trip on the phone, `http://localhost:5173/?lang=pt#/trips/<id>/stays/new`
      and `…/trip` read in Portuguese apart from what Behavior lists as still English; the same
      addresses without `?lang=pt` read exactly as on `main`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: no errors.
- `npm run smoke` (first run: `npx playwright install chromium`): all tests pass.
- Manual: `npm run dev`, import a trip, then the addresses in the acceptance criteria at phone width
  (360px).

## Escalate when
- A travel term is in neither Glossary and has more than one natural PT-PT translation (list them).
- An English text can't stay character-for-character the same, or a sentence is built from pieces
  in a way the conventions don't cover.
- A Portuguese sentence needs something the screen doesn't pass (gender, a count) and getting it
  means changing logic, not just text.
- A listed file shows text that comes from a file this spec says not to touch, other than the cases
  listed under Behavior.
- `expectNoEnglish` fails on the new stay or new journey form because of a name, the demo trip's
  own data or a correct Portuguese word.
- An existing smoke test, `tripNav.test.ts` or `scripts/guide/screenshots.ts` would need changing.
- Any change seems needed outside the files named in the tasks, or a new dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 2 of the series listed in `specs/translation-layer.md` (Notes). Part 1 is shipped, so
  `Builds after` is "none".
- Decided with Ricardo for this part: "Bagagem e tarefas" and "Imperdível". The other glossary rows
  were picked while speccing; "ligação" is free for "connection" because "link" stays "link".
- `expectNoEnglish` runs only on the new stay and new journey forms: other pages show the trip's own
  English data, and currency names ("Trinidad and Tobago Dollar") on the trip form.
- `ItemFooter` keeps its `what` prop (now a fixed set) instead of deriving it from the table,
  because an expense can be a "payment"; this also keeps `expenses.tsx` out of this part.
- Packing templates stay for part 4 with the other text in `src/domain`: their items are saved into
  the shared list as text, so that part must also say in which language a template is added.
- The grep checks are samples that catch a forgotten file; the rule is "every text people read".
- Overlap: the draft specs `plan-editing`, `list-row-stars`, `trip-budget` and `qr-join` touch
  screens moved here. None is built; whichever is built later follows the CLAUDE.md rule (text in
  both languages), and if one lands first, its text is moved here like the rest.
- As shipped: the Portuguese "It will also be deleted for the others…" sentence is worded without
  gender ("Se partilhares a viagem, a eliminação também vale para os outros."), because it follows
  masculine and feminine questions; the same message is reused on the packing page.
- As shipped: task 1's check on `ItemLinks.tsx` prints 3, not 0: it matches the
  `googleMapsDirections` name and a comment, not text people read. The checks also match code
  comments, so two were reworded (`PackingPage.tsx`, `TripFormPage.tsx`).
- Left for a later part: the Plan's " · Today" after today's date comes from CSS
  (`src/index.css`, `.day-today .day-head h3::after`), a file this part doesn't touch, so it stays
  English in the preview.
- Terms chosen while building were added to the Glossary in `specs/translation-layer.md`; "Taxas de
  câmbio" is the name part 3's Money screen has to match.
