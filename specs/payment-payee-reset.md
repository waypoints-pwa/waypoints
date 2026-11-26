# Payment keeps the payee it shows

Status: ready
Issue: <issue link>
Builds after: none

## Problem
On the settle-up payment form, choosing as **From** the person who is set as **To** makes the **To**
list show the first other traveller, but the form still holds the old payee. Saving then fails with
"Choose who received the money." although a payee is shown, and people have to pick someone else in
**To** and pick the shown person again before it saves.

## Behavior
When **From** changes to the person currently in **To**, **To** switches to the first traveller in the
trip's order who isn't the new payer: the same person the **To** list shows first. What the form shows
and what it saves are always the same person.

Example (trip with Ana, Ben, Chloé; you are Ana):
1. Money → **+ Payment** (in Balances). The form opens with **From** Ana, **To** Ben.
2. Change **From** to Ben. **To** now shows Ana.
3. Type 20 in **Amount**, tap **Save**. The payment saves with no error, and the Money list shows
   "Ben paid Ana".

Other cases:
- Changing **From** to someone who isn't the payee leaves **To** as it was.
- The "X owes Y …" hint under **Amount** (new payments only) follows the switched payee, as it reads
  `to` from the same state.
- A settle-up link (`?transfer=1&from=…&to=…`) whose `from` and `to` are the same traveller opens with
  **To** set to the first other traveller instead of a payee the list can't show.
- Editing an existing payment behaves the same way when **From** is changed.
- A trip with one traveller: the **From**/**To** fields aren't shown for expenses; for a payment, if no
  other traveller exists, `to` stays `''` and the existing "Choose who received the money." error is
  correct (unchanged).
- Nothing about storage, sync or links changes: the saved record is the same shape as today.

## Out of scope
- Any change to regular expenses, the several-payers controls or the **For whom** split.
- Swapping payer and payee automatically (the user is happy with "first other traveller").
- Changing the error text or adding new strings.
- Any change to `GUIDE.md`/`GUIDE.pt.md` or their screenshots (no pictured screen changes).

## Constraints
- Release rules from CLAUDE.md: user-facing fix → bump `version` in `package.json` (and
  `package-lock.json`) to `0.18.1`, add `## 0.18.1 — <build date>` at the top of `CHANGELOG.md` and the
  same heading in `CHANGELOG.pt.md` (`src/domain/changelog.test.ts` checks both).
- No data, Dexie, sync or link format change.
- Run vitest through PowerShell, not Git Bash (it crashes under Git Bash on this machine).

## Context for implementers
- `src/ui/items/expenses.tsx`, `ExpenseForm`:
  - line 356: `defaultPayer = settle?.from ?? t.me?.id ?? ids[0]`.
  - line 387: `const [to, setTo] = useState(() => settle?.to ?? (existing?.transfer ? … : ids.find((id) => id !== defaultPayer)) ?? '')`.
  - line 428: on save, `if (!to || to === paidBy) return setError(m.money.chooseWhoReceived)`: the error the user hits.
  - line 570: the **From**/**Paid by** `<select>`: `onChange={(e) => setPaidBy(e.target.value)}`.
  - line 665: the **To** `<select>` lists `t.travellers.filter((x) => x.id !== paidBy)`. When `to === paidBy`
    no option matches, so the browser shows the first option while state keeps the old id. That is the bug.
- `ids` (line 354) is `t.travellers.map((x) => x.id)`, in the same order as the **To** list, so
  `ids.find((id) => id !== payer)` is exactly the first option the list shows.
- e2e helpers in `e2e/fixtures.ts`: `test`, `expect`, `importDemoTrip` (imports the demo trip: Ana, Ben,
  Chloé, currency EUR), `pickMe(page, tripId, name)`, `dismissNotices(page)`. Follow `e2e/screens.e2e.ts`
  for style. `Field` (`src/ui/components/fields.tsx`) renders a `<label>`, so `page.getByLabel('From')` /
  `getByLabel('To')` find the selects.
- Strings (en): `m.money.addPayment` "+ Payment" (Balances button, line 123, opens an empty payment), `m.money.recordPayment` "Record payment" (settle rows, prefilled), `m.money.from` "From", `m.money.to` "To",
  `m.money.chooseWhoReceived` "Choose who received the money.", `m.money.paidTo` "`${payer} paid ${names}`",
  `m.common.save` "Save".
- Don't touch: `src/domain/*`, `src/db/*`, i18n files, the several-payers block (lines ~590–660).
- Decision made: keep the existing "first other traveller" behavior; only make state match it.

## Tasks

