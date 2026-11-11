# What the sync server answers in both languages (Portuguese, part 6)

Status: ready
Issue: <issue link>
Builds after: none

## Problem
Parts 1 to 5 (`specs/translation-layer.md` and the four `translate-*` specs, all shipped) moved every
screen and all text the phone makes onto the translation layer. What the sync server answers (why
it refused a code, an invite, a file, a Google Maps link or a change) is still English sentences
made on the server, so a phone in Portuguese can't show them in Portuguese. This part has the
server send a code with each reason, and the app translate it.

## Behavior
- **Nothing changes for people using the app**: everything reads exactly as before, in English. No
  app version bump, no What's new. The server becomes **0.8.0**.
- **In the `?lang=pt` preview** (part 1), with a 0.8.0 server, what the server answers is
  Portuguese. Examples: joining with a wrong server code shows **Código do servidor errado**; an
  expired invite **Esse convite expirou. Pede um novo.**; joining as a name already there
  **Já há alguém chamado Max no servidor. Se és tu, escolhe antes o teu nome na lista.**; a change
  the server refused shows in the Trip tab's notice as **O servidor recusou 1 alteração: Contém uma
  estadia inválida. …**
- **Older servers (0.7.0 and before)** send no codes: their reasons show as they come, in English,
  as today. Nothing extra is shown. **Older apps** with a 0.8.0 server see the same English as
  today: the server still sends its English sentence.
- **Codes the app doesn't know** (from a newer server) show the server's English sentence.
- Errors that only a broken app could cause ("Invalid JSON", "A trip is in the sync twice"…) share
  one code, shown in Portuguese as **O servidor não percebeu o pedido.**
- **Saved text stays as it was written** (part 5's rule): the last sync failure and a file's upload
  failure are saved already translated, in the language the phone had then. Refused changes are
  saved with their code and translated when shown.
- Offline, links, backups and stored data are untouched. The server's store doesn't change shape;
  the sync protocol only gains optional fields.

## Out of scope
- The Language setting, date and number formats, `<html lang>`, What's new notes, the guide, the
  app's `package.json` version and `CHANGELOG.md` (part 7 announces server 0.8.0).
- A hint asking to update an older server, or any other new message for uncoded answers.
- The server's plain-text page at `/`, its console logs, and the `snapshot.reason` in Settings.
- Rewording any English text, on the server or in the app.
- Reasons the app already makes itself (part 5): they stay as they are.
- Any Dexie version, link, backup or CSP change; any new dependency; `e2e/`.

## Constraints
- **English stays character-for-character the same**, both what the server sends as `error` /
  `reason` and what the app shows. Existing tests find it by text.
- **Sync protocol backward compatible both ways** (CLAUDE.md): only optional fields are added
  (`code`, `name`, `mb` on error answers; `code` on refused records). `error` and `reason` stay
  the English sentence, for older apps.
- **`src/domain` never imports `src/i18n`**, and `src/i18n` area files import only `react` types,
  `../plural` and (in `pt/`) the `Messages` type: the dictionaries type their arguments inline.
  Tests may import across.
- `erasableSyntaxOnly` is on: no constructor parameter properties.
- **Server store** (`server/src/store.ts`) is not touched; never regenerate server code.
- Follows `specs/translation-layer.md`: "Message conventions", "Glossary" and "Style" apply
  unchanged (PT-PT, informal "tu"). Read them before task 3.

## Context for implementers
- Read first: `src/domain/serverProtocol.ts` (wire format), `server/src/app.ts` (every error the
  server sends: `HttpError`, `readBody`, `codeFailed`, `checkNewName`, the `catch` at the end),
  `server/src/googleMaps.ts:13-27` (`LookupError`), `server/src/sync.ts:7,18-33` (`BadRequest`) and
  `:57-82` (refused records), `src/domain/records.ts:10-20` (`DataError`), `src/sync/client.ts:19-63`
  (`SyncError`, `request`), `src/sync/googleMaps.ts`, `src/ui/components/ServerStatus.tsx:50-53`,
  `src/i18n/en/reasons.tsx` and `src/i18n/pt/reasons.tsx` (the pattern to copy: `data`).
- Where the server's text reaches people today: `request()` in `src/sync/client.ts:59-61` turns an
  error answer's `error` into `SyncError.message`, which every screen shows as it is (`useAction` in
  `ServerPage.tsx`, `lastError` in `ServerStatus`, `uploadError` in `src/sync/files.ts:88`, the
  Google Maps forms). Refused records are kept as `ServerConfig.rejected` and shown by
  `ServerStatus` through `m.server.refused(n, reason)`.

