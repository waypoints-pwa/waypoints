# The guide in Portuguese (Portuguese, part 8)

Status: ready
Issue: <issue link>
Builds after: none

## Problem
Since 0.17.0 the app speaks Portuguese, but **Ler o guia** (Welcome) and **Como usar o waypoints**
(Settings → About) still open the English guide, with English screenshots. Two small leftovers from
part 7 also remain: exchange rates keep a `.` in Portuguese ("1 EUR = 162.6016 JPY"), and English
file sizes from 1000 MB up changed to "1,234 MB".

## Behavior
- **`GUIDE.pt.md`** at the repo root: the whole of `GUIDE.md` in Portuguese (PT-PT, informal "tu"),
  with the same sections in the same order, and its own screenshots in `docs/guide/pt/` (the same 18
  names as `docs/guide/`). Its pictures show the app in Portuguese with the demo trip in Portuguese:
  *Japão na primavera*, with Ana, Ben and Chloé.
- Each guide links to the other in one line under its title: `GUIDE.md` gets
  "*Também em português: [guia do utilizador](GUIDE.pt.md).*", `GUIDE.pt.md` gets
  "*Also in English: [user guide](GUIDE.md).*".
- **The app's guide links follow its language.** In Portuguese, **Ler o guia** and
  **Como usar o waypoints** open
  `https://github.com/waypoints-pwa/waypoints/blob/main/GUIDE.pt.md`; in English they open
  `GUIDE.md` as today. Example: a phone set to `pt-PT` opens the app for the first time, taps
  **Ler o guia** and reads "Instalar" with Portuguese screenshots on GitHub. Offline: a plain link
  that fails in the new tab, as today.
- **Exchange rates in the app's number style**, up to 4 decimals and no thousands grouping, wherever
  a rate is shown (Money → **Taxas de câmbio**, an expense's page, the rate hints under the card and
  exchange inputs): "1 EUR = 162,6016 JPY" in Portuguese, "1 EUR = 162.6016 JPY" in English (as
  today). Input boxes are unchanged (they keep `.` and already accept `,`).
- **File sizes** are never grouped again: "1234 MB" in English (as before 0.17.0) and in
  Portuguese; small ones keep the language's decimal ("2.4 MB" / "2,4 MB").
- **Release 0.17.1.** What's new (English):

  > The user guide is now in Portuguese too, with its own pictures: **Ler o guia** opens it when the
  > app is in Portuguese. Exchange rates follow the app's number style ("1 EUR = 162,6016 JPY" in
  > Portuguese), and file sizes from 1000 MB up read "1234 MB" again.

  and in Portuguese:

  > O guia do utilizador agora também está em português, com imagens próprias: **Ler o guia**
  > abre-o quando a app está em português. As taxas de câmbio seguem o formato de números da app
  > ("1 EUR = 162,6016 JPY" em português), e os tamanhos de ficheiros a partir de 1000 MB voltam a
  > aparecer como "1234 MB".
- From now on both guides stay in step: a test fails when their sections, pictures or anchors
  differ, and CLAUDE.md says a user-facing change updates both.
- No record, link, backup, sync-protocol, server or Dexie change.

## Out of scope
- Rewording the English guide (it only gains the cross-link line), the README beyond the two lines
  in task 5, `server/README.md`, `SECURITY.md`.
- Translating `README.md` or `server/README.md` (the Portuguese guide links to them as they are).
- Hosting the guide anywhere but GitHub; an in-app guide.
- Translating city, airport, hotel or brand names in the demo trip (the app's city search gives
  English names, "Local city names" is dropped in `BACKLOG.md`).
- Changing English screenshots: none is committed by this spec.
- `fmtPlain` itself, `fmtDuration`, any other number format.

