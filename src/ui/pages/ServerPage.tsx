import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { db, setSetting, SETTINGS } from '../../db/db'
import type { ServerConfig } from '../../db/serverState'
import type { DeviceSummary, InviteResponse, MemberSummary } from '../../domain/serverProtocol'
import { inIosBrowser } from '../../lib/platform'
import { shareUrl } from '../../lib/shareSheet'
import {
  changeServerAddress,
  createInvite,
  defaultDeviceLabel,
  disconnect,
  forgetServer,
  joinWithInvite,
  joinWithServerCode,
  listDevices,
  membersWithServerCode,
  parseInvite,
  refreshMembers,
  removeDevice,
  removeMember,
} from '../../sync/account'
import { BackLink, Notice } from '../components/bits'
import { Field } from '../components/fields'
import { HandOff } from '../components/HandOff'
import { ServerStatus } from '../components/ServerStatus'
import { fmtAgo, plural } from '../format'
import { useServer, useSetting } from '../hooks'

/** Runs an async action with a busy flag, keeping its error message for people. */
function useAction() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

export function ServerPage() {
  const server = useServer()
  if (server === undefined) return null
  return (
    <>
      <BackLink to="/settings">Settings</BackLink>
      <h2>Sync server</h2>
      {server ? <Connected server={server} /> : <Connect />}
    </>
  )
}

function Connect() {
  const [params] = useSearchParams()
  const fromLink = params.get('invite') ?? ''
  const [handOff, setHandOff] = useState(() => Boolean(fromLink) && inIosBrowser())
  const [mode, setMode] = useState<'invite' | 'admin'>('invite')
  const [address, setAddress] = useState(params.get('server') ?? '')
  const [invite, setInvite] = useState(fromLink)
  const [signInAs, setSignInAs] = useState(params.get('as') ?? undefined)
  const [serverCode, setServerCode] = useState('')
  const [members, setMembers] = useState<MemberSummary[]>()
  const [who, setWho] = useState('new')
  const myName = useSetting<string>(SETTINGS.myName)
  const [name, setName] = useState<string>()
  const [deviceLabel, setDeviceLabel] = useState(defaultDeviceLabel)
  const { busy, error, run } = useAction()
  const typedName = name ?? myName?.value ?? ''

  if (handOff) return <HandOff onStayHere={() => setHandOff(false)} />

  const onInviteInput = (text: string) => {
    const parsed = parseInvite(text)
    if (parsed.server) setAddress(parsed.server)
    setInvite(parsed.server ? (parsed.code ?? '') : text)
    setSignInAs(parsed.as)
  }

  const rememberName = async (used: string) => {
    if (!myName?.value && used.trim()) await setSetting(SETTINGS.myName, used.trim())
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'invite') {
      void run(async () => {
        await joinWithInvite(address, parseInvite(invite).code ?? invite, signInAs ? '' : typedName, deviceLabel)
        if (!signInAs) await rememberName(typedName)
      })
    } else if (!members) {
      void run(async () => {
        const list = await membersWithServerCode(address, serverCode)
        setMembers(list)
        setWho(list.find((m) => m.name.toLocaleLowerCase() === typedName.trim().toLocaleLowerCase())?.id ?? 'new')
      })
    } else {
      void run(async () => {
        await joinWithServerCode(address, serverCode, who === 'new' ? { name: typedName } : { memberId: who }, deviceLabel)
        if (who === 'new') await rememberName(typedName)
      })
    }
  }

  const needsName = mode === 'invite' ? !signInAs : members !== undefined && who === 'new'

  return (
    <form className="stack" onSubmit={onSubmit}>
      <p className="muted">
        Optional. With a waypoints sync server (on a home NAS, for example), the trips you put on it reach the others on it by
        themselves: no more sending a link after every change. Your trips stay on this phone and work offline either way, and links
        keep working, also for people who aren't on the server.
      </p>
      <div className="segmented" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'invite'} className={mode === 'invite' ? 'active' : ''} onClick={() => setMode('invite')}>
          I have an invite
        </button>
        <button type="button" role="tab" aria-selected={mode === 'admin'} className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>
          I run the server
        </button>
      </div>

      {mode === 'invite' && (
        <Field label="Invite link or code" hint="From the server's admin. Pasting the whole link fills in the rest.">
          <input
            className="input"
            required
            value={invite}
            onChange={(e) => onInviteInput(e.target.value)}
            placeholder="A link, or a code like K7QM-2XRP-9HTW"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </Field>
      )}

      <Field label="Server address">
        <input
          className="input"
          type="url"
          inputMode="url"
          required
          placeholder="https://my-server.example.ts.net:13443"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value)
            setMembers(undefined)
          }}
          autoComplete="off"
        />
      </Field>

      {mode === 'admin' && (
        <Field label="Server code" hint="Printed in the server's log when it starts. Keep it to yourself: whoever has it is an admin.">
          <input
            className="input"
            required
            value={serverCode}
            onChange={(e) => {
              setServerCode(e.target.value)
              setMembers(undefined)
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </Field>
      )}

      {mode === 'admin' && members && members.length > 0 && (
        <div className="field" role="radiogroup" aria-label="Who are you?">
          <span>Who are you?</span>
          <div className="chips">
            {members.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={who === m.id} className="toggle-chip" onClick={() => setWho(m.id)}>
                {m.name}
              </button>
            ))}
            <button type="button" role="radio" aria-checked={who === 'new'} className="toggle-chip" onClick={() => setWho('new')}>
              Someone new
            </button>
          </div>
          <small className="muted">Already on the server, on a lost or new phone? Pick yourself to sign this phone in as you.</small>
        </div>
      )}

      {mode === 'invite' && signInAs && <Notice kind="info">This link signs this phone in as {signInAs}.</Notice>}

      {needsName && (
        <Field label="Your name" hint="How the others on the server see you, when they add you to a trip.">
          <input className="input" required maxLength={60} value={typedName} onChange={(e) => setName(e.target.value)} />
        </Field>
      )}

      {(mode === 'invite' || members) && (
        <Field label="This phone's name" hint="Shown in your list of phones on the server.">
          <input className="input" required maxLength={60} value={deviceLabel} onChange={(e) => setDeviceLabel(e.target.value)} />
        </Field>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Connecting…' : mode === 'admin' && !members ? 'Continue' : signInAs && mode === 'invite' ? `Sign in as ${signInAs}` : 'Connect'}
      </button>
      <p className="muted small">
        A safety copy of your trips is kept first (Settings → Backup). Trips already on this phone stay only on it until you put them on
        the server.
      </p>
    </form>
  )
}

