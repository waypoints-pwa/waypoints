# Several people paid one expense

Status: shipped (0.18.0)
Issue: https://github.com/waypoints-pwa/waypoints/issues/96
Builds after: none

## Problem
An expense can only say one person paid it. When two or more travellers paid one bill together
(each put in half, or one paid 40 and the other 20), people have to split it into several expenses
or fix the balances by hand.

## Behavior
One payer stays the default and the form looks the same as today until someone asks for more.

**Form** (new or edited expense, trips with 2+ travellers, not a settle-up payment):
- Under the **Paid by** dropdown there is a small link: **Paid by several people?**
- Tapping it replaces the dropdown with a two-way switch, **Equally** | **Different amounts**
  (starts on Equally), plus a link **One person** to go back.
  - **Equally**: a chip per traveller, the dropdown's payer already picked. Below:
    "30.00 each, paid by 2 people." (amount ÷ chosen, in the expense's currency).
  - **Different amounts**: one amount box per traveller ("What Ana paid"), and below the same
    "x left to assign." line as the split's exact amounts.
- **One person** brings the dropdown back, set to the payer who paid the most.
- Saving:
  - Equally with nobody chosen: error "Choose who paid."
  - Different amounts not adding up to the amount (more than 0.005 off): the existing error
    "The amounts add up to 50, not 60."
  - Only one person chosen (or only one amount above 0): saved as a plain one-payer expense.
  - Two or more: saved with all payers. `paidBy` is still filled in, with whoever paid the most
    (ties: the first in the trip's traveller order), so older app versions show a payer.
- Editing an expense that has several payers opens with the several-payers part open, in the mode
  and with the values it was saved with. Switching back to **One person** and saving removes them.
- Cash/card and "what the bank charged" stay one per expense: anyone who paid can add the charge.

**Example.** Dinner, 60 EUR, Ana paid 40 and Bruno 20, split equally between Ana, Bruno and Carla
(20 each). Balances: Ana +20, Bruno 0, Carla −20. Money row: "2 people paid · split by everyone".
Expense page: a **Paid by** card listing Ana 40.00 EUR and Bruno 20.00 EUR, above the Split card.

**Elsewhere:**
- Balances, settle-up suggestions, the trip report's "paid" per person: each payer is credited
  with their part (converted at the expense's rate, as today).
- Money list row: "2 people paid · for Carla", "2 people paid · split by everyone",
  "2 people paid · split 3 ways". One-payer rows are unchanged.
- Expense page: with several payers, the **Paid by** fact row is replaced by a **Paid by** card
  (each payer and amount, in the expense's currency). One payer: unchanged.
- "Card payments waiting for your bank" counts an expense as yours if you are one of its payers.
- A traveller who paid part of any expense can't be removed from the trip (as for payers today).
- A cash exchange added from the expense form records the main payer as `by`.

**Older app versions** in the group (decided: accept it): they ignore the new field and count the
whole expense as paid by `paidBy` (the biggest payer) until they update. They keep the field when
they edit or merge the expense. If an older app changes the amount, the saved payer amounts no
longer add up: updated phones scale them to the new amount (see `payersOf`). If it changes
`paidBy`, updated phones still use the saved payers.

Offline, links, files and the sync server: nothing new; the field travels with the record.

## Out of scope
- Several payers on settle-up payments (transfers stay one person to one person).
- A bank charge (card rate) per payer; per-payer cash/card.
- Showing who paid in the CSV export (draft spec `expenses-csv-export` should use `payersOf`
  when it is built; not changed here).
- New guide screenshots or a demo-trip expense with several payers.
- Any change to `split`, link versions, backup version, Dexie versions or the server.

## Constraints
- Mixed versions: new optional field only; `paidBy` stays required and always set
  (CLAUDE.md "Mixed versions in a group", "Backup format: add optional fields only").
- Links and files are untrusted: the new field is validated in `src/domain/records.ts`.
- `src/domain` never imports `src/i18n`.
- All text in both `src/i18n/en/money.tsx` and `src/i18n/pt/money.tsx`.
- User-facing change: version bump, both changelogs, both guides.

## Context for implementers
- `src/db/types.ts:137-168`: `Split` and `Expense`. Add, after `split`:
  ```ts
  /**
   * When several travellers paid: equally among them, or exact amounts (in `currency`) each.
   * Absent: `paidBy` paid it all. When set, `paidBy` is the one who paid the most (for older apps).
   * Never on a transfer.
   */
  payers?: Split
  ```
- `src/domain/records.ts:71` (`split` check) and `:155-168` (expenses spec): add
  `payers: optional(split)`. `checkRecord` already allows unknown fields, so older apps and servers
  keep it.
- `src/domain/expenses.ts`: `sharesOf` (~line 98) is the pattern for the new `payersOf`;
  `balances` (~line 121) credits `expense.paidBy` at `const payer = of(expense.paidBy)` (~129):
  replace with a loop over `payersOf(expense)`, adding each part converted with `toTripCurrency`
  to `net`, and to `paid` when not a transfer.
- `src/ui/items/expenses.tsx`:
  - `ids`, `group`, `defaultPayer` at ~347-349; form state at ~357-375; split building and
    validation in `onSubmit` ~398-438; exchange `by: paidBy` ~423; **Paid by** field ~534-546;
    the split UI (segmented control, `toggle-chip` chips, `split-row` amount rows) ~558-628: copy
    its markup and classes for the payers UI.
  - `splitSummary` ~283-290 (row text); `RatesCard` `yours` ~199; `ExpensePage` facts ~676-682
    and Split card ~684-697.
  - Link-style buttons: `<button type="button" className="link small">` (as in
    `src/ui/components/Reviews.tsx:129`).
- `src/ui/pages/TripFormPage.tsx:57`: `inExpenses` uses `e.paidBy`: use `...payersOf(e).keys()`.
- `saveRecord` (`src/db/actions.ts:53`) runs `compact`, which drops `undefined` fields: passing
  `payers: undefined` on save removes the field (same as `rate` today).
- `src/domain/report.ts` needs no change: it uses `balances`.
- Tests: `src/domain/expenses.test.ts` (fixtures `expense`, `ANA`, `BO`, `CY` from
  `src/test/fixtures.ts`; `nets` helper in the test file), `src/domain/records.test.ts`.
- Decisions made: link-hidden UI; accept older versions' view; one bank charge per expense.

## Tasks

1. **Field and validation**
   - Change: add `payers?: Split` to `Expense` in `src/db/types.ts` (comment above);
     `payers: optional(split)` in the expenses spec in `src/domain/records.ts`; in
     `src/domain/records.test.ts` add `describe('checkRecord expenses payers')` with: an expense
     with `payers: { kind: 'equal', among: [ANA, BO] }` passes; with
     `payers: { kind: 'exact', amounts: { [ANA]: 40, [BO]: 20 } }` passes; without `payers` passes;
     `payers: { kind: 'equal', among: ['x'] }` throws; `payers: 'ana'` throws.
   - Depends on: none
   - Done when: `npx vitest run src/domain/records.test.ts` passes and `npm run typecheck` passes.
   - Executor: sonnet

2. **`payersOf`, `mainPayer`, balances**
   - Change: in `src/domain/expenses.ts`, export
     - `payersOf(e: Pick<Expense, 'amount' | 'paidBy' | 'payers' | 'transfer'>): Map<string, number>`:
       transfer or no `payers` → `paidBy` → `amount`. `equal`: unique ids, `amount / n` each.
       `exact`: entries above 0; if their sum differs from `amount` by more than 0.005, each is
       multiplied by `amount / sum`. Empty result (no ids, or no amount above 0) → `paidBy` →
       `amount`.
     - `mainPayer(parts: Map<string, number>): string`: the id with the largest amount; ties go to
       the first in the map's order.
     - `balances` credits every entry of `payersOf(expense)` instead of `expense.paidBy`.
     In `src/domain/expenses.test.ts` add `describe('payersOf')`: no payers → `{ANA: 30}`;
     transfer with payers set → only `paidBy`; equal `[ANA, BO, ANA]` on 30 → 15 each; exact
     `{ANA: 40, BO: 20}` on 60 → same; exact `{ANA: 40, BO: 20}` on 90 → 60 and 30; exact all 0 →
     `paidBy`. `describe('mainPayer')`: `{BO: 20, ANA: 40}` → ANA; `{BO: 30, ANA: 30}` → BO.
     In `describe('balances')` add: 60 EUR, payers exact `{ANA: 40, BO: 20}`, split equal
     `[ANA, BO, CY]` → nets `{ANA: 20, BO: 0, CY: -20}` and ANA `paid` 40, BO `paid` 20.
   - Depends on: task 1
   - Done when: `npx vitest run src/domain/expenses.test.ts` passes and `npm run typecheck` passes.
   - Executor: sonnet

3. **Text**
   - Change: add to `money` in `src/i18n/en/money.tsx` and the same keys in `src/i18n/pt/money.tsx`:
     | key | en | pt |
     |---|---|---|
     | `paidBySeveral` | `Paid by several people?` | `Pago por várias pessoas?` |
     | `payersEqually` | `Equally` | `Por igual` |
     | `payersAmounts` | `Different amounts` | `Valores diferentes` |
     | `onePayer` | `One person` | `Uma pessoa` |
     | `chooseWhoPaid` | `Choose who paid.` | `Escolhe quem pagou.` |
     | `paidEach(amount, n)` | `` `${amount} each, paid by ${plural(n, 'person', 'people')}.` `` | `` `${amount} cada, pagos por ${n === 1 ? '1 pessoa' : `${n} pessoas`}.` `` |
     | `paidPartOf(name)` | `` `What ${name} paid` `` | `` `O que ${name} pagou` `` |
     | `severalPaidForOne(n, name)` | `` `${n} people paid · for ${name}` `` | `` `${n} pessoas pagaram · para ${name}` `` |
     | `severalPaidSplitEveryone(n)` | `` `${n} people paid · split by everyone` `` | `` `${n} pessoas pagaram · dividido por todos` `` |
     | `severalPaidSplitWays(payers, n)` | `` `${payers} people paid · split ${n} ways` `` | `` `${payers} pessoas pagaram · dividido em ${n}` `` |
     In en, function keys are typed like their neighbours: `amount`/`name` are `string`, `n`/`payers`
     are `number`, return `string` (e.g. `paidEach: (amount: string, n: number): string => …`).
     `plural` is already imported in en.
   - Depends on: none
   - Done when: `npm run typecheck` passes and `grep -c "severalPaidSplitWays\|paidBySeveral\|chooseWhoPaid" src/i18n/en/money.tsx src/i18n/pt/money.tsx` prints 3 for each file.
   - Executor: haiku

4. **Form: several payers**
   - Change: in `ExpenseForm` (`src/ui/items/expenses.tsx`) add state
     `payersKind: 'one' | 'equal' | 'exact'` (initially `existing?.payers?.kind ?? 'one'`), `payerSet: Set<string>` (existing `equal` ids, else `[paidBy]`),
     `payerExact: Record<string, string>` (existing exact amounts via `fmtPlain`, else `{}`).
     Render per **Behavior → Form**, only when `group && !transfer`: in `'one'` the existing select
     plus a `paidBySeveral` link (sets `'equal'` and `payerSet` to `{paidBy}`); otherwise a
     `segmented` switch (`payersEqually`/`payersAmounts`), chips or `split-row` rows
     (`aria-label={m.money.paidPartOf(x.name)}`), the `paidEach` / `leftToAssign` line, and a
     `onePayer` link (sets `'one'` and `paidBy` to `mainPayer` of the current parts, if any).
     In `onSubmit`, before `save`, compute `payers: Split | undefined` and the saved `paidBy` per
     **Behavior → Saving** (use `mainPayer`; build maps in `ids` order). Transfers and one-person
     trips always save `payers: undefined`. Pass `payers` to `save`, and the saved payer as the
     new exchange's `by`.
   - Depends on: tasks 2, 3
   - Done when: `npm run typecheck`, `npm run lint` and `npm test` pass, and the manual checks in
     Acceptance criteria 1–4 hold in `npm run dev`.
   - Executor: sonnet

5. **Showing several payers**
   - Change: `src/ui/items/expenses.tsx`: `splitSummary` uses `payersOf(e)`; with 2+ payers, the
     `severalPaid…` strings with the payer count (one payer: today's strings). `RatesCard` `yours`:
     `payersOf(e).has(t.me.id)`. `ExpensePage`: with 2+ payers, drop the **Paid by** fact and add a
     card before the Split card: `<h3>{m.money.paidBy}</h3>` and the same `history` list markup,
     with each payer's amount in `e.currency`. `src/ui/pages/TripFormPage.tsx:57`: use
     `payersOf(e).keys()` in place of `e.paidBy`.
   - Depends on: tasks 2, 3
   - Done when: `npm run typecheck`, `npm run lint`, `npm test` pass and Acceptance criteria 5–7
     hold in `npm run dev`; `grep -n "e.paidBy" src/ui/pages/TripFormPage.tsx` prints nothing.
   - Executor: sonnet

6. **Guide**
   - Change: in `GUIDE.md` section `### Expenses`, after the **Split** bullet, add:
     `- Paid by **several people**? Tap **Paid by several people?** and split who paid equally or by
     different amounts.` In `GUIDE.pt.md` `### Despesas`, after the **Divide** bullet:
     `- Pago por **várias pessoas**? Toca em **Pago por várias pessoas?** e divide quem pagou por
     igual ou por valores diferentes.` No new screenshots.
   - Depends on: task 3
   - Done when: `npx vitest run scripts/guide/guide.test.ts` passes, and
     `grep -c "Paid by several people?" src/i18n/en/money.tsx` and
     `grep -c "Pago por várias pessoas?" src/i18n/pt/money.tsx` each print 1.
   - Executor: sonnet

7. **Release**
   - Change: `package.json` and `package-lock.json` version `0.18.0`; top entry in `CHANGELOG.md`:
     `## 0.18.0 — <date of the build>` with "An expense can now be paid by several people: tap
     **Paid by several people?** under Paid by, then split it equally or by different amounts.
     Balances credit each of them. Phones that haven't updated yet count it as paid by whoever paid
     the most." and the same in `CHANGELOG.pt.md`: "Uma despesa pode agora ser paga por várias
     pessoas: toca em **Pago por várias pessoas?** em Pago por e divide por igual ou por valores
     diferentes. Os saldos contam o que cada uma pagou. Os telemóveis ainda não atualizados
     contam-na como paga por quem pagou mais."
   - Depends on: tasks 4–6
   - Done when: `npx vitest run src/domain/changelog.test.ts` passes.
   - Executor: haiku

## Acceptance criteria
- [x] 1. New expense on a 3-traveller trip: the form shows the **Paid by** dropdown and the
  **Paid by several people?** link, nothing else new; saving gives a one-payer expense as before.
- [x] 2. Several, Equally, Ana + Bruno, 60 EUR: the line says "30.00 each, paid by 2 people.";
  saved; Ana and Bruno are each credited 30 in Balances.
- [x] 3. Several, Different amounts, Ana 40 + Bruno 10 on 60: error "The amounts add up to 50,
  not 60."; with Bruno 20 it saves; split equally by all three gives Ana +20, Bruno 0, Carla −20.
- [x] 4. Editing that expense opens on Different amounts with 40 and 20; **One person** + save
  gives a one-payer expense paid by Ana (the field is gone: balances Ana +40).
- [x] 5. The Money row reads "2 people paid · split by everyone"; the expense page shows a
  **Paid by** card with Ana 40.00 EUR and Bruno 20.00 EUR.
- [x] 6. Bruno can't be removed from the trip while he paid part of an expense.
- [x] 7. Settle-up payments and one-traveller trips show no several-payers link.
- [x] 8. Unit tests from tasks 1–2 pass (`npm test`).
- [x] 9. A trip link or file with such an expense, opened on another phone with this version,
  shows the same payers (manual: share link between two browser profiles).

## Verification
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run smoke`: all pass, no
new warnings. Then the manual checks above in `npm run dev`.

## Escalate when
- Any change seems needed to `split`, `sharesOf`, `settleUp`, link/backup versions, `db.ts`,
  `serverProtocol.ts` or `server/`.
- `balances` tests outside the new cases change result.
- A string's wording doesn't fit the screen or the Portuguese reads wrong.
- A check fails twice after fixing attempts.

## Open questions
- none

## Notes
- New optional `payers` rather than changing `paidBy` to a list: `paidBy` is required in
  `records.ts` on every released version, so older apps and servers would reject records without
  it. Keeping it filled with the biggest payer is the least-wrong view for older phones (decided
  with the user: accept, no extra warning).
- `payers` reuses the `Split` shape so it reuses the `split` validator and form markup.
- Scaling exact payer amounts that no longer add up keeps balances summing to zero after an older
  app edits the amount.
- One bank charge per expense (decided with the user): per-payer charges would change conversion
  and "cost pending".
- Overlap scan: `expenses-csv-export` (draft) and `trip-budget` (draft) read expenses but don't
  use `paidBy`; `field-level-merge` (draft) merges fields generically. No shared Dexie version,
  table or helper, so `Builds after: none`.
- As built:
  - App 0.18.0; no server change.
  - The **Paid by** card and the payers form list travellers in the trip's order (the demo trip
    showed Ben above Ana), not in the order they paid.
  - Browser checks were a throwaway script against the dev server (`en-GB` phone, the demo trip's
    Ana, Ben and Chloé, no expenses): criteria 1–7 and 9 (link shared to a second browser), plus
    "Choose who paid." and the "2 people paid · for Chloé" row; 24 checks passed. Not checked: a
    real phone, a group with an older app version.
  - Left as is: in Equally mode the "x each, paid by n people" line counts a payer who has since
    been removed from the trip (saving filters them out). Traveller removal checks `payersOf` only,
    as specced; if an older app changes `paidBy` on a several-payer expense, that person is no longer
    locked. Keeping `paidBy` too (`[e.paidBy, ...payersOf(e).keys()]`) would close it.
  - `npm run smoke` needs `npx playwright install chromium` first on a fresh machine.
