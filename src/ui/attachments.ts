import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { AttachedTo } from '../db/attachments'
import { db } from '../db/db'
import { ATTACHABLE_TABLES, type AttachableTable, type Attachment, type StoredFile } from '../db/types'
import { toDay } from '../domain/time'
import { SEGMENT } from './items/save'
import { EXPENSE_CATEGORIES, labelOf, PLACE_CATEGORIES, STAY_KINDS, TRANSPORT_MODES } from './labels'
import { nameOf, tripPath, type TripData } from './tripData'

/** Photos and documents in the trip's pages: what they belong to, where their files are, in what order. */

export const isPhoto = (a: Attachment) => a.kind === 'photo'

/** This phone's files of a trip, by attachment id. Undefined while loading. */
export function useTripFiles(tripId: string): Map<string, StoredFile> | undefined {
  return useLiveQuery(async () => new Map((await db.files.where('tripId').equals(tripId).toArray()).map((f) => [f.id, f])), [tripId])
}

/**
 * A URL to show a blob with, revoked when it's no longer shown. Changes only with `key`: blobs read
 * again from the database are new objects with the same bytes, and the image shouldn't reload.
 */
export function useObjectUrl(blob: Blob | undefined, key: string): string | undefined {
  const [url, setUrl] = useState<string>()
  const latest = useRef(blob)
  useEffect(() => {
    latest.current = blob
  })
  const current = blob ? `${key}:${blob.size}` : ''
  useEffect(() => {
    const source = latest.current
    if (!current || !source) {
      setUrl(undefined)
      return
    }
    const made = URL.createObjectURL(source)
    setUrl(made)
    return () => URL.revokeObjectURL(made)
  }, [current])
  return url
}

/** An item a photo or document can belong to, as it shows in lists. */
export interface ItemRef {
  table: AttachableTable
  id: string
  emoji: string
  title: string
  day?: string
  path: string
}

export const ITEM_GROUPS: Record<AttachableTable, string> = {
  stays: 'Stays',
  transports: 'Journeys',
  activities: 'Activities',
  places: 'Places',
  expenses: 'Expenses',
}

/** Every item of the trip a photo or document can belong to, by `table:id`. */
export function attachableItems(t: TripData): Map<string, ItemRef> {
  const ref = (table: AttachableTable, id: string, emoji: string, title: string, day?: string): [string, ItemRef] => [
    `${table}:${id}`,
    { table, id, emoji, title, day, path: tripPath(t.trip.id, SEGMENT[table], id) },
  ]
  return new Map([
    ...t.stays.map((r) => ref('stays', r.id, labelOf(STAY_KINDS, r.kind).emoji, r.name, r.checkInDate)),
    ...t.transports.map((r) => ref('transports', r.id, labelOf(TRANSPORT_MODES, r.mode).emoji, `${r.from} → ${r.to}`, r.departDate)),
    ...t.activities.map((r) => ref('activities', r.id, '🎟️', r.title, r.date)),
    ...t.places.map((r) => ref('places', r.id, labelOf(PLACE_CATEGORIES, r.category).emoji, r.name)),
    ...t.expenses.map((r) => ref('expenses', r.id, labelOf(EXPENSE_CATEGORIES, r.category).emoji, r.title, r.date)),
  ])
}

/** `table:id` of what it belongs to, or '' for the whole trip. */
export const targetOf = (a: { itemTable?: string; itemId?: string }) => (a.itemTable && a.itemId ? `${a.itemTable}:${a.itemId}` : '')

export function parseTarget(target: string): AttachedTo {
  const [table, id] = target.split(':')
  return (ATTACHABLE_TABLES as readonly string[]).includes(table) && id ? { itemTable: table as AttachableTable, itemId: id } : {}
}

/** The item it belongs to, if it's still in the trip. Otherwise it shows with the whole trip. */
export const itemOf = (items: Map<string, ItemRef>, a: Attachment) => items.get(targetOf(a))

const pad2 = (n: number) => String(n).padStart(2, '0')

/** When a photo was taken ("YYYY-MM-DDTHH:MM"), else when it was added (on this phone's clock). */
export function photoTime(a: Attachment): string {
  if (a.takenAt) return a.takenAt
  const d = new Date(a.createdAt)
  return `${toDay(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export const byTimeTaken = (a: Attachment, b: Attachment) =>
  photoTime(a).localeCompare(photoTime(b)) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)

/** The trip's photos in the order the Photos tab shows them. */
export const tripPhotos = (t: TripData) => t.attachments.filter(isPhoto).sort(byTimeTaken)

/** Documents: those of the whole trip first, then by their item's day, then by name. */
export function sortDocuments(docs: Attachment[], items: Map<string, ItemRef>): Attachment[] {
  const day = (a: Attachment) => {
    const item = itemOf(items, a)
    return item ? `1${item.day ?? '9'}` : '0'
  }
  return docs.slice().sort((a, b) => day(a).localeCompare(day(b)) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id))
}

/**
 * Where a photo or document's file is:
 * - private: kept only on this phone, on purpose;
 * - local: on this phone, in a trip that isn't on the server;
 * - waiting: on this phone, not on the server yet;
 * - refused: the server didn't take it (too large, say);
 * - shared: here and on the server;
 * - remote: on the server, not on this phone (yet);
 * - missing: neither here nor (yet) on the server;
 * - oldServer: the trip's server is too old to keep files.
 */
export type FileState = 'private' | 'local' | 'waiting' | 'refused' | 'shared' | 'remote' | 'missing' | 'oldServer'

export function stateFinder(t: TripData) {
  const onServer = t.server?.files ? new Set(t.server.files.map((f) => f.id)) : undefined
  return (a: Attachment, file: StoredFile | undefined): FileState => {
    if (a.private) return 'private'
    const here = Boolean(file?.blob)
    if (!t.server) return here ? 'local' : 'missing'
    if (t.oldServer) return here ? 'oldServer' : 'missing'
    if (!onServer) return here ? 'waiting' : 'missing' // the trip hasn't synced yet
    if (file?.uploadError) return 'refused'
    if (onServer.has(a.id)) return here ? 'shared' : 'remote'
    return here ? 'waiting' : 'missing'
  }
}

/** A short line about where the file is, when there's something worth saying. */
export function stateText(state: FileState, a: Attachment, t: TripData): string | undefined {
  switch (state) {
    case 'private':
      return '🔒 Only on this phone'
    case 'waiting':
      return '⏳ Waiting to go up to the server'
    case 'refused':
      return "⚠️ The server didn't take it"
    case 'shared':
      return '🌐 Shared with the trip'
    case 'remote':
      return '🌐 On the server'
    case 'missing':
      return t.server ? `⏳ Not on the server yet: ${a.addedBy ? `${nameOf(t, a.addedBy)}'s` : 'the'} phone hasn't sent it` : '📱 Not on this phone'
    case 'oldServer':
      return '⚠️ The sync server is too old for photos and documents: it needs updating'
    case 'local':
      return undefined
  }
}

const BADGES: Partial<Record<FileState, string>> = { private: '🔒', waiting: '⏳', refused: '⚠️' }

/** A corner badge on a photo, for what needs noticing. */
export const stateBadge = (state: FileState) => BADGES[state]