function Connected({ server }: { server: ServerConfig }) {
  const [params] = useSearchParams()
  const waiting =
    useLiveQuery(async () => {
      const trips = await db.serverTrips.toCollection().primaryKeys()
      return trips.length ? db.outbox.where('tripId').anyOf(trips).count() : 0
    }, []) ?? 0
  const trips = useLiveQuery(() => db.serverTrips.count(), []) ?? 0
  const action = useAction()
  const host = new URL(server.url).host

  if (server.lastErrorStatus === 401) {
    return (
      <section className="card">
        <Notice kind="warn">
          This phone was disconnected from the server at {host}: it was removed from your phones, or you were removed from the server.
          Your trips are still here{waiting > 0 ? `, with ${plural(waiting, 'change')} that never reached the server` : ''}. Links keep
          working.
        </Notice>
        <button className="btn" disabled={action.busy} onClick={() => void action.run(forgetServer)}>
          Forget this server
        </button>
      </section>
    )
  }

  const onDisconnect = () => {
    const again = server.member.admin ? 'the server code' : 'a sign-in link from the admin, or from another of your phones'
    const msg = `Disconnect this phone from the server? Its trips stay here, as phone-only trips, and links keep working. To connect again, you'll need ${again}.`
    if (confirm(msg)) void action.run(disconnect)
  }

  return (
    <>
      {params.get('invite') && (
        <Notice kind="info">This phone is already connected to a server, as {server.member.name}. To use that invite, disconnect first.</Notice>
      )}
      <section className="card">
        <h3>
          👤 {server.member.name} {server.member.admin && <span className="chip">admin</span>}
        </h3>
        <p className="muted small">
          On {host} · {plural(trips, 'trip')} on the server
        </p>
        <ServerStatus waiting={waiting} />
      </section>
      <People server={server} />
      <Phones server={server} />
      <Address url={server.url} />
      <section className="card">
        <h3>Disconnect this phone</h3>
        <p className="muted small">Stops syncing on this phone. Its trips stay here, and the others keep theirs.</p>
        {action.error && <Notice kind="error">{action.error}</Notice>}
        <button className="btn btn-danger" disabled={action.busy} onClick={onDisconnect}>
          Disconnect
        </button>
      </section>
    </>
  )
}

type Invite = InviteResponse & { link: string }

