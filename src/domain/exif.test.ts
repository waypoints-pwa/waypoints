import { describe, expect, it } from 'vitest'
import { exifTakenAt } from './exif'

/** The start of a JPEG with EXIF dates: DateTime in the first directory, DateTimeOriginal in the EXIF one. */
function jpeg(dates: { original?: string; plain?: string }, { little = false, jfif = false } = {}): Uint8Array {
  const tiff = new DataView(new ArrayBuffer(192))
  const u16 = (at: number, v: number) => tiff.setUint16(at, v, little)
  const u32 = (at: number, v: number) => tiff.setUint32(at, v, little)
  const ascii = (at: number, s: string) => [...s].forEach((c, i) => tiff.setUint8(at + i, c.charCodeAt(0)))
  const entry = (at: number, tag: number, type: number, count: number, value: number) => {
    u16(at, tag)
    u16(at + 2, type)
    u32(at + 4, count)
    u32(at + 8, value)
  }
  const [ifd0, exif, strings] = [8, 64, 128]
  tiff.setUint16(0, little ? 0x4949 : 0x4d4d)
  u16(2, 42)
  u32(4, ifd0)
  let n = 0
  if (dates.plain) {
    entry(ifd0 + 2 + 12 * n++, 0x0132, 2, 20, strings)
    ascii(strings, dates.plain)
  }
  entry(ifd0 + 2 + 12 * n++, 0x8769, 4, 1, exif)
  u16(ifd0, n)
  if (dates.original) {
    entry(exif + 2, 0x9003, 2, 20, strings + 32)
    ascii(strings + 32, dates.original)
  }
  u16(exif, dates.original ? 1 : 0)

  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...new Uint8Array(tiff.buffer)]
  const app0 = jfif ? [0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0] : []
  const length = app1.length + 2
  return new Uint8Array([0xff, 0xd8, ...app0, 0xff, 0xe1, length >> 8, length & 0xff, ...app1, 0xff, 0xda, 0, 2])
}

describe('when a photo was taken', () => {
  it('is what the camera wrote, as its wall-clock time', () => {
    expect(exifTakenAt(jpeg({ original: '2027:03:11 21:04:33', plain: '2027:03:20 08:00:00' }))).toBe('2027-03-11T21:04')
    expect(exifTakenAt(jpeg({ original: '2027:03:11 21:04:33' }, { little: true }))).toBe('2027-03-11T21:04')
    expect(exifTakenAt(jpeg({ original: '2027:03:11 21:04:33' }, { jfif: true }))).toBe('2027-03-11T21:04')
  })

  it('falls back to when the file was last saved by the camera', () => {
    expect(exifTakenAt(jpeg({ plain: '2027:03:12 09:30:00' }))).toBe('2027-03-12T09:30')
  })

  it('is unknown without a usable date', () => {
    expect(exifTakenAt(jpeg({}))).toBeUndefined()
    expect(exifTakenAt(jpeg({ original: '0000:00:00 00:00:00' }))).toBeUndefined()
    expect(exifTakenAt(jpeg({ original: '2027:02:30 10:00:00' }))).toBeUndefined()
    expect(exifTakenAt(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeUndefined() // a PNG
    expect(exifTakenAt(jpeg({ original: '2027:03:11 21:04:33' }).slice(0, 60))).toBeUndefined() // cut short
    expect(exifTakenAt(new Uint8Array())).toBeUndefined()
  })
})