**Wire format** (`src/domain/serverProtocol.ts`), added right after `RejectedRecord`:
```ts
/** Why the server turned a request away (server 0.8.0+). The app shows each in its own language. */
export const SERVER_ERROR_CODES = ['badRequest', 'requestTooLarge', 'tooManyTrips', 'tooManyRecords', 'tooManyWrongCodes', 'wrongServerCode', 'notConnected', 'nameNeeded', 'nameTaken', 'nameTakenInvite', 'personGone', 'codePersonGone', 'inviteInvalid', 'inviteExpired', 'noSuchTrip', 'noSuchFile', 'previewTooLarge', 'fileTooLarge', 'fileMismatch', 'fileNotYet', 'notGoogle', 'googleNoAnswer', 'googleUnreadable', 'listNotShared', 'notPlaceOrList', 'adminOnlyInvite', 'adminOnlySignIn', 'adminOnlyRemove', 'personNotOnServer', 'noSuchPhone', 'cantRemoveYourself', 'notFound', 'internalError'] as const
export type ServerErrorCode = (typeof SERVER_ERROR_CODES)[number]

/**
 * The body of every error answer (status 4xx or 5xx). `error` is English, for apps before the codes.
 * From server 0.8.0: `code`, and what its sentence needs (`name`: a person's name; `mb`: a size).
 * A newer server may send codes this app doesn't know: show `error` then.
 */
export interface ErrorAnswer {
  error: string
  code?: string
  name?: string
  mb?: number
}
```
`RejectedRecord` gains `/** Server 0.8.0+: why, as a DataError code or 'serverTooOld'. */ code?: string`
after `reason`.