## Constraints
- **English stays character-for-character the same** in the app for an `en-GB` phone (existing e2e
  and the screenshot script's English run). `demoBackup()` with no argument returns exactly what it
  returns today (e2e and the English screenshots use it).
- No personal information in the guide, the demo trip or the screenshots (public repo): fictional
  names and bookings only, as now.
- Portuguese follows `specs/translation-layer.md` ("Message conventions", "Glossary", "Style"):
  PT-PT, informal "tu", post-1990 spelling. UI labels in the guide are written exactly as the
  Portuguese app shows them (`src/i18n/pt/`).
- Links shown in the app live in `src/lib/links.ts` only. No CSP change.
- User-facing change: version bump, a `CHANGELOG.md` and `CHANGELOG.pt.md` entry (CLAUDE.md,
  "Releases & changelog").

## Context for implementers
- Read first: `GUIDE.md` (389 lines, 11 sections, 18 `<img>`), `specs/user-guide.md` (how the guide
  and screenshots were made), `scripts/guide/screenshots.ts`, `scripts/guide/demo-trip.ts` and its
  test, `src/lib/links.ts` and `src/lib/links.test.ts`, `src/ui/format.ts:56` (`fmtPlain`) and
  `:72-77` (`fmtBytes`), `e2e/portuguese.e2e.ts` and `e2e/fixtures.ts`, the glossary in
  `specs/translation-layer.md:97`.
- `language` and `locale` come from `src/i18n/index.ts` (fixed when the page loads; under Vitest
  `language` is `'en'` and `locale` is `undefined`). `Language` is in `src/i18n/language.ts`.
- **Rates.** In `src/ui/format.ts`, after `fmtPlain`:
  ```ts
  /** An exchange rate to show: up to 4 decimals, no grouping, in the app's language ("162.6016", "162,6016"). */
  export const fmtRate = (rate: number) => rate.toLocaleString(locale, { maximumFractionDigits: 4, useGrouping: false })
  ```
  Every `fmtPlain(<rate>, 4)` becomes `fmtRate(<rate>)`: `src/ui/items/expenses.tsx:229, 502, 508,
  652, 656` and `src/ui/items/exchanges.tsx:77`. The other `fmtPlain` calls (input values and
  `amountsAddUp`) stay.
- **File sizes.** In `fmtBytes` (`format.ts:76`), `.toLocaleString(locale)` becomes
  `.toLocaleString(locale, { useGrouping: false })`; the doc comment becomes
  `/** "820 KB", "2.4 MB", "1234 MB" (never grouped). */`.
- **Links.** `src/lib/links.ts`: add `guidePt: 'https://github.com/waypoints-pwa/waypoints/blob/main/GUIDE.pt.md'`
  after `guide`, and below `LINKS`:
  ```ts
  /** The user guide in the app's language. */
  export const guideFor = (language: Language) => (language === 'pt' ? LINKS.guidePt : LINKS.guide)
  ```
  with `import type { Language } from '../i18n/language'` (type-only: e2e imports this file under
  Node). `src/ui/pages/SettingsPage.tsx:203` and `src/ui/pages/TripsPage.tsx:128` use
  `href={guideFor(language)}`, importing `language` from the `i18n` module they already import `m`
  from.
- **Demo trip in Portuguese.** `demoBackup(language: Language = 'en')`; only these texts change for
  `'pt'` (everything else, ids aside, is identical; cities, airports, hotel and brand names stay):

  | English | Portuguese |
  |---|---|
  | Japan in spring | Japão na primavera |
  | Senso-ji Temple | Templo Senso-ji |
  | Fushimi Inari Shrine | Santuário Fushimi Inari |
  | Arashiyama Bamboo Grove | Bosque de bambu de Arashiyama |
  | Nishiki Market | Mercado Nishiki |
  | Flights Lisbon to Tokyo | Voos Lisboa–Tóquio |
  | Ramen dinner | Jantar de ramen |
  | Subway cards | Cartões de metro |
  | teamLab tickets | Bilhetes teamLab |
  | Shinkansen to Kyoto | Shinkansen para Quioto |
  | Sushi lunch | Almoço de sushi |
  | Souvenirs | Lembranças |
  | Go early, before the crowds. | Vai cedo, antes das multidões. |
  | The incense smoke was magical. | O fumo do incenso era mágico. |
  | Wear shorts, you walk through water. | Leva calções, anda-se dentro de água. |
  | Worth the climb. | Vale bem a subida. |
  | Quiet street, lovely wooden house. | Rua sossegada, casa de madeira linda. |

  Put them in one `const TEXT = { en: {…}, pt: {…} }` at the top of the file, keyed by meaning
  (`tripName`, `senso`, …), and use `TEXT[language]` in the builders. Activities take their titles
  from the places, as today.
- **Screenshots in both languages.** `scripts/guide/screenshots.ts` becomes a `run(language)`
  function, called for each language in `process.argv[2]` (`en` or `pt`) or for both when there is
  none (`npm run guide:screenshots`, or `npm run guide:screenshots -- pt`). Per language:
  - `OUT` is `docs/guide` for `en`, `docs/guide/pt` for `pt`; the browser context's `locale` is
    `en-GB` or `pt-PT` (Automatic then picks the language; no `?lang`, no saved choice);
    `demoBackup(language)`.
  - Every UI text the script matches comes from one table at the top:
    ```ts
    const UI = {
      en: { gotIt: 'Got it', later: 'Later', whichOne: 'Which one are you?', addPhotos: 'Add photos', addDocuments: 'Add documents',
        add: 'Add', added4Photos: /^Added 4 photos/, added1Photo: /^Added 1 photo/, added1Document: /^Added 1 document/,
        addedPhotos: /^Added \d photos?/, allTrips: 'All trips', city: 'City', rates: /Exchange rates/, activities: 'Activities', select: 'Select' },
      pt: { gotIt: 'Percebi', later: 'Mais tarde', whichOne: 'Qual deles és tu?', addPhotos: 'Adicionar fotos', addDocuments: 'Adicionar documentos',
        add: 'Adicionar', added4Photos: /^Adicionadas 4 fotos/, added1Photo: /^Adicionada 1 foto/, added1Document: /^Adicionado 1 documento/,
        addedPhotos: /^Adicionadas? \d fotos?/, allTrips: 'Todas as viagens', city: 'Cidade', rates: /Taxas de câmbio/, activities: 'Atividades', select: 'Selecionar' },
    }
    ```
    The expense click uses the backup's own title (`backup.expenses` entry whose `amount` is
    `41400`), not a literal. The traveller picked is `'Ana'` in both.
  - The two text files the script writes (insurance, e-ticket) get Portuguese content for `pt`:
    "Seguro de viagem: apólice 123456. Em caso de emergência, liga para +351 000 000 000." and
    "Bilhete eletrónico: Lisboa para Tóquio. Mostra-o no check-in.", named
    `seguro-de-viagem.txt` and `bilhete-eletronico.txt`.
  - The English run must take the same pictures as today (same steps, same order).
