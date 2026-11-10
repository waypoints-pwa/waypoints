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
import { m } from '../../i18n'
import { fmtAgo } from '../format'
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
      <BackLink to="/settings">{m.common.settings}</BackLink>
      <h2>{m.settings.syncServer}</h2>
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
        setWho(list.find((x) => x.name.toLocaleLowerCase() === typedName.trim().toLocaleLowerCase())?.id ?? 'new')
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
      <p className="muted">{m.server.connectIntro}</p>
      <div className="segmented" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'invite'} className={mode === 'invite' ? 'active' : ''} onClick={() => setMode('invite')}>
          {m.server.haveInvite}
        </button>
        <button type="button" role="tab" aria-selected={mode === 'admin'} className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}>
          {m.server.runServer}
        </button>
      </div>

      {mode === 'invite' && (
        <Field label={m.server.inviteLabel} hint={m.server.inviteHint}>
          <input
            className="input"
            required
            value={invite}
            onChange={(e) => onInviteInput(e.target.value)}
            placeholder={m.server.invitePlaceholder}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        </Field>
      )}

      <Field label={m.server.serverAddress}>
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
        <Field label={m.server.serverCode} hint={m.server.serverCodeHint}>
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
        <div className="field" role="radiogroup" aria-label={m.server.whoAreYou}>
          <span>{m.server.whoAreYou}</span>
          <div className="chips">
            {members.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={who === x.id} className="toggle-chip" onClick={() => setWho(x.id)}>
                {x.name}
              </button>
            ))}
            <button type="button" role="radio" aria-checked={who === 'new'} className="toggle-chip" onClick={() => setWho('new')}>
              {m.server.someoneNew}
            </button>
          </div>
          <small className="muted">{m.server.alreadyOnServer}</small>
        </div>
      )}

      {mode === 'invite' && signInAs && <Notice kind="info">{m.server.signsYouIn(signInAs)}</Notice>}

      {needsName && (
        <Field label={m.trip.yourName} hint={m.server.yourNameHint}>
          <input className="input" required maxLength={60} value={typedName} onChange={(e) => setName(e.target.value)} />
        </Field>
      )}

      {(mode === 'invite' || members) && (
        <Field label={m.server.phoneName} hint={m.server.phoneNameHint}>
          <input className="input" required maxLength={60} value={deviceLabel} onChange={(e) => setDeviceLabel(e.target.value)} />
        </Field>
      )}

      {error && <Notice kind="error">{error}</Notice>}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? m.server.connecting : mode === 'admin' && !members ? m.server.continue : signInAs && mode === 'invite' ? m.server.signInAs(signInAs) : m.server.connect}
      </button>
      <p className="muted small">{m.server.safetyCopyNote}</p>
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
        <Notice kind="warn">{m.server.disconnectedFrom(host, waiting)}</Notice>
        <button className="btn" disabled={action.busy} onClick={() => void action.run(forgetServer)}>
          {m.server.forgetServer}
        </button>
      </section>
    )
  }

  const onDisconnect = () => {
    if (confirm(m.server.disconnectConfirm(server.member.admin))) void action.run(disconnect)
  }

  return (
    <>
      {params.get('invite') && (
        <Notice kind="info">{m.server.alreadyConnected(server.member.name)}</Notice>
      )}
      <section className="card">
        <h3>
          👤 {server.member.name} {server.member.admin && <span className="chip">{m.server.adminChip}</span>}
        </h3>
        <p className="muted small">{m.server.onHost(host, trips)}</p>
        <ServerStatus waiting={waiting} />
      </section>
      <People server={server} />
      <Phones server={server} />
      <Address url={server.url} />
      <section className="card">
        <h3>{m.server.disconnectThisPhone}</h3>
        <p className="muted small">{m.server.stopsSyncing}</p>
        {action.error && <Notice kind="error">{action.error}</Notice>}
        <button className="btn btn-danger" disabled={action.busy} onClick={onDisconnect}>
          {m.server.disconnect}
        </button>
      </section>
    </>
  )
}

type Invite = InviteResponse & { link: string }

