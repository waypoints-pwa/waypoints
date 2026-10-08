import { emptyTables, RECORD_TABLES, TRIP_TABLES, type RecordTable, type SyncMeta, type Tables, type Trip, type TripRecord } from '../db/types.ts'
import { checkRecord, DataError } from './records.ts'

/*
 * How trips move between phones without a server. Two formats carry the same records:
 *
 * - Backup files (`Backup`): all trips, or one trip saved as a file. JSON, readable.
 * - Trip links: one trip packed into the link's `#` fragment (see src/lib/tripLink.ts), sent
 *   through any chat app. Its records leave out `tripId`, which is the trip's own id.
 *
 * Both are merged the same way: record by record, the newer `updatedAt` wins, and deletions are
 * records too. Merging is safe to repeat and in any order, so everyone in a group ends up with the
 * same trip however the links went round.
 *
 * Every format version ever shipped must keep loading (sent links and old backups can't be
 * changed): add a version instead of changing one, and keep reading the old ones.
 */

export const BACKUP_VERSION = 1
export const LINK_VERSION = 1

/** Way beyond any real trip; stops a crafted link or file from making the page crawl. */
const MAX_RECORDS = 20_000

export interface Backup extends Tables {
  app: 'waypoints'
  schemaVersion: number
  exportedAt: string
}

export function buildBackup(tables: Tables, now = new Date()): Backup {
  return { app: 'waypoints', schemaVersion: BACKUP_VERSION, exportedAt: now.toISOString(), ...tables }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

function readTables(source: Record<string, unknown>, now: number): Tables {
  const tables = emptyTables()
  let count = 0
  for (const table of RECORD_TABLES) {
    const records = source[table] ?? []
    if (!Array.isArray(records)) throw new DataError('Some of its data is missing.')
    count += records.length
    if (count > MAX_RECORDS) throw new DataError('It is too large to open.')
    for (const record of records) checkRecord(table, record, now)
    ;(tables[table] as unknown[]) = records
  }
  return tables
}

export function parseBackup(text: string, now = Date.now()): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new DataError("This file isn't a waypoints file.")
  }
  if (!isObject(data) || data.app !== 'waypoints') throw new DataError("This file isn't a waypoints file.")
  if (typeof data.schemaVersion !== 'number' || data.schemaVersion > BACKUP_VERSION) {
    throw new DataError('This file was made by a newer version of waypoints. Update the app, then try again.')
  }
  const exportedAt = typeof data.exportedAt === 'string' ? data.exportedAt : new Date(now).toISOString()
  return { app: 'waypoints', schemaVersion: data.schemaVersion, exportedAt, ...readTables(data, now) }
}

/** What a trip link holds once decoded. */
export interface TripLink {
  tables: Tables
  /** Name the sender chose to show, if any. */
  sentBy?: string
  sentAt: string
}

const withoutTripId = (record: TripRecord) => Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'tripId'))

/** The trip as it travels in a link: version, sender, then the trip and its records without `tripId`. */
export function encodeLink(tables: Tables, sentBy: string | undefined, now = new Date()): Record<string, unknown> {
  const [trip] = tables.trips
  if (!trip || tables.trips.length !== 1) throw new Error('A trip link holds exactly one trip')
  const payload: Record<string, unknown> = { v: LINK_VERSION, sentAt: now.toISOString(), trip }
  if (sentBy?.trim()) payload.sentBy = sentBy.trim().slice(0, 60)
  for (const table of TRIP_TABLES) {
    payload[table] = (tables[table] as TripRecord[]).filter((r) => r.tripId === trip.id).map(withoutTripId)
  }
  return payload
}

export function decodeLink(raw: unknown, now = Date.now()): TripLink {
  if (!isObject(raw) || typeof raw.v !== 'number') throw new DataError("This link isn't a waypoints trip.")
  if (raw.v > LINK_VERSION) throw new DataError('This link was made by a newer version of waypoints. Update the app to open it.')
  if (raw.v !== 1 || !isObject(raw.trip) || typeof raw.sentAt !== 'string') throw new DataError("This link isn't a waypoints trip.")

  const trip = raw.trip
  const source: Record<string, unknown> = { trips: [trip] }
  for (const table of TRIP_TABLES) {
    const records = raw[table] ?? []
    if (!Array.isArray(records)) throw new DataError('Some of its data is missing.')
    source[table] = records.map((r) => (isObject(r) ? { ...r, tripId: trip.id } : r))
  }
  const sentBy = typeof raw.sentBy === 'string' ? raw.sentBy.slice(0, 60) || undefined : undefined
  return { tables: readTables(source, now), sentBy, sentAt: raw.sentAt }
}

export interface MergeCounts {
  added: number
  updated: number
  removed: number
}

export interface MergePlan {
  /** Records to write: new here, or newer than this phone's copy. */
  changes: Tables
  counts: MergeCounts
  /** Trips that aren't on this phone yet. */
  newTrips: Trip[]
}

/**
 * Which incoming records win against this phone's copies (`local`, looked up by id). A record that
 * belongs to a different trip here is left alone: ids never move between trips.
 */
export function planMerge(local: { [T in RecordTable]: Map<string, Tables[T][number]> }, incoming: Tables): MergePlan {
  const changes = emptyTables()
  const counts: MergeCounts = { added: 0, updated: 0, removed: 0 }
  const newTrips: Trip[] = []
  for (const table of RECORD_TABLES) {
    const mine = local[table] as Map<string, SyncMeta & { tripId?: string }>
    for (const record of incoming[table] as (SyncMeta & { tripId?: string })[]) {
      const current = mine.get(record.id)
      if (current && (record.updatedAt <= current.updatedAt || record.tripId !== current.tripId)) continue
      ;(changes[table] as SyncMeta[]).push(record)
      if (table === 'trips' && !current) newTrips.push(record as Trip)
      if (!current) {
        if (!record.deletedAt) counts.added++
      } else if (record.deletedAt) {
        if (!current.deletedAt) counts.removed++
      } else {
        counts.updated++
      }
    }
  }
  return { changes, counts, newTrips }
}

export const hasChanges = (plan: MergePlan) => RECORD_TABLES.some((t: RecordTable) => plan.changes[t].length > 0)