- **`GUIDE.pt.md`**: same `##`/`###` headings in the same order (numbered the same, "## 1. O que é
  o waypoints"…), the same `<img>` tags in the same places with `src="docs/guide/pt/<same name>.png"`,
  `width="300"` and a Portuguese `alt`; a Contents list whose anchors are GitHub's slugs of the
  Portuguese headings (lowercase, accents kept, punctuation other than `-`/`_` removed, spaces → `-`:
  "## 9. Privacidade, em palavras simples" → `#9-privacidade-em-palavras-simples`). Links to
  `README.md` and `server/README.md` stay, followed by " (em inglês)". In section 2 the browser
  menus are written as Portuguese iPhone/Android show them (Safari → Partilhar → **Adicionar ao
  ecrã principal**; Chrome → menu ⋮ → **Adicionar ao ecrã principal** / **Instalar app**).
- **Guide test** (`scripts/guide/guide.test.ts`, picked up by `npm test`; read files with
  `readFileSync(new URL('../../GUIDE.md', import.meta.url), 'utf8')`, as
  `src/domain/changelog.test.ts:80` does). Slug function, checked against today's `GUIDE.md` (all 14
  anchors resolve):
  ```ts
  const slug = (heading: string) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-')
  ```
- Do not touch: `src/db/`, `src/domain/`, `src/sync/`, `server/`, `src/i18n/` (no new or changed
  keys), `index.html`, `vite.config.ts`, existing tests in `e2e/` and `src/lib/links.test.ts`'s
  existing `it`s, any committed English screenshot.

## Tasks

