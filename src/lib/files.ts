import type { NewFile } from '../db/attachments'
import { EXIF_BYTES, exifTakenAt } from '../domain/exif'
import { MAX_FILE_BYTES } from '../domain/records'
import { toDay } from '../domain/time'
import { sha256Hex } from './hash'

/*
 * Files picked on the phone, ready to add to a trip. Photos are redrawn smaller as JPEGs: plenty for
 * a phone screen, quick to send over mobile data abroad, and without the location the camera wrote
 * in them. Documents are kept exactly as they are (a QR code on a ticket must stay sharp).
 */

/** Longer side of a photo, in pixels: about 0.5–1 MB each. */
const PHOTO_MAX_PX = 2048
const PHOTO_QUALITY = 0.85
/** Previews for grids and lists: a few tens of KB. */
const THUMB_MAX_PX = 400
const THUMB_QUALITY = 0.7

/** Something wrong with a picked file, with a message for people. */
export class FileProblem extends Error {}

const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  pkpass: 'application/vnd.apple.pkpass',
  txt: 'text/plain',
}

/** Some phones leave a picked file's type empty: go by its name. */
const typeOf = (file: File) =>
  /^[\w.+-]{1,40}\/[\w.+-]{1,120}$/.test(file.type) ? file.type : (TYPES[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream')

async function decode(file: Blob): Promise<ImageBitmap | undefined> {
  try {
    return await createImageBitmap(file) // turned the right way up, as the camera said
  } catch {
    return undefined
  }
}

function draw(bitmap: ImageBitmap, maxPx: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new FileProblem("This phone couldn't make the photo smaller."))
  context.fillStyle = '#fff' // transparent images get white behind them, not black
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new FileProblem("This phone couldn't make the photo smaller."))), 'image/jpeg', quality),
  )
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** When a photo was taken: what the camera wrote, else when the file was last changed (on this phone's clock). */
async function takenAt(file: File): Promise<string | undefined> {
  const fromCamera = exifTakenAt(new Uint8Array(await file.slice(0, EXIF_BYTES).arrayBuffer()))
  if (fromCamera || !file.lastModified) return fromCamera
  const d = new Date(file.lastModified)
  return `${toDay(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const shortName = (name: string, fallback: string) => name.trim().slice(0, 200) || fallback

export async function preparePhoto(file: File): Promise<NewFile> {
  const bitmap = await decode(file)
  if (!bitmap) throw new FileProblem(`${file.name} can't be opened on this phone. Is it a photo?`)
  try {
    const blob = await draw(bitmap, PHOTO_MAX_PX, PHOTO_QUALITY)
    const thumb = await draw(bitmap, THUMB_MAX_PX, THUMB_QUALITY)
    const scale = Math.min(1, PHOTO_MAX_PX / Math.max(bitmap.width, bitmap.height))
    return {
      kind: 'photo',
      name: shortName(`${file.name.replace(/\.[^.]*$/, '')}.jpg`, 'Photo.jpg'),
      type: 'image/jpeg',
      blob,
      thumb,
      sha256: await sha256Hex(blob),
      width: Math.max(1, Math.round(bitmap.width * scale)),
      height: Math.max(1, Math.round(bitmap.height * scale)),
      takenAt: await takenAt(file),
    }
  } finally {
    bitmap.close()
  }
}

export async function prepareDocument(file: File): Promise<NewFile> {
  if (!file.size) throw new FileProblem(`${file.name} is empty.`)
  if (file.size > MAX_FILE_BYTES) throw new FileProblem(`${file.name} is too large: documents can be up to 100 MB.`)
  const type = typeOf(file)
  const blob = new Blob([file], { type })
  const doc: NewFile = { kind: 'document', name: shortName(file.name, 'Document'), type, blob, sha256: await sha256Hex(blob) }
  const bitmap = type.startsWith('image/') ? await decode(file) : undefined
  if (bitmap) {
    try {
      return { ...doc, thumb: await draw(bitmap, THUMB_MAX_PX, THUMB_QUALITY), width: bitmap.width, height: bitmap.height }
    } catch {
      return doc // still fine without a preview
    } finally {
      bitmap.close()
    }
  }
  return doc
}
