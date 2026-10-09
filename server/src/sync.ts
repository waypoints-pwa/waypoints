import { RECORD_TABLES, type RecordTable, type Tables, type Traveller } from '../../src/db/types.ts'
import { checkRecord, DataError, isId } from '../../src/domain/records.ts'
import { canonicalJSON, withNewerLink } from '../../src/domain/sync.ts'
import type { MemberSummary, RejectedRecord, SyncRequest, SyncResponse, TripChanges } from '../../src/domain/serverProtocol.ts'
import type { Member, StoreData, StoredRecord, StoredTrip } from './store.ts'

export class BadRequest extends Error {}

const MAX_TRIPS = 500
const MAX_RECORDS = 50_000

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const idOf = (r: unknown) => (isObject(r) && typeof r.id === 'string' ? r.id.slice(0, 64) : '?')
const key = (table: string, id: string) => `${table}/${id}`

/** The request's shape. Records are checked one by one while merging, so one bad record can't block a sync. */
export function parseSyncRequest(body: unknown): SyncRequest {
  if (!isObject(body) || !Array.isArray(body.trips)) throw new BadRequest('Expected a list of trips')
  if (body.trips.length > MAX_TRIPS) throw new BadRequest('Too many trips in one sync')
  const seen = new Set<string>()
  let count = 0
  for (const t of body.trips as unknown[]) {
    if (!isObject(t) || !isId(t.id) || !Number.isSafeInteger(t.cursor) || (t.cursor as number) < 0 || !isObject(t.records)) {
      throw new BadRequest('Invalid trip in the sync')
    }
    if (seen.has(t.id)) throw new BadRequest('A trip is in the sync twice')
    seen.add(t.id)
    for (const list of Object.values(t.records)) {
      if (!Array.isArray(list)) throw new BadRequest('Invalid records in the sync')
      count += list.length
    }
  }
  if (count > MAX_RECORDS) throw new BadRequest('Too many records in one sync')
  return body as unknown as SyncRequest
}

/** Who may see a trip: the members its live travellers are linked to, while they're on the server. */
export function tripMembers(trip: StoredTrip, members: Record<string, Member>): Set<string> {
  const out = new Set<string>()
  for (const { rec } of Object.values(trip.records.travellers ?? {})) {
    if (!rec.deletedAt && typeof rec.memberId === 'string' && members[rec.memberId]) out.add(rec.memberId)
  }
  return out
}

export const memberSummary = (m: Member): MemberSummary => ({ id: m.id, name: m.name, admin: m.admin })

export const memberList = (members: Record<string, Member>): MemberSummary[] =>
  Object.values(members)
    .map(memberSummary)
    .sort((a, b) => a.name.localeCompare(b.name))

/**
 * Photos and documents: a private one never belongs here, and an attachment's file can't change (the
 * file the server has was checked against the first `size` and `sha256`).
 */
function checkAttachment(rec: StoredRecord, stored: StoredRecord | undefined) {
  if (rec.private) throw new DataError('It is kept only on the phone it was added on.')
  if (stored && (rec.sha256 !== stored.sha256 || rec.size !== stored.size)) throw new DataError("A photo or document's file can't be changed.")
}

/** The trip's records that pass the same checks as links and files; the others are reported. */
function validRecords(t: TripChanges, trip: StoredTrip | undefined, now: number, rejected: RejectedRecord[]): [RecordTable, StoredRecord[]][] {
  const out: [RecordTable, StoredRecord[]][] = []
  for (const [table, list] of Object.entries(t.records) as [string, unknown[]][]) {
    if (!(RECORD_TABLES as readonly string[]).includes(table)) {
      for (const r of list) rejected.push({ tripId: t.id, table: table.slice(0, 40), id: idOf(r), reason: 'This server is too old for it: update the server.' })
      continue
    }
    const valid: StoredRecord[] = []
    for (const r of list) {
      try {
        checkRecord(table as RecordTable, r, now)
        const rec = r as unknown as StoredRecord
        if ((table === 'trips' ? rec.id : rec.tripId) !== t.id) throw new DataError('It belongs to another trip.')
        if (table === 'attachments') checkAttachment(rec, trip?.records.attachments?.[rec.id]?.rec)
        valid.push(rec)
      } catch (err) {
        rejected.push({ tripId: t.id, table, id: idOf(r), reason: err instanceof DataError ? err.message : 'Invalid record.' })
      }
    }
    out.push([table as RecordTable, valid])
  }
  return out
}

/** The copy the server keeps: the newer one, with a traveller's newer server link (see withNewerLink). */
function mergeRecord(table: RecordTable, sent: StoredRecord, stored: StoredRecord): StoredRecord {
  const [winner, other] = sent.updatedAt > stored.updatedAt ? [sent, stored] : [stored, sent]
  return table === 'travellers' ? (withNewerLink(winner as unknown as Traveller, other as unknown as Traveller) as unknown as StoredRecord) : winner
}

