import { patchRecord, removeTripFromPhone } from '../db/actions'
import { db, nowISO } from '../db/db'
import { getServerConfig, setServerConfig, type ServerConfig } from '../db/serverState'
import { takeSnapshot } from '../db/snapshots'
import {
  normaliseCode,
  SERVER_APP,
  type Credentials,
  type DeviceSummary,
  type InviteResponse,
  type MeResponse,
  type MemberSummary,
  type RegisterRequest,
  type ServerHello,
} from '../domain/serverProtocol'
import { api, normaliseServerUrl, runSync, SyncError } from './client'

/*
 * This phone's place on a sync server. The admin joins with the server code (printed in the server's
 * log) and invites everyone else with one-time links. Each phone has its own token, so one phone can
 * be disconnected without affecting the others.
 */

async function checkServer(url: string) {
  const hello = await api<ServerHello>({ url }, '/api/server')
  if (hello.app !== SERVER_APP) throw new SyncError("That address isn't a waypoints server.")
}

/** First connection: a safety copy, then the first sync brings in this member's trips. */
async function connect(url: string, creds: Credentials) {
  await takeSnapshot('Before connecting to the sync server')
  const config: ServerConfig = { url, token: creds.token, deviceId: creds.deviceId, member: creds.member, members: [] }
  await setServerConfig(config)
  await runSync().catch(() => undefined) // failures are kept in the config and shown in Settings
}

async function register(urlInput: string, body: RegisterRequest) {
  const url = normaliseServerUrl(urlInput)
  await checkServer(url)
  await connect(url, await api<Credentials>({ url }, '/api/register', body))
}

/** With an invite (or a sign-in link) from the server's admin, or from yourself on another phone. */
export const joinWithInvite = (url: string, inviteCode: string, name: string, deviceLabel: string) =>
  register(url, { inviteCode, name: name.trim(), deviceLabel: deviceLabel.trim() })

/** The server's admin, with the server code: as someone new, or as someone already on it (a lost phone). */
export const joinWithServerCode = (url: string, serverCode: string, who: { name: string } | { memberId: string }, deviceLabel: string) =>
  register(url, { serverCode, ...('name' in who ? { name: who.name.trim() } : who), deviceLabel: deviceLabel.trim() })

/** Who's on the server, for the admin to sign in as one of them. */
export async function membersWithServerCode(urlInput: string, serverCode: string): Promise<MemberSummary[]> {
  const url = normaliseServerUrl(urlInput)
  await checkServer(url)
  return api<MemberSummary[]>({ url }, '/api/admin/members', { serverCode })
}

async function current(): Promise<ServerConfig> {
  const cfg = await getServerConfig()
  if (!cfg) throw new SyncError('Not connected to a server.')
  return cfg
}

const currentAppUrl = () => (typeof location === 'undefined' ? '' : `${location.origin}${location.pathname}`)

/** A link that opens the app's server page with the address and code filled in. */
export function inviteLink(serverUrl: string, code: string, signInAs?: string, appUrl = currentAppUrl()) {
  const params = new URLSearchParams({ server: serverUrl, invite: code })
  if (signInAs) params.set('as', signInAs)
  return `${appUrl}#/server?${params.toString()}`
}

/** Accepts a pasted invite link or a bare code. */
export function parseInvite(input: string): { code?: string; server?: string; as?: string } {
  const text = input.trim()
  if (text.includes('invite=')) {
    const params = new URLSearchParams(text.slice(text.indexOf('?') + 1))
    return { code: params.get('invite') ?? undefined, server: params.get('server') ?? undefined, as: params.get('as') ?? undefined }
  }
  return normaliseCode(text) ? { code: text } : {}
}

/** An invite for someone new (admins), or a sign-in link for another phone of `member`. */
export async function createInvite(member?: MemberSummary): Promise<InviteResponse & { link: string }> {
  const cfg = await current()
  const invite = await api<InviteResponse>(cfg, '/api/invites', member ? { memberId: member.id } : {})
  return { ...invite, link: inviteLink(cfg.url, invite.code, invite.memberName) }
}

export async function refreshMembers(): Promise<MemberSummary[]> {
  const cfg = await current()
  const members = await api<MemberSummary[]>(cfg, '/api/members')
  const latest = await getServerConfig()
  if (latest?.token === cfg.token) await setServerConfig({ ...latest, members })
  return members
}

export async function removeMember(memberId: string) {
  await api(await current(), '/api/members/remove', { memberId })
  await refreshMembers()
}

export async function listDevices(): Promise<DeviceSummary[]> {
  return api<DeviceSummary[]>(await current(), '/api/devices')
}

export async function removeDevice(deviceId: string) {
  await api(await current(), '/api/devices/remove', { deviceId })
}

/** Forgets the server on this phone. Its trips stay here, as phone-only trips; links keep working. */
export async function forgetServer() {
  await db.transaction('rw', db.settings, db.serverTrips, async () => {
    await setServerConfig(undefined)
    await db.serverTrips.clear()
  })
}

/** Disconnects this phone: its token stops working on the server, and its trips stay here. */
export async function disconnect() {
  const cfg = await current()
  await api(cfg, '/api/devices/remove', { deviceId: cfg.deviceId }).catch(() => undefined)
  await forgetServer()
}

/**
 * The server is now reached at another address (another port, Funnel, a new tailnet). Only the
 * address changes. The new one must answer for this same member, so a typo or an empty new server
 * can't take its place.
 */
export async function changeServerAddress(urlInput: string) {
  const cfg = await current()
  const url = normaliseServerUrl(urlInput)
  if (url === cfg.url) return
  let me: MeResponse
  try {
    me = await api<MeResponse>({ url, token: cfg.token }, '/api/me')
  } catch (err) {
    if (err instanceof SyncError && err.status === 401) throw new SyncError("You're not on the server at that address. Is it the same server?")
    throw err
  }
  if (me.app !== SERVER_APP || me.member.id !== cfg.member.id) throw new SyncError("You're not on the server at that address. Is it the same server?")
  const latest = await current()
  await setServerConfig({ ...latest, url, member: me.member, lastError: undefined, lastErrorStatus: undefined })
  await runSync().catch(() => undefined)
}

/**
 * Leaves a trip on the server: this phone's member is unlinked from its traveller (who stays, with
 * their expenses), and the trip is removed from this phone, keeping a safety copy. Needs the server.
 */
export async function leaveTrip(tripId: string) {
  const cfg = await current()
  await api<MeResponse>(cfg, '/api/me') // reachable?
  const trip = await db.trips.get(tripId)
  if (!trip) return
  const mine = (await db.travellers.where('tripId').equals(tripId).toArray()).filter((t) => !t.deletedAt && t.memberId === cfg.member.id)
  for (const traveller of mine) await patchRecord('travellers', traveller.id, { memberId: undefined, linkedAt: nowISO() })
  await runSync()
  if (await db.serverTrips.get(tripId)) throw new SyncError("Couldn't leave the trip on the server. Try again.")
  await removeTripFromPhone(trip)
}

export function defaultDeviceLabel() {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
  if (/iPad/.test(ua)) return 'iPad'
  if (/iPhone/.test(ua)) return 'iPhone'
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet'
  return /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows PC' : 'Phone'
}
