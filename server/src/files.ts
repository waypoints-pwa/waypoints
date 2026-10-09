import { randomBytes } from 'node:crypto'
import { mkdir, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FileInfo } from '../../src/domain/serverProtocol.ts'

const NAME = /^([\w-]{8,64})(\.thumb)?$/

/**
 * The files of photos and documents, in a folder per trip: `<dir>/<tripId>/<attachmentId>`, and its
 * preview `<attachmentId>.thumb`. Ids are checked before they get here (isId), so they're safe as
 * file names. Each file is written whole (a temporary file, then renamed) and never changes after:
 * a changed photo is a new attachment. A file goes only when its attachment is deleted.
 */
export class FileStore {
  readonly dir: string

  constructor(dir: string) {
    this.dir = dir
  }

  path(tripId: string, id: string, thumb = false) {
    return join(this.dir, tripId, thumb ? `${id}.thumb` : id)
  }

  /** The trip's attachments whose file is here, with whether their preview is too. */
  async list(tripId: string): Promise<FileInfo[]> {
    let names: string[]
    try {
      names = await readdir(join(this.dir, tripId))
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw err
    }
    const full = new Set<string>()
    const thumbs = new Set<string>()
    for (const name of names) {
      const m = NAME.exec(name) // leaves out temporary files
      if (m) (m[2] ? thumbs : full).add(m[1])
    }
    return [...full].sort().map((id) => (thumbs.has(id) ? { id, thumb: true } : { id }))
  }

  /** Its size in bytes, or undefined when it isn't here. */
  async size(tripId: string, id: string, thumb = false): Promise<number | undefined> {
    try {
      return (await stat(this.path(tripId, id, thumb))).size
    } catch {
      return undefined
    }
  }

  async write(tripId: string, id: string, thumb: boolean, bytes: Uint8Array) {
    const path = this.path(tripId, id, thumb)
    await mkdir(join(this.dir, tripId), { recursive: true })
    const temp = `${path}.${randomBytes(6).toString('hex')}.tmp`
    try {
      await writeFile(temp, bytes)
      await rename(temp, path)
    } catch (err) {
      await rm(temp, { force: true })
      throw err
    }
  }

  /** The file and its preview. Nothing happens if they aren't here. */
  async remove(tripId: string, id: string) {
    await rm(this.path(tripId, id), { force: true })
    await rm(this.path(tripId, id, true), { force: true })
  }
}
