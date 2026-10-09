import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import {
  PROTOCOL_VERSION,
  SERVER_APP,
  type AdminMembersRequest,
  type Credentials,
  type DeviceSummary,
  type InviteRequest,
  type InviteResponse,
  type MeResponse,
  type MemberSummary,
  type RegisterRequest,
  type ServerHello,
} from '../../src/domain/serverProtocol.ts'
import type { Config } from './config.ts'
import { codesMatch, hashCode, hashSecret, newCode, newId, newToken } from './secrets.ts'
import type { Device, Member, Store } from './store.ts'
import { applySync, BadRequest, memberList, memberSummary, parseSyncRequest } from './sync.ts'

export const VERSION = '0.1.0'
const MAX_BODY = 10 * 1024 * 1024 // a first sync uploads whole trips
const INVITE_DAYS = 7
const MAX_CODE_FAILURES = 20 // per 10 minutes, across all clients
const LAST_SEEN_RESOLUTION_MS = 60 * 60_000

class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Request too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null'))
      } catch {
        reject(new HttpError(400, 'Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== 'string') return undefined
  const t = v.trim().slice(0, max)
  return t || undefined
}

interface Session {
  member: Member
  device: Device
}

type Handler = (req: IncomingMessage, session: Session) => Promise<unknown>
type PublicHandler = (req: IncomingMessage) => Promise<unknown>

export function createApp(config: Config, store: Store) {
  /** Brute-force brake for the server code and invite codes. */
  let codeFailures: number[] = []
  const guardCodes = () => {
    const now = Date.now()
    codeFailures = codeFailures.filter((t) => now - t < 10 * 60_000)
    if (codeFailures.length >= MAX_CODE_FAILURES) throw new HttpError(429, 'Too many wrong codes. Try again in a few minutes.')
  }
  const codeFailed = (message: string): never => {
    codeFailures.push(Date.now())
    throw new HttpError(403, message)
  }

  const authenticate = (req: IncomingMessage): Session => {
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? '')?.[1]
    if (token) {
      const hash = hashSecret(token)
      for (const member of Object.values(store.data.members)) {
        for (const device of Object.values(member.devices)) {
          if (device.tokenHash === hash) return { member, device }
        }
      }
    }
    throw new HttpError(401, 'This phone is not (or no longer) connected to this server')
  }

  const addDevice = (member: Member, label: string): Credentials => {
    const token = newToken()
    const device: Device = { id: newId(), label, tokenHash: hashSecret(token), createdAt: new Date().toISOString() }
    member.devices[device.id] = device
    return { token, deviceId: device.id, member: memberSummary(member) }
  }

  /** Names are how people pick each other for trips, so they're unique. */
  const checkNewName = (name: string | undefined, ifYou: string): string => {
    if (!name) throw new HttpError(400, 'Your name is needed')
    const taken = Object.values(store.data.members).some((m) => m.name.toLocaleLowerCase() === name.toLocaleLowerCase())
    if (taken) throw new HttpError(409, `There's already someone called ${name} on the server. If that's you, ${ifYou}.`)
    return name
  }

  const addMember = (name: string, admin: boolean): Member => {
    const member: Member = { id: newId(), name, admin, createdAt: new Date().toISOString(), devices: {} }
    store.data.members[member.id] = member
    return member
  }

  const hello = (): ServerHello => ({ app: SERVER_APP, version: VERSION, protocol: PROTOCOL_VERSION })

  const publicRoutes: Record<string, PublicHandler> = {
    'GET /api/health': async () => ({ ok: true }),
    'GET /api/server': async () => hello(),

    'POST /api/admin/members': async (req): Promise<MemberSummary[]> => {
      guardCodes()
      const b = (await readJson(req)) as Partial<AdminMembersRequest> | null
      if (typeof b?.serverCode !== 'string' || !codesMatch(b.serverCode, config.serverCode)) codeFailed('Wrong server code')
      return memberList(store.data.members)
    },

    'POST /api/register': async (req): Promise<Credentials> => {
      guardCodes()
      const b = (await readJson(req)) as Partial<RegisterRequest> | null
      const label = str(b?.deviceLabel, 60) ?? 'Phone'
      const name = str(b?.name, 60)

      if (typeof b?.serverCode === 'string') {
        if (!codesMatch(b.serverCode, config.serverCode)) codeFailed('Wrong server code')
        let member: Member | undefined
        if (b.memberId !== undefined) {
          member = typeof b.memberId === 'string' ? store.data.members[b.memberId] : undefined
          if (!member) throw new HttpError(404, "That person isn't on the server any more")
        } else {
          member = addMember(checkNewName(name, 'choose your name from the list instead'), true)
        }
        const creds = addDevice(member, label)
        await store.save()
        return creds
      }

      if (typeof b?.inviteCode !== 'string') throw new HttpError(400, 'An invite code or the server code is needed')
      const hash = hashCode(b.inviteCode)
      const invite = store.data.invites[hash]
      if (!invite) return codeFailed('That invite is not valid. Ask for a new one.')
      // Checked before using up the invite.
      const newName = invite.memberId ? undefined : checkNewName(name, 'ask the admin for a sign-in link instead')
      delete store.data.invites[hash] // single use, even if expired
      if (Date.parse(invite.expiresAt) < Date.now()) {
        await store.save()
        throw new HttpError(403, 'That invite has expired. Ask for a new one.')
      }
      let member: Member | undefined
      if (invite.memberId) {
        member = store.data.members[invite.memberId]
        if (!member) {
          await store.save()
          throw new HttpError(404, "The person that code was for isn't on the server any more")
        }
      } else {
        member = addMember(newName!, false)
      }
      const creds = addDevice(member, label)
      await store.save()
      return creds
    },
  }

  const routes: Record<string, Handler> = {
    'GET /api/me': async (_req, { member, device }): Promise<MeResponse> => ({ ...hello(), member: memberSummary(member), deviceId: device.id }),

    'GET /api/members': async () => memberList(store.data.members),

    'POST /api/sync': async (req, { member }) => {
      const { response, changed } = applySync(store.data, member, parseSyncRequest(await readJson(req)))
      if (changed) await store.save()
      return response
    },

    'POST /api/invites': async (req, { member }): Promise<InviteResponse> => {
      const b = (await readJson(req)) as Partial<InviteRequest> | null
      const forId = b?.memberId
      let forMember: Member | undefined
      if (forId === undefined || forId === null) {
        if (!member.admin) throw new HttpError(403, "Only the server's admin can invite new people")
      } else {
        forMember = typeof forId === 'string' ? store.data.members[forId] : undefined
        if (!forMember) throw new HttpError(404, "That person isn't on the server")
        if (forMember.id !== member.id && !member.admin) throw new HttpError(403, "Only the server's admin can sign in someone else's phone")
      }
      const now = new Date()
      // Drop expired invites while we're here.
      for (const [h, inv] of Object.entries(store.data.invites)) if (Date.parse(inv.expiresAt) < now.getTime()) delete store.data.invites[h]
      const code = newCode()
      const expiresAt = new Date(now.getTime() + INVITE_DAYS * 86_400_000).toISOString()
      store.data.invites[hashCode(code)] = { codeHash: hashCode(code), createdAt: now.toISOString(), expiresAt, createdBy: member.id, memberId: forMember?.id }
      await store.save()
      return { code, expiresAt, memberName: forMember?.name }
    },

    'GET /api/devices': async (_req, { member, device }): Promise<DeviceSummary[]> =>
      Object.values(member.devices)
        .map((d) => ({ id: d.id, label: d.label, createdAt: d.createdAt, lastSeenAt: d.lastSeenAt, current: d.id === device.id }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),

    /** Disconnect one of your phones (this one, to leave; another one, if it's lost). */
    'POST /api/devices/remove': async (req, { member }) => {
      const b = (await readJson(req)) as { deviceId?: unknown } | null
      if (typeof b?.deviceId !== 'string' || !member.devices[b.deviceId]) throw new HttpError(404, 'No such phone')
      delete member.devices[b.deviceId]
      await store.save()
      return { ok: true }
    },

    /** Admins: take someone off the server. Their phones stop syncing; their trips keep their travellers. */
    'POST /api/members/remove': async (req, { member }) => {
      if (!member.admin) throw new HttpError(403, "Only the server's admin can remove people")
      const b = (await readJson(req)) as { memberId?: unknown } | null
      if (typeof b?.memberId !== 'string' || !store.data.members[b.memberId]) throw new HttpError(404, "That person isn't on the server")
      if (b.memberId === member.id) throw new HttpError(400, "You can't remove yourself")
      delete store.data.members[b.memberId]
      for (const [h, inv] of Object.entries(store.data.invites)) if (inv.memberId === b.memberId) delete store.data.invites[h]
      await store.save()
      return { ok: true }
    },
  }

  const cors = (req: IncomingMessage, res: ServerResponse) => {
    const origin = req.headers.origin
    if (config.allowedOrigins === '*') res.setHeader('Access-Control-Allow-Origin', '*')
    else if (origin && config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
    }
  }

  return createServer(async (req, res) => {
    cors(req, res)
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
      res.setHeader('Access-Control-Max-Age', '86400')
      // Chrome's Private/Local Network Access preflight (public site → tailnet/LAN address).
      if (req.headers['access-control-request-private-network']) res.setHeader('Access-Control-Allow-Private-Network', 'true')
      res.writeHead(204).end()
      return
    }

    const url = new URL(req.url ?? '/', 'http://x')
    if (req.method === 'GET' && url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('waypoints sync server is running. Connect from the waypoints app: Settings → Sync server.\n')
      return
    }

    const route = `${req.method} ${url.pathname}`
    try {
      let result: unknown
      if (publicRoutes[route]) {
        result = await publicRoutes[route](req)
      } else if (routes[route]) {
        const session = authenticate(req)
        const seen = Date.parse(session.device.lastSeenAt ?? '') || 0
        if (Date.now() - seen > LAST_SEEN_RESOLUTION_MS) {
          session.device.lastSeenAt = new Date().toISOString()
          void store.save()
        }
        result = await routes[route](req, session)
      } else {
        throw new HttpError(404, 'Not found')
      }
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(result))
    } catch (err) {
      const status = err instanceof HttpError ? err.status : err instanceof BadRequest ? 400 : 500
      if (status === 500) console.error(err)
      const message = status === 500 ? 'Internal error' : (err as Error).message
      if (!res.headersSent) res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: message }))
    }
  })
}