function InviteBox({ invite, onDone }: { invite: Invite; onDone: () => void }) {
  const [shared, setShared] = useState<'shared' | 'copied'>()
  const text = invite.memberName
    ? `Sign in to the waypoints sync server as ${invite.memberName} with this link:`
    : 'Join my waypoints sync server with this link:'
  return (
    <div className="invite">
      <p className="small">
        {invite.memberName
          ? `A sign-in link for a phone of ${invite.memberName}. Open it on that phone.`
          : 'An invite for someone new: it asks for their name.'}{' '}
        It works once, until {new Date(invite.expiresAt).toLocaleDateString()}.
      </p>
      <code className="invite-code">{invite.code}</code>
      <div className="row">
        <button className="btn btn-small btn-primary" onClick={() => void shareUrl(invite.link, 'waypoints sync server', text).then((r) => r && setShared(r))}>
          {shared === 'copied' ? '✓ Link copied' : shared === 'shared' ? '✓ Shared' : '🔗 Share the link'}
        </button>
        <button className="btn btn-small btn-ghost" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}

function People({ server }: { server: ServerConfig }) {
  const [invite, setInvite] = useState<Invite>()
  const action = useAction()
  const admin = server.member.admin

  useEffect(() => {
    refreshMembers().catch(() => undefined)
  }, [])

  const onRemove = (m: MemberSummary) => {
    const msg = `Remove ${m.name} from the server? All their phones stop syncing right away. Their trips stay on their phones, and they stay in the trips' expenses.`
    if (confirm(msg)) void action.run(() => removeMember(m.id))
  }

  return (
    <section className="card">
      <h3>People on the server</h3>
      <p className="muted small">
        A trip on the server is seen only by the people on it. {admin ? 'As the admin, you invite new people.' : 'New people are invited by the admin.'}
      </p>
      <ul className="history">
        {server.members.map((m) => (
          <li key={m.id}>
            <span>
              {m.name} {m.id === server.member.id && <span className="chip">you</span>} {m.admin && <span className="chip chip-past">admin</span>}
            </span>
            {admin && m.id !== server.member.id && (
              <span className="row nowrap">
                <button className="btn btn-small btn-ghost" disabled={action.busy} onClick={() => void action.run(async () => setInvite(await createInvite(m)))}>
                  Sign-in link
                </button>
                <button className="btn btn-small btn-ghost" disabled={action.busy} onClick={() => onRemove(m)}>
                  Remove
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {admin && !invite && (
        <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={action.busy} onClick={() => void action.run(async () => setInvite(await createInvite()))}>
          + Invite someone
        </button>
      )}
      {invite && <InviteBox invite={invite} onDone={() => setInvite(undefined)} />}
      {admin && (
        <p className="muted small">Lost a phone? A sign-in link puts a new phone back in as the same person, with all their trips.</p>
      )}
      {action.error && <Notice kind="error">{action.error}</Notice>}
    </section>
  )
}

function Phones({ server }: { server: ServerConfig }) {
  const [devices, setDevices] = useState<DeviceSummary[]>()
  const [invite, setInvite] = useState<Invite>()
  const action = useAction()
  const load = () => action.run(async () => setDevices(await listDevices()))

  const onRemove = (d: DeviceSummary) => {
    if (!confirm(`Disconnect “${d.label}”? It stops syncing right away. Its trips stay on it.`)) return
    void action.run(async () => {
      await removeDevice(d.id)
      setDevices(await listDevices())
    })
  }

  return (
    <section className="card">
      <h3>Your phones</h3>
      <p className="muted small">Use the server on another phone or tablet too: a sign-in link connects it as you.</p>
      {!invite && (
        <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={action.busy} onClick={() => void action.run(async () => setInvite(await createInvite(server.member)))}>
          + Add another phone
        </button>
      )}
      {invite && <InviteBox invite={invite} onDone={() => setInvite(undefined)} />}
      <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && !devices && void load()}>
        <summary className="muted small">Connected phones</summary>
        {devices && (
          <ul className="history">
            {devices.map((d) => (
              <li key={d.id}>
                <span>
                  {d.label} {d.current && <span className="chip">this phone</span>}
                  <br />
                  <span className="muted small">{d.lastSeenAt ? `Active ${fmtAgo(d.lastSeenAt)}` : `Added ${fmtAgo(d.createdAt)}`}</span>
                </span>
                {!d.current && (
                  <button className="btn btn-small btn-ghost" disabled={action.busy} onClick={() => onRemove(d)}>
                    Disconnect
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </details>
      {action.error && <Notice kind="error">{action.error}</Notice>}
    </section>
  )
}

function Address({ url }: { url: string }) {
  const [editing, setEditing] = useState(false)
  const [address, setAddress] = useState(url)
  const action = useAction()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void action.run(async () => {
      await changeServerAddress(address)
      setEditing(false)
    })
  }

  return (
    <section className="card">
      <h3>Server address</h3>
      <p className="small">
        <code>{url}</code>
      </p>
      {editing ? (
        <form className="stack" onSubmit={onSubmit}>
          <p className="muted small">
            If the server is now reached at a new address, enter it here. Nothing else changes. Each phone needs the new address.
          </p>
          <input className="input" type="url" inputMode="url" required value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" aria-label="New server address" />
          {action.error && <Notice kind="error">{action.error}</Notice>}
          <div className="row">
            <button className="btn btn-small btn-primary" disabled={action.busy}>
              {action.busy ? 'Checking…' : 'Save address'}
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => setEditing(true)}>
          Change address
        </button>
      )}
    </section>
  )
}
