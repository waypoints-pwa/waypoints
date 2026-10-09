import { dropDeletedFiles } from '../db/attachments'
import { previewServerMerge } from '../db/backupIO'
import { db, getSetting, nowISO, recordTable, setSetting, SETTINGS } from '../db/db'
import { getServerConfig, setServerConfig, type ServerConfig } from '../db/serverState'
import { readTables } from '../db/snapshots'
import { emptyTables, RECORD_TABLES, type OutboxEntry, type RecordTable, type ServerTrip, type Tables, type TableRecords } from '../db/types'
import { checkRecord } from '../domain/records'
import type { FileInfo, SyncRequest, SyncResponse, TripChanges } from '../domain/serverProtocol'
import { runFileSync } from './files'

/*
 * Keeps the trips that are on the sync server in sync with it. Each sync sends every trip this phone
 * keeps there, with what changed here since (the outbox), and brings back what changed elsewhere. A
 * server that can't be reached is normal (off Tailscale, on a plane): changes wait in the outbox.
 * The files of photos and documents move afterwards, on their own (see ./files.ts).
 */

export class SyncError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.status = status
  }
}

export function normaliseServerUrl(input: string): string {
  let url = input.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new SyncError("That isn't a server address.")
  }
  const local = ['localhost', '127.0.0.1'].includes(parsed.hostname)
  if (parsed.protocol !== 'https:' && !local) throw new SyncError('The server address must start with https://')
  return parsed.origin + parsed.pathname.replace(/\/+$/, '')
}

const TIMEOUT_MS = 30_000

const UNREACHABLE = "Couldn't reach the server. Check the address, and that Tailscale is on."

/** Calls the server and checks the answer. `token` is this phone's; leave it out for the public endpoints. */
async function request(cfg: { url: string; token?: string }, path: string, init: { body?: BodyInit; type?: string; timeout?: number } = {}): Promise<Response> {
  let res: Response
  try {
    res = await fetch(`${cfg.url}${path}`, {
      method: init.body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': init.type ?? 'application/json', ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}) },
      body: init.body,
      signal: AbortSignal.timeout(init.timeout ?? TIMEOUT_MS),
    })
  } catch {
    throw new SyncError(UNREACHABLE)
  }
  if (res.status === 401 && cfg.token) throw new SyncError('This phone is no longer connected to the server.', 401)
  if (!res.ok) {
    const message = ((await res.json().catch(() => undefined)) as { error?: string } | undefined)?.error
    throw new SyncError(message ?? `Server error (${res.status}).`, res.status)
  }
  return res
}

/** Calls the server with JSON. `token` is this phone's; leave it out for the public endpoints. */
export async function api<T>(cfg: { url: string; token?: string }, path: string, body?: unknown): Promise<T> {
  const res = await request(cfg, path, { body: body === undefined ? undefined : JSON.stringify(body) })
  return (await res.json()) as T
}

/** Big files over a slow connection abroad take a while. */
const FILE_TIMEOUT_MS = 10 * 60_000

/** Sends a file's bytes (see /api/files in serverProtocol.ts). */
export async function uploadFile(cfg: { url: string; token: string }, path: string, blob: Blob) {
  await request(cfg, path, { body: blob, type: blob.type || 'application/octet-stream', timeout: FILE_TIMEOUT_MS })
}

export async function downloadFile(cfg: { url: string; token: string }, path: string): Promise<Blob> {
  const res = await request(cfg, path, { timeout: FILE_TIMEOUT_MS })
  try {
    return await res.blob()
  } catch {
    throw new SyncError(UNREACHABLE)
  }
}

const nonEmpty = (tables: Partial<Tables>): Partial<Tables> => Object.fromEntries(Object.entries(tables).filter(([, records]) => records.length > 0))

/** The trip's records waiting in the outbox: changed here, or merged in from a link. */
async function outboxRecords(tripId: string, outbox: OutboxEntry[]): Promise<Partial<Tables>> {
  const tables: Partial<Tables> = {}
  for (const table of RECORD_TABLES) {
    const ids = outbox.filter((o) => o.tripId === tripId && o.table === table).map((o) => o.id)
    if (!ids.length) continue
    const records = (await recordTable(table).bulkGet(ids)).filter((r) => r !== undefined)
    ;(tables[table] as TableRecords[typeof table][]) = records
  }
  return nonEmpty(tables)
}

/** Private photos and documents stay on this phone, whatever else happens. */
function withoutPrivate(tables: Partial<Tables>): Partial<Tables> {
  if (!tables.attachments) return tables
  return nonEmpty({ ...tables, attachments: tables.attachments.filter((a) => !a.private) })
}

async function recordsToSend(state: ServerTrip, outbox: OutboxEntry[]): Promise<Partial<Tables>> {
  return withoutPrivate(state.uploaded ? await outboxRecords(state.tripId, outbox) : nonEmpty(await readTables(state.tripId)))
}

/** Sent records leave the outbox, unless they were edited again meanwhile or the server refused them. */
async function clearSent(sent: TripChanges, refused: Set<string>) {
  for (const [table, records] of Object.entries(sent.records) as [RecordTable, { id: string; updatedAt: string }[]][]) {
    const current = await recordTable(table).bulkGet(records.map((r) => r.id))
    const done = records.filter((r, i) => !refused.has(`${table}/${r.id}`) && (!current[i] || current[i]!.updatedAt === r.updatedAt))
    await db.outbox.bulkDelete(done.map((r) => [table, r.id] as [string, string]))
  }
}

