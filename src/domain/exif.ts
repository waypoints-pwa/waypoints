import { isDay, isTime } from './time.ts'

/*
 * When a photo was taken, from the EXIF data in a JPEG: what the camera wrote, as its wall-clock
 * time (cameras and phones keep local time). Only the date and time are read, nothing else; the
 * photo the app keeps is redrawn without any of it (location included).
 */

const DATE_TIME = 0x0132
const EXIF_IFD = 0x8769
const DATE_TIME_ORIGINAL = 0x9003
const DATE_TIME_DIGITIZED = 0x9004

/** How many bytes from the start of a file to read: EXIF comes before the image. */
export const EXIF_BYTES = 256 * 1024

/** "YYYY-MM-DDTHH:MM", or undefined when the photo doesn't say. */
export function exifTakenAt(bytes: Uint8Array): string | undefined {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    if (view.getUint16(0) !== 0xffd8) return undefined // not a JPEG
    let offset = 2
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset)
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return undefined // image data: no EXIF before it
      const length = view.getUint16(offset + 2)
      // APP1 starting "Exif\0\0", then a TIFF header and its directories.
      if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) {
        return readTiff(view, offset + 10, Math.min(view.byteLength, offset + 2 + length))
      }
      offset += 2 + length
    }
  } catch {
    // Cut short or malformed: no date.
  }
  return undefined
}

function readTiff(view: DataView, tiff: number, end: number): string | undefined {
  const order = view.getUint16(tiff)
  if (order !== 0x4949 && order !== 0x4d4d) return undefined
  const little = order === 0x4949
  const u16 = (at: number) => view.getUint16(at, little)
  const u32 = (at: number) => view.getUint32(at, little)

  /** A directory's entries: tag → where its value is (or the value itself, for small ones). */
  const entries = (ifd: number) => {
    const out = new Map<number, { count: number; at: number; value: number }>()
    if (ifd + 2 > end) return out
    const n = u16(ifd)
    for (let i = 0; i < n && ifd + 2 + (i + 1) * 12 <= end; i++) {
      const entry = ifd + 2 + i * 12
      out.set(u16(entry), { count: u32(entry + 4), at: entry + 8, value: u32(entry + 8) })
    }
    return out
  }
  const text = (entry: { count: number; at: number; value: number } | undefined) => {
    if (!entry || entry.count < 16) return undefined
    const start = tiff + entry.value
    if (start + 16 > end) return undefined
    let s = ''
    for (let i = 0; i < 16; i++) s += String.fromCharCode(view.getUint8(start + i))
    return wallClock(s)
  }

  const ifd0 = entries(tiff + u32(tiff + 4))
  const exifIfd = ifd0.get(EXIF_IFD)
  const exif = exifIfd ? entries(tiff + exifIfd.value) : new Map()
  return text(exif.get(DATE_TIME_ORIGINAL)) ?? text(exif.get(DATE_TIME_DIGITIZED)) ?? text(ifd0.get(DATE_TIME))
}

/** "2027:03:11 21:04" → "2027-03-11T21:04"; blanks and zeros ("0000:00:00") → undefined. */
function wallClock(s: string): string | undefined {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2})$/.exec(s)
  if (!m) return undefined
  const day = `${m[1]}-${m[2]}-${m[3]}`
  return Number(m[1]) >= 1990 && isDay(day) && isTime(m[4]) ? `${day}T${m[4]}` : undefined
}
