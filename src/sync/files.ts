import { db, isLive } from '../db/db'
import { getServerConfig, type ServerConfig } from '../db/serverState'
import type { Attachment, StoredFile } from '../db/types'
import type { FileInfo } from '../domain/serverProtocol'
import { sha256Hex } from '../lib/hash'
import { downloadFile, SyncError, uploadFile } from './client'

/*
 * Moves the files of photos and documents between this phone and the sync server, after each sync:
 * records go first, since the server takes a file only for an attachment it has. The server says
 * which files it has (ServerTrip.files), so whatever is missing on either side is sent or fetched,
 * one file at a time, and a failed transfer is simply done again later.
 *
 * Sent: the file and preview of every shared attachment this phone has.
 * Fetched: documents in full, so they open offline; photos as previews, in full once opened.
 */

type Connected = ServerConfig & { fileLimit: number }

/** Connected to a server that keeps files. */
async function connected(): Promise<Connected | undefined> {
  const cfg = await getServerConfig()
  return cfg && cfg.lastErrorStatus !== 401 && cfg.fileLimit ? (cfg as Connected) : undefined
}

const pathOf = (a: Attachment, thumb = false) => `/api/files?${new URLSearchParams({ trip: a.tripId, id: a.id, ...(thumb ? { thumb: '1' } : {}) })}`

/** Refused for good (too big, not what its record says): it isn't sent again by itself. */
const refused = (err: unknown) => err instanceof SyncError && [400, 413, 422].includes(err.status ?? 0)
/** The server doesn't have the attachment or the file (yet): tried again after the next sync. */
const notThere = (err: unknown) => err instanceof SyncError && (err.status === 404 || err.status === 409)

class Mismatch extends Error {}

let running: Promise<void> | undefined
let again = false

/** Sends and fetches what's missing. Concurrent calls share one run, which goes round again if asked meanwhile. */
export function runFileSync(): Promise<void> {
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    try {
      do {
        again = false
        await transfer()
      } while (again)
    } finally {
      running = undefined
    }
  })()
  return running
}

async function transfer() {
  const cfg = await connected()
  if (!cfg || (typeof navigator !== 'undefined' && navigator.onLine === false)) return
  for (const state of await db.serverTrips.toArray()) {
    if (!state.files) continue
    const onServer = new Map(state.files.map((f) => [f.id, f]))
    // Attachments the server hasn't had yet: their files can't go before them.
    const waiting = new Set((await db.outbox.where('tripId').equals(state.tripId).toArray()).filter((o) => o.table === 'attachments').map((o) => o.id))
    const attachments = (await db.attachments.where('tripId').equals(state.tripId).toArray()).filter((a) => isLive(a) && !a.private)
    for (const a of attachments) {
      const local = await db.files.get(a.id)
      const there = onServer.get(a.id)
      if (local && !local.uploadError && !waiting.has(a.id)) await send(cfg, a, local, there)
      if (there) await fetchMissing(cfg, a, local, there)
    }
  }
}

async function send(cfg: Connected, a: Attachment, local: StoredFile, there: FileInfo | undefined) {
  try {
    if (!there && local.blob) {
      await uploadFile(cfg, pathOf(a), local.blob)
      there = { id: a.id }
      await noteOnServer(a.tripId, there)
    }
    if (there && !there.thumb && local.thumb) {
      await uploadFile(cfg, pathOf(a, true), local.thumb)
      await noteOnServer(a.tripId, { id: a.id, thumb: true })
    }
  } catch (err) {
    if (refused(err)) await db.files.update(a.id, { uploadError: (err as Error).message })
    else if (!notThere(err)) throw err // can't reach the server: the rest waits for the next sync
  }
}

async function fetchMissing(cfg: Connected, a: Attachment, local: StoredFile | undefined, there: FileInfo) {
  try {
    if (there.thumb && !local?.thumb) await keep(a, { thumb: new Blob([await downloadFile(cfg, pathOf(a, true))], { type: 'image/jpeg' }) })
    if (a.kind !== 'photo' && !local?.blob) await keep(a, { blob: await checked(a, await downloadFile(cfg, pathOf(a))) })
  } catch (err) {
    if (!notThere(err) && !(err instanceof Mismatch)) throw err
  }
}

/** The file as its attachment says it is, or nothing. */
async function checked(a: Attachment, blob: Blob): Promise<Blob> {
  if (blob.size !== a.size || (await sha256Hex(blob)) !== a.sha256) throw new Mismatch("The file from the server isn't the one that was added.")
  return blob.type === a.type ? blob : new Blob([blob], { type: a.type })
}

/** Keeps a fetched file, unless its attachment was deleted meanwhile. */
async function keep(a: Attachment, file: Pick<StoredFile, 'blob'> | Pick<StoredFile, 'thumb'>) {
  await db.transaction('rw', db.attachments, db.files, async () => {
    const current = await db.attachments.get(a.id)
    if (!current || current.deletedAt) return
    const existing = await db.files.get(a.id)
    await db.files.put({ ...existing, ...file, id: a.id, tripId: a.tripId })
  })
}

/** The server has it now: noted until the next sync brings its own list. */
async function noteOnServer(tripId: string, info: FileInfo) {
  await db.transaction('rw', db.serverTrips, async () => {
    const state = await db.serverTrips.get(tripId)
    if (!state?.files) return
    const known = state.files.find((f) => f.id === info.id)
    const files = [...state.files.filter((f) => f.id !== info.id), { ...known, ...info }].sort((x, y) => x.id.localeCompare(y.id))
    await db.serverTrips.put({ ...state, files })
  })
}

/** The full file of someone else's photo (or a document not here yet), fetched when it's opened, and kept. */
export async function fetchFull(id: string): Promise<Blob> {
  const a = await db.attachments.get(id)
  if (!a || a.deletedAt) throw new SyncError('It has been deleted.')
  const cfg = await connected()
  if (!cfg) throw new SyncError("This phone isn't connected to the sync server.")
  try {
    const blob = await checked(a, await downloadFile(cfg, pathOf(a)))
    await keep(a, { blob })
    return blob
  } catch (err) {
    if (err instanceof SyncError && err.status === 404) throw new SyncError("It isn't on the server yet: the phone it was added on hasn't sent it.", 404)
    throw err
  }
}

/** After the server refused a file: send it again. */
export async function retryUpload(id: string) {
  await db.files.update(id, { uploadError: undefined })
  await runFileSync()
}