**The codes** (server side, every `new HttpError(…)`, `LookupError` and `BadRequest`; the English is
today's, unchanged; Portuguese is fixed):

| code | where (English) | Portuguese |
|---|---|---|
| badRequest | app.ts: 'Invalid JSON', 'Which photo or document?', 'A preview must be a JPEG', 'An invite code or the server code is needed'; sync.ts: 'Expected a list of trips', 'Invalid trip in the sync', 'A trip is in the sync twice', 'Invalid records in the sync' | O servidor não percebeu o pedido. |
| requestTooLarge | 'Request too large' | O pedido é demasiado grande para o servidor. |
| tooManyTrips | 'Too many trips in one sync' | Demasiadas viagens numa só sincronização. |
| tooManyRecords | 'Too many records in one sync' | Demasiados dados numa só sincronização. |
| tooManyWrongCodes | 'Too many wrong codes. Try again in a few minutes.' | Demasiados códigos errados. Tenta outra vez daqui a uns minutos. |
| wrongServerCode | 'Wrong server code' (both places) | Código do servidor errado |
| notConnected | 'This phone is not (or no longer) connected to this server' | Este telemóvel não está (ou já não está) ligado a este servidor |
| nameNeeded | 'Your name is needed' | Falta o teu nome |
| nameTaken | checkNewName with 'choose your name from the list instead' | `Já há alguém chamado ${name} no servidor. Se és tu, escolhe antes o teu nome na lista.` |
| nameTakenInvite | checkNewName with 'ask the admin for a sign-in link instead' | `Já há alguém chamado ${name} no servidor. Se és tu, pede antes um link de acesso ao administrador.` |
| personGone | "That person isn't on the server any more" | Essa pessoa já não está no servidor |
| codePersonGone | "The person that code was for isn't on the server any more" | A pessoa a quem se destinava esse código já não está no servidor |
| inviteInvalid | 'That invite is not valid. Ask for a new one.' | Esse convite não é válido. Pede um novo. |
| inviteExpired | 'That invite has expired. Ask for a new one.' | Esse convite expirou. Pede um novo. |
| noSuchTrip | 'No such trip' | Essa viagem não existe |
| noSuchFile | 'No such photo or document' | Essa foto ou documento não existe |
| previewTooLarge | 'The preview is too large' | A pré-visualização é demasiado grande |
| fileTooLarge | `` `This server takes files up to ${mb(…)}` `` | `Este servidor aceita ficheiros até ${mb} MB` |
| fileMismatch | "The file isn't the one that was added" | O ficheiro não é o que foi adicionado |
| fileNotYet | "The server doesn't have that file yet" | O servidor ainda não tem esse ficheiro |
| notGoogle | googleMaps.ts `notGoogle` | Isso não é um link do Google Maps. |
| googleNoAnswer | googleMaps.ts `noAnswer` | O Google Maps não respondeu. |
| googleUnreadable | googleMaps.ts `unreadable`, and app.ts:286 | O Google Maps respondeu algo que este servidor não consegue ler. |
| listNotShared | googleMaps.ts:97 | Esta lista não está partilhada ou não existe. |
| notPlaceOrList | googleMaps.ts:105,130 | Esse link não é de um local nem de uma lista. |
| adminOnlyInvite | "Only the server's admin can invite new people" | Só o administrador do servidor pode convidar pessoas novas |
| adminOnlySignIn | "Only the server's admin can sign in someone else's phone" | Só o administrador do servidor pode dar acesso ao telemóvel de outra pessoa |
| adminOnlyRemove | "Only the server's admin can remove people" | Só o administrador do servidor pode remover pessoas |
| personNotOnServer | "That person isn't on the server" (both places) | Essa pessoa não está no servidor |
| noSuchPhone | 'No such phone' | Esse telemóvel não existe |
| cantRemoveYourself | "You can't remove yourself" | Não te podes remover do servidor |
| notFound | 'Not found' | Não encontrado |
| internalError | 'Internal error' (the 500 answer) | Erro interno do servidor |

**Server, errors** (`server/src/app.ts`, `server/src/googleMaps.ts`, `server/src/sync.ts`):
- `HttpError`: `constructor(status: number, code: ServerErrorCode, message: string, details: { name?: string; mb?: number } = {})`,
  keeping `code` and `details` as fields (assigned in the body).
- `LookupError`: `constructor(status: number, code: ServerErrorCode, message: string)`, field `code`.
  `app.ts:285` passes it on: `new HttpError(err.status, err.code, err.message)`.
- `BadRequest`: `code: ServerErrorCode` field, `constructor(message: string, code: ServerErrorCode = 'badRequest')`;
  `sync.ts:19` passes `'tooManyTrips'`, `:33` `'tooManyRecords'`.
- `readBody(req, max, tooLarge: () => HttpError = () => new HttpError(413, 'requestTooLarge', 'Request too large'))`
  rejects with `tooLarge()`. The preview passes `() => new HttpError(413, 'previewTooLarge', 'The preview is too large')`;
  the file's `tooLarge` becomes a function returning
  `new HttpError(413, 'fileTooLarge', \`This server takes files up to ${mb(config.maxFileBytes)}\`, { mb: Math.round(config.maxFileBytes / 1024 / 1024) })`,
  used for both the `throw` and `readBody`.
- `codeFailed(code: ServerErrorCode, message: string)`;
  `checkNewName(name, code: 'nameTaken' | 'nameTakenInvite', ifYou: string)`, with `{ name }` as details
  on the 409.
- The final `catch` writes an `ErrorAnswer`: for an `HttpError`
  `{ error: err.message, code: err.code, ...err.details }`; for a `BadRequest` `{ error: err.message, code: err.code }`;
  anything else (status 500) `{ error: 'Internal error', code: 'internalError' }`. Status and
  logging stay as they are.

**Server, refused records** (`server/src/sync.ts:57-82`, `src/domain/records.ts`):
- `DataErrorCode` gains `'privateFile' | 'fileChanged' | 'otherTrip'`; `sync.ts:58` passes
  `'privateFile'`, `:59` `'fileChanged'`, `:75` `'otherTrip'`.
- `:67` pushes `code: 'serverTooOld'`; `:79` pushes `code: err.code` for a `DataError`
  (left out when it has none) and `code: 'invalidRecord'` with the `'Invalid record.'` fallback.

**App, Portuguese** (`src/i18n/{en,pt}/reasons.tsx`):
- New key `server: (answer: { error: string; code?: string; name?: string; mb?: number }) => string`.
  English: `(answer) => answer.error`. Portuguese: by `code`, from the table above. When the code
  is missing or unknown, or the sentence needs `name` and `typeof answer.name !== 'string'`, or
  needs `mb` and `typeof answer.mb !== 'number'`, it returns `answer.error`.
- `pt.reasons.data` gains four cases (English stays the message): `privateFile` "Fica só no
  telemóvel onde foi adicionado.", `fileChanged` "O ficheiro de uma foto ou documento não pode ser
  alterado.", `otherTrip` "Pertence a outra viagem.", `serverTooOld` "Este servidor é demasiado
  antigo para isto: atualiza o servidor.".

**App, reading the codes** (`src/sync/client.ts`, `src/sync/googleMaps.ts`, `ServerStatus.tsx`):
- `SyncError` gains `answer?: ErrorAnswer` (doc: "The server's own answer, when it sent one.") and
  `constructor(message: string, status?: number, answer?: ErrorAnswer)`.
- `request()`: reads the body as `ErrorAnswer | undefined`; when `typeof body?.error === 'string'`
  it throws `new SyncError(m.reasons.server(body), res.status, body)`, otherwise
  `new SyncError(m.reasons.serverError(res.status), res.status)`. The 401 line above it stays.
- `src/sync/googleMaps.ts:24`: `err.message === 'Not found'` becomes
  `(err.answer?.code === 'notFound' || err.message === 'Not found')`; `:25`
  `err.message === GOOGLE_LIST_NOT_SHARED` becomes
  `(err.answer?.code === 'listNotShared' || err.message === GOOGLE_LIST_NOT_SHARED)`. The message
  check stays for servers 0.5.0 to 0.7.0, which send no code. Nothing else in the file changes.
- `ServerStatus.tsx:52`: the reason becomes
  `m.reasons.data({ message: server.rejected[0].reason, code: server.rejected[0].code, table: server.rejected[0].table })`.

- Do not touch: `server/src/store.ts`, `server/src/files.ts`, `server/src/config.ts`, `src/db/`,
  `scripts/`, `e2e/`, `package.json`, `CHANGELOG.md`, `GUIDE.md`, any other reason in
  `src/i18n/*/reasons.tsx`.

**The check for unchanged English.** Run in Git Bash from the repo root; it prints every quoted
text removed from the server's code that isn't added back. It must print nothing:

```sh
q() { git diff origin/main -U0 -- server/src/app.ts server/src/googleMaps.ts server/src/sync.ts | grep "^$1[^$1]" | grep -oE "'[^']{6,}'|\"[^\"]{6,}\"|\`[^\`]{6,}\`" | sort -u; }
comm -23 <(q -) <(q +)
```

## Tasks

1. **Error answers carry a code (server)**
   - Change: `SERVER_ERROR_CODES`, `ServerErrorCode` and `ErrorAnswer` in
     `src/domain/serverProtocol.ts`; **Server, errors** in Context, in `server/src/app.ts`,
     `server/src/googleMaps.ts` and `server/src/sync.ts` (`BadRequest` only). Add one test to
     `server/src/app.test.ts` under `describe('joining the server')` and one under
     `describe('photos and documents')`; existing tests are not edited. The first expects, with
     `toEqual` on `call(…)`: `/api/register` with `{ serverCode: 'WRONG-0000', name: 'Eve', deviceLabel: 'Pixel' }`
     → `{ status: 403, body: { error: 'Wrong server code', code: 'wrongServerCode' } }`; after
     `registerAdmin()`, `/api/register` with `{ serverCode: config.serverCode, name: 'max', deviceLabel: 'Pixel' }`
     → status 409, body `{ error: "There's already someone called max on the server. If that's you, choose your name from the list instead.", code: 'nameTaken', name: 'max' }`;
     `call('/api/nothing')` → `{ status: 404, body: { error: 'Not found', code: 'notFound' } }`;
     `call('/api/me', undefined, 'nope')` → status 401, `body.code` `'notConnected'`;
     `/api/sync` with `{ trips: 'x' }` and the admin's token → `{ status: 400, body: { error: 'Expected a list of trips', code: 'badRequest' } }`;
     `/api/google-maps` with `{ url: 'https://example.com' }` and the admin's token → body
     `{ error: "That's not a Google Maps link.", code: 'notGoogle' }`. The second, with that
     describe's `setUp` and `upload`, sets `config.maxFileBytes = 2` and expects the upload of
     `FILE` to answer 413 with JSON exactly
     `{ error: 'This server takes files up to 0 MB', code: 'fileTooLarge', mb: 0 }`.
   - Depends on: none
   - Done when: the unchanged-English check prints nothing; `npx vitest run server` passes;
     `grep -c "'Internal error'" server/src/app.ts` prints 1; `npm run typecheck` and
     `npm run lint` pass.
   - Executor: sonnet

2. **Refused records carry a code (server)**
   - Change: **Server, refused records** in Context, plus `RejectedRecord.code` in
     `src/domain/serverProtocol.ts`. In `server/src/sync.test.ts`, edit only these two
     expectations: `:176` adds `code: 'privateFile'` to the object, `:186` adds
     `code: 'fileChanged'`; and add one test after the one at `:140`: the same `send(…)` as that
     test plus `...({ newTable: [{ id: 'new00001' }] } as object)` gives
     `response.rejected.map((r) => r.code)` equal to
     `['invalidRecord', 'otherTrip', 'invalidRecord', 'serverTooOld']`, and the last one's
     `reason` is `'This server is too old for it: update the server.'`.
   - Depends on: task 1
   - Done when: the unchanged-English check prints nothing; `npx vitest run server src/domain`
     passes; `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

3. **Portuguese for the server's reasons**
   - Change: **App, Portuguese** in Context: `src/i18n/en/reasons.tsx`,
     `src/i18n/pt/reasons.tsx`. Create `src/i18n/serverReasons.test.ts` (imports `en`, `pt`, and
     `SERVER_ERROR_CODES` from `../domain/serverProtocol.ts`): for every code,
     `pt.reasons.server({ error: 'x', code, name: 'Max', mb: 25 })` is a non-empty string other than
     `'x'`, and `en.reasons.server({ error: 'x', code })` is `'x'`; `wrongServerCode` gives
     `'Código do servidor errado'`; `nameTaken` with name `'Max'` gives
     `'Já há alguém chamado Max no servidor. Se és tu, escolhe antes o teu nome na lista.'`, and
     without `name` gives `'x'`; `fileTooLarge` with `mb: 25` gives
     `'Este servidor aceita ficheiros até 25 MB'`, and with `mb: '25' as unknown as number` gives
     `'x'`; `code: 'nope'` and no code give `'x'`. `pt.reasons.data({ message: 'x', code })` for
     `privateFile`, `fileChanged`, `otherTrip`, `serverTooOld` gives the four sentences in Context.
   - Depends on: task 2
   - Done when: `npx vitest run src/i18n` passes; `npm run typecheck` and `npm run lint` pass.
   - Executor: sonnet

4. **The app reads the codes**
   - Change: **App, reading the codes** in Context: `src/sync/client.ts`, `src/sync/googleMaps.ts`,
     `src/ui/components/ServerStatus.tsx`. Add one test to `src/sync/sync.integration.test.ts`,
     right after `it("brings Ana's changes in, …")`, named "gives the server's reasons as codes
     the app can put in Portuguese"; add `import { pt } from '../i18n/pt/index.ts'` and `stay` to
     the fixtures import. It: (a) `joinWithServerCode(url, 'WRONG-CODE-0000', { name: 'Eve' }, 'Pixel')`
     rejects with a `SyncError` whose `message` is `'Wrong server code'`, whose `answer` equals
     `{ error: 'Wrong server code', code: 'wrongServerCode' }`, and
     `pt.reasons.server(answer)` is `'Código do servidor errado'`; (b)
     `joinWithServerCode(url, config.serverCode, { name: 'Max' }, 'Pixel')` rejects with
     `answer.code` `'nameTaken'`, and `pt.reasons.server(answer)` is
     `'Já há alguém chamado Max no servidor. Se és tu, escolhe antes o teu nome na lista.'`;
     (c) after `const invite = await createInvite()`, sets every `store.data.invites[…].expiresAt`
     to `new Date(0).toISOString()`; `joinWithInvite(url, invite.code, 'Eve', 'Pixel')` rejects with
     `answer.code` `'inviteExpired'`, and `pt.reasons.server(answer)` is
     `'Esse convite expirou. Pede um novo.'`; (d)
     `anaSync([{ id: onServer, cursor: anaCursor, records: { stays: [stay({ tripId: onServer, checkInDate: '2027-02-30' })] } }])`
     gives one rejected record with `table` `'stays'` and `code` `'invalidRecord'`, and
     `pt.reasons.data({ message: r.reason, code: r.code, table: r.table })` is
     `'Contém uma estadia inválida.'`. It leaves `anaCursor` as it was, and
     `(await getServerConfig())!.member.name` is still `'Max'` at the end.
   - Depends on: task 3
   - Done when: `grep -c "rejected\[0\].reason)" src/ui/components/ServerStatus.tsx` prints 0;
     `grep -c "answer?.code === 'listNotShared'" src/sync/googleMaps.ts` prints 1;
     `grep -c "m.reasons.server(" src/sync/client.ts` prints 1; `npm test`, `npm run typecheck`
     and `npm run lint` pass.
   - Executor: sonnet

5. **Server 0.8.0, rule, glossary and series upkeep**
   - Change: `VERSION` in `server/src/app.ts` becomes `'0.8.0'`. In `server/README.md`, under
     "## API", after the table, add one paragraph: "Errors answer with their status and
     `{ error, code }`: `error` is English, `code` (from 0.8.0) is one of `SERVER_ERROR_CODES` in
     `serverProtocol.ts`, which the app shows in its own language. Refused records in a sync have
     a `code` too." In `CLAUDE.md`, at the end of the `server/` bullet under "## Layout", add:
     " Every error it sends has a code (`SERVER_ERROR_CODES` in `src/domain/serverProtocol.ts`;
     refused records a `DataError` code), translated by the app (`m.reasons.server`,
     `m.reasons.data`); `error` stays English for older apps." In `specs/translation-layer.md`,
     append to the Glossary table a row for each term chosen in this part that is in no Glossary
     table, including "preview → pré-visualização", "admin → administrador", "invite →
     convite", "sign-in link → link de acesso" (list them in the report); in Notes, item 6 of
     "The series" becomes "6. what the sync server answers: reasons as codes, translated by the
     app, server 0.8.0 (`translate-server-answers`);". Change nothing else in those files
     (`specs/BACKLOG.md` already names part 7).
   - Depends on: task 4
   - Done when: `grep -c "VERSION = '0.8.0'" server/src/app.ts` prints 1;
     `grep -c "SERVER_ERROR_CODES" server/README.md CLAUDE.md` prints 1 for each;
     `grep -c "translate-server-answers" specs/translation-layer.md` prints 1;
     `grep -c "pré-visualização" specs/translation-layer.md` prints 1; `npm test` passes.
   - Executor: sonnet

## Acceptance criteria
- [ ] The unchanged-English check (Context) prints nothing.
- [ ] `npm test` passes: every existing test (English unchanged; only `server/src/sync.test.ts:176,186`
      edited) plus the new ones in `server/src/app.test.ts`, `server/src/sync.test.ts`,
      `src/i18n/serverReasons.test.ts` and `src/sync/sync.integration.test.ts`.
- [ ] `grep -cE "new HttpError\([0-9]+, ['\"\`]" server/src/app.ts` prints 0 (no `HttpError`
      whose second argument is a message; 24 today), and `npm run typecheck` passes (the code
      parameter is required).
- [ ] `grep -rn "i18n" src/domain server/src --include=*.ts | grep -v "\.test\.ts"` prints nothing.
- [ ] `git diff origin/main --stat` lists no file under `src/db/`, `scripts/` or `e2e/`, and not
      `server/src/store.ts`, `package.json`, `CHANGELOG.md` or `GUIDE.md`.
- [ ] `grep -rnE "\b(tela|arquivo|celular|compartilhar|salvar|usuário)\b" src/i18n/pt` prints nothing.
- [ ] Manual, with `npm run dev` and the server from `CLAUDE.md` ("Server locally"): on
      `http://localhost:5173/?lang=pt#/server`, **O servidor é meu**, address
      `http://localhost:8788`, server code `AAAA-BBBB-CCCC`, **Continuar**: shows
      "Código do servidor errado"; without `?lang=pt`, "Wrong server code".
- [ ] `npm run lint`, `npm run typecheck` and `npm run build` pass.

## Verification
- `npm run lint`, `npm run typecheck`, `npm test` (app, server, app↔server), `npm run build`: no errors.
- `npm run smoke` still passes (no e2e change; English unchanged).
- Manual: the check in the acceptance criteria.

## Escalate when
- An English text the server sends can't stay character-for-character the same, or an existing
  test other than `server/src/sync.test.ts:176,186` would need changing.
- The server throws an error not in the code table, or a code in the table has no matching throw.
- A term is in no Glossary and has more than one natural PT-PT translation (list them).
- `npm run typecheck` fails in the server or node project because a file it includes now reaches
  `src/i18n`.
- Any change to `server/src/store.ts`, a Dexie version, what is saved on the phone (beyond the
  optional `code` on `rejected`) or the shape of a sync request seems needed.
- Any change seems needed outside the files named in the tasks, or a new dependency.
- A check fails twice after fixing attempts.

## Open questions
- None.

## Notes
- Part 6 of the series in `specs/translation-layer.md` (Notes). Parts 1 to 5 are shipped.
- Decided with Ricardo: every server error gets a code; errors only a broken app could cause share
  `badRequest`, with one general Portuguese sentence. The typecheck guards it: `HttpError`,
  `LookupError` and `BadRequest` can't be made without a `ServerErrorCode`.
- Decided with Ricardo: older servers' answers show as they come, in English, with no hint; part
  7's What's new tells server owners to update to 0.8.0.
- Decided with Ricardo: server 0.8.0, no app bump or CHANGELOG entry (English unchanged, nobody has
  Portuguese yet).
- Decided with Ricardo: checked by the app↔server test (real server, Portuguese dictionary), not
  by a browser smoke test, which would need a server process in the smoke setup.
- The English stays on the server as `error` and `reason` (rather than moving to the app): older
  apps keep showing it, and `en.reasons.server` just returns it, as `en.reasons.data` does, so the
  two can't drift.
- Details travel as named optional fields (`name`, `mb`) rather than a generic `params` object:
  only two sentences need one, and named fields type-check.
- `mb` is the size already rounded the way the English sentence rounds it (`mb()` in `app.ts`), so
  both languages say the same number.
- The app checks the codes at display time for refused records (saved with their code), but
  translates error answers when they arrive (`request()`), since those are saved as text
  (`lastError`, `uploadError`), as part 5 decided.
- `GOOGLE_LIST_NOT_SHARED` and the `'Not found'` comparison stay for servers 0.5.0 to 0.7.0.
- Overlap: `field-level-merge` and `server-trip-cleanup` (drafts) change other functions in
  `server/src/sync.ts` and may bump the server version; whichever builds later takes the next
  version and gives any new server error a code (the CLAUDE.md rule from task 5). No Dexie version,
  shared table or helper is shared, so `Builds after` is "none".
