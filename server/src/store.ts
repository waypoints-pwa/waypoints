import { copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { RecordTable, SyncMeta } from '../../src/db/types.ts'

export interface Device {
  id: string
  label: string
  /** sha256 of the device token: the token itself is never stored. */
  tokenHash: string
  createdAt: string
  lastSeenAt?: string
}

/** A person on the server. Members who joined with the server code are admins. */
export interface Member {
  id: string
  name: string
  admin: boolean
  createdAt: string
  devices: Record<string, Device>
}

export interface Invite {
  codeHash: string
  createdAt: string
  expiresAt: string
  /** Member who made it. */
  createdBy: string
  /** A sign-in code for another phone of this member. Without it, the invite makes a new member. */
  memberId?: string
}

/** A record as a phone sent it: fields this server version doesn't know are kept as they are. */
export type StoredRecord = SyncMeta & Record<string, unknown>

export interface Stored {
  rec: StoredRecord
  /** The trip's change number when this version was stored. */
  seq: number
}

/** One trip: its records by table and id. Who may see it follows from its travellers. */
export interface StoredTrip {
  id: string
  createdAt: string
  createdBy: string
  /** Change counter: phones pull what changed after the number they last saw. */
  seq: number
  records: Partial<Record<RecordTable, Record<string, Stored>>>
}

export interface StoreData {
  version: 1
  members: Record<string, Member>
  /** Keyed by code hash. */
  invites: Record<string, Invite>
  trips: Record<string, StoredTrip>
}

export const STORE_VERSION = 1

export const emptyData = (): StoreData => ({ version: STORE_VERSION, members: {}, invites: {}, trips: {} })

/**
 * Reads a store file. Later formats get upgraded here (keeping a copy of the file from before);
 * a file from a newer server is refused rather than misread and overwritten.
 */
export function migrate(raw: unknown): StoreData {
  const r = raw as Partial<StoreData> | null
  if (!r || typeof r !== 'object' || typeof r.version !== 'number') throw new Error('store.json is not a waypoints server store')
  if (r.version > STORE_VERSION) throw new Error(`store.json is from a newer waypoints server (format ${r.version}): update the server image`)
  return { ...emptyData(), ...r, version: STORE_VERSION }
}

const FILE = 'store.json'
const KEEP_BACKUPS = 30

/**
 * Everything fits comfortably in memory (a few members, trips of a few hundred records each), so the
 * store is one JSON file, rewritten atomically on change. A copy is kept once a day in `backupDir`,
 * which can be on another disk.
 */
export class Store {
  data: StoreData = emptyData()
  private writing: Promise<void> = Promise.resolve()
  private lastBackupDay?: string
  private readonly dir: string
  private readonly backupDir: string

  constructor(dir: string, backupDir = join(dir, 'backups')) {
    this.dir = dir
    this.backupDir = backupDir
  }

  async load() {
    await mkdir(this.dir, { recursive: true })
    let text: string | undefined
    try {
      text = await readFile(join(this.dir, FILE), 'utf8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
    if (text === undefined) return
    // Refuse to start on a corrupt file rather than overwrite it with an empty store.
    this.data = migrate(JSON.parse(text))
    await this.backup()
  }

  /** Serialised, atomic write (temp file + rename), then the day's copy if there isn't one yet. */
  save(): Promise<void> {
    const snapshot = JSON.stringify(this.data)
    this.writing = this.writing.then(async () => {
      const path = join(this.dir, FILE)
      await writeFile(`${path}.tmp`, snapshot)
      await rename(`${path}.tmp`, path)
      await this.backup()
    })
    return this.writing
  }

  private async backup() {
    const today = new Date().toISOString().slice(0, 10)
    if (this.lastBackupDay === today) return
    await mkdir(this.backupDir, { recursive: true })
    await copyFile(join(this.dir, FILE), join(this.backupDir, `store-${today}.json`))
    this.lastBackupDay = today
    const files = (await readdir(this.backupDir)).filter((f) => /^store-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
    for (const f of files.slice(0, Math.max(0, files.length - KEEP_BACKUPS))) await rm(join(this.backupDir, f))
  }
}