1. **Rates and file sizes**
   - Change: **Rates** and **File sizes** in Context (`src/ui/format.ts`, `src/ui/items/expenses.tsx`,
     `src/ui/items/exchanges.tsx`).
   - Depends on: none
   - Done when: `grep -c "fmtPlain([^)]*, 4)" src/ui/items/expenses.tsx src/ui/items/exchanges.tsx`
     prints 0 for both; `grep -c "fmtRate(" src/ui/items/expenses.tsx` prints 5 and
     `src/ui/items/exchanges.tsx` prints 1; `grep -c "useGrouping: false" src/ui/format.ts` prints 2;
     `npm test`, `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

2. **Guide links follow the language, and the smoke tests**
   - Change: **Links** in Context. In `src/lib/links.test.ts` add (existing `it`s unchanged):
     `LINKS.guidePt` is `'https://github.com/waypoints-pwa/waypoints/blob/main/GUIDE.pt.md'`;
     `guideFor('pt')` is `LINKS.guidePt`; `guideFor('en')` is `LINKS.guide`. In
     `e2e/portuguese.e2e.ts` add (existing tests unchanged): (a) `?lang=pt`: the link **Ler o guia**
     has `href` `LINKS.guidePt`; on `?lang=pt#/settings` the link **Como usar o waypoints** has
     `href` `LINKS.guidePt`; (b) after `importDemoTrip(page)`, `?lang=pt#/trips/<id>/money` contains
     `1 EUR = 162,6016 JPY`, and `#/trips/<id>/money` (no `?lang`) contains `1 EUR = 162.6016 JPY`.
   - Depends on: task 1
   - Done when: `npx vitest run src/lib/links` passes; `grep -c "guideFor(language)" src/ui/pages/SettingsPage.tsx src/ui/pages/TripsPage.tsx`
     prints 1 for each; `grep -c "LINKS.guide}" src/ui/pages/SettingsPage.tsx src/ui/pages/TripsPage.tsx`
     prints 0 for each; `npm run smoke` passes (all tests, old and new); `npm run typecheck` and
     `npm run lint` pass.
   - Executor: sonnet

