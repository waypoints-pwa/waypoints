# The Language setting (Portuguese, part 7)

Status: building
Issue: https://github.com/waypoints-pwa/waypoints/issues/87
Builds after: none

## Problem
Parts 1 to 6 (`specs/translation-layer.md` and the five `translate-*` specs, all shipped) put every
text the app and the sync server show into both languages, but nobody sees the Portuguese: it only
shows in the `?lang=pt` preview. This part turns it on. Phones set to Portuguese get the app in
Portuguese, anyone can pick a language in Settings, dates, numbers and country names follow the
language, and What's new reads in Portuguese too. The guide in Portuguese is part 8.

## Behavior
- **Settings → Language** (a new card right after **Your name**) has a dropdown with **Automatic
  (phone's language)**, **English** and **Português**. The two language names are always written in
  their own language. Under it: "Changing it reloads the app. Only for this phone." Picking an option
  saves it and reloads the app at once, on the same screen (Settings), in the new language.
- **Automatic** (the default, also for everyone who has the app today): the app is in Portuguese when
  the first of the phone's languages that the app has is Portuguese (any `pt`: `pt-PT`, `pt-BR`,
  `pt`), otherwise English. Examples: a phone in `pt-PT` → Portuguese; `pt-BR` → Portuguese (PT-PT
  text); `fr-FR` then `pt-PT` → Portuguese; `fr-FR` then `de-DE` → English; `en-GB` → English.
- The choice is kept on this phone only: not in backups, links, trip files or the sync server. If
  the browser can't keep it (private mode, storage blocked), the dropdown still works for this
  visit, then the app goes back to Automatic.
- **`?lang=pt` / `?lang=en`** in the address (before the `#`) still wins over the setting, for that
  visit only, as in part 1. It is not remembered and nothing links to it.
- **Dates, times and amounts**: when the app's language is the phone's own (the first of the phone's
  languages has the same base, e.g. `en-US` for English), they keep following the phone, exactly as
  today (US or UK order, 12 or 24-hour clock). When they differ, they follow the language's own
  style: English as `en-GB`, Portuguese as `pt-PT`. Examples, trip dates 8–15 April 2026: a `pt-PT`
  phone in Portuguese shows **08/04/2026 – 15/04/2026**; the same phone set to English shows
  **8–15 Apr 2026**; €1234.5 reads **1234,50 €** in Portuguese. "2 minutes ago" becomes
  **há 2 minutos**.
- **Country names** in city, airport and online address results follow the language ("Madrid,
  Espanha"). Typing a country after a comma works in English and in the app's language:
  "Madrid, spain" and "Madrid, espanha" both find Madrid in Portuguese; in English only "spain".
- **What's new** (the card after an update and Settings → **✨ What's new**) shows every release's
  notes in the app's language: all 21 earlier releases and this one are translated.
- The page's `<html lang>` is `en-GB` or `pt-PT`, so screen readers and the browser's own spelling
  and translation offers know the language.
- **Release 0.17.0.** Its What's new (English) reads:

  > waypoints now speaks Portuguese (Portugal). Phones set to Portuguese show it in Portuguese; pick
  > another language in Settings → **Language**. Dates and amounts follow the language too.
  >
  > If you use a sync server, update it to 0.8.0 so its messages show in Portuguese too. Until
  > then they show in English.

  and in Portuguese:

  > O waypoints agora fala português (de Portugal). Os telemóveis em português mostram-no em
  > português; escolhe outro idioma em Definições → **Idioma**. As datas e os valores também seguem
  > o idioma.
  >
  > Se usas um servidor de sincronização, atualiza-o para a 0.8.0 para que as mensagens dele também
  > apareçam em português. Até lá, aparecem em inglês.
- Offline is unaffected (both dictionaries and both changelogs are bundled). No record, link,
  backup, sync-protocol or server change.

## Out of scope
- `GUIDE.md` in Portuguese, its screenshots in Portuguese, and where **Ler o guia** points: part 8.
  (This part only adds the Language line to the English guide and retakes `settings.png`.)
