import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { normaliseCode } from '../../src/domain/serverProtocol.ts'

export const newId = () => randomUUID()

/** Device tokens: 256 random bits, only ever stored hashed. */
export const newToken = () => randomBytes(32).toString('base64url')

export const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('hex')

// No 0/O, 1/I/L: codes get read out loud and typed on phones.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Human-friendly code like "K7QM-2XRP-9HTW" (~59 bits). */
export function newCode(groups = 3): string {
  const chars: string[] = []
  const limit = 256 - (256 % ALPHABET.length) // rejection sampling: no modulo bias
  while (chars.length < groups * 4) {
    for (const b of randomBytes(groups * 4)) if (b < limit && chars.length < groups * 4) chars.push(ALPHABET[b % ALPHABET.length])
  }
  return Array.from({ length: groups }, (_, i) => chars.slice(i * 4, i * 4 + 4).join('')).join('-')
}

export const hashCode = (code: string) => hashSecret(normaliseCode(code))

export function codesMatch(given: string, expected: string): boolean {
  return timingSafeEqual(Buffer.from(hashCode(given)), Buffer.from(hashCode(expected)))
}
