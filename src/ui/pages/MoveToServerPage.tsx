import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { moveTripToServer } from '../../db/actions'
import type { ServerConfig } from '../../db/serverState'
import { m } from '../../i18n'
import { EmptyState } from '../components/bits'
import { Field, FormError } from '../components/fields'
import { usable, useServer } from '../hooks'
import { tripPath, useTrip, type TripData } from '../tripData'

/** Puts a phone-only trip on the sync server, saying which traveller is which server member. */
export function MoveToServerPage() {
  const t = useTrip()
  const server = useServer()
  if (server === undefined) return null
  const connected = usable(server)
  if (t.server) {
    return (
      <EmptyState>
        <p>{m.server.tripIsOnServer(t.trip.name)}</p>
        <Link className="btn" to={tripPath(t.trip.id, 'trip')}>
          {m.server.backToTrip}
        </Link>
      </EmptyState>
    )
  }
  if (!connected) {
    return (
      <EmptyState>
        <p>{m.server.connectFirst}</p>
        <Link className="btn btn-primary" to="/server">
          {m.settings.syncServer}
        </Link>
      </EmptyState>
    )
  }
  return <MoveForm t={t} server={connected} />
}

/** Each traveller's member: you for "you", then anyone on the server with the same name. */
function guessLinks(t: TripData, server: ServerConfig): Record<string, string> {
  const links: Record<string, string> = {}
  const taken = new Set<string>()
  const link = (travellerId: string, memberId: string) => {
    links[travellerId] = memberId
    taken.add(memberId)
  }
  if (t.me) link(t.me.id, server.member.id)
  for (const traveller of t.travellers) {
    if (links[traveller.id]) continue
    const known = traveller.memberId && server.members.find((m) => m.id === traveller.memberId && !taken.has(m.id))
    const sameName = server.members.find((m) => !taken.has(m.id) && m.name.toLocaleLowerCase() === traveller.name.trim().toLocaleLowerCase())
    const match = known || sameName
    if (match) link(traveller.id, match.id)
  }
  return links
}

function MoveForm({ t, server }: { t: TripData; server: ServerConfig }) {
  const navigate = useNavigate()
  const [links, setLinks] = useState<Record<string, string | undefined>>(() => guessLinks(t, server))
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const members = server.members.some((m) => m.id === server.member.id) ? server.members : [server.member, ...server.members]
  const used = new Set(Object.values(links).filter(Boolean))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!used.has(server.member.id)) return setError(m.server.chooseWhichYouAre)
    setBusy(true)
    try {
      await moveTripToServer(t.trip.id, Object.fromEntries(t.travellers.map((x) => [x.id, links[x.id]])))
      navigate(tripPath(t.trip.id, 'trip'), { replace: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={(e) => void onSubmit(e)}>
      <h2>{m.server.putTripOnServer(t.trip.name)}</h2>
      <p className="muted">{m.server.moveIntro}</p>

      <div className="stack" role="group" aria-label={m.server.whosWho}>
        {t.travellers.map((traveller) => (
          <Field key={traveller.id} label={traveller.name + (traveller.id === t.me?.id ? m.trip.youParen : '')}>
            <select
              className="input"
              value={links[traveller.id] ?? ''}
              onChange={(e) => setLinks((current) => ({ ...current, [traveller.id]: e.target.value || undefined }))}
            >
              <option value="">{m.trip.notOnServerGetsLinks}</option>
              {members
                .filter((x) => x.id === links[traveller.id] || !used.has(x.id))
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    🌐 {x.name}
                    {x.id === server.member.id ? m.trip.youParen : ''}
                  </option>
                ))}
            </select>
          </Field>
        ))}
      </div>

      <p className="muted small">{m.server.moveNote}</p>
      {t.attachments.some((a) => !a.private) && (
        <p className="muted small">{m.server.moveFilesNote}</p>
      )}
      <FormError error={error} />
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => navigate(tripPath(t.trip.id, 'trip'))}>
          {m.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {m.trip.putOnServer}
        </button>
      </div>
    </form>
  )
}