- The web manifest, `index.html`'s static `<html lang="en">` and `<meta name="description">`, the
  app's name: they stay English.
- Time zone abbreviations (`timeZoneName` in `src/domain/time.ts:101`), which follow the phone.
- `fmtPlain` (numbers in input boxes keep a `.`), `fmtDuration` ("2h 35m"), file names
  (`stamp` in `SettingsPage.tsx:16` keeps `en-CA`).
- Rewording any English text or any Portuguese text already in `src/i18n/pt/` other than adding keys.
- Languages other than English and Portuguese; Brazilian Portuguese text.
- A server change (the server is already 0.8.0), a Dexie version, a new dependency.

## Constraints
- **English stays character-for-character the same** for an `en-GB` browser on Automatic, which is
  what the smoke test (`playwright.config.ts`, `locale: 'en-GB'`) and the guide's screenshot script
  (`scripts/guide/screenshots.ts:38`) use. Existing e2e tests are not edited.
- **Unit tests stay in English**: under Vitest (`environment: 'node'`, no `document`) the phone's
  languages and the saved choice are not read, so `language` is `'en'` and the formats keep
  `undefined` whatever the developer's machine language is.
- `src/domain` never imports `src/i18n` (the server runs it): `src/domain/places.ts` takes the
  locale as an argument.
