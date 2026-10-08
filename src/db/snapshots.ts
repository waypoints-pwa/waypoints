import { emptyTables, RECORD_TABLES, type RecordTable, type TableRecords, type Tables } from './types'
import { buildBackup } from '../domain/sync'
import { db, nowISO, recordTable } from './db'

const MAX_SNAPSHOTS = 5

/** Every record of every trip (or of one trip), tombstones included. */
export async function readTables(tripId?: string): Promise<Tables> {
  const tables = emptyTables()
  await Promise.all(
    RECORD_TABLES.map(async <T extends RecordTable>(table: T) => {
      const store = recordTable(table)
      const records: TableRecords[T][] =
        tripId === undefined
          ? await store.toArray()
          : table === 'trips'
            ? ((await db.trips.where('id').equals(tripId).toArray()) as TableRecords[T][])
            : await store.where('tripId').equals(tripId).toArray()
      ;(tables[table] as TableRecords[T][]) = records
    }),
  )
  return tables
}

/** Keep a local copy of everything before an operation that could lose data. */
export async function takeSnapshot(reason: string) {
  const tables = await readTables()
  if (!tables.trips.length) return
  await db.transaction('rw', db.snapshots, async () => {
    await db.snapshots.add({
      createdAt: nowISO(),
      reason,
      data: JSON.stringify(buildBackup(tables)),
      trips: tables.trips.filter((t) => !t.deletedAt).length,
    })
    const keys = await db.snapshots.orderBy('createdAt').primaryKeys()
    if (keys.length > MAX_SNAPSHOTS) await db.snapshots.bulkDelete(keys.slice(0, keys.length - MAX_SNAPSHOTS))
  })
}
