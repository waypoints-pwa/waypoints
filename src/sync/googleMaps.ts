import { getServerConfig } from '../db/serverState'
import { checkGoogleMapsAnswer } from '../domain/googleMaps'
import type { GoogleMapsAnswer, GoogleMapsRequest } from '../domain/serverProtocol'
import { m } from '../i18n'
import { api, SyncError } from './client'

/*
 * Reads a Google Maps link through the phone's sync server (phones can't: Google doesn't let web pages
 * read it). Every failure is an Error whose message is ready to show.
 */

export const GOOGLE_UNREACHABLE = m.reasons.googleUnreachable
export const GOOGLE_OLD_SERVER = m.reasons.googleOldServer
export const GOOGLE_UNREADABLE = m.reasons.googleUnreadable
export const GOOGLE_LIST_NOT_SHARED = "This list isn't shared, or doesn't exist."

export async function lookUpGoogleMaps(url: string): Promise<GoogleMapsAnswer> {
  const cfg = await getServerConfig()
  if (!cfg) throw new Error(GOOGLE_UNREACHABLE)
  let raw: unknown
  try {
    raw = await api<unknown>(cfg, '/api/google-maps', { url } satisfies GoogleMapsRequest)
  } catch (err) {
    if (err instanceof SyncError && err.status === 404 && (err.answer?.code === 'notFound' || err.message === 'Not found')) throw new Error(GOOGLE_OLD_SERVER)
    if (err instanceof SyncError && err.status === 422 && (err.answer?.code === 'listNotShared' || err.message === GOOGLE_LIST_NOT_SHARED)) throw new Error(m.reasons.googleListNotShared)
    if (err instanceof SyncError && (err.status === 422 || err.status === 502)) throw new Error(GOOGLE_UNREADABLE)
    // The server did answer: say why it turned the link away (or that this phone is no longer connected).
    if (err instanceof SyncError && err.status !== undefined && err.status >= 400 && err.status < 500) throw new Error(err.message)
    throw new Error(GOOGLE_UNREACHABLE)
  }
  const answer = checkGoogleMapsAnswer(raw)
  if (!answer) throw new Error(GOOGLE_UNREADABLE)
  return answer
}