- The saved choice lives in `localStorage` (read synchronously while the page loads, part 1's Notes),
  not in Dexie; every read and write is in `try/catch`.
- User-facing change: version bump, a `CHANGELOG.md` entry, `GUIDE.md` updated, `settings.png`
  retaken (CLAUDE.md, "Releases & changelog").
- Portuguese follows `specs/translation-layer.md` ("Message conventions", "Glossary", "Style"):
  PT-PT, informal "tu", post-1990 spelling. Read them before task 5.

## Context for implementers
- Read first: `src/i18n/index.ts` (9 lines: `language` and `m` are module constants, fixed when the
  page loads), `src/i18n/language.ts` and `src/i18n/language.test.ts`, `src/ui/format.ts` (every
  `undefined` locale: lines 6, 9, 13, 24, 35, 37, 49, 68, 84, 90; `fmtBytes` at 73-77),
  `src/domain/places.ts:45-64` (`countryName`, `cityDetail`), `:136-149` (`searchCities`),
  `:184-201` (`AirportIndex`, `airportIndex`), `src/lib/places.ts` (builds both indexes),
  `src/ui/components/PlaceFields.tsx:54,97,205`, `src/lib/releases.ts`, `src/domain/changelog.ts`
  and `src/domain/changelog.test.ts`, `src/ui/pages/SettingsPage.tsx:55-67` (the **Your name** card,
  the pattern for the new card), `e2e/portuguese.e2e.ts` and `e2e/fixtures.ts`.
- Other locale-less formats to switch to `locale`: `src/ui/pages/WhatsNewPage.tsx:7`,
  `src/ui/pages/ServerPage.tsx:276` (`toLocaleDateString()`), `src/ui/pages/SettingsPage.tsx:133`
  (`toLocaleString()`), `src/ui/pages/SharePage.tsx:80` (`link.length.toLocaleString()`).

**Picking the language** (`src/i18n/language.ts`, pure, no globals), added to what is there:
```ts
/** How each language is tagged for dates, numbers, country names and `<html lang>`. */
export const LANGUAGE_TAGS: Record<Language, string> = { en: 'en-GB', pt: 'pt-PT' }
/** Each language's name, written in that language (the same in both dictionaries). */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', pt: 'Português' }
/** Where Settings → Language keeps the choice (localStorage). Missing: Automatic. */
export const LANGUAGE_KEY = 'waypoints.language'

/** A saved choice, if it is a language we have ('en', 'pt'); anything else means Automatic. */
export function savedLanguage(value: string | null | undefined): Language | undefined
/** The first of the phone's languages that we have, by its base ('pt-BR' → 'pt'), else English. */
export function phoneLanguage(phone: readonly string[]): Language
/** The address (`?lang=`), else the saved choice, else the phone's language. */
export function pickLanguage(search: string, saved: string | null | undefined, phone: readonly string[]): Language
/** The locale for dates and numbers: the phone's own (undefined) when its first language has the app's base, else the language's tag. */
export function formatLocale(language: Language, phone: readonly string[]): string | undefined
```
Bases are compared lowercased, before the first `-` (`'PT-br'` → `pt`). `formatLocale` with an
empty `phone` gives the tag.

**`src/i18n/index.ts`** becomes:
```ts
// Only a browser has a phone language and a saved choice: tests (Node) are always English.
const inBrowser = typeof document !== 'undefined'
const phone: readonly string[] = inBrowser ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : []

function readSaved(): string | null {
  try {
    return inBrowser ? localStorage.getItem(LANGUAGE_KEY) : null
  } catch {
    return null
  }
}

export const language: Language = pickLanguage(inBrowser ? location.search : '', readSaved(), phone)
/** For Intl and toLocale…: undefined keeps the phone's own formats (and tests' formats as they are). */
export const locale: string | undefined = inBrowser ? formatLocale(language, phone) : undefined
export const languageTag: string = LANGUAGE_TAGS[language]
/** What Settings → Language shows: the saved choice, or undefined for Automatic. */
export const chosenLanguage: Language | undefined = savedLanguage(readSaved())
export const dictionaries: Record<Language, Messages> = { en, pt }
export const m: Messages = dictionaries[language]

/** Saves Settings → Language (undefined: Automatic) and reloads, as the language is fixed at load. */
export function chooseLanguage(choice: Language | undefined) {
  try {
    if (choice) localStorage.setItem(LANGUAGE_KEY, choice)
    else localStorage.removeItem(LANGUAGE_KEY)
  } catch {
    // Not kept (private mode): the reload below goes back to Automatic.
  }
  location.reload()
}
```
Keep the existing imports; add the new names to the `./language` import.

**Country names** (`src/domain/places.ts`):
- `countryName(code: string, locale = 'en')`: one cached `Intl.DisplayNames([locale], { type: 'region' })`
  per locale (a `Map<string, Intl.DisplayNames | null>`, `null` when it throws); same fallbacks as
  today. Doc: `/** "PT" → "Portugal", in the given language (English by default). */`
- `cityDetail(city: City, locale = 'en')` passes it on.
- `CityIndex` gains `/** The app's language tag, for country names. */ locale: string`;
  `cityIndex(cities, locale = 'en')`. In `searchCities` the comma part matches
  `` `${city.region ?? ''} ${countryName(city.country)} ${countryName(city.country, index.locale)} ${city.country}` ``.
- `AirportIndex` gains `/** Each airport's folded country in the app's language. */ localCountries: string[]`;
  `airportIndex(airports, locale = 'en')` fills it with `fold(countryName(a.country, locale))`
  (`countries` stays English). In `searchAirports` the country tier (3) becomes
  `index.countries[i].startsWith(folded) || index.localCountries[i].startsWith(folded)`: matching
  stays "starts with", so English results don't change.
- `src/lib/places.ts` passes `languageTag` (from `../i18n`) to all three `cityIndex`/`airportIndex`
  calls; `PlaceFields.tsx:54,97,205` pass `languageTag` to `cityDetail` and `countryName`.

**What's new** (`CHANGELOG.pt.md`, `src/lib/releases.ts`):
- `CHANGELOG.pt.md` at the repo root: a Portuguese intro ("# Novidades", one line saying it is
  `CHANGELOG.md` in Portuguese, the same headings, and that a test checks both match), then every
  release of `CHANGELOG.md` with the same `## x.y.z — YYYY-MM-DD` heading, in the same order, its body
  translated: same paragraphs and bullets in the same order, the same number of `**bold**` and
  `` `code` `` spans. A bold UI label becomes the label the Portuguese app shows (look it up in
  `src/i18n/pt/`); emoji stay.
- `src/lib/releases.ts`: `import changelogPt from '../../CHANGELOG.pt.md?raw'` and `language` from
  `../i18n`; `RELEASES = parseChangelog(language === 'pt' ? changelogPt : changelog)`.

- Do not touch: `src/domain/` other than `places.ts` (and `places.test.ts`, `changelog.test.ts`),
  `src/db/`, `src/sync/`, `server/`, `scripts/`, `index.html`, `vite.config.ts`, existing tests in
  `e2e/`, any existing key in `src/i18n/{en,pt}/`.

## Tasks

1. **Picking the language**
   - Change: **Picking the language** and **`src/i18n/index.ts`** in Context. Extend
     `src/i18n/language.test.ts` with: `phoneLanguage` gives `'pt'` for `['pt-PT']`, `['pt-BR']`,
     `['PT']`, `['fr-FR', 'pt-PT']`; `'en'` for `['en-US']`, `['fr-FR', 'de-DE']`, `[]`.
     `savedLanguage` gives `'pt'` for `'pt'`, `undefined` for `null`, `''`, `'auto'`, `'pt-PT'`.
     `pickLanguage('?lang=en', 'pt', ['pt-PT'])` is `'en'`; `pickLanguage('', 'en', ['pt-PT'])` is
     `'en'`; `pickLanguage('', null, ['pt-BR'])` is `'pt'`; `pickLanguage('?lang=fr', 'x', ['de'])`
     is `'en'`. `formatLocale('en', ['en-US'])` is `undefined`; `formatLocale('pt', ['pt-BR'])` is
     `undefined`; `formatLocale('en', ['pt-PT'])` is `'en-GB'`; `formatLocale('pt', ['en-GB'])` is
     `'pt-PT'`; `formatLocale('pt', [])` is `'pt-PT'`. Also: importing `./index.ts` under Vitest
     gives `language` `'en'`, `locale` `undefined`, `chosenLanguage` `undefined`.
   - Depends on: none
   - Done when: `npx vitest run src/i18n` passes; `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

2. **Dates and numbers follow the language**
   - Change: in `src/ui/format.ts`, import `locale` from `../i18n` and pass it instead of every
     `undefined` locale (lines in Context); `fmtBytes` formats its number with
     `.toLocaleString(locale)` ("2,4 MB" in Portuguese; the rounding stays). The four other places in
     Context: `WhatsNewPage.tsx:7`, `ServerPage.tsx:276`, `SettingsPage.tsx:133`, `SharePage.tsx:80`
     pass `locale` (import it from the `i18n` module they already import `m` from). Comments that
     say "the device's language"/"device's clock setting" (`format.ts:5,21`) become "the app's
     language (the phone's own formats when it is in that language)".
   - Depends on: task 1
   - Done when: `grep -cE "\(undefined, |toLocale(Date|Time)?String\(\)" src/ui/format.ts src/ui/pages/WhatsNewPage.tsx src/ui/pages/ServerPage.tsx src/ui/pages/SettingsPage.tsx src/ui/pages/SharePage.tsx`
     prints 0 for every file; `npm test`, `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

3. **Country names follow the language**
   - Change: **Country names** in Context (`src/domain/places.ts`, `src/lib/places.ts`,
     `src/ui/components/PlaceFields.tsx`). Add to `src/domain/places.test.ts` (new `it`s; existing
     ones not edited): `countryName('ES', 'pt-PT')` is `'Espanha'`, `countryName('ES')` is
     `'Spain'`, `countryName('ZZZ', 'pt-PT')` is `'ZZZ'`; with
     `const pt = cityIndex(parseCities(<the same cities.tsv>), 'pt-PT')`,
     `searchCities(pt, 'Madrid, espanha')[0]` and `searchCities(pt, 'Madrid, spain')[0]` have
     `country` `'ES'` and `name` `'Madrid'`, `cityDetail(<that city>, 'pt-PT')` is
     `'Madrid, Espanha'`, and `searchCities(cities, 'Madrid, espanha')` (the English index) is `[]`;
     `searchAirports(airportIndex(<airports.tsv>, 'pt-PT'), 'espanha')` is not empty and every
     result has `country` `'ES'`.
   - Depends on: task 1
   - Done when: `npx vitest run src/domain/places` passes;
     `grep -rn "i18n" src/domain --include=*.ts | grep -v "\.test\.ts"` prints nothing;
     `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

4. **The Language card and `<html lang>`**
   - Change: `src/i18n/en/settings.tsx` and `src/i18n/pt/settings.tsx`, after `nameHint`:
     `language: 'Language'` / `'Idioma'`, `languageAutomatic: "Automatic (phone's language)"` /
     `'Automático (idioma do telemóvel)'`, `languageHint: 'Changing it reloads the app. Only for this phone.'`
     / `'Ao mudar, a app recarrega. Só neste telemóvel.'`. In `SettingsPage.tsx`, a new
     `<section className="card">` right after the **Your name** card: `<h3>{m.settings.language}</h3>`,
     a `<select className="input" aria-label={m.settings.language} value={chosenLanguage ?? 'auto'}>`
     with options `auto` (`m.settings.languageAutomatic`), then one per `LANGUAGES` entry labelled
     `LANGUAGE_NAMES[l]`; `onChange` calls `chooseLanguage(value === 'auto' ? undefined : value as Language)`;
     then `<p className="muted small">{m.settings.languageHint}</p>`. In `src/main.tsx`, before
     `createRoot`: `document.documentElement.lang = languageTag`.
   - Depends on: task 2
   - Done when: `grep -c "chooseLanguage(" src/ui/pages/SettingsPage.tsx` prints 1;
     `grep -c "documentElement.lang = languageTag" src/main.tsx` prints 1; `npm test`,
     `npm run typecheck`, `npm run lint` and `npm run build` pass.
   - Executor: sonnet

5. **What's new in Portuguese**
   - Change: **What's new** in Context: create `CHANGELOG.pt.md` (all 21 releases now in
     `CHANGELOG.md`, 0.1.0 to 0.16.0), and switch `src/lib/releases.ts`. In
     `src/domain/changelog.test.ts`, add `describe('CHANGELOG.pt.md')` after the `CHANGELOG.md` one,
     reading both files: (a) `releases.map((r) => [r.version, r.date])` is equal in both; (b) for
     each release, `parseNotes(body)` gives the same list of block kinds and, for lists, the same
     number of items in both; (c) each Portuguese body is not empty and differs from the English
     one; (d) the count of `**…**` spans and of `` `…` `` spans is the same in both bodies. Each
     assertion names the version in its message.
   - Depends on: task 4
   - Done when: `npx vitest run src/domain/changelog` passes;
     `grep -cE "^## " CHANGELOG.pt.md` equals `grep -cE "^## " CHANGELOG.md` (21 each);
     `grep -nE "\b(tela|arquivo|celular|compartilhar|salvar|usuário|você)\b" CHANGELOG.pt.md`
     prints nothing; `npm run typecheck`, `npm run lint` and `npm run build` pass. In the report,
     list each bold label in `CHANGELOG.pt.md` not found by `grep -rF` in `src/i18n/pt/` (old
     labels may have changed since; the reviewer checks the list).
   - Executor: sonnet

6. **Smoke test for the switch**
   - Change: add to `e2e/portuguese.e2e.ts` (existing tests not edited) a
     `test.describe('a phone in Portuguese', …)` with `test.use({ locale: 'pt-PT' })`, and in it:
     (a) `page.goto('')` shows the heading **Planear uma viagem** with no `?lang`,
     `expectNoEnglish(page)` passes, and `page.locator('html')` has attribute `lang` `pt-PT`;
     (b) after `importDemoTrip(page)` and `page.goto('')`, the trip list contains `08/04/2026`;
     (c) on `#/settings`, `selectOption` **English** on the select labelled **Idioma** reloads to
     the heading **Settings**; the trip list (`page.goto('')`) contains `Apr 2026`; after
     `page.reload()` it is still English, and `html` has `lang` `en-GB`; (d) back on `#/settings`,
     picking **Automatic (phone's language)** on the select labelled **Language** shows
     **Definições** again. Outside the describe (the default `en-GB` phone): on `#/settings`,
     picking **Português** shows **Definições**; then `#/whats-new` shows the heading **Novidades**
     and `expectNoEnglish(page)` passes. Wait for the reload with
     `page.waitForEvent('load')` started before `selectOption`.
   - Depends on: task 5
   - Done when: `npm run smoke` passes (all tests, old and new).
   - Executor: sonnet

7. **Release 0.17.0**
   - Change: `version` `0.17.0` in `package.json` and `package-lock.json` (the top-level and
     `packages[""]` entries). The 0.17.0 entry from Behavior at the top of `CHANGELOG.md` and of
     `CHANGELOG.pt.md`, dated the day it is built. `CHANGELOG.md`'s comment gets a line: "Every
     entry is also in CHANGELOG.pt.md, in Portuguese, with the same heading (a test enforces it)."
     `GUIDE.md` section 10: after the **Your name** bullet, add
     "- **Language:** Automatic follows your phone's language; or pick English or Português. It stays on your phone."
     Then retake the screenshots (`npm run dev` in one shell, `npm run guide:screenshots` in
     another) and commit only `docs/guide/settings.png` (`git checkout -- docs/guide` for the rest);
     it must show the **Language** card. `CLAUDE.md`: in "Releases & changelog", after "…at the top
     of `CHANGELOG.md`", add ", and the same entry in Portuguese at the top of `CHANGELOG.pt.md`";
     under "Principles", "English only." becomes "English and Portuguese (PT-PT): Settings →
     Language, Automatic by default (`src/i18n/index.ts`)."
   - Depends on: task 6
   - Done when: `npx vitest run src/domain/changelog` passes;
     `grep -c "CHANGELOG.pt.md" CLAUDE.md CHANGELOG.md` prints at least 1 for each;
     `grep -c "English only" CLAUDE.md` prints 0; `grep -c "\*\*Language:\*\*" GUIDE.md` prints 1;
     `grep -rF "Language" src/i18n/en/settings.tsx` finds it (the guide's bold label);
     `git diff --stat origin/main -- docs/guide` lists only `settings.png`; `npm test` passes.
   - Executor: sonnet

8. **Series upkeep**
   - Change: in `specs/translation-layer.md` Notes, "The series" item 7 becomes "7. the switch:
     Language in Settings (Automatic / English / Português), Portuguese on phones set to
     Portuguese, dates, numbers and country names following the app's language, `<html lang>`,
     What's new notes in both languages (CI-enforced), version bump (`language-setting`);" and a
     new item "8. the guide and its screenshots in Portuguese, linked from the Portuguese app." The
     Notes line "`?lang=pt` is a preview … part 7 decides whether it stays." gets " Part 7 kept it,
     over the setting." appended. Change nothing else (`specs/BACKLOG.md` already names part 8).
   - Depends on: task 7
   - Done when: `grep -c "language-setting" specs/translation-layer.md` prints 1;
     `grep -c "Part 7 kept it" specs/translation-layer.md` prints 1.
   - Executor: haiku

## Acceptance criteria
- [ ] `npm run smoke` passes, with the new tests: a `pt-PT` phone gets Portuguese with no
      `?lang`, `<html lang="pt-PT">` and `08/04/2026`; English picked there sticks after a reload
      and shows `Apr 2026`; Automatic goes back; an `en-GB` phone picking Português sees
      **Novidades** with no English.
- [ ] `npm test` passes: every existing test unchanged, plus the new ones in
      `src/i18n/language.test.ts`, `src/domain/places.test.ts` and `src/domain/changelog.test.ts`.
- [ ] `CHANGELOG.pt.md` has the same 22 headings as `CHANGELOG.md` (0.1.0 to 0.17.0), enforced by
      the test.
- [ ] `grep -rn "i18n" src/domain server/src --include=*.ts | grep -v "\.test\.ts"` prints nothing.
- [ ] `git diff origin/main --stat` lists nothing under `src/db/`, `src/sync/`, `server/`,
      `scripts/`, and not `index.html` or `vite.config.ts`.
- [ ] `grep -rnE "\b(tela|arquivo|celular|compartilhar|salvar|usuário)\b" src/i18n/pt CHANGELOG.pt.md` prints nothing.
- [ ] Manual, `npm run dev`, a desktop Chrome in English: Settings → Language → **Português**
      reloads Settings in Portuguese; a trip's Money tab shows amounts like `1234,50 €`; a new
      activity's City field, typing "Madrid, espanha", lists **Madrid** with "Madrid, Espanha".
      Choosing **Automático (idioma do telemóvel)** brings English back.
- [ ] `docs/guide/settings.png` shows the **Language** card; no other screenshot changed.
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: no errors.
- `npm run smoke`: all tests pass (first run needs `npx playwright install chromium`).
- Manual: the check in the acceptance criteria.

## Escalate when
- Any existing test (unit or e2e) or a `npm run guide:screenshots` selector would need changing:
  that means English moved for an `en-GB` phone on Automatic.
- `expectNoEnglish` fails on What's new because of a correct Portuguese word or a name (list it).
- A bold label of an old release has no Portuguese label in `src/i18n/pt/` and more than one
  natural PT-PT translation (list them).
- Node's or Chromium's ICU gives other text than the spec's examples (`Espanha`, `08/04/2026`,
  `1234,50 €`): report what it gives, don't change the expectation silently.
- Any change seems needed outside the files named in the tasks, a Dexie version, or a new
  dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 7 of the series in `specs/translation-layer.md` (Notes). Parts 1 to 6 are shipped and the
  sync server 0.8.0 image is published; this part only announces it.
- Decided with Ricardo: the original part 7 is cut in two. This spec turns Portuguese on and
  releases it; the guide in Portuguese and its screenshots become part 8, so its Settings picture
  can show the Language card. Until then **Ler o guia** opens the English guide.
- Decided with Ricardo: all 21 earlier What's new entries are translated, so a Portuguese phone
  sees no English there; a test keeps both files in step from now on.
- Decided with Ricardo: dates and numbers keep the phone's own formats when it is in the app's
  language (so US people keep their 12-hour clock), and use `en-GB`/`pt-PT` when the languages
  differ. `en-GB` because the app's English is British ("travellers").
- Decided with Ricardo: `pt-BR` phones get Portuguese (PT-PT text) on Automatic; `?lang=` stays as
  a not-remembered override (the smoke tests and screenshots use it); country names follow the
  language, and searching by country accepts both.
- The phone's language is "the first of its languages the app has", not just the first one, so a
  `fr-FR, pt-PT` phone gets Portuguese rather than English.
- `localStorage`, not the Dexie `settings` table: the language is read once while the page loads,
  before Dexie opens, and Dexie is asynchronous. It isn't in backups, which is right for a
  per-phone choice.
- Reloading on change keeps the module-constant design from part 1 (tables built at import, like
  `labels.ts`, need no change).
- Under Vitest there is no `document`, so neither the machine's language nor a saved choice can
  turn the unit tests Portuguese (Node 24's `navigator.languages` follows the machine).
- Dry-run while speccing (Node 24 ICU): `countryName` `pt-PT` gives `Espanha`, `Irão`, `Estados
  Unidos`; trip dates 8–15 Apr 2026 give `08/04/2026 – 15/04/2026` (`pt-PT`) and `8 – 15 Apr 2026`
  (`en-GB`, with thin spaces, hence the `Apr 2026` check); `searchCities(…, 'Madrid, spain')`
  finds Madrid (`ES`) and `'Madrid, espanha'` finds nothing today.
- Overlap: no unbuilt spec changes `src/i18n/index.ts`, `src/ui/format.ts`, `src/domain/places.ts`
  or `src/lib/releases.ts`. Draft specs that add a release (`trip-budget`, `expenses-csv-export`,
  `server-trip-cleanup`, `qr-join`, `plan-editing`, `list-row-stars`) must add their entry to
  `CHANGELOG.pt.md` too once this ships (the CLAUDE.md rule from task 7), so `Builds after` is
  "none".