/**
 * Record-level last-writer-wins, the same rule as merging a link: a newer `updatedAt` replaces the
 * server's copy. Whatever the server ends up with that differs from what the phone sent goes back to
 * the phone, so both sides converge even with clock skew.
 */
function merge(trip: StoredTrip, incoming: [RecordTable, StoredRecord[]][]) {
  const accepted = new Set<string>()
  const losers = new Map<string, [RecordTable, StoredRecord]>()
  /** Attachments deleted now: their files go. */
  const deleted: string[] = []
  for (const [table, records] of incoming) {
    const stored = (trip.records[table] ??= {})
    for (const rec of records) {
      const current = stored[rec.id]
      const kept = current ? mergeRecord(table, rec, current.rec) : rec
      if (!current || canonicalJSON(kept) !== canonicalJSON(current.rec)) stored[rec.id] = { rec: kept, seq: ++trip.seq }
      if (table === 'attachments' && kept.deletedAt) deleted.push(rec.id)
      if (canonicalJSON(kept) === canonicalJSON(rec)) {
        accepted.add(key(table, rec.id))
        losers.delete(key(table, rec.id))
      } else {
        losers.set(key(table, rec.id), [table, kept])
      }
    }
  }
  return { accepted, losers, deleted }
}

/** What changed after `cursor`, leaving out the versions the phone just sent (it has them already). */
function changesSince(trip: StoredTrip, cursor: number, accepted = new Set<string>(), losers = new Map<string, [RecordTable, StoredRecord]>()): Partial<Tables> {
  const out: Partial<Record<RecordTable, StoredRecord[]>> = {}
  const add = (table: RecordTable, rec: StoredRecord) => (out[table] ??= []).push(rec)
  for (const table of RECORD_TABLES) {
    for (const { rec, seq } of Object.values(trip.records[table] ?? {})) {
      if (seq > cursor && !accepted.has(key(table, rec.id))) add(table, rec)
    }
  }
  for (const [k, [table, rec]] of losers) {
    if (!(out[table] ?? []).some((r) => key(table, r.id) === k)) add(table, rec)
  }
  return out as Partial<Tables>
}

export function newTrip(id: string, createdBy: string, now = new Date()): StoredTrip {
  return { id, createdAt: now.toISOString(), createdBy, seq: 0, records: {} }
}

/** A photo or document whose file the server no longer needs. */
export interface RemovedFile {
  tripId: string
  id: string
}

/**
 * One phone's sync. Only trips the member is on are read or written; a new trip is created if its
 * travellers include the member. Mutates `data`; `changed` says whether to save, and `removedFiles`
 * which files to delete (of attachments deleted in this sync).
 */
export function applySync(data: StoreData, member: Member, req: SyncRequest, now = new Date()): { response: SyncResponse; changed: boolean; removedFiles: RemovedFile[] } {
  const response: SyncResponse = { trips: [], gone: [], resend: [], rejected: [], members: memberList(data.members) }
  const removedFiles: RemovedFile[] = []
  let changed = false
  const isOn = (trip: StoredTrip) => tripMembers(trip, data.members).has(member.id)

  for (const sent of req.trips) {
    const existing = data.trips[sent.id]
    if (!existing && sent.cursor > 0) {
      // The phone synced this trip before, but the server doesn't have it (restored from an older backup).
      response.resend.push(sent.id)
      continue
    }
    if (existing && !isOn(existing)) {
      response.gone.push(sent.id)
      continue
    }

    const trip = existing ?? newTrip(sent.id, member.id, now)
    const before = trip.seq
    const { accepted, losers, deleted } = merge(trip, validRecords(sent, existing, now.getTime(), response.rejected))
    removedFiles.push(...deleted.map((id) => ({ tripId: trip.id, id })))
    if (!isOn(trip)) {
      // A new trip that doesn't include the sender is dropped; an existing one they just left is kept.
      if (existing && trip.seq !== before) changed = true
      response.gone.push(sent.id)
      continue
    }
    if (!existing) data.trips[trip.id] = trip
    if (!existing || trip.seq !== before) changed = true

    if (sent.cursor > before) {
      // The server is behind this phone: send it everything, and have it send everything back.
      response.resend.push(sent.id)
      response.trips.push({ id: trip.id, cursor: trip.seq, records: changesSince(trip, 0) })
    } else {
      response.trips.push({ id: trip.id, cursor: trip.seq, records: changesSince(trip, sent.cursor, accepted, losers) })
    }
  }

  // Trips this member is on that the phone doesn't have yet (or keeps only on the phone).
  const sentIds = new Set(req.trips.map((t) => t.id))
  for (const trip of Object.values(data.trips)) {
    if (!sentIds.has(trip.id) && isOn(trip)) response.trips.push({ id: trip.id, cursor: trip.seq, records: changesSince(trip, 0) })
  }
  return { response, changed, removedFiles }
}