1. **Keep `to` in step with the payer**
   - Change: in `src/ui/items/expenses.tsx`, `ExpenseForm`:
     - Line 570: the `<select>` `onChange` becomes: read `const payer = e.target.value`, call
       `setPaidBy(payer)`, and if `payer === to` call `setTo(ids.find((id) => id !== payer) ?? '')`.
       Applies to both expenses and payments (for expenses `to` is unused, harmless).
     - Line 387: the initial `to` must never equal `defaultPayer`: if the computed value equals
       `defaultPayer`, use `ids.find((id) => id !== defaultPayer) ?? ''` instead (covers a settle-up link
       with `from === to`). Keep the existing-payment branch otherwise unchanged.
   - Depends on: none
   - Done when: `npm run typecheck` and `npm run lint` pass, and `git diff --stat` shows only
     `src/ui/items/expenses.tsx`.
   - Executor: sonnet

2. **Smoke test for the payment form**
   - Change: new file `e2e/payment-form.e2e.ts`, one test "a payment from the payee keeps the payee the form
     shows": `importDemoTrip`, `pickMe(page, trip, 'Ana')`, go to `#/trips/${trip}/money`, `dismissNotices`,
     click the link named `+ Payment` (`getByRole('link', { name: '+ Payment' })`, the plain one in Balances, not a settle row's **Record payment**), `expect(getByLabel('From')).toHaveValue(<Ana id>)` and
     `getByLabel('To')` has Ben's id; select **From** = Ben (`selectOption({ label: 'Ben' })`); assert
     `getByLabel('To')` has Ana's id; fill the **Amount** textbox (`getByRole('textbox', { name: 'Amount' })`)
     with `20`; click **Save**; assert the text "Choose who received the money." has count 0, the URL no
     longer ends in `/expenses/new` (it may carry `?transfer=1`), and, on `#/trips/${trip}/money`, the text
     "Ben paid Ana" is visible. Traveller ids come from `backup.travellers` by name.
   - Depends on: task 1
   - Done when: `npx playwright test e2e/payment-form.e2e.ts` passes with task 1, and fails on
     `origin/main`'s `expenses.tsx` (check once with `git stash` of task 1's change, then restore).
   - Executor: sonnet

3. **Release bookkeeping**
   - Change: `package.json` and `package-lock.json` version `0.18.1`; new top entry in `CHANGELOG.md`:
     `## 0.18.1 — <build date>` + "Recording a payment from the person who was set to receive it no longer
     says nobody received it: the payment now goes to the person the form shows." and the same heading in
     `CHANGELOG.pt.md` with: "Registar um pagamento feito pela pessoa que estava escolhida para o receber
     já não diz que ninguém o recebeu: o pagamento vai agora para a pessoa que o formulário mostra."
   - Depends on: none
   - Done when: `npm test -- src/domain/changelog.test.ts` passes (run in PowerShell).
   - Executor: haiku

## Acceptance criteria
- [ ] On a 3-traveller trip, new payment, **From** set to the shown payee → **To** shows and holds the
  first other traveller; **Save** succeeds with no error (`e2e/payment-form.e2e.ts`).
- [ ] The saved payment reads "Ben paid Ana" on the Money screen (same test).
- [ ] Changing **From** to someone other than the payee leaves **To** unchanged (manual: open **+ Payment**
  as Ana → To Ben, set From to Chloé, To still Ben).
- [ ] `#/trips/<id>/expenses/new?transfer=1&from=<Ben>&to=<Ben>` opens with **To** = Ana and saves
  (manual).
- [ ] Only `src/ui/items/expenses.tsx`, `e2e/payment-form.e2e.ts`, `package.json`, `package-lock.json`,
  `CHANGELOG.md`, `CHANGELOG.pt.md` change.
- [ ] `npm run smoke` passes.

## Verification
- `npm run lint`, `npm run typecheck`, `npm run build`: no errors.
- `npm test` (PowerShell): all pass.
- `npm run smoke`: all pass, including the new `payment-form.e2e.ts`.

## Escalate when
- The fix seems to need changes outside `ExpenseForm` or to the several-payers block.
- The new e2e test passes on the unfixed code (it isn't catching the bug).
- Any check fails twice after a fix attempt.
- Anything would change a saved record's shape, Dexie, sync or links.

## Open questions
- none

## Notes
- Root cause is UI state only (a controlled `<select>` whose value matches no option); the save
  validation at line 428 is correct and stays.
- The `from === to` settle link guard is included because it is the same mismatch reached a different
  way and costs one line.
- `expenses-csv-export` and `trip-budget` (drafts) also cite `expenses.tsx` but not `ExpenseForm`'s
  payer/payee fields: no real overlap, so `Builds after: none`.
- No interview round: the report already fixed the wanted behavior (first other traveller) and the
  code answered the rest.