function InviteBox({ invite, onDone }: { invite: Invite; onDone: () => void }) {
  const [shared, setShared] = useState<'shared' | 'copied'>()
  const text = m.server.inviteShareText(invite.memberName)
  return (
    <div className="invite">
      <p className="small">
        {m.server.inviteIntro(invite.memberName)} {m.server.worksOnceUntil(new Date(invite.expiresAt).toLocaleDateString())}
      </p>
      <code className="invite-code">{invite.code}</code>
      <div className="row">
        <button className="btn btn-small btn-primary" onClick={() => void shareUrl(invite.link, m.server.shareTitle, text).then((r) => r && setShared(r))}>
          {shared === 'copied' ? m.common.linkCopied : shared === 'shared' ? m.common.shared : m.server.shareTheLink}
        </button>
        <button className="btn btn-small btn-ghost" onClick={onDone}>
          {m.common.done}
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

  const onRemove = (member: MemberSummary) => {
    if (confirm(m.server.removeFromServerConfirm(member.name))) void action.run(() => removeMember(member.id))
  }

  return (
    <section className="card">
      <h3>{m.server.peopleOnServer}</h3>
      <p className="muted small">{m.server.peopleText(admin)}</p>
      <ul className="history">
        {server.members.map((x) => (
          <li key={x.id}>
            <span>
              {x.name} {x.id === server.member.id && <span className="chip">{m.trip.you}</span>} {x.admin && <span className="chip chip-past">{m.server.adminChip}</span>}
            </span>
            {admin && x.id !== server.member.id && (
              <span className="row nowrap">
                <button className="btn btn-small btn-ghost" disabled={action.busy} onClick={() => void action.run(async () => setInvite(await createInvite(x)))}>
                  {m.server.signInLink}
                </button>
                <button className="btn btn-small btn-ghost" disabled={action.busy} onClick={() => onRemove(x)}>
                  {m.trip.remove}
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
      {admin && !invite && (
        <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={action.busy} onClick={() => void action.run(async () => setInvite(await createInvite()))}>
          {m.server.inviteSomeone}
        </button>
      )}
      {invite && <InviteBox invite={invite} onDone={() => setInvite(undefined)} />}
      {admin && (
        <p className="muted small">{m.server.lostPhone}</p>
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
    if (!confirm(m.server.disconnectPhoneConfirm(d.label))) return
    void action.run(async () => {
      await removeDevice(d.id)
      setDevices(await listDevices())
    })
  }

  return (
    <section className="card">
      <h3>{m.server.yourPhones}</h3>
      <p className="muted small">{m.server.yourPhonesText}</p>
      {!invite && (
        <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} disabled={action.busy} onClick={() => void action.run(async () => setInvite(await createInvite(server.member)))}>
          {m.server.addAnotherPhone}
        </button>
      )}
      {invite && <InviteBox invite={invite} onDone={() => setInvite(undefined)} />}
      <details onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && !devices && void load()}>
        <summary className="muted small">{m.server.connectedPhones}</summary>
        {devices && (
          <ul className="history">
            {devices.map((d) => (
              <li key={d.id}>
                <span>
                  {d.label} {d.current && <span className="chip">{m.server.thisPhoneChip}</span>}
                  <br />
                  <span className="muted small">{d.lastSeenAt ? m.server.active(fmtAgo(d.lastSeenAt)) : m.server.added(fmtAgo(d.createdAt))}</span>
                </span>
                {!d.current && (
                  <button className="btn btn-small btn-ghost" disabled={action.busy} onClick={() => onRemove(d)}>
                    {m.server.disconnect}
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
      <h3>{m.server.serverAddress}</h3>
      <p className="small">
        <code>{url}</code>
      </p>
      {editing ? (
        <form className="stack" onSubmit={onSubmit}>
          <p className="muted small">{m.server.changeAddressText}</p>
          <input className="input" type="url" inputMode="url" required value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" aria-label={m.server.newServerAddress} />
          {action.error && <Notice kind="error">{action.error}</Notice>}
          <div className="row">
            <button className="btn btn-small btn-primary" disabled={action.busy}>
              {action.busy ? m.server.checking : m.server.saveAddress}
            </button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing(false)}>
              {m.common.cancel}
            </button>
          </div>
        </form>
      ) : (
        <button className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => setEditing(true)}>
          {m.server.changeAddress}
        </button>
      )}
    </section>
  )
}
