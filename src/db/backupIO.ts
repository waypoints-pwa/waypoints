import { buildBackup, parseBackup, planMerge, type Backup, type MergeCounts, type MergePlan } from '../domain/sync'
import { db, recordTable } from './db'
import { readTables, takeSnapshot } from './snapshots'
import { RECORD_TABLES, type RecordTable, type Tables, type Trip } from './types'

export { readTables, takeSnapshot }

/** All trips, or one trip to send as a file. */
export const exportBackup = async (tripId?: string): Promise<Backup> => buildBackup(await readTables(tripId))

type LocalCopies = Parameters<typeof planMerge>[0]

/** This phone's copies of the incoming records, looked up by id. */
async function localCopies(incoming: Tables): Promise<LocalCopies> {
  const local: Partial<Record<RecordTable, Map<string, unknown>>> = {}
  for (const table of RECORD_TABLES) {
    const found = await recordTable(table).bulkGet(incoming[table].map((r) => r.id))
    local[table] = new Map(found.filter((r) => r !== undefined).map((r) => [r.id, r]))
  }
  return local as LocalCopies
}

/** Trips among `incoming` that this phone keeps on the sync server. */
async function serverTripsIn(incoming: Tables): Promise<Set<string>> {
  const ids = [...new Set([...incoming.trips.map((t) => t.id), ...incoming.travellers.map((t) => t.tripId)])]
  return new Set((await db.serverTrips.bulkGet(ids)).filter((s) => s !== undefined).map((s) => s.tripId))
}

/**
 * What merging a link or file would change. On trips this phone keeps on the sync server, it never
 * changes who's linked to whom: that only changes through the server.
 */
export const previewMerge = async (incoming: Tables): Promise<MergePlan> => planMerge(await localCopies(incoming), incoming, await serverTripsIn(incoming))

/** What merging records from the sync server changes: everything newer, server links included. */
export const previewServerMerge = async (incoming: Tables): Promise<MergePlan> => planMerge(await localCopies(incoming), incoming)

/**
 * Merges records from a trip link or file into this phone: new and newer records win. If anything
 * already here gets overwritten or deleted, a safety snapshot is kept first.
 *
 * What a merge brings in goes into the outbox (not the unsent list: it came from the group), so a
 * change from someone who only uses links reaches the sync server through this phone.
 */
export async function applyMerge(incoming: Tables, reason: string): Promise<MergeCounts> {
  const preview = await previewMerge(incoming)
  if (preview.counts.updated || preview.counts.removed) await takeSnapshot(reason)
  return db.transaction('rw', [...RECORD_TABLES.map(recordTable), db.outbox, db.serverTrips], async () => {
    const plan = await previewMerge(incoming)
    for (const table of RECORD_TABLES) {
      const changes = plan.changes[table]
      if (!changes.length) continue
      await recordTable(table).bulkPut(changes as never[])
      await db.outbox.bulkPut(changes.map((r) => ({ table, id: r.id, tripId: 'tripId' in r ? r.tripId : r.id })))
    }
    return plan.counts
  })
}

/** Imports a backup or trip file. Merges, so importing the same file twice changes nothing. */
export async function importFile(text: string): Promise<{ counts: MergeCounts; trips: Trip[] }> {
  const backup = parseBackup(text)
  const counts = await applyMerge(backup, 'Before importing a file')
  return { counts, trips: backup.trips.filter((t) => !t.deletedAt) }
}
