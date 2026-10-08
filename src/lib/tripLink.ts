import type { Tables } from '../db/types'
import { DataError } from '../domain/records'
import { decodeLink, encodeLink, type TripLink } from '../domain/sync'

/*
 * Trip link = app URL + "#/t/" + base64url(deflate-raw(JSON)). The trip travels in the fragment,
 * which browsers never send to the server: only the chat app it's sent through ever carries it.
 */

const ROUTE = '#/t/'
const MAX_DATA_CHARS = 300_000
const MAX_JSON_BYTES = 3_000_000

/** Above this, some chat apps cut links short: suggest sending a file instead. */
export const LONG_LINK_CHARS = 30_000

const currentAppUrl = () => (typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`)

async function compress(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/** Stops past `limit` bytes, so a crafted link can't inflate into something huge. */
async function decompress(bytes: Uint8Array, limit: number): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.length
    if (size > limit) {
      await reader.cancel()
      throw new Error('Trip data too large')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    out.set(c, offset)
    offset += c.length
  }
  return out
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

/** A link holding one trip (`tables` from readTables(tripId)), tombstones included. */
export async function tripLink(tables: Tables, sentBy?: string, appUrl = currentAppUrl()): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(encodeLink(tables, sentBy)))
  return appUrl + ROUTE + toBase64Url(await compress(json))
}

/**
 * Finds a trip link in pasted text (often the whole chat message) and returns its in-app route,
 * e.g. "/t/<data>". Undefined if there's none.
 */
export function tripRouteFrom(text: string): string | undefined {
  const match = /#\/t\/([A-Za-z0-9_-]+)/.exec(text)
  return match ? `/t/${match[1]}` : undefined
}

/** Decodes the `<data>` part of a trip link. Throws DataError with a message for people. */
export async function readTripLink(data: string): Promise<TripLink> {
  let raw: unknown
  try {
    if (data.length > MAX_DATA_CHARS) throw new Error('Trip data too large')
    raw = JSON.parse(new TextDecoder().decode(await decompress(fromBase64Url(data), MAX_JSON_BYTES)))
  } catch {
    throw new DataError('This link is incomplete. It may have been cut off when it was copied, so ask for it again.')
  }
  return decodeLink(raw)
}