3. **The demo trip in Portuguese**
   - Change: **Demo trip in Portuguese** in Context (`scripts/guide/demo-trip.ts`). Extend
     `scripts/guide/demo-trip.test.ts` (existing test unchanged): `demoBackup('pt')` passes
     `parseBackup`, has the same table sizes as `demoBackup()`, its trip is named
     `'Japão na primavera'`, an expense is titled `'Shinkansen para Quioto'` with `amount` 41400, and
     no expense title, place name, activity title or (defined) review note equals one from
     `demoBackup()` except `'Hotel Sakura'`, `'teamLab Planets'` and `'Ichiran Ramen Shibuya'`.
   - Depends on: none
   - Done when: `npx vitest run scripts/guide` passes; `npm run smoke` passes (e2e uses the English
     demo); `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

4. **Screenshots in both languages**
   - Change: **Screenshots in both languages** in Context (`scripts/guide/screenshots.ts`). Then
     `npm run dev` in one shell and `npm run guide:screenshots` in another; commit the 18 new files in
     `docs/guide/pt/` and no English one (`git checkout -- docs/guide/*.png` if any changed). Each
     Portuguese picture shows the same screen as its English namesake, in Portuguese: e.g.
     `pt/welcome.png` the Welcome screen with **Planear uma viagem**, `pt/settings.png` Settings with
     the **Idioma** card, `pt/city-search.png` "Kyo" typed in **Cidade** with Kyoto listed,
     `pt/expense.png` **Shinkansen para Quioto**, `pt/reviews.png` the reviews after the trip.
   - Depends on: tasks 1, 3
   - Done when: `ls docs/guide/pt/*.png | wc -l` prints 18 and
     `diff <(ls docs/guide | grep png) <(ls docs/guide/pt)` prints nothing;
     `git diff --stat origin/main -- docs/guide` lists only files under `docs/guide/pt/`;
     `sha1sum docs/guide/pt/*.png | cut -d' ' -f1 | sort | uniq -d` prints nothing;
     `npm run typecheck` and `npm run lint` pass. In the report, say what each of the 18 pictures
     shows (one line each).
   - Executor: sonnet

5. **`GUIDE.pt.md`, the guide test, and the cross-links**
   - Change: write `GUIDE.pt.md` (**`GUIDE.pt.md`** in Context), translating all of `GUIDE.md`; add
     the cross-link line from Behavior under each guide's title. `README.md`: under
     "**New here? Read the [user guide](GUIDE.md).**" add
     "**Em português: [guia do utilizador](GUIDE.pt.md).**"; the `guide:screenshots` comment line
     becomes "remakes docs/guide/*.png and docs/guide/pt/*.png (add `-- pt` or `-- en` for one
     language), run it when a pictured screen changes". Create `scripts/guide/guide.test.ts`
     checking: (a) the list of heading levels (`##`/`###`, in order) is the same in both guides;
     (b) GUIDE.pt.md's `<img src>` list equals GUIDE.md's with `docs/guide/` → `docs/guide/pt/`,
     every such file exists, and each `alt` is non-empty and differs from the English one at the
     same position; (c) the `.png` names in `docs/guide/pt/` equal those in `docs/guide/`; (d) no two
     files in `docs/guide/pt/` have the same bytes, and none has the same bytes as its English
     namesake; (e) every `](#anchor)` in each guide is the slug of one of its headings; (f) under
     each `##` section the number of `**…**` spans is the same in both guides; (g) GUIDE.md contains
     `](GUIDE.pt.md)` and GUIDE.pt.md contains `](GUIDE.md)`. Each failure message names the
     section, picture or anchor.
   - Depends on: task 4
   - Done when: `npx vitest run scripts/guide` passes;
     `grep -nE "\b(tela|arquivo|celular|compartilhar|salvar|usuário|você|baixar)\b" GUIDE.pt.md`
     prints nothing; `npm test` passes. In the report, list the output of
     `grep -oE "\*\*[^*]+\*\*" GUIDE.pt.md | sort -u | tr -d '*' | while read -r l; do grep -rqF -- "${l%:}" src/i18n/pt || echo "$l"; done`
     (bold spans not found in the app: questions and browser menus are expected; the reviewer
     checks the rest).
   - Executor: sonnet

6. **Release 0.17.1**
   - Change: `version` `0.17.1` in `package.json` and `package-lock.json` (top-level and
     `packages[""]`). The 0.17.1 entries from Behavior at the top of `CHANGELOG.md` and
     `CHANGELOG.pt.md`, dated the day it is built. `CLAUDE.md` "Releases & changelog": "A
     user-facing change also updates `GUIDE.md`, and re-runs `npm run guide:screenshots` when a
     pictured screen changed." becomes "A user-facing change also updates `GUIDE.md` and its
     Portuguese copy `GUIDE.pt.md` (same sections and pictures; `scripts/guide/guide.test.ts`
     checks), and re-runs `npm run guide:screenshots` (both languages) when a pictured screen
     changed."
   - Depends on: task 5
   - Done when: `npx vitest run src/domain/changelog` passes; `grep -c "GUIDE.pt.md" CLAUDE.md`
     prints 1; `grep -c '"version": "0.17.1"' package.json` prints 1; `npm test` passes.
   - Executor: haiku

7. **Series upkeep**
   - Change: in `specs/translation-layer.md` Notes, "The series" item 8 becomes "8. the guide and
     its screenshots in Portuguese, linked from the Portuguese app; exchange rates and file sizes
     in the app's number style (`portuguese-guide`)." In `specs/language-setting.md` Notes "As
     built", append to the exchange-rates bullet " Done in part 8 (`portuguese-guide`)." and to the
     `fmtBytes` bullet " Undone in part 8 (`portuguese-guide`)." Change nothing else.
   - Depends on: task 6
   - Done when: `grep -c "portuguese-guide" specs/translation-layer.md` prints 1;
     `grep -c "portuguese-guide" specs/language-setting.md` prints 2.
   - Executor: haiku

## Acceptance criteria
- [ ] `npm run smoke` passes, with the new tests: in Portuguese **Ler o guia** and
      **Como usar o waypoints** link to `GUIDE.pt.md`; the Money tab shows `1 EUR = 162,6016 JPY` in
      Portuguese and `1 EUR = 162.6016 JPY` in English.
- [ ] `npm test` passes: every existing test unchanged, plus the new ones in `src/lib/links.test.ts`,
      `scripts/guide/demo-trip.test.ts` and `scripts/guide/guide.test.ts`.
- [ ] `docs/guide/pt/` holds 18 PNGs, the same names as `docs/guide/`, all different from each
      other and from their English namesakes (the guide test); no English PNG changed
      (`git diff --stat origin/main -- docs/guide` lists only `docs/guide/pt/`).
- [ ] `GUIDE.pt.md` on the PR branch, rendered on GitHub: every Contents link jumps to its section,
      every picture loads and shows the app in Portuguese with *Japão na primavera*; the
      "Also in English" link opens `GUIDE.md`, and `GUIDE.md`'s "Também em português" link opens it.
- [ ] `grep -nE "\b(tela|arquivo|celular|compartilhar|salvar|usuário|você|baixar)\b" GUIDE.pt.md`
      prints nothing.
- [ ] `git diff origin/main --stat` lists nothing under `src/db/`, `src/domain/`, `src/sync/`,
      `src/i18n/`, `server/`, and not `index.html` or `vite.config.ts`.
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: no errors.
- `npm run smoke`: all tests pass (first run needs `npx playwright install chromium`).
- `npm run dev` + `npm run guide:screenshots -- en`: each English PNG shows the same screen as the
  committed one (rendering may change pixels; they are not committed either way). A different
  screen means the script's English run changed: escalate.
- Manual: the GitHub rendering check in the acceptance criteria.

## Escalate when
- Any existing test (unit or e2e) would need changing, or the English screenshot run shows a
  different screen than a committed picture: English moved.
- A screenshot step fails in Portuguese because a label differs from the `UI` table (report the
  label the app shows; don't change `src/i18n/`).
- Chromium's ICU gives other text than `162,6016` / `162.6016`: report it, don't change the
  expectation silently.
- A section of the guide needs a different number of bold spans in Portuguese than in English to
  read naturally (list the section and why).
- The English guide describes something the app no longer does (fix neither guide; list it).
- Any change seems needed outside the files named in the tasks, a Dexie version, or a new
  dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 8, the last of the series in `specs/translation-layer.md` (Notes); it also takes the two
  leftovers from part 7 (`language-setting`, "As built").
- Decided with Ricardo: the demo trip itself is translated for the Portuguese pictures (names,
  expense titles, review notes), so they don't mix languages; city, airport and hotel names stay as
  the app's city search gives them.
- Decided with Ricardo: both guides are kept in step from now on, enforced by
  `scripts/guide/guide.test.ts`, like `CHANGELOG.pt.md`; CLAUDE.md says so (task 6).
- Decided with Ricardo: exchange rates use the app's number style wherever shown (`fmtRate`, no
  grouping, so English is unchanged); input boxes keep `fmtPlain`.
- Decided with Ricardo: file sizes go back to ungrouped ("1234 MB").
- `GUIDE.pt.md` and `docs/guide/pt/` (not `docs/guide/` with a suffix) so the English paths, which
  the README and old links use, never move.
- The screenshot script keeps its own small label table (`UI`): it runs under plain Node, which
  can't load the `.tsx` dictionaries.
- Dry-run while speccing: the slug function resolves all 14 Contents anchors of today's
  `GUIDE.md`; Node 24 ICU gives `162,6016` (`pt-PT`) and `162.6016` (`en-GB`) for
  `162.60159.toLocaleString(…, { maximumFractionDigits: 4, useGrouping: false })`, and `1234` for
  `en-GB` with `useGrouping: false`. The demo trip's cash rate is 80000 / 492 = 162.6016 JPY per EUR.
- Overlap: no unbuilt spec touches the guide, `scripts/guide/`, `src/lib/links.ts`,
  `src/ui/format.ts` or the rate lines in `src/ui/items/`. Draft specs that change a pictured screen
  or the guide (`trip-budget`, `expenses-csv-export`, `server-trip-cleanup`, `qr-join`,
  `plan-editing`, `list-row-stars`) must update `GUIDE.pt.md` and the Portuguese pictures too once
  this ships (the CLAUDE.md rule from task 6), so `Builds after` is "none".