/** Merges a trip from the server: the newest copy of each record wins, as with links. Invalid records are skipped. */
async function applyPulled(trip: TripChanges) {
  const tables = emptyTables()
  const now = Date.now()
  for (const table of RECORD_TABLES) {
    for (const record of trip.records[table] ?? []) {
      try {
        checkRecord(table, record, now)
      } catch {
        continue
      }
      const belongs = table === 'trips' ? record.id === trip.id : (record as { tripId: string }).tripId === trip.id
      if (belongs) (tables[table] as unknown[]).push(record)
    }
  }
  const plan = await previewServerMerge(tables)
  for (const table of RECORD_TABLES) {
    if (plan.changes[table].length) await recordTable(table).bulkPut(plan.changes[table] as never[])
  }
  await dropDeletedFiles(plan.changes.attachments)
}

const sameFiles = (a: FileInfo[] | undefined, b: FileInfo[] | undefined) => JSON.stringify(a) === JSON.stringify(b)

/** On a trip new to this phone, the traveller linked to this phone's member is "you". */
async function setMeFromServer(tripId: string, memberId: string) {
  if (await getSetting(SETTINGS.me(tripId))) return
  const mine = (await db.travellers.where('tripId').equals(tripId).toArray()).find((t) => !t.deletedAt && t.memberId === memberId)
  if (mine) await setSetting(SETTINGS.me(tripId), mine.id)
}

let running: Promise<boolean> | undefined

/**
 * Sends local changes and brings in the group's; resolves true when a sync completed. No-op (false)
 * when not connected or offline. Concurrent calls share one run. Failures are also kept in the
 * server config, which Settings shows.
 */
export function runSync(): Promise<boolean> {
  running ??= doSync().finally(() => {
    running = undefined
  })
  return running
}

async function doSync(again = false): Promise<boolean> {
  const cfg = await getServerConfig()
  if (!cfg || cfg.lastErrorStatus === 401) return false
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false

  const states = await db.serverTrips.toArray()
  const outbox = await db.outbox.toArray()
  const request: SyncRequest = { trips: [] }
  for (const state of states) request.trips.push({ id: state.tripId, cursor: state.cursor, records: await recordsToSend(state, outbox) })
  const sentInFull = new Set(states.filter((s) => !s.uploaded).map((s) => s.tripId))

  let response: SyncResponse
  try {
    response = await api<SyncResponse>(cfg, '/api/sync', request)
  } catch (err) {
    const latest = await getServerConfig()
    // A failure at a server this phone has since left isn't news.
    if (latest?.token === cfg.token && latest.url === cfg.url) {
      await setServerConfig({ ...latest, lastError: (err as Error).message, lastErrorStatus: (err as SyncError).status })
    }
    throw err
  }

  const needsAnother = await db.transaction('rw', [...RECORD_TABLES.map(recordTable), db.files, db.outbox, db.serverTrips, db.settings], async () => {
    const latest = await getServerConfig()
    if (latest?.token !== cfg.token || latest.url !== cfg.url) return false // disconnected or moved meanwhile
    let more = false

    // Clear what was sent before merging what came back, so the server's winners aren't sent again.
    const refused = new Set(response.rejected.map((r) => `${r.table}/${r.id}`))
    for (const sent of request.trips) await clearSent(sent, refused)

    for (const trip of response.trips) {
      const state = await db.serverTrips.get(trip.id)
      const wasHere = Boolean(await db.trips.get(trip.id))
      await applyPulled(trip)
      const resend = response.resend.includes(trip.id)
      const files = trip.files?.slice().sort((a, b) => a.id.localeCompare(b.id))
      if (state) {
        const uploaded = !resend && (state.uploaded || sentInFull.has(trip.id))
        // Written only when something changed: the trip's pages reload on every write.
        if (state.cursor !== trip.cursor || state.uploaded !== uploaded || !sameFiles(state.files, files)) {
          await db.serverTrips.put({ ...state, cursor: trip.cursor, uploaded, files })
        }
      } else {
        // Someone put this trip on the server with this phone's member on it. A copy that was already
        // here (from a link) may have things the server lacks, so it's sent in full next.
        await db.serverTrips.put({ tripId: trip.id, cursor: trip.cursor, uploaded: !wasHere, files })
        if (wasHere) more = true
      }
      if (resend) more = true
      await setMeFromServer(trip.id, cfg.member.id)
      await db.settings.delete(SETTINGS.serverGone(trip.id))
    }

    for (const tripId of response.resend) {
      const state = await db.serverTrips.get(tripId)
      if (state && !response.trips.some((t) => t.id === tripId)) {
        await db.serverTrips.put({ ...state, cursor: 0, uploaded: false })
        more = true
      }
    }

    // Trips this member isn't on any more stay on the phone, as phone-only trips.
    for (const tripId of response.gone) {
      await db.serverTrips.delete(tripId)
      if (await db.trips.get(tripId)) await setSetting(SETTINGS.serverGone(tripId), nowISO())
    }

    const next: ServerConfig = {
      ...latest,
      members: response.members,
      fileLimit: response.fileLimit,
      lastSyncAt: nowISO(),
      lastError: undefined,
      lastErrorStatus: undefined,
      rejected: response.rejected.length ? response.rejected : undefined,
    }
    await setServerConfig(next)
    return more
  })

  if (needsAnother && !again) await doSync(true)
  // Files move on their own, so a long upload doesn't hold up everyone's changes. Their failures
  // show on the files themselves.
  if (!again && response.fileLimit) void runFileSync().catch(() => undefined)
  return true
}
